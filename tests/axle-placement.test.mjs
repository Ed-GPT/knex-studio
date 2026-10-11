import test from 'node:test';
import assert from 'node:assert/strict';
import {part,targets,solve,add,V,Q,exportModel,parseModel} from '../dist/engine.js';
import {throughPlacement} from '../dist/axle-placement.js';
import {partsOverlap} from '../dist/slide-collision.js';
import {moveOnAxle} from '../dist/motion.js';
function setup(){const rod=part('r-gray',[0,35,0]),m={name:'Axle',parts:[rod],links:[]},t=targets(m,'c-white','through')[0];return{rod,m,t};}
test('occupied shaft center finds free space instead of blocking the whole rod',()=>{const {m,t}=setup();const center=add(m,solve(m,'c-white',t,'through'));const next=throughPlacement(m,'c-white',t);assert.ok(Math.abs(next.link.offset)>6);assert.ok(!partsOverlap(next.part,center));assert.equal(next.link.mode,'through');});
test('through-hole placement follows requested off-center position and can slide',()=>{const {m,t}=setup();const p=add(m,throughPlacement(m,'c-white',t,{offset:55}));assert.ok(Math.abs(p.pos[0]-55)<1e-9);const r=moveOnAxle(m,p.id,{distance:10});assert.ok(Math.abs(r.distance-10)<.001);assert.ok(Math.abs(p.pos[0]-65)<.001);assert.doesNotThrow(()=>parseModel(exportModel(m)));});
test('through placement respects full part thickness at shaft ends',()=>{const {rod,m,t}=setup();const next=throughPlacement(m,'s-silver',t,{offset:999});assert.ok(Math.abs(next.link.offset)<=((190+2)/2-9.3/2));assert.ok(!Number.isNaN(next.link.offset));});
test('clear span is found on a rotated rod',()=>{const {rod,m}=setup();rod.quat=Q().setFromAxisAngle(V([0,1,0]),.8).toArray();const t=targets(m,'h-medium','through')[0],p=throughPlacement(m,'h-medium',t,{offset:-40}).part;assert.ok(V(p.pos).distanceTo(V(rod.pos).addScaledVector(V([1,0,0]).applyQuaternion(Q(rod.quat)),-40))<1e-8);});
test('no room remains blocked instead of overlapping or moving another part',()=>{const {m,t}=setup();const before=exportModel(m),p=throughPlacement(m,'c-white',t,{conflicts:()=>['obstruction']});assert.equal(p.link.offset,0);assert.equal(exportModel(m),before);});
test('inserting a rod through a hole also searches along its length',()=>{const host=part('c-white'),m={parts:[host],links:[]},t=targets(m,'r-gray','through')[0],p=throughPlacement(m,'r-gray',t,{offset:40});assert.ok(Math.abs(p.link.offset-40)<.001);assert.ok(V(p.part.pos).distanceTo(V(host.pos))>39);});
