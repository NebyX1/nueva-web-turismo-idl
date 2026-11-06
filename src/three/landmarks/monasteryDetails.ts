import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type XYZ = [number, number, number];
const UP = new THREE.Vector3(0, 1, 0);
export function material(color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .82, ...extra });
}
export function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, mat: THREE.Material, at: XYZ, scale?: XYZ) {
  const item = new THREE.Mesh(geometry, mat); item.position.set(...at); if (scale) item.scale.set(...scale);
  item.castShadow = item.receiveShadow = true; group.add(item); return item;
}
export function box(group: THREE.Group, mat: THREE.Material, size: XYZ, at: XYZ) {
  return mesh(group, new THREE.BoxGeometry(...size), mat, at);
}
export function ellipsoid(group: THREE.Group, mat: THREE.Material, at: XYZ, scale: XYZ) {
  return mesh(group, new THREE.SphereGeometry(1, 14, 10), mat, at, scale);
}
export function beam(group: THREE.Group, mat: THREE.Material, a: XYZ, b: XYZ, radius: number) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
  const item = mesh(group, new THREE.CylinderGeometry(radius, radius, delta.length(), 8), mat, [0, 0, 0]);
  item.position.copy(start).add(end).multiplyScalar(.5); item.quaternion.setFromUnitVectors(UP, delta.normalize()); return item;
}
export function curve(group: THREE.Group, mat: THREE.Material, points: XYZ[], radius: number) {
  return mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 32, radius, 6, false), mat, [0, 0, 0]);
}

/** Seamless irregular masonry, generated without using photographic textures. */
export function masonryTexture() {
  const size = 256, cells = 8, cell = size / cells, sites: [number, number, number][] = [];
  let seed = 217;
  const random = () => { seed = Math.imul(seed ^ seed >>> 16, 0x45d9f3b); return (seed >>> 0) / 4294967296; };
  for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) sites.push([x * cell + cell * (.18 + random() * .64), y * cell + cell * (.18 + random() * .64), random()]);
  const colors = new Uint8Array(size * size * 4), relief = new Uint8Array(colors.length);
  const palette = [[110, 91, 69], [145, 119, 87], [95, 94, 81], [165, 143, 111], [125, 111, 92], [94, 81, 65]];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let closest = Infinity, second = Infinity, chosen = 0;
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = gx + dx, cy = gy + dy, index = ((cy + cells) % cells) * cells + (cx + cells) % cells;
      const site = sites[index], px = site[0] + Math.floor(cx / cells) * size, py = site[1] + Math.floor(cy / cells) * size;
      const distance = Math.hypot(x - px, y - py);
      if (distance < closest) { second = closest; closest = distance; chosen = index; } else second = Math.min(second, distance);
    }
    const mortar = second - closest < 1.55, noise = random() * 17 - 8, base = palette[Math.floor(sites[chosen][2] * palette.length)];
    const at = (y * size + x) * 4;
    for (let c = 0; c < 3; c++) { colors[at + c] = (mortar ? [177, 163, 140][c] : base[c]) + noise; relief[at + c] = mortar ? 58 : 178 + noise; }
    colors[at + 3] = relief[at + 3] = 255;
  }
  const map = new THREE.DataTexture(colors, size, size), bump = new THREE.DataTexture(relief, size, size);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, bump]) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(3, 2); texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.needsUpdate = true; }
  return { map, bumpMap: bump, bumpScale: .18 };
}

/** Painted scrollwork; intentionally no invented Tibetan lettering. */
export function paintedTexture() {
  const w = 256, h = 128, bytes = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, vine = .5 + Math.sin(u * Math.PI * 8) * .25;
    const cx = (u * 8 % 1) - .5, cy = v - .5, r = Math.hypot(cx, cy), angle = Math.atan2(cy, cx);
    const petal = .15 + .045 * Math.cos(angle * 6), flower = Math.abs(r - petal) < .025;
    const border = v < .055 || v > .945;
    const color = border || Math.abs(v - vine) < .025 ? [231, 186, 75]
      : flower ? [239, 221, 191] : r < .055 ? [202, 61, 63] : v < .2 || v > .8 ? [145, 36, 40] : [26, 130, 133];
    const at = (y * w + x) * 4; bytes.set([...color, 255], at);
  }
  const map = new THREE.DataTexture(bytes, w, h); map.colorSpace = THREE.SRGBColorSpace; map.magFilter = THREE.LinearFilter; map.needsUpdate = true; return map;
}

export function paintedBand(parent: THREE.Group, width: number, depth: number, y: number, palette: THREE.Material[], white: THREE.Material, dark: THREE.Material, gold: THREE.Material, z = 0) {
  const group = new THREE.Group(); group.position.z = z; parent.add(group);
  box(group, dark, [width + .12, .42, depth + .12], [0, y, 0]);
  box(group, gold, [width + .22, .12, depth + .22], [0, y + 1.13, 0]);
  const points: { x: number; z: number; angle: number }[] = [];
  for (let x = -width / 2 + .4; x < width / 2; x += .72) for (const sign of [-1, 1]) points.push({ x, z: sign * (depth / 2 + .09), angle: sign < 0 ? Math.PI : 0 });
  for (let zz = -depth / 2 + .4; zz < depth / 2; zz += .72) for (const sign of [-1, 1]) points.push({ x: sign * (width / 2 + .09), z: zz, angle: sign * Math.PI / 2 });
  const dummy = new THREE.Object3D(), beads = new THREE.InstancedMesh(new THREE.CircleGeometry(.145, 8), white, points.length);
  points.forEach((p, i) => { dummy.position.set(p.x, y, p.z); dummy.rotation.set(0, p.angle, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); beads.setMatrixAt(i, dummy.matrix); }); group.add(beads);
  for (let color = 0; color < palette.length; color++) {
    const entries = points.filter((_, i) => i % palette.length === color), blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(.32, .46, .34), palette[color], entries.length * 2);
    entries.forEach((p, i) => { for (let row = 0; row < 2; row++) { dummy.position.set(p.x, y + .48 + row * .34, p.z); dummy.rotation.set(0, p.angle, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); blocks.setMatrixAt(i * 2 + row, dummy.matrix); } });
    blocks.castShadow = true; group.add(blocks);
  }
  return group;
}

export function windowDetail(parent: THREE.Group, width: number, height: number, at: XYZ, angle: number, dark: THREE.Material, glass: THREE.Material, red: THREE.Material, white: THREE.Material, gold: THREE.Material) {
  const group = new THREE.Group(); group.position.set(...at); group.rotation.y = angle; parent.add(group);
  box(group, dark, [width + .38, height + .36, .25], [0, 0, 0]);
  box(group, red, [width + .03, height + .04, .15], [0, 0, .17]);
  box(group, glass, [width - .28, height - .24, .10], [0, 0, .26]);
  box(group, dark, [.11, height, .14], [0, 0, .36]);
  for (const y of [-.18, .19]) box(group, dark, [width, .10, .14], [0, height * y, .36]);
  box(group, white, [width + .92, .36, .66], [0, height / 2 + .44, .08]);
  box(group, gold, [width + .95, .11, .72], [0, height / 2 + .69, .13]);
  for (let x = -width / 2; x <= width / 2; x += .55) box(group, x % 1 > .4 ? red : dark, [.25, .3, .2], [x, height / 2 + .40, .48]);
  return group;
}

export function dharmaWheel(name: string, radius: number, gold: THREE.Material) {
  const group = new THREE.Group(); group.name = name;
  mesh(group, new THREE.TorusGeometry(radius, radius * .068, 8, 48), gold, [0, 0, 0]);
  mesh(group, new THREE.TorusGeometry(radius * .25, radius * .055, 6, 24), gold, [0, 0, 0]);
  ellipsoid(group, gold, [0, 0, .05], [radius * .15, radius * .15, radius * .1]);
  const spokes = new THREE.InstancedMesh(new THREE.CylinderGeometry(radius * .035, radius * .055, radius * .78, 8), gold, 8), dummy = new THREE.Object3D();
  spokes.name = 'Ocho radios de la rueda';
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4; dummy.position.set(Math.sin(a) * radius * .58, Math.cos(a) * radius * .58, 0); dummy.rotation.set(0, 0, -a); dummy.updateMatrix(); spokes.setMatrixAt(i, dummy.matrix);
    ellipsoid(group, gold, [Math.sin(a) * radius * 1.1, Math.cos(a) * radius * 1.1, 0], [radius * .07, radius * .07, radius * .065]);
  }
  spokes.castShadow = true; group.add(spokes); return group;
}

export function kneelingDeer(sign: number, gold: THREE.Material) {
  const group = new THREE.Group(); group.name = sign < 0 ? 'Ciervo izquierdo — mirando a la rueda' : 'Ciervo derecho — mirando a la rueda';
  const p = (x: number, y: number, z = 0): XYZ => [x * sign, y, z];
  ellipsoid(group, gold, p(3.9, .64), [1.12, .48, .42]);
  ellipsoid(group, gold, p(4.48, .43), [.55, .4, .43]);
  for (const z of [-.28, .28]) {
    beam(group, gold, p(3.28, .52, z), p(3.0, .15, z), .13);
    beam(group, gold, p(3.0, .15, z), p(3.8, .12, z), .11);
    beam(group, gold, p(4.65, .4, z), p(4.94, .13, z), .16);
    beam(group, gold, p(4.94, .13, z), p(4.08, .10, z), .10);
  }
  const neck = ellipsoid(group, gold, p(3.05, 1.15), [.31, .83, .29]); neck.rotation.z = -.35 * sign;
  ellipsoid(group, gold, p(2.76, 1.93), [.40, .29, .26]);
  ellipsoid(group, gold, p(2.42, 1.88), [.3, .16, .18]);
  for (const z of [-.18, .18]) {
    const ear = ellipsoid(group, gold, p(2.96, 2.23, z), [.12, .36, .13]); ear.rotation.z = -.45 * sign;
    curve(group, gold, [p(2.91, 2.16, z), p(3.04, 2.55, z), p(3.32, 2.85, z)], .045);
    beam(group, gold, p(3.06, 2.57, z), p(2.85, 2.85, z), .035);
  }
  curve(group, gold, [p(4.78, .8), p(5.12, 1.02), p(5.14, 1.24)], .10);
  return group;
}

export function finial(height: number, gold: THREE.Material) {
  const profile = [[0, 0], [.49, .02], [.49, .14], [.25, .22], [.35, .34], [.37, .48], [.22, .62], [.17, .74], [.30, .82], [.30, .94], [.16, 1.04], [.11, 1.2], [.23, 1.31], [.23, 1.43], [.13, 1.52], [.10, 1.7], [.17, 1.79], [.17, 1.9], [.08, 2.03], [.10, 2.17], [0, 2.55]];
  return new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y * height / 2.55)), 20), gold);
}

/** Batch each feature's static pieces while retaining named architectural groups. */
export function batchDetails(group: THREE.Group) {
  for (const child of [...group.children]) if (child instanceof THREE.Group) {
    batchDetails(child);
    if (!child.name) {
      child.updateMatrix();
      for (const part of [...child.children]) { part.applyMatrix4(child.matrix); group.add(part); }
      group.remove(child);
    }
  }
  const buckets = new Map<THREE.Material, THREE.Mesh[]>();
  for (const child of group.children) if (child instanceof THREE.Mesh && !(child as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(child.material) && !child.userData.keepMesh) {
    const bucket = buckets.get(child.material) ?? []; bucket.push(child); buckets.set(child.material, bucket);
  }
  for (const [mat, pieces] of buckets) {
    if (pieces.length < 2) continue;
    const geometries = pieces.map(part => { part.updateMatrix(); const geo = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone(); geo.applyMatrix4(part.matrix); if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(geo.attributes.position.count * 2).fill(0), 2)); return geo; });
    const geometry = mergeGeometries(geometries, false); geometries.forEach(geo => geo.dispose());
    if (!geometry) continue;
    const batch = new THREE.Mesh(geometry, mat); batch.name = 'Detalles agrupados'; batch.castShadow = batch.receiveShadow = true;
    for (const part of pieces) { group.remove(part); part.geometry.dispose(); } group.add(batch);
  }
}
