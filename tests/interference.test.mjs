import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyModel,part,V,Q,exportModel,targets,solve,add} from '../dist/engine.js';
import {createInterferenceGuard,assertClearMotion,assertClearPlacement} from '../dist/interference.js';
import {createCheckedPhysics} from '../dist/physics-interference.js';
import {ballMachine} from '../dist/ball-machine.js';
const turn=Q().setFromAxisAngle(V([0,0,1]),Math.PI/2).toArray();
function crossing(){const m=emptyModel();m.parts.push(part('r-blue',[0,100,0]),part('r-blue',[0,100,0],turn));return m;}
test('mesh guard rejects intersecting rods and accepts separated rods',()=>{const m=crossing();assert.ok(createInterferenceGuard(m).check());m.parts[1].pos[2]=12;assert.equal(createInterferenceGuard(m).check(),null);});
test('touching bounds are not enough to report interference',()=>{const m=crossing();m.parts[1].pos[2]=6;assert.equal(createInterferenceGuard(m).check(),null);});
test('ordinary fitted socket connections remain legal',()=>{const m=emptyModel(),hub=part('c-white',[0,100,0]);m.parts.push(hub);add(m,solve(m,'r-blue',targets(m,'r-blue','end').find(t=>t.partId===hub.id),'end'));assert.equal(createInterferenceGuard(m).check(),null);});
test('placement rejects overlap without changing the input',()=>{const m=crossing(),saved=exportModel(m);assert.throws(()=>assertClearPlacement(m,new Set([m.parts[1].id])),e=>e.code==='PART_INTERFERENCE'&&e.partIds.length===2);assert.equal(exportModel(m),saved);});
test('swept edit catches a rod passing completely through another between clear endpoints',()=>{const a=crossing();a.parts[1].pos[2]=-15;const b=structuredClone(a);b.parts[1].pos[2]=15;assert.equal(createInterferenceGuard(a).check(),null);assert.equal(createInterferenceGuard(b).check(),null);assert.throws(()=>assertClearMotion(a,b,new Set([b.parts[1].id])),/intersects/);});
test('an invalid starting build fails visibly before the clock advances; retry is latched',()=>{const m=crossing(),saved=exportModel(m),s=createCheckedPhysics(m);assert.throws(()=>s.step(1/60),/Cannot start/);assert.equal(s.elapsed,0);assert.equal(s.fault.code,'PART_INTERFERENCE');assert.throws(()=>s.step(1/60),e=>e===s.fault);assert.equal(exportModel(m),saved);});
test('current ball machine exposes remaining geometric errors instead of silently exempting them',()=>{const m=ballMachine(),s=createCheckedPhysics(m);assert.throws(()=>s.step(1/60),/Orange split tubing.*White/);assert.equal(s.fault.phase,'start');});
test('clipping is only permitted through explicit contacts-off or bypass',()=>{const m=crossing();assert.doesNotThrow(()=>createCheckedPhysics(m,{contacts:false}).step(1/60));m.parts[1].physicsOff=true;assert.doesNotThrow(()=>createCheckedPhysics(m).step(1/60));});
test('a fast moving rod stops at its last valid pose and preserves the saved build',()=>{
 const m=crossing();m.parts[0].grounded=true;m.parts[1].pos[2]=-15;const saved=exportModel(m),s=createCheckedPhysics(m,{gravity:0});
 // Deliberately remove solver contact response to exercise the independent guard.
 for(const g of s.groups)g.body.collisionFilterMask=0;
 s.owner.get(m.parts[1].id).body.velocity.set(0,0,5);
 let error;for(let i=0;i<10&&!error;i++)try{s.step(1/240);}catch(e){error=e;}
 assert.equal(error?.code,'PART_INTERFERENCE');assert.equal(createInterferenceGuard(s.model).check(),null);assert.equal(exportModel(m),saved);assert.ok(s.model.parts[1].pos[2]<-5);assert.throws(()=>s.step(1/60),e=>e===error);
});
test('connected crank assemblies are checked despite the hinge contact exemption',()=>{
 const source=ballMachine(),keep=new Set([1,2,3,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34].map(i=>source.parts[i-1].id));
 // Isolate the real drive linkage from the unrelated rail errors reported above.
 source.parts=source.parts.filter(p=>keep.has(p.id));source.links=source.links.filter(l=>keep.has(l.a)&&keep.has(l.b));source.editor.groups=[];source.physics.balls=[];
 const good=createCheckedPhysics(source);for(let i=0;i<420;i++)good.step(1/60);assert.ok(Math.abs(good.motors[0].angle)>2*Math.PI);
 const bad=structuredClone(source),shaft=bad.parts.find(p=>p.type==='r-yellow'&&p.pos[2]===-167);shaft.type='r-gray';shaft.pos[2]=-140;for(const l of bad.links)if(l.a===shaft.id||l.b===shaft.id){if(l.mode==='through')l.offset=-45;else if(l.mode==='side')l.offset=-6.35;}
 const saved=exportModel(bad),s=createCheckedPhysics(bad);assert.ok(s.joints.some(j=>j.constraint.collideConnected===false));let error;for(let i=0;i<420&&!error;i++)try{s.step(1/60);}catch(e){error=e;}
 assert.equal(error?.code,'PART_INTERFERENCE');assert.ok(error.partIds.includes(shaft.id));assert.equal(createInterferenceGuard(s.model).check(),null);assert.equal(exportModel(bad),saved);
});
