import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { LandmarkModel } from '../types';
import { createArtigasMonument } from './artigasMonument';
import { createUruguayFlag } from './uruguayFlag';
import { createArtigasFlag, createThirtyThreeFlag } from './heritageFlags';

const TAU = Math.PI * 2;
const material = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: .96, ...extra });

function add(parent: THREE.Group, geometry: THREE.BufferGeometry, surface: THREE.Material, name: string) {
  const object = new THREE.Mesh(geometry, surface);
  object.name = name; object.castShadow = object.receiveShadow = true;
  parent.add(object); return object;
}

/** Bake each static assembly by material while retaining posed groups and smooth normals. */
function batchMeshes(parent: THREE.Group) {
  for (const child of [...parent.children]) if (child instanceof THREE.Group) batchMeshes(child);
  const batches = new Map<string, { material: THREE.Material; castShadow: boolean; meshes: THREE.Mesh[] }>();
  for (const child of [...parent.children]) {
    if (!(child instanceof THREE.Mesh) || child instanceof THREE.InstancedMesh || Array.isArray(child.material)) continue;
    const key = `${child.material.uuid}/${child.castShadow}`;
    let batch = batches.get(key);
    if (!batch) { batch = { material: child.material, castShadow: child.castShadow, meshes: [] }; batches.set(key, batch); }
    batch.meshes.push(child);
  }
  for (const batch of batches.values()) {
    if (batch.meshes.length < 2) continue;
    const pieces = batch.meshes.map(object => {
      object.updateMatrix();
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      for (const name of Object.keys(geometry.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(name)) geometry.deleteAttribute(name);
      if (!geometry.attributes.normal) geometry.computeVertexNormals();
      if (!geometry.attributes.uv) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
      for (const name of ['position', 'normal', 'uv', 'color']) {
        const attribute = geometry.attributes[name];
        if (attribute && !(attribute.array instanceof Float32Array)) geometry.setAttribute(name, new THREE.Float32BufferAttribute(attribute.array, attribute.itemSize));
      }
      if (!geometry.attributes.color) {
        const colors = new Float32Array(geometry.attributes.position.count * 3); colors.fill(1);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      }
      return geometry.applyMatrix4(object.matrix);
    });
    const geometry = mergeGeometries(pieces, false);
    pieces.forEach(piece => piece.dispose());
    if (!geometry) continue;
    const combined = add(parent, geometry, batch.material, batch.meshes.map(m => m.name).join(' · '));
    combined.castShadow = batch.castShadow;
    combined.userData.features = batch.meshes.map(m => m.name);
    batch.meshes.forEach(object => { parent.remove(object); object.geometry.dispose(); });
  }
}

function random(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

function summitHeight(x: number, z: number) {
  const r = Math.sqrt((x / 80) ** 2 + (z / 70) ** 2);
  const slope = Math.max(0, (r - .17) / .83);
  return 26 * Math.pow(Math.max(0, 1 - slope), 1.4)
    + Math.sin(x * .12) * Math.cos(z * .09) * Math.min(.55, Math.max(0, r - .17));
}

function setting(parent: THREE.Group) {
  const terrain = new THREE.PlaneGeometry(218, 196, 58, 52);
  terrain.rotateX(-Math.PI / 2);
  const p = terrain.attributes.position, colors = new Float32Array(p.count * 3), rng = random(7174);
  const color = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = summitHeight(x, z);
    p.setY(i, y);
    color.setHSL(.19 + (rng() - .5) * .025, .23 + rng() * .1, .31 + rng() * .06);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  terrain.setAttribute('color', new THREE.BufferAttribute(colors, 3)); terrain.computeVertexNormals();
  add(parent, terrain, material('#ffffff', { vertexColors: true }), 'Cerro herbáceo urbano');

  const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), material('#727366'), 68);
  rocks.name = 'Afloramiento irregular alrededor del pedestal';
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 68; i++) {
    const a = rng() * TAU, r = i < 24 ? 5.5 + rng() * 7 : 12 + rng() * 27;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const size = (i < 24 ? 1.2 + rng() * 1.9 : .6 + rng() * 2.1) * (z > 1 && Math.abs(x) < 8 ? .35 : 1);
    dummy.position.set(x, summitHeight(x, z) + size * .12, z);
    dummy.rotation.set(rng(), rng() * TAU, rng()); dummy.scale.set(size * 1.5, size * .55, size);
    dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
    color.setHSL(.11, .06 + rng() * .06, .30 + rng() * .13); rocks.setColorAt(i, color);
  }
  rocks.castShadow = rocks.receiveShadow = true; parent.add(rocks);

  const vegetation = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), material('#65734e'), 116);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .25, 1, 5), material('#615e4d'), 58);
  vegetation.name = 'Arbolado periférico instanciado'; trunks.name = 'Troncos periféricos';
  for (let i = 0; i < 58; i++) {
    const a = rng() * TAU, r = .65 + rng() * .35, x = Math.cos(a) * 82 * r, z = Math.sin(a) * 70 * r;
    const h = 3 + rng() * 5, ground = summitHeight(x, z);
    dummy.position.set(x, ground + h * .35, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, h * .7, 1);
    dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
    for (let j = 0; j < 2; j++) {
      dummy.position.set(x + j * .7, ground + h * (.55 + j * .18), z - j * .4);
      dummy.rotation.set(.1, rng() * TAU, .2); dummy.scale.set(h * .43, h * .42, h * .39);
      dummy.updateMatrix(); vegetation.setMatrixAt(i * 2 + j, dummy.matrix);
      color.setHSL(.20 + rng() * .06, .2 + rng() * .12, .23 + rng() * .1); vegetation.setColorAt(i * 2 + j, color);
    }
  }
  vegetation.castShadow = trunks.castShadow = true; vegetation.receiveShadow = true; parent.add(vegetation, trunks);

  const leaves: number[] = [], leafIndices: number[] = [];
  for (let i = 0; i < 35; i++) {
    const a = rng() * TAU, r = 8 + rng() * 13, x = Math.cos(a) * r, z = Math.sin(a) * r, y = summitHeight(x, z) + .1;
    for (let j = 0; j < 8; j++) {
      const angle = j * TAU / 8 + a, length = 1.1 + rng() * 1.15, n = leaves.length / 3;
      leaves.push(x - Math.sin(angle) * .13, y, z + Math.cos(angle) * .13,
        x + Math.sin(angle) * .13, y, z - Math.cos(angle) * .13,
        x + Math.cos(angle) * length, y + length * .65, z + Math.sin(angle) * length);
      leafIndices.push(n, n + 1, n + 2);
    }
  }
  const leafGeo = new THREE.BufferGeometry(); leafGeo.setAttribute('position', new THREE.Float32BufferAttribute(leaves, 3));
  leafGeo.setIndex(leafIndices); leafGeo.computeVertexNormals();
  add(parent, leafGeo, material('#566646', { side: THREE.DoubleSide }), 'Vegetación de hojas en punta');

  const pathVertices: number[] = [], pathIndices: number[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64, z = 96 * (1 - t), x = 22 * Math.sin(t * 3.1) * (1 - t);
    for (const side of [-1, 1]) pathVertices.push(x + side * 2.0, summitHeight(x + side * 2.0, z) + .12, z);
    if (i) { const n = i * 2; pathIndices.push(n - 2, n, n - 1, n - 1, n, n + 1); }
  }
  const path = new THREE.BufferGeometry(); path.setAttribute('position', new THREE.Float32BufferAttribute(pathVertices, 3));
  path.setIndex(pathIndices); path.computeVertexNormals();
  add(parent, path, material('#b2ac95', { side: THREE.DoubleSide }), 'Ascenso del parque');

  const houses = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material('#b2b09f'), 24);
  houses.name = 'Contexto urbano lejano esquemático';
  for (let i = 0; i < 24; i++) {
    const x = -95 + i % 12 * 16, z = -78 - Math.floor(i / 12) * 12, h = 1.8 + rng() * 2.4;
    dummy.position.set(x, summitHeight(x, z) + h / 2, z); dummy.rotation.set(0, .1, 0);
    dummy.scale.set(5 + rng() * 4, h, 4 + rng() * 3); dummy.updateMatrix(); houses.setMatrixAt(i, dummy.matrix);
    color.setHSL(.10, .06 + rng() * .1, .46 + rng() * .15); houses.setColorAt(i, color);
  }
  houses.receiveShadow = true; parent.add(houses);
}

/** Cerro Artigas, Minas: José Artigas descubierto, con manto y su caballo quieto. */
export function createArtigas(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Cerro Artigas — José Artigas y caballo esculpidos';
  setting(group);
  const statue = createArtigasMonument();
  statue.position.y = 26; group.add(statue);

  const poleMat = material('#b8b9aa', { metalness: .25 });
  // Front view, left to right: Thirty-Three, National, Artigas.
  // Level the side pavilions and raise the central national pavilion.
  const pavilions = [createThirtyThreeFlag, createUruguayFlag, createArtigasFlag];
  const mastXs = [19, 22.6, 26.2], z = -9;
  const sidePoleTop = Math.max(...mastXs.map(x => summitHeight(x, z))) + 13.2;
  for (let i = 0; i < 3; i++) {
    const x = mastXs[i], y = summitHeight(x, z), top = sidePoleTop + (i === 1 ? 2.5 : 0), height = top - y;
    const pole = add(group, new THREE.CylinderGeometry(.055, .075, height, 7), poleMat, 'Mástil del parque'); pole.position.set(x, y + height / 2, z);
    const flag = pavilions[i](i === 1 ? 3.3 : 3, i);
    flag.position.set(x + .01, top - 1.12, z); group.add(flag);
  }
  batchMeshes(group);
  return {
    group, target: new THREE.Vector3(-.65, 34.65, 0), bounds: { radius: 100, height: 43 }, groundY: 0,
    cameraDirection: new THREE.Vector3(-.95, .12, .72).normalize(),
  };
}
