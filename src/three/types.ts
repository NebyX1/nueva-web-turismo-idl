import type { Group, Vector3 } from 'three';

export interface LandmarkModel {
  group: Group;
  target: Vector3;
  bounds: { radius: number; height: number };
  groundY?: number;
  /** Direction from the subject toward the preferred camera viewpoint. */
  cameraDirection?: Vector3;
  update?: (time: number) => void;
}

export interface JourneyStop {
  id: string;
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
