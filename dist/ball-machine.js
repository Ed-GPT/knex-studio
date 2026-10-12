import {part,emptyModel,add,solve,targets,V,Q,SOCKET,BY_ID,ports} from './engine.js';
import {rigidComponent} from './motion.js';
import {buildPath} from './path-builder.js';
import {buildFrame} from './frame-builder.js';
import {fitBetween} from './inbetween.js';
import {makeLayer,makeGroup} from './editor-state.js';
export function liftMechanism(){
 const m=emptyModel('Motorized tipping lift'),bearing=part('c-white',[0,220,-65]);bearing.grounded=true;m.parts.push(bearing);
 const attach=(type,host,mode,options={},key)=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id&&(!key||t.key===key)),mode,options));
 const shaft=attach('r-gray',bearing,'through',{offset:-65}),tips=[];
 for(const z of [-18.75,18.75]){
  const key=attach('k-tan',shaft,'through',{offset:z-6.35,roll:0}),hub=attach('c-white',key,'keyed');
  const rail=attach('r-gray',hub,'end',{},'slot0');
  const tip=attach('c-blue',rail,'end',{portIndex:3},'end1');tips.push(tip);
 }
 const ends=tips.map((tip,i)=>attach('c-purple',tip,'interlock',{roll:i?90:0}));attach('r-green',ends[0],'end',{},'slot2');
 const rotor=rigidComponent(m,shaft.id),q=Q().setFromAxisAngle(V([0,0,1]),0),origin=V([0,220,0]);for(const p of m.parts)if(rotor.has(p.id)){p.pos=V(p.pos).sub(origin).applyQuaternion(q).add(origin).toArray();p.quat=q.clone().multiply(Q(p.quat)).toArray();}
 // A stock-part four-bar: blue crank, gray connecting rod and yellow rocker.
 // Only the crank is motor-driven. The output reverses through its linkage.
 const z=-140,length=type=>BY_ID[type].length+2*SOCKET;
 const rockerKey=attach('k-tan',shaft,'through',{offset:-86.35,roll:60}),rockerHub=attach('c-white',rockerKey,'keyed');
 const rockerRod=attach('r-yellow',rockerHub,'end',{},'slot0'),rockerTip=attach('c-gray',rockerRod,'end',{},'end1');
 const B=V(rockerTip.pos),O=V([-210,220,z]),r=length('r-blue'),l=length('r-gray'),delta=B.clone().sub(O);delta.z=0;const d=delta.length(),u=delta.clone().normalize(),along=(r*r-l*l+d*d)/(2*d),h=Math.sqrt(r*r-along*along);
 const A=O.clone().addScaledVector(u,along).addScaledVector(V([-u.y,u.x,0]),-h),angle=Math.atan2(A.y-O.y,A.x-O.x)*180/Math.PI;
 const motor=part('m-blue',[-210,220,z-45]);motor.grounded=true;m.parts.push(motor);
 const drive=attach('r-gray',motor,'through',{offset:-45}),crankKey=attach('k-tan',drive,'through',{offset:-6.35,roll:angle}),crankHub=attach('c-white',crankKey,'keyed'),crankRod=attach('r-blue',crankHub,'end',{},'slot0'),crankTip=attach('c-gray',crankRod,'end',{},'end1');
 // Parallel planes leave room for the actual connector and tan-key stack.
 const ca=V(crankTip.pos),cb=V(rockerTip.pos);ca.z=-110;cb.z=-110;const dir=cb.clone().sub(ca).normalize(),orient=Q().setFromUnitVectors(V([1,0,0]),dir);
 const linkA=part('c-gray',ca.toArray(),orient.toArray()),linkB=part('c-gray',cb.toArray(),Q().setFromAxisAngle(V([0,0,1]),Math.PI).multiply(orient).toArray());m.parts.push(linkA,linkB);attach('r-gray',linkA,'end',{},'slot0');
 const pivot=(host,loose)=>{const pin=attach('r-blue',host,'through',{offset:(host.pos[2]-loose.pos[2])/2});attach('k-tan',host,'keyed');const axis=V([1,0,0]).applyQuaternion(Q(pin.quat)),offset=V(loose.pos).sub(V(pin.pos)).dot(axis);m.links.push({a:pin.id,ap:'shaft',b:loose.id,bp:'hole',mode:'through',offset});for(const end of ['end0','end1'])attach('k-cap',pin,'end',{},end);};
 pivot(crankTip,linkA);pivot(rockerTip,linkB);
 makeLayer(m,[motor.id,bearing.id],'Locked motor and output bearing');makeGroup(m,[...rigidComponent(m,shaft.id)],'Tipping lift and rocker');makeGroup(m,[...rigidComponent(m,drive.id)],'Continuous crank');makeGroup(m,[...rigidComponent(m,linkA.id)],'Connecting rod');
 m.physics={gravity:9.81,rigid:false,balls:[{pos:[120,245,0]}],motors:[{id:motor.id,rpm:10,direction:-1,sweep:0,torque:.12}],bounce:0,friction:.24,contacts:true};return m;
}

export function ballMachine(){const m=liftMechanism();for(const p of m.parts)p.pos[1]+=200;m.physics.balls[0].pos[1]+=200;m.name='Motor lift & ball run';
const path=buildPath({kind:'track',trackType:'track-orange',crossRod:'r-blue',entryRod:'r-white',bank:-15,bankEnds:true,spacing:120,points:[[60,450,0],[-150,420,0],[-420,390,0],[-620,370,170],[-420,340,400],[0,300,500],[350,270,400],[550,240,220],[550,220,0],[400,200,-150],[210,185,-150]]}).model;
// Leave the receiving tube tips overhanging their next cross-tie so the lift
 // can pass underneath. These rails are locked fixtures, not unsupported beams.
const intakeIds=new Set(path.parts.filter(p=>['c-track-orange','r-blue'].includes(p.type)&&p.pos[0]>-100&&p.pos[0]<120&&p.pos[1]>200&&Math.abs(p.pos[2])<45).map(p=>p.id));path.parts=path.parts.filter(p=>!intakeIds.has(p.id));path.links=path.links.filter(l=>!intakeIds.has(l.a)&&!intakeIds.has(l.b));
for(const p of path.parts)p.grounded=true;m.parts.push(...path.parts);m.links.push(...path.links);makeLayer(m,path.parts.map(p=>p.id),'Locked return rails');
 // Separate locked run-out fixture: the ball transfers from tubing to real
 // 190 mm flexi rods across a small gap. There is no invented tubing/flexi joint.
 const flexIds=[];
 for(const z of [-19.4,19.4]){
  const start=V([195,158,z-150]),end=V([17,95,z-150]),axis=end.clone().sub(start).normalize();
  const a=part('c-gray',start.clone().addScaledVector(axis,-SOCKET).toArray(),Q().setFromUnitVectors(V([1,0,0]),axis).toArray());
  const b=part('c-gray',end.clone().addScaledVector(axis,SOCKET).toArray(),Q().setFromUnitVectors(V([1,0,0]),axis.clone().negate()).multiply(Q().setFromAxisAngle(V([1,0,0]),Math.PI/2)).toArray());
  m.parts.push(a,b);const fitted=fitBetween(m,{a:a.id,ap:'slot0',b:b.id,bp:'slot0',type:'f-green190',bow:180});m.parts=fitted.model.parts.filter(p=>p.id!==b.id);m.links=fitted.model.links.filter(l=>l.a!==b.id&&l.b!==b.id);flexIds.push(a.id,fitted.part.id);
 }
 for(const p of m.parts)if(flexIds.includes(p.id))p.grounded=true;makeLayer(m,flexIds,'Locked flexi run-out');
 const catchFrame=buildFrame({kind:'grid',plane:'xz',counts:[1,1,1],rod:'r-red',braced:false}).model,opening=catchFrame.parts.find(p=>p.type==='r-red'&&p.pos[0]>149);
 const keep=catchFrame.parts.filter(p=>p!==opening);for(const p of keep){p.pos=V(p.pos).add(V([-200,23,-225])).toArray();p.grounded=true;}m.parts.push(...keep);m.links.push(...catchFrame.links.filter(l=>l.a!==opening.id&&l.b!==opening.id));makeLayer(m,keep.map(p=>p.id),'Locked ball catcher');return m;}
