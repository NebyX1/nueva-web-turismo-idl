import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { LandmarkModel } from '../types';

const up = new THREE.Vector3(0, 1, 0);
const rng = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const material = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: .93, ...extra });
function polygon(points: number[][]) {
  const shape = new THREE.Shape(); points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath(); return shape;
}
/** Drawn from the completed MINAS sign: upright, unbarred I, broad M and open A. */
function letters() {
  const m = polygon([[0, 0], [0, 15], [3, 15], [7.5, 5.7], [12, 15], [15, 15], [15, 0], [12.1, 0], [12.1, 9.8], [8.6, 2.1], [6.3, 2.1], [2.9, 9.8], [2.9, 0]]);
  const i = polygon([[0, 0], [0, 15], [2.9, 15], [2.9, 0]]);
  const n = polygon([[0, 0], [0, 15], [2.8, 15], [10.2, 5], [10.2, 15], [13, 15], [13, 0], [10.2, 0], [2.8, 10], [2.8, 0]]);
  const a = polygon([[0, 0], [5, 15], [8, 15], [13, 0], [10, 0], [8.65, 4.2], [4.35, 4.2], [3, 0]]);
  const hole = new THREE.Path(); hole.moveTo(5.1, 6.6); hole.lineTo(7.9, 6.6); hole.lineTo(6.5, 11.2); hole.closePath(); a.holes.push(hole);
  const s = new THREE.Shape(); s.moveTo(12.3, 11.5);
  s.bezierCurveTo(12.1, 14, 10.5, 15, 6.7, 15); s.bezierCurveTo(2, 15, .6, 12.7, .6, 10.4);
  s.bezierCurveTo(.6, 7.2, 3.2, 6.5, 6.8, 5.7); s.bezierCurveTo(9.2, 5.1, 9.8, 4.7, 9.8, 3.7);
  s.bezierCurveTo(9.8, 2.7, 8.9, 2.1, 6.7, 2.1); s.bezierCurveTo(4.2, 2.1, 2.9, 3.8, 2.7, 4.9);
  s.lineTo(0, 4.3); s.bezierCurveTo(.3, 1.2, 2.5, 0, 6.6, 0); s.bezierCurveTo(11, 0, 13, 2, 13, 4.2);
  s.bezierCurveTo(13, 7.4, 10.6, 8.3, 7, 9.1); s.bezierCurveTo(4.7, 9.7, 3.6, 10.2, 3.6, 11.3);
  s.bezierCurveTo(3.6, 12.4, 4.7, 12.8, 6.7, 12.8); s.bezierCurveTo(8.8, 12.8, 9.6, 12.2, 9.8, 11); s.lineTo(12.3, 11.5); s.closePath();
  return [{ shape: m, w: 15 }, { shape: i, w: 2.9 }, { shape: n, w: 13 }, { shape: a, w: 13 }, { shape: s, w: 13 }];
}

export function createMinasSign(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Letras MINAS — cerro de La Coronilla';
  const white = material('#f4f3e7', { roughness: .63, metalness: .1 }), steel = material('#6c716b', { metalness: .56 });
  const red = material('#a16f51'), rock = material('#aaa18b'), asphalt = material('#515653'), paint = material('#d5d3b0');
  function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, mat); object.position.set(x, y, z); object.castShadow = object.receiveShadow = true; group.add(object); return object;
  }
  function bar(a: THREE.Vector3, b: THREE.Vector3, radius: number, mat: THREE.Material) {
    const delta = b.clone().sub(a), object = mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), 6), mat);
    object.position.copy(a).add(b).multiplyScalar(.5); object.quaternion.setFromUnitVectors(up, delta.normalize());
  }
  const height = (x: number, z: number) => {
    const ridge = Math.max(-1, 45 * Math.exp(-((x / 151) ** 2 + ((z + 36) / 84) ** 2)) + 9 * Math.exp(-(((x - 88) / 78) ** 2 + ((z + 65) / 59) ** 2)) - 1.6);
    const grain = Math.sin(x * .17 + z * .13) * .48 + Math.sin(x * .073 - z * .11) * .65;
    const edge = Math.max(Math.abs(x) / 171, Math.abs(z) / 137);
    const ordinary = (ridge + grain) * (1 - THREE.MathUtils.smoothstep(edge, .78, 1));
    const terrace = (1 - THREE.MathUtils.smoothstep(Math.abs(x), 39, 48)) * (1 - THREE.MathUtils.smoothstep(Math.abs(z - 13), 6, 10));
    return THREE.MathUtils.lerp(ordinary, 30.2, terrace);
  };
  const terrain = new THREE.PlaneGeometry(342, 274, 125, 105); terrain.rotateX(-Math.PI / 2);
  const p = terrain.attributes.position, colors = new Float32Array(p.count * 3), rand = rng(817331), color = new THREE.Color();
  for (let j = 0; j < p.count; j++) {
    const x = p.getX(j), z = p.getZ(j), y = height(x, z); p.setY(j, y);
    const exposed = z < 7 && y > 28, cut = Math.abs(x) < 44 && z > 5 && z < 23;
    color.set(cut ? '#a77b5e' : exposed ? '#9d9f81' : '#79865b'); color.offsetHSL(0, (rand() - .5) * .09, (rand() - .5) * .1); color.toArray(colors, j * 3);
  }
  terrain.setAttribute('color', new THREE.BufferAttribute(colors, 3)); terrain.computeVertexNormals(); mesh(terrain, material('#ffffff', { vertexColors: true }));
  // The reddish cut terrace is narrow: the letters sit below the rocky crown,
  // rather than standing on an invented rectangular plinth at the summit.
  const apron: number[] = [], apronIndices: number[] = [];
  for (let j = 0; j <= 50; j++) {
    const x = -47 + j * 1.88, lip = 21.1 + Math.sin(x * .17) * 1.4;
    apron.push(x, 30.24, 6.5, x, 30.24, lip);
    if (j) { const n = j * 2; apronIndices.push(n - 2, n - 1, n, n - 1, n + 1, n); }
  }
  const apronGeo = new THREE.BufferGeometry(); apronGeo.setAttribute('position', new THREE.Float32BufferAttribute(apron, 3)); apronGeo.setIndex(apronIndices); apronGeo.computeVertexNormals(); mesh(apronGeo, red);
  const glyphs = letters(), gap = 3.2, total = glyphs.reduce((sum, glyph) => sum + glyph.w, 0) + gap * 4;
  let cursor = -total / 2;
  glyphs.forEach(({ shape, w }, index) => {
    const y = 30.4 - index * .035;
    mesh(new THREE.ExtrudeGeometry(shape, { depth: 1.25, bevelEnabled: true, bevelSize: .07, bevelThickness: .06, bevelSegments: 2, curveSegments: 24, steps: 1 }), white, cursor, y, 10);
    for (const x of w < 4 ? [w / 2] : [1.8, w - 1.8]) {
      bar(new THREE.Vector3(cursor + x, y, 9.8), new THREE.Vector3(cursor + x, y + 14.1, 9.8), .16, steel);
      bar(new THREE.Vector3(cursor + x, y + 1, 5.8), new THREE.Vector3(cursor + x, y + 12, 9.8), .13, steel);
      for (let level = 0; level < 3; level++) bar(new THREE.Vector3(cursor + x, y + level * 4.3, 5.8 + level), new THREE.Vector3(cursor + x, y + (level + 1) * 4.3, 9.8), .075, steel);
    }
    cursor += w + gap;
  });
  // Granitic fragments and scrub follow the actual hillside's mottled texture.
  const stones = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), rock, 430), dummy = new THREE.Object3D();
  let placed = 0;
  while (placed < 430) {
    const x = (rand() - .5) * 272, z = -91 + rand() * 175;
    if (Math.abs(x) < 49 && z > 3 && z < 27) continue;
    const size = .45 + rand() ** 2 * 2.1;
    dummy.position.set(x, height(x, z) + size * .12, z); dummy.scale.set(size * 1.5, size * .4, size); dummy.rotation.set(rand(), rand() * 6.28, rand()); dummy.updateMatrix(); stones.setMatrixAt(placed++, dummy.matrix);
  }
  stones.castShadow = stones.receiveShadow = true; stones.computeBoundingSphere(); group.add(stones);
  const foliage = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), material('#53694a'), 180);
  for (let j = 0; j < 180; j++) {
    let x = (rand() - .5) * 275, z = 32 + rand() * 63;
    if (j < 42) { x = (j % 2 ? 1 : -1) * (65 + rand() * 72); z = -65 + rand() * 90; }
    const size = 1.7 + rand() * 3.2;
    dummy.position.set(x, height(x, z) + size * .5, z); dummy.scale.set(size, size * .85, size * .82); dummy.rotation.set(rand(), rand() * 6.28, rand()); dummy.updateMatrix(); foliage.setMatrixAt(j, dummy.matrix);
    color.setHSL(.22 + rand() * .05, .21 + rand() * .13, .19 + rand() * .08); foliage.setColorAt(j, color);
  }
  foliage.castShadow = foliage.receiveShadow = true; foliage.computeBoundingSphere(); group.add(foliage);
  function ribbon(points: THREE.Vector3[], width: number, mat: THREE.Material) {
    const v: number[] = [], indices: number[] = [];
    points.forEach((point, j) => { v.push(point.x, point.y, point.z - width / 2, point.x, point.y, point.z + width / 2); if (j) { const n = j * 2; indices.push(n - 2, n - 1, n, n - 1, n + 1, n); } });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.setIndex(indices); geo.computeVertexNormals(); mesh(geo, mat);
  }
  const road: THREE.Vector3[] = [];
  for (let j = 0; j <= 80; j++) { const x = -165 + j * 4.125, z = 109 + Math.sin(x * .008) * 5; road.push(new THREE.Vector3(x, height(x, z) + .13, z)); }
  ribbon(road, 12, asphalt);
  ribbon(road.map(point => point.clone().add(new THREE.Vector3(0, .025, -5.35))), .17, paint);
  ribbon(road.map(point => point.clone().add(new THREE.Vector3(0, .025, 5.35))), .17, paint);
  for (let j = 0; j < road.length - 1; j += 4) { const point = road[j]; const dash = mesh(new THREE.BoxGeometry(2.7, .035, .16), paint, point.x, point.y + .035, point.z); dash.rotation.y = -.035; }
  // Batch all static details sharing a material; foliage remains instanced.
  group.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.Mesh[]>();
  for (const child of [...group.children]) if (child instanceof THREE.Mesh && !(child instanceof THREE.InstancedMesh) && !Array.isArray(child.material)) {
    const list = batches.get(child.material) || []; list.push(child); batches.set(child.material, list);
  }
  for (const [mat, list] of batches) if (list.length > 1) {
    const pieces = list.map(object => { const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone(); geometry.applyMatrix4(object.matrixWorld); return geometry; });
    if (!pieces.every(geometry => geometry.hasAttribute('uv'))) pieces.forEach(geometry => geometry.deleteAttribute('uv'));
    const joined = mergeGeometries(pieces, false);
    if (joined) { list.forEach(object => { group.remove(object); object.geometry.dispose(); }); mesh(joined, mat); }
    pieces.forEach(geometry => geometry.dispose());
  }
  return { group, target: new THREE.Vector3(0, 35.5, 10), bounds: { radius: 175, height: 55 }, groundY: 0, cameraDirection: new THREE.Vector3(.12, .2, 1).normalize() };
}
