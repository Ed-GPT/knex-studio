import {BoundsBroadphase} from './physics-broadphase.js';
import * as C from './vendor/cannon-es.js';
import {V,Q,parseModel,exportModel} from './engine.js';
import {hingeSystem,stepHingeSystem} from './hinge-system.js';
import {collisionShapes} from './physics-shapes.js';
import {physicsSettings} from './physics-settings.js';
const cv=v=>new C.Vec3(...v),cq=q=>new C.Quaternion(...q);
export function createPhysics(model,settings=model.physics){
 const config=physicsSettings(settings),copy=parseModel(exportModel(model));
 // Freeze joints only for this preview. The saved mechanical connections stay intact.
 const graph=config.rigid?{...copy,links:copy.links.map(l=>['through','end-bearing','hinge','ball'].includes(l.mode)?{...l,mode:'end'}:l)}:copy;
 const partById=new Map(copy.parts.map(p=>[p.id,p]));const s=hingeSystem(graph,null,{unified:true});s.model=copy;s.config=config;s.balls=[];s.damping=.1;s.world.gravity.set(0,-config.gravity,0);s.world.allowSleep=true;s.world.solver.iterations=s.planarAxis&&s.joints.length>s.groups.filter(g=>!g.fixed).length?400:20;s.world.broadphase=new BoundsBroadphase(s.world);s.world.broadphase.useBoundingBoxes=true;
 const mat=new C.Material('physics');s.world.addContactMaterial(new C.ContactMaterial(mat,mat,{friction:config.friction,restitution:config.bounce,contactEquationStiffness:1e8,contactEquationRelaxation:4}));
 s.staticChunks=[];s.shapeCount=0;for(const g of s.groups){const b=g.body,ignored=g.parts.some(p=>p.physicsOff),inertia=b.inertia.clone();while(b.shapes.length)b.removeShape(b.shapes[0]);b.material=mat;b.collisionFilterGroup=2;b.collisionFilterMask=ignored?0:config.contacts?7:5;b.allowSleep=!s.joints.some(j=>j.a===g||j.b===g);b.sleepSpeedLimit=.015;b.sleepTimeLimit=1;
  if(!ignored)for(const local of g.local){const p=partById.get(local.id);for(const proxy of collisionShapes(p)){const position=V(proxy.pos).multiplyScalar(.001).applyQuaternion(local.quat).add(local.pos),rotation=local.quat.clone().multiply(Q(proxy.quat));const shape=proxy.shape();shape.body=b;b.shapes.push(shape);b.shapeOffsets.push(cv(position.toArray()));b.shapeOrientations.push(cq(rotation.toArray()));s.shapeCount++;if(s.shapeCount>12000)throw Error('Physics needs more than 12,000 collision shapes. Bypass a section or test a smaller build.');}}
  // Batch shape attachment: Cannon addShape recalculates the whole compound each time.
  b.updateMassProperties();if(!g.fixed){b.inertia.copy(inertia);b.invInertia.set(1/inertia.x,1/inertia.y,1/inertia.z);b.updateInertiaWorld(true);}b.updateBoundingRadius();b.aabbNeedsUpdate=true;
  // Long locked tracks need compact broadphase bounds. A single compound would
  // test every rail segment against every moving lift part on every substep.
  if(g.fixed&&b.shapes.length>256&&!s.joints.some(j=>j.a===g||j.b===g)){
   const items=b.shapes.map((shape,i)=>({shape,pos:b.pointToWorldFrame(b.shapeOffsets[i]),quat:b.quaternion.mult(b.shapeOrientations[i])}));
   b.shapes=[];b.shapeOffsets=[];b.shapeOrientations=[];b.updateBoundingRadius();b.aabbNeedsUpdate=true;
   for(let i=0;i<items.length;i+=24){const batch=items.slice(i,i+24),center=new C.Vec3();for(const x of batch)center.vadd(x.pos,center);center.scale(1/batch.length,center);const chunk=new C.Body({mass:0,position:center,material:mat,collisionFilterGroup:2,collisionFilterMask:b.collisionFilterMask});for(const x of batch)chunk.addShape(x.shape,x.pos.vsub(center),x.quat);s.world.addBody(chunk);s.staticChunks.push(chunk);}
  }

 }
 for(const j of [...s.joints])if(j.a.parts.some(p=>p.physicsOff)||j.b.parts.some(p=>p.physicsOff)){s.world.removeConstraint(j.constraint);s.joints.splice(s.joints.indexOf(j),1);}
 const floor=new C.Body({mass:0,shape:new C.Plane(),material:mat,collisionFilterGroup:1,collisionFilterMask:6});floor.quaternion.setFromEuler(-Math.PI/2,0,0);floor.aabbNeedsUpdate=true;s.world.addBody(floor);
 function drop(pos){if(s.balls.length>=32)throw Error('Maximum 32 balls. Reset or remove a ball.');if(!Array.isArray(pos)||pos.length!==3||!pos.every(Number.isFinite)||pos[1]<23)throw Error('Place the ball above the floor.');if(s.balls.some(b=>b.position.distanceTo(cv(pos.map(n=>n/1000)))<.047))throw Error('Move the drop point away from the other ball.');
  const b=new C.Body({mass:.024,position:cv(pos.map(n=>n/1000)),shape:new C.Sphere(.023),material:mat,collisionFilterGroup:4,collisionFilterMask:7,linearDamping:.015,angularDamping:.035,allowSleep:true,sleepSpeedLimit:.015,sleepTimeLimit:1});const i=2/3*b.mass*.023**2;b.inertia.set(i,i,i);b.invInertia.set(1/i,1/i,1/i);b.updateInertiaWorld(true);s.world.addBody(b);s.balls.push(b);return b;
 }
 s.warnings=[];s.motors=[];for(const motor of config.motors||[]){const housing=partById.get(motor.id);if(!housing){s.warnings.push('A saved motor was removed.');continue;}if(!['m-blue','m-green','m-two-speed'].includes(housing.type))throw Error('Physics motor requires a supported enclosed motor.');const group=s.owner.get(motor.id),joint=s.joints.find(j=>!j.ball&&j.links.some(l=>l.mode==='through'&&(l.a===motor.id&&l.ap==='hole'||l.b===motor.id&&l.bp==='hole')));if(!joint||joint.a.fixed&&joint.b.fixed){s.warnings.push('Motor held: unlock its drive shaft and uncheck Rigid assemblies.');continue;}joint.constraint.enableMotor();joint.constraint.setMotorMaxForce(motor.torque);const axis=joint.a.body.vectorToWorldFrame(joint.constraint.axisA),driveAxis=cv(V([0,0,1]).applyQuaternion(Q(housing.quat)).toArray()),sign=(joint.a===group?1:-1)*Math.sign(axis.dot(driveAxis));if(motor.sweep)s.warnings.push('Legacy automatic reversal ignored: this motor rotates continuously. Use a physical linkage for reciprocating motion.');s.motors.push({...motor,joint,sign,angle:0});}
 for(const ball of config.balls)drop(ball.pos);
 s.drop=drop;s.beforeStep=dt=>{for(const m of s.motors){const speed=m.rpm*Math.PI/30,axis=m.joint.a.body.vectorToWorldFrame(m.joint.constraint.axisA);m.angle+=m.sign*m.joint.b.body.angularVelocity.vsub(m.joint.a.body.angularVelocity).dot(axis)*dt;m.joint.constraint.setMotorSpeed(-speed*m.direction*m.sign);}for(const b of [...s.groups.filter(g=>!g.fixed).map(g=>g.body),...s.balls]){const speed=b.velocity.length();if(speed>5)b.velocity.scale(5/speed,b.velocity);const spin=b.angularVelocity.length();if(spin>100)b.angularVelocity.scale(100/spin,b.angularVelocity);}};
 s.step=dt=>{stepHingeSystem(copy,s,Math.min(dt,1/30));if(s.groups.some(g=>!Number.isFinite(g.body.position.x)||g.body.position.length()>20))throw Error('Simulation stopped outside the work area. Reset and check the supports.');};
 return s;
}
