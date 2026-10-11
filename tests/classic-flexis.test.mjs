import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,part,targets,solve,add,ports,V,exportModel,parseModel} from '../dist/engine.js';
import {buildPath,PATH_PRESETS,parseDesign,exportDesign} from '../dist/path-builder.js';
import {pathLength} from '../dist/flexible-parts.js';
import {makePart} from '../dist/geometry.js';
import {Box3,Vector3} from '../dist/vendor/three.module.js';
import {partMass} from '../dist/mass.js';
const flexis=CATALOG.filter(d=>d.flexi);
test('Classic flexis cover four sourced stock lengths and unique part identities',()=>{
 assert.deepEqual([...new Set(flexis.map(d=>d.length))],[32,52,86,190]);
 assert.equal(new Set(flexis.map(d=>d.partNumber)).size,flexis.length);
 for(const d of flexis){assert.match(d.reference,new RegExp('/'+d.partNumber+'$'));assert.equal(d.group,'flexible');}
});
test('every flexi variant preserves stock length, identity and tangent connections through save and import',()=>{
 for(const d of flexis)for(const points of Object.values(PATH_PRESETS)){
  const input={kind:'flexi',flexiType:d.id,points,spacing:65,bank:0};
  assert.deepEqual(parseDesign(exportDesign(input)),input);
  const generated=buildPath(input),m=parseModel(exportModel(generated.model)),p=m.parts[0];
  assert.equal(p.type,d.id);assert.equal(generated.length,d.length);assert.ok(Math.abs(pathLength(p.path)-d.length)<1e-8);
  assert.equal(m.links.length,2);
  for(const l of m.links){const a=ports(m.parts.find(p=>p.id===l.a)).find(p=>p.key===l.ap),b=ports(m.parts.find(p=>p.id===l.b)).find(p=>p.key===l.bp);assert.ok(V(a.pos).distanceTo(V(b.pos))<1e-8);assert.ok(V(a.dir).dot(V(b.dir))<-.99999);}
  const box=new Box3().setFromObject(makePart(p.type,p));assert.ok(box.getSize(new Vector3()).length()>d.length*.4);assert.ok(box.max.toArray().every(Number.isFinite));
 }
});
test('short flexi with many handles still works after editor normalizes its reference curve',()=>{
 const points=Array.from({length:24},(_,i)=>[i*10,30+10*Math.sin(i/4),0]);
 const input={kind:'flexi',flexiType:'f-purple32',points},r=buildPath(input),origin=V(points[0]);
 const normalized={...input,points:points.map(p=>V(p).sub(origin).multiplyScalar(r.scale).add(origin).toArray())};
 assert.ok(Math.abs(buildPath(normalized).length-32)<1e-9);
});
test('flexi ends snap in either direction and none expose an axle, side clip or motor mount',()=>{
 for(const d of flexis){const c=part('c-yellow'),m={parts:[c],links:[]};const p=add(m,solve(m,d.id,targets(m,d.id,'end')[0],'end',{portIndex:1}));assert.equal(m.links[0].bp,'end1');assert.doesNotThrow(()=>parseModel(exportModel(m)));
  for(const mode of ['through','side','mount']){assert.equal(targets({parts:[p],links:[]},'r-blue',mode).length,0);assert.equal(targets({parts:[c],links:[]},d.id,mode).length,0);}
 }
});
test('old flexi designs default to original green rod and unsupported stock is rejected',()=>{
 assert.equal(buildPath({kind:'flexi',points:PATH_PRESETS.hill}).model.parts[0].type,'f-green190');
 for(const flexiType of ['r-blue','track-purple','imaginary',null])assert.throws(()=>buildPath({kind:'flexi',points:PATH_PRESETS.hill,flexiType:flexiType===null?{}:flexiType}));
});
test('estimated flexi mass scales with length instead of assigning all new rods one generic weight',()=>{
 assert.ok(partMass(part('f-blue52'),flexis.find(d=>d.id==='f-blue52'))>partMass(part('f-purple32'),flexis.find(d=>d.id==='f-purple32')));
});
