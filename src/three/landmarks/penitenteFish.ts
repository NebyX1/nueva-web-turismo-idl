import * as THREE from 'three';
import { createJumpingFishSchool } from './waterLife';

/** Anchor to the existing pool mesh, without reshaping its rocks or shore. */
export function createPenitenteFish(pool: THREE.Mesh, waterLevel: number) {
  const positions = pool.geometry.attributes.position;
  const specs = [32, 39, 47, 54].map((z, index) => {
    let left = Infinity, right = -Infinity;
    for (let i = 0; i < positions.count; i++) {
      if (Math.abs(positions.getZ(i) - z) > .65) continue;
      left = Math.min(left, positions.getX(i)); right = Math.max(right, positions.getX(i));
    }
    const x = (left + right) / 2, side = index % 2 ? -1 : 1;
    return { start: new THREE.Vector3(x - side * .65, waterLevel, z - 1.8), end: new THREE.Vector3(x + side * .65, waterLevel, z + 1.8), height: 2.5 + index % 2 * .45, scale: .75 + index % 3 * .08 };
  });
  return createJumpingFishSchool('Peces de la poza del Penitente', specs);
}
