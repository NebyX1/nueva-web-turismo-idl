import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),cache=new Map();
function load(file){
  file=resolve(root,file);if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));
  if(cache.has(file))return cache.get(file).exports;
  const module={exports:{}};cache.set(file,module);
  const output=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const context=new Proxy({},{get:(_target,key)=>key==='measureText'?text=>({width:text.length*20}):()=>{}});
  vm.runInNewContext(output,{module,exports:module.exports,atob,document:{createElement:()=>({width:16,height:16,getContext:()=>context})},require:s=>s.startsWith('.')?load(resolve(dirname(file),s.endsWith('.json')?s:s+'.ts')):require(s)},{filename:file});return module.exports;
}
const asset=load('src/three/landmarks/stewartVargasAsset.json');
assert.equal(createHash('sha256').update(readFileSync(resolve(root,'assets/stewart-vargas/stewart-vargas.glb'))).digest('hex'),asset.sourceSha256,'Packed geometry must identify its actual native GLB');
const model=load('src/three/landmarks/villaSerrana.ts').createVillaSerranaDam();model.group.updateMatrixWorld(true);
const kinds=Object.fromEntries(model.group.children.filter(o=>o.userData.kind).map(o=>[o.userData.kind,o]));
assert.ok(kinds.concrete&&kinds.wood&&kinds.fence&&kinds.terrain&&kinds.lake&&kinds.flow&&kinds.brook);
const data=model.group.userData.stewartVargas;
assert.equal(data.length,120);assert.ok(Math.abs(data.crestY-13.2)<.01);
assert.ok(data.modules.length>=16&&data.modules.length<=22,'Repeated structural rhythm, not a few generic pillars');
assert.ok(data.modules[0].toeY<data.modules.at(-1).toeY-8,'The meadow-side exposed wall must be much lower');
assert.ok(data.activeChannels.length>=4&&data.activeChannels.length<data.modules.length/2,'Moderate flow belongs to the deep side, not a complete curtain');
assert.ok(data.activeChannels.every(c=>c.x<0&&c.width<data.modules[0].width*.25),'Water channels must stay narrow relative to the heavy cheeks');
const damBounds=new THREE.Box3().setFromObject(kinds.concrete),size=damBounds.getSize(new THREE.Vector3());
assert.ok(size.x>115&&size.x/size.y>7.5&&size.y<16,'The structure must remain long and low');
const lakeBounds=new THREE.Box3().setFromObject(kinds.lake),brookBounds=new THREE.Box3().setFromObject(kinds.brook);
// Shore-clipped polygons have an 8 mm contact bias; the crown infill is at datum.
assert.ok(lakeBounds.max.z<-1&&lakeBounds.max.y-lakeBounds.min.y<.01&&lakeBounds.max.x-lakeBounds.min.x>200,'Wide horizontal upstream reservoir, within one centimetre');
assert.ok(brookBounds.min.z>9&&brookBounds.max.z>150&&brookBounds.max.y<1,'A much lower, narrow downstream outlet');
const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
function hit(mesh,x,z,y=100){ray.set(new THREE.Vector3(x,y,z),down);return ray.intersectObject(mesh,false)[0]?.point.y;}
let contacts=0,maxGap=0;
const water=kinds.flow.geometry.attributes.position;
for(let i=0;i<water.count;i+=7){
  const x=water.getX(i),y=water.getY(i),z=water.getZ(i);
  const hits=(()=>{ray.set(new THREE.Vector3(x,y+.12,z),down);return ray.intersectObject(kinds.concrete,false).filter(h=>h.point.y<=y+.06);})();
  assert.ok(hits.length,'Every water ribbon must have a concrete channel below it');
  const gap=y-hits[0].point.y;maxGap=Math.max(maxGap,gap);assert.ok(gap>-.001&&gap<.09,`Water separated from its concrete bed: ${gap}`);contacts++;
}
for(const channel of data.activeChannels){
  const waterY=hit(kinds.flow,channel.x,3),cheekY=hit(kinds.concrete,channel.x+.85,3);
  assert.ok(Number.isFinite(waterY)&&cheekY>waterY+.35,'Actual recessed channels must cast structural side shadows');
}
let shorelineSamples=0;
for(const mesh of [kinds.lake,kinds.brook]){
  const p=mesh.geometry.attributes.position;
  for(let i=0;i<p.count;i+=83){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),bed=hit(kinds.terrain,x,z,y+1);
    assert.ok(Number.isFinite(bed)&&bed<y+.025,'Water cannot cross above-bank terrain');shorelineSamples++;
  }
}
const pavilion=model.group.getObjectByName('Ventorrillo de la Buena Vista');
assert.ok(pavilion&&pavilion.position.distanceTo(model.target)>150,'The existing pavilion stays separate from the dam');
assert.equal(model.introViews.length,1);
assert.equal(model.introViews[0].label,'Ventorrillo de la Buena Vista');
assert.ok(model.introViews[0].origin.distanceTo(pavilion.position)<.001,'The first visit must be anchored to the real pavilion');
assert.ok(model.nightLighting.floodlights.every(l=>hit(kinds.terrain,l.foot.x,l.foot.z)<=l.foot.y+.01&&l.foot.z>15),'Floodlights stand on the dry front banks');
model.update(4.25);const splash=model.group.getObjectByName('Stewart Vargas — salpicaduras pequeñas al pie');const held=Array.from(splash.instanceMatrix.array);model.update(4.25);
assert.deepEqual(Array.from(splash.instanceMatrix.array),held,'Pause must freeze the splash');
assert.ok(['lake','flow','brook'].every(k=>kinds[k].material.userData.flowClock.value===4.25));
const fishSchool=model.group.getObjectByName('Peces del embalse Stewart Vargas'),school=fishSchool.userData.fishSchool;
assert.equal(school.count,6,'Six staggered fish must fit inside the reservoir');
for(const path of school.paths)for(let step=0;step<=12;step++){
  const point=new THREE.Vector3(...path.start).lerp(new THREE.Vector3(...path.end),step/12);
  assert.ok(Math.abs(hit(kinds.lake,point.x,point.z)-point.y)<.02,'Every fish arc must stay above the lake');
}
const fish=fishSchool.children.filter(o=>o.name.includes(' — pez '));
model.update(.7);assert.ok(fish.some(o=>o.visible&&o.position.y>data.lakeLevel+2),'Fish must actually leap above the surface');
const heldFish=fish.map(o=>[o.visible,...o.position.toArray(),...o.rotation.toArray()]);
model.update(.7);assert.deepEqual(fish.map(o=>[o.visible,...o.position.toArray(),...o.rotation.toArray()]),heldFish,'Pause must freeze fish as well as water');
model.update(1.55);assert.ok(fishSchool.children.some(o=>o.name==='Gotas del chapoteo'&&o.count>0),'Landing must create splash droplets');
let triangles=0;
model.group.traverse(o=>{
 if(!o.isMesh)return;
 const g=o.geometry,p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<.0001,`${o.name}: invalid normal`);}
 if(g.index)for(const i of g.index.array)assert.ok(i<p.count);
 triangles+=(g.index?.count??p.count)/3*(o.isInstancedMesh?o.count:1);
});
assert.ok(triangles<180000,'Keep the complete landmark within its web geometry budget');
// Use the registered camera values and all three pan poses. This checks
// projection arithmetic only; it is not a substitute for browser/UI evidence.
const site=load('src/three/journeySites.ts').journeyDefinitions.find(site=>site.id==='villa-serrana');
const cameraModule=load('src/three/journeyCameraTour.ts');
const definitions=load('src/three/journeySites.ts').journeyDefinitions;
const sites=definitions.map(definition=>{
  const current=definition.id==='villa-serrana'?model:{group:new THREE.Group(),target:new THREE.Vector3(0,5,0),bounds:{radius:40,height:20}};
  const origin=new THREE.Vector3(definition.x,30,definition.z);
  return {...definition,model:current,origin,target:current.target.clone().add(origin),direction:(current.cameraDirection?.clone()??new THREE.Vector3(.75,0,1)).setY(0).normalize()};
});
const villaIndex=definitions.findIndex(d=>d.id==='villa-serrana');
const visits=cameraModule.createJourneyCameraVisits(sites),tour=cameraModule.createJourneyCameraTour(visits),first=tour.firstVisit(villaIndex),start=first*22;
assert.equal(visits.length,11);assert.equal(tour.duration,242);assert.equal(first,9);
assert.equal(visits[first].label,'Ventorrillo de la Buena Vista');assert.equal(visits[first+1].label,'Represa Stewart Vargas');
assert.equal(visits[first].stopIndex,villaIndex);assert.equal(visits[first+1].stopIndex,villaIndex);
assert.equal(tour.firstVisit(0),0);assert.equal(tour.firstVisit(4),4,'The first five destinations retain their timing');
for(const viewport of[{width:390,height:844},{width:1600,height:900}]){
  const firstPose=tour.sample(start+13,viewport),damPose=tour.sample(start+35,viewport);
  assert.equal(firstPose.visit.label,'Ventorrillo de la Buena Vista');assert.equal(damPose.visit.label,'Represa Stewart Vargas');
  assert.ok(firstPose.look.distanceTo(visits[first].target)<20,'Camera must look at the pavilion, not the dam during the first visit');
  assert.ok(damPose.look.distanceTo(visits[first+1].target)<20,'Second visit must look at the dam');
  assert.ok(firstPose.progress<.5&&damPose.progress>.5,'One continuous progress bar spans both visits');
  for(const boundary of[5,10,16,22,27,32,38,44]){
    const before=tour.sample(start+boundary-.00001,viewport),after=tour.sample(start+boundary,viewport);
    assert.ok(before.position.distanceTo(after.position)<.01&&before.look.distanceTo(after.look)<.01,'Camera path must stay continuous across phases and destinations');
  }
  assert.equal(tour.sample(start+44,viewport).visit.stopIndex,0,'Tour loops after both Villa Serrana visits');
}
for(const[width,height]of[[320,568],[390,844],[701,700],[768,1024],[1600,900]])for(const u of[0,.5,1]){
  const mobile=width<=700,focus=mobile?site.portraitFocus:site.focus,framing=Math.max(1,1.05/(width/height));
  const direction=model.cameraDirection.clone().setY(0).normalize();
  const near=direction.clone().multiplyScalar(focus*2.6*framing),lifted=direction.clone().applyAxisAngle(new THREE.Vector3(0,1,0),site.sweep).multiplyScalar(focus*2.8*framing);
  near.y=site.eye;lifted.y=site.eye+site.reveal*.06+site.rise;
  const camera=new THREE.PerspectiveCamera(44,width/height,.4,5000);camera.position.copy(near).lerp(lifted,u);
  const target=model.target.clone();target.y=THREE.MathUtils.lerp(target.y,site.reveal*.96,u);camera.lookAt(target);
  camera.setViewOffset(width,height,mobile?width*site.portraitViewOffsetX:-width*.13,mobile?height*site.portraitViewOffset:0,width,height);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  for(const x of[-64.2,64.2]){const p=new THREE.Vector3(x,data.deckY,-1.42).project(camera);assert.ok(Math.abs(p.x)<.99&&Math.abs(p.y)<.9,'The entire bridge must fit the near/panoramic camera on each tested aspect ratio');}
}
console.log(`Stewart Vargas: ${contacts} water/concrete contacts (max gap ${maxGap.toFixed(4)}), ${shorelineSamples} water/terrain samples, recessed channels, modern bridge, asymmetrical heights, reservoir, outlet, pause and ${Math.round(triangles)} triangles verified.`);
console.log('Both bridge ends fit five aspect ratios × three pan positions; actual browser review remains required.');
console.log('Ventorrillo → Stewart Vargas order, full visits, progress, camera continuity, six reservoir fish, splash and pause verified.');
console.log('Visual fidelity still requires the independent reviewer; these checks do not approve appearance.');
