import { places, bonusCards } from '$lib/game/manifests';
import { createGalleryGame } from '$lib/game/gallery-fixture';
import { applyEvent } from '$lib/game/reducer';
import { requiredAssistantAction } from '$lib/game/movement';
import {
  manifestVersions,
  rulesEdition,
  schemaVersion,
  reducerVersion,
  type CanonicalEvent,
  type ReplayProjection,
  type RoomMode,
  type TablePosition
} from '$lib/game/protocol';
import type { PlaceActionChoice } from '$lib/game/actions';

export type Command = { type: string; payload: Record<string, unknown> };
const command = (type: string, payload: Record<string, unknown>): Command => ({
  type,
  payload: { ...payload, directAction: true }
});
const action = (choice: PlaceActionChoice) =>
  command('place/action-taken', { choice });
export function eventFor(
  state: ReplayProjection,
  cmd: Command,
  sequence = 1
): CanonicalEvent {
  return {
    ...cmd,
    id: `preview-${sequence}`,
    clientSeq: String(sequence).padStart(6, '0'),
    createdAt: sequence,
    actorUid: state.game!.players[state.game!.turnSeat].uid,
    manifestVersions,
    rulesEdition,
    schemaVersion,
    reducerVersion
  };
}
export const scenarios = [
  ...places.map((p) => ({
    id: `arrival-${p.id}`,
    group: 'Move and zoom',
    name: p.name,
    hint: 'Trigger the move, then use the room normally. Automatic actions happen on arrival.'
  })),
  ...places.map((p) => ({
    id: `action-${p.id}`,
    group: 'Room actions',
    name: p.name,
    hint: p.action
  })),
  ...[
    ['post-office-reset', 'Post Office · reset all blocks'],
    ['wainwright-extension', 'Wainwright · extension without ruby'],
    ['pickup', 'Pick up an assistant'],
    ['toll', 'Pay another merchant'],
    ['neutral', 'Pay a neutral merchant'],
    ['blocked', 'Cannot afford the merchant'],
    ['governor', 'Governor · draw a card'],
    ['governor-pay', 'Governor · pay and relocate'],
    ['smuggler', 'Smuggler · trade and relocate'],
    ['family', 'Catch a family member'],
    ['fountain-encounters', 'Fountain · visitors after recall'],
    ['tea-house-encounters', 'Tea House · visitors after the wager'],
    ['hand-review', 'Review a small Bonus hand'],
    ['green', 'Green power · extra good'],
    ['red', 'Red power · change a die'],
    ['reroll', 'Red power · reroll'],
    ['yellow', 'Yellow power · recall an assistant'],
    ['discard', 'Caravansary · discard a card'],
    ['end-turn', 'End turn'],
    ['victory', 'Game end and scoring']
  ].map(([id, name]) => ({
    id,
    name,
    group: 'Encounters and powers',
    hint: 'Trigger the prepared action, or use the game controls to explore its choices.'
  })),
  ...bonusCards
    .filter(
      (card, i, all) => all.findIndex((c) => c.effect === card.effect) === i
    )
    .map((card) => ({
      id: card.id,
      group: 'Bonus cards',
      name: card.title,
      hint: card.text
    }))
];

/** Prepared local positions; every triggered action still runs through the game reducer. */
export function fixture(
  id: string,
  count: number,
  mode: RoomMode,
  position: TablePosition,
  seating?: TablePosition[]
) {
  const game = createGalleryGame();
  game.players = game.players.slice(0, count);
  game.end.target = count === 2 ? 6 : 5;
  game.end.finalTurnSeat = count - 1;
  game.end.ordinaryTurnCounts = Array(count).fill(0);
  game.postOfficeLower = [true, true, false, false];
  game.phase = 'action';
  game.pending = null;
  game.governorPlace = 15;
  game.smugglerPlace = 16;
  game.neutralMerchants = [];
  const player = game.players[0];
  for (const p of game.players) {
    p.merchantPlace = 16;
    p.familyPlace = 12;
    p.rubies = 0;
  }
  player.merchantPlace = 3;
  player.lira = 40;
  player.capacity = 5;
  player.extensions = 2;
  player.goods = { fabric: 4, spice: 3, fruit: 4, jewelry: 3 };
  player.assistantsCarried = 2;
  player.assistantsByPlace = { 2: 1, 4: 1 };
  player.mosqueTileIds = [];
  player.bonusHand = bonusCards
    .filter((c, i, a) => a.findIndex((x) => x.effect === c.effect) === i)
    .map((c) => c.id);
  for (const p of game.players.slice(1)) p.bonusHand = [];
  game.bonusDrawPile = bonusCards
    .map((c) => c.id)
    .filter((id) => !player.bonusHand.includes(id));
  game.bonusDiscard = [game.bonusDrawPile.pop()!];
  const positions = seating ?? (
    [position, 6, 2, 4, 8, 1, 3, 5, 7] as TablePosition[]
  ).filter((v, i, a) => a.indexOf(v) === i);
  const state: ReplayProjection = {
    game,
    room: {
      roomCode: 'MOTION',
      hostUid: player.uid,
      tabletopOwned: true,
      status: 'playing',
      maxPlayers: 5,
      mode,
      layout: 'number-order',
      seats: game.players.map((p, i) => ({
        uid: p.uid,
        name: p.name,
        ready: true,
        tablePosition: positions[i]
      }))
    },
    acceptedEventIds: [],
    diagnostics: [],
    undo: null,
    undoLog: [],
    gameLog: []
  };
  let trigger: Command = command('turn/ended', {});
  const prepare = (cmd: Command) => {
    if (!applyEvent(state, eventFor(state, cmd)))
      throw new Error(`${id}: ${state.diagnostics.at(-1)?.reason}`);
  };
  const move = (destination: number) => {
    game.phase = 'movement';
    player.merchantPlace = destination === 1 ? 2 : destination - 1;
    if (destination % 4 === 1 && destination !== 1)
      player.merchantPlace = destination - 4;
    for (const p of game.players.slice(1))
      p.merchantPlace = destination === 16 ? 15 : 16;
    return command('turn/moved', {
      destination,
      assistantAction: requiredAssistantAction(player, destination)
    });
  };
  const roomActions: Record<number, PlaceActionChoice> = {
    1: { kind: 'wainwright-buy' },
    2: { kind: 'warehouse-fill', good: 'fabric' },
    3: { kind: 'warehouse-fill', good: 'spice' },
    4: { kind: 'warehouse-fill', good: 'fruit' },
    5: { kind: 'post-office-collect' },
    6: { kind: 'caravansary-draw', drawSources: ['deck', 'deck'] },
    7: { kind: 'fountain-recall', assistantPlaces: [2, 4] },
    8: { kind: 'black-market-roll', good: 'fruit' },
    9: { kind: 'tea-house-wager', wager: 7 },
    10: { kind: 'market-sell', slotIndexes: [0, 1, 2, 3, 4] },
    11: { kind: 'market-sell', slotIndexes: [0, 1, 2, 3, 4] },
    12: { kind: 'police-send', destination: 3 },
    13: { kind: 'sultan-buy', wildGoods: ['fruit'] },
    14: { kind: 'mosque-take', tileId: 'mosque-fabric-2' },
    15: { kind: 'mosque-take', tileId: 'mosque-jewelry-2' },
    16: { kind: 'gemstone-buy' }
  };
  if (id === 'hand-review') {
    player.bonusHand = player.bonusHand.slice(0, 2);
    trigger = move(3);
  }
  if (id === 'tea-house-encounters') {
    player.merchantPlace = 9;
    game.smugglerPlace = 9;
    game.governorPlace = 9;
    trigger = action({ kind: 'tea-house-wager', wager: 7 });
  }
  if (id === 'fountain-encounters') {
    player.merchantPlace = 7;
    game.smugglerPlace = 7;
    game.governorPlace = 7;
    trigger = action({ kind: 'fountain-recall', assistantPlaces: [2, 4] });
  }
  if (id === 'arrival-1' || id === 'action-1') player.capacity = 4;
  if (id === 'wainwright-extension') {
    player.capacity = 3;
    player.extensions = 1;
    player.goods.fabric = Math.min(player.goods.fabric, 3);
    player.goods.fruit = Math.min(player.goods.fruit, 3);
  }
  if (id === 'arrival-3' || id === 'action-3') player.goods.spice = 0;
  if (id === 'post-office-reset') {
    game.postOfficeLower = [true, true, true, true];
    trigger = move(5);
  } else if (id === 'wainwright-extension') trigger = move(1);
  else if (id.startsWith('arrival-')) trigger = move(Number(id.split('-')[1]));
  else if (id.startsWith('action-')) {
    player.merchantPlace = Number(id.split('-')[1]);
    trigger = action(roomActions[player.merchantPlace]);
  } else if (['pickup', 'toll', 'neutral', 'blocked'].includes(id)) {
    trigger = move(3);
    if (id === 'pickup') player.assistantsByPlace[3] = 1;
    else if (id === 'toll') game.players[1].merchantPlace = 3;
    else {
      game.neutralMerchants = [{ id: 'neutral-1', place: 3 }];
      if (id === 'blocked') player.lira = 0;
    }
    trigger = command('turn/moved', {
      destination: 3,
      assistantAction: requiredAssistantAction(player, 3)
    });
    if (id === 'neutral') {
      prepare(trigger);
      const pending = game.pending!;
      if (pending.kind === 'merchant-payment')
        trigger = command('turn/merchant-paid', {
          recipientUids: pending.recipientUids,
          neutralMerchantIds: pending.neutralMerchantIds
        });
    }
  } else if (['governor', 'governor-pay', 'smuggler', 'family'].includes(id)) {
    game.governorPlace = id.startsWith('governor') ? 3 : 15;
    game.smugglerPlace = id === 'smuggler' ? 3 : 16;
    if (id === 'family') game.players[1].familyPlace = 3;
    prepare(action(roomActions[3]));
    trigger = command('encounter/resolved', {
      choice:
        id === 'smuggler'
          ? {
              kind: 'smuggler-trade',
              accept: true,
              good: 'jewelry',
              payment: 'lira'
            }
          : id === 'family'
            ? {
                kind: 'catch-family',
                familyUid: game.players[1].uid,
                reward: 'bonus'
              }
            : { kind: 'governor-visit', accept: true }
    });
    if (id === 'governor-pay') {
      prepare(trigger);
      trigger = command('encounter/resolved', {
        choice: { kind: 'governor-pay', payment: 'lira' }
      });
    }
  } else if (id === 'green') {
    player.mosqueTileIds = ['mosque-spice-2'];
    prepare(action(roomActions[3]));
    trigger = command('mosque/ability-used', {
      choice: { kind: 'warehouse-extra', good: 'jewelry' }
    });
  } else if (id === 'red' || id === 'reroll') {
    player.mosqueTileIds = ['mosque-fabric-2'];
    player.merchantPlace = 8;
    prepare(action(roomActions[8]));
    trigger = command('mosque/ability-used', {
      choice: {
        kind: 'dice-adjust',
        adjustment: id === 'red' ? 'first-to-four' : 'reroll'
      }
    });
  } else if (id === 'yellow') {
    game.phase = 'movement';
    player.mosqueTileIds = ['mosque-fruit-2'];
    trigger = command('mosque/ability-used', {
      choice: { kind: 'yellow-recall', place: 2 }
    });
  } else if (id === 'discard') {
    player.merchantPlace = 6;
    prepare(action(roomActions[6]));
    trigger = action({
      kind: 'caravansary-discard',
      discardCardId: player.bonusHand.at(-1)!
    });
  } else if (id.startsWith('bonus-')) {
    const effect = bonusCards.find((c) => c.id === id)!.effect;
    let choice: Record<string, unknown> = { kind: effect };
    if (effect === 'gain-good') choice.good = 'jewelry';
    if (effect === 'return-family') {
      player.familyPlace = 8;
      choice.reward = 'bonus';
    }
    if (effect === 'return-assistant') {
      game.phase = 'movement';
      choice.place = 2;
    }
    if (effect === 'stay' || effect === 'long-move') game.phase = 'movement';
    if (effect === 'wild-small-market') player.merchantPlace = 11;
    if (effect.startsWith('repeat-')) {
      player.merchantPlace =
        effect === 'repeat-post' ? 5 : effect === 'repeat-sultan' ? 13 : 16;
      prepare(action(roomActions[player.merchantPlace]));
      player.goods = { fabric: 4, spice: 4, fruit: 4, jewelry: 4 };
      player.lira = 40;
      game.pending = null;
      game.phase = 'turn-end';
      choice = { kind: 'repeat-action', wildGoods: ['fruit'] };
    }
    trigger = command('bonus/played', { cardId: id, choice });
  } else if (id === 'victory') {
    player.rubies = 6;
    game.end.triggeredByUid = player.uid;
    game.end.triggeredTurn = game.turnNumber;
    game.end.finalTurnSeat = 0;
    game.end.finalBonusSeatsCompleted = game.players
      .slice(1)
      .map((_, i) => i + 1);
    game.phase = 'final-bonus';
  }
  return { state, trigger };
}
