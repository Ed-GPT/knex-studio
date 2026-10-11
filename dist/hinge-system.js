import * as C from './vendor/cannon-es.js';
import * as T from './vendor/three.module.js';
import {V,Q,definition,ports} from './engine.js';
import {rigidComponent} from './motion.js';
import {partMass,localMassCenter} from './mass.js';
const STEP=1/240,cv=v=>new C.Vec3(...v),cq=q=>new C.Quaternion(...q),tv=v=>V([v.x,v.y,v.z]);
// SI units inside the solver. Shape inertia is approximate; sourced/user masses
// and each part's center of mass determine the compound center and distribution.
function massProperties(parts){
 const entries=parts.map(p=>{const d=definition(p),mass=partMass(p,d)/1000,center=V(localMassCenter(p,d)).applyQuaternion(Q(p.quat)).add(V(p.pos)).multiplyScalar(.001);return{p,d,mass,center};});
 const mass=entries.reduce((s,e)=>s+e.mass,0),center=V();for(const e of entries)center.addScaledVector(e.center,e.mass/mass);
 const a=Array.from({length:3},()=>[0,0,0]);
 for(const {p,d,mass:m,center:c} of entries){const r=c.clone().sub(center).toArray(),dims=d.bodyDims|| (d.group==='rods'?[d.length,5,5]:d.motor?[55,55,45]:d.diameter?[d.diameter,d.diameter,d.thickness||8]:d.group==='connectors'?[30,30,6.3]:[10,10,7]),inertia=dims.map((_,i)=>m*(dims[(i+1)%3]**2+dims[(i+2)%3]**2)/12e6),axes=[[1,0,0],[0,1,0],[0,0,1]].map(v=>V(v).applyQuaternion(Q(p.quat)).toArray());
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){a[i][j]+=m*((i===j?r.reduce((s,x)=>s+x*x,0):0)-r[i]*r[j]);for(let k=0;k<3;k++)a[i][j]+=inertia[k]*axes[k][i]*axes[k][j];}
 }
 // Symmetric Jacobi eigensolver: principal inertia axes, including off-diagonal terms.
 const basis=[[1,0,0],[0,1,0],[0,0,1]];for(let n=0;n<24;n++){let p=0,q=1;for(const [i,j]of[[0,2],[1,2]])if(Math.abs(a[i][j])>Math.abs(a[p][q])){p=i;q=j;}if(Math.abs(a[p][q])<1e-15)break;const angle=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(angle),s=Math.sin(angle),pp=a[p][p],qq=a[q][q],pq=a[p][q];a[p][p]=c*c*pp-2*s*c*pq+s*s*qq;a[q][q]=s*s*pp+2*s*c*pq+c*c*qq;a[p][q]=a[q][p]=0;for(let k=0;k<3;k++){if(k!==p&&k!==q){const kp=a[k][p],kq=a[k][q];a[k][p]=a[p][k]=c*kp-s*kq;a[k][q]=a[q][k]=s*kp+c*kq;}const bp=basis[k][p],bq=basis[k][q];basis[k][p]=c*bp-s*bq;basis[k][q]=s*bp+c*bq;}}
 const axes=[0,1,2].map(i=>V(basis.map(row=>row[i])));if(axes[0].clone().cross(axes[1]).dot(axes[2])<0)axes[2].negate();const quat=Q().setFromRotationMatrix(new T.Matrix4().makeBasis(...axes));return{mass,center,quat,inertia:a.map((r,i)=>Math.max(1e-10,r[i]))};
}
export function hingeSystem(model,selected){
 const groups=[],owner=new Map();for(const p of model.parts)if(!owner.has(p.id)){const ids=rigidComponent(model,p.id),group={ids,parts:model.parts.filter(p=>ids.has(p.id)),index:groups.length};for(const id of ids)owner.set(id,group);groups.push(group);}
 const edges=[];for(const l of model.links){const a=owner.get(l.a),b=owner.get(l.b);if(!['through','end-bearing','hinge'].includes(l.mode)||l.locked||a===b)continue;if(l.mode==='hinge'){const half=model.parts.find(p=>p.id===l.a),pivot=ports(half).find(p=>p.key==='pivot');edges.push({a,b,l,axis:V(pivot.dir),origin:V(pivot.pos).multiplyScalar(.001)});continue;}const rod=model.parts.find(p=>(p.id===l.a||p.id===l.b)&&definition(p).group==='rods');if(!rod)continue;const hole=model.parts.find(p=>p.id===(rod.id===l.a?l.b:l.a)),axis=V([1,0,0]).applyQuaternion(Q(rod.quat));edges.push({a,b,l,rod,hole,axis,origin:V(hole.pos).multiplyScalar(.001)});}
 if(!edges.length)throw Error('No free hinge found. Connect a mating hinge pair or parts through an unlocked axle hole.');
 let seed=owner.get(selected);if(!seed||!edges.some(e=>e.a===seed||e.b===seed))seed=edges[0].a;
 const connected=new Set([seed]);let changed=true;while(changed){changed=false;for(const e of edges)if(connected.has(e.a)!==connected.has(e.b)){connected.add(e.a);connected.add(e.b);changed=true;}}
 const activeEdges=edges.filter(e=>connected.has(e.a)),grounded=[...connected].filter(g=>g.parts.some(p=>p.grounded)),fallback=grounded.length?null:[...connected].sort((a,b)=>b.parts.length-a.parts.length)[0];
 const world=new C.World({gravity:new C.Vec3(0,-9.81,0),allowSleep:false});world.solver.iterations=40;world.solver.tolerance=1e-9;
 const ids=new Set();for(const g of connected){const m=massProperties(g.parts),fixed=grounded.includes(g)||g===fallback,b=new C.Body({mass:fixed?0:m.mass,position:cv(m.center.toArray()),quaternion:cq(m.quat.toArray()),allowSleep:false,collisionFilterMask:0,linearDamping:0,angularDamping:0});b.addShape(new C.Sphere(.001));if(!fixed){b.inertia.copy(cv(m.inertia));b.invInertia.set(...m.inertia.map(x=>1/x));b.updateInertiaWorld(true);for(const id of g.ids)ids.add(id);}g.body=b;g.fixed=fixed;g.local=g.parts.map(p=>({id:p.id,pos:V(p.pos).multiplyScalar(.001).sub(m.center).applyQuaternion(m.quat.clone().invert()),quat:m.quat.clone().invert().multiply(Q(p.quat))}));world.addBody(b);}
 if(!ids.size)throw Error('Every hinged assembly is locked. Unlock the moving parts first.');
 const joints=[];for(const e of activeEdges){if(e.a.fixed&&e.b.fixed)continue;const old=joints.find(j=>((j.a===e.a&&j.b===e.b)||(j.a===e.b&&j.b===e.a))&&Math.abs(j.axis.dot(e.axis))>.9999&&e.origin.clone().sub(j.origin).cross(j.axis).length()<.00035);if(old){old.links.push(e.l);continue;}const a=e.a.body,b=e.b.body,pivot=cv(e.origin.toArray()),axis=cv(e.axis.toArray()),constraint=new C.HingeConstraint(a,b,{pivotA:a.pointToLocalFrame(pivot),pivotB:b.pointToLocalFrame(pivot),axisA:a.vectorToLocalFrame(axis),axisB:b.vectorToLocalFrame(axis),maxForce:1e5,collideConnected:false});for(const eq of constraint.equations)eq.setSpookParams(1e8,4,STEP);world.addConstraint(constraint);const tangent=e.axis.clone().cross(Math.abs(e.axis.y)<.9?V([0,1,0]):V([1,0,0])).normalize();joints.push({...e,constraint,links:[e.l],tangentA:a.vectorToLocalFrame(cv(tangent.toArray())),tangentB:b.vectorToLocalFrame(cv(tangent.toArray()))});}
 for(const j of joints)j.rolls=j.links.map(l=>l.roll||0);
 const planarAxis=activeEdges.every(e=>Math.abs(e.axis.dot(activeEdges[0].axis))>.999999)?activeEdges[0].axis.clone().normalize():null;
 // Parallel revolute joints restrict the entire connected mechanism to planar
 // motion. Preserve that exact invariant instead of accumulating solver tilt.
 if(planarAxis)for(const g of connected){const local=planarAxis.clone().applyQuaternion(Q(g.body.quaternion.toArray()).invert()),i=g.body.inertia;g.planar={quat:Q(g.body.quaternion.toArray()),height:tv(g.body.position).dot(planarAxis),inverseInertia:g.fixed?0:1/(local.x*local.x*i.x+local.y*local.y*i.y+local.z*local.z*i.z)};}
 const system={planarAxis,kind:'hinge-system',world,groups:[...connected],owner,ids,joints,jointCount:joints.length,damping:.22,held:false,angle:0,omega:0,accumulator:0,elapsed:0,implicitSupport:!!fallback,grab:null};return system;
}
export function applyHingeSystem(model,s){for(const g of s.groups){if(g.fixed)continue;const q=Q(g.body.quaternion.toArray()),c=tv(g.body.position);for(const local of g.local){const p=model.parts.find(p=>p.id===local.id);p.pos=local.pos.clone().applyQuaternion(q).add(c).multiplyScalar(1000).toArray();p.quat=q.clone().multiply(local.quat).normalize().toArray();}}for(const j of s.joints){const a=tv(j.a.body.vectorToWorldFrame(j.tangentA)),b=tv(j.b.body.vectorToWorldFrame(j.tangentB)),axis=tv(j.a.body.vectorToWorldFrame(j.constraint.axisA)),angle=Math.atan2(axis.dot(a.clone().cross(b)),a.dot(b))*180/Math.PI;j.links.forEach((l,i)=>{l.roll=(j.rolls[i]+(s.owner.get(l.a)===j.a?1:-1)*angle)%360;});}}
export function stepHingeSystem(model,s,dt){if(!Number.isFinite(dt)||dt<0||!Number.isFinite(s.damping)||s.damping<0)throw Error('Invalid physics step.');s.accumulator+=Math.min(dt,.1);while(s.accumulator+1e-12>=STEP){const decay=Math.exp(-s.damping*STEP);for(const g of s.groups)if(!g.fixed){g.body.velocity.scale(decay,g.body.velocity);g.body.angularVelocity.scale(decay,g.body.angularVelocity);}applyGrabForce(s);s.world.step(STEP);closeHingePivots(s);s.accumulator-=STEP;s.elapsed+=STEP;}applyHingeSystem(model,s);}
// A mouse is a bounded spring force, not an immovable extra constraint. An
// unreachable pointer cannot overpower the actual hinges or teleport a body.
export function beginHingeGrab(s,id,point){endHingeGrab(s);const g=s.owner.get(id);if(!g?.body||g.fixed)return false;const p=cv(V(point).multiplyScalar(.001).toArray());s.grab={g,local:g.body.pointToLocalFrame(p),target:p.clone(),poses:s.groups.map(x=>({g:x,pos:x.body.position.clone(),quat:x.body.quaternion.clone(),velocity:x.body.velocity.clone(),omega:x.body.angularVelocity.clone()}))};s.held=true;return true;}
export function moveHingeGrab(s,point){if(!s.grab||!Array.isArray(point)||point.length!==3||!point.every(Number.isFinite))return;s.grab.target.copy(cv(V(point.map(x=>Math.max(-10000,Math.min(10000,x)))).multiplyScalar(.001).toArray()));}
export function endHingeGrab(s,cancel=false){if(!s.grab)return;if(cancel)for(const p of s.grab.poses){p.g.body.position.copy(p.pos);p.g.body.quaternion.copy(p.quat);p.g.body.velocity.copy(p.velocity);p.g.body.angularVelocity.copy(p.omega);p.g.body.force.setZero();p.g.body.torque.setZero();p.g.body.updateInertiaWorld(true);p.g.body.aabbNeedsUpdate=true;}s.grab=null;s.held=false;}
function applyGrabForce(s){if(!s.grab)return;const {g,local,target}=s.grab,b=g.body,point=b.pointToWorldFrame(local),velocity=b.getVelocityAtWorldPoint(point,new C.Vec3()),error=target.vsub(point),force=error.scale(b.mass*120);force.vsub(velocity.scale(b.mass*24),force);const limit=b.mass*35,length=force.length();if(length>limit)force.scale(limit/length,force);b.applyForce(force,point.vsub(b.position));}
// Remove the small positional residual left by an iterative velocity solver.
// Corrections are inverse-mass weighted; locked supports are never touched.
function closeHingePivots(s){
 if(s.planarAxis){closePlanarPivots(s);return;}
 for(let pass=0;pass<32;pass++){let worst=0;for(const j of s.joints){const a=j.a.body,b=j.b.body,pa=a.pointToWorldFrame(j.constraint.pivotA),pb=b.pointToWorldFrame(j.constraint.pivotB),error=pb.vsub(pa),distance=error.length(),sum=a.invMass+b.invMass;if(!sum)continue;worst=Math.max(worst,distance);if(distance<1e-8)continue;if(a.invMass)a.position.vadd(error.scale(a.invMass/sum),a.position);if(b.invMass)b.position.vsub(error.scale(b.invMass/sum),b.position);}if(worst<1e-7)break;}
}
function closePlanarPivots(s){
 const n=s.planarAxis,previous=new Map(s.groups.filter(g=>!g.fixed).map(g=>[g,{pos:tv(g.body.position),quat:Q(g.body.quaternion.toArray())}]));
 for(const g of s.groups){if(g.fixed)continue;const b=g.body,relative=Q(b.quaternion.toArray()).multiply(g.planar.quat.clone().invert()),dot=relative.x*n.x+relative.y*n.y+relative.z*n.z,twist=Q([n.x*dot,n.y*dot,n.z*dot,relative.w]).normalize();b.quaternion.copy(cq(twist.multiply(g.planar.quat).toArray()));
  b.position.copy(cv(tv(b.position).addScaledVector(n,g.planar.height-tv(b.position).dot(n)).toArray()));
  b.velocity.copy(cv(tv(b.velocity).addScaledVector(n,-tv(b.velocity).dot(n)).toArray()));b.angularVelocity.copy(cv(n.clone().multiplyScalar(tv(b.angularVelocity).dot(n)).toArray()));
 }
 // Position-level joint closure includes rotational compliance. Translation-only
 // correction cannot close a loop whose member angles have numerical residuals.
 // K is the inverse effective mass at the joint, including each arm's inertia.
 for(let pass=0;pass<128;pass++){let worst=0;for(const j of s.joints){const a=j.a.body,b=j.b.body,pa=tv(a.pointToWorldFrame(j.constraint.pivotA)),pb=tv(b.pointToWorldFrame(j.constraint.pivotB)),error=pb.clone().sub(pa),distance=error.length();worst=Math.max(worst,distance);if(distance<1e-10)continue;
   const va=n.clone().cross(pa.sub(tv(a.position))),vb=n.clone().cross(pb.sub(tv(b.position))),wa=j.a.planar.inverseInertia,wb=j.b.planar.inverseInertia,sum=a.invMass+b.invMass;if(!sum)continue;
   const av=va.toArray(),bv=vb.toArray(),k=new T.Matrix3().set(...[0,1,2].flatMap(i=>[0,1,2].map(j=>(i===j?sum:0)+wa*av[i]*av[j]+wb*bv[i]*bv[j]))),impulse=error.applyMatrix3(k.invert());
   for(const [body,v,w,sign]of[[a,va,wa,1],[b,vb,wb,-1]])if(body.invMass){body.position.copy(cv(tv(body.position).addScaledVector(impulse,sign*body.invMass).toArray()));const angle=Math.max(-.2,Math.min(.2,sign*w*v.dot(impulse))),q=Q().setFromAxisAngle(n,angle).multiply(Q(body.quaternion.toArray())).normalize();body.quaternion.copy(cq(q.toArray()));}
  }if(worst<1e-9)break;
 }
 for(const g of s.groups)if(!g.fixed){const old=previous.get(g),b=g.body,shift=tv(b.position).sub(old.pos).multiplyScalar(1/STEP),dq=Q(b.quaternion.toArray()).multiply(old.quat.invert());if(dq.w<0){dq.x*=-1;dq.y*=-1;dq.z*=-1;dq.w*=-1;}const angle=2*Math.atan2(dq.x*n.x+dq.y*n.y+dq.z*n.z,dq.w);b.velocity.vadd(cv(shift.toArray()),b.velocity);b.velocity.copy(cv(tv(b.velocity).addScaledVector(n,-tv(b.velocity).dot(n)).toArray()));b.angularVelocity.vadd(cv(n.clone().multiplyScalar(angle/STEP).toArray()),b.angularVelocity);b.updateInertiaWorld(true);b.aabbNeedsUpdate=true;}
}

export function nudgeHingeSystem(s,id){const g=s.owner.get(id),body=g?.body&&!g.fixed?g.body:s.groups.find(g=>!g.fixed).body;const joint=s.joints.find(j=>j.a.body===body||j.b.body===body),axis=joint?tv(joint.a.body.vectorToWorldFrame(joint.constraint.axisA)):V([0,0,1]),direction=axis.cross(V([0,1,0]));if(direction.lengthSq()<1e-8)direction.set(1,0,0);body.applyImpulse(cv(direction.normalize().multiplyScalar(body.mass*.3).toArray()));}
