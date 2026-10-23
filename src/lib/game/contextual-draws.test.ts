import { describe, expect, it } from 'vitest';
import { drawBonus } from './encounters';
import { drawCaravansary, previewCaravansary } from './actions';
import { fixture, eventFor } from '../../routes/dev/animations/scenarios';
import { applyEvent, replayEvents } from './reducer';

function game() { return fixture('action-6', 2, 'personal-screens', 6).state.game!; }

describe('contextual face-down draws', () => {
  it('repeats exactly from the same state and does not affect dice randomness', () => {
    const a = game(), b = structuredClone(a);
    const seed = a.seed;
    expect(drawCaravansary(a, ['deck', 'deck'], true)).toEqual(drawCaravansary(b, ['deck', 'deck'], true));
    expect(a).toEqual(b);
    expect(a.seed).toBe(seed);
    expect(Object.values(a.bonusDrawCounts!)).toEqual([2]);
  });
  it('uses turn, player and action context, rather than a shared next card', () => {
    const baseline = game();
    const variants = [structuredClone(baseline), structuredClone(baseline), structuredClone(baseline), structuredClone(baseline)];
    variants[1].turnNumber++;
    variants[2].players[0].uid = 'another-player';
    const piles = variants.map((position, index) => {
      drawBonus(position, index === 3 ? 'family' : 'governor', true);
      return position.bonusDrawPile;
    });
    for (const pile of piles.slice(1)) expect(pile).not.toEqual(piles[0]);
  });
  it('increments draw indexes and keeps the source state unchanged when previewing', () => {
    const position = game();
    const before = structuredClone(position);
    const preview = previewCaravansary(position, ['deck', 'deck'], true);
    expect(position).toEqual(before);
    expect(drawCaravansary(position, ['deck', 'deck'], true)).toEqual(preview);
    expect(new Set(preview!).size).toBe(2);
    drawCaravansary(position, ['deck', 'deck'], true);
    expect(Object.values(position.bonusDrawCounts!)).toEqual([4]);
  });
  it('preserves face-up choices and recycles an exhausted draw pile deterministically', () => {
    const a = game();
    a.bonusDrawPile = [];
    a.bonusDiscard = ['bonus-gain-lira-1', 'bonus-gain-lira-2', 'bonus-return-family-1'];
    const b = structuredClone(a);
    expect(drawCaravansary(a, ['discard', 'deck'], true)).toEqual(drawCaravansary(b, ['discard', 'deck'], true));
    expect(a.bonusDiscard).toEqual([]);
    expect(a.bonusDrawPile).toHaveLength(1);
    const c = game();
    const faceUp = c.bonusDiscard.at(-1);
    expect(drawCaravansary(c, ['discard', 'deck'], true)![0]).toBe(faceUp);
    expect(Object.values(c.bonusDrawCounts!)).toEqual([1]);
  });
  it('does not mutate either pile or draw counters if the second source is unavailable', () => {
    const a = game();
    a.bonusDrawPile = [];
    a.bonusDiscard = ['only-card'];
    const before = structuredClone(a);
    expect(drawCaravansary(a, ['deck', 'discard'], true)).toBeNull();
    expect(a).toEqual(before);
    expect(drawBonus({ ...a, bonusDiscard: [] }, 'governor', true)).toBeNull();
  });
  it('leaves historical top-card draws unchanged', () => {
    const a = game();
    const top = a.bonusDrawPile[0];
    expect(drawBonus(a, 'governor')).toBe(top);
    expect(a.bonusDrawCounts).toBeUndefined();
  });
  it('routes Governor, Family Pardon and family rewards through contextual draws', () => {
    for (const scenario of ['governor', 'family-reward-review', 'family']) {
      const { state, trigger } = fixture(scenario, 2, 'personal-screens', 6);
      trigger.payload.drawContextVersion = 1;
      if (scenario === 'family-reward-review') trigger.payload.choice = { kind: 'return-family', reward: 'bonus' };
      expect(applyEvent(state, eventFor(state, trigger))).toBe(true);
      expect(Object.values(state.game!.bonusDrawCounts!)).toEqual([1]);
    }
  });
  it('replays an approved undo and repeat draw identically', () => {
    const { state } = fixture('action-6', 2, 'personal-screens', 6);
    const actor = state.game!.players[0].uid, other = state.game!.players[1].uid;
    function event(n: number, type: string, payload: Record<string, unknown>, uid = actor) {
      const e = eventFor(state, { type, payload }, n);
      e.actorUid = uid; e.id = `${uid}-${e.clientSeq}`; return e;
    }
    const draw = event(1, 'place/action-taken', { drawContextVersion: 1, choice: { kind: 'caravansary-draw', drawSources: ['deck', 'deck'] } });
    const drawn = replayEvents([draw], state);
    expect(drawn.diagnostics).toEqual([]);
    const history = [draw, event(2, 'undo/requested', { targetEventId: draw.id }),
      event(3, 'undo/voted', { requestId: `${actor}-000002`, approve: true }, other)];
    const restored = replayEvents(history, state);
    expect(restored.game).toEqual(state.game);
    expect(restored.diagnostics).toEqual([]);
    const repeated = replayEvents([...history, event(4, draw.type, draw.payload)], state);
    expect(repeated.game).toEqual(drawn.game);
  });
});
