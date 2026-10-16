import {V,Q,BY_ID,SOCKET,part,ports,emptyModel,solve,targets,busy,component} from './engine.js';
import {FRAME_RODS,frameDiagonal} from './frame-builder.js';
import {makeLayer,makeGroup} from './editor-state.js';
import {assertClearPlacement} from './interference.js';

const key=v=>v.join(',');
const vector=(v,positive=false)=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&Math.abs(n)<=10000&&(!positive||n>0));
export const SHAPE_KINDS=['box','ellipsoid','taper'];
export function insideShape(point,s){
 const local=point.map((v,i)=>(v-s.center[i])/(s.size[i]/2));
 if(local.some(v=>v < -1-1e-8||v>1+1e-8))return false;
 if(s.kind==='ellipsoid')return local.reduce((n,v)=>n+v*v,0)<=1+1e-8;
 if(s.kind==='taper'){const axis=s.axis??2,t=(local[axis]+1)/2,scale=1-(1-s.tipScale)*(s.reverse?1-t:t);return local.every((v,i)=>i===axis||Math.abs(v)<=scale+1e-8);}
 return true;
}
// Sample a union of volumes on a stock-length lattice. Surface faces share
// nodes and edges; there are no invented rod lengths or diagonal socket planes.
export function shapePlan({shapes,rod='r-blue',braced=true,name='Shape frame'}={}){
 if(!FRAME_RODS.includes(rod))throw Error('Choose a standard Classic rod length.');
 if(typeof braced!=='boolean'||typeof name!=='string'||name.length>100)throw Error('Invalid shape-frame settings.');
 const diagonal=frameDiagonal(rod);if(braced&&!diagonal)throw Error('This rod has no stock diagonal. Turn braces off.');
 if(!Array.isArray(shapes)||!shapes.length||shapes.length>24)throw Error('Use 1 to 24 rough shapes.');
 for(const s of shapes){if(!SHAPE_KINDS.includes(s.kind)||!vector(s.center)||!vector(s.size,true)||typeof s.name!=='string'||!s.name.length||s.name.length>60)throw Error('Each shape needs a name, kind, center and positive size in millimetres.');if(s.kind==='taper'&&(![0,1,2].includes(s.axis??2)||!Number.isFinite(s.tipScale)||s.tipScale<=0||s.tipScale>1||s.reverse!==undefined&&typeof s.reverse!=='boolean'))throw Error('Tapers need axis 0, 1 or 2 and tipScale above 0 and at most 1.');}
 const pitch=BY_ID[rod].length+2*SOCKET,cells=new Map(),samples=shapes.map(()=>0);let tested=0;
 for(const [index,s] of shapes.entries()){
  const lo=s.center.map((v,i)=>Math.floor((v-s.size[i]/2)/pitch)),hi=s.center.map((v,i)=>Math.ceil((v+s.size[i]/2)/pitch));
  tested+=(hi[0]-lo[0])*(hi[1]-lo[1])*(hi[2]-lo[2]);if(tested>100000)throw Error('Shape sampling is too large. Use larger rods or smaller volumes.');
  for(let x=lo[0];x<hi[0];x++)for(let y=lo[1];y<hi[1];y++)for(let z=lo[2];z<hi[2];z++){const v=[x,y,z];if(insideShape(v.map(n=>(n+.5)*pitch),s)){samples[index]++;if(!cells.has(key(v)))cells.set(key(v),{v,index});}}
 }
 const missed=shapes.filter((_,i)=>!samples[i]);if(missed.length)throw Error('Too small for this rod spacing: '+missed.map(s=>s.name).join(', ')+'. Enlarge the shape or choose shorter rods.');
 if(!cells.size)throw Error('No cells fit these shapes.');
 // Require face-connected volumes. Corner-only contact is not a joined shell.
 const seen=new Set(),pending=[cells.values().next().value.v];while(pending.length){const v=pending.pop(),k=key(v);if(seen.has(k)||!cells.has(k))continue;seen.add(k);for(let axis=0;axis<3;axis++)for(const sign of[-1,1]){const n=[...v];n[axis]+=sign;pending.push(n);}}
 if(seen.size!==cells.size)throw Error('Shapes are disconnected on the stock grid. Move them together or add a connecting volume.');
 const nodes=new Map(),edges=new Map(),faces=[];
 const edge=(a,b,type,index)=>{const k=[key(a),key(b)].sort().join('|');if(edges.has(k))return;edges.set(k,{a,b,type,index});for(const p of[a,b])if(!nodes.has(key(p)))nodes.set(key(p),{v:p,index});};
 for(const {v,index} of cells.values())for(let normal=0;normal<3;normal++)for(const sign of[-1,1]){
  const adjacent=[...v];adjacent[normal]+=sign;if(cells.has(key(adjacent)))continue;
  const axes=[0,1,2].filter(i=>i!==normal),a=[...v];if(sign===1)a[normal]++;
  const b=[...a],c=[...a],d=[...a];b[axes[0]]++;c[axes[0]]++;c[axes[1]]++;d[axes[1]]++;
  faces.push({corners:[a,b,c,d],index});for(const [from,to]of[[a,b],[b,c],[c,d],[d,a]])edge(from,to,rod,index);
  if(braced&&normal!==0)edge(a,c,diagonal,index); // Blue pairs have XY and XZ sockets, not YZ diagonals.
 }
 for(const node of nodes.values())node.axes=new Set();
 for(const {a,b} of edges.values())for(let i=0;i<3;i++)if(a[i]!==b[i]){nodes.get(key(a)).axes.add(i);nodes.get(key(b)).axes.add(i);}
 const total=[...nodes.values()].reduce((sum,n)=>sum+(n.axes.size===3?2:1),edges.size);if(total>2500)throw Error(`This frame needs ${total} parts. Maximum 2500. Use larger rods or smaller shapes.`);
 const positions=[...nodes.values()].map(n=>n.v),min=[0,1,2].map(i=>Math.min(...positions.map(v=>v[i]))*pitch),max=[0,1,2].map(i=>Math.max(...positions.map(v=>v[i]))*pitch);
 return{name,shapes,rod,braced,pitch,nodes,edges,faces,cells:cells.size,total,min,max,size:max.map((n,i)=>n-min[i]),samples,warnings:['Curves and tapers become stepped stock-length surfaces.','XY and XZ faces are braced; YZ diagonal sockets are not available on these connector pairs.','Shape matching does not certify strength or physical stability.']};
}
export function buildShapeFrame(options={}){
 const plan=shapePlan(options),m=emptyModel(plan.name),nodes=new Map(),layers=plan.shapes.map(()=>[]);
 for(const [k,{v,index,axes}]of plan.nodes){
  const paired=axes.size===3,rotation=paired||!axes.has(2)?Q():!axes.has(1)?Q().setFromAxisAngle(V([1,0,0]),Math.PI/2):Q().setFromAxisAngle(V([0,1,0]),Math.PI/2),a=part(paired?'c-blue':'c-white',v.map(n=>n*plan.pitch),rotation.toArray()),pair=[a];m.parts.push(a);layers[index].push(a.id);
  if(paired){const local={parts:[a],links:[]},joined=solve(local,'c-blue',targets(local,'c-blue','interlock')[0],'interlock');m.parts.push(joined.part);m.links.push(joined.link);pair.push(joined.part);layers[index].push(joined.part.id);}nodes.set(k,pair);
 }
 for(const {a,b,type,index}of plan.edges.values()){
  const pairA=nodes.get(key(a)),pairB=nodes.get(key(b)),dir=V(pairB[0].pos).sub(V(pairA[0].pos)).normalize(),socket=(pair,sign)=>pair.flatMap(ports).find(p=>p.kind==='slot'&&!busy(m,p.partId,p.key)&&V(p.dir).dot(dir)*sign>.999999),ap=socket(pairA,1),bp=socket(pairB,-1);
  if(!ap||!bp)throw Error('No real socket available for a surface edge.');
  const r=part(type,V(ap.pos).add(V(bp.pos)).multiplyScalar(.5).toArray(),Q().setFromUnitVectors(V([1,0,0]),dir).toArray()),ends=ports(r);
  if(V(ends[0].pos).distanceTo(V(ap.pos))>1e-6||V(ends[1].pos).distanceTo(V(bp.pos))>1e-6)throw Error('A stock rod does not fit this edge.');
  m.parts.push(r);m.links.push({a:ap.partId,ap:ap.key,b:r.id,bp:'end0',mode:'end'},{a:bp.partId,ap:bp.key,b:r.id,bp:'end1',mode:'end'});layers[index].push(r.id);
 }
 layers.forEach((ids,i)=>{if(ids.length)makeLayer(m,ids,plan.shapes[i].name);});makeGroup(m,m.parts.map(p=>p.id),plan.name);
 if(component(m,m.parts[0].id).size!==m.parts.length)throw Error('Generated shell has disconnected surfaces. Add thickness or fill the hollow volume.');
 if(options.validate!==false)assertClearPlacement(m,new Set(m.parts.map(p=>p.id)));
 return{model:m,plan,nodes};
}
export function airplaneShapes(rod='r-blue'){
 const p=BY_ID[rod].length+2*SOCKET;
 const shape=(name,kind,center,size,extra={})=>({name,kind,center:center.map(v=>v*p),size:size.map(v=>v*p),...extra});
 return[
  shape('Fuselage','ellipsoid',[0,3.5,.5],[14,3,3]),
  shape('Right wing','taper',[-1,2.5,6],[4,1,8],{axis:2,tipScale:.5}),
  shape('Left wing','taper',[-1,2.5,-5],[4,1,8],{axis:2,tipScale:.5,reverse:true}),
  shape('Right tailplane','taper',[5,3.5,4],[2,1,4],{axis:2,tipScale:.5}),
  shape('Left tailplane','taper',[5,3.5,-3],[2,1,4],{axis:2,tipScale:.5,reverse:true}),
  shape('Vertical fin','taper',[5,6,.5],[2,4,1],{axis:1,tipScale:.5}),
  shape('Cockpit','ellipsoid',[-2,5,.5],[4,2,1])
 ];
}
