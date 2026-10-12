import * as T from './vendor/three.module.js';
const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.3,...extra});
export function tetheredMotorGeometry(d){const g=new T.Group(),plastic=mat(d.color),clear=mat('#d8e8df',{transparent:true,opacity:.24,depthWrite:false,side:T.DoubleSide}),edge=mat('#bbc7bf'),yellow=mat('#edca32'),metal=mat('#aaaeb0',{metalness:.65}),dark=mat('#343b37'),cable=mat('#9a9989');
 const mesh=(geo,m,x=0,y=0,z=0)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
 const box=(m,x,y,z,w,h,l)=>mesh(new T.BoxGeometry(w,h,l),m,x,y,z);
 const ring=(m,x,y,z,outer,inner,depth,axis='z')=>{const s=new T.Shape();s.absarc(0,0,outer,0,2*Math.PI);const h=new T.Path();h.absarc(0,0,inner,0,2*Math.PI,true);s.holes.push(h);const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32});geo.translate(0,0,-depth/2);const o=mesh(geo,m,x,y,z);if(axis==='x')o.rotation.y=Math.PI/2;return o;};
 const plate=(x,y,z,w,h,depth,holes=[])=>{const s=new T.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();for(const [a,b,r]of holes){const p=new T.Path();p.absarc(a,b,r,0,Math.PI*2,true);s.holes.push(p);}const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32});geo.translate(0,0,-depth/2);return mesh(geo,clear,x,y,z);};
 // Clear gearbox with a genuinely open transverse shaft and a blind end socket.
 for(const z of[-9.45,9.45])plate(0,0,z,59,37,1.1,[[0,0,3.35]]);
 for(const y of[-18.5,18.5])box(clear,0,y,0,59,1.2,18.9);
 box(clear,29.5,0,0,1.2,37,18.9);const front=plate(-29.5,0,0,18.9,37,1.2,[[0,0,3.35]]);front.rotation.y=Math.PI/2;
 ring(yellow,0,0,0,14.5,3.3,5);for(let i=0;i<34;i++){const a=i*Math.PI/17,o=box(yellow,15*Math.cos(a),15*Math.sin(a),0,1.5,2,5);o.rotation.z=a;}
 for(const z of[-10,10])ring(yellow,0,0,z,5,3.25,2);
 ring(yellow,-28,0,0,5,3.25,8,'x');box(yellow,-23.5,0,0,1,7,7);
 // Secondary gears and the electric motor can are reference-visible internals;
 // tooth counts here are visual estimates, not a calibrated internal gearbox.
 for(const [x,y,r]of[[19,7,6],[21,-7,5]]){ring(yellow,x,y,0,r,1.2,5);mesh(new T.CylinderGeometry(1,1,2,12),metal,x,y,3).rotation.x=Math.PI/2;}
 const can=mesh(new T.CylinderGeometry(9,9,28,32),metal,45,0,0);can.rotation.z=Math.PI/2;box(clear,46,-10,0,34,1.2,22);box(clear,64,0,0,1.2,22,22);for(const z of[-11,11])box(clear,46,0,z,36,22,1.1);
 // Docked motor + holder arrangement shown in M2. Their mounting passages
 // are represented together; the holder cannot yet be positioned separately.
 for(const b of d.bores.slice(1)){const [x,y]=b.pos;for(const z of[-9.45,9.45]){plate(x,y+4,z,10,18,1.2,[[0,-4,3.25]]);ring(clear,x,y,z,5.2,3.25,2.2);}ring(plastic,x,y,0,5.3,3.25,26);}
 const body=new T.Shape();body.moveTo(-36,-13);body.lineTo(36,-13);body.quadraticCurveTo(40,-13,40,-9);body.lineTo(40,9);body.quadraticCurveTo(40,13,36,13);body.lineTo(-36,13);body.quadraticCurveTo(-40,13,-40,9);body.lineTo(-40,-9);body.quadraticCurveTo(-40,-13,-36,-13);const bg=new T.ExtrudeGeometry(body,{depth:29,bevelEnabled:true,bevelSize:1,bevelThickness:1,bevelSegments:2});bg.translate(0,0,-14.5);mesh(bg,plastic,3,-44,0);
 box(dark,36,-43,15.2,4,8,.5);box(plastic,36,-41,15.8,2.5,3,1);for(const x of[-28,28])box(plastic,x,-44,15.2,1,23,.8);
 // Folded visual lead: real stock length is metadata, not simulated cable slack.
 const points=d.leadLength>200?[[64,0,0],[76,-5,0],[81,-20,0],[68,-26,9],[70,-16,17],[83,-20,18],[84,-40,10],[52,-49,7],[44,-44,0]]:[[64,0,0],[77,-8,0],[76,-35,0],[54,-44,0],[44,-44,0]];
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));mesh(new T.TubeGeometry(curve,64,1.1,8,false),cable);
 for(const x of[-23,23])for(const y of[-13,13]){ring(edge,x,y,10.2,2,1,1);box(dark,x,y,11,2.5,.5,.2);}
 g.name='K’NEX '+d.partNumber+' docked tethered motor';return g;
}
export function tetheredMotorIcon(d){return `<svg viewBox="0 0 120 58" aria-hidden="true"><g stroke="#b9c9c3" stroke-width="1"><path d="M18 4H70V28H18Z" fill="#adcbc755"/><circle cx="41" cy="17" r="10" fill="#e3c638"/><circle cx="41" cy="17" r="3" fill="#263135"/><rect x="70" y="9" width="21" height="15" rx="4" fill="#aeb8b2"/><path d="M91 15Q113 20 104 37L89 44" fill="none" stroke="#aaa890" stroke-width="2"/><rect x="18" y="35" width="72" height="19" rx="5" fill="${d.color}"/><path d="M26 28V35M63 28V35"/><rect x="82" y="40" width="3" height="7" fill="#263135"/></g></svg>`;}
