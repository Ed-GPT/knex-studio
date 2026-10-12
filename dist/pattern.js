import {copyPath} from './flexible-parts.js';
import {V,Q,definition,ports,SOCKET,part,exportModel,parseModel,autoLinks,busy} from './engine.js';
import {makeGroup,layerFor,editorState} from './editor-state.js';
import {makePart} from './geometry.js';
import {Box3} from './vendor/three.module.js';
import {partsOverlap} from './slide-collision.js';
import {copyMass} from './mass.js';
const tolerance=.1;
export function sectionSpacing(model,ids,axis){const chosen=new Set(ids),parts=model.parts.filter(p=>chosen.has(p.id)),direction=V(axis).normalize(),points=[];if(!parts.length)throw Error('Select a section first.');for(const p of parts){const d=definition(p);if(d.group==='rods')for(const end of ports(p))points.push(V(end.pos).addScaledVector(V(end.dir),SOCKET));else if(d.group==='connectors')points.push(V(p.pos));}
 const span=ps=>{const values=ps.map(p=>p.dot(direction));return Math.max(...values)-Math.min(...values);};if(points.length>1&&span(points)>.1)return span(points);
 const corners=[];for(const p of parts){const g=makePart(p.type,p);g.position.fromArray(p.pos);g.quaternion.fromArray(p.quat);const b=new Box3().setFromObject(g);for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z])corners.push(V([x,y,z]));}return Math.max(.1,span(corners));
}
// Match socket positions as well as pose. Symmetric white connectors can share
// a boundary even when their stored rotations differ; preserve existing IDs.
export function equivalent(a,b){if(JSON.stringify(a.belt)!==JSON.stringify(b.belt)||JSON.stringify(a.path)!==JSON.stringify(b.path))return null;if(a.type!==b.type||V(a.pos).distanceTo(V(b.pos))>tolerance)return null;const ap=ports(a),bp=ports(b),map={};if(1-Math.abs(Q(a.quat).dot(Q(b.quat)))<1e-8)return Object.fromEntries(ap.map(p=>[p.key,p.key]));const d=definition(a);if(d.interlock||!['rods','connectors'].includes(d.group)||ap.length!==bp.length)return null;for(const p of ap){const q=bp.find(q=>V(p.pos).distanceTo(V(q.pos))<tolerance&&V(p.dir).dot(V(q.dir))>.9999);if(!q)return null;map[p.key]=q.key;}return map;}
export function linkAvailable(m,l){const same=m.links.some(x=>x.mode===l.mode&&((x.a===l.a&&x.ap===l.ap&&x.b===l.b&&x.bp===l.bp)||(x.b===l.a&&x.bp===l.ap&&x.a===l.b&&x.ap===l.bp)));if(same)return false;return [ [l.a,l.ap],[l.b,l.bp] ].every(([id,key])=>['shaft','teeth'].includes(key)||!busy(m,id,key));}
export function repeatPattern(source,{ids,copies=1,delta,angle=0,axis=[0,1,0]}={}){
 if(!Number.isInteger(copies)||copies<1||copies>50)throw Error('Choose 1 to 50 copies.');if(!ids?.length)throw Error('Select at least one part for the section.');if(!Array.isArray(delta)||delta.length!==3||!delta.every(Number.isFinite)||V(delta).length()>10000||!Number.isFinite(angle)||Math.abs(angle)>360)throw Error('Enter a valid spacing and rotation.');if(V(delta).length()<.01&&Math.abs(angle)<.01)throw Error('Set a spacing or rotation so the copies do not overlap.');
 const model=parseModel(exportModel(source)),chosen=new Set(ids),section=source.parts.filter(p=>chosen.has(p.id));if(section.length!==chosen.size)throw Error('The selected section changed.');const internal=source.links.filter(l=>chosen.has(l.a)&&chosen.has(l.b)),origin=V(section[0].pos),stats={added:0,reused:0,skipped:0,links:0},steps=[];
 for(let n=1;n<=copies;n++){const q=Q().setFromAxisAngle(V(axis).normalize(),n*angle*Math.PI/180),shift=V(delta).multiplyScalar(n),map=new Map(),newParts=[],reuse=new Map();
  for(const p of section){const next=part(p.type,V(p.pos).sub(origin).applyQuaternion(q).add(origin).add(shift).toArray(),q.clone().multiply(Q(p.quat)).toArray());copyMass(p,next);copyPath(p,next);let match=null,keys=null;for(const existing of model.parts){const result=equivalent(next,existing);if(result){match=existing;keys=result;break;}}map.set(p.id,match||next);if(match){reuse.set(p.id,{keys,flip:definition(p).group==='rods'&&V([1,0,0]).applyQuaternion(Q(next.quat)).dot(V([1,0,0]).applyQuaternion(Q(match.quat)))<0});stats.reused++;}else newParts.push(next);}
  const remapped=internal.map(l=>{const a=map.get(l.a),b=map.get(l.b),out={...l,a:a.id,b:b.id,ap:reuse.get(l.a)?.keys[l.ap]||l.ap,bp:reuse.get(l.b)?.keys[l.bp]||l.bp};if(out.offset!==undefined&&(reuse.get(l.a)?.flip||reuse.get(l.b)?.flip))out.offset=-out.offset;return out;});
  const intended=(a,b)=>remapped.find(l=>(l.a===a.id&&l.b===b.id)||(l.a===b.id&&l.b===a.id));
  const kept=[];for(const candidate of newParts){const obstacles=model.parts.filter(other=>{const link=intended(candidate,other);if(link&&linkAvailable(model,link))return false;const snapped=autoLinks({...model,parts:[other]},candidate);if(snapped.length)return false;return true;});if(obstacles.some(other=>partsOverlap(candidate,other))){stats.skipped++;continue;}if(model.parts.length+kept.length>=2500)throw Error('Maximum 2500 parts per model.');kept.push(candidate);}
  const valid=new Set([...model.parts,...kept].map(p=>p.id));model.parts.push(...kept);const oldLinks=model.links.length;for(const link of remapped)if(valid.has(link.a)&&valid.has(link.b)&&link.a!==link.b&&linkAvailable(model,link))model.links.push(link);for(const p of kept)model.links.push(...autoLinks(model,p));stats.links+=model.links.length-oldLinks;stats.added+=kept.length;
  if(kept.length){const nextNumber=1+Math.max(0,...editorState(model).groups.map(g=>Number(g.name.match(/^Repeat (\d+)$/)?.[1]||0)));makeGroup(model,kept.map(p=>p.id),'Repeat '+nextNumber);for(const original of section){const next=map.get(original.id);if(!kept.includes(next))continue;const layer=layerFor(model,original.id);if(layer)layer.partIds.push(next.id);}if(model.controller)model.controller.push(...(source.controller||[]).filter(c=>map.has(c.motorId)&&kept.includes(map.get(c.motorId))).map(c=>({...c,motorId:map.get(c.motorId).id})));}
  steps.push({ids:[...map.values()].filter(p=>valid.has(p.id)).map(p=>p.id),added:kept.map(p=>p.id)});
 }
 return{model,stats,steps};
}
