import { MathUtils, PerspectiveCamera, Quaternion, Vector3 } from 'three';

export const MOON_DISTANCE = 3000;
export const MOON_ANGULAR_RADIUS = MathUtils.degToRad(1.2);
/** One celestial bearing for the whole tour, always above the world horizon. */
const SKY_DIRECTION = new Vector3(-.35, .34, -.87).normalize();

/** Stable sky placement; camera cuts dissolve the old view before revealing the new one. */
export function createJourneyMoonMotion() {
  const world = new Vector3(), cameraForward = new Vector3(), rotation = new Quaternion(), previous = new Quaternion();
  const direction = SKY_DIRECTION.clone(), projected = new Vector3(), heldNdc = new Vector3(), upper = new Vector3();
  const pose = { direction, ndc: projected, radius: MOON_DISTANCE * Math.tan(MOON_ANGULAR_RADIUS), opacity: 0, pending: false };
  let initialized = false, fadingCut = false, lastFov = 0, lastAspect = 1, lastRadiusNdc = 0, heldRadiusNdc = 0;

  function project(camera: PerspectiveCamera, angularRadius: number) {
    const depth = direction.dot(cameraForward);
    if (depth <= .025) { projected.set(2, 2, 1); return { edge: 0, radiusY: 0 }; }
    projected.copy(direction).multiplyScalar(MOON_DISTANCE).add(world).project(camera);
    const radiusX = Math.abs(camera.projectionMatrix.elements[0] * Math.tan(angularRadius) / depth);
    const radiusY = Math.abs(camera.projectionMatrix.elements[5] * Math.tan(angularRadius) / depth);
    const fadeX = 1 - MathUtils.smoothstep(Math.abs(projected.x) + radiusX, .78, .99);
    const fadeY = 1 - MathUtils.smoothstep(Math.abs(projected.y) + radiusY, .78, .99);
    return { edge: fadeX * fadeY, radiusY };
  }

  return {
    update(camera: PerspectiveCamera, deltaSeconds: number, night: boolean) {
      const dt = MathUtils.clamp(Number.isFinite(deltaSeconds) ? deltaSeconds : 1 / 60, 0, .05);
      camera.updateMatrixWorld(); camera.getWorldPosition(world); camera.getWorldQuaternion(rotation); camera.getWorldDirection(cameraForward);
      const cut = initialized && (rotation.angleTo(previous) > Math.max(.09, dt * 2.8)
        || Math.abs(camera.fov - lastFov) > 7 || Math.abs(Math.log(camera.aspect / lastAspect)) > .22);
      if (!night) { pose.opacity = 0; fadingCut = false; }
      if (night && cut && !fadingCut && pose.opacity > .01) {
        if (lastRadiusNdc > 0 && Math.abs(projected.x) < 1.2 && Math.abs(projected.y) < 1.2) {
          heldNdc.copy(projected); heldRadiusNdc = lastRadiusNdc; fadingCut = true;
        } else pose.opacity = 0;
      }
      previous.copy(rotation); lastFov = camera.fov; lastAspect = camera.aspect; initialized = true;

      let justHidden = false;
      if (fadingCut) {
        // Preserve the last apparent position/size while fading; never slide a
        // visible moon across the screen to catch up with a snapped camera.
        direction.set(heldNdc.x, heldNdc.y, .5).unproject(camera).sub(world).normalize();
        upper.set(heldNdc.x, heldNdc.y + heldRadiusNdc, .5).unproject(camera).sub(world).normalize();
        pose.radius = MOON_DISTANCE * Math.tan(Math.acos(MathUtils.clamp(direction.dot(upper), -1, 1)));
        pose.opacity = Math.max(0, pose.opacity - dt / .26);
        projected.copy(heldNdc);
        if (pose.opacity <= .001) { pose.opacity = 0; fadingCut = false; justHidden = true; }
        else { pose.pending = true; return pose; }
      }

      direction.copy(SKY_DIRECTION);
      pose.radius = MOON_DISTANCE * Math.tan(MOON_ANGULAR_RADIUS);
      const projection = project(camera, MOON_ANGULAR_RADIUS);
      lastRadiusNdc = projection.radiusY;
      const target = night ? projection.edge : 0;
      if (justHidden) { pose.pending = target > 0; return pose; }
      // Faster fade-out at viewport edges, slower fade-in. Position is never
      // clamped back into the frame: the camera can naturally leave the moon.
      const rate = target < pose.opacity ? 18 : 5;
      pose.opacity = MathUtils.damp(pose.opacity, target, rate, dt);
      if (Math.abs(pose.opacity - target) < .001) pose.opacity = target;
      pose.pending = night && Math.abs(pose.opacity - target) > .001;
      return pose;
    },
  };
}
