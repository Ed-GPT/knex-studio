import {wormMotorDrive} from './worm-motor-drive.js';
import {SPRING_PREVIEW_LIMIT} from './spring-motor.js';
import {motorRate} from './classic-motors.js';
import {groundingReason} from './grounding.js';
import {V,Q,SOCKET,BY_ID,part,ports,targets,solve,add,emptyModel,definition,component} from './engine.js';
import {rigidComponent,axleInfo,moveOnAxle} from './motion.js';
import {rotateTransmission,gearTransmission} from './gears.js';
export function motorDrive(model,motorId){
 const motor=model.parts.find(p=>p.id===motorId&&definition(p).motor);if(!motor)return {ready:false,reason:'Select a motor.'};
 if(definition(motor).wormMotor)return wormMotorDrive(model,motor);
 const link=model.links.find(l=>l.mode==='through'&&(l.a===motorId&&l.ap==='hole'||l.b===motorId&&l.bp==='hole'));
 if(!link)return {ready:false,reason:'Insert a rod through the motor drive hole.'};
 const shaft=model.parts.find(p=>p.id===(link.a===motorId?link.b:link.a));
 if(!shaft||definition(shaft).group!=='rods')return {ready:false,reason:'The motor needs a rod as its axle.'};
 const info=axleInfo(model,shaft.id);if(!info.available)return {ready:false,reason:info.reason};
 if(info.ids.has(motorId))return {ready:false,reason:'The rotor is locked to the motor housing. Release that connection.'};
 const a=V([1,0,0]).applyQuaternion(Q(shaft.quat)),b=V([0,0,1]).applyQuaternion(Q(motor.quat)),gap=V(shaft.pos).sub(V(motor.pos));
 if(Math.abs(a.dot(b))<.9999||gap.clone().addScaledVector(a,-gap.dot(a)).length()>.35)return {ready:false,reason:'The axle is not aligned with the motor.'};
 try{for(const stage of gearTransmission(model,shaft.id)){const reason=groundingReason(model,stage.ids);if(reason)return {...info,ready:false,reason};}}catch(error){return {...info,ready:false,reason:error.message};}
 return {...info,ready:true,shaftId:shaft.id,motorId};
}
export function stepMotor(model,motorId,seconds,{rpm=undefined,direction=1}={}){
 rpm??=motorRate(model.parts.find(p=>p.id===motorId));
 if(!Number.isFinite(seconds)||seconds<0||seconds>1||!Number.isFinite(rpm)||rpm<1||rpm>240||![-1,1].includes(direction))throw Error('Invalid motor playback settings.');
 const drive=motorDrive(model,motorId);if(!drive.ready)throw Error(drive.reason);
 const motor=model.parts.find(p=>p.id===motorId),spring=definition(motor).springMotor;let degrees=seconds*rpm*6*direction;if(definition(motor).wormMotor)degrees*=Math.sign(V(drive.axis).dot(V([0,0,1]).applyQuaternion(Q(motor.quat))));if(spring){if(direction!==1)throw Error('Wind the spring before releasing it; this motor has no reversing switch.');degrees=Math.min((motor.springTurns||0)*360,seconds*rpm*6)*Math.sign(V(drive.axis).dot(V([0,0,1]).applyQuaternion(Q(motor.quat))));}const train=rotateTransmission(model,drive.shaftId,degrees,{springPlayback:true});if(spring){motor.springTurns=Math.max(0,(motor.springTurns||0)-Math.abs(degrees)/360);if(motor.springTurns<1e-9)motor.springTurns=0;}return {...drive,train,degrees,exhausted:spring&&motor.springTurns<1e-9};
}
export function poweredWindmill(motorType='m-blue'){
 const m=emptyModel('Motor-powered windmill'),span=37.5*Math.SQRT2**3,height=20+2*span;
 const motor=part(motorType,[0,height,0]);m.parts.push(motor);
 // White connectors seat on the two gearbox faces, coaxial with the drive.
 const mounts=[-1,1].map(sign=>add(m,solve(m,'c-white',targets(m,'c-white','mount').find(t=>t.partId===motor.id&&t.key===(sign<0?'mount-back':'mount-front')),'mount')));
 const connect=(node,type,key,options={})=>add(m,solve(m,type,targets(m,type,'end').find(t=>t.partId===node.id&&t.key===key),'end',options));
 const feet=[];for(const top of mounts){const middle=[],bottom=[];
  for(const sign of[-1,1]){
   const diagonal=connect(top,'r-red',sign<0?'slot5':'slot7');
   const mid=connect(diagonal,'c-white','end1',{portIndex:sign<0?1:3});middle.push(mid);
   const upright=connect(mid,'r-yellow','slot6');bottom.push(connect(upright,'c-white','end1',{portIndex:2}));
  }
  connect(middle[0],'r-gray','slot0');connect(bottom[0],'r-gray','slot0');
  for(let i=0;i<bottom.length;i++){const node=bottom[i];if(!feet[i])feet[i]=add(m,solve(m,'r-red',targets(m,'r-red','side').find(t=>t.partId===node.id&&t.key==='slot6'),'side'));else{const foot=feet[i],offset=V(node.pos).sub(V(foot.pos)).dot(V([1,0,0]).applyQuaternion(Q(foot.quat)));m.links.push({a:node.id,ap:'slot6',b:foot.id,bp:'shaft',mode:'side',offset});}}
 }
 const axle=add(m,solve(m,'r-gray',targets(m,'r-gray','through').find(t=>t.partId===motor.id),'through'));
 for(const mount of mounts)m.links.push({a:axle.id,ap:'shaft',b:mount.id,bp:'hole',mode:'through',offset:mount.pos[2]});
 const clip=add(m,solve(m,'k-tan',targets(m,'k-tan','through').find(t=>t.partId===axle.id),'through',{offset:61.65}));
 const hub=add(m,solve(m,'c-white',targets(m,'c-white','keyed').find(t=>t.partId===clip.id),'keyed'));
 // The center hole supports the hub on the same shaft; the tan key transfers rotation.
 m.links.push({a:axle.id,ap:'shaft',b:hub.id,bp:'hole',mode:'through',offset:68});
 for(let i=0;i<8;i++)add(m,solve(m,'r-red',targets(m,'r-red','end').find(t=>t.partId===hub.id&&t.key==='slot'+i),'end'));
 add(m,solve(m,'s-blue',targets(m,'s-blue','through').find(t=>t.partId===axle.id),'through',{offset:73,roll:0}));
 return m;
}

export function motorReferenceModels(){const m=emptyModel('Enclosed motors: 92840 and 22722');for(const [type,z] of [['m-blue',-50],['m-green',55]]){const motor=part(type,[30,22,z]);m.parts.push(motor);add(m,solve(m,'r-yellow',targets(m,'r-yellow','through').find(t=>t.partId===motor.id),'through'));}return m;}

export function twoSpeedWindmill(){const m=poweredWindmill('m-two-speed');m.name='Two-speed windmill · 92401';return m;}

export function windSpring(model,motorId,turns=1){const motor=model.parts.find(p=>p.id===motorId);if(!motor||!definition(motor).springMotor||!Number.isFinite(turns)||turns<=0)throw Error('Choose a spring motor and a positive winding amount.');const drive=motorDrive(model,motorId);if(!drive.ready)throw Error(drive.reason);const amount=Math.min(turns,SPRING_PREVIEW_LIMIT-(motor.springTurns||0)),sign=Math.sign(V(drive.axis).dot(V([0,0,1]).applyQuaternion(Q(motor.quat))));rotateTransmission(model,drive.shaftId,-amount*360*sign,{springPlayback:true});motor.springTurns=(motor.springTurns||0)+amount;return amount;}
