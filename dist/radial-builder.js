import {V,Q,BY_ID,SOCKET,part,ports,emptyModel,solve,targets} from './engine.js';
import {FRAME_ROD_CHOICES,frameDiagonal} from './frame-builder.js';
import {makeGroup,makeLayer} from './editor-state.js';
// Regular octagons use the Classic 45-degree connector lattice. Each straight
// side is subdivided into complete stock rods, never stretched to a radius.
export function radialDimensions({kind='ring',counts=[1,3,1],rod='r-blue',braced=true,plane='xz'}={}){
 if(!['ring','tube'].includes(kind)||!['xy','xz'].includes(plane)||!FRAME_ROD_CHOICES.includes(rod))throw Error('Choose a Classic octagonal ring or tower.');
 if(!Array.isArray(counts)||counts.length!==3||counts.some(n=>!Number.isInteger(n)||n<1||n>30))throw Error('Use 1 to 30 rod segments per side and levels.');
 const segments=counts[0],levels=kind==='ring'?0:counts[1],pitch=BY_ID[rod].length+2*SOCKET,diagonal=frameDiagonal(rod),braces=kind==='tube'&&braced;
 if(braces&&!diagonal)throw Error('This rod size has no matching stock diagonal. Turn braces off.');
 const width=segments*pitch*(1+Math.SQRT2),total=kind==='ring'?16*segments:24*segments+(32+(braces?4:0))*segments*levels;
 if(total>2500)throw Error(`This needs ${total} parts. Maximum 2500; reduce the side segments or levels.`);
 return{kind,counts,segments,levels,rod,braced:braces,plane,pitch,diagonal,total,size:kind==='tube'?[width,levels*pitch,width]:plane==='xy'?[width,width,0]:[width,0,width]};
}
export function buildRadial(options={}){
 const d=radialDimensions(options),m=emptyModel(d.kind==='ring'?'Generated octagonal ring':'Generated octagonal tower'),perimeter=8*d.segments,points=[],nodes=[],layers=Array.from({length:d.levels+1},()=>[]),rotation=d.kind==='tube'||d.plane==='xz'?Q().setFromAxisAngle(V([1,0,0]),-Math.PI/2):Q();
 let cursor=V();for(let side=0;side<8;side++){const angle=side*Math.PI/4,dir=V([Math.cos(angle),Math.sin(angle),0]);for(let i=0;i<d.segments;i++){points.push({pos:cursor.clone(),side,index:i});cursor.addScaledVector(dir,d.pitch);}}
 const min=V([Math.min(...points.map(p=>p.pos.x)),Math.min(...points.map(p=>p.pos.y)),0]);for(const p of points)p.pos.sub(min);
 for(let level=0;level<=d.levels;level++)for(const point of points){
  // Orient the corner pairs along the even side. Four alternating walls get
  // real 45-degree braces; the neighboring wall cannot share that same plane.
  // Cell arrays canonicalize opposite walls so their connector halves and
  // brace directions match when those walls merge.
  const side=point.index===0&&point.side%2?point.side-1:point.side,quat=rotation.clone().multiply(Q().setFromAxisAngle(V([0,0,1]),(options.sharedNodes?side%4:side)*Math.PI/4)),pos=point.pos.clone().add(V([0,0,level*d.pitch])).applyQuaternion(rotation),a=part(d.kind==='ring'?'c-white':'c-blue',pos.toArray(),quat.toArray()),pair=[a];m.parts.push(a);layers[level].push(a.id);
  if(d.kind==='tube'){const local={parts:[a],links:[]},p=solve(local,'c-blue',targets(local,'c-blue','interlock')[0],'interlock');m.parts.push(p.part);m.links.push(p.link);pair.push(p.part);layers[level].push(p.part.id);}nodes.push(pair);
 }
 const span=(ai,bi,type,level)=>{const a=nodes[ai],b=nodes[bi],dir=V(b[0].pos).sub(V(a[0].pos)).normalize(),ap=a.flatMap(ports).find(p=>p.kind==='slot'&&V(p.dir).dot(dir)>.999999),bp=b.flatMap(ports).find(p=>p.kind==='slot'&&V(p.dir).dot(dir)<-.999999);if(!ap||!bp)throw Error('No real socket for the octagonal span.');
  const rod=part(type,V(ap.pos).add(V(bp.pos)).multiplyScalar(.5).toArray(),Q().setFromUnitVectors(V([1,0,0]),dir).toArray()),ends=ports(rod);if(V(ends[0].pos).distanceTo(V(ap.pos))>1e-6||V(ends[1].pos).distanceTo(V(bp.pos))>1e-6)throw Error('Stock rod does not fit the octagonal span.');m.parts.push(rod);layers[level].push(rod.id);m.links.push({a:ap.partId,ap:ap.key,b:rod.id,bp:'end0',mode:'end'},{a:bp.partId,ap:bp.key,b:rod.id,bp:'end1',mode:'end'});
 };
 for(let level=0;level<=d.levels;level++)for(let i=0;i<perimeter;i++){const next=(i+1)%perimeter;span(level*perimeter+i,level*perimeter+next,d.rod,level);if(level<d.levels){span(level*perimeter+i,(level+1)*perimeter+i,d.rod,level+1);if(d.braced&&points[i].side%2===0)span(level*perimeter+(options.sharedNodes&&points[i].side>=4?next:i),(level+1)*perimeter+(options.sharedNodes&&points[i].side>=4?i:next),d.diagonal,level+1);}}
 const offset=V([0,0,0]);for(let i=0;i<3;i++)offset.setComponent(i,-Math.min(...nodes.map(n=>n[0].pos[i])));for(const p of m.parts)p.pos=V(p.pos).add(offset).toArray();
 layers.forEach((ids,i)=>makeLayer(m,ids,d.kind==='ring'?'Ring':i?`Level ${i}`:'Base ring'));makeGroup(m,m.parts.map(p=>p.id),d.kind==='ring'?'Octagonal ring':'Octagonal tower');return{model:m,dimensions:d};
}
