import * as T from './vendor/three.module.js';
import {WORM_MOTOR} from './worm-motor.js';
const tau=Math.PI*2,mat=c=>new T.MeshStandardMaterial({color:c,roughness:.38});
function add(g,geo,m,pos=[0,0,0]){const p=new T.Mesh(geo,m);p.position.set(...pos);p.castShadow=p.receiveShadow=true;g.add(p);return p;}
function ring(r,h,depth){const s=new T.Shape();s.absarc(0,0,r,0,tau);const hole=new T.Path();hole.absarc(0,0,h,0,tau,true);s.holes.push(hole);const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:48});g.translate(0,0,-depth/2);return g;}
export function wormMotorGeometry(){const g=new T.Group(),plastic=mat('#999e91'),dark=mat('#3c443f'),worm=mat('#a4ac58');g.name='K’NEX 92815 external 12 V motor';
 const cylinder=(r,len,x,m)=>{const o=add(g,new T.CylinderGeometry(r,r,len,48),m,[x,0,0]);o.rotation.z=Math.PI/2;return o;};
 cylinder(14,51,-42,plastic);cylinder(14.15,.6,-61,dark);cylinder(2,7,-13,dark);
 add(g,new T.BoxGeometry(47,2,65),plastic,[0,-17,0]);
 for(const bore of WORM_MOTOR.bores){const o=add(g,ring(5,3.2,45),plastic,bore.pos);o.rotation.y=Math.PI/2;}
 const rear=add(g,ring(3.7,2.6,1.8),dark,[-68,0,0]);rear.rotation.y=Math.PI/2;
 cylinder(3.2,23,-1,worm);const pts=[];for(let i=0;i<=180;i++){const t=i/180,a=t*tau*7;pts.push(new T.Vector3(-12+23*t,4.1*Math.cos(a),4.1*Math.sin(a)));}add(g,new T.TubeGeometry(new T.CatmullRomCurve3(pts),180,.8,6,false),worm);
 return g;
}
export function wormWheelGeometry(){const g=new T.Group(),m=mat('#eee9d2');g.name='K’NEX 90983 dedicated worm wheel';g.add(new T.Mesh(ring(18.5,3.2,4),m));g.add(new T.Mesh(ring(5.6,3.2,6.3),m));
 // Fine oblique perimeter teeth are a visual estimate only. No ratio is inferred.
 for(let i=0;i<56;i++){const a=i*tau/56,o=add(g,new T.BoxGeometry(1.25,2.3,4.5),m,[19.1*Math.cos(a),19.1*Math.sin(a),0]);o.rotation.z=a-Math.PI/2;o.rotation.y=.15;}
 for(const x of[-6,6]){const s=new T.Shape();s.absarc(0,0,2.4,.6,tau-.6,false);s.lineTo(1.4*Math.cos(-.6),1.4*Math.sin(-.6));s.absarc(0,0,1.4,tau-.6,.6,true);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:6.3,bevelEnabled:false});geo.translate(0,0,-3.15);const o=add(g,geo,m,[x,0,0]);if(x<0)o.rotation.z=Math.PI;}
 return g;
}
export function wormMotorIcon(){return `<svg viewBox="0 0 120 58" aria-hidden="true"><path d="M52 15H100V50H52Z" fill="#9ca497" stroke="#ccd1c7"/><path d="M52 13H101M52 49H101" stroke="#737e70" stroke-width="6"/><rect x="10" y="15" width="47" height="24" rx="9" fill="#999e91" stroke="#ccd1c7"/><path d="M59 27H81" stroke="#b4ba72" stroke-width="8"/><path d="M61 20v14m5-14v14m5-14v14m5-14v14" stroke="#737c40"/></svg>`;}
export function wormWheelIcon(){return `<svg viewBox="0 0 120 58" aria-hidden="true"><circle cx="60" cy="29" r="22" fill="#eee9d2" stroke="#b9b8a9" stroke-width="3" stroke-dasharray="1 2"/><circle cx="60" cy="29" r="5" fill="#252a32"/><path d="M48 25v8m24-8v8" stroke="#aaa997" stroke-width="3"/></svg>`;}
