import { MathUtils } from 'three';
import { journeyDefinitions } from './journeySites';

function baseHeight(x: number, z: number) {
  return 12 + Math.sin(x * .007 + .4) * Math.cos(z * .006) * 22
    + Math.sin(x * .018 + z * .009) * 8 + Math.cos(z * .026 - x * .012) * 3;
}

/** Shared by rendered terrain, model placement, vegetation and elevation checks. */
export function journeyTerrainHeight(x: number, z: number) {
  let weight = 0, closest = Infinity, level = 0;
  for (const site of journeyDefinitions) {
    const distance = Math.hypot(x - site.x, z - site.z);
    const blend = 1 - MathUtils.smoothstep(distance, site.pad ?? 48, (site.pad ?? 48) + 97);
    if (blend > weight || (blend === weight && distance < closest)) {
      weight = blend; closest = distance; level = baseHeight(site.x, site.z);
    }
  }
  return MathUtils.lerp(baseHeight(x, z), level, weight);
}
