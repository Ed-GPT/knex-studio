import test from 'node:test';
import assert from 'node:assert/strict';
import {scaleModel,pantographModel} from '../dist/mechanism-models.js';
import {V,Q,definition,exportModel,parseModel,component,targets,solve,add} from '../dist/engine.js';
import {hingeSystem,stepHingeSystem,beginHingeGrab,moveHingeGrab,endHingeGrab} from '../dist/hinge-system.js';
const group=(m,n)=>m.editor.groups.find(g=>g.name===n).partIds.map(id=>m.parts.find(p=>p.id===id));
const tick=(m,s,t,fps=60)=>{for(let i=0;i<t*fps;i++)stepHingeSystem(m,s,1/fps);};
const gap=s=>Math.max(...s.joints.map(j=>j.a.body.pointToWorldFrame(j.constraint.pivotA).distanceTo(j.b.body.pointToWorldFrame(j.constraint.pivotB))))*1000;
const loads=m=>['Left load','Right load'].map(n=>group(m,n).find(p=>definition(p).tire));
const points=m=>[group(m,'Input arm')[0],group(m,'Short link A')[1],group(m,'Output arm')[2]];
const ratioError=([o,c,e])=>Math.hypot(e.pos[0]-2*c.pos[0]+o.pos[0],e.pos[2]-2*c.pos[2]+o.pos[2]);
for(const factory of[scaleModel,pantographModel])test(factory.name+' uses connected stock parts with aligned, retained axle stacks',()=>{
 const m=factory();assert.equal(component(m,m.parts[0].id).size,m.parts.length);assert.doesNotThrow(()=>parseModel(exportModel(m)));
 for(const l of m.links.filter(l=>l.mode==='through')){const a=m.parts.find(p=>p.id===l.a),b=m.parts.find(p=>p.id===l.b),r=definition(a).group==='rods'?a:b,h=r===a?b:a,axis=V([1,0,0]).applyQuaternion(Q(r.quat)),d=V(h.pos).sub(V(r.pos)),off=d.dot(axis),cap=(definition(r).length-(definition(h).thickness||6.3))/2;assert.ok(d.addScaledVector(axis,-off).length()<1e-6);assert.ok(Math.abs(V([0,0,1]).applyQuaternion(Q(h.quat)).dot(axis))>.999999);assert.ok(Math.abs(off)<=cap+.001,`${h.type} runs off ${r.type}: ${off}/${cap}`);}
});
test('equal suspended scale loads stay level; unequal load lowers the correct side',()=>{
 for(const [leftLoadG,rightLoadG]of [[0,0],[10,0],[0,10],[100,100]]){const m=scaleModel({leftLoadG,rightLoadG}),s=hingeSystem(m),fixed=m.parts.filter(p=>p.grounded).map(p=>structuredClone(p));tick(m,s,8);const[l,r]=loads(m),delta=l.pos[1]-r.pos[1];if(leftLoadG===rightLoadG)assert.ok(Math.abs(delta)<.01);else assert.ok(delta*(rightLoadG-leftLoadG)>0);assert.ok(gap(s)<.01);for(const p of fixed)assert.deepEqual(m.parts.find(x=>x.id===p.id),p);}
});
test('released scale swings back and forth without a scripted animation',()=>{
 const m=scaleModel(),s=hingeSystem(m),[left,right]=loads(m);beginHingeGrab(s,left.id,left.pos);moveHingeGrab(s,V(left.pos).add(V([0,-50,0])).toArray());tick(m,s,1);endHingeGrab(s);const values=[];for(let i=0;i<600;i++){stepHingeSystem(m,s,1/60);values.push(left.pos[1]-right.pos[1]);}assert.ok(Math.min(...values)<-5);assert.ok(Math.max(...values)>5);assert.ok(gap(s)<.01);
});
test('pantograph preserves a 2x ratio through a moving working-range target and after release',()=>{
 const m=pantographModel(),s=hingeSystem(m),p=points(m),before=p[1].pos.slice();beginHingeGrab(s,p[1].id,p[1].pos);let worst=0,maxGap=0;
 for(let i=0;i<1200;i++){moveHingeGrab(s,[25+30*Math.sin(i/60),85,130+20*Math.cos(i/60)]);stepHingeSystem(m,s,1/60);worst=Math.max(worst,ratioError(p));maxGap=Math.max(maxGap,gap(s));}
 endHingeGrab(s);let releaseError=0;for(let i=0;i<600;i++){stepHingeSystem(m,s,1/60);releaseError=Math.max(releaseError,ratioError(p));}assert.ok(releaseError<.2,`Near-toggle release residual ${releaseError} mm`);assert.ok(worst<.01,`Copy ratio residual ${worst} mm`);assert.ok(maxGap<.01);assert.ok(V(before).distanceTo(V(p[1].pos))>10);assert.ok(ratioError(p)<.01);for(const g of s.groups)if(!g.fixed)assert.ok(Math.abs(V(g.body.position.toArray()).dot(s.planarAxis)-g.planar.height)<1e-8);
});
test('closed loop survives unreachable and off-plane pulls, while cancel restores the model pose',()=>{
 const m=pantographModel(),s=hingeSystem(m),p=points(m),before=structuredClone(m);beginHingeGrab(s,p[1].id,p[1].pos);let worst=0;
 for(let i=0;i<360;i++){moveHingeGrab(s,[i%60<30?10000:-10000,10000,i%90<45?10000:-10000]);stepHingeSystem(m,s,1/60);worst=Math.max(worst,gap(s));}
 assert.ok(worst<.2,`Loop gap ${worst} mm`);for(const j of s.joints)assert.ok(j.a.body.vectorToWorldFrame(j.constraint.axisA).dot(j.b.body.vectorToWorldFrame(j.constraint.axisB))>.999999);
 endHingeGrab(s,true);stepHingeSystem(m,s,0);for(const part of m.parts){const old=before.parts.find(x=>x.id===part.id);assert.ok(V(part.pos).distanceTo(V(old.pos))<1e-7);assert.ok(Q(part.quat).angleTo(Q(old.quat))<1e-7);}assert.doesNotThrow(()=>parseModel(exportModel(m)));
});
test('closed-loop drag matches 30, 60 and 120 FPS; serialized pose can resume',()=>{
 const results=[];for(const fps of [30,60,120]){const m=pantographModel(),s=hingeSystem(m),p=points(m);beginHingeGrab(s,p[1].id,p[1].pos);moveHingeGrab(s,[0,85,120]);tick(m,s,2,fps);endHingeGrab(s);results.push(p.map(x=>x.pos.slice()));const saved=parseModel(exportModel(m)),resumed=hingeSystem(saved);tick(saved,resumed,1);assert.ok(ratioError(points(saved))<.02);}
 for(const result of results.slice(1))for(let i=0;i<3;i++)assert.ok(V(result[i]).distanceTo(V(results[0][i]))<1e-6);
});

test('mixed-axis hinges keep the spatial solver instead of being flattened',async()=>{
 const {singleHinge}=await import('../dist/examples.js'),m=singleHinge(),arm=m.parts.find(p=>p.type==='r-red'),bearing=add(m,solve(m,'c-gray',targets(m,'c-gray','through').find(t=>t.partId===arm.id),'through')),tip=add(m,solve(m,'r-blue',targets(m,'r-blue','end').find(t=>t.partId===bearing.id),'end')),s=hingeSystem(m,tip.id);
 assert.equal(s.planarAxis,null);assert.equal(s.jointCount,2);const before=structuredClone(m.parts.filter(p=>p.grounded));beginHingeGrab(s,tip.id,tip.pos);moveHingeGrab(s,V(tip.pos).add(V([30,10,20])).toArray());tick(m,s,1);endHingeGrab(s);tick(m,s,3);assert.ok(gap(s)<.2);for(const p of before)assert.deepEqual(m.parts.find(x=>x.id===p.id),p);assert.doesNotThrow(()=>parseModel(exportModel(m)));
});
