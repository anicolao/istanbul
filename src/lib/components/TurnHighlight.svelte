<script lang="ts">
  let { marquee = false }: { marquee?: boolean } = $props();
</script>

<span class="turn-highlight" class:marquee aria-hidden="true">
  {#if marquee}<svg class="marquee-track" width="100%" height="100%" aria-hidden="true">
    <rect class="backing" x="3" y="3" rx="3" />
    <rect class="marching" x="3" y="3" rx="3" pathLength="120" />
  </svg>{/if}
</span>

<style>
  .turn-highlight {
    position: absolute;
    inset: 0;
    z-index: 6;
    box-sizing: border-box;
    border: 2px solid var(--seat-color);
    border-radius: inherit;
    box-shadow: inset 0 0 6px var(--seat-color);
    pointer-events: none;
  }
  .turn-highlight.marquee {
    border: 0;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--seat-color) 35%, transparent), inset 0 0 6px var(--seat-color);
  }
  .marquee-track { position: absolute; inset: 0; overflow: visible; }
  .marquee-track rect {
    width: calc(100% - 6px);
    height: calc(100% - 6px);
    fill: none;
  }
  .marquee-track .backing {
    stroke: #071c19;
    stroke-width: 7px;
  }
  .marquee-track .marching {
    stroke: color-mix(in srgb, var(--seat-color) 80%, white);
    stroke-width: 4px;
    stroke-linecap: butt;
    /* One hundred complete 1.2-unit pairs fit the 120-unit perimeter. */
    stroke-dasharray: 0.9 0.3;
    filter: drop-shadow(0 0 2px var(--seat-color));
    animation: destination-marquee 40s linear infinite;
  }
  @keyframes destination-marquee { to { stroke-dashoffset: -24; } }
  @media (prefers-reduced-motion: reduce) {
    .marquee-track rect { animation: none; }
  }
</style>
