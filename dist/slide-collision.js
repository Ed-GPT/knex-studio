import * as T from './vendor/three.module.js';
import {V,Q,definition,borePorts} from './engine.js';
import {makePart} from './geometry.js';
const templates=new Map();
function template(type,p){if(!p?.path&&templates.has(type))return templates.get(type);const root=makePart(type,p),boxes=[];root.updateMatrixWorld(true);root.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry;if(!geo.boundingBox)geo.computeBoundingBox();const center=geo.boundingBox.getCenter(new T.Vector3()).applyMatrix4(o.matrixWorld),half=geo.boundingBox.getSize(new T.Vector3()).multiplyScalar(.5),q=new T.Quaternion(),scale=new T.Vector3(),pos=new T.Vector3();o.matrixWorld.decompose(pos,q,scale);half.multiply(scale);boxes.push({center,half,axes:[V([1,0,0]),V([0,1,0]),V([0,0,1])].map(a=>a.applyQuaternion(q))});});if(!p?.path)templates.set(type,boxes);return boxes;}
function bounds(box){const r=[0,1,2].map(i=>box.axes.reduce((sum,a,j)=>sum+Math.abs(a.getComponent(i))*box.half[j],0));box.lo=box.center.toArray().map((v,i)=>v-r[i]);box.hi=box.center.toArray().map((v,i)=>v+r[i]);return box;}
function sweepOverlap(a,b,v,max){for(let i=0;i<3;i++){const shift=v.getComponent(i)*max;if(a.hi[i]+Math.max(0,shift)<b.lo[i]||a.lo[i]+Math.min(0,shift)>b.hi[i])return false;}return true;}
function boxes(p){const q=Q(p.quat),pos=V(p.pos);return template(p.type,p).map(b=>bounds({center:b.center.clone().applyQuaternion(q).add(pos),half:b.half.toArray(),axes:b.axes.map(a=>a.clone().applyQuaternion(q))}));}
// Continuous swept separating-axis test. No frame-size sampling, so a large
// mouse jump cannot tunnel through a thin connector or spacer.
function impact(a,b,velocity,max){const axes=[...a.axes,...b.axes];for(const x of a.axes)for(const y of b.axes){const n=x.clone().cross(y);if(n.lengthSq()>1e-10)axes.push(n.normalize());}const delta=b.center.clone().sub(a.center);let enter=-Infinity,exit=Infinity;
 for(const n of axes){const r=a.axes.reduce((s,x,i)=>s+Math.abs(x.dot(n))*a.half[i],0)+b.axes.reduce((s,x,i)=>s+Math.abs(x.dot(n))*b.half[i],0)-.06,d=delta.dot(n),v=velocity.dot(n);if(Math.abs(v)<1e-9){if(Math.abs(d)>r)return null;continue;}const x=(d-r)/v,y=(d+r)/v;enter=Math.max(enter,Math.min(x,y));exit=Math.min(exit,Math.max(x,y));if(enter>exit)return null;}
 if(exit<=.001||enter>max)return null;
 // Permit withdrawing from a pre-existing approximate overlap, never pushing
 // farther into it. This also lets an old saved model be disentangled.
 if(enter<-.001){if(delta.dot(velocity)<-.001)return null;return 0;}
 return Math.max(0,enter-.04);
}
function borePass(a,b){let rod=a,hole=b;if(definition(b).group==='rods'){rod=b;hole=a;}const r=definition(rod),h=definition(hole);if(r.group!=='rods'||h.group==='rods'||h.endCap||h.endBearing||h.interlock||h.noBore)return false;const axis=V([1,0,0]).applyQuaternion(Q(rod.quat));return (h.tire?[{pos:hole.pos,dir:V([0,0,1]).applyQuaternion(Q(hole.quat)).toArray()}]:borePorts(hole)).some(b=>{const gap=V(rod.pos).sub(V(b.pos));return Math.abs(axis.dot(V(b.dir)))>.9999&&gap.addScaledVector(axis,-gap.dot(axis)).length()<.2;});}
export function slideDistance(model,ids,axis,distance){if(Math.abs(distance)<1e-9)return{distance:0,blockedBy:null};const velocity=V(axis).normalize().multiplyScalar(Math.sign(distance)),moving=model.parts.filter(p=>ids.has(p.id)),fixed=model.parts.filter(p=>!ids.has(p.id));let limit=Math.abs(distance),blockedBy=null;const cached=new Map(),get=p=>{if(!cached.has(p.id))cached.set(p.id,boxes(p));return cached.get(p.id);};
 for(const a of moving)for(const b of fixed){if(borePass(a,b))continue;const ab=get(a),bb=get(b);for(const x of ab)for(const y of bb){if(!sweepOverlap(x,y,velocity,limit))continue;const hit=impact(x,y,velocity,limit);if(hit!==null&&hit<limit){limit=hit;blockedBy=b.id;if(limit===0)return{distance:0,blockedBy};}}}
 return{distance:limit*Math.sign(distance),blockedBy};
}
// Static material proxy overlap for repeats. Connected pairs are exempted by
// the caller; open coaxial bores remain usable. Geometry boxes are conservative.
export function partsOverlap(a,b){if(borePass(a,b))return false;const aa=boxes(a),bb=boxes(b),range=bs=>[0,1,2].map(i=>[Math.min(...bs.map(x=>x.lo[i])),Math.max(...bs.map(x=>x.hi[i]))]);const ar=range(aa),br=range(bb);if(ar.some((r,i)=>r[1]<=br[i][0]+.08||br[i][1]<=r[0]+.08))return false;return aa.some(x=>bb.some(y=>sweepOverlap(x,y,V(),0)&&impact(x,y,V(),0)!==null));}
