import { describe, expect, it } from 'vitest';
import { fixture, eventFor } from '../../routes/dev/animations/scenarios';
import { applyEvent } from './reducer';

function station() {
  const { state } = fixture('action-12', 2, 'personal-screens', 6);
  const game = state.game!;
  game.governorPlace = 12;
  game.smugglerPlace = 12;
  game.players[0].merchantPlace = 12;
  game.players[0].familyPlace = 12;
  game.players[0].mosqueTileIds = [];
  game.phase = 'action';
  game.pending = null;
  let sequence = 0;
  const act = (type: string, payload: Record<string, unknown>, modern = true) => {
    expect(applyEvent(state, eventFor(state, { type, payload: { ...payload, ...(modern ? { policeEncounters: true } : {}) } }, ++sequence))).toBe(true);
    expect(state.diagnostics).toEqual([]);
  };
  return { state, game, act };
}

function expectStationEncounters(game: ReturnType<typeof station>['game']) {
  expect(game.phase).toBe('encounters');
  expect(game.pending).toEqual({ kind: 'encounters', familyUids: [], governor: 'available', smuggler: true });
  expect(game.players[0].merchantPlace).toBe(12);
}

describe('merchant encounters after Police Station family actions', () => {
  it.each([false, true])('offers station encounters after warehouse fill (automatic: %s)', (automatic) => {
    const { game, act } = station();
    act('place/action-taken', { choice: { kind: 'police-send', destination: 3 }, directAction: automatic });
    if (!automatic) act('place/action-taken', { choice: { kind: 'warehouse-fill', good: 'spice' } });
    expect(game.players[0].goods.spice).toBe(game.players[0].capacity);
    expectStationEncounters(game);
  });

  it('does not offer the family member encounters at its destination', () => {
    const { game, act } = station();
    game.governorPlace = 3; game.smugglerPlace = 3;
    act('place/action-taken', { choice: { kind: 'police-send', destination: 3 }, directAction: true });
    expect(game.phase).toBe('turn-end');
    expect(game.pending).toBeNull();
  });

  it.each(['skip', 'decline', 'buy'])('offers encounters after warehouse extra: %s', (followup) => {
    const { game, act } = station();
    game.players[0].mosqueTileIds = ['mosque-spice-2'];
    act('place/action-taken', { choice: { kind: 'police-send', destination: 3 }, directAction: true });
    expect(game.pending?.kind).toBe('warehouse-extra');
    if (followup === 'skip') act('turn/ended', { directAction: true });
    else act('mosque/ability-used', { choice: { kind: 'warehouse-extra', good: followup === 'buy' ? 'fabric' : null } });
    expectStationEncounters(game);
  });

  it.each([false, true])('offers encounters after Tea House dice (adjustment: %s)', (adjustment) => {
    const { game, act } = station();
    if (adjustment) game.players[0].mosqueTileIds = ['mosque-fabric-2'];
    act('place/action-taken', { choice: { kind: 'police-send', destination: 9 } });
    act('place/action-taken', { choice: { kind: 'tea-house-wager', wager: 7 } });
    if (adjustment) act('mosque/ability-used', { choice: { kind: 'dice-adjust', adjustment: 'none' } });
    expectStationEncounters(game);
  });

  it('offers encounters after the required Caravansary discard', () => {
    const { game, act } = station();
    act('place/action-taken', { choice: { kind: 'police-send', destination: 6 } });
    act('place/action-taken', { choice: { kind: 'caravansary-draw', drawSources: ['deck', 'deck'] } });
    expect(game.pending?.kind).toBe('caravansary-discard');
    act('place/action-taken', { choice: { kind: 'caravansary-discard', discardCardId: game.players[0].bonusHand[0] } });
    expectStationEncounters(game);
  });

  it('offers encounters even when the family destination action is skipped', () => {
    const { game, act } = station();
    act('place/action-taken', { choice: { kind: 'police-send', destination: 14 } });
    act('turn/ended', { directAction: true });
    expectStationEncounters(game);
  });

  it('preserves completed legacy turns on replay', () => {
    const { game, act } = station();
    act('place/action-taken', { choice: { kind: 'police-send', destination: 3 }, directAction: true }, false);
    expect(game.phase).toBe('turn-end');
    act('turn/ended', { directAction: true }, false);
    expect(game.turnSeat).toBe(1);
    expect(game.encounterLog).toEqual([]);
  });
});
