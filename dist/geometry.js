import {wormMotorGeometry,wormWheelGeometry,wormMotorIcon,wormWheelIcon} from './worm-motor-geometry.js';
import {springMotorGeometry,springMotorIcon} from './spring-motor-geometry.js';
import {panelGeometry,panelIcon} from './panel-geometry.js';
import {clipGeometry,clipIcon} from './clip-geometry.js';
import * as T from './vendor/three.module.js';
import {BY_ID,SOCKET,DEG} from './engine.js';
import {wheelGeometry,wheelIcon} from './wheel-geometry.js';
import {enclosedMotor,twoSpeedMotor,motorIcon} from './motor-geometry.js';
import {connectorGeometry,connectorIcon} from './connector-geometry.js';
import {gearGeometry,gearIcon} from './gear-geometry.js';
import {flexibleGeometry,crossTieArms,flexibleIcon} from './flexible-parts.js';
const cache=new Map();
const materials=new Map();
function material(color){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.3,metalness:.025}));return materials.get(color);}
function mesh(g,geometry,mat,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function box(g,mat,x,y,z,a,b,c){return mesh(g,new T.BoxGeometry(a,b,c),mat,x,y,z);}
function cylinderX(g,mat,x,r,length){const m=mesh(g,new T.CylinderGeometry(r,r,length,16),mat,x);m.rotation.z=Math.PI/2;return m;}
function bar(g,mat,a,b,width=1.35,depth=6.2){const dir=new T.Vector3(...b).sub(new T.Vector3(...a)),m=mesh(g,new T.BoxGeometry(dir.length(),width,depth),mat,...a.map((x,i)=>(x+b[i])/2));m.rotation.z=Math.atan2(dir.y,dir.x);return m;}
function ring(g,mat,outer,inner,depth,start=0,arc=Math.PI*2){const s=new T.Shape();s.absarc(0,0,outer,start,start+arc,false);if(arc<6.28){s.lineTo(inner*Math.cos(start+arc),inner*Math.sin(start+arc));s.absarc(0,0,inner,start+arc,start,true);s.closePath();}else{const h=new T.Path();h.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(h);}const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.15,bevelThickness:.15,curveSegments:24});geo.translate(0,0,-depth/2);return mesh(g,geo,mat);}
export function makePart(type,p){if(BY_ID[type].flexi||BY_ID[type].tubing)return flexibleGeometry(BY_ID[type],p);if(cache.has(type))return cache.get(type).clone(true);const d=BY_ID[type],g=new T.Group(),mat=material(d.color);
 if(d.wormMotor){g.add(wormMotorGeometry());}else if(d.wormWheel){g.add(wormWheelGeometry());}else if(d.springMotor){g.add(springMotorGeometry());}else if(d.panel){g.add(panelGeometry(d,mat));}else if(d.group==='gears'){g.add(gearGeometry(d));
 }else if(d.group==='wheels'||d.endCap){g.add(wheelGeometry(d));
 }else if(d.clipGeometry){g.add(clipGeometry(d,mat));}
 else if(d.motor&&!d.legacy){g.add(d.twoSpeed?twoSpeedMotor(d):enclosedMotor(d));
 }else if(d.motor){
 const dark=material('#252c35'),light=material('#d5dce3');
 box(g,mat,-18,0,0,22,54,30);box(g,mat,18,0,0,22,54,30);box(g,mat,0,23,0,22,8,30);box(g,mat,0,-23,0,22,8,30);box(g,dark,0,-34,0,57,14,32);
 ring(g,dark,10,3.3,32);ring(g,light,6,3.3,34);
 for(const sign of[-1,1]){cylinderX(g,mat,sign*35.5,3.1,14.86);box(g,light,sign*18,0,15.3,14,30,1);}
 box(g,dark,0,29,0,14,5,12);box(g,light,0,32,0,5,2,10);
 }else if(d.driveClip){ring(g,mat,5.7,3.1,6.4,.35,Math.PI*1.78);box(g,mat,5,0,0,4,6,6.4);const pin=mesh(g,new T.CylinderGeometry(1.35,1.35,5,8),mat,5,0,4);pin.rotation.x=Math.PI/2;
 }else if(d.group==='rods'){
 const L=d.length;
 if(d.rodProfile==='square')box(g,mat,0,0,0,L-8,4.15,4.15);else cylinderX(g,mat,0,2.12,Math.max(1,L-8));
 if(d.stockIndex!==0&&d.rodProfile!=='square')for(let i=0;i<4;i++){const a=i*Math.PI/2;const rib=box(g,mat,0,2.04*Math.cos(a),2.04*Math.sin(a),L-13,1.85,1.85);rib.rotation.x=a;}
 for(const s of[-1,1]){cylinderX(g,mat,s*(L/2-4),2.55,4.2);cylinderX(g,mat,s*(L/2-1.2),3.05,2.4);cylinderX(g,mat,s*(L/2-6.7),3.03,1.2);}
 }else if(d.group==='extras'){
 ring(g,mat,5.7,3.23,d.thickness);
 }else{g.add(connectorGeometry(d,mat));}

 if(d.crossTie)crossTieArms(g,mat);
 cache.set(type,g);return g.clone(true);
}
export function tint(group,color,opacity=.45){group.traverse(o=>{if(o.isMesh){o.material=new T.MeshStandardMaterial({color,transparent:true,opacity,roughness:.5,depthWrite:false});o.castShadow=false;}});}
export function disposeGhost(group){group.traverse(o=>{if(o.isMesh)o.material.dispose();});}
export function iconSVG(d){if(d.wormMotor)return wormMotorIcon();if(d.wormWheel)return wormWheelIcon();if(d.springMotor)return springMotorIcon();if(d.panel)return panelIcon(d);if(d.clipGeometry)return clipIcon(d);if(d.flexi||d.tubing)return flexibleIcon(d);if(d.crossTie)return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(60 30)" fill="none" stroke="${d.color}" stroke-width="4"><circle r="6"/><path d="M-5 -3 -17 -14H-25M5 -3 17 -14H25M-25 -21V-7M25 -21V-7M-6 4 -18 15M-2 5 -6 21M2 5 6 21M6 4 18 15"/></g></svg>`;if(d.group==='gears')return gearIcon(d);if(d.group==='connectors')return connectorIcon(d);if(d.group==='wheels'||d.endCap)return wheelIcon(d);if(d.motor&&!d.legacy)return motorIcon(d);if(d.motor)return `<svg viewBox="0 0 120 58" aria-hidden="true"><rect x="35" y="6" width="50" height="42" rx="7" fill="${d.color}"/><rect x="35" y="39" width="50" height="12" rx="3" fill="#202832"/><path d="M23 27h13m49 0h13" stroke="${d.color}" stroke-width="6"/><circle cx="60" cy="25" r="8" fill="#c9d2dc"/><circle cx="60" cy="25" r="3" fill="#202832"/></svg>`;if(d.driveClip)return `<svg viewBox="0 0 120 58" aria-hidden="true"><path d="M70 20a15 15 0 1 0 0 20" fill="none" stroke="${d.color}" stroke-width="9"/><path d="M72 26h12v7H72" fill="${d.color}"/></svg>`;if(d.id==='c-white'||d.id==='r-white')d={...d,color:'#bdc3b7'};if(d.group==='rods'){const n=25+70*Math.sqrt(d.nominal/190);return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(60 29) rotate(-16)"><rect x="${-n/2}" y="-3.5" width="${n}" height="7" rx="2" fill="${d.color}" stroke="#9eaaa866"/><path d="M ${-n/2+6} -1 L ${n/2-6} -1" stroke="#fff7"/>${[-1,1].map(s=>`<rect x="${s*n/2-2}" y="-4.5" width="4" height="9" rx="1" fill="${d.color}" stroke="#0002"/>`).join('')}</g></svg>`;}
 if(d.group==='extras')return `<svg viewBox="0 0 120 58"><ellipse cx="60" cy="33" rx="16" ry="10" fill="${d.color}"/><path d="M44 25v8 M76 25v8" stroke="${d.color}" stroke-width="2"/><ellipse cx="60" cy="25" rx="16" ry="10" fill="${d.color}" stroke="#0002"/><ellipse cx="60" cy="25" rx="8" ry="5" fill="#f6f4ef"/></svg>`;
 return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(60 29) scale(1.22)">${d.slots.map(a=>`<g transform="rotate(${-a})"><path d="M4 -2 L10 -3 M4 2 L10 3" stroke="${d.color}" stroke-width="1.5"/><path d="M19 -3.8 H10 V3.8 H19" fill="none" stroke="${d.color}" stroke-width="2"/><path d="M12 -2.8 H18 M12 2.8 H18" stroke="${d.color}" stroke-width="1"/></g>`).join('')}<circle r="4.5" fill="none" stroke="${d.color}" stroke-width="2.5"/>${d.interlock?'<path d="M-4 -2 H-11 M-4 2 H-11" stroke="#fff" stroke-width="1.7"/>':''}</g></svg>`;
}
