import * as C from './vendor/cannon-es.js';
import * as T from './vendor/three.module.js';
import {definition,V,Q} from './engine.js';
import {makePart} from './geometry.js';
const cache=new Map();
// Collision proxies follow real-part profiles. Small ribs, teeth and cavities
// are deliberately omitted; these shapes are not manufacturing CAD.
export function collisionShapes(p){const d=definition(p);if(!p.path&&!p.belt&&cache.has(p.type))return cache.get(p.type);const shapes=[];
 const box=(size,pos=[0,0,0],quat=[0,0,0,1])=>shapes.push({shape:()=>new C.Box(new C.Vec3(...size.map(n=>Math.max(.0003,n/2000)))),pos,quat});
 const segment=(a,b,r)=>{const av=V(a),bv=V(b),delta=bv.clone().sub(av),length=delta.length();if(length<.01)return;const q=Q().setFromUnitVectors(V([0,1,0]),delta.normalize());shapes.push({shape:()=>new C.Cylinder(r/1000,r/1000,length/1000,8),pos:av.add(bv).multiplyScalar(.5).toArray(),quat:q.toArray()});};
 const sphere=(point,r)=>shapes.push({shape:()=>new C.Sphere(r/1000),pos:point,quat:[0,0,0,1]});
 if(d.tubing||d.flexi){const points=p.path||[[-(d.length||190)/2,0,0],[(d.length||190)/2,0,0]],simple=simplifyPath(points,.2),r=d.tubing?2.8:2.8;for(let i=1;i<simple.length;i++)segment(simple[i-1],simple[i],r);for(const v of simple)sphere(v,r);
 }else if(d.group==='rods'){segment([-d.length/2,0,0],[d.length/2,0,0],2.9);
 }else if(d.group==='connectors'&&!d.clipGeometry){
  // Hollow hub and socket spokes retain an open axial bore.
  for(let i=0;i<10;i++){const a=i*Math.PI*2/10,b=(i+1)*Math.PI*2/10;segment([Math.cos(a)*4.5,Math.sin(a)*4.5,0],[Math.cos(b)*4.5,Math.sin(b)*4.5,0],1.6);}
  for(const degrees of d.slots||[]){const a=degrees*Math.PI/180;box([11,5.5,6.3],[Math.cos(a)*10,Math.sin(a)*10,0],Q().setFromAxisAngle(V([0,0,1]),a).toArray());}
 }else{
  // One cached local bound for panels, housings and uncommon fittings. A proxy
  // is intentionally conservative and disclosed in the physics settings.
  const root=makePart(p.type,p),bound=new T.Box3().setFromObject(root);if(!bound.isEmpty()){const size=bound.getSize(V()),center=bound.getCenter(V());box(size.toArray(),center.toArray());}if(p.belt)root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 }
 if(!p.path&&!p.belt)cache.set(p.type,shapes);return shapes;
}
export function simplifyPath(points,tolerance=.2){if(points.length<=2)return points.map(p=>[...p]);const first=V(points[0]),last=V(points.at(-1)),line=new T.Line3(first,last),near=V();let max=0,index=0;for(let i=1;i<points.length-1;i++){line.closestPointToPoint(V(points[i]),true,near);const distance=near.distanceTo(V(points[i]));if(distance>max){max=distance;index=i;}}return max>tolerance?[...simplifyPath(points.slice(0,index+1),tolerance).slice(0,-1),...simplifyPath(points.slice(index),tolerance)]:[[...points[0]],[...points.at(-1)]];}
