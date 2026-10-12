import {buildRadial} from './radial-builder.js';
import {FRAME_ROD_CHOICES,frameDiagonal} from './frame-builder.js';
import {BY_ID,SOCKET,part,emptyModel,V} from './engine.js';
import {equivalent,linkAvailable} from './pattern.js';
import {makeLayer,makeGroup} from './editor-state.js';
// Repeat the Classic 45-degree lattice, sharing complete axis-aligned edges.
// Four cells leave a square opening; no 60-degree sockets or stretched rods.
export function octagonalGridDimensions({kind='oct-frame',counts=[3,2,2],segments=1,rod='r-blue',braced=true,plane='xy'}={}){
 if(!['oct-grid','oct-frame'].includes(kind)||!['xy','xz'].includes(plane)||!FRAME_ROD_CHOICES.includes(rod))throw Error('Choose an octagonal cell grid or frame and Classic stock rods.');
 if(!Array.isArray(counts)||counts.length!==3||counts.some(n=>!Number.isInteger(n)||n<1||n>30)||!Number.isInteger(segments)||segments<1||segments>10)throw Error('Use 1 to 30 cells and 1 to 10 segments per side.');
 const flat=kind==='oct-grid',columns=counts[0],rows=flat?counts[1]:counts[2],levels=flat?0:counts[1],cells=columns*rows,shared=(columns-1)*rows+columns*(rows-1),nodes=8*segments*cells-(segments+1)*shared,edges=8*segments*cells-segments*shared,diagonal=frameDiagonal(rod),braces=!flat&&braced;
 if(braces&&!diagonal)throw Error('This rod size has no stock diagonal. Turn braces off.');
 const total=flat?nodes+edges:2*nodes*(levels+1)+edges*(levels+1)+nodes*levels+(braces?(4*segments*cells-segments*shared)*levels:0),pitch=BY_ID[rod].length+2*SOCKET,cellWidth=segments*pitch*(1+Math.SQRT2);
 if(total>2500)throw Error(`This needs ${total} parts. Maximum 2500; reduce cells, levels or segments.`);
 return{kind,counts,segments,rod,braced:braces,plane,flat,columns,rows,levels,pitch,cellWidth,total,size:flat&&plane==='xy'?[columns*cellWidth,rows*cellWidth,0]:[columns*cellWidth,levels*pitch,rows*cellWidth]};
}
export function buildOctagonalGrid(options={}){
 const d=octagonalGridDimensions(options),m=emptyModel(d.flat?'Generated octagonal cell grid':'Generated octagonal cell frame'),template=buildRadial({kind:d.flat?'ring':'tube',counts:[d.segments,Math.max(1,d.levels),1],rod:d.rod,braced:d.braced,plane:d.plane,sharedNodes:true}).model,buckets=new Map(),links=new Set();
 for(let row=0;row<d.rows;row++)for(let col=0;col<d.columns;col++){
  const shift=d.flat&&d.plane==='xy'?[col*d.cellWidth,row*d.cellWidth,0]:[col*d.cellWidth,0,row*d.cellWidth],mapping=new Map(),fresh=[];
  for(const p of template.parts){const next=part(p.type,V(p.pos).add(V(shift)).toArray(),p.quat),key=p.type+':'+next.pos.map(v=>Math.round(v*1e5)).join(','),bucket=buckets.get(key)||[];let found;
   for(const other of bucket){const ports=equivalent(next,other);if(ports){found={part:other,ports};break;}}
   if(!found){bucket.push(next);buckets.set(key,bucket);m.parts.push(next);fresh.push(next.id);found={part:next,ports:{}};}mapping.set(p.id,found);
  }
  for(const l of template.links){const a=mapping.get(l.a),b=mapping.get(l.b),next={...l,a:a.part.id,b:b.part.id,ap:a.ports[l.ap]||l.ap,bp:b.ports[l.bp]||l.bp},key=next.mode+':'+[next.a+':'+next.ap,next.b+':'+next.bp].sort().join('|');if(links.has(key))continue;if(!linkAvailable(m,next))throw Error('A shared cell socket is already occupied.');m.links.push(next);links.add(key);}
  if(fresh.length)makeLayer(m,fresh,`Cell ${col+1} · ${row+1}`);
 }
 if(m.parts.length!==d.total)throw Error('Octagonal shared-boundary count mismatch.');makeGroup(m,m.parts.map(p=>p.id),d.flat?'Octagonal cell grid':'Octagonal cell frame');return{model:m,dimensions:d};
}
