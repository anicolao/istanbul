<script lang="ts">
  import QRCode from 'qrcode';

  let { url, label, compact = false }: { url: string; label: string; compact?: boolean } = $props();
  let svg = $state('');

  $effect(() => {
    const currentUrl = url;
    void QRCode.toString(currentUrl, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      color: { dark: '#173f43', light: '#fffaf0' }
    }).then((value) => { if (currentUrl === url) svg = value; });
  });
</script>

<figure class:compact aria-label={`${label} scannable invitation`} data-testid="seat-qr" data-invitation-url={url}>
  <div class="qr" aria-hidden="true">{@html svg}</div>
  <figcaption><strong>{label}</strong><small>Scan to claim this controller</small></figcaption>
</figure>

<style>
  figure { margin: 0; display: grid; gap: .65rem; justify-items: center; color: #173f43; text-align: center; }
  .qr { width: min(12rem, 100%); aspect-ratio: 1; overflow: hidden; padding: .45rem; border: 1px solid #d3b36f; border-radius: .8rem; background: #fffaf0; box-shadow: 0 .8rem 1.6rem #301b1230; }
  .qr :global(svg) { width: 100%; height: 100%; display: block; }
  figcaption { display: grid; line-height: 1.1; }
  figcaption strong { font: 700 1.15rem 'Cormorant Garamond', serif; }
  figcaption small { margin-top: .2rem; color: #607674; font-size: .65rem; }
  figure.compact { grid-template-columns: 4.2rem 1fr; justify-items: start; color: #fffaf0; text-align: left; }
  figure.compact .qr { width: 4.2rem; padding: .2rem; border-radius: .45rem; box-shadow: none; }
  figure.compact figcaption { align-self: center; }
  figure.compact figcaption small { color: #bdd0ca; }
</style>
