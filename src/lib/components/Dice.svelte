<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
  let { values, oldValues, rolling = false, adjusting = false }: {
    values: number[]; oldValues?: number[]; rolling?: boolean; adjusting?: boolean;
  } = $props();
  let canvas: HTMLCanvasElement;
  let clock = $state<HTMLSpanElement>();
  let draw: (() => void) | undefined;
  $effect(() => { values; oldValues; adjusting; draw?.(); });
  const dots: Record<number, number[][]> = {
    1: [[0,0]], 2: [[-1,-1],[1,1]], 3: [[-1,-1],[0,0],[1,1]],
    4: [[-1,-1],[-1,1],[1,-1],[1,1]],
    5: [[-1,-1],[-1,1],[0,0],[1,-1],[1,1]],
    6: [[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]
  };
  // Fixed, opposite faces sum to seven; rotations put the result on top.
  const poses: Record<number, [number,number,number]> = {
    1: [0,0,0], 6: [Math.PI,0,0], 3: [-Math.PI/2,0,0],
    4: [Math.PI/2,0,0], 2: [0,0,Math.PI/2], 5: [0,0,-Math.PI/2]
  };
  onMount(() => {
    // Geometry, ruby finish, ivory pips and damped tumble adapted from
    // ../cantstop/src/lib/scene/{Die.svelte,materials.ts,Scene.svelte}.
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();
    camera.position.set(0, 7, 4.5);
    camera.lookAt(0, .65, 0);
    scene.add(new THREE.HemisphereLight('#fff4d6', '#4f2630', 3));
    const key = new THREE.DirectionalLight('#fff4df', 5);
    key.position.set(-3, 7, 5); key.castShadow = true;
    key.shadow.mapSize.set(512,512); key.shadow.bias = -.001;
    scene.add(key);
    const rim = new THREE.DirectionalLight('#ffffff', 3);
    rim.position.set(4,3,-3); scene.add(rim);
    const ruby = new THREE.MeshPhysicalMaterial({ color:'#a01122', metalness:.05,
      roughness:.09, transmission:.65, thickness:1.1, ior:1.49, clearcoat:1,
      clearcoatRoughness:.07, attenuationColor:'#c91834', attenuationDistance:2.4 });
    const ivory = new THREE.MeshPhysicalMaterial({ color:'#fff0c6', roughness:.3, clearcoat:.4 });
    const body = new RoundedBoxGeometry(1.03,1.03,1.03,5,.14);
    const pip = new THREE.SphereGeometry(.09,16,12);
    const groundGeometry = new THREE.PlaneGeometry(20,20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity:.28 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
    const dice = values.map(() => {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(body,ruby); mesh.castShadow = true; mesh.receiveShadow = true;
      group.add(mesh);
      const faces = [
        {n:1,p:[0,.513,0],r:[-Math.PI/2,0,0]}, {n:6,p:[0,-.513,0],r:[Math.PI/2,0,0]},
        {n:3,p:[0,0,.513],r:[0,0,0]}, {n:4,p:[0,0,-.513],r:[0,Math.PI,0]},
        {n:2,p:[.513,0,0],r:[0,Math.PI/2,0]}, {n:5,p:[-.513,0,0],r:[0,-Math.PI/2,0]}
      ];
      for (const face of faces) {
        const side = new THREE.Group(); side.position.set(...face.p as [number,number,number]);
        side.rotation.set(...face.r as [number,number,number]);
        for (const [x,y] of dots[face.n]) {
          const dot = new THREE.Mesh(pip,ivory); dot.position.set(x*.255,y*.255,-.004);
          dot.scale.set(1,1,.24); side.add(dot);
        }
        group.add(side);
      }
      scene.add(group); return group;
    });
    function orientation(value: number, index: number) {
      const face = new THREE.Quaternion().setFromEuler(new THREE.Euler(...poses[value]));
      return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), index ? .13 : -.12).multiply(face);
    }
    let lastProgress = -1;
    function render() {
      const animation = clock?.getAnimations()[0];
      const progress = rolling ? Number(animation?.effect?.getComputedTiming().progress ?? 1) : 1;
      const remaining = 1-progress;
      dice.forEach((die,i) => {
        const final = orientation(values[i],i);
        if (adjusting) {
          die.position.set((i-(dice.length-1)/2)*1.43,.56,0);
          die.quaternion.copy(orientation(oldValues?.[i] ?? values[i],i)).slerp(final,progress);
        } else {
          die.position.set((i-(dice.length-1)/2)*1.43+Math.sin(i*2.4+progress*9)*remaining*.8,
            .56+(progress<1?(Math.abs(Math.sin(progress*Math.PI*3.2+i*.35))*1.4+.15)*remaining:0),
            Math.cos(i*3+progress*7)*remaining*.5);
          die.quaternion.setFromEuler(new THREE.Euler(remaining*(8+i*.8),remaining*(10-i),remaining*(6+i*.5))).multiply(final);
        }
      });
      renderer.render(scene,camera); lastProgress = progress;
      canvas.dataset.progress = String(progress);
    }
    function resize() {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width,height,false);
      const span = dice.length === 1 ? 1.85 : 5;
      camera.left = -span/2; camera.right = span/2;
      camera.top = span*height/width/2; camera.bottom = -camera.top;
      camera.updateProjectionMatrix(); render();
    }
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    draw = render; resize();
    let frame = 0, lastFrame = 0;
    function animate(now: number) {
      const progress = Number(clock?.getAnimations()[0]?.effect?.getComputedTiming().progress ?? 1);
      if (progress !== lastProgress && now - lastFrame >= 1000 / 30) { render(); lastFrame = now; }
      frame = requestAnimationFrame(animate);
    }
    if (rolling) frame = requestAnimationFrame(animate);
    return () => {
      draw = undefined; cancelAnimationFrame(frame); observer.disconnect();
      body.dispose(); pip.dispose(); ruby.dispose(); ivory.dispose();
      groundGeometry.dispose(); groundMaterial.dispose(); renderer.dispose(); renderer.forceContextLoss();
    };
  });
</script>
<span class="dice-model" class:rolling class:single={values.length === 1} role="img" aria-label={`Dice: ${values.join(' and ')}`}>
  <canvas bind:this={canvas} data-dice-values={values.join(',')}></canvas>
  {#if rolling}<span bind:this={clock} data-dice-clock aria-hidden="true"></span>{/if}
</span>
<style>
  .dice-model { display: inline-block; width: 160px; aspect-ratio: 5 / 3; vertical-align: middle; }
  .dice-model.single { width: 60px; aspect-ratio: 1; }
  .dice-model.rolling { width: 100%; height: 100%; aspect-ratio: auto; }
  canvas { display: block; width: 100%; height: 100%; }
  [data-dice-clock] { position: absolute; width: 0; height: 0; pointer-events: none; }
</style>
