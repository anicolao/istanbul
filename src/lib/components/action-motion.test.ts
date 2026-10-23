import { describe, it, expect } from 'vitest';
import { componentArt } from '$lib/game/art';
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
    (s) => s.amount && s.art?.endsWith(componentArt.lira)
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

describe('arrival purchase sequencing', () => {
  for (const id of ['arrival-1', 'arrival-16']) {
    it(`${id}: zoom precedes payments and rewards`, () => {
      const { before, after } = transition(id);
      const plan = planActionMotion(before, after);
      const payments = plan.steps.filter(
        (s) => s.from.selector === '[data-lira]'
      );
      expect(payments.length).toBeGreaterThan(0);
      expect(payments.every((s) => s.stage === 'room')).toBe(true);
      expect(plan.steps.find((s) => s.badge !== undefined)?.stage).toBe(
        'board'
      );
    });
  }
  it('sends repeat-card payments to the dealer rather than the discard pile', () => {
    const { before, after } = transition('bonus-repeat-gemstone-1');
    const payments = planActionMotion(before, after).steps.filter((s) => s.from.selector === '[data-lira]');
    expect(payments.length).toBeGreaterThan(0);
    expect(payments.every((s) => s.to.place === 16 && s.to.selector === '[data-price-step="0"] .cost')).toBe(true);
  });
  it('takes the dealer ruby from the now row', () => {
    const { before, after } = transition('action-16');
    const flight = planActionMotion(before, after).steps.find((s) =>
      s.to.selector?.includes('data-ruby-slot')
    )!;
    expect(flight.from.selector).toBe(
      '[data-price-step="0"] [data-gemstone-ruby]'
    );
    expect(flight.hideSource).toBe(true);
  });
});

describe('encounter payments precede relocation', () => {
  it('keeps Tea House rewards separate from visitor interactions', () => {
    const { state, trigger } = fixture('tea-house-encounters', 4, 'shared-table', 6);
    let before = structuredClone(state.game!);
    expect(applyEvent(state, eventFor(state, trigger, 800))).toBe(true);
    const wager = planActionMotion(before, state.game!);
    expect(wager.steps.filter((s) => s.effect === 'dice')).toHaveLength(1);
    const result = structuredClone(state.game!.lastRoll);
    const choices = [
      { kind: 'governor-visit', accept: true },
      { kind: 'governor-pay', payment: 'lira' },
      { kind: 'smuggler-trade', accept: true, good: 'spice', payment: 'lira' }
    ];
    for (const [index, choice] of choices.entries()) {
      before = structuredClone(state.game!);
      expect(applyEvent(state, eventFor(state, {
        type: 'encounter/resolved', payload: { choice }
      }, 801 + index))).toBe(true);
      const plan = planActionMotion(before, state.game!);
      expect(state.game!.lastRoll).toEqual(result);
      expect(plan.steps.filter((s) => s.to.selector === '[data-lira]')).toHaveLength(0);
      const rolls = plan.steps.filter((s) => s.effect === 'dice');
      expect(rolls).toHaveLength(index === 0 ? 0 : 1);
      for (const roll of rolls) {
        expect(roll.stage).toBe('board');
        expect(roll.from.selector).toBe(`[data-piece-kind="${index === 1 ? 'governor' : 'smuggler'}"]`);
        expect(roll.dice).toEqual(state.game!.encounterLog.at(-1)!.dice);
      }
    }
  });
  for (const [id, npc] of [['governor-pay', 'governor'], ['smuggler', 'smuggler']] as const) {
    it(`${npc}: coins land on the original board tile before the visitor moves`, () => {
      const { before, after } = transition(id);
      const plan = planActionMotion(before, after);
      const oldPlace = before[`${npc}Place`];
      const newPlace = after[`${npc}Place`];
      expect(newPlace).not.toBe(oldPlace);
      const payments = plan.steps.filter((s) => s.from.selector === '[data-lira]');
      expect(payments).toHaveLength(2);
      const relocation = plan.steps.find((s) => s.art?.endsWith(`/${npc}-transparent.png`))!;
      for (const payment of payments) {
        expect(payment.to).toEqual({ place: oldPlace, selector: `[data-piece-kind="${npc}"]`, board: true });
        expect(payment.stage).toBe('board');
        expect(payment.delay + payment.duration).toBeLessThanOrEqual(relocation.delay);
      }
      expect(relocation.to.place).toBe(newPlace);
      for (const step of plan.steps) {
        if (step.from.place) expect(step.from.board).toBe(true);
        if (step.to.place) expect(step.to.board).toBe(true);
      }
    });
  }
});

for (const [id, npc] of [['governor-pay', 'governor'], ['smuggler', 'smuggler']] as const) {
  it(`${npc}: separate payment has no dice or NPC flight; explicit roll animates both`, () => {
    const { state, trigger } = fixture(id, 4, 'shared-table', 6);
    const before = structuredClone(state.game!);
    trigger.payload.separateRelocation = true;
    expect(applyEvent(state, eventFor(state, trigger, 900))).toBe(true);
    const paid = structuredClone(state.game!);
    const payment = planActionMotion(before, paid);
    expect(payment.steps.some(step => step.effect === 'dice')).toBe(false);
    expect(paid[`${npc}Place`]).toBe(before[`${npc}Place`]);
    expect(applyEvent(state, eventFor(state, { type: 'encounter/resolved', payload: { choice: { kind: `${npc}-roll` } } }, 901))).toBe(true);
    const roll = planActionMotion(paid, state.game!);
    expect(roll.steps.filter(step => step.effect === 'dice')).toHaveLength(1);
    expect(roll.steps.some(step => step.art?.endsWith(`/${npc}-transparent.png`))).toBe(true);
    expect(roll.steps.some(step => step.art?.endsWith(componentArt.lira))).toBe(false);
  });
}
