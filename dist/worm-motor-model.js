import {part,emptyModel,targets,solve,add,V,Q} from './engine.js';
export function wormReductionModel(){
 const m=emptyModel('12 V reduction bench'),motor=part('m-12v',[0,85,0]);m.parts.push(motor);
 const attach=(type,host,mode,options={},key)=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id&&(!key||t.key===key)),mode,options));
 for(const key of['hole0','hole1']){const mount=attach('r-blue',motor,'through',{},key);for(const end of['end0','end1'])attach('c-gray',mount,'end',{},end);}
 const gear=attach('g-12v',motor,'worm'),rod=attach('r-gray',gear,'through'),clip=attach('k-tan',rod,'through',{offset:-6.35});m.links.push({a:clip.id,ap:'key',b:gear.id,bp:'key',mode:'keyed'});
 for(const offset of[-68,68])attach('c-gray',rod,'through',{offset,roll:90});
 const key=attach('k-tan',rod,'through',{offset:40}),pinion=attach('g-blue14',key,'keyed');m.links.push({a:rod.id,ap:'shaft',b:pinion.id,bp:'hole',mode:'through',offset:46.35});
 const output=attach('g-yellow82',pinion,'mesh'),out=attach('r-red',output,'through'),outKey=attach('k-tan',out,'through',{offset:-6.35});outKey.quat=[...output.quat];m.links.push({a:outKey.id,ap:'key',b:output.id,bp:'key',mode:'keyed'});
 for(const offset of[-42,42])attach('c-gray',out,'through',{offset,roll:90});const view=Q().setFromAxisAngle(V([0,1,0]),Math.PI);for(const p of m.parts){p.pos=V(p.pos).applyQuaternion(view).toArray();p.quat=view.clone().multiply(Q(p.quat)).toArray();}return m;
}
