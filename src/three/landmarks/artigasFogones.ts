import * as THREE from 'three';
import { createArtigas } from './artigas';
import { createFestivalNight } from './festivalNight';
import type { LandmarkModel } from '../types';

/** Preserve the accepted sculpture/flags; add an entirely night-only assembly. */
export function createArtigasWithFogones(): LandmarkModel {
  const model = createArtigas(); model.group.updateMatrixWorld(true);
  const terrain = model.group.getObjectByName('Cerro herbáceo urbano') as THREE.Mesh;
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
  const groundAt = (x: number, z: number) => { ray.set(new THREE.Vector3(x, 120, z), down); return ray.intersectObject(terrain, false)[0]?.point.y ?? 0; };
  const people: { x: number; z: number }[] = [];
  const campfires = [{ x: -42, z: 20 }, { x: 38, z: 29 }, { x: -54, z: -17 }];
  for (let row = 0; row < 39; row++) for (let col = 0; col < 72; col++) {
    const x = -12 + (col - 35.5) * 1.15 + Math.sin(row * 7 + col * 13) * .23, z = -43 + row * 1.25 + Math.sin(col * 17 + row * 3) * .23;
    if (Math.hypot(x / 71, z / 66) > .91 || Math.hypot(x, z) < 16 || (Math.abs(x - 23) < 7 && Math.abs(z + 9) < 7) || campfires.some(p => Math.hypot(x - p.x, z - p.z) < 2.6) || (row * 3 + col) % 7 === 0) continue;
    people.push({ x, z });
  }
  const festival = createFestivalNight({ name: 'Cerro Artigas — Noche de los Fogones', stage: new THREE.Vector3(-25, 0, -63), width: 29, depth: 13, people, groundAt, fireworks: true, campfires, seed: 1974 });
  model.group.add(festival.group); model.cameraLabel = 'Monumento a Artigas';
  model.nightView = {
    label: 'Noche de los Fogones', origin: new THREE.Vector3(), target: new THREE.Vector3(-10, 16, -25), cameraDirection: new THREE.Vector3(-.62, .2, .97), bounds: { radius: 118, height: 78 },
    focus: 46, portraitFocus: 35, eye: 58, portraitEye: 61, rise: 10, reveal: 35, sweep: .25, approachFocusFactor: 0, portraitViewOffsetX: 0, portraitViewOffset: .24,
  };
  model.nightLighting = {
    floodlights: [
      { foot: new THREE.Vector3(-28, groundAt(-28, 18) + .04, 18), target: new THREE.Vector3(0, 35, 0), angle: .57, strength: 4.3, color: '#ffe0ae' },
      { foot: new THREE.Vector3(32, groundAt(32, -3) + .04, -3), target: new THREE.Vector3(8, 34, -2), angle: .64, strength: 3.2, color: '#b9d1ec' },
    ],
    setNight(night, active) { festival.setNight(night, active); },
  };
  model.update = time => festival.update(time);
  return model;
}
