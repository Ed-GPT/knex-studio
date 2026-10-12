import {V,Q,part,emptyModel,targets,solve,add} from './engine.js';
import {fitBelt} from './belt-drive.js';
import {makeGroup,makeLayer} from './editor-state.js';
export function pulleyDriveModel(){
 let m=emptyModel('Pulley reduction drive');const motor=part('m-blue',[0,80,0]);motor.grounded=true;m.parts.push(motor);
 const attach=(type,host,mode,options={})=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id),mode,options));
 const input=attach('r-red',motor,'through'),inKey=attach('k-tan',input,'through',{offset:38}),small=attach('h-small',inKey,'keyed');m.links.push({a:input.id,ap:'shaft',b:small.id,bp:'hole',mode:'through',offset:small.pos[2]});
 const large=part('h-medium',[140,80,small.pos[2]]);m.parts.push(large);const output=attach('r-red',large,'through'),outKey=attach('k-tan',large,'keyed');m.links.push({a:output.id,ap:'shaft',b:outKey.id,bp:'hole',mode:'through',locked:true,offset:V(outKey.pos).sub(V(output.pos)).dot(V([1,0,0]).applyQuaternion(Q(output.quat)))});
 for(const offset of[-42,-20]){const p=attach('c-gray',output,'through',{offset});p.grounded=true;}
 m=fitBelt(m,small.id,large.id).model;makeLayer(m,m.parts.filter(p=>p.grounded).map(p=>p.id),'Locked fixture');makeGroup(m,[input.id,inKey.id,small.id],'Input pulley');makeLayer(m,[input.id,inKey.id,small.id],'Input');makeGroup(m,[output.id,outKey.id,large.id],'Output pulley');makeLayer(m,[output.id,outKey.id,large.id],'Output');makeLayer(m,[m.parts.find(p=>p.belt).id],'Rubber band');return m;
}
