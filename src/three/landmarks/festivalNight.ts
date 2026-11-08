import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export interface FestivalOptions {
  name: string;
  stage: THREE.Vector3;
  width?: number;
  depth?: number;
  people: readonly { x: number; z: number }[];
  groundAt(x: number, z: number): number;
  campfires?: readonly { x: number; z: number }[];
  fireworks?: boolean;
  seed?: number;
}
const Y = new THREE.Vector3(0, 1, 0);
function rng(seed: number) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
const surface = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: .72, ...extra });
function add(group: THREE.Group, geo: THREE.BufferGeometry, material: THREE.Material, name: string, position = new THREE.Vector3()) {
  const mesh = new THREE.Mesh(geo, material); mesh.name = name; mesh.position.copy(position); mesh.receiveShadow = true; group.add(mesh); return mesh;
}
function box(group: THREE.Group, material: THREE.Material, size: number[], p: number[], name: string) {
  return add(group, new THREE.BoxGeometry(size[0], size[1], size[2]), material, name, new THREE.Vector3(...p));
}
function beam(group: THREE.Group, material: THREE.Material, a: THREE.Vector3, b: THREE.Vector3, radius = .06, name = 'Truss') {
  const direction = b.clone().sub(a), mesh = add(group, new THREE.CylinderGeometry(radius, radius, direction.length(), 5), material, name, a.clone().lerp(b, .5));
  mesh.quaternion.setFromUnitVectors(Y, direction.normalize()); return mesh;
}
function batch(group: THREE.Group) {
  const buckets = new Map<THREE.Material, THREE.Mesh[]>();
  for (const mesh of [...group.children]) if (mesh instanceof THREE.Mesh && !(mesh instanceof THREE.InstancedMesh) && !Array.isArray(mesh.material)) {
    const list = buckets.get(mesh.material) ?? []; list.push(mesh); buckets.set(mesh.material, list);
  }
  for (const [material, meshes] of buckets) {
    if (meshes.length < 2) continue;
    const pieces = meshes.map(mesh => { mesh.updateMatrix(); return mesh.geometry.clone().applyMatrix4(mesh.matrix); });
    const geometry = mergeGeometries(pieces, false); pieces.forEach(g => g.dispose());
    if (!geometry) continue;
    const merged = add(group, geometry, material, meshes.map(m => m.name).join(' · ')); merged.castShadow = false;
    for (const mesh of meshes) { group.remove(mesh); mesh.geometry.dispose(); }
  }
}

/** One instanced, anatomically connected human mesh; articulated arms rotate at shoulders. */
function crowdGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const part = (geometry: THREE.BufferGeometry, limb: number, garment: number, matrix: THREE.Matrix4) => {
    geometry.deleteAttribute('uv');
    if (!geometry.index) { const indexed = mergeVertices(geometry); geometry.dispose(); geometry = indexed; }
    geometry.applyMatrix4(matrix); const count = geometry.attributes.position.count;
    geometry.setAttribute('aLimb', new THREE.Float32BufferAttribute(new Float32Array(count).fill(limb), 1));
    geometry.setAttribute('aGarment', new THREE.Float32BufferAttribute(new Float32Array(count).fill(garment), 1)); parts.push(geometry);
  };
  const pose = new THREE.Object3D();
  const ellipsoid = (p: number[], s: number[], garment: number, limb = 0) => {
    pose.position.set(...p as [number, number, number]); pose.scale.set(...s as [number, number, number]); pose.quaternion.identity(); pose.updateMatrix();
    const geometry = new THREE.IcosahedronGeometry(1, 0), positions = geometry.attributes.position, normals = geometry.attributes.normal;
    const normal = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) { normal.fromBufferAttribute(positions, i).normalize(); normals.setXYZ(i, normal.x, normal.y, normal.z); }
    part(geometry, limb, garment, pose.matrix);
  };
  const cylinder = (a: number[], b: number[], radius: number, garment: number, limb = 0) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
    pose.position.copy(start).lerp(end, .5); pose.scale.set(1, 1, 1); pose.quaternion.setFromUnitVectors(Y, direction.clone().normalize()); pose.updateMatrix();
    part(new THREE.CylinderGeometry(radius, radius, direction.length(), 4, 1, true), limb, garment, pose.matrix);
  };
  ellipsoid([0, 1.10, 0], [.25, .32, .14], 1);
  cylinder([0, 1.38, 0], [0, 1.53, 0], .075, 0);
  ellipsoid([0, 1.65, 0], [.135, .17, .13], 0);
  ellipsoid([0, 1.77, -.025], [.14, .08, .13], 3);
  for (const side of [-1, 1]) {
    cylinder([side * .11, .87, 0], [side * .15, .12, .025], .085, 2);
    ellipsoid([side * .15, .065, .075], [.105, .065, .17], 3);
    const limb = side === -1 ? 1 : 2;
    cylinder([side * .20, 1.33, 0], [side * .36, 1.70, .01], .065, 0, limb);
    cylinder([side * .36, 1.70, .01], [side * .30, 2.02, .035], .055, 0, limb);
    ellipsoid([side * .30, 2.045, .035], [.065, .075, .055], 0, limb);
  }
  const merged = mergeGeometries(parts, false)!; parts.forEach(g => g.dispose()); return merged;
}
function createCrowd(options: FestivalOptions, clock: { value: number }) {
  const random = rng(options.seed ?? 318), geometry = crowdGeometry(), count = options.people.length;
  const phases = new Float32Array(count), energies = new Float32Array(count), shirts = new Float32Array(count * 3), skins = new Float32Array(count);
  const palette = ['#c56a54', '#64a9a3', '#ead4aa', '#799bc5', '#bd779f', '#d4ab4f', '#678a73'];
  const material = surface('#ffffff'); material.name = 'Público — ropa, piel y movimiento articulado';
  material.userData.festivalClock = clock;
  material.customProgramCacheKey = () => 'festival-crowd-connected-1';
  material.onBeforeCompile = shader => {
    shader.uniforms.uFestivalTime = clock;
    const declarations = `uniform float uFestivalTime;attribute float aLimb,aGarment,aPhase,aEnergy,aSkin;attribute vec3 aShirt;varying vec3 vFestivalColor;
      float armAngle(){return aLimb<.5?0.:(aLimb<1.5?1.:-1.)*(.16+(.5+.5*sin(uFestivalTime*2.3+aPhase))*.56*aEnergy);}
      mat2 armRotate(float a){return mat2(cos(a),sin(a),-sin(a),cos(a));}`;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${declarations}`)
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nif(aLimb>.5)objectNormal.xy=armRotate(armAngle())*objectNormal.xy;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        if(aLimb>.5){vec2 pivot=vec2(aLimb<1.5?-.20:.20,1.33);transformed.xy=pivot+armRotate(armAngle())*(transformed.xy-pivot);}
        float beat=max(0.,sin(uFestivalTime*3.4+aPhase));float hop=pow(beat,4.)*.34*aEnergy;
        transformed.y+=hop;transformed.x+=sin(uFestivalTime*1.7+aPhase)*.035*clamp(position.y/.9,0.,1.);
        vec3 skin=mix(vec3(.32,.18,.11),vec3(.75,.52,.35),aSkin);
        vFestivalColor=aGarment<.5?skin:(aGarment<1.5?aShirt:(aGarment<2.5?mix(vec3(.05,.08,.13),aShirt*.24,aSkin):vec3(.045,.031,.023)));`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vFestivalColor;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb*=vFestivalColor;');
  };
  const mesh = new THREE.InstancedMesh(geometry, material, count); mesh.name = `${options.name} — multitud instanciada`;
  const dummy = new THREE.Object3D(), color = new THREE.Color(), feet: number[][] = [];
  options.people.forEach((p, i) => {
    const y = options.groundAt(p.x, p.z) + .025; feet.push([p.x, y, p.z]);
    dummy.position.set(p.x, y, p.z); dummy.scale.setScalar(.88 + random() * .19); dummy.rotation.set(0, Math.atan2(options.stage.x - p.x, options.stage.z - p.z), 0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    phases[i] = random() * Math.PI * 2; energies[i] = .35 + random() * .65; skins[i] = random(); color.set(palette[Math.floor(random() * palette.length)]); color.toArray(shirts, i * 3);
  });
  geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1)); geometry.setAttribute('aEnergy', new THREE.InstancedBufferAttribute(energies, 1));
  geometry.setAttribute('aShirt', new THREE.InstancedBufferAttribute(shirts, 3)); geometry.setAttribute('aSkin', new THREE.InstancedBufferAttribute(skins, 1));
  mesh.computeBoundingSphere(); if (mesh.boundingSphere) mesh.boundingSphere.radius += 1;
  mesh.userData.crowd = { count, feet, maximumJump: .34, clock }; return mesh;
}

function bandMember(role: string, color: string, clock: { value: number }) {
  const group = new THREE.Group(); group.name = `Músico — ${role}`;
  const shirt = surface(color), skin = surface('#bb8e6c'), trousers = surface('#273244'), black = surface('#161d21'), wood = surface('#bd7d38'), metal = surface('#b5bcb9', { metalness: .65, roughness: .32 });
  box(group, shirt, [.50, .58, .30], [0, 1.10, 0], 'Torso');
  beam(group, skin, new THREE.Vector3(0, 1.35, 0), new THREE.Vector3(0, 1.51, 0), .065, 'Cuello');
  add(group, new THREE.SphereGeometry(.16, 10, 7), skin, 'Cabeza', new THREE.Vector3(0, 1.61, 0));
  add(group, new THREE.SphereGeometry(.167, 10, 4, 0, Math.PI * 2, 0, Math.PI * .5), black, 'Cabello', new THREE.Vector3(0, 1.64, -.02));
  for (const side of [-1, 1]) {
    beam(group, trousers, new THREE.Vector3(side * .13, .85, 0), new THREE.Vector3(side * .19, .12, 0), .09, 'Pierna');
    box(group, black, [.20, .14, .34], [side * .19, .07, .09], 'Zapato');
  }
  const arms: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(side * .27, 1.34, 0); group.add(arm); arms.push(arm);
    beam(arm, skin, new THREE.Vector3(), new THREE.Vector3(side * .11, -.28, .11), .065, 'Brazo');
    beam(arm, skin, new THREE.Vector3(side * .11, -.28, .11), new THREE.Vector3(-side * .15, -.34, .30), .055, 'Antebrazo');
  }
  if (role.includes('guitarra') || role.includes('bajo')) {
    const instrument = new THREE.Group(); instrument.position.set(.05, 1.02, .28); instrument.name = role.includes('bajo') ? 'Bajo con mástil' : 'Guitarra con caja y cuerdas'; group.add(instrument);
    const body = add(instrument, new THREE.SphereGeometry(1, 12, 8), wood, 'Caja de guitarra'); body.scale.set(.26, .32, .075);
    const upper = add(instrument, new THREE.SphereGeometry(1, 10, 6), wood, 'Cintura de guitarra', new THREE.Vector3(.12, .18, 0)); upper.scale.set(.18, .21, .07);
    beam(instrument, wood, new THREE.Vector3(.10, .23, 0), new THREE.Vector3(.72, .72, 0), .055, 'Mástil');
    const hole = add(instrument, new THREE.CircleGeometry(.075, 12), black, 'Boca de guitarra', new THREE.Vector3(.06, .06, .078));
    hole.name = 'Boca y cuerdas';
    for (let i = 0; i < 4; i++) beam(instrument, metal, new THREE.Vector3(-.06 + i * .012, -.13, .086), new THREE.Vector3(.72 + i * .012, .72, .06), .003, 'Cuerda');
    batch(instrument);
  }
  if (role === 'voz') {
    beam(group, black, new THREE.Vector3(.18, 0, .55), new THREE.Vector3(.18, 1.52, .55), .022, 'Pie de micrófono');
    beam(group, metal, new THREE.Vector3(.18, 1.52, .55), new THREE.Vector3(.05, 1.54, .25), .038, 'Micrófono');
    for (let i = 0; i < 3; i++) beam(group, black, new THREE.Vector3(.18, .12, .55), new THREE.Vector3(.18 + Math.sin(i * 2.1) * .30, .02, .55 + Math.cos(i * 2.1) * .30), .018, 'Trípode');
  }
  batch(group); arms.forEach(batch);
  return { group, update(index: number) { const time = clock.value; arms.forEach((arm, i) => { arm.rotation.x = Math.sin(time * (role === 'batería' ? 9 : 5) + index + i) * .22; }); } };
}

function createFireworks(clock: { value: number }, options: FestivalOptions, depth: number) {
  const count = 6 * 100, random = rng(1974), positions = new Float32Array(count * 2 * 3), directions = new Float32Array(count * 2 * 3), info = new Float32Array(count * 2 * 3), centers = new Float32Array(count * 2 * 3), colors = new Float32Array(count * 2 * 3), launches = new Float32Array(count * 2 * 3);
  const launchPositions = Array.from({ length: 6 }, (_, shell) => {
    const x = options.stage.x + (shell - 2.5) * 8, z = options.stage.z - depth / 2 - 35 - shell % 2 * 7;
    return new THREE.Vector3(x, options.groundAt(x, z) + .30, z);
  });
  const palette = ['#ffd889', '#88cbe5', '#ef9cc9', '#e9e7c2'];
  for (let i = 0; i < count; i++) {
    const shell = Math.floor(i / 100), angle = random() * Math.PI * 2, y = random() * 2 - 1, r = Math.sqrt(1 - y * y), speed = 8 + random() * 7;
    const color = new THREE.Color(palette[shell % palette.length]);
    for (let j = 0; j < 2; j++) {
      const n = i * 2 + j; directions.set([Math.cos(angle) * r * speed, y * speed, Math.sin(angle) * r * speed], n * 3);
      centers.set([-30 + shell * 11, 58 + shell % 3 * 4, -12 - shell % 2 * 12], n * 3); launches.set(launchPositions[shell].toArray(), n * 3); info.set([shell * 2.2, i % 100 / 100, j ? 0 : -.11], n * 3); color.toArray(colors, n * 3);
    }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geometry.setAttribute('aDirection', new THREE.BufferAttribute(directions, 3));
  geometry.setAttribute('aCenter', new THREE.BufferAttribute(centers, 3)); geometry.setAttribute('aLaunch', new THREE.BufferAttribute(launches, 3)); geometry.setAttribute('aInfo', new THREE.BufferAttribute(info, 3)); geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uFestivalTime: clock },
    vertexShader: `uniform float uFestivalTime;attribute vec3 aDirection,aCenter,aInfo,aLaunch;attribute vec3 color;varying vec3 vColor;varying float vAlpha;
      void main(){float age=mod(uFestivalTime+aInfo.x,14.);float t=age-1.25+aInfo.z;vec3 p;
        if(t<0.){float u=clamp((age+aInfo.z)/1.25,0.,1.);p=mix(aLaunch,aCenter,u);vAlpha=aInfo.y<.02?.9:0.;}
        else {p=aCenter+aDirection*t+vec3(0.,-3.7*t*t,0.);vAlpha=(1.-smoothstep(.35,3.2,t))*step(t,3.3);}
        vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: 'varying vec3 vColor;varying float vAlpha;void main(){if(vAlpha<.02)discard;gl_FragColor=vec4(vColor*1.8,vAlpha);#include <colorspace_fragment>}',
  });
  // A separate line per spark gives readable trails rather than suspended dots.
  material.fragmentShader = material.fragmentShader.replace(';#include', ';\n#include');
  const sparks = new THREE.LineSegments(geometry, material); sparks.name = 'Fogones — ascenso, estallido y caída de fuegos artificiales'; sparks.frustumCulled = false;
  sparks.userData.fireworks = { shells: 6, particlesPerShell: 100, period: 14, launchPositions: launchPositions.map(p => p.toArray()), clock }; return sparks;
}

export function createFestivalNight(options: FestivalOptions) {
  const group = new THREE.Group(); group.name = options.name; group.visible = false; const clock = { value: 0 };
  const metal = surface('#4f5b63', { metalness: .55, roughness: .45 }), black = surface('#12191e'), deck = surface('#343431'), canvas = surface('#ddd6c2');
  const width = options.width ?? 31, depth = options.depth ?? 14;
  const stage = new THREE.Group(); stage.name = 'Escenario temporal — exclusivo del modo nocturno';
  const cornerGrounds = [-1, 1].flatMap(x => [-1, 1].map(z => options.groundAt(options.stage.x + x * width / 2, options.stage.z + z * depth / 2)));
  const base = Math.max(...cornerGrounds) + .08; stage.position.set(options.stage.x, base, options.stage.z); group.add(stage);
  box(stage, deck, [width, .35, depth], [0, 1.3, 0], 'Tarima nivelada');
  box(stage, black, [width, 1.4, .12], [0, .72, depth / 2], 'Faldón del escenario');
  for (const side of [-1, 1]) for (const back of [-1, 1]) {
    const x = side * (width / 2 - .4), z = back * (depth / 2 - .4), floor = options.groundAt(options.stage.x + x, options.stage.z + z) - base;
    for (const dx of [-.25, .25]) for (const dz of [-.25, .25]) beam(stage, metal, new THREE.Vector3(x + dx, floor, z + dz), new THREE.Vector3(x + dx, 10.6, z + dz), .075);
    for (let y = 0; y < 10; y += 1.25) {
      beam(stage, metal, new THREE.Vector3(x - .25, y, z + .25), new THREE.Vector3(x + .25, y + 1.25, z + .25), .04);
      beam(stage, metal, new THREE.Vector3(x + .25, y, z - .25), new THREE.Vector3(x - .25, y + 1.25, z - .25), .04);
    }
  }
  for (const z of [-depth / 2 + .4, depth / 2 - .4]) {
    for (const y of [10, 10.6]) beam(stage, metal, new THREE.Vector3(-width / 2, y, z), new THREE.Vector3(width / 2, y, z), .085);
    for (let x = -width / 2; x < width / 2; x += 1.3) beam(stage, metal, new THREE.Vector3(x, 10, z), new THREE.Vector3(Math.min(width / 2, x + 1.3), 10.6, z), .045);
  }
  box(stage, canvas, [width + 2, .16, depth + 2], [0, 10.9, 0], 'Cubierta tensada casi plana');
  box(stage, black, [width * .70, 6.9, .25], [0, 5.6, -depth / 2 + .2], 'Pantalla central');
  const ledMaterial = new THREE.ShaderMaterial({ uniforms: { uFestivalTime: clock }, toneMapped: false,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform float uFestivalTime;varying vec2 vUv;void main(){float w=.5+.5*sin(vUv.x*14.+vUv.y*5.-uFestivalTime*.8);vec3 c=mix(vec3(.025,.25,.29),vec3(.32,.035,.18),w);c+=pow(max(0.,sin(vUv.x*30.+uFestivalTime*.4)),30.)*.18;gl_FragColor=vec4(c,1.);}',
  });
  add(stage, new THREE.PlaneGeometry(width * .68, 6.6), ledMaterial, 'Pantalla LED animada', new THREE.Vector3(0, 5.65, -depth / 2 + .36));
  const textCanvas = document.createElement('canvas'); textCanvas.width = 1024; textCanvas.height = 256; const ctx = textCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, 1024, 256); ctx.fillStyle = '#fff1cf'; ctx.textAlign = 'center'; ctx.font = '600 76px Arial'; ctx.fillText('MINAS · LAVALLEJA', 512, 121); ctx.font = '24px Arial'; ctx.fillText('NOS ENCONTRAMOS EN LA MÚSICA', 512, 177);
  const textTexture = new THREE.CanvasTexture(textCanvas); textTexture.colorSpace = THREE.SRGBColorSpace;
  add(stage, new THREE.PlaneGeometry(width * .61, 4.4), new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, depthWrite: false }), 'Identidad del encuentro', new THREE.Vector3(0, 5.65, -depth / 2 + .38));
  const glowing = surface('#d8eddf', { emissive: '#bfdbe9', emissiveIntensity: 2.3 });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) box(stage, black, [1.1, .55, .65], [side * (width / 2 - 2), 8.5 - i * .5, depth / 2 - .5], 'Line array suspendido');
    box(stage, black, [2.8, 2.8, 1.7], [side * (width / 2 - 1.6), 1.4, depth / 2 + 1.4], 'Subgraves');
    for (let i = 0; i < 4; i++) add(stage, new THREE.SphereGeometry(.16, 8, 5), glowing, 'Par de luz', new THREE.Vector3(side * (3.2 + i * 2.4), 9.8, depth / 2 - .1));
  }
  const musicians = [bandMember('guitarra', '#cb7d52', clock), bandMember('voz', '#e2d2ae', clock), bandMember('bajo', '#70949f', clock), bandMember('batería', '#ae6e8f', clock)];
  [[-5.2, 1.5, 2.3], [0, 1.5, 3.3], [5.1, 1.5, 2.1], [0, 1.5, -2.5]].forEach((p, i) => { musicians[i].group.position.set(...p as [number, number, number]); musicians[i].group.scale.setScalar(1.12); stage.add(musicians[i].group); });
  const drums = new THREE.Group(); drums.position.set(0, 1.5, -1.6); drums.name = 'Batería — bombo, toms y platillos'; stage.add(drums);
  const drum = surface('#7a2d2c', { metalness: .2 }), skin = surface('#e0d8c3');
  const bass = add(drums, new THREE.CylinderGeometry(.55, .55, .72, 14), drum, 'Bombo', new THREE.Vector3(0, .58, .15)); bass.rotation.x = Math.PI / 2;
  add(drums, new THREE.CircleGeometry(.51, 14), skin, 'Parche del bombo', new THREE.Vector3(0, .58, .52));
  for (const side of [-1, 1]) {
    add(drums, new THREE.CylinderGeometry(.29, .29, .40, 10), drum, 'Tom', new THREE.Vector3(side * .45, 1.17, 0));
    beam(drums, metal, new THREE.Vector3(side * .95, 0, .2), new THREE.Vector3(side * .95, 1.38, .2), .025, 'Pie de platillo');
    add(drums, new THREE.CylinderGeometry(.43, .43, .025, 14), surface('#b5a45b', { metalness: .7, roughness: .4 }), 'Platillo', new THREE.Vector3(side * .95, 1.4, .2));
  }
  batch(drums); batch(stage);
  const crowd = createCrowd(options, clock); group.add(crowd);
  const lights = [new THREE.PointLight('#ffcfa2', 0, 82, 2), new THREE.PointLight('#91cbe9', 0, 82, 2)];
  lights.forEach((light, i) => { light.name = 'Luz de concierto ' + (i + 1); light.position.set(options.stage.x + (i ? 1 : -1) * width * .32, base + 8.2, options.stage.z + depth / 2); light.visible = false; group.add(light); });
  const beams: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const color = i % 2 ? '#c2a2ef' : '#8bd8df';
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .035, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 30, 10, 1, true), material); cone.name = 'Haz de concierto móvil'; group.add(cone); beams.push(cone);
  }
  const flames: THREE.Mesh[] = [];
  for (const point of options.campfires ?? []) {
    const y = options.groundAt(point.x, point.z), pit = new THREE.Group(); pit.position.set(point.x, y, point.z); pit.name = 'Fogón — piedra, leña y llama'; group.add(pit);
    for (let i = 0; i < 10; i++) add(pit, new THREE.IcosahedronGeometry(.24, 0), surface('#747060'), 'Piedra del fogón', new THREE.Vector3(Math.sin(i * .628) * .85, .14, Math.cos(i * .628) * .85));
    for (let i = 0; i < 4; i++) beam(pit, surface('#4d3520'), new THREE.Vector3(-.65, .20, -.25 + i * .16), new THREE.Vector3(.65, .35, .25 - i * .16), .13, 'Leña');
    batch(pit);
    for (let i = 0; i < 3; i++) {
      const flame = add(pit, new THREE.ConeGeometry(.52 - i * .11, 1.5 - i * .27, 7), new THREE.MeshBasicMaterial({ color: i ? '#ffe7a2' : '#e97828', transparent: true, opacity: .83, depthWrite: false }), 'Llama del fogón', new THREE.Vector3((i - 1) * .16, .90, 0)); flames.push(flame);
    }
  }
  if (options.fireworks) group.add(createFireworks(clock, options, depth));
  let night = false, active = false;
  const lamp = new THREE.Vector3(), aim = new THREE.Vector3(), direction = new THREE.Vector3();
  function setNight(value: boolean, isActive: boolean) {
    night = value; active = isActive; group.visible = night;
    lights.forEach(light => { light.visible = night && active; light.intensity = night && active ? 1800 : 0; });
  }
  function update(time: number) {
    if (!night || !active) return;
    clock.value = Number.isFinite(time) ? time : 0;
    musicians.forEach((musician, i) => musician.update(i));
    flames.forEach((flame, i) => { flame.scale.set(1 + Math.sin(clock.value * 5 + i) * .08, .88 + Math.sin(clock.value * 6.1 + i) * .16, 1); flame.rotation.z = Math.sin(clock.value * 3 + i) * .08; });
    beams.forEach((cone, i) => {
      lamp.set(options.stage.x + (i - 2.5) * width / 7, base + 9.8, options.stage.z + depth / 2);
      aim.set(options.stage.x + Math.sin(clock.value * .34 + i) * 20, base + 1, options.stage.z + 25 + Math.cos(clock.value * .29 + i) * 7);
      direction.copy(aim).sub(lamp); cone.position.copy(lamp).lerp(aim, .5); cone.quaternion.setFromUnitVectors(Y, direction.clone().negate().normalize()); cone.scale.y = direction.length() / 30;
    });
  }
  group.userData.festival = { exclusiveNight: true, artistCount: musicians.length, audienceCount: options.people.length, fireworks: Boolean(options.fireworks), campfireCount: options.campfires?.length ?? 0, actualLights: lights.length, stageBase: base, stagePosition: stage.position.toArray(), clock };
  return { group, setNight, update };
}
