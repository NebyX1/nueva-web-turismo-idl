import * as THREE from 'three';
import type { LandmarkModel } from './types';
import { createJourneyMoonMotion, MOON_DISTANCE } from './journeyMoon';

export interface AtmosphereSite {
  /** World-space placement and point of interest from the journey scene. */
  origin: THREE.Vector3;
  target: THREE.Vector3;
  direction: THREE.Vector3;
  model: LandmarkModel;
}
export interface JourneyAtmosphere {
  group: THREE.Group;
  setNight(night: boolean): void;
  /** True while a short sky dissolve still needs frames, even during pause. */
  update(camera: THREE.PerspectiveCamera, activeIndex: number, time: number, deltaSeconds?: number): boolean;
  dispose(): void;
}
type RigPose = { foot: THREE.Vector3; aim: THREE.Vector3; scale: number; angle: number; strength: number; color?: THREE.ColorRepresentation; penumbra?: number };
const Y = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;

function random(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}

function moonMaterial() {
  const rng = random(19690720), craters: THREE.Vector4[] = [];
  for (let i = 0; i < 16; i++) {
    const a = rng() * TAU, r = Math.sqrt(rng()) * .86;
    craters.push(new THREE.Vector4(Math.cos(a) * r, Math.sin(a) * r, Math.sqrt(1 - r * r), .055 + rng() * .105));
  }
  return new THREE.ShaderMaterial({
    name: 'Journey Moon — procedural cratered stone',
    uniforms: { uCraters: { value: craters }, uOpacity: { value: 0 } },
    transparent: true, depthTest: true, depthWrite: true, toneMapped: false,
    vertexShader: `
      varying vec3 vSphere; varying vec3 vViewNormal;
      void main(){vSphere=normalize(position);vViewNormal=normalize(normalMatrix*normal);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
    `,
    fragmentShader: `
      precision highp float;
      uniform vec4 uCraters[16]; uniform float uOpacity; varying vec3 vSphere; varying vec3 vViewNormal;
      float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){
        if(uOpacity<.001)discard;
        vec3 n=normalize(vSphere);float grain=noise(n*96.0)*.035+noise(n*29.0)*.055;
        float maria=smoothstep(.34,.72,noise(n*3.2+vec3(2.7,4.1,.3))*.72+noise(n*6.5)*.28);
        float relief=0.0;
        for(int i=0;i<16;i++){
          float d=acos(clamp(dot(n,uCraters[i].xyz),-1.0,1.0))/uCraters[i].w;
          float basin=exp(-d*d*3.8),rim=exp(-pow((d-.84)/.17,2.0));
          relief+=rim*.105-basin*.105;
        }
        float light=.84+.16*max(dot(normalize(vViewNormal),normalize(vec3(-.25,.32,1.0))),0.0);
        float limb=.79+.21*pow(max(normalize(vViewNormal).z,0.0),.45);
        vec3 stone=mix(vec3(.86,.87,.82),vec3(.52,.57,.57),maria*.62);
        gl_FragColor=vec4(clamp((stone+relief+grain)*light*limb,0.0,1.0),uOpacity);
        #include <colorspace_fragment>
      }
    `,
  });
}

function makeStars(mobile: boolean) {
  const count = mobile ? 430 : 920, rng = random(11723);
  const positions: number[] = [], sizes: number[] = [], phases: number[] = [], colors: number[] = [];
  for (let i = 0; i < count; i++) {
    const y = .08 + rng() * .92, a = rng() * TAU, r = Math.sqrt(Math.max(0, 1 - y * y));
    positions.push(Math.cos(a) * r * 3900, y * 3900, Math.sin(a) * r * 3900);
    sizes.push(.7 + Math.pow(rng(), 3) * (mobile ? 1.5 : 1.9)); phases.push(rng() * TAU);
    const warm = rng(); colors.push(.78 + warm * .19, .83 + warm * .13, .97 - warm * .12);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const surface = new THREE.ShaderMaterial({
    name: 'Journey Stars — soft points', transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      uniform float uTime;attribute float aSize;attribute float aPhase;attribute vec3 color;
      varying vec3 vColor;varying float vLight;
      void main(){vColor=color;vLight=.76+.12*sin(uTime*.48+aPhase);
        gl_PointSize=aSize;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
    `,
    fragmentShader: `
      varying vec3 vColor;varying float vLight;
      void main(){float r=length(gl_PointCoord-.5);float alpha=(1.0-smoothstep(.1,.5,r))*vLight;
        if(alpha<.01)discard;gl_FragColor=vec4(vColor,alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const stars = new THREE.Points(geometry, surface); stars.name = 'journey-night-stars';
  stars.frustumCulled = false; stars.renderOrder = 3;
  return stars;
}

function beamMaterial(color: string, opacity: number) {
  return new THREE.ShaderMaterial({
    name: 'Journey Spotlight — subtle dust cone',
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
    transparent: true, depthTest: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;
      void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.0);vView=-p.xyz;
        vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`,
    fragmentShader: `uniform vec3 uColor;uniform float uOpacity;varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;
      void main(){float edge=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),1.4);
        float fade=smoothstep(0.0,.16,vUv.y)*(1.0-smoothstep(.80,1.0,vUv.y));
        gl_FragColor=vec4(uColor,uOpacity*fade*(.35+.65*edge));
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Adds one owned night-only group to scene. The scene keeps ownership of its
 * existing sky/fog/ambient/daylight; this module never changes those settings.
 * Two shadowless SpotLights follow the active site, independent of site count.
 */
export function createJourneyAtmosphere(scene: THREE.Scene, sites: AtmosphereSite[], mobile: boolean): JourneyAtmosphere {
  const group = new THREE.Group(); group.name = 'journey-night-atmosphere'; group.visible = false;
  group.userData.night = false; group.userData.activeIndex = -1; group.userData.spotLightCount = 2;
  const skyRoot = new THREE.Group(); skyRoot.name = 'journey-night-sky-camera-root'; group.add(skyRoot);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1, mobile ? 40 : 64, mobile ? 24 : 40), moonMaterial());
  moon.name = 'journey-full-moon'; moon.renderOrder = 2; moon.frustumCulled = false;
  skyRoot.add(moon);
  const stars = makeStars(mobile); skyRoot.add(stars);
  const rig = new THREE.Group(); rig.name = 'journey-active-site-light-rig'; group.add(rig);

  // Shared fixture geometry and surfaces: two actual low-mounted park floodlights.
  const baseGeo = new THREE.CylinderGeometry(.57, .67, .16, 12);
  const standGeo = new THREE.CylinderGeometry(.045, .065, 1.36, 7);
  const housingGeo = new THREE.BoxGeometry(.86, .58, .62);
  const lensGeo = new THREE.CircleGeometry(.245, 20);
  const beamGeo = new THREE.ConeGeometry(1, 1, mobile ? 12 : 20, 1, true);
  const metal = new THREE.MeshStandardMaterial({ color: '#303b3d', roughness: .64, metalness: .55 });
  const concrete = new THREE.MeshStandardMaterial({ color: '#7b8075', roughness: 1 });
  const lights: THREE.SpotLight[] = [], fixtures: THREE.Group[] = [], lampHeads: THREE.Group[] = [], cones: THREE.Mesh[] = [];
  const lensSurfaces: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 2; i++) {
    const color = i === 0 ? '#ffd9a3' : '#a6c6ee';
    const light = new THREE.SpotLight(color, 0, 200, .5, .72, 2);
    light.name = i === 0 ? 'journey-night-warm-key' : 'journey-night-cool-rim';
    light.castShadow = false; light.visible = false; light.target.name = `${light.name}-target`; rig.add(light, light.target); lights.push(light);
    const fixture = new THREE.Group(); fixture.name = `journey-floodlight-fixture-${i}`;
    const foot = new THREE.Mesh(baseGeo, concrete); foot.position.y = .08;
    const stand = new THREE.Mesh(standGeo, metal); stand.position.y = .84;
    const head = new THREE.Group(); head.name = `journey-floodlight-housing-${i}`; head.position.y = 1.65;
    const housing = new THREE.Mesh(housingGeo, metal);
    const lensSurface = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.3, roughness: .3 });
    lensSurfaces.push(lensSurface);
    const lens = new THREE.Mesh(lensGeo, lensSurface);
    lens.position.z = .316; lens.name = `journey-floodlight-lens-${i}`;
    head.add(housing, lens); fixture.add(foot, stand, head); rig.add(fixture); fixtures.push(fixture); lampHeads.push(head);
    const cone = new THREE.Mesh(beamGeo, beamMaterial(color, i === 0 ? .009 : .006));
    cone.name = `journey-night-beam-${i}`; cone.renderOrder = 4; cone.frustumCulled = false; rig.add(cone); cones.push(cone);
  }
  scene.add(group); scene.updateMatrixWorld(true);

  // Vertical terrain planes include the global relief and each site's modeled
  // hill. Rejecting foliage/architecture avoids perching a fixture on a tree.
  const groundPlanes: THREE.Mesh[] = [];
  scene.traverse(object => {
    if (object instanceof THREE.Mesh && !(object instanceof THREE.InstancedMesh)
      && object.geometry.type === 'PlaneGeometry' && !Array.isArray(object.material)
      && !(object.material instanceof THREE.ShaderMaterial)) groundPlanes.push(object);
  });
  const ray = new THREE.Raycaster(), normalMatrix = new THREE.Matrix3();
  function groundAt(site: AtmosphereSite, x: number, z: number) {
    const high = site.origin.y + Math.max(180, site.model.bounds.height * 2.5);
    ray.set(new THREE.Vector3(x, high, z), new THREE.Vector3(0, -1, 0)); ray.far = Math.max(450, site.model.bounds.height * 5);
    const hits = ray.intersectObjects(groundPlanes, false);
    for (const hit of hits) {
      if (!hit.face) continue;
      normalMatrix.getNormalMatrix(hit.object.matrixWorld);
      if (hit.face.normal.clone().applyMatrix3(normalMatrix).normalize().y > .6) return hit.point.y + .035;
    }
    return site.origin.y + .035;
  }
  const poses: RigPose[][] = sites.map(site => {
    if (site.model.nightLighting) {
      return site.model.nightLighting.floodlights.map(light => ({
        foot: site.model.group.localToWorld(light.foot.clone()),
        aim: site.model.group.localToWorld(light.target.clone()),
        scale: light.scale ?? 1, angle: light.angle, strength: light.strength, color: light.color, penumbra: light.penumbra,
      } satisfies RigPose));
    }
    const radius = Math.max(1, site.model.bounds.radius), height = Math.max(1, site.model.bounds.height);
    const forward = site.direction.clone().setY(0);
    if (forward.lengthSq() < .001) forward.set(0, 0, 1); forward.normalize();
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const distance = THREE.MathUtils.clamp(radius * .56, 30, 100);
    const coverage = THREE.MathUtils.clamp(Math.min(radius * .42, height * .65), 10, 70);
    return [0, 1].map(i => {
      const foot = site.target.clone().addScaledVector(forward, distance * (i === 0 ? .88 : -.62))
        .addScaledVector(right, distance * (i === 0 ? -.64 : .82));
      foot.y = groundAt(site, foot.x, foot.z);
      const aim = site.target.clone();
      aim.y = Math.max(site.origin.y + 1, aim.y - height * .035);
      const scale = THREE.MathUtils.clamp(radius / 100, .85, 1.45);
      const lamp = foot.clone().addScaledVector(Y, 1.65 * scale);
      const reach = lamp.distanceTo(aim);
      return { foot, aim, scale, angle: THREE.MathUtils.clamp(Math.atan2(coverage, reach) * 1.12, .28, .78), strength: i === 0 ? 3.9 : 2.0 } satisfies RigPose;
    });
  });
  let night = false, disposed = false, active = -1;
  const cameraWorld = new THREE.Vector3(), direction = new THREE.Vector3(), moonFacing = new THREE.Vector3();
  const moonMotion = createJourneyMoonMotion(), Z = new THREE.Vector3(0, 0, 1);
  function updateSiteLights() {
    sites.forEach((site, index) => site.model.nightLighting?.setNight(night, active === index));
  }
  function placeRig(index: number) {
    const pose = poses[index]; rig.visible = night && Boolean(pose);
    if (!pose) return;
    for (let i = 0; i < 2; i++) {
      const p = pose[i], fixture = fixtures[i], light = lights[i], cone = cones[i];
      fixture.position.copy(p.foot); fixture.scale.setScalar(p.scale);
      light.position.copy(p.foot).addScaledVector(Y, 1.65 * p.scale);
      light.target.position.copy(p.aim); light.angle = p.angle; light.penumbra = p.penumbra ?? .72;
      light.color.set(p.color ?? (i === 0 ? '#ffd9a3' : '#a6c6ee'));
      lensSurfaces[i].color.copy(light.color); lensSurfaces[i].emissive.copy(light.color);
      (cone.material as THREE.ShaderMaterial).uniforms.uColor.value.copy(light.color);
      const reach = light.position.distanceTo(p.aim);
      light.distance = reach * 2.7 + 30; light.intensity = reach * reach * p.strength;
      // Group.lookAt uses +Z, matching the lens on the front of the housing.
      fixture.updateMatrixWorld(true); lampHeads[i].lookAt(p.aim);
      direction.copy(p.aim).sub(light.position).normalize();
      const length = reach * 1.08;
      cone.position.copy(light.position).addScaledVector(direction, length * .5);
      cone.quaternion.setFromUnitVectors(Y, direction.clone().negate());
      cone.scale.set(length * Math.tan(p.angle) * .90, length, length * Math.tan(p.angle) * .90);
      light.visible = night; light.target.updateMatrixWorld(true);
    }
    group.userData.activeIndex = index;
  }
  return {
    group,
    setNight(value) {
      if (disposed) return;
      night = Boolean(value); group.visible = night; group.userData.night = night;
      for (const light of lights) light.visible = night;
      rig.visible = night && sites.length > 0;
      if (night && active >= 0) placeRig(active);
      updateSiteLights();
    },
    update(camera, activeIndex, time, deltaSeconds = 1 / 60) {
      if (disposed) return false;
      camera.updateMatrixWorld(); camera.getWorldPosition(cameraWorld);
      skyRoot.position.copy(cameraWorld);
      const moonPose = moonMotion.update(camera, deltaSeconds, night);
      moon.position.copy(moonPose.direction).multiplyScalar(MOON_DISTANCE);
      moon.quaternion.setFromUnitVectors(Z, moonFacing.copy(moonPose.direction).negate());
      moon.scale.setScalar(moonPose.radius); moon.material.uniforms.uOpacity.value = moonPose.opacity;
      group.userData.moonNdc = [moonPose.ndc.x, moonPose.ndc.y];
      stars.material.uniforms.uTime.value = Number.isFinite(time) ? time : 0;
      const index = sites.length ? THREE.MathUtils.clamp(Number.isFinite(activeIndex) ? Math.trunc(activeIndex) : 0, 0, sites.length - 1) : -1;
      if (index !== active) { active = index; placeRig(index); updateSiteLights(); }
      return moonPose.pending;
    },
    dispose() {
      if (disposed) return;
      disposed = true; group.removeFromParent();
      sites.forEach(site => site.model.nightLighting?.setNight(false, false));
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      group.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          geometries.add(object.geometry);
          for (const surface of Array.isArray(object.material) ? object.material : [object.material]) materials.add(surface);
        }
      });
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(surface => surface.dispose());
      lights.forEach(light => light.dispose()); group.clear();
      group.userData.disposed = true;
    },
  };
}
