import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
const assetPath = resolve(process.argv[2] ?? root + '/src/three/landmarks/artigasAsset.json');
const asset = JSON.parse(readFileSync(assetPath, 'utf8'));
const output = ts.transpileModule(readFileSync(root + '/src/three/landmarks/artigasMesh.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} }; new Function('require', 'module', 'exports', output)(require, module, module.exports);
const sculpture = module.exports.createArtigasFromAsset(asset); sculpture.updateMatrixWorld(true);
assert.ok(asset.maxPositionError < .0002, 'El empaquetado debe conservar la forma revisada');
const preservedSculpture = JSON.parse(readFileSync(root + '/assets/artigas/preserved-sculpture.json', 'utf8'));
const unaffected = asset.groups.filter(g => !preservedSculpture.mutableGroups.includes(g.name)).map(g => createHash('sha256').update(JSON.stringify(g)).digest('hex')).sort();
assert.equal(unaffected.length, 11);
assert.deepEqual(unaffected, preservedSculpture.groups.map(g => g.sha256).sort(), 'La corrección de brazos y manos debe preservar los otros once grupos de la escultura');
let triangles = 0, meshes = 0;
sculpture.traverse(object => {
  if (!object.isMesh) return;
  meshes++; const geometry = object.geometry, p = geometry.attributes.position, n = geometry.attributes.normal;
  assert.equal(p.count, n.count);
  for (let i = 0; i < p.count; i++) {
    assert.ok(Number.isFinite(p.getX(i)) && Number.isFinite(p.getY(i)) && Number.isFinite(p.getZ(i)));
    assert.ok(Math.abs(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) - 1) < .0001, 'Normal degenerada');
  }
  for (const index of geometry.index.array) assert.ok(index >= 0 && index < p.count);
  let volume = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < geometry.index.count; i += 3) {
    a.fromBufferAttribute(p, geometry.index.getX(i)); b.fromBufferAttribute(p, geometry.index.getX(i + 1)); c.fromBufferAttribute(p, geometry.index.getX(i + 2));
    volume += a.dot(b.cross(c)) / 6;
  }
  assert.ok(volume > 0, `${object.name}: caras orientadas hacia el interior`);
  triangles += geometry.index.count / 3;
});
assert.ok(meshes <= 16 && triangles < 200000, 'La estatua debe mantenerse dentro del presupuesto de geometría');
const feature = name => { const result = sculpture.getObjectByName(name); assert.ok(result, name); return result; };
const handMesh = feature('Manos y dedos de Artigas').children[0];
const hp = handMesh.geometry.attributes.position, hi = handMesh.geometry.index;
const welded = new Map(), remap = [], parent = [], edges = new Map();
for (let i = 0; i < hp.count; i++) {
  const key = [hp.getX(i), hp.getY(i), hp.getZ(i)].map(v => v.toFixed(6)).join(',');
  if (!welded.has(key)) { welded.set(key, parent.length); parent.push(parent.length); }
  remap.push(welded.get(key));
}
function find(i) { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; }
for (let i = 0; i < hi.count; i += 3) {
  const triangle = [0,1,2].map(offset => remap[hi.getX(i + offset)]);
  for (let j = 0; j < 3; j++) {
    const a = triangle[j], b = triangle[(j + 1) % 3], key = a < b ? `${a}/${b}` : `${b}/${a}`;
    edges.set(key, (edges.get(key) ?? 0) + 1); parent[find(a)] = find(b);
  }
}
assert.equal(new Set(parent.map((_, i) => find(i))).size, 2, 'Deben existir dos manos continuas, sin dedos desprendidos');
assert.ok([...edges.values()].every(count => count === 2), 'Las manos deben ser superficies cerradas, sin falanges ni muñecas abiertas');
const horse = feature('Caballo — cuerpo y cuatro apoyos').children[0];
const p = horse.geometry.attributes.position, contacts = new Map();
for (let i = 0; i < p.count; i++) if (p.getY(i) < 2.5) {
  const key = `${p.getX(i) > 0}/${p.getZ(i) > 0}`, previous = contacts.get(key);
  if (!previous || p.getY(i) < previous.y) contacts.set(key, new THREE.Vector3().fromBufferAttribute(p, i));
}
assert.equal(contacts.size, 4, 'Deben existir cuatro extremidades separadas');
const base = new THREE.Box3().setFromObject(feature('Basamento rectangular escalonado'));
for (const [key, point] of contacts) {
  assert.ok(point.y <= base.max.y + .045 && point.y >= base.max.y - .12, `Casco ${key}: falta apoyo sobre el pedestal`);
  assert.ok(point.x > base.min.x && point.x < base.max.x && point.z > base.min.z && point.z < base.max.z, 'Apoyo fuera de la losa');
}
const head = new THREE.Box3().setFromObject(feature('Rostro de Artigas — anatomía esculpida'));
const horseBounds = new THREE.Box3().setFromObject(horse), size = head.getSize(new THREE.Vector3());
assert.ok(size.y > 1.4 && size.y < 2.8 && size.z / size.y > .45 && size.z / size.y < 1.0, 'Proporciones de cabeza fuera del rango anatómico');
const ratio = (head.max.y - base.max.y) / (horseBounds.max.y - base.max.y);
assert.ok(ratio > 1.18 && ratio < 1.60, 'Relación de tamaño entre jinete y caballo incorrecta');
assert.ok(new THREE.Box3().setFromObject(sculpture).max.y < 17, 'La reconstrucción debe caber en el encuadre existente');

// The explicit scope requirement protects the existing hill and its setting.
const source = readFileSync(root + '/src/three/landmarks/artigas.ts', 'utf8').replace(/\r\n/g, '\n');
const preserved = JSON.parse(readFileSync(root + '/assets/artigas/preserved-setting.json', 'utf8'));
const blocks = {
  setting: source.slice(source.indexOf('function setting('), source.indexOf('/** Cerro Artigas')),
  flags: source.slice(source.indexOf('  const poleMat'), source.indexOf('  batchMeshes(group);')),
  framing: source.slice(source.indexOf('  return {', source.indexOf('export function createArtigas'))),
};
for (const [name, text] of Object.entries(blocks)) assert.equal(createHash('sha256').update(text).digest('hex'), preserved[name], `Se modificó ${name}`);
for (const name of ['artigasHead.ts', 'artigasSculpture.ts']) assert.ok(!existsSync(root + '/src/three/landmarks/' + name), 'Persistió la escultura descartada');
if (!process.argv[2]) {
  const glb = readFileSync(root + '/assets/artigas/artigas-rebuilt.glb');
  assert.equal(createHash('sha256').update(glb).digest('hex'), asset.sourceSha256, 'El GLB y la malla web deben corresponder a la misma revisión');
  const approval = JSON.parse(readFileSync(root + '/assets/artigas/quality-approval.json', 'utf8'));
  assert.equal(approval.approved, true, 'Falta aprobación visual independiente');
  assert.equal(approval.sourceSha256, asset.sourceSha256, 'La revisión visual debe corresponder al activo publicado');
}
console.log(`Artigas: ${meshes} mallas, ${triangles} triángulos; cuatro cascos apoyados, cabeza proporcionada y entorno intacto.`);
const geometries = new Set(), materials = new Set(); sculpture.traverse(object => { if (object.isMesh) { geometries.add(object.geometry); materials.add(object.material); } });
geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
