import * as THREE from 'three';
import type { LandmarkModel } from '../types';

// Dimensions here describe a photographic reconstruction, not surveyed geometry.
const Y = new THREE.Vector3(0, 1, 0);
const stone = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: .95, ...extra });
function random(seed: number) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material); object.position.set(x, y, z); object.castShadow = object.receiveShadow = true; group.add(object); return object;
}
function ellipsoid(group: THREE.Group, material: THREE.Material, p: number[], size: number[], detail = 16) {
  const object = mesh(group, new THREE.SphereGeometry(1, detail, Math.max(8, detail / 2)), material, p[0], p[1], p[2]); object.scale.set(size[0], size[1], size[2]); return object;
}
function segment(group: THREE.Group, material: THREE.Material, a: number[], b: number[], r1: number, r2 = r1, sides = 10) {
  const from = new THREE.Vector3(a[0], a[1], a[2]), to = new THREE.Vector3(b[0], b[1], b[2]), delta = to.clone().sub(from);
  const object = mesh(group, new THREE.CylinderGeometry(r2, r1, delta.length(), sides), material); object.position.copy(from.add(to).multiplyScalar(.5)); object.quaternion.setFromUnitVectors(Y, delta.normalize()); return object;
}
function tube(group: THREE.Group, material: THREE.Material, points: number[][], radius: number, steps = 24) {
  return mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2]))), steps, radius, 6, false), material);
}
function land(group: THREE.Group, width: number, depth: number, heightAt: (x: number, z: number) => number, seed: number) {
  const geometry = new THREE.PlaneGeometry(width, depth, 66, 56); geometry.rotateX(-Math.PI / 2);
  const p = geometry.attributes.position, colors = new Float32Array(p.count * 3), base = new THREE.Color('#718451'), rng = random(seed);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); p.setY(i, heightAt(x, z));
    const color = base.clone().offsetHSL((rng() - .5) * .035, (rng() - .5) * .14, (rng() - .5) * .10); colors.set([color.r, color.g, color.b], i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geometry.computeVertexNormals();
  return mesh(group, geometry, stone('#ffffff', { vertexColors: true }));
}
function vegetation(group: THREE.Group, count: number, seed: number, place: (rng: () => number, i: number) => THREE.Vector3, min = 2, max = 5) {
  const rng = random(seed), leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), stone('#718451'), count * 3);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.14, .24, 1, 5), stone('#59513d'), count);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const p = place(rng, i), height = min + rng() * (max - min);
    dummy.position.copy(p).add(new THREE.Vector3(0, height * .45, 0)); dummy.rotation.set(0, rng() * 6.28, 0); dummy.scale.set(height * .24, height * .9, height * .24); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    for (let j = 0; j < 3; j++) {
      dummy.position.copy(p).add(new THREE.Vector3((rng() - .5) * height * .5, height * (.6 + rng() * .3), (rng() - .5) * height * .5));
      dummy.scale.set(height * (.36 + rng() * .18), height * (.34 + rng() * .15), height * (.36 + rng() * .2)); dummy.rotation.set(rng() * .4, rng() * 6.28, rng() * .4); dummy.updateMatrix(); leaves.setMatrixAt(i * 3 + j, dummy.matrix);
      color.setHSL(.18 + rng() * .12, .20 + rng() * .21, .19 + rng() * .16); leaves.setColorAt(i * 3 + j, color);
    }
  }
  leaves.castShadow = leaves.receiveShadow = true; trunks.castShadow = true; group.add(leaves, trunks);
}
function scatteredRocks(group: THREE.Group, count: number, seed: number, place: (rng: () => number) => THREE.Vector3, max = 3) {
  const rng = random(seed), rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), stone('#8f9280'), count), dummy = new THREE.Object3D(), color = new THREE.Color();
  for (let i = 0; i < count; i++) { const size = .45 + rng() * max; dummy.position.copy(place(rng)); dummy.rotation.set(rng() * 2, rng() * 6, rng()); dummy.scale.set(size * 1.4, size * .65, size); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix); color.setHSL(.12, .08 + rng() * .12, .29 + rng() * .19); rocks.setColorAt(i, color); }
  rocks.castShadow = rocks.receiveShadow = true; group.add(rocks);
}
function trail(group: THREE.Group, positions: THREE.Vector3[], width: number, color = '#b7af92') {
  const vertices: number[] = [], indices: number[] = [];
  positions.forEach((p, i) => { const ahead = positions[Math.min(i + 1, positions.length - 1)], before = positions[Math.max(i - 1, 0)], direction = ahead.clone().sub(before).setY(0).normalize(), side = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(width / 2); vertices.push(p.x + side.x, p.y, p.z + side.z, p.x - side.x, p.y, p.z - side.z); if (i) { const n = i * 2; indices.push(n - 2, n, n - 1, n - 1, n, n + 1); } });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return mesh(group, geometry, stone(color, { side: THREE.DoubleSide }));
}

/** Original procedural albedo/height/roughness atlas, with weathered volcanic joints. */
function arequitaRockMaps() {
  const size = 512, diffuse = document.createElement('canvas'), bump = document.createElement('canvas'), roughness = document.createElement('canvas');
  for (const canvas of [diffuse, bump, roughness]) canvas.width = canvas.height = size;
  const d = diffuse.getContext('2d')!, b = bump.getContext('2d')!, r = roughness.getContext('2d')!, rng = random(180019);
  const albedo = d.createImageData(size, size), height = b.createImageData(size, size), rough = r.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const grain = (rng() - .5) * 24;
    const bedding = Math.sin(y * .063 + Math.sin(x * .027) * 1.4) * 6;
    const mottling = Math.sin(x * .036 + Math.sin(y * .019) * 2.5) * 12 + Math.sin(x * .17 - y * .10) * 4;
    const lichen = Math.max(0, Math.sin(x * .091) * Math.cos(y * .041) - .47) * 24;
    const value = 131 + grain + bedding + mottling, i = (y * size + x) * 4;
    albedo.data[i] = value + 4 + lichen * .16; albedo.data[i + 1] = value + 1 + lichen * .35; albedo.data[i + 2] = value - 12 - lichen * .5; albedo.data[i + 3] = 255;
    const elevation = 137 + grain * 1.5 + bedding * 1.8 + mottling * .9;
    height.data[i] = height.data[i + 1] = height.data[i + 2] = elevation; height.data[i + 3] = 255;
    rough.data[i] = rough.data[i + 1] = rough.data[i + 2] = 231 + grain * .45 + Math.abs(mottling) * .4; rough.data[i + 3] = 255;
  }
  d.putImageData(albedo, 0, 0); b.putImageData(height, 0, 0); r.putImageData(rough, 0, 0);
  // Interrupted, branching seams, not equally spaced decorative lines.
  for (let joint = 0; joint < 7; joint++) {
    const initial = 12 + rng() * 484, path = new Path2D();
    let x = initial, y = -20; path.moveTo(x, y);
    while (y < size + 20) { y += 18 + rng() * 31; x += (rng() - .5) * 21; path.lineTo(x, y); }
    d.strokeStyle = 'rgba(42,43,35,.63)'; d.lineWidth = 1.2 + rng() * 2.4; d.stroke(path);
    b.strokeStyle = '#292b25'; b.lineWidth = d.lineWidth + 2; b.stroke(path);
    r.strokeStyle = '#fafafa'; r.lineWidth = d.lineWidth + 3; r.stroke(path);
    d.save(); d.translate(2.1, -.5); d.strokeStyle = 'rgba(190,183,156,.32)'; d.lineWidth = .8; d.stroke(path); d.restore();
  }
  for (let seam = 0; seam < 17; seam++) {
    const x = rng() * size, y = rng() * size, width = 15 + rng() * 135;
    d.strokeStyle = 'rgba(51,51,42,.34)'; d.lineWidth = .6 + rng(); d.beginPath(); d.moveTo(x, y); d.lineTo(x + width * .5, y - 3); d.lineTo(x + width, y + rng() * 4); d.stroke();
    b.strokeStyle = '#64635b'; b.lineWidth = 1.5; b.beginPath(); b.moveTo(x, y); b.lineTo(x + width, y); b.stroke();
  }
  function texture(canvas: HTMLCanvasElement, color = false) {
    const map = new THREE.CanvasTexture(canvas); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(8, 1.6); map.anisotropy = 4;
    if (color) map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }
  return { map: texture(diffuse, true), bumpMap: texture(bump), roughnessMap: texture(roughness) };
}

/** Broad, jointed volcanic mesa with an irregular crown and dense wooded talus. */
export function createArequita(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Cerro Arequita — masa volcánica y monte';
  const terrain = (x: number, z: number) => Math.max(-1.6, 27 * Math.exp(-((x / 94) ** 2 + (z / 71) ** 2)) + Math.sin(x * .07) * Math.cos(z * .055) * 1.1 - 1.6);
  land(group, 290, 235, terrain, 71);
  const radial = 144, rings = 18, vertices: number[] = [], colors: number[] = [], indices: number[] = [], uvs: number[] = [];
  const rockColor = new THREE.Color(), heightAt = (angle: number) => Math.min(87, 80 + Math.sin(angle * 3 + .3) * 4.0 + Math.sin(angle * 7) * 2.6 + Math.sin(angle * 23 + .7) * 1.3 + Math.sin(angle * 43) * .5);
  const point = (angle: number, t: number) => {
    const crack = Math.pow(Math.max(0, Math.cos(angle * 17 + .3)), 16) * .090 * (.6 + .4 * Math.sin(t * Math.PI));
    const fluting = .042 * Math.sin(angle * 19) + .022 * Math.sin(angle * 37 + .6) - crack;
    const shoulder = 1.08 - .17 * t + .030 * Math.sin(t * 11 + angle * 4) + .009 * Math.sin(Math.floor(t * 8) * 2 + angle * 5);
    const outline = 1 + .09 * Math.sin(angle * 3) + .045 * Math.cos(angle * 7);
    return new THREE.Vector3(Math.cos(angle) * 78 * (shoulder + fluting) * outline, 8 + (heightAt(angle) - 8) * t, Math.sin(angle) * 43 * (shoulder + fluting) * outline);
  };
  for (let ring = 0; ring <= rings; ring++) for (let i = 0; i <= radial; i++) {
    const angle = i / radial * Math.PI * 2, t = ring / rings, p = point(angle, t); vertices.push(p.x, p.y, p.z);
    const seam = Math.pow(Math.max(0, Math.sin(angle * 19 + .2)), 9), noise = Math.sin(i * 11.71 + ring * 3.13) * .025;
    rockColor.setRGB(.79 + noise, .78 + noise, .71 + noise).multiplyScalar(.88 + t * .10 - seam * .13); colors.push(rockColor.r, rockColor.g, rockColor.b); uvs.push(i / radial, t);
    if (ring && i) { const a = ring * (radial + 1) + i; indices.push(a - radial - 2, a - 1, a, a - radial - 2, a, a - radial - 1); }
  }
  const maps = arequitaRockMaps(), rockMaterial = stone('#ffffff', { vertexColors: true, ...maps, bumpScale: 1.35, roughness: 1 });
  const sides = new THREE.BufferGeometry(); sides.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); sides.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); sides.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); sides.setIndex(indices); sides.computeVertexNormals(); mesh(group, sides, rockMaterial);
  // A jagged crown is a real surface with radial crags, rather than a flat fan cap.
  const topVertices = [0, 80.7, 0], topColors: number[] = [.75, .77, .64], topIndices: number[] = [], topUvs = [.5, .5], crownRings = 7;
  for (let ring = 1; ring <= crownRings; ring++) for (let i = 0; i <= radial; i++) {
    const angle = i / radial * Math.PI * 2, r = ring / crownRings, edge = point(angle, 1);
    const x = edge.x * r, z = edge.z * r, y = 80.7 * (1 - r) + edge.y * r + Math.sin(angle * 9 + r * 14) * Math.sin(r * 9) * (1 - r) * 4.2;
    topVertices.push(x, y, z); topUvs.push(x / 180 + .5, z / 110 + .5); topColors.push(.76 + .06 * Math.sin(i * .7), .78 + .04 * Math.sin(i * 1.3), .65 + .04 * Math.sin(i));
    const n = 1 + (ring - 1) * (radial + 1) + i;
    if (i) { if (ring === 1) topIndices.push(0, n, n - 1); else { const inner = n - radial - 1; topIndices.push(inner - 1, n, n - 1, inner - 1, inner, n); } }
  }
  const top = new THREE.BufferGeometry(); top.setAttribute('position', new THREE.Float32BufferAttribute(topVertices, 3)); top.setAttribute('color', new THREE.Float32BufferAttribute(topColors, 3)); top.setAttribute('uv', new THREE.Float32BufferAttribute(topUvs, 2)); top.setIndex(topIndices); top.computeVertexNormals();
  const topMaps = { map: maps.map.clone(), bumpMap: maps.bumpMap.clone(), roughnessMap: maps.roughnessMap.clone() }; Object.values(topMaps).forEach(map => { map.repeat.set(3.4, 3.4); map.needsUpdate = true; });
  mesh(group, top, stone('#ffffff', { vertexColors: true, ...topMaps, bumpScale: 1.2, roughness: 1, side: THREE.DoubleSide }));
  vegetation(group, 360, 902, rng => { const angle = rng() * Math.PI * 2, r = .75 + rng() * .73, x = Math.cos(angle) * 87 * r, z = Math.sin(angle) * 57 * r; return new THREE.Vector3(x, terrain(x, z) - .3, z); }, 4.5, 11.5);
  vegetation(group, 46, 929, rng => { const angle = rng() * Math.PI * 2, r = Math.sqrt(rng()) * .74, x = Math.cos(angle) * 67 * r, z = Math.sin(angle) * 35 * r; return new THREE.Vector3(x, 79.5 + Math.sin(angle * 3) * 1.2, z); }, 1.5, 3.8);
  scatteredRocks(group, 90, 73, rng => { const angle = rng() * 6.28, r = .8 + rng() * .7, x = Math.cos(angle) * 85 * r, z = Math.sin(angle) * 54 * r; return new THREE.Vector3(x, terrain(x, z) + .2, z); }, 3.5);
  const river: THREE.Vector3[] = []; for (let i = 0; i <= 60; i++) { const x = -145 + i * 4.83; river.push(new THREE.Vector3(x, -.85, 102 + Math.sin(x * .016) * 11)); }
  trail(group, river, 10, '#627f73');
  return { group, target: new THREE.Vector3(0, 43, 0), bounds: { radius: 136, height: 89 }, groundY: 0, cameraDirection: new THREE.Vector3(.55, .2, 1).normalize() };
}

function sanctuaryWall(): THREE.Shape {
  const shape = new THREE.Shape(); shape.moveTo(-4.6, 0); shape.lineTo(4.6, 0); shape.lineTo(4.6, .8); shape.bezierCurveTo(3.9, 1.2, 3.65, 2.6, 3.6, 4.2); shape.lineTo(3.6, 5.6); shape.lineTo(3.25, 5.8); shape.lineTo(3.15, 6.3); shape.lineTo(2.6, 6.5); shape.bezierCurveTo(1.55, 7.3, 1.13, 10.9, .95, 12.6); shape.lineTo(-.95, 12.6); shape.bezierCurveTo(-1.13, 10.9, -1.55, 7.3, -2.6, 6.5); shape.lineTo(-3.15, 6.3); shape.lineTo(-3.25, 5.8); shape.lineTo(-3.6, 5.6); shape.lineTo(-3.6, 4.2); shape.bezierCurveTo(-3.65, 2.6, -3.9, 1.2, -4.6, .8); shape.closePath();
  // Keep the hole strictly inside the outer contour: crossing y=0 caused Earcut
  // to fill the façade on some views instead of opening the pointed arch.
  const hole = new THREE.Path(); hole.moveTo(-1.95, .17); hole.lineTo(-1.95, 3.85); hole.bezierCurveTo(-1.95, 4.7, -.65, 5.9, 0, 6.25); hole.bezierCurveTo(.65, 5.9, 1.95, 4.7, 1.95, 3.85); hole.lineTo(1.95, .17); hole.closePath(); shape.holes.push(hole); return shape;
}
function inscription(group: THREE.Group, text: string, y: number, z: number, materialColor = '#505746') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 192;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.textAlign = 'center'; ctx.fillStyle = materialColor; ctx.font = '400 54px Arial'; text.split('\n').forEach((line, i) => ctx.fillText(line, 256, 67 + i * 68));
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const label = mesh(group, new THREE.PlaneGeometry(2.1, .8), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }), 0, y, z); label.castShadow = false;
}

/** White three-sided pointed-arch templete, globe and Marian figure on its hill. */
export function createVerdun(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Cerro del Verdún — santuario y Vía Crucis';
  const terrain = (x: number, z: number) => { const r = Math.sqrt((x / 112) ** 2 + (z / 103) ** 2), slope = Math.max(0, (r - .16) / .84); return Math.max(-1, 62 * Math.pow(Math.max(0, 1 - slope), 1.28) + Math.sin(x * .10) * Math.cos(z * .06) * Math.min(1, Math.max(0, r - .16) * 3)); };
  land(group, 270, 250, terrain, 424);
  scatteredRocks(group, 110, 114, rng => { const x = (rng() - .5) * 175, z = (rng() - .5) * 170; return new THREE.Vector3(x, terrain(x, z) + .2, z); }, 1.8);
  vegetation(group, 55, 995, rng => { const a = rng() * 6.28, r = .5 + rng() * .55, x = Math.cos(a) * 110 * r, z = Math.sin(a) * 100 * r; return new THREE.Vector3(x, terrain(x, z), z); }, 2, 5.5);
  const path: THREE.Vector3[] = [];
  for (let i = 0; i <= 120; i++) { const t = i / 120, z = 113 * (1 - t), x = Math.sin(t * Math.PI * 4.7) * 20 * Math.sin(t * Math.PI); path.push(new THREE.Vector3(x, terrain(x, z) + .24, z)); }
  trail(group, path, 3.3, '#b8b29b');
  const shrine = new THREE.Group(); shrine.position.y = 62.2; group.add(shrine);
  const white = stone('#edece1'), mint = stone('#8fbbb4'), gold = stone('#a18a42', { metalness: .3, roughness: .65 });
  for (let step = 0; step < 3; step++) mesh(shrine, new THREE.CylinderGeometry(12.8 - step * .6, 13.4 - step * .6, .23, 48), stone('#b5b4a2'), 0, -.3 + step * .22, 0);
  const wallGeo = new THREE.ExtrudeGeometry(sanctuaryWall(), { depth: .47, bevelEnabled: true, bevelSegments: 2, bevelSize: .075, bevelThickness: .05, curveSegments: 18 });
  const wallPosition = wallGeo.attributes.position;
  for (let i = 0; i < wallPosition.count; i++) wallPosition.setZ(i, wallPosition.getZ(i) + 2.45 * Math.pow(Math.max(0, 1 - wallPosition.getY(i) / 12.6), 1.25));
  wallGeo.computeVertexNormals();
  for (let face = 0; face < 3; face++) {
    const wall = mesh(shrine, wallGeo, white, 0, .4, 0); wall.rotation.y = face * Math.PI * 2 / 3;
    const innerGeo = new THREE.Shape(); innerGeo.moveTo(-1.95, .1); innerGeo.lineTo(-1.95, 3.85); innerGeo.bezierCurveTo(-1.95, 4.7, -.65, 5.9, 0, 6.25); innerGeo.bezierCurveTo(.65, 5.9, 1.95, 4.7, 1.95, 3.85); innerGeo.lineTo(1.95, .1); innerGeo.lineTo(1.79, .1); innerGeo.lineTo(1.79, 3.85); innerGeo.bezierCurveTo(1.79, 4.6, .6, 5.65, 0, 6.02); innerGeo.bezierCurveTo(-.6, 5.65, -1.79, 4.6, -1.79, 3.85); innerGeo.lineTo(-1.79, .1); innerGeo.closePath();
    const frameGeo = new THREE.ShapeGeometry(innerGeo, 18), fp = frameGeo.attributes.position;
    for (let i = 0; i < fp.count; i++) fp.setZ(i, .49 + 2.45 * Math.pow(Math.max(0, 1 - fp.getY(i) / 12.6), 1.25));
    const frame = mesh(shrine, frameGeo, mint, 0, .4, 0); frame.rotation.y = face * Math.PI * 2 / 3;
  }
  // The photographic front has a shaded blue-green inner reveal. A recessed,
  // pointed backing prevents the two far-side buttresses reading as a solid
  // white prism through the opening during the low frontal camera orbit.
  const recessShape = new THREE.Shape();
  recessShape.moveTo(-1.82, .20); recessShape.lineTo(-1.82, 3.82);
  recessShape.bezierCurveTo(-1.82, 4.57, -.61, 5.72, 0, 6.08);
  recessShape.bezierCurveTo(.61, 5.72, 1.82, 4.57, 1.82, 3.82);
  recessShape.lineTo(1.82, .20); recessShape.closePath();
  const recessGeo = new THREE.ShapeGeometry(recessShape, 30), recessPosition = recessGeo.attributes.position;
  for (let i = 0; i < recessPosition.count; i++) {
    const y = recessPosition.getY(i); recessPosition.setZ(i, .18 + 2.45 * Math.pow(Math.max(0, 1 - y / 12.6), 1.25));
  }
  mesh(shrine, recessGeo, stone('#417e7c', { roughness: 1, side: THREE.DoubleSide }), 0, .4, 0);
  const revealPoints = recessShape.getPoints(36), revealVertices: number[] = [], revealIndices: number[] = [];
  revealPoints.forEach((point, i) => {
    const frontZ = .50 + 2.45 * Math.pow(Math.max(0, 1 - point.y / 12.6), 1.25);
    revealVertices.push(point.x, point.y, frontZ, point.x, point.y, frontZ - .34);
    if (i) { const n = i * 2; revealIndices.push(n - 2, n, n - 1, n - 1, n, n + 1); }
  });
  const revealGeo = new THREE.BufferGeometry(); revealGeo.setAttribute('position', new THREE.Float32BufferAttribute(revealVertices, 3)); revealGeo.setIndex(revealIndices); revealGeo.computeVertexNormals();
  mesh(shrine, revealGeo, stone('#82b2a9', { side: THREE.DoubleSide }), 0, .4, 0);
  mesh(shrine, new THREE.CylinderGeometry(1.65, 1.18, .35, 3), white, 0, 13.05, 0).rotation.y = Math.PI;
  mesh(shrine, new THREE.CylinderGeometry(1.8, 1.65, .28, 3), white, 0, 13.35, 0).rotation.y = Math.PI;
  mesh(shrine, new THREE.SphereGeometry(1.48, 28, 20), stone('#78a5b4'), 0, 14.85, 0);
  const virgin = new THREE.Group(); virgin.position.y = 16.22; shrine.add(virgin);
  const robe = stone('#e3dfc9'), blue = stone('#3b739e'), hair = stone('#745e49');
  const skirt = new THREE.LatheGeometry([new THREE.Vector2(.68, 0), new THREE.Vector2(.55, .4), new THREE.Vector2(.38, 1.15), new THREE.Vector2(.25, 1.9), new THREE.Vector2(.21, 2.1)], 24); mesh(virgin, skirt, robe);
  ellipsoid(virgin, blue, [0, 1.24, -.11], [.52, 1.1, .37]);
  ellipsoid(virgin, robe, [.03, 2.25, .04], [.235, .29, .23]); ellipsoid(virgin, hair, [0, 2.30, -.05], [.25, .28, .22]);
  ellipsoid(virgin, robe, [.035, 2.25, .15], [.19, .25, .17]);
  segment(virgin, blue, [-.34, 1.82, .01], [-.19, 1.45, .35], .17, .13); segment(virgin, robe, [-.19, 1.45, .35], [0, 1.78, .39], .10, .07);
  segment(virgin, blue, [.34, 1.82, .01], [.19, 1.45, .35], .17, .13); segment(virgin, robe, [.19, 1.45, .35], [0, 1.78, .39], .10, .07);
  mesh(virgin, new THREE.TorusGeometry(.38, .024, 5, 32), gold, 0, 2.35, -.21);
  mesh(shrine, new THREE.BoxGeometry(.18, 1.45, .09), gold, 0, 8.0, 1.60); mesh(shrine, new THREE.BoxGeometry(.76, .18, .09), gold, 0, 8.23, 1.60);
  inscription(shrine, 'AVE\nMARIA', 9.6, 1.25);
  const rail = stone('#5e665d', { metalness: .4 }), posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(.035, .035, .9, 5), rail, 48), dummy = new THREE.Object3D();
  for (let i = 0; i < 48; i++) { const a = .28 + i / 47 * (Math.PI * 2 - .56); dummy.position.set(Math.sin(a) * 11.7, 1.0, Math.cos(a) * 11.7); dummy.updateMatrix(); posts.setMatrixAt(i, dummy.matrix); }
  shrine.add(posts); const rim = mesh(shrine, new THREE.TorusGeometry(11.7, .04, 4, 84, Math.PI * 2 - .56), rail, 0, 1.46, 0); rim.rotation.x = Math.PI / 2; rim.rotation.z = Math.PI / 2 + .28;
  const stationMat = stone('#cac7b8');
  for (let i = 1; i < 12; i++) { const p = path[Math.floor(i / 13 * 113)]; mesh(group, new THREE.BoxGeometry(.72, 1.15, .32), stationMat, p.x + 3.1, p.y + .54, p.z); }
  return { group, target: new THREE.Vector3(0, 71.2, 0), bounds: { radius: 121, height: 81 }, groundY: 0, cameraDirection: new THREE.Vector3(.32, .13, 1).normalize() };
}

function flagTexture(kind: number) {
  const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 240; const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fffdf2'; ctx.fillRect(0, 0, 384, 240);
    if (kind === 0) {
      ctx.fillStyle = '#3372a4'; for (let i = 1; i < 9; i += 2) ctx.fillRect(0, i * 240 / 9, 384, 240 / 9);
      ctx.fillStyle = '#fffdf2'; ctx.fillRect(0, 0, 142, 134); ctx.fillStyle = '#d7b74d'; ctx.beginPath(); ctx.arc(71, 66, 23, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#d7b74d'; ctx.lineWidth = 4; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; ctx.beginPath(); ctx.moveTo(71 + Math.cos(a) * 28, 66 + Math.sin(a) * 28); ctx.lineTo(71 + Math.cos(a) * 43, 66 + Math.sin(a) * 43); ctx.stroke(); }
    } else if (kind === 1) {
      ctx.fillStyle = '#2774a4'; ctx.fillRect(0, 0, 384, 80); ctx.fillRect(0, 160, 384, 80); ctx.strokeStyle = '#b23839'; ctx.lineWidth = 53; ctx.beginPath(); ctx.moveTo(-20, -15); ctx.lineTo(404, 255); ctx.stroke();
    } else { ctx.fillStyle = '#2a6b9e'; ctx.fillRect(0, 0, 384, 80); ctx.fillStyle = '#aa4c48'; ctx.fillRect(0, 160, 384, 80); }
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

/** Pale concrete horse and rider, cloak and tack, on the rocky grass summit. */
export function createArtigas(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Cerro Artigas — monumento ecuestre';
  const terrain = (x: number, z: number) => { const r = Math.sqrt((x / 81) ** 2 + (z / 72) ** 2), slope = Math.max(0, (r - .18) / .82); return 26 * Math.pow(Math.max(0, 1 - slope), 1.5) + Math.sin(x * .13) * Math.cos(z * .1) * Math.min(.6, Math.max(0, r - .18)); };
  land(group, 220, 200, terrain, 515);
  const approach: THREE.Vector3[] = []; for (let i = 0; i <= 80; i++) { const t = i / 80, z = 95 * (1 - t), x = 24 * Math.sin(t * 3.2) * (1 - t); approach.push(new THREE.Vector3(x, terrain(x, z) + .15, z)); } trail(group, approach, 4.5, '#b7b09a');
  scatteredRocks(group, 100, 681, rng => { const a = rng() * 6.28, r = 8 + rng() * 32, x = Math.cos(a) * r, z = Math.sin(a) * r; return new THREE.Vector3(x, terrain(x, z) + .3, z); }, 2.7);
  vegetation(group, 55, 971, rng => { const a = rng() * 6.28, r = .65 + rng() * .5, x = Math.cos(a) * 78 * r, z = Math.sin(a) * 67 * r; return new THREE.Vector3(x, terrain(x, z), z); }, 3.5, 7.5);
  const monument = new THREE.Group(); monument.position.y = 26; group.add(monument);
  const statue = stone('#bbb6a4'), darker = stone('#aaa590'), hoof = stone('#aaa48f');
  mesh(monument, new THREE.BoxGeometry(17, .65, 8), stone('#a8a797'), 0, .3, 0);
  ellipsoid(monument, statue, [-.4, 8.1, 0], [5.2, 2.40, 1.83], 24);
  ellipsoid(monument, statue, [3.0, 8.5, 0], [1.85, 2.40, 1.75], 20);
  ellipsoid(monument, statue, [-3.7, 8.2, 0], [2.10, 2.2, 1.85], 20);
  const neck = ellipsoid(monument, statue, [3.9, 10.7, 0], [1.44, 3.0, 1.25], 22); neck.rotation.z = -.47;
  const head = ellipsoid(monument, statue, [5.5, 12.6, 0], [1.48, 1.09, .92], 22); head.rotation.z = -.70;
  const muzzle = ellipsoid(monument, statue, [6.25, 11.65, 0], [.81, .66, .72], 18); muzzle.rotation.z = -.8;
  for (const side of [-1, 1]) {
    const ear = mesh(monument, new THREE.ConeGeometry(.30, 1.28, 9), statue, 5.03, 14.10, side * .55); ear.rotation.z = -.23;
    ellipsoid(monument, darker, [5.75, 12.91, side * .83], [.11, .11, .05], 10);
    ellipsoid(monument, darker, [6.63, 11.7, side * .58], [.15, .13, .05], 10);
    const fore = side === -1 ? [[3.25, 7.45, side * 1.28], [4.14, 4.10, side * 1.28], [3.9, 1.30, side * 1.30]] : [[3.05, 7.5, side * 1.30], [3.12, 3.7, side * 1.32], [3.00, .95, side * 1.32]];
    segment(monument, statue, fore[0], fore[1], .72, .43); segment(monument, statue, fore[1], fore[2], .39, .27); ellipsoid(monument, statue, fore[1], [.46, .55, .43]);
    mesh(monument, new THREE.BoxGeometry(.85, .64, .74), hoof, fore[2][0] + .18, fore[2][1] - .34, fore[2][2]);
    const hind = side === -1 ? [[-3.6, 7.6, side * 1.25], [-4.55, 4.7, side * 1.29], [-3.7, 2.5, side * 1.3], [-4.2, .95, side * 1.32]] : [[-3.25, 7.6, side * 1.3], [-2.8, 4.65, side * 1.33], [-2.25, 2.4, side * 1.35], [-2.65, .95, side * 1.35]];
    segment(monument, statue, hind[0], hind[1], 1.0, .6); segment(monument, statue, hind[1], hind[2], .48, .28); segment(monument, statue, hind[2], hind[3], .28, .25);
    ellipsoid(monument, statue, hind[1], [.63, .62, .58]); mesh(monument, new THREE.BoxGeometry(.88, .64, .78), hoof, hind[3][0] + .17, .58, hind[3][2]);
    tube(monument, darker, [[6.7, 11.9, side * .52], [5.1, 12.1, side * .85], [3.2, 11.5, side * 1.1], [1.65, 12.0, side * .55]], .065, 18);
  }
  for (let i = 0; i < 16; i++) { const t = i / 15; ellipsoid(monument, darker, [2.83 + t * 1.7, 9.9 + t * 3.7, -.06], [.37, .35, 1.14 - t * .45], 10); }
  tube(monument, darker, [[-5.0, 8.7, 0], [-6.0, 7.6, .1], [-6.4, 5.1, .25], [-5.9, 3.2, .4]], .40, 20);
  ellipsoid(monument, darker, [.0, 10.25, 0], [2.0, .38, 1.7], 18);
  const torso = ellipsoid(monument, statue, [.0, 12.8, 0], [1.05, 2.07, .78], 20); torso.rotation.z = .05;
  segment(monument, statue, [.10, 14.1, 0], [.38, 15.3, .0], .44, .4);
  ellipsoid(monument, statue, [.45, 15.65, .0], [.66, .88, .61], 20);
  ellipsoid(monument, darker, [.21, 16.08, -.04], [.66, .54, .62], 16);
  ellipsoid(monument, statue, [.94, 15.65, .0], [.25, .32, .36], 12);
  for (const side of [-1, 1]) {
    segment(monument, statue, [0, 11.1, side * .65], [.55, 10.1, side * 1.75], .57, .48);
    segment(monument, statue, [.55, 10.1, side * 1.75], [1.05, 7.35, side * 2.0], .43, .30);
    ellipsoid(monument, darker, [1.48, 7.15, side * 2.03], [.83, .28, .37], 14);
    segment(monument, statue, [.26, 13.92, side * .68], [1.12, 12.35, side * .82], .38, .30);
    segment(monument, statue, [1.12, 12.35, side * .82], [2.05, 12.04, side * .55], .28, .22);
    ellipsoid(monument, statue, [2.05, 12.05, side * .55], [.30, .23, .23], 12);
    const stirrup = mesh(monument, new THREE.TorusGeometry(.42, .055, 6, 16), darker, 1.3, 7.12, side * 2.05); stirrup.scale.set(.95, 1.3, 1);
    tube(monument, darker, [[-.15, 10.35, side * 1.6], [.6, 9.2, side * 1.98], [1.28, 7.4, side * 2.05]], .065, 12);
  }
  // The long coat drapes backward over the horse's rump, a key photo silhouette.
  const capeVertices: number[] = [], capeIndices: number[] = [], across = 12, down = 16;
  for (let j = 0; j <= down; j++) for (let i = 0; i <= across; i++) { const t = j / down, u = i / across; capeVertices.push(-.7 - t * 3.2 - .25 * Math.sin(u * Math.PI), 14.3 - t * 5.1 + Math.sin(u * 12) * t * .10, (u - .5) * (1.7 + t * 1.4) + Math.sin(t * 5 + u * 14) * .12 * t); if (i && j) { const n = j * (across + 1) + i; capeIndices.push(n - across - 2, n, n - 1, n - across - 2, n - across - 1, n); } }
  const capeGeo = new THREE.BufferGeometry(); capeGeo.setAttribute('position', new THREE.Float32BufferAttribute(capeVertices, 3)); capeGeo.setIndex(capeIndices); capeGeo.computeVertexNormals(); mesh(monument, capeGeo, stone('#b1ac99', { side: THREE.DoubleSide }));
  // Sparse spiky plants around the rocky plinth, observed in the side photograph.
  const leaves: number[] = [], leafIndices: number[] = [], rng = random(475);
  for (let plant = 0; plant < 42; plant++) { const a = rng() * 6.28, r = 8 + rng() * 10, x = Math.cos(a) * r, z = Math.sin(a) * r, y = terrain(x, z); for (let l = 0; l < 7; l++) { const angle = l / 7 * 6.28 + rng(), length = 1.2 + rng() * 1.7, n = leaves.length / 3; leaves.push(x - .12, y, z, x + .12, y, z, x + Math.cos(angle) * length, y + length * .65, z + Math.sin(angle) * length); leafIndices.push(n, n + 1, n + 2); } }
  const leafGeo = new THREE.BufferGeometry(); leafGeo.setAttribute('position', new THREE.Float32BufferAttribute(leaves, 3)); leafGeo.setIndex(leafIndices); leafGeo.computeVertexNormals(); mesh(group, leafGeo, stone('#53664d', { side: THREE.DoubleSide }));
  const waving: THREE.PlaneGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const x = -13 - i * 3.6, z = -8, y = terrain(x, z); segment(group, stone('#aaa99c', { metalness: .6 }), [x, y, z], [x, y + 14.5, z], .07, .055, 7);
    const geometry = new THREE.PlaneGeometry(3.7, 2.25, 14, 5); geometry.translate(1.85, 0, 0); const flag = mesh(group, geometry, new THREE.MeshStandardMaterial({ map: flagTexture(i), roughness: .9, side: THREE.DoubleSide }), x, y + 12.65, z); flag.castShadow = false; waving.push(geometry);
  }
  return { group, target: new THREE.Vector3(0, 34.5, 0), bounds: { radius: 96, height: 44 }, groundY: 0, cameraDirection: new THREE.Vector3(-.15, .10, 1).normalize(), update(time) { waving.forEach((geometry, i) => { const p = geometry.attributes.position; for (let v = 0; v < p.count; v++) p.setZ(v, Math.sin(p.getX(v) * 1.5 - time * 1.7 + i) * .27 * p.getX(v) / 3.7); p.needsUpdate = true; geometry.computeVertexNormals(); }); } };
}
