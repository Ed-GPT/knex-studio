import {V,Q,part,emptyModel,targets,solve,add} from './engine.js';
import {makeGroup,makeLayer} from './editor-state.js';
export const HINGE_REFERENCE='https://www.knexusergroup.org.uk/en/knex-hint-A8.html';
export function classicHingeModel(){
 const m=emptyModel('Classic molded double hinge'),base=part('hinge-blue',[90,300,0]);m.parts.push(base);
 const attach=(type,host,mode,options={})=>{const target=targets(m,type,mode).find(t=>t.partId===host.id);if(!target)throw Error('Missing classic clip connection.');return add(m,solve(m,type,target,mode,options));};
 const support=attach('r-white',base,'end');attach('c-gray',support,'end');const fixed=m.parts.map(p=>p.id);m.parts.forEach(p=>p.grounded=true);makeGroup(m,fixed,'Locked fixture');makeLayer(m,fixed,'Locked fixture');
 const black=attach('hinge-black',base,'hinge'),arm=attach('r-red',black,'end'),middle=attach('hinge-blue',arm,'end'),upper=m.parts.filter(p=>!fixed.includes(p.id)).map(p=>p.id);makeGroup(m,upper,'First arm');makeLayer(m,upper,'First arm');
 const green=attach('hinge-green',middle,'hinge'),lower=attach('r-blue',green,'end');attach('clip-blue',lower,'end');const lowerIds=m.parts.filter(p=>!fixed.includes(p.id)&&!upper.includes(p.id)).map(p=>p.id);makeGroup(m,lowerIds,'Second arm');makeLayer(m,lowerIds,'Second arm');return m;
}
export function classicClipBench(){const m=classicHingeModel();m.name='Classic clips and hinge halves';const rod=part('r-blue',[200,80,0]);m.parts.push(rod);for(const type of ['clip-blue','clip-bronze'])add(m,solve(m,type,targets(m,type,'end').find(t=>t.partId===rod.id),'end'));makeGroup(m,m.parts.slice(-3).map(p=>p.id),'Rod-end stops');const capped=part('r-white',[200,130,0]);m.parts.push(capped);for(const type of ['k-cap','cap-sleeve-black'])add(m,solve(m,type,targets(m,type,'end').find(t=>t.partId===capped.id),'end'));makeGroup(m,m.parts.slice(-3).map(p=>p.id),'Alternative end caps');return m;}

export function yClipBench(){
 const m=emptyModel('Classic Y clips · side grip and rod end');
 const variants=['black','blue','fluor-green','fluor-orange','gold','green','gray','mid-blue','red','silver'];
 for(const [i,key] of variants.entries()){
  const start=m.parts.length,rod=part('r-blue',[(i%5)*95,25,Math.floor(i/5)*100]);m.parts.push(rod);
  const clip=add(m,solve(m,'y-'+key,targets(m,'y-'+key,'side').find(t=>t.partId===rod.id),'side'));
  add(m,solve(m,'c-gray',targets(m,'c-gray','end').find(t=>t.partId===clip.id),'end'));
  makeGroup(m,m.parts.slice(start).map(p=>p.id),key.replaceAll('-',' ')+' clip assembly');
 }
 return m;
}

export const BALL_REFERENCE='https://www.knexusergroup.org.uk/en/knex-hint-A9.html';
export function ballJointModel(){
 const m=emptyModel('Classic ball joints · spatial pendulum'),base=part('socket-small',[100,300,0]);m.parts.push(base);
 const attach=(type,host,mode)=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id),mode));
 const support=attach('r-white',base,'end');attach('c-gray',support,'end');const fixed=m.parts.map(p=>p.id);m.parts.forEach(p=>p.grounded=true);makeGroup(m,fixed,'Locked fixture');makeLayer(m,fixed,'Locked fixture');
 const ball=attach('ball-small',base,'ball'),rod=attach('r-red',ball,'end');attach('socket-large',rod,'end');const upper=m.parts.filter(p=>!fixed.includes(p.id)).map(p=>p.id);makeGroup(m,upper,'First arm');makeLayer(m,upper,'First arm');
 const large=attach('ball-large',m.parts.at(-1),'ball'),tip=attach('r-blue',large,'end');attach('clip-blue',tip,'end');const lower=m.parts.filter(p=>!fixed.includes(p.id)&&!upper.includes(p.id)).map(p=>p.id);makeGroup(m,lower,'Second arm');makeLayer(m,lower,'Second arm');return m;
}

export const ANGLED_REFERENCE='https://www.knexusergroup.org.uk/en/knex-hint-A15.html';
export function angledSupportModel(){
 const m=emptyModel('Splayed support · original angled clips'),hub=part('c-white',[0,150,0],Q().setFromAxisAngle(V([1,0,0]),Math.PI/2).toArray());m.parts.push(hub);
 for(const i of [0,2,4,6]){const start=m.parts.length,clip=add(m,solve(m,'clip-angled',targets(m,'clip-angled','wedge').find(t=>t.partId===hub.id&&t.key===`recess${i}f`),'wedge')),rod=add(m,solve(m,'r-red',targets(m,'r-red','end').find(t=>t.partId===clip.id),'end'));add(m,solve(m,'c-gray',targets(m,'c-gray','end').find(t=>t.partId===rod.id),'end'));makeGroup(m,m.parts.slice(start).map(p=>p.id),`Leg ${i/2+1}`);}
 const min=Math.min(...m.parts.map(p=>p.pos[1]));for(const p of m.parts)p.pos[1]+=12-min;makeLayer(m,[hub.id],'Hub');makeLayer(m,m.parts.slice(1).map(p=>p.id),'Splayed legs');return m;
}
