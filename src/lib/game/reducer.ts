import {
  canonicalSort,
  isCanonicalEvent,
  isRoomCode,
  type CanonicalEvent,
  type LayoutKind,
  type ReplayProjection,
  type RoomMode
} from './protocol';
import { createSetup } from './setup';
import { createRandom, rollDice } from './random';
import { gridDistance, requiredAssistantAction, type AssistantAction } from './movement';
import {
  buyWheelbarrowExtension,
  collectPostOffice,
  isPlaceActionChoice,
  recallAssistants,
  resolveBlackMarket,
  resolveTeaHouse,
  sellAtMarket,
  tradeAtCaravansary,
  warehouseGood
} from './actions';
import { catchFamily, drawBonus, isEncounterChoice, relocateEncounter } from './encounters';
import type { Good } from './manifests';
import { adjustMosqueDice, buyWarehouseExtra, isMosqueAbilityChoice, ownsMosqueAbility, recallWithYellow, takeMosqueTile } from './mosques';
import { buyGemstoneRuby, buySultanRuby } from './ruby-routes';
import { activateBonus, bonusEffect, discardPlayedBonus, isBonusChoice } from './bonus';
import { finishFinalBonusSeat, markEndTrigger } from './endgame';

const emptyProjection = (): ReplayProjection => ({
  room: null,
  game: null,
  acceptedEventIds: [],
  diagnostics: []
});

function stringField(payload: Record<string, unknown>, field: string): string | null {
  const value = payload[field];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function reject(state: ReplayProjection, event: CanonicalEvent, reason: string) {
  state.diagnostics.push({ eventId: event.id, reason });
}

export function replayEvents(events: unknown[]): ReplayProjection {
  const state = emptyProjection();
  const seen = new Set<string>();
  const validEvents: CanonicalEvent[] = [];

  for (const value of events) {
    if (!isCanonicalEvent(value)) {
      const eventId = value && typeof value === 'object' && 'id' in value
        ? String(value.id)
        : 'malformed';
      state.diagnostics.push({ eventId, reason: 'invalid-envelope' });
    } else {
      validEvents.push(value);
    }
  }

  for (const event of canonicalSort(validEvents)) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    const accepted = applyEvent(state, event);
    if (accepted) state.acceptedEventIds.push(event.id);
  }

  return state;
}

function applyEvent(state: ReplayProjection, event: CanonicalEvent): boolean {
  if (event.type === 'game/created') {
    if (state.room) {
      reject(state, event, 'room-already-created');
      return false;
    }
    const roomCode = stringField(event.payload, 'roomCode');
    const hostName = stringField(event.payload, 'hostName');
    const tabletopOwned = event.payload.tabletopOwned === true;
    const maxPlayers = event.payload.maxPlayers;
    const layout = event.payload.layout;
    const mode = event.payload.mode;
    if (
      !roomCode || !isRoomCode(roomCode) || (!tabletopOwned && !hostName) ||
      typeof maxPlayers !== 'number' || maxPlayers < 2 || maxPlayers > 5 ||
      !isLayout(layout) || !isMode(mode) || (tabletopOwned && mode !== 'shared-table')
    ) {
      reject(state, event, 'invalid-room-creation');
      return false;
    }
    state.room = {
      roomCode,
      hostUid: event.actorUid,
      tabletopOwned,
      status: 'lobby',
      seats: tabletopOwned ? [] : [{ uid: event.actorUid, name: hostName!, ready: false }],
      maxPlayers,
      layout,
      mode
    };
    return true;
  }

  if (!state.room) {
    reject(state, event, 'room-not-created');
    return false;
  }

  if (event.type === 'player/joined') {
    const name = stringField(event.payload, 'name');
    if (state.room.status !== 'lobby' || !name || name.length > 24) {
      reject(state, event, 'invalid-player-name');
      return false;
    }
    if (state.room.seats.some((seat) => seat.uid === event.actorUid)) {
      reject(state, event, 'player-already-seated');
      return false;
    }
    if (state.room.seats.length >= state.room.maxPlayers) {
      reject(state, event, 'room-full');
      return false;
    }
    state.room.seats.push({ uid: event.actorUid, name, ready: false });
    return true;
  }

  if (event.type === 'game/configured') {
    if (state.room.status !== 'lobby' || event.actorUid !== state.room.hostUid) {
      reject(state, event, 'host-only');
      return false;
    }
    const maxPlayers = event.payload.maxPlayers;
    const layout = event.payload.layout;
    const mode = event.payload.mode;
    if (
      typeof maxPlayers !== 'number' || maxPlayers < state.room.seats.length || maxPlayers > 5 ||
      !isLayout(layout) || !isMode(mode)
    ) {
      reject(state, event, 'invalid-configuration');
      return false;
    }
    state.room.maxPlayers = maxPlayers;
    state.room.layout = layout;
    state.room.mode = mode;
    state.room.seats = state.room.seats.map((seat) => ({ ...seat, ready: false }));
    return true;
  }

  if (event.type === 'player/ready') {
    const seat = state.room.seats.find((candidate) => candidate.uid === event.actorUid);
    if (state.room.status !== 'lobby' || !seat || typeof event.payload.ready !== 'boolean') {
      reject(state, event, 'invalid-readiness');
      return false;
    }
    seat.ready = event.payload.ready;
    return true;
  }

  if (event.type === 'game/started') {
    const seed = stringField(event.payload, 'seed');
    if (
      state.room.status !== 'lobby' ||
      event.actorUid !== state.room.hostUid ||
      state.room.seats.length < 2 ||
      !state.room.seats.every(({ ready }) => ready) ||
      !seed || seed.length > 96
    ) {
      reject(state, event, 'invalid-game-start');
      return false;
    }
    state.game = createSetup(state.room, seed);
    state.room.status = 'playing';
    return true;
  }

  if (!state.game || state.room.status !== 'playing') {
    reject(state, event, 'game-not-playing');
    return false;
  }

  if (event.type === 'game/rematched') {
    const seed = stringField(event.payload, 'seed');
    if (state.game.phase !== 'game-over' || event.actorUid !== state.room.hostUid || !seed || seed.length > 96) {
      reject(state, event, 'invalid-rematch');
      return false;
    }
    state.game = createSetup(state.room, seed, state.game.epoch + 1);
    return true;
  }

  if (event.type === 'turn/moved') {
    return applyMovement(state, event);
  }

  if (event.type === 'turn/merchant-paid') {
    return applyMerchantPayment(state, event);
  }

  if (event.type === 'place/action-taken') {
    return applyPlaceAction(state, event);
  }

  if (event.type === 'encounter/resolved') {
    return applyEncounter(state, event);
  }

  if (event.type === 'mosque/ability-used') {
    return applyMosqueAbility(state, event);
  }

  if (event.type === 'bonus/played') {
    return applyBonus(state, event);
  }

  if (event.type === 'e2e/resources-granted' && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    const game = state.game;
    const player = game.players[game.turnSeat];
    const lira = event.payload.lira;
    const capacity = event.payload.capacity;
    const goods = event.payload.goods;
    const bonusCards = event.payload.bonusCards;
    if (event.actorUid !== player.uid || game.phase !== 'movement' || typeof lira !== 'number' || !Number.isInteger(lira) || lira < 0 || typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 2 || capacity > 5 || !goods || typeof goods !== 'object' || !Array.isArray(bonusCards) || !bonusCards.every((card) => typeof card === 'string')) {
      reject(state, event, 'invalid-e2e-resources');
      return false;
    }
    const supplied = goods as Record<string, unknown>;
    if ((['fabric', 'spice', 'fruit', 'jewelry'] as Good[]).some((good) => typeof supplied[good] !== 'number' || !Number.isInteger(supplied[good]) || (supplied[good] as number) < 0 || (supplied[good] as number) > capacity)) {
      reject(state, event, 'invalid-e2e-resources');
      return false;
    }
    player.lira = lira;
    player.capacity = capacity;
    player.extensions = capacity - 2;
    player.goods = supplied as Record<Good, number>;
    for (const card of bonusCards) {
      const deckIndex = game.bonusDrawPile.indexOf(card);
      if (deckIndex >= 0) player.bonusHand.push(game.bonusDrawPile.splice(deckIndex, 1)[0]);
    }
    return true;
  }

  if (event.type === 'turn/ended') {
    const game = state.game;
    const player = game.players[game.turnSeat];
    if (game.phase === 'final-bonus') {
      if (event.actorUid !== player.uid || !finishFinalBonusSeat(game)) {
        reject(state, event, 'final-bonus-cannot-end');
        return false;
      }
      return true;
    }
    if (!['action', 'family-action', 'turn-end'].includes(game.phase) || event.actorUid !== player.uid) {
      reject(state, event, 'turn-cannot-end');
      return false;
    }
    if (game.phase === 'action' && beginEncounters(game)) return true;
    advanceTurn(game);
    return true;
  }

  reject(state, event, 'unknown-event-type');
  return false;
}

function applyPlaceAction(state: ReplayProjection, event: CanonicalEvent): boolean {
  const game = state.game!;
  const player = game.players[game.turnSeat];
  const choice = event.payload.choice;
  const familyPending = game.phase === 'family-action' && game.pending?.kind === 'family-action' ? game.pending : null;
  const familyAction = familyPending !== null;
  if ((game.phase !== 'action' && !familyAction) || event.actorUid !== player.uid || !isPlaceActionChoice(choice)) {
    reject(state, event, 'invalid-place-action');
    return false;
  }
  const actionPlace = familyPending?.destination ?? player.merchantPlace;

  let summary: string | null = null;
  if (choice.kind === 'police-send') {
    if (actionPlace !== 12 || familyAction || player.familyPlace !== 12) {
      reject(state, event, 'police-unavailable');
      return false;
    }
    player.familyPlace = choice.destination;
    game.lastAction = { playerUid: player.uid, place: 12, kind: choice.kind, summary: `Sent the family member to Place ${choice.destination}.` };
    game.pending = { kind: 'family-action', destination: choice.destination };
    game.phase = 'family-action';
    return true;
  } else if (choice.kind === 'sultan-buy') {
    if (actionPlace !== 13) { reject(state, event, 'sultan-unavailable'); return false; }
    summary = buySultanRuby(game, player, choice.wildGoods);
    if (!summary) { reject(state, event, 'sultan-payment-unavailable'); return false; }
  } else if (choice.kind === 'gemstone-buy') {
    if (actionPlace !== 16) { reject(state, event, 'gemstone-unavailable'); return false; }
    summary = buyGemstoneRuby(game, player);
    if (!summary) { reject(state, event, 'gemstone-payment-unavailable'); return false; }
  } else if (choice.kind === 'mosque-take') {
    if (actionPlace !== 14 && actionPlace !== 15) { reject(state, event, 'mosque-unavailable'); return false; }
    summary = takeMosqueTile(game, player, choice.tileId, actionPlace);
    if (!summary) { reject(state, event, 'invalid-mosque-tile'); return false; }
  } else if (choice.kind === 'wainwright-buy') {
    if (actionPlace !== 1) {
      reject(state, event, 'wainwright-unavailable');
      return false;
    }
    summary = buyWheelbarrowExtension(game, player);
    if (!summary) { reject(state, event, 'wainwright-unavailable'); return false; }
  } else if (choice.kind === 'warehouse-fill') {
    if (warehouseGood(actionPlace) !== choice.good) {
      reject(state, event, 'wrong-warehouse');
      return false;
    }
    player.goods[choice.good] = player.capacity;
    summary = `Filled ${choice.good} to capacity ${player.capacity}.`;
  } else if (choice.kind === 'fountain-recall') {
    if (actionPlace !== 7) {
      reject(state, event, 'invalid-fountain-recall');
      return false;
    }
    summary = recallAssistants(player, choice.assistantPlaces);
    if (!summary) { reject(state, event, 'invalid-fountain-recall'); return false; }
  } else if (choice.kind === 'post-office-collect') {
    if (actionPlace !== 5) { reject(state, event, 'post-office-unavailable'); return false; }
    summary = collectPostOffice(game, player);
  } else if (choice.kind === 'caravansary-trade') {
    if (actionPlace !== 6) { reject(state, event, 'caravansary-unavailable'); return false; }
    summary = tradeAtCaravansary(game, player, choice.drawSources, choice.discardCardId);
    if (!summary) { reject(state, event, 'invalid-caravansary-trade'); return false; }
  } else if (choice.kind === 'market-sell') {
    if (actionPlace !== 10 && actionPlace !== 11) {
      reject(state, event, 'market-unavailable');
      return false;
    }
    summary = sellAtMarket(game, player, actionPlace, choice.slotIndexes, choice.wildGoods);
    if (!summary) { reject(state, event, 'invalid-market-sale'); return false; }
  } else if (choice.kind === 'black-market-roll') {
    if (actionPlace !== 8) { reject(state, event, 'black-market-unavailable'); return false; }
    const dice = rollDice(createRandom(`${game.seed}:place-roll:${game.turnNumber}:8${familyAction ? ':family' : ''}`));
    if (ownsMosqueAbility(player, 'fabric')) {
      game.lastAction = { playerUid: player.uid, place: actionPlace, kind: choice.kind, summary: `Rolled ${dice[0]} + ${dice[1]}; choose the red Mosque ability or keep the roll.` };
      game.lastRoll = { playerUid: player.uid, place: 8, dice, reward: 0 };
      game.pending = { kind: 'dice-adjust', actionPlace: 8, originalDice: dice, good: choice.good, familyAction };
      game.phase = 'mosque-ability';
      return true;
    }
    const jewelryBefore = player.goods.jewelry;
    summary = resolveBlackMarket(player, choice.good, dice);
    game.lastRoll = { playerUid: player.uid, place: 8, dice, reward: player.goods.jewelry - jewelryBefore };
  } else {
    if (actionPlace !== 9) { reject(state, event, 'tea-house-unavailable'); return false; }
    const dice = rollDice(createRandom(`${game.seed}:place-roll:${game.turnNumber}:9${familyAction ? ':family' : ''}`));
    if (ownsMosqueAbility(player, 'fabric')) {
      game.lastAction = { playerUid: player.uid, place: actionPlace, kind: choice.kind, summary: `Wagered ${choice.wager}; rolled ${dice[0]} + ${dice[1]}. Choose the red Mosque ability or keep the roll.` };
      game.lastRoll = { playerUid: player.uid, place: 9, dice, declared: choice.wager, reward: 0 };
      game.pending = { kind: 'dice-adjust', actionPlace: 9, originalDice: dice, wager: choice.wager, familyAction };
      game.phase = 'mosque-ability';
      return true;
    }
    const liraBefore = player.lira;
    summary = resolveTeaHouse(player, choice.wager, dice);
    game.lastRoll = { playerUid: player.uid, place: 9, dice, declared: choice.wager, reward: player.lira - liraBefore };
  }

  game.lastAction = { playerUid: player.uid, place: actionPlace, kind: choice.kind, summary };
  if (choice.kind === 'warehouse-fill' && ownsMosqueAbility(player, 'spice') && player.lira >= 2 && (Object.keys(player.goods) as Good[]).some((good) => player.goods[good] < player.capacity)) {
    game.pending = { kind: 'warehouse-extra', actionPlace, familyAction };
    game.phase = 'mosque-ability';
    return true;
  }
  game.pending = null;
  if (familyAction || !beginEncounters(game)) game.phase = 'turn-end';
  return true;
}

export function applyBonus(state: ReplayProjection, event: CanonicalEvent): boolean {
  const game = state.game!;
  const player = game.players[game.turnSeat];
  const cardId = stringField(event.payload, 'cardId');
  const choice = event.payload.choice;
  if (!cardId || event.actorUid !== player.uid || !isBonusChoice(choice) || !player.bonusHand.includes(cardId)) {
    reject(state, event, 'invalid-bonus-play');
    return false;
  }
  const effect = bonusEffect(cardId);
  let summary: string | null = null;

  if (effect === 'gain-good' && choice.kind === 'gain-good') {
    if (!['action', 'family-action', 'turn-end', 'final-bonus'].includes(game.phase) || player.goods[choice.good] >= player.capacity) return rejectBonus(state, event, 'bonus-timing');
    player.goods[choice.good] += 1;
    summary = `Played a Bonus card to gain 1 ${choice.good}.`;
  } else if (effect === 'gain-lira' && choice.kind === 'gain-lira') {
    if (!['movement', 'action', 'family-action', 'turn-end', 'final-bonus'].includes(game.phase)) return rejectBonus(state, event, 'bonus-timing');
    player.lira += 5;
    summary = 'Played a Bonus card to gain 5 Lira.';
  } else if (effect === 'return-family' && choice.kind === 'return-family') {
    if (!['movement', 'action', 'family-action', 'turn-end'].includes(game.phase) || player.familyPlace === 12) return rejectBonus(state, event, 'bonus-family-unavailable');
    if (choice.reward === 'bonus' && game.bonusDrawPile.length === 0 && game.bonusDiscard.length === 0) return rejectBonus(state, event, 'bonus-deck-empty');
    player.familyPlace = 12;
    if (choice.reward === 'lira') player.lira += 3;
    else {
      const drawn = drawBonus(game, `bonus-family:${game.turnNumber}`);
      if (!drawn) return rejectBonus(state, event, 'bonus-deck-empty');
      player.bonusHand.push(drawn);
    }
    summary = `Returned the family member to Police and gained ${choice.reward === 'lira' ? '3 Lira' : '1 Bonus card'}.`;
  } else if (effect === 'return-assistant' && choice.kind === 'return-assistant') {
    if (game.phase !== 'movement' || (player.assistantsByPlace[choice.place] ?? 0) < 1) return rejectBonus(state, event, 'bonus-assistant-unavailable');
    const remaining = player.assistantsByPlace[choice.place] - 1;
    if (remaining === 0) delete player.assistantsByPlace[choice.place]; else player.assistantsByPlace[choice.place] = remaining;
    player.assistantsCarried += 1;
    summary = `Played a Bonus card to return 1 assistant from Place ${choice.place}.`;
  } else if (effect === 'long-move' && choice.kind === 'long-move') {
    if (game.phase !== 'movement' || game.activeBonusEffects.includes('long-move')) return rejectBonus(state, event, 'bonus-movement-unavailable');
    activateBonus(game, 'long-move');
    summary = 'Played a Bonus card to move exactly 3 or 4 Places.';
  } else if (effect === 'stay' && choice.kind === 'stay') {
    if (game.phase !== 'movement' || player.merchantPlace === 7 || (player.assistantsByPlace[player.merchantPlace] ?? 0) < 1) return rejectBonus(state, event, 'bonus-stay-unavailable');
    game.lastMovement = { playerUid: player.uid, from: player.merchantPlace, to: player.merchantPlace, distance: 0, assistantAction: 'stay', paymentTotal: 0, paymentBlocked: false };
    game.phase = 'action';
    summary = `Stayed at Place ${player.merchantPlace} and used the assistant already there.`;
  } else if (effect === 'wild-small-market' && choice.kind === 'wild-small-market') {
    if (game.phase !== 'action' || player.merchantPlace !== 11 || game.activeBonusEffects.includes('wild-small-market')) return rejectBonus(state, event, 'bonus-market-unavailable');
    activateBonus(game, 'wild-small-market');
    summary = 'Played Flexible demand; the next Small Market sale may use any goods.';
  } else if (effect === 'repeat-post' && choice.kind === 'repeat-action') {
    if (game.phase !== 'turn-end' || game.lastAction?.place !== 5 || game.lastAction.playerUid !== player.uid) return rejectBonus(state, event, 'bonus-repeat-unavailable');
    summary = `Repeated Post Office. ${collectPostOffice(game, player)}`;
    game.lastAction.summary += ` ${summary}`;
  } else if (effect === 'repeat-sultan' && choice.kind === 'repeat-action') {
    if (game.phase !== 'turn-end' || game.lastAction?.place !== 13 || game.lastAction.playerUid !== player.uid) return rejectBonus(state, event, 'bonus-repeat-unavailable');
    const repeated = buySultanRuby(game, player, choice.wildGoods ?? []);
    if (!repeated) return rejectBonus(state, event, 'bonus-repeat-payment');
    summary = `Repeated Sultan's Palace. ${repeated}`;
    game.lastAction.summary += ` ${summary}`;
  } else if (effect === 'repeat-gemstone' && choice.kind === 'repeat-action') {
    if (game.phase !== 'turn-end' || game.lastAction?.place !== 16 || game.lastAction.playerUid !== player.uid) return rejectBonus(state, event, 'bonus-repeat-unavailable');
    const repeated = buyGemstoneRuby(game, player);
    if (!repeated) return rejectBonus(state, event, 'bonus-repeat-payment');
    summary = `Repeated Gemstone Dealer. ${repeated}`;
    game.lastAction.summary += ` ${summary}`;
  } else return rejectBonus(state, event, 'bonus-effect-mismatch');

  if (!discardPlayedBonus(game, player, cardId)) return rejectBonus(state, event, 'bonus-card-not-owned');
  game.bonusLog.push({ cardId, summary });
  return true;
}

function rejectBonus(state: ReplayProjection, event: CanonicalEvent, reason: string): false {
  reject(state, event, reason);
  return false;
}

function applyMosqueAbility(state: ReplayProjection, event: CanonicalEvent): boolean {
  const game = state.game!;
  const player = game.players[game.turnSeat];
  const choice = event.payload.choice;
  if (event.actorUid !== player.uid || !isMosqueAbilityChoice(choice)) {
    reject(state, event, 'invalid-mosque-ability');
    return false;
  }

  if (choice.kind === 'yellow-recall') {
    if (game.phase !== 'movement' || !ownsMosqueAbility(player, 'fruit') || game.abilitiesUsedThisTurn.includes('fruit') || player.lira < 2 || (player.assistantsByPlace[choice.place] ?? 0) < 1) {
      reject(state, event, 'yellow-ability-unavailable');
      return false;
    }
    if (!recallWithYellow(player, choice.place)) { reject(state, event, 'yellow-ability-unavailable'); return false; }
    game.abilitiesUsedThisTurn.push('fruit');
    game.lastAction = { playerUid: player.uid, place: player.merchantPlace, kind: 'fountain-recall', summary: `Paid 2 Lira to recall 1 assistant from Place ${choice.place}.` };
    return true;
  }

  const pending = game.pending;
  if (game.phase !== 'mosque-ability' || !pending) { reject(state, event, 'mosque-ability-unavailable'); return false; }
  if (choice.kind === 'warehouse-extra') {
    if (pending.kind !== 'warehouse-extra' || !ownsMosqueAbility(player, 'spice')) { reject(state, event, 'green-ability-unavailable'); return false; }
    if (choice.good !== null) {
      if (!buyWarehouseExtra(player, choice.good)) { reject(state, event, 'green-ability-payment'); return false; }
      game.lastAction!.summary += ` Paid 2 Lira for 1 extra ${choice.good}.`;
      game.abilitiesUsedThisTurn.push('spice');
    } else game.lastAction!.summary += ' Declined the green Mosque ability.';
    finishMosqueAbility(game, pending.familyAction);
    return true;
  }

  if (pending.kind !== 'dice-adjust' || !ownsMosqueAbility(player, 'fabric')) { reject(state, event, 'red-ability-unavailable'); return false; }
  const dice = adjustMosqueDice(
    pending.originalDice,
    choice.adjustment,
    rollDice(createRandom(`${game.seed}:mosque-reroll:${game.turnNumber}:${pending.actionPlace}`))
  );
  let summary: string;
  let reward: number;
  if (pending.actionPlace === 8) {
    const before = player.goods.jewelry;
    summary = resolveBlackMarket(player, pending.good!, dice);
    reward = player.goods.jewelry - before;
  } else {
    const before = player.lira;
    summary = resolveTeaHouse(player, pending.wager!, dice);
    reward = player.lira - before;
  }
  game.lastRoll = { playerUid: player.uid, place: pending.actionPlace, dice, ...(pending.wager ? { declared: pending.wager } : {}), reward };
  game.lastAction = { playerUid: player.uid, place: pending.actionPlace, kind: pending.actionPlace === 8 ? 'black-market-roll' : 'tea-house-wager', summary: `${summary}${choice.adjustment === 'none' ? ' Kept the original roll.' : ` Used the red Mosque ability: ${choice.adjustment.replaceAll('-', ' ')}.`}` };
  game.abilitiesUsedThisTurn.push('fabric');
  finishMosqueAbility(game, pending.familyAction);
  return true;
}

function finishMosqueAbility(game: NonNullable<ReplayProjection['game']>, familyAction: boolean) {
  game.pending = null;
  if (familyAction || !beginEncounters(game)) game.phase = 'turn-end';
}

function applyEncounter(state: ReplayProjection, event: CanonicalEvent): boolean {
  const game = state.game!;
  const player = game.players[game.turnSeat];
  const pending = game.pending;
  const choice = event.payload.choice;
  if (game.phase !== 'encounters' || event.actorUid !== player.uid || pending?.kind !== 'encounters' || !isEncounterChoice(choice)) {
    reject(state, event, 'invalid-encounter');
    return false;
  }
  if (pending.governor === 'payment' && choice.kind !== 'governor-pay') {
    reject(state, event, 'governor-payment-required');
    return false;
  }

  let summary = '';
  let dice: [number, number] | undefined;
  let destination: number | undefined;
  if (choice.kind === 'catch-family') {
    if (!pending.familyUids.includes(choice.familyUid)) { reject(state, event, 'family-not-present'); return false; }
    const result = catchFamily(game, player, choice.familyUid, choice.reward);
    if (!result) { reject(state, event, 'invalid-family-reward'); return false; }
    pending.familyUids = pending.familyUids.filter((uid) => uid !== choice.familyUid);
    summary = result;
  } else if (choice.kind === 'governor-visit') {
    if (pending.governor !== 'available') { reject(state, event, 'governor-unavailable'); return false; }
    if (!choice.accept) {
      pending.governor = null;
      summary = 'Declined the Governor; the token remained in place.';
    } else {
      const card = drawBonus(game, `governor:${game.turnNumber}`);
      if (!card) { reject(state, event, 'bonus-deck-empty'); return false; }
      player.bonusHand.push(card);
      pending.governor = 'payment';
      summary = 'Drew 1 Bonus card from the Governor; payment is now mandatory.';
    }
  } else if (choice.kind === 'governor-pay') {
    if (pending.governor !== 'payment') { reject(state, event, 'governor-payment-unavailable'); return false; }
    if (choice.payment === 'lira') {
      if (player.lira < 2) { reject(state, event, 'governor-payment-shortfall'); return false; }
      player.lira -= 2;
      summary = 'Paid the Governor 2 Lira';
    } else {
      const cardIndex = player.bonusHand.indexOf(choice.discardCardId ?? '');
      if (cardIndex < 0) { reject(state, event, 'governor-card-not-owned'); return false; }
      game.bonusDiscard.push(player.bonusHand.splice(cardIndex, 1)[0]);
      summary = 'Discarded 1 Bonus card for the Governor';
    }
    dice = relocateEncounter(game, 'governor');
    destination = game.governorPlace;
    pending.governor = null;
    summary += ` and relocated the token to Place ${destination}.`;
  } else if (!choice.accept) {
    if (!pending.smuggler) { reject(state, event, 'smuggler-unavailable'); return false; }
    pending.smuggler = false;
    summary = 'Declined the Smuggler; the token remained in place.';
  } else {
    if (!pending.smuggler || player.goods[choice.good] >= player.capacity) { reject(state, event, 'smuggler-unavailable'); return false; }
    player.goods[choice.good] += 1;
    if (choice.payment === 'lira') {
      if (player.lira < 2) { player.goods[choice.good] -= 1; reject(state, event, 'smuggler-payment-shortfall'); return false; }
      player.lira -= 2;
      summary = `Took 1 ${choice.good} and paid the Smuggler 2 Lira`;
    } else {
      const paymentGood = choice.paymentGood as Good;
      if (player.goods[paymentGood] < 1) { player.goods[choice.good] -= 1; reject(state, event, 'smuggler-good-unavailable'); return false; }
      player.goods[paymentGood] -= 1;
      summary = `Took 1 ${choice.good} and paid the Smuggler 1 ${paymentGood}`;
    }
    dice = relocateEncounter(game, 'smuggler');
    destination = game.smugglerPlace;
    pending.smuggler = false;
    summary += `; relocated the token to Place ${destination}.`;
  }

  game.encounterLog.push({ kind: choice.kind, summary, ...(dice ? { dice } : {}), ...(destination ? { destination } : {}) });
  if (pending.familyUids.length === 0 && pending.governor === null && !pending.smuggler) {
    game.pending = null;
    game.phase = 'turn-end';
  }
  return true;
}

function beginEncounters(game: NonNullable<ReplayProjection['game']>): boolean {
  const player = game.players[game.turnSeat];
  const place = player.merchantPlace;
  const familyUids = place === 12 ? [] : game.players
    .filter((candidate) => candidate.uid !== player.uid && candidate.familyPlace === place)
    .map(({ uid }) => uid);
  const governor = game.governorPlace === place ? 'available' as const : null;
  const smuggler = game.smugglerPlace === place;
  if (familyUids.length === 0 && governor === null && !smuggler) return false;
  game.pending = { kind: 'encounters', familyUids, governor, smuggler };
  game.phase = 'encounters';
  return true;
}

function applyMovement(state: ReplayProjection, event: CanonicalEvent): boolean {
  const game = state.game!;
  const player = game.players[game.turnSeat];
  const destination = event.payload.destination;
  const assistantAction = event.payload.assistantAction;
  if (
    game.phase !== 'movement' || event.actorUid !== player.uid ||
    typeof destination !== 'number' || !Number.isInteger(destination) ||
    !isAssistantAction(assistantAction)
  ) {
    reject(state, event, 'invalid-movement');
    return false;
  }
  const distance = gridDistance(game.board, player.merchantPlace, destination);
  const requiredAction = requiredAssistantAction(player, destination);
  const longMove = game.activeBonusEffects.includes('long-move');
  if (distance < (longMove ? 3 : 1) || distance > (longMove ? 4 : 2) || !requiredAction || assistantAction !== requiredAction) {
    reject(state, event, 'illegal-destination');
    return false;
  }

  const from = player.merchantPlace;
  const recipientUids = destination === 7 ? [] : game.players
    .filter((candidate) => candidate.uid !== player.uid && candidate.merchantPlace === destination)
    .map(({ uid }) => uid);
  const neutralMerchantIds = destination === 7 ? [] : game.neutralMerchants
    .filter(({ place }) => place === destination)
    .map(({ id }) => id);
  const paymentTotal = (recipientUids.length + neutralMerchantIds.length) * 2;

  player.merchantPlace = destination;
  if (assistantAction === 'drop') {
    player.assistantsCarried -= 1;
    player.assistantsByPlace[destination] = (player.assistantsByPlace[destination] ?? 0) + 1;
  } else if (assistantAction === 'pick-up') {
    player.assistantsCarried += 1;
    const remaining = (player.assistantsByPlace[destination] ?? 0) - 1;
    if (remaining === 0) delete player.assistantsByPlace[destination];
    else player.assistantsByPlace[destination] = remaining;
  }

  const paymentBlocked = player.lira < paymentTotal;
  game.lastMovement = { playerUid: player.uid, from, to: destination, distance, assistantAction, paymentTotal, paymentBlocked };
  game.activeBonusEffects = game.activeBonusEffects.filter((effect) => effect !== 'long-move');
  if (paymentBlocked) {
    advanceTurn(game);
  } else if (paymentTotal > 0) {
    game.pending = { kind: 'merchant-payment', recipientUids, neutralMerchantIds, total: paymentTotal };
    game.phase = 'merchant-payment';
  } else {
    game.pending = null;
    game.phase = 'action';
  }
  return true;
}

function applyMerchantPayment(state: ReplayProjection, event: CanonicalEvent): boolean {
  const game = state.game!;
  const player = game.players[game.turnSeat];
  const pending = game.pending;
  const recipientUids = stringArray(event.payload.recipientUids);
  const neutralMerchantIds = stringArray(event.payload.neutralMerchantIds);
  if (
    game.phase !== 'merchant-payment' || event.actorUid !== player.uid || pending?.kind !== 'merchant-payment' ||
    !recipientUids || !neutralMerchantIds ||
    recipientUids.join('|') !== pending.recipientUids.join('|') ||
    neutralMerchantIds.join('|') !== pending.neutralMerchantIds.join('|') ||
    player.lira < pending.total
  ) {
    reject(state, event, 'invalid-merchant-payment');
    return false;
  }
  player.lira -= pending.total;
  for (const uid of pending.recipientUids) game.players.find((candidate) => candidate.uid === uid)!.lira += 2;
  for (const id of pending.neutralMerchantIds) {
    const neutral = game.neutralMerchants.find((candidate) => candidate.id === id)!;
    const random = createRandom(`${game.seed}:neutral:${game.turnNumber}:${id}`);
    const dice = rollDice(random);
    neutral.place = dice[0] + dice[1];
  }
  game.pending = null;
  game.phase = 'action';
  return true;
}

function advanceTurn(game: NonNullable<ReplayProjection['game']>) {
  game.end.ordinaryTurnCounts[game.turnSeat] += 1;
  markEndTrigger(game);
  if (game.end.triggeredByUid && game.turnSeat === game.end.finalTurnSeat) {
    game.phase = 'final-bonus';
    game.turnSeat = game.startingSeat;
    game.pending = null;
    game.encounterLog = [];
    game.abilitiesUsedThisTurn = [];
    game.activeBonusEffects = [];
    game.bonusLog = [];
    return;
  }
  game.turnSeat = (game.turnSeat + 1) % game.players.length;
  game.turnNumber += 1;
  game.phase = 'movement';
  game.pending = null;
  game.encounterLog = [];
  game.abilitiesUsedThisTurn = [];
  game.activeBonusEffects = [];
  game.bonusLog = [];
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string') ? value : null;
}

function isAssistantAction(value: unknown): value is AssistantAction {
  return value === 'drop' || value === 'pick-up' || value === 'fountain';
}

function isLayout(value: unknown): value is LayoutKind {
  return ['short-path', 'long-path', 'number-order', 'random'].includes(String(value));
}

function isMode(value: unknown): value is RoomMode {
  return value === 'personal-screens' || value === 'shared-table';
}
