import * as THREE from 'three';
import type { LandmarkModel } from '../types';
import { createVillaSerrana } from './architectureWater';
import { createStewartVargas } from './stewartVargas';

/** Two complete visits in one destination: pavilion first, then the dam. */
export function createVillaSerranaDam(): LandmarkModel {
  const model = createStewartVargas(), legacy = createVillaSerrana();
  const pavilion = legacy.group.children.find(object => object.isObject3D && object.type === 'Group' && object.position.z === 2);
  if (pavilion) {
    pavilion.removeFromParent(); pavilion.name = 'Ventorrillo de la Buena Vista';
    const terrain = model.group.children.find(object => object.userData.kind === 'terrain') as THREE.Mesh;
    model.group.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(-165, 100, -111), new THREE.Vector3(0, -1, 0));
    const ground = ray.intersectObject(terrain, false)[0]?.point.y ?? 20;
    pavilion.position.set(-165, ground - 6, -111); pavilion.scale.setScalar(.75); model.group.add(pavilion);
    const anchor = pavilion.position.clone(), target = anchor.clone().add(new THREE.Vector3(0, 12, 0));
    const footAt = (dx: number, dz: number) => {
      const foot = anchor.clone().add(new THREE.Vector3(dx, 0, dz));
      ray.set(new THREE.Vector3(foot.x, 100, foot.z), new THREE.Vector3(0, -1, 0));
      foot.y = (ray.intersectObject(terrain, false)[0]?.point.y ?? ground) + .04;
      return foot;
    };
    model.introViews = [{
      label: 'Ventorrillo de la Buena Vista', origin: anchor, target,
      cameraDirection: new THREE.Vector3(.75, .27, 1), bounds: { radius: 59.25, height: 22.5 },
      focus: 26, portraitFocus: 22, eye: 15, rise: 6, reveal: 23, sweep: .34,
      approachFocusFactor: 0, portraitViewOffsetX: 0, portraitViewOffset: .24,
      nightLighting: {
        floodlights: [
          { foot: footAt(20, 28), target: target.clone(), angle: .6, strength: 3.6, color: '#ffe3b2' },
          { foot: footAt(-20, 16), target: target.clone().add(new THREE.Vector3(0, 5, -4)), angle: .66, strength: 2.4, color: '#c0d6ed' },
        ],
        setNight() { /* Shared night rig moves between the two visits. */ },
      },
    }];
  }
  model.group.name = 'Villa Serrana — Ventorrillo y Represa Stewart Vargas';
  return model;
}
