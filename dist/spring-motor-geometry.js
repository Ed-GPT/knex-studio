import * as T from './vendor/three.module.js';
import {SPRING_MOTOR} from './spring-motor.js';
// Reconstructed from USD394286 orthographic drawings and the 92890 product photo.
// Approximate outer envelope and internal appearance, not a factory CAD model.
export function springMotorGeometry(){const g=new T.Group(),clear=new T.MeshStandardMaterial({color:'#dce8ed',transparent:true,opacity:.28,roughness:.2,depthWrite:false,side:T.DoubleSide}),edge=new T.MeshStandardMaterial({color:'#c8d8df',transparent:true,opacity:.65,roughness:.24}),steel=new T.MeshStandardMaterial({color:'#99a4a8',metalness:.6,roughness:.4});
 const add=(geo,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=!mat.transparent;m.receiveShadow=true;g.add(m);return m;};
 const plate=(points,depth,mat,z,holes=[])=>{const s=new T.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();for(const [x,y,r]of holes){const h=new T.Path();h.absarc(x,y,r,0,2*Math.PI,true);s.holes.push(h);}const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:24});geo.translate(0,0,-depth/2);return add(geo,mat,0,0,z);};
 const ring=(x,y,z,outer,inner,depth,mat)=>{const s=new T.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);const h=new T.Path();h.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(h);const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32});geo.translate(0,0,-depth/2);return add(geo,mat,x,y,z);};
 const outline=[[-20,19],[-20,-2],[-13,-11],[13,-11],[20,-2],[20,19],[8,21],[5,24],[-5,24],[-8,21]];
 for(const z of[-8.95,8.95])plate(outline,1,clear,z,[[0,0,3.35]]);
 for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],dx=b[0]-a[0],dy=b[1]-a[1],m=add(new T.BoxGeometry(Math.hypot(dx,dy),.9,17.9),clear,(a[0]+b[0])/2,(a[1]+b[1])/2);m.rotation.z=Math.atan2(dy,dx);}
 for(const b of SPRING_MOTOR.bores.slice(1)){const [x,y,z]=b.pos,s=Math.sign(x);plate([[s*15,17],[s*20,15],[x+3*s,y-2],[x-2*s,y+3]],6.3,clear,z);ring(x,y,z,4.7,3.2,6.3,edge);}
 function gear(x,y,z,r,teeth,color,hole=1.1){const mat=new T.MeshStandardMaterial({color,roughness:.35});ring(x,y,z,r-.55,hole,1.8,mat);for(let i=0;i<teeth;i++){const a=i*Math.PI*2/teeth,m=add(new T.BoxGeometry(1.15,1.35,1.8),mat,x+(r-.15)*Math.cos(a),y+(r-.15)*Math.sin(a),z);m.rotation.z=a;}return mat;}
 const red=gear(0,0,5.8,6.4,22,'#e13753',3.25);ring(0,0,8.9,4.1,3.2,2.1,red);
 gear(8.8,4.4,5.8,3.8,14,'#5777d7');gear(9.1,12.1,5.8,4.1,16,'#37bd8e');gear(-1,15.8,5.8,6.8,24,'#31a990');
 const coil=[];for(let i=0;i<=220;i++){const a=i/220*Math.PI*10,r=1+i/220*5.5;coil.push(new T.Vector3(-1+r*Math.cos(a),15.8+r*Math.sin(a),-3.5));}add(new T.TubeGeometry(new T.CatmullRomCurve3(coil),220,.22,5,false),steel);
 for(const [x,y]of[[-15,15],[15,15],[-11,-6],[11,-6]]){ring(x,y,8.95,1.75,.5,.7,steel);add(new T.BoxGeometry(2,.35,.15),edge,x,y,9.35);}
 // Raised direction arrow, visible on the real front shell.
 plate([[-8,8],[4,8],[4,6],[8,9],[4,12],[4,10],[-8,10]],.25,edge,9.7);
 g.name='K’NEX 92890 spring motor';return g;
}
export function springMotorIcon(){return `<svg viewBox="0 0 120 58" aria-hidden="true"><path d="M29 22 18 9 11 14 26 32V48H89V31L106 14 99 8 87 22Z" fill="#91a7b644" stroke="#c4d7e5" stroke-width="2"/><circle cx="19" cy="14" r="4" fill="#283039" stroke="#c4d7e5"/><circle cx="99" cy="14" r="4" fill="#283039" stroke="#c4d7e5"/><circle cx="55" cy="27" r="10" fill="#37ac91"/><circle cx="75" cy="27" r="6" fill="#37bd8e"/><circle cx="75" cy="38" r="5" fill="#5777d7"/><circle cx="58" cy="41" r="7" fill="#e13753"/><circle cx="58" cy="41" r="3" fill="#283039"/></svg>`;}
