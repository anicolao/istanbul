<script lang="ts">
  import type { PlaceManifest } from '$lib/game/manifests';
  let { glyph }: { glyph: PlaceManifest['glyph'] } = $props();
</script>

<svg viewBox="0 0 48 48" aria-hidden="true">
  {#if glyph === 'wheel'}
    <circle cx="24" cy="27" r="13"/><circle cx="24" cy="27" r="4"/><path d="M24 14v26M11 27h26M15 18l18 18M33 18 15 36"/>
  {:else if glyph === 'fabric'}
    <path d="M10 14c7-5 21-5 28 0v21c-7-5-21-5-28 0Z"/><path d="M16 13v20M24 11v20M32 13v20"/>
  {:else if glyph === 'spice'}
    <path d="M10 34c4-13 12-21 28-23-2 16-10 25-28 23Z"/><path d="M13 32 34 15M20 27l-2-8M26 22l7 1"/>
  {:else if glyph === 'fruit'}
    <circle cx="23" cy="27" r="12"/><path d="M23 15c0-5 4-8 9-7M24 15c-5-5-9-4-12-1"/>
  {:else if glyph === 'mail'}
    <rect x="8" y="13" width="32" height="23" rx="3"/><path d="m10 16 14 11 14-11"/>
  {:else if glyph === 'cards'}
    <rect x="11" y="9" width="21" height="28" rx="3"/><rect x="17" y="12" width="21" height="28" rx="3"/><path d="m23 25 5-6 5 6-5 6Z"/>
  {:else if glyph === 'fountain'}
    <path d="M8 35h32M14 30h20M18 25h12M24 8v17M15 20c0-6 4-10 9-10M33 20c0-6-4-10-9-10"/><circle cx="24" cy="8" r="2"/>
  {:else if glyph === 'dice'}
    <rect x="9" y="9" width="30" height="30" rx="6"/><circle cx="17" cy="17" r="2"/><circle cx="31" cy="17" r="2"/><circle cx="24" cy="24" r="2"/><circle cx="17" cy="31" r="2"/><circle cx="31" cy="31" r="2"/>
  {:else if glyph === 'tea'}
    <path d="M10 18h25v12a9 9 0 0 1-9 9h-7a9 9 0 0 1-9-9Z"/><path d="M35 21h3a5 5 0 0 1 0 10h-4M17 13c-2-3 2-4 0-7M25 13c-2-3 2-4 0-7"/>
  {:else if glyph === 'market'}
    <path d="M8 20h32l-4-10H12Z"/><path d="M11 20v20M37 20v20M8 40h32M18 20v20M30 20v20"/>
  {:else if glyph === 'police'}
    <path d="M24 7 38 13v10c0 9-5 15-14 19-9-4-14-10-14-19V13Z"/><path d="M18 24h12M24 18v12"/>
  {:else if glyph === 'palace'}
    <path d="M7 40h34M11 40V24h26v16M8 24h32L24 8Z"/><path d="M18 40V28h12v12M24 8V4"/>
  {:else if glyph === 'mosque'}
    <path d="M9 40h30M13 40V24h22v16M16 24c0-8 4-13 8-17 4 4 8 9 8 17M8 40V17M40 40V17M6 17h4M38 17h4"/>
  {:else if glyph === 'gem'}
    <path d="m24 6 15 12-15 24L9 18Z"/><path d="m9 18 15 7 15-7M17 12l7 13 7-13M24 25v17"/>
  {/if}
</svg>

<style>
  svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  circle { fill: currentColor; }
  circle:first-child { fill: none; }
</style>
