import * as T from './vendor/three.module.js';
const poly=points=>{const s=new T.Shape();s.moveTo(...points[0]);points.slice(1).forEach(p=>s.lineTo(...p));s.closePath();return s;};
function extrude(g,shape,mat,depth=6.3,z=0){const geo=new T.ExtrudeGeometry(shape,{depth:depth-.24,bevelEnabled:true,bevelSize:.12,bevelThickness:.12,bevelSegments:2,curveSegments:32});geo.translate(0,0,z-(depth-.24)/2);const mesh=new T.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}
export function clipGeometry(d,mat){const g=new T.Group();g.name=`Classic clip ${d.partNumber}`;
 if(d.yClip){
  // A compact C-jaw across the shaft, with a short male rod-end peg behind it.
  const jaw=poly([[6.1,-4.5],[14.5,-4.5],[14.5,-2.65],[11.7,-2.65],[10.1,-3.1],[8.1,-2.4],[7.1,0],[8.1,2.4],[10.1,3.1],[11.7,2.65],[14.5,2.65],[14.5,4.5],[6.1,4.5]]);extrude(g,jaw,mat);
  for(const [x,r,len] of [[5,2.5,5.6],[1.2,3.05,2.4],[6.3,3.05,2]]){const m=new T.Mesh(new T.CylinderGeometry(r,r,len,24),mat);m.rotation.z=Math.PI/2;m.position.x=x;m.castShadow=true;m.receiveShadow=true;g.add(m);}
  return g;
 }
 // The socket centre remains at x=10.1, matching the existing end-seat contract.
 const body=new T.Shape();if(d.ballFamily){
  body.moveTo(5.3,-4.3);body.lineTo(10.4,-4.3);body.lineTo(10.4,4.3);body.lineTo(5.3,4.3);body.closePath();
  const opening=new T.Path();opening.moveTo(6,-1.5);opening.lineTo(8.6,-2.3);opening.lineTo(8.6,2.3);opening.lineTo(6,1.5);opening.closePath();body.holes.push(opening);
 }else if(d.hingeHalf){body.moveTo(0,-5.2);body.absarc(0,0,5.2,-Math.PI/2,Math.PI/2,true);body.lineTo(10.4,5.2);body.lineTo(10.4,-5.2);body.closePath();const hole=new T.Path();hole.absarc(0,0,d.hingeHalf==='pin'?1.65:3.2,0,Math.PI*2,true);body.holes.push(hole);
  const opening=new T.Path();opening.moveTo(5.4,-1.3);opening.lineTo(8.6,-2.3);opening.lineTo(8.6,2.3);opening.lineTo(5.4,1.3);opening.closePath();body.holes.push(opening);
 }else{body.moveTo(9.9,-4.3);body.absarc(9.9,0,4.3,-Math.PI/2,Math.PI/2,true);body.lineTo(11.4,4.3);body.lineTo(11.4,-4.3);body.closePath();}
 extrude(g,body,mat);
 for(const sign of[-1,1]){const s=new T.Shape(),p=(x,y)=>[x,sign*y];s.moveTo(...p(9.6,4.3));s.lineTo(...p(19.3,4.3));s.quadraticCurveTo(...p(19.7,4.3),...p(19.7,3.8));s.lineTo(...p(19.7,2.65));s.lineTo(...p(16.3,2.65));s.quadraticCurveTo(...p(15.1,3.45),...p(13.9,3.25));s.lineTo(...p(12.3,2.3));s.lineTo(...p(9.6,2.3));s.closePath();extrude(g,s,mat);}
 if(d.ballFamily){const x=d.ballCenter,r=d.ballRadius;
  if(d.ballRole==='ball'){const ball=new T.Mesh(new T.SphereGeometry(r,32,24),mat);ball.position.x=x;ball.castShadow=true;ball.receiveShadow=true;g.add(ball);const neck=new T.Mesh(new T.CylinderGeometry(1.85,1.85,6.2-x-r*.6,20),mat);neck.rotation.z=Math.PI/2;neck.position.x=(6.2+x+r*.6)/2;g.add(neck);}
  else{const cup=new T.Shape(),outer=r+1.4,inner=r+.12,opening=.55;cup.absarc(x,0,outer,-Math.PI+opening,Math.PI-opening,false);cup.lineTo(x+inner*Math.cos(Math.PI-opening),inner*Math.sin(Math.PI-opening));cup.absarc(x,0,inner,Math.PI-opening,-Math.PI+opening,true);cup.closePath();extrude(g,cup,mat,d.ballFamily==='large'?9:6.3);
   if(d.ballFamily==='large')for(const sign of[-1,1])extrude(g,poly([[x+1,sign*5.8],[8,sign*5.8],[8,sign*4.1],[x+1,sign*4.1]]),mat,6.3);
  }
 }
 if(d.hingeHalf==='pin'){const boss=new T.Shape();boss.absarc(0,0,3.12,0,Math.PI*2,false);const inner=new T.Path();inner.absarc(0,0,1.65,0,Math.PI*2,true);boss.holes.push(inner);extrude(g,boss,mat,3.5,4.78);}
 return g;
}
export function clipIcon(d){if(d.ballFamily)return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(45 29) scale(2)" fill="${d.color}" stroke="#91a4b4" stroke-width=".55"><path d="M5 -4.3H19.7V-2.65H16L14 -3.3 12 -2.3H10V2.3H12L14 3.3 16 2.65H19.7V4.3H5Z"/>${d.ballRole==='ball'?`<path d="M${d.ballCenter} -1.8H7V1.8H${d.ballCenter}Z"/><circle cx="${d.ballCenter}" r="${d.ballRadius}"/>`:`<path d="M${d.ballCenter-3} -${d.ballRadius}A${d.ballRadius+1} ${d.ballRadius+1} 0 1 1 ${d.ballCenter-3} ${d.ballRadius}" fill="none" stroke="#91a4b4" stroke-width="2"/>`}</g></svg>`;if(d.yClip)return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(40 29) scale(2.5)" fill="${d.color}" stroke="#91a4b4" stroke-width=".35"><path d="M6 -4.5H14.5V-2.65H11.7L10.1 -3.1 8.1 -2.4 7.1 0 8.1 2.4 10.1 3.1H11.7V2.65H14.5V4.5H6Z"/><path d="M0 -3H2.4L3.4 -2.2H5L6 -3H7V3H6L5 2.2H3.4L2.4 3H0Z"/></g></svg>`;return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(42 29) scale(2)" fill="${d.color}" stroke="${d.id==='hinge-black'?'#91a4b4':'#8ba0b333'}" stroke-width=".5">${d.hingeHalf?'<path fill-rule="evenodd" d="M0 -5.2A5.2 5.2 0 1 0 0 5.2H10V-5.2ZM0 -3A3 3 0 1 1 0 3A3 3 0 1 1 0 -3Z"/>':'<path d="M10 -4.3A4.3 4.3 0 0 0 10 4.3H12V-4.3Z"/>'}<path d="M9.6 -4.3H19.7V-2.7H16L14 -3.3 12 -2.3H10V2.3H12L14 3.3 16 2.7H19.7V4.3H9.6Z"/>${d.hingeHalf==='pin'?'<circle r="3.1" fill="none" stroke="#76d5f2" stroke-width="1.1"/>':''}</g></svg>`;}
