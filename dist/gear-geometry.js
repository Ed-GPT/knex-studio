import {wormWheelGeometry,wormWheelIcon} from './worm-motor-geometry.js';
import * as T from './vendor/three.module.js';
const tau=Math.PI*2;
function shape(points){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return s;}
function extrude(s,depth,mat,z=0){const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.15,bevelThickness:.15,bevelSegments:2,curveSegments:32});g.translate(0,0,z-depth/2);const m=new T.Mesh(g,mat);m.castShadow=m.receiveShadow=true;return m;}
function notch(mat,x){const s=new T.Shape();s.absarc(0,0,2.4,.6,Math.PI*2-.6,false);s.lineTo(1.4*Math.cos(-.6),1.4*Math.sin(-.6));s.absarc(0,0,1.4,Math.PI*2-.6,.6,true);s.closePath();const m=extrude(s,6.3,mat);m.position.x=x;if(x<0)m.rotation.z=Math.PI;return m;}
function ring(r,inner,depth,mat,z=0){const s=new T.Shape();s.absarc(0,0,r,0,tau);const h=new T.Path();h.absarc(0,0,inner,0,tau,true);s.holes.push(h);return extrude(s,depth,mat,z);}
export function gearGeometry(d){if(d.wormWheel)return wormWheelGeometry();const g=new T.Group(),mat=new T.MeshStandardMaterial({color:d.color,roughness:.36});
 if(d.chain){for(const z of[-4,4]){const s=shape([[-3,-2],[-2,-3],[9,-3],[11,-2],[22,-2],[23,-3],[27,-3],[29,-1.5],[27,-.8],[26,-1.6],[24.4,0],[26,1.6],[27,.8],[29,1.5],[27,3],[23,3],[22,2],[11,2],[9,3],[-2,3],[-3,2]]);g.add(extrude(s,1.5,mat,z));}
 const pin=new T.Mesh(new T.CylinderGeometry(1.65,1.65,10,16),mat);pin.rotation.x=Math.PI/2;g.add(pin);for(const child of g.children){child.scale.x=-1;child.position.x=26;}return g;}
 const pts=[];for(let i=0;i<d.teeth;i++)for(const [f,r]of[[0,d.pitchRadius-1.7],[.2,d.pitchRadius-1.7],[.33,d.diameter/2],[.67,d.diameter/2],[.8,d.pitchRadius-1.7]]){const a=(i+f)*tau/d.teeth;pts.push([Math.cos(a)*r,Math.sin(a)*r]);}
 const s=shape(pts),hole=new T.Path();hole.absarc(0,0,3.2,0,tau,true);s.holes.push(hole);
 if(d.teeth>40)for(let i=0;i<5;i++){const a=i*tau/5,points=[[13,-.40],[d.pitchRadius-8,-.48],[d.pitchRadius-8,.48],[13,.40]].map(([r,b])=>[r*Math.cos(a+b),r*Math.sin(a+b)]),h=new T.Path();points.forEach(([x,y],j)=>j?h.lineTo(x,y):h.moveTo(x,y));h.closePath();s.holes.push(h);}
 g.add(extrude(s,d.teeth===14?4.5:2.3,mat));
 if(d.endBearing){g.add(ring(7,3.2,5.4,mat));const cap=new T.Shape();cap.absarc(0,0,5.4,0,tau);g.add(extrude(cap,2,mat,2.15));return g;}
 g.add(ring(5.5,3.2,6.3,mat));if(!d.axleGrip)for(const x of[-6,6])g.add(notch(mat,x));
 if(d.teeth>14){g.add(ring(d.pitchRadius-1.8,d.pitchRadius-3.1,4.8,mat));}
 if(d.crown)for(let i=0;i<d.teeth;i++){const a=tau*i/d.teeth,m=new T.Mesh(new T.BoxGeometry(2.1,2.4,4),mat);m.position.set(Math.cos(a)*(d.pitchRadius-1),Math.sin(a)*(d.pitchRadius-1),3);m.rotation.z=a;g.add(m);}
 return g;
}
export function gearIcon(d){if(d.wormWheel)return wormWheelIcon();if(d.chain)return `<svg viewBox="0 0 120 58" aria-hidden="true"><g fill="none" stroke="${d.color}" stroke-width="6"><path d="M39 20h41v18H39Z"/><path d="M39 19v20"/></g></svg>`;return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(60 29)" fill="${d.color}">${Array.from({length:Math.min(d.teeth,34)},(_,i)=>`<rect x="-1.6" y="-24" width="3.2" height="7" transform="rotate(${i*360/Math.min(d.teeth,34)})"/>`).join('')}<circle r="20"/></g><circle cx="60" cy="29" r="${d.endBearing?9:5}" fill="${d.endBearing?d.color:'#252a32'}" stroke="${d.endBearing?'#72818e':'none'}"/></svg>`;}
