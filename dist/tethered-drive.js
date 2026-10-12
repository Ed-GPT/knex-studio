import {V,Q,definition,ports} from './engine.js';
import {axleInfo} from './motion.js';
import {gearTransmission,rotateTransmission} from './gears.js';
import {groundingReason} from './grounding.js';
import {TETHERED_PREVIEW_RATIO} from './tethered-motor.js';
export function tetheredDrive(model,motor){
 const outputs=[];for(const key of ['hole','drive-end']){
  const link=model.links.find(l=>(l.a===motor.id&&l.ap===key||l.b===motor.id&&l.bp===key)&&(key==='hole'?l.mode==='through':l.mode==='end-bearing'));if(!link)continue;
  const shaft=model.parts.find(p=>p.id===(link.a===motor.id?link.b:link.a));if(!shaft||definition(shaft).group!=='rods')return{ready:false,reason:'The motor needs a rod in its drive opening.'};
  const port=ports(motor).find(p=>p.key===key),axis=V([1,0,0]).applyQuaternion(Q(shaft.quat)),delta=V(shaft.pos).sub(V(port.pos)),info=axleInfo(model,shaft.id);
  if(Math.abs(axis.dot(V(port.dir)))<.9999||delta.addScaledVector(axis,-delta.dot(axis)).length()>.35)return{ready:false,reason:'A drive rod is not aligned with the motor.'};
  if(key==='drive-end'){const end=ports(shaft).find(p=>p.key===(link.a===shaft.id?link.ap:link.bp));if(!end||V(end.pos).distanceTo(V(port.pos))>.35)return{ready:false,reason:'Seat the rod fully in the end drive socket.'};}
  if(!info.available||info.ids.has(motor.id))return{ready:false,reason:info.reason||'The rotor is locked to the housing.'};
  outputs.push({...info,key,shaftId:shaft.id,sign:Math.sign(axis.dot(V(port.dir)))*(key==='drive-end'?TETHERED_PREVIEW_RATIO:1)});
 }
 if(!outputs.length)return{ready:false,reason:'Insert a rod through the center drive or into the end socket.'};
 const ids=new Set(),seen=new Set();try{for(const o of outputs){o.train=gearTransmission(model,o.shaftId);for(const stage of o.train){const info=axleInfo(model,stage.id);if(!info.available)return{ready:false,reason:info.reason};const reason=groundingReason(model,stage.ids);if(reason)return{ready:false,reason};for(const id of stage.ids){if(seen.has(id))return{ready:false,reason:'Both motor outputs reach the same transmission. Disconnect one output before previewing.'};seen.add(id);ids.add(id);}}}}catch(e){return{ready:false,reason:e.message};}
 return{...outputs[0],ready:true,ids,outputs,motorId:motor.id,shaftId:outputs[0].shaftId};
}
export function stepTethered(model,motor,seconds,rpm,direction){const drive=tetheredDrive(model,motor);if(!drive.ready)throw Error(drive.reason);const next=structuredClone(model),degrees=seconds*rpm*6*direction,train=[];
 // Work on a candidate copy: a blocked secondary train cannot partially move
 // the first one. Preserve original part objects and user metadata on commit.
 for(const output of drive.outputs)train.push(...rotateTransmission(next,output.shaftId,degrees*output.sign,{springPlayback:true}));
 model.parts.forEach((p,i)=>{p.pos=[...next.parts[i].pos];p.quat=[...next.parts[i].quat];});model.links.forEach((l,i)=>{for(const key of ['offset','roll'])if(next.links[i][key]!==undefined)l[key]=next.links[i][key];});return{...drive,train,degrees};
}
