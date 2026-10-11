import * as T from './vendor/three.module.js';
import {V,Q} from './engine.js';
import {makePart} from './geometry.js';
import {createDrive,stepDrive,COURSES} from './playground.js';
export function playgroundView(scene,model,course){const state=createDrive(model,course),root=new T.Group(),vehicle=new T.Group(),environment=new T.Group();root.add(environment,vehicle);scene.add(root);
 const mat=color=>new T.MeshStandardMaterial({color,roughness:.9}),asphalt=mat('#343b45'),grass=mat('#4b634a'),wall=mat('#687381'),orange=mat('#e3a34c');
 function box(x,y,z,w,h,d,material){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=true;environment.add(mesh);return mesh;}
 box(0,-5,0,3000,8,2200,asphalt);for(const z of[-1110,1110])box(0,22,z,3030,46,20,wall);for(const x of[-1510,1510])box(x,22,0,20,46,2200,wall);
 for(const o of COURSES[course].obstacles){box(o.x,18,o.z,o.w,36,o.h,course==='circuit'?grass:orange);}
 // Dashed route markers and a visible start stripe help judge speed and scale.
 if(course==='circuit')for(let x=-1200;x<=1200;x+=160)for(const z of[-730,730])box(x,.1,z,65,1,6,mat('#d7d7ca'));
 else for(let x=-1200;x<=1200;x+=160)box(x,.1,0,65,1,6,mat('#d7d7ca'));
 const start=COURSES[course].start;for(let i=0;i<8;i++)box(start[0],1,start[1]-140+i*40,45,1,40,mat(i%2?'#e2e4e3':'#20262b'));
 for(const p of state.model.parts.filter(p=>state.ids.has(p.id))){const mesh=makePart(p.type,p);mesh.userData.partId=p.id;vehicle.add(mesh);}
 const sync=()=>{const yaw=Q().setFromAxisAngle(V([0,1,0]),state.yaw);for(const g of vehicle.children){const p=state.model.parts.find(p=>p.id===g.userData.partId);g.position.copy(V(p.pos).sub(V(state.center)));g.position.y-=state.groundY;g.quaternion.fromArray(p.quat);}vehicle.position.set(state.x,0,state.z);vehicle.quaternion.copy(yaw);};sync();
 return{state,root,step(dt,commands,options){stepDrive(state,dt,commands,options);sync();},dispose(){scene.remove(root);environment.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});},reset(){this.dispose();return playgroundView(scene,model,course);}};
}
