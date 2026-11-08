import { journeyPosition, journeyRoute } from '../data/journeyRoute';
import type { JourneyStopId } from '../data/journeyRoute';
import { createVerdun, VERDUN_SUMMIT_HEIGHT, VERDUN_FOOTPRINT } from './landmarks/natureMonuments';
import { createArequita } from './landmarks/arequita';
import { createArtigasWithFogones } from './landmarks/artigasFogones';
import { createParqueRodo } from './landmarks/parqueRodo';
import { createMinasSign } from './landmarks/minasSign';
import { createPlazaLibertad } from './landmarks/plazaLibertad';
import { createMonastery, createPenitente } from './landmarks/architectureWater';
import { createVillaSerranaDam } from './landmarks/villaSerrana';
import { createSalus } from './landmarks/salus';
import type { LandmarkModel } from './types';

interface LandmarkView {
  make: () => LandmarkModel;
  focus: number;
  reveal: number;
  sweep: number;
  eye?: number;
  rise?: number;
  pad?: number;
  groundOffset?: number;
  /** Height-relative look offset during the approach and start of the pan. */
  approachFocusFactor?: number;
  overviewDistance?: number;
  /** Keep wide landscapes legible above the caption on narrow screens. */
  portraitFocus?: number;
  portraitEye?: number;
  portraitViewOffsetX?: number;
  portraitViewOffset?: number;
}

const views: Record<JourneyStopId, LandmarkView> = {
  arequita: { make: createArequita, focus: 200, portraitFocus: 150, portraitEye: 105, portraitViewOffsetX: -.12, portraitViewOffset: .27, reveal: 92, sweep: .18, eye: 64, rise: 44, pad: 325, groundOffset: .04 },
  verdun: { make: createVerdun, focus: 32, reveal: VERDUN_SUMMIT_HEIGHT + 20, sweep: .44, eye: VERDUN_SUMMIT_HEIGHT + 17, pad: VERDUN_FOOTPRINT.supportRadius, groundOffset: .04, approachFocusFactor: 0, overviewDistance: 730 },
  'cerro-artigas': { make: createArtigasWithFogones, focus: 18, reveal: 44, sweep: .32, pad: 110 },
  'parque-rodo': { make: createParqueRodo, focus: 48, portraitFocus: 51, eye: 32, portraitEye: 38, rise: 17, reveal: 22, sweep: .24, pad: 340, groundOffset: .04, approachFocusFactor: 0, portraitViewOffsetX: 0, portraitViewOffset: .25 },
  'minas-sign': { make: createMinasSign, focus: 50, reveal: 48, sweep: .23, pad: 160, groundOffset: .04 },
  'plaza-libertad': { make: createPlazaLibertad, focus: 50, reveal: 18, sweep: .14, eye: 40, pad: 225, groundOffset: .04 },
  monasterio: { make: createMonastery, focus: 30, reveal: 44, sweep: .44, eye: 32, approachFocusFactor: 0, pad: 75 },
  'villa-serrana': { make: createVillaSerranaDam, focus: 80, portraitFocus: 56, portraitViewOffsetX: .04, portraitViewOffset: .23, reveal: 34, sweep: .24, eye: 20, rise: 13, pad: 305, groundOffset: .04, approachFocusFactor: 0 },
  penitente: { make: createPenitente, focus: 48, reveal: 72, sweep: .20, eye: 14, pad: 132, approachFocusFactor: 0 },
  salus: { make: createSalus, focus: 6, reveal: 8, sweep: .44 },
};

export const journeyDefinitions = journeyRoute.map(stop => ({
  id: stop.id, ...journeyPosition(stop), ...views[stop.id],
}));

// Extra margin keeps the entire north/south layout and portrait camera poses
// inside the terrain. Background forest covers the new outermost stops too.
export const JOURNEY_WORLD_SIZE = 7200;
export const JOURNEY_FOREST_SIZE = 5800;
export const JOURNEY_TERRAIN_SEGMENTS = 190;
export const JOURNEY_DAY_FOG = .00075;
export const JOURNEY_NIGHT_FOG = .00054;
