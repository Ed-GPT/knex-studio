import {massOf,partMass,localMassCenter} from './mass.js';
export {massOf} from './mass.js';
import {assertUngrounded} from './grounding.js';
import {V,Q,DEG,definition} from './engine.js';
import {axleInfo,transformParts} from './motion.js';
// One rigid body on a fixed revolute joint. Distances are mm, masses are
// relative grams. Mass estimates affect inertia, not an advertised part weight.
const gravity=V([0,-9810,0]),STEP=1/240;

export function hingeBody(model,id){const info=axleInfo(model,id);if(!info.available)throw Error(info.reason);assertUngrounded(model,info.ids);if(!info.boundary.length)throw Error('Attach this assembly through an unlocked axle hole first.');const axis=V(info.axis),origin=V(info.origin),moment=V(),poses=[];let mass=0,inertia=0;
 for(const p of model.parts)if(info.ids.has(p.id)){const d=definition(p),m=partMass(p,d),r=V(localMassCenter(p,d)).applyQuaternion(Q(p.quat)).add(V(p.pos)).sub(origin),radial=r.clone().addScaledVector(axis,-r.dot(axis));mass+=m;moment.addScaledVector(r,m);let own;
  if(d.group==='rods'){const rodAxis=V([1,0,0]).applyQuaternion(Q(p.quat));own=m*(d.length*d.length/12*(1-Math.pow(axis.dot(rodAxis),2))+4);}
  else{const radius=d.diameter?d.diameter/2:d.motor?30:d.group==='connectors'?12:5;own=m*radius*radius/2;}
  inertia+=m*radial.lengthSq()+own;poses.push({id:p.id,pos:[...p.pos],quat:[...p.quat]});
 }
 if(inertia<1e-8)throw Error('This assembly has no rotational inertia.');
 return{...info,axis:axis.toArray(),origin:origin.toArray(),moment:moment.toArray(),mass,inertia,poses,angle:0,omega:0,accumulator:0,elapsed:0,damping:.22,held:false,baselineLinks:model.links.map(l=>({...l}))};
}
export function torque(body,angle=body.angle){const m=V(body.moment).applyAxisAngle(V(body.axis),angle);return m.cross(gravity).dot(V(body.axis));}
export function energy(body){const m=V(body.moment).applyAxisAngle(V(body.axis),body.angle);return .5*body.inertia*body.omega**2-m.dot(gravity);}
export function applyBody(model,body){assertUngrounded(model,body.ids);const original=new Map(body.poses.map(p=>[p.id,p]));for(const p of model.parts)if(original.has(p.id)){const b=original.get(p.id);p.pos=[...b.pos];p.quat=[...b.quat];}transformParts(model,body.ids,body.origin,body.axis,body.angle/DEG);
 for(let i=0;i<model.links.length;i++){const l=model.links[i],base=body.baselineLinks[i];if(body.ids.has(l.a)!==body.ids.has(l.b))l.roll=((base.roll||0)+(body.ids.has(l.b)?1:-1)*body.angle/DEG)%360;}
}
export function stepPhysics(model,body,dt){if(!Number.isFinite(dt)||dt<0||!Number.isFinite(body.damping)||body.damping<0)throw Error('Invalid physics step.');if(body.held)return;body.accumulator+=Math.min(dt,.1);while(body.accumulator+1e-12>=STEP){
  // Velocity Verlet with symmetric viscous damping; stable at varying render FPS.
  const decay=Math.exp(-body.damping*STEP/2);body.omega*=decay;body.omega+=torque(body)/body.inertia*STEP/2;body.angle+=body.omega*STEP;body.omega+=torque(body)/body.inertia*STEP/2;body.omega*=decay;body.accumulator-=STEP;body.elapsed+=STEP;
 }applyBody(model,body);
}
export function holdBody(body){body.held=true;body.omega=0;body.accumulator=0;body.samples=[];}
export function dragBody(model,body,angle,time){if(!Number.isFinite(angle)||!Number.isFinite(time))return;body.angle=angle;body.samples.push({angle,time});body.samples=body.samples.filter(s=>time-s.time<=.12).slice(-12);applyBody(model,body);}
export function releaseBody(body,time,cancel=false){const samples=(body.samples||[]).filter(s=>time-s.time<=.12),a=samples[0],b=samples.at(-1);body.omega=!cancel&&a&&b&&b.time-a.time>.008?Math.max(-10,Math.min(10,(b.angle-a.angle)/(b.time-a.time))):0;body.held=false;body.samples=[];body.accumulator=0;}
export function physicsCandidates(model){const seen=new Set(),result=[];for(const l of model.links.filter(l=>l.mode==='through'&&!l.locked)){for(const id of[l.a,l.b]){if(seen.has(id))continue;try{const b=hingeBody(model,id);for(const k of b.ids)seen.add(k);const axis=V(b.axis),radial=V(b.moment).addScaledVector(axis,-V(b.moment).dot(axis)).length()/b.mass;if(radial>5&&Math.abs(axis.y)<.95)result.push({id,body:b,radial});}catch{seen.add(id);}}}return result.sort((a,b)=>b.radial-a.radial);}
