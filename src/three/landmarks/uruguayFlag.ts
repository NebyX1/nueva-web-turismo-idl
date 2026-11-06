import * as THREE from 'three';

const WHITE = new THREE.Color('#ffffff');
const BLUE = new THREE.Color('#0038a8');
const GOLD = new THREE.Color('#f5c329');
const OUTLINE = new THREE.Color('#946014');
const TAU = Math.PI * 2;

/** National pavilion: 3:2, nine stripes, square canton and a sixteen-ray sun.
 * Reference: ANEP, Uruguay y sus símbolos; IMPO, Decreto 339/003, cap. II.
 * The complete design is geometry, so it is visible immediately on both faces.
 */
export function createUruguayFlag(width: number, phase = 0): THREE.Group {
  const height = width * 2 / 3, bandHeight = height / 9, canton = bandHeight * 5;
  const vertices: number[] = [], colors: number[] = [];
  const wave = (x: number) => Math.sin(x * 2 + phase) * .18 * x / width;
  const point = (x: number, y: number, layer = 0) => new THREE.Vector3(x, y, wave(x) + layer);
  function triangle(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, color: THREE.Color) {
    vertices.push(...a.toArray(), ...b.toArray(), ...c.toArray());
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b);
  }
  const xSteps = [...new Set([0, canton, ...Array.from({ length: 33 }, (_, i) => width * i / 32)])].sort((a, b) => a - b);
  for (let band = 0; band < 9; band++) {
    const top = -band * bandHeight, bottom = top - bandHeight;
    for (let i = 1; i < xSteps.length; i++) {
      const left = xSteps[i - 1], right = xSteps[i];
      const color = band % 2 === 0 || (band < 5 && right <= canton) ? WHITE : BLUE;
      triangle(point(left, bottom), point(right, bottom), point(right, top), color);
      triangle(point(left, bottom), point(right, top), point(left, top), color);
    }
  }

  const center = new THREE.Vector2(canton / 2, -canton / 2);
  const disk = canton * 11 / 90;
  // Subdivide painted triangles along the wave, keeping the sun on the cloth.
  function curvedTriangle(a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2, color: THREE.Color, layer: number, side: number) {
    if (Math.max(a.x, b.x, c.x) - Math.min(a.x, b.x, c.x) > .075) {
      const ab = a.clone().add(b).multiplyScalar(.5), bc = b.clone().add(c).multiplyScalar(.5), ca = c.clone().add(a).multiplyScalar(.5);
      for (const face of [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]]) curvedTriangle(face[0], face[1], face[2], color, layer, side);
      return;
    }
    const mapped = [a, b, c].map(p => point(p.x, p.y, side * layer));
    triangle(mapped[0], mapped[side > 0 ? 1 : 2], mapped[side > 0 ? 2 : 1], color);
  }
  function polygon(contour: THREE.Vector2[], color: THREE.Color, layer: number) {
    const indices = THREE.ShapeUtils.triangulateShape(contour, []);
    for (const side of [-1, 1]) for (const face of indices) curvedTriangle(contour[face[0]], contour[face[1]], contour[face[2]], color, layer, side);
  }
  function sunPoint(x: number, y: number, angle = 0) {
    return new THREE.Vector2(center.x + (x * Math.cos(angle) - y * Math.sin(angle)) * disk, center.y + (x * Math.sin(angle) + y * Math.cos(angle)) * disk);
  }
  function circle(x: number, y: number, radius: number, color: THREE.Color, layer: number, segments = 32) {
    polygon(Array.from({ length: segments }, (_, i) => sunPoint(x + Math.cos(i * TAU / segments) * radius, y + Math.sin(i * TAU / segments) * radius)), color, layer);
  }
  for (let ray = 0; ray < 16; ray++) {
    const angle = ray * TAU / 16;
    for (const inset of [false, true]) {
      const color = inset ? GOLD : OUTLINE, layer = inset ? .011 : .009;
      if (ray % 2 === 0) {
        const half = inset ? .12 : .18;
        polygon([sunPoint(-half, .87, angle), sunPoint(0, inset ? 2.96 : 3, angle), sunPoint(half, .87, angle)], color, layer);
      } else {
        const left: THREE.Vector2[] = [], right: THREE.Vector2[] = [];
        for (let i = 0; i <= 18; i++) {
          const t = i / 18, radius = .87 + (inset ? 2.09 : 2.13) * t;
          const bend = .24 * Math.sin(t * TAU), half = (inset ? .10 : .16) * Math.pow(1 - t, .65);
          left.push(sunPoint(bend - half, radius, angle)); right.push(sunPoint(bend + half, radius, angle));
        }
        polygon([...left, ...right.reverse().slice(1)], color, layer);
      }
    }
  }
  circle(0, 0, 1.04, OUTLINE, .013, 48);
  circle(0, 0, 1, GOLD, .015, 48);
  function stroke(points: number[][], thickness: number, layer = .017) {
    for (let i = 1; i < points.length; i++) {
      const a = new THREE.Vector2(points[i - 1][0], points[i - 1][1]), b = new THREE.Vector2(points[i][0], points[i][1]);
      const normal = b.clone().sub(a).normalize(); normal.set(-normal.y, normal.x).multiplyScalar(thickness / 2);
      polygon([a.clone().add(normal), b.clone().add(normal), b.clone().sub(normal), a.clone().sub(normal)].map(p => sunPoint(p.x, p.y)), OUTLINE, layer);
    }
  }
  for (const side of [-1, 1]) {
    const brow = Array.from({ length: 9 }, (_, i) => {
      const t = i / 8; return [side * (.16 + t * .43), .30 + Math.sin(t * Math.PI) * .09];
    });
    stroke(brow, .045);
    const eye = Array.from({ length: 13 }, (_, i) => {
      const t = i * TAU / 12; return [side * .35 + Math.cos(t) * .17, .13 + Math.sin(t) * .065];
    });
    stroke(eye, .033); circle(side * .35, .13, .045, OUTLINE, .018, 12);
  }
  stroke([[-.025, .16], [-.05, -.06], [-.12, -.19], [-.02, -.23], [.10, -.18]], .038);
  stroke([[-.29, -.38], [-.11, -.34], [0, -.37], [.11, -.34], [.29, -.38]], .040);
  stroke([[-.23, -.42], [0, -.47], [.23, -.42]], .030);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const surface = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .92, side: THREE.DoubleSide });
  const cloth = new THREE.Mesh(geometry, surface); cloth.name = 'Paño uruguayo — nueve franjas y Sol de Mayo'; cloth.receiveShadow = true;
  const group = new THREE.Group(); group.name = 'Bandera nacional de Uruguay'; group.add(cloth);
  group.userData.flag = { country: 'UY', width, height, stripes: 9, white: 5, blue: 4, canton, rays: 16 };
  return group;
}
