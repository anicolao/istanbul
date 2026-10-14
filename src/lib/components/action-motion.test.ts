import { describe, it, expect } from 'vitest';
import {
  fixture,
  scenarios,
  eventFor
} from '../../routes/dev/animations/scenarios';
import { applyEvent } from '$lib/game/reducer';
import { planActionMotion, projectMotion, coinBundles } from './action-motion';

function transition(id: string) {
  const { state, trigger } = fixture(id, 4, 'shared-table', 6);
  const before = structuredClone(state.game!);
  expect(applyEvent(state, eventFor(state, trigger, 900))).toBe(true);
  return { before, after: state.game! };
}
describe('action motion coverage', () => {
  for (const scenario of scenarios) {
    it(`${scenario.id}: arrivals reproduce resources and pieces in both directions`, () => {
      const { before, after } = transition(scenario.id);
      for (const reverse of [false, true]) {
        const a = reverse ? after : before,
          b = reverse ? before : after;
        const plan = planActionMotion(a, b, reverse);
        const result = projectMotion(
          plan,
          new Set(plan.steps.map((s) => s.id))
        );
        expect(result.players).toEqual(b.players);
        expect(result.governorPlace).toBe(b.governorPlace);
        expect(result.smugglerPlace).toBe(b.smugglerPlace);
        expect(plan.steps.every((s) => s.delay >= 0)).toBe(true);
      }
    });
  }
  it('preserves resources until landing', () => {
    const { before, after } = transition('action-13');
    const plan = planActionMotion(before, after);
    expect(projectMotion(plan, new Set()).players).toEqual(before.players);
  });
  it('assigns every Sultan payment a distinct cost slot', () => {
    const { before, after } = transition('action-13');
    const plan = planActionMotion(before, after);
    const payments = plan.steps.filter((s) =>
      s.to.selector?.includes('data-sultan-slot')
    );
    expect(payments).toHaveLength(6);
    expect(new Set(payments.map((s) => s.to.selector)).size).toBe(6);
  });
  it('shows explicit coin denominations whose sum is exact', () => {
    for (let n = 1; n <= 99; n++)
      expect(coinBundles(n).reduce((a, b) => a + b, 0)).toBe(n);
    expect(coinBundles(18)).toEqual([10, 5, 1, 1, 1]);
  });
  it('fades each sold market slot separately', () => {
    const { before, after } = transition('action-11');
    expect(
      planActionMotion(before, after).steps.filter((s) => s.effect === 'fade')
    ).toHaveLength(5);
  });
  it('includes fifth assistant and power on blue acquisition', () => {
    const { before, after } = transition('action-15');
    const plan = planActionMotion(before, after);
    expect(plan.steps.some((s) => s.art?.includes('assistant-'))).toBe(true);
    expect(
      plan.steps.some((s) => s.to.selector === '[data-power-slot="jewelry"]')
    ).toBe(true);
  });
});

it('keeping dice does not simulate another roll', () => {
  const { state } = fixture('red', 4, 'shared-table', 6);
  const before = structuredClone(state.game!);
  expect(
    applyEvent(
      state,
      eventFor(
        state,
        {
          type: 'mosque/ability-used',
          payload: { choice: { kind: 'dice-adjust', adjustment: 'none' } }
        },
        901
      )
    )
  ).toBe(true);
  expect(
    planActionMotion(before, state.game!).steps.some((s) => s.effect === 'dice')
  ).toBe(false);
});
it('changing a die uses a face adjustment, while reroll spins both', () => {
  for (const id of ['red', 'reroll']) {
    const { before, after } = transition(id);
    const dice = planActionMotion(before, after).steps.find(
      (s) => s.effect === 'dice'
    );
    expect(dice).toBeDefined();
    expect(Boolean(dice?.adjustDie)).toBe(id === 'red');
  }
});
it('Post Office coins originate in their own cubbies', () => {
  const { before, after } = transition('action-5');
  const coins = planActionMotion(before, after).steps.filter(
    (s) => s.amount && s.art?.endsWith('/lira.png')
  );
  expect(coins).toHaveLength(2);
  expect(coins.map((s) => s.from.selector)).toEqual([
    '[data-mail-column="1"] [data-mail-reward="1"]',
    '[data-mail-column="3"] [data-mail-reward="0"]'
  ]);
});

it('uses the selected demand well when matching goods repeat', () => {
  const { state } = fixture('action-11', 4, 'shared-table', 6);
  const before = structuredClone(state.game!);
  const choice = { kind: 'market-sell' as const, slotIndexes: [2] };
  expect(
    applyEvent(
      state,
      eventFor(state, { type: 'place/action-taken', payload: { choice } }, 902)
    )
  ).toBe(true);
  const plan = planActionMotion(before, state.game!, false, choice);
  expect(
    plan.steps.find((s) => s.to.selector?.includes('data-demand-slot'))?.to
      .selector
  ).toBe('[data-demand-slot="3"]');
});
