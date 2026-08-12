<script lang="ts">
  import '@fontsource/atkinson-hyperlegible/400.css';
  import '@fontsource/atkinson-hyperlegible/700.css';
  import '@fontsource/cormorant-garamond/700.css';
  import { onMount } from 'svelte';
  import { appTitle, shellFeatures } from '$lib/app-metadata';
  import { initializeFirebase } from '$lib/firebase';

  let status = $state<'connecting' | 'synced' | 'error'>('connecting');
  let statusText = $state('Connecting to Firebase…');
  const buildHash = (import.meta.env.VITE_GIT_HASH ?? 'local').slice(0, 7);

  onMount(async () => {
    try {
      await initializeFirebase();
      status = 'synced';
      statusText =
        import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
          ? 'Firebase emulator ready'
          : 'Firebase ready';
    } catch (error) {
      status = 'error';
      statusText = error instanceof Error ? error.message : 'Firebase unavailable';
    }
  });
</script>

<svelte:head>
  <title>{appTitle}</title>
</svelte:head>

<main data-e2e-layout>
  <article class="shell" aria-labelledby="title">
    <section class="introduction">
      <p class="eyebrow"><span aria-hidden="true">◆</span> A market for two to five</p>
      <h1 id="title">Build your route through the bazaar.</h1>
      <p class="lede">
        Lead your assistants between sixteen places, fill your wheelbarrow, and turn a
        well-planned route into a glittering collection of rubies.
      </p>

      <div class="connection">
        <span class="connection-mark" aria-hidden="true"></span>
        <p role="status" data-status={status}>{statusText}</p>
      </div>
      <p class="build" data-testid="build-marker">Build {buildHash}</p>
    </section>

    <section class="route" aria-labelledby="route-title">
      <div class="route-heading">
        <p>Opening route</p>
        <h2 id="route-title">Four steps to a ruby</h2>
      </div>
      <ol>
        {#each shellFeatures as feature}
          <li>
            <span class="number">{feature.number}</span>
            <span class="feature-copy">
              <strong>{feature.title}</strong>
              <span>{feature.description}</span>
            </span>
          </li>
        {/each}
      </ol>
      <div class="ruby" aria-hidden="true"><span></span></div>
    </section>
  </article>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(html) {
    min-width: 320px;
    background: #efe0c2;
    color: #173f43;
    font-family: 'Atkinson Hyperlegible', sans-serif;
  }

  :global(body) {
    margin: 0;
  }

  :global(button, input) {
    font: inherit;
  }

  main {
    min-height: 100svh;
    display: grid;
    place-items: center;
    overflow: hidden;
    padding: clamp(1rem, 3vw, 2.5rem);
    background:
      linear-gradient(90deg, rgb(23 63 67 / 4%) 1px, transparent 1px) 0 0 / 4rem 4rem,
      linear-gradient(rgb(23 63 67 / 4%) 1px, transparent 1px) 0 0 / 4rem 4rem,
      radial-gradient(circle at 12% 14%, rgb(255 250 235 / 92%), transparent 27rem),
      linear-gradient(145deg, #f4ead6, #e6cfa4);
  }

  .shell {
    position: relative;
    width: min(70rem, 100%);
    min-height: min(44rem, calc(100svh - 5rem));
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(18rem, 0.88fr);
    overflow: hidden;
    border: 1px solid rgb(23 63 67 / 28%);
    border-radius: 2rem;
    background: rgb(255 251 240 / 90%);
    box-shadow: 0 2rem 5rem rgb(76 48 22 / 18%);
  }

  .introduction {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: clamp(2.5rem, 6vw, 6rem);
  }

  .eyebrow,
  .route-heading p {
    margin: 0;
    color: #aa3e31;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .eyebrow span {
    display: inline-block;
    margin-right: 0.4rem;
    color: #d7892f;
  }

  h1 {
    max-width: 9ch;
    margin: 0.7rem 0 1.3rem;
    font: 700 clamp(3.4rem, 7vw, 6.6rem) / 0.86 'Cormorant Garamond', serif;
    letter-spacing: -0.035em;
  }

  .lede {
    max-width: 34rem;
    margin: 0;
    color: #3e5c5c;
    font-size: clamp(1.02rem, 1.6vw, 1.2rem);
    line-height: 1.55;
  }

  .connection {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-top: clamp(2rem, 5vw, 4rem);
  }

  .connection-mark {
    width: 0.65rem;
    height: 0.65rem;
    flex: 0 0 auto;
    border: 2px solid #173f43;
    border-radius: 50%;
    background: #e7c882;
  }

  [role='status'] {
    margin: 0;
    font-weight: 700;
  }

  .connection:has([data-status='synced']) .connection-mark {
    border-color: #23664d;
    background: #58a575;
  }

  .connection:has([data-status='error']) .connection-mark {
    border-color: #8b2528;
    background: #ce4c4f;
  }

  [data-status='error'] {
    color: #8b2528;
  }

  .build {
    margin: 0.45rem 0 0 1.3rem;
    color: #617574;
    font-size: 0.82rem;
  }

  .route {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    padding: clamp(2rem, 5vw, 4.5rem);
    color: #fffaf0;
    background:
      linear-gradient(135deg, transparent 49.5%, rgb(255 255 255 / 6%) 50%) 0 0 / 2.5rem 2.5rem,
      #173f43;
  }

  .route::before,
  .route::after {
    position: absolute;
    content: '';
    border: 1px solid rgb(239 202 125 / 24%);
    border-radius: 50%;
  }

  .route::before {
    width: 18rem;
    height: 18rem;
    top: -9rem;
    right: -8rem;
  }

  .route::after {
    width: 10rem;
    height: 10rem;
    right: -5rem;
    bottom: -5rem;
  }

  .route-heading {
    position: relative;
    z-index: 1;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid rgb(255 250 240 / 24%);
  }

  .route-heading p {
    color: #efca7d;
  }

  h2 {
    margin: 0.25rem 0 0;
    font: 700 clamp(1.8rem, 3vw, 2.6rem) / 1 'Cormorant Garamond', serif;
  }

  ol {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: 2.4rem 1fr;
    gap: 0.85rem;
    align-items: center;
    min-height: 5.2rem;
    border-bottom: 1px solid rgb(255 250 240 / 14%);
  }

  .number {
    color: #efca7d;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .feature-copy {
    display: grid;
    gap: 0.12rem;
  }

  .feature-copy strong {
    font-size: 1.05rem;
  }

  .feature-copy > span {
    color: #bdd0ca;
    font-size: 0.9rem;
  }

  .ruby {
    position: absolute;
    z-index: 2;
    right: 1.25rem;
    bottom: 1.25rem;
    width: 2.7rem;
    height: 2.7rem;
    display: grid;
    rotate: 45deg;
    place-items: center;
    border: 2px solid #f4b4a8;
    border-radius: 0.45rem;
    background: linear-gradient(135deg, #ce3f48, #8e1f35);
    box-shadow: 0 0.4rem 1rem rgb(0 0 0 / 30%);
  }

  .ruby span {
    width: 45%;
    height: 45%;
    border: 1px solid rgb(255 255 255 / 65%);
    border-radius: 0.1rem;
  }

  @media (max-width: 720px) {
    main {
      padding: 0.75rem;
    }

    .shell {
      min-height: calc(100svh - 1.5rem);
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr;
      border-radius: 1.4rem;
    }

    .introduction {
      padding: 1.7rem 1.5rem 1.25rem;
    }

    h1 {
      max-width: 11ch;
      margin: 0.35rem 0 0.65rem;
      font-size: clamp(2.8rem, 14vw, 4.3rem);
    }

    .lede {
      font-size: 0.98rem;
      line-height: 1.42;
    }

    .connection {
      margin-top: 1.2rem;
    }

    .route {
      min-height: 20rem;
      padding: 1.4rem 1.5rem;
    }

    .route-heading {
      padding-bottom: 0.7rem;
    }

    h2 {
      font-size: 1.7rem;
    }

    li {
      min-height: 3.8rem;
    }

    .feature-copy > span {
      font-size: 0.82rem;
    }

    .ruby {
      right: 1rem;
      bottom: 1rem;
      width: 2.2rem;
      height: 2.2rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
    }
  }
</style>
