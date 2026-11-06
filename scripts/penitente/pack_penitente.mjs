import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';

const input = resolve(process.argv[2]), destination = resolve(process.argv[3]);
const raw = JSON.parse(readFileSync(input, 'utf8'));
let maxPositionError = 0;
const parts = raw.meshes.map(part => {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  part.positions.forEach((v, i) => { min[i % 3] = Math.min(min[i % 3], v); max[i % 3] = Math.max(max[i % 3], v); });
  const extent = max.map((v, i) => v - min[i]);
  // Preserve thin rock faces and clipped shoreline slivers. The continuous
  // stream surfaces tolerate uint16; rock and pool retain original float32.
  const positionBytes = ['rock', 'pool'].includes(part.kind) ? 4 : 2;
  const positions = Buffer.alloc(part.positions.length * positionBytes), normals = Buffer.alloc(part.normals.length);
  part.positions.forEach((v, i) => {
    const axis = i % 3, q = extent[axis] ? Math.round((v - min[axis]) / extent[axis] * 65535) : 0;
    if (positionBytes === 4) positions.writeFloatLE(v, i * 4);
    else positions.writeUInt16LE(q, i * 2);
    const decoded = positionBytes === 4 ? positions.readFloatLE(i * 4) : min[axis] + q / 65535 * extent[axis];
    maxPositionError = Math.max(maxPositionError, Math.abs(v - decoded));
    normals.writeInt8(Math.max(-127, Math.min(127, Math.round(part.normals[i] * 127))), i);
  });
  const vertices = part.positions.length / 3, indexBytes = vertices > 65535 ? 4 : 2;
  const indices = Buffer.alloc(part.indices.length * indexBytes);
  part.indices.forEach((v, i) => indexBytes === 2 ? indices.writeUInt16LE(v, i * 2) : indices.writeUInt32LE(v, i * 4));
  const colors = Buffer.from(part.colors.map(v => Math.max(0, Math.min(255, Math.round(v * 255)))));
  let flow;
  if (part.flow) {
    const values = part.flow.flat(), buffer = Buffer.alloc(values.length * 4);
    values.forEach((v, i) => buffer.writeFloatLE(v, i * 4)); flow = buffer.toString('base64');
  }
  return { name: part.name, kind: part.kind, min, extent, vertices, triangles: part.indices.length / 3, indexBytes, positionBytes,
    positions: positions.toString('base64'), normals: normals.toString('base64'), colors: colors.toString('base64'), indices: indices.toString('base64'), flow };
});
const asset = { version: 2, sourceSha256: createHash('sha256').update(readFileSync(resolve(dirname(input), 'penitente.glb'))).digest('hex'),
  maxPositionError, landscape: raw.landscape, parts };
writeFileSync(destination, JSON.stringify(asset));
console.log(JSON.stringify({ sourceSha256: asset.sourceSha256, parts: parts.length, triangles: parts.reduce((n, p) => n + p.triangles, 0), maxPositionError, bytes: readFileSync(destination).length }));
