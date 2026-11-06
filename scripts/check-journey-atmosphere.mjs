import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url), cache = new Map();
function load(filename) {
  filename = resolve(root, filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(output, { module, exports: module.exports,
    require: specifier => specifier.startsWith('.') ? load(resolve(dirname(filename), specifier + '.ts')) : require(specifier),
  }, { filename });
  return module.exports;
}
// No DOM, Canvas, GPU, network or actual landmark reconstruction is necessary
// to verify the atmosphere's placement/lifecycle contract.
const { createJourneyAtmosphere } = load('src/three/journeyAtmosphere.ts');
const { createJourneyMoonMotion, MOON_DISTANCE, MOON_ANGULAR_RADIUS } = load('src/three/journeyMoon.ts');

function finite(values, message) {
  assert.ok(Array.from(values).every(Number.isFinite), message);
}
function effectivelyVisible(object) {
  for (let p = object; p; p = p.parent) if (!p.visible) return false;
  return true;
}
function makeScene() {
  const scene = new THREE.Scene();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000, 2, 2), new THREE.MeshStandardMaterial());
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  // radius, total height, local target height cover the nine very different
  // journey subjects: rock face, summit shrine, sculpture, sign, plaza, etc.
  const dimensions = [[60, 39, 17], [40, 31, 2.5], [175, 55, 35], [150, 160, 149.2],
    [155, 44, 13], [136, 89, 43], [100, 43, 35], [82, 78, 28], [79, 30, 14]];
  const lampState = { night: false, active: false };
  const sites = dimensions.map(([radius, height, y], i) => {
    const origin = new THREE.Vector3(i * 190 - 760, 0, i % 2 * 200);
    const model = { group: new THREE.Group(), target: new THREE.Vector3(0, y, 0), bounds: { radius, height } };
    model.group.position.copy(origin); scene.add(model.group);
    if (i === 4) {
      model.group.rotation.y = .23;
      model.nightLighting = {
        floodlights: [
          { foot: new THREE.Vector3(-11, .5, 22), target: new THREE.Vector3(1, 14, 17), angle: .46, strength: 5.8, scale: 1.1, color: '#ffdda9', penumbra: .38 },
          { foot: new THREE.Vector3(6, .3, -90), target: new THREE.Vector3(-2, 19, -123), angle: .74, strength: 6, scale: 1.1, color: '#ffe6c2' },
        ],
        setNight(night, active) { lampState.night = night; lampState.active = active; },
      };
    }
    return { origin, target: origin.clone().add(new THREE.Vector3(0, y, 0)),
      direction: new THREE.Vector3(.3 - i * .06, 0, 1).normalize(),
      model };
  });
  return { scene, ground, sites, lampState };
}

const viewports = [[320, 890], [390, 844], [844, 390], [1265, 720], [1600, 900], [2560, 1080]];
for (const mobile of [false, true]) {
  const { scene, ground, sites, lampState } = makeScene();
  const atmosphere = createJourneyAtmosphere(scene, sites, mobile), group = atmosphere.group;
  assert.equal(group.parent, scene, 'The constructor must add its owned group to the scene');
  const lights = [], fixtures = [], meshes = [], geometries = new Set(), materials = new Set();
  group.traverse(object => {
    if (object.isSpotLight) lights.push(object);
    if (object.name.startsWith('journey-floodlight-fixture-')) fixtures.push(object);
    if (object.isMesh || object.isPoints) {
      meshes.push(object); geometries.add(object.geometry);
      for (const surface of Array.isArray(object.material) ? object.material : [object.material]) materials.add(surface);
      for (const [key, attribute] of Object.entries(object.geometry.attributes)) finite(attribute.array, `Non-finite ${key} in ${object.name}`);
    }
  });
  assert.equal(lights.length, 2, 'Exactly two spotlights, independent of the nine stops');
  assert.equal(fixtures.length, 2, 'The lighting has two physical fixtures, not overhead-only effects');
  assert.ok(lights.every(light => !light.castShadow && !light.visible), 'Daytime has no active night lights or shadow-map cost');
  assert.ok(meshes.every(object => !effectivelyVisible(object)), 'All night-only scenery starts hidden during the day');
  const moon = group.getObjectByName('journey-full-moon'), stars = group.getObjectByName('journey-night-stars');
  assert.equal(moon.geometry.type, 'SphereGeometry', 'The full moon must be spherical');
  assert.ok(moon.material.uniforms.uCraters.value.length >= 12, 'Crater details are procedural, not a blank sphere');
  assert.equal(stars.type, 'Points');
  assert.ok(stars.material.depthTest && moon.material.depthTest, 'Sky effects must respect foreground geometry');
  const initialChildren = group.children.length, camera = new THREE.PerspectiveCamera(48, 1, .4, 5000);
  let previousKeyPosition;
  atmosphere.setNight(true);
  for (const [width, height] of viewports) {
    camera.aspect = width / height;
    // Mirror the real journey's asymmetric projection; a simple fov placement
    // could be correct without this offset yet put the moon beyond the edge.
    camera.setViewOffset(width, height, width > 700 ? -width * .13 : 0, width <= 700 ? height * .1 : 0, width, height);
    for (let i = 0; i < sites.length; i++) {
      camera.position.copy(sites[i].target).add(new THREE.Vector3(-35 - i, 12 + i, 85));
      camera.lookAt(sites[i].target); camera.fov = i % 2 ? 44 : 53; camera.updateProjectionMatrix();
      for (let frame = 0; frame < 120; frame++) atmosphere.update(camera, i, 22.7 * i, 1 / 60);
      group.updateMatrixWorld(true);
      assert.equal(group.userData.activeIndex, i);
      assert.equal(group.children.length, initialChildren, 'Moving between sites must not allocate additional rigs');
      group.traverse(object => finite(object.matrixWorld.elements, `Non-finite transform in ${object.name}`));
      for (const light of lights) {
        assert.ok(effectivelyVisible(light) && !light.castShadow);
        finite([light.intensity, light.distance, light.angle, ...light.position.toArray(), ...light.target.position.toArray()], 'Non-finite spotlight configuration');
        assert.ok(light.intensity > 0 && light.angle > 0 && light.angle < Math.PI / 2);
        assert.ok(light.distance > light.position.distanceTo(light.target.position), 'Light cutoff must reach its landmark');
      }
      if (i === 0) previousKeyPosition = lights[0].position.clone();
      if (i === 8) assert.ok(lights[0].position.distanceTo(previousKeyPosition) > 1000, 'The fixed two-light rig must follow the active site');
      assert.ok(lampState.night && lampState.active === (i === 4), 'Local plaza lighting must follow night mode and the active site');
      if (i === 4) {
        for (let j = 0; j < 2; j++) {
          const pose = sites[i].model.nightLighting.floodlights[j];
          const target = sites[i].model.group.localToWorld(pose.target.clone());
          const foot = sites[i].model.group.localToWorld(pose.foot.clone());
          assert.ok(lights[j].target.position.distanceTo(target) < 1e-8, 'A plaza spotlight must keep its dedicated statue/church target in world space');
          foot.y += 1.65 * pose.scale;
          assert.ok(lights[j].position.distanceTo(foot) < 1e-8, 'The fixture must remain at the specified local plaza position');
          assert.equal(lights[j].color.getHexString(), pose.color.slice(1), 'The lens/light must use the plaza fixture color');
          assert.equal(lights[j].penumbra, pose.penumbra ?? .72);
        }
        assert.ok(lights[0].target.position.distanceTo(lights[1].target.position) > 100, 'Statue and church must not share the generic plaza target');
      }
      if (i === 5) {
        assert.equal(lights[1].color.getHexString(), 'a6c6ee', 'Other stops must restore the normal cool rim light');
        assert.equal(lights[0].penumbra, .72, 'Other stops must restore the generic soft beam');
      }
      const ndc = moon.getWorldPosition(new THREE.Vector3()).project(camera);
      finite(ndc.toArray(), 'Non-finite projected moon');
      const bearing = moon.getWorldPosition(new THREE.Vector3()).sub(camera.position).normalize();
      assert.ok(bearing.distanceTo(new THREE.Vector3(-.35, .34, -.87).normalize()) < 1e-8, 'The moon must retain one world bearing after camera/projection changes');
      assert.ok(Math.abs(moon.scale.x - MOON_DISTANCE * Math.tan(MOON_ANGULAR_RADIUS)) < 1e-8, 'Zoom must not resize the physical moon');
      const alpha = moon.material.uniforms.uOpacity.value;
      assert.ok(alpha >= 0 && alpha <= 1 && Number.isFinite(alpha));
      if (alpha > .1) assert.ok(Math.abs(ndc.x) < 1 && Math.abs(ndc.y) < 1 && Math.abs(ndc.z) < 1, 'A visible moon must fade before its center leaves the viewport');
    }
  }
  atmosphere.setNight(false);
  assert.ok(!lampState.night, 'Day mode must disable local plaza illumination');
  assert.ok(!group.visible && lights.every(light => !light.visible));
  assert.ok(meshes.every(object => !effectivelyVisible(object)), 'Daytime must remove moon, stars, fixtures and beams together');
  atmosphere.update(camera, 3, Number.NaN);
  assert.ok(!group.visible && lights.every(light => !light.visible), 'A paused/day update must not restore night lighting');
  atmosphere.setNight(true); atmosphere.update(camera, 4, 0);
  assert.ok(lights.every(effectivelyVisible), 'Night can be restored synchronously while the journey is paused');
  assert.ok(lampState.night && lampState.active, 'Paused night mode must synchronously enable the plaza lamps');

  const geometryDisposals = new Map([...geometries].map(geometry => [geometry, 0]));
  const materialDisposals = new Map([...materials].map(surface => [surface, 0]));
  for (const geometry of geometries) geometry.addEventListener('dispose', () => geometryDisposals.set(geometry, geometryDisposals.get(geometry) + 1));
  for (const surface of materials) surface.addEventListener('dispose', () => materialDisposals.set(surface, materialDisposals.get(surface) + 1));
  let foreignDisposals = 0;
  ground.geometry.addEventListener('dispose', () => foreignDisposals++); ground.material.addEventListener('dispose', () => foreignDisposals++);
  atmosphere.dispose(); atmosphere.dispose(); atmosphere.setNight(true); atmosphere.update(camera, 1, 3);
  assert.ok(!lampState.night && !lampState.active, 'Atmosphere teardown must switch off the model-owned lamp rig');
  assert.equal(group.parent, null); assert.equal(group.children.length, 0);
  assert.ok([...geometryDisposals.values()].every(count => count === 1), 'Every owned/shared geometry is disposed exactly once');
  assert.ok([...materialDisposals.values()].every(count => count === 1), 'Every owned/shared material is disposed exactly once');
  assert.equal(foreignDisposals, 0, 'Disposal must preserve the journey terrain/model resources');
  console.log(`Atmosphere ${mobile ? 'mobile' : 'desktop'}: nine sites × ${viewports.length} projections, two lights, fixed sky bearing, day toggle and disposal passed`);
  ground.geometry.dispose(); ground.material.dispose();
}

// Regressions reported by the user: hard focus/zoom changes and violent exits.
{
  const camera = new THREE.PerspectiveCamera(48, 1.6, .4, 5000);
  const bearing = new THREE.Vector3(-.35, .34, -.87).normalize();
  camera.position.set(10, 20, 30); camera.lookAt(camera.position.clone().addScaledVector(bearing, 100));
  const motion = createJourneyMoonMotion();
  let pose;
  for (let frame = 0; frame < 120; frame++) pose = motion.update(camera, 1 / 60, true);
  assert.ok(pose.opacity > .99 && !pose.pending);
  const original = pose.ndc.clone();
  camera.position.add(new THREE.Vector3(1200, 160, -650)); camera.updateMatrixWorld();
  pose = motion.update(camera, 1 / 60, true);
  assert.ok(pose.ndc.distanceTo(original) < 1e-8, 'Moving across the map must not create lunar parallax');

  const oldPosition = pose.ndc.clone(), oldAlpha = pose.opacity;
  camera.rotateY(.35); camera.updateMatrixWorld();
  pose = motion.update(camera, 1 / 60, true);
  assert.ok(pose.ndc.distanceTo(oldPosition) < 1e-8 && pose.opacity > oldAlpha - .07, 'A camera cut must dissolve the old apparent moon without teleporting it');
  let lastPosition = pose.ndc.clone(), lastAlpha = pose.opacity, hiddenFrames = 0;
  for (let frame = 0; frame < 160; frame++) {
    pose = motion.update(camera, 1 / 60, true);
    if (pose.ndc.distanceTo(lastPosition) > .15) assert.ok(lastAlpha < .01 || pose.opacity < .01, 'Repositioning must occur while the moon is invisible');
    if (pose.opacity === 0) hiddenFrames++;
    lastPosition.copy(pose.ndc); lastAlpha = pose.opacity;
  }
  assert.ok(hiddenFrames > 0 && !pose.pending, 'A paused-camera dissolve must finish in bounded time');

  camera.lookAt(camera.position.clone().addScaledVector(bearing, 100));
  camera.fov = 53; camera.aspect = 390 / 844;
  camera.setViewOffset(390, 844, 0, 84.4, 390, 844); camera.updateProjectionMatrix();
  for (let frame = 0; frame < 160; frame++) pose = motion.update(camera, 1 / 60, true);
  assert.ok(pose.direction.distanceTo(bearing) < 1e-8);
  assert.ok(Math.abs(pose.radius / MOON_DISTANCE - Math.tan(MOON_ANGULAR_RADIUS)) < 1e-8);

  // A continuous pan may leave the moon behind; it must fade, not chase the lens.
  let partial = false;
  for (let frame = 0; frame < 240; frame++) {
    camera.rotateY(.004); camera.updateMatrixWorld();
    pose = motion.update(camera, 1 / 60, true);
    partial ||= pose.opacity > .02 && pose.opacity < .95;
    assert.ok(pose.direction.distanceTo(bearing) < 1e-8, 'A continuous pan must not drag the moon around the sky');
  }
  assert.ok(partial && pose.opacity < .001, 'The moon must exit through a gradual edge fade');
  pose = motion.update(camera, Number.NaN, false);
  assert.ok(pose.opacity === 0 && !pose.pending, 'Day mode must not leave a paused sky loop running');
  console.log('Moon: fixed bearing/size, zero translation parallax, cut dissolve, portrait zoom and gradual viewport exit passed');
}

// Empty-site teardown is useful during cancelled/unavailable scene startup.
{
  const scene = new THREE.Scene(), atmosphere = createJourneyAtmosphere(scene, [], false);
  const camera = new THREE.PerspectiveCamera(48, 1, .4, 5000);
  atmosphere.setNight(true); atmosphere.update(camera, -1, 0);
  assert.equal(atmosphere.group.getObjectByName('journey-active-site-light-rig').visible, false);
  atmosphere.dispose(); assert.equal(scene.children.length, 0);
}
