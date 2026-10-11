import {CLASSIC_CLIPS,CLASSIC_Y_CLIPS,yClipPorts,hingeCompatible,hingePort} from './classic-clips.js';
import {CLASSIC_WHEELS,tyreSeats,tyreSeatBusy,bearingPoint} from './classic-wheels.js';
import {FLEXIBLE_PARTS,defaultPath,validatePath,copyPath} from './flexible-parts.js';
import {PART_SPECS} from './part-specs.js';
import {copyMass} from './mass.js';
import {assertUngrounded} from './grounding.js';
import {sanitizeEditor} from './editor-state.js';
import {Vector3,Quaternion,Euler} from './vendor/three.module.js';
export const V=(a=[0,0,0])=>new Vector3(...a);
export const Q=(a=[0,0,0,1])=>new Quaternion(...a);
export const DEG=Math.PI/180;
export const SOCKET=10.1;
// Patent US7666054B2: D=10.1 mm, shortest centre spacing 37.5 mm.
// Exact sqrt(2) progression avoids accumulated rounding in closed frames.
export const CATALOG=[
 ...CLASSIC_CLIPS,...CLASSIC_Y_CLIPS,
 ...FLEXIBLE_PARTS,
 ...CLASSIC_WHEELS,
 ...[['blue14','Blue gear · 14 teeth','91317',14,25,'#2574c7',false,false],['gray14','Push-on gear · 14 teeth','90988',14,25,'#a0a7ae',true,false],['red34','Red spur gear · 34 teeth','90985',34,55,'#d73539',false,false],['yellow34','Yellow crown gear · 34 teeth','90993',34,55,'#f4c52d',false,true],['yellow82','Large crown gear · 82 teeth','91998',82,130,'#ebc32e',false,true]].map(([id,name,partNumber,teeth,diameter,color,axleGrip,crown])=>({id:'g-'+id,name,partNumber,teeth,diameter,color,axleGrip,crown,pitchRadius:teeth*1.5625/2,gear:true,group:'gears',thickness:6.3,slots:[],reference:'https://shop.knexusergroup.org.uk/products/'+partNumber})),
 {id:'chain-large',name:'Large chain link',partNumber:'90987',chain:true,pitch:26,group:'gears',color:'#272b30',thickness:9,slots:[],reference:'https://shop.knexusergroup.org.uk/products/90987'},
 {id:'m-battery',name:'Legacy placeholder motor',legacy:true,group:'motors',color:'#286dc5',motor:true,thickness:32,slots:[]},
 ...[['blue','Blue','92840','#233771'],['green','Green','22722','#15974a']].map(([id,name,partNumber,color])=>({id:'m-'+id,name:`${name} battery motor`,partNumber,reference:`https://shop.knexusergroup.org.uk/products/${partNumber}`,geometryStatus:'Photo reconstruction; dimensions unverified',group:'motors',color,motor:true,thickness:32,slots:[]})),
 ...[['small','Small hub / pulley','90978',37,6.2],['medium','Medium hub / pulley','90979',50,12]].map(([id,name,partNumber,diameter,thickness])=>({id:'h-'+id,name,partNumber,diameter,thickness,reference:`https://shop.knexusergroup.org.uk/products/${partNumber}`,group:'wheels',color:'#9ca4a6',wheelHub:true,slots:[]})),
 ...[['small','Small tyre','91975',47,37,8.2,['h-small','c-white','h-spoked37-silver','h-spoked37-black']],['medium','Medium tyre','91976',65,50,13,['h-medium']],['large','Large tyre','91977',90,50,19,['h-medium']]].map(([id,name,partNumber,diameter,fitDiameter,thickness,fits])=>({id:'t-'+id,name,partNumber,diameter,fitDiameter,thickness,fits,reference:`https://shop.knexusergroup.org.uk/products/${partNumber==='91976'?'90976':partNumber}`,group:'wheels',color:'#242629',tire:true,slots:[]})),
 {id:'k-cap',name:'Black snap cap',partNumber:'848900',reference:'https://shop.knexusergroup.org.uk/products/848900',group:'extras',color:'#202226',endCap:true,thickness:6,slots:[]},
 {id:'k-tan',name:'Tan drive clip',group:'extras',color:'#c8ac7e',driveClip:true,thickness:6.4,slots:[]},
 ...[['green','Green',16,'#17915e'],['white','White',32,'#eeeae0'],['blue','Blue',54,'#246bd5'],['yellow','Yellow',86,'#f3c423'],['red','Red',128,'#de403b'],['gray','Gray',190,'#9fa8ad']].map(([id,name,nominal,color],i)=>({id:'r-'+id,name:`${name} rod`,group:'rods',color,nominal,length:37.5*Math.SQRT2**i-2*SOCKET,slots:[]})),
 ...[
 ['c-gray','Gray · 1-way','#9ca4ac',[0]],
 ['c-orange','Orange · straight','#f58325',[0,180]],
 ['c-lgray','Light gray · 2-way','#b9c1c7',[0,45]],
 ['c-red','Red · 3-way','#da3937',[0,45,90]],
 ['c-green','Green · 4-way','#25824a',[0,45,90,135]],
 ['c-yellow','Yellow · 5-way','#f6c724',[0,45,90,135,180]],
 ['c-white','White · 8-way','#edece4',[0,45,90,135,180,225,270,315]],
 ['c-blue','Blue · 3D','#2764c9',[-135,-90,-45,0,45,90,135],true],
 ['c-purple','Purple · 3D','#8050aa',[0,45,90,135],true],
 ].map(([id,name,color,slots,interlock=false],i)=>({id,name,group:'connectors',color,slots,interlock,partNumber:['90901','90902','90903','90904','90905','90906','90908','90907','90909'][i],reference:'https://shop.knexusergroup.org.uk/products/'+['90901','90902','90903','90904','90905','90906','90908','90907','90909'][i]})),
 {id:'s-blue',name:'Blue spacer ring',group:'extras',color:'#438ddd',thickness:3.1,partNumber:'90994',slots:[]},
 {id:'s-silver',name:'Gray spacer sleeve',group:'extras',color:'#aeb6c1',thickness:9.3,partNumber:'91224',reference:'https://shop.knexusergroup.org.uk/products/91224',slots:[]},
];
for(const d of CATALOG){const spec=PART_SPECS[d.id];if(spec){d.partNumber??=spec.partNumber;d.reference??=spec.source;}}
export const BY_ID=Object.fromEntries(CATALOG.map(p=>[p.id,p]));
let serial=0;
export function part(type,pos=[0,20,0],quat=[0,0,0,1]){if(!Object.hasOwn(BY_ID,type))throw Error('Unknown part');return{id:`p${Date.now().toString(36)}-${++serial}`,type,pos:[...pos],quat:[...quat]};}
export const definition=p=>BY_ID[p.type];
export function localPorts(p){const d=definition(p);if(d.yClip)return yClipPorts();if(d.hingeHalf)return [{key:'slot0',kind:'slot',pos:[SOCKET,0,0],dir:[1,0,0]},hingePort(d)];if(d.endBearing)return [{key:'bearing',kind:'bearing',pos:bearingPoint(d),dir:[0,0,-1]}];if(d.flexi){const points=p.path||defaultPath(d);return[0,1].map(i=>({key:`end${i}`,kind:"end",pos:points[i?points.length-1:0],dir:V(points[i?points.length-1:0]).sub(V(points[i?points.length-2:1])).normalize().toArray()}));}if(d.tubing)return [];if(d.chain)return [{key:'socket',kind:'chain',pos:[0,0,0],dir:[-1,0,0]},{key:'pin',kind:'chain',pos:[d.pitch,0,0],dir:[1,0,0]}];if(d.endCap)return [{key:'slot0',kind:'slot',pos:[0,0,0],dir:[0,0,-1]}];if(d.motor&&!d.legacy)return [];if(d.motor)return[-1,1].map((s,i)=>({key:`end${i}`,kind:'end',pos:[s*(37.5*Math.SQRT2**3/2-SOCKET),0,0],dir:[s,0,0]}));if(d.group==='rods')return[-1,1].map((s,i)=>({key:`end${i}`,kind:'end',pos:[s*d.length/2,0,0],dir:[s,0,0]}));return d.slots.map((deg,i)=>{let a=deg*DEG;return{key:`slot${i}`,kind:'slot',pos:[SOCKET*Math.cos(a),SOCKET*Math.sin(a),0],dir:[Math.cos(a),Math.sin(a),0]};});}
export function worldPort(p,port){return{...port,partId:p.id,pos:V(port.pos).applyQuaternion(Q(p.quat)).add(V(p.pos)).toArray(),dir:V(port.dir).applyQuaternion(Q(p.quat)).toArray()};}
export const ports=p=>localPorts(p).map(x=>worldPort(p,x));
export function busy(model,id,key){if(/^tire[01]?$/.test(key))return tyreSeatBusy(model,id,key);return model.links.some(l=>(l.a===id&&l.ap===key)||(l.b===id&&l.bp===key));}
export const limits=p=>Math.max(0,definition(p).length/2-8);
export const keyCompatible=d=>d.wheelHub&&d.keyable!==false||d.gear&&!d.axleGrip||d.group==='connectors'&&!d.interlock&&!d.noBore;
export const keyZ=d=>d.driveClip?3.2:d.keyDepth!==undefined?d.keyDepth:-(d.thickness||6.3)/2;
export const tireCompatible=(a,b)=>a.tire&&a.fits.includes(b.id)||b.tire&&b.fits.includes(a.id);
export function targets(model,type,mode){const d=BY_ID[type];let list=[];for(const p of model.parts){const t=definition(p);if((d.flexi||t.flexi)&&mode!=='end'||d.tubing||t.tubing)continue;if(mode==='mesh'&&d.gear&&t.gear){list.push(worldPort(p,{key:'teeth',kind:'mesh',pos:[t.pitchRadius+d.pitchRadius,0,0],dir:[0,0,1]}));
 }else if(mode==='chain'&&d.chain&&t.chain&&d.id===t.id){list.push(...ports(p).filter(x=>x.key==='pin'&&!busy(model,p.id,x.key)));
 }else if(mode==='hinge'&&hingeCompatible(d,t)&&!busy(model,p.id,'pivot')){list.push(worldPort(p,hingePort(t)));
 }else if(mode==='end'){
 if(d.endBearing&&t.group==='rods'||t.endBearing&&d.group==='rods')list.push(...ports(p).filter(x=>!busy(model,p.id,x.key)));
 const candidate=localPorts({type});list.push(...ports(p).filter(x=>!busy(model,p.id,x.key)&&candidate.some(a=>a.kind==='end'&&x.kind==='slot'||a.kind==='slot'&&x.kind==='end')));
 }else if(mode==='keyed'){
 if((d.driveClip&&keyCompatible(t))||(t.driveClip&&keyCompatible(d))){if(!busy(model,p.id,'key'))list.push(worldPort(p,{key:'key',kind:'key',pos:[5,0,keyZ(t)],dir:[0,0,t.driveClip?1:-1]}));}
 }else if(mode==='tire'){
 if(tireCompatible(d,t)){const tyre=d.tire?d:t,hub=d.tire?t:d;for(const seat of tyreSeats(tyre,hub)){const key=t.tire?seat.key:'tire';if(!tyreSeatBusy(model,p.id,key))list.push({...worldPort(p,{key,kind:'tire',pos:[0,0,t.tire?seat.z:-seat.z],dir:[0,0,1]}),tyreSeat:seat.key});}}
 }else if(mode==='through'){
 if(d.group==='rods'&&t.group!=='rods'&&!t.tire&&!t.endCap&&!t.endBearing&&!t.chain&&(!t.motor||d.length>=t.thickness+7)&&!t.interlock&&!t.noBore&&!busy(model,p.id,'hole'))list.push(worldPort(p,{key:'hole',kind:'hole',pos:[0,0,0],dir:[0,0,1]}));
 if(d.group!=='rods'&&!d.tire&&!d.endCap&&!d.endBearing&&!d.chain&&!d.interlock&&!d.noBore&&t.group==='rods'&&(!d.motor||t.length>=d.thickness+7))list.push(worldPort(p,{key:'shaft',kind:'shaft',pos:[0,0,0],dir:[1,0,0]}));
 }else if(mode==='mount'){
 if(d.motor&&!d.legacy&&p.type==='c-white'&&!busy(model,p.id,'motor-mount'))list.push(worldPort(p,{key:'motor-mount',kind:'mount',pos:[0,0,0],dir:[0,0,1]}));
 if(type==='c-white'&&t.motor&&!t.legacy)for(const side of[-1,1]){const key=side<0?'mount-back':'mount-front';if(!busy(model,p.id,key))list.push(worldPort(p,{key,kind:'mount',pos:[0,0,side*18.75],dir:[0,0,side]}));}
 }else if(mode==='side'){
 if(d.group==='rods'&&d.id!=='r-green'&&(t.group==='connectors'||t.clipGeometry)&&!t.noSide)list.push(...ports(p).filter(x=>x.kind==='slot'||x.kind==='clip').filter(x=>!busy(model,p.id,x.key)).map(x=>({...x,kind:'side',pos:V(x.pos).addScaledVector(V(x.dir),4.4).toArray(),dir:V([0,0,1]).applyQuaternion(Q(p.quat)).toArray()})));
 if((d.group==='connectors'||d.clipGeometry)&&!d.noSide&&t.group==='rods'&&p.type!=='r-green')list.push(worldPort(p,{key:'shaft',kind:'shaft',pos:[0,0,0],dir:[1,0,0]}));
 }else if(mode==='interlock'&&d.interlock&&t.interlock&&!busy(model,p.id,'interlock'))list.push(worldPort(p,{key:'interlock',kind:'interlock',pos:[0,0,0],dir:[1,0,0]}));
 }return list;}
export function solve(model,type,target,mode,{roll=0,offset=0,portIndex=0,path}={}){
 const p=part(type);if(path){p.path=path.map(v=>[...v]);validatePath(p,definition(p));}const d=definition(p),host=model.parts.find(x=>x.id===target.partId);if(!host)throw Error('Connection point no longer exists');
 if(!targets(model,type,mode).some(t=>t.partId===target.partId&&t.key===target.key))throw Error('This connection point is occupied or incompatible');
 let q,origin=V(target.pos),ap,linkOffset=0;
 if(mode==='hinge'){const port=hingePort(d);q=Q(host.quat);q.premultiply(Q().setFromAxisAngle(V(target.dir),(180+roll)*DEG));origin.sub(V(port.pos).applyQuaternion(q));ap='pivot';
 }else if(mode==='mesh'){q=Q(host.quat).multiply(new Quaternion().setFromAxisAngle(V([0,0,1]),Math.PI/d.teeth));ap='teeth';
 }else if(mode==='chain'){q=Q(host.quat).multiply(new Quaternion().setFromAxisAngle(V([0,0,1]),roll*DEG));ap='socket';
 }else if(mode==='tire'){q=Q(host.quat);ap=d.tire?(target.tyreSeat||'tire'):'tire';
 }else if(mode==='mount'){
 q=Q(host.quat).multiply(new Quaternion().setFromAxisAngle(V([0,0,1]),Math.round(roll/45)*45*DEG));
 if(d.motor){ap=portIndex%2?'mount-back':'mount-front';origin.sub(V([0,0,ap==='mount-front'?18.75:-18.75]).applyQuaternion(q));}else ap='motor-mount';
 }else if(mode==='keyed'){
 q=Q(host.quat);ap='key';origin.sub(V([5,0,keyZ(d)]).applyQuaternion(q));
 }else if(mode==='mesh'&&d.gear&&t.gear){list.push(worldPort(p,{key:'teeth',kind:'mesh',pos:[t.pitchRadius+d.pitchRadius,0,0],dir:[0,0,1]}));
 }else if(mode==='chain'&&d.chain&&t.chain&&d.id===t.id){list.push(...ports(p).filter(x=>x.key==='pin'&&!busy(model,p.id,x.key)));
 }else if(mode==='end'){
 const candidates=localPorts(p).filter(x=>x.kind==='end'&&target.kind==='slot'||x.kind==='slot'&&target.kind==='end'||x.kind==='bearing'&&target.kind==='end'||x.kind==='end'&&target.kind==='bearing'),port=candidates[portIndex%candidates.length];if(!port)throw Error('These ends cannot connect.');ap=port.key;
 q=new Quaternion().setFromUnitVectors(V(port.dir),V(target.dir).negate());
 q.premultiply(new Quaternion().setFromAxisAngle(V(target.dir),roll*DEG));
 origin.sub(V(port.pos).applyQuaternion(q));
 }else if(mode==='through'||mode==='side'){
 const rod=d.group==='rods'?p:host;
 const cap=mode==='side'?limits(rod):Math.max(0,(definition(rod).length-((d.group==='rods'?definition(host):d).thickness||6.3))/2);
 linkOffset=Math.max(-cap,Math.min(cap,offset));
 if(d.group==='rods'){
 q=new Quaternion().setFromUnitVectors(V([1,0,0]),V(target.dir));ap='shaft';
 q.premultiply(new Quaternion().setFromAxisAngle(V(target.dir),roll*DEG));
 origin.addScaledVector(V(target.dir),-linkOffset);
 }else{
 q=new Quaternion().setFromUnitVectors(V([0,0,1]),V(target.dir));
 q.premultiply(new Quaternion().setFromAxisAngle(V(target.dir),roll*DEG));
 origin.addScaledVector(V(target.dir),linkOffset);ap=mode==='through'?'hole':`slot${portIndex%d.slots.length}`;
 if(mode==='side'){const a=d.slots[portIndex%d.slots.length]*DEG;const seat=d.yClip?10.1:14.5;origin.sub(V([seat*Math.cos(a),seat*Math.sin(a),0]).applyQuaternion(q));}
 }
 }else if(mode==='interlock'){
 // Orthogonal planes, common hub; gap faces the other connector's spine.
 q=Q(host.quat).multiply(new Quaternion().setFromEuler(new Euler(Math.PI/2,0,Math.PI)));
 if(roll%180!==0)q=Q(host.quat).multiply(new Quaternion().setFromEuler(new Euler(-Math.PI/2,0,Math.PI)));
 ap='interlock';
 }
 p.pos=origin.toArray();p.quat=q.toArray();
 return{part:p,link:{a:host.id,ap:target.key,b:p.id,bp:ap,mode:mode==='end'&&(d.endBearing||definition(host).endBearing)?'end-bearing':mode,offset:linkOffset,roll,portIndex,...(mode==='through'&&(d.driveClip||definition(host).driveClip||d.axleGrip||definition(host).axleGrip)?{locked:true}:{})}};
}
export function autoLinks(model,newPart){let out=[];for(const a of ports(newPart)){if(busy(model,newPart.id,a.key))continue;for(const p of model.parts){if(p.id===newPart.id)continue;for(const b of ports(p)){const bearing=(a.kind==='bearing'&&b.kind==='end'&&definition(p).group==='rods')||(b.kind==='bearing'&&a.kind==='end'&&definition(newPart).group==='rods');if(!bearing&&!((a.kind==='end'&&b.kind==='slot')||(b.kind==='end'&&a.kind==='slot'))||busy({...model,links:[...model.links,...out]},p.id,b.key)||out.some(l=>l.a===newPart.id&&l.ap===a.key))continue;if(V(a.pos).distanceTo(V(b.pos))<.35&&V(a.dir).dot(V(b.dir))<-.999){out.push({a:newPart.id,ap:a.key,b:p.id,bp:b.key,mode:bearing?'end-bearing':'end'});break;}}}}return out;}
export function add(model,proposal){model.parts.push(proposal.part);if(proposal.link)model.links.push(proposal.link);model.links.push(...autoLinks(model,proposal.part));return proposal.part;}
export function component(model,id){const ids=new Set([id]);let change=true;while(change){change=false;for(const l of model.links){if(ids.has(l.a)&&!ids.has(l.b)){ids.add(l.b);change=true;}if(ids.has(l.b)&&!ids.has(l.a)){ids.add(l.a);change=true;}}}return ids;}
export function moveAssembly(model,id,delta){const ids=component(model,id);assertUngrounded(model,ids);for(const p of model.parts)if(ids.has(p.id))p.pos=V(p.pos).add(V(delta)).toArray();}
export function rotateAssembly(model,id,axis,degrees){const ids=component(model,id),center=V(model.parts.find(p=>p.id===id).pos),q=new Quaternion().setFromAxisAngle(V(axis),degrees*DEG);assertUngrounded(model,ids);for(const p of model.parts)if(ids.has(p.id)){p.pos=V(p.pos).sub(center).applyQuaternion(q).add(center).toArray();p.quat=q.clone().multiply(Q(p.quat)).toArray();}}
export function removePart(model,id){model.parts=model.parts.filter(p=>p.id!==id);model.links=model.links.filter(l=>l.a!==id&&l.b!==id);}
export function duplicateAssembly(model,id){const ids=component(model,id),map=new Map(),parts=[];for(const p of model.parts)if(ids.has(p.id)){const n=part(p.type,V(p.pos).add(V([0,0,60])).toArray(),p.quat);copyMass(p,n);copyPath(p,n);map.set(p.id,n.id);parts.push(n);}model.links.push(...model.links.filter(l=>ids.has(l.a)&&ids.has(l.b)).map(l=>({...l,a:map.get(l.a),b:map.get(l.b)})));model.parts.push(...parts);return map.get(id);}
export function assemblyProposal(model,id,proposal){const source=model.parts.find(p=>p.id===id),ids=component(model,id),delta=Q(proposal.part.quat).multiply(Q(source.quat).invert());return model.parts.filter(p=>ids.has(p.id)).map(p=>({...p,pos:V(p.pos).sub(V(source.pos)).applyQuaternion(delta).add(V(proposal.part.pos)).toArray(),quat:delta.clone().multiply(Q(p.quat)).toArray()}));}
function segmentDistance(a,b,c,d){const u=b.clone().sub(a),v=d.clone().sub(c),w=a.clone().sub(c),A=u.dot(u),B=u.dot(v),C=v.dot(v),D=u.dot(w),E=v.dot(w),den=A*C-B*B;let s=den>1e-8?Math.max(0,Math.min(1,(B*E-C*D)/den)):0;let t=C?Math.max(0,Math.min(1,(B*s+E)/C)):0;s=A?Math.max(0,Math.min(1,(B*t-D)/A)):0;return a.clone().addScaledVector(u,s).distanceTo(c.clone().addScaledVector(v,t));}
export function collisions(model,proposal){const p=proposal.part,d=definition(p),issues=[];for(const other of model.parts){if(proposal.link&&(other.id===proposal.link.a))continue;const o=definition(other);if(d.tire||o.tire)continue;if(d.group==='rods'&&o.group==='rods'){const[a,b]=ports(p),[c,e]=ports(other);if(segmentDistance(V(a.pos),V(b.pos),V(c.pos),V(e.pos))<5.8)issues.push(other.id);}else if(d.group!=='rods'&&o.group!=='rods'&&V(p.pos).distanceTo(V(other.pos))<6.3)issues.push(other.id);}return issues;}
export function exportModel(model){return JSON.stringify({format:'knex-studio',version:1,...model},null,2);}
export function parseModel(text){const data=JSON.parse(text);if(data.format!=='knex-studio'||data.version!==1||!Array.isArray(data.parts)||!Array.isArray(data.links)||data.parts.length>2500||data.links.length>12000)throw Error('Invalid K’NEX Studio file (maximum 2500 parts).');const ids=new Map();for(const p of data.parts){if(!p||!Object.hasOwn(BY_ID,p.type)||typeof p.id!=='string'||p.id.length>100||ids.has(p.id))throw Error('Invalid part');if(p.massG!==undefined&&(!Number.isFinite(p.massG)||p.massG<=0||p.massG>100000))throw Error('Invalid mass');if(p.massCenter!==undefined&&(!Array.isArray(p.massCenter)||p.massCenter.length!==3||!p.massCenter.every(x=>Number.isFinite(x)&&Math.abs(x)<=1000)))throw Error('Invalid mass center');if(p.grounded!==undefined&&typeof p.grounded!=='boolean')throw Error('Invalid ground constraint');validatePath(p,definition(p));ids.set(p.id,p);for(const[k,n]of[['pos',3],['quat',4]])if(!Array.isArray(p[k])||p[k].length!==n||!p[k].every(x=>Number.isFinite(x)&&Math.abs(x)<1e6))throw Error('Invalid position or orientation');if(Math.abs(Q(p.quat).length()-1)>.001)throw Error('Invalid rotation');}const occupied=new Set();for(const l of data.links){if(!l||!ids.has(l.a)||!ids.has(l.b)||l.a===l.b||!['end','through','side','interlock','keyed','mount','tire','mesh','chain','track','end-bearing','hinge'].includes(l.mode)||typeof l.ap!=='string'||typeof l.bp!=='string')throw Error('Invalid connection');if(l.locked!==undefined&&(typeof l.locked!=='boolean'||l.mode!=='through'))throw Error('Invalid axle lock');const a=ids.get(l.a),b=ids.get(l.b),da=definition(a),db=definition(b);const validKey=(p,k)=>(definition(p).crossTie&&['rail0','rail1'].includes(k))||(definition(p).tubing&&k==='tube')||(k==='teeth'&&definition(p).gear)||(/^tire[01]?$/.test(k)&&(definition(p).tire||definition(p).wheelHub||p.type==='c-white'))||(['mount-front','mount-back'].includes(k)&&definition(p).motor&&!definition(p).legacy)||(k==='motor-mount'&&p.type==='c-white')||localPorts(p).some(x=>x.key===k)||(k==='shaft'&&definition(p).group==='rods')||(k==='hole'&&!definition(p).flexi&&!definition(p).tubing&&definition(p).group!=='rods'&&!definition(p).chain&&!definition(p).tire&&!definition(p).endCap&&!definition(p).endBearing&&!definition(p).interlock&&!definition(p).noBore)||(k==='interlock'&&definition(p).interlock)||(k==='key'&&(definition(p).driveClip||keyCompatible(definition(p))));if(!validKey(a,l.ap)||!validKey(b,l.bp))throw Error('Unknown connection point');const ks=[l.ap,l.bp];if(l.mode==='hinge'&&!(hingeCompatible(da,db)&&l.ap==='pivot'&&l.bp==='pivot')||l.mode==='track'&&!((da.crossTie&&db.tubing&&['rail0','rail1'].includes(l.ap)&&l.bp==='tube')||(db.crossTie&&da.tubing&&['rail0','rail1'].includes(l.bp)&&l.ap==='tube'))||l.mode==='mesh'&&!(da.gear&&db.gear&&l.ap==='teeth'&&l.bp==='teeth')||l.mode==='chain'&&!(da.chain&&db.chain&&ks.includes('pin')&&ks.includes('socket'))||l.mode==='tire'&&!(tireCompatible(da,db)&&tyreSeats(da.tire?da:db,da.tire?db:da).some(s=>(da.tire?l.ap:l.bp)===s.key&&(da.tire?l.bp:l.ap)==='tire'))||l.mode==='end-bearing'&&!((da.endBearing&&db.group==='rods'&&l.ap==='bearing'&&/^end[01]$/.test(l.bp))||(db.endBearing&&da.group==='rods'&&l.bp==='bearing'&&/^end[01]$/.test(l.ap)))||l.mode==='mount'&&!((da.motor&&!da.legacy&&b.type==='c-white'&&['mount-front','mount-back'].includes(l.ap)&&l.bp==='motor-mount')||(db.motor&&!db.legacy&&a.type==='c-white'&&['mount-front','mount-back'].includes(l.bp)&&l.ap==='motor-mount'))||l.mode==='end'&&!((localPorts(a).find(p=>p.key===l.ap)?.kind==='end'&&localPorts(b).find(p=>p.key===l.bp)?.kind==='slot')||(localPorts(b).find(p=>p.key===l.bp)?.kind==='end'&&localPorts(a).find(p=>p.key===l.ap)?.kind==='slot'))||l.mode==='through'&&!(ks.includes('hole')&&ks.includes('shaft'))||l.mode==='side'&&(!(ks.includes('shaft')&&ks.some(k=>k.startsWith('slot')))||a.type==='r-green'||b.type==='r-green'||da.noSide||db.noSide)||l.mode==='interlock'&&!ks.every(k=>k==='interlock')||l.mode==='keyed'&&(!ks.every(k=>k==='key')||!((da.driveClip&&keyCompatible(db))||(db.driveClip&&keyCompatible(da)))))throw Error('Parts do not match this connection');for(const k of['offset','roll','portIndex'])if(l[k]!==undefined&&(!Number.isFinite(l[k])||Math.abs(l[k])>10000))throw Error('Invalid connection setting');for(const[id,k]of[[l.a,l.ap],[l.b,l.bp]]){if(k==='shaft'||k==='teeth'||k==='tube')continue;const key=id+':'+k;if(/^tire[01]?$/.test(k)&&([...occupied].some(x=>x.startsWith(id+':tire')&&(k==='tire'||x===id+':tire'||x===key))))throw Error('Tyre seat is used twice');if(occupied.has(key))throw Error('Connection point is used twice');occupied.add(key);}}const controller=Array.isArray(data.controller)?data.controller.filter(c=>c&&ids.has(c.motorId)&&definition(ids.get(c.motorId)).motor&&['left','right','all','aux'].includes(c.channel)&&/^(Key[A-Z]|Arrow(Up|Down|Left|Right)|Digit[0-9])$/.test(c.forward)&&/^(Key[A-Z]|Arrow(Up|Down|Left|Right)|Digit[0-9])$/.test(c.reverse)).map(c=>({motorId:c.motorId,channel:c.channel,forward:c.forward,reverse:c.reverse,invert:!!c.invert})):[];return{...(data.editor?{editor:sanitizeEditor(data.editor,new Set(ids.keys()))}:{}),...(controller.length?{controller}:{}),name:typeof data.name==='string'?data.name.slice(0,100):'My model',parts:data.parts.map(p=>({id:p.id,type:p.type,pos:[...p.pos],quat:[...p.quat],...(p.curveBank!==undefined?{curveBank:p.curveBank}:{}),...(p.path?{path:p.path.map(v=>[...v])}:{}),...(p.grounded===true?{grounded:true}:{}),...(p.massG!==undefined?{massG:p.massG}:{}),...(p.massCenter?{massCenter:[...p.massCenter]}:{})})),links:data.links.map(l=>({a:l.a,ap:l.ap,b:l.b,bp:l.bp,mode:l.mode,...(l.locked!==undefined?{locked:l.locked}:{}),...Object.fromEntries(['offset','roll','portIndex'].filter(k=>l[k]!==undefined).map(k=>[k,l[k]]))}))};}
export function emptyModel(name='My model'){return{name,parts:[],links:[]};}
export function exampleModel(name='bridge'){
 const m=emptyModel(name==='bridge'?'My first bridge':name==='axle'?'Axles & connections':'Start with a connector');
 if(name==='empty')return m;
 if(name==='starter'){m.parts.push(part('c-white',[0,20,0]));return m;}
 if(name==='axle'){
 const hub=part('c-white',[0,35,0]);m.parts.push(hub);const t=targets(m,'r-red','through')[0];const rod=add(m,solve(m,'r-red',t,'through'));
 for(const [type,offset]of[['s-blue',8],['s-silver',18],['c-yellow',38]])add(m,solve(m,type,targets(m,type,'through').find(x=>x.partId===rod.id),'through',{offset,roll:45}));
 const slot=targets(m,'r-yellow','side').find(x=>x.partId===hub.id&&x.key==='slot0');add(m,solve(m,'r-yellow',slot,'side'));
 return m;
 }
 // Two planar trusses joined by axles through their centre bores.
 const span=37.5*Math.SQRT2**3,rows=[];
 for(const z of[-span/2,span/2]){const nodes=[];for(let x=0;x<4;x++)for(let y=0;y<2;y++){const n=part('c-white',[(x-1.5)*span,24+y*span,z]);m.parts.push(n);nodes.push(n);}rows.push(nodes);
 const rodBetween=(a,b,type)=>{const dir=V(b.pos).sub(V(a.pos)).normalize(),d=BY_ID[type];const p=part(type,V(a.pos).addScaledVector(dir,SOCKET+d.length/2).toArray(),new Quaternion().setFromUnitVectors(V([1,0,0]),dir).toArray());add(m,{part:p});};
 for(let x=0;x<3;x++){rodBetween(nodes[x*2],nodes[(x+1)*2],'r-yellow');rodBetween(nodes[x*2+1],nodes[(x+1)*2+1],'r-yellow');rodBetween(nodes[x*2+(x%2)],nodes[(x+1)*2+1-(x%2)],'r-red');}
 for(let x=0;x<4;x++)rodBetween(nodes[x*2],nodes[x*2+1],'r-yellow');
 }
 for(let i=0;i<8;i++){const a=rows[0][i],b=rows[1][i],r=part('r-red',[(a.pos[0]+b.pos[0])/2,a.pos[1],0],new Quaternion().setFromUnitVectors(V([1,0,0]),V([0,0,1])).toArray());m.parts.push(r);m.links.push({a:a.id,ap:'hole',b:r.id,bp:'shaft',mode:'through',offset:-span/2},{a:b.id,ap:'hole',b:r.id,bp:'shaft',mode:'through',offset:span/2});}
 return m;
}
