import * as THREE from 'three';
import type { LandmarkModel, LandmarkNightLighting } from '../types';
import { decodeStewartVargasGeometry } from './stewartVargas';
import { createFestivalNight } from './festivalNight';
import asset from './parqueRodoAsset.json';

export function createParqueRodo(): LandmarkModel {
  const group = new THREE.Group(); group.name = 'Parque Rodó de Minas — entrada, lago, paseos y ruedo';
  group.userData.assetSha256 = asset.sourceSha256; group.userData.parqueRodo = asset.landscape;
  const clock = { value: 0 };
  for (const part of asset.parts) {
    const material = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: part.kind === 'metal' ? .54 : .92, metalness: part.kind === 'metal' ? .35 : 0, side: ['leaf', 'glass', 'water'].includes(part.kind) ? THREE.DoubleSide : THREE.FrontSide });
    material.name = 'Parque Rodó — ' + part.kind;
    if (part.kind === 'glass') { material.transparent = true; material.opacity = .26; material.depthWrite = false; material.roughness = .25; }
    if (part.kind === 'water') {
      material.roughness = .20; material.metalness = .18; material.userData.waterClock = clock;
      material.onBeforeCompile = shader => {
        shader.uniforms.uParkTime = clock;
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vParkWater;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvParkWater=position;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uParkTime;varying vec3 vParkWater;')
          .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
            float wave=sin(vParkWater.x*1.6+uParkTime*.7)*.018+cos(vParkWater.z*1.3-uParkTime*.8)*.015;
            vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition),r1=cross(dy,normal),r2=cross(normal,dx);float det=dot(dx,r1);
            normal=normalize(abs(det)*normal-sign(det)*(dFdx(wave)*r1+dFdy(wave)*r2));`);
      };
      material.customProgramCacheKey = () => 'parque-rodo-water-1';
    }
    const mesh = new THREE.Mesh(decodeStewartVargasGeometry(part), material); mesh.name = 'Parque Rodó — ' + part.kind; mesh.userData.kind = part.kind;
    mesh.receiveShadow = true; mesh.castShadow = ['wood', 'bark', 'leaf', 'cream', 'stone', 'blue'].includes(part.kind);
    group.add(mesh);
  }
  group.updateMatrixWorld(true);
  const terrain = group.children.find(o => o.userData.kind === 'grass') as THREE.Mesh;
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0);
  const groundAt = (x: number, z: number) => { ray.set(new THREE.Vector3(x, 100, z), down); return ray.intersectObject(terrain, false)[0]?.point.y ?? .5; };
  const people: { x: number; z: number }[] = [];
  for (let row = 0; row < 34; row++) for (let col = 0; col < 57; col++) {
    const x = (col - 28) * 1.22 + Math.sin(row * 7 + col * 13) * .27, z = -26 + row * 1.35 + Math.sin(col * 17 + row * 3) * .26;
    if (Math.hypot(x / 47, (z + 4) / 31) > 1 || (Math.abs(x) < 1.4 && z > -16) || (row + col * 3) % 13 === 0) continue;
    people.push({ x, z });
  }
  const festival = createFestivalNight({ name: 'Parque Rodó — noche de festival', stage: new THREE.Vector3(0, 0, -46), width: 40, depth: 17, people, groundAt, seed: 1941 }); group.add(festival.group);
  const lighting = (points: [[number, number], [number, number]], target: THREE.Vector3): LandmarkNightLighting => {
    const lamp = ([x, z]: [number, number], i: number) => ({ foot: new THREE.Vector3(x, groundAt(x, z) + .04, z), target: target.clone(), angle: .63, strength: i ? 2.8 : 4.1, color: i ? '#b4d5e8' : '#ffdeb0' });
    return { floodlights: [lamp(points[0], 0), lamp(points[1], 1)], setNight() { /* The main visit owns the shared festival controller. */ } };
  };
  const gate = asset.landscape.gate.origin, lake = asset.landscape.lake.center;
  return {
    group, target: new THREE.Vector3(0, 5, -11), bounds: { radius: 340, height: 34 }, groundY: 0,
    cameraDirection: new THREE.Vector3(.22, .2, 1).normalize(), cameraLabel: 'Ruedo del Parque Rodó',
    nightView: { label: 'Ruedo del Parque Rodó', origin: new THREE.Vector3(0, 0, -30), target: new THREE.Vector3(0, 3, -43), cameraDirection: new THREE.Vector3(.14, .1, 1), bounds: { radius: 112, height: 37 }, focus: 30, portraitFocus: 35, eye: 17, portraitEye: 23, rise: 14, reveal: 6, sweep: .18, approachFocusFactor: 0, portraitViewOffsetX: 0, portraitViewOffset: .25 },
    introViews: [
      { label: 'Entrada y paseos', origin: new THREE.Vector3(...gate as [number, number, number]), target: new THREE.Vector3(0, gate[1] + 3.8, gate[2]), cameraDirection: new THREE.Vector3(.20, .1, 1), bounds: { radius: 48, height: 25 }, focus: 17, portraitFocus: 19, eye: 5.3, rise: 5.5, reveal: 10, sweep: .20, approachFocusFactor: 0, portraitViewOffsetX: 0, portraitViewOffset: .26, nightLighting: lighting([[-11, 260], [15, 255]], new THREE.Vector3(0, gate[1] + 4.0, gate[2])) },
      { label: 'Lago y mirador', origin: new THREE.Vector3(lake[0], 0, lake[2]), target: new THREE.Vector3(51, 2.0, 144), cameraDirection: new THREE.Vector3(-.55, .1, 1), bounds: { radius: 67, height: 31 }, focus: 29, portraitFocus: 28, eye: 44, portraitEye: 72, rise: 6, reveal: 16, sweep: .24, approachFocusFactor: 0, portraitViewOffsetX: 0, portraitViewOffset: .24, nightLighting: lighting([[12, 169], [88, 166]], new THREE.Vector3(44, 2, 145)) },
    ],
    nightLighting: {
      floodlights: [
        { foot: new THREE.Vector3(-57, groundAt(-57, 27) + .04, 27), target: new THREE.Vector3(0, 1, 0), angle: .72, strength: 3.0, color: '#ffe0b0' },
        { foot: new THREE.Vector3(57, groundAt(57, 19) + .04, 19), target: new THREE.Vector3(0, 3, -20), angle: .74, strength: 2.5, color: '#b5ccef' },
      ],
      setNight(night, active) { festival.setNight(night, active); },
    },
    update(time) { clock.value = Number.isFinite(time) ? time : 0; festival.update(clock.value); },
  };
}
