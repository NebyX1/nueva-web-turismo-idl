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
function thatchTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256; const ctx = canvas.getContext('2d')!, random = rng(200); ctx.fillStyle = '#6e5b37'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) { const x = random() * 256, y = random() * 256; ctx.strokeStyle = random() > .5 ? '#ae936153' : '#3f372c70'; ctx.lineWidth = .5 + random(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 4 - 2, y + 8 + random() * 15); ctx.stroke(); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(3, 4); return texture;
}
export { createMonastery } from './monastery';

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

export { createPenitente } from './penitente';
