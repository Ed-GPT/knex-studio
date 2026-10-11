import * as T from './vendor/three.module.js';
const plastic=new T.MeshStandardMaterial({color:'#8d9394',roughness:.48,metalness:.08}),rubber=new T.MeshStandardMaterial({color:'#242629',roughness:.92}),capMat=new T.MeshStandardMaterial({color:'#202226',roughness:.5});
function mesh(g,geo,mat,z=0){const m=new T.Mesh(geo,mat);m.position.z=z;m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function disc(g,r,inner,depth,z,mat,keys=false){const s=new T.Shape();s.absarc(0,0,r,0,Math.PI*2,false);const hole=(x,y,r)=>{const h=new T.Path();h.absarc(x,y,r,0,Math.PI*2,true);s.holes.push(h);};hole(0,0,inner);if(keys)for(const x of[-5,5])hole(x,0,1.4);const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:48});geo.translate(0,0,-depth/2);return mesh(g,geo,mat,z);}
// Open-spoke hubs and road tyres follow the supplier's original mould photos.
// Cross-sections are estimated; wheelStyle selects a real family, not a skin.
function spoke(g,mat,r0,r1,width,depth,z,angle){
 const a=new T.Vector3(r0*Math.cos(angle),r0*Math.sin(angle),z),b=new T.Vector3(r1*Math.cos(angle),r1*Math.sin(angle),z),m=mesh(g,new T.BoxGeometry(r1-r0,width,depth),mat,z);m.position.copy(a.add(b).multiplyScalar(.5));m.rotation.z=angle;return m;
}
function classicHub(d){const g=new T.Group(),r=d.diameter/2,w=d.thickness,mat=new T.MeshStandardMaterial({color:d.color,roughness:.45,metalness:d.color==='#929699'?.15:.03}),n=d.spokes;
 if(d.wheelStyle.startsWith('spoked')){
  // Pulley groove between the two rim flanges, with six visible openings.
  disc(g,r-1.2,r-3,w-1.3,0,mat);for(const z of[-1,1])disc(g,r,r-3,1,z*(w/2-.5),mat);
  disc(g,5.5,3.25,w,0,mat);
  for(let i=0;i<n;i++){const a=i*Math.PI*2/n;spoke(g,mat,4.8,r-2,d.wheelStyle==='spoked-flat'?4.7:3.7,2.2,0,a);if(d.wheelStyle==='spoked'){spoke(g,mat,5.7,r-3,1,1.4,1.7,a+.1);const dot=mesh(g,new T.SphereGeometry(.65,8,6),mat,1.3);dot.position.x=10*Math.cos(a);dot.position.y=10*Math.sin(a);}}
  if(d.keyable)for(const x of[-5,5]){const key=new T.Group();disc(key,2.3,1.4,2,-w/2+1,mat);key.position.x=x;g.add(key);}
 }else{
  disc(g,r,r-1.5,w,0,mat);
  // Deep, five-spoke racing cups have a blind end bearing. Narrow hubs have
  // a real through bore and six spokes. Front/back are mechanically distinct.
  const z=d.endBearing?w/2-3:0,hubDepth=d.endBearing?w-1:w;
  disc(g,7.3,3.25,hubDepth,0,mat,true);
  if(d.endBearing){const cap=mesh(g,new T.CylinderGeometry(4.6,4.6,1.2,32),mat,w/2-.6);cap.rotation.x=Math.PI/2;disc(g,5.4,4.6,.7,w/2-.8,mat);}
  for(let i=0;i<n;i++){const a=(i+.5)*Math.PI*2/n;spoke(g,mat,6,r-1.2,3.6,2,z,a);for(const sign of[-1,1]){const rib=spoke(g,mat,8,r-3,.65,1,z+1.2,a);rib.position.x+=-Math.sin(a)*sign*1.35;rib.position.y+=Math.cos(a)*sign*1.35;}}
  for(const sign of[-1,1])disc(g,r+.15,r-1.5,.7,sign*(w/2-.35),mat);
 }
 return g;
}
function roadTyre(d){const g=new T.Group(),r=d.diameter/2,inner=d.fitDiameter/2-.15,w=d.thickness,mat=rubber;
 const section=[[inner,-w/2],[r-1,-w/2],[r-.25,-w/2+.8],[r,0],[r-.25,w/2-.8],[r-1,w/2],[inner,w/2],[inner,-w/2]].map(([radius,z])=>new T.Vector2(radius,z));
 const core=mesh(g,new T.LatheGeometry(section,72),mat);core.rotation.x=Math.PI/2;
 if(d.tread!=='slick'){
  // Circumferential bands and small shoulder blocks, rather than off-road lugs.
  for(const z of[-w*.14,0,w*.14]){const m=mesh(g,new T.TorusGeometry(r-.05,.18,4,72),mat,z);}
  for(const sign of[-1,1])for(let i=0;i<40;i++){const a=i*Math.PI*2/40,m=mesh(g,new T.BoxGeometry(.65,Math.PI*d.diameter/40*.7,w*.22),mat,sign*w*.33);m.position.x=(r-.05)*Math.cos(a);m.position.y=(r-.05)*Math.sin(a);m.rotation.z=a;}
 }
 return g;
}
export function wheelGeometry(d){const g=new T.Group();g.name=`K'NEX ${d.partNumber}`;
 if(d.wheelStyle)return classicHub(d);if(d.tread)return roadTyre(d);
 if(d.endCap){disc(g,4.2,3.1,5,0,capMat);disc(g,4.2,.7,.8,2.7,capMat);return g;}
 const r=d.diameter/2,w=d.thickness;
 if(d.tire){const inner=d.fitDiameter/2-.25,core=r-(d.diameter===47?1.1:2.1);disc(g,core,inner,w,0,rubber);for(const sign of[-1,1]){disc(g,core-.2,inner+.8,.7,sign*(w/2+.2),rubber);for(let i=0;i<28;i++){const a=(i+(sign<0?.5:0))*Math.PI*2/28;const geo=new T.BoxGeometry((r-core)*1.8,2*Math.PI*r/28*.59,w*.48),m=mesh(g,geo,rubber,sign*w*.26);m.position.x=(core+(r-core)/2-.1)*Math.cos(a);m.position.y=(core+(r-core)/2-.1)*Math.sin(a);m.rotation.z=a;}}return g;}
 // Flanged pulley rim with a recessed web, spokes and two drive-key holes.
 disc(g,r-1.5,r-4,w-1.2,0,plastic);
 for(const sign of[-1,1])disc(g,r,r-4,1.1,sign*(w/2-.55),plastic);
 disc(g,r-3.8,3.25,1.4,0,plastic,true);
 disc(g,7.3,3.25,w,0,plastic,true);
 const count=d.diameter===37?6:5;
 for(const sign of[-1,1])for(let i=0;i<count;i++){const a=(i+.5)*Math.PI*2/count;const len=r-11,geo=new T.BoxGeometry(len,1.25,w*.36),m=mesh(g,geo,plastic,sign*w*.2);m.position.x=(7.3+len/2)*Math.cos(a);m.position.y=(7.3+len/2)*Math.sin(a);m.rotation.z=a;}
 return g;
}
export function wheelIcon(d){if(d.wheelStyle){const n=d.spokes,r=23;return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(60 29)" stroke="${d.color}" fill="none" style="filter:drop-shadow(0 0 .7px #bdc7d3)"><circle r="${r}" stroke-width="4"/><circle r="6" stroke-width="3"/>${Array.from({length:n},(_,i)=>`<path d="M7 0H22" transform="rotate(${i*360/n})" stroke-width="4"/>`).join('')}${d.endBearing?`<circle r="3.5" fill="${d.color}"/>`:''}</g></svg>`;}if(d.endCap)return '<svg viewBox="0 0 120 58"><rect x="48" y="17" width="28" height="25" rx="6" fill="#12161a"/><ellipse cx="48" cy="29" rx="8" ry="12" fill="#353a40"/><ellipse cx="48" cy="29" rx="4.5" ry="7" fill="#16191d"/></svg>';const r=15+Math.min(d.diameter,90)/10;return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(60 29)"><circle r="${r}" fill="${d.tire?'#181b1e':'#90999f'}" stroke="#6f7880"/><circle r="${d.tire?r*d.fitDiameter/d.diameter:4}" fill="#272c34"/>${d.tire?(d.tread==='slick'?'':Array.from({length:22},(_,i)=>`<path d="M${r-3} 0h3" transform="rotate(${i*360/22})" stroke="#555c63" stroke-width="2.5"/>`).join('')):Array.from({length:d.diameter===37?6:5},(_,i)=>`<path d="M7 0h${r-11}" transform="rotate(${i*360/(d.diameter===37?6:5)+30})" stroke="#c6cdd0" stroke-width="2"/>`).join('')}</g></svg>`;}
