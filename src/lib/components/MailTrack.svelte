<script lang="ts">
  import { postOfficeRows } from '$lib/game/actions';
  import GameArt from './GameArt.svelte';
  let { lower }: { lower: boolean[] } = $props();
</script>

<span class="mail-track" data-component="MailTrack">
  {#each postOfficeRows as rows, column}
    <span class="column" data-mail-column={column}>
      {#each [1, 0] as row}
        <span class="reward" data-mail-reward={row}>
          <GameArt kind="component" component={rows[row].good ?? 'lira'} />
          {#if rows[row].lira}<b>{rows[row].lira}</b>{/if}
        </span>
      {/each}
      <span
        class="block"
        class:lower={lower[column]}
        data-mail-block
        aria-hidden="true"
      ></span>
    </span>
  {/each}
</span>

<style>
  .mail-track {
    display: flex;
    width: 100%;
    gap: 2%;
    padding: 2%;
    box-sizing: border-box;
    background: #e4cf9d;
    border: 2px solid #cda65f;
    border-radius: 5%;
    box-shadow: 0 2px 4px #0008;
    container-type: inline-size;
  }
  .column {
    position: relative;
    flex: 1;
    aspect-ratio: 12 / 25;
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 4%;
    min-width: 0;
  }
  .reward {
    position: relative;
    display: grid;
    place-items: center;
    border: 1px solid #8f7449;
    border-radius: 8%;
    background: #f2e4bd;
    min-height: 0;
  }
  .reward :global(.game-art) {
    width: 85%;
    height: 85%;
    min-height: 0;
    object-fit: contain;
  }
  b {
    position: absolute;
    right: 6%;
    bottom: 0;
    font-size: 6.5cqw;
    color: #173f43;
    text-shadow: none;
  }
  .block {
    position: absolute;
    z-index: 3;
    width: 100%;
    height: 48%;
    top: 0;
    border-radius: 8%;
    background: linear-gradient(135deg, #be6050, #763329);
    box-shadow:
      inset 0 0 0 2px #dfaa71,
      0 2px 4px #0008;
  }
  .block.lower {
    top: 52%;
  }
</style>
