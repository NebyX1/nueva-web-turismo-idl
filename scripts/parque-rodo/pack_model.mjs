import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
const input=resolve(process.argv[2]),output=resolve(process.argv[3]),raw=JSON.parse(readFileSync(input,'utf8'));
function encode(values,type){const bytes=Buffer.alloc(values.length*(type==='float'?4:type==='short'?2:1));values.forEach((v,i)=>type==='float'?bytes.writeFloatLE(v,i*4):type==='short'?bytes.writeUInt16LE(v,i*2):bytes.writeInt8(Math.round(Math.max(-1,Math.min(1,v))*127),i));return bytes.toString('base64');}
const parts=raw.meshes.map(p=>{const vertices=p.positions.length/3,large=vertices>65535,indices=Buffer.alloc(p.indices.length*(large?4:2));p.indices.forEach((v,i)=>large?indices.writeUInt32LE(v,i*4):indices.writeUInt16LE(v,i*2));return{name:p.name,kind:p.kind,vertices,triangles:p.indices.length/3,indexBytes:large?4:2,positions:encode(p.positions,'float'),normals:encode(p.normals,'byte'),uv:encode(p.uv,'float'),colors:Buffer.from(p.colors.map(v=>Math.round(Math.max(0,Math.min(1,v))*255))).toString('base64'),indices:indices.toString('base64')};});
const sourceSha256=createHash('sha256').update(readFileSync(resolve(dirname(input),'parque-rodo.glb'))).digest('hex');
writeFileSync(output,JSON.stringify({version:1,sourceSha256,landscape:raw.landscape,parts}));
console.log(JSON.stringify({sourceSha256,batches:parts.length,triangles:parts.reduce((n,p)=>n+p.triangles,0),bytes:readFileSync(output).length}));
