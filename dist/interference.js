import * as T from './vendor/three.module.js';
import {MeshBVH} from './vendor/three-mesh-bvh.js';
import {makePart} from './geometry.js';
import {V,Q,definition} from './engine.js';
const cache=new Map(),dynamic=new WeakMap(),EPS=.12,unit=V([1,1,1]);
const pairKey=(a,b)=>a<b?a+'|'+b:b+'|'+a;
function collider(p){
 const shaped=p.path||p.belt,old=shaped?dynamic.get(p):cache.get(p.type);if(old)return old;
 const object=makePart(p.type,p),positions=[],probes=[];object.updateMatrixWorld(true);
 object.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,a=g.attributes.position,ix=g.index;g.computeBoundingBox();const size=g.boundingBox.getSize(V());if(Math.min(size.x,size.y,size.z)<.04)return;probes.push(g.boundingBox.getCenter(V()).applyMatrix4(o.matrixWorld));for(let i=0;i<(ix?.count??a.count);i++){const v=V().fromBufferAttribute(a,ix?ix.getX(i):i).applyMatrix4(o.matrixWorld);positions.push(v.x,v.y,v.z);}});
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeBoundingBox();const bvh=new MeshBVH(geometry,{maxLeafTris:8});
 const c={geometry,bvh,bounds:geometry.boundingBox.clone(),probes};if(shaped)dynamic.set(p,c);else cache.set(p.type,c);return c;
}
function inside(c,p){if(!c.bounds.containsPoint(p))return false;return [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].every(dir=>{const direction=V(dir),hit=c.bvh.raycastFirst(new T.Ray(p,direction),T.DoubleSide);return !!hit&&hit.distance>EPS&&hit.face.normal.dot(direction)>0;});}
function straddles(a,b){const n=a.getNormal(V());if(n.lengthSq()<.5)return false;const d=[b.a,b.b,b.c].map(v=>n.dot(v.clone().sub(a.a)));return Math.min(...d)<-EPS&&Math.max(...d)>EPS;}
function overlap(a,b){
 const toA=a.inverse.clone().multiply(b.matrix),line=new T.Line3();let point=null;
 a.c.bvh.bvhcast(b.c.bvh,toA,{intersectsTriangles:(x,y)=>{if(!straddles(x,y)||!straddles(y,x)||!x.intersectsTriangle(y,line))return false;point=line.getCenter(V()).applyMatrix4(a.matrix);return true;}});
 if(point){point.reason="surface";return point;}
 // Surface intersection alone misses a part wholly contained inside another.
 for(const [first,second] of [[a,b],[b,a]])for(const probe of first.c.probes){if(!inside(first.c,probe))continue;const world=probe.clone().applyMatrix4(first.matrix);if(inside(second.c,world.clone().applyMatrix4(second.inverse))){world.reason="inside";return world;}}
 return null;
}
export class InterferenceError extends Error{constructor(hit,model,phase='motion'){const label=id=>{const p=model.parts.find(p=>p.id===id);return '#'+(model.parts.indexOf(p)+1)+' '+definition(p).name;};super(`${phase==='start'?'Cannot start':phase==='placement'?'Move blocked':'Simulation stopped'}: ${label(hit.a)} intersects ${label(hit.b)}.`);this.name='InterferenceError';this.code='PART_INTERFERENCE';this.partIds=[hit.a,hit.b];this.point=hit.point;this.phase=phase;}}
export function createInterferenceGuard(model,{excluded=new Set()}={}){
 const fitted=new Set(model.links.map(l=>pairKey(l.a,l.b))),entries=model.parts.filter(p=>!excluded.has(p.id)).map(p=>({p,id:p.id,c:collider(p),matrix:new T.Matrix4(),inverse:new T.Matrix4(),bounds:new T.Box3()}));
 function update(pose){for(const e of entries){const p=pose?.(e.p)||e.p;e.matrix.compose(V(p.pos),Q(p.quat),unit);e.inverse.copy(e.matrix).invert();e.bounds.copy(e.c.bounds).applyMatrix4(e.matrix);}}
 function check({pose,changedIds,skipPair,all=false}={}){update(pose);const sorted=[...entries].sort((a,b)=>a.bounds.min.x-b.bounds.min.x),hits=[];for(let i=0;i<sorted.length;i++){const a=sorted[i];for(let j=i+1;j<sorted.length;j++){const b=sorted[j];if(b.bounds.min.x>a.bounds.max.x)break;if(changedIds&&!changedIds.has(a.id)&&!changedIds.has(b.id)||fitted.has(pairKey(a.id,b.id))||skipPair?.(a.id,b.id)||!a.bounds.intersectsBox(b.bounds))continue;const point=overlap(a,b);if(point){const hit={a:a.id,b:b.id,point:point.toArray(),reason:point.reason};if(!all)return hit;hits.push(hit);}}}return all?hits:null;}
 return{check,entries};
}

// Validate a proposed edit before accepting it. Existing untouched overlaps do
// not prevent repairing a different part of an imported build.
export function assertClearPlacement(model,changedIds){
 const hit=createInterferenceGuard(model).check({changedIds});
 if(hit)throw new InterferenceError(hit,model,'placement');
}
export function assertClearMotion(before,after,changedIds){
 const old=new Map(before.parts.map(p=>[p.id,p])),guard=createInterferenceGuard(after);
 let travel=0;for(const e of guard.entries)if(changedIds.has(e.id)&&old.has(e.id)){const p=old.get(e.id);travel=Math.max(travel,V(p.pos).distanceTo(V(e.p.pos))+Q(p.quat).angleTo(Q(e.p.quat))*(e.c.bounds.getSize(V()).length()/2+e.c.bounds.getCenter(V()).length()));}
 const count=Math.max(1,Math.ceil(travel/.5));if(count>512)throw Error('Move blocked: use smaller steps so clearance can be checked.');
 for(let i=1;i<=count;i++){const t=i/count,hit=guard.check({changedIds,pose:p=>{const a=old.get(p.id);return !a||!changedIds.has(p.id)?p:{pos:V(a.pos).lerp(V(p.pos),t).toArray(),quat:Q(a.quat).slerp(Q(p.quat),t).toArray()};}});if(hit)throw new InterferenceError(hit,after,'placement');}
}
