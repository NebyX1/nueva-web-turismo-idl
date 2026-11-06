import {
  BufferGeometry, CatmullRomCurve3, Color, CylinderGeometry, ExtrudeGeometry,
  Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Shape,
  SphereGeometry, TubeGeometry, Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { capsule, ellipsoid, projectStoneUV, sculptGeometry } from './artigasGeometry';
import type { Point3, SculptPrimitive } from './artigasGeometry';

function add(parent: Group, geometry: BufferGeometry, material: MeshStandardMaterial, name: string) {
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Subtle mineral variation and damp, mossy stone at the paws, rather than painted fur. */
function weather(geometry: BufferGeometry, heightOffset = 0) {
  const p = geometry.attributes.position, colors = new Float32Array(p.count * 3);
  const tone = new Color(), moss = new Color('#899078');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i) + heightOffset, z = p.getZ(i);
    const mineral = .94 + Math.sin(x * 13 + y * 8) * Math.cos(z * 11 - y * 5) * .026;
    tone.setRGB(mineral, mineral, mineral);
    const damp = Math.max(0, 1 - (y - 1.05) / .6);
    tone.lerp(moss, damp * (.18 + .16 * Math.sin(z * 7 + x * 4) ** 2));
    tone.toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
}

function oval(center: Point3, radii: Point3, rotation = 0) {
  const geometry = new SphereGeometry(1, 24, 16);
  geometry.scale(...radii).rotateZ(rotation).translate(...center);
  return projectStoneUV(geometry);
}

function stroke(points: Point3[], radius: number, segments = 20) {
  return new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(...p))), segments, radius, 6, false);
}

function combine(parts: BufferGeometry[]) {
  const expanded = parts.map(part => {
    const geometry = part.index ? part.toNonIndexed() : part.clone();
    for (const name of Object.keys(geometry.attributes)) {
      const attribute = geometry.attributes[name];
      geometry.setAttribute(name, new Float32BufferAttribute(attribute.array, attribute.itemSize));
    }
    return geometry;
  });
  const combined = mergeGeometries(expanded, false)!;
  parts.forEach(part => part.dispose());
  expanded.forEach(part => part.dispose());
  combined.computeBoundingBox();
  combined.computeBoundingSphere();
  return combined;
}

function bodyGeometry() {
  // The animal lies on its belly: low pelvis, raised scapulae, and tapering neck.
  const parts: SculptPrimitive[] = [
    ellipsoid([0, 1.65, -1.28], [.69, .59, 1.37], 0, .24),
    ellipsoid([.03, 1.53, -2.03], [.65, .53, .7], 0, .21),
    ellipsoid([0, 1.94, -.43], [.65, .82, .83], 0, .26),
    ellipsoid([0, 2.43, -.03], [.49, .71, .57], 0, .24),
    ellipsoid([0, 2.79, .24], [.405, .51, .45], 0, .2),
    ellipsoid([0, 2.2, .32], [.41, .56, .47], 0, .17),
  ];
  for (const side of [-1, 1]) {
    // Folded rear thigh and hock; these remain lower than the shoulders.
    parts.push(
      ellipsoid([side * .65, 1.38, -1.92], [.44, .4, .7], side * .07, .18),
      ellipsoid([side * .82, 1.23, -1.35], [.29, .22, .58], 0, .12),
      ellipsoid([side * .86, 1.22, -.94], [.265, .18, .35], 0, .1),
      ellipsoid([side * .46, 1.92, -.14], [.31, .57, .55], -side * .14, .19),
      capsule([side * .48, 1.82, .03], [side * .55, 1.42, .7], .245, .205, .15),
      capsule([side * .55, 1.42, .65], [side * .57, 1.31, 1.33], .2, .19, .12),
      ellipsoid([side * .58, 1.29, 1.51], [.31, .195, .43], 0, .1),
    );
    // Four rounded toes grow from each broad paw, with recessed separations.
    for (let toe = 0; toe < 4; toe++) {
      const offset = (toe - 1.5) * .14;
      parts.push(ellipsoid([side * .58 + offset, 1.265, 1.79 - Math.abs(offset) * .32], [.105, .155, .245], 0, .045));
    }
  }
  for (const side of [-1, 1]) {
    for (const gap of [-.14, 0, .14]) {
      parts.push(capsule([side * .58 + gap, 1.36, 1.82], [side * .58 + gap, 1.26, 2.08], .027, .022, .014, true));
    }
    // A shallow crease beside the chest clarifies the separate foreleg.
    parts.push(ellipsoid([side * .35, 1.72, .51], [.055, .28, .25], side * -.22, .035, true));
  }
  return weather(sculptGeometry(parts, [-1.3, .94, -3.02], [1.3, 3.42, 2.22], 68));
}

function headGeometry() {
  const parts: SculptPrimitive[] = [
    ellipsoid([0, .015, -.14], [.53, .45, .57], 0, .13),
    ellipsoid([0, .19, .08], [.45, .31, .45], 0, .13),
    ellipsoid([0, -.18, .1], [.405, .26, .47], 0, .12),
    // Short nasal bridge and paired whisker pads: the muzzle is feline, not conical.
    ellipsoid([0, .055, .465], [.21, .2, .32], 0, .11),
    ellipsoid([0, -.04, .76], [.175, .1, .12], 0, .075),
    ellipsoid([-.17, -.15, .64], [.235, .165, .26], -.1, .085),
    ellipsoid([.17, -.15, .64], [.235, .165, .26], .1, .085),
    ellipsoid([0, -.315, .48], [.305, .135, .33], 0, .085),
  ];
  for (const side of [-1, 1]) {
    parts.push(
      ellipsoid([side * .34, -.085, .22], [.23, .22, .26], side * .12, .1),
      ellipsoid([side * .365, .11, .1], [.19, .27, .31], side * .1, .12),
      ellipsoid([side * .31, .245, .245], [.18, .06, .175], side * .2, .1),
      // Rounded, thick ears grow from the back of the skull.
      ellipsoid([side * .39, .36, -.235], [.19, .155, .15], -side * .25, .075),
      ellipsoid([side * .445, .485, -.235], [.145, .18, .13], -side * .25, .065),
      ellipsoid([side * .46, .61, -.235], [.1, .095, .1], -side * .2, .06),
    );
  }
  for (const side of [-1, 1]) {
    parts.push(
      // Eye sockets are cut under the brow; ear conchae are genuinely hollow.
      ellipsoid([side * .34, .155, .412], [.147, .075, .16], side * .24, .027, true),
      ellipsoid([side * .465, .5, -.09], [.093, .145, .12], -side * .25, .024, true),
    );
  }
  parts.push(
    ellipsoid([0, -.272, .79], [.29, .031, .22], 0, .016, true),
    capsule([0, -.117, .934], [0, -.239, .915], .016, .012, .008, true),
  );
  const geometry = weather(sculptGeometry(parts, [-.82, -.64, -.91], [.82, .88, 1.16], 76), 3.16);
  const position = geometry.attributes.position, color = geometry.attributes.color;
  // Darken the carved stone itself inside the hollows, rather than attaching
  // shiny eyeballs or flat discs over the eye and ear cavities.
  for (let i = 0; i < position.count; i++) {
    const x = Math.abs(position.getX(i)), y = position.getY(i), z = position.getZ(i);
    const orbit = Math.exp(-(((x - .34) / .14) ** 2 + ((y - .155) / .075) ** 2)) * Math.max(0, Math.min(1, (.4 - z) / .14));
    const concha = Math.exp(-(((x - .465) / .09) ** 2 + ((y - .5) / .14) ** 2)) * Math.max(0, Math.min(1, (-.08 - z) / .13));
    const shade = 1 - orbit * .32 - concha * .2;
    color.setXYZ(i, color.getX(i) * shade, color.getY(i) * shade, color.getZ(i) * shade);
  }
  return geometry;
}

function noseGeometry() {
  const outline = new Shape();
  outline.moveTo(-.18, .015);
  outline.bezierCurveTo(-.165, .075, .165, .075, .18, .015);
  outline.bezierCurveTo(.16, -.022, .074, -.08, 0, -.091);
  outline.bezierCurveTo(-.074, -.08, -.16, -.022, -.18, .015);
  const geometry = new ExtrudeGeometry(outline, { depth: .034, bevelEnabled: true, bevelSize: .016, bevelThickness: .014, bevelSegments: 3, steps: 1, curveSegments: 12 });
  geometry.translate(0, -.04, .863);
  return projectStoneUV(geometry);
}

/** A reclining, weathered stone puma, posed after the official Salus photographs. */
export function createSalusPuma(stone: MeshStandardMaterial) {
  const group = new Group();
  group.name = 'Puma de Salus — escultura anatómica';
  stone.vertexColors = true;
  stone.bumpScale = .024;
  add(group, bodyGeometry(), stone, 'Cuerpo continuo — pecho, hombros y cuatro patas');

  const head = new Group();
  head.name = 'Cabeza felina — hocico corto y orejas ahuecadas';
  head.position.set(0, 3.16, .51);
  head.rotation.x = -.18;
  group.add(head);
  add(head, headGeometry(), stone, 'Cráneo esculpido — cejas, mejillas y mandíbula');

  const recess = stone.clone();
  recess.vertexColors = false;
  recess.color.multiplyScalar(.6);
  recess.bumpScale = .01;
  const nose = recess.clone();
  nose.color.copy(stone.color).multiplyScalar(.77);
  add(head, noseGeometry(), nose, 'Nariz triangular de piedra');

  const carvings: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    carvings.push(
      oval([side * .111, -.049, .907], [.037, .018, .008], side * -.18),
      stroke([[side * .03, -.274, .855], [side * .16, -.275, .805], [side * .285, -.247, .68], [side * .32, -.215, .59]], .008),
    );
  }
  add(head, combine(carvings), recess, 'Fosas nasales y comisuras de la boca');

  const outlet = new CylinderGeometry(.034, .034, .055, 16, 1, true);
  outlet.rotateX(Math.PI / 2);
  outlet.translate(0, -.278, .86);
  add(head, outlet, recess, 'Salida del manantial en la boca');

  const tailCurve = new CatmullRomCurve3([
    new Vector3(.15, 1.52, -2.3), new Vector3(-.65, 1.32, -2.72),
    new Vector3(-1.32, 1.2, -2.4), new Vector3(-1.54, 1.16, -1.5),
    new Vector3(-1.38, 1.17, -.55), new Vector3(-1.02, 1.23, -.24),
    new Vector3(-.89, 1.26, -.5),
  ]);
  const tail = new TubeGeometry(tailCurve, 64, 1, 10, false), p = tail.attributes.position;
  const center = new Vector3();
  for (let ring = 0; ring <= 64; ring++) {
    const t = ring / 64, radius = .033 + .135 * Math.pow(1 - t, .75);
    tailCurve.getPointAt(t, center);
    for (let j = 0; j <= 10; j++) {
      const k = ring * 11 + j;
      p.setXYZ(k, center.x + (p.getX(k) - center.x) * radius, center.y + (p.getY(k) - center.y) * radius, center.z + (p.getZ(k) - center.z) * radius);
    }
  }
  tail.computeVertexNormals();
  add(group, weather(projectStoneUV(combine([tail, oval(tailCurve.getPoint(1).toArray(), [.034, .034, .034])]))), stone, 'Cola larga afinada sobre la roca');

  head.updateMatrix();
  const mouth = new Vector3(0, -.278, .8875).applyMatrix4(head.matrix);
  group.userData.reference = 'Salus Uruguay · reserva-2.webp; Presidencia · AO_470/fgr_02.jpg';
  return { group, mouth };
}
