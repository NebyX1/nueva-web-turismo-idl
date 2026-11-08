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

export interface LandmarkCameraFraming {
  focus: number;
  reveal: number;
  sweep: number;
  eye?: number;
  rise?: number;
  approachFocusFactor?: number;
  overviewDistance?: number;
  portraitFocus?: number;
  portraitEye?: number;
  portraitViewOffsetX?: number;
  portraitViewOffset?: number;
}

/** An additional visit inside one destination; all coordinates are local. */
export interface LandmarkCameraView extends LandmarkCameraFraming {
  label: string;
  origin: Vector3;
  target: Vector3;
  cameraDirection: Vector3;
  bounds: { radius: number; height: number };
  nightLighting?: LandmarkNightLighting;
}

export interface LandmarkModel {
  group: Group;
  target: Vector3;
  bounds: { radius: number; height: number };
  groundY?: number;
  /** Direction from the subject toward the preferred camera viewpoint. */
  cameraDirection?: Vector3;
  cameraLabel?: string;
  introViews?: readonly LandmarkCameraView[];
  /** Same timed visit, wider subject/framing behind the night-mode curtain. */
  nightView?: LandmarkCameraView;
  nightLighting?: LandmarkNightLighting;
  update?: (time: number) => void;
}

export interface JourneyStop {
  id: JourneyStopId;
  name: string;
  /** Compact navigation and a two-level heading for a combined landscape. */
  navName?: string;
  heading?: { title: string; subtitle: string };
  eyebrow: string;
  description: string;
  image: string;
  imageAlt: string;
  label: string;
  /** Optional internal visits, in the same order as the model's camera tour. */
  cameraVisits?: readonly { label: string; button: string }[];
  /** Existing guide chapter used by an additional stop in the same city. */
  guideChapter?: string;
  sources: { label: string; url: string }[];
  note?: string;
}
