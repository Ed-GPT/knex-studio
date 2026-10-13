import {createPhysics} from './unified-physics.js';
import {applyHingeSystem} from './hinge-system.js';
import {createInterferenceGuard,InterferenceError} from './interference.js';
import {V,Q} from './engine.js';

// Keep contact response and interference validation separate: a joint disables
// Cannon's body-pair contacts, but must not exempt the rest of those assemblies.
export function createCheckedPhysics(model,settings=model.physics){
 const s=createPhysics(model,settings);
 if(!s.config.contacts)return s;
 const excluded=new Set(s.groups.filter(g=>g.parts.some(p=>p.physicsOff)).flatMap(g=>[...g.ids]));
 const guard=createInterferenceGuard(s.model,{excluded});
 const locals=new Map(s.groups.flatMap(g=>g.local.map(l=>[l.id,{g,l}])));
 let checked=false,checkpoint=null;
 function fail(error){s.fault=error;s.grab=null;s.held=false;throw error;}
 s.checkInterference=()=>{if(s.fault)throw s.fault;if(checked)return;const hit=guard.check();if(hit)fail(new InterferenceError(hit,s.model,'start'));checked=true;};
 const before=s.beforeStep;
 s.beforeStep=dt=>{
  checkpoint={time:s.world.time,stepnumber:s.world.stepnumber,angles:s.motors.map(m=>m.angle),bodies:s.world.bodies.map(b=>({b,pos:b.position.clone(),quat:b.quaternion.clone(),v:b.velocity.clone(),w:b.angularVelocity.clone()}))};
  before(dt);
 };
 s.afterStep=()=>{
  const prior=new Map(checkpoint.bodies.map(p=>[p.b,p]));
  let travel=0;
  for(const e of guard.entries){const {g,l}=locals.get(e.id);if(g.fixed)continue;const b=g.body,old=prior.get(b),radius=e.c.bounds.getSize(V()).length()/2+e.c.bounds.getCenter(V()).length()+l.pos.length()*1000;travel=Math.max(travel,b.position.distanceTo(old.pos)*1000+Q(b.quaternion.toArray()).angleTo(Q(old.quat.toArray()))*radius);}
  const steps=Math.max(1,Math.ceil(travel/.5));let error=null;
  if(steps>128)error=Object.assign(Error('Simulation stopped: motion is too fast to validate safely. Reduce speed and reset.'),{code:'INTERFERENCE_STEP_LIMIT',partIds:[]});
  else for(let i=1;i<=steps;i++){
   const t=i/steps;
   const hit=guard.check({skipPair:(a,b)=>{const x=locals.get(a).g,y=locals.get(b).g;return x===y||x.fixed&&y.fixed;},pose:p=>{
    const {g,l}=locals.get(p.id);if(g.fixed)return p;const old=prior.get(g.body),q=Q(old.quat.toArray()).slerp(Q(g.body.quaternion.toArray()),t),pos=V(old.pos.toArray()).lerp(V(g.body.position.toArray()),t);
    return{pos:l.pos.clone().applyQuaternion(q).add(pos).multiplyScalar(1000).toArray(),quat:q.multiply(l.quat).toArray()};
   }});
   if(hit){error=new InterferenceError(hit,s.model);break;}
  }
  if(error){
   for(const {b,pos,quat,v,w} of checkpoint.bodies){b.position.copy(pos);b.previousPosition.copy(pos);b.interpolatedPosition.copy(pos);b.quaternion.copy(quat);b.previousQuaternion.copy(quat);b.interpolatedQuaternion.copy(quat);b.velocity.copy(v);b.angularVelocity.copy(w);b.force.setZero();b.torque.setZero();b.aabbNeedsUpdate=true;b.updateInertiaWorld(true);}
   s.world.time=checkpoint.time;s.world.stepnumber=checkpoint.stepnumber;s.motors.forEach((m,i)=>m.angle=checkpoint.angles[i]);s.accumulator=0;applyHingeSystem(s.model,s);fail(error);
  }
 };
 const step=s.step;s.step=dt=>{s.checkInterference();step(dt);};
 return s;
}
