import * as THREE from 'three';
import type { LandmarkModel } from '../types';
import { createTempleRoof, type TempleRoofShape } from './monasteryRoof';
import { material, mesh, box, beam, curve, masonryTexture, paintedTexture, paintedBand, windowDetail, dharmaWheel, kneelingDeer, finial, batchDetails } from './monasteryDetails';

/** Proportional reconstruction from the user's front, oblique and aerial photos. */
export function createMonastery(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Sengue Dzong — templo de piedra, aleros y corona dorada';
  const stone = material('#ffffff', masonryTexture()), paving = material('#92938c');
  const maroon = material('#702b28'), red = material('#bc3333'), gold = material('#d9ad54', { metalness: .28, roughness: .5 });
  const turquoise = material('#398b95', { side: THREE.DoubleSide }), white = material('#e9e4d2');
  const dark = material('#282a28'), glass = material('#243d40', { roughness: .36, metalness: .08 });
  const blue = material('#244b83'), green = material('#23745d');
  const paint = material('#ffffff', { map: paintedTexture() }), palette = [white, red, gold, turquoise];
  const feature = (name: string) => { const result = new THREE.Group(); result.name = name; group.add(result); return result; };

  const landscape = feature('Ladera rocosa y vegetación baja');
  mesh(landscape, new THREE.SphereGeometry(1, 48, 20), material('#69744c'), [0, -5.7, -1], [70, 8.5, 62]);
  let seed = 83;
  const random = () => { seed = Math.imul(seed ^ seed >>> 15, 1 | seed); seed ^= seed + Math.imul(seed ^ seed >>> 7, 61 | seed); return ((seed ^ seed >>> 14) >>> 0) / 4294967296; };
  const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), material('#8d8b7c'), 80);
  const shrubs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), material('#4d643a'), 80);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  for (let i = 0; i < 80; i++) {
    const a = random() * Math.PI * 2, r = 41 + random() * 24, x = Math.cos(a) * r, z = Math.sin(a) * r * .87;
    const y = -5.7 + 8.5 * Math.sqrt(Math.max(0, 1 - (x / 70) ** 2 - ((z + 1) / 62) ** 2));
    const size = .65 + random() * 1.65;
    dummy.position.set(x, y, z); dummy.rotation.set(random() * .8, random() * 6.28, random() * .5); dummy.scale.set(size * 1.6, size * .7, size); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
    color.setHSL(.10, .08, .4 + random() * .18); rocks.setColorAt(i, color);
    dummy.position.set(x + 1.8, y + .25, z - .9); dummy.scale.set(size * .9, size * .8, size); dummy.updateMatrix(); shrubs.setMatrixAt(i, dummy.matrix);
  }
  rocks.castShadow = shrubs.castShadow = true; rocks.receiveShadow = shrubs.receiveShadow = true; landscape.add(rocks, shrubs);

  const terrace = feature('Terraza y basamento de mampostería');
  box(terrace, stone, [62, 6.1, 49], [0, 3.05, -.7]);
  box(terrace, paving, [63.5, .5, 50.5], [0, 6.35, -.7]);
  // The lower storey's small windows remain visible in the aerial references.
  for (const side of [-1, 1]) {
    for (const z of [-19, -10, -1, 8, 17]) windowDetail(terrace, 2.9, 2.9, [side * 31.08, 3, z], side * Math.PI / 2, dark, glass, maroon, white, gold);
    for (const x of [-24, -15, -6, 6, 15, 24]) windowDetail(terrace, 2.8, 2.9, [x, 3, -25.28], Math.PI, dark, glass, maroon, white, gold);
  }
  const parapet = feature('Pretiles rojos — remates blancos y frisos pintados');
  const wall = (width: number, depth: number, x: number, z: number) => {
    const part = new THREE.Group(); part.position.set(x, 0, z); parapet.add(part);
    box(part, maroon, [width, 1.7, depth], [0, 7.45, 0]);
    box(part, white, [width + .2, .16, depth + .2], [0, 8.31, 0]);
    box(part, gold, [width + .28, .13, depth + .28], [0, 8.48, 0]);
    paintedBand(part, width, depth, 7.26, palette, white, dark, gold);
  };
  wall(62.5, .72, 0, -25.6);
  for (const side of [-1, 1]) { wall(.72, 49.8, side * 31.4, -.65); wall(23.7, .72, side * 19.1, 24.25); box(parapet, white, [1.15, 2.65, 1.15], [side * 7.5, 7.88, 24.3]); }

  const hall = feature('Sala principal — piedra y franja granate escalonada');
  box(hall, stone, [32, 10.8, 30], [0, 12, -1.8]);
  box(hall, maroon, [32, 3.35, 30], [0, 18.88, -1.8]);
  paintedBand(hall, 32.15, 30.15, 17.2, palette, white, dark, gold, -1.8);
  paintedBand(hall, 32.5, 30.5, 19.27, palette, white, dark, gold, -1.8);
  for (const side of [-1, 1]) {
    box(hall, stone, [7.5, 9.7, 26], [side * 19.75, 11.45, -3.8]);
    box(hall, maroon, [7.5, 2.95, 26], [side * 19.75, 17.78, -3.8]);
    const wing = new THREE.Group(); wing.position.x = side * 19.75; hall.add(wing);
    paintedBand(wing, 7.65, 26.15, 16.1, palette, white, dark, gold, -3.8);
    paintedBand(wing, 8, 26.5, 18.2, palette, white, dark, gold, -3.8);
  }
  const windows = feature('Ventanas altas — marcos oscuros y dinteles claros');
  const centralWindows = new THREE.Group(); centralWindows.name = 'Ventanas de planta baja del cuerpo central — dos vanos'; windows.add(centralWindows);
  for (const x of [-9.5, 9.5]) {
    const opening = windowDetail(centralWindows, 3.1, 6.4, [x, 11.7, 13.28], 0, dark, glass, maroon, white, gold);
    opening.name = x < 0 ? 'Vano junto al portal izquierdo' : 'Vano junto al portal derecho';
  }
  const cornerWindows = new THREE.Group(); cornerWindows.name = 'Ventanas de planta baja de los extremos — dos vanos'; windows.add(cornerWindows);
  for (const side of [-1, 1]) {
    const opening = windowDetail(cornerWindows, 3.2, 6.3, [side * 19.8, 11.6, 9.28], 0, dark, glass, maroon, white, gold);
    opening.name = side < 0 ? 'Vano de la esquina izquierda' : 'Vano de la esquina derecha';
    for (const z of [-12, -5.4, 1.2, 7.2]) windowDetail(windows, 3.2, 6.3, [side * 23.58, 11.6, z], side * Math.PI / 2, dark, glass, maroon, white, gold);
  }
  for (const x of [-11.2, -4, 4, 11.2]) windowDetail(windows, 3.1, 6.2, [x, 11.7, -16.88], Math.PI, dark, glass, maroon, white, gold);

  const lowerShape: TempleRoofShape = { width: 45, depth: 38, eave: 20.9, rise: 4.9, ridgeWidth: 18, ridgeDepth: 3.8, curl: 1.65 };
  for (const side of [-1, 1]) {
    const roof = createTempleRoof('Cubierta lateral escalonada', { width: 13.5, depth: 32, eave: 19.5, rise: 4.6, ridgeWidth: 2.2, ridgeDepth: 16, curl: 1.5 }, gold, turquoise);
    roof.position.set(side * 19.75, 0, -3.8); group.add(roof);
  }
  const lowerRoof = createTempleRoof('Cubierta principal dorada — aleros curvos', lowerShape, gold, turquoise); lowerRoof.position.z = -1.8; group.add(lowerRoof);

  const lantern = feature('Pabellón superior — segundo nivel de piedra y granate');
  box(lantern, stone, [19, 4, 15.5], [0, 26.2, -2.6]);
  box(lantern, maroon, [19, 2.85, 15.5], [0, 29.6, -2.6]);
  paintedBand(lantern, 19.2, 15.7, 28, palette, white, dark, gold, -2.6);
  paintedBand(lantern, 19.8, 16.3, 29.8, palette, white, dark, gold, -2.6);
  const frontWindows = new THREE.Group(); frontWindows.name = 'Ventanas superiores frontales — dos vanos'; lantern.add(frontWindows);
  for (const x of [-4.8, 4.8]) {
    const opening = windowDetail(frontWindows, 2.7, 4.1, [x, 26.65, 5.24], 0, dark, glass, maroon, white, gold);
    opening.name = x < 0 ? 'Vano frontal izquierdo' : 'Vano frontal derecho';
  }
  for (const side of [-1, 1]) {
    const sideWindows = new THREE.Group(); sideWindows.name = side < 0 ? 'Ventanas superiores del costado izquierdo — tres vanos' : 'Ventanas superiores del costado derecho — tres vanos'; lantern.add(sideWindows);
    for (const z of [-7.7, -2.6, 2.5]) {
      const opening = windowDetail(sideWindows, 2.55, 4, [side * 9.58, 26.65, z], side * Math.PI / 2, dark, glass, maroon, white, gold);
      opening.name = `Vano lateral ${z}`;
    }
  }
  for (const x of [-6, 0, 6]) windowDetail(lantern, 2.7, 4.1, [x, 26.65, -10.44], Math.PI, dark, glass, maroon, white, gold);
  const upperShape: TempleRoofShape = { width: 28.5, depth: 24, eave: 31.3, rise: 4.1, ridgeWidth: 6.2, ridgeDepth: 9, curl: 1.65 };
  const upperRoof = createTempleRoof('Cubierta superior — esquinas levantadas', upperShape, gold, turquoise); upperRoof.position.z = -2.6; group.add(upperRoof);

  const gable = feature('Frontón triangular — tímpano azul y marco dorado');
  const triangle = new THREE.Shape(); triangle.moveTo(-3.1, 0); triangle.lineTo(3.1, 0); triangle.lineTo(0, 3.2); triangle.closePath();
  const inset = mesh(gable, new THREE.ShapeGeometry(triangle), turquoise, [0, 35.4, 1.99]); inset.material = material('#294750', { side: THREE.DoubleSide });
  for (const z of [1.96, -7.16]) {
    beam(gable, gold, [-3.15, 35.4, z], [0, 38.6, z], .25); beam(gable, gold, [0, 38.6, z], [3.15, 35.4, z], .25);
    beam(gable, gold, [-3.15, 35.4, z], [3.15, 35.4, z], .21);
  }
  const gableRoofGeometry = new THREE.BufferGeometry();
  gableRoofGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-3.1, 35.4, 1.95, 0, 38.6, 1.95, -3.1, 35.4, -7.15, 0, 38.6, -7.15, 3.1, 35.4, 1.95, 3.1, 35.4, -7.15], 3));
  gableRoofGeometry.setIndex([0, 1, 2, 1, 3, 2, 1, 4, 3, 4, 5, 3]); gableRoofGeometry.computeVertexNormals(); mesh(gable, gableRoofGeometry, gold, [0, 0, 0]);
  beam(gable, gold, [0, 38.6, 2], [0, 38.6, -7.2], .15);
  const crown = feature('Tres pináculos torneados sobre la cumbrera');
  for (const [z, height] of [[1.7, 3.35], [-2.6, 2.9], [-6.9, 2.45]]) {
    const ornament = finial(height, gold); ornament.name = `Pináculo dorado ${z}`;
    ornament.position.set(0, 38.6, z); ornament.castShadow = true; ornament.userData.keepMesh = true; crown.add(ornament);
  }

  const roofEmblem = feature('Rueda del Dharma y dos ciervos arrodillados'); roofEmblem.position.set(0, 23.55, 8.2);
  box(roofEmblem, gold, [11.4, .32, 1.8], [0, .16, 0]);
  for (const x of [-4, 0, 4]) box(roofEmblem, gold, [.75, .8, 1], [x, -.26, 0]);
  box(roofEmblem, gold, [1.1, .35, 1.1], [0, .56, 0]); beam(roofEmblem, gold, [0, .6, 0], [0, 2.4, 0], .14);
  const wheel = dharmaWheel('Rueda dorada sobre la cubierta principal', 1.55, gold); wheel.position.set(0, 2.47, .08); roofEmblem.add(wheel);
  for (const sign of [-1, 1]) { const deer = kneelingDeer(sign, gold); deer.position.y = .32; roofEmblem.add(deer); }

  const portal = feature('Pórtico ceremonial — columnas rojas y arco policromado');
  for (const x of [-4.75, 4.75]) {
    box(portal, white, [1.45, .5, 1.45], [x, 6.86, 16.8]);
    mesh(portal, new THREE.CylinderGeometry(.51, .58, 6.2, 16), red, [x, 10.2, 16.8]);
    box(portal, paint, [1.35, 2, 1.35], [x, 14.3, 16.8]);
    box(portal, gold, [1.6, .3, 1.6], [x, 15.45, 16.8]);
    for (let j = 0; j < 4; j++) mesh(portal, new THREE.TorusGeometry(.59, .075, 6, 20), j % 2 ? white : turquoise, [x, 12.3 + j * .24, 16.8]).rotation.x = Math.PI / 2;
  }
  box(portal, dark, [8.3, 8.7, .3], [0, 11.0, 13.43]);
  for (const x of [-2, 2]) {
    box(portal, blue, [3.8, 8.1, .16], [x, 10.9, 13.65]);
    for (const side of [-1, 1]) box(portal, green, [.18, 8.1, .17], [x + side * 1.8, 10.9, 13.79]);
    box(portal, green, [3.6, .22, .17], [x, 11.1, 13.79]);
    const wheel = dharmaWheel('Rueda de la puerta', 1.22, gold); wheel.position.set(x, 12.9, 13.85); portal.add(wheel);
    const diamond = box(portal, gold, [.94, .94, .09], [x, 8.9, 13.8]); diamond.rotation.z = Math.PI / 4;
    const inset = box(portal, red, [.59, .59, .10], [x, 8.9, 13.87]); inset.rotation.z = Math.PI / 4;
    for (const y of [7.4, 10.5]) curve(portal, turquoise, [[x - 1.5, y, 13.88], [x - .8, y + .55, 13.88], [x, y + .18, 13.88], [x + .8, y + .55, 13.88], [x + 1.5, y, 13.88]], .065);
  }
  const contour: [number, number][] = [[-5.25, 12.8], [-4.45, 13.2], [-3.6, 14.55], [-2.6, 14.45], [-1.8, 15.25], [-.85, 15.25], [0, 15.8], [.85, 15.25], [1.8, 15.25], [2.6, 14.45], [3.6, 14.55], [4.45, 13.2], [5.25, 12.8]];
  const arch = new THREE.Shape(); arch.moveTo(-5.25, 16.2); arch.lineTo(5.25, 16.2); [...contour].reverse().forEach(([x, y]) => arch.lineTo(x, y)); arch.closePath();
  const archGeometry = new THREE.ShapeGeometry(arch); archGeometry.computeBoundingBox();
  const archUv = archGeometry.attributes.uv, archPosition = archGeometry.attributes.position;
  for (let i = 0; i < archPosition.count; i++) archUv.setXY(i, (archPosition.getX(i) + 5.25) / 10.5, (archPosition.getY(i) - 12.8) / 3.4);
  mesh(portal, archGeometry, paint, [0, 0, 17.52]);
  const archCurve: [number, number, number][] = contour.map(([x, y]) => [x, y, 17.56]);
  curve(portal, red, archCurve, .19); curve(portal, gold, archCurve.map(([x, y, z]) => [x, y + .18, z + .03]), .075);
  box(portal, blue, [10.9, .56, 1.1], [0, 16.32, 16.8]);
  for (let x = -4.7; x <= 4.7; x += .58) { const d = box(portal, gold, [.19, .19, .10], [x, 16.32, 17.42]); d.rotation.z = Math.PI / 4; }
  paintedBand(portal, 11.4, 4.3, 15.55, palette, white, dark, gold, 16.8);
  const porchRoof = createTempleRoof('Cubierta del portal — alero dorado', { width: 14.5, depth: 8.8, eave: 17.0, rise: 2.1, ridgeWidth: 7.2, ridgeDepth: 1.5, curl: 1.3 }, gold, turquoise);
  porchRoof.position.z = 16.7; group.add(porchRoof);

  const stairs = feature('Escalinata ancha de piedra');
  for (let i = 0; i < 16; i++) box(stairs, paving, [14.2 + (15 - i) * .17, .42 * (i + 1), .80], [0, .21 * (i + 1), 35.7 - i * .73]);
  box(stairs, paving, [14.2, .25, 7.3], [0, 6.6, 20.6]);

  batchDetails(group);
  group.userData.reference = 'docs/research-architecture-water.md';
  return { group, target: new THREE.Vector3(0, 21, -1), bounds: { radius: 72, height: 44 }, cameraDirection: new THREE.Vector3(.78, .36, 1) };
}
