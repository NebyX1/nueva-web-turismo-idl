import * as THREE from 'three';

const NOISE = `
  float pHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float pNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(pHash(i),pHash(i+vec2(1,0)),f.x),mix(pHash(i+vec2(0,1)),pHash(i+vec2(1,1)),f.x),f.y);}
  float pFbm(vec2 p){return .57*pNoise(p)+.28*pNoise(p*2.03+4.7)+.15*pNoise(p*4.13-3.1);}
`;

/** Flow coordinates are travel time along the bed, increasing downstream.
 * The standard lighting/fog pipeline is retained, including in night mode.
 */
export function createPenitenteWater(clock: { value: number }, pool: boolean, impact: number[]) {
  const material = new THREE.MeshStandardMaterial({
    color: pool ? '#344c40' : '#b2c5bb', roughness: pool ? .22 : .48, metalness: .05,
    transparent: true, opacity: .94, depthWrite: false, side: THREE.DoubleSide,
  });
  material.name = pool ? 'Penitente — poza oscura, ondas y espuma de contacto' : 'Penitente — corriente adherida, estrías y espuma';
  material.userData.flowClock = clock;
  material.customProgramCacheKey = () => `penitente-water-1-${pool ? 'pool' : 'stream'}`;
  material.onBeforeCompile = shader => {
    shader.uniforms.uPenitenteTime = clock;
    shader.uniforms.uPenitenteImpact = { value: new THREE.Vector2(impact[0], impact[2]) };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\nattribute vec3 aFlow; varying vec3 vPenitenteFlow; varying vec3 vPenitentePoint;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvPenitenteFlow=aFlow;vPenitentePoint=position;`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\nuniform float uPenitenteTime;uniform vec2 uPenitenteImpact;varying vec3 vPenitenteFlow;varying vec3 vPenitentePoint;${NOISE}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        ${pool ? `
          float wave=pFbm(vPenitenteFlow.xy*.72+vec2(uPenitenteTime*.12,-uPenitenteTime*.19));
          float dist=length(vPenitentePoint.xz-uPenitenteImpact);
          float rings=pow(.5+.5*sin(dist*3.1-uPenitenteTime*3.5),12.)*exp(-dist*.22);
          float bankFoam=smoothstep(.5,1.,vPenitenteFlow.z)*smoothstep(.40,.72,wave)*.24;
          float entryFoam=exp(-dist*dist*.22)*(.45+.45*pNoise(vPenitentePoint.xz*3.-uPenitenteTime*.8));
          float foam=clamp(rings*.20+bankFoam+entryFoam*.68,0.,.85);
          diffuseColor.rgb=mix(vec3(.025,.061,.047)*(1.+wave*.35),vec3(.65,.74,.68),foam);
        ` : `
          vec2 advect=vec2(vPenitenteFlow.x*19.,(vPenitenteFlow.y-uPenitenteTime)*2.5);
          float fine=pFbm(advect+vec2(pNoise(advect*.21)*1.8,0.));
          float threads=pNoise(vec2(vPenitenteFlow.x*38.,(vPenitenteFlow.y-uPenitenteTime)*.8));
          float foam=smoothstep(.30,.86,fine+vPenitenteFlow.z*.13+threads*.08);
          float aeration=smoothstep(.3,.85,vPenitenteFlow.z);
          diffuseColor.rgb=mix(vec3(.035,.075,.055),vec3(.84,.91,.85),foam*(.10+.90*aeration));
          float margin=.025+.05*pNoise(vec2(vPenitenteFlow.y*4.-uPenitenteTime*3.,17.));
          diffuseColor.a*=smoothstep(margin,margin+.055,vPenitenteFlow.x)*smoothstep(margin,margin+.055,1.-vPenitenteFlow.x);
        `}
      `);
  };
  return material;
}
