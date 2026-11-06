/** Bake Blender's static GLB into synchronous, quantized Three.js geometry. */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Matrix4, Matrix3, Vector3, Quaternion } from 'three';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const input = resolve(process.argv[2] ?? root + '/assets/artigas/artigas-rebuilt.glb');
const destination = resolve(process.argv[3] ?? root + '/src/three/landmarks/artigasAsset.json');
const binary = readFileSync(input);
if (binary.readUInt32LE(0) !== 0x46546c67 || binary.readUInt32LE(4) !== 2) throw new Error('Expected glTF 2.0 binary');
let json, data;
for (let offset = 12; offset < binary.length;) {
  const length = binary.readUInt32LE(offset), type = binary.readUInt32LE(offset + 4);
  const chunk = binary.subarray(offset + 8, offset + 8 + length);
  if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8'));
  if (type === 0x004e4942) data = chunk;
  offset += 8 + length;
}
const sizes = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 };
const read = { 5121: (b, o) => b.readUInt8(o), 5123: (b, o) => b.readUInt16LE(o), 5125: (b, o) => b.readUInt32LE(o), 5126: (b, o) => b.readFloatLE(o) };
function accessor(index) {
  const a = json.accessors[index], v = json.bufferViews[a.bufferView];
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type], size = sizes[a.componentType];
  const values = new Array(a.count * components), stride = v.byteStride ?? size * components;
  const offset = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
  for (let i = 0; i < a.count; i++) for (let j = 0; j < components; j++) values[i * components + j] = read[a.componentType](data, offset + i * stride + j * size);
  return values;
}
function category(name) {
  if (name.startsWith('Artigas —')) return 'Rostro de Artigas — anatomía esculpida';
  if (name.startsWith('Cabellera')) return 'Cabellera ondulada de Artigas';
  if (name.startsWith('Globo ocular')) return 'Ojos pétreos contenidos en las órbitas';
  if (name.startsWith('Caballo —')) return 'Caballo — cuerpo y cuatro apoyos';
  if (name.startsWith('Poncho')) return 'Poncho y uniforme — paño continuo';
  if (name.startsWith('Mano')) return 'Manos y dedos de Artigas';
  if (name.startsWith('Bota') || name.startsWith('Empeine') || name.startsWith('Suela') || name.startsWith('Tacón')) return 'Botas de montar de Artigas';
  if (name.startsWith('Basamento') || name.startsWith('Losa')) return 'Basamento rectangular escalonado';
  if (name.startsWith('Cola') || name.startsWith('Oreja') || name.startsWith('Ojo del caballo') || name.includes('crin')) return 'Crin, cola y detalles anatómicos del caballo';
  return 'Carona, flecos, estribos y riendas';
}
const buckets = new Map(), point = new Vector3(), normal = new Vector3();
function visit(index, parent) {
  const node = json.nodes[index];
  const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3(...(node.translation ?? [0, 0, 0])), new Quaternion(...(node.rotation ?? [0, 0, 0, 1])), new Vector3(...(node.scale ?? [1, 1, 1])));
  const world = parent.clone().multiply(local), normalMatrix = new Matrix3().getNormalMatrix(world);
  if (node.mesh !== undefined) for (const primitive of json.meshes[node.mesh].primitives) {
    if (primitive.mode !== undefined && primitive.mode !== 4) throw new Error('Only static triangles are supported');
    const material = json.materials[primitive.material], label = category(node.name), key = `${label}/${primitive.material}`;
    let bucket = buckets.get(key);
    if (!bucket) { bucket = { name: label, color: material.pbrMetallicRoughness.baseColorFactor.slice(0, 3), roughness: material.pbrMetallicRoughness.roughnessFactor, positions: [], normals: [], indices: [] }; buckets.set(key, bucket); }
    const p = accessor(primitive.attributes.POSITION), n = accessor(primitive.attributes.NORMAL), offset = bucket.positions.length / 3;
    for (let i = 0; i < p.length; i += 3) {
      point.fromArray(p, i).applyMatrix4(world); normal.fromArray(n, i).applyMatrix3(normalMatrix).normalize();
      bucket.positions.push(point.x, point.y, point.z); bucket.normals.push(normal.x, normal.y, normal.z);
    }
    const ids = primitive.indices === undefined ? p.map((_, i) => i).filter(i => i % 3 === 0).map(i => i / 3) : accessor(primitive.indices);
    for (const id of ids) bucket.indices.push(id + offset);
  }
  for (const child of node.children ?? []) visit(child, world);
}
for (const index of json.scenes[json.scene ?? 0].nodes) visit(index, new Matrix4());
let maxError = 0;
const groups = [...buckets.values()].map(bucket => {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < bucket.positions.length; i++) { const axis = i % 3; min[axis] = Math.min(min[axis], bucket.positions[i]); max[axis] = Math.max(max[axis], bucket.positions[i]); }
  const extent = max.map((v, i) => v - min[i]);
  const positions = Buffer.alloc(bucket.positions.length * 2), normals = Buffer.alloc(bucket.normals.length);
  bucket.positions.forEach((v, i) => {
    const axis = i % 3, q = extent[axis] ? Math.round((v - min[axis]) / extent[axis] * 65535) : 0;
    positions.writeUInt16LE(q, i * 2); maxError = Math.max(maxError, Math.abs(v - (min[axis] + q / 65535 * extent[axis])));
    normals.writeInt8(Math.max(-127, Math.min(127, Math.round(bucket.normals[i] * 127))), i);
  });
  const indexBytes = bucket.positions.length / 3 > 65535 ? 4 : 2, indices = Buffer.alloc(bucket.indices.length * indexBytes);
  bucket.indices.forEach((v, i) => indexBytes === 2 ? indices.writeUInt16LE(v, i * 2) : indices.writeUInt32LE(v, i * 4));
  return { name: bucket.name, color: bucket.color, roughness: bucket.roughness, min, extent, positions: positions.toString('base64'), normals: normals.toString('base64'), indices: indices.toString('base64'), indexBytes, vertices: bucket.positions.length / 3, triangles: bucket.indices.length / 3 };
});
const asset = { version: 1, sourceSha256: createHash('sha256').update(binary).digest('hex'), maxPositionError: maxError, groups };
writeFileSync(destination, JSON.stringify(asset));
console.log(JSON.stringify({ groups: groups.length, triangles: groups.reduce((n, g) => n + g.triangles, 0), packedBytes: readFileSync(destination).length, maxPositionError: maxError, sourceSha256: asset.sourceSha256 }));
