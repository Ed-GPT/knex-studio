import {V,Q,definition} from './engine.js';
import {WORM_GEAR_CENTER} from './worm-motor.js';
import {rigidComponent,axleInfo} from './motion.js';
import {gearTransmission} from './gears.js';
import {groundingReason} from './grounding.js';
export function wormMotorDrive(model,motor){
 const l=model.links.find(l=>l.mode==='worm'&&(l.a===motor.id||l.b===motor.id)),gear=l&&model.parts.find(p=>p.id===(l.a===motor.id?l.b:l.a));
 if(!gear||!definition(gear).wormWheel)return{ready:false,reason:'Engage the dedicated 90983 white gear with the motor worm.'};
 const axis=V([0,0,1]).applyQuaternion(Q(motor.quat)),expected=V(WORM_GEAR_CENTER).applyQuaternion(Q(motor.quat)).add(V(motor.pos));
 if(V(gear.pos).distanceTo(expected)>.35||Math.abs(axis.dot(V([0,0,1]).applyQuaternion(Q(gear.quat))))<.9999)return{ready:false,reason:'The white gear is out of the worm drive. Reconnect it.'};
 const ids=rigidComponent(model,gear.id),rod=model.parts.find(p=>ids.has(p.id)&&definition(p).group==='rods');
 if(!rod)return{ready:false,reason:'Key the white gear to a supported rod with a tan drive clip.'};
 const info=axleInfo(model,rod.id);if(!info.available)return{ready:false,reason:info.reason};if(!info.boundary.length)return{ready:false,reason:'Add separate bearings to support the white-gear axle.'};
 if(info.ids.has(motor.id))return{ready:false,reason:'The driven axle is locked to the motor housing.'};
 const ra=V(info.axis),gap=V(gear.pos).sub(V(rod.pos));if(Math.abs(ra.dot(axis))<.9999||gap.clone().addScaledVector(ra,-gap.dot(ra)).length()>.35)return{ready:false,reason:'Align the supported axle through the white gear.'};
 try{for(const stage of gearTransmission(model,rod.id)){const reason=groundingReason(model,stage.ids);if(reason)return{...info,ready:false,reason};}}catch(e){return{...info,ready:false,reason:e.message};}
 return{...info,ready:true,shaftId:rod.id,motorId:motor.id};
}
