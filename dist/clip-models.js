import {part,emptyModel,targets,solve,add} from './engine.js';
import {makeGroup,makeLayer} from './editor-state.js';
export const HINGE_REFERENCE='https://www.knexusergroup.org.uk/en/knex-hint-A8.html';
export function classicHingeModel(){
 const m=emptyModel('Classic molded double hinge'),base=part('hinge-blue',[90,300,0]);m.parts.push(base);
 const attach=(type,host,mode,options={})=>{const target=targets(m,type,mode).find(t=>t.partId===host.id);if(!target)throw Error('Missing classic clip connection.');return add(m,solve(m,type,target,mode,options));};
 const support=attach('r-white',base,'end');attach('c-gray',support,'end');const fixed=m.parts.map(p=>p.id);m.parts.forEach(p=>p.grounded=true);makeGroup(m,fixed,'Locked fixture');makeLayer(m,fixed,'Locked fixture');
 const black=attach('hinge-black',base,'hinge'),arm=attach('r-red',black,'end'),middle=attach('hinge-blue',arm,'end'),upper=m.parts.filter(p=>!fixed.includes(p.id)).map(p=>p.id);makeGroup(m,upper,'First arm');makeLayer(m,upper,'First arm');
 const green=attach('hinge-green',middle,'hinge'),lower=attach('r-blue',green,'end');attach('clip-blue',lower,'end');const lowerIds=m.parts.filter(p=>!fixed.includes(p.id)&&!upper.includes(p.id)).map(p=>p.id);makeGroup(m,lowerIds,'Second arm');makeLayer(m,lowerIds,'Second arm');return m;
}
export function classicClipBench(){const m=classicHingeModel();m.name='Classic clips and hinge halves';const rod=part('r-blue',[200,80,0]);m.parts.push(rod);for(const type of ['clip-blue','clip-bronze'])add(m,solve(m,type,targets(m,type,'end').find(t=>t.partId===rod.id),'end'));makeGroup(m,m.parts.slice(-3).map(p=>p.id),'Rod-end stops');return m;}

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
