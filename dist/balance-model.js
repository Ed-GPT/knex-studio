import {emptyModel,part,targets,solve,add} from './engine.js';
import {makeGroup,makeLayer} from './editor-state.js';
import {placeOnFloor} from './stability.js';
export function balanceModel(){const m=emptyModel('Counterweighted crane · balance test'),base=part('c-white',[0,20,0]);m.parts.push(base);const attach=(type,host,mode,key,options={})=>{const target=targets(m,type,mode).find(t=>t.partId===host.id&&(!key||t.key===key));if(!target)throw Error('Missing crane connection');return add(m,solve(m,type,target,mode,options));};
 const feet=[];for(const key of['slot0','slot4']){const rod=attach('r-blue',base,'end',key),foot=attach('c-white',rod,'end','end1',{portIndex:key==='slot0'?4:0});feet.push(foot);}
 for(const foot of feet){const axle=attach('r-red',foot,'through');for(const offset of[-55,55])attach('c-white',axle,'through',null,{offset});}
 const supportIds=m.parts.map(p=>p.id),upright=attach('r-red',base,'end','slot2'),top=attach('c-white',upright,'end','end1',{portIndex:6}),boom=attach('r-gray',top,'end','slot0'),tip=attach('c-white',boom,'end','end1',{portIndex:4});
 const payload=attach('m-blue',tip,'mount','motor-mount'),counterweight=attach('m-blue',feet[1],'mount','motor-mount');
 makeLayer(m,supportIds,'Base');makeGroup(m,supportIds,'Support frame');const structure=m.parts.filter(p=>!supportIds.includes(p.id)&&p.id!==payload.id&&p.id!==counterweight.id).map(p=>p.id);makeLayer(m,structure,'Boom');makeGroup(m,structure,'Boom');for(const[p,label]of[[payload,'Payload'],[counterweight,'Counterweight']]){makeLayer(m,[p.id],label);makeGroup(m,[p.id],label);}placeOnFloor(m,new Set(m.parts.map(p=>p.id)));return m;
}
