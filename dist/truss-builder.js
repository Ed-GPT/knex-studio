import {V,Q,BY_ID,SOCKET,part,ports,emptyModel,solve,targets,busy} from './engine.js';
import {FRAME_ROD_CHOICES,frameDiagonal} from './frame-builder.js';
import {makeGroup,makeLayer} from './editor-state.js';
// The 45-degree triangular lattice uses only stock edges and sqrt(2) diagonals.
// Blue pairs provide XY and XZ sockets. No unsupported YZ diagonal is invented.
export function trussDimensions({kind='roof',counts=[3,2,2],rod='r-blue',braced=true,plane='xy'}={}){
 if(!['truss','roof'].includes(kind)||!['xy','xz'].includes(plane)||!FRAME_ROD_CHOICES.includes(rod))throw Error('Choose a Classic roof truss or gable roof.');
 if(!Array.isArray(counts)||counts.length!==3||counts.some(n=>!Number.isInteger(n)||n<1||n>30))throw Error('Use 1 to 30 cells per half-span and depth.');
 const half=counts[0],depth=kind==='truss'?0:counts[2],pitch=BY_ID[rod].length+2*SOCKET,diagonal=frameDiagonal(rod);
 if(!diagonal)throw Error('The 45° rafters need a matching stock diagonal. Choose a shorter rod size.');
 const nodes=(half+1)**2,horizontal=half*(half+1),vertical=half**2,slopes=braced?horizontal:2*half,total=nodes*(depth+1)*(kind==='roof'?2:1)+(horizontal+vertical+slopes)*(depth+1)+nodes*depth+(braced?horizontal*depth:0);
 if(total>2500)throw Error(`This needs ${total} parts. Maximum 2500; reduce the half-span or depth.`);
 return{kind,counts,half,depth,rod,braced,plane,pitch,diagonal,total,size:kind==='truss'&&plane==='xz'?[2*half*pitch,0,half*pitch]:[2*half*pitch,half*pitch,depth*pitch]};
}
export function buildTruss(options={}){
 const d=trussDimensions(options),m=emptyModel(d.kind==='truss'?'Generated roof truss':'Generated gable roof'),nodes=new Map(),layers=Array.from({length:d.depth+1},()=>[]),rotation=d.kind==='truss'&&d.plane==='xz'?Q().setFromAxisAngle(V([1,0,0]),Math.PI/2):Q(),key=(x,y,z)=>`${x},${y},${z}`;
 for(let z=0;z<=d.depth;z++)for(let y=0;y<=d.half;y++)for(let x=-(d.half-y);x<=d.half-y;x++){
  const a=part(d.kind==='truss'?'c-white':'c-blue',V([(x+d.half)*d.pitch,y*d.pitch,z*d.pitch]).applyQuaternion(rotation).toArray(),rotation.toArray()),pair=[a];m.parts.push(a);layers[z].push(a.id);
  if(d.kind==='roof'){const local={parts:[a],links:[]},p=solve(local,'c-blue',targets(local,'c-blue','interlock')[0],'interlock');m.parts.push(p.part);m.links.push(p.link);pair.push(p.part);layers[z].push(p.part.id);}nodes.set(key(x,y,z),pair);
 }
 const span=(from,to,type,layer)=>{const a=nodes.get(key(...from)),b=nodes.get(key(...to));if(!a||!b)throw Error('Missing truss node.');const dir=V(b[0].pos).sub(V(a[0].pos)).normalize(),socket=(pair,sign)=>pair.flatMap(ports).find(p=>p.kind==='slot'&&V(p.dir).dot(dir)*sign>.999999&&!busy(m,p.partId,p.key)),ap=socket(a,1),bp=socket(b,-1);if(!ap||!bp)throw Error('No free real socket for this truss span.');
  const rod=part(type,V(ap.pos).add(V(bp.pos)).multiplyScalar(.5).toArray(),Q().setFromUnitVectors(V([1,0,0]),dir).toArray()),ends=ports(rod);if(V(ends[0].pos).distanceTo(V(ap.pos))>1e-6||V(ends[1].pos).distanceTo(V(bp.pos))>1e-6)throw Error('Stock rod does not fit the truss span.');m.parts.push(rod);layers[layer].push(rod.id);m.links.push({a:ap.partId,ap:ap.key,b:rod.id,bp:'end0',mode:'end'},{a:bp.partId,ap:bp.key,b:rod.id,bp:'end1',mode:'end'});
 };
 for(let z=0;z<=d.depth;z++)for(let y=0;y<=d.half;y++){const radius=d.half-y;for(let x=-radius;x<=radius;x++){
  if(x<radius)span([x,y,z],[x+1,y,z],d.rod,z);
  if(Math.abs(x)<radius)span([x,y,z],[x,y+1,z],d.rod,z);
  if(x!==0&&(d.braced||Math.abs(x)===radius))span([x,y,z],[x-Math.sign(x),y+1,z],d.diagonal,z);
  if(z<d.depth){span([x,y,z],[x,y,z+1],d.rod,z+1);if(d.braced&&x<radius)span([x,y,z],[x+1,y,z+1],d.diagonal,z+1);}
 }}
 layers.forEach((ids,z)=>makeLayer(m,ids,d.kind==='truss'?'Roof truss':z?`Bay ${z}`:'Front truss'));makeGroup(m,m.parts.map(p=>p.id),d.kind==='truss'?'Roof truss':'Gable roof');return{model:m,dimensions:d};
}
