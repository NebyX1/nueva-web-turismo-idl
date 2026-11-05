import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url), cache = new Map();
// Geometry checks do not need a browser; raster drawing is stubbed here and
// the actual textured materials and camera compositions are reviewed in WebGL.
function canvas() {
  const ctx = new Proxy({
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    getImageData: (_x, _y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }),
    measureText: text => ({ width: text.length * 20 }),
  }, { get: (target, key) => key in target ? target[key] : () => {}, set: (target, key, value) => (target[key] = value, true) });
  return { width: 0, height: 0, getContext: () => ctx };
}
class PathStub { constructor() { return new Proxy(this, { get: () => () => {} }); } }
function load(filename) {
  filename = resolve(root, filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const output = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, {
    module, exports: module.exports, Path2D: PathStub,
    document: { createElement: canvas },
    require: specifier => specifier.startsWith('.') ? load(resolve(dirname(filename), specifier + '.ts')) : require(specifier),
  }, { filename });
  return module.exports;
}
const { journeyStops } = load('src/data/journeyStops.ts');
const { guideChapters } = load('src/data/lavallejaGuide.ts');
assert.equal(new Set(journeyStops.map(stop => stop.id)).size, journeyStops.length, 'Paradas duplicadas');
assert.equal(journeyStops.length, 9);
for (const stop of journeyStops) if (stop.guideChapter) assert.ok(guideChapters.some(chapter => chapter.id === stop.guideChapter), `Capítulo inexistente para ${stop.id}`);
const models = [
  ['arequita', 'createArequita'], ['artigas', 'createArtigas'],
  ['minasSign', 'createMinasSign'], ['plazaLibertad', 'createPlazaLibertad'],
];
for (const [file, factory] of models) {
  const model = load(`src/three/landmarks/${file}.ts`)[factory]();
  assert.ok(model.group.isGroup && model.group.children.length, `${file}: grupo vacío`);
  assert.ok(model.bounds.radius > 0 && model.bounds.height > 0);
  for (const value of model.target.toArray()) assert.ok(Number.isFinite(value));
  if (file === 'arequita') {
    const top = model.group.getObjectByName('Corona pétrea baja, quebrada y sin tapa plana').geometry.attributes.position;
    const left = [], right = [];
    for (let i = 0; i < top.count; i++) {
      if (Math.abs(top.getZ(i)) > 25) continue;
      const x = top.getX(i), y = top.getY(i);
      if (x > -90 && x < -45) left.push(y);
      if (x > 125 && x < 158) right.push(y);
    }
    const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
    assert.ok(left.length && right.length);
    assert.ok(mean(left) > 78 && mean(right) < 40 && mean(left) - mean(right) > 42, 'Arequita debe descender hacia la derecha');
    const plants = model.group.getObjectByName('Troncos arraigados');
    let upperPlants = 0;
    for (let i = 0; i < plants.count; i++) if (plants.instanceMatrix.array[i * 16 + 13] > 70) upperPlants++;
    assert.ok(upperPlants > 180, 'Falta cobertura vegetal en la cima');
    console.log(`Arequita: cima izquierda ${mean(left).toFixed(1)}, hombro derecho ${mean(right).toFixed(1)}, ${upperPlants} plantas en la zona alta`);
  }
  if (file === 'artigas') {
    const head = model.group.getObjectByName('Cabeza de Artigas — rostro y cabellera esculpidos');
    assert.ok(head?.isGroup, 'La cabeza debe conservar su pose como un grupo');
    const face = head.children.find(part => part.name.startsWith('Rostro continuo'));
    const position = face.geometry.attributes.position, normal = face.geometry.attributes.normal;
    let frontCount = 0, frontNormal = 0, smoothTriangles = 0;
    for (let i = 0; i < position.count; i++) {
      const length = Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i));
      assert.ok(Math.abs(length - 1) < .001, 'Normal facial degenerada');
      if (position.getX(i) < -.45 && position.getY(i) > .8 && position.getY(i) < 1.7 && Math.abs(position.getZ(i)) < .15) {
        frontCount++; frontNormal += normal.getX(i);
      }
      if (i % 3 === 0 && Math.hypot(normal.getX(i) - normal.getX(i + 1), normal.getY(i) - normal.getY(i + 1), normal.getZ(i) - normal.getZ(i + 1)) > .0001) smoothTriangles++;
    }
    assert.ok(frontCount > 100 && frontNormal / frontCount < -.5, 'Las normales del rostro deben mirar hacia fuera');
    assert.ok(smoothTriangles > position.count / 3 * .9, 'La fusión no debe convertir el rostro en caras planas');
    // A visible chin must not sink into the neck or the coat after posing.
    const { Vector3, Raycaster } = require('three'), ray = new Raycaster(), point = new Vector3(), n = new Vector3();
    const body = head.parent.children.filter(part => part.isMesh);
    function chinOcclusion() {
      model.group.updateMatrixWorld(true);
      let hidden = 0, samples = 0;
      for (const direction of [new Vector3(-1, 0, 0), new Vector3(-.7, -.15, .7).normalize(), new Vector3(0, -.15, 1).normalize()]) {
        const visited = new Set();
        for (let i = 0; i < position.count; i++) {
          if (Math.abs(position.getY(i) - .32) > .012) continue;
          const key = [position.getX(i), position.getY(i), position.getZ(i)].map(value => value.toFixed(5)).join(',');
          if (visited.has(key)) continue; visited.add(key);
          n.fromBufferAttribute(normal, i).transformDirection(face.matrixWorld);
          if (n.dot(direction) < .4) continue;
          point.fromBufferAttribute(position, i).applyMatrix4(face.matrixWorld);
          ray.set(point.clone().addScaledVector(direction, 20), direction.clone().negate());
          if (ray.intersectObjects(body, false).some(hit => hit.distance < 19.985)) hidden++;
          samples++;
        }
      }
      return { hidden, samples };
    }
    const posed = chinOcclusion();
    assert.ok(posed.samples > 100 && posed.hidden === 0, 'El cuello o abrigo está tapando el mentón');
    head.position.y -= .5;
    const buried = chinOcclusion();
    head.position.y += .5; model.group.updateMatrixWorld(true);
    assert.ok(buried.hidden > 0, 'El control de oclusión debe detectar una cabeza hundida');
    console.log(`Artigas: rostro suave, normales exteriores y mentón visible desde ${posed.samples} muestras`);
  }
  const geometries = new Set(), materials = new Set(), textures = new Set();
  let meshes = 0, triangles = 0, invalid = 0;
  model.group.updateMatrixWorld(true);
  model.group.traverse(object => {
    if (!object.isMesh) return;
    meshes++;
    const geometry = object.geometry; geometries.add(geometry);
    triangles += (geometry.index?.count || geometry.attributes.position.count) / 3 * (object.isInstancedMesh ? object.count : 1);
    for (const name of ['position', 'normal']) {
      const attribute = geometry.attributes[name];
      assert.ok(attribute, `${file}: falta ${name}`);
      for (const value of attribute.array) if (!Number.isFinite(value)) invalid++;
    }
    if (geometry.index) for (const index of geometry.index.array) assert.ok(index < geometry.attributes.position.count, `${file}: índice inválido`);
    for (const value of object.matrixWorld.elements) assert.ok(Number.isFinite(value));
    if (object.isInstancedMesh) for (const value of object.instanceMatrix.array) assert.ok(Number.isFinite(value));
    for (const mat of Array.isArray(object.material) ? object.material : [object.material]) { materials.add(mat); for (const value of Object.values(mat)) if (value?.isTexture) textures.add(value); }
  });
  for (const t of [0, .5, 4, 11, 27, 65]) model.update?.(t);
  model.group.traverse(object => { if (object.isInstancedMesh) for (const value of object.instanceMatrix.array) assert.ok(Number.isFinite(value), `${file}: animación inválida`); });
  assert.equal(invalid, 0, `${file}: coordenadas o normales inválidas`);
  console.log(`${file}: ${meshes} mallas, ${Math.round(triangles)} triángulos, geometría y animación válidas`);
  geometries.forEach(geometry => geometry.dispose()); textures.forEach(texture => texture.dispose()); materials.forEach(mat => mat.dispose());
}
console.log('Nueve paradas y enlaces a la guía verificados.');
