import {part,emptyModel,targets,solve,add,definition} from './engine.js';
export function tetheredBench(type='m-tethered-red'){
 if(!['m-tethered-red','m-tethered-gray'].includes(type))throw Error('Choose a referenced tethered motor.');
 const m=emptyModel('Tethered motor · two outputs'),motor=part(type,[0,140,0]);motor.grounded=true;m.parts.push(motor);
 const mount=(type,host,mode,key,options={})=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id&&(!key||t.key===key)),mode,options));
 for(const key of ['mount0','mount1']){const rod=mount('r-blue',motor,'through',key);rod.grounded=true;for(const end of ['end0','end1']){const support=mount('c-gray',rod,'end',end);support.grounded=true;}}
 for(const [mode,key,type,offset]of[['through','hole','r-red',35],['end','drive-end','r-blue',10]]){const axle=mount(type,motor,mode,key),clip=mount('k-tan',axle,'through',null,{offset}),hub=mount('c-white',clip,'keyed');for(const key of ['slot2','slot6'])mount('r-white',hub,'end',key);}
 return m;
}
