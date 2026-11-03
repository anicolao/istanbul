<script lang="ts">
  import type { BotPolicy } from '$lib/game/bot-policy';
  let {value=$bindable<BotPolicy>('money-v1'),disabled=false}:{value?:BotPolicy;disabled?:boolean}=$props();
</script>
<label><span>Bot strategy</span><select bind:value {disabled}><option value="money-v1">Money</option><option value="rl-v2">Trained</option></select></label>
<style>
  label { display: grid; gap: .2rem; font-size: .75rem; min-width: 0; }
  span { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }
  select { max-width: 100%; min-width: 0; padding: .3rem; border: 1px solid #b8a579; border-radius: .3rem; color: #173f43; background: #fff8e9; font: inherit; }
</style>
