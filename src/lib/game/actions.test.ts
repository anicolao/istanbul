import { describe, expect, it } from 'vitest';
import {
  buyWheelbarrowExtension,
  collectPostOffice,
  previewCaravansary,
  recallAssistants,
  resolveBlackMarket,
  resolveTeaHouse,
  sellAtMarket,
  tradeAtCaravansary
} from './actions';
import { manifestVersions, reducerVersion, rulesEdition, schemaVersion, type CanonicalEvent, type RoomProjection } from './protocol';
import { replayEvents } from './reducer';
import { createSetup } from './setup';
import { catchFamily, drawBonus } from './encounters';

function event(sequence: number, actorUid: string, type: string, payload: Record<string, unknown>): CanonicalEvent {
  const clientSeq = String(sequence).padStart(6, '0');
  return { id: `${actorUid}-${clientSeq}`, actorUid, clientSeq, createdAt: sequence, manifestVersions: { ...manifestVersions }, payload, reducerVersion, rulesEdition, schemaVersion, type };
}

function room(): RoomProjection {
  return {
    roomCode: 'GOODS', hostUid: 'host', status: 'lobby', maxPlayers: 2, layout: 'short-path', mode: 'personal-screens',
    seats: [{ uid: 'host', name: 'Ada', ready: true }, { uid: 'guest', name: 'Bora', ready: true }]
  };
}

function startedGame() {
  return [
    event(1, 'host', 'game/created', { roomCode: 'GOODS', hostName: 'Ada', maxPlayers: 2, layout: 'short-path', mode: 'personal-screens' }),
    event(2, 'guest', 'player/joined', { name: 'Bora' }),
    event(3, 'host', 'player/ready', { ready: true }),
    event(4, 'guest', 'player/ready', { ready: true }),
    event(5, 'host', 'game/started', { seed: 'move-desktop-4' })
  ];
}

describe('deterministic economy actions', () => {
  it('charges for exactly three extensions and awards the completion ruby once', () => {
    const game = createSetup(room(), 'wheelbarrow-boundaries');
    const player = game.players[0];
    player.lira = 28;
    const initialExtensions = game.supplies.wheelbarrowExtensions;
    const initialRubies = game.supplies.wainwrightRubies;

    expect(buyWheelbarrowExtension(game, player)).toBe('Bought wheelbarrow extension 1 of 3.');
    expect(buyWheelbarrowExtension(game, player)).toBe('Bought wheelbarrow extension 2 of 3.');
    expect(buyWheelbarrowExtension(game, player)).toBe('Completed the wheelbarrow and claimed its ruby.');
    expect(buyWheelbarrowExtension(game, player)).toBeNull();
    expect(player).toMatchObject({ lira: 7, capacity: 5, extensions: 3, rubies: 1 });
    expect(game.supplies.wheelbarrowExtensions).toBe(initialExtensions - 3);
    expect(game.supplies.wainwrightRubies).toBe(initialRubies - 1);
  });

  it('recalls a validated multiset of assistants without breaking conservation', () => {
    const game = createSetup(room(), 'fountain-recall');
    const player = game.players[0];
    player.assistantsCarried = 1;
    player.assistantsByPlace = { 2: 1, 14: 2 };
    expect(recallAssistants(player, [14, 2])).toBe('Recalled 2 assistants.');
    expect(player).toMatchObject({ assistantsCarried: 3, assistantsByPlace: { 14: 1 } });
    expect(recallAssistants(player, [2])).toBeNull();
    expect(player.assistantsCarried + player.assistantsInSupply + Object.values(player.assistantsByPlace).reduce((sum, count) => sum + count, 0)).toBe(5);
  });

  it('fills only the matching warehouse and closes the action against repeats', () => {
    const projection = replayEvents([
      ...startedGame(),
      event(6, 'host', 'turn/moved', { destination: 2, assistantAction: 'drop' }),
      event(7, 'host', 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'fabric' } }),
      event(8, 'host', 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'spice' } })
    ]);
    expect(projection.game).toMatchObject({ phase: 'turn-end', lastAction: { kind: 'warehouse-fill', place: 2 }, players: [{ goods: { fabric: 2 } }, {}] });
    expect(projection.diagnostics.map(({ reason }) => reason)).toEqual(['invalid-place-action']);
  });

  it('advances all five Post Office states and resets only after the fifth collection', () => {
    const game = createSetup(room(), 'post-office-cycle');
    const player = game.players[0];
    player.lira = 0;
    player.capacity = 10;
    const states = [
      [true, false, false, false],
      [true, true, false, false],
      [true, true, true, false],
      [true, true, true, true],
      [false, false, false, false]
    ];
    for (const lower of states) {
      expect(collectPostOffice(game, player)).toMatch(/^Collected/);
      expect(game.postOfficeLower).toEqual(lower);
    }
    expect(player).toMatchObject({ lira: 10, goods: { fabric: 6, spice: 2, fruit: 3, jewelry: 2 } });
  });

  it('previews and resolves ordered Caravansary sources while conserving all 26 cards', () => {
    const game = createSetup(room(), 'caravansary-sources');
    const player = game.players[0];
    const discardedBefore = player.bonusHand[0];
    const discardOffer = game.bonusDrawPile.shift()!;
    game.bonusDiscard.push(discardOffer);
    const preview = previewCaravansary(game, ['discard', 'deck'])!;
    expect(preview[0]).toBe(discardOffer);
    expect(tradeAtCaravansary(game, player, ['discard', 'deck'], discardedBefore)).toBe('Took 2 Bonus cards and discarded 1; 2 remain in hand.');
    expect(player.bonusHand).toEqual(preview);
    expect(game.bonusDiscard.at(-1)).toBe(discardedBefore);
    expect(game.bonusDrawPile.length + game.bonusDiscard.length + game.players.reduce((sum, candidate) => sum + candidate.bonusHand.length, 0)).toBe(26);
    expect(previewCaravansary({ ...game, bonusDiscard: [] }, ['discard', 'deck'])).toBeNull();
  });

  it('sells only owned depicted Demand slots, pays the exact table, and rotates the stack', () => {
    const game = createSetup(room(), 'market-sale');
    const player = game.players[0];
    game.largeDemand = ['demand-large-1', ...game.largeDemand.filter((id) => id !== 'demand-large-1')];
    player.goods = { fabric: 2, spice: 1, fruit: 1, jewelry: 0 };
    player.lira = 0;
    const nextDemand = game.largeDemand[1];
    expect(sellAtMarket(game, player, 10, [0, 1, 2, 3])).toBe('Sold 4 goods for 18 Lira.');
    expect(player).toMatchObject({ lira: 18, goods: { fabric: 0, spice: 0, fruit: 0, jewelry: 0 } });
    expect(game.largeDemand).toEqual([nextDemand, ...game.largeDemand.slice(1, -1), 'demand-large-1']);
    expect(sellAtMarket(game, player, 10, [0])).toBeNull();
    expect(sellAtMarket(game, player, 12, [0])).toBeNull();

    const smallGame = createSetup(room(), 'small-market-sale');
    const smallPlayer = smallGame.players[0];
    smallGame.smallDemand = ['demand-small-1', ...smallGame.smallDemand.filter((id) => id !== 'demand-small-1')];
    smallPlayer.goods = { fabric: 2, spice: 2, fruit: 0, jewelry: 0 };
    smallPlayer.lira = 0;
    expect(sellAtMarket(smallGame, smallPlayer, 11, [0, 1, 2, 3])).toBe('Sold 4 goods for 14 Lira.');
    expect(smallPlayer.lira).toBe(14);
  });

  it('maps every Black Market roll boundary and respects wheelbarrow capacity', () => {
    const game = createSetup(room(), 'black-market-boundaries');
    const player = game.players[0];
    player.capacity = 5;
    const cases: Array<[[number, number], number]> = [[[3, 3], 0], [[3, 4], 1], [[4, 5], 2], [[5, 6], 3]];
    for (const [dice, expectedJewelry] of cases) {
      player.goods = { fabric: 0, spice: 0, fruit: 0, jewelry: 0 };
      expect(resolveBlackMarket(player, 'spice', dice)).toContain(`gained ${expectedJewelry} jewelry`);
      expect(player.goods).toMatchObject({ spice: 1, jewelry: expectedJewelry });
    }
    player.goods.spice = 5;
    player.goods.jewelry = 4;
    resolveBlackMarket(player, 'spice', [6, 6]);
    expect(player.goods).toMatchObject({ spice: 5, jewelry: 5 });
  });

  it('pays a successful Tea House declaration or the exact two-Lira consolation', () => {
    const game = createSetup(room(), 'tea-house-boundaries');
    const player = game.players[0];
    player.lira = 0;
    expect(resolveTeaHouse(player, 8, [4, 4])).toBe('Wagered 8; rolled 4 + 4 = 8 and gained 8 Lira.');
    expect(resolveTeaHouse(player, 12, [5, 6])).toBe('Wagered 12; rolled 5 + 6 = 11 and gained 2 Lira.');
    expect(player.lira).toBe(10);
  });
});

describe('family and bazaar encounters', () => {
  it('returns caught family members and conserves either official reward', () => {
    const game = createSetup(room(), 'family-catch-boundaries');
    const [ada, bora] = game.players;
    ada.merchantPlace = 2;
    bora.familyPlace = 2;
    const cardsBefore = game.bonusDrawPile.length;
    expect(catchFamily(game, ada, bora.uid, 'bonus')).toBe("Caught Bora's family and gained 1 Bonus card.");
    expect(ada.bonusHand).toHaveLength(2);
    expect(game.bonusDrawPile).toHaveLength(cardsBefore - 1);
    expect(bora.familyPlace).toBe(12);
    expect(catchFamily(game, ada, bora.uid, 'lira')).toBeNull();

    bora.familyPlace = 2;
    expect(catchFamily(game, ada, bora.uid, 'lira')).toBe("Caught Bora's family and gained 3 Lira.");
    expect(ada.lira).toBe(5);
  });

  it('recycles a depleted Bonus deck deterministically for encounter rewards', () => {
    const first = createSetup(room(), 'encounter-recycle');
    const second = createSetup(room(), 'encounter-recycle');
    for (const game of [first, second]) {
      game.bonusDiscard = game.bonusDrawPile.splice(0);
      expect(game.bonusDrawPile).toEqual([]);
    }
    expect(drawBonus(first, 'same-boundary')).toBe(drawBonus(second, 'same-boundary'));
    expect(first.bonusDrawPile.length + first.bonusDiscard.length).toBe(23);
  });

  it('keeps Police family action and three ordered encounters replayable', () => {
    const events = [
      ...startedGame().slice(0, -1),
      event(5, 'host', 'game/started', { seed: 'encounter-735' }),
      event(6, 'host', 'turn/moved', { destination: 12, assistantAction: 'drop' }),
      event(7, 'host', 'place/action-taken', { choice: { kind: 'police-send', destination: 2 } }),
      event(8, 'host', 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'fabric' } }),
      event(9, 'host', 'turn/ended', {}),
      event(10, 'guest', 'turn/moved', { destination: 2, assistantAction: 'drop' }),
      event(11, 'guest', 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'fabric' } }),
      event(12, 'guest', 'encounter/resolved', { choice: { kind: 'smuggler-trade', accept: true, good: 'jewelry', payment: 'good', paymentGood: 'fabric' } }),
      event(13, 'guest', 'encounter/resolved', { choice: { kind: 'catch-family', familyUid: 'host', reward: 'bonus' } }),
      event(14, 'guest', 'encounter/resolved', { choice: { kind: 'governor-visit', accept: true } }),
      event(15, 'guest', 'encounter/resolved', { choice: { kind: 'governor-pay', payment: 'lira' } })
    ];
    const projection = replayEvents(events);
    expect(projection.diagnostics).toEqual([]);
    expect(projection.game).toMatchObject({
      phase: 'turn-end',
      pending: null,
      governorPlace: expect.any(Number),
      smugglerPlace: expect.any(Number),
      players: [
        { familyPlace: 12, goods: { fabric: 2 } },
        { lira: 1, familyPlace: 12, goods: { fabric: 1, jewelry: 1 }, bonusHand: expect.arrayContaining([]) }
      ]
    });
    expect(projection.game?.players[1].bonusHand).toHaveLength(3);
    expect(projection.game?.encounterLog.map(({ kind }) => kind)).toEqual(['smuggler-trade', 'catch-family', 'governor-visit', 'governor-pay']);
    expect(projection.game?.encounterLog.filter(({ dice }) => dice)).toHaveLength(2);
  });
});
