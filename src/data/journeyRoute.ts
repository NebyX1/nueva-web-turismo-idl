/** Layout supplied by the user in “Orden Correcto de los sitios.png”.
 * Image right maps to +X; image down maps to +Z. These are schematic positions.
 * Arequita precedes Artigas, as explicitly confirmed by the user.
 */
export const journeyRoute = [
  { id: 'monasterio', mapX: 652, mapY: 755 },
  { id: 'salus', mapX: 609, mapY: 632 },
  { id: 'minas-sign', mapX: 386, mapY: 582 },
  { id: 'verdun', mapX: 331, mapY: 489 },
  { id: 'plaza-libertad', mapX: 526, mapY: 430 },
  // New visit requested after the original route; preserve all nine placements.
  { id: 'parque-rodo', mapX: 416, mapY: 362 },
  { id: 'arequita', mapX: 124, mapY: 318 },
  { id: 'cerro-artigas', mapX: 584, mapY: 315 },
  { id: 'penitente', mapX: 623, mapY: 166 },
  { id: 'villa-serrana', mapX: 722, mapY: 80 },
] as const;

export type JourneyStopId = typeof journeyRoute[number]['id'];
export const JOURNEY_MAP_SCALE = 5;

/** Uniform scaling preserves the diagram's proportions and keeps models apart. */
export function journeyPosition(stop: typeof journeyRoute[number]) {
  return { x: (stop.mapX - 425) * JOURNEY_MAP_SCALE, z: (stop.mapY - 418) * JOURNEY_MAP_SCALE };
}
