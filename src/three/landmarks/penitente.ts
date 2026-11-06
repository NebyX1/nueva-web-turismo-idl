import * as THREE from 'three';
import type { LandmarkModel } from '../types';
import assetData from './penitenteAsset.json';
import { decodePenitenteGeometry, type PenitenteAsset } from './penitenteMesh';
import { createPenitenteWater } from './penitenteWater';
import { createPenitenteRock } from './penitenteRock';
import { createPenitenteFish } from './penitenteFish';

export function createPenitente(): LandmarkModel {
  const asset: PenitenteAsset = assetData;
  const group = new THREE.Group(); group.name = 'Salto del Penitente — farallón, lajas y canaleta real';
  group.userData.assetSha256 = asset.sourceSha256;
  group.userData.impact = asset.landscape.impact;
  const rock = createPenitenteRock();
  const clock = { value: 0 };
  const stream = createPenitenteWater(clock, false, asset.landscape.impact), pool = createPenitenteWater(clock, true, asset.landscape.impact);
  for (const part of asset.parts) {
    const geometry = decodePenitenteGeometry(part);
    const object = new THREE.Mesh(geometry, part.kind === 'rock' ? rock : part.kind === 'pool' ? pool : stream);
    object.name = part.name; object.userData.kind = part.kind;
    object.castShadow = part.kind === 'rock'; object.receiveShadow = true;
    if (part.kind !== 'rock') object.renderOrder = part.kind === 'pool' ? 2 : 1;
    group.add(object);
  }
  const foliage = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), asset.landscape.shrubs.length * 2);
  foliage.name = 'Monte serrano y matorrales apoyados en la roca';
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  asset.landscape.shrubs.forEach(([x, y, z, size, angle, tone], i) => {
    for (let j = 0; j < 2; j++) {
      dummy.position.set(x + j * size * .35, y + size * (.55 + j * .22), z + j * size * .15);
      dummy.rotation.set(.1, angle + j, .05); dummy.scale.set(size * (.95 - j * .25), size * (.66 - j * .08), size * (.80 - j * .15));
      dummy.updateMatrix(); foliage.setMatrixAt(i * 2 + j, dummy.matrix);
      color.setHSL(.235 + tone * .025, .34 + tone * .12, .23 + tone * .08, THREE.SRGBColorSpace); foliage.setColorAt(i * 2 + j, color);
    }
  });
  foliage.castShadow = foliage.receiveShadow = true; group.add(foliage);
  const poolMesh = group.children.find(object => object.userData.kind === 'pool') as THREE.Mesh;
  const fish = createPenitenteFish(poolMesh, asset.landscape.poolLevel); group.add(fish.group);
  return { group, target: new THREE.Vector3(0, 25, 5), bounds: { radius: 132, height: 74 }, groundY: 0,
    cameraDirection: new THREE.Vector3(.12, .22, 1).normalize(), update(time) { clock.value = time; fish.update(time); } };
}
