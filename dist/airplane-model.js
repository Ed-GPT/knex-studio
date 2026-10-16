import {V,Q,BY_ID,SOCKET,part,ports,emptyModel,solve,targets,busy,add,component,exportModel,parseModel} from './engine.js';
import {Matrix4} from './vendor/three.module.js';
import {makeLayer,makeGroup} from './editor-state.js';
import {assertClearPlacement} from './interference.js';

export const AIRPLANE_REFERENCE='https://d2npjmct0hwe3x.cloudfront.net/wp-content/uploads/manuals/10-Model-Flying-Fun-Set-11556.pdf';
// Original straight-rod aircraft. Flying Fun pp. 11–15 informs the separate
// triangular wings, raised fuselage, upright tail and spacer-retained propeller.
// This is not a replica: no bent gray rods, flexible rods or scaled stock parts.
export function airplaneModel({validate=true}={}){
 const m=emptyModel('Swept-wing propeller plane'),nodes=new Map(),raw=[],layers=new Map();
 const key=p=>p.map(n=>Math.round(n*1e6)/1e6).join(','),region=(name,id)=>{if(!layers.has(name))layers.set(name,[]);layers.get(name).push(id);};
 function node(p,name){const k=key(p);if(!nodes.has(k))nodes.set(k,{p,name,dirs:[],pieces:[]});return nodes.get(k);}
 function edge(a,b,name){node(a,name);node(b,name);raw.push({a,b,name});}
 // Two side trusses give the fuselage real depth. Nose and rear taper are
 // horizontal 45-degree triangles; the tail boom is a braced vertical truss.
 for(const y of[0,75]){
  for(const z of[-75,75])for(let x=-225;x<225;x+=75)edge([x,y,z],[x+75,y,z],'Fuselage');
  for(const x of[-225,-75,75,225])edge([x,y,-75],[x,y,75],'Fuselage');
  for(const [tip,base]of[[-300,-225],[300,225]])for(const z of[-75,75])edge([tip,y,0],[base,y,z],'Fuselage');
  for(let x=300;x<450;x+=75)edge([x,y,0],[x+75,y,0],'Tail boom');
 }
 for(const z of[-75,75])for(let x=-225;x<=225;x+=75){edge([x,0,z],[x,75,z],'Fuselage');if(x<225)edge([x,0,z],[x+75,75,z],'Fuselage');}
 for(const x of[-300,300,375,450])edge([x,0,0],[x,75,0],x<0?'Fuselage':'Tail boom');
 for(const x of[300,375])edge([x,0,0],[x+75,75,0],'Tail boom');
 for(const x of[-225,-75,75])edge([x,0,-75],[x+150,0,75],'Fuselage');
 // Warren-style wing webs: alternating diagonals make triangles rather than
 // filled surface cells. Boundary rods split only at actual connector centers.
 for(const sign of[-1,1]){
  const name=sign<0?'Left wing':'Right wing',rows=[];
  for(let k=0;k<=6;k++){
   const row=[];for(let x=-225+k*75;x<=225;x+=150)row.push([x,75,sign*(75+k*75)]);
   if(row.at(-1)[0]!==225)row.push([225,75,sign*(75+k*75)]);rows.push(row);
   for(let i=1;i<row.length;i++)edge(row[i-1],row[i],name);
   if(k)for(const a of rows[k-1])for(const b of row)if(Math.abs(b[0]-a[0])===75||b[0]===225&&a[0]===225)edge(a,b,name);
  }
  // Smaller triangular horizontal stabilizers behind the wings.
  const a=[300,75,0],b=[450,75,0],tip=[450,75,sign*150],mid=[375,75,sign*75],back=[450,75,sign*75];
  for(const [u,v]of[[a,b],[a,mid],[mid,tip],[b,back],[back,tip],[mid,back],[mid,b]])edge(u,v,'Horizontal tail');
 }
 const finA=[300,75,0],finB=[450,75,0],finC=[450,225,0],finD=[375,150,0],finE=[450,150,0];
 for(const [a,b]of[[finA,finD],[finD,finC],[finB,finE],[finE,finC],[finD,finE],[finD,finB]])edge(a,b,'Vertical fin');
 // A raised triangular canopy outline, connected across the fuselage.
 for(const z of[-75,75]){edge([-150,75,z],[-75,150,z],'Cockpit');edge([-75,150,z],[0,75,z],'Cockpit');}
 edge([-75,150,-75],[-75,150,75],'Cockpit');
 edge([-300,75,0],[-375,75,0],'Propeller support');
 edge([-375,75,0],[-375,0,0],'Propeller support');
 edge([-300,0,0],[-375,75,0],'Propeller support');
 // Split overlapping boundary spans at their shared real nodes, deduplicate.
 const edges=new Map();for(const e of raw){const axis=V(e.b).sub(V(e.a)),length=axis.length();axis.normalize();const points=[...nodes.values()].filter(n=>{const delta=V(n.p).sub(V(e.a)),s=delta.dot(axis);return s>=-1e-6&&s<=length+1e-6&&delta.clone().addScaledVector(axis,-s).length()<1e-6;}).sort((a,b)=>V(a.p).sub(V(e.a)).dot(axis)-V(b.p).sub(V(e.a)).dot(axis));
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],k=[key(a.p),key(b.p)].sort().join('|');if(!edges.has(k))edges.set(k,{a,b,name:e.name});}
 }
 for(const {a,b}of edges.values()){const dir=V(b.p).sub(V(a.p)).normalize();a.dirs.push(dir);b.dirs.push(dir.clone().negate());}
 for(const p of[[-75,0,-75],[-75,0,75],[375,0,0]])nodes.get(key(p)).dirs.push(V([0,-1,0]));
 // Fit the smallest real connector pattern to each node. Spatial junctions
 // use two properly interlocked blue connectors, with a checked orientation.
 const types=['c-gray','c-orange','c-lgray','c-red','c-green','c-yellow','c-white'];
 function rotations(dirs){const list=[Q()];const axes=[V([1,0,0]),V([0,1,0]),V([0,0,1]),...dirs];for(const x of axes)for(const v of axes){const y=v.clone().addScaledVector(x,-v.dot(x));if(y.length()<1e-6)continue;y.normalize();const z=x.clone().cross(y).normalize();list.push(Q().setFromRotationMatrix(new Matrix4().makeBasis(x,y,z)));}return list;}
 for(const n of nodes.values()){
  const qs=rotations(n.dirs);let fitted=null;
  for(const type of types){for(const q of qs){const p=part(type,n.p,q.toArray()),ps=ports(p).filter(p=>p.kind==='slot');if(n.dirs.every(d=>ps.some(p=>V(p.dir).dot(d)>.999999))){fitted=[p];break;}}if(fitted)break;}
  if(!fitted)for(const q of qs){const a=part('c-blue',n.p,q.toArray()),local={parts:[a],links:[]},proposal=solve(local,'c-blue',targets(local,'c-blue','interlock')[0],'interlock'),pair=[a,proposal.part],ps=pair.flatMap(ports).filter(p=>p.kind==='slot');if(n.dirs.every(d=>ps.some(p=>V(p.dir).dot(d)>.999999))){fitted=pair;m.links.push(proposal.link);break;}}
  if(!fitted)throw Error('No real connector orientation at '+key(n.p));
  if(key(n.p)==='-375,0,0')fitted[0].quat=Q().setFromRotationMatrix(new Matrix4().makeBasis(V([0,1,0]),V([0,0,1]),V([1,0,0]))).toArray();
  n.pieces=fitted;for(const p of fitted){m.parts.push(p);region(n.name,p.id);}
 }
 for(const {a,b,name}of edges.values()){
  const dir=V(b.p).sub(V(a.p)).normalize(),distance=V(a.p).distanceTo(V(b.p)),type=['r-green','r-white','r-blue','r-yellow','r-red','r-gray'].find(id=>Math.abs(BY_ID[id].length+2*SOCKET-distance)<1e-6);if(!type)throw Error('No stock rod fits '+distance+' at '+key(a.p));
  const ap=a.pieces.flatMap(ports).find(p=>p.kind==='slot'&&!busy(m,p.partId,p.key)&&V(p.dir).dot(dir)>.999999),bp=b.pieces.flatMap(ports).find(p=>p.kind==='slot'&&!busy(m,p.partId,p.key)&&V(p.dir).dot(dir)<-.999999);if(!ap||!bp)throw Error('Occupied frame socket');
  const color=name==='Fuselage'||name==='Tail boom'?({'r-blue':'r-90952w','r-yellow':'r-909532','r-red':'r-90954w','r-gray':'r-90955w'}[type]||type):name==='Cockpit'?({'r-yellow':'r-909532d','r-red':'r-909542'}[type]||type):name.includes('tail')||name==='Vertical fin'?({'r-blue':'r-952002','r-yellow':'r-909533'}[type]||type):type;
  const r=part(color,V(ap.pos).add(V(bp.pos)).multiplyScalar(.5).toArray(),Q().setFromUnitVectors(V([1,0,0]),dir).toArray());m.parts.push(r);region(name,r.id);m.links.push({a:ap.partId,ap:ap.key,b:r.id,bp:'end0',mode:'end'},{a:bp.partId,ap:bp.key,b:r.id,bp:'end1',mode:'end'});
 }
 function attach(type,host,mode,opts={},socket,name='Landing gear'){const local={parts:[host],links:m.links.filter(l=>l.a===host.id||l.b===host.id)},t=targets(local,type,mode).find(t=>!socket||t.key===socket);if(!t)throw Error('Missing '+mode+' socket for '+type);const proposal=solve(local,type,t,mode,opts);add(m,proposal);region(name,proposal.part.id);return proposal.part;}
 function at(p,dir){const n=nodes.get(key(p)),d=V(dir);const t=n.pieces.flatMap(ports).find(p=>p.kind==='slot'&&!busy(m,p.partId,p.key)&&V(p.dir).dot(d)>.999999);if(!t)throw Error('Missing accessory socket '+key(p)+' '+dir);return{host:m.parts.find(p=>p.id===t.partId),socket:t.key};}
 // Main gear has two supported bearings; the tail has a compact twin wheel.
 const leg=(p)=>{const {host,socket}=at(p,[0,-1,0]),r=attach('r-blue',host,'end',{},socket),end=ports(r).find(t=>t.dir[1]<-.999);return attach('c-gray',r,'end',{},end.key);};
 const main=[leg([-75,0,-75]),leg([-75,0,75])],axle=attach('r-gray',main[0],'through',{offset:-75});
 m.links.push({a:axle.id,ap:'shaft',b:main[1].id,bp:'hole',mode:'through',offset:75});
 for(const sign of[-1,1]){attach('s-blue',axle,'through',{offset:sign*80.5});const hub=attach('h-small',axle,'through',{offset:sign*87.4});attach('t-small',hub,'tire');}
 for(const end of['end0','end1'])attach('k-cap',axle,'end',{},end);
 const rear=leg([375,0,0]),tailAxle=attach('r-blue',rear,'through');
 for(const sign of[-1,1]){attach('s-blue',tailAxle,'through',{offset:sign*7});const hub=attach('h-small',tailAxle,'through',{offset:sign*15});attach('t-small',hub,'tire');}
 for(const end of['end0','end1'])attach('k-cap',tailAxle,'end',{},end);
 const bearing=nodes.get('-375,0,0').pieces[0],shaft=attach('r-blue',bearing,'through',{offset:20},undefined,'Propeller'),hub=attach('c-white',shaft,'through',{offset:-15},undefined,'Propeller');
 for(const offset of[-21.3,-8.7])attach('s-blue',shaft,'through',{offset},undefined,'Propeller');
 for(const end of['end0','end1'])attach('k-cap',shaft,'end',{},end,'Propeller');
 for(const socket of['slot0','slot2','slot4','slot6']){const r=attach('r-blue',hub,'end',{},socket,'Propeller'),end=ports(r).find(t=>!busy(m,r.id,t.key));attach('c-gray',r,'end',{},end.key,'Propeller');}
 // Four real 47 mm tyres establish a level resting pose; no locked display stand.
 for(const p of m.parts)p.pos[1]+=98.5;
 makeGroup(m,m.parts.map(p=>p.id),'Swept-wing plane');
 for(const [name,ids]of layers)makeLayer(m,ids,name);
 if(component(m,m.parts[0].id).size!==m.parts.length)throw Error('Disconnected aircraft assembly');
 if(validate)assertClearPlacement(m,new Set(m.parts.map(p=>p.id)));
 return parseModel(exportModel(m));
}
