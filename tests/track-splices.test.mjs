import test from 'node:test';
import assert from 'node:assert/strict';
import {supportedTrackSplice} from '../dist/track-models.js';
import {buildPath,PATH_PRESETS} from '../dist/path-builder.js';
import {BY_ID,V,Q,part,ports,component,exportModel,parseModel,targets,solve,add} from '../dist/engine.js';
import {SPLICE_TAB,TRACK_FITTINGS} from '../dist/track-fittings.js';
import {pathLength,SampledPath,transportedFrames} from '../dist/flexible-parts.js';
import {makePart} from '../dist/geometry.js';
import {duplicateSelection} from '../dist/editor-state.js';
const world=(p,v)=>V(v).applyQuaternion(Q(p.quat)).add(V(p.pos));
function spliceJoints(m){for(const p of m.parts.filter(p=>BY_ID[p.type].splice)){
 const center=world(p,BY_ID[p.type].trackSplicer?SPLICE_TAB:[0,0,0]),links=m.links.filter(l=>l.mode==='track'&&(l.a===p.id||l.b===p.id));assert.equal(links.length,2);
 for(const l of links){const tube=m.parts.find(t=>t.id===(l.a===p.id?l.b:l.a)),key=l.a===p.id?l.bp:l.ap;assert.ok(center.distanceTo(world(tube,tube.path[key==='tube0'?0:tube.path.length-1]))<1e-7);}
}}
test('90911 fixture follows the manual: parallel rod and tubing, two supported cut ends',()=>{
 const m=supportedTrackSplice();assert.equal(m.parts.length,6);assert.equal(m.links.length,7);assert.equal(component(m,m.parts[0].id).size,6);spliceJoints(m);assert.doesNotThrow(()=>parseModel(exportModel(m)));
 for(const l of m.links.filter(l=>l.mode==='end')){const a=ports(m.parts.find(p=>p.id===l.a)).find(p=>p.key===l.ap),b=ports(m.parts.find(p=>p.id===l.b)).find(p=>p.key===l.bp);assert.ok(V(a.pos).distanceTo(V(b.pos))<1e-8);}
});
test('90911 side grip accepts Classic rods in either assembly order, excluding short green molds',()=>{
 for(const reversed of [false,true])for(const quat of [[0,0,0,1],Q().setFromAxisAngle(V([1,2,3]).normalize(),1.3).toArray()]){
  const host=part(reversed?'k-track-splicer':'r-blue',[20,60,40],quat),m={parts:[host],links:[]},type=reversed?'r-blue':'k-track-splicer',p=add(m,solve(m,type,targets(m,type,'side')[0],'side',{offset:8,roll:25}));assert.doesNotThrow(()=>parseModel(exportModel(m)));const clip=reversed?host:p,rod=reversed?p:host,port=ports(clip)[0],center=V(port.pos).addScaledVector(V(port.dir),4.4);assert.ok(center.distanceTo(world(rod,[8,0,0]))<1e-8);
 }
 const clip=part('k-track-splicer'),m={parts:[clip],links:[]};assert.equal(targets(m,'r-green','side').length,0);assert.equal(targets(m,'r-blue','end').length,0);assert.equal(targets(m,'r-blue','through').length,0);
});
test('long orange paths use bounded cuts and real inline splices clear of support tabs',()=>{
 for(const points of [PATH_PRESETS.long,[[-2400,100,0],[2400,100,0]],[[-1800,100,-400],[-600,400,200],[600,200,-200],[1800,100,400]]])for(const bank of [0,35]){
  const r=buildPath({kind:'track',trackType:'track-orange',points,bank,spacing:95}),m=r.model,tubes=m.parts.filter(p=>BY_ID[p.type].tubing);assert.ok(r.spliceCount>=2);assert.equal(tubes.length,r.tubeCuts);assert.equal(component(m,m.parts[0].id).size,m.parts.length);assert.doesNotThrow(()=>parseModel(exportModel(m)));spliceJoints(m);
  for(const p of tubes){assert.ok(pathLength(p.path)<=1730+.001);assert.ok(p.curveNormal);}
  for(const p of m.parts.filter(p=>BY_ID[p.type].trackJoiner))for(const mount of m.parts.filter(p=>BY_ID[p.type].trackTab))assert.ok(V(p.pos).distanceTo(world(mount,[0,-10,0]))>14);
 }
});
test('split track keeps its transported frame and endpoint identities through clone/save',()=>{
 const m=buildPath({kind:'track',trackType:'track-orange',points:[[-1800,100,-400],[-600,400,200],[600,200,-200],[1800,100,400]],bank:35,spacing:95}).model;
 for(const splice of m.parts.filter(p=>BY_ID[p.type].trackJoiner)){const links=m.links.filter(l=>l.a===splice.id),a=m.parts.find(p=>p.id===links.find(l=>l.ap==='rail0').b),b=m.parts.find(p=>p.id===links.find(l=>l.ap==='rail1').b),frames=p=>transportedFrames(new SampledPath(p.path),1024,0,p.curveNormal);assert.ok(frames(a).normals.at(-1).dot(frames(b).normals[0])>.999,'Tubing seam must not twist');}
 const saved=parseModel(exportModel(m));assert.deepEqual(saved.parts.filter(p=>p.path).map(p=>p.curveNormal),m.parts.filter(p=>p.path).map(p=>p.curveNormal));const source=m.parts[0],ids=duplicateSelection(m,m.parts.map(p=>p.id)),copy=m.parts.find(p=>p.id===ids[0]);assert.deepEqual(copy.curveNormal,source.curveNormal);assert.notEqual(copy.curveNormal,source.curveNormal);assert.doesNotThrow(()=>parseModel(exportModel(m)));
});
test('splices reserve tube ends and reject the wrong fitting family or a duplicated endpoint',()=>{
 const m=supportedTrackSplice(),l=m.links.find(l=>l.bp==='tube1');m.links.push({...l,a:part('k-track-joiner').id});m.parts.push({...part('k-track-joiner'),id:m.links.at(-1).a});assert.throws(()=>parseModel(exportModel(m)),/used twice/);m.links.pop();m.parts.pop();m.parts.find(p=>p.id===l.b).type='track-purple';assert.throws(()=>parseModel(exportModel(m)),/match/);
});
test('both real fittings render finite open clip / inline strip geometry',()=>{for(const d of TRACK_FITTINGS){let count=0;makePart(d.id).traverse(o=>{if(o.isMesh){count++;assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));}});assert.ok(count>=2);assert.equal(d.noBore,true);}assert.equal(BY_ID['k-track-splicer'].partNumber,'90911');assert.equal(BY_ID['k-track-joiner'].partNumber,'20501');});
