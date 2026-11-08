import * as THREE from 'three';
import type { LandmarkCameraFraming, LandmarkModel } from './types';

export type JourneyPhase = 'Llegando' | 'Acercándonos' | 'Mirada panorámica' | 'El paisaje se abre';
export const JOURNEY_VISIT_SECONDS = 22;
const Y = new THREE.Vector3(0, 1, 0);
const smooth = (t: number) => THREE.MathUtils.smoothstep(t, 0, 1);
interface CameraSite extends LandmarkCameraFraming {
  origin: THREE.Vector3;
  target: THREE.Vector3;
  direction: THREE.Vector3;
  model: LandmarkModel;
}
export interface JourneyCameraVisit extends CameraSite {
  stopIndex: number;
  stopStart: number;
  stopDuration: number;
  label: string;
  nightVisit?: JourneyCameraVisit;
}
export interface JourneyViewport { width: number; height: number }

/** Keep the public route intact while giving each subject a complete visit. */
export function createJourneyCameraVisits(sites: CameraSite[]): JourneyCameraVisit[] {
  const visits: JourneyCameraVisit[] = [];
  sites.forEach((site, stopIndex) => {
    const intros = site.model.introViews ?? [], stopStart = visits.length * JOURNEY_VISIT_SECONDS;
    const timing = { stopIndex, stopStart, stopDuration: (intros.length + 1) * JOURNEY_VISIT_SECONDS };
    for (const view of intros) visits.push({
      ...site, ...view, ...timing,
      origin: site.origin.clone().add(view.origin), target: site.origin.clone().add(view.target),
      direction: view.cameraDirection.clone().setY(0).normalize(),
      model: { ...site.model, bounds: view.bounds, nightLighting: view.nightLighting },
    });
    const visit: JourneyCameraVisit = { ...site, ...timing, label: site.model.cameraLabel ?? '' };
    const view = site.model.nightView;
    if (view) visit.nightVisit = { ...site, ...view, ...timing,
      origin: site.origin.clone().add(view.origin), target: site.origin.clone().add(view.target),
      direction: view.cameraDirection.clone().setY(0).normalize(), model: { ...site.model, bounds: view.bounds },
    };
    visits.push(visit);
  });
  return visits;
}

/** Pure camera sampling is shared by WebGL and geometry/continuity checks. */
export function createJourneyCameraTour(visits: JourneyCameraVisit[]) {
  const duration = visits.length * JOURNEY_VISIT_SECONDS;
  let night = false;
  const viewAt = (index: number) => night ? visits[index].nightVisit ?? visits[index] : visits[index];
  const framing = (v: JourneyViewport) => Math.max(1, 1.05 / (v.width / v.height));
  const focusAt = (index: number, v: JourneyViewport) => v.width <= 700 ? viewAt(index).portraitFocus ?? viewAt(index).focus : viewAt(index).focus;
  const side = (index: number, angle = 0) => viewAt(index).direction.clone().applyAxisAngle(Y, angle);
  function subject(index: number, factor = 0) {
    const visit = viewAt(index), target = visit.target.clone();
    target.y = Math.max(visit.origin.y + .8, target.y + visit.model.bounds.height * factor);
    return target;
  }
  function widePose(index: number, viewport: JourneyViewport, ending = false) {
    const visit = viewAt(index), distance = visit.overviewDistance ?? Math.max(visit.model.bounds.radius * 2.6, visit.focus * 4.1);
    const position = visit.origin.clone().addScaledVector(side(index, ending ? visit.sweep : -.12), distance * framing(viewport));
    position.y += visit.model.bounds.height * 1.35 + 35;
    return position;
  }
  function sample(time: number, viewport: JourneyViewport) {
    const elapsed = THREE.MathUtils.euclideanModulo(time, duration);
    const index = Math.floor(elapsed / JOURNEY_VISIT_SECONDS), local = elapsed % JOURNEY_VISIT_SECONDS, visit = viewAt(index);
    const near = visit.origin.clone().addScaledVector(side(index), focusAt(index, viewport) * 2.6 * framing(viewport));
    const eye = viewport.width <= 700 ? visit.portraitEye ?? visit.eye : visit.eye;
    near.y = eye === undefined ? visit.target.y - visit.model.bounds.height * .22 : visit.origin.y + eye;
    const lifted = visit.origin.clone().addScaledVector(side(index, visit.sweep), focusAt(index, viewport) * 2.8 * framing(viewport));
    lifted.y = Math.max(visit.origin.y + 1.7, near.y) + visit.reveal * .06 + (visit.rise ?? 0);
    const summit = visit.target.clone(); summit.y = visit.origin.y + visit.reveal * .96;
    const position = new THREE.Vector3(), look = new THREE.Vector3();
    let phase: JourneyPhase, fov: number;
    if (local < 5) {
      phase = 'Llegando';
      const previous = (index + visits.length - 1) % visits.length;
      const from = widePose(previous, viewport, true), to = widePose(index, viewport), middle = from.clone().lerp(to, .5);
      middle.y = Math.max(from.y, to.y) + 90;
      position.copy(new THREE.QuadraticBezierCurve3(from, middle, to).getPoint(smooth(local / 5)));
      look.copy(subject(previous)).lerp(subject(index), smooth(local / 5)); fov = 53;
    } else if (local < 10) {
      phase = 'Acercándonos'; const u = smooth((local - 5) / 5);
      position.copy(widePose(index, viewport)).lerp(near, u);
      look.copy(subject(index)).lerp(subject(index, visit.approachFocusFactor ?? -.13), u); fov = THREE.MathUtils.lerp(53, 44, u);
    } else if (local < 16) {
      phase = 'Mirada panorámica'; const u = smooth((local - 10) / 6);
      position.copy(near).lerp(lifted, u);
      look.copy(subject(index, visit.approachFocusFactor ?? -.13)).lerp(summit, u); fov = 44;
    } else {
      phase = 'El paisaje se abre'; const u = smooth((local - 16) / 6);
      position.copy(lifted).lerp(widePose(index, viewport, true), u);
      look.copy(summit).lerp(subject(index), u); fov = THREE.MathUtils.lerp(44, 53, u);
    }
    return { position, look, fov, phase, index, visit, progress: (elapsed - visit.stopStart) / visit.stopDuration };
  }
  return { visits, duration, focusAt, subject, widePose, sample, viewAt, setNight(value: boolean) { night = value; },
    firstVisit(stopIndex: number) { return visits.findIndex(visit => visit.stopIndex === stopIndex); },
  };
}
