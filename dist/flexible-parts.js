import * as T from './vendor/three.module.js';
// Part identities are sourced; cross-section and cross-tie gauge are photo estimates.
export const FLEXIBLE_PARTS=[
 ...[
  ['f-lightblue32','Light blue',32,'91480B','#42c5ed'],
  ['f-purple32','Purple',32,'91480','#8154c7'],
  ['f-blue52','Mid blue',52,'91490','#219dd4'],
  ['f-lilac52','Lilac',52,'914901','#8b72d4'],
  ['f-fluorange86','Fluorescent orange',86,'91282','#ff852f'],
  ['f-orange86','Orange',86,'91282D','#e95b35'],
  ['f-red86','Red',86,'91283','#de2746'],
  ['f-green190','Green',190,'91108','#8fcb20'],
  ['f-fluyellow190','Fluorescent yellow',190,'91107','#c6e834'],
  ['f-yellow190','Yellow',190,'91107Y','#e5d923'],
  ['f-lilac190','Lilac',190,'91109','#8b77cd'],
  ['f-purple190','Purple',190,'90966','#7050a1'],
 ].map(([id,colorName,length,partNumber,color])=>({id,name:`${colorName} flexi rod`,colorName,partNumber,group:'flexible',flexi:true,length,nominal:length,color,slots:[],reference:'https://shop.knexusergroup.org.uk/products/'+partNumber,geometryStatus:'Supplier approximate length; photo-based profile; bending limits unverified'})),
 {id:'track-purple',name:'Purple split tubing',group:'flexible',tubing:true,stockLength:6096,color:'#8757b4',slots:[],reference:'https://www.knexusergroup.org.uk/bk/51587.pdf'},
 {id:'c-cross-tie',name:'Green coaster cross-tie',partNumber:'91430',group:'connectors',crossTie:true,color:'#9cd622',slots:[202.5,247.5,292.5,337.5],reference:'https://shop.knexusergroup.org.uk/products/91430'},
];
export const TRACK_GAUGE=44; // Unverified photo reconstruction, not a factory dimension.
export const TRACK_RISE=18;
export const pathLength=points=>points.slice(1).reduce((s,p,i)=>s+new T.Vector3(...p).distanceTo(new T.Vector3(...points[i])),0);
export function defaultPath(d){return [[-(d.length||190)/2,0,0],[(d.length||190)/2,0,0]];}
export function validatePath(p,d){if(p.curveBank!==undefined&&(!d.tubing||!Number.isFinite(p.curveBank)||Math.abs(p.curveBank)>60))throw Error('Invalid tubing bank');if(p.path===undefined)return;if(!(d.flexi||d.tubing)||!Array.isArray(p.path)||p.path.length<2||p.path.length>512||p.path.some(v=>!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x)||Math.abs(x)>10000)))throw Error('Invalid flexible part path');const n=pathLength(p.path);if(p.path.slice(1).some((v,i)=>new T.Vector3(...v).distanceTo(new T.Vector3(...p.path[i]))<.001)||n<1||(d.flexi&&Math.abs(n-d.length)>.15)||(d.tubing&&n>d.stockLength+.01))throw Error('Flexible part exceeds its stock length or has duplicate points');}
export function copyPath(from,to){if(from.path)to.path=from.path.map(p=>[...p]);if(from.curveBank!==undefined)to.curveBank=from.curveBank;return to;}
export class SampledPath extends T.Curve{
 constructor(points){super();this.points=points.map(p=>new T.Vector3(...p));this.lengths=[0];for(let i=1;i<this.points.length;i++)this.lengths.push(this.lengths.at(-1)+this.points[i].distanceTo(this.points[i-1]));this.total=this.lengths.at(-1);}
 getPoint(t,target=new T.Vector3()){const s=Math.max(0,Math.min(1,t))*this.total;let i=1;while(i<this.lengths.length-1&&this.lengths[i]<s)i++;return target.copy(this.points[i-1]).lerp(this.points[i],(s-this.lengths[i-1])/(this.lengths[i]-this.lengths[i-1]||1));}
 getPointAt(t,target){return this.getPoint(t,target);}
}
// Parallel-transport frames avoid rail flips at vertical tangents and S-bends.
export function transportedFrames(path,segments,bank=0){
 const frames=path.computeFrenetFrames(segments,false),first=frames.tangents[0],across=new T.Vector3().crossVectors(new T.Vector3(0,1,0),first);if(across.lengthSq()<1e-8)across.set(1,0,0);across.normalize();
 const angle=Math.atan2(new T.Vector3().crossVectors(frames.normals[0],across).dot(first),frames.normals[0].dot(across))+bank*Math.PI/180;
 for(let i=0;i<=segments;i++){frames.normals[i].applyAxisAngle(frames.tangents[i],angle);frames.binormals[i].crossVectors(frames.tangents[i],frames.normals[i]).normalize();}return frames;
}
export function flexibleGeometry(d,p={}){
 const g=new T.Group(),path=new SampledPath(p.path||defaultPath(d)),segments=Math.min(512,Math.max(32,Math.ceil(path.total/3))),frames=transportedFrames(path,segments,p.curveBank||0),mat=new T.MeshStandardMaterial({color:d.color,roughness:.36});
 // Tubing is split underneath, with a real opening rather than a solid cylinder.
 if(d.tubing){const positions=[],indices=[],steps=12;for(let i=0;i<=segments;i++){const center=path.getPoint(i/segments);for(const radius of[2.8,1.7])for(let j=0;j<=steps;j++){const a=.32+j*(Math.PI*2-.64)/steps,v=center.clone().addScaledVector(frames.normals[i],Math.sin(a)*radius).addScaledVector(frames.binormals[i],-Math.cos(a)*radius);positions.push(...v);}}const row=2*(steps+1);for(let i=0;i<segments;i++)for(let side=0;side<2;side++)for(let j=0;j<steps;j++){const a=i*row+side*(steps+1)+j,b=a+row;indices.push(a,b,a+1,a+1,b,b+1);}for(let i=0;i<segments;i++)for(const j of[0,steps]){const a=i*row+j,b=a+steps+1;indices.push(a,b,a+row,b,b+row,a+row);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mat.side=T.DoubleSide;g.add(new T.Mesh(geo,mat));
 }else{
 g.add(new T.Mesh(new T.TubeGeometry(path,segments,2.15,10,false),mat));
 for(let k=0;k<4;k++){const points=Array.from({length:segments+1},(_,i)=>path.getPoint(i/segments).addScaledVector(frames.normals[i],2*Math.cos(k*Math.PI/2)).addScaledVector(frames.binormals[i],2*Math.sin(k*Math.PI/2)).toArray());g.add(new T.Mesh(new T.TubeGeometry(new SampledPath(points),segments,.7,5,false),mat));}
 for(const end of[0,1]){const center=path.getPoint(end),dir=path.getTangent(end),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir);for(const [inset,radius,length]of[[1.2,3.05,2.4],[4,2.55,4],[6.7,3,1.2]]){const mesh=new T.Mesh(new T.CylinderGeometry(radius,radius,length,16),mat);mesh.position.copy(center).addScaledVector(dir,end?-inset:inset);mesh.quaternion.copy(q);g.add(mesh);}}
 }g.userData.dynamic=true;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;
}
export function crossTieArms(g,mat){
 const add=(points,width)=>{const shape=new T.Shape();shape.moveTo(...points[0]);points.slice(1).forEach(p=>shape.lineTo(...p));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false});geo.translate(0,0,-width/2);g.add(new T.Mesh(geo,mat));};
 for(const sign of[-1,1]){add([[sign*3,5],[sign*10,13],[sign*17,18],[sign*22,18],[sign*22,15],[sign*17,15],[sign*9,9],[sign*5,3]],3);const post=new T.Mesh(new T.BoxGeometry(2.5,2.5,13),mat);post.position.set(sign*TRACK_GAUGE/2,TRACK_RISE,0);g.add(post);}const post=new T.Mesh(new T.BoxGeometry(2,5,3),mat);post.position.set(0,10,0);g.add(post);
}
export function flexibleIcon(d){return `<svg viewBox="0 0 120 58" aria-hidden="true"><path d="M14 44Q55 -10 106 34" fill="none" stroke="${d.color}" stroke-width="${d.tubing?7:5}" stroke-linecap="round"/>${d.flexi?'<path d="m10 40 8 8m84-18 8 8" stroke="'+d.color+'" stroke-width="4"/>':''}</svg>`;}
