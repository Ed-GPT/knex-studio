import {part,emptyModel,targets,solve,add} from './engine.js';
export function springFan(){const m=emptyModel('Spring motor fan'),motor=part('m-spring',[0,110,0]);m.parts.push(motor);
 for(const key of['hole0','hole2']){const support=add(m,solve(m,'r-white',targets(m,'r-white','through').find(t=>t.partId===motor.id&&t.key===key),'through',{offset:-6.3}));for(let i=0;i<2;i++)add(m,solve(m,'c-gray',targets(m,'c-gray','end').find(t=>t.partId===support.id&&t.key==='end'+i),'end'));}
 const axle=add(m,solve(m,'r-red',targets(m,'r-red','through').find(t=>t.partId===motor.id&&t.key==='hole'),'through'));
 const clip=add(m,solve(m,'k-tan',targets(m,'k-tan','through').find(t=>t.partId===axle.id),'through',{offset:35}));const hub=add(m,solve(m,'c-white',targets(m,'c-white','keyed').find(t=>t.partId===clip.id),'keyed'));m.links.push({a:axle.id,ap:'shaft',b:hub.id,bp:'hole',mode:'through',offset:41.35});
 for(const i of[0,2,4,6])add(m,solve(m,'r-blue',targets(m,'r-blue','end').find(t=>t.partId===hub.id&&t.key==='slot'+i),'end'));
 return m;
}
