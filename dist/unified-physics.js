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
 const partById=new Map(copy.parts.map(p=>[p.id,p]));const s=hingeSystem(graph,null,{unified:true});s.model=copy;s.config=config;s.balls=[];s.damping=.1;s.world.gravity.set(0,-config.gravity,0);s.world.allowSleep=true;s.world.solver.iterations=20;s.world.broadphase=new C.SAPBroadphase(s.world);s.world.broadphase.useBoundingBoxes=true;
 const mat=new C.Material('physics');s.world.addContactMaterial(new C.ContactMaterial(mat,mat,{friction:config.friction,restitution:config.bounce,contactEquationStiffness:1e8,contactEquationRelaxation:4}));
 s.shapeCount=0;for(const g of s.groups){const b=g.body,ignored=g.parts.some(p=>p.physicsOff),inertia=b.inertia.clone();while(b.shapes.length)b.removeShape(b.shapes[0]);b.material=mat;b.collisionFilterGroup=2;b.collisionFilterMask=ignored?0:config.contacts?7:5;b.allowSleep=!s.joints.some(j=>j.a===g||j.b===g);b.sleepSpeedLimit=.015;b.sleepTimeLimit=1;
  if(!ignored)for(const local of g.local){const p=partById.get(local.id);for(const proxy of collisionShapes(p)){const position=V(proxy.pos).multiplyScalar(.001).applyQuaternion(local.quat).add(local.pos),rotation=local.quat.clone().multiply(Q(proxy.quat));const shape=proxy.shape();shape.body=b;b.shapes.push(shape);b.shapeOffsets.push(cv(position.toArray()));b.shapeOrientations.push(cq(rotation.toArray()));s.shapeCount++;if(s.shapeCount>12000)throw Error('Physics needs more than 12,000 collision shapes. Bypass a section or test a smaller build.');}}
  // Batch shape attachment: Cannon addShape recalculates the whole compound each time.
  b.updateMassProperties();if(!g.fixed){b.inertia.copy(inertia);b.invInertia.set(1/inertia.x,1/inertia.y,1/inertia.z);b.updateInertiaWorld(true);}b.updateBoundingRadius();b.aabbNeedsUpdate=true;
 }
 for(const j of [...s.joints])if(j.a.parts.some(p=>p.physicsOff)||j.b.parts.some(p=>p.physicsOff)){s.world.removeConstraint(j.constraint);s.joints.splice(s.joints.indexOf(j),1);}
 const floor=new C.Body({mass:0,shape:new C.Plane(),material:mat,collisionFilterGroup:1,collisionFilterMask:6});floor.quaternion.setFromEuler(-Math.PI/2,0,0);s.world.addBody(floor);
 function drop(pos){if(s.balls.length>=32)throw Error('Maximum 32 balls. Reset or remove a ball.');if(!Array.isArray(pos)||pos.length!==3||!pos.every(Number.isFinite)||pos[1]<23)throw Error('Place the ball above the floor.');if(s.balls.some(b=>b.position.distanceTo(cv(pos.map(n=>n/1000)))<.047))throw Error('Move the drop point away from the other ball.');
  const b=new C.Body({mass:.024,position:cv(pos.map(n=>n/1000)),shape:new C.Sphere(.023),material:mat,collisionFilterGroup:4,collisionFilterMask:7,linearDamping:.015,angularDamping:.035,allowSleep:true,sleepSpeedLimit:.015,sleepTimeLimit:1});const i=2/3*b.mass*.023**2;b.inertia.set(i,i,i);b.invInertia.set(1/i,1/i,1/i);b.updateInertiaWorld(true);s.world.addBody(b);s.balls.push(b);return b;
 }
 for(const ball of config.balls)drop(ball.pos);
 s.drop=drop;s.beforeStep=()=>{for(const b of [...s.groups.filter(g=>!g.fixed).map(g=>g.body),...s.balls]){const speed=b.velocity.length();if(speed>5)b.velocity.scale(5/speed,b.velocity);const spin=b.angularVelocity.length();if(spin>100)b.angularVelocity.scale(100/spin,b.angularVelocity);}};
 s.step=dt=>{stepHingeSystem(copy,s,Math.min(dt,1/30));if(s.groups.some(g=>!Number.isFinite(g.body.position.x)||g.body.position.length()>20))throw Error('Simulation stopped outside the work area. Reset and check the supports.');};
 return s;
}
