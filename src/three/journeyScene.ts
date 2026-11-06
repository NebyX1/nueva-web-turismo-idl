import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { journeyDefinitions as definitions, JOURNEY_WORLD_SIZE, JOURNEY_FOREST_SIZE, JOURNEY_TERRAIN_SEGMENTS, JOURNEY_DAY_FOG, JOURNEY_NIGHT_FOG } from './journeySites';
import { journeyTerrainHeight as terrainHeight } from './journeyTerrain';
import type { LandmarkModel } from './types';
import { createJourneyAtmosphere } from './journeyAtmosphere';
import type { JourneyMode } from '../lib/journeyModeTransition';

export type JourneyPhase = 'Llegando' | 'Acercándonos' | 'Mirada panorámica' | 'El paisaje se abre';
interface Callbacks {
  onStop(index: number): void;
  onPhase(phase: JourneyPhase): void;
  onProgress(progress: number): void;
  onReady(): void;
  onUnavailable(): void;
}
export interface JourneyScene {
  select(index: number): void;
  replay(): void;
  setPaused(paused: boolean): void;
  setMode(mode: JourneyMode): void;
  dispose(): void;
}
const STOP_SECONDS = 22;
const smooth = (t: number) => THREE.MathUtils.smoothstep(t, 0, 1);
function random(seed: number) { let value = seed; return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; }; }

function grassTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!, rand = random(478);
  ctx.fillStyle = '#d6d8c3'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 48000; i++) {
    const x = rand() * 512, y = rand() * 512, light = 155 + rand() * 80;
    ctx.strokeStyle = `rgba(${light},${light + 6},${light - 13},.35)`; ctx.lineWidth = .35 + rand() * 1.1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rand() * 4 - 2, y + rand() * 5); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(60, 60); texture.anisotropy = 4;
  return texture;
}

function makeTerrain() {
  const geometry = new THREE.PlaneGeometry(JOURNEY_WORLD_SIZE, JOURNEY_WORLD_SIZE, JOURNEY_TERRAIN_SEGMENTS, JOURNEY_TERRAIN_SEGMENTS);
  geometry.rotateX(-Math.PI / 2);
  const p = geometry.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const grass = new THREE.Color(), a = new THREE.Color('#708452'), b = new THREE.Color('#9c9b68');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, terrainHeight(x, z));
    const noise = .5 + Math.sin(x * .039 + z * .017) * .16 + Math.cos(z * .051 - x * .012) * .18;
    grass.copy(a).lerp(b, THREE.MathUtils.clamp(noise, 0, .65));
    grass.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const texture = grassTexture();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, map: texture, bumpMap: texture, bumpScale: .18, roughness: 1 }));
  mesh.receiveShadow = true;
  return mesh;
}

function makeForest(mobile: boolean) {
  const count = mobile ? 1100 : 2300, rand = random(7193), group = new THREE.Group();
  const crownGeometry = new THREE.IcosahedronGeometry(1, 1);
  const crown = new THREE.InstancedMesh(crownGeometry, new THREE.MeshStandardMaterial({ color: '#526c43', roughness: 1, flatShading: false }), count * 2);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.14, .24, 1, 5), new THREE.MeshStandardMaterial({ color: '#5b4d39', roughness: 1 }), count);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  let placed = 0;
  for (let attempt = 0; placed < count && attempt < count * 8; attempt++) {
    const x = (rand() - .5) * JOURNEY_FOREST_SIZE, z = (rand() - .5) * JOURNEY_FOREST_SIZE;
    if (definitions.some(site => Math.hypot(x - site.x, z - site.z) < Math.max(125, site.pad ?? 0))) continue;
    if (Math.sin(x * .014) + Math.cos(z * .02) > .8 && rand() > .24) continue;
    const y = terrainHeight(x, z), height = 5 + rand() * 9, wide = 2.2 + rand() * 2.8;
    dummy.position.set(x, y + height * .38, z); dummy.scale.set(1, height * .76, 1); dummy.rotation.set(0, rand() * 6.28, .04); dummy.updateMatrix(); trunks.setMatrixAt(placed, dummy.matrix);
    for (let k = 0; k < 2; k++) {
      dummy.position.set(x + k * wide * .2, y + height * (.62 + k * .16), z); dummy.scale.set(wide * (1 - k * .1), height * .33, wide * .8); dummy.rotation.set(rand(), rand() * 6.28, rand() * .3); dummy.updateMatrix();
      crown.setMatrixAt(placed * 2 + k, dummy.matrix);
      color.setHSL(.24 + rand() * .045, .2 + rand() * .16, .19 + rand() * .09); crown.setColorAt(placed * 2 + k, color);
    }
    placed++;
  }
  crown.count = placed * 2; trunks.count = placed;
  crown.castShadow = true; crown.receiveShadow = true; trunks.castShadow = true;
  crown.computeBoundingSphere(); trunks.computeBoundingSphere(); group.add(crown, trunks);
  return group;
}

function makeSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uNight: { value: 0 } },
    vertexShader: 'varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform float uNight; varying vec3 vDirection;void main(){float h=normalize(vDirection).y;vec3 horizon=mix(vec3(.83,.87,.81),vec3(.025,.045,.075),uNight);vec3 sky=mix(vec3(.44,.64,.74),vec3(.003,.009,.025),uNight);float t=pow(max(h,0.),.48);vec3 col=mix(horizon,sky,t);vec3 sun=normalize(vec3(-.5,.7,.45));float d=max(dot(normalize(vDirection),sun),0.);col+=vec3(.32,.23,.09)*pow(d,25.)*(1.-uNight);gl_FragColor=vec4(col,1.);}',
  });
  return new THREE.Mesh(new THREE.SphereGeometry(4200, 32, 20), material);
}

export function createJourneyScene(host: HTMLElement, callbacks: Callbacks, initialMode: JourneyMode = 'day'): JourneyScene {
  const mobile = host.clientWidth < 700;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .98;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement; canvas.setAttribute('aria-hidden', 'true'); host.appendChild(canvas);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#cddbcf'); scene.fog = new THREE.FogExp2('#cddbcf', JOURNEY_DAY_FOG);
  const camera = new THREE.PerspectiveCamera(48, 1, .4, 5000);
  const sky = makeSky(); scene.add(sky);
  const hemisphere = new THREE.HemisphereLight('#e5f4fa', '#647044', 1.25);
  const ambient = new THREE.AmbientLight('#d8e5e0', .22);
  scene.add(hemisphere, ambient);
  const sun = new THREE.DirectionalLight('#fff0cf', 2.35); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -180, right: 180, top: 180, bottom: -180, near: 5, far: 800 });
  sun.shadow.bias = -.0003; sun.shadow.normalBias = .45; sun.shadow.radius = 3;
  scene.add(sun, sun.target, makeTerrain(), makeForest(mobile));

  const sites = definitions.map(definition => {
    const model: LandmarkModel = definition.make();
    const origin = new THREE.Vector3(definition.x, terrainHeight(definition.x, definition.z) + (definition.groundOffset ?? -.3), definition.z);
    model.group.position.add(origin); scene.add(model.group);
    const target = model.target.clone().add(origin);
    const direction = model.cameraDirection?.clone() || new THREE.Vector3(.75, .2, 1);
    direction.y = 0; direction.normalize();
    return { ...definition, model, origin, target, direction };
  });
  const atmosphere = createJourneyAtmosphere(scene, sites, mobile);
  const controls = new OrbitControls(camera, canvas);
  controls.enabled = false; controls.enableDamping = false; controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * .65;

  let disposed = false, paused = document.documentElement.classList.contains('motion-paused') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true, frame = 0, skyFrame = 0, last = 0, lastRender = 0, elapsed = paused ? 13 : 5, stopIndex = -1, previousPhase = '', ready = false;
  let transition: { from: THREE.Vector3; look: THREE.Vector3; to: THREE.Vector3; target: THREE.Vector3; fromFov: number; elapsed: number; index: number } | null = null;
  const look = new THREE.Vector3(), lightOffset = new THREE.Vector3(-180, 330, 190);
  const framing = () => Math.max(1, 1.05 / camera.aspect);
  function sideDirection(index: number, angle = 0) { return sites[index].direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle); }
  function widePose(index: number, ending = false) {
    const site = sites[index], distance = site.overviewDistance ?? Math.max(site.model.bounds.radius * 2.6, site.focus * 4.1);
    const p = site.origin.clone().addScaledVector(sideDirection(index, ending ? site.sweep : -.12), distance * framing());
    p.y += site.model.bounds.height * 1.35 + 35;
    return p;
  }
  function subject(index: number, factor = 0) {
    const site = sites[index], target = site.target.clone().add(new THREE.Vector3(0, site.model.bounds.height * factor, 0));
    target.y = Math.max(site.origin.y + .8, target.y);
    return target;
  }
  function notify(index: number, phase: JourneyPhase) {
    if (index !== stopIndex) { stopIndex = index; callbacks.onStop(index); }
    if (phase !== previousPhase) { previousPhase = phase; callbacks.onPhase(phase); }
  }
  function sample(time: number) {
    const index = Math.floor(time / STOP_SECONDS) % sites.length, local = time % STOP_SECONDS, site = sites[index];
    const near = site.origin.clone().addScaledVector(sideDirection(index), site.focus * 2.6 * framing());
    near.y = site.eye === undefined ? site.target.y - site.model.bounds.height * .22 : site.origin.y + site.eye;
    const lifted = site.origin.clone().addScaledVector(sideDirection(index, site.sweep), site.focus * 2.8 * framing());
    lifted.y = Math.max(site.origin.y + 1.7, near.y) + site.reveal * .06 + (site.rise ?? 0);
    const summit = site.target.clone(); summit.y = site.origin.y + site.reveal * .96;
    let phase: JourneyPhase;
    if (local < 5) {
      phase = 'Llegando';
      const prev = (index + sites.length - 1) % sites.length, from = widePose(prev, true), to = widePose(index);
      const middle = from.clone().lerp(to, .5); middle.y = Math.max(from.y, to.y) + 90;
      const path = new THREE.QuadraticBezierCurve3(from, middle, to);
      camera.position.copy(path.getPoint(smooth(local / 5))); look.copy(subject(prev)).lerp(subject(index), smooth(local / 5));
      camera.fov = 53;
    } else if (local < 10) {
      phase = 'Acercándonos'; const u = smooth((local - 5) / 5);
      camera.position.copy(widePose(index)).lerp(near, u); look.copy(subject(index)).lerp(subject(index, site.approachFocusFactor ?? -.13), u); camera.fov = THREE.MathUtils.lerp(53, 44, u);
    } else if (local < 16) {
      phase = 'Mirada panorámica'; const u = smooth((local - 10) / 6);
      camera.position.copy(near).lerp(lifted, u); look.copy(subject(index, site.approachFocusFactor ?? -.13)).lerp(summit, u); camera.fov = 44;
    } else {
      phase = 'El paisaje se abre'; const u = smooth((local - 16) / 6);
      camera.position.copy(lifted).lerp(widePose(index, true), u); look.copy(summit).lerp(subject(index), u); camera.fov = THREE.MathUtils.lerp(44, 53, u);
    }
    camera.position.y = Math.max(camera.position.y, terrainHeight(camera.position.x, camera.position.z) + 1.7);
    notify(index, phase); callbacks.onProgress(local / STOP_SECONDS);
  }
  function render(time: number) {
    if (disposed) return;
    const now = performance.now(), delta = lastRender ? Math.min(.05, Math.max(0, (now - lastRender) / 1000)) : 1 / 60;
    lastRender = now;
    sky.position.copy(camera.position);
    sun.position.copy(look).add(lightOffset); sun.target.position.copy(look); sun.target.updateMatrixWorld();
    for (const site of sites) site.model.update?.(time);
    camera.updateProjectionMatrix(); camera.lookAt(look);
    const settlingSky = atmosphere.update(camera, Math.max(0, stopIndex), time, delta);
    renderer.render(scene, camera);
    // A bounded dissolve can finish while the tour/water clock stays paused.
    if (settlingSky && paused && visible && !document.hidden && !skyFrame) {
      skyFrame = requestAnimationFrame(() => { skyFrame = 0; render(elapsed); });
    }
    if (!ready) { ready = true; host.dataset.journeyReady = 'true'; callbacks.onReady(); }
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || paused || !visible || document.hidden) { last = 0; return; }
    const delta = last ? Math.min((now - last) / 1000, .25) : 1 / 60; last = now;
    if (transition) {
      transition.elapsed += delta; const u = smooth(Math.min(1, transition.elapsed / 2.4));
      camera.position.copy(transition.from).lerp(transition.to, u); look.copy(transition.look).lerp(transition.target, u);
      camera.fov = THREE.MathUtils.lerp(transition.fromFov, 53, u);
      notify(transition.index, 'Llegando'); callbacks.onProgress(0);
      if (u >= 1) { elapsed = transition.index * STOP_SECONDS + 5; transition = null; }
    } else { elapsed = (elapsed + delta) % (STOP_SECONDS * sites.length); sample(elapsed); }
    render(elapsed); frame = requestAnimationFrame(tick);
  }
  function wake() { if (!frame && !disposed && !paused && visible && !document.hidden) frame = requestAnimationFrame(tick); }
  function resize() {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    const oldFraming = framing();
    renderer.setSize(width, height, false); camera.aspect = width / height;
    camera.setViewOffset(width, height, width > 700 ? -width * .13 : 0, width > 700 ? 0 : height * .1, width, height);
    camera.updateProjectionMatrix();
    if (ready) {
      if (paused) { camera.position.sub(look).multiplyScalar(framing() / oldFraming).add(look); configureControls(); }
      else if (!transition) sample(elapsed);
      render(elapsed);
    }
  }
  const observer = new ResizeObserver(resize); observer.observe(host);
  function stopFrames() { cancelAnimationFrame(frame); cancelAnimationFrame(skyFrame); frame = skyFrame = 0; last = lastRender = 0; }
  function resumeView() { if (paused) render(elapsed); else wake(); }
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) resumeView(); else stopFrames(); }, { threshold: .01 }); intersection.observe(host);
  const visibility = () => { if (document.hidden) stopFrames(); else if (visible) resumeView(); };
  const lost = (event: Event) => { event.preventDefault(); callbacks.onUnavailable(); dispose(); };
  canvas.addEventListener('webglcontextlost', lost); document.addEventListener('visibilitychange', visibility);
  controls.addEventListener('change', () => { if (paused && !disposed) { look.copy(controls.target); camera.position.y = Math.max(camera.position.y, terrainHeight(camera.position.x, camera.position.z) + 1.2); render(elapsed); } });
  function configureControls() {
    const site = sites[Math.max(0, stopIndex)], distance = camera.position.distanceTo(look);
    controls.target.copy(look); controls.minDistance = Math.min(site.focus * framing(), distance * .8); controls.maxDistance = Math.max(site.focus * 10 * framing(), distance * 1.2); controls.update();
  }
  function setPaused(value: boolean) {
    paused = value; last = 0; controls.enabled = value;
    if (value) { cancelAnimationFrame(frame); frame = 0; configureControls(); if (ready) render(elapsed); }
    else { cancelAnimationFrame(skyFrame); skyFrame = 0; wake(); }
  }
  function select(index: number) {
    index = Math.max(0, Math.min(sites.length - 1, index));
    if (paused) { elapsed = index * STOP_SECONDS + 13; transition = null; sample(elapsed); configureControls(); render(elapsed); }
    else { transition = { from: camera.position.clone(), look: look.clone(), to: widePose(index), target: subject(index), fromFov: camera.fov, elapsed: 0, index }; notify(index, 'Llegando'); wake(); }
  }
  function applyMode(mode: JourneyMode) {
    const night = mode === 'night';
    sky.material.uniforms.uNight.value = night ? 1 : 0;
    scene.background = new THREE.Color(night ? '#081220' : '#cddbcf');
    scene.fog = new THREE.FogExp2(night ? '#0b1725' : '#cddbcf', night ? JOURNEY_NIGHT_FOG : JOURNEY_DAY_FOG);
    hemisphere.color.set(night ? '#a8c6ed' : '#e5f4fa');
    hemisphere.groundColor.set(night ? '#263b3d' : '#647044');
    hemisphere.intensity = night ? .42 : 1.25;
    ambient.color.set(night ? '#8ea8cf' : '#d8e5e0'); ambient.intensity = night ? .12 : .22;
    sun.color.set(night ? '#aecafa' : '#fff0cf'); sun.intensity = night ? .72 : 2.35;
    renderer.toneMappingExposure = night ? 1.08 : .98;
    atmosphere.setNight(night);
  }
  function setMode(mode: JourneyMode) {
    if (disposed) return;
    applyMode(mode);
    // Changing the lighting must also draw a frame when the tour is paused.
    render(elapsed);
  }
  function dispose() {
    if (disposed) return; disposed = true; stopFrames(); observer.disconnect(); intersection.disconnect(); controls.dispose();
    document.removeEventListener('visibilitychange', visibility); canvas.removeEventListener('webglcontextlost', lost);
    atmosphere.dispose();
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    scene.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) { materials.add(material); for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value); }
    });
    geometries.forEach(g => g.dispose()); textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); sun.shadow.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); delete host.dataset.journeyReady;
  }
  applyMode(initialMode); resize(); sample(elapsed); render(elapsed); setPaused(paused); wake();
  return { select, setPaused, setMode, replay() { transition = null; elapsed = 5; sample(5); controls.target.copy(look); render(5); wake(); }, dispose };
}
