import * as THREE from 'three';
import { createJumpingFishSchool } from './waterLife';

/** Short staggered arcs above the reservoir, clear of the deck and shoreline. */
export function createStewartVargasFish(lake: THREE.Mesh, waterLevel: number) {
  lake.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
  const spots = [[-42, -18], [-16, -29], [13, -15], [38, -31], [-60, -43], [54, -53]];
  const specs = spots.flatMap(([x, z], index) => {
    const direction = index % 2 ? -1 : 1;
    const start = new THREE.Vector3(x - direction * 3, waterLevel + .008, z - 1.4);
    const end = new THREE.Vector3(x + direction * 3, waterLevel + .008, z + 1.4);
    // Validate the whole arc, including a margin for the body and splash.
    for (let step = 0; step <= 8; step++) {
      const point = start.clone().lerp(end, step / 8);
      for (const [dx, dz] of [[0, 0], [-2, 0], [2, 0], [0, -2], [0, 2]]) {
        ray.set(new THREE.Vector3(point.x + dx, waterLevel + 5, point.z + dz), down);
        if (!ray.intersectObject(lake, false).length) return [];
      }
    }
    return [{ start, end, height: 2.8 + index % 3 * .4, scale: 1 + index % 3 * .09 }];
  });
  return createJumpingFishSchool('Peces del embalse Stewart Vargas', specs, 9.6, 1.45);
}
