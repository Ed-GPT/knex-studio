import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSIC_WHEELS} from '../dist/classic-wheels.js';
import {V,Q,part,emptyModel,targets,solve,add,BY_ID,ports,parseModel,exportModel,autoLinks,keyZ} from '../dist/engine.js';
import {rigidComponent,axleInfo,moveOnAxle} from '../dist/motion.js';
import {hingeSystem,stepHingeSystem} from '../dist/hinge-system.js';
import {motorDrive,stepMotor} from '../dist/motor.js';
import {makePart} from '../dist/geometry.js';
import {Box3,Vector3,Raycaster} from '../dist/vendor/three.module.js';
const attach=(m,type,host,mode,key)=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id&&(!key||t.key===key)),mode));
function endWheel(type='h-racing37-gray'){const m=emptyModel(),rod=part('r-gray',[0,50,0]);m.parts.push(rod);const hub=attach(m,type,rod,'end','end1');return{m,rod,hub};}
test('racing hubs seat on either rod end, remain free bearings and never offer a through hole',()=>{
 for(const d of CLASSIC_WHEELS.filter(d=>d.endBearing))for(const end of ['end0','end1']){
  const m=emptyModel(),rod=part('r-gray',[10,70,-20],Q().setFromAxisAngle(V([1,1,1]).normalize(),.7).toArray());m.parts.push(rod);const hub=attach(m,d.id,rod,'end',end);
  assert.equal(m.links[0].mode,'end-bearing');assert.equal(m.links[0].bp,'bearing');assert.equal(targets(m,d.id,'end').length,1);
  assert.equal(targets(m,d.id,'through').length,0);assert.equal(targets({parts:[hub],links:[]},'r-blue','through').length,0);
  const a=ports(rod).find(p=>p.key===end),b=ports(hub)[0];assert.ok(V(a.pos).distanceTo(V(b.pos))<1e-8);assert.ok(V(a.dir).dot(V(b.dir))<-.99999);
  assert.equal(rigidComponent(m,hub.id).size,1);assert.doesNotThrow(()=>parseModel(exportModel(m)));
  const before=structuredClone(rod),position=[...hub.pos];assert.equal(moveOnAxle(m,hub.id,{distance:100,degrees:45}).distance,0);assert.ok(V(hub.pos).distanceTo(V(position))<1e-8);assert.deepEqual(rod,before);
 }
});
test('rod-end bearing snaps also when adding the rod and rejects connector or flexi attachment',()=>{
 const hub=part('h-racing50'),m={parts:[hub],links:[]},rod=attach(m,'r-red',hub,'end');assert.equal(m.links[0].mode,'end-bearing');assert.ok(axleInfo(m,hub.id).available);assert.doesNotThrow(()=>parseModel(exportModel(m)));
 for(const type of ['c-gray','f-green190'])assert.equal(targets({parts:[hub],links:[]},type,'end').length,0);
 const p=part('r-red',rod.pos,rod.quat);assert.equal(autoLinks({parts:[hub],links:[]},p)[0].mode,'end-bearing');
 const invalid=structuredClone(m);invalid.links[0].mode='end';assert.throws(()=>parseModel(exportModel(invalid)));
});
test('end-bearing wheels participate in coupled hinge simulation with fixed support',()=>{
 const {m,rod,hub}=endWheel();rod.grounded=true;const before=structuredClone(rod),s=hingeSystem(m,hub.id);assert.equal(s.jointCount,1);s.groups.find(g=>g.ids.has(hub.id)).body.angularVelocity.set(2,0,0);for(let i=0;i<120;i++)stepHingeSystem(m,s,1/60);assert.deepEqual(rod,before);const a=ports(rod)[1],b=ports(hub)[0];assert.ok(V(a.pos).distanceTo(V(b.pos))<.01);
});
test('racing hub and tyre follow the motor only when keyed to its rod',()=>{
 const {m,rod,hub}=endWheel();const motor=attach(m,'m-blue',rod,'through'),tyre=attach(m,'t-racing37',hub,'tire');assert.equal(motorDrive(m,motor.id).ids.has(hub.id),false);
 const clip=attach(m,'k-tan',hub,'keyed');const offset=V(clip.pos).sub(V(rod.pos)).dot(V([1,0,0]).applyQuaternion(Q(rod.quat)));m.links.push({a:rod.id,ap:'shaft',b:clip.id,bp:'hole',mode:'through',locked:true,offset});assert.doesNotThrow(()=>parseModel(exportModel(m)));
 const drive=motorDrive(m,motor.id);assert.ok(drive.ready);assert.ok(drive.ids.has(hub.id));assert.ok(drive.ids.has(tyre.id));const q=[...hub.quat];stepMotor(m,motor.id,.1);assert.notDeepEqual(hub.quat,q);
});
test('racing tyres reject same-diameter pulley hubs and accept only documented fittings',()=>{
 for(const tyre of CLASSIC_WHEELS.filter(d=>d.tire))for(const hub of [...CLASSIC_WHEELS.filter(d=>d.wheelHub),BY_ID['h-small'],BY_ID['h-medium'],BY_ID['c-white']]){
  const p=part(hub.id),m={parts:[p],links:[]},ts=targets(m,tyre.id,'tire');assert.equal(!!ts.length,tyre.fits.includes(hub.id),`${tyre.id}/${hub.id}`);
  if(ts.length){add(m,solve(m,tyre.id,ts[0],'tire'));assert.doesNotThrow(()=>parseModel(exportModel(m)));}
 }
});
test('one wide racing tyre seats two narrow hubs without allowing a third or a full hub',()=>{
 const tyre=part('t-racing50'),m={parts:[tyre],links:[]};const a=attach(m,'h-narrow50-gray',tyre,'tire','tire0'),b=attach(m,'h-narrow50-black',tyre,'tire','tire1');assert.equal(Math.abs(a.pos[2]-b.pos[2]),10);assert.equal(rigidComponent(m,a.id).size,3);assert.equal(targets(m,'h-narrow50-gray','tire').length,0);assert.equal(targets(m,'h-racing50','tire').length,0);assert.doesNotThrow(()=>parseModel(exportModel(m)));
 const full=part('h-racing50');m.parts.push(full);m.links.push({a:tyre.id,ap:'tire',b:full.id,bp:'tire',mode:'tire'});assert.throws(()=>parseModel(exportModel(m)),/seat/);
});
test('full racing hub reserves both tyre halves and reverse placement preserves seat location',()=>{
 const tyre=part('t-racing50'),m={parts:[tyre],links:[]};attach(m,'h-racing50',tyre,'tire');assert.equal(targets(m,'h-narrow50-gray','tire').length,0);
 for(const seat of ['tire0','tire1']){const hub=part('h-narrow50-gray',[40,60,80],Q().setFromAxisAngle(V([1,0,0]),.6).toArray()),m={parts:[hub],links:[]};const t=targets(m,'t-racing50','tire').find(t=>t.tyreSeat===seat),p=add(m,solve(m,'t-racing50',t,'tire'));assert.equal(m.links[0].bp,seat);const next=targets(m,hub.type,'tire');assert.equal(next.length,1);assert.notEqual(next[0].key,seat);assert.doesNotThrow(()=>parseModel(exportModel(m)));}
});
test('new wheel geometries have true open spokes and blind racing ends; slicks have no tread',()=>{
 const hits=(d,x,y)=>{const g=makePart(d);g.updateMatrixWorld(true);return new Raycaster(V([x,y,100]),V([0,0,-1])).intersectObject(g,true);};
 assert.equal(hits('h-narrow50-gray',0,0).length,0);assert.ok(hits('h-racing50',0,0).length>0);assert.equal(hits('h-narrow50-gray',12,0).length,0);
 for(const d of CLASSIC_WHEELS){const g=makePart(d.id),box=new Box3().setFromObject(g),size=box.getSize(new Vector3());assert.ok(size.x>d.diameter-2&&size.x<d.diameter+2);assert.ok(size.z>d.thickness-1&&size.z<d.thickness+1);}
 let slick=0,tread=0;makePart('t-slick37').traverse(o=>{if(o.isMesh)slick++;});makePart('t-racing37').traverse(o=>{if(o.isMesh)tread++;});assert.equal(slick,1);assert.ok(tread>slick);
});
test('wheel bench contains every new family and preserves independent bearings',async()=>{
 const {racingWheelBench}=await import('../dist/wheel-models.js'),m=racingWheelBench();assert.doesNotThrow(()=>parseModel(exportModel(m)));
 for(const d of CLASSIC_WHEELS)assert.ok(m.parts.some(p=>p.type===d.id),d.id);
 const pair=m.parts.find(p=>p.type==='h-narrow50-black');assert.equal(rigidComponent(m,pair.id).size,3);const i=axleInfo(m,pair.id);assert.ok(i.available);assert.ok(moveOnAxle(m,pair.id,{degrees:30}).degrees===30);
});
