import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url), cache = new Map();
const candidate = process.argv.includes('--candidate'), hash = bytes => createHash('sha256').update(bytes).digest('hex');
function load(file) {
  file = resolve(root, file);
  if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, { module, exports: module.exports, atob,
    require: s => s.startsWith('.') ? load(resolve(dirname(file), s.endsWith('.json') ? s : s + '.ts')) : require(s) }, { filename: file });
  return module.exports;
}
const asset = load('src/three/landmarks/penitenteAsset.json');
const preserved = load('assets/penitente/preserved-context.json');
for (const file of preserved.files) assert.equal(hash(readFileSync(resolve(root, file.file))), file.sha256, `Cambió un sitio ajeno al Penitente: ${file.file}`);
const architecture = readFileSync(resolve(root, 'src/three/landmarks/architectureWater.ts'), 'utf8').replace(/\r\n/g, '\n');
const villaPrefix = architecture.split(/function cliff\(|export \{ createPenitente \}/)[0].trimEnd();
assert.equal(hash(villaPrefix), preserved.villaPrefix, 'Cambió el contexto de Villa Serrana');
const model = load('src/three/landmarks/penitente.ts').createPenitente(); model.group.updateMatrixWorld(true);
assert.ok(asset.maxPositionError < .002, 'El empaquetado altera el relieve');
let triangleCount = 0;
const rocks = [], water = [];
model.group.traverse(object => {
  if (!object.isMesh) return;
  const g = object.geometry, p = g.attributes.position, n = g.attributes.normal;
  assert.equal(p.count, n.count);
  for (let i = 0; i < p.count; i++) {
    assert.ok(Number.isFinite(p.getX(i)) && Number.isFinite(p.getY(i)) && Number.isFinite(p.getZ(i)), `${object.name}: posición inválida`);
    assert.ok(Math.abs(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) - 1) < .0001, `${object.name}: normal degenerada`);
  }
  triangleCount += (g.index?.count ?? p.count) / 3 * (object.isInstancedMesh ? object.count : 1);
  if (g.index) for (const i of g.index.array) assert.ok(i >= 0 && i < p.count);
  if (['falls', 'pool'].includes(object.userData.kind)) {
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < g.index.count; i += 3) {
      a.fromBufferAttribute(p, g.index.getX(i)); b.fromBufferAttribute(p, g.index.getX(i + 1)); c.fromBufferAttribute(p, g.index.getX(i + 2));
      assert.ok(b.sub(a).cross(c.sub(a)).lengthSq() > 0, `${object.name}: triángulo de agua colapsado al empaquetar`);
    }
  }
  if (object.userData.kind === 'rock') rocks.push(object);
  if (['falls', 'pool'].includes(object.userData.kind)) water.push(object);
});
assert.ok(triangleCount < 310000, 'El paisaje excede el presupuesto de geometría');
assert.ok(rocks.length && water.length === 4, 'Deben estar el arroyo superior, caída, poza y desagüe');
for (const rock of rocks) {
  const g = rock.geometry, edges = new Map(); let volume = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < g.index.count; i += 3) {
    const ids = [0,1,2].map(j => g.index.getX(i + j));
    for (let j = 0; j < 3; j++) { const x = ids[j], y = ids[(j + 1) % 3], key = x < y ? `${x}/${y}` : `${y}/${x}`; edges.set(key, (edges.get(key) ?? 0) + 1); }
    a.fromBufferAttribute(g.attributes.position, ids[0]); b.fromBufferAttribute(g.attributes.position, ids[1]); c.fromBufferAttribute(g.attributes.position, ids[2]);
    const area = b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
    assert.ok(area > 0, `${rock.name}: triángulo de área cero después de decodificar`);
    volume += a.dot(b.cross(c)) / 6;
  }
  assert.ok([...edges.values()].every(count => count === 2), `${rock.name}: el macizo debe estar cerrado`);
  assert.ok(volume > 0, `${rock.name}: orientación invertida`);
}
const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
function bed(x, y, z) { ray.set(new THREE.Vector3(x, y, z), down); return ray.intersectObjects(rocks, false)[0]?.point.y; }
for (const z of [-10, 6, 26]) {
  const row = asset.landscape.curve.reduce((a, b) => Math.abs(a[2] - z) < Math.abs(b[2] - z) ? a : b);
  const left = bed(row[0] - row[3] - 7, 100, z), right = bed(row[0] + row[3] + 7, 100, z);
  // A coarse regression guard for unequal banks; visual fidelity is judged by
  // the independent reference review, not by an arbitrary absolute height.
  assert.ok(Number.isFinite(left) && Number.isFinite(right) && left > right + 7 && left - row[1] > (right - row[1]) * 1.6, `Sección z=${z}: falta la asimetría del farallón y la rampa (izquierda ${left?.toFixed(2)}, derecha ${right?.toFixed(2)})`);
}
let maxGap = 0, samples = 0;
for (const object of water.filter(w => w.userData.kind === 'falls')) {
  const p = object.geometry.attributes.position, flow = object.geometry.attributes.aFlow;
  for (let i = 0; i < p.count; i += 19) {
    const h = bed(p.getX(i), p.getY(i) + 2, p.getZ(i));
    assert.ok(Number.isFinite(h), `${object.name}: agua sin lecho`);
    const gap = p.getY(i) - h; maxGap = Math.max(maxGap, gap); samples++;
    const maxDepth = object.name.startsWith('Arroyo superior') ? .45 : .18;
    assert.ok(gap > -.02 && gap < maxDepth, `${object.name}: agua flotante o atravesando roca (${gap.toFixed(3)})`);
  }
  const middle = [];
  for (let i = 0; i < p.count; i++) if (Math.abs(flow.getX(i) - .5) < .001) middle.push({ z: p.getZ(i), t: flow.getY(i) });
  middle.sort((a, b) => a.z - b.z);
  for (let i = 1; i < middle.length; i++) assert.ok(middle[i].t >= middle[i-1].t - .00001, `${object.name}: la animación debe avanzar aguas abajo`);
  if (!object.name.startsWith('Arroyo superior')) {
    const point = new THREE.Vector3(), vertex = new THREE.Vector3(), index = object.geometry.index;
    for (let i = 0; i < index.count; i += 291) {
      point.set(0, 0, 0);
      for (let j = 0; j < 3; j++) point.add(vertex.fromBufferAttribute(p, index.getX(i + j)));
      point.multiplyScalar(1 / 3);
      const h = bed(point.x, point.y + 2, point.z), gap = point.y - h;
      assert.ok(Number.isFinite(h) && gap > -.01 && gap < .23, `${object.name}: una cara de agua atraviesa o se separa del lecho (${gap.toFixed(3)})`);
      samples++; maxGap = Math.max(maxGap, gap);
    }
  }
  assert.ok(object.material.isMeshStandardMaterial, 'El agua debe responder a la iluminación diurna/nocturna');
}
const pool = water.find(w => w.userData.kind === 'pool'), poolSize = new THREE.Box3().setFromObject(pool).getSize(new THREE.Vector3());
assert.ok(poolSize.z > poolSize.x * 2 && poolSize.y < .001, 'La poza debe ser alargada y horizontal, no un disco aislado');
const stream = water.find(w => w.name.startsWith('Canaleta del salto'));
const p = stream.geometry.attributes.position;
let joined = false;
for (let i = 0; i < p.count; i++) if (p.getY(i) < asset.landscape.poolLevel && p.getZ(i) < 30) {
  ray.set(new THREE.Vector3(p.getX(i), 10, p.getZ(i)), down);
  if (ray.intersectObject(pool, false).length) { joined = true; break; }
}
assert.ok(joined, 'La caída debe desembocar en la poza');
model.update(7.25);
assert.ok(water.every(w => w.material.userData.flowClock.value === 7.25), 'El reloj de agua no está conectado al recorrido');
const bounds = new THREE.Box3().setFromObject(model.group);
assert.ok(bounds.max.y <= model.bounds.height && bounds.min.y > -3, 'El paisaje queda fuera del encuadre o del terreno');

if (!candidate) {
  const registered = load('src/three/landmarks/architectureWater.ts').createPenitente();
  assert.equal(registered.group.userData.assetSha256, asset.sourceSha256, 'La página sigue usando la versión anterior');
  const approval = load(existsSync(resolve(root, 'assets/penitente/quality-approval.json')) ? 'assets/penitente/quality-approval.json' : 'assets/penitente/user-acceptance.json');
  assert.equal(approval.approved, true, 'Falta aprobación independiente o aceptación explícita del usuario');
  assert.equal(approval.sourceSha256, asset.sourceSha256, 'La aprobación no corresponde al modelo');
  assert.equal(hash(readFileSync(resolve(root, 'assets/penitente/penitente.glb'))), asset.sourceSha256);
  for (const file of approval.files) assert.equal(hash(readFileSync(resolve(root, file.file))), file.sha256, `Cambió después de la revisión: ${file.file}`);
}
console.log(`Penitente: ${Math.round(triangleCount)} triángulos; macizos cerrados, ${samples} contactos de agua (máximo ${maxGap.toFixed(3)}), poza ${poolSize.x.toFixed(1)} × ${poolSize.z.toFixed(1)} y flujo aguas abajo.`);
