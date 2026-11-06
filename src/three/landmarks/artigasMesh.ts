import * as THREE from 'three';

export interface PackedArtigas {
  version: number;
  sourceSha256: string;
  maxPositionError: number;
  groups: {
    name: string;
    color: number[];
    roughness: number;
    min: number[];
    extent: number[];
    positions: string;
    normals: string;
    indices: string;
    indexBytes: number;
    vertices: number;
    triangles: number;
  }[];
}

function bytes(base64: string) {
  const raw = atob(base64), result = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) result[i] = raw.charCodeAt(i);
  return result;
}

/** Static authored geometry is available immediately, including during pause. */
export function createArtigasFromAsset(asset: PackedArtigas) {
  if (asset.version !== 1) throw new Error('Unsupported Artigas mesh version');
  const group = new THREE.Group(); group.name = 'Artigas — monumento ecuestre reconstruido';
  group.userData.assetSha256 = asset.sourceSha256;
  group.userData.reference = 'docs/artigas-quality-review.md';
  const materials = new Map<string, THREE.MeshStandardMaterial>(), features = new Map<string, THREE.Group>();
  for (const part of asset.groups) {
    const q = new DataView(bytes(part.positions).buffer), encodedNormals = new Int8Array(bytes(part.normals).buffer);
    const positions = new Float32Array(part.vertices * 3), normals = new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i++) positions[i] = part.min[i % 3] + q.getUint16(i * 2, true) / 65535 * part.extent[i % 3];
    for (let i = 0; i < normals.length; i += 3) {
      const x = encodedNormals[i], y = encodedNormals[i + 1], z = encodedNormals[i + 2], length = Math.hypot(x, y, z) || 1;
      normals[i] = x / length; normals[i + 1] = y / length; normals[i + 2] = z / length;
    }
    const packedIndices = new DataView(bytes(part.indices).buffer), count = part.triangles * 3;
    const indices = part.indexBytes === 2 ? new Uint16Array(count) : new Uint32Array(count);
    for (let i = 0; i < count; i++) indices[i] = part.indexBytes === 2 ? packedIndices.getUint16(i * 2, true) : packedIndices.getUint32(i * 4, true);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const key = `${part.color.join(',')}/${part.roughness}`;
    let material = materials.get(key);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(part.color[0], part.color[1], part.color[2]), roughness: part.roughness });
      materials.set(key, material);
    }
    let feature = features.get(part.name);
    if (!feature) { feature = new THREE.Group(); feature.name = part.name; features.set(part.name, feature); group.add(feature); }
    const object = new THREE.Mesh(geometry, material); object.name = part.name;
    object.castShadow = object.receiveShadow = true; feature.add(object);
  }
  return group;
}
