<script lang="ts">
  import BonusCard from '$lib/components/BonusCard.svelte';
  import GameArt from '$lib/components/GameArt.svelte';
  import GemstoneOffer from '$lib/components/GemstoneOffer.svelte';
  import MarketDemand from '$lib/components/MarketDemand.svelte';
  import SultanOffer from '$lib/components/SultanOffer.svelte';
  import TeaHousePayoffs from '$lib/components/TeaHousePayoffs.svelte';
  import { bonusCards, places, type Good } from '$lib/game/manifests';

  let { placeId }: { placeId: number } = $props();
  const place = $derived(places[placeId - 1]);
  const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
  const basics: Good[] = ['fabric', 'spice', 'fruit'];
  const warehouseGood = $derived(placeId === 2 ? 'fabric' : placeId === 3 ? 'spice' : 'fruit');
  const marketGoods: Good[] = ['jewelry', 'fabric', 'spice', 'fruit', 'fruit'];
  const policeDestinations = [15, 5, 2, 14, 4, 7, 3, 8, 6, 11, 9, 13, 10, 1, 16];

  function icon(good: Good) {
    return good;
  }
</script>

<section class={`room-control room-${placeId}`} aria-label={`${place.name} graphical control mock-up`}>
  <GameArt kind="location" place={placeId} class="room-art" />
  <div class="room-shade"></div>
  <header>
    <span class="place-number">{placeId}</span>
    <div><p>Active room</p><h1>{place.name}</h1></div>
    <span class="turn-owner"><GameArt kind="piece" piece="merchant" color="ruby" /><b>Ada</b></span>
  </header>

  <div class="control-stage">
    {#if placeId === 1}
      <div class="exchange-flow">
        <button class="resource-choice selected"><GameArt kind="component" component="lira" /><b>7</b><small>pay</small></button>
        <span class="flow-arrow">→</span>
        <button class="reward-choice"><GameArt kind="component" component="wheelbarrow" /><b>+1</b><small>capacity</small></button>
      </div>
    {:else if placeId >= 2 && placeId <= 4}
      <div class="warehouse-flow">
        <div class="supply-pile">{#each Array(5) as _}<GameArt kind="component" component={warehouseGood} />{/each}</div>
        <span class="flow-arrow">→</span>
        <div class="capacity-track" aria-label={`Fill ${warehouseGood} to capacity`}>
          {#each [1, 2, 3, 4, 5] as level}<button class:filled={level <= 4} class:locked={level === 5}>{#if level <= 4}<GameArt kind="component" component={warehouseGood} />{:else}<span>×</span>{/if}<small>{level}</small></button>{/each}
        </div>
      </div>
    {:else if placeId === 5}
      <div class="post-track">
        {#each [{ good: 'spice' }, { lira: 2 }, { good: 'fruit' }, { lira: 1 }] as reward, index}
          <button class="post-reward">
            <span class="mail-stamp"><GameArt kind="component" component="mail" /></span>
            {#if reward.good}<GameArt kind="component" component={reward.good as Good} />{:else}<GameArt kind="component" component="lira" /><b>{reward.lira}</b>{/if}
            <small>{index % 2 ? 'lower row' : 'upper row'}</small>
          </button>
        {/each}
      </div>
    {:else if placeId === 6}
      <div class="card-draft">
        <button class="card-source"><BonusCard reverse="card-deck" compact /><b>Draw</b></button>
        <button class="card-source discard"><BonusCard card={bonusCards[5]} compact /><b>Discard</b></button>
        <span class="flow-arrow">→</span>
        <div class="drawn-cards"><button class="selected"><BonusCard card={bonusCards[1]} compact /></button><button><BonusCard card={bonusCards[9]} compact /></button></div>
        <span class="discard-well">keep one<br /><b>↓</b><br />discard one</span>
      </div>
    {:else if placeId === 7}
      <div class="fountain-map">
        <div class="recall-merchant"><GameArt kind="piece" piece="merchant" color="ruby" /><strong>Recall selected</strong></div>
        {#each [2, 5, 10, 14] as location, index}<button class={`assistant-place a-${index + 1}`}><GameArt kind="piece" piece="assistant" color="ruby" /><b>{location}</b><span>✓</span></button>{/each}
        <svg viewBox="0 0 100 60" aria-hidden="true"><path d="M12 13L50 30M87 12L50 30M14 50L50 30M87 49L50 30" /></svg>
      </div>
    {:else if placeId === 8}
      <div class="black-market-flow">
        <div class="good-picker">{#each basics as good}<button class:selected={good === 'spice'}><GameArt kind="component" component={icon(good)} /><span>{good === 'spice' ? '✓' : ''}</span></button>{/each}</div>
        <span class="plus">+</span>
        <div class="dice-ladder"><GameArt kind="piece" piece="dice-pair" /><div>{#each [7, 8, 9, 10] as value}<span class:active={value <= 8}><b>{value}+</b><GameArt kind="component" component="jewelry" /></span>{/each}</div></div>
      </div>
    {:else if placeId === 9}
      <div class="tea-flow">
        <div class="wager-dial">{#each [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as wager, index}<button class:selected={wager === 8} style={`--dial-index:${index}`}>{wager}</button>{/each}<span><GameArt kind="component" component="lira" /><b>8</b></span></div>
        <GameArt kind="piece" piece="dice-pair" class="large-dice" />
        <TeaHousePayoffs panel />
      </div>
    {:else if placeId === 10 || placeId === 11}
      <div class="market-flow">
        <MarketDemand market={placeId === 10 ? 'large' : 'small'} goods={marketGoods} review />
        <div class="market-slots">{#each marketGoods as good, index}<button class:selected={index < 3}><span>{index + 1}</span><GameArt kind="component" component={good} />{#if index < 3}<i>✓</i>{/if}</button>{/each}</div>
        <div class="market-payout"><GameArt kind="component" component="lira" /><b>{placeId === 10 ? 12 : 9}</b><small>for 3 goods</small></div>
      </div>
    {:else if placeId === 12}
      <div class="police-map">
        {#each policeDestinations as destination}<button class:selected={destination === 8}><GameArt kind="location" place={destination} /><span>{destination}</span>{#if destination === 8}<GameArt kind="piece" piece="family" color="ruby" class="family-choice" />{/if}</button>{/each}
        <div class="police-origin"><GameArt kind="piece" piece="family" color="ruby" /><span>send family</span></div>
      </div>
    {:else if placeId === 13}
      <div class="ruby-offer"><SultanOffer cost={['fabric', 'spice', 'fruit', 'any']} nextGood="jewelry" panel /><div class="offer-inventory">{#each goods as good}<button><GameArt kind="component" component={good} /><b>{good === 'jewelry' ? 1 : 3}</b></button>{/each}</div></div>
    {:else if placeId === 14 || placeId === 15}
      <div class="mosque-tiles">
        {#each (placeId === 14 ? ['fabric', 'spice'] : ['fruit', 'jewelry']) as good, index}
          <button class:selected={index === 0}>
            <GameArt kind="component" component={`mosque-${good}` as `mosque-${Good}`} />
            <span class="tile-cost"><b>2</b><GameArt kind="component" component={good as Good} /></span>
            <span class="ability-symbol">{good === 'fabric' ? '⚄→④' : good === 'spice' ? '+1' : good === 'fruit' ? '↩' : '+♟'}</span>
            <small>{good === 'fabric' ? 'adjust dice' : good === 'spice' ? 'extra warehouse good' : good === 'fruit' ? 'recall assistant' : 'fifth assistant'}</small>
          </button>
        {/each}
        <span class="flow-arrow">→</span><GameArt kind="component" component="ruby" class="paired-ruby" />
      </div>
    {:else if placeId === 16}
      <div class="ruby-offer gemstone"><GemstoneOffer price={18} panel /><div class="coin-payment"><GameArt kind="component" component="lira" /><b>18</b><span>→</span><GameArt kind="component" component="ruby" /></div></div>
    {/if}
  </div>

  <footer><button class="cancel-action">×</button><p>{place.action}</p><button class="confirm-action"><span>Confirm</span><b>✓</b></button></footer>
</section>

<style>
  .room-control { position: relative; width: 100%; height: 100%; overflow: hidden; border: .2rem solid #e5c476; border-radius: 1.5rem; color: #fffaf0; background: #173f43; box-shadow: 0 2rem 5rem #000c, inset 0 0 0 1px #fff5d455; }
  :global(.room-art) { position: absolute; inset: -8%; width: 116%; height: 116%; filter: blur(2px) brightness(.48) saturate(.8); transform: scale(1.02); }
  .room-shade { position: absolute; inset: 0; background: radial-gradient(circle at center, rgb(19 65 65 / 22%), rgb(5 25 27 / 85%)); }
  header, footer, .control-stage { position: absolute; z-index: 2; right: 3%; left: 3%; }
  header { top: 2.4%; height: 14%; display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center; }
  header p, header h1 { margin: 0; } header p { color: #efca7d; font-size: .65rem; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; } header h1 { font: 700 clamp(1.7rem, 3vw, 3.4rem)/.9 'Cormorant Garamond', serif; }
  .place-number { width: 3.3rem; aspect-ratio: 1; display: grid; place-items: center; border: 2px solid #efca7d; border-radius: 50%; color: #efca7d; background: #0a3032dd; font: 700 1.3rem 'Cormorant Garamond', serif; }
  .turn-owner { display: grid; grid-template-columns: 2.6rem auto; align-items: center; gap: .35rem; padding: .3rem .65rem; border: 1px solid #efca7d88; border-radius: 2rem; background: #0a3032dd; }.turn-owner :global(.game-art) { width: 2.6rem; height: 2.6rem; }
  .control-stage { top: 17%; bottom: 14%; display: grid; place-items: center; }
  footer { bottom: 2%; height: 10%; display: grid; grid-template-columns: 3rem 1fr auto; gap: .75rem; align-items: center; } footer p { margin: 0; color: #d9e2dd; font-size: clamp(.6rem, 1vw, .85rem); text-align: center; }
  button { color: inherit; font: inherit; cursor: default; }
  .cancel-action, .confirm-action { border: 1px solid #efca7d; background: #0a3032; box-shadow: 0 .25rem .45rem #0007; }.cancel-action { width: 2.8rem; aspect-ratio: 1; border-radius: 50%; color: #d8bbb0; font-size: 1.45rem; }.confirm-action { min-width: 8rem; display: flex; align-items: center; justify-content: end; gap: .75rem; padding: .35rem .4rem .35rem 1rem; border-radius: 2rem; color: #173f43; background: #efca7d; font-weight: 700; }.confirm-action b { width: 2rem; aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%; color: #fff; background: #28796f; }
  .flow-arrow, .plus { color: #efca7d; font: 700 2.6rem 'Cormorant Garamond', serif; text-shadow: 0 .15rem .2rem #000; }
  .exchange-flow, .warehouse-flow, .black-market-flow, .market-flow, .mosque-tiles, .coin-payment { display: flex; align-items: center; justify-content: center; gap: clamp(1rem, 3vw, 2.8rem); }
  .resource-choice, .reward-choice { position: relative; width: clamp(8rem, 15vw, 13rem); aspect-ratio: 1; display: grid; place-items: center; border: 2px solid #efca7d; border-radius: 1.5rem; background: #0c3537dd; box-shadow: 0 1rem 2rem #0008; }.resource-choice :global(.game-art), .reward-choice :global(.game-art) { width: 70%; height: 70%; }.resource-choice b, .reward-choice b { position: absolute; right: 7%; bottom: 9%; width: 2.5rem; aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%; background: #a43b32; }.resource-choice small, .reward-choice small { position: absolute; bottom: 4%; left: 7%; color: #efca7d; text-transform: uppercase; }
  .supply-pile { position: relative; width: 9rem; height: 9rem; }.supply-pile :global(.game-art) { position: absolute; width: 70%; height: 70%; filter: drop-shadow(0 .25rem .2rem #000a); }.supply-pile :global(.game-art:nth-child(2)) { translate: 22% 10%; }.supply-pile :global(.game-art:nth-child(3)) { translate: 4% 32%; }.supply-pile :global(.game-art:nth-child(4)) { translate: 36% 36%; }.supply-pile :global(.game-art:nth-child(5)) { translate: 48% 5%; }
  .capacity-track { display: flex; gap: .45rem; padding: 1rem; border: 2px solid #d1ab63; border-radius: 1rem; background: #ead5a8e8; }.capacity-track button { position: relative; width: clamp(3.5rem, 6vw, 5.5rem); aspect-ratio: .8; display: grid; place-items: center; border: 2px dashed #795c32; border-radius: .65rem; color: #173f43; background: #fff2ce55; }.capacity-track button.filled { border-style: solid; background: #fff4d3; }.capacity-track button.locked { opacity: .45; }.capacity-track :global(.game-art) { width: 80%; height: 80%; }.capacity-track small { position: absolute; right: .25rem; bottom: .2rem; }
  .post-track { width: min(92%, 48rem); display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; }.post-reward { position: relative; aspect-ratio: .78; display: grid; place-items: center; overflow: hidden; border: 2px solid #efca7d; border-radius: 1rem; background: #f3dfb9dd; box-shadow: 0 .5rem 1rem #0008; }.post-reward > :global(.game-art:not(.mail-stamp *)) { width: 56%; height: 56%; }.post-reward > b { position: absolute; right: 16%; bottom: 20%; width: 1.8rem; aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%; background: #a43b32; }.post-reward small { position: absolute; bottom: .6rem; color: #6a4a25; }.mail-stamp { position: absolute; top: .45rem; left: .45rem; width: 1.8rem; height: 1.8rem; opacity: .78; }.mail-stamp :global(.game-art) { width: 100%; height: 100%; }
  .card-draft { display: flex; align-items: center; gap: 1rem; }.card-source { position: relative; width: 5.6rem; border: 0; background: transparent; }.card-source :global(.bonus-card), .drawn-cards :global(.bonus-card) { width: 100%; box-shadow: 0 .6rem 1rem #000a; }.card-source b { display: block; margin-top: .35rem; }.drawn-cards { display: flex; gap: .75rem; }.drawn-cards button { width: 6.4rem; padding: .3rem; border: 2px solid transparent; border-radius: .8rem; background: transparent; }.drawn-cards button.selected { border-color: #efca7d; background: #efca7d22; translate: 0 -.5rem; }.discard-well { padding: 1rem; border: 2px dashed #efca7d88; border-radius: .8rem; color: #c6d5d0; text-align: center; }
  .fountain-map { position: relative; width: min(90%, 48rem); aspect-ratio: 2; }.fountain-map svg { position: absolute; inset: 0; width: 100%; height: 100%; }.fountain-map path { fill: none; stroke: #efca7d77; stroke-width: 1; stroke-dasharray: 2 2; }.recall-merchant, .assistant-place { position: absolute; z-index: 2; display: grid; place-items: center; }.recall-merchant { top: 50%; left: 50%; width: 8rem; translate: -50% -50%; }.recall-merchant :global(.game-art) { width: 5rem; height: 5rem; }.assistant-place { width: 5rem; aspect-ratio: 1; border: 2px solid #efca7d; border-radius: 50%; background: #0e3b3ddd; }.assistant-place :global(.game-art) { width: 68%; height: 68%; }.assistant-place b { position: absolute; right: -.2rem; bottom: -.2rem; }.assistant-place span { position: absolute; top: -.2rem; right: -.2rem; width: 1.4rem; aspect-ratio: 1; border-radius: 50%; background: #28796f; }.a-1 { top: 1%; left: 4%; }.a-2 { top: 1%; right: 4%; }.a-3 { bottom: 1%; left: 4%; }.a-4 { right: 4%; bottom: 1%; }
  .good-picker { display: flex; gap: .75rem; }.good-picker button { position: relative; width: 6.5rem; aspect-ratio: 1; border: 2px solid #efca7d66; border-radius: 1rem; background: #0d3739dd; }.good-picker button.selected { border-color: #efca7d; box-shadow: 0 0 0 .25rem #efca7d33; }.good-picker :global(.game-art) { width: 80%; height: 80%; }.good-picker span { position: absolute; top: .25rem; right: .25rem; }.dice-ladder { display: grid; grid-template-columns: 7rem 1fr; align-items: center; gap: .7rem; }.dice-ladder > :global(.game-art) { width: 7rem; height: 5rem; }.dice-ladder > div { display: grid; grid-template-columns: repeat(4, 1fr); gap: .3rem; }.dice-ladder span { display: grid; place-items: center; opacity: .4; }.dice-ladder span.active { opacity: 1; }.dice-ladder span :global(.game-art) { width: 2rem; height: 2rem; }
  .tea-flow { width: 94%; display: grid; grid-template-columns: 1.2fr auto 1.35fr; align-items: center; gap: 1rem; }.wager-dial { position: relative; width: 15rem; aspect-ratio: 1; border: 2px solid #efca7d; border-radius: 50%; background: #0d3436dd; }.wager-dial button { position: absolute; top: 50%; left: 50%; width: 2rem; aspect-ratio: 1; border: 1px solid #efca7d88; border-radius: 50%; background: #173f43; transform: rotate(calc(var(--dial-index) * 36deg)) translateY(-6.2rem) rotate(calc(var(--dial-index) * -36deg)); transform-origin: center; }.wager-dial button.selected { color: #173f43; background: #efca7d; }.wager-dial > span { position: absolute; inset: 29%; display: grid; place-items: center; }.wager-dial > span :global(.game-art) { width: 100%; height: 100%; }.wager-dial > span b { position: absolute; font-size: 1.4rem; }.tea-flow :global(.large-dice) { width: 7rem; height: 5rem; }.tea-flow :global(.tea-house-payoffs) { margin: 0; }
  .market-flow { width: 96%; }.market-flow :global(.demand-board) { flex: 0 0 13rem; }.market-slots { display: flex; gap: .35rem; }.market-slots button { position: relative; width: 4.3rem; aspect-ratio: .75; display: grid; place-items: center; border: 2px solid #efca7d55; border-radius: .65rem; background: #0d383add; }.market-slots button.selected { border-color: #efca7d; translate: 0 -.35rem; }.market-slots :global(.game-art) { width: 80%; height: 80%; }.market-slots button > span { position: absolute; top: .15rem; left: .25rem; }.market-slots button i { position: absolute; top: .15rem; right: .25rem; color: #efca7d; }.market-payout { position: relative; width: 6rem; aspect-ratio: 1; display: grid; place-items: center; }.market-payout :global(.game-art) { width: 100%; height: 100%; }.market-payout b { position: absolute; font-size: 1.5rem; }.market-payout small { position: absolute; bottom: -.5rem; white-space: nowrap; }
  .police-map { position: relative; width: min(76%, 34rem); display: grid; grid-template-columns: repeat(4, 1fr); gap: .35rem; }.police-map button { position: relative; aspect-ratio: 1.42; overflow: hidden; padding: 0; border: 2px solid transparent; border-radius: .4rem; background: #173f43; }.police-map button.selected { z-index: 2; border-color: #efca7d; scale: 1.08; }.police-map button > :global(.game-art:first-child) { position: absolute; inset: 0; width: 100%; height: 100%; filter: brightness(.65); }.police-map button > span { position: absolute; z-index: 2; top: .15rem; left: .2rem; text-shadow: 0 1px 2px #000; }.police-map :global(.family-choice) { position: absolute; z-index: 3; inset: 18% 32%; width: 36%; height: 64%; }.police-origin { position: absolute; top: 50%; left: -6.5rem; width: 5rem; display: grid; place-items: center; translate: 0 -50%; }.police-origin :global(.game-art) { width: 3.5rem; height: 3.5rem; }
  .ruby-offer { width: min(88%, 42rem); display: grid; gap: 1.2rem; }.ruby-offer :global(.sultan-offer), .ruby-offer :global(.gemstone-payoffs) { margin: 0; }.offer-inventory { display: flex; justify-content: center; gap: .55rem; }.offer-inventory button { position: relative; width: 4.5rem; aspect-ratio: 1; border: 1px solid #efca7d; border-radius: .65rem; background: #0d383add; }.offer-inventory :global(.game-art) { width: 80%; height: 80%; }.offer-inventory b { position: absolute; right: .1rem; bottom: .1rem; width: 1.35rem; aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%; background: #a43b32; }.mosque-tiles > button { position: relative; width: 12rem; aspect-ratio: 1; display: grid; place-items: center; overflow: hidden; border: 2px solid #efca7d66; border-radius: 1rem; background: #0d383add; }.mosque-tiles > button.selected { border-color: #efca7d; translate: 0 -.45rem; }.mosque-tiles > button > :global(.game-art) { width: 86%; height: 86%; }.tile-cost { position: absolute; top: .5rem; left: .5rem; display: flex; align-items: center; gap: .15rem; padding: .25rem .4rem; border-radius: 1rem; background: #082e31dd; }.tile-cost :global(.game-art) { width: 1.2rem; height: 1.2rem; }.ability-symbol { position: absolute; right: .6rem; bottom: 1.8rem; padding: .25rem .45rem; border-radius: .5rem; color: #efca7d; background: #082e31dd; font-size: 1.1rem; }.mosque-tiles small { position: absolute; right: .35rem; bottom: .35rem; left: .35rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.mosque-tiles :global(.paired-ruby) { width: 5rem; height: 5rem; }.gemstone { width: min(84%, 34rem); }.coin-payment { padding: .8rem; border: 1px solid #efca7d66; border-radius: 1rem; background: #0c3537bb; }.coin-payment :global(.game-art) { width: 5rem; height: 5rem; }.coin-payment b { font-size: 1.8rem; }.coin-payment span { color: #efca7d; font-size: 2rem; }
</style>
