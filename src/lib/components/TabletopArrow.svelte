<script lang="ts">
  let { back = false }: { back?: boolean } = $props();
</script>

<!-- Draw navigation arrows consistently instead of relying on OS fallback glyphs. -->
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d={back ? "M18 6 6 18M6 7v11h11" : "M4 12h16m-6-6 6 6-6 6"} />
</svg>

<style>
  svg {
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    flex-shrink: 0;
  }
  path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
