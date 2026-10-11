import {assertUngrounded} from './grounding.js';
import {slideDistance} from './slide-collision.js';
import {V,Q,DEG,definition,component,part,emptyModel,targets,solve,add} from './engine.js';

// A socket clip is rigid. An unlocked center hole acts as a bearing.
export function rigidComponent(model,id){return component({...model,links:model.links.filter(l=>l.mode!=='mesh'&&l.mode!=='end-bearing'&&(l.mode!=='through'||l.locked||model.parts.some(p=>(p.id===l.a||p.id===l.b)&&(definition(p).driveClip||definition(p).axleGrip))))},id);}
const rodFor=(model,l)=>model.parts.find(p=>(p.id===l.a||p.id===l.b)&&definition(p).group==='rods');
export function axleInfo(model,id){
 const ids=rigidComponent(model,id),boundary=model.links.filter(l=>l.mode!=='mesh'&&(ids.has(l.a)!==ids.has(l.b)));
 const selected=model.parts.find(p=>p.id===id);
 const rod=boundary.length?rodFor(model,boundary[0]):model.parts.find(p=>ids.has(p.id)&&definition(p).group==='rods'&&p.id===id);
 if(!rod)return {ids,available:false,reason:'Select a rod or an assembly attached through a center hole.'};
 const axis=V([1,0,0]).applyQuaternion(Q(rod.quat)).normalize(),origin=V(rod.pos);
 let min=-10000,max=10000;
 for(const l of boundary){
  const r=rodFor(model,l),ra=V([1,0,0]).applyQuaternion(Q(r.quat)).normalize();
  const separation=V(r.pos).sub(origin);separation.addScaledVector(axis,-separation.dot(axis));
  if(Math.abs(axis.dot(ra))<.9999||separation.length()>.35)return {ids,available:false,reason:'This assembly is constrained by different axles. Detach a connection before moving it.'};
  if(l.mode==='end-bearing'){min=Math.max(min,0);max=Math.min(max,0);continue;}
  const c=model.parts.find(p=>p.id===(l.a===r.id?l.b:l.a));
  const offset=V(c.pos).sub(V(r.pos)).dot(ra),cap=Math.max(0,definition(r).length/2-(definition(c).thickness||7)/2);
  const sign=(ids.has(c.id)?1:-1)*axis.dot(ra),lo=(-cap-offset)/sign,hi=(cap-offset)/sign;
  min=Math.max(min,Math.min(lo,hi));max=Math.min(max,Math.max(lo,hi));
 }
 if(min>max+.01)return {ids,available:false,reason:'The axle connections are outside their sliding limits.'};
 return {ids,available:true,axis:axis.toArray(),origin:origin.toArray(),min,max,boundary,rodId:rod.id};
}
export function transformParts(model,ids,origin,axis,degrees=0,delta=[0,0,0]){
 assertUngrounded(model,ids);const center=V(origin),q=Q().setFromAxisAngle(V(axis).normalize(),degrees*DEG),shift=V(delta);
 for(const p of model.parts)if(ids.has(p.id)){p.pos=V(p.pos).sub(center).applyQuaternion(q).add(center).add(shift).toArray();p.quat=q.clone().multiply(Q(p.quat)).normalize().toArray();}
}
export function moveOnAxle(model,id,{distance=0,degrees=0}={}){
 if(!Number.isFinite(distance)||!Number.isFinite(degrees))throw Error('Enter a finite distance and angle.');
 const info=axleInfo(model,id);if(!info.available)throw Error(info.reason);
 const limited=slideDistance(model,info.ids,info.axis,Math.max(info.min,Math.min(info.max,distance))),applied=limited.distance;
 transformParts(model,info.ids,info.origin,info.axis,degrees,V(info.axis).multiplyScalar(applied).toArray());
 // Keep joint metadata in sync with the geometry. Endpoint order is preserved.
 for(const l of info.boundary){const rod=rodFor(model,l),c=model.parts.find(p=>p.id===(l.a===rod.id?l.b:l.a));l.offset=V(c.pos).sub(V(rod.pos)).dot(V([1,0,0]).applyQuaternion(Q(rod.quat)));l.roll=((l.roll||0)+(info.ids.has(l.b)?1:-1)*degrees)%360;}
 return {...info,distance:applied,degrees,blockedBy:limited.blockedBy};
}
export function windmillModel(){
 const m=emptyModel('Windmill motion demo');
 const front=part('c-white',[0,125,0]),back=part('c-white',[0,125,-70]);m.parts.push(front,back);
 const axle=add(m,solve(m,'r-gray',targets(m,'r-gray','through').find(t=>t.partId===front.id),'through',{offset:0}));
 m.links.push({a:back.id,ap:'hole',b:axle.id,bp:'shaft',mode:'through',offset:-70});
 // A side clip grips the rod, so rotor blades belong to the same rigid group.
 const hub=add(m,solve(m,'c-white',targets(m,'c-white','side').find(t=>t.partId===axle.id),'side',{offset:55,portIndex:0}));
 for(const socket of[1,3,5,7])add(m,solve(m,'r-yellow',targets(m,'r-yellow','end').find(t=>t.partId===hub.id&&t.key==='slot'+socket),'end'));
 for(const support of[front,back]){const leg=add(m,solve(m,'r-yellow',targets(m,'r-yellow','end').find(t=>t.partId===support.id&&t.key==='slot6'),'end'));add(m,solve(m,'c-red',targets(m,'c-red','end').find(t=>t.partId===leg.id),'end',{portIndex:2}));}
 return m;
}
