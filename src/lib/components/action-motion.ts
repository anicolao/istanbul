import type { GameSetup, SetupPlayer } from '$lib/game/setup';
import {
  bonusCards,
  demandTiles,
  mosqueTiles,
  type Good
} from '$lib/game/manifests';
import { componentArt, pieceArt } from '$lib/game/art';
import { postOfficeRows, type PlaceActionChoice } from '$lib/game/actions';
import { currentSultanCost } from '$lib/game/ruby-routes';

export type Anchor = {
  uid?: string;
  place?: number;
  selector?: string;
  board?: boolean;
  index?: number;
};
export type Patch = { path: (string | number)[]; value: unknown };
export interface MotionStep {
  id: number;
  stage: 'board' | 'room';
  delay: number;
  duration: number;
  from: Anchor;
  to: Anchor;
  art?: string;
  card?: string;
  faceDown?: boolean;
  amount?: number;
  badge?: number;
  patches: Patch[];
  effect?: 'fade' | 'block' | 'pulse' | 'dice';
  dice?: [number, number];
  oldDice?: [number, number];
  adjustDie?: boolean;
  block?: [boolean, boolean];
  fade?: boolean;
  hideSource?: boolean;
}
export interface ActionMotion {
  before: GameSetup;
  after: GameSetup;
  steps: MotionStep[];
  place: number;
  reverse: boolean;
}
const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
const visualFields = [
  'merchantPlace',
  'assistantsCarried',
  'assistantsByPlace',
  'assistantsInSupply',
  'familyPlace',
  'goods',
  'capacity',
  'extensions',
  'lira',
  'rubies',
  'mosqueTileIds',
  'bonusHand'
] as const;
export function coinBundles(amount: number): number[] {
  const result: number[] = [];
  for (const denomination of [10, 5, 1])
    while (amount >= denomination) {
      result.push(denomination);
      amount -= denomination;
    }
  return result;
}
function setPath(object: unknown, path: (string | number)[], value: unknown) {
  let at = object as Record<string | number, unknown>;
  for (const key of path.slice(0, -1)) at = at[key] as typeof at;
  at[path.at(-1)!] = structuredClone(value);
}
export function projectMotion(
  plan: ActionMotion,
  completed: ReadonlySet<number>
): GameSetup {
  const view = structuredClone(plan.after);
  for (const p of view.players) {
    const old = plan.before.players.find((a) => a.uid === p.uid);
    if (old) for (const key of visualFields) setPath(p, [key], old[key]);
  }
  for (const key of [
    'governorPlace',
    'smugglerPlace',
    'postOfficeLower',
    'largeDemand',
    'smallDemand',
    'mosqueStacks',
    'rubyTracks',
    'bonusDiscard',
    'bonusDrawPile',
    'activeBonusEffects'
  ] as const)
    setPath(view, [key], plan.before[key]);
  if (plan.reverse) {
    view.largeDemand = structuredClone(plan.after.largeDemand);
    view.smallDemand = structuredClone(plan.after.smallDemand);
    view.rubyTracks = structuredClone(plan.after.rubyTracks);
    view.mosqueStacks = structuredClone(plan.after.mosqueStacks);
  }
  for (const step of plan.steps)
    if (completed.has(step.id))
      for (const patch of step.patches) setPath(view, patch.path, patch.value);
  for (const p of view.players)
    for (const [place, count] of Object.entries(p.assistantsByPlace))
      if (!count) delete p.assistantsByPlace[Number(place)];
  return view;
}
export function planActionMotion(
  before: GameSetup,
  after: GameSetup,
  reverse = false,
  choice?: PlaceActionChoice
): ActionMotion {
  const actor = after.players[after.turnSeat];
  const action = after.lastAction;
  const encounter =
    after.encounterLog.length > before.encounterLog.length
      ? after.encounterLog.at(-1)
      : undefined;
  const bonus =
    after.bonusLog.length > before.bonusLog.length
      ? after.bonusLog.at(-1)
      : undefined;
  const place = reverse
    ? (before.lastAction?.place ??
      before.players[before.turnSeat].merchantPlace)
    : after.pending?.kind === 'family-action'
      ? after.pending.destination
      : after.pending?.kind === 'dice-adjust' ||
          after.pending?.kind === 'warehouse-extra'
        ? after.pending.actionPlace
        : action?.playerUid === actor.uid && after.phase !== 'movement'
          ? action.place
          : actor.merchantPlace;
  const plan: ActionMotion = { before, after, steps: [], place, reverse };
  const room = (selector = '[data-component-source]', at = place): Anchor => ({
    place: at,
    selector
  });
  const mat = (uid: string, selector: string): Anchor => ({ uid, selector });
  const piece = (p: SetupPlayer, kind: string, at: number): Anchor => ({
    place: at,
    board: true,
    selector: `[data-owner-uid="${p.uid}"][data-piece-kind="${kind}"]`
  });
  const patch = (
    index: number,
    key: string,
    value: unknown,
    sub?: string | number
  ): Patch => ({
    path: ['players', index, key, ...(sub === undefined ? [] : [sub])],
    value
  });
  const add = (
    step: Omit<MotionStep, 'id' | 'duration' | 'delay' | 'stage'> &
      Partial<Pick<MotionStep, 'duration' | 'delay' | 'stage'>>
  ) => {
    plan.steps.push({
      duration: 1000,
      delay: 0,
      stage: 'room',
      ...step,
      id: plan.steps.length
    });
  };
  const actionChanged =
    JSON.stringify(before.lastAction) !== JSON.stringify(after.lastAction);
  const kind = reverse ? before.lastAction?.kind : action?.kind;
  const purchase =
    (actionChanged || reverse) &&
    ['sultan-buy', 'mosque-take', 'gemstone-buy', 'wainwright-buy'].includes(
      kind ?? ''
    );
  const market = kind === 'market-sell' && !encounter && !bonus;
  const post =
    kind === 'post-office-collect' &&
    !encounter &&
    (!bonus ||
      bonusCards.find((c) => c.id === bonus.cardId)?.effect === 'repeat-post');
  const dice =
    after.pending?.kind === 'dice-adjust'
      ? after.pending.originalDice
      : after.lastRoll?.dice;
  const oldDice =
    before.pending?.kind === 'dice-adjust'
      ? before.pending.originalDice
      : before.lastRoll?.dice;
  const keptRoll =
    before.pending?.kind === 'dice-adjust' &&
    after.lastAction?.summary.endsWith('Kept the original roll.');
  const rolled =
    !reverse &&
    !keptRoll &&
    (encounter?.dice ||
      (dice &&
        (JSON.stringify(dice) !== JSON.stringify(oldDice) ||
          (actionChanged && [8, 9].includes(place)) ||
          (before.pending?.kind !== 'dice-adjust' &&
            after.pending?.kind === 'dice-adjust'))));
  const dieResult = encounter?.dice || dice;
  let roomDelay = rolled ? 1000 : 0;
  if (rolled && dieResult)
    add({
      from: room(),
      to: room(),
      effect: 'dice',
      dice: dieResult,
      oldDice,
      adjustDie:
        before.pending?.kind === 'dice-adjust' &&
        !!after.lastAction?.summary.match(
          /Used the red Mosque ability: (first|second) to four/
        ),
      patches: [],
      duration: 1000
    });
  const movement = after.players.some(
    (p) =>
      p.merchantPlace !==
      before.players.find((q) => q.uid === p.uid)?.merchantPlace
  );
  const movingFamily = after.players.some(
    (p) =>
      p.familyPlace !== before.players.find((q) => q.uid === p.uid)?.familyPlace
  );
  const boardStage = movement || movingFamily;
  const oldActor = before.players.find((p) => p.uid === actor.uid)!;
  const demand = demandTiles.find(
    (d) =>
      d.id ===
      (place === 10
        ? (reverse ? after : before).largeDemand[0]
        : (reverse ? after : before).smallDemand[0])
  );
  const usedDemand = new Set<number>();
  const usedSultan = new Set<number>();
  const cost = currentSultanCost(reverse ? after : before);
  const payments = goods.reduce(
    (n, g) => n + Math.max(0, oldActor.goods[g] - actor.goods[g]),
    0
  );
  const rewardDelay =
    roomDelay + (purchase ? Math.max(0, payments - 1) * 200 + 500 : 0);
  let goodOrder = 0;
  for (let pi = 0; pi < after.players.length; pi++) {
    const p = after.players[pi],
      old = before.players.find((q) => q.uid === p.uid);
    if (!old) continue;
    if (p.merchantPlace !== old.merchantPlace) {
      add({
        stage: 'board',
        from: piece(old, 'merchant', old.merchantPlace),
        to: { place: p.merchantPlace, board: true, selector: '.merchants' },
        art: pieceArt.merchant[p.color],
        badge: old.assistantsCarried,
        hideSource: true,
        patches: [patch(pi, 'merchantPlace', p.merchantPlace)]
      });
    }
    let assistantDelay = movement ? 1000 : 0;
    let carried = old.assistantsCarried;
    for (const at of new Set(
      [
        ...Object.keys(old.assistantsByPlace),
        ...Object.keys(p.assistantsByPlace)
      ].map(Number)
    )) {
      const a = old.assistantsByPlace[at] ?? 0,
        b = p.assistantsByPlace[at] ?? 0;
      for (let i = 0; i < Math.abs(b - a); i++) {
        const returning = b < a;
        carried += returning ? 1 : -1;
        add({
          stage: 'board',
          delay: assistantDelay,
          from: returning
            ? piece(old, 'assistant', at)
            : piece(p, 'merchant', p.merchantPlace),
          to: returning
            ? piece(p, 'merchant', p.merchantPlace)
            : { place: at, board: true, selector: '.workers' },
          art: pieceArt.assistant[p.color],
          hideSource: returning,
          patches: [
            patch(
              pi,
              'assistantsByPlace',
              a + (returning ? -1 : 1) * (i + 1),
              at
            ),
            patch(pi, 'assistantsCarried', carried)
          ]
        });
        assistantDelay += 200;
      }
    }
    if (p.assistantsInSupply !== old.assistantsInSupply) {
      const gaining = p.assistantsInSupply < old.assistantsInSupply;
      const supply = room('[data-mosque-power="jewelry"] .power-art', 15),
        merchant = { ...piece(p, 'merchant', p.merchantPlace), board: false };
      add({
        from: gaining ? supply : merchant,
        to: gaining ? merchant : supply,
        art: pieceArt.assistant[p.color],
        delay: rewardDelay + 300,
        patches: [
          patch(pi, 'assistantsCarried', p.assistantsCarried),
          patch(pi, 'assistantsInSupply', p.assistantsInSupply)
        ]
      });
    }
    if (p.familyPlace !== old.familyPlace) {
      add({
        stage: 'board',
        from: piece(old, 'family', old.familyPlace),
        to: { place: p.familyPlace, board: true, selector: '.workers' },
        art: pieceArt.family[p.color],
        hideSource: true,
        patches: [patch(pi, 'familyPlace', p.familyPlace)]
      });
    }
    for (const g of goods) {
      const diff = p.goods[g] - old.goods[g];
      for (let i = 0; i < Math.abs(diff); i++) {
        const gain = diff > 0,
          slot = gain ? old.goods[g] + i : old.goods[g] - 1 - i;
        let origin = room(`[data-location-reward="${g}"]`);
        let fadeTarget: Anchor | undefined;
        if (market) {
          let di =
            choice?.kind === 'market-sell'
              ? (choice.slotIndexes.find(
                  (slot, index) =>
                    (choice.wildGoods?.[index] ?? demand?.goods[slot]) === g &&
                    !usedDemand.has(slot)
                ) ?? -1)
              : (demand?.goods.findIndex(
                  (x, j) => x === g && !usedDemand.has(j)
                ) ?? -1);
          if (di < 0)
            di = demand?.goods.findIndex((_, j) => !usedDemand.has(j)) ?? 0;
          usedDemand.add(di);
          origin = room(`[data-demand-slot="${di + 1}"]`);
          fadeTarget = origin;
        } else if (kind === 'sultan-buy' && !encounter) {
          let si = cost.findIndex((x, j) => x === g && !usedSultan.has(j));
          if (si < 0)
            si = cost.findIndex((x, j) => x === 'any' && !usedSultan.has(j));
          usedSultan.add(si);
          origin = room(`[data-sultan-slot="${si}"]`);
        } else if (kind === 'mosque-take' && !encounter)
          origin = room(`[data-mosque-payment="${g}"]`);
        else if (encounter?.kind === 'smuggler-trade')
          origin = room('[data-piece-kind="smuggler"]', before.smugglerPlace);
        else if (post) {
          const col = postOfficeRows.findIndex(
            (rows) =>
              rows[before.postOfficeLower[postOfficeRows.indexOf(rows)] ? 1 : 0]
                .good === g
          );
          origin = room(
            `[data-mail-column="${col}"] [data-mail-reward="${before.postOfficeLower[col] ? 1 : 0}"]`,
            5
          );
        } else if (bonus) origin = room('[data-card-pile="discard"]', 6);
        else if (place === 8) origin = room('.dice-legend');
        const mailColumn = post
          ? Number(origin.selector?.match(/data-mail-column="(\d+)"/)?.[1] ?? 0)
          : undefined;
        const delay = roomDelay + (mailColumn ?? goodOrder++) * 200;
        add({
          from: gain
            ? origin
            : mat(p.uid, `[data-good="${g}"] [data-goods-slot="${slot}"]`),
          to: gain
            ? mat(p.uid, `[data-good="${g}"] [data-goods-slot="${slot}"]`)
            : origin,
          art: componentArt[g],
          delay,
          patches: [
            patch(pi, 'goods', old.goods[g] + (gain ? 1 : -1) * (i + 1), g)
          ]
        });
        if (fadeTarget && !reverse)
          add({
            from: fadeTarget,
            to: fadeTarget,
            effect: 'fade',
            delay: delay + 1000,
            duration: 350,
            patches: []
          });
      }
    }
    // Direct toll payments go to their recipient instead of appearing from a supply.
    const toll =
      p.lira < old.lira &&
      after.players.some(
        (q) =>
          q.uid !== p.uid &&
          q.lira > (before.players.find((r) => r.uid === q.uid)?.lira ?? q.lira)
      );
    if (p.lira !== old.lira) {
      const gain = p.lira > old.lira;
      const payer = after.players.find(
        (q) =>
          q.uid !== p.uid &&
          q.lira < (before.players.find((r) => r.uid === q.uid)?.lira ?? q.lira)
      );
      let total = 0;
      const amount = Math.abs(p.lira - old.lira);
      const targets = toll
        ? after.players.filter(
            (q) =>
              q.uid !== p.uid &&
              q.lira >
                (before.players.find((r) => r.uid === q.uid)?.lira ?? q.lira)
          )
        : [];
      if (toll) {
        for (const recipient of targets) {
          const ri = after.players.indexOf(recipient),
            ro = before.players.find((q) => q.uid === recipient.uid)!;
          total += recipient.lira - ro.lira;
          add({
            stage: 'board',
            from: mat(p.uid, '[data-lira]'),
            to: mat(recipient.uid, '[data-lira]'),
            art: componentArt.lira,
            amount: recipient.lira - ro.lira,
            delay: (movement ? 1200 : 0) + targets.indexOf(recipient) * 200,
            patches: [
              patch(pi, 'lira', old.lira - total),
              patch(ri, 'lira', recipient.lira)
            ]
          });
        }
      }
      if (post) {
        const sourceGame = reverse ? after : before;
        const rewards = postOfficeRows.flatMap((rows, column) => {
          const reward = rows[sourceGame.postOfficeLower[column] ? 1 : 0];
          return reward.lira ? [{ column, amount: reward.lira }] : [];
        });
        for (const reward of rewards) {
          total += reward.amount;
          const origin = room(
            `[data-mail-column="${reward.column}"] [data-mail-reward="${sourceGame.postOfficeLower[reward.column] ? 1 : 0}"]`,
            5
          );
          add({
            from: gain ? origin : mat(p.uid, '[data-lira]'),
            to: gain ? mat(p.uid, '[data-lira]') : origin,
            art: componentArt.lira,
            amount: reward.amount,
            delay: reward.column * 200,
            patches: [patch(pi, 'lira', old.lira + (gain ? total : -total))]
          });
        }
      }
      if (!post && !(gain && payer))
        for (const bundle of coinBundles(amount - total)) {
          total += bundle;
          const origin =
            bonus && !purchase
              ? room('[data-card-pile="discard"]', 6)
              : encounter?.kind === 'catch-family'
                ? room('.workers')
                : before.pending?.kind === 'merchant-payment' &&
                    before.pending.neutralMerchantIds.length
                  ? room('[data-piece-kind="neutral-merchant"]')
                  : encounter
                    ? room(
                        `[data-piece-kind="${encounter.kind.startsWith('governor') ? 'governor' : 'smuggler'}"]`,
                        encounter.kind.startsWith('governor')
                          ? before.governorPlace
                          : before.smugglerPlace
                      )
                    : kind === 'gemstone-buy'
                      ? room('[data-price-step="0"] .cost')
                      : room(market ? '[data-market-coins]' : undefined);
          add({
            stage:
              !purchase && (movement || before.phase === 'merchant-payment')
                ? 'board'
                : 'room',
            from: gain ? origin : mat(p.uid, '[data-lira]'),
            to: gain ? mat(p.uid, '[data-lira]') : origin,
            art: componentArt.lira,
            amount: bundle,
            delay:
              (movement && !purchase ? 1200 : roomDelay) +
              (coinBundles(total).length - 1) * 200,
            patches: [patch(pi, 'lira', old.lira + (gain ? total : -total))]
          });
        }
    }
    for (const id of old.bonusHand.filter((id) => !p.bonusHand.includes(id))) {
      const isDrawUndo = reverse && after.bonusDrawPile.includes(id);
      add({
        from: mat(p.uid, '[data-card-tray]'),
        to: room(`[data-card-pile="${isDrawUndo ? 'deck' : 'discard'}"]`, 6),
        card: id,
        faceDown: isDrawUndo,
        delay: 0,
        patches: [
          patch(
            pi,
            'bonusHand',
            p.bonusHand.filter((id) => old.bonusHand.includes(id))
          ),
          { path: ['bonusDiscard'], value: after.bonusDiscard }
        ]
      });
    }
    let hand = [...old.bonusHand.filter((id) => p.bonusHand.includes(id))];
    for (const id of p.bonusHand.filter((id) => !old.bonusHand.includes(id))) {
      const faceUp = before.bonusDiscard.includes(id);
      hand = [...hand, id];
      add({
        from:
          encounter?.kind === 'governor-visit'
            ? room('[data-piece-kind="governor"]')
            : room(`[data-card-pile="${faceUp ? 'discard' : 'deck'}"]`, 6),
        to: mat(p.uid, '[data-card-tray]'),
        card: id,
        faceDown: !faceUp,
        delay:
          roomDelay + Math.max(0, hand.length - old.bonusHand.length - 1) * 200,
        patches: [
          patch(
            pi,
            'bonusHand',
            p.bonusHand.filter((id) => hand.includes(id))
          ),
          { path: ['bonusDiscard'], value: after.bonusDiscard },
          { path: ['bonusDrawPile'], value: after.bonusDrawPile }
        ]
      });
    }
    const changedPowers = [
      ...p.mosqueTileIds.filter((id) => !old.mosqueTileIds.includes(id)),
      ...old.mosqueTileIds.filter((id) => !p.mosqueTileIds.includes(id))
    ];
    for (const id of changedPowers) {
      const color = mosqueTiles.find((t) => t.id === id)!.color,
        gain = p.mosqueTileIds.includes(id);
      const origin = room(
          `[data-mosque-power="${color}"] .power-art`,
          ['fabric', 'spice'].includes(color) ? 14 : 15
        ),
        target = mat(p.uid, `[data-power-slot="${color}"]`);
      add({
        from: gain ? origin : target,
        to: gain ? target : origin,
        art: componentArt.mosque[color],
        delay: rewardDelay,
        patches: [patch(pi, 'mosqueTileIds', p.mosqueTileIds)]
      });
    }
    if (p.capacity !== old.capacity) {
      const gain = p.capacity > old.capacity;
      add({
        from: gain
          ? room('[data-wheelbarrow-source]', 1)
          : mat(p.uid, '[data-wheelbarrow]'),
        to: gain
          ? mat(p.uid, '[data-wheelbarrow]')
          : room('[data-wheelbarrow-source]', 1),
        art: componentArt.wheelbarrow,
        fade: true,
        delay: 500,
        patches: [
          patch(pi, 'capacity', p.capacity),
          patch(pi, 'extensions', p.extensions)
        ]
      });
    }
    for (let i = 0; i < Math.abs(p.rubies - old.rubies); i++) {
      const gain = p.rubies > old.rubies,
        slot = gain ? old.rubies + i : old.rubies - 1 - i;
      const origin = room(
        kind === 'sultan-buy'
          ? '.sultan-offer .ruby'
          : kind === 'gemstone-buy'
            ? '[data-price-step="0"] [data-gemstone-ruby]'
            : '[data-location-reward="ruby"]'
      );
      add({
        from: gain ? origin : mat(p.uid, `[data-ruby-slot="${slot}"]`),
        to: gain ? mat(p.uid, `[data-ruby-slot="${slot}"]`) : origin,
        art: componentArt.ruby,
        hideSource: gain && kind === 'gemstone-buy',
        delay:
          rewardDelay +
          (changedPowers.length || p.capacity !== old.capacity ? 500 : 0) +
          i * 200,
        patches: [patch(pi, 'rubies', old.rubies + (gain ? 1 : -1) * (i + 1))]
      });
    }
  }
  for (const npc of ['governor', 'smuggler'] as const) {
    const key = `${npc}Place` as const;
    if (before[key] !== after[key])
      add({
        stage: 'board',
        delay: encounter?.dice ? 1000 : 0,
        from: {
          place: before[key],
          selector: `[data-piece-kind="${npc}"]`,
          board: true
        },
        to: { place: after[key], selector: '.merchants', board: true },
        art: pieceArt[npc],
        hideSource: true,
        patches: [{ path: [key], value: after[key] }]
      });
  }
  before.postOfficeLower.forEach((lower, i) => {
    if (lower !== after.postOfficeLower[i])
      add({
        from: room(`[data-mail-column="${i}"] [data-mail-block]`, 5),
        to: room(`[data-mail-column="${i}"] [data-mail-block]`, 5),
        effect: 'block',
        block: [lower, after.postOfficeLower[i]],
        duration: 500,
        delay: reverse ? i * 200 : 1000 + i * 200,
        patches: [
          { path: ['postOfficeLower', i], value: after.postOfficeLower[i] }
        ]
      });
  });
  if (bonus) {
    const effect = bonusCards.find((c) => c.id === bonus.cardId)?.effect;
    if (effect && ['long-move', 'stay', 'wild-small-market'].includes(effect))
      add({
        from:
          effect === 'wild-small-market'
            ? room('.market-flow', 11)
            : mat(actor.uid, '[data-player-name]'),
        to: mat(actor.uid, '[data-player-name]'),
        effect: 'pulse',
        delay: 700,
        duration: 600,
        patches: [
          { path: ['activeBonusEffects'], value: after.activeBonusEffects }
        ]
      });
  }
  if (
    before.turnSeat !== after.turnSeat ||
    before.turnNumber !== after.turnNumber
  )
    add({
      from: mat(actor.uid, '[data-player-name]'),
      to: mat(actor.uid, '[data-player-name]'),
      effect: 'pulse',
      duration: 700,
      patches: []
    });
  // Resolve encounters on the board, never against the shrinking room overlay.
  // Payments land at the encounter before its visitor starts relocating.
  if (encounter?.dice) {
    for (const step of plan.steps) {
      step.stage = 'board';
      if (step.from.place) step.from.board = true;
      if (step.to.place) step.to.board = true;
      if (step.effect === 'dice') step.delay = 600;
      else if (step.art === pieceArt.governor || step.art === pieceArt.smuggler)
        step.delay = 1600;
      else step.delay = Math.max(0, step.delay - 1000);
    }
  }
  return plan;
}
