import {assertUngrounded} from './grounding.js';
import {V,Q,part,definition,component,ports,autoLinks,exportModel,parseModel} from './engine.js';
import {manualVehicle} from './wheel-models.js';
import {rigidComponent,axleInfo,moveOnAxle} from './motion.js';
import {motorDrive,stepMotor} from './motor.js';
export function roverModel(){
 const a=manualVehicle(),b=manualVehicle();for(const p of a.parts)p.pos[2]-=75;for(const p of b.parts)p.pos[2]+=75;
 const m={name:'Twin-motor rover',parts:[...a.parts,...b.parts],links:[...a.links,...b.links]};
 // Two manual chassis share a rigid rear axle via the orange straight connector.
 for(const half of[a,b]){const rear=half.parts.find(p=>p.type==='r-red'&&Math.abs(p.pos[0]+164.5)<.01),key=half===a?'end1':'end0',capLink=m.links.find(l=>l.mode==='end'&&(l.a===rear.id&&l.ap===key||l.b===rear.id&&l.bp===key)),cap=capLink&&(capLink.a===rear.id?capLink.b:capLink.a);if(cap){m.parts=m.parts.filter(p=>p.id!==cap);m.links=m.links.filter(l=>l.a!==cap&&l.b!==cap);}}
 const bridge=part('c-orange',[-164.5,23.5,0],Q().setFromUnitVectors(V([1,0,0]),V([0,0,1])).toArray());m.parts.push(bridge);m.links.push(...autoLinks(m,bridge));
 m.controller=m.parts.filter(p=>definition(p).motor).map((p,i)=>({motorId:p.id,channel:i?'right':'left',forward:i?'KeyE':'KeyQ',reverse:i?'KeyD':'KeyA',invert:false}));return m;
}
export function defaultBindings(model){return model.parts.filter(p=>definition(p).motor).map((p,i)=>({motorId:p.id,channel:i===0?'left':i===1?'right':'aux',forward:i?'KeyE':'KeyQ',reverse:i?'KeyD':'KeyA',invert:false}));}
export function motorCommands(bindings,keys,{throttle=0,steer=0,gamepad=null}={}){
 const forward=Math.max(-1,Math.min(1,throttle+(keys.has('ArrowUp')?1:0)-(keys.has('ArrowDown')?1:0)+(gamepad?.throttle||0))),turn=Math.max(-1,Math.min(1,steer+(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0)+(gamepad?.steer||0)));
 return new Map(bindings.map(b=>{const direct=(keys.has(b.forward)?1:0)-(keys.has(b.reverse)?1:0),mix=b.channel==='left'?forward+turn:b.channel==='right'?forward-turn:b.channel==='all'?forward:0;return[b.motorId,Math.max(-1,Math.min(1,direct+mix))*(b.invert?-1:1)];}));
}
export const COURSES={
 circuit:{name:'Circuit',start:[-900,-700],yaw:0,obstacles:[{x:0,z:0,w:1350,h:900}],checkpoints:[[-900,-700],[950,-600],[900,700],[-950,600]]},
 slalom:{name:'Slalom playground',start:[-1050,0],yaw:0,obstacles:[{x:-500,z:-260,w:90,h:400},{x:0,z:260,w:90,h:400},{x:500,z:-260,w:90,h:400}],checkpoints:[[1000,0],[-1050,0]]}
};
export function createDrive(source,course='circuit'){
 if(!COURSES[course])throw Error('Unknown environment.');const model=parseModel(exportModel(source)),motors=model.parts.filter(p=>definition(p).motor);if(!motors.length)throw Error('Add a motor, or load the Twin-motor rover example.');
 const channels=[];for(const motor of motors){const drive=motorDrive(model,motor.id);if(!drive.ready)continue;const tyres=model.parts.filter(p=>drive.ids.has(p.id)&&definition(p).tire);if(!tyres.length)continue;const axis=V(drive.axis);if(Math.abs(axis.z)<.99)throw Error('Driving currently needs horizontal wheel axles along Z. Rotate the build before testing.');channels.push({motorId:motor.id,radius:tyres.reduce((s,p)=>s+definition(p).diameter/2,0)/tyres.length,z:tyres.reduce((s,p)=>s+p.pos[2],0)/tyres.length,sign:Math.sign(axis.z),ids:drive.ids});}
 if(!channels.length)throw Error('No driven tyres found. Key a wheel to a motor axle with a tan clip.');
 const ids=component(model,motors[0].id);assertUngrounded(model,ids);if(channels.some(c=>!ids.has(c.motorId)))throw Error('Connect all drive motors to one chassis before testing.');
 const tyres=model.parts.filter(p=>ids.has(p.id)&&definition(p).tire),minX=Math.min(...tyres.map(p=>p.pos[0]-definition(p).diameter/2)),maxX=Math.max(...tyres.map(p=>p.pos[0]+definition(p).diameter/2)),minZ=Math.min(...tyres.map(p=>p.pos[2]-definition(p).thickness/2)),maxZ=Math.max(...tyres.map(p=>p.pos[2]+definition(p).thickness/2));
 const center=[(minX+maxX)/2,0,(minZ+maxZ)/2],wheelRadius=Math.hypot((maxX-minX)/2,(maxZ-minZ)/2),groundY=Math.min(...tyres.map(p=>p.pos[1]-definition(p).diameter/2));
 let radius=wheelRadius;for(const p of model.parts.filter(p=>ids.has(p.id))){const d=definition(p),points=d.group==='rods'?ports(p).map(p=>V(p.pos)):[V(p.pos)];const r=d.group==='rods'?3:d.motor?50:d.diameter?d.diameter/2:d.chain?29:20;for(const v of points)radius=Math.max(radius,Math.hypot(v.x-center[0],v.z-center[2])+r);}
 if(radius>450)throw Error('This vehicle is too large for the test course. Use a build under 900 mm across.');
 const cfg=COURSES[course];return {model,channels,center,groundY,radius,course,x:cfg.start[0],z:cfg.start[1],yaw:cfg.yaw,v:0,w:0,distance:0,laps:0,next:1,elapsed:0,blocked:false,accumulator:0,ids};
}
function hitCourse(s,x,z){const r=s.radius;if(Math.abs(x)+r>1500||Math.abs(z)+r>1100)return true;return COURSES[s.course].obstacles.some(o=>Math.hypot(x-Math.max(o.x-o.w/2,Math.min(o.x+o.w/2,x)),z-Math.max(o.z-o.h/2,Math.min(o.z+o.h/2,z)))<r);}
export function stepDrive(s,dt,commands,{rpm=80,brake=false}={}){
 if(!Number.isFinite(dt)||dt<0||dt>.25||!Number.isFinite(rpm)||rpm<1||rpm>120)throw Error('Invalid driving step.');s.accumulator+=dt;const h=1/120;
 while(s.accumulator>=h){s.accumulator-=h;s.elapsed+=h;const rates=s.channels.map(c=>({...c,velocity:(brake?0:commands.get(c.motorId)||0)*Math.PI*2*rpm/60*c.radius})),mean=rates.reduce((a,c)=>a+c.z,0)/rates.length,left=rates.filter(c=>c.z<mean-.1),right=rates.filter(c=>c.z>mean+.1),avg=a=>a.reduce((sum,c)=>sum+c.velocity,0)/Math.max(1,a.length);let targetV=avg(rates),targetW=0;
 if(left.length&&right.length){const track=right.reduce((a,c)=>a+c.z,0)/right.length-left.reduce((a,c)=>a+c.z,0)/left.length;targetV=(avg(left)+avg(right))/2;targetW=(avg(left)-avg(right))/track;}
 const response=1-Math.exp(-(brake?18:5)*h);s.v+=(targetV-s.v)*response;s.w+=(targetW-s.w)*response;const yaw=s.yaw+s.w*h,x=s.x+Math.cos(yaw)*s.v*h,z=s.z-Math.sin(yaw)*s.v*h;s.blocked=hitCourse(s,x,z);if(s.blocked){s.v=0;s.w*=.8;}else{s.distance+=Math.hypot(x-s.x,z-s.z);s.x=x;s.z=z;s.yaw=yaw;}
 const cp=COURSES[s.course].checkpoints[s.next];if(Math.hypot(s.x-cp[0],s.z-cp[1])<240){s.next=(s.next+1)%COURSES[s.course].checkpoints.length;if(s.next===1)s.laps++;}
 }
 for(const c of s.channels){const value=brake?0:commands.get(c.motorId)||0;if(Math.abs(value)>.001&&dt)stepMotor(s.model,c.motorId,dt,{rpm:Math.max(1,rpm*Math.abs(value)),direction:-Math.sign(value)*c.sign});}
 const driven=new Set(s.channels.flatMap(c=>[...c.ids])),done=new Set();for(const p of s.model.parts.filter(p=>s.ids.has(p.id)&&definition(p).tire&&!driven.has(p.id))){if(done.has(p.id))continue;const info=axleInfo(s.model,p.id);if(!info.available||info.ids.size>4)continue;for(const id of info.ids)done.add(id);const speed=s.v+s.w*(p.pos[2]-s.center[2]);moveOnAxle(s.model,p.id,{degrees:-speed*dt/(definition(p).diameter/2)*180/Math.PI*Math.sign(info.axis[2])});}
 for(const [id,value]of commands){if(brake||s.channels.some(c=>c.motorId===id)||Math.abs(value)<.001)continue;stepMotor(s.model,id,dt,{rpm:Math.max(1,rpm*Math.abs(value)),direction:Math.sign(value)});}
 return s;
}
