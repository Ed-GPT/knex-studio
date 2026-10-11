import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {part,emptyModel,targets,solve,add,parseModel,exportModel,definition,V,Q} from '../dist/engine.js';
import {makePart} from '../dist/geometry.js';
import {poweredWindmill,motorDrive,stepMotor} from '../dist/motor.js';
for(const type of ['m-blue','m-green']){
 test(`${type}: gearbox mounts are coaxial with the drive and stay fixed during playback`,()=>{
  const model=poweredWindmill(type),motor=model.parts.find(p=>p.type===type),mounts=model.links.filter(l=>l.mode==='mount');assert.equal(mounts.length,2);
  for(const l of mounts){const p=model.parts.find(p=>p.id===l.b),delta=V(p.pos).sub(V(motor.pos));assert.ok(Math.abs(delta.x)<1e-6&&Math.abs(delta.y)<1e-6);assert.equal(Math.abs(delta.z),18.75);}
  const before=structuredClone(model),drive=motorDrive(model,motor.id);stepMotor(model,motor.id,.1);for(const p of model.parts)if(!drive.ids.has(p.id))assert.deepEqual(p,before.parts.find(x=>x.id===p.id));assert.deepEqual(parseModel(exportModel(model)),model);
 });
 test(`${type}: modeled drive bore is open through both casing faces`,()=>{const g=makePart(type);g.updateMatrixWorld(true);for(const sign of[-1,1]){const ray=new T.Raycaster(new T.Vector3(0,0,sign*100),new T.Vector3(0,0,-sign));assert.equal(ray.intersectObject(g,true).length,0);}const box=new T.Box3().setFromObject(g);assert.ok(box.min.x<-60);assert.ok(box.max.x<21);assert.ok(box.max.z<23);});
}
test('only the white 8-way connector exposes a motor face mount; occupied faces are unavailable',()=>{const m=emptyModel(),motor=part('m-blue');m.parts.push(motor);assert.equal(targets(m,'c-red','mount').length,0);assert.equal(targets(m,'c-white','mount').length,2);add(m,solve(m,'c-white',targets(m,'c-white','mount')[0],'mount'));assert.equal(targets(m,'c-white','mount').length,1);const bad=structuredClone(m);bad.parts[1].type='c-red';assert.throws(()=>parseModel(exportModel(bad)));});
test('mounting a motor onto an existing connector supports both gearbox faces',()=>{for(const portIndex of[0,1]){const m=emptyModel(),c=part('c-white',[10,40,30],new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),.5).toArray());m.parts.push(c);const result=solve(m,'m-green',targets(m,'m-green','mount')[0],'mount',{portIndex,roll:45});const expected=V([0,0,portIndex?-18.75:18.75]).applyQuaternion(Q(result.part.quat)).add(V(result.part.pos));assert.ok(expected.distanceTo(V(c.pos))<1e-6);add(m,result);assert.deepEqual(parseModel(exportModel(m)),m);}});
test('legacy motor files remain readable and explicitly identifiable',()=>{const m=emptyModel();m.parts.push(part('m-battery'));assert.equal(definition(parseModel(exportModel(m)).parts[0]).legacy,true);});
