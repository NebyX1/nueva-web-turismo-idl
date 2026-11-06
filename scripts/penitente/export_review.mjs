import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';

const require = createRequire(import.meta.url), cache = new Map(), root = process.cwd();
const out = resolve(process.argv[2]); mkdirSync(out, { recursive: true });
function load(file) {
  file = resolve(file);
  if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'));
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(output, { module, exports: module.exports, atob,
    require: s => s.startsWith('.') ? load(resolve(dirname(file), s.endsWith('.json') ? s : s + '.ts')) : require(s) }, { filename: file });
  return module.exports;
}
const model = load('src/three/landmarks/penitente.ts').createPenitente(); model.group.updateMatrixWorld(true);
const parts = [];
model.group.traverse(object => {
  if (!object.isMesh) return;
  const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld), color = geometry.attributes.color;
  const part = { name: object.name, kind: object.isInstancedMesh ? 'foliage' : object.userData.kind,
    positions: Array.from(geometry.attributes.position.array), normals: Array.from(geometry.attributes.normal.array),
    colors: color ? Array.from(color.array, value => color.normalized ? value / 255 : value) : null,
    indices: geometry.index ? Array.from(geometry.index.array) : null,
    flow: geometry.attributes.aFlow ? Array.from(geometry.attributes.aFlow.array) : null };
  if (object.isInstancedMesh) {
    part.instances = [];
    const matrix = new THREE.Matrix4(), tint = new THREE.Color();
    for (let i = 0; i < object.count; i++) { object.getMatrixAt(i, matrix); object.getColorAt(i, tint); part.instances.push({ matrix: matrix.toArray(), color: tint.toArray() }); }
  }
  parts.push(part); geometry.dispose();
});
const geometry = JSON.stringify({ parts, target: model.target.toArray(), bounds: model.bounds, impact: model.group.userData.impact });
writeFileSync(resolve(out, 'review-scene.json'), geometry);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const files = ['src/three/landmarks/penitente.ts', 'src/three/landmarks/penitenteMesh.ts', 'src/three/landmarks/penitenteWater.ts', 'src/three/landmarks/penitenteRock.ts', 'src/three/landmarks/penitenteAsset.json'];
const tooling = ['scripts/penitente/build_penitente.py', 'scripts/penitente/pack_penitente.mjs', 'scripts/penitente/export_review.mjs', 'scripts/penitente/render_review.py', 'scripts/check-penitente-rebuild.mjs'];
const identify = file => ({ file, sha256: hash(readFileSync(resolve(root, file))) });
const manifest = { sourceSha256: model.group.userData.assetSha256, sceneSha256: hash(geometry),
  coordinateSystem: 'X right / Y up / Z downstream',
  rendering: 'Exact decoded geometry and instance transforms. Blender CPU approximates Three.js procedural materials and lighting; no WebGL execution.',
  files: files.map(identify), tooling: tooling.map(identify) };
writeFileSync(resolve(out, 'review-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ meshes: parts.length, sourceSha256: manifest.sourceSha256, sceneSha256: manifest.sceneSha256 }));
