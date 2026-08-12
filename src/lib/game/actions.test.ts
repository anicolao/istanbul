import { describe, expect, it } from 'vitest';
import {
  buyWheelbarrowExtension,
  collectPostOffice,
  previewCaravansary,
  recallAssistants,
  sellAtMarket,
  tradeAtCaravansary
} from './actions';
import { manifestVersions, reducerVersion, rulesEdition, schemaVersion, type CanonicalEvent, type RoomProjection } from './protocol';
import { replayEvents } from './reducer';
import { createSetup } from './setup';

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
    expect(sellAtMarket(game, player, 10, [0, 1, 2, 3])).toBe('Sold 4 goods for 14 Lira.');
    expect(player).toMatchObject({ lira: 14, goods: { fabric: 0, spice: 0, fruit: 0, jewelry: 0 } });
    expect(game.largeDemand).toEqual([nextDemand, ...game.largeDemand.slice(1, -1), 'demand-large-1']);
    expect(sellAtMarket(game, player, 10, [0])).toBeNull();
    expect(sellAtMarket(game, player, 12, [0])).toBeNull();
  });
});
