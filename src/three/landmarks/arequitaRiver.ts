import * as THREE from 'three';

/** Scenic interpretation of the upper Santa Lucía beside Arequita, not a survey. */
export const AREQUITA_RIVER = { extent: 241, level: 1.4, bed: .22, offsetX: -32, jumpDuration: 1.45, period: 10.9 } as const;
const clamp = THREE.MathUtils.clamp;

export function arequitaRiverProfile(x: number) {
  const z = 145 + Math.sin(x * .010 - .1) * 42 + Math.sin(x * .023) * 14;
  const slope = Math.cos(x * .010 - .1) * .42 + Math.cos(x * .023) * .322;
  const taper = 1 - THREE.MathUtils.smoothstep(Math.abs(x), 220, AREQUITA_RIVER.extent);
  const halfWidth = (22 + 10 * Math.exp(-(((x - 28) / 95) ** 2)) + Math.sin(x * .019) * 1.6) * (.13 + .87 * taper);
  return { z, slope, halfWidth, crossScale: Math.sqrt(1 + slope * slope) };
}

/** Signed lateral position; both terrain and water use this exact cross section. */
export function arequitaRiverBankDistance(x: number, z: number) {
  // The stream runs along Z on the hill's left: inverse of the -90° rotation.
  const along = z, across = AREQUITA_RIVER.offsetX - x;
  if (Math.abs(along) > AREQUITA_RIVER.extent + 12) return Infinity;
  const p = arequitaRiverProfile(clamp(along, -AREQUITA_RIVER.extent, AREQUITA_RIVER.extent));
  return Math.hypot(Math.max(0, Math.abs(along) - AREQUITA_RIVER.extent), (across - p.z) / p.crossScale) - p.halfWidth;
}

export function arequitaRiverPoint(along: number) {
  const p = arequitaRiverProfile(along);
  return new THREE.Vector3(AREQUITA_RIVER.offsetX - p.z, AREQUITA_RIVER.level, along);
}

export function sculptArequitaRiverGround(x: number, z: number, originalHeight: number) {
  const bank = arequitaRiverBankDistance(x, z);
  if (bank > 14) return originalHeight;
  const shore = THREE.MathUtils.smoothstep(bank, -2.8, 3.8);
  const cut = THREE.MathUtils.lerp(AREQUITA_RIVER.bed, 2.8, shore);
  return THREE.MathUtils.lerp(cut, originalHeight, THREE.MathUtils.smoothstep(bank, 4, 14));
}

function finish(g: THREE.BufferGeometry) {
  g.computeVertexNormals(); g.computeBoundingBox(); g.computeBoundingSphere(); return g;
}
function fishModel(materials: { body: THREE.Material; belly: THREE.Material; fin: THREE.Material; eye: THREE.Material }) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), materials.body);
  body.scale.set(1.45, .43, .38); group.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), materials.belly);
  belly.scale.set(1.11, .21, .33); belly.position.set(.12, -.21, 0); group.add(belly);
  const fin = (name: string, points: number[]) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const mesh = new THREE.Mesh(finish(g), materials.fin); mesh.name = name; group.add(mesh); return mesh;
  };
  const tail = fin('Aleta caudal', [-1.23, 0, 0, -2.02, .58, 0, -1.86, 0, 0, -1.23, 0, 0, -1.86, 0, 0, -2.02, -.58, 0]);
  fin('Aleta dorsal', [-.65, .3, 0, -.32, .86, 0, .48, .33, 0]);
  for (const side of [-1, 1]) {
    fin('Aleta pectoral', [.55, -.03, side * .3, -.15, -.37, side * .7, -.25, -.08, side * .31]);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.075, 7, 5), materials.eye);
    eye.position.set(.97, .13, side * .285); group.add(eye);
  }
  return { group, tail };
}

function waterMaterial(clock: { value: number }) {
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .22, metalness: .16, side: THREE.DoubleSide });
  material.name = 'Santa Lucía — corriente, ondulación y brillos naturales';
  material.userData.flowClock = clock;
  material.customProgramCacheKey = () => 'arequita-santa-lucia-water-1';
  material.onBeforeCompile = shader => {
    shader.uniforms.uSantaLuciaTime = clock;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      uniform float uSantaLuciaTime; varying vec2 vRiverUv; varying vec3 vRiverPoint;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vRiverUv=uv; vRiverPoint=position;
        float riverEdge=1.-pow(abs(uv.y),6.);
        transformed.y+=riverEdge*(sin(position.x*.24+position.z*.19-uSantaLuciaTime*1.7)*.075+sin(position.x*.53-position.z*.32+uSantaLuciaTime*.8)*.035);`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uSantaLuciaTime; varying vec2 vRiverUv; varying vec3 vRiverPoint;
      float riverHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float riverNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(riverHash(i),riverHash(i+vec2(1,0)),f.x),mix(riverHash(i+vec2(0,1)),riverHash(i+vec2(1)),f.x),f.y);}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float riverBank=smoothstep(.5,1.,abs(vRiverUv.y));
        float flow=riverNoise(vec2(vRiverUv.x*.21-uSantaLuciaTime*.32,vRiverUv.y*5.5+uSantaLuciaTime*.075));
        float fineWave=sin(vRiverUv.x*.86-uSantaLuciaTime*1.4+sin(vRiverUv.y*24.+uSantaLuciaTime*.35));
        float shimmer=pow(max(0.,fineWave),24.)*smoothstep(.35,.84,flow)*.09;
        float bankFoam=smoothstep(.92,1.,abs(vRiverUv.y))*smoothstep(.48,.8,flow)*.2;
        diffuseColor.rgb=mix(vec3(.042,.105,.074),vec3(.24,.27,.13),riverBank*.72);
        diffuseColor.rgb*=.83+flow*.38;
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.62,.73,.62),shimmer+bankFoam);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float riverBump=sin(vRiverPoint.x*.34+vRiverPoint.z*.41-uSantaLuciaTime*1.8)*.045+sin(vRiverPoint.x*.73-vRiverPoint.z*.26+uSantaLuciaTime*.8)*.018;
        vec3 riverDx=dFdx(-vViewPosition),riverDy=dFdy(-vViewPosition);
        vec3 riverR1=cross(riverDy,normal),riverR2=cross(normal,riverDx);
        float riverDet=dot(riverDx,riverR1);
        normal=normalize(abs(riverDet)*normal-sign(riverDet)*(dFdx(riverBump)*riverR1+dFdy(riverBump)*riverR2));
        float riverFresnel=pow(1.-abs(dot(normal,normalize(vViewPosition))),3.);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.18,.27,.22),riverFresnel*.28);`);
  };
  return material;
}

export function createArequitaRiver(groundAt?: (x: number, z: number) => number) {
  const group = new THREE.Group(); group.name = 'Río Santa Lucía — cauce, ribera y vida del agua';
  group.rotation.y = -Math.PI / 2; group.position.x = AREQUITA_RIVER.offsetX;
  const clock = { value: 0 }, material = waterMaterial(clock);
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const rows = 176, columns = 18;
  for (let row = 0; row <= rows; row++) {
    const x = THREE.MathUtils.lerp(-AREQUITA_RIVER.extent, AREQUITA_RIVER.extent, row / rows), p = arequitaRiverProfile(x);
    for (let col = 0; col <= columns; col++) {
      const across = col / columns * 2 - 1;
      positions.push(x, AREQUITA_RIVER.level, p.z + across * p.halfWidth * p.crossScale);
      uv.push(x, across);
      if (row < rows && col < columns) {
        const a = row * (columns + 1) + col, b = a + columns + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices);
  const water = new THREE.Mesh(finish(geometry), material); water.name = 'Santa Lucía — superficie continua'; water.receiveShadow = true; group.add(water);

  const reedMaterial = new THREE.MeshStandardMaterial({ color: '#7c8955', roughness: .95, side: THREE.DoubleSide });
  const reedVertices: number[] = [];
  for (let tuft = 0; tuft < 118; tuft++) {
    const x = -228 + tuft / 117 * 456, p = arequitaRiverProfile(x), side = tuft % 2 ? 1 : -1;
    const z = p.z + side * (p.halfWidth + 5.8) * p.crossScale;
    const landX = AREQUITA_RIVER.offsetX - z, landZ = x;
    const y = (groundAt?.(landX, landZ) ?? sculptArequitaRiverGround(landX, landZ, 2.8)) - .14;
    for (let blade = 0; blade < 5; blade++) {
      const phase = tuft * 2.7 + blade * 1.9, dx = Math.sin(phase) * .7, dz = Math.cos(phase) * .7, height = 1.4 + (Math.sin(phase * 3.3) + 1) * .75;
      reedVertices.push(x + dx - .11, y, z + dz, x + dx + .11, y, z + dz, x + dx + Math.sin(phase) * .7, y + height, z + dz + side * .45);
    }
  }
  const reedGeometry = new THREE.BufferGeometry(); reedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(reedVertices, 3));
  const reeds = new THREE.Mesh(finish(reedGeometry), reedMaterial); reeds.name = 'Juncos de la ribera'; group.add(reeds);

  const materials = {
    body: new THREE.MeshStandardMaterial({ color: '#a5aa91', roughness: .3, metalness: .32 }),
    belly: new THREE.MeshStandardMaterial({ color: '#dfdebe', roughness: .4, metalness: .15 }),
    fin: new THREE.MeshStandardMaterial({ color: '#818268', roughness: .46, metalness: .18, side: THREE.DoubleSide }),
    eye: new THREE.MeshStandardMaterial({ color: '#18291f', roughness: .18 }),
  };
  const prototype = fishModel(materials);
  const dropGeometry = new THREE.SphereGeometry(.11, 5, 4);
  const dropMaterial = new THREE.MeshStandardMaterial({ color: '#dde9d7', roughness: .12, metalness: .2, transparent: true, opacity: .8 });
  const ringGeometry = new THREE.RingGeometry(.87, 1, 48); ringGeometry.rotateX(-Math.PI / 2);
  const dummy = new THREE.Object3D();
  const fishPositions = [-104, -50, 10, 72, 134, -156, 188];
  const jumps = fishPositions.map((x, index) => {
    const fish = index ? { group: prototype.group.clone(true), tail: null } : prototype;
    fish.group.name = `Pez del Santa Lucía ${index + 1}`;
    fish.group.scale.setScalar(.94 + (index % 3) * .12);
    const p = arequitaRiverProfile(x), direction = new THREE.Vector3(1, 0, p.slope).normalize();
    const base = new THREE.Vector3(x, AREQUITA_RIVER.level, p.z + (index % 2 ? -4 : 3));
    const end = base.clone().addScaledVector(direction, 4);
    const rings = [0, 1].map(i => {
      const ringMaterial = new THREE.MeshStandardMaterial({ color: '#ccd9c0', transparent: true, opacity: 0, roughness: .27, metalness: .15, depthWrite: false, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial); ring.name = 'Ondas de la entrada al agua';
      ring.position.copy(end); ring.position.y += .14 + i * .015; ring.visible = false; group.add(ring); return ring;
    });
    const drops = new THREE.InstancedMesh(dropGeometry, dropMaterial, 18); drops.name = 'Chapoteo — gotas balísticas'; drops.count = 0; drops.frustumCulled = false;
    group.add(fish.group, drops);
    return { fish: fish.group, tail: fish.group.getObjectByName('Aleta caudal')!, base, end, direction, rings, drops, offset: index * AREQUITA_RIVER.period / fishPositions.length };
  });

  function update(time: number) {
    clock.value = time;
    jumps.forEach((jump, index) => {
      const phase = ((time + jump.offset) % AREQUITA_RIVER.period + AREQUITA_RIVER.period) % AREQUITA_RIVER.period;
      const u = clamp(phase / AREQUITA_RIVER.jumpDuration, 0, 1), height = 4.3 + (index % 3) * .3;
      jump.fish.visible = phase < AREQUITA_RIVER.jumpDuration;
      if (jump.fish.visible) {
        jump.fish.position.copy(jump.base).addScaledVector(jump.direction, u * 8 - 4);
        jump.fish.position.y += Math.sin(u * Math.PI) * height - .42;
        jump.fish.rotation.set(0, -Math.atan2(jump.direction.z, jump.direction.x), Math.atan2(Math.cos(u * Math.PI) * Math.PI * height, 8));
        jump.tail.rotation.y = Math.sin(time * 22) * .16;
      }
      const splash = phase - AREQUITA_RIVER.jumpDuration;
      jump.drops.count = 0;
      for (let i = 0; splash >= 0 && splash < 1.1 && i < 18; i++) {
        const angle = i * 2.4 + index, speed = 1.2 + (i % 5) * .52;
        const y = speed * 2.2 * splash - 4.9 * splash * splash;
        if (y < .025) continue;
        dummy.position.set(jump.end.x + Math.cos(angle) * speed * splash, AREQUITA_RIVER.level + y, jump.end.z + Math.sin(angle) * speed * splash);
        dummy.scale.setScalar(.8 + (i % 3) * .2); dummy.updateMatrix(); jump.drops.setMatrixAt(jump.drops.count++, dummy.matrix);
      }
      if (jump.drops.count) jump.drops.instanceMatrix.needsUpdate = true;
      jump.rings.forEach((ring, i) => {
        const age = splash - i * .19;
        ring.visible = age >= 0 && age < 1.9;
        ring.scale.setScalar(.45 + Math.max(0, age) * 3.5);
        ring.material.opacity = ring.visible ? .48 * (1 - age / 1.9) ** 1.3 : 0;
      });
    });
  }
  group.userData.river = { name: 'Río Santa Lucía', side: 'left', rotation: -Math.PI / 2, waterLevel: AREQUITA_RIVER.level, animatedFish: jumps.length, jumpDuration: AREQUITA_RIVER.jumpDuration, period: AREQUITA_RIVER.period, interpretation: 'Upper river beside Arequita; the source is at Cerro Pelado.' };
  update(0);
  return { group, update, setNight(night: boolean) { material.roughness = night ? .17 : .22; } };
}
