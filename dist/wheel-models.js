import {V,Q,part,definition,emptyModel,targets,solve,add,BY_ID,ports} from './engine.js';
export const VEHICLE_MANUAL='https://www.knexusergroup.org.uk/en/knex-project-vehiclewheeled.html';
export function wheelReferenceModels(){const m=emptyModel('Classic wheels: 47, 65 and 90 mm');for(const [t,x,y]of[['small',-95,23.5],['medium',0,32.5],['large',110,45]]){const hub=part(t==='small'?'h-small':'h-medium',[x,y,0]);m.parts.push(hub);add(m,solve(m,'t-'+t,targets(m,'t-'+t,'tire').find(p=>p.partId===hub.id),'tire'));}return m;}
export function manualVehicle(){
 const m=emptyModel('Wheeled Vehicle Base · manual build'),height=23.5,motor=part('m-green',[0,height,0]);m.parts.push(motor);
 const attach=(type,host,mode,options={},key)=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id&&(!key||t.key===key)),mode,options));
 const front=attach('r-red',motor,'through');
 const white=[-1,1].map(sign=>attach('c-white',motor,'mount',{},sign<0?'mount-back':'mount-front'));
 for(const p of white)m.links.push({a:front.id,ap:'shaft',b:p.id,bp:'hole',mode:'through',offset:p.pos[2]});
 const frontYellow=[];
 for(const sign of[-1,1]){
  let edge=18.75+3.15;
  for(const type of['s-silver','s-blue','c-yellow','s-blue','k-tan']){const depth=BY_ID[type].thickness||6.3,offset=sign*(edge+depth/2);const p=attach(type,front,'through',{offset,roll:sign<0?180:0});edge+=depth;if(type==='c-yellow')frontYellow.push(p);
   if(type==='k-tan'){
    // The left key faces outward (-Z); the right key faces +Z.
    if(sign<0)p.quat=Q().setFromAxisAngle(V([0,1,0]),Math.PI).toArray();
    const hub=attach('h-small',p,'keyed');m.links.push({a:front.id,ap:'shaft',b:hub.id,bp:'hole',mode:'through',offset:hub.pos[2]});attach('t-small',hub,'tire');
   }
  }
 }
 for(const key of['end0','end1'])attach('k-cap',front,'end',{},key);
 // Rear yellow connectors grip the axle across their back socket, as shown
 // in the rear-axle photo. Four red rails join the front sockets to them.
 const rear=part('r-red',[-164.5,height,0],front.quat);m.parts.push(rear);
 const rearConnectors=[];
 for(const z of[-(21.9+9.3+3.1+3.15),-18.75,18.75,21.9+9.3+3.1+3.15]){
  const p=attach('c-yellow',rear,'side',{offset:z,portIndex:4});rearConnectors.push(p);
 }
 // The manual's centre pack: blue, blue, silver, silver, blue, blue.
 let edge=-15.6;for(const type of['s-blue','s-blue','s-silver','s-silver','s-blue','s-blue']){const width=BY_ID[type].thickness;attach(type,rear,'through',{offset:edge+width/2});edge+=width;}
 for(const sign of[-1,1]){
  attach('s-blue',rear,'through',{offset:sign*(18.75+3.15+1.55)});
  attach('s-silver',rear,'through',{offset:sign*(18.75+3.15+3.1+4.65)});
  attach('s-silver',rear,'through',{offset:sign*(37.45+3.15+4.65)});
  const hub=attach('h-small',rear,'through',{offset:sign*53.2});attach('t-small',hub,'tire');
 }
 for(const key of['end0','end1'])attach('k-cap',rear,'end',{},key);
 for(const node of[...white,...frontYellow]){const socket=ports(node).find(p=>p.kind==='slot'&&V(p.dir).dot(V([-1,0,0]))>.999);attach('r-red',node,'end',{},socket.key);}
 return m;
}

// A comparison bench, not an official vehicle plan. Fixed rods make each
// independent bearing easy to spin without moving another wheel family.
export function racingWheelBench(){
 const m=emptyModel('Classic racing wheel bench'),attach=(type,host,mode,key)=>add(m,solve(m,type,targets(m,type,mode).find(t=>t.partId===host.id&&(!key||t.key===key)),mode));
 for(const [row,hubType,tyreType]of[[0,'h-racing37-gray','t-racing37'],[1,'h-racing37-black','t-slick37'],[2,'h-racing50','t-racing50']]){
  const rod=part('r-blue',[(row-1)*90,45,-55],Q().setFromUnitVectors(V([1,0,0]),V([0,0,1])).toArray());rod.grounded=true;m.parts.push(rod);const hub=attach(hubType,rod,'end','end1');attach(tyreType,hub,'tire');
 }
 const wide=part('t-racing50',[-90,45,65]);m.parts.push(wide);
 for(const [i,type]of ['h-narrow50-gray','h-narrow50-black'].entries())attach(type,wide,'tire','tire'+i);
 const rod=part('r-blue',wide.pos,Q().setFromUnitVectors(V([1,0,0]),V([0,0,1])).toArray());rod.grounded=true;m.parts.push(rod);
 for(const hub of m.parts.filter(p=>BY_ID[p.type].wheelStyle==='narrow'))m.links.push({a:rod.id,ap:'shaft',b:hub.id,bp:'hole',mode:'through',offset:hub.pos[2]-rod.pos[2]});
 for(const [x,type,tyre]of [[0,'h-narrow50-gray','t-narrow50'],[90,'h-spoked37-silver','t-small'],[170,'h-spoked37-black','t-small']]){const rod=part('r-blue',[x,45,65],Q().setFromUnitVectors(V([1,0,0]),V([0,0,1])).toArray());rod.grounded=true;m.parts.push(rod);const hub=attach(type,rod,'through');attach(tyre,hub,'tire');}
 return m;
}
