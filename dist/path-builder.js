import {stockCuts} from './track-cuts.js';
import * as T from './vendor/three.module.js';
import {part,emptyModel,V,Q,ports,SOCKET,add,autoLinks,BY_ID} from './engine.js';
import {pathLength,SampledPath,TRACK_GAUGE,TRACK_RISE,ORANGE_TAB,transportedFrames} from './flexible-parts.js';
export const PATH_PRESETS={long:[[-1150,100,0],[0,200,0],[1150,100,0]],hill:[[-260,80,0],[-100,165,0],[100,165,0],[260,80,0]],s:[[-260,100,-90],[-90,100,80],[90,100,-80],[260,100,90]],bend:[[-180,100,0],[-70,100,0],[50,100,70],[50,100,200]]};
export function validateDesign(value){if(!value||!['track','flexi'].includes(value.kind)||!Array.isArray(value.points)||value.points.length<2||value.points.length>24||value.points.some(p=>!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v)||Math.abs(v)>2500)))throw Error('Use 2–24 points in millimetres, within ±2500 mm.');if(value.points.slice(1).some((p,i)=>V(p).distanceTo(V(value.points[i]))<(value.kind==='flexi'?.05:5)))throw Error(value.kind==='flexi'?'Neighbouring handles must be at least 0.05 mm apart.':'Neighbouring handles must be at least 5 mm apart.');const flexiType=value.flexiType??'f-green190';if(value.kind==='flexi'&&!BY_ID[flexiType]?.flexi)throw Error('Choose a documented Classic flexi rod.');if(value.trackType!==undefined&&!['track-orange','track-purple'].includes(value.trackType))throw Error('Choose original orange or purple Classic tubing.');const crossRod=value.crossRod??'r-90958';if(!['r-blue','r-90958'].includes(crossRod))throw Error('Choose Classic blue ball rails or orange coaster cross-rods.');if(value.bankEnds!==undefined&&typeof value.bankEnds!=='boolean')throw Error('Invalid bank transition setting');if(value.entryRod!==undefined&&!['r-white','r-blue'].includes(value.entryRod))throw Error('Choose a white or blue entry gauge.');const spacing=value.spacing??65,bank=value.bank??0;if(!Number.isFinite(spacing)||spacing<30||spacing>190||!Number.isFinite(bank)||Math.abs(bank)>60)throw Error('Cross-tie spacing must be 30–190 mm; banking must be within ±60°.');return{...(value.entryRod?{entryRod:value.entryRod}:{}),...(value.bankEnds?{bankEnds:true}:{}),...(value.crossRod?{crossRod}:{}),kind:value.kind,points:value.points.map(p=>[...p]),spacing,bank,...(value.kind==='flexi'?{flexiType}:value.trackType?{trackType:value.trackType}:{})};}
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
 const orange=d.trackType==='track-orange',tubeType=orange?'track-orange':'track-purple',stock=BY_ID[tubeType],gauge=orange?BY_ID[d.crossRod||'r-90958'].length-16:TRACK_GAUGE;
 const gaugeAt=t=>d.entryRod&&orange?(BY_ID[d.entryRod].length-16)+(gauge-(BY_ID[d.entryRod].length-16))*Math.min(1,t*curve.total/150):gauge;
 const frames=transportedFrames(curve,384,d.bank);
 if(d.bankEnds)for(let i=0;i<=384;i++){const weight=Math.min(1,curve.total*i/384/250,curve.total*(1-i/384)/250),angle=d.bank*Math.PI/180*(weight-1);frames.normals[i].applyAxisAngle(frames.tangents[i],angle);frames.binormals[i].crossVectors(frames.tangents[i],frames.normals[i]).normalize();}
 const frameAt=t=>{const tangent=curve.getTangent(t).normalize(),f=t*384,i=Math.min(383,Math.floor(f)),across=frames.normals[i].clone().lerp(frames.normals[i+1],f-i);across.addScaledVector(tangent,-across.dot(tangent)).normalize();const up=tangent.clone().cross(across).normalize();return{tangent,across,up};};
 const rails=[-1,1].map(sign=>Array.from({length:385},(_,i)=>{const t=i/384,f=frameAt(t);return curve.getPoint(t).addScaledVector(f.across,sign*gaugeAt(t)/2).toArray();})),railLengths=rails.map(pathLength);
 // A rail that reverses against the centerline folds back on itself. This is
 // a geometric restriction from gauge, not an invented material bend limit.
 if(rails.some(rail=>rail.slice(1).some((p,i)=>V(p).sub(V(rail[i])).dot(curve.getPoint((i+1)/384).sub(curve.getPoint(i/384)))<=0)))throw Error('This bend folds an inner rail back on itself. Widen the curve or reduce banking.');
 if(!orange&&railLengths.some(n=>n>stock.stockLength))throw Error(`A rail exceeds the documented ${stock.stockLength/1000} m tubing stock. Shorten this section.`);
 const railOffset=(side,t)=>{const f=t*384,i=Math.min(384,Math.floor(f));return pathLength(rails[side].slice(0,i+1))+(i<384?V(rails[side][i]).distanceTo(V(rails[side][i+1]))*(f-i):0);};
 const mountIndices=Array.from({length:count},(_,i)=>Math.round(i/(count-1)*384));
 const cuts=rails.map(rail=>stockCuts(rail,stock.stockLength,mountIndices));
 for(let side=0;side<2;side++){
  const full=new SampledPath(rails[side]),railFrames=transportedFrames(full,1024,d.bank);
  for(const cut of cuts[side]){cut.part=curvedPart(tubeType,cut.points);cut.part.curveBank=d.bank;
   if(cuts[side].length>1){const f=cut.startDistance/full.total*1024,i=Math.min(1023,Math.floor(f)),normal=railFrames.normals[i].clone().lerp(railFrames.normals[i+1],f-i).normalize();cut.part.curveNormal=normal.toArray();}
   model.parts.push(cut.part);
  }
 }
 let spliceCount=0;
 for(let side=0;side<2;side++)for(let i=1;i<cuts[side].length;i++){
  const previous=cuts[side][i-1],next=cuts[side][i],index=next.start,axis=V(rails[side][index+1]).sub(V(rails[side][index-1])).normalize(),splice=part('k-track-joiner',rails[side][index],new T.Quaternion().setFromUnitVectors(V([0,0,1]),axis).toArray());model.parts.push(splice);spliceCount++;
  model.links.push({a:splice.id,ap:'rail0',b:previous.part.id,bp:'tube1',mode:'track',offset:previous.length},{a:splice.id,ap:'rail1',b:next.part.id,bp:'tube0',mode:'track',offset:0});
 }
 const mountLink=(mount,key,side,t)=>{const index=Math.round(t*384),cut=cuts[side].find(c=>index>=c.start&&index<=c.end);return{a:mount.id,ap:key,b:cut.part.id,bp:'tube',mode:'track',offset:railOffset(side,t)-cut.startDistance};};
 for(let i=0;i<count;i++){const t=Math.round(i/(count-1)*384)/384,f=frameAt(t),q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(f.across,f.up,f.tangent));
 if(orange){
  // Manual 63030 photos 7–8: side-clamp two track connectors into the special
  // rod's end regions. Slot 2 faces down; the tubing tab faces up.
  const rise=SOCKET+4.4-ORANGE_TAB[1],rod=part(d.crossRod||'r-90958',curve.getPoint(t).addScaledVector(f.up,-rise).toArray(),q.toArray()),cq=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(f.tangent,f.up.clone().negate(),f.across));model.parts.push(rod);
  for(let side=0;side<2;side++){const offset=(side?1:-1)*gaugeAt(t)/2,tab=curve.getPoint(t).addScaledVector(f.across,offset),connector=part('c-track-orange',tab.sub(V(ORANGE_TAB).applyQuaternion(cq)).toArray(),cq.toArray());model.parts.push(connector);model.links.push({a:connector.id,ap:'slot2',b:rod.id,bp:'shaft',mode:'side',offset,portIndex:2},mountLink(connector,'rail',side,t));}
  continue;
 }
 const tie=part('c-cross-tie',curve.getPoint(t).addScaledVector(f.up,-TRACK_RISE).toArray(),q.toArray());model.parts.push(tie);
 // These are tubing-over-post clips, not rod sockets. Offset is distance along the rail.
 for(let side=0;side<2;side++)model.links.push(mountLink(tie,'rail'+side,side,t));
 }
 return{model,length:curve.total,railLengths,tubeCuts:cuts.flat().length,spliceCount,tieCount:count,gauge,minimumRadius,scale:1};
}
