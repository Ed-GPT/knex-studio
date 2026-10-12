import {V,Q,part,emptyModel,targets,solve,add} from './engine.js';
import {fitBelt} from './belt-drive.js';
import {makeGroup,makeLayer} from './editor-state.js';
export function pulleyDriveModel({inputType='h-small',outputType='h-medium'}={}){
 let m=emptyModel('Pulley reduction drive');const motor=part('m-blue',[0,80,0]);motor.grounded=true;m.parts.push(motor);
 const attach=(type,host,mode,options={})=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id),mode,options));
 const input=attach('r-red',motor,'through'),inKey=attach('k-tan',input,'through',{offset:38}),small=attach(inputType,inKey,'keyed');m.links.push({a:input.id,ap:'shaft',b:small.id,bp:'hole',mode:'through',offset:small.pos[2]});
 const large=part(outputType,[140,80,small.pos[2]]);m.parts.push(large);const output=attach('r-red',large,'through'),outKey=attach('k-tan',large,'keyed');
 for(const offset of[-42,-20]){const p=attach('c-gray',output,'through',{offset});p.grounded=true;}
 m=fitBelt(m,small.id,large.id).model;makeLayer(m,m.parts.filter(p=>p.grounded).map(p=>p.id),'Locked fixture');makeGroup(m,[input.id,inKey.id,small.id],'Input pulley');makeLayer(m,[input.id,inKey.id,small.id],'Input');makeGroup(m,[output.id,outKey.id,large.id],'Output pulley');makeLayer(m,[output.id,outKey.id,large.id],'Output');makeLayer(m,[m.parts.find(p=>p.belt).id],'Rubber band');return m;
}

// Separate keyed drive and freely rotating tyre fixture show all three variants.
export function pulleyVariantBench(){
 const m=pulleyDriveModel({inputType:'h-small-white',outputType:'h-medium-gray'});m.name='Pulley colors & fits';
 const hub=part('h-small-gray',[70,170,40]);m.parts.push(hub);
 const attach=(type,host,mode,options={})=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id),mode,options));
 const rod=attach('r-red',hub,'through');rod.grounded=true;attach('t-small',hub,'tire');
 makeLayer(m,[rod.id],'Locked tyre axle');makeGroup(m,[hub.id,m.parts.at(-1).id],'Free tyre');makeLayer(m,[hub.id,m.parts.at(-1).id],'Gray pulley & small tyre');return m;
}
