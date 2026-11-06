import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url), cache = new Map();
function load(file) {
  file = resolve(root, file);
  if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, { module, exports: module.exports, atob, require: s => s.startsWith('.') ? load(resolve(dirname(file), s.endsWith('.json') ? s : s + '.ts')) : require(s) }, { filename: file });
  return module.exports;
}
function effectivelyVisible(object) { for (let node = object; node; node = node.parent) if (!node.visible) return false; return true; }

const { createJourneyNightVisitors } = load('src/three/journeyNightVisitors.ts');
const camera = new THREE.PerspectiveCamera(48, 1600 / 900, .4, 5000);
camera.position.set(10, 40, 80); camera.lookAt(0, 60, 0); camera.updateMatrixWorld();
const visitors = createJourneyNightVisitors(() => 0), scene = new THREE.Scene(), sky = new THREE.Group(); scene.add(sky); sky.add(visitors.group);
const geometries = new Set(), surfaces = new Set(); let meshCount = 0, triangles = 0;
visitors.group.traverse(object => {
  if (!object.isMesh) return;
  meshCount++; geometries.add(object.geometry); surfaces.add(object.material);
  triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
  assert.ok(!object.castShadow && !object.material.fog, 'Visitors need no extra shadow maps and must remain readable in the sky');
  for (const attribute of Object.values(object.geometry.attributes)) assert.ok([...attribute.array].every(Number.isFinite));
});
assert.ok(triangles < 70000 && meshCount < 240, 'Keep the comic sculptures within a small shared budget');
visitors.update(camera, 20); assert.equal(visitors.group.visible, false);
visitors.setNight(true);
for (let i = 0; i < 7 * 60; i++) visitors.update(camera, 1 / 60);
assert.equal(visitors.group.userData.active, null, 'Night begins with an actual random waiting interval');
const seen = [], flight = visitors.group.getObjectByName('journey-night-visitor-flight');
let previous = null, pausedChecked = false;
for (let i = 0; i < 240 * 60; i++) {
  visitors.update(camera, 1 / 60);
  const active = visitors.group.userData.active;
  if (active && active !== previous) seen.push(active);
  previous = active;
  const visible = []; visitors.group.traverse(object => { if (object.userData.kind && effectivelyVisible(object)) visible.push(object); });
  assert.equal(visible.length, active ? 1 : 0, 'Only one surprise may fly at a time');
  if (active && visitors.group.userData.progress > .4 && !pausedChecked) {
    const progress = visitors.group.userData.progress, heldPosition = flight.position.clone();
    for (let frame = 0; frame < 120; frame++) visitors.update(camera, 0);
    assert.equal(visitors.group.userData.progress, progress); assert.ok(heldPosition.distanceTo(flight.position) < 1e-8, 'Pause must freeze the flight');
    for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1600, 900]]) {
      camera.aspect = width / height; camera.setViewOffset(width, height, width > 700 ? -width * .13 : 0, height * .1, width, height); camera.updateProjectionMatrix();
      sky.position.copy(camera.position); visitors.update(camera, 0); scene.updateMatrixWorld(true);
      const projected = flight.getWorldPosition(new THREE.Vector3()).project(camera);
      assert.ok(Math.abs(projected.x) < .5 && projected.y > (width <= 700 ? .2 : .45) && projected.y < (width <= 700 ? .55 : .8), 'The surprise must stay in its sky band and leave mobile navigation clear');
      assert.equal(visitors.group.userData.progress, progress, 'Resizing must not advance its clock');
    }
    pausedChecked = true;
  }
}
assert.deepEqual([...new Set(seen.slice(0, 4))].sort(), ['dragon', 'santa', 'ufo', 'witch'], 'The shuffled bag must show all four characters before repeating');
assert.ok(seen.every((kind, index) => !index || kind !== seen[index - 1]), 'No immediate repeated visitor');
visitors.setNight(false); visitors.update(camera, 100);
assert.equal(visitors.group.visible, false); assert.equal(visitors.group.userData.active, null, 'Daylight must immediately hide any flight');
visitors.setNight(true); visitors.update(camera, 0);
assert.equal(visitors.group.userData.active, null, 'Reduced motion must not start a surprise');
camera.lookAt(camera.position.clone().add(new THREE.Vector3(0, -100, -1))); camera.updateMatrixWorld();
for (let i = 0; i < 20 * 60; i++) visitors.update(camera, 1 / 60);
assert.equal(visitors.group.userData.active, null, 'A downward camera must defer the flight instead of putting it over the ground');
console.log(`Night visitors: all four sculptures, random waiting, no repeats, pause, day/reduced motion and mobile projection passed (${meshCount} meshes / ${triangles} triangles).`);

const model = load('src/three/landmarks/penitente.ts').createPenitente();
const pool = model.group.children.find(object => object.userData.kind === 'pool');
const school = model.group.getObjectByName('Peces de la poza del Penitente'), fish = school.children.filter(object => object.isGroup);
assert.equal(fish.length, 4);
model.group.updateMatrixWorld(true);
const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
for (const path of school.userData.fishSchool.paths) {
  for (let i = 0; i <= 20; i++) {
    const point = new THREE.Vector3(...path.start).lerp(new THREE.Vector3(...path.end), i / 20);
    ray.set(point.clone().add(new THREE.Vector3(0, 8, 0)), down);
    assert.ok(ray.intersectObject(pool, false).length, 'Fish takeoff, flight and landing must stay over the actual pool');
  }
}
const peaks = new Map(); let splashSeen = false, ringsSeen = false;
for (let time = 0; time < 12; time += .05) {
  model.update(time);
  for (const object of fish) if (object.visible) peaks.set(object.name, Math.max(peaks.get(object.name) ?? 0, object.position.y));
  school.traverse(object => { if (object.isInstancedMesh && object.count > 0) splashSeen = true; if (object.name === 'Ondas del chapoteo' && object.visible && object.material.opacity > 0) ringsSeen = true; });
}
assert.equal(peaks.size, 4); assert.ok([...peaks.values()].every(y => y > 5.7)); assert.ok(splashSeen && ringsSeen);
model.update(2.1); const held = fish.map(object => object.position.toArray()); model.update(2.1);
assert.deepEqual(fish.map(object => object.position.toArray()), held, 'Pool life uses the same paused-safe water clock');
assert.equal(pool.material.userData.flowClock.value, 2.1);
console.log('Penitente: four staggered jumping fish, 84 real-pool path samples, splash, expanding rings and shared pause clock passed.');
