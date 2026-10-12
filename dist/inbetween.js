import {BY_ID,V,Q,part,ports,busy,parseModel,exportModel,add} from './engine.js';
import {pathLength} from './flexible-parts.js';
export function openSockets(model,id){const p=model.parts.find(p=>p.id===id);return p?ports(p).filter(s=>s.kind==='slot'&&!busy(model,id,s.key)):[];}
// Keep both sockets and their first/last tangents fixed. Only the interior bow
// changes to use the selected stock length. This is geometry, not an elastic model.
export function fitBetween(model,{a,ap,b,bp,type='f-green190',bow=0}){
 if(!Number.isFinite(bow)||Math.abs(bow)>360)throw Error('Choose a bend direction from 0 to 360 degrees.');
 if(a===b)throw Error('Choose two different connectors.');
 const A=openSockets(model,a).find(s=>s.key===ap),B=openSockets(model,b).find(s=>s.key===bp),d=BY_ID[type];
 if(!A||!B)throw Error('Choose two unused connector sockets.');
 if(!d?.flexi&&d?.group!=='rods')throw Error('Choose a real rod or flexi.');
 const start=V(A.pos),end=V(B.pos),delta=end.clone().sub(start),distance=delta.length(),da=V(A.dir),db=V(B.dir);
 if(distance>d.length+.01)throw Error(`Gap ${distance.toFixed(1)} mm exceeds this ${d.length} mm rod.`);
 if(distance<1)throw Error('Sockets are too close together.');
 let p;
 if(!d.flexi){if(Math.abs(distance-d.length)>.05||da.dot(delta.clone().normalize())<.9999||db.dot(delta.clone().normalize())>-.9999)throw Error('A rigid rod needs matching length and facing sockets. Choose a flexi or move the connectors.');p=part(type,start.clone().add(end).multiplyScalar(.5).toArray(),Q().setFromUnitVectors(V([1,0,0]),delta.normalize()).toArray());}
 else{
 const inset=Math.min(2,d.length/20),u=start.clone().addScaledVector(da,inset),v=end.clone().addScaledVector(db,inset),axis=delta.clone().normalize();let normal=V([0,1,0]).addScaledVector(axis,-axis.y);if(normal.lengthSq()<.01)normal=V([0,0,1]).addScaledVector(axis,-axis.z);normal.normalize().applyAxisAngle(axis,bow*Math.PI/180);
 const sample=height=>{const points=[start.toArray(),u.toArray()];for(let i=1;i<128;i++){const t=i/128,s=1-t,h=Math.min(distance/3,d.length/4),x=u.clone().multiplyScalar(s*s*s).addScaledVector(u.clone().addScaledVector(da,h),3*s*s*t).addScaledVector(v.clone().addScaledVector(db,h),3*s*t*t).addScaledVector(v,t*t*t).addScaledVector(normal,height*16*t*t*s*s);points.push(x.toArray());}points.push(v.toArray(),end.toArray());return points;};
 let low=0,high=d.length,points=sample(0);if(pathLength(points)>d.length+.01)throw Error('These socket directions need more length. Choose a longer flexi or turn a connector.');
 for(let i=0;i<48;i++){const h=(low+high)/2;points=sample(h);if(pathLength(points)<d.length)low=h;else high=h;}
 points=sample((low+high)/2);p=part(type,start.clone().add(end).multiplyScalar(.5).toArray());p.path=points.map(x=>V(x).sub(V(p.pos)).toArray());
 }
 const next=parseModel(exportModel(model));if(next.parts.length>=2500)throw Error('Maximum 2500 parts per model.');add(next,{part:p});
 // add() automatically joins the exact endpoint/socket matches.
 for(const id of[a,b])if(!next.links.some(l=>(l.a===p.id&&l.b===id)||(l.b===p.id&&l.a===id)))throw Error('The fitted rod could not join both sockets.');
 return {model:next,part:p,length:d.length,gap:distance};
}
