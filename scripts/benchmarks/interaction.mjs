// Run locally with: node scripts/benchmarks/interaction.mjs
import * as T from '../../dist/vendor/three.module.js';
import {createExample} from '../../dist/examples.js';
import {selectionClosure} from '../../dist/editor-state.js';
import {makeRenderPart} from '../../dist/render-part.js';
const ms=fn=>{const start=performance.now();const value=fn();return {value,ms:performance.now()-start};};
for(const id of ['swept-plane','shape-airplane']){
 const build=ms(()=>createExample(id)),model=build.value,ids=new Set(model.parts.map(p=>p.id));
 const closure=ms(()=>selectionClosure(model,ids));
 const root=new T.Group();const renderBuild=ms(()=>{for(const p of model.parts){const g=makeRenderPart(p.type,p);g.position.fromArray(p.pos);g.quaternion.fromArray(p.quat);root.add(g);}root.updateMatrixWorld(true);});
 const bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3()),radius=bounds.getBoundingSphere(new T.Sphere()).radius;
 const camera=new T.PerspectiveCamera(36,1.4,.1,10000);camera.position.copy(center).add(new T.Vector3(.9,.55,1.3).normalize().multiplyScalar(radius*3.5));camera.lookAt(center);camera.updateMatrixWorld(true);
 const ray=new T.Raycaster();ray.firstHitOnly=true;const samples=[];let hits=0;
 for(let i=0;i<300;i++){const point=new T.Vector3().fromArray(model.parts[(i*37)%model.parts.length].pos).project(camera);ray.setFromCamera(new T.Vector2(point.x,point.y),camera);const r=ms(()=>ray.intersectObjects(root.children,true));if(i>=50)samples.push(r.ms);if(r.value.length)hits++;}
 samples.sort((a,b)=>a-b);
 console.log(JSON.stringify({id,parts:model.parts.length,buildMs:+build.ms.toFixed(1),closureMs:+closure.ms.toFixed(1),closureParts:closure.value.size,renderBuildMs:+renderBuild.ms.toFixed(1),rayMedianMs:+samples[125].toFixed(3),rayP95Ms:+samples[237].toFixed(3),hits}));
}
