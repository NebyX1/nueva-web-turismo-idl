import * as THREE from 'three';

export function createFishModel(materials: { body: THREE.Material; belly: THREE.Material; fin: THREE.Material; eye: THREE.Material }) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), materials.body);
  body.scale.set(1.45, .43, .38); group.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), materials.belly);
  belly.scale.set(1.11, .21, .33); belly.position.set(.12, -.21, 0); group.add(belly);
  const fin = (name: string, points: number[]) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3)); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, materials.fin); mesh.name = name; group.add(mesh); return mesh;
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

export interface FishJump {
  start: THREE.Vector3;
  end: THREE.Vector3;
  height: number;
  scale: number;
}

/** One shared geometry set, one motion clock; the owner disposes the group. */
export function createJumpingFishSchool(name: string, specs: FishJump[], period = 11.8, duration = 1.35) {
  const group = new THREE.Group(); group.name = name;
  const prototype = createFishModel({
    body: new THREE.MeshStandardMaterial({ color: '#aab8a5', roughness: .29, metalness: .35 }),
    belly: new THREE.MeshStandardMaterial({ color: '#eadbb0', roughness: .4, metalness: .12 }),
    fin: new THREE.MeshStandardMaterial({ color: '#8c9d82', roughness: .5, side: THREE.DoubleSide }),
    eye: new THREE.MeshStandardMaterial({ color: '#13251f', roughness: .2 }),
  });
  const dropGeometry = new THREE.SphereGeometry(.095, 5, 4);
  const dropMaterial = new THREE.MeshStandardMaterial({ color: '#e0efdf', transparent: true, opacity: .84, roughness: .2 });
  const ringGeometry = new THREE.RingGeometry(.83, 1, 40); ringGeometry.rotateX(-Math.PI / 2);
  const dummy = new THREE.Object3D();
  const jumps = specs.map((spec, index) => {
    const fish = index ? prototype.group.clone(true) : prototype.group;
    fish.name = `${name} — pez ${index + 1}`; fish.scale.setScalar(spec.scale);
    const direction = spec.end.clone().sub(spec.start), length = direction.length(); direction.normalize();
    const rings = [0, 1].map(i => {
      const surface = new THREE.MeshStandardMaterial({ color: '#c3dcd1', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeometry, surface); ring.name = 'Ondas del chapoteo';
      ring.position.copy(spec.end); ring.position.y += .07 + i * .015; ring.renderOrder = 3;
      group.add(ring); return ring;
    });
    const drops = new THREE.InstancedMesh(dropGeometry, dropMaterial, 14);
    drops.name = 'Gotas del chapoteo'; drops.count = 0; drops.frustumCulled = false;
    group.add(fish, drops);
    return { spec, fish, tail: fish.getObjectByName('Aleta caudal')!, direction, length, rings, drops };
  });
  function update(time: number) {
    const safeTime = Number.isFinite(time) ? time : 0;
    jumps.forEach((jump, index) => {
      const phase = THREE.MathUtils.euclideanModulo(safeTime + index * period / jumps.length, period);
      const u = THREE.MathUtils.clamp(phase / duration, 0, 1);
      jump.fish.visible = phase < duration;
      jump.fish.position.copy(jump.spec.start).lerp(jump.spec.end, u);
      jump.fish.position.y += Math.sin(u * Math.PI) * jump.spec.height - .28;
      jump.fish.rotation.set(0, -Math.atan2(jump.direction.z, jump.direction.x), Math.atan2(Math.cos(u * Math.PI) * Math.PI * jump.spec.height, jump.length));
      jump.tail.rotation.y = Math.sin(safeTime * 23 + index) * .22;
      const splash = phase - duration;
      jump.drops.count = 0;
      for (let i = 0; splash >= 0 && splash < .9 && i < 14; i++) {
        const angle = i * 2.4 + index, speed = .8 + (i % 4) * .27;
        const y = speed * 2.1 * splash - 4.9 * splash * splash;
        if (y < .015) continue;
        dummy.position.set(jump.spec.end.x + Math.cos(angle) * speed * splash, jump.spec.end.y + y, jump.spec.end.z + Math.sin(angle) * speed * splash);
        dummy.scale.setScalar(.75 + i % 3 * .15); dummy.updateMatrix(); jump.drops.setMatrixAt(jump.drops.count++, dummy.matrix);
      }
      if (jump.drops.count) jump.drops.instanceMatrix.needsUpdate = true;
      jump.rings.forEach((ring, i) => {
        const age = splash - i * .16; ring.visible = age >= 0 && age < 1.6;
        ring.scale.setScalar(.25 + Math.max(0, age) * 1.35);
        ring.material.opacity = ring.visible ? .55 * (1 - age / 1.6) ** 1.4 : 0;
      });
    });
  }
  group.userData.fishSchool = { count: specs.length, period, duration, paths: specs.map(spec => ({ start: spec.start.toArray(), end: spec.end.toArray() })) };
  update(0);
  return { group, update };
}
