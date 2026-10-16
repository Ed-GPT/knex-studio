import {randomUUID} from 'node:crypto';
import {CATALOG,BY_ID,emptyModel,part,add,solve,targets,ports,borePorts,busy,component,moveAssembly,exportModel,parseModel,V,Q} from '../dist/engine.js';
import {assertClearPlacement,assertClearMotion,createInterferenceGuard} from '../dist/interference.js';
import {repeatPattern} from '../dist/pattern.js';

const clone=m=>parseModel(exportModel(m));
export class BuildWorkspace {
 constructor(){this.builds=new Map();this.published=null;this.sequence=0;}
 get(id){const b=this.builds.get(id);if(!b)throw Error('Unknown build. Use create_build first.');return b;}
 check(id,revision){const b=this.get(id);if(b.revision!==revision)throw Error(`Revision conflict: current revision is ${b.revision}. Inspect the build and retry.`);return b;}
 create(name){if(this.builds.size>=16)throw Error('This session supports 16 builds. Restart the server for another session; published files remain saved.');const id=randomUUID(),b={id,revision:0,model:emptyModel(name),aliases:{},history:[]};this.builds.set(id,b);return this.summary(b);}
 adopt(model){const m=clone(model);if(!m.parts.length||m.parts.length>2500)throw Error('Generated build must contain 1 to 2500 parts.');if(component(m,m.parts[0].id).size!==m.parts.length)throw Error('Generated build is disconnected.');assertClearPlacement(m,new Set(m.parts.map(p=>p.id)));const created=this.create(m.name),b=this.get(created.buildId);b.history.push({model:b.model,aliases:b.aliases});b.model=m;b.revision=1;return this.summary(b);}
 resolve(b,ref){const id=Object.hasOwn(b.aliases,ref)?b.aliases[ref]:ref;if(!b.model.parts.some(p=>p.id===id))throw Error(`Unknown part: ${ref}`);return id;}
 summary(b){return {buildId:b.id,name:b.model.name,revision:b.revision,parts:b.model.parts.length,connections:b.model.links.length,aliases:{...b.aliases}};}
 catalog({query='',group,offset=0,limit=25}={}){const rows=CATALOG.filter(d=>!d.legacy&&(!group||d.group===group)&&(!query||`${d.id} ${d.name} ${d.partNumber||''}`.toLowerCase().includes(query.toLowerCase())));return {total:rows.length,offset,parts:rows.slice(offset,offset+limit).map(d=>({type:d.id,name:d.name,group:d.group,color:d.color,partNumber:d.partNumber||null,reference:d.reference||null,nominalMm:d.nominal||null,modeledLengthMm:d.length||null,dimensions:'Reconstructed geometry; not certified manufacturing dimensions.'}))};}
 inspect(id,{offset=0,limit=100,partRef}={}){const b=this.get(id),selected=partRef?[b.model.parts.find(p=>p.id===this.resolve(b,partRef))]:b.model.parts.slice(offset,offset+limit);return {...this.summary(b),items:selected.map(p=>({...p,ports:[...ports(p),...borePorts(p)].map(t=>({...t,occupied:busy(b.model,p.id,t.key)}))})),links:b.model.links.filter(l=>selected.some(p=>p.id===l.a||p.id===l.b))};}
 targets(id,{type,mode,host,offset=0,limit=50}){const b=this.get(id);if(!BY_ID[type]||BY_ID[type].legacy)throw Error('Choose a real supported catalog type.');const hostId=host?this.resolve(b,host):null,all=targets(b.model,type,mode).filter(t=>!hostId||t.partId===hostId);return {revision:b.revision,total:all.length,targets:all.slice(offset,offset+limit)};}
 edit(id,revision,commands){const original=this.check(id,revision),b={...original,model:clone(original.model),aliases:{...original.aliases}},added=[];
  const alias=(name,p)=>{if(name){if(Object.hasOwn(b.aliases,name))throw Error('Alias already exists: '+name);b.aliases[name]=p.id;}added.push(p.id);};
  for(const c of commands){
   if(['place','attach'].includes(c.op)){
    const d=BY_ID[c.type];if(!d||d.legacy)throw Error('Unknown or legacy placeholder part: '+c.type);
    if(d.tubing||d.belt||d.flexi)throw Error('Flexible path construction is not exposed in this MCP version. Choose a rigid catalog part.');
    if(c.op==='place'){const p=part(c.type,c.position,c.quaternion);if(Math.abs(Q(p.quat).length()-1)>.001)throw Error('Quaternion must have unit length.');add(b.model,{part:p});alias(c.alias,p);}
    else {const host=this.resolve(b,c.host),t=targets(b.model,c.type,c.mode).find(t=>t.partId===host&&t.key===c.socket);if(!t)throw Error('Socket is occupied or incompatible. Use connection_targets to inspect legal targets.');const proposal=solve(b.model,c.type,t,c.mode,{roll:c.roll??0,offset:c.offset??0,portIndex:c.portIndex??0});alias(c.alias,add(b.model,proposal));}
   }else if(c.op==='lock'){b.model.parts.find(p=>p.id===this.resolve(b,c.part)).grounded=c.locked;}
   else if(c.op==='translate'){const id=this.resolve(b,c.part),before=clone(b.model),ids=component(b.model,id);moveAssembly(b.model,id,c.delta);assertClearMotion(before,b.model,ids);}
   else if(c.op==='remove'){const id=this.resolve(b,c.part);b.model.parts=b.model.parts.filter(p=>p.id!==id);b.model.links=b.model.links.filter(l=>l.a!==id&&l.b!==id);for(const [key,value] of Object.entries(b.aliases))if(value===id)delete b.aliases[key];}
   else if(c.op==='repeat'){const ids=c.parts.map(p=>this.resolve(b,p)),result=repeatPattern(b.model,{ids,copies:c.copies,delta:c.delta,angle:c.angle??0,axis:c.axis??[0,1,0]});b.model=result.model;}
   else throw Error('Unknown edit operation.');
   if(b.model.parts.length>2500)throw Error('Maximum 2500 parts.');
  }
  b.model=clone(b.model);assertClearPlacement(b.model,new Set(b.model.parts.map(p=>p.id)));
  original.history.push({model:original.model,aliases:original.aliases});if(original.history.length>40)original.history.shift();original.model=b.model;original.aliases=b.aliases;original.revision++;
  return {...this.summary(original),added};
 }
 undo(id,revision){const b=this.check(id,revision),previous=b.history.pop();if(!previous)throw Error('No edit to undo.');b.model=previous.model;b.aliases=previous.aliases;b.revision++;return this.summary(b);}
 validate(id){const b=this.get(id),m=clone(b.model),remaining=new Set(m.parts.map(p=>p.id)),components=[];while(remaining.size){const ids=component(m,remaining.values().next().value);for(const id of ids)remaining.delete(id);components.push([...ids]);}const collisions=createInterferenceGuard(m).check({all:true});return {...this.summary(b),valid:!collisions.length&&m.parts.length>0,connected:components.length===1,components,collisions:collisions.slice(0,50),collisionCount:collisions.length,warnings:['Checks use approximate modeled geometry and fitted-pair exemptions.','A connected build is not a guarantee of strength, balance or flight.']};}
 publish(id,revision){const b=this.check(id,revision),report=this.validate(id);if(!report.valid||!report.connected)throw Error(`Cannot publish: ${report.collisionCount} collisions and ${report.components.length} disconnected assemblies. Inspect and repair the draft.`);const snapshot={sequence:++this.sequence,buildId:id,revision,name:b.model.name,model:JSON.parse(exportModel(b.model))};this.published=snapshot;return snapshot;}
}
