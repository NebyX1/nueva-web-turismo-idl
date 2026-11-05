import * as THREE from 'three';
import type { LandmarkModel } from '../types';

// All forms were reconstructed from the photographed references in the research note.
// Dimensions are proportional scene units, not a measured survey.
const UP = new THREE.Vector3(0, 1, 0);
function rng(seed: number) { return () => { seed = Math.imul(seed ^ seed >>> 15, 1 | seed); seed ^= seed + Math.imul(seed ^ seed >>> 7, 61 | seed); return ((seed ^ seed >>> 14) >>> 0) / 4294967296; }; }
function mat(color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) { return new THREE.MeshStandardMaterial({ color, roughness: .88, ...extra }); }
function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], scale?: [number, number, number]) {
  const item = new THREE.Mesh(geometry, material); item.position.set(...position); if (scale) item.scale.set(...scale); item.castShadow = true; item.receiveShadow = true; group.add(item); return item;
}
function box(group: THREE.Group, material: THREE.Material, size: [number, number, number], position: [number, number, number]) { return mesh(group, new THREE.BoxGeometry(...size), material, position); }
function beam(group: THREE.Group, material: THREE.Material, start: THREE.Vector3, end: THREE.Vector3, radius = .18) {
  const vector = end.clone().sub(start); const item = mesh(group, new THREE.CylinderGeometry(radius, radius * 1.05, vector.length(), 7), material, [0, 0, 0]); item.position.copy(start).add(end).multiplyScalar(.5); item.quaternion.setFromUnitVectors(UP, vector.normalize()); return item;
}
function ground(group: THREE.Group, radius: number, height: number, material: THREE.Material, offset: [number, number, number] = [0, 0, 0]) {
  return mesh(group, new THREE.SphereGeometry(1, 40, 16), material, [offset[0], offset[1] - height * .3, offset[2]], [radius, height, radius * .82]);
}
function rockInstances(group: THREE.Group, count: number, extent: number, seed: number, y: (x: number, z: number) => number) {
  const random = rng(seed), geometry = new THREE.IcosahedronGeometry(1, 1), material = mat('#7c7b6c', { roughness: 1 });
  const rocks = new THREE.InstancedMesh(geometry, material, count), dummy = new THREE.Object3D(), color = new THREE.Color();
  for (let i = 0; i < count; i++) { const angle = random() * Math.PI * 2, radius = Math.sqrt(random()) * extent; const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius; const size = 1 + random() * 3.1; dummy.position.set(x, y(x, z), z); dummy.scale.set(size * (1 + random()), size * .65, size); dummy.rotation.set(random(), random() * Math.PI * 2, random() * .5); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix); color.setHSL(.1 + random() * .03, .08 + random() * .08, .33 + random() * .22); rocks.setColorAt(i, color); }
  rocks.castShadow = true; rocks.receiveShadow = true; group.add(rocks);
}
function stoneTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512; const ctx = canvas.getContext('2d')!; const random = rng(2301); ctx.fillStyle = '#615b4b'; ctx.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) for (let column = -1; column < 9; column++) { const x = column * 67 + (row % 2) * 32, y = row * 65; const shade = 85 + random() * 60; ctx.fillStyle = `rgb(${shade + 13},${shade + 7},${shade - 2})`; ctx.beginPath(); ctx.moveTo(x + 4, y + 8); ctx.lineTo(x + 55 + random() * 9, y + 2); ctx.lineTo(x + 64, y + 49 + random() * 11); ctx.lineTo(x + 7, y + 60); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#c3b59d55'; ctx.lineWidth = 2; ctx.stroke(); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(3, 2); return texture;
}
function thatchTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256; const ctx = canvas.getContext('2d')!, random = rng(200); ctx.fillStyle = '#6e5b37'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) { const x = random() * 256, y = random() * 256; ctx.strokeStyle = random() > .5 ? '#ae936153' : '#3f372c70'; ctx.lineWidth = .5 + random(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 4 - 2, y + 8 + random() * 15); ctx.stroke(); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(3, 4); return texture;
}
function tibetanRoof(group: THREE.Group, width: number, depth: number, y: number, height: number, gold: THREE.Material, trim: THREE.Material) {
  const ring = (w: number, d: number, h: number, curl: number) => [[-w / 2, h + curl, -d / 2], [0, h, -d / 2], [w / 2, h + curl, -d / 2], [w / 2, h, 0], [w / 2, h + curl, d / 2], [0, h, d / 2], [-w / 2, h + curl, d / 2], [-w / 2, h, 0]];
  const rings = [ring(width, depth, y, 1.15), ring(width * .86, depth * .8, y + .4, .35), ring(width * .63, depth * .12, y + height, 0)];
  const positions: number[] = [], indices: number[] = []; rings.forEach(points => points.forEach(point => positions.push(...point)));
  for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { const a = r * 8 + i, b = r * 8 + (i + 1) % 8, c = a + 8, d = b + 8; indices.push(a, c, b, b, c, d); }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); const roof = mesh(group, geometry, gold, [0, 0, 0]); roof.material.side = THREE.DoubleSide;
  box(group, trim, [width * .96, .5, depth * .96], [0, y - .3, 0]);
  const ridges: number[] = [];
  for (let i = 0; i < 28; i++) { const x = -width * .47 + width * .94 * i / 27; for (const side of [-1, 1]) { const x2 = x * .65; ridges.push(x, y + .15, side * depth * .48, x2, y + height + .08, side * depth * .06); } }
  const lineGeometry = new THREE.BufferGeometry(); lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ridges, 3)); group.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: '#947246', transparent: true, opacity: .6 })));
  return y + height;
}
interface WindowPosition { x: number; y: number; z: number; width: number; height: number; side?: boolean }
function templeWindows(group: THREE.Group, positions: WindowPosition[]) {
  const materials = [mat('#dacba6'), mat('#192e31', { metalness: .12, roughness: .3 }), mat('#342724')];
  const variants = [{ w: 1, h: 1, z: 0 }, { w: .78, h: .82, z: .13 }, { w: .055, h: .84, z: .21 }];
  variants.forEach((variant, index) => { const items = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, .13), materials[index], positions.length), dummy = new THREE.Object3D(); positions.forEach((p, i) => { dummy.position.set(p.x + (p.side ? variant.z : 0), p.y, p.z + (p.side ? 0 : variant.z)); dummy.rotation.set(0, p.side ? Math.PI / 2 : 0, 0); dummy.scale.set(p.width * variant.w, p.height * variant.h, 1); dummy.updateMatrix(); items.setMatrixAt(i, dummy.matrix); }); items.castShadow = true; items.receiveShadow = true; group.add(items); });
}
function decoratedBand(group: THREE.Group, width: number, depth: number, y: number, black: THREE.Material, white: THREE.Material, red: THREE.Material) {
  box(group, black, [width + .24, .6, depth + .24], [0, y, 0]);
  const positions: [number, number, number, number][] = [];
  for (let x = -width / 2 + .6; x < width / 2; x += 1.04) for (const side of [-1, 1]) positions.push([x, y, side * (depth / 2 + .17), 0]);
  for (let z = -depth / 2 + .6; z < depth / 2; z += 1.04) for (const side of [-1, 1]) positions.push([side * (width / 2 + .17), y, z, Math.PI / 2]);
  const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(.2, 8), white, positions.length), dummy = new THREE.Object3D(); positions.forEach(([x, yy, z, angle], index) => { dummy.position.set(x, yy, z); dummy.rotation.set(0, angle || (z < 0 ? Math.PI : 0), 0); if (x < 0 && angle) dummy.rotation.y *= -1; dummy.scale.set(1, 1, 1); dummy.updateMatrix(); dots.setMatrixAt(index, dummy.matrix); }); group.add(dots);
  const corbels = new THREE.InstancedMesh(new THREE.BoxGeometry(.36, .55, .62), white, positions.length); positions.forEach(([x, yy, z, angle], index) => { dummy.position.set(x, yy + 1.12, z); dummy.rotation.set(0, angle, 0); dummy.updateMatrix(); corbels.setMatrixAt(index, dummy.matrix); }); corbels.castShadow = true; group.add(corbels);
  box(group, red, [width + .12, .26, depth + .12], [0, y + .56, 0]);
}

export function createMonastery(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Sengue Dzong · terrazas de piedra y cubiertas tibetanas';
  const stone = mat('#b7a68c', { map: stoneTexture() }), red = mat('#7a3028'), gold = mat('#c8a65b', { metalness: .3, roughness: .52 }), trim = mat('#3d5957'), white = mat('#e9dfc5'), black = mat('#253339'), turf = mat('#70824b');
  ground(group, 52, 9, turf, [0, -5, 0]); box(group, stone, [50, 7, 38], [0, 3.5, 0]); box(group, stone, [45, .65, 43], [0, 7.3, 1]);
  box(group, stone, [34, 9, 27], [0, 12, -2]); box(group, red, [34, 3.5, 27], [0, 18.2, -2]);
  const lowerRoof = new THREE.Group(); lowerRoof.position.z = -2; group.add(lowerRoof); tibetanRoof(lowerRoof, 43, 36, 20.3, 5.7, gold, trim);
  box(group, stone, [22, 5.7, 17], [0, 25.2, -3]); box(group, red, [22, 1.8, 17], [0, 28.5, -3]);
  const upperRoof = new THREE.Group(); upperRoof.position.z = -3; group.add(upperRoof); tibetanRoof(upperRoof, 29, 24, 29.7, 4.6, gold, trim);
  const ornament = new THREE.Group(); ornament.position.set(0, 34.3, -3); group.add(ornament);
  for (const x of [-7, 0, 7]) { beam(ornament, gold, new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, 3, 0), .1); for (let j = 0; j < 4; j++) mesh(ornament, new THREE.SphereGeometry(.34 - j * .05, 8, 5), gold, [x, .35 + j * .55, 0], [1, .8, 1]); }
  decoratedBand(group, 50, 38, 6.8, black, white, red); const levelBand = new THREE.Group(); levelBand.position.z = -2; group.add(levelBand); decoratedBand(levelBand, 34, 27, 16.5, black, white, red); const upperBand = new THREE.Group(); upperBand.position.z = -3; group.add(upperBand); decoratedBand(upperBand, 22, 17, 27.4, black, white, red);
  const windows: WindowPosition[] = [];
  for (const x of [-19, -13, -7, 7, 13, 19]) windows.push({ x, y: 4.3, z: 19.08, width: 2.8, height: 3.5 });
  for (const x of [-12, -6, 6, 12]) windows.push({ x, y: 11.9, z: 11.6, width: 3.4, height: 4.7 });
  for (const x of [-7, 0, 7]) windows.push({ x, y: 25.4, z: 5.65, width: 2.7, height: 3.8 });
  for (const z of [-11, -4, 3, 10]) windows.push({ x: 25.1, y: 4.3, z, width: 2.8, height: 3.6, side: true });
  for (const z of [-10, -3, 4]) windows.push({ x: 17.1, y: 12, z, width: 3, height: 4.4, side: true });
  templeWindows(group, windows);
  // Front ceremonial portal, scalloped turquoise/red border, wheel and broad stairs.
  const portal = new THREE.Group(); portal.position.set(0, 7.6, 14.8); group.add(portal);
  box(portal, mat('#254452'), [6, 7.8, .3], [0, 4.3, .1]); box(portal, red, [.35, 8.1, .45], [0, 4.3, .3]);
  for (const x of [-4.2, 4.2]) { mesh(portal, new THREE.CylinderGeometry(.52, .62, 7.7, 12), red, [x, 4, 2]); box(portal, gold, [1.5, .42, 1.5], [x, 7.35, 2]); for (let j = 0; j < 3; j++) mesh(portal, new THREE.TorusGeometry(.59, .11, 5, 16), trim, [x, 6.4 + j * .32, 2]).rotation.x = Math.PI / 2; }
  const archPoints = [new THREE.Vector3(-4.3, 7.6, 2), new THREE.Vector3(-3.5, 7.9, 2), new THREE.Vector3(-2.6, 8.5, 2), new THREE.Vector3(-1.6, 8.45, 2), new THREE.Vector3(-.9, 9.3, 2), new THREE.Vector3(.9, 9.3, 2), new THREE.Vector3(1.6, 8.45, 2), new THREE.Vector3(2.6, 8.5, 2), new THREE.Vector3(3.5, 7.9, 2), new THREE.Vector3(4.3, 7.6, 2)];
  mesh(portal, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPoints), 40, .26, 6, false), mat('#4da09b'), [0, 0, 0]);
  box(portal, mat('#244d71'), [10, .85, 1.1], [0, 9.9, 2]); for (let i = -4; i <= 4; i++) mesh(portal, new THREE.OctahedronGeometry(.23), gold, [i, 9.9, 2.65]);
  const frontRoof = new THREE.Group(); frontRoof.position.set(0, 0, 1); portal.add(frontRoof); tibetanRoof(frontRoof, 12, 8, 10.5, 2.2, gold, trim);
  for (const x of [-1.5, 1.5]) { const wheel = mesh(portal, new THREE.TorusGeometry(1.15, .09, 5, 24), gold, [x, 5.6, .35]); for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2; beam(portal, gold, new THREE.Vector3(x, 5.6, .36), new THREE.Vector3(x + Math.cos(a) * 1.1, 5.6 + Math.sin(a) * 1.1, .36), .045); } wheel.castShadow = false; }
  for (let i = 0; i < 16; i++) box(group, mat('#a3a298'), [11.5, .45, .9], [0, .25 + i * .45, 32 - i * .85]);
  for (const x of [-22, 22]) { box(group, red, [2.4, 2.5, 34], [x, 8.8, 3]); box(group, gold, [2.65, .27, 34.3], [x, 10.2, 3]); }
  rockInstances(group, 35, 46, 83, (x, z) => Math.max(-1, 4.5 * (1 - Math.hypot(x, z) / 48)));
  group.userData.reference = 'docs/research-architecture-water.md';
  return { group, target: new THREE.Vector3(0, 17, 0), bounds: { radius: 60, height: 39 }, cameraDirection: new THREE.Vector3(.8, .38, 1) };
}

function pitchedRoof(group: THREE.Group, width: number, depth: number, eave: number, ridge: number, material: THREE.Material) {
  const p = [-width / 2, eave, -depth / 2, -width / 2, eave, depth / 2, 0, ridge, -depth / 2, 0, ridge, depth / 2, width / 2, eave, -depth / 2, width / 2, eave, depth / 2];
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 1, .5, 0, .5, 1, 1, 0, 1, 1], 2)); geometry.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4]); geometry.computeVertexNormals(); const roof = mesh(group, geometry, material, [0, 0, 0]); roof.material.side = THREE.DoubleSide;
  const shape = new THREE.Shape(); shape.moveTo(-width / 2, 0); shape.lineTo(width / 2, 0); shape.lineTo(0, ridge - eave); shape.closePath(); const gables = new THREE.ExtrudeGeometry(shape, { depth: .4, bevelEnabled: false }); mesh(group, gables, material, [0, eave, depth / 2 - .3]); mesh(group, gables.clone(), material, [0, eave, -depth / 2 - .1]);
}
function agaves(group: THREE.Group, count: number, radius: number) {
  const shape = new THREE.BufferGeometry(); shape.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -.3, 1.2, .45, 0, 3.7, 2.1, .3, 1.2, .45], 3)); shape.setIndex([0, 1, 2, 0, 2, 3]); shape.computeVertexNormals(); const leaves = new THREE.InstancedMesh(shape, mat('#4a6442', { side: THREE.DoubleSide }), count * 8), dummy = new THREE.Object3D(), random = rng(433);
  for (let i = 0; i < count; i++) { const a = random() * Math.PI * 2, r = radius * (.3 + .7 * Math.sqrt(random())); for (let j = 0; j < 8; j++) { dummy.position.set(Math.cos(a) * r, Math.max(.4, 10 * (1 - r / radius)), Math.sin(a) * r); dummy.rotation.set((random() - .5) * .3, j / 8 * Math.PI * 2 + a, 0); dummy.scale.setScalar(.45 + random() * .5); dummy.updateMatrix(); leaves.setMatrixAt(i * 8 + j, dummy.matrix); } } leaves.castShadow = true; group.add(leaves);
}
export function createVillaSerrana(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Villa Serrana · Ventorrillo de la Buena Vista';
  const straw = mat('#a28a58', { map: thatchTexture() }), timber = mat('#4b3b2a'), white = mat('#d4d8bc'), stone = mat('#9b9c86'), brick = mat('#a9603f'), glass = mat('#708c91', { metalness: .24, roughness: .18, transparent: true, opacity: .72 }), turf = mat('#75834b');
  ground(group, 57, 15, turf); rockInstances(group, 115, 52, 97, (x, z) => Math.max(.2, 11 * (1 - Math.hypot(x, z) / 58)));
  const house = new THREE.Group(); house.position.set(0, 0, 2); group.add(house);
  box(house, timber, [24, .6, 25], [0, 13.7, 0]); box(house, mat('#383b32'), [21, 4.1, 20], [0, 16, -1]);
  pitchedRoof(house, 29, 31, 19.7, 27.8, straw);
  // The outward leaning glazed pavilion and long diagonal wooden props are its signature.
  const glazing = box(house, glass, [24, 5, .12], [0, 16.5, 12.7]); glazing.rotation.x = -.25;
  for (let x = -12; x <= 12; x += 3) { beam(house, white, new THREE.Vector3(x, 14.1, 12.1), new THREE.Vector3(x, 19.3, 13.5), .12); beam(house, timber, new THREE.Vector3(x, 8, 12.1), new THREE.Vector3(x, 19.7, 15.2), .22); }
  beam(house, white, new THREE.Vector3(-12, 16.5, 12.75), new THREE.Vector3(12, 16.5, 12.75), .1);
  for (const side of [-1, 1]) { box(house, glass, [.12, 4.8, 22], [side * 11.7, 16.5, 0]); for (let z = -10; z <= 10; z += 4) { beam(house, white, new THREE.Vector3(side * 11.8, 14, z), new THREE.Vector3(side * 11.8, 19.1, z), .12); beam(house, timber, new THREE.Vector3(side * 10, 8, z), new THREE.Vector3(side * 14.4, 19.8, z), .23); } }
  beam(house, timber, new THREE.Vector3(-14.6, 19.6, 15.4), new THREE.Vector3(14.6, 19.6, 15.4), .25); beam(house, timber, new THREE.Vector3(-14.6, 19.6, -15.4), new THREE.Vector3(14.6, 19.6, -15.4), .25);
  box(house, brick, [2.4, 19, 2.4], [-13.8, 17, -7]); box(house, brick, [3, .6, 3], [-13.8, 26.8, -7]);
  for (let j = 0; j < 9; j++) box(house, stone, [5, .5, 1.4], [-14.5, 8.6 + j * .55, 8 - j * 1.3]);
  const sign = box(house, timber, [8, .8, .35], [-19, 15, 7]); sign.rotation.z = -.09; beam(house, timber, new THREE.Vector3(-21, 8, 7), new THREE.Vector3(-17, 18, 7), .16);
  // Mesón's lower stone wing and low pitch are distinct from the high pavilion.
  const meson = new THREE.Group(); meson.position.set(-30, 5, -28); meson.rotation.y = -.45; group.add(meson); box(meson, stone, [27, 5.3, 12], [0, 2.65, 0]); pitchedRoof(meson, 30, 15, 5.5, 9.8, straw);
  for (let i = -10; i <= 10; i += 5) { box(meson, timber, [2.5, 3, .18], [i, 2.7, 6.1]); box(meson, glass, [2.15, 2.6, .2], [i, 2.7, 6.23]); }
  const cottagePositions: [number, number, number][] = [[31, 6, -25], [40, 6, 6], [-35, 6, 22]];
  cottagePositions.forEach(([x, y, z], i) => { const cottage = new THREE.Group(); cottage.position.set(x, y, z); cottage.rotation.y = i * .8; group.add(cottage); box(cottage, i % 2 ? brick : stone, [9, 4, 7], [0, 2, 0]); pitchedRoof(cottage, 10.5, 8.5, 4, 6.3, timber); box(cottage, glass, [3, 2, .15], [0, 2.1, 3.6]); });
  agaves(group, 20, 45);
  return { group, target: new THREE.Vector3(0, 14, 2), bounds: { radius: 79, height: 30 }, cameraDirection: new THREE.Vector3(.75, .27, 1) };
}

function cliff(group: THREE.Group, side: number) {
  const columns = 35, rows = 32, vertices: number[] = [], colors: number[] = [], indices: number[] = []; const color = new THREE.Color();
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= columns; i++) { const u = i / columns, v = j / rows; const z = -29 + v * 60; const channelY = 56 * Math.pow(1 - v, .9) + 1.8; const edgeX = 2.5 + v * 2.2 + Math.sin(v * 7) * 1.3; const x = side * (edgeX + u * (45 + Math.sin(v * 4) * 8)); const shoulder = Math.sin(u * Math.PI * .68) * (16 + v * 17); const cuts = Math.sin(x * .4 + z * .53) * 1.2 + Math.sin(x * .16 - z * .3) * 2.4; const y = channelY + shoulder + cuts * Math.min(1, u * 10); vertices.push(x, y, z); const lichen = Math.sin(x * .38) * Math.sin(z * .7) + Math.cos(z * .9 + x * .13); color.setHSL(lichen > .9 ? .16 : .055, lichen > .9 ? .1 : .12, lichen > .9 ? .52 : .29 + Math.sin(x + z) * .07); colors.push(color.r, color.g, color.b); }
  for (let j = 0; j < rows; j++) for (let i = 0; i < columns; i++) { const a = j * (columns + 1) + i, b = a + 1, c = a + columns + 1, d = c + 1; if (side > 0) indices.push(a, c, b, b, c, d); else indices.push(a, b, c, b, d, c); }
  // Seal the rock mass down to the local ground so low camera angles never see a hollow sheet.
  const perimeter: number[] = [];
  for (let i = 0; i <= columns; i++) perimeter.push(i);
  for (let j = 1; j <= rows; j++) perimeter.push(j * (columns + 1) + columns);
  for (let i = columns - 1; i >= 0; i--) perimeter.push(rows * (columns + 1) + i);
  for (let j = rows - 1; j >= 0; j--) perimeter.push(j * (columns + 1));
  for (let k = 0; k < perimeter.length - 1; k++) { const a = perimeter[k], b = perimeter[k + 1], lowA = vertices.length / 3; vertices.push(vertices[a * 3], -.7, vertices[a * 3 + 2], vertices[b * 3], -.7, vertices[b * 3 + 2]); colors.push(colors[a * 3] * .85, colors[a * 3 + 1] * .85, colors[a * 3 + 2] * .85, colors[b * 3] * .85, colors[b * 3 + 1] * .85, colors[b * 3 + 2] * .85); indices.push(a, b, lowA, b, lowA + 1, lowA); }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); return mesh(group, geometry, mat('#ffffff', { vertexColors: true, side: THREE.DoubleSide, roughness: 1 }), [0, 0, 0]);
}
function waterRibbon() {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [], segments = 80;
  for (let i = 0; i <= segments; i++) { const t = i / segments; const x = Math.sin(t * 8) * .8; const y = 56 * Math.pow(1 - t, .9) + 2.3; const z = -29 + t * 60; const width = 1.4 + t * 2 + Math.sin(t * 20) * .35; positions.push(x - width, y, z, x + width, y + .08, z); uvs.push(0, t, 1, t); if (i < segments) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}
export function createPenitente(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Salto del Penitente · garganta de granito y cascada'; cliff(group, -1); cliff(group, 1);
  const water = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, transparent: true, side: THREE.DoubleSide, depthWrite: false, vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'uniform float uTime; varying vec2 vUv; void main(){float streak=sin(vUv.x*58.+vUv.y*19.-uTime*2.6)*sin(vUv.y*150.-uTime*6.);float foam=smoothstep(-.45,.8,streak);float edge=smoothstep(0.,.09,vUv.x)*smoothstep(0.,.09,1.-vUv.x);vec3 c=mix(vec3(.44,.66,.67),vec3(.95,.98,.94),.6+foam*.4);gl_FragColor=vec4(c,edge*.92);}' });
  const falls = mesh(group, waterRibbon(), water, [0, 0, 0]); falls.castShadow = false; falls.receiveShadow = false;
  const pool = mesh(group, new THREE.CircleGeometry(23, 56), mat('#3b6669', { roughness: .24, metalness: .25, transparent: true, opacity: .88 }), [0, 1.7, 38], [1, .7, 1]); pool.rotation.x = -Math.PI / 2; pool.castShadow = false;
  const shallow = mesh(group, new THREE.CircleGeometry(26, 48), mat('#778983', { roughness: .7 }), [0, .3, 38], [1.08, .72, 1]); shallow.rotation.x = -Math.PI / 2;
  rockInstances(group, 100, 68, 901, (x, z) => {
    if (z < -29 || z > 31) return .2;
    const v = (z + 29) / 60, edge = 2.5 + v * 2.2 + Math.sin(v * 7) * 1.3;
    const u = (Math.abs(x) - edge) / (45 + Math.sin(v * 4) * 8);
    if (u < 0 || u > 1) return .2;
    return 56 * Math.pow(1 - v, .9) + 2 + Math.sin(u * Math.PI * .68) * (16 + v * 17);
  });
  const rippleMaterial = mat('#daeee4', { transparent: true, opacity: .22, roughness: .4 });
  for (let i = 0; i < 4; i++) { const ripple = mesh(group, new THREE.TorusGeometry(2.5 + i * 1.6, .07, 4, 40), rippleMaterial, [0, 1.85, 32.5], [1, .7, 1]); ripple.rotation.x = -Math.PI / 2; ripple.castShadow = false; }
  const mist = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.55, 0), mat('#e7eee7', { transparent: true, opacity: .23, depthWrite: false }), 35), dummy = new THREE.Object3D(), random = rng(510);
  for (let i = 0; i < 35; i++) { dummy.position.set((random() - .5) * 7, 2 + random() * 6, 31 + random() * 5); dummy.scale.setScalar(.3 + random()); dummy.updateMatrix(); mist.setMatrixAt(i, dummy.matrix); } group.add(mist);
  return { group, target: new THREE.Vector3(0, 28, 0), bounds: { radius: 82, height: 78 }, cameraDirection: new THREE.Vector3(.4, .31, 1), update(time) { water.uniforms.uTime.value = time; } };
}
