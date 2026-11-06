import * as THREE from 'three';

/** Object-space granite grain supplements the authored wet rock/lichen colors. */
export function createPenitenteRock() {
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: .94 });
  material.name = 'Gneis gris rosado — grano fino, líquenes y lecho mojado';
  material.customProgramCacheKey = () => 'penitente-rock-grain-1';
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPenitenteRock;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPenitenteRock=position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vPenitenteRock;
      float prHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float prNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
        return mix(mix(mix(prHash(i),prHash(i+vec3(1,0,0)),f.x),mix(prHash(i+vec3(0,1,0)),prHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(prHash(i+vec3(0,0,1)),prHash(i+vec3(1,0,1)),f.x),mix(prHash(i+vec3(0,1,1)),prHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    `).replace('#include <color_fragment>', `#include <color_fragment>
      float prGrain=prHash(floor(vPenitenteRock*8.));
      float prVisible=1.-smoothstep(.35,1.2,length(fwidth(vPenitenteRock*8.)));
      float prPatch=prNoise(vPenitenteRock*1.8);
      float prLichen=smoothstep(.61,.77,prPatch*.7+prGrain*.3)*prVisible;
      float prDry=smoothstep(.035,.11,dot(diffuseColor.rgb,vec3(.3,.5,.2)));
      diffuseColor.rgb*=mix(1.,.87+prGrain*.24,prVisible);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.52,.54,.45),prLichen*prDry*.60);
    `);
  };
  return material;
}
