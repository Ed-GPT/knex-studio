import {V,Q,part,emptyModel,targets,solve,add} from './engine.js';
import {makeGroup,makeLayer} from './editor-state.js';
// Original comparison fixture, held in space. The open-center wheel is driven;
// the blind bearing wheel on the same axle stays mechanically independent.
export function smallWheelBench(){
 const m=emptyModel('Small wheels · grip and spin'),motor=part('m-blue',[0,65,0]);motor.grounded=true;m.parts.push(motor);
 const attach=(type,host,mode,options={},key)=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id&&(!key||t.key===key)),mode,options));
 const rod=attach('r-red',motor,'through'),open=attach('w-small-open',rod,'through',{offset:42}),closed=attach('w-small-closed',rod,'end',{},'end0');
 const support=attach('c-gray',rod,'through',{offset:22});support.grounded=true;
 const key=attach('k-tan',open,'keyed');
 makeGroup(m,[motor.id,support.id],'Locked fixture');makeLayer(m,[motor.id,support.id],'Fixture');makeGroup(m,[rod.id,open.id,key.id],'Friction-fit drive');makeLayer(m,[rod.id,open.id,key.id],'Driven wheel');makeLayer(m,[closed.id],'Free end bearing');return m;
}
