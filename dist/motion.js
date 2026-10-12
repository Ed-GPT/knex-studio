import {SPRING_PREVIEW_LIMIT} from './spring-motor.js';
import {assertUngrounded} from './grounding.js';
import {slideDistance} from './slide-collision.js';
import {V,Q,DEG,definition,component,ports,linkedBore,part,emptyModel,targets,solve,add} from './engine.js';

// A socket clip is rigid. An unlocked center hole acts as a bearing.
export function rigidComponent(model,id){return component({...model,links:model.links.filter(l=>l.mode!=='mesh'&&l.mode!=='end-bearing'&&l.mode!=='hinge'&&l.mode!=='ball'&&(l.mode!=='through'||l.locked||model.parts.some(p=>(p.id===l.a||p.id===l.b)&&(definition(p).driveClip||definition(p).axleGrip))))},id);}
const rodFor=(model,l)=>model.parts.find(p=>(p.id===l.a||p.id===l.b)&&definition(p).group==='rods');
export function ballInfo(model,id){
 const ids=rigidComponent(model,id),boundary=model.links.filter(l=>l.mode!=='mesh'&&(ids.has(l.a)!==ids.has(l.b)));
 if(!boundary.some(l=>l.mode==='ball'))return{ids,available:false};
 const centers=boundary.map(l=>l.mode==='ball'?ports(model.parts.find(p=>p.id===l.a)).find(p=>p.key==='joint').pos:null),origin=centers.find(Boolean);
 if(centers.some(c=>!c||V(c).distanceTo(V(origin))>.02))return{ids,available:false,reason:'This section has several joint centers. Use Simulate to move them together.'};
 return{ids,available:true,origin,axis:[0,0,1],boundary,kind:'ball',label:'Ball joint'};
}
export function pointBallToward(model,id,from,to){
 const info=ballInfo(model,id);if(!info.available)throw Error(info.reason||'No free ball joint.');
 const a=V(from).sub(V(info.origin)),b=V(to).sub(V(info.origin));if(a.length()<.01||b.length()<.01)return info;
 const q=Q().setFromUnitVectors(a.normalize(),b.normalize()),w=Math.max(-1,Math.min(1,q.w)),angle=2*Math.acos(w),axis=V([q.x,q.y,q.z]);if(axis.lengthSq()>1e-12)transformParts(model,info.ids,info.origin,axis.normalize().toArray(),angle/DEG);return info;
}
export function axleInfo(model,id){
 const ids=rigidComponent(model,id),boundary=model.links.filter(l=>l.mode!=='mesh'&&(ids.has(l.a)!==ids.has(l.b)));
 if(boundary.some(l=>l.mode==='ball'))return{ids,available:false,reason:'This is a ball joint. Drag the arm or use its rotation rings.'};
 const selected=model.parts.find(p=>p.id===id);
 if(boundary.some(l=>l.mode==='hinge')){
  const joints=boundary.map(l=>{if(l.mode==='hinge'){const p=model.parts.find(p=>p.id===l.a),port=ports(p).find(p=>p.key==='pivot');return{axis:V(port.dir),origin:V(port.pos)};}const rod=rodFor(model,l);if(!rod)return null;return{axis:V([1,0,0]).applyQuaternion(Q(rod.quat)),origin:V(linkedBore(model,l).pos)};}),first=joints[0];
  if(!first||joints.some(j=>!j||Math.abs(j.axis.dot(first.axis))<.9999||j.origin.clone().sub(first.origin).cross(first.axis).length()>.35))return{ids,available:false,reason:'This assembly has multiple pivot axes. Use Simulate to move connected hinges together.'};
  return{ids,available:true,axis:first.axis.toArray(),origin:first.origin.toArray(),min:0,max:0,boundary,hinge:true};
 }
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
  const bore=linkedBore(model,l),offset=V(bore.pos).sub(V(r.pos)).dot(ra),cap=Math.max(0,definition(r).length/2-bore.thickness/2);
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
export function moveOnAxle(model,id,{distance=0,degrees=0,springPlayback=false}={}){
 if(!Number.isFinite(distance)||!Number.isFinite(degrees))throw Error('Enter a finite distance and angle.');
 const info=axleInfo(model,id);if(!info.available)throw Error(info.reason);
 const limited=slideDistance(model,info.ids,info.axis,Math.max(info.min,Math.min(info.max,distance))),applied=limited.distance;
 const winding=[];if(!springPlayback&&degrees)for(const l of info.boundary){const motor=model.parts.find(p=>(p.id===l.a||p.id===l.b)&&definition(p).springMotor);if(!motor||(motor.id===l.a?l.ap:l.bp)!=='hole')continue;const sign=(info.ids.has(motor.id)?-1:1)*V(info.axis).dot(V([0,0,1]).applyQuaternion(Q(motor.quat)));winding.push({motor,delta:-degrees*sign/360});}
 transformParts(model,info.ids,info.origin,info.axis,degrees,V(info.axis).multiplyScalar(applied).toArray());for(const {motor,delta}of winding)motor.springTurns=Math.max(0,Math.min(SPRING_PREVIEW_LIMIT,(motor.springTurns||0)+delta));
 // Keep joint metadata in sync with the geometry. Endpoint order is preserved.
 for(const l of info.boundary){if(l.mode==='hinge'){l.roll=((l.roll||0)+(info.ids.has(l.b)?1:-1)*degrees)%360;continue;}const rod=rodFor(model,l),c=model.parts.find(p=>p.id===(l.a===rod.id?l.b:l.a));l.offset=V(linkedBore(model,l).pos).sub(V(rod.pos)).dot(V([1,0,0]).applyQuaternion(Q(rod.quat)));l.roll=((l.roll||0)+(info.ids.has(l.b)?1:-1)*degrees)%360;}
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
