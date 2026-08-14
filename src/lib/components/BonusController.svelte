<script lang="ts">
  import { bonusCards, type Good } from '$lib/game/manifests';
  import { previewCaravansary, type CardSource, type PlaceActionChoice } from '$lib/game/actions';
  import type { BonusChoice } from '$lib/game/bonus';
  import { requiredAssistantAction } from '$lib/game/movement';
  import { currentSultanCost } from '$lib/game/ruby-routes';
  import type { GameSetup } from '$lib/game/setup';
  import type { ReplayProjection } from '$lib/game/protocol';
  import GameArt from './GameArt.svelte';

  let {
    game,
    userUid,
    selectedBonus,
    onInspectBonus,
    onPlayBonus,
    onTakePrivateAction,
    onResolvePrivateEncounter,
    onUndo,
    undo,
    undoLog,
    undoPending = false
  }: {
    game: GameSetup;
    userUid: string;
    selectedBonus: string | null;
    onInspectBonus: (cardId: string) => void;
    onPlayBonus: (cardId: string, choice: BonusChoice) => void;
    onTakePrivateAction: (choice: PlaceActionChoice) => void;
    onResolvePrivateEncounter: (cardId: string) => void;
    onUndo: () => void;
    undo: ReplayProjection['undo'];
    undoLog: ReplayProjection['undoLog'];
    undoPending?: boolean;
  } = $props();

  const bonusById = new Map(bonusCards.map((card) => [card.id, card]));
  const player = $derived(game.players.find(({ uid }) => uid === userUid)!);
  const currentPlayer = $derived(game.players[game.turnSeat]);
  const selected = $derived(selectedBonus ? bonusById.get(selectedBonus) : null);
  const isCurrent = $derived(currentPlayer.uid === userUid);
  const goodNames: Record<Good, string> = { fabric: 'Fabric', spice: 'Spice', fruit: 'Fruit', jewelry: 'Jewelry' };
  const stayAction = $derived(requiredAssistantAction(player, player.merchantPlace));
  const sultanCost = $derived(currentSultanCost(game));
  const sultanWildCount = $derived(sultanCost.filter((good) => good === 'any').length);
  let bonusGood = $state<Good>('jewelry');
  let familyReward = $state<'lira' | 'bonus'>('lira');
  let assistantPlace = $state(1);
  let sultanWildGoods = $state<Good[]>([]);
  let caravanSources = $state<[CardSource, CardSource]>(['deck', 'deck']);
  let caravanRevealed = $state(false);
  let caravanDiscard = $state('');
  const caravanPreview = $derived(previewCaravansary(game, caravanSources) ?? []);
  const privateActionPlace = $derived(game.phase === 'family-action' && game.pending?.kind === 'family-action' ? game.pending.destination : currentPlayer.merchantPlace);
  const atCaravansary = $derived(isCurrent && (game.phase === 'action' || game.phase === 'family-action') && privateActionPlace === 6);
  const governorCardPayment = $derived(isCurrent && game.phase === 'encounters' && game.pending?.kind === 'encounters' && game.pending.governor === 'payment');
  const canUndo = $derived(Boolean(undo && undo.actorUid === userUid && !undo.blockedReason && !undoPending));
  const undoText = $derived(!undo ? 'Nothing to undo' : undo.blockedReason ? `Undo locked · ${undo.blockedReason}` : undo.actorUid === userUid ? `Undo ${undo.label}` : 'Waiting for the tabletop action');
  const undoButtonText = $derived(undo?.blockedReason ? '↶ Locked' : '↶ Undo');
  const privateStatus = $derived(undo?.blockedReason ? `Undo locked · ${undo.blockedReason}` : undo?.actorUid === userUid ? `Can undo · ${undo.label}` : undoLog.length ? `Last log: Undid ${undoLog.at(-1)?.label}` : isCurrent ? `${game.phase.replace('-', ' ')} · make public choices on the tabletop` : `${currentPlayer.name} is using the tabletop`);

  function setCaravanSource(index: 0 | 1, source: CardSource) {
    caravanSources = index === 0 ? [source, caravanSources[1]] : [caravanSources[0], source];
    caravanRevealed = false;
    caravanDiscard = '';
  }

  function keepCaravanCards() {
    onTakePrivateAction({ kind: 'caravansary-trade', drawSources: caravanSources, discardCardId: caravanDiscard });
    caravanRevealed = false;
    caravanDiscard = '';
  }

  function setSultanWild(index: number, good: Good) {
    sultanWildGoods = Array.from({ length: sultanWildCount }, (_, slot) => slot === index ? good : sultanWildGoods[slot] ?? 'fabric');
  }
</script>

<section class="private-controller" aria-labelledby="private-title" data-e2e-fit data-e2e-no-scroll>
  <header>
    <div><p>Private phone · {player.name}</p><button class="private-undo" aria-label={undoText} disabled={!canUndo} onclick={onUndo}>{undoButtonText}</button></div>
    <h1 id="private-title">Your Bonus cards</h1>
    <span>{privateStatus}</span>
  </header>

  <div class="private-workspace" data-e2e-fit data-e2e-no-scroll>
    <nav class="private-hand" aria-label="Private Bonus hand" data-e2e-no-scroll>
      {#each player.bonusHand as cardId}
        {@const card = bonusById.get(cardId)!}
        <button aria-label={`Inspect Bonus card: ${card.title}`} aria-pressed={selectedBonus === cardId} onclick={() => onInspectBonus(cardId)}>
          <GameArt kind="card" effect={card.effect} class="hand-art" /><span>Bonus</span><strong>{card.title}</strong>
        </button>
      {:else}<p>No Bonus cards in hand.</p>{/each}
    </nav>

    <article class="private-decision" data-e2e-no-scroll>
      {#if atCaravansary}
        <p class="kicker">Private Caravansary choice</p><h2>Draw two, then discard one</h2>
        <p>Choose both sources before any face-down card is revealed.</p>
        <div class="caravan-sources">
          {#each [0, 1] as index}<label>Card {index + 1}<select aria-label={`${index === 0 ? 'First' : 'Second'} card source`} value={caravanSources[index]} onchange={(event) => setCaravanSource(index as 0 | 1, event.currentTarget.value as CardSource)}><option value="deck">Face-down draw pile</option><option value="discard" disabled={game.bonusDiscard.length < caravanSources.slice(0, index).filter((source) => source === 'discard').length + 1}>Face-up discard pile</option></select></label>{/each}
        </div>
        {#if caravanRevealed}
          <div class="revealed" aria-label="Revealed chosen cards">{#each caravanPreview as cardId}<span><GameArt kind="card" effect={bonusById.get(cardId)?.effect} /><strong>{bonusById.get(cardId)?.title}</strong></span>{/each}</div>
          <fieldset><legend>Discard one card</legend>{#each [...player.bonusHand, ...caravanPreview] as cardId}<label><input type="radio" name="private-caravan-discard" value={cardId} checked={caravanDiscard === cardId} onchange={() => caravanDiscard = cardId} />{bonusById.get(cardId)?.title}</label>{/each}</fieldset>
          <button class="primary" disabled={!caravanDiscard} onclick={keepCaravanCards}>Keep two and discard selected</button>
        {:else}<button class="primary" onclick={() => caravanRevealed = true}>Reveal 2 chosen cards privately</button>{/if}
      {:else if governorCardPayment}
        <p class="kicker">Private Governor payment</p><h2>Discard a Bonus card</h2><p>The tabletop can pay 2 Lira. Choose here only if you prefer to discard privately.</p>
        <div class="card-payments">{#each player.bonusHand as cardId}<button class="primary" onclick={() => onResolvePrivateEncounter(cardId)}>Discard {bonusById.get(cardId)?.title}</button>{/each}</div>
      {:else if selected}
        <p class="kicker">Selected Bonus card</p><h2>{selected.title}</h2><div class="large-card"><GameArt kind="card" effect={selected.effect} class="card-art" /><strong>{selected.title}</strong><p>{selected.text}</p></div>
        {#if isCurrent}
          {#if selected.effect === 'gain-good'}<label>Good to gain<select value={bonusGood} onchange={(event) => bonusGood = event.currentTarget.value as Good}>{#each Object.keys(goodNames) as good}<option value={good} disabled={player.goods[good as Good] >= player.capacity}>{goodNames[good as Good]}</option>{/each}</select></label><button class="primary" disabled={!['action', 'family-action', 'turn-end', 'final-bonus'].includes(game.phase) || player.goods[bonusGood] >= player.capacity} onclick={() => onPlayBonus(selected.id, { kind: 'gain-good', good: bonusGood })}>Play to gain 1 {bonusGood}</button>
          {:else if selected.effect === 'gain-lira'}<button class="primary" disabled={!['movement', 'action', 'family-action', 'turn-end', 'final-bonus'].includes(game.phase)} onclick={() => onPlayBonus(selected.id, { kind: 'gain-lira' })}>Play to gain 5 Lira</button>
          {:else if selected.effect === 'return-family'}<label>Reward<select value={familyReward} onchange={(event) => familyReward = event.currentTarget.value as 'lira' | 'bonus'}><option value="lira">3 Lira</option><option value="bonus">1 Bonus card</option></select></label><button class="primary" disabled={player.familyPlace === 12} onclick={() => onPlayBonus(selected.id, { kind: 'return-family', reward: familyReward })}>Return family to Police</button>
          {:else if selected.effect === 'return-assistant'}<label>Assistant<select value={assistantPlace} onchange={(event) => assistantPlace = Number(event.currentTarget.value)}>{#each Object.keys(player.assistantsByPlace) as place}<option value={place}>Place {place}</option>{/each}</select></label><button class="primary" disabled={game.phase !== 'movement' || !Object.keys(player.assistantsByPlace).length} onclick={() => onPlayBonus(selected.id, { kind: 'return-assistant', place: assistantPlace })}>Return selected assistant</button>
          {:else if selected.effect === 'long-move'}<button class="primary" disabled={game.phase !== 'movement' || game.activeBonusEffects.includes('long-move')} onclick={() => onPlayBonus(selected.id, { kind: 'long-move' })}>Enable a 3–4 Place move</button>
          {:else if selected.effect === 'stay'}<button class="primary" disabled={game.phase !== 'movement' || player.merchantPlace === 7 || !stayAction || stayAction === 'fountain'} onclick={() => onPlayBonus(selected.id, { kind: 'stay' })}>{stayAction === 'pick-up' ? 'Stay and pick up assistant' : 'Stay and leave assistant'}</button>
          {:else if selected.effect === 'wild-small-market'}<button class="primary" disabled={game.phase !== 'action' || player.merchantPlace !== 11} onclick={() => onPlayBonus(selected.id, { kind: 'wild-small-market' })}>Enable flexible Small Market demand</button>
          {:else if selected.effect === 'repeat-post'}<button class="primary" disabled={game.phase !== 'turn-end' || game.lastAction?.place !== 5} onclick={() => onPlayBonus(selected.id, { kind: 'repeat-action' })}>Repeat Post Office</button>
          {:else if selected.effect === 'repeat-gemstone'}<button class="primary" disabled={game.phase !== 'turn-end' || game.lastAction?.place !== 16 || player.lira < game.rubyTracks.gemstonePrice} onclick={() => onPlayBonus(selected.id, { kind: 'repeat-action' })}>Repeat Gemstone Dealer</button>
          {:else if selected.effect === 'repeat-sultan'}{#each Array.from({ length: sultanWildCount }) as _, index}<label>Wild good {index + 1}<select value={sultanWildGoods[index] ?? 'fabric'} onchange={(event) => setSultanWild(index, event.currentTarget.value as Good)}>{#each Object.keys(goodNames) as good}<option value={good}>{goodNames[good as Good]}</option>{/each}</select></label>{/each}<button class="primary" disabled={game.phase !== 'turn-end' || game.lastAction?.place !== 13 || sultanWildGoods.length !== sultanWildCount} onclick={() => onPlayBonus(selected.id, { kind: 'repeat-action', wildGoods: sultanWildGoods })}>Repeat Sultan’s Palace</button>{/if}
        {:else}<p class="waiting">Bonus cards can be played only during your turn.</p>{/if}
      {:else}
        <p class="kicker">Private information only</p><h2>Select a Bonus card</h2><p>Your phone never renders the bazaar board or public action controls. Pass it only when you need to inspect or play a private card.</p>
      {/if}
    </article>
  </div>
</section>

<style>
  .private-controller { height: 100%; min-height: 0; display: flex; flex-direction: column; gap: .65rem; color: #fffaf0; }
  header { padding: .7rem 1rem; border: 1px solid #efca7d66; border-radius: 1rem; background: linear-gradient(110deg, #11383b, #205954); } header > div { display: flex; align-items: center; justify-content: space-between; gap: .5rem; } header p, header span { margin: 0; color: #efca7d; font-size: .64rem; } header p { font-weight: 700; letter-spacing: .12em; text-transform: uppercase; } h1 { margin: .1rem 0; font: 700 2rem/.95 'Cormorant Garamond', serif; }.private-undo { min-height: 1.75rem; padding: .2rem .55rem; border: 1px solid #efca7d; border-radius: .4rem; color: #173f43; background: #efca7d; font-size: .58rem; font-weight: 700; white-space: nowrap; }.private-undo:disabled { border-color: #ffffff33; color: #a6bab5; background: #ffffff0d; }
  .private-workspace { min-height: 0; flex: 1; display: grid; grid-template-rows: auto minmax(0, 1fr); gap: .55rem; }
  .private-hand { min-height: 5.1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); gap: .45rem; padding: .45rem; overflow: hidden; border: 1px solid #c98948; border-radius: .75rem; background: #24170f; }.private-hand button { min-width: 0; display: grid; grid-template-columns: 2.8rem 1fr; grid-template-rows: auto 1fr; gap: .15rem .4rem; align-items: center; overflow: hidden; padding: .3rem; border: 1px solid #c98948; border-radius: .5rem; color: #fffaf0; text-align: left; background: #173f43; }.private-hand button[aria-pressed='true'] { outline: 2px solid #efca7d; }.private-hand :global(.hand-art) { grid-row: 1 / 3; width: 2.8rem; height: 3.8rem; border-radius: .25rem; }.private-hand span { color: #efca7d; font-size: .5rem; text-transform: uppercase; }.private-hand strong { overflow: hidden; font-size: .67rem; text-overflow: ellipsis; }.private-hand p { margin: auto; color: #cabda8; font-size: .75rem; }
  .private-decision { min-height: 0; overflow: hidden; padding: .8rem; border-radius: .9rem; color: #173f43; background: #fffaf0; }.kicker { margin: 0; color: #a43b32; font-size: .6rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }.private-decision h2 { margin: .2rem 0 .5rem; font: 700 1.55rem 'Cormorant Garamond', serif; }.private-decision > p:not(.kicker), .large-card p { font-size: .7rem; line-height: 1.3; }.large-card { position: relative; min-height: 9rem; display: grid; align-content: end; overflow: hidden; padding: .7rem; border-radius: .65rem; color: #fff; background: #173f43; }.large-card::after { position: absolute; inset: 0; background: linear-gradient(transparent, #09292dee); content: ''; }.large-card :global(.card-art) { position: absolute; inset: 0; width: 100%; height: 100%; }.large-card strong, .large-card p { position: relative; z-index: 1; margin: .2rem 0; text-shadow: 0 1px 2px #000; }.large-card strong { font: 700 1.25rem 'Cormorant Garamond', serif; }
  label, fieldset { display: grid; gap: .25rem; margin-top: .5rem; font-size: .65rem; font-weight: 700; } select { width: 100%; min-height: 2.5rem; padding: .4rem; border: 1px solid #b99a6b; border-radius: .4rem; background: #fff; }.primary { width: 100%; min-height: 2.8rem; margin-top: .55rem; border: 0; border-radius: .5rem; color: #fff; background: #267356; font-weight: 700; }.primary:disabled { opacity: .4; }.caravan-sources { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; }.revealed { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; margin-top: .5rem; }.revealed span { min-width: 0; display: grid; grid-template-columns: 2.3rem 1fr; gap: .35rem; align-items: center; padding: .3rem; border: 1px solid #d4bd91; border-radius: .4rem; }.revealed :global(.game-art) { width: 2.3rem; height: 3rem; }.revealed strong { overflow: hidden; font-size: .6rem; }.card-payments { display: grid; gap: .35rem; }.waiting { color: #6d7c79; }
  @media (max-height: 700px) { h1 { font-size: 1.55rem; }.private-hand { min-height: 4rem; }.private-hand :global(.hand-art) { width: 2rem; height: 2.7rem; }.private-decision { padding: .55rem; }.large-card { min-height: 6rem; }.large-card p { display: none; } }
</style>
