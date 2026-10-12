import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPath,PATH_PRESETS,parseDesign,exportDesign} from '../dist/path-builder.js';
import {BY_ID,V,Q,ports,component,parseModel,exportModel,part,targets,solve,add} from '../dist/engine.js';
import {ORANGE_TAB,SampledPath,pathLength} from '../dist/flexible-parts.js';
import {partMass} from '../dist/mass.js';
import {duplicateSelection} from '../dist/editor-state.js';
const design=(points=PATH_PRESETS.hill,bank=0)=>({kind:'track',trackType:'track-orange',points,bank,spacing:65});
test('original orange track uses real stock assemblies with exact side-grip and tubing-tab alignment',()=>{
 for(const points of Object.entries(PATH_PRESETS).filter(([k])=>k!=='long').map(([,p])=>p).map(ps=>ps.map(p=>p.map(v=>v*2))))for(const bank of [-60,0,60]){
  const r=buildPath(design(points,bank)),m=r.model;assert.equal(m.parts.length,2+3*r.tieCount);assert.equal(m.links.length,4*r.tieCount);assert.equal(component(m,m.parts[0].id).size,m.parts.length);assert.doesNotThrow(()=>parseModel(exportModel(m)));
  for(const l of m.links){const mount=m.parts.find(p=>p.id===l.a),host=m.parts.find(p=>p.id===l.b);
   if(l.mode==='side'){const socket=ports(mount).find(p=>p.key===l.ap),grip=V(socket.pos).addScaledVector(V(socket.dir),4.4),rodPoint=V([l.offset,0,0]).applyQuaternion(Q(host.quat)).add(V(host.pos));assert.ok(grip.distanceTo(rodPoint)<1e-8);assert.equal(host.type,'r-90958');assert.ok(Math.abs(Math.abs(l.offset)-(BY_ID[host.type].length/2-8))<1e-8);}
   else{const tab=V(ORANGE_TAB).applyQuaternion(Q(mount.quat)).add(V(mount.pos)),curve=new SampledPath(host.path),rail=curve.getPoint(l.offset/curve.total).applyQuaternion(Q(host.quat)).add(V(host.pos));assert.ok(tab.distanceTo(rail)<1e-7);}
  }
 }
});
test('track stock, scaled cut mass and backward-compatible design persistence',()=>{
 const d=design(),m=buildPath(d).model;assert.deepEqual(parseDesign(exportDesign(d)),d);assert.equal(BY_ID['track-orange'].partNumber,'92602');assert.equal(BY_ID['c-track-orange'].partNumber,'90910');assert.equal(partMass(m.parts[0],BY_ID['track-orange']),pathLength(m.parts[0].path)*13/1730);
 const long=buildPath(design([[0,0,0],[1740,0,0]]));assert.ok(long.spliceCount>0);for(const p of long.model.parts.filter(p=>p.path))assert.ok(pathLength(p.path)<=1730);assert.doesNotThrow(()=>buildPath({...design([[0,0,0],[1740,0,0]]),trackType:'track-purple'}));assert.throws(()=>buildPath({...d,trackType:'micro'}));
 const original=exportModel(m);duplicateSelection(m,m.parts.map(p=>p.id));assert.doesNotThrow(()=>parseModel(exportModel(m)));assert.equal(m.parts.length,JSON.parse(original).parts.length*2);
});
test('different coaster families cannot be falsely joined or share a tubing tab',()=>{
 const m=buildPath(design()).model,link=m.links.find(l=>l.mode==='track');m.parts[0].type='track-purple';assert.throws(()=>parseModel(exportModel(m)),/match/);m.parts[0].type='track-orange';m.links.push({...link,b:m.parts[1].id});assert.throws(()=>parseModel(exportModel(m)),/used twice/);
});
test('orange track connector remains a functional five-way Classic connector',()=>{
 for(const mode of ['end','through','side']){const mount=part('c-track-orange'),m={parts:[mount],links:[]},t=targets(m,'r-blue',mode)[0];assert.ok(t);add(m,solve(m,'r-blue',t,mode));assert.doesNotThrow(()=>parseModel(exportModel(m)));}
});

test('a bend tighter than the track gauge cannot generate a folded inner rail',()=>{assert.throws(()=>buildPath(design(PATH_PRESETS.bend)),/folds an inner rail/);});
