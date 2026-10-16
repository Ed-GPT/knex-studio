import test from 'node:test';
import assert from 'node:assert/strict';
import {airplaneModel} from '../dist/airplane-model.js';
import {BY_ID,V,Q,ports,borePorts,component,parseModel,exportModel} from '../dist/engine.js';
import {createInterferenceGuard} from '../dist/interference.js';

function fits(m){const map=new Map(m.parts.map(p=>[p.id,p])),occupied=new Set();for(const l of m.links){
 const a=map.get(l.a),b=map.get(l.b);assert.ok(a&&b);
 if(l.mode==='end'){
  const ap=ports(a).find(p=>p.key===l.ap),bp=ports(b).find(p=>p.key===l.bp);assert.ok(V(ap.pos).distanceTo(V(bp.pos))<1e-6);assert.ok(V(ap.dir).dot(V(bp.dir))<-.999999);
  for(const k of[l.a+':'+l.ap,l.b+':'+l.bp]){assert.ok(!occupied.has(k),'Duplicate socket '+k);occupied.add(k);}
 }else if(l.mode==='through'){
  const rod=BY_ID[a.type].group==='rods'?a:b,host=rod===a?b:a,bore=borePorts(host).find(p=>p.key===(host===a?l.ap:l.bp)),axis=V(ports(rod)[1].dir),delta=V(bore.pos).sub(V(rod.pos));
  assert.ok(delta.clone().cross(axis).length()<1e-6);assert.ok(Math.abs(delta.dot(axis)-l.offset)<1e-6);assert.ok(Math.abs(delta.dot(axis))+bore.thickness/2<=BY_ID[rod.type].length/2+1e-6);
 }
}}
test('straight-rod aircraft has connected diagonal wings, a volumetric fuselage and retained moving parts',()=>{
 const m=airplaneModel();assert.equal(m.parts.length,317);assert.equal(component(m,m.parts[0].id).size,m.parts.length);assert.ok(m.parts.every(p=>BY_ID[p.type]&&!BY_ID[p.type].legacy&&!BY_ID[p.type].flexi&&!p.path));fits(m);
 const diag=m.parts.filter(p=>BY_ID[p.type].group==='rods').map(p=>V(ports(p)[1].dir)).filter(d=>[d.x,d.y,d.z].filter(v=>Math.abs(v)>1e-5).length===2);assert.ok(diag.length>70);
 for(const name of['Fuselage','Cockpit','Vertical fin','Left wing','Right wing','Landing gear','Propeller'])assert.ok(m.editor.layers.some(l=>l.name===name));
 const wingZ=m.parts.filter(p=>m.editor.layers.filter(l=>l.name.endsWith('wing')).some(l=>l.partIds.includes(p.id))).map(p=>p.pos[2]);assert.ok(Math.max(...wingZ)-Math.min(...wingZ)>=1050);
 const body=m.parts.filter(p=>m.editor.layers.find(l=>l.name==='Fuselage').partIds.includes(p.id));assert.ok(Math.max(...body.map(p=>p.pos[1]))-Math.min(...body.map(p=>p.pos[1]))>=75);assert.equal(m.parts.filter(p=>p.type==='t-small').length,4);assert.equal(m.parts.filter(p=>p.type==='k-cap').length,6);
 assert.deepEqual(createInterferenceGuard(m).check({all:true}),[]);assert.equal(parseModel(exportModel(m)).parts.length,m.parts.length);
});
test('propeller completes a revolution without separating its blades or striking the support',()=>{
 const m=airplaneModel(),layer=m.editor.layers.find(l=>l.name==='Propeller'),hub=m.parts.find(p=>layer.partIds.includes(p.id)&&p.type==='c-white'),ids=component({...m,links:m.links.filter(l=>l.mode!=='through')},hub.id),center=V(hub.pos);assert.equal(ids.size,9);
 for(let degrees=0;degrees<360;degrees+=15){const pose=parseModel(exportModel(m)),rotation=Q().setFromAxisAngle(V([1,0,0]),degrees*Math.PI/180);for(const p of pose.parts)if(ids.has(p.id)){p.pos=V(p.pos).sub(center).applyQuaternion(rotation).add(center).toArray();p.quat=rotation.clone().multiply(Q(p.quat)).toArray();}fits(pose);assert.deepEqual(createInterferenceGuard(pose).check({all:true}),[],'Propeller collision at '+degrees+' degrees');}
});
