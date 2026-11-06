import * as THREE from 'three';

export interface PenitenteAsset {
  version: number;
  sourceSha256: string;
  maxPositionError: number;
  landscape: { shrubs: number[][]; curve: number[][]; impact: number[]; poolLevel: number; maxY: number };
  parts: { name: string; kind: string; min: number[]; extent: number[]; vertices: number; triangles: number; indexBytes: number; positionBytes?: number;
    positions: string; normals: string; colors: string; indices: string; flow?: string }[];
}

function bytes(base64: string) {
  const raw = atob(base64), result = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) result[i] = raw.charCodeAt(i);
  return result;
}

export function decodePenitenteGeometry(part: PenitenteAsset['parts'][number]) {
  const encoded = new DataView(bytes(part.positions).buffer), packedNormals = new Int8Array(bytes(part.normals).buffer);
  const positions = new Float32Array(part.vertices * 3), normals = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i++) positions[i] = part.positionBytes === 4 ? encoded.getFloat32(i * 4, true)
    : part.min[i % 3] + encoded.getUint16(i * 2, true) / 65535 * part.extent[i % 3];
  for (let i = 0; i < normals.length; i += 3) {
    const x = packedNormals[i], y = packedNormals[i + 1], z = packedNormals[i + 2], length = Math.hypot(x, y, z) || 1;
    normals[i] = x / length; normals[i + 1] = y / length; normals[i + 2] = z / length;
  }
  const encodedIndices = new DataView(bytes(part.indices).buffer), count = part.triangles * 3;
  const indices = part.indexBytes === 2 ? new Uint16Array(count) : new Uint32Array(count);
  for (let i = 0; i < count; i++) indices[i] = part.indexBytes === 2 ? encodedIndices.getUint16(i * 2, true) : encodedIndices.getUint32(i * 4, true);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  if (part.colors) geometry.setAttribute('color', new THREE.BufferAttribute(bytes(part.colors), 3, true));
  if (part.flow) {
    const encodedFlow = new DataView(bytes(part.flow).buffer), flow = new Float32Array(part.vertices * 3);
    for (let i = 0; i < flow.length; i++) flow[i] = encodedFlow.getFloat32(i * 4, true);
    geometry.setAttribute('aFlow', new THREE.Float32BufferAttribute(flow, 3));
  }
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}
