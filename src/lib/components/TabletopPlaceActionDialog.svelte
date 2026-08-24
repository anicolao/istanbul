<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { marketRevenueFor, postOfficeRows, warehouseGood, type PlaceActionChoice } from '$lib/game/actions';
  import { demandTiles, mosqueTiles, places, type Good } from '$lib/game/manifests';
  import { ownsMosqueAbility } from '$lib/game/mosques';
  import { tablePositionNames, type TablePosition } from '$lib/game/protocol';
  import { currentSultanCost, sultanCostSequence } from '$lib/game/ruby-routes';
  import type { GameSetup, SetupPlayer } from '$lib/game/setup';
  import BonusCard from './BonusCard.svelte';
  import GameArt from './GameArt.svelte';
  import GemstoneOffer from './GemstoneOffer.svelte';
  import MarketDemand from './MarketDemand.svelte';
  import SultanOffer from './SultanOffer.svelte';
  import TeaHousePayoffs from './TeaHousePayoffs.svelte';

  let {
    game,
    player,
    placeId,
    tablePosition,
    boardIndex,
    onAction,
    onSkip,
    onClose
  }: {
    game: GameSetup;
    player: SetupPlayer;
    placeId: number;
    tablePosition?: TablePosition;
    boardIndex: number;
    onAction: (choice: PlaceActionChoice) => void;
    onSkip: () => void;
    onClose: () => void;
  } = $props();

  const goods = ['fabric', 'spice', 'fruit', 'jewelry'] as const;
  const basicGoods = ['fabric', 'spice', 'fruit'] as const;
  const goodNames: Record<Good, string> = { fabric: 'Fabric', spice: 'Spice', fruit: 'Fruit', jewelry: 'Jewelry' };
  const mosqueColorNames: Record<Good, string> = { fabric: 'Red', spice: 'Green', fruit: 'Yellow', jewelry: 'Blue' };
  let dialog = $state<HTMLElement>();
  let recallKeys = $state<string[]>([]);
  let marketSelection = $state<number[]>([]);
  let flexibleGoods = $state<Good[]>([]);
  let blackMarketGood = $state<(typeof basicGoods)[number]>('fabric');
  let teaWager = $state(7);
  let policeDestination = $state(1);
  let sultanWildGoods = $state<Good[]>([]);
  const place = $derived(places[placeId - 1]);
  const warehouse = $derived(warehouseGood(placeId));
  const orientation = $derived(tablePosition && tablePosition <= 3 ? 180 : tablePosition === 4 ? -90 : tablePosition === 8 ? 90 : 0);
  const sideFacing = $derived(Math.abs(orientation) === 90);
  const seatLabel = $derived(tablePosition ? tablePositionNames[tablePosition] : 'unassigned edge');
  const travelX = $derived(`${((boardIndex % 4) - 1.5) * 8}%`);
  const travelY = $derived(`${(Math.floor(boardIndex / 4) - 1.5) * 8}%`);
  const assistantOptions = $derived(Object.entries(player.assistantsByPlace).flatMap(([location, count]) => Array.from({ length: count }, (_, index) => ({ location: Number(location), key: `${location}-${index}` }))));
  const activeDemand = $derived(demandTiles.find(({ id }) => id === (placeId === 10 ? game.largeDemand[0] : game.smallDemand[0])));
  const flexibleMarket = $derived(placeId === 11 && game.activeBonusEffects.includes('wild-small-market'));
  const sultanCost = $derived(currentSultanCost(game));
  const nextSultanGood = $derived(sultanCostSequence[sultanCost.length]);
  const sultanWildCount = $derived(sultanCost.filter((good) => good === 'any').length);
  const resolvedSultanWildGoods = $derived(Array.from({ length: sultanWildCount }, (_, index) => sultanWildGoods[index] ?? 'fabric' as Good));
  const sultanPayment = $derived(goods.reduce<Record<Good, number>>((totals, good) => ({
    ...totals,
    [good]: sultanCost.filter((required) => required === good).length + resolvedSultanWildGoods.filter((wild) => wild === good).length
  }), { fabric: 0, spice: 0, fruit: 0, jewelry: 0 }));
  const sultanAffordable = $derived(goods.every((good) => player.goods[good] >= sultanPayment[good]));
  const marketPaymentGoods = $derived((activeDemand?.goods ?? []).map((good, index) => flexibleMarket ? flexibleGoods[index] ?? good : good));
  const marketLegal = $derived(isMarketLegal());

  onMount(async () => {
    await tick();
    dialog?.focus();
  });

  function toggleRecall(key: string) {
    recallKeys = recallKeys.includes(key) ? recallKeys.filter((candidate) => candidate !== key) : [...recallKeys, key];
  }

  function toggleMarket(index: number) {
    marketSelection = marketSelection.includes(index) ? marketSelection.filter((slot) => slot !== index) : [...marketSelection, index];
  }

  function setFlexibleGood(index: number, good: Good) {
    flexibleGoods = Array.from({ length: 5 }, (_, slot) => slot === index ? good : flexibleGoods[slot] ?? activeDemand?.goods[slot] ?? 'fabric');
  }

  function setSultanWild(index: number, good: Good) {
    sultanWildGoods = Array.from({ length: sultanWildCount }, (_, slot) => slot === index ? good : sultanWildGoods[slot] ?? 'fabric');
  }

  function isMarketLegal() {
    if (marketSelection.length < 1 || marketSelection.length > 5 || new Set(marketSelection).size !== marketSelection.length) return false;
    const used: Record<Good, number> = { fabric: 0, spice: 0, fruit: 0, jewelry: 0 };
    for (const index of marketSelection) {
      const good = marketPaymentGoods[index];
      if (!good) return false;
      used[good] += 1;
    }
    return goods.every((good) => used[good] <= player.goods[good]);
  }

  function sellMarket() {
    onAction({
      kind: 'market-sell',
      slotIndexes: marketSelection,
      ...(flexibleMarket ? { wildGoods: marketSelection.map((index) => marketPaymentGoods[index]) } : {})
    });
  }
</script>

<div
  class="room-overlay"
  role="presentation"
  onclick={(event) => { if (event.target === event.currentTarget) onClose(); }}
  onkeydown={(event) => { if (event.key === 'Escape') onClose(); }}
>
  <div
    bind:this={dialog}
    class:side-facing={sideFacing}
    class="room-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="room-dialog-title"
    tabindex="-1"
    style={`--player-orientation:${orientation}deg;--room-travel-x:${travelX};--room-travel-y:${travelY}`}
  >
    <GameArt kind="location" place={placeId} class="room-art" />
    <span class="room-scrim"></span>
    <header>
      <span class="place-number">{placeId}</span>
      <div><p>Active room · facing {seatLabel}</p><h2 id="room-dialog-title">{place.name}</h2></div>
      <span class="active-player"><GameArt kind="piece" piece="merchant" color={player.color} /><b>{player.name}</b></span>
    </header>

    <div class="control-stage">
      {#if placeId === 1}
        <div class="exchange-flow" aria-label="Wheelbarrow extension exchange">
          <span class="resource-card"><GameArt kind="component" component="lira" /><b>7</b><small>pay</small></span><i>→</i>
          <span class="resource-card"><GameArt kind="component" component="wheelbarrow" /><b>+1</b><small>capacity</small></span>
          <div class="extension-track" aria-label={`${player.extensions} of 3 extensions`}>{#each Array(3) as _, index}<span class:filled={index < player.extensions}><GameArt kind="component" component="wheelbarrow" /></span>{/each}</div>
        </div>
      {:else if warehouse}
        <div class="warehouse-flow">
          <div class="supply-pile" aria-label={`${goodNames[warehouse]} supply`}>{#each Array(Math.max(3, player.capacity - player.goods[warehouse])) as _}<GameArt kind="component" component={warehouse} />{/each}</div><i>→</i>
          <div class="capacity-board" aria-label={`${player.goods[warehouse]} ${warehouse} now; fills to ${player.capacity}`}><strong>{goodNames[warehouse]} track · {player.goods[warehouse]} → {player.capacity}</strong><div class="capacity-track">{#each Array(player.capacity) as _, index}<span class:filled={index < player.goods[warehouse]} class:incoming={index >= player.goods[warehouse]}><GameArt kind="component" component={warehouse} /><small>{index < player.goods[warehouse] ? 'held' : '+1'}</small></span>{/each}</div></div>
        </div>
      {:else if placeId === 5}
        <div class="post-track" aria-label="Post Office rewards">
          {#each postOfficeRows as rows, index}
            {@const reward = rows[game.postOfficeLower[index] ? 1 : 0]}
            <span class="post-reward"><GameArt kind="component" component="mail" />{#if reward.good}<GameArt kind="component" component={reward.good} />{:else}<GameArt kind="component" component="lira" /><b>{reward.lira}</b>{/if}<small>{game.postOfficeLower[index] ? 'lower row' : 'upper row'}</small></span>
          {/each}
        </div>
      {:else if placeId === 6}
        <div class="private-choice" aria-label="Private Caravansary choice"><BonusCard reverse="card-back" compact /><span>+</span><BonusCard reverse="card-back" compact /><i>→</i><div><strong>{player.name}, use your private phone</strong><small>Choose two cards and discard one without revealing the hand.</small></div></div>
      {:else if placeId === 7}
        <div class="fountain-map" aria-label="Assistants available to recall">
          <span class="recall-merchant"><GameArt kind="piece" piece="merchant" color={player.color} /><strong>Recall selected</strong></span>
          {#each assistantOptions as assistant}<button class:selected={recallKeys.includes(assistant.key)} onclick={() => toggleRecall(assistant.key)} aria-pressed={recallKeys.includes(assistant.key)}><GameArt kind="piece" piece="assistant" color={player.color} /><b>{assistant.location}</b><small>{place?.name}</small></button>{:else}<p>Every assistant is already with the merchant.</p>{/each}
        </div>
      {:else if placeId === 8}
        <div class="black-market-flow"><div class="good-picker" aria-label="Basic good">{#each basicGoods as good}<button class:selected={blackMarketGood === good} aria-pressed={blackMarketGood === good} aria-label={`Choose ${good}`} onclick={() => blackMarketGood = good}><GameArt kind="component" component={good} /><span>{blackMarketGood === good ? '✓' : ''}</span></button>{/each}</div><b>+</b><div class="dice-ladder"><GameArt kind="piece" piece="dice-pair" /><div>{#each [7, 9, 11] as value, index}<span><b>{value}+</b>{#each Array(index + 1) as _}<GameArt kind="component" component="jewelry" />{/each}</span>{/each}</div></div></div>
      {:else if placeId === 9}
        <div class="tea-flow"><div class="wager-dial" aria-label="Tea House wager">{#each Array.from({ length: 10 }, (_, index) => index + 3) as wager}<button class:selected={teaWager === wager} aria-pressed={teaWager === wager} onclick={() => teaWager = wager}>{wager}</button>{/each}<span><GameArt kind="component" component="lira" /><b>{teaWager}</b></span></div><GameArt kind="piece" piece="dice-pair" class="large-dice" /><TeaHousePayoffs panel /></div>
      {:else if placeId === 10 || placeId === 11}
        <div class="market-flow">
          <MarketDemand market={placeId === 10 ? 'large' : 'small'} goods={activeDemand?.goods ?? []} review />
          <div class="market-slots" aria-label={`${place.name} demand choices`}>{#each activeDemand?.goods ?? [] as good, index}<span class:selected={marketSelection.includes(index)}><button aria-label={`Sell demand slot ${index + 1}: ${good}`} aria-pressed={marketSelection.includes(index)} onclick={() => toggleMarket(index)}><b>{index + 1}</b><GameArt kind="component" component={marketPaymentGoods[index]} /><i>{marketSelection.includes(index) ? '✓' : ''}</i></button>{#if flexibleMarket}<select aria-label={`Payment for demand slot ${index + 1}`} value={marketPaymentGoods[index]} onchange={(event) => setFlexibleGood(index, event.currentTarget.value as Good)}>{#each goods as option}<option value={option}>{goodNames[option]}</option>{/each}</select>{/if}</span>{/each}</div>
          <span class="payout"><GameArt kind="component" component="lira" /><b>{marketRevenueFor(placeId, marketSelection.length)}</b><small>{marketSelection.length} selected</small></span>
        </div>
      {:else if placeId === 12}
        <div class="police-map" aria-label="Family destination">{#each places.filter(({ id }) => id !== 12) as destination}<button class:selected={policeDestination === destination.id} aria-pressed={policeDestination === destination.id} aria-label={`Send family to ${destination.name}`} onclick={() => policeDestination = destination.id}><GameArt kind="location" place={destination.id} /><span>{destination.id}</span>{#if policeDestination === destination.id}<GameArt kind="piece" piece="family" color={player.color} class="family-choice" />{/if}</button>{/each}</div>
      {:else if placeId === 13}
        <div class="ruby-offer"><SultanOffer cost={sultanCost} nextGood={nextSultanGood} panel />{#if sultanWildCount}<div class="wild-goods">{#each Array.from({ length: sultanWildCount }) as _, index}<label>Any good {index + 1}<select aria-label={`Sultan wild good ${index + 1}`} value={sultanWildGoods[index] ?? 'fabric'} onchange={(event) => setSultanWild(index, event.currentTarget.value as Good)}>{#each goods as good}<option value={good}>{goodNames[good]}</option>{/each}</select></label>{/each}</div>{/if}<div class="inventory">{#each goods as good}<span><GameArt kind="component" component={good} /><b>{player.goods[good]}</b></span>{/each}</div></div>
      {:else if placeId === 14 || placeId === 15}
        {@const colors = placeId === 14 ? ['fabric', 'spice'] as Good[] : ['fruit', 'jewelry'] as Good[]}
        <div class="mosque-tiles" aria-label={`${place.name} tile offers`}>{#each colors as color}{@const tile = mosqueTiles.find(({ id }) => id === game.mosqueStacks[color][0])}<button class:owned={ownsMosqueAbility(player, color)} disabled={!tile || ownsMosqueAbility(player, color) || player.goods[color] < tile.required} onclick={() => tile && onAction({ kind: 'mosque-take', tileId: tile.id })}><GameArt kind="component" component={`mosque-${color}` as `mosque-${Good}`} /><span><b>{mosqueColorNames[color]} power</b>{#if tile}<small>Hold {tile.required}, pay 1 {goodNames[color]} · {tile.ability}</small>{:else}<small>Stack empty</small>{/if}</span><i>{ownsMosqueAbility(player, color) ? 'Owned' : tile && player.goods[color] >= tile.required ? 'Choose' : 'Locked'}</i></button>{/each}<span>→</span><GameArt kind="component" component="ruby" class="paired-ruby" /></div>
      {:else if placeId === 16}
        <div class="gemstone-flow"><GemstoneOffer price={game.rubyTracks.gemstonePrice} panel /><div class="coin-payment"><GameArt kind="component" component="lira" /><b>{game.rubyTracks.gemstonePrice}</b><span>→</span><GameArt kind="component" component="ruby" /></div></div>
      {/if}
    </div>

    <footer>
      <button class="close-action" onclick={onClose} aria-label={`Close ${place.name}`}>×</button>
      <p>{place.action}</p>
      <button class="skip-action" onclick={onSkip}>{placeId === 6 && !game.bonusDrawPile.length ? 'End turn' : 'Skip'}</button>
      {#if placeId === 1}<button class="confirm-action" disabled={player.lira < 7 || player.extensions >= 3 || game.supplies.wheelbarrowExtensions < 1} onclick={() => onAction({ kind: 'wainwright-buy' })}>Buy extension · 7 Lira <b>✓</b></button>
      {:else if warehouse}<button class="confirm-action" onclick={() => onAction({ kind: 'warehouse-fill', good: warehouse })}>Fill to {player.capacity} <b>✓</b></button>
      {:else if placeId === 5}<button class="confirm-action" onclick={() => onAction({ kind: 'post-office-collect' })}>Collect rewards <b>✓</b></button>
      {:else if placeId === 6}<span class="phone-note">Complete on phone</span>
      {:else if placeId === 7}<button class="confirm-action" disabled={!recallKeys.length} onclick={() => onAction({ kind: 'fountain-recall', assistantPlaces: assistantOptions.filter(({ key }) => recallKeys.includes(key)).map(({ location }) => location) })}>Recall {recallKeys.length} <b>✓</b></button>
      {:else if placeId === 8}<button class="confirm-action" onclick={() => onAction({ kind: 'black-market-roll', good: blackMarketGood })}>Take {blackMarketGood} & roll <b>✓</b></button>
      {:else if placeId === 9}<button class="confirm-action" onclick={() => onAction({ kind: 'tea-house-wager', wager: teaWager })}>Wager {teaWager} & roll <b>✓</b></button>
      {:else if placeId === 10 || placeId === 11}<button class="confirm-action" disabled={!marketLegal} onclick={sellMarket}>Sell · {marketRevenueFor(placeId, marketSelection.length)} Lira <b>✓</b></button>
      {:else if placeId === 12}<button class="confirm-action" disabled={player.familyPlace !== 12} onclick={() => onAction({ kind: 'police-send', destination: policeDestination })}>Send to Place {policeDestination} <b>✓</b></button>
      {:else if placeId === 13}<button class="confirm-action" disabled={!sultanAffordable} onclick={() => onAction({ kind: 'sultan-buy', wildGoods: [...resolvedSultanWildGoods] })}>Deliver goods <b>✓</b></button>
      {:else if placeId === 16}<button class="confirm-action" disabled={player.lira < game.rubyTracks.gemstonePrice} onclick={() => onAction({ kind: 'gemstone-buy' })}>Buy ruby · {game.rubyTracks.gemstonePrice} <b>✓</b></button>
      {/if}
    </footer>
  </div>
</div>

<style>
  .room-overlay { position: absolute; z-index: 60; inset: 0; display: grid; place-items: center; overflow: hidden; background: rgb(2 18 20 / 72%); backdrop-filter: blur(3px); }
  .room-dialog { position: relative; width: min(76vw, 80rem); height: min(64vh, 48rem); overflow: hidden; border: .22rem solid #e8c775; border-radius: 1.4rem; color: #fffaf0; background: #082d30; box-shadow: 0 2rem 6rem #000d, inset 0 0 0 1px #fff8dd55; transform: rotate(var(--player-orientation)); transform-origin: center; animation: zoom-room .32s cubic-bezier(.2, .8, .2, 1); }
  .room-dialog.side-facing { width: min(82vh, 80rem); height: min(62vw, 50rem); }.room-dialog:focus { outline: 0; }
  :global(.room-art) { position: absolute; inset: -8%; width: 116%; height: 116%; filter: blur(1px) brightness(.5) saturate(.86); scale: 1.03; }.room-scrim { position: absolute; inset: 0; background: radial-gradient(circle at 50% 52%, rgb(15 66 65 / 12%), rgb(3 26 28 / 90%)); }
  header, footer, .control-stage { position: absolute; z-index: 2; right: 3.2%; left: 3.2%; } header { top: 3%; height: 15%; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: .9rem; align-items: center; } header p, header h2 { margin: 0; } header p { color: #efca7d; font-size: clamp(.5rem, .75vw, .7rem); font-weight: 700; letter-spacing: .13em; text-transform: uppercase; } header h2 { font: 700 clamp(1.8rem, 4vw, 4rem)/.9 'Cormorant Garamond', serif; }
  .place-number { width: clamp(2.8rem, 4.5vw, 4rem); aspect-ratio: 1; display: grid; place-items: center; border: 2px solid #efca7d; border-radius: 50%; color: #efca7d; background: #0a3032dd; font: 700 clamp(1.1rem, 2vw, 1.6rem) 'Cormorant Garamond', serif; }.active-player { display: grid; grid-template-columns: 2.8rem auto; align-items: center; gap: .4rem; padding: .3rem .7rem; border: 1px solid #efca7d88; border-radius: 2rem; background: #0a3032dd; }.active-player :global(.game-art) { width: 2.8rem; height: 2.8rem; }
  .control-stage { top: 19%; bottom: 15%; display: grid; place-items: center; }.control-stage button { color: inherit; font: inherit; cursor: pointer; }.exchange-flow, .warehouse-flow, .black-market-flow, .market-flow, .mosque-tiles, .coin-payment, .private-choice, .tea-flow { display: flex; align-items: center; justify-content: center; gap: clamp(.7rem, 2.5vw, 2.6rem); }.exchange-flow > i, .warehouse-flow > i, .private-choice > i, .black-market-flow > b, .mosque-tiles > span, .coin-payment > span { color: #efca7d; font: 700 clamp(1.8rem, 4vw, 4rem) 'Cormorant Garamond', serif; font-style: normal; }
  .resource-card { position: relative; width: clamp(7rem, 13vw, 12rem); aspect-ratio: 1; display: grid; place-items: center; border: 2px solid #efca7d; border-radius: 1.2rem; background: #0c3537dd; }.resource-card :global(.game-art) { width: 72%; height: 72%; }.resource-card > b { position: absolute; right: 7%; bottom: 8%; width: 2.4rem; aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%; background: #a43b32; }.resource-card small { position: absolute; bottom: 5%; left: 8%; color: #efca7d; text-transform: uppercase; }.extension-track { display: grid; gap: .25rem; }.extension-track span { width: 3rem; aspect-ratio: 1; padding: .2rem; border: 1px dashed #efca7d; border-radius: .4rem; opacity: .45; }.extension-track span.filled { opacity: 1; background: #efca7d33; }.extension-track :global(.game-art) { width: 100%; height: 100%; }
  .supply-pile { position: relative; flex: 0 0 clamp(7rem, 14vw, 13rem); aspect-ratio: 1; }.supply-pile :global(.game-art) { position: absolute; width: 64%; height: 64%; filter: drop-shadow(0 .3rem .3rem #000b); }.supply-pile :global(.game-art:nth-child(2)) { translate: 28% 8%; }.supply-pile :global(.game-art:nth-child(3)) { translate: 10% 31%; }.supply-pile :global(.game-art:nth-child(4)) { translate: 36% 33%; }.supply-pile :global(.game-art:nth-child(5)) { translate: 43% 3%; }.capacity-board { width: min(58%, 40rem); padding: clamp(.7rem, 1.5vw, 1.25rem); border: 2px solid #d0aa61; border-radius: 1rem; color: #173f43; background: #ead5a8e8; }.capacity-board > strong { display: block; margin-bottom: .55rem; font-family: 'Cormorant Garamond', serif; }.capacity-track { display: flex; gap: clamp(.25rem, .7vw, .7rem); }.capacity-track > span { position: relative; min-width: 0; flex: 1; aspect-ratio: .78; display: grid; place-items: center; border: 2px dashed #8b6a3c; border-radius: .65rem; }.capacity-track > span.filled { border-style: solid; background: #fff4d8; }.capacity-track > span.incoming { border-color: #25735f; background: #d8ead9; }.capacity-track :global(.game-art) { width: 82%; height: 82%; }.capacity-track small { position: absolute; right: .2rem; bottom: .15rem; font-size: .5rem; font-weight: 700; text-transform: uppercase; }
  .post-track { width: min(90%, 50rem); display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }.post-reward { position: relative; min-width: 0; aspect-ratio: .85; display: grid; grid-template-columns: 1fr 1fr; place-items: center; padding: .7rem; border: 2px solid #efca7d; border-radius: 1rem; background: #e9d6a9dc; }.post-reward :global(.game-art) { width: 100%; height: 100%; }.post-reward b { position: absolute; right: 12%; bottom: 18%; width: 2rem; aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%; background: #a43b32; }.post-reward small { position: absolute; bottom: .3rem; color: #173f43; font-weight: 700; }
  .private-choice :global(.bonus-card) { width: clamp(5rem, 10vw, 8rem); }.private-choice > span { font-size: 2rem; }.private-choice > div { max-width: 18rem; display: grid; gap: .35rem; padding: 1rem; border: 1px solid #efca7d; border-radius: .8rem; background: #0a3032dd; }.private-choice small { color: #bdd0cb; line-height: 1.4; }
  .fountain-map { width: min(90%, 56rem); min-height: 70%; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .7rem; }.recall-merchant, .fountain-map button { width: 7rem; aspect-ratio: 1; display: grid; place-items: center; border: 2px solid #efca7d; border-radius: 50%; background: #0a3032dd; }.recall-merchant :global(.game-art), .fountain-map button :global(.game-art) { width: 55%; height: 55%; }.fountain-map button { position: relative; }.fountain-map button.selected { color: #173f43; background: #efca7d; box-shadow: 0 0 0 .25rem #efca7d55; }.fountain-map button b { position: absolute; top: .35rem; right: .6rem; }.fountain-map button small { display: none; }.fountain-map p { width: 100%; text-align: center; }
  .good-picker { display: flex; gap: .6rem; }.good-picker button { position: relative; width: clamp(5rem, 9vw, 8rem); aspect-ratio: 1; padding: .35rem; border: 2px solid #efca7d66; border-radius: 1rem; background: #0a3032dd; }.good-picker button.selected { border-color: #efca7d; background: #efca7d33; }.good-picker :global(.game-art) { width: 100%; height: 100%; }.good-picker span { position: absolute; right: .35rem; bottom: .35rem; }.dice-ladder { display: flex; align-items: center; gap: .7rem; }.dice-ladder > :global(.game-art) { width: 7rem; height: 7rem; }.dice-ladder > div { display: grid; gap: .25rem; }.dice-ladder span { display: flex; align-items: center; gap: .2rem; }.dice-ladder span :global(.game-art) { width: 1.8rem; height: 1.8rem; }
  .tea-flow { width: 94%; }.wager-dial { position: relative; width: clamp(10rem, 19vw, 17rem); aspect-ratio: 1; display: grid; grid-template-columns: repeat(5, 1fr); gap: .2rem; place-content: center; }.wager-dial button { aspect-ratio: 1; border: 1px solid #efca7d; border-radius: 50%; background: #0a3032; }.wager-dial button.selected { color: #173f43; background: #efca7d; }.wager-dial > span { position: absolute; inset: 30%; display: grid; place-items: center; border-radius: 50%; background: #a43b32; }.wager-dial > span :global(.game-art) { position: absolute; width: 100%; height: 100%; opacity: .5; }.wager-dial > span b { z-index: 2; font-size: 1.8rem; }.tea-flow :global(.large-dice) { width: 8rem; height: 8rem; }.tea-flow :global(.tea-house-payoffs) { max-width: 22rem; }
  .market-flow { width: 96%; }.market-flow :global(.market-demand) { flex: 0 1 18rem; }.market-slots { display: flex; gap: .35rem; }.market-slots > span { display: grid; gap: .2rem; }.market-slots button { position: relative; width: clamp(3.6rem, 6vw, 5.5rem); aspect-ratio: .78; border: 2px solid #efca7d66; border-radius: .7rem; background: #0a3032dd; }.market-slots span.selected button { border-color: #efca7d; background: #efca7d33; }.market-slots button :global(.game-art) { width: 90%; height: 90%; }.market-slots button > b, .market-slots button > i { position: absolute; z-index: 2; }.market-slots button > b { top: .2rem; left: .25rem; }.market-slots button > i { right: .25rem; bottom: .2rem; }.market-slots select { width: 100%; font-size: .55rem; }.payout { display: grid; place-items: center; }.payout :global(.game-art) { grid-area: 1 / 1; width: 6rem; height: 6rem; }.payout b { z-index: 2; grid-area: 1 / 1; font-size: 1.8rem; }.payout small { color: #efca7d; }
  .police-map { width: min(90%, 48rem); display: grid; grid-template-columns: repeat(5, 1fr); gap: .3rem; }.police-map button { position: relative; min-width: 0; aspect-ratio: 1.2; overflow: hidden; padding: 0; border: 2px solid transparent; border-radius: .4rem; background: #173f43; }.police-map button.selected { border-color: #efca7d; box-shadow: 0 0 0 2px #efca7d55; }.police-map button > :global(.game-art:first-child) { width: 100%; height: 100%; }.police-map button > span { position: absolute; z-index: 2; top: .15rem; right: .15rem; width: 1.3rem; aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%; background: #0a3032; }.police-map :global(.family-choice) { position: absolute; z-index: 3; inset: 20%; width: 60%; height: 60%; }
  .ruby-offer, .gemstone-flow { width: min(94%, 54rem); display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem; align-items: center; }.ruby-offer :global(.sultan-offer), .gemstone-flow :global(.gemstone-offer) { height: auto; }.inventory { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; }.inventory span { position: relative; display: grid; place-items: center; padding: .3rem; border: 1px solid #efca7d88; border-radius: .6rem; background: #0a3032dd; }.inventory :global(.game-art) { width: 4rem; height: 4rem; }.inventory b { position: absolute; right: .3rem; bottom: .3rem; }.wild-goods { display: grid; gap: .3rem; }.wild-goods label { display: flex; justify-content: space-between; gap: .5rem; }.wild-goods select { min-width: 8rem; }
  .mosque-tiles { width: min(94%, 54rem); }.mosque-tiles button { width: min(34%, 16rem); display: grid; grid-template-columns: 45% 1fr; gap: .5rem; align-items: center; padding: .6rem; border: 2px solid #efca7d; border-radius: 1rem; color: #173f43; text-align: left; background: #ead5a8e8; }.mosque-tiles button:disabled { opacity: .55; }.mosque-tiles button.owned { opacity: .78; }.mosque-tiles button > :global(.game-art) { width: 100%; height: auto; }.mosque-tiles button span { display: grid; gap: .25rem; }.mosque-tiles button i { grid-column: 1 / -1; text-align: center; }.mosque-tiles :global(.paired-ruby) { width: 6rem; height: 6rem; }.coin-payment { color: #efca7d; }.coin-payment :global(.game-art) { width: 8rem; height: 8rem; }.coin-payment b { font-size: 2rem; }
  footer { bottom: 2.5%; min-height: 10%; display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; gap: .65rem; align-items: center; } footer p { margin: 0; color: #d9e3de; font-size: clamp(.56rem, .9vw, .8rem); text-align: center; } footer button { min-height: 2.7rem; border: 1px solid #efca7d; border-radius: 2rem; font: inherit; font-weight: 700; }.close-action { width: 2.7rem; padding: 0; color: #d8bbb0; background: #0a3032; font-size: 1.35rem; }.skip-action { padding: .35rem 1rem; color: #efca7d; background: #0a3032; }.confirm-action { min-width: 8.5rem; display: flex; align-items: center; justify-content: end; gap: .65rem; padding: .3rem .35rem .3rem 1rem; color: #173f43; background: #efca7d; }.confirm-action b { width: 2rem; aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #28796f; }.confirm-action:disabled { opacity: .45; }.phone-note { color: #efca7d; font-size: .7rem; font-weight: 700; }
  @keyframes zoom-room { from { opacity: 0; transform: translate(var(--room-travel-x), var(--room-travel-y)) rotate(var(--player-orientation)) scale(.28); } to { opacity: 1; transform: translate(0, 0) rotate(var(--player-orientation)) scale(1); } }
  @media (max-width: 960px), (max-height: 599px) { .room-dialog { --room-travel-x: 0% !important; --room-travel-y: 0% !important; width: min(84vw, 48rem); height: min(72vh, 30rem); }.room-dialog.side-facing { width: min(72vh, 36rem); height: min(84vw, 42rem); }.control-stage { top: 18%; bottom: 17%; }.active-player { grid-template-columns: 1.8rem auto; }.active-player :global(.game-art) { width: 1.8rem; height: 1.8rem; }.post-track { gap: .35rem; }.market-flow, .tea-flow { gap: .4rem; }.market-flow :global(.market-demand), .tea-flow :global(.tea-house-payoffs) { display: none; }.police-map { width: 76%; }.mosque-tiles button { width: 40%; }.ruby-offer, .gemstone-flow { width: 78%; } }
  @media (prefers-reduced-motion: reduce) { .room-dialog { animation: none; } }
</style>
