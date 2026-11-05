import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { projectStoneUV } from './artigasGeometry';

const TAU = Math.PI * 2;
const HEIGHT = 1.92;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function gaussian(x: number, c: number, sigma: number) {
  const d = (x - c) / sigma;
  return Math.exp(-d * d);
}

// Midline profile points for General José Artigas (z = 0, facing -X)
// Compact, solid, heroic proportions matching the Belloni/Savio monument
const profilePoints: [number, number][] = [
  [-0.15, -0.10], // Neck base
  [0.00, -0.22],  // Submental throat junction
  [0.12, -0.36],  // Under-chin ascending angle
  [0.24, -0.48],  // Lower chin border
  [0.32, -0.54],  // Chin apex (mentón cuadrado, firme y rotundo)
  [0.42, -0.42],  // Mental sulcus (surco mentolabial)
  [0.54, -0.485], // Lower lip (labio inferior decidido)
  [0.62, -0.435], // Oral fissure (comisura cerrada)
  [0.70, -0.495], // Upper lip (labio superior con arco)
  [0.80, -0.42],  // Subnasale (base nasal)
  [0.90, -0.68],  // Nasal tip (punta de la nariz aguileña y noble)
  [1.02, -0.60],  // Nasal dorsum (dorso nasal recto y prominente)
  [1.16, -0.54],  // Upper nasal bridge
  [1.26, -0.45],  // Nasion (raíz de la nariz)
  [1.36, -0.53],  // Glabella and strong brow shelf
  [1.48, -0.485], // Lower forehead
  [1.62, -0.46],  // Mid forehead (frente amplia y despejada)
  [1.76, -0.40],  // Upper forehead / hairline
  [1.85, -0.24],  // Anterior cranium vault
  [1.92, -0.02],  // Crown apex
];

function midlineProfileX(y: number): number {
  if (y <= profilePoints[0][0]) return profilePoints[0][1];
  if (y >= profilePoints[profilePoints.length - 1][0]) return profilePoints[profilePoints.length - 1][1];
  let i = 0;
  while (i < profilePoints.length - 1 && profilePoints[i + 1][0] < y) i++;
  const p0 = profilePoints[Math.max(0, i - 1)][1];
  const p1 = profilePoints[i][1];
  const p2 = profilePoints[Math.min(profilePoints.length - 1, i + 1)][1];
  const p3 = profilePoints[Math.min(profilePoints.length - 1, i + 2)][1];
  const y1 = profilePoints[i][0];
  const y2 = profilePoints[i + 1][0];
  const t = (y - y1) / (y2 - y1);
  const t2 = t * t;
  const t3 = t2 * t;
  // Catmull-Rom C1 smooth spline
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

// Broad, compact head width (half-width across Z)
function cranialHalfWidth(y: number): number {
  if (y < 0.15) return 0.38 + y * 0.4;
  if (y < 0.45) return 0.48 + (y - 0.15) * 0.20; // Broad square jaw
  if (y < 0.75) return 0.52 + (y - 0.45) * 0.10; // Mouth / cheek level
  if (y < 1.25) return 0.56;                     // Broad cheekbones (pómulos anchos)
  if (y < 1.50) return 0.54 - (y - 1.25) * 0.08; // Temples / brow
  if (y < 1.78) return 0.52 - (y - 1.50) * 0.08; // Forehead
  return Math.max(0.04, 0.48 * Math.sqrt(Math.max(0, 1 - ((y - 1.78) / 0.16) ** 2)));
}

function cranialCenterBackX(y: number): number {
  return 0.06 + Math.sin((y / HEIGHT) * Math.PI) * 0.08;
}

function cranialBackDepth(y: number): number {
  if (y < 0.2) return 0.36;
  if (y < 0.8) return 0.38 + y * 0.14;
  if (y < 1.6) return 0.48 + Math.sin(((y - 0.8) / 0.8) * Math.PI) * 0.06;
  return Math.max(0.04, 0.48 * Math.sqrt(Math.max(0, 1 - ((y - 1.6) / 0.34) ** 2)));
}

/**
 * Continuous sculpted head geometry for General José Gervasio Artigas.
 * Compact, broad, heroic proportions with clearly carved facial planes.
 */
function faceGeometry(): THREE.BufferGeometry {
  const rows = 120;
  const cols = 144;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rows; r++) {
    const y = -0.12 + (r / rows) * (HEIGHT + 0.12);
    const midX = midlineProfileX(y);
    const halfW = cranialHalfWidth(y);
    const centerBackX = cranialCenterBackX(y);
    const backDepth = cranialBackDepth(y);

    for (let c = 0; c <= cols; c++) {
      const angle = (c / cols) * TAU; // 0 = front (-X), PI/2 = left (+Z), PI = back (+X)
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const z = sin * halfW;
      const absZ = Math.abs(z);

      let x: number;
      let tone = 1.0;

      if (cos >= 0) {
        // Base facial foundation plane (smoothly sloping back from midline toward temples/jaw)
        const lat = Math.abs(sin); // 0 at midline, 1 at edge
        // Smooth foundation along Y without any discontinuous step functions
        const foundationY = -0.38 - 0.05 * smoothstep(1.15, 1.45, y) - 0.03 * smoothstep(0.55, 0.25, y);
        let currentX = foundationY + (centerBackX - foundationY) * (lat ** 1.35);

        // 1. Nose (y: 0.72 - 1.30)
        if (y >= 0.72 && y <= 1.30) {
          const noseW = 0.070 + (1.30 - y) * 0.040;
          const onNose = Math.exp(-((absZ / noseW) ** 2.0));
          const noseProjection = (midX - foundationY) * onNose;
          currentX += noseProjection;

          // Nostril wings (alitas nasales suaves)
          if (y >= 0.75 && y <= 0.88) {
            const wingY = gaussian(y, 0.81, 0.05);
            const wingZ = gaussian(absZ, 0.145, 0.040);
            currentX -= 0.045 * wingY * wingZ;
          }
        }

        // 2. Forehead (y: 1.40 - 1.80)
        if (y >= 1.40 && y <= 1.80) {
          const foreheadFront = midX + (centerBackX - midX) * (lat ** 1.6);
          const fWeight = smoothstep(1.40, 1.50, y);
          currentX = currentX * (1 - fWeight) + Math.min(currentX, foreheadFront) * fWeight;
        }

        // 3. Brow ridge (y: 1.28 - 1.46)
        if (y >= 1.28 && y <= 1.46 && absZ <= 0.44) {
          const browY = gaussian(y, 1.36, 0.055);
          const browSpan = smoothstep(0.44, 0.24, absZ);
          currentX -= 0.055 * browY * browSpan;
        }

        // 4. Eye sockets and sculpted stone eyes (y: 1.15 - 1.33)
        if (y >= 1.15 && y <= 1.33 && absZ >= 0.12 && absZ <= 0.38) {
          const eyeY = gaussian(y, 1.24, 0.055);
          const eyeZ = gaussian(absZ, 0.24, 0.07);
          const orbitHollow = eyeY * eyeZ;
          currentX += 0.045 * orbitHollow; // socket hollow

          const eyeball = gaussian(y, 1.24, 0.032) * gaussian(absZ, 0.24, 0.052);
          currentX -= 0.032 * eyeball; // eyeball

          const upperLid = gaussian(y, 1.272, 0.016) * gaussian(absZ, 0.24, 0.055);
          currentX -= 0.016 * upperLid; // upper lid

          const lowerLid = gaussian(y, 1.212, 0.016) * gaussian(absZ, 0.24, 0.050);
          currentX -= 0.012 * lowerLid; // lower lid
        }

        // 5. Broad, prominent cheekbones (y: 0.98 - 1.26)
        if (y >= 0.98 && y <= 1.26 && absZ >= 0.26 && absZ <= 0.52) {
          const cheekY = gaussian(y, 1.12, 0.085);
          const cheekZ = gaussian(absZ, 0.40, 0.075);
          currentX -= 0.045 * cheekY * cheekZ;
        }

        // Lean cheek hollow below cheekbones
        if (y >= 0.68 && y <= 0.98 && absZ >= 0.22 && absZ <= 0.42) {
          const hollowY = gaussian(y, 0.82, 0.095);
          const hollowZ = gaussian(absZ, 0.32, 0.070);
          currentX += 0.022 * hollowY * hollowZ;
        }

        // 6. Resolute mouth (y: 0.48 - 0.74)
        if (y >= 0.48 && y <= 0.74 && absZ <= 0.28) {
          const mouthSpan = gaussian(absZ, 0, 0.16);
          const upperLipY = gaussian(y, 0.70, 0.030);
          const cupid = gaussian(absZ, 0.06, 0.028);
          currentX -= 0.038 * upperLipY * (mouthSpan * 0.65 + cupid * 0.35);

          const lowerLipY = gaussian(y, 0.54, 0.036);
          currentX -= 0.042 * lowerLipY * mouthSpan;

          // Philtrum groove
          if (y >= 0.72 && y <= 0.80) {
            const philtrum = gaussian(absZ, 0, 0.028) * gaussian(y, 0.76, 0.032);
            currentX += 0.014 * philtrum;
          }
        }

        // 7. Broad, square, jutting chin (y: 0.18 - 0.42)
        if (y >= 0.18 && y <= 0.42 && absZ <= 0.26) {
          const chinY = gaussian(y, 0.32, 0.075);
          const chinBox = smoothstep(0.24, 0.08, absZ);
          currentX -= 0.052 * chinY * chinBox;
        }

        // 8. Chiseled jawline (y: 0.22 - 0.55)
        if (y >= 0.22 && y <= 0.55 && absZ >= 0.24 && absZ <= 0.54) {
          const jawY = gaussian(y, 0.40, 0.095);
          const jawZ = gaussian(absZ, 0.42 + (y - 0.22) * 0.22, 0.070);
          currentX -= 0.032 * jawY * jawZ;
        }

        // Smoothly blend midline with profileX
        const midBlend = Math.exp(-((absZ / 0.06) ** 2));
        x = currentX * (1 - midBlend) + midX * midBlend;
      } else {
        // Back of head (cranium vault / occiput)
        const backFactor = Math.abs(cos);
        x = centerBackX + backFactor * backDepth;
      }

      positions.push(x, y, z);
      colors.push(tone, tone, tone);

      if (r < rows && c < cols) {
        const i0 = r * (cols + 1) + c;
        const i1 = i0 + 1;
        const i2 = (r + 1) * (cols + 1) + c;
        const i3 = i2 + 1;
        indices.push(i0, i1, i2, i1, i3, i2);
      }
    }
  }

  // Cap top of head
  const topCenterIndex = positions.length / 3;
  positions.push(cranialCenterBackX(HEIGHT), HEIGHT, 0);
  colors.push(1, 1, 1);
  const lastRowOffset = rows * (cols + 1);
  for (let c = 0; c < cols; c++) {
    indices.push(lastRowOffset + c, lastRowOffset + c + 1, topCenterIndex);
  }

  // Cap bottom of neck
  const bottomCenterIndex = positions.length / 3;
  positions.push(cranialCenterBackX(-0.12), -0.12, 0);
  colors.push(1, 1, 1);
  for (let c = 0; c < cols; c++) {
    indices.push(c, bottomCenterIndex, c + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  projectStoneUV(geometry, 1.4);
  return geometry;
}

/**
 * Authentic classical wavy hair of General Artigas:
 * Combed smoothly back from the broad forehead and temples,
 * with defined sideburns (patillas) in front of the ears,
 * and sculpted flowing locks curving over the ears down to the nape.
 */
function hairGeometry(): THREE.BufferGeometry {
  const rows = 40;
  const cols = 64;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    for (let c = 0; c <= cols; c++) {
      const u = c / cols;
      // angle around posterior hemisphere: from +Z temple (PI/2) to -Z temple (3PI/2)
      const angle = Math.PI * 0.40 + u * Math.PI * 1.20;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const lowerY = 0.32 + (1 - Math.abs(cos)) * 0.92;
      const topY = HEIGHT + 0.035;
      const y = lowerY + (topY - lowerY) * (t ** 0.85);

      const halfW = cranialHalfWidth(y);
      const backD = cranialBackDepth(y);
      const centerBackX = cranialCenterBackX(y);

      // Wavy locks sculpted with stone ridges
      const wave = Math.sin(u * Math.PI * 10 + t * 4) * 0.024 * Math.sin(t * Math.PI);
      const thickness = 0.035 + 0.022 * Math.sin(t * Math.PI) + wave;

      let x: number;
      if (cos <= 0) {
        x = centerBackX + Math.abs(cos) * (backD + thickness);
      } else {
        x = -0.38 + (centerBackX + 0.38) * (Math.abs(sin) ** 1.3) - thickness * cos;
      }
      const z = sin * (halfW + thickness);

      positions.push(x, y, z);

      if (r < rows && c < cols) {
        const i0 = r * (cols + 1) + c;
        const i1 = i0 + 1;
        const i2 = (r + 1) * (cols + 1) + c;
        const i3 = i2 + 1;
        indices.push(i0, i1, i2, i1, i3, i2);
      }
    }
  }

  // Crown apex
  const crownIndex = positions.length / 3;
  positions.push(cranialCenterBackX(HEIGHT) + 0.01, HEIGHT + 0.04, 0);
  const lastRow = rows * (cols + 1);
  for (let c = 0; c < cols; c++) {
    indices.push(lastRow + c, lastRow + c + 1, crownIndex);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  projectStoneUV(geometry, 1.4);
  return geometry;
}

/** Sculpted ears with tragus, concha cavity, helix and lobe */
function earGeometry(side: number): THREE.BufferGeometry {
  const earShape = new THREE.Shape();
  earShape.moveTo(0, -0.16);
  earShape.bezierCurveTo(0.06, -0.14, 0.10, -0.04, 0.10, 0.04);
  earShape.bezierCurveTo(0.10, 0.14, 0.05, 0.20, -0.03, 0.21);
  earShape.bezierCurveTo(-0.09, 0.21, -0.12, 0.14, -0.11, 0.08);
  earShape.bezierCurveTo(-0.08, 0.05, -0.06, -0.02, -0.09, -0.06);
  earShape.bezierCurveTo(-0.07, -0.13, -0.04, -0.16, 0, -0.16);

  const extrudeSettings = {
    depth: 0.045,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.018,
    bevelThickness: 0.018,
  };
  const geo = new THREE.ExtrudeGeometry(earShape, extrudeSettings);
  geo.center();
  geo.rotateY(side * 0.15);
  geo.translate(0.08, 1.02, side * 0.51);
  projectStoneUV(geo, 1.4);
  return geo;
}

function earCavityGeometry(side: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 14, 10);
  geo.scale(0.035, 0.07, 0.012);
  geo.translate(0.08, 1.03, side * 0.525);
  projectStoneUV(geo, 1.4);
  return geo;
}

function plainColor(geometry: THREE.BufferGeometry, shade = 1) {
  const colors = new Array<number>(geometry.attributes.position.count * 3).fill(shade);
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function join(geometries: THREE.BufferGeometry[]) {
  const pieces = geometries.map(geometry => {
    const part = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    for (const name of Object.keys(part.attributes)) {
      if (!['position', 'normal', 'color', 'uv'].includes(name)) part.deleteAttribute(name);
    }
    if (!part.attributes.normal) part.computeVertexNormals();
    if (!part.attributes.color) {
      const count = part.attributes.position.count;
      part.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(count * 3).fill(1), 3));
    }
    if (!part.attributes.uv) {
      const count = part.attributes.position.count;
      part.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
    }
    for (const name of ['position', 'normal', 'color', 'uv']) {
      const attribute = part.attributes[name];
      if (attribute && !(attribute.array instanceof Float32Array)) {
        part.setAttribute(name, new THREE.Float32BufferAttribute(attribute.array, attribute.itemSize));
      }
    }
    return part;
  });
  const result = mergeGeometries(pieces, false)!;
  pieces.forEach(p => p.dispose());
  geometries.forEach(g => g.dispose());
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}

/**
 * Creates the heroic sculpted head of General José Gervasio Artigas.
 * Local head coordinates: face points toward -X, chin apex at y=0.32, crown at y=1.92.
 */
export function createArtigasHead(surface: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Cabeza de Artigas — rostro y cabellera esculpidos';

  const skin = surface.clone();
  skin.vertexColors = true;

  const hair = surface.clone();
  hair.color.multiplyScalar(0.96);
  hair.roughness = 0.98;

  const earRecess = surface.clone();
  earRecess.color.multiplyScalar(0.88);

  const skinParts = [faceGeometry()];
  const hairParts = [hairGeometry()];
  const recessParts: THREE.BufferGeometry[] = [];

  for (const side of [-1, 1]) {
    skinParts.push(plainColor(earGeometry(side), 0.98));
    recessParts.push(plainColor(earCavityGeometry(side), 0.88));
  }

  const face = new THREE.Mesh(join(skinParts), skin);
  face.name = 'Rostro continuo — fisonomía esculpida del Prócer Artigas';
  face.castShadow = face.receiveShadow = true;
  group.add(face);

  const waves = new THREE.Mesh(join(hairParts), hair);
  waves.name = 'Cabellera ondulada — volumen lateral, patillas y mechones peinados hacia atrás';
  waves.castShadow = waves.receiveShadow = true;
  group.add(waves);

  const ears = new THREE.Mesh(join(recessParts), earRecess);
  ears.name = 'Relieve interior de las orejas';
  ears.castShadow = false;
  group.add(ears);

  group.userData.reference = 'Fotografías de referencia del Monumento en Cerro Artigas (Minas)';
  group.userData.features = [
    'rostro heroico de Artigas según iconografía clásica',
    'nariz recta y aguileña prominente',
    'mentón cuadrado y enérgico',
    'pómulos altos y ceño decidido',
    'cabellera ondulada peinada hacia atrás con patillas',
  ];

  return group;
}
