import * as T from './vendor/three.module.js';
import {part,emptyModel,V,Q,ports,SOCKET,add,autoLinks,BY_ID} from './engine.js';
import {pathLength,SampledPath,TRACK_GAUGE,TRACK_RISE,transportedFrames} from './flexible-parts.js';
export const PATH_PRESETS={hill:[[-260,80,0],[-100,165,0],[100,165,0],[260,80,0]],s:[[-260,100,-90],[-90,100,80],[90,100,-80],[260,100,90]],bend:[[-180,100,0],[-70,100,0],[50,100,70],[50,100,200]]};
export function validateDesign(value){if(!value||!['track','flexi'].includes(value.kind)||!Array.isArray(value.points)||value.points.length<2||value.points.length>24||value.points.some(p=>!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v)||Math.abs(v)>2500)))throw Error('Use 2–24 points in millimetres, within ±2500 mm.');if(value.points.slice(1).some((p,i)=>V(p).distanceTo(V(value.points[i]))<(value.kind==='flexi'?.05:5)))throw Error(value.kind==='flexi'?'Neighbouring handles must be at least 0.05 mm apart.':'Neighbouring handles must be at least 5 mm apart.');const flexiType=value.flexiType??'f-green190';if(value.kind==='flexi'&&!BY_ID[flexiType]?.flexi)throw Error('Choose a documented Classic flexi rod.');const spacing=value.spacing??65,bank=value.bank??0;if(!Number.isFinite(spacing)||spacing<30||spacing>190||!Number.isFinite(bank)||Math.abs(bank)>60)throw Error('Cross-tie spacing must be 30–190 mm; banking must be within ±60°.');return{kind:value.kind,points:value.points.map(p=>[...p]),spacing,bank,...(value.kind==='flexi'?{flexiType}:{})};}
export function parseDesign(text){const data=JSON.parse(text);if(data.format!=='knex-path'||data.version!==1)throw Error('Choose a K’NEX path JSON file (version 1).');return validateDesign(data);}
export function exportDesign(design){return JSON.stringify({format:'knex-path',version:1,...validateDesign(design)},null,2);}
function sampled(points){const c=new T.CatmullRomCurve3(points.map(V),false,'centripetal');c.arcLengthDivisions=2000;return new SampledPath(c.getSpacedPoints(384).map(p=>p.toArray()));}
function curvedPart(type,points){const origin=points[Math.floor(points.length/2)],p=part(type,origin);p.path=points.map(v=>V(v).sub(V(origin)).toArray());return p;}
export function buildPath(input){const d=validateDesign(input),curve=sampled(d.points),model=emptyModel(d.kind==='track'?'Classic coaster track':BY_ID[d.flexiType].name);let minimumRadius=Infinity;
 const center=Array.from({length:193},(_,i)=>curve.getPoint(i/192));for(let i=1;i<center.length-1;i++){const a=center[i].clone().sub(center[i-1]),b=center[i+1].clone().sub(center[i]),angle=a.angleTo(b);if(angle>1e-5)minimumRadius=Math.min(minimumRadius,(a.length()+b.length())/(2*angle));}
 if(d.kind==='flexi'){
 // Shape is normalized to one actual stock rod. No stretched rods or cropped tails.
 const stock=BY_ID[d.flexiType],origin=center[0],scale=stock.length/pathLength(center.map(p=>p.toArray())),points=center.map(p=>p.clone().sub(origin).multiplyScalar(scale).add(origin).toArray()),p=curvedPart(d.flexiType,points);model.parts.push(p);
 for(const end of ports(p)){const c=part('c-gray',V(end.pos).addScaledVector(V(end.dir),SOCKET).toArray(),new T.Quaternion().setFromUnitVectors(V([1,0,0]),V(end.dir).negate()).toArray());add(model,{part:c});}
 return{model,length:stock.length,minimumRadius:minimumRadius*scale,railLengths:[],tieCount:0,scale};
 }
 const count=Math.max(2,Math.ceil(curve.total/d.spacing)+1);if(count>100)throw Error('This path needs more than 100 cross-ties. Increase spacing or shorten it.');
 const frames=transportedFrames(curve,384,d.bank);
 const frameAt=t=>{const tangent=curve.getTangent(t).normalize(),f=t*384,i=Math.min(383,Math.floor(f)),across=frames.normals[i].clone().lerp(frames.normals[i+1],f-i);across.addScaledVector(tangent,-across.dot(tangent)).normalize();const up=tangent.clone().cross(across).normalize();return{tangent,across,up};};
 const rails=[-1,1].map(sign=>Array.from({length:385},(_,i)=>{const t=i/384,f=frameAt(t);return curve.getPoint(t).addScaledVector(f.across,sign*TRACK_GAUGE/2).toArray();})),railLengths=rails.map(pathLength);
 if(railLengths.some(n=>n>6096))throw Error('A rail exceeds the documented 6.096 m tubing stock. Shorten this section.');
 for(const rail of rails){const p=curvedPart('track-purple',rail);p.curveBank=d.bank;model.parts.push(p);}
 for(let i=0;i<count;i++){const t=i/(count-1),f=frameAt(t),q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(f.across,f.up,f.tangent)),tie=part('c-cross-tie',curve.getPoint(t).addScaledVector(f.up,-TRACK_RISE).toArray(),q.toArray());model.parts.push(tie);
 // These are tubing-over-post clips, not rod sockets. Offset is distance along the rail.
 for(let side=0;side<2;side++)model.links.push({a:tie.id,ap:'rail'+side,b:model.parts[side].id,bp:'tube',mode:'track',offset:t*railLengths[side]});
 }
 return{model,length:curve.total,railLengths,tieCount:count,minimumRadius,scale:1};
}
