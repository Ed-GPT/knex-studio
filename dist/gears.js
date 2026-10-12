import {beltEdges,validateBeltDrive} from './belt-drive.js';
import {pulleyRadius} from './belt-parts.js';
import {gearContact} from './gear-contact.js';
import {assertUngrounded} from './grounding.js';
import {V,Q,definition,part,emptyModel,targets,solve,add} from './engine.js';
import {rigidComponent,axleInfo,moveOnAxle} from './motion.js';
export function gearTransmission(model,startId){
 const edges=[...model.links.filter(l=>l.mode==='mesh'),...beltEdges(model)],initial=rigidComponent(model,startId),plans=[{ids:initial,id:startId,ratio:1}],seen=new Map([...initial].map(id=>[id,1]));
 for(let i=0;i<plans.length;i++){const plan=plans[i];for(const l of edges.filter(l=>l.mode==='belt'?(plan.ids.has(l.a)||plan.ids.has(l.b)):(plan.ids.has(l.a)!==plan.ids.has(l.b)))){
  if(l.mode==='belt')validateBeltDrive(l,model.parts.find(p=>p.id===l.a),model.parts.find(p=>p.id===l.b));
  const p=model.parts.find(p=>p.id===(plan.ids.has(l.a)?l.a:l.b)),other=model.parts.find(x=>x.id===(p.id===l.a?l.b:l.a)),a=definition(p),b=definition(other),axis=V([0,0,1]).applyQuaternion(Q(p.quat)),otherAxis=V([0,0,1]).applyQuaternion(Q(other.quat));
  const contact=l.mode==='belt'?true:gearContact(p,a,other,b);if(!contact)throw Error('A gear pair is out of mesh. Reconnect the gears before running the motor.');
  const ids=rigidComponent(model,other.id),rod=model.parts.find(p=>ids.has(p.id)&&definition(p).group==='rods'),drivenId=rod?.id||other.id;
  const info=axleInfo(model,drivenId),parent=axleInfo(model,plan.id);if(!info.available||!parent.available||l.mode==='belt'&&(!info.boundary?.length||!parent.boundary?.length))throw Error('Mount each driven gear or pulley on a supported axle before running.');
  const tangentA=l.mode==='belt'?axis:axis.clone().cross(V(contact).sub(V(p.pos))).normalize(),tangentB=l.mode==='belt'?otherAxis:otherAxis.clone().cross(V(contact).sub(V(other.pos))).normalize();
  const ratio=plan.ratio*(l.mode==='belt'?pulleyRadius(a)/pulleyRadius(b):a.teeth/b.teeth)*Math.sign(tangentA.dot(tangentB)*V(parent.axis).dot(axis)*V(info.axis).dot(otherAxis));
  if(seen.has(other.id)){if(Math.abs(seen.get(other.id)-ratio)>1e-5)throw Error('This transmission loop is locked by conflicting ratios.');continue;}
  for(const id of ids)seen.set(id,ratio);plans.push({ids,id:drivenId,ratio});
 }}return plans;
}
export function rotateTransmission(model,startId,degrees,{springPlayback=false}={}){const plan=gearTransmission(model,startId);for(const step of plan)assertUngrounded(model,step.ids);for(const step of plan)moveOnAxle(model,step.id,{degrees:degrees*step.ratio,springPlayback});return plan;}
export function gearDemo(){const m=emptyModel('Motor gear train · 34 to 14 teeth'),motor=part('m-blue',[0,55,0]);m.parts.push(motor);const attach=(type,host,mode,options={})=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id),mode,options));
 const axle=attach('r-gray',motor,'through'),clip=attach('k-tan',axle,'through',{offset:40}),gear=attach('g-red34',clip,'keyed');m.links.push({a:axle.id,ap:'shaft',b:gear.id,bp:'hole',mode:'through',offset:gear.pos[2]});
 const driven=attach('g-gray14',gear,'mesh'),out=attach('r-red',driven,'through');
 for(const offset of[-38,38])attach('c-gray',out,'through',{offset,roll:90});return m;
}
