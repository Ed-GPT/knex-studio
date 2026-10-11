import * as T from './vendor/three.module.js';
const plastic=new T.MeshStandardMaterial({color:'#8d9394',roughness:.48,metalness:.08}),rubber=new T.MeshStandardMaterial({color:'#242629',roughness:.92}),capMat=new T.MeshStandardMaterial({color:'#202226',roughness:.5});
function mesh(g,geo,mat,z=0){const m=new T.Mesh(geo,mat);m.position.z=z;m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function disc(g,r,inner,depth,z,mat,keys=false){const s=new T.Shape();s.absarc(0,0,r,0,Math.PI*2,false);const hole=(x,y,r)=>{const h=new T.Path();h.absarc(x,y,r,0,Math.PI*2,true);s.holes.push(h);};hole(0,0,inner);if(keys)for(const x of[-5,5])hole(x,0,1.4);const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:48});geo.translate(0,0,-depth/2);return mesh(g,geo,mat,z);}
export function wheelGeometry(d){const g=new T.Group();g.name=`K'NEX ${d.partNumber}`;
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
export function wheelIcon(d){if(d.endCap)return '<svg viewBox="0 0 120 58"><rect x="48" y="17" width="28" height="25" rx="6" fill="#12161a"/><ellipse cx="48" cy="29" rx="8" ry="12" fill="#353a40"/><ellipse cx="48" cy="29" rx="4.5" ry="7" fill="#16191d"/></svg>';const r=15+Math.min(d.diameter,90)/10;return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(60 29)"><circle r="${r}" fill="${d.tire?'#181b1e':'#90999f'}" stroke="#6f7880"/><circle r="${d.tire?r*d.fitDiameter/d.diameter:4}" fill="#272c34"/>${d.tire?Array.from({length:22},(_,i)=>`<path d="M${r-3} 0h3" transform="rotate(${i*360/22})" stroke="#555c63" stroke-width="2.5"/>`).join(''):Array.from({length:d.diameter===37?6:5},(_,i)=>`<path d="M7 0h${r-11}" transform="rotate(${i*360/(d.diameter===37?6:5)+30})" stroke="#c6cdd0" stroke-width="2"/>`).join('')}</g></svg>`;}
