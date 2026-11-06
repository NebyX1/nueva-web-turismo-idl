import * as THREE from 'three';

export const NIGHT_VISITOR_TIMING = { first: [8, 15], between: [30, 58], duration: [9, 12] } as const;
export type NightVisitorKind = 'witch' | 'dragon' | 'santa' | 'ufo';
type VisitorModel = { group: THREE.Group; animate(time: number): void; width: number; height: number; surfaces: THREE.MeshStandardMaterial[] };

// Small theatrical sculptures; no images, fonts, extra lights or shadow maps.
function sculpt(build: (group: THREE.Group, paint: (color: string, metal?: number) => THREE.MeshStandardMaterial) => (time: number) => void): VisitorModel {
  const group = new THREE.Group(), palette = new Map<string, THREE.MeshStandardMaterial>();
  const paint = (color: string, metal = 0) => {
    const key = `${color}:${metal}`;
    if (!palette.has(key)) palette.set(key, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .26, roughness: .65, metalness: metal, fog: false, transparent: true, side: THREE.DoubleSide }));
    return palette.get(key)!;
  };
  const animate = build(group, paint), size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  palette.forEach(surface => { surface.userData.visitorOpacity = surface.opacity; });
  group.traverse(object => { object.frustumCulled = false; });
  return { group, animate, width: size.x, height: size.y, surfaces: [...palette.values()] };
}
function mesh(group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material); object.position.set(x, y, z); group.add(object); return object;
}
function oval(group: THREE.Group, material: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
  const object = mesh(group, new THREE.SphereGeometry(1, 12, 8), material, x, y, z); object.scale.set(sx, sy, sz); return object;
}
function rod(group: THREE.Group, material: THREE.Material, from: number[], to: number[], radius: number) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), direction = b.sub(a);
  const object = mesh(group, new THREE.CylinderGeometry(radius, radius * .92, direction.length(), 7), material);
  object.position.copy(a).addScaledVector(direction, .5); object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); return object;
}
function stroke(group: THREE.Group, material: THREE.Material, points: number[][], radius: number) {
  return mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), points.length * 5, radius, 5, false), material);
}

function witch() {
  return sculpt((group, paint) => {
    const plum = paint('#764b9d'), dark = paint('#252539'), skin = paint('#bad78a'), gold = paint('#dcb15c'), wood = paint('#9a6945');
    rod(group, wood, [-4.5, -1.1, 0], [4.6, -.85, 0], .09);
    for (let i = 0; i < 11; i++) rod(group, gold, [-3.2, -1.07, 0], [-5.7 + Math.sin(i) * .25, -1.45 + i * .075, Math.sin(i * 2) * .36], .055);
    rod(group, gold, [-3.65, -1.15, -.27], [-3.65, -.85, .27], .07);
    const cape = new THREE.Shape(); cape.moveTo(1, .8); cape.bezierCurveTo(-.4, .6, -1.5, -.4, -3.7, -.65); cape.lineTo(-2.4, 1.1); cape.quadraticCurveTo(-.8, 1.9, .6, 1.4);
    mesh(group, new THREE.ExtrudeGeometry(cape, { depth: .11, bevelEnabled: false, curveSegments: 10 }), plum, 0, 0, -.35);
    const robe = mesh(group, new THREE.ConeGeometry(.83, 2.3, 12), plum, .9, .25); robe.rotation.z = -.3;
    rod(group, skin, [1.5, .8, .1], [2.2, .05, .2], .15); rod(group, skin, [2.2, .05, .2], [3.1, -.5, .15], .13);
    for (const z of [-.3, .35]) { rod(group, dark, [.75, -.5, z], [1.6, -1.65, z], .14); oval(group, dark, 1.95, -1.65, z, .5, .18, .21); }
    oval(group, skin, 1.6, 1.6, 0, .48, .62, .41);
    const nose = mesh(group, new THREE.ConeGeometry(.15, .72, 9), skin, 2.08, 1.5, .18); nose.rotation.z = -Math.PI / 2;
    oval(group, skin, 2.38, 1.35, .18, .12, .15, .13);
    for (const z of [-.25, .29]) { oval(group, paint('#fff4cf'), 1.92, 1.78, z, .13, .16, .08); oval(group, dark, 1.98, 1.78, z + .03, .06, .09, .05); }
    for (let i = 0; i < 5; i++) stroke(group, dark, [[1.3, 2, -.26 + i * .13], [.9, 1.45, -.35 + i * .13], [.5, 1.08, -.35 + i * .13]], .1);
    const brim = mesh(group, new THREE.CylinderGeometry(1, 1.07, .13, 18), dark, 1.5, 2.12);
    brim.rotation.z = .12;
    const hat = mesh(group, new THREE.ConeGeometry(.63, 1.65, 14), plum, 1.33, 2.9); hat.rotation.z = .26;
    mesh(group, new THREE.CylinderGeometry(.62, .67, .2, 14), gold, 1.48, 2.3);
    oval(group, dark, 1.02, 3.62, 0, .25, .14, .19);
    group.name = 'Bruja viajera en su escoba';
    return time => { robe.rotation.z = -.3 + Math.sin(time * 3) * .05; };
  });
}

function dragon() {
  return sculpt((group, paint) => {
    const red = paint('#d95044'), gold = paint('#f3c66c', .15), cream = paint('#f8e4ae'), dark = paint('#293343');
    const segments: THREE.Group[] = [];
    for (let i = 0; i < 23; i++) {
      const part = new THREE.Group(), x = 2.35 - i * .39, y = Math.sin(i * .45) * .65;
      const size = i < 16 ? .53 : Math.max(.1, .53 - (i - 16) * .065);
      part.position.set(x, y, 0); part.userData.restY = y;
      oval(part, red, 0, 0, 0, .36, size, size * .8);
      oval(part, gold, 0, -.2, .14, .33, size * .58, size * .75);
      const spine = mesh(part, new THREE.ConeGeometry(size * .22, size * .9, 6), gold, 0, size + .14); spine.rotation.z = .5;
      group.add(part); segments.push(part);
    }
    const head = new THREE.Group(); head.position.set(3, .55, 0); group.add(head);
    oval(head, red, 0, 0, 0, .88, .73, .68); oval(head, gold, .8, -.13, .02, .85, .35, .48);
    oval(head, dark, 1.38, .03, .37, .12, .09, .08);
    for (const side of [-1, 1]) {
      oval(head, cream, .28, .35, side * .55, .29, .25, .17); oval(head, dark, .39, .34, side * .67, .1, .17, .07);
      stroke(head, cream, [[-.32, .5, side * .4], [-.5, 1.15, side * .53], [-1.05, 1.5, side * .65]], .1);
      rod(head, cream, [-.5, 1.1, side * .53], [-.2, 1.5, side * .57], .07);
      stroke(head, gold, [[1.1, -.2, side * .35], [1.4, -.7, side * .6], [.75, -.92, side * .8], [.15, -.65, side * .9]], .055);
      mesh(head, new THREE.ConeGeometry(.11, .28, 6), cream, .78, -.47, side * .32).rotation.z = Math.PI;
      for (const x of [1.35, -2]) {
        stroke(group, red, [[x, -.1, side * .3], [x + .35, -.85, side * .8], [x + .1, -1.25, side * 1.04]], .15);
        for (let toe = 0; toe < 3; toe++) rod(group, cream, [x + .1, -1.25, side * 1.04], [x + .65, -1.35, side * (.8 + toe * .25)], .06);
      }
    }
    for (let i = 0; i < 7; i++) mesh(head, new THREE.ConeGeometry(.19, .68, 6), gold, -.6 - i * .08, .45 - i * .14, .12).rotation.z = 1.1 + i * .17;
    group.name = 'Dragón chino de las sierras';
    return time => { segments.forEach((part, i) => { part.position.y = part.userData.restY + Math.sin(time * 3.2 - i * .43) * .28; }); head.rotation.z = Math.sin(time * 2.4) * .06; };
  });
}

function santa() {
  return sculpt((group, paint) => {
    const red = paint('#d74c4d'), white = paint('#fff1d9'), gold = paint('#e9bc69', .3), brown = paint('#ac7750'), dark = paint('#303245');
    const sleigh = new THREE.Shape(); sleigh.moveTo(-2.7, -.5); sleigh.lineTo(1.5, -.5); sleigh.quadraticCurveTo(3.4, -.2, 2.9, 1.1); sleigh.quadraticCurveTo(2.5, .1, 1.7, .2); sleigh.lineTo(-2, .4); sleigh.lineTo(-2.7, 1.1); sleigh.closePath();
    mesh(group, new THREE.ExtrudeGeometry(sleigh, { depth: 1.35, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .06, bevelThickness: .06 }), red, 0, 0, -.67);
    for (const side of [-1, 1]) {
      stroke(group, gold, [[-2.6, -1.05, side * .72], [1.9, -1.05, side * .72], [3.05, -.6, side * .72], [2.9, -.08, side * .72]], .08);
      rod(group, gold, [-1.6, -.9, side * .72], [-1.6, -.25, side * .72], .06); rod(group, gold, [1.3, -.9, side * .72], [1.3, -.25, side * .72], .06);
    }
    oval(group, paint('#85905c'), -1.9, 1.1, 0, .9, 1.2, .7); rod(group, gold, [-1.9, 2.1, -.35], [-1.9, 2.1, .35], .08);
    oval(group, red, .1, 1.1, 0, .7, .88, .56); mesh(group, new THREE.CylinderGeometry(.7, .72, .13, 12), dark, .1, .9);
    mesh(group, new THREE.BoxGeometry(.28, .26, .1), gold, .14, .94, .57);
    oval(group, paint('#efc29d'), .23, 2.12, 0, .46, .48, .42); oval(group, white, .46, 1.9, .2, .48, .46, .42);
    oval(group, paint('#efb08d'), .69, 2.18, .23, .19, .16, .18);
    for (const z of [-.22, .29]) oval(group, dark, .48, 2.29, z, .045, .06, .05);
    mesh(group, new THREE.CylinderGeometry(.48, .49, .16, 14), white, .17, 2.48);
    const hat = mesh(group, new THREE.ConeGeometry(.48, .9, 12), red, 0, 2.96); hat.rotation.z = .4;
    oval(group, white, -.3, 3.3, 0, .19, .19, .19);
    const hand = oval(group, white, 1.18, 1.57, .5, .19, .2, .19);
    rod(group, red, [.45, 1.47, .35], [1.1, 1.55, .5], .2);
    const deer = new THREE.Group(); deer.position.set(5.3, .25, .1); group.add(deer);
    oval(deer, brown, 0, .1, 0, 1.1, .48, .4); rod(deer, brown, [.65, .25, 0], [1.03, 1.15, 0], .25);
    oval(deer, brown, 1.28, 1.2, 0, .47, .34, .28); oval(deer, red, 1.73, 1.22, .02, .15, .16, .17);
    oval(deer, dark, 1.38, 1.35, .26, .065, .065, .04);
    const legs: THREE.Mesh[] = [];
    for (const side of [-1, 1]) {
      for (const x of [-.7, .65]) { const leg = rod(deer, brown, [x, 0, side * .24], [x - .25, -.95, side * .3], .09); legs.push(leg); }
      stroke(deer, cream(paint), [[.96, 1.39, side * .15], [.8, 2.1, side * .35], [1.05, 2.5, side * .4]], .065);
      rod(deer, cream(paint), [.8, 2.05, side * .35], [.38, 2.35, side * .38], .05);
      stroke(group, gold, [[1.15, 1.55, side * .45], [3.3, .25, side * .5], [5.4, .3, side * .38]], .025);
    }
    group.name = 'Papá Noel en vuelo fuera de temporada';
    return time => { deer.rotation.z = Math.sin(time * 3.7) * .055; legs.forEach((leg, i) => { leg.rotation.z = .2 + Math.sin(time * 5 + i * 1.8) * .2; }); hand.position.y = 1.57 + Math.sin(time * 5) * .14; };
  });
}
function cream(paint: (color: string) => THREE.MeshStandardMaterial) { return paint('#efdbab'); }

function ufo() {
  return sculpt((group, paint) => {
    const silver = paint('#a9bdce', .7), dark = paint('#344a70', .45), cyan = paint('#8deae1', .25), pink = paint('#edb2e8');
    const profile = [[0, -.48], [1, -.42], [2.8, -.17], [3.6, .03], [3.1, .29], [1.4, .48], [0, .48]].map(([r, y]) => new THREE.Vector2(r, y));
    mesh(group, new THREE.LatheGeometry(profile, 36), silver);
    const rim = mesh(group, new THREE.TorusGeometry(3.3, .1, 6, 36), dark, 0, .07); rim.rotation.x = Math.PI / 2;
    const glass = paint('#9ce7e0', .2); glass.opacity = .38; glass.depthWrite = false;
    mesh(group, new THREE.SphereGeometry(1.34, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, .38);
    oval(group, paint('#b0df91'), 0, .85, .18, .45, .59, .34);
    for (const side of [-1, 1]) { const eye = oval(group, paint('#1b3445'), side * .21, .96, .46, .12, .2, .055); eye.rotation.z = side * -.3; }
    const lamps = new THREE.Group(); group.add(lamps);
    for (let i = 0; i < 12; i++) { const angle = i * Math.PI / 6; oval(lamps, i % 2 ? cyan : pink, Math.cos(angle) * 2.8, -.15, Math.sin(angle) * 2.8, .16, .09, .16); }
    oval(group, cyan, 0, -.48, 0, .65, .1, .65);
    group.name = 'Ovni de paseo por Lavalleja';
    return time => { lamps.rotation.y = time * .85; group.rotation.z = Math.sin(time * 2.1) * .055; };
  });
}

/** Parent is the translation-only sky root. Animation gets a separate, paused-safe delta. */
export function createJourneyNightVisitors(rng: () => number = Math.random) {
  const group = new THREE.Group(); group.name = 'journey-night-visitors'; group.visible = false;
  const models: Record<NightVisitorKind, VisitorModel> = { witch: witch(), dragon: dragon(), santa: santa(), ufo: ufo() };
  for (const [kind, model] of Object.entries(models)) { model.group.visible = false; model.group.userData.kind = kind; group.add(model.group); }
  const range = (bounds: readonly number[]) => bounds[0] + rng() * (bounds[1] - bounds[0]);
  let night = false, wait = 0, age = 0, duration = 0, active: NightVisitorKind | null = null, previous: NightVisitorKind | null = null;
  let bag: NightVisitorKind[] = [], direction = 1, altitude = .5, wave = 0;
  const point = new THREE.Vector3(), bearing = new THREE.Vector3(), orientation = new THREE.Quaternion();
  const flight = new THREE.Group(); flight.name = 'journey-night-visitor-flight'; group.add(flight);
  function hide() { if (active) models[active].group.visible = false; active = null; flight.visible = false; group.userData.active = null; }
  function next() {
    if (!bag.length) {
      bag = ['witch', 'dragon', 'santa', 'ufo'];
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      if (bag[bag.length - 1] === previous) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    }
    active = bag.pop()!; previous = active; age = 0; duration = range(NIGHT_VISITOR_TIMING.duration);
    direction = rng() < .5 ? 1 : -1; altitude = .55 + rng() * .08; wave = rng() * Math.PI * 2;
    const model = models[active]; flight.add(model.group); model.group.visible = true; flight.visible = true;
    group.userData.active = active;
  }
  return {
    group,
    setNight(value: boolean) {
      if (night === value) return;
      night = value; group.visible = night; hide();
      wait = range(NIGHT_VISITOR_TIMING.first);
    },
    update(camera: THREE.PerspectiveCamera, deltaSeconds: number) {
      if (!night) return;
      const delta = Number.isFinite(deltaSeconds) ? THREE.MathUtils.clamp(deltaSeconds, 0, .25) : 0;
      camera.getWorldQuaternion(orientation);
      const mobile = (camera.view?.width ?? 1000) <= 700;
      // Defer a surprise while the camera is looking down at the terrain.
      // Mobile reserves the top band for both navigation rows and its status.
      bearing.set(0, mobile ? .28 : .50, .5).applyMatrix4(camera.projectionMatrixInverse).normalize().applyQuaternion(orientation);
      if (!active) { wait -= delta; if (wait <= 0 && delta > 0 && bearing.y > .035) next(); }
      if (!active) return;
      age += delta;
      if (age >= duration) { hide(); wait = range(NIGHT_VISITOR_TIMING.between); return; }
      const model = models[active], u = age / duration, distance = 1100;
      const x = direction * THREE.MathUtils.lerp(-1.4, 1.4, u), y = altitude - (mobile ? .22 : 0) + Math.sin(u * Math.PI * 2 + wave) * .045;
      point.set(x, y, .5).applyMatrix4(camera.projectionMatrixInverse); point.multiplyScalar(-distance / point.z).applyQuaternion(orientation);
      flight.position.copy(point); flight.quaternion.copy(orientation);
      const size = Math.min(distance / camera.projectionMatrix.elements[0] * (mobile ? .88 : .63) / model.width, distance / camera.projectionMatrix.elements[5] * (mobile ? .20 : .24) / model.height);
      flight.scale.setScalar(size); model.group.rotation.y = direction === 1 ? 0 : Math.PI;
      model.animate(age);
      const skyFade = THREE.MathUtils.smoothstep(point.y / distance, 0, .05);
      const fade = THREE.MathUtils.smoothstep(u, 0, .1) * (1 - THREE.MathUtils.smoothstep(u, .87, 1)) * skyFade;
      model.surfaces.forEach(surface => { surface.opacity = surface.userData.visitorOpacity * fade; });
      group.userData.progress = u;
    },
  };
}
