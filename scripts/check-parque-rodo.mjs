import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),require=createRequire(import.meta.url),cache=new Map();
const hash=data=>createHash('sha256').update(data).digest('hex');
function canvas(){const ctx=new Proxy({measureText:text=>({width:text.length*20}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});return{width:0,height:0,getContext:()=>ctx};}
class PathStub{constructor(){return new Proxy(this,{get:()=>()=>{}});}}
function load(file){file=resolve(root,file);if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,atob,Path2D:PathStub,document:{createElement:canvas},require:s=>s.startsWith('.')?load(resolve(dirname(file),s.endsWith('.json')?s:s+'.ts')):require(s)},{filename:file});return module.exports;}

const route=load('src/data/journeyRoute.ts').journeyRoute;
assert.equal(route.length,10);assert.equal(route[5].id,'parque-rodo');
// Keep the accepted nine-stop baseline fixed after committing this integration.
const acceptedRevision='098597aa5cfac62abb668b3580017e1e6150171c';
const original=execFileSync('git',['show',`${acceptedRevision}:src/data/journeyRoute.ts`],{cwd:root,encoding:'utf8'});
const originalStops=[...original.matchAll(/id: '([^']+)', mapX: (\d+), mapY: (\d+)/g)].map(m=>({id:m[1],mapX:+m[2],mapY:+m[3]}));
assert.equal(JSON.stringify(route.filter(s=>s.id!=='parque-rodo')),JSON.stringify(originalStops),'Preserve all nine accepted placements and relative order');
assert.equal(hash(readFileSync(resolve(root,'src/three/landmarks/artigas.ts'))),hash(execFileSync('git',['show',`${acceptedRevision}:src/three/landmarks/artigas.ts`],{cwd:root})),'The accepted Artigas constructor must remain unchanged');

const asset=load('src/three/landmarks/parqueRodoAsset.json');
assert.equal(hash(readFileSync(resolve(root,'assets/parque-rodo/parque-rodo.glb'))),asset.sourceSha256,'Packed park must match its native GLB');
const park=load('src/three/landmarks/parqueRodo.ts').createParqueRodo();park.group.updateMatrixWorld(true);
assert.equal(park.introViews.length,2);assert.equal(park.introViews[0].label,'Entrada y paseos');assert.equal(park.introViews[1].label,'Lago y mirador');
assert.ok(asset.landscape.pool.covered);assert.equal(asset.landscape.arena.tierCount,5);assert.ok(asset.landscape.trees.length>=140);
assert.ok(asset.landscape.gate.span>15&&asset.landscape.gate.span<20);
const kinds=Object.fromEntries(park.group.children.filter(o=>o.userData.kind).map(o=>[o.userData.kind,o]));
for(const name of['grass','stone','cream','metal','wood','water','blue','glass'])assert.ok(kinds[name],name);
for(const kind of['road','path']){const normals=kinds[kind].geometry.attributes.normal;for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>.90,'Roads and walkways must face upwards in the single-sided WebGL material');}
const lake=kinds.water.geometry.attributes.position,normal=kinds.water.geometry.attributes.normal,ray=new THREE.Raycaster();let contacts=0;
for(let i=0;i<lake.count;i+=17){
  const p=new THREE.Vector3().fromBufferAttribute(lake,i);ray.set(new THREE.Vector3(p.x,p.y+.1,p.z),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObject(kinds.grass,false)[0];assert.ok(hit&&hit.point.y<=p.y+.012,'Lake must remain above its terrain basin, including its clipped shoreline');
  assert.ok(normal.getY(i)>.98,'Water faces upward');contacts++;
}
// Decode the normalized byte directly: this VM harness has a separate Uint8Array
// realm from Three.js, while the production renderer shares one browser realm.
const grassColors=kinds.grass.geometry.attributes.color;for(let i=0;i<grassColors.count;i+=23)assert.ok(grassColors.array[i*3+1]/255>.12,'Missing grass attributes must not make the arena black');
const pool=asset.landscape.pool,margin=2;
for(let x=pool.center[0]-pool.size[0]/2-1.5-margin;x<=pool.center[0]+pool.size[0]/2+1.5+margin;x+=2)for(let z=pool.center[2]-pool.size[2]/2-1.5-margin;z<=pool.center[2]+pool.size[2]/2+1.5+margin;z+=2){
 ray.set(new THREE.Vector3(x,20,z),new THREE.Vector3(0,-1,0));assert.equal(ray.intersectObject(kinds.water,false).length,0,'Pool foundation and its dry margin must not overlap the lake');
}

const artigas=load('src/three/landmarks/artigasFogones.ts').createArtigasWithFogones();artigas.group.updateMatrixWorld(true);
const accepted=load('src/three/landmarks/artigas.ts').createArtigas();accepted.group.updateMatrixWorld(true);
function baseMeshes(model,exclude){const data=[];model.group.traverse(o=>{if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(p===exclude)return;const g=o.geometry;data.push(hash(Buffer.concat([Buffer.from(o.name),Buffer.from(g.attributes.position.array.buffer),Buffer.from(g.index?.array.buffer??new ArrayBuffer(0)),Buffer.from(new Float64Array(o.matrixWorld.elements).buffer),Buffer.from(o.isInstancedMesh?o.instanceMatrix.array.buffer:new ArrayBuffer(0))])));});return data.sort();}
const artigasParty=artigas.group.getObjectByName('Cerro Artigas — Noche de los Fogones');
assert.deepEqual(baseMeshes(artigas,artigasParty),baseMeshes(accepted,null),'Festivities must preserve all sculpture, hill, rocks and flag geometry');
assert.ok(artigas.nightView&&artigas.nightView.target.y<artigas.target.y,'Night view includes the stage below the summit');

function snapshot(model){const values=[];model.group.updateMatrixWorld(true);model.group.traverse(o=>{if(o.isMesh||o.isLineSegments)values.push(o.visible,...o.matrixWorld.elements)});return values;}
for(const[model,name,fireworks]of[[park,'Parque Rodó — noche de festival',false],[artigas,'Cerro Artigas — Noche de los Fogones',true]]){
  const party=model.group.getObjectByName(name),data=party.userData.festival;assert.ok(!party.visible,'Festival defaults to hidden in daylight');
  assert.equal(data.exclusiveNight,true);assert.equal(data.artistCount,4);assert.ok(data.audienceCount>850);assert.equal(data.fireworks,fireworks);assert.equal(data.actualLights,2);
  if(fireworks){let pyrotechnics;party.traverse(o=>{if(o.userData.fireworks)pyrotechnics=o.userData.fireworks;});assert.equal(pyrotechnics.shells,6);for(const p of pyrotechnics.launchPositions)assert.ok(p[2]<data.stagePosition[2]-25&&Math.hypot(p[0],p[2])>100,'Launches must be behind the stage and outside the occupied hillside');}
  const crowd=party.getObjectByName(name+' — multitud instanciada');assert.ok(crowd.isInstancedMesh);assert.equal(crowd.count,data.audienceCount);
  const b=new THREE.Box3().setFromBufferAttribute(crowd.geometry.attributes.position),size=b.getSize(new THREE.Vector3());assert.ok(size.y>2&&size.y<2.4&&size.x<1.5,'Human scale with raised arms');
  for(const foot of crowd.userData.crowd.feet){assert.ok(foot.every(Number.isFinite));if(fireworks)assert.ok(Math.hypot(foot[0],foot[2])>=16,'Crowd stays away from the pedestal');}
  model.nightLighting.setNight(true,true);model.update(13.37);assert.ok(party.visible);assert.equal(data.clock.value,13.37);
  const first=snapshot(model);model.update(13.37);assert.deepEqual(snapshot(model),first,'Pause freezes musicians, beams, flames and particle time');
  model.update(14.21);assert.notDeepEqual(snapshot(model),first,'Festive rigs/performers actually animate');
  const lights=[];party.traverse(o=>{if(o.isLight)lights.push(o);});assert.equal(lights.filter(l=>l.visible&&l.intensity>0).length,2);
  model.nightLighting.setNight(true,false);assert.ok(lights.every(l=>!l.visible&&l.intensity===0),'Off-site event lights cannot remain active');
  model.nightLighting.setNight(false,false);assert.ok(!party.visible);assert.ok(lights.every(l=>!l.visible&&l.intensity===0));
  const frozen=data.clock.value;model.update(99);assert.equal(data.clock.value,frozen,'Hidden daytime party does no animation work');
  console.log(`${name}: ${data.artistCount} musicians, ${data.audienceCount} people, night-only visibility, lighting and pause verified.`);
}

let triangles=0;
park.group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,p=g.attributes.position,n=g.attributes.normal;assert.ok(n&&n.count===p.count);for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<.001,'Invalid normal');}if(g.index)for(const index of g.index.array)assert.ok(index<p.count);triangles+=(g.index?.count??p.count)/3*(o.isInstancedMesh?o.count:1);});
assert.ok(triangles<850000,'Keep the complete crowd and park within a bounded rendering budget');

const definitions=load('src/three/journeySites.ts').journeyDefinitions;
const villa=load('src/three/landmarks/villaSerrana.ts').createVillaSerranaDam();
const sites=definitions.map(d=>{const model=d.id==='parque-rodo'?park:d.id==='cerro-artigas'?artigas:d.id==='villa-serrana'?villa:{group:new THREE.Group(),target:new THREE.Vector3(0,5,0),bounds:{radius:40,height:20}};const origin=new THREE.Vector3(d.x,20,d.z);return{...d,model,origin,target:model.target.clone().add(origin),direction:(model.cameraDirection?.clone()??new THREE.Vector3(.75,0,1)).setY(0).normalize()};});
const camera=load('src/three/journeyCameraTour.ts'),visits=camera.createJourneyCameraVisits(sites),tour=camera.createJourneyCameraTour(visits);
assert.equal(visits.length,13);assert.equal(tour.duration,286);const parkStart=tour.firstVisit(5);assert.equal(parkStart,5);
assert.equal(JSON.stringify(visits.slice(parkStart,parkStart+3).map(v=>v.label)),JSON.stringify(['Entrada y paseos','Lago y mirador','Ruedo del Parque Rodó']));
for(const night of[false,true]){
 tour.setNight(night);
 for(const viewport of[{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){
  for(const index of[5,6,7,tour.firstVisit(7)])for(const local of[5,10,13,16,21.999]){
   const pose=tour.sample(index*22+local,viewport);assert.ok([...pose.position.toArray(),...pose.look.toArray(),pose.fov].every(Number.isFinite));assert.ok(pose.position.distanceTo(pose.look)>10);
  }
  for(let index=0;index<visits.length;index++)for(const local of[5,10,16,22]){
   const before=tour.sample(index*22+local-.000001,viewport),after=tour.sample(index*22+local,viewport);assert.ok(before.position.distanceTo(after.position)<.01&&before.look.distanceTo(after.look)<.01&&Math.abs(before.fov-after.fov)<.001,'Continuous camera path across every visit and mode');
  }
 }
 const index=tour.firstVisit(7),pose=tour.sample(index*22+13,{width:1440,height:900});assert.equal(pose.visit.label,night?'Noche de los Fogones':'Monumento a Artigas');
}
const start=tour.firstVisit(9)*22;assert.equal(tour.sample(start+13,{width:1440,height:900}).visit.label,'Ventorrillo de la Buena Vista');assert.equal(tour.sample(start+35,{width:1440,height:900}).visit.label,'Represa Stewart Vargas');
console.log(`Parque Rodó: ${contacts} lake/terrain samples, ${asset.landscape.trees.length} trees, covered pool, gate, five oval tiers and ${Math.round(triangles)} triangles verified.`);
console.log('Ten public stops, thirteen visits, preserved original placements, mode-specific Artigas view and four viewport camera checks passed. Visual acceptance requires independent review of the actual renders/browser.');
