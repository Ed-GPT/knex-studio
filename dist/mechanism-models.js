import {V,Q,part,ports,definition,emptyModel,targets,solve,add} from './engine.js';
import {makeGroup,makeLayer} from './editor-state.js';
import {partMass} from './mass.js';
export const SCALE_REFERENCE='https://www.knexusergroup.org.uk/bk/79565Levers.pdf';
export const PANTOGRAPH_REFERENCE='https://www.knexusergroup.org.uk/en/K60030maths.pdf';
// Adaptations of the referenced mechanisms, not exact instruction-book copies.
// Every visible component is an existing Classic part with stock rod spacing.
function builder(name){
 const m=emptyModel(name),node=(type,pos,q=Q())=>{const p=part(type,pos,q.toArray());m.parts.push(p);return p;};
 const attach=(type,host,mode,options={},key)=>{const t=targets(m,type,mode).find(t=>t.partId===host.id&&(!key||t.key===key));if(!t)throw Error(`Missing ${mode} target on ${host.type}`);return add(m,solve(m,type,t,mode,options));};
 const span=(a,b,type)=>{const dir=V(b.pos).sub(V(a.pos)).normalize(),ap=ports(a).find(p=>p.kind==='slot'&&V(p.dir).dot(dir)>.99999),bp=ports(b).find(p=>p.kind==='slot'&&V(p.dir).dot(dir)<-.99999);if(!ap||!bp)throw Error('Missing mechanism socket');const rod=attach(type,a,'end',{},ap.key);if(!ports(rod).some(p=>V(p.pos).distanceTo(V(bp.pos))<1e-6))throw Error('Mechanism stock length mismatch');return rod;};
 const label=(ids,name)=>{makeGroup(m,ids,name);makeLayer(m,ids,name);};
 const keyedAxle=(host,rodType='r-white',centerOffset=0)=>{const axle=attach(rodType,host,'through',{offset:-centerOffset}),clip=attach('k-tan',host,'keyed');return axle;};
 return{m,node,attach,span,label,keyedAxle};
}
export function scaleModel({leftLoadG=0,rightLoadG=0}={}){
 if(![leftLoadG,rightLoadG].every(x=>Number.isFinite(x)&&x>=0&&x<=1000))throw Error('Test payload must be between 0 and 1000 g.');
 const {m,node,attach,span,label,keyedAxle}=builder('Balance scale · suspended loads');
 // Braced 75 mm-wide towers on either side of the moving beam.
 for(const z of[-37.5,37.5]){
  const rows=[];
  for(let y=0;y<5;y++){const row=[-37.5,37.5].map(x=>node('c-white',[x,20+75*y,z]));rows.push(row);span(row[0],row[1],'r-blue');if(y){for(let x=0;x<2;x++)span(rows[y-1][x],row[x],'r-blue');span(rows[y-1][y%2],row[1-y%2],'r-yellow');}}
 }
 // A rod passes through the top bearing on each tower.
 const supports=m.parts.filter(p=>p.type==='c-white'&&Math.abs(p.pos[1]-320)<.01&&Math.abs(p.pos[0]+37.5)<.01);
 const axle=attach('r-red',supports[0],'through',{offset:-37.5});
 const other=supports[1];m.links.push({a:axle.id,ap:'shaft',b:other.id,bp:'hole',mode:'through',offset:37.5});
 for(const key of['end0','end1'])attach('k-cap',axle,'end',{},key);
 const fixedIds=m.parts.map(p=>p.id);for(const p of m.parts)p.grounded=true;label(fixedIds,'Locked stand');
 const center=attach('c-white',axle,'through'),cy=center.pos[1],cz=center.pos[2],cx=center.pos[0];
 // A trussed beam has its center of mass below its main axle, so it restores
 // toward level with equal loads instead of being neutrally balanced.
 const top=[-150,-75,0,75,150].map(x=>x===0?center:node('c-white',[cx+x,cy,cz]));
 for(let i=0;i<4;i++)span(top[i],top[i+1],'r-blue');
 const low=[-75,0,75].map(x=>node('c-white',[cx+x,cy-75,cz]));
 for(let i=0;i<2;i++)span(low[i],low[i+1],'r-blue');
 for(let i=0;i<3;i++)span(low[i],top[i+1],'r-blue');
 span(top[0],low[0],'r-yellow');span(low[2],top[4],'r-yellow');span(low[0],top[2],'r-yellow');span(top[2],low[2],'r-yellow');
 const loadParts=[];
 for(const [i,host]of [top[0],top[4]].entries()){
  const pivot=keyedAxle(host);attach('s-blue',pivot,'through',{offset:4.7});
  const before=m.parts.length,bearing=attach('c-gray',pivot,'through',{offset:9.4,roll:-90});
  const hanger=attach('r-yellow',bearing,'end'),bottom=attach('c-gray',hanger,'end',{portIndex:0});
  // The reference hangs a real hub/tyre as a weight; the reconstruction uses
  // an end socket plus a keyed, horizontal hub rather than an unsupported cup.
  const weightAxle=keyedAxle(bottom),hub=attach('h-small',weightAxle,'through',{offset:9.5}),tyre=attach('t-small',hub,'tire');
  // Retain the loose wheel on the weight axle; same-axis bearings merge in the solver.
  for(const key of ['end0','end1'])attach('k-cap',weightAxle,'end',{},key);
  const load=i?rightLoadG:leftLoadG;if(load)tyre.massG=partMass(tyre,definition(tyre))+load;
  loadParts.push(...m.parts.slice(before).map(p=>p.id));label(m.parts.slice(before).map(p=>p.id),i?'Right load':'Left load');
  for(const key of ['end0','end1'])attach('k-cap',pivot,'end',{},key);
 }
 const beam=m.parts.filter(p=>!fixedIds.includes(p.id)&&!loadParts.includes(p.id)).map(p=>p.id);label(beam,'Balance beam');return m;
}

export function pantographModel(){
 const {m,node,attach,span,label,keyedAxle}=builder('Pantograph · 2× linkage'),n=V([0,1,0]),baseQ=Q().setFromUnitVectors(V([0,0,1]),n);
 const orientation=angle=>Q().setFromAxisAngle(n,-angle).multiply(baseQ);
 const O=[-200,60,0],A=[-50,60,0],B=[100,60,0],C=[25,60,150*Math.sqrt(3)/2],D=[175,60,150*Math.sqrt(3)/2],E=[250,60,150*Math.sqrt(3)];
 const stockBar=(points,y,name)=>{const before=m.parts.length,angle=Math.atan2(points[1][2]-points[0][2],points[1][0]-points[0][0]),nodes=points.map((p,i)=>node(i>0&&i<points.length-1?'c-orange':'c-gray',[p[0],y,p[2]],orientation(angle+(i===points.length-1?Math.PI:0))));for(let i=0;i<nodes.length-1;i++)span(nodes[i],nodes[i+1],'r-red');label(m.parts.slice(before).map(p=>p.id),name);return nodes;};
 const a=stockBar([O,A,B],60,'Input arm'),b=stockBar([B,D,E],72.5,'Output arm'),c=stockBar([A,C],85,'Short link A'),d=stockBar([C,D],97.5,'Short link B');
 const pivot=(fixed,moving)=>{const before=m.parts.length,halfGap=(moving.pos[1]-fixed.pos[1])/2,axle=keyedAxle(fixed,'r-blue',halfGap),axis=V([1,0,0]).applyQuaternion(Q(axle.quat)),offset=V(moving.pos).sub(V(axle.pos)).dot(axis);m.links.push({a:axle.id,ap:'shaft',b:moving.id,bp:'hole',mode:'through',offset});
  const gap=Math.abs(halfGap*2),sign=Math.sign(halfGap);if(gap>20){for(const z of [7.8,17.1])attach('s-silver',axle,'through',{offset:sign*z-halfGap});}else{for(const z of [4.7,7.8])attach('s-blue',axle,'through',{offset:sign*z-halfGap});}
  // Rod length accommodates the whole stack; end caps retain the joint.
  for(const key of ['end0','end1'])attach('k-cap',axle,'end',{},key);
  const group=m.editor.groups.find(g=>g.partIds.includes(fixed.id)),ids=m.parts.slice(before).map(p=>p.id);makeGroup(m,[...group.partIds,...ids],group.name);const layer=m.editor.layers.find(l=>l.partIds.includes(fixed.id));layer.partIds.push(...ids);
 };
 pivot(a[1],c[0]);pivot(a[2],b[0]);pivot(b[1],d[1]);pivot(c[1],d[0]);
 // Real Classic rods and connectors form the stationary foot. Only this support
 // is locked; the four linkage members remain independent rigid bodies.
 const before=m.parts.length,foot=node('c-white',[-200,20,0],baseQ);
 for(const key of ['slot0','slot2','slot4','slot6']){const r=attach('r-blue',foot,'end',{},key);attach('c-gray',r,'end');}
 const axle=attach('r-blue',foot,'through',{offset:-20});m.links.push({a:axle.id,ap:'shaft',b:a[0].id,bp:'hole',mode:'through',offset:20});
 for(const key of ['end0','end1'])attach('k-cap',axle,'end',{},key);
 const ids=m.parts.slice(before).map(p=>p.id);for(const p of m.parts.slice(before))p.grounded=true;label(ids,'Locked drawing pivot');return m;
}
