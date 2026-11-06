import * as THREE from 'three';
import type { LandmarkModel } from '../types';

// Photo-informed proportions, not a survey. +Z is the wooded long face.
const TAU = Math.PI * 2;
const UP = new THREE.Vector3(0, 1, 0);
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
function random(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return mix(mix(hash(ix, iy), hash(ix + 1, iy), u), mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), u), v);
}
function finish(geometry: THREE.BufferGeometry) {
  geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere(); return geometry;
}
function addMesh(group: THREE.Group, name: string, geometry: THREE.BufferGeometry, material: THREE.Material) {
  const object = new THREE.Mesh(geometry, material); object.name = name;
  object.castShadow = object.receiveShadow = true; group.add(object); return object;
}

/** Grain, oxidation, lichen and small cracks are original procedural textures. */
function rockMaps() {
  const size = 512, canvases = Array.from({ length: 3 }, () => document.createElement('canvas'));
  canvases.forEach(canvas => { canvas.width = canvas.height = size; });
  const contexts = canvases.map(canvas => canvas.getContext('2d'));
  if (contexts.some(ctx => !ctx)) return {};
  const [diffuse, bump, roughness] = contexts as CanvasRenderingContext2D[];
  const pixels = contexts.map(ctx => ctx!.createImageData(size, size));
  const rng = random(187024), fractures: { x: number; drift: number; seed: number }[] = [];
  // A cached value field replaces millions of trigonometric hash evaluations
  // during scene creation. Detail comes primarily from the actual rock relief.
  const field = new Float32Array(64 * 64);
  for (let i = 0; i < field.length; i++) field[i] = rng();
  function textureNoise(x: number, y: number) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = (iy & 63) * 64, b = ((iy + 1) & 63) * 64, left = ix & 63, right = (ix + 1) & 63;
    return mix(mix(field[a + left], field[a + right], u), mix(field[b + left], field[b + right], u), v);
  }
  for (let i = 0; i < 23; i++) fractures.push({ x: rng() * size, drift: 5 + rng() * 19, seed: rng() * 40 });
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const grain = (rng() - .5) * 19;
    const mottling = (textureNoise(x * .036, y * .042) - .5) * 36 + (textureNoise(x * .158, y * .146) - .5) * 12;
    const oxidation = Math.max(0, textureNoise(x * .022 + 7, y * .026) - .49) * 33;
    const lichen = Math.max(0, textureNoise(x * .092 - 13, y * .092) - .63) * 105;
    const fineJoint = Math.pow(Math.max(0, 1 - Math.abs(Math.sin(x * .062 + textureNoise(x * .018, y * .014) * 4)) * 19), 2);
    const flake = Math.pow(Math.max(0, 1 - Math.abs(Math.sin(y * .24 + textureNoise(x * .054, y * .034) * 5)) * 12), 3) * .18;
    const shade = fineJoint * 14 + flake * 25, value = 174 + grain + mottling - shade;
    const i = (y * size + x) * 4;
    pixels[0].data.set([value + oxidation + lichen * .65, value + oxidation * .48 + lichen * .64, value - 9 - oxidation * .17 + lichen * .37, 255], i);
    const relief = 145 + grain * 1.4 + mottling * .8 - fineJoint * 44 - flake * 65;
    pixels[1].data.set([relief, relief, relief, 255], i);
    const rough = 227 + grain * .5 + lichen * .5;
    pixels[2].data.set([rough, rough, rough, 255], i);
  }
  diffuse.putImageData(pixels[0], 0, 0); bump.putImageData(pixels[1], 0, 0); roughness.putImageData(pixels[2], 0, 0);
  // Broken secondary joints: large fissures live in the mesh, not painted bars.
  for (const fracture of fractures) {
    for (const [ctx, color, width] of [[diffuse, 'rgba(57,53,43,.33)', 1.5], [bump, '#65625a', 3]] as const) {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
      for (let j = 0; j <= 36; j++) {
        const y = j / 36 * size, x = fracture.x + (noise(fracture.seed, j * .32) - .5) * fracture.drift;
        if (j === 0 || j % 13 === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  const textures = canvases.map((canvas, index) => {
    const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 1.4); texture.anisotropy = 4;
    if (index === 0) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });
  return { map: textures[0], bumpMap: textures[1], roughnessMap: textures[2] };
}

interface SurfacePoint { point: THREE.Vector3; normal: THREE.Vector3; tangent: THREE.Vector3; joint: number }

/** Wide asymmetric rhyolite escarpment, irregular shoulders, continuous wooded talus. */
export function createArequita(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Cerro Arequita — escarpe de riolita y monte nativo';
  const rng = random(13001870);
  // Explicit photographic footprint: long front, recessed bays, unequal ends.
  // This is deliberately neither an ellipse nor a revolved cylinder.
  const footprint = new THREE.CatmullRomCurve3([
    [-127, -17], [-119, 17], [-102, 37], [-69, 45], [-31, 41], [7, 49],
    [45, 47], [87, 39], [125, 29], [159, 13], [173, -8], [150, -32],
    [110, -48], [60, -55], [-2, -59], [-46, -52], [-91, -40],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal', .5);
  const perimeter = footprint.getLength();
  const jointPositions = [0]; let jointDistance = 0;
  while (jointDistance < perimeter) { jointDistance += 11 + rng() * 15; jointPositions.push(jointDistance); }
  const stretch = perimeter / jointPositions.at(-1)!;
  const joints = jointPositions.slice(0, -1).map((distance, index) => ({
    u: distance * stretch / perimeter, depth: 2.8 + rng() * 5.2, width: .5 + rng() * 1.35,
    tilt: (rng() - .5) * 2.4, height: (rng() - .5) * 3.0, phase: index * 2.731,
  }));
  function terrainHeight(x: number, z: number) {
    const hill = 43 * Math.exp(-((x / 154) ** 2 + ((z + 5) / 108) ** 2));
    const shoulders = 5.6 * Math.exp(-(((x + 97) / 69) ** 2 + ((z - 4) / 93) ** 2));
    const edge = Math.max(0, 1 - (x / 214) ** 8) * Math.max(0, 1 - (z / 174) ** 8);
    const detail = (noise(x * .048, z * .048) - .5) * 2.4 + (noise(x * .13, z * .13) - .5) * .7;
    return Math.max(0, (hill + shoulders + detail - 1.7) * edge);
  }
  // The user's field photograph shows an abrupt left escarpment and a long
  // descending right shoulder. Monotone Hermite segments avoid ringing or a
  // second summit while connecting the crown to the wooded foot of the hill.
  const profile = [[-132, 82], [-90, 88], [-45, 85], [0, 78], [45, 66], [85, 51], [120, 34], [173, 18]];
  const slopes = profile.slice(1).map(([x, y], i) => (y - profile[i][1]) / (x - profile[i][0]));
  const tangents = profile.map((_, i) => {
    if (!i) return slopes[0];
    if (i === profile.length - 1) return slopes.at(-1)!;
    const a = slopes[i - 1], b = slopes[i];
    return a * b <= 0 ? 0 : 2 * a * b / (a + b);
  });
  function profileHeight(x: number) {
    const segment = profile.findIndex((_, j) => j < profile.length - 1 && x <= profile[j + 1][0]);
    const i = segment < 0 ? profile.length - 2 : segment;
    const [x0, y0] = profile[i], [x1, y1] = profile[i + 1], span = x1 - x0;
    const t = clamp((x - x0) / span, 0, 1), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * span * tangents[i]
      + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * span * tangents[i + 1];
  }
  function shoulderAt(x: number) { return THREE.MathUtils.smoothstep(x, 42, 165); }
  function ridgeHeight(x: number, z: number) {
    const shoulder = shoulderAt(x);
    const detail = (Math.sin(x * .077 + .7) * 1.15 + (noise(x * .065, z * .09) - .5) * 2 + z * .018) * (1 - shoulder * .8);
    const crown = profileHeight(x) + detail;
    return Math.max(terrainHeight(x, z) + 1.4, mix(crown, terrainHeight(x, z) + 1.4, THREE.MathUtils.smoothstep(x, 136, 178)));
  }
  function surface(u: number, t: number): SurfacePoint {
    u = ((u % 1) + 1) % 1;
    const p = footprint.getPointAt(u), tangent = footprint.getTangentAt(u).setY(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const shoulder = shoulderAt(p.x), exposed = 1 - shoulder * .94;
    // A very small wandering joint keeps fracture runs from becoming parallel flutes.
    const warped = ((u + Math.sin(t * 7.6 + u * 21) * .0009) % 1 + 1) % 1;
    let column = joints.length - 1;
    for (let j = 0; j < joints.length - 1; j++) if (warped >= joints[j].u && warped < joints[j + 1].u) { column = j; break; }
    const a = joints[column], next = joints[(column + 1) % joints.length], end = next.u || 1;
    const fraction = clamp((warped - a.u) / (end - a.u), 0, 1), distance = (end - a.u) * perimeter;
    const left = Math.exp(-((fraction * distance / a.width) ** 2));
    const right = Math.exp(-(((1 - fraction) * distance / next.width) ** 2));
    const joint = (left * a.depth + right * next.depth) * exposed;
    const buttress = Math.sin(fraction * Math.PI) * (1.1 + Math.sin(a.phase) * .55);
    const horizontalSteps = (noise(column * 1.7, Math.floor(t * (6 + column % 4))) - .5) * .75;
    const grain = (noise(u * 237, t * 47) - .5) * .9;
    const bevel = THREE.MathUtils.smoothstep(t, .88, 1) * (1.7 + (1 + Math.sin(a.phase)) * .8);
    const displacement = buttress * exposed - joint * (.72 + .28 * Math.sin(t * 2.7))
      + (1 - t) ** 2 * (3.7 + shoulder * 27)
      + ((t - .4) * a.tilt + horizontalSteps + grain - bevel) * exposed;
    p.addScaledVector(normal, displacement);
    const base = terrainHeight(p.x, p.z) - 4.6;
    const crest = Math.max(base + 1, ridgeHeight(p.x, p.z) + a.height * Math.sin(fraction * Math.PI) * exposed - Math.min(1.8, joint * .22));
    p.y = mix(base, crest, t);
    return { point: p, normal, tangent, joint };
  }
  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff', vertexColors: true, roughness: .98, ...rockMaps(), bumpScale: .72,
  });
  const rockVertices: number[] = [], rockColors: number[] = [], rockUvs: number[] = [], rockIndices: number[] = [];
  const around = 448, levels = 44;
  for (let row = 0; row <= levels; row++) for (let col = 0; col <= around; col++) {
    const u = col / around, t = row / levels, { point: p, joint } = surface(u, t);
    rockVertices.push(p.x, p.y, p.z); rockUvs.push(u, t);
    const patches = noise(u * 43, t * 12), shade = .87 + patches * .14 - Math.min(.29, joint * .039);
    const damp = (1 - t) ** 3 * .10;
    const green = shoulderAt(p.x) * THREE.MathUtils.smoothstep(t, .60, 1) * .65;
    rockColors.push(mix(shade - damp, .50, green), mix(shade - damp * .72, .66, green), mix(shade * .955 - damp * .9, .35, green));
    if (row < levels && col < around) {
      const a = row * (around + 1) + col, b = a + around + 1;
      rockIndices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const wall = new THREE.BufferGeometry(); wall.setAttribute('position', new THREE.Float32BufferAttribute(rockVertices, 3));
  wall.setAttribute('color', new THREE.Float32BufferAttribute(rockColors, 3)); wall.setAttribute('uv', new THREE.Float32BufferAttribute(rockUvs, 2)); wall.setIndex(rockIndices);
  addMesh(group, 'Pared continua — contrafuertes y juntas no periódicas', finish(wall), stoneMaterial);

  const capPoints = Array.from({ length: around }, (_, i) => surface(i / around, 1).point);
  let capFaces = THREE.ShapeUtils.triangulateShape(capPoints.map(p => new THREE.Vector2(p.x, p.z)), []);
  const edgeKey = (a: number, b: number) => a < b ? `${a}:${b}` : `${b}:${a}`;
  let boundary = new Set(capPoints.map((_, i) => edgeKey(i, (i + 1) % around)));
  // Triangulate the actual concave outline, then refine it. A radial fan would
  // fold over at deep fissures and invert normals along the notched perimeter.
  for (let iteration = 0; iteration < 3; iteration++) {
    const mids = new Map<string, number>(), newBoundary = new Set<string>();
    function midpoint(a: number, b: number) {
      const key = edgeKey(a, b), cached = mids.get(key); if (cached !== undefined) return cached;
      const p = capPoints[a].clone().add(capPoints[b]).multiplyScalar(.5), isEdge = boundary.has(key);
      if (!isEdge) p.y = ridgeHeight(p.x, p.z) + (noise(p.x * .13 + 6, p.z * .12) - .5) * 1.4;
      const index = capPoints.length; capPoints.push(p); mids.set(key, index);
      if (isEdge) { newBoundary.add(edgeKey(a, index)); newBoundary.add(edgeKey(index, b)); }
      return index;
    }
    const refined: number[][] = [];
    capFaces.forEach(([a, b, c]) => {
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      refined.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
    });
    capFaces = refined; boundary = newBoundary;
  }
  const capVertices: number[] = [], capColors: number[] = [], capUvs: number[] = [], capIndices: number[] = [];
  capPoints.forEach(p => {
    capVertices.push(p.x, p.y, p.z); capUvs.push(p.x / 230 + .5, p.z / 104 + .5);
    const moss = noise(p.x * .067, p.z * .073), shade = .82 + noise(p.x * .13, p.z * .12) * .17;
    const cover = clamp(.28 + THREE.MathUtils.smoothstep(moss, .27, .72) * .57 + shoulderAt(p.x) * .13, 0, .94);
    capColors.push(mix(shade, .44, cover), mix(shade, .65, cover), mix(shade * .91, .30, cover));
  });
  capFaces.forEach(([a, b, c]) => {
    const pa = capPoints[a], pb = capPoints[b], pc = capPoints[c];
    const upward = (pb.z - pa.z) * (pc.x - pa.x) - (pb.x - pa.x) * (pc.z - pa.z);
    capIndices.push(a, upward >= 0 ? b : c, upward >= 0 ? c : b);
  });
  const crown = new THREE.BufferGeometry(); crown.setAttribute('position', new THREE.Float32BufferAttribute(capVertices, 3));
  crown.setAttribute('color', new THREE.Float32BufferAttribute(capColors, 3)); crown.setAttribute('uv', new THREE.Float32BufferAttribute(capUvs, 2)); crown.setIndex(capIndices);
  addMesh(group, 'Corona pétrea baja, quebrada y sin tapa plana', finish(crown), stoneMaterial);
  // A small spatial index grounds summit shrubs on their actual triangle.
  // This avoids hundreds of full-mesh raycasts at scene startup.
  const crownCells = new Map<string, number[]>(), cellSize = 12;
  capFaces.forEach(([a, b, c], index) => {
    const pa = capPoints[a], pb = capPoints[b], pc = capPoints[c];
    const minX = Math.floor(Math.min(pa.x, pb.x, pc.x) / cellSize), maxX = Math.floor(Math.max(pa.x, pb.x, pc.x) / cellSize);
    const minZ = Math.floor(Math.min(pa.z, pb.z, pc.z) / cellSize), maxZ = Math.floor(Math.max(pa.z, pb.z, pc.z) / cellSize);
    for (let x = minX; x <= maxX; x++) for (let z = minZ; z <= maxZ; z++) {
      const key = `${x}:${z}`, list = crownCells.get(key);
      if (list) list.push(index); else crownCells.set(key, [index]);
    }
  });
  function summitHeight(x: number, z: number): number | undefined {
    const candidates = crownCells.get(`${Math.floor(x / cellSize)}:${Math.floor(z / cellSize)}`) || [];
    for (const face of candidates) {
      const [a, b, c] = capFaces[face], pa = capPoints[a], pb = capPoints[b], pc = capPoints[c];
      const denominator = (pb.z - pc.z) * (pa.x - pc.x) + (pc.x - pb.x) * (pa.z - pc.z);
      if (Math.abs(denominator) < 1e-9) continue;
      const wa = ((pb.z - pc.z) * (x - pc.x) + (pc.x - pb.x) * (z - pc.z)) / denominator;
      const wb = ((pc.z - pa.z) * (x - pc.x) + (pa.x - pc.x) * (z - pc.z)) / denominator;
      const wc = 1 - wa - wb;
      if (wa >= -1e-7 && wb >= -1e-7 && wc >= -1e-7) return pa.y * wa + pb.y * wb + pc.y * wc;
    }
    return undefined;
  }

  // Local fractured plates grow out of the continuous wall. One merged mesh,
  // not a ring of boxes; their backs are embedded in the parent escarpment.
  const slabVertices: number[] = [], slabColors: number[] = [], slabUvs: number[] = [], slabIndices: number[] = [];
  for (let i = 0; i < 53; i++) {
    const u = rng(), t = .23 + rng() * .61, { point: p, normal, tangent } = surface(u, t);
    const exposed = 1 - shoulderAt(p.x);
    if (exposed < .32) continue;
    const width = (3.7 + rng() * 5.3) * (.4 + exposed * .6), height = (4.5 + rng() * 8.5) * exposed, projection = (.55 + rng() * 1.3) * exposed;
    const profile = [[-.48, -.44], [-.51, .21], [-.23, .49], [.28, .43], [.49, .12], [.39, -.48]];
    const offset = slabVertices.length / 3;
    for (let side = 0; side < 2; side++) profile.forEach(([x, y], corner) => {
      const q = p.clone().addScaledVector(tangent, x * width).addScaledVector(UP, y * height)
        .addScaledVector(normal, side ? -.85 : projection * (.76 + hash(i, corner) * .24));
      slabVertices.push(q.x, q.y, q.z); slabColors.push(.84, .835, .79); slabUvs.push(u + x * width / perimeter, t + y * height / 50);
    });
    for (let j = 1; j < 5; j++) slabIndices.push(offset, offset + j + 1, offset + j);
    for (let j = 0; j < 6; j++) { const k = (j + 1) % 6; slabIndices.push(offset + j, offset + k, offset + 6 + j, offset + k, offset + 6 + k, offset + 6 + j); }
  }
  const slabs = new THREE.BufferGeometry(); slabs.setAttribute('position', new THREE.Float32BufferAttribute(slabVertices, 3));
  slabs.setAttribute('color', new THREE.Float32BufferAttribute(slabColors, 3)); slabs.setAttribute('uv', new THREE.Float32BufferAttribute(slabUvs, 2)); slabs.setIndex(slabIndices);
  addMesh(group, 'Lajas y desprendimientos adheridos al escarpe', finish(slabs.toNonIndexed()), stoneMaterial);

  const terrain = new THREE.PlaneGeometry(428, 348, 110, 90); terrain.rotateX(-Math.PI / 2);
  const tp = terrain.attributes.position, groundColors = new Float32Array(tp.count * 3), groundColor = new THREE.Color();
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i), n = noise(x * .055, z * .055); tp.setY(i, terrainHeight(x, z));
    groundColor.setHSL(.185 + n * .035, .22 + n * .12, .24 + n * .12); groundColors.set([groundColor.r, groundColor.g, groundColor.b], i * 3);
  }
  terrain.setAttribute('color', new THREE.BufferAttribute(groundColors, 3));
  addMesh(group, 'Talud continuo — terreno y raíces al mismo nivel', finish(terrain), new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 1 }));

  const outline = footprint.getSpacedPoints(192);
  function insideRock(x: number, z: number) {
    let inside = false;
    for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
      const a = outline[i], b = outline[j];
      if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) inside = !inside;
    }
    return inside;
  }
  const leafGeometry = new THREE.IcosahedronGeometry(1, 1), lp = leafGeometry.attributes.position;
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i), y = lp.getY(i), z = lp.getZ(i), variation = .92 + hash(x * 8 + y, z * 9) * .16;
    lp.setXYZ(i, x * variation, y * variation, z * variation);
  }
  finish(leafGeometry);
  const foliageMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 });
  const woodMaterial = new THREE.MeshStandardMaterial({ color: '#51483a', roughness: 1 });
  const trunkGeometry = new THREE.CylinderGeometry(.16, .27, 1, 6);
  interface Plant { point: THREE.Vector3; height: number; crown: number; summit?: boolean }
  const plants: Plant[] = [];
  // The forest roots are sampled on the same height field used by the terrain.
  for (let attempts = 0; plants.length < 840 && attempts < 14000; attempts++) {
    const x = (rng() - .5) * 366, z = (rng() - .5) * 282;
    if (insideRock(x, z) || (x / 185) ** 2 + (z / 149) ** 2 > 1 || rng() > .91 - Math.abs(x) * .0012) continue;
    const y = terrainHeight(x, z), height = 5.2 + rng() * 6.2;
    plants.push({ point: new THREE.Vector3(x, y - .20, z), height, crown: .9 + rng() * .18 });
  }
  let summitPlants = 0;
  // A jittered grid gives the upper scrub a connected cover, with rock clearings.
  // Every root is sampled on the final triangle, including the descending side.
  for (let z = -53; z <= 48; z += 6.2) for (let x = -124; x <= 173; x += 6.2) {
    const px = x + (rng() - .5) * 4.5, pz = z + (rng() - .5) * 4.5;
    if (noise(px * .055 + 9, pz * .061) < .24 || rng() < .08) continue;
    const ground = summitHeight(px, pz);
    if (ground === undefined) continue;
    plants.push({ point: new THREE.Vector3(px, ground - .25, pz), height: 2.1 + rng() * 3.6, crown: 1.35 + rng() * .2, summit: true });
    summitPlants++;
  }
  for (let i = 0; i < 47; i++) {
    const u = rng(), { point: p, normal } = surface(u, .21 + rng() * .7);
    plants.push({ point: p.addScaledVector(normal, -.26).addScaledVector(UP, -.55), height: .85 + rng() * 1.7, crown: .84 });
  }
  const leaves = new THREE.InstancedMesh(leafGeometry, foliageMaterial, plants.length * 4);
  const trunks = new THREE.InstancedMesh(trunkGeometry, woodMaterial, plants.length);
  leaves.name = 'Monte nativo y arbustos — copas pequeñas entrelazadas'; trunks.name = 'Troncos arraigados';
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  plants.forEach(({ point, height, crown, summit }, index) => {
    dummy.position.copy(point).addScaledVector(UP, height * .39); dummy.rotation.set(0, rng() * TAU, 0);
    dummy.scale.set(Math.max(.35, height * .13), height * .78, Math.max(.35, height * .13)); dummy.updateMatrix(); trunks.setMatrixAt(index, dummy.matrix);
    for (let lobe = 0; lobe < 4; lobe++) {
      const azimuth = lobe * 2.4 + index * .73, spread = height * (lobe ? .24 : .05);
      dummy.position.set(point.x + Math.cos(azimuth) * spread, point.y + height * (lobe ? .65 + rng() * .16 : .88), point.z + Math.sin(azimuth) * spread);
      dummy.rotation.set(rng() * .35, rng() * TAU, rng() * .25);
      dummy.scale.set(height * (.38 + rng() * .09) * crown, height * (.27 + rng() * .07), height * (.36 + rng() * .10) * crown);
      dummy.updateMatrix(); leaves.setMatrixAt(index * 4 + lobe, dummy.matrix);
      const n = hash(index * .3, lobe + 4); color.setHSL(summit ? .22 + n * .055 : .17 + n * .09, summit ? .32 + n * .17 : .22 + n * .18, summit ? .22 + n * .12 : .18 + n * .14); leaves.setColorAt(index * 4 + lobe, color);
    }
  });
  leaves.castShadow = leaves.receiveShadow = trunks.castShadow = trunks.receiveShadow = true;
  leaves.computeBoundingBox(); leaves.computeBoundingSphere(); trunks.computeBoundingBox(); trunks.computeBoundingSphere(); group.add(trunks, leaves);

  const boulderGeometry = new THREE.IcosahedronGeometry(1, 1), bp = boulderGeometry.attributes.position;
  for (let i = 0; i < bp.count; i++) { const x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i), d = .83 + hash(x * 13, z * 11 + y) * .29; bp.setXYZ(i, x * d, y * d, z * d); }
  finish(boulderGeometry);
  const boulders = new THREE.InstancedMesh(boulderGeometry, new THREE.MeshStandardMaterial({ color: '#929082', roughness: 1 }), 137);
  boulders.name = 'Bloques de talud parcialmente enterrados';
  for (let i = 0; i < boulders.count; i++) {
    const u = rng(), edge = surface(u, 0), offset = 2 + rng() * 14, p = edge.point.addScaledVector(edge.normal, offset), size = .65 + rng() * 2.2;
    dummy.position.set(p.x, terrainHeight(p.x, p.z) + size * .12, p.z); dummy.rotation.set(rng(), rng() * TAU, rng() * .5);
    dummy.scale.set(size * 1.3, size * .65, size); dummy.updateMatrix(); boulders.setMatrixAt(i, dummy.matrix);
    color.setHSL(.115, .07 + rng() * .08, .31 + rng() * .11); boulders.setColorAt(i, color);
  }
  boulders.castShadow = boulders.receiveShadow = true; boulders.computeBoundingBox(); boulders.computeBoundingSphere(); group.add(boulders);
  group.userData.arequita = { reconstruction: 'Photographic interpretation; not surveyed', visibleCliffWidth: 303, crestHeight: 90, forestPlants: plants.length, summitPlants, primaryJoints: joints.length };
  // Radius describes the outcrop and forest; the low blending terrain skirt is
  // intentionally wider. A near-front three-quarter view keeps its long profile.
  return { group, target: new THREE.Vector3(14, 43, 6), bounds: { radius: 205, height: 98 }, groundY: 0, cameraDirection: new THREE.Vector3(.07, .12, 1).normalize() };
}
