import type { ColorRepresentation, Group, Vector3 } from 'three';
import type { JourneyStopId } from '../data/journeyRoute';

/** Positions are local to the landmark group, so lighting follows its placement. */
export interface LandmarkFloodlight {
  foot: Vector3;
  target: Vector3;
  angle: number;
  strength: number;
  scale?: number;
  color?: ColorRepresentation;
  penumbra?: number;
}

export interface LandmarkNightLighting {
  floodlights: readonly [LandmarkFloodlight, LandmarkFloodlight];
  /** Distant bulbs stay luminous at night; actual local lights use the active-site budget. */
  setNight(night: boolean, active: boolean): void;
}

export interface LandmarkModel {
  group: Group;
  target: Vector3;
  bounds: { radius: number; height: number };
  groundY?: number;
  /** Direction from the subject toward the preferred camera viewpoint. */
  cameraDirection?: Vector3;
  nightLighting?: LandmarkNightLighting;
  update?: (time: number) => void;
}

export interface JourneyStop {
  id: JourneyStopId;
  name: string;
  eyebrow: string;
  description: string;
  image: string;
  imageAlt: string;
  label: string;
  /** Existing guide chapter used by an additional stop in the same city. */
  guideChapter?: string;
  sources: { label: string; url: string }[];
  note?: string;
}
