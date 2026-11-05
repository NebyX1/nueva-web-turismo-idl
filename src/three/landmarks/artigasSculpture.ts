import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createArtigasHead } from './artigasHead';
import { projectStoneUV, type Point3 } from './artigasGeometry';

export interface ArtigasMaterials {
  stone: THREE.MeshStandardMaterial;
  cloth: THREE.MeshStandardMaterial;
  detail: THREE.MeshStandardMaterial;
  recess: THREE.MeshStandardMaterial;
  plinth: THREE.MeshStandardMaterial;
  plinthBase: THREE.MeshStandardMaterial;
}

const point = (p: Point3) => new THREE.Vector3(...p);

function add(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, name: string) {
  if (!geometry.attributes.uv) projectStoneUV(geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function rounded(parent: THREE.Group, size: Point3, radius: number, position: Point3, material: THREE.Material, name: string) {
  const mesh = add(parent, new RoundedBoxGeometry(...size, 3, radius), material, name);
  mesh.position.set(...position);
  return mesh;
}

function stroke(parent: THREE.Group, material: THREE.Material, name: string, points: Point3[], radius: number, segments = 24) {
  return add(
    parent,
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(point)), segments, radius, 8, false),
    material,
    name,
  );
}

function profile(points: [number, number][], thickness: number, bevel = 0.04) {
  const shape = new THREE.Shape();
  shape.moveTo(...points[0]);
  for (let i = 1; i < points.length; i++) shape.lineTo(...points[i]);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    steps: 1,
  });
  geometry.translate(0, 0, -thickness / 2);
  return geometry;
}

type CrossSection = {
  center: Point3;
  rx: number;
  ry: number;
  rz: number;
  pectoral?: boolean;
  crest?: number;
};

/** Smooth anatomical lofting along cross-sections with computed vertex normals */
function loftSections(sections: CrossSection[], radialSegments = 32): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < sections.length; r++) {
    const s = sections[r];
    const [cx, cy, cz] = s.center;

    for (let c = 0; c <= radialSegments; c++) {
      const angle = (c / radialSegments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      let dy = sin * s.ry;
      let dz = cos * s.rz;
      let dx = 0;

      // Pectoral split on horse chest front
      if (s.pectoral && cos > 0.1) {
        const pect = Math.cos(angle * 2);
        dx -= 0.22 * Math.max(0, pect);
      }

      // Arched crest on horse neck top
      if (s.crest && sin > 0.2) {
        dy += s.crest * Math.sin(angle);
      }

      positions.push(cx + dx, cy + dy, cz + dz);

      if (r < sections.length - 1 && c < radialSegments) {
        const i0 = r * (radialSegments + 1) + c;
        const i1 = i0 + 1;
        const i2 = (r + 1) * (radialSegments + 1) + c;
        const i3 = i2 + 1;
        indices.push(i0, i1, i2, i1, i3, i2);
      }
    }
  }

  // Cap start
  const firstCenter = positions.length / 3;
  positions.push(...sections[0].center);
  for (let c = 0; c < radialSegments; c++) {
    indices.push(c, firstCenter, c + 1);
  }

  // Cap end
  const lastCenter = positions.length / 3;
  positions.push(...sections[sections.length - 1].center);
  const lastRow = (sections.length - 1) * (radialSegments + 1);
  for (let c = 0; c < radialSegments; c++) {
    indices.push(lastRow + c, lastRow + c + 1, lastCenter);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  projectStoneUV(geo);
  return geo;
}

/**
 * Powerful Criollo horse of the Cerro Artigas Monument:
 * Broad muscular chest with twin pectorals, arched crest neck,
 * sculpted mane, tucked noble head, strong legs and hooves.
 */
function horse(materials: ArtigasMaterials) {
  const group = new THREE.Group();
  group.name = 'Caballo — anatomía fusionada y cabeza inclinada';

  // 1. Muscular Body (Torso, barrel, withers, croup)
  const bodySections: CrossSection[] = [
    { center: [-2.55, 6.35, 0], rx: 0.15, ry: 1.15, rz: 0.88, pectoral: true },
    { center: [-2.35, 6.45, 0], rx: 0.20, ry: 1.45, rz: 1.18, pectoral: true },
    { center: [-2.05, 6.60, 0], rx: 0.22, ry: 1.58, rz: 1.28, pectoral: true },
    { center: [-1.65, 6.85, 0], rx: 0.25, ry: 1.62, rz: 1.32 }, // Withers base
    { center: [-1.15, 6.75, 0], rx: 0.28, ry: 1.58, rz: 1.34 },
    { center: [-0.55, 6.55, 0], rx: 0.32, ry: 1.52, rz: 1.35 }, // Mid barrel
    { center: [0.15, 6.45, 0], rx: 0.34, ry: 1.48, rz: 1.32 },
    { center: [0.85, 6.50, 0], rx: 0.32, ry: 1.50, rz: 1.30 }, // Flank
    { center: [1.55, 6.70, 0], rx: 0.30, ry: 1.56, rz: 1.32 }, // Start of croup
    { center: [2.15, 6.88, 0], rx: 0.28, ry: 1.58, rz: 1.34 }, // Muscular croup
    { center: [2.65, 6.72, 0], rx: 0.24, ry: 1.48, rz: 1.25 }, // Croup apex
    { center: [3.05, 6.45, 0], rx: 0.18, ry: 1.25, rz: 0.95 }, // Rear buttocks
    { center: [3.25, 6.15, 0], rx: 0.12, ry: 0.95, rz: 0.65 },
  ];
  add(group, loftSections(bodySections), materials.stone, 'Cuerpo equino — pecho musculoso costillar y grupa');

  // 2. Strongly Arched Neck (Cuello arqueado característico de Minas)
  const neckSections: CrossSection[] = [
    { center: [-1.85, 7.30, 0], rx: 0.35, ry: 1.45, rz: 1.15, crest: 0.25 },
    { center: [-2.25, 7.85, 0], rx: 0.32, ry: 1.40, rz: 1.05, crest: 0.32 },
    { center: [-2.68, 8.48, 0], rx: 0.28, ry: 1.32, rz: 0.95, crest: 0.38 },
    { center: [-3.12, 9.15, 0], rx: 0.25, ry: 1.20, rz: 0.85, crest: 0.40 },
    { center: [-3.52, 9.78, 0], rx: 0.22, ry: 1.02, rz: 0.74, crest: 0.35 },
    { center: [-3.85, 10.25, 0], rx: 0.18, ry: 0.82, rz: 0.62, crest: 0.22 }, // Poll (nuca)
  ];
  add(group, loftSections(neckSections), materials.stone, 'Cuello equino — cresta fuertemente arqueada');

  // 3. Noble Tucked Head (Cabeza inclinada, ganacha y perfil recto/acarnerado)
  const headSections: CrossSection[] = [
    { center: [-3.95, 10.15, 0], rx: 0.22, ry: 0.72, rz: 0.58 },
    { center: [-4.22, 9.65, 0], rx: 0.25, ry: 0.82, rz: 0.64 }, // Wide ganacha / jaw
    { center: [-4.48, 9.20, 0], rx: 0.24, ry: 0.78, rz: 0.58 },
    { center: [-4.72, 8.78, 0], rx: 0.20, ry: 0.65, rz: 0.48 }, // Nasal bridge
    { center: [-4.95, 8.42, 0], rx: 0.16, ry: 0.52, rz: 0.38 },
    { center: [-5.18, 8.12, 0], rx: 0.12, ry: 0.38, rz: 0.28 }, // Muzzle & lips
    { center: [-5.28, 8.00, 0], rx: 0.08, ry: 0.22, rz: 0.20 },
  ];
  add(group, loftSections(headSections), materials.stone, 'Cabeza del caballo — fisonomía noble con quijada amplia');

  // Ears: alert lancet ears pointing forward/up
  for (const side of [-1, 1]) {
    const earShape = new THREE.Shape();
    earShape.moveTo(-0.18, 0);
    earShape.bezierCurveTo(-0.25, 0.42, -0.14, 0.95, 0.06, 1.22);
    earShape.bezierCurveTo(0.24, 0.92, 0.28, 0.40, 0.18, 0);
    earShape.quadraticCurveTo(0, -0.10, -0.18, 0);
    const earGeo = new THREE.ExtrudeGeometry(earShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSize: 0.045,
      bevelThickness: 0.04,
      bevelSegments: 3,
    });
    earGeo.translate(0, 0, -0.07);
    const earMesh = add(group, earGeo, materials.stone, 'Oreja equina lanceolada');
    earMesh.position.set(-3.82, 10.70, side * 0.42);
    earMesh.rotation.set(0, side * 0.15, -0.22);
    earMesh.scale.set(0.82, 0.82, 0.92);

    // Sculpted stone eye with eyelids
    const eye = add(group, new THREE.SphereGeometry(1, 16, 12), materials.detail, 'Ojo equino en relieve pétreo');
    eye.scale.set(0.085, 0.095, 0.035);
    eye.position.set(-4.30, 9.42, side * 0.56);
    eye.rotation.z = -0.28;

    stroke(group, materials.stone, 'Párpado superior tallado', [
      [-4.42, 9.50, side * 0.58],
      [-4.30, 9.56, side * 0.60],
      [-4.18, 9.51, side * 0.57],
    ], 0.028, 12);

    // Carved nostril and lips
    stroke(group, materials.recess, 'Fosa nasal hundida', [
      [-5.12, 8.28, side * 0.32],
      [-5.24, 8.22, side * 0.36],
      [-5.18, 8.12, side * 0.34],
    ], 0.032, 12);

    stroke(group, materials.detail, 'Comisura de la boca', [
      [-5.28, 7.96, side * 0.22],
      [-5.12, 7.94, side * 0.34],
      [-4.92, 7.98, side * 0.38],
    ], 0.018, 12);
  }

  // 4. Sculpted Mane (Crin tallada con mechones ondulados según foto de perfil)
  for (const side of [-1, 1]) {
    for (let lock = 0; lock < 7; lock++) {
      const t = lock / 6;
      const startX = -2.05 - t * 1.85;
      const startY = 7.90 + t * 2.50;
      const endX = startX + 0.18 + Math.sin(t * 3.1) * 0.12;
      const endY = startY - 0.75 - t * 0.25;
      const zOffset = side * (0.62 + t * 0.18);

      stroke(group, materials.stone, 'Mechón de crin ondulado', [
        [startX, startY, side * 0.15],
        [startX - 0.10, startY - 0.25, zOffset * 0.65],
        [endX, endY, zOffset],
      ], 0.085 - t * 0.015, 16);
    }
  }

  // 5. Four Sturdy Anatomical Legs and Hooves firmly planted on plinth
  const frontX = -2.05;
  const rearX = 2.25;

  for (const side of [-1, 1]) {
    const legZ = side * 0.74;

    // --- FRONT LEG ---
    // Muscular forearm (antebrazo)
    stroke(group, materials.stone, 'Antebrazo delantero musculoso', [
      [frontX + 0.15, 6.20, legZ * 0.92],
      [frontX + 0.05, 5.00, legZ],
      [frontX - 0.05, 3.85, legZ],
    ], 0.28, 18);

    // Carpal knee (rodilla con articulación)
    const frontKnee = add(group, new THREE.SphereGeometry(1, 16, 12), materials.stone, 'Rodilla delantera');
    frontKnee.scale.set(0.24, 0.28, 0.24);
    frontKnee.position.set(frontX - 0.05, 3.80, legZ);

    // Cannon bone (caña vertical sólida)
    stroke(group, materials.stone, 'Caña delantera sólida', [
      [frontX - 0.05, 3.70, legZ],
      [frontX - 0.04, 2.30, legZ],
      [frontX - 0.03, 1.45, legZ],
    ], 0.17, 16);

    // Fetlock & pastern (menudillo y cuartilla)
    const frontFetlock = add(group, new THREE.SphereGeometry(1, 14, 10), materials.stone, 'Menudillo delantero');
    frontFetlock.scale.set(0.20, 0.22, 0.19);
    frontFetlock.position.set(frontX - 0.03, 1.40, legZ);

    stroke(group, materials.stone, 'Cuartilla delantera', [
      [frontX - 0.03, 1.35, legZ],
      [frontX - 0.12, 0.75, legZ],
    ], 0.16, 10);

    // Solid stone hoof (casco biselado con pinza y talón apoyado en el pedestal)
    const frontHoof = add(
      group,
      profile([
        [-0.32, 0.05],
        [0.28, 0.05],
        [0.24, 0.35],
        [0.08, 0.62],
        [-0.18, 0.60],
        [-0.34, 0.32],
      ], 0.58, 0.05),
      materials.stone,
      'Casco delantero firme',
    );
    frontHoof.position.set(frontX - 0.08, 0.0, legZ);

    // --- REAR LEG ---
    // Muscular gaskin / thigh (muslo y babilla)
    stroke(group, materials.stone, 'Muslo trasero potente', [
      [rearX - 0.12, 6.20, legZ * 0.95],
      [rearX - 0.28, 4.90, legZ * 1.02],
      [rearX + 0.18, 3.45, legZ],
    ], 0.34, 18);

    // Hock joint (corvejón angulado pronunciado hacia atrás)
    const rearHock = add(group, new THREE.SphereGeometry(1, 16, 12), materials.stone, 'Corvejón trasero angulado');
    rearHock.scale.set(0.26, 0.32, 0.24);
    rearHock.position.set(rearX + 0.22, 3.40, legZ);

    // Rear cannon bone (caña trasera vertical)
    stroke(group, materials.stone, 'Caña trasera sólida', [
      [rearX + 0.18, 3.25, legZ],
      [rearX + 0.14, 2.20, legZ],
      [rearX + 0.10, 1.42, legZ],
    ], 0.17, 16);

    // Rear fetlock and pastern
    const rearFetlock = add(group, new THREE.SphereGeometry(1, 14, 10), materials.stone, 'Menudillo trasero');
    rearFetlock.scale.set(0.20, 0.22, 0.19);
    rearFetlock.position.set(rearX + 0.10, 1.38, legZ);

    stroke(group, materials.stone, 'Cuartilla trasera', [
      [rearX + 0.10, 1.32, legZ],
      [rearX + 0.02, 0.75, legZ],
    ], 0.16, 10);

    // Rear hoof
    const rearHoof = add(
      group,
      profile([
        [-0.30, 0.05],
        [0.28, 0.05],
        [0.24, 0.35],
        [0.06, 0.62],
        [-0.18, 0.60],
        [-0.32, 0.30],
      ], 0.58, 0.05),
      materials.stone,
      'Casco trasero firme',
    );
    rearHoof.position.set(rearX + 0.05, 0.0, legZ);
  }

  // 6. Full Thick Stone Tail (Cola gruesa y pesada cayendo entre las ancas)
  stroke(group, materials.stone, 'Cola equina pesada', [
    [3.10, 6.95, 0.10],
    [3.55, 6.15, 0.14],
    [3.72, 4.80, 0.18],
    [3.62, 3.40, 0.20],
    [3.70, 2.15, 0.22],
  ], 0.32, 28);

  for (let i = 0; i < 5; i++) {
    const zOffset = (i - 2) * 0.09;
    stroke(group, materials.detail, 'Surco vertical de la cola', [
      [3.35, 6.45, zOffset + 0.18],
      [3.68, 4.85, zOffset + 0.22],
      [3.58, 3.40, zOffset + 0.24],
      [3.66, 2.25, zOffset + 0.22],
    ], 0.022, 24);
  }

  return group;
}

/**
 * General José Gervasio Artigas:
 * Upright, dignified hero wrapped in his Poncho Criollo.
 * Folds cascade over shoulders, chest, and rest naturally on the horse's croup.
 * High collar joins seamlessly with the compact sculpted head.
 */
function rider(materials: ArtigasMaterials) {
  const group = new THREE.Group();
  group.name = 'José Artigas — torso inclinado abrigo manos y botas';

  // 1. Upright Military Torso
  const torsoSections: CrossSection[] = [
    { center: [0.12, 8.45, 0], rx: 0.25, ry: 0.65, rz: 0.85 }, // Pelvis / saddle seat
    { center: [-0.05, 9.60, 0], rx: 0.28, ry: 0.85, rz: 0.95 },
    { center: [-0.25, 10.75, 0], rx: 0.32, ry: 0.95, rz: 1.12 }, // Broad chest & back
    { center: [-0.45, 11.65, 0], rx: 0.30, ry: 0.82, rz: 1.22 }, // Broad shoulders
    { center: [-0.65, 12.20, 0], rx: 0.22, ry: 0.45, rz: 0.68 }, // High military collar base
    { center: [-0.75, 12.45, 0], rx: 0.18, ry: 0.32, rz: 0.52 }, // Upper collar meeting neck
  ];
  add(group, loftSections(torsoSections), materials.cloth, 'Torso militar y casaca de Artigas');

  // 2. Majestic Poncho Criollo (Manto de paño pesado sobre hombros y grupa)
  // Back poncho drape cascading down and resting across the horse's croup (Image 2 & 3)
  const backPonchoSections: CrossSection[] = [
    { center: [-0.20, 11.55, 0], rx: 0.18, ry: 0.45, rz: 1.25 }, // Across shoulders
    { center: [0.45, 10.85, 0], rx: 0.25, ry: 0.65, rz: 1.32 },
    { center: [1.15, 9.95, 0], rx: 0.32, ry: 0.82, rz: 1.38 },   // Mid back slope
    { center: [1.85, 8.95, 0], rx: 0.35, ry: 0.85, rz: 1.42 },   // Flowing over saddle rear
    { center: [2.45, 8.05, 0], rx: 0.28, ry: 0.55, rz: 1.36 },   // Resting on horse croup
    { center: [2.85, 7.55, 0], rx: 0.15, ry: 0.30, rz: 1.15 },   // Hem on croup
  ];
  add(group, loftSections(backPonchoSections), materials.cloth, 'Poncho criollo apoyado en la grupa');

  // Sculpted vertical and diagonal folds along the poncho
  for (const side of [-1, 1]) {
    for (let f = 0; f < 5; f++) {
      const zFold = side * (0.42 + f * 0.22);
      stroke(group, materials.detail, 'Pliegue vertical del poncho', [
        [-0.42, 11.75, zFold * 0.85],
        [0.25 + f * 0.15, 10.60 - f * 0.10, zFold],
        [1.20 + f * 0.22, 9.40 - f * 0.08, zFold * 1.05],
        [2.10 + f * 0.15, 8.30, zFold * 1.02],
      ], 0.042, 20);
    }

    // Front draped poncho folds framing chest and arms
    stroke(group, materials.detail, 'Pliegue frontal del poncho', [
      [-0.58, 12.05, side * 0.38],
      [-0.85, 11.15, side * 0.58],
      [-0.92, 10.10, side * 0.48],
    ], 0.048, 18);
  }

  // 3. Officer's Arms and Hands (Left hand holds reins, right hand rests across chest/poncho)
  for (const side of [-1, 1]) {
    if (side < 0) {
      // Left arm: flexed forward holding the reins firmly
      stroke(group, materials.cloth, 'Brazo izquierdo sosteniendo riendas', [
        [-0.45, 11.55, -1.05],
        [-0.95, 10.45, -1.02],
        [-1.45, 9.75, -0.62],
        [-1.85, 9.45, -0.38],
      ], 0.22, 18);

      // Left hand
      const hand = add(group, new THREE.SphereGeometry(1, 14, 10), materials.stone, 'Mano izquierda sobre las riendas');
      hand.scale.set(0.22, 0.18, 0.20);
      hand.position.set(-1.92, 9.42, -0.36);
    } else {
      // Right arm: bent across the chest/poncho with hand resting serenely
      stroke(group, materials.cloth, 'Brazo derecho cruzado serenamente', [
        [-0.45, 11.55, 1.05],
        [-0.88, 10.45, 0.95],
        [-1.15, 9.95, 0.52],
        [-1.10, 9.80, 0.18],
      ], 0.22, 18);

      // Right hand resting against poncho
      const hand = add(group, new THREE.SphereGeometry(1, 14, 10), materials.stone, 'Mano derecha reposando sobre el manto');
      hand.scale.set(0.20, 0.16, 0.22);
      hand.position.set(-1.12, 9.78, 0.14);
    }

    // 4. Seated Legs & Tall Riding Boots (Botas de montar criollas)
    const legZ = side * 1.45;

    // Thigh angled forward along horse barrel
    stroke(group, materials.cloth, 'Muslo del jinete en montura', [
      [0.08, 8.45, side * 0.65],
      [-0.32, 7.85, side * 1.15],
      [-0.72, 7.15, legZ],
    ], 0.32, 16);

    // Knee joint
    const knee = add(group, new THREE.SphereGeometry(1, 14, 10), materials.cloth, 'Rodilla del jinete');
    knee.scale.set(0.28, 0.28, 0.26);
    knee.position.set(-0.75, 7.10, legZ);

    // Lower leg / boot shaft descending vertically
    stroke(group, materials.cloth, 'Caña de la bota de montar', [
      [-0.75, 7.00, legZ],
      [-0.72, 5.95, legZ],
      [-0.70, 5.25, legZ],
    ], 0.22, 14);

    // Boot foot with defined heel, instep and toe pointing forward
    const boot = add(
      group,
      profile([
        [-1.38, 4.88],
        [-0.22, 4.88],
        [-0.20, 5.22],
        [-0.48, 5.48],
        [-0.82, 5.46],
        [-1.08, 5.24],
        [-1.36, 5.12],
      ], 0.44, 0.05),
      materials.cloth,
      'Bota de montar con empeine y espuela',
    );
    boot.position.z = legZ;

    // Stirrup (Estribo criollo) & leather strap (ación)
    stroke(group, materials.detail, 'Estribo de metal pétreo', [
      [-1.34, 5.42, legZ],
      [-1.36, 4.72, legZ + side * 0.04],
      [-0.24, 4.72, legZ + side * 0.04],
      [-0.22, 5.42, legZ],
    ], 0.042, 22);

    stroke(group, materials.detail, 'Ación del estribo', [
      [-0.20, 7.65, side * 1.12],
      [-0.52, 6.45, legZ * 0.98],
      [-0.72, 5.38, legZ],
    ], 0.045, 18);
  }

  // 5. Heroic Compact Head of Artigas placed proudly at collar
  const head = createArtigasHead(materials.stone);
  head.position.set(-0.82, 12.38, 0);
  head.rotation.set(0, 0.05, 0.12); // Noble, resolute forward gaze
  head.scale.set(1.05, 1.02, 1.05);
  group.add(head);

  return group;
}

/** Tack, saddle, blanket, bridle and reins */
function tack(materials: ArtigasMaterials) {
  const group = new THREE.Group();
  group.name = 'Montura alforjas riendas y estribos';

  // Saddle / recado criollo
  rounded(group, [3.20, 0.28, 2.45], 0.12, [0.08, 7.82, 0], materials.cloth, 'Montura criolla / recado bajo el jinete');

  for (const side of [-1, 1]) {
    // Saddle blanket / carona
    const blanket = add(
      group,
      profile([
        [-1.42, 6.22],
        [1.48, 6.22],
        [1.64, 6.55],
        [1.52, 7.82],
        [-1.28, 7.92],
        [-1.50, 7.50],
      ], 0.14, 0.055),
      materials.cloth,
      'Manta de montura con borde curvo',
    );
    blanket.position.z = side * 1.24;

    // Girth (cincha) circling belly
    stroke(group, materials.detail, 'Cincha', [
      [-0.52, 7.65, side * 0.92],
      [-0.60, 6.70, side * 1.24],
      [-0.52, 5.58, side * 1.05],
    ], 0.045, 20);

    // Bridle straps (carrillera, muserola)
    stroke(group, materials.detail, 'Carrillera de la brida', [
      [-3.95, 10.35, side * 0.48],
      [-4.32, 9.45, side * 0.58],
      [-4.65, 8.82, side * 0.52],
      [-5.12, 8.18, side * 0.38],
    ], 0.038, 24);

    stroke(group, materials.detail, 'Muserola', [
      [-5.18, 8.42, side * 0.32],
      [-4.98, 8.42, side * 0.48],
      [-4.68, 8.44, side * 0.48],
    ], 0.036, 16);

    // Reins connecting bit to Artigas's left hand
    stroke(group, materials.detail, 'Rienda continua hasta la mano de Artigas', [
      [-5.15, 8.12, side * 0.32],
      [-4.35, 8.45, side * 0.65],
      [-3.12, 8.85, side * 0.68],
      [-1.92, 9.42, -0.36 + (side > 0 ? 0.08 : -0.08)],
    ], 0.032, 36);
  }

  // Browband (frontalera)
  stroke(group, materials.detail, 'Frontalera', [
    [-4.15, 10.05, -0.48],
    [-4.32, 10.12, 0],
    [-4.15, 10.05, 0.48],
  ], 0.042, 20);

  return group;
}

/** Stepped rectangular concrete pedestal of the monument in Cerro Artigas */
function pedestal(materials: ArtigasMaterials) {
  const group = new THREE.Group();
  group.name = 'Pedestal rectangular escalonado de hormigón';

  // Base lower rectangular foundation
  rounded(group, [14.40, 0.38, 6.20], 0.08, [0.05, 0.19, 0], materials.plinthBase, 'Base inferior rectangular');

  // Middle stepped plinth block
  rounded(group, [13.40, 0.50, 5.40], 0.07, [0.05, 0.63, 0], materials.plinth, 'Dado intermedio escalonado');

  // Main concrete pedestal block
  rounded(group, [12.50, 0.95, 4.80], 0.065, [0.05, 1.20, 0], materials.plinth, 'Dado principal de hormigón claro');

  // Upper coping ledge where hooves stand
  rounded(group, [12.80, 0.20, 5.00], 0.055, [0.05, 1.68, 0], materials.plinthBase, 'Cornisa y losa de apoyo superior');

  // Horizontal stone dressing joints
  for (const side of [-1, 1]) {
    stroke(group, materials.detail, 'Junta horizontal del pedestal', [
      [-6.10, 0.88, side * 2.41],
      [0, 0.88, side * 2.41],
      [6.10, 0.88, side * 2.41],
    ], 0.012, 10);
  }

  return group;
}

/**
 * Cerro Artigas Equestrian Monument:
 * Monumental statue sculpted by Stelio Belloni and Alberto Savio.
 * General José Artigas discovered with Poncho Criollo atop his calm Criollo horse.
 */
export function createArtigasSculpture(materials: ArtigasMaterials) {
  const monument = new THREE.Group();
  monument.name = 'Monumento de hormigón claro — silueta continua';

  monument.add(pedestal(materials));

  const anatomy = new THREE.Group();
  anatomy.name = 'Escultura ecuestre — reinterpretación anatómica integral';
  // Positioned so hooves stand squarely on top plinth slab (y = 1.78)
  anatomy.position.y = 1.78;
  anatomy.add(horse(materials), tack(materials), rider(materials));

  monument.add(anatomy);

  monument.userData.reference = 'Fotografías de referencia del Monumento en Cerro Artigas (Minas)';
  monument.userData.features = [
    'rostro heroico y compacto de Artigas',
    'poncho criollo con pliegues apoyado sobre la grupa',
    'caballo criollo de cuello fuertemente arqueado',
    'pecho ancho con pectorales definidos',
    'crin tallada con mechones ondulados',
    'patas anatómicas y cascos firmes',
    'pedestal rectangular escalonado de hormigón',
  ];

  return monument;
}
