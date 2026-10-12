import {V,Q,BY_ID,SOCKET,part,ports,emptyModel,solve,targets,busy} from './engine.js';
import {FRAME_ROD_CHOICES,frameDiagonal} from './frame-builder.js';
import {makeGroup,makeLayer} from './editor-state.js';
// A filled orthogonal lattice with an ascending stepped boundary. Every edge
// is one stock rod; a rise of two cells uses two rods and a real middle node.
export function steppedDimensions({kind='steps',counts=[4,1,2],rod='r-blue',braced=true,plane='xy'}={}){
 if(!['step-profile','steps'].includes(kind)||!['xy','xz'].includes(plane)||!FRAME_ROD_CHOICES.includes(rod))throw Error('Choose a Classic stepped profile or frame.');
 if(!Array.isArray(counts)||counts.length!==3||counts.some(n=>!Number.isInteger(n)||n<1||n>30))throw Error('Use 1 to 30 steps, rise cells and depth bays.');
 const [steps,rise]=counts,depth=kind==='steps'?counts[2]:0,pitch=BY_ID[rod].length+2*SOCKET,diagonal=frameDiagonal(rod),heights=Array.from({length:steps+1},(_,x)=>Math.min(x+1,steps)*rise);
 if(braced&&!diagonal)throw Error('This rod size has no matching stock diagonal. Turn braces off.');
 const nodes=heights.reduce((n,h)=>n+h+1,0),horizontal=heights.slice(0,-1).reduce((n,h)=>n+h+1,0),vertical=nodes-steps-1,diagonals=horizontal-steps,total=nodes*(depth+1)*(kind==='steps'?2:1)+(horizontal+vertical)*(depth+1)+nodes*depth+(braced?diagonals*(depth+1)+horizontal*depth:0);
 if(total>2500)throw Error(`This needs ${total} parts. Maximum 2500; reduce steps, rise or depth.`);
 return{kind,counts:[steps,rise,depth],steps,rise,depth,rod,braced,plane,pitch,diagonal,heights,total,size:(kind==='step-profile'&&plane==='xz'?[steps,0,steps*rise]:[steps,steps*rise,depth]).map(n=>n*pitch)};
}
export function buildStepped(options={}){
 const d=steppedDimensions(options),m=emptyModel(d.kind==='steps'?'Generated stepped frame':'Generated stepped profile'),nodes=new Map(),layers=Array.from({length:d.steps},()=>[]),rotation=d.kind==='step-profile'&&d.plane==='xz'?Q().setFromAxisAngle(V([1,0,0]),Math.PI/2):Q(),key=(x,y,z)=>`${x},${y},${z}`,layer=x=>layers[Math.min(x,d.steps-1)];
 for(let x=0;x<=d.steps;x++)for(let z=0;z<=d.depth;z++)for(let y=0;y<=d.heights[x];y++){
  const a=part(d.kind==='steps'?'c-blue':'c-white',V([x*d.pitch,y*d.pitch,z*d.pitch]).applyQuaternion(rotation).toArray(),rotation.toArray()),pair=[a];m.parts.push(a);layer(x).push(a.id);
  if(d.kind==='steps'){const local={parts:[a],links:[]},joined=solve(local,'c-blue',targets(local,'c-blue','interlock')[0],'interlock');pair.push(joined.part);m.parts.push(joined.part);m.links.push(joined.link);layer(x).push(joined.part.id);}nodes.set(key(x,y,z),pair);
 }
 const span=(from,to,type)=>{const a=nodes.get(key(...from)),b=nodes.get(key(...to));if(!a||!b)throw Error('Missing stepped-frame node.');const dir=V(b[0].pos).sub(V(a[0].pos)).normalize(),socket=(pair,sign)=>pair.flatMap(ports).find(p=>p.kind==='slot'&&!busy(m,p.partId,p.key)&&V(p.dir).dot(dir)*sign>.999999),ap=socket(a,1),bp=socket(b,-1);if(!ap||!bp)throw Error('No free real socket for this stepped-frame span.');
  const rod=part(type,V(ap.pos).add(V(bp.pos)).multiplyScalar(.5).toArray(),Q().setFromUnitVectors(V([1,0,0]),dir).toArray()),ends=ports(rod);if(V(ends[0].pos).distanceTo(V(ap.pos))>1e-6||V(ends[1].pos).distanceTo(V(bp.pos))>1e-6)throw Error('Stock rod does not fit the stepped-frame span.');m.parts.push(rod);layer(from[0]).push(rod.id);m.links.push({a:ap.partId,ap:ap.key,b:rod.id,bp:'end0',mode:'end'},{a:bp.partId,ap:bp.key,b:rod.id,bp:'end1',mode:'end'});
 };
 for(let x=0;x<=d.steps;x++)for(let z=0;z<=d.depth;z++)for(let y=0;y<=d.heights[x];y++){
  if(x<d.steps)span([x,y,z],[x+1,y,z],d.rod);
  if(y<d.heights[x])span([x,y,z],[x,y+1,z],d.rod);
  if(z<d.depth)span([x,y,z],[x,y,z+1],d.rod);
  if(d.braced&&x<d.steps){if(y<d.heights[x])span([x,y,z],[x+1,y+1,z],d.diagonal);if(z<d.depth)span([x,y,z],[x+1,y,z+1],d.diagonal);}
 }
 layers.forEach((ids,i)=>makeLayer(m,ids,`Step ${i+1}`));makeGroup(m,m.parts.map(p=>p.id),d.kind==='steps'?'Stepped frame':'Stepped profile');return{model:m,dimensions:d};
}
