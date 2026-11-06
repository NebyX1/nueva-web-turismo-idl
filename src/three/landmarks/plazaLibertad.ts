import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { LandmarkModel, LandmarkNightLighting } from '../types';
import { createPlazaFountainLights } from './plazaFountainLights';

// Observed photographs and the compositional axis are documented in the research note.
// Scene units are approximate metres; this is an interpretation, not a surveyed model.
const UP = new THREE.Vector3(0, 1, 0);
type P = [number, number, number];
const v = (p: P) => new THREE.Vector3(...p);
function material(color: string, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .84, ...extra });
}
function add(g: THREE.Group, geometry: THREE.BufferGeometry, mat: THREE.Material, p: P, s?: P) {
  const m = new THREE.Mesh(geometry, mat); m.position.set(...p); if (s) m.scale.set(...s);
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function block(g: THREE.Group, mat: THREE.Material, size: P, p: P) { return add(g, new THREE.BoxGeometry(...size), mat, p); }
function ellipsoid(g: THREE.Group, mat: THREE.Material, p: P, s: P) { return add(g, new THREE.SphereGeometry(1, 20, 12), mat, p, s); }
function link(g: THREE.Group, mat: THREE.Material, a: P, b: P, r: number, r2 = r) {
  const delta = v(b).sub(v(a)); const m = add(g, new THREE.CylinderGeometry(r2, r, delta.length(), 9), mat, v(a).add(v(b)).multiplyScalar(.5).toArray() as P);
  m.quaternion.setFromUnitVectors(UP, delta.normalize()); return m;
}
function curve(g: THREE.Group, mat: THREE.Material, points: P[], radius: number, segments = 22) {
  return add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v)), segments, radius, 6, false), mat, [0, 0, 0]);
}
function archShape(width: number, height: number) {
  const r = width / 2, h = height - r, shape = new THREE.Shape();
  shape.moveTo(-r, 0); shape.lineTo(r, 0); shape.lineTo(r, h);
  shape.absarc(0, h, r, 0, Math.PI, false); shape.lineTo(-r, 0); return shape;
}
function arch(g: THREE.Group, mat: THREE.Material, width: number, height: number, p: P, depth = .15) {
  return add(g, new THREE.ExtrudeGeometry(archShape(width, height), { depth, bevelEnabled: false, curveSegments: 18 }), mat, p);
}
function archTrim(g: THREE.Group, mat: THREE.Material, width: number, height: number, p: P, thickness = .18) {
  const points: P[] = [[p[0] - width / 2, p[1], p[2]], [p[0] - width / 2, p[1] + height - width / 2, p[2]]];
  for (let i = 0; i <= 24; i++) { const a = Math.PI - i / 24 * Math.PI; points.push([p[0] + Math.cos(a) * width / 2, p[1] + height - width / 2 + Math.sin(a) * width / 2, p[2]]); }
  points.push([p[0] + width / 2, p[1], p[2]]); curve(g, mat, points, thickness, 42);
}
function pediment(g: THREE.Group, mat: THREE.Material, width: number, height: number, p: P, depth: number) {
  const shape = new THREE.Shape(); shape.moveTo(-width / 2, 0); shape.lineTo(width / 2, 0); shape.lineTo(0, height); shape.closePath();
  add(g, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), mat, p);
}
function granite() {
  const data = new Uint8Array(128 * 128 * 4); let seed = 8383;
  for (let i = 0; i < data.length; i += 4) { seed = Math.imul(seed ^ seed >>> 13, 1597334677); const n = (seed >>> 24) / 255, dark = n > .9 ? -.28 : n < .1 ? .2 : (n - .5) * .15;
    data[i] = 192 + dark * 160; data[i + 1] = 143 + dark * 150; data[i + 2] = 121 + dark * 140; data[i + 3] = 255; }
  const texture = new THREE.DataTexture(data, 128, 128, THREE.RGBAFormat); texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(3, 3); texture.needsUpdate = true; return texture;
}

function cathedral(parent: THREE.Group) {
  const g = new THREE.Group(); g.name = 'Concatedral · cinco arcadas, relojes, campanarios y cúpula'; g.position.set(0, .15, -123); parent.add(g);
  const yellow = material('#e5cb84'), white = material('#eeeadd'), shade = material('#303637'), door = material('#40362d'), roof = material('#7f8c86', { metalness: .12, roughness: .62 }), bell = material('#7f7550', { metalness: .55 });
  // Long nave behind the portico; the dome is visible between the two towers.
  block(g, yellow, [26, 17.6, 38], [0, 10.1, -19]); block(g, white, [27, .55, 39], [0, 19.1, -19]);
  block(g, yellow, [32.5, 6.2, 5.8], [0, 15.2, 0]); block(g, white, [34, .5, 7], [0, 18.45, .1]);
  block(g, white, [34.3, .38, 7.2], [0, 13.1, .2]); block(g, white, [34, .5, 7], [0, 12.2, .1]);
  // Deep, shadowed portico openings and detached fluted pilasters.
  for (const x of [-12, -6, 0, 6, 12]) {
    arch(g, shade, 5.4, 9.9, [x, 2.2, 2.98]); archTrim(g, white, 5.6, 10.1, [x, 2.1, 3.2], .17);
    arch(g, door, 2.6, 6.7, [x, 2.2, 3.16], .08);
    pediment(g, white, 3.6, .9, [x, 8.6, 3.5], .22); block(g, white, [3.8, .15, .4], [x, 8.6, 3.6]);
  }
  for (const x of [-15, -9, -3, 3, 9, 15]) {
    block(g, white, [.78, 8.9, .82], [x, 6.5, 3.4]); block(g, white, [1.2, .38, 1], [x, 2.25, 3.4]); block(g, white, [1.15, .6, 1], [x, 10.75, 3.4]);
    for (const dx of [-.23, 0, .23]) link(g, yellow, [x + dx, 3, 3.85], [x + dx, 10.3, 3.85], .035);
    for (const side of [-1, 1]) ellipsoid(g, white, [x + side * .38, 10.9, 3.86], [.19, .16, .1]);
  }
  // Balustraded entablature with the low central pediment in front of the higher gable.
  for (let x = -15.5; x <= 15.5; x += .64) { link(g, white, [x, 13.25, 3.61], [x, 14.4, 3.61], .075, .11); }
  block(g, white, [33.3, .17, .4], [0, 14.5, 3.6]);
  pediment(g, yellow, 22, 5.5, [0, 18.4, -.7], .8);
  for (const side of [-1, 1]) link(g, white, [0, 24.1, .23], [side * 11.2, 18.5, .23], .25);
  block(g, white, [22.6, .33, .65], [0, 18.45, .22]);
  // Half-round fan window in the high pediment.
  const fan = new THREE.Shape(); fan.moveTo(-2.5, 0); fan.absarc(0, 0, 2.5, Math.PI, 0, true); fan.closePath();
  add(g, new THREE.ShapeGeometry(fan, 24), shade, [0, 19.1, .2]);
  for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; link(g, white, [0, 19.1, .3], [Math.cos(a) * 2.48, 19.1 + Math.sin(a) * 2.48, .3], .035); }
  pediment(g, yellow, 10.5, 3.1, [0, 14.5, 3.67], .35);
  for (const side of [-1, 1]) link(g, white, [0, 17.8, 4.1], [side * 5.4, 14.5, 4.1], .18);
  const seal = add(g, new THREE.TorusGeometry(.65, .08, 6, 28), white, [0, 15.9, 4.12]); seal.castShadow = false;
  // The photographed tower tops are shallow curved grey caps, not Gothic spires.
  for (const x of [-13.1, 13.1]) {
    block(g, yellow, [7.2, 8, 7.7], [x, 22.4, -.5]);
    for (const dx of [-3.2, 3.2]) { block(g, white, [.42, 8.1, .45], [x + dx, 22.4, 3.5]); }
    for (const y of [18.6, 26.2, 33.4]) { block(g, white, [7.7, .43, 8.2], [x, y, -.4]); block(g, white, [8, .22, 8.5], [x, y + .33, -.4]); }
    // Clock and carved surround, set into each yellow tower front.
    add(g, new THREE.CircleGeometry(1.2, 32), shade, [x, 22.4, 3.58]); add(g, new THREE.TorusGeometry(1.35, .19, 8, 32), white, [x, 22.4, 3.64]);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const tick = block(g, white, [.06, .19, .03], [x + Math.sin(a) * .98, 22.4 + Math.cos(a) * .98, 3.65]); tick.rotation.z = -a; }
    link(g, white, [x, 22.4, 3.69], [x + .25, 23.13, 3.69], .044); link(g, white, [x, 22.4, 3.7], [x - .65, 22.38, 3.7], .05);
    for (const yy of [20.85, 23.95]) { pediment(g, white, 3.2, .7, [x, yy, 3.65], .1); }
    // Four open belfry faces: real posts, curved arches and an internal bell.
    for (const dx of [-3, 3]) for (const dz of [-3.5, 3.5]) { block(g, yellow, [1.2, 6.6, 1.2], [x + dx, 29.85, -.5 + dz]); block(g, white, [.26, 6.6, .3], [x + dx, 29.85, dz + (dz > 0 ? .18 : -1.18)]); }
    for (const side of [-1, 1]) {
      archTrim(g, white, 3.9, 5.5, [x, 27, -.5 + side * 4], .2);
      const sideArch = new THREE.Group(); sideArch.position.set(x + side * 3.6, 27, -.5); sideArch.rotation.y = side * Math.PI / 2; g.add(sideArch); archTrim(sideArch, white, 4.8, 5.5, [0, 0, 0], .18);
    }
    const bellProfile = [[.13, 1.7], [.4, 1.45], [.55, .8], [.9, .2], [1, 0]].map(([r, y]) => new THREE.Vector2(r, y));
    add(g, new THREE.LatheGeometry(bellProfile, 18), bell, [x, 27.4, -.4]); link(g, shade, [x, 29.1, -.4], [x, 31.5, -.4], .09);
    for (let dx = -2; dx <= 2; dx += .5) { link(g, white, [x + dx, 26.6, 3.5], [x + dx, 27.6, 3.5], .07, .1); }
    const cap = [new THREE.Vector2(4.05, 0), new THREE.Vector2(3.6, 1.15), new THREE.Vector2(2.5, 3.4), new THREE.Vector2(1.25, 4.9), new THREE.Vector2(.32, 5.55), new THREE.Vector2(0, 5.7)];
    const top = add(g, new THREE.LatheGeometry(cap, 8), roof, [x, 33.95, -.5]); top.rotation.y = Math.PI / 8;
    link(g, shade, [x, 39.4, -.5], [x, 42.3, -.5], .065); link(g, shade, [x - .66, 41.4, -.5], [x + .66, 41.4, -.5], .055);
  }
  // Main dome, raised lantern and circular ribs, behind the front gable.
  add(g, new THREE.CylinderGeometry(9.25, 9.65, 3.1, 40), yellow, [0, 20.6, -18.5]);
  add(g, new THREE.SphereGeometry(9.5, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), roof, [0, 22, -18.5]);
  for (const y of [22.3, 24.1, 26.2, 28.1]) { const rr = Math.sqrt(9.5 ** 2 - (y - 22) ** 2); const rim = add(g, new THREE.TorusGeometry(rr, .09, 5, 40), white, [0, y, -18.5]); rim.rotation.x = Math.PI / 2; }
  add(g, new THREE.CylinderGeometry(2.2, 2.5, 4.3, 12), yellow, [0, 32.3, -18.5]);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const w = arch(g, shade, .65, 2.45, [0, 30.7, 0]); w.position.set(Math.sin(a) * 2.24, 30.7, -18.5 + Math.cos(a) * 2.24); w.rotation.y = a; }
  add(g, new THREE.ConeGeometry(2.75, 3.2, 16), roof, [0, 36, -18.5]); link(g, white, [0, 37.6, -18.5], [0, 39.5, -18.5], .07);
  // Broad entrance stairs and low iron enclosure.
  for (let i = 0; i < 5; i++) block(g, white, [34, .25, 1.1], [0, .2 + i * .25, 8.5 - i * 1.05]);
  for (let x = -17; x <= 17; x += .66) link(g, shade, [x, 1, 7.2], [x, 3, 7.2], .036);
  link(g, shade, [-17, 2.45, 7.2], [17, 2.45, 7.2], .05);
}

function lavalleja(parent: THREE.Group) {
  const g = new THREE.Group(); g.name = 'Juan Antonio Lavalleja · bronce verde sobre granito rosado'; g.position.z = 21; parent.add(g);
  const stone = material('#c08f79', { map: granite() }), bronze = material('#587064', { metalness: .6, roughness: .56 }), dark = material('#344f46', { metalness: .6 }), plaque = material('#516356', { metalness: .6 });
  stone.name = 'plaza-lavalleja-granite';
  bronze.name = 'plaza-lavalleja-bronze';
  const base = new THREE.Group(); base.name = 'Base de Lavalleja — eje longitudinal corregido';
  base.rotation.y = Math.PI / 2; g.add(base);
  // Four broad steps, engraved plinth, shaft, relief panel and projecting dentil cornice.
  for (let i = 0; i < 4; i++) block(base, stone, [12.7 - i * 1.45, .44, 10.1 - i * 1.1], [0, .48 + i * .44, 0]);
  block(base, stone, [7.9, 1.1, 5.5], [0, 2.45, 0]); block(base, stone, [6.4, 4.7, 4.1], [0, 5.35, 0]);
  for (const y of [3.15, 3.45, 7.9, 8.25]) block(base, stone, [y > 7 ? 7.3 : 6.8, .22, y > 7 ? 4.8 : 4.5], [0, y, 0]);
  block(base, stone, [8.3, .36, 5.5], [0, 8.65, 0]); block(base, bronze, [6.5, .2, 3.6], [0, 8.98, 0]);
  for (let x = -3.4; x <= 3.4; x += .75) for (const z of [-2.35, 2.35]) block(base, stone, [.32, .34, .37], [x, 8.3, z]);
  for (const z of [-2.08, 2.08]) { block(base, plaque, [4.6, 1.58, .08], [0, 5.7, z]); block(base, plaque, [2.2, .55, .08], [0, 3.95, z]); }
  for (let x = -3.3; x <= 3.3; x += .82) { for (const z of [-2.81, 2.81]) add(base, new THREE.TorusGeometry(.28, .025, 5, 16), bronze, [x, 2.55, z]); }
  // Very low-relief figures give the panel a sculptural surface, without invented wording.
  for (const side of [-1, 1]) for (const x of [-1.25, -.7, .8, 1.4]) { ellipsoid(base, bronze, [x, 5.8, side * 2.15], [.14, .38, .06]); ellipsoid(base, bronze, [x, 6.27, side * 2.15], [.12, .12, .06]); }
  const h = new THREE.Group(); h.name = 'Lavalleja a caballo — orientación original'; h.position.set(0, 9.25, 0); h.rotation.y = -Math.PI / 2; g.add(h);
  // Ferrari's horse in forward motion, not Artigas's still, cloaked equestrian silhouette.
  ellipsoid(h, bronze, [0, 2.8, 0], [2.55, 1.03, .82]); ellipsoid(h, bronze, [-1.5, 3.15, 0], [1, 1.18, .8]); ellipsoid(h, bronze, [1.6, 2.8, 0], [1.04, 1.04, .86]);
  const neck = ellipsoid(h, bronze, [-2.1, 4, 0], [.7, 1.35, .6]); neck.rotation.z = -.43;
  const face = ellipsoid(h, bronze, [-2.82, 4.6, 0], [.48, .92, .43]); face.rotation.z = -.53;
  ellipsoid(h, bronze, [-3.18, 4.04, 0], [.33, .4, .35]);
  for (const z of [-.27, .27]) { const ear = add(h, new THREE.ConeGeometry(.17, .62, 8), bronze, [-2.62, 5.45, z]); ear.rotation.z = -.23; ellipsoid(h, dark, [-2.98, 4.83, z * 1.52], [.085, .075, .025]); }
  const legs: P[][] = [ [[-1.65, 2.4, -.56], [-2.1, 1.25, -.68], [-3, .1, -.78]], [[-1.45, 2.25, .57], [-1.15, .95, .65], [-1.45, .06, .76]], [[1.7, 2.3, -.57], [2.55, 1.25, -.62], [1.5, .08, -.65]], [[1.75, 2.15, .57], [1.65, 1.1, .63], [.9, .05, .75]] ];
  legs.forEach(points => { link(h, bronze, points[0], points[1], .24, .31); ellipsoid(h, bronze, points[1], [.25, .25, .25]); link(h, bronze, points[1], points[2], .13, .17); ellipsoid(h, dark, [points[2][0] - .13, .07, points[2][2]], [.27, .16, .2]); });
  curve(h, bronze, [[2.05, 3.25, 0], [3.05, 3.6, .1], [4.2, 3.3, .2], [4.85, 3, .1]], .22);
  for (let i = 0; i < 6; i++) curve(h, dark, [[2.4, 3.48, i * .07], [3.7, 3.55 - i * .05, .12], [4.8 - i * .08, 3.03 - i * .06, .1]], .035);
  curve(h, dark, [[-1.6, 3.5, -.03], [-2, 4.35, -.03], [-2.5, 5.13, -.03]], .16);
  ellipsoid(h, dark, [.15, 3.85, 0], [1.2, .17, .93]);
  // Rider with hat, angled torso, facial profile, arms and separate booted legs.
  const rider = ellipsoid(h, bronze, [.15, 4.9, 0], [.58, .93, .43]); rider.rotation.z = -.15;
  ellipsoid(h, bronze, [.02, 6.12, 0], [.32, .43, .3]); ellipsoid(h, bronze, [-.29, 6.13, 0], [.12, .12, .16]);
  const brim = add(h, new THREE.CylinderGeometry(.55, .55, .075, 22), dark, [.05, 6.45, 0]); brim.rotation.z = -.16;
  add(h, new THREE.CylinderGeometry(.3, .34, .4, 16), bronze, [.09, 6.65, 0]);
  for (const side of [-1, 1]) { link(h, bronze, [.1, 4.45, side * .25], [-.25, 3.65, side * .95], .24); link(h, bronze, [-.25, 3.65, side * .95], [.08, 2.8, side * 1.03], .19); ellipsoid(h, dark, [-.12, 2.62, side * 1.05], [.4, .2, .22]);
    link(h, bronze, [-.16, 5.45, side * .38], [-.9, 5.1, side * .63], .19); link(h, bronze, [-.9, 5.1, side * .63], [-1.24, 5.32, side * .35], .15); }
  for (const side of [-1, 1]) curve(h, dark, [[-1.24, 5.28, side * .3], [-1.9, 4.4, side * .58], [-3.09, 4.17, side * .36]], .034);
  curve(h, bronze, [[.5, 5.65, -.3], [1.2, 5.25, -.5], [1.95, 4.65, -.6]], .12);
}

function palmFrond() {
  const pos: number[] = [];
  const point = (u: number, side = 0): P => [u * 6.7, Math.sin(u * Math.PI) * 1.5 - u * u * 2.9, side];
  for (let i = 0; i < 20; i++) {
    const u = i / 20, u2 = (i + 1) / 20, a = point(u), b = point(u2), width = Math.sin((u * .85 + .09) * Math.PI) * 1.1 * (1 - u * .56);
    for (const side of [-1, 1]) { const tip: P = [a[0] + .65 * (1 - u), a[1] - .17, side * width]; pos.push(...a, ...b, ...tip); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals(); return geo;
}
function landscape(g: THREE.Group) {
  const turf = material('#788b55'), foliage = material('#46744e', { side: THREE.DoubleSide }), bark = material('#92816c'), darkBark = material('#675e4f'), hedge = material('#4f713c');
  // Four lawns and diagonal paths preserve the square's cross-axis, leaving an open pool corridor.
  for (const x of [-31, 31]) for (const z of [-28, 26]) block(g, turf, [30, .22, 32], [x, .18, z]);
  const palmPositions: P[] = [];
  for (const x of [-11.8, 11.8]) for (const z of [-34, -18, -2, 14, 32]) palmPositions.push([x, 14.5 + Math.sin(z) * 2.5, z]);
  for (const x of [-42, 42]) for (const z of [-41, 40]) palmPositions.push([x, 17.2, z]);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.26, .47, 1, 10), bark, palmPositions.length), fronds = new THREE.InstancedMesh(palmFrond(), foliage, palmPositions.length * 11), rings = new THREE.InstancedMesh(new THREE.TorusGeometry(.35, .035, 4, 10), darkBark, palmPositions.length * 18), dummy = new THREE.Object3D();
  palmPositions.forEach(([x, height, z], index) => {
    dummy.position.set(x, height / 2, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, height, 1); dummy.updateMatrix(); trunks.setMatrixAt(index, dummy.matrix);
    for (let j = 0; j < 11; j++) { dummy.position.set(x, height - .2, z); dummy.rotation.set(0, j / 11 * Math.PI * 2 + index * .3, (j % 3 - 1) * .15); dummy.scale.setScalar(.82 + j % 3 * .07); dummy.updateMatrix(); fronds.setMatrixAt(index * 11 + j, dummy.matrix); }
    for (let j = 0; j < 18; j++) { dummy.position.set(x, 1 + j / 18 * (height - 2), z); dummy.rotation.set(Math.PI / 2, 0, 0); dummy.scale.setScalar(1.22 - j / 18 * .4); dummy.updateMatrix(); rings.setMatrixAt(index * 18 + j, dummy.matrix); }
  });
  trunks.castShadow = trunks.receiveShadow = fronds.castShadow = fronds.receiveShadow = true; g.add(trunks, fronds, rings);
  const bushes = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 7), hedge, 54); let bi = 0;
  for (const x of [-9.1, 9.1]) for (let z = -35; z <= 35; z += 2.7) { dummy.position.set(x, .85, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1.15, .85, 1.05); dummy.updateMatrix(); bushes.setMatrixAt(bi++, dummy.matrix); }
  bushes.count = bi; bushes.castShadow = bushes.receiveShadow = true; g.add(bushes);
  const trees: P[] = [];
  // Keep both ends of the public cross-axis open: no canopy across the fountain/cathedral view.
  for (let x = -47; x <= 47; x += 13.4) if (Math.abs(x) >= 18) for (const z of [-47, 47]) trees.push([x, 0, z]);
  for (const x of [-48, 48]) for (const z of [-27, -8, 12, 30]) trees.push([x, 0, z]);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), foliage, trees.length * 3), stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .4, 8, 7), darkBark, trees.length);
  trees.forEach(([x, , z], i) => { dummy.position.set(x, 4, z); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); stems.setMatrixAt(i, dummy.matrix);
    for (let j = 0; j < 3; j++) { dummy.position.set(x + Math.cos(j * 2.1) * 1.7, 8.2 + j * .5, z + Math.sin(j * 2.1) * 1.7); dummy.rotation.set(j, i, 0); dummy.scale.set(4.1, 3.2, 4.2); dummy.updateMatrix(); crowns.setMatrixAt(i * 3 + j, dummy.matrix); } });
  stems.castShadow = crowns.castShadow = crowns.receiveShadow = true; g.add(stems, crowns);
}

function furniture(g: THREE.Group): LandmarkNightLighting {
  const metal = material('#455254', { metalness: .36 }), wood = material('#8a7150'), concrete = material('#d0c8b4'), globe = material('#f3e5c3', { emissive: '#ffdd99', emissiveIntensity: 0 });
  globe.name = 'plaza-lamp-glass';
  const localLights = new THREE.Group(); localLights.name = 'plaza-street-lights'; localLights.visible = false; g.add(localLights);
  const sources: THREE.PointLight[] = [];
  function lamp(position: P, tall: boolean) {
    const light = new THREE.PointLight(tall ? '#ffe4bc' : '#ffdda1', tall ? 1900 : 280, tall ? 50 : 27, 2);
    light.name = tall ? 'plaza-mast-light' : 'plaza-twin-globe-light';
    light.position.set(...position); light.castShadow = false; light.visible = false;
    localLights.add(light); sources.push(light);
  }
  for (const side of [-1, 1]) for (const z of [-35, -16, 4, 37]) {
    const bench = new THREE.Group(); bench.position.set(side * 18, 0, z); bench.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(bench);
    for (const x of [-1.6, 1.6]) block(bench, concrete, [.4, .65, 1.25], [x, .48, 0]);
    for (let i = 0; i < 5; i++) block(bench, wood, [4.4, .13, .16], [0, .92, -.43 + i * .21]);
    for (let i = 0; i < 3; i++) block(bench, wood, [4.4, .18, .13], [0, 1.2 + i * .24, -.6]);
    for (const x of [-1.6, 1.6]) link(bench, metal, [x, .8, -.6], [x, 1.95, -.6], .06);
    const x = side * 20.6; link(g, metal, [x, .25, z + 4], [x, 5.8, z + 4], .08); link(g, metal, [x - .65, 5.15, z + 4], [x + .65, 5.15, z + 4], .06);
    for (const dx of [-.65, .65]) { link(g, metal, [x + dx, 5.15, z + 4], [x + dx, 5.6, z + 4], .045); ellipsoid(g, globe, [x + dx, 5.84, z + 4], [.3, .3, .3]); }
    // One source between the two globes keeps all eight posts lit with eight lights.
    lamp([x, 5.84, z + 4], false);
  }
  for (const x of [-37, 37]) for (const z of [-33, 33]) {
    link(g, metal, [x, .2, z], [x, 15.2, z], .085);
    const light = block(g, globe, [1.7, .15, .56], [x + .5, 15.2, z]); light.rotation.z = -.15;
    lamp([x + .5, 15.05, z], true);
  }
  return {
    floodlights: [
      { foot: new THREE.Vector3(12.5, .25, 36), target: new THREE.Vector3(0, 12.7, 21), angle: .52, penumbra: .38, strength: 14, scale: 1.1, color: '#fff1d9' },
      { foot: new THREE.Vector3(8.5, .25, -90), target: new THREE.Vector3(0, 19, -120), angle: .74, strength: 6, scale: 1.1, color: '#ffe6c2' },
    ],
    setNight(night, active) {
      globe.emissiveIntensity = night ? 2.1 : 0;
      localLights.visible = night && active;
      for (const light of sources) light.visible = night && active;
    },
  };
}

function town(g: THREE.Group) {
  const wall = [material('#c3b38c'), material('#abc5c5'), material('#dad4c5'), material('#c7b1a1')], trim = material('#eee5cc'), glass = material('#334b50', { roughness: .35, metalness: .15 });
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const b = new THREE.Group(); b.position.set(side * 25, 0, -66 - i * 13); b.rotation.y = side * Math.PI / 2; g.add(b);
    const height = 6.7 + (i % 3) * 1.15, color = wall[(i + (side > 0 ? 1 : 0)) % wall.length];
    block(b, color, [13, height, 15], [0, height / 2, -7.5]); block(b, trim, [13.5, .3, 15.6], [0, height + .17, -7.5]); block(b, trim, [13.2, .2, .35], [0, height - .8, .18]);
    for (const x of [-4, 0, 4]) { arch(b, glass, 2.2, 4.6, [x, .5, .08]); archTrim(b, trim, 2.3, 4.7, [x, .5, .25], .1); }
    for (const x of [-6.1, 6.1]) block(b, trim, [.36, height - .4, .35], [x, height / 2, .17]);
  }
  // Low contextual blocks flank the square; they do not close the cathedral's callejón.
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const b = new THREE.Group(); b.position.set(side * 67, 0, -38 + i * 25); b.rotation.y = side * Math.PI / 2; g.add(b);
    const height = 6 + i % 2 * 3; block(b, wall[i], [24, height, 13], [0, height / 2, -6.5]); block(b, trim, [24.5, .4, 13.5], [0, height + .2, -6.5]);
    for (let x = -8; x <= 8; x += 4) { block(b, glass, [2.5, 3.5, .1], [x, 2.5, .08]); block(b, trim, [2.9, .18, .3], [x, 4.3, .15]); }
  }
}

// Flatten static details by material; palms/trees and moving water remain instanced.
function batchStatic(group: THREE.Group) {
  group.updateMatrixWorld(true); const sets = new Map<THREE.Material, THREE.Mesh[]>();
  group.traverse(object => { if (object instanceof THREE.Mesh && !(object instanceof THREE.InstancedMesh) && !object.userData.moving && !Array.isArray(object.material)) { const list = sets.get(object.material) ?? []; list.push(object); sets.set(object.material, list); } });
  const disposed = new Set<THREE.BufferGeometry>();
  sets.forEach((meshes, mat) => {
    const parts = meshes.map(mesh => { let geo = mesh.geometry.clone(); if (geo.index) geo = geo.toNonIndexed(); geo.applyMatrix4(mesh.matrixWorld); if (!geo.getAttribute('uv')) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2)); return geo; });
    const merged = mergeGeometries(parts, false); parts.forEach(p => p.dispose()); if (!merged) return;
    const mesh = new THREE.Mesh(merged, mat); mesh.name = mat.name; mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
    meshes.forEach(old => { old.removeFromParent(); disposed.add(old.geometry); });
  });
  disposed.forEach(geo => geo.dispose());
}

export function createPlazaLibertad(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Plaza Libertad · Minas y la concatedral al fondo';
  const paving = material('#bfb6a3'), border = material('#d6d0bd'), road = material('#777d77'), poolBlue = material('#326d84'), nozzleMat = material('#86948c', { metalness: .55 });
  block(group, material('#686e58'), [145, 1.4, 218], [0, -1, -41]);
  block(group, road, [139, .1, 121], [0, -.1, 0]); block(group, paving, [110, .4, 110], [0, .01, 0]);
  block(group, paving, [24, .17, 70], [0, .01, -87]);
  for (const x of [-55, 55]) block(group, border, [.45, .28, 110], [x, .27, 0]); for (const z of [-55, 55]) block(group, border, [110, .28, .45], [0, .27, z]);
  // Fine tile grid and diagonals of the photographed stamped-concrete walkways.
  const grid: number[] = []; for (let i = -54; i <= 54; i += 3) { grid.push(i, .23, -54, i, .23, 54, -54, .23, i, 54, .23, i); }
  const gridGeo = new THREE.BufferGeometry(); gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(grid, 3)); group.add(new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: '#7e8075', transparent: true, opacity: .17 })));
  landscape(group); const streetLighting = furniture(group); town(group); cathedral(group); lavalleja(group);
  // Elongated pool, with the equestrian plinth at its southern end.
  block(group, poolBlue, [15.6, .36, 72], [0, .25, -3]);
  for (const x of [-7.95, 7.95]) block(group, border, [.4, .35, 73], [x, .45, -3]); for (const z of [-39.5, 33.5]) block(group, border, [16.3, .35, .4], [0, .45, z]);
  const waterMaterial = new THREE.MeshPhysicalMaterial({ color: '#659baf', roughness: .19, metalness: .16, transparent: true, opacity: .81, clearcoat: .85, clearcoatRoughness: .16 });
  waterMaterial.name = 'plaza-fountain-water';
  const water = add(group, new THREE.PlaneGeometry(15.1, 71.5), waterMaterial, [0, .48, -3]); water.rotation.x = -Math.PI / 2; water.castShadow = false;
  const jetMaterial = new THREE.MeshStandardMaterial({ color: '#bde6ec', emissive: '#6ca6b6', emissiveIntensity: .22, transparent: true, opacity: .7, roughness: .18 });
  jetMaterial.name = 'plaza-fountain-jets';
  const vertical = new THREE.InstancedMesh(new THREE.CylinderGeometry(.046, .067, 1, 5), jetMaterial, 13); vertical.userData.moving = true; group.add(vertical);
  vertical.name = 'plaza-fountain-jets';
  const arcPoints: THREE.Vector3[] = []; for (let i = 0; i <= 26; i++) { const u = i / 26; arcPoints.push(new THREE.Vector3(.35 + 5.5 * u, 4 * 2.5 * u * (1 - u), 0)); }
  const archJets = new THREE.InstancedMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPoints), 26, .036, 5, false), jetMaterial, 22); archJets.userData.moving = true; group.add(archJets);
  archJets.name = 'plaza-fountain-arcs';
  const spray = new THREE.InstancedMesh(new THREE.SphereGeometry(.045, 5, 4), jetMaterial, 130); spray.userData.moving = true; group.add(spray);
  spray.name = 'plaza-fountain-spray';
  const led = material('#96d9cb', { emissive: '#5aa7b2', emissiveIntensity: .7 });
  led.name = 'plaza-fountain-leds';
  for (let i = 0; i < 13; i++) { const z = -34 + i * 3.7; add(group, new THREE.CylinderGeometry(.14, .17, .15, 8), nozzleMat, [0, .51, z]); const light = add(group, new THREE.CircleGeometry(.22, 12), led, [.34, .51, z]); light.rotation.x = -Math.PI / 2; }
  const rippleMaterial = new THREE.MeshBasicMaterial({ color: '#b8d6cb', transparent: true, opacity: .21, depthWrite: false }); const ripples: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) { const ring = add(group, new THREE.TorusGeometry(1, .018, 4, 32), rippleMaterial, [0, .505, -32 + i * 6.5]); ring.rotation.x = Math.PI / 2; ring.castShadow = false; ring.userData.moving = true; ripples.push(ring); }
  const fountainLighting = createPlazaFountainLights(group, jetMaterial, led, rippleMaterial);
  const nightLighting: LandmarkNightLighting = {
    floodlights: streetLighting.floodlights,
    setNight(night, active) { streetLighting.setNight(night, active); fountainLighting.setNight(night, active); },
  };
  batchStatic(group);
  const dummy = new THREE.Object3D();
  const update = (time: number) => {
    time = Number.isFinite(time) ? time : 0;
    fountainLighting.update(time);
    for (let i = 0; i < 13; i++) {
      const height = 1.8 + 3.4 * (.5 + .5 * Math.sin(time * .85 + i * .36)); dummy.position.set(0, .55 + height / 2, -34 + i * 3.7); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, height, 1); dummy.updateMatrix(); vertical.setMatrixAt(i, dummy.matrix);
      for (let j = 0; j < 10; j++) { const u = ((time * .62 + j / 10 + i * .07) % 1); dummy.position.set(Math.sin(i * 5 + j) * u * .25, .55 + height * 4 * u * (1 - u), -34 + i * 3.7 + Math.cos(j * 3) * u * .2); dummy.scale.setScalar(.65 + u * .5); dummy.updateMatrix(); spray.setMatrixAt(i * 10 + j, dummy.matrix); }
    }
    for (let i = 0; i < 22; i++) { dummy.position.set(0, .56, -33 + Math.floor(i / 2) * 4.3); dummy.rotation.set(0, i % 2 ? Math.PI : 0, 0); dummy.scale.set(1, .48 + .6 * (.5 + .5 * Math.sin(time * .7 + i * .2)), 1); dummy.updateMatrix(); archJets.setMatrixAt(i, dummy.matrix); }
    vertical.instanceMatrix.needsUpdate = spray.instanceMatrix.needsUpdate = archJets.instanceMatrix.needsUpdate = true;
    ripples.forEach((ring, i) => { const t = (time * .32 + i * .17) % 1; ring.scale.setScalar(.4 + t * 3); });
  };
  update(0); group.userData.reference = 'docs/research-plaza-libertad.md'; group.userData.footprint = { plaza: [110, 110], cathedralZ: -123 };
  return { group, target: new THREE.Vector3(0, 13, -24), bounds: { radius: 155, height: 44 }, groundY: 0, cameraDirection: new THREE.Vector3(.28, .29, 1), update, nightLighting };
}
