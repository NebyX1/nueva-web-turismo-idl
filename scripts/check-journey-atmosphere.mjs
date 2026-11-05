import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url), module = { exports: {} };
const source = readFileSync(resolve(root, 'src/three/journeyAtmosphere.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
// No DOM, Canvas, GPU, network or actual landmark reconstruction is necessary
// to verify the atmosphere's placement/lifecycle contract.
vm.runInNewContext(output, { module, exports: module.exports, require }, { filename: 'journeyAtmosphere.ts' });
const { createJourneyAtmosphere } = module.exports;

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
  const dimensions = [[136, 89, 43], [121, 81, 71], [100, 43, 35], [175, 55, 35],
    [155, 44, 13], [60, 39, 17], [79, 30, 14], [82, 78, 28], [40, 31, 2.5]];
  const sites = dimensions.map(([radius, height, y], i) => {
    const origin = new THREE.Vector3(i * 190 - 760, 0, i % 2 * 200);
    return { origin, target: origin.clone().add(new THREE.Vector3(0, y, 0)),
      direction: new THREE.Vector3(.3 - i * .06, 0, 1).normalize(),
      model: { group: new THREE.Group(), target: new THREE.Vector3(0, y, 0), bounds: { radius, height } } };
  });
  return { scene, ground, sites };
}

const viewports = [[320, 890], [390, 844], [844, 390], [1265, 720], [1600, 900], [2560, 1080]];
for (const mobile of [false, true]) {
  const { scene, ground, sites } = makeScene();
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
      atmosphere.update(camera, i, 22.7 * i); group.updateMatrixWorld(true);
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
      const ndc = moon.getWorldPosition(new THREE.Vector3()).project(camera);
      assert.ok(Math.abs(ndc.x - (width <= 700 ? .62 : .68)) < 1e-8, 'Moon x must honor the current viewport/projection');
      assert.ok(Math.abs(ndc.y - (width <= 700 ? .62 : .38)) < 1e-8, 'Moon y must stay clear of the camera-state label after rotation/resizing');
      // Check the complete sphere, not just its center. This also covers a
      // narrow portrait viewport after resizing a desktop-created atmosphere.
      const positions = moon.geometry.attributes.position, point = new THREE.Vector3();
      for (let v = 0; v < positions.count; v++) {
        point.fromBufferAttribute(positions, v).applyMatrix4(moon.matrixWorld).project(camera);
        finite(point.toArray(), 'Non-finite projected moon');
        assert.ok(Math.abs(point.x) < .985 && Math.abs(point.y) < .985 && Math.abs(point.z) < 1, 'The full moon must fit inside the viewport');
      }
    }
  }
  atmosphere.setNight(false);
  assert.ok(!group.visible && lights.every(light => !light.visible));
  assert.ok(meshes.every(object => !effectivelyVisible(object)), 'Daytime must remove moon, stars, fixtures and beams together');
  atmosphere.update(camera, 3, Number.NaN);
  assert.ok(!group.visible && lights.every(light => !light.visible), 'A paused/day update must not restore night lighting');
  atmosphere.setNight(true); atmosphere.update(camera, 4, 0);
  assert.ok(lights.every(effectivelyVisible), 'Night can be restored synchronously while the journey is paused');

  const geometryDisposals = new Map([...geometries].map(geometry => [geometry, 0]));
  const materialDisposals = new Map([...materials].map(surface => [surface, 0]));
  for (const geometry of geometries) geometry.addEventListener('dispose', () => geometryDisposals.set(geometry, geometryDisposals.get(geometry) + 1));
  for (const surface of materials) surface.addEventListener('dispose', () => materialDisposals.set(surface, materialDisposals.get(surface) + 1));
  let foreignDisposals = 0;
  ground.geometry.addEventListener('dispose', () => foreignDisposals++); ground.material.addEventListener('dispose', () => foreignDisposals++);
  atmosphere.dispose(); atmosphere.dispose(); atmosphere.setNight(true); atmosphere.update(camera, 1, 3);
  assert.equal(group.parent, null); assert.equal(group.children.length, 0);
  assert.ok([...geometryDisposals.values()].every(count => count === 1), 'Every owned/shared geometry is disposed exactly once');
  assert.ok([...materialDisposals.values()].every(count => count === 1), 'Every owned/shared material is disposed exactly once');
  assert.equal(foreignDisposals, 0, 'Disposal must preserve the journey terrain/model resources');
  console.log(`Atmosphere ${mobile ? 'mobile' : 'desktop'}: nine sites × ${viewports.length} projections, two lights, full moon, day toggle and disposal passed`);
  ground.geometry.dispose(); ground.material.dispose();
}

// Empty-site teardown is useful during cancelled/unavailable scene startup.
{
  const scene = new THREE.Scene(), atmosphere = createJourneyAtmosphere(scene, [], false);
  const camera = new THREE.PerspectiveCamera(48, 1, .4, 5000);
  atmosphere.setNight(true); atmosphere.update(camera, -1, 0);
  assert.equal(atmosphere.group.getObjectByName('journey-active-site-light-rig').visible, false);
  atmosphere.dispose(); assert.equal(scene.children.length, 0);
}
