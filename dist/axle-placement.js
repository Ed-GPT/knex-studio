import {localBores} from './bores.js';
import {BY_ID,definition,solve} from './engine.js';
import {partsOverlap} from './slide-collision.js';
// Search only along the receiving shaft, keeping the chosen connection and orientation.
// Existing parts are never moved. The first clear result is nearest the pointer.
function shaftPlacement(model,type,target,{offset=0,roll=0,portIndex=0,conflicts}={},mode){
 const d=BY_ID[type],host=model.parts.find(p=>p.id===target.partId);if(!host)throw Error('Connection point no longer exists');const rod=d.group==='rods'?d:definition(host),hole=d.group==='rods'?definition(host):d,cap=mode==='side'?Math.max(0,rod.length/2-8):(rod.length-(localBores(hole).find(b=>d.group==='rods'?b.key===target.key:b.key===localBores(hole)[portIndex%localBores(hole).length]?.key)?.thickness||6.3))/2;
 if(!Number.isFinite(cap)||cap<0)throw Error('This rod is too short for the through-hole part.');const preferred=Math.max(-cap,Math.min(cap,offset));
 const blocked=conflicts||((proposal)=>model.parts.filter(p=>p.id!==host.id&&partsOverlap(proposal.part,p)).map(p=>p.id));
 const offsets=[preferred];for(let step=1;step<=Math.ceil(cap*2);step++){if(preferred-step>=-cap)offsets.push(preferred-step);if(preferred+step<=cap)offsets.push(preferred+step);}offsets.push(-cap,cap);let first;
 for(const value of offsets){const next=solve(model,type,target,mode,{offset:value,roll,portIndex});first??=next;if(!blocked(next).length)return next;}return first;
}

export const throughPlacement=(model,type,target,options)=>shaftPlacement(model,type,target,options,'through');
export const sidePlacement=(model,type,target,options)=>shaftPlacement(model,type,target,options,'side');
