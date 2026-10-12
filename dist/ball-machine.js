import {part,emptyModel,add,solve,targets,V,Q,SOCKET} from './engine.js';
import {rigidComponent} from './motion.js';
import {buildPath} from './path-builder.js';
import {buildFrame} from './frame-builder.js';
import {fitBetween} from './inbetween.js';
import {makeLayer,makeGroup} from './editor-state.js';
export function liftMechanism(){
 const m=emptyModel('Motorized tipping lift'),motor=part('m-blue',[0,220,-65]);motor.grounded=true;m.parts.push(motor);
 const attach=(type,host,mode,options={},key)=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id&&(!key||t.key===key)),mode,options));
 const shaft=attach('r-gray',motor,'through',{offset:-65}),tips=[];
 for(const z of [-18.75,18.75]){
  const key=attach('k-tan',shaft,'through',{offset:z-6.35,roll:0}),hub=attach('c-white',key,'keyed');
  const rail=attach('r-gray',hub,'end',{},'slot0');
  const tip=attach('c-blue',rail,'end',{portIndex:3},'end1');tips.push(tip);
 }
 const ends=tips.map((tip,i)=>attach('c-purple',tip,'interlock',{roll:i?90:0}));attach('r-green',ends[0],'end',{},'slot2');
 const rotor=rigidComponent(m,shaft.id),q=Q().setFromAxisAngle(V([0,0,1]),-Math.PI/6),origin=V([0,220,0]);for(const p of m.parts)if(rotor.has(p.id)){p.pos=V(p.pos).sub(origin).applyQuaternion(q).add(origin).toArray();p.quat=q.clone().multiply(Q(p.quat)).toArray();}
 makeLayer(m,[motor.id],'Locked motor housing');makeGroup(m,[...rotor],'Tipping lift');m.physics={gravity:9.81,rigid:false,balls:[{pos:[163,145,0]}],motors:[{id:motor.id,rpm:3,direction:1,sweep:75,torque:.12}],bounce:0,friction:.24,contacts:true};return m;
}

export function ballMachine(){const m=liftMechanism();m.name='Motor lift & ball run';
const path=buildPath({kind:'track',trackType:'track-orange',crossRod:'r-blue',entryRod:'r-white',bank:-15,bankEnds:true,spacing:120,points:[[100,250,0],[-150,248,0],[-420,244,0],[-620,238,170],[-420,230,400],[0,214,500],[350,195,400],[550,180,220],[550,166,0],[400,151,-150],[210,140,-150]]}).model;
// Leave the receiving tube tips overhanging their next cross-tie so the lift
 // can pass underneath. These rails are locked fixtures, not unsupported beams.
const intakeIds=new Set(path.parts.filter(p=>['c-track-orange','r-blue'].includes(p.type)&&p.pos[0]>-100&&p.pos[0]<120&&p.pos[1]>200&&Math.abs(p.pos[2])<45).map(p=>p.id));path.parts=path.parts.filter(p=>!intakeIds.has(p.id));path.links=path.links.filter(l=>!intakeIds.has(l.a)&&!intakeIds.has(l.b));
for(const p of path.parts)p.grounded=true;m.parts.push(...path.parts);m.links.push(...path.links);makeLayer(m,path.parts.map(p=>p.id),'Locked return rails');
 // Separate locked run-out fixture: the ball transfers from tubing to real
 // 190 mm flexi rods across a small gap. There is no invented tubing/flexi joint.
 const flexIds=[];
 for(const z of [-19.4,19.4]){
  const start=V([195,113,z-150]),end=V([17,67,z-150]),axis=end.clone().sub(start).normalize();
  const a=part('c-gray',start.clone().addScaledVector(axis,-SOCKET).toArray(),Q().setFromUnitVectors(V([1,0,0]),axis).toArray());
  const b=part('c-gray',end.clone().addScaledVector(axis,SOCKET).toArray(),Q().setFromUnitVectors(V([1,0,0]),axis.clone().negate()).toArray());
  m.parts.push(a,b);const fitted=fitBetween(m,{a:a.id,ap:'slot0',b:b.id,bp:'slot0',type:'f-green190',bow:180});m.parts=fitted.model.parts;m.links=fitted.model.links;flexIds.push(a.id,b.id,fitted.part.id);
 }
 for(const p of m.parts)if(flexIds.includes(p.id))p.grounded=true;makeLayer(m,flexIds,'Locked flexi run-out');
 const catchFrame=buildFrame({kind:'grid',plane:'xz',counts:[1,1,1],rod:'r-red',braced:false}).model,opening=catchFrame.parts.find(p=>p.type==='r-red'&&p.pos[0]>149);
 const keep=catchFrame.parts.filter(p=>p!==opening);for(const p of keep){p.pos=V(p.pos).add(V([-200,23,-225])).toArray();p.grounded=true;}m.parts.push(...keep);m.links.push(...catchFrame.links.filter(l=>l.a!==opening.id&&l.b!==opening.id));makeLayer(m,keep.map(p=>p.id),'Locked ball catcher');return m;}
