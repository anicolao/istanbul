import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const dots: Record<number, number[][]> = {
  1: [[0,0]], 2: [[-1,-1],[1,1]], 3: [[-1,-1],[0,0],[1,1]],
  4: [[-1,-1],[-1,1],[1,-1],[1,1]],
  5: [[-1,-1],[-1,1],[0,0],[1,-1],[1,1]],
  6: [[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]
};
const poses: Record<number, [number,number,number]> = {
  1: [0,0,0], 6: [Math.PI,0,0], 3: [-Math.PI/2,0,0],
  4: [Math.PI/2,0,0], 2: [0,0,Math.PI/2], 5: [0,0,-Math.PI/2]
};
export function diceOrientation(value: number, index: number) {
  const face = new THREE.Quaternion().setFromEuler(new THREE.Euler(...poses[value]));
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), index ? .13 : -.12).multiply(face);
}
function createRenderer() {
  // Geometry, ruby finish, ivory pips and damped tumble adapted from
  // ../cantstop/src/lib/scene/{Die.svelte,materials.ts,Scene.svelte}.
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera();
  camera.position.set(0,7,4.5); camera.lookAt(0,.65,0);
  scene.add(new THREE.HemisphereLight('#fff4d6','#4f2630',3));
  const key = new THREE.DirectionalLight('#fff4df',5);
  key.position.set(-3,7,5); key.castShadow = true;
  key.shadow.mapSize.set(512,512); key.shadow.bias = -.001; scene.add(key);
  const rim = new THREE.DirectionalLight('#ffffff',3);
  rim.position.set(4,3,-3); scene.add(rim);
  const ruby = new THREE.MeshPhysicalMaterial({ color:'#a01122', metalness:.05,
    roughness:.09, transmission:.65, thickness:1.1, ior:1.49, clearcoat:1,
    clearcoatRoughness:.07, attenuationColor:'#c91834', attenuationDistance:2.4 });
  const ivory = new THREE.MeshPhysicalMaterial({ color:'#fff0c6', roughness:.3, clearcoat:.4 });
  const body = new RoundedBoxGeometry(1.03,1.03,1.03,5,.14);
  const pip = new THREE.SphereGeometry(.09,16,12);
  const groundGeometry = new THREE.PlaneGeometry(20,20);
  const groundMaterial = new THREE.ShadowMaterial({ opacity:.28 });
  const ground = new THREE.Mesh(groundGeometry,groundMaterial);
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  const dice = [0,1].map(() => {
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
  return {
    draw(canvas: HTMLCanvasElement, values: number[], progress: number, oldValues?: number[], adjusting = false, rolling = false) {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      if (!width || !height) return;
      const ratio = Math.min(devicePixelRatio,2);
      const w = Math.round(width*ratio), h = Math.round(height*ratio);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      const size = renderer.getSize(new THREE.Vector2());
      if (size.x !== w || size.y !== h) renderer.setSize(w,h,false);
      const span = rolling ? 5 : values.length === 1 ? 1.6 : 3.2;
      camera.lookAt(0, rolling ? .65 : .56, 0);
      camera.left = -span/2; camera.right = span/2;
      camera.top = span*height/width/2; camera.bottom = -camera.top; camera.updateProjectionMatrix();
      const remaining = 1-progress;
      dice.forEach((die,i) => {
        die.visible = i < values.length;
        if (!die.visible) return;
        const final = diceOrientation(values[i],i);
        if (adjusting) {
          die.position.set((i-(values.length-1)/2)*1.43,.56,0);
          die.quaternion.copy(diceOrientation(oldValues?.[i] ?? values[i],i)).slerp(final,progress);
        } else {
          die.position.set((i-(values.length-1)/2)*1.43+Math.sin(i*2.4+progress*9)*remaining*.8,
            .56+(progress<1?(Math.abs(Math.sin(progress*Math.PI*3.2+i*.35))*1.4+.15)*remaining:0),
            Math.cos(i*3+progress*7)*remaining*.5);
          die.quaternion.setFromEuler(new THREE.Euler(remaining*(8+i*.8),remaining*(10-i),remaining*(6+i*.5))).multiply(final);
        }
      });
      renderer.render(scene,camera);
      const context = canvas.getContext('2d')!;
      context.clearRect(0,0,w,h); context.drawImage(renderer.domElement,0,0);
    },
    dispose() {
      body.dispose(); pip.dispose(); ruby.dispose(); ivory.dispose();
      groundGeometry.dispose(); groundMaterial.dispose(); key.shadow.dispose();
      renderer.dispose(); renderer.forceContextLoss();
    }
  };
}
// Share one GPU context and compiled shader set across roll/result/control views.
// A short grace period preserves it through Svelte's roll-to-result transition.
let shared: ReturnType<typeof createRenderer> | undefined;
let users = 0;
let cleanup: ReturnType<typeof setTimeout> | undefined;
export function acquireDiceRenderer() {
  if (cleanup) clearTimeout(cleanup);
  shared ??= createRenderer(); users++;
  const renderer = shared;
  return {
    draw: renderer.draw,
    release() {
      if (--users === 0) cleanup = setTimeout(() => {
        renderer.dispose(); if (shared === renderer) shared = undefined;
      }, 30_000);
    }
  };
}
