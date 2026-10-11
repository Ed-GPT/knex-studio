import * as T from './vendor/three.module.js';
const RAD=Math.PI/180;
function hull(points){const p=points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);const half=a=>{const r=[];for(const v of a){while(r.length>1&&cross(r.at(-2),r.at(-1),v)<=0)r.pop();r.push(v);}return r;};return half(p).slice(0,-1).concat(half([...p].reverse()).slice(0,-1));}
const polar=(r,a)=>[r*Math.cos(a),r*Math.sin(a)];
function polygon(points,Path=T.Shape){const s=new Path();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return s;}
function extrude(g,s,mat,depth=6.3,z=0){const geo=new T.ExtrudeGeometry(s,{depth:depth-.24,bevelEnabled:true,bevelSize:.12,bevelThickness:.12,bevelSegments:2,curveSegments:32,steps:1});geo.translate(0,0,-(depth-.24)/2+z);const m=new T.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
export function connectorGeometry(d,mat){const g=new T.Group();g.name=`K'NEX ${d.partNumber}`;let body;
 if(d.id==='c-orange'){body=polygon([[-10.8,-4.5],[10.8,-4.5],[10.8,4.5],[-10.8,4.5]]);}
 else if(d.interlock){
  // Open radial receiving channel; it is part of the outline, not a painted mark.
  const start=d.id==='c-blue'?Math.PI+Math.asin(3.3/10.8):-Math.asin(3.3/10.8),end=d.id==='c-blue'?3*Math.PI-Math.asin(3.3/10.8):Math.PI-Math.asin(3.3/10.8);
  body=new T.Shape();body.absarc(0,0,10.8,start,end,false);body.lineTo(-1.8,3.3);body.absarc(0,0,3.3,Math.PI/2,-Math.PI/2,true);if(d.id==='c-blue')body.lineTo(-10.8,-3.3);else body.lineTo(10.3,-3.3);body.closePath();
 }else{const pts=[];for(let i=0;i<64;i++)pts.push(polar(5.1,i*Math.PI/32));for(const a of d.slots)for(let i=-4;i<=4;i++)pts.push(polar(10.8,(a+i*5.625)*RAD));body=polygon(hull(pts));}
 if(!d.interlock){const h=new T.Path();h.absarc(0,0,3.23,0,Math.PI*2,true);body.holes.push(h);}
 for(const a of d.slots){const angle=a*RAD,rotate=([x,y])=>[x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];let opening=[[5.25,-1.55],[9.4,-3.15],[9.4,3.15],[5.25,1.55]];
  // Leave intact the material alongside the 3D receiving channel.
  if(d.interlock&&a===0)opening=[[5.25,-1.35],[9.4,-2.7],[9.4,2.7],[5.25,1.35]];
  body.holes.push(polygon(opening.map(rotate),T.Path));
 }
 extrude(g,body,mat);
 for(const angle of d.slots){const arm=new T.Group();arm.rotation.z=angle*RAD;g.add(arm);
  // Rounded scallops locate the rod's flange; each wall is a single molded jaw.
  for(const sign of[-1,1]){const s=new T.Shape();const p=(x,y)=>[x,sign*y];s.moveTo(...p(9.8,4.25));s.lineTo(...p(19.15,4.25));s.quadraticCurveTo(...p(19.5,4.25),...p(19.5,3.85));s.lineTo(...p(19.5,2.8));s.lineTo(...p(16.2,2.8));s.quadraticCurveTo(...p(15.8,2.8),...p(15.2,3.2));s.quadraticCurveTo(...p(14.0,3.6),...p(12.7,2.65));s.quadraticCurveTo(...p(12.4,2.45),...p(11.9,2.45));s.lineTo(...p(9.8,2.45));s.closePath();extrude(arm,s,mat);
   for(const z of[-2.55,2.55])extrude(arm,polygon([[16.4,sign*2.85],[19.2,sign*2.85],[19.2,sign*2.35],[16.4,sign*2.35]]),mat,.85,z);
  }
 }
 if(d.interlock){for(const sign of[-1,1])extrude(g,polygon([[-14.8,sign*3.3],[d.id==='c-purple'?4.5:-2,sign*3.3],[d.id==='c-purple'?4.5:-2,sign*4.65],[-14.8,sign*4.65]]),mat,6.3);}
 return g;
}
export function connectorIcon(d){const color=d.color,path=pts=>'M'+pts.map(p=>p.map(v=>v.toFixed(2)).join(' ')).join('L')+'Z';let outline;
 if(d.id==='c-orange')outline=path([[-10.8,-4.5],[10.8,-4.5],[10.8,4.5],[-10.8,4.5]]);
 else{const pts=[];for(let i=0;i<48;i++)pts.push(polar(5.1,i*Math.PI/24));for(const a of d.slots)for(let i=-4;i<=4;i++)pts.push(polar(10.8,(a+i*5.625)*RAD));outline=path(hull(pts));}
 return `<svg viewBox="0 0 120 58" aria-hidden="true"><g stroke="none" transform="translate(60 29) scale(1.2 -1.2)"><path d="${outline}" fill="${color}"/>${d.slots.map(a=>`<path transform="rotate(${a})" d="M9.8 -4.2H19.5V-2.7H16L14 -3.3 12 -2.4H10V2.4H12L14 3.3 16 2.7H19.5V4.2H9.8Z" fill="${color}"/>`).join('')}${d.slots.map(a=>`<path transform="rotate(${a})" d="M5.2 -1.55 9.4 -3.15 9.4 3.15 5.2 1.55Z" fill="#272c34"/>`).join('')}<circle r="3.2" fill="#272c34"/>${d.interlock?`<path d="M-15 -4H0M-15 4H0" stroke="${color}" stroke-width="1.3"/><path d="M-16 -3.2H0V3.2H-16Z" fill="#272c34"/>`:''}</g></svg>`;}
