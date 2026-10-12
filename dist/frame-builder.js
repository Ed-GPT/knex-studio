import {CLASSIC_RIGID_RODS,CLASSIC_ROD_COLORS} from './classic-rods.js';
import {V,Q,BY_ID,SOCKET,part,ports,emptyModel,solve,targets,exportModel,parseModel,busy,definition} from './engine.js';
import {makeGroup,makeLayer} from './editor-state.js';
import {equivalent,linkAvailable} from './pattern.js';
import {partsOverlap} from './slide-collision.js';
export const FRAME_RODS=['r-green','r-white','r-blue','r-yellow','r-red','r-gray'];
export const FRAME_ROD_CHOICES=[...FRAME_RODS,...CLASSIC_RIGID_RODS.map(d=>d.id),...CLASSIC_ROD_COLORS.map(d=>d.id)];
export function frameDiagonal(rod){if(!FRAME_ROD_CHOICES.includes(rod))return undefined;const d=BY_ID[rod];return d.rigidRod?(d.stockIndex===4?'r-rigid-black':undefined):(d.rodVariant&&CLASSIC_ROD_COLORS.find(next=>next.stockIndex===d.stockIndex+1&&next.colorName===d.colorName)?.id||FRAME_RODS[d.stockIndex+1]);}
export const framePanels=rod=>FRAME_ROD_CHOICES.includes(rod)?Object.values(BY_ID).filter(d=>d.panelShape==='square'&&Math.abs(d.pitch-BY_ID[rod].length-2*SOCKET)<1e-6):[];
export function frameDimensions({kind='frame',counts=[3,2,2],rod='r-blue',braced=true,plane='xy',panel=null,openInterior=false,openEnds=false}={}){
 if(!['grid','frame'].includes(kind)||!['xy','xz'].includes(plane)||!FRAME_ROD_CHOICES.includes(rod))throw Error('Choose Classic rods and a grid or frame.');
 if(!Array.isArray(counts)||counts.length!==3||counts.some(n=>!Number.isInteger(n)||n<1||n>30))throw Error('Use 1 to 30 cells along each axis.');
 if(typeof openInterior!=='boolean'||typeof openEnds!=='boolean')throw Error('Open interior must be on or off.');
 openInterior=kind==='frame'&&openInterior;openEnds=openInterior&&openEnds;
 const [x,y,z]=[counts[0],counts[1],kind==='grid'?0:counts[2]],pitch=BY_ID[rod].length+2*SOCKET,diagonal=frameDiagonal(rod);
 if(panel&&!framePanels(rod).some(d=>d.id===panel))throw Error('Choose a square panel that fits this stock rod size.');
 if(panel&&braced)throw Error('Panels and braces use the same diagonal sockets. Choose one.');
 if(braced&&!diagonal)throw Error('This rod size has no matching stock diagonal. Turn braces off.');
 const interior=n=>Math.max(0,n-1),faceNodes=(a,b)=>(a+1)*(b+1)-(openInterior?interior(a)*interior(b):0),nodes=(x+1)*(y+1)*(z+1)-(openInterior?(openEnds?x+1:interior(x))*interior(y)*interior(z):0),edges=x*faceNodes(y,z)+(openEnds?2*(x+1)*(y+z):y*faceNodes(x,z)+z*faceNodes(x,y)),braces=braced?(openInterior?2*x*y+2*x*z:x*y*(z+1)+(kind==='frame'?x*z*(y+1):0)):0,panels=panel?(kind==='grid'?x*y:2*x*y+2*x*z):0,total=nodes*(kind==='frame'?2:1)+edges+braces+panels;
 if(total>2500)throw Error(`This needs ${total} parts. Maximum 2500; reduce the cell counts.`);
 return{kind,counts:[x,y,z],rod,braced,plane,panel,panels,openInterior,openEnds,pitch,diagonal,total,size:(kind==='grid'&&plane==='xz'?[x,0,y]:[x,y,z]).map(n=>n*pitch)};
}
export function buildFrame(options={}){
 const d=frameDimensions(options),[nx,ny,nz]=d.counts,m=emptyModel(d.kind==='grid'?'Generated grid':'Generated frame'),nodes=new Map(),rows=new Map(),rotation=d.kind==='grid'&&d.plane==='xz'?Q().setFromAxisAngle(V([1,0,0]),Math.PI/2):Q();
 const key=(x,y,z)=>`${x},${y},${z}`,row=(y,ids)=>{if(!rows.has(y))rows.set(y,[]);rows.get(y).push(...ids);};
 for(let y=0;y<=ny;y++)for(let z=0;z<=nz;z++)for(let x=0;x<=nx;x++){
  if(d.openInterior&&(d.openEnds||x>0&&x<nx)&&y>0&&y<ny&&z>0&&z<nz)continue;
  const pos=V([x*d.pitch,y*d.pitch,z*d.pitch]).applyQuaternion(rotation).toArray(),a=part(d.kind==='grid'?'c-white':'c-blue',pos,rotation.toArray()),pair=[a];m.parts.push(a);
  if(d.kind==='frame'){const local={parts:[a],links:[]},p=solve(local,'c-blue',targets(local,'c-blue','interlock')[0],'interlock');m.parts.push(p.part);m.links.push(p.link);pair.push(p.part);}
  nodes.set(key(x,y,z),pair);row(y,pair.map(p=>p.id));
 }
 const span=(from,to,type,level)=>{const a=nodes.get(key(...from)),b=nodes.get(key(...to)),direction=V(b[0].pos).sub(V(a[0].pos)).normalize(),ap=a.flatMap(ports).find(p=>p.kind==='slot'&&V(p.dir).dot(direction)>.99999),bp=b.flatMap(ports).find(p=>p.kind==='slot'&&V(p.dir).dot(direction)<-.99999);if(!ap||!bp)throw Error('No real socket for this span.');
  const center=V(ap.pos).add(V(bp.pos)).multiplyScalar(.5),r=part(type,center.toArray(),Q().setFromUnitVectors(V([1,0,0]),direction).toArray()),ends=ports(r);
  if(V(ends[0].pos).distanceTo(V(ap.pos))>.001||V(ends[1].pos).distanceTo(V(bp.pos))>.001)throw Error('The chosen stock rod does not fit this span.');
  m.parts.push(r);m.links.push({a:ap.partId,ap:ap.key,b:r.id,bp:'end0',mode:'end'},{a:bp.partId,ap:bp.key,b:r.id,bp:'end1',mode:'end'});row(level,[r.id]);
 };
 for(let y=0;y<=ny;y++)for(let z=0;z<=nz;z++)for(let x=0;x<=nx;x++){
  if(x<nx&&(!d.openInterior||y===0||y===ny||z===0||z===nz))span([x,y,z],[x+1,y,z],d.rod,y);if(y<ny&&(!d.openInterior||!d.openEnds&&(x===0||x===nx)||z===0||z===nz))span([x,y,z],[x,y+1,z],d.rod,y+1);if(z<nz&&(!d.openInterior||!d.openEnds&&(x===0||x===nx)||y===0||y===ny))span([x,y,z],[x,y,z+1],d.rod,y);
  if(d.braced&&x<nx&&y<ny&&(!d.openInterior||z===0||z===nz))span([x,y,z],[x+1,y+1,z],d.diagonal,y+1);
  if(d.braced&&d.kind==='frame'&&x<nx&&z<nz&&(!d.openInterior||y===0||y===ny))span([x,y,z],[x+1,y,z+1],d.diagonal,y);
 }
 const panelLayers=new Map();
 if(d.panel){
  const face=(x,y,z,plane,name)=>{const xz=plane==='xz',q=rotation.clone().multiply(xz?Q().setFromAxisAngle(V([1,0,0]),Math.PI/2):Q()),center=V([(x+.5)*d.pitch,(y+(xz?0:.5))*d.pitch,(z+(xz?.5:0))*d.pitch]).applyQuaternion(rotation),p=part(d.panel,center.toArray(),q.toArray()),corners=[[x,y,z],[x+1,y,z],[x+1,y+(xz?0:1),z+(xz?1:0)],[x,y+(xz?0:1),z+(xz?1:0)]].flatMap(a=>nodes.get(key(...a))).flatMap(ports),links=[];
   for(const peg of ports(p)){const socket=corners.find(s=>s.kind==='slot'&&!busy(m,s.partId,s.key)&&V(s.pos).distanceTo(V(peg.pos))<1e-6&&V(s.dir).dot(V(peg.dir))<-.999999);if(!socket)throw Error('No free diagonal socket for this panel.');links.push({a:socket.partId,ap:socket.key,b:p.id,bp:peg.key,mode:'end'});}m.parts.push(p);m.links.push(...links);if(!panelLayers.has(name))panelLayers.set(name,[]);panelLayers.get(name).push(p.id);
  };
  for(const z of d.kind==='grid'?[0]:[0,nz])for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)face(x,y,z,'xy',d.kind==='grid'?'Panels':z?'Back panels':'Front panels');
  if(d.kind==='frame')for(const y of [0,ny])for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)face(x,y,z,'xz',y?'Top panels':'Bottom panels');
  m.name=d.kind==='grid'?'Generated paneled grid':'Generated paneled frame';
 }
 if(d.openInterior)m.name=d.openEnds?(d.panel?'Generated paneled tunnel':'Generated open-ended frame'):(d.panel?'Generated paneled shell':'Generated hollow frame');
 for(const [name,ids]of panelLayers)makeLayer(m,ids,name);
 for(const [y,ids]of rows)makeLayer(m,ids,d.kind==='grid'?`Row ${y+1}`:y?`Level ${y}`:'Base');makeGroup(m,m.parts.map(p=>p.id),d.kind==='grid'?'Grid':'Frame');return{model:m,dimensions:d};
}
// Reuse matching parts and preserve their IDs, groups, locks and mass overrides.
// Skip blocked pieces, then omit rods whose required endpoint is unavailable.
export function placeFrame(source,generated,{origin=[0,25,0]}={}){
 if(!Array.isArray(origin)||origin.length!==3||!origin.every(n=>Number.isFinite(n)&&Math.abs(n)<=10000))throw Error('Position must be within 10,000 mm.');
 const model=parseModel(exportModel(source)),incoming=parseModel(exportModel(generated)),map=new Map(),keyMaps=new Map(),fresh=[],stats={added:0,reused:0,skipped:0,links:0},skipped=[];
 const newIds=new Map(incoming.parts.map(p=>[p.id,part(p.type).id]));for(const p of incoming.parts)p.id=newIds.get(p.id);for(const l of incoming.links){l.a=newIds.get(l.a);l.b=newIds.get(l.b);}for(const list of Object.values(incoming.editor||{}))for(const item of list)item.partIds=item.partIds.map(id=>newIds.get(id));
 for(const p of incoming.parts){p.pos=V(p.pos).add(V(origin)).toArray();let match;for(const old of model.parts){const keys=equivalent(p,old);if(keys){match=old;keyMaps.set(p.id,keys);break;}}map.set(p.id,match||p);if(match)stats.reused++;else fresh.push(p);}
 const links=incoming.links.map(l=>({...l,a:map.get(l.a).id,b:map.get(l.b).id,ap:keyMaps.get(l.a)?.[l.ap]||l.ap,bp:keyMaps.get(l.b)?.[l.bp]||l.bp})),kept=new Set(fresh.map(p=>p.id)),fixedIds=new Set(model.parts.map(p=>p.id));
 const incident=new Map();for(const l of links)for(const id of[l.a,l.b]){if(!incident.has(id))incident.set(id,[]);incident.get(id).push(l);}
 const planned=(a,b)=>(incident.get(a)||[]).find(l=>l.a===b||l.b===b),radius=p=>{const d=definition(p);return p.path?Math.max(...p.path.map(v=>V(v).length()))+30:Math.max(d.length||0,d.diameter||0,d.motor?130:0,d.bodyDims?Math.hypot(...d.bodyDims):0)/2+30;};
 const available=l=>linkAvailable(model,l)||model.links.some(k=>k.mode===l.mode&&((k.a===l.a&&k.ap===l.ap&&k.b===l.b&&k.bp===l.bp)||(k.b===l.a&&k.bp===l.ap&&k.a===l.b&&k.ap===l.bp)));
 const nodeIds=id=>new Set([id,...(incident.get(id)||[]).filter(l=>l.mode==='interlock').map(l=>l.a===id?l.b:l.a)]);
 const clearPair=(p,old)=>{const l=planned(p.id,old.id);if(l&&available(l))return true;
  const a=nodeIds(p.id),b=nodeIds(old.id);for(const id of a)for(const edge of incident.get(id)||[]){if(!available(edge))continue;const other=edge.a===id?edge.b:edge.a;if(b.has(other))return true;
   // Neighbouring hubs joined by a short stock rod can touch the conservative
   // connector bounds. Exempt only the designed, available two-end connection.
   if(edge.mode==='end'&&definition(p).group==='connectors'&&definition(old).group==='connectors'&&(incident.get(other)||[]).some(k=>k!==edge&&k.mode==='end'&&available(k)&&(b.has(k.a)||b.has(k.b))))return true;
  }return false;
 };
 for(const p of fresh)for(const old of model.parts){if(V(p.pos).distanceToSquared(V(old.pos))>(radius(p)+radius(old))**2||clearPair(p,old))continue;if(partsOverlap(p,old)){kept.delete(p.id);break;}}
 let changed=true;while(changed){changed=false;for(const p of fresh){if(!kept.has(p.id))continue;const required=(incident.get(p.id)||[]).filter(l=>definition(p).group==='rods'||definition(p).panel||l.mode==='interlock');const isolated=definition(p).group==='connectors'&&![...nodeIds(p.id)].some(id=>(incident.get(id)||[]).some(l=>l.mode==='end'&&(kept.has(l.a===id?l.b:l.a)||fixedIds.has(l.a===id?l.b:l.a))&&available(l)));if(isolated||required.some(l=>{const other=l.a===p.id?l.b:l.a,key=l.a===other?l.ap:l.bp;return (!kept.has(other)&&!fixedIds.has(other))||(fixedIds.has(other)&&busy(model,other,key)&&!model.links.some(k=>k.mode===l.mode&&((k.a===l.a&&k.ap===l.ap&&k.b===l.b&&k.bp===l.bp)||(k.b===l.a&&k.bp===l.ap&&k.a===l.b&&k.ap===l.bp))));})){kept.delete(p.id);changed=true;}}}
 const added=fresh.filter(p=>kept.has(p.id));if(model.parts.length+added.length>2500)throw Error('Maximum 2500 parts. Reduce the generated size.');model.parts.push(...added);const valid=new Set(model.parts.map(p=>p.id));for(const l of links)if(valid.has(l.a)&&valid.has(l.b)&&linkAvailable(model,l)){model.links.push(l);stats.links++;}
 for(const p of fresh)if(!kept.has(p.id))skipped.push(p);stats.added=added.length;stats.skipped=skipped.length;
 if(added.length){makeGroup(model,added.map(p=>p.id),generated.name.replace(/^Generated /,'').replace(/^./,c=>c.toUpperCase()));for(const layer of incoming.editor?.layers||[]){const ids=layer.partIds.map(id=>map.get(id).id).filter(id=>kept.has(id));if(ids.length)makeLayer(model,ids,layer.name);}}
 return{model,stats,added,skipped,reused:incoming.parts.filter(p=>fixedIds.has(map.get(p.id).id)).map(p=>map.get(p.id))};
}
