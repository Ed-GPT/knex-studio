import * as C from './vendor/cannon-es.js';
import * as T from './vendor/three.module.js';
// Supplier: 90990 + 90991, approx. 46 mm. Mass/friction are adjustable estimates.
export const BALL={radius:23,mass:24,limit:16};
export const MAX_TRIANGLES=300000;
const H=1/480,MAX_SPEED=5;
const vec=a=>new C.Vec3(...a);
export function meshTriangles(root){
 root.updateMatrixWorld(true);const result=[];let total=0;
 root.traverse(o=>{if(!o.isMesh||!o.visible)return;const g=o.geometry,a=g.attributes.position,ix=g.index,n=(ix?ix.count:a.count)/3;
  total+=n;if(total>MAX_TRIANGLES)throw Error('This test exceeds 300,000 collision triangles. Test a smaller section.');
  // Cannon uses signed 16-bit indices. Split before that limit, preserving every face.
  for(let start=0;start<n;start+=9000){const vertices=[],indices=[],seen=new Map();for(let f=start;f<Math.min(start+9000,n);f++)for(let k=0;k<3;k++){const source=ix?ix.getX(f*3+k):f*3+k;const p=new T.Vector3().fromBufferAttribute(a,source).applyMatrix4(o.matrixWorld);const key=`${p.x},${p.y},${p.z}`;let index=seen.get(key);if(index===undefined){index=vertices.length/3;seen.set(key,index);vertices.push(p.x/1000,p.y/1000,p.z/1000);}indices.push(index);}result.push({vertices,indices});}
 });return result;
}
export function createBallWorld(meshes=[],options={}){
 const mass=options.mass??BALL.mass,friction=options.friction??.24,bounce=options.bounce??.18;
 if(!Number.isFinite(mass)||mass<1||mass>100||!Number.isFinite(friction)||friction<0||friction>1||!Number.isFinite(bounce)||bounce<0||bounce>.8)throw Error('Invalid ball settings.');
 const world=new C.World({gravity:new C.Vec3(0,-9.81,0),allowSleep:true});world.solver.iterations=14;world.solver.tolerance=1e-8;
 world.broadphase=new C.SAPBroadphase(world);world.broadphase.useBoundingBoxes=true;
 const material=new C.Material('ball-test');world.addContactMaterial(new C.ContactMaterial(material,material,{friction,restitution:bounce,contactEquationStiffness:1e8,contactEquationRelaxation:3}));
 const floor=new C.Body({mass:0,material,shape:new C.Plane()});floor.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(floor);
 const geometry=[];let total=0;
 for(const m of meshes){if(m.vertices.length%3||m.indices.length%3||m.vertices.some(v=>!Number.isFinite(v))||m.indices.some(i=>!Number.isInteger(i)||i<0||i>=m.vertices.length/3||i>32767))throw Error('Invalid ball-test collision mesh.');total+=m.indices.length/3;if(total>MAX_TRIANGLES)throw Error('This test exceeds 300,000 collision triangles. Test a smaller section.');
  const shape=new C.Trimesh(m.vertices,m.indices),body=new C.Body({mass:0,material,shape});world.addBody(body);geometry.push({shape,box:new T.Box3().setFromArray(m.vertices),data:m});
 }
 const balls=[];let accumulator=0;
 function canDrop(position){if(!Array.isArray(position)||position.length!==3||position.some(v=>!Number.isFinite(v)||Math.abs(v)>10000)||position[1]<BALL.radius)return false;
  const p=new T.Vector3(...position).multiplyScalar(.001),r=BALL.radius*.001;
  if(balls.some(b=>b.position.distanceTo(vec(p.toArray()))<r*2+.001))return false;
  const t=new T.Triangle(),closest=new T.Vector3();for(const g of geometry){if(g.box.distanceToPoint(p)>r)continue;const query=new C.AABB({lowerBound:vec(p.toArray().map(v=>v-r)),upperBound:vec(p.toArray().map(v=>v+r))}),faces=[];g.shape.getTrianglesInAABB(query,faces);for(const f of faces){for(const [k,key] of ['a','b','c'].entries()){const offset=g.data.indices[f*3+k]*3;t[key].fromArray(g.data.vertices,offset);}t.closestPointToPoint(p,closest);if(closest.distanceToSquared(p)<r*r)return false;}}
  return true;
 }
 function drop(position,velocity=[0,0,0]){if(balls.length>=BALL.limit)throw Error('Clear some balls first (16 per test).');if(!canDrop(position))throw Error('The ball needs more clearance. Choose an open spot.');if(velocity.length!==3||velocity.some(v=>!Number.isFinite(v)))throw Error('Invalid ball velocity.');
  const body=new C.Body({mass:mass/1000,material,shape:new C.Sphere(BALL.radius/1000),position:vec(position.map(v=>v/1000)),velocity:vec(velocity.map(v=>v/1000)),linearDamping:.015,angularDamping:.035,sleepSpeedLimit:.015,sleepTimeLimit:1});
  // Hollow-shell estimate, rather than Cannon's default solid-sphere inertia.
  const inertia=2/3*body.mass*(BALL.radius/1000)**2;body.inertia.set(inertia,inertia,inertia);body.invInertia.set(1/inertia,1/inertia,1/inertia);body.updateInertiaWorld(true);world.addBody(body);balls.push(body);return body;
 }
 function step(dt){if(!balls.length||!Number.isFinite(dt)||dt<=0)return;accumulator+=Math.min(dt,1/30);let count=0;while(accumulator>=H&&count++<16){for(const b of balls){const speed=b.velocity.length();if(speed>MAX_SPEED)b.velocity.scale(MAX_SPEED/speed,b.velocity);}world.step(H);accumulator-=H;}}
 function clear(){for(const b of balls)world.removeBody(b);balls.length=0;accumulator=0;}
 return{world,balls,drop,canDrop,step,clear,triangleCount:total};
}
