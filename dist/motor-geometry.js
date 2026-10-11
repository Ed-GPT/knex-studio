import * as T from './vendor/three.module.js';
// Photo reconstruction of enclosed motors 92840 / 22722. Values are estimates,
// not manufacturer measurements. The bore stays at the part origin, along Z.
export const MOTOR_SHAPE={headRadius:19,depth:30,mountPlane:18.75,rear:-65};
const materials=new Map();
const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.32,metalness:.015}));return materials.get(c);};
function add(g,geo,m,x=0,y=0,z=0){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
function rounded(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function slab(g,m,w,h,depth,x,y,z,r=1,bevel=.4){const geo=new T.ExtrudeGeometry(rounded(w,h,r),{depth:depth-2*bevel,steps:1,bevelEnabled:bevel>0,bevelSegments:3,bevelSize:bevel,bevelThickness:bevel,curveSegments:8});geo.translate(0,0,-depth/2+bevel);return add(g,geo,m,x,y,z);}
function ring(g,m,outer,inner,depth,z=0){const s=new T.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);const h=new T.Path();h.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(h);const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:48});geo.translate(0,0,-depth/2);return add(g,geo,m,0,0,z);}
let labelMaterial;
function label(){if(labelMaterial)return labelMaterial;if(typeof document==='undefined')return mat('#151719');const c=document.createElement('canvas');c.width=512;c.height=160;const x=c.getContext('2d');x.fillStyle='#111411';x.fillRect(0,0,512,160);x.fillStyle='#f5f4eb';x.font='italic 900 118px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText('K’NEX',256,85,480);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;labelMaterial=new T.MeshStandardMaterial({map:tex,roughness:.48});return labelMaterial;}
export function enclosedMotor(d){const g=new T.Group(),plastic=mat(d.color),dark=mat('#161b1d'),yellow=mat('#edc128'),seam=mat(new T.Color(d.color).multiplyScalar(.64).getHexString().replace(/^/,'#'));
 g.name=`K'NEX ${d.partNumber} enclosed motor`;
 // Long two-AA battery shell, rounded ends, ribbed side walls and lid seam.
 slab(g,plastic,60,31,28,-35,1,0,3.2,.65);
 slab(g,seam,57,27.5,.38,-36,.2,14.5,2,.08);
 slab(g,plastic,56.3,26.8,.55,-36,.2,14.8,2,.1);
 for(let i=0;i<19;i++){const x=-62+i*2.6;for(const s of[-1,1])slab(g,plastic,1.05,27.3,1.2,x,.6,s*14.65,.48,.15);}
 // Raised lengthwise mold detail below the gearbox transition.
 for(const z of[-1,1]){slab(g,plastic,21,1.2,1.4,-16,-9,z*14.5,.4,.2);slab(g,plastic,17,1.2,1.4,-19,-12,z*14.5,.4,.2);}
 // Continuous gearbox bore: no hidden solid primitive across the axle.
 ring(g,plastic,19,3.35,29.7);ring(g,seam,19.15,18.55,.45);
 for(const sign of[-1,1]){
  ring(g,plastic,18.2,3.35,1.3,sign*15.3);
  ring(g,plastic,13.3,3.35,.65,sign*16.05);
  ring(g,yellow,4.4,3.12,1.3,sign*16.8);
  // Four molded retaining lugs engage the connector web, around the axle.
  for(let i=0;i<4;i++){const a=(22.5+i*90)*Math.PI/180,o=slab(g,plastic,2.4,3.0,5.1,8.2*Math.cos(a),8.2*Math.sin(a),sign*18.1,.6,.2);o.rotation.z=a;}
  if(d.partNumber==='92840')for(const a of[-40,75,200]){const x=15.1*Math.cos(a*Math.PI/180),y=15.1*Math.sin(a*Math.PI/180);const screw=add(g,new T.CylinderGeometry(1.45,1.45,.45,16),mat('#abb0ae'),x,y,sign*16.15);screw.rotation.x=Math.PI/2;slab(g,dark,1.9,.32,.16,x,y,sign*16.43,.05,0);}
 }
 // Flat label and recessed reversing switch on the top shoulder.
 const sticker=add(g,new T.PlaneGeometry(40,12),label(),-40,17.21,0);sticker.rotation.x=-Math.PI/2;
 const rim=slab(g,seam,10,8,1.1,-7,16.6,0,1,.25);rim.rotation.x=-Math.PI/2;
 const slot=slab(g,dark,7.5,5.3,1.2,-7,17.15,0,.6,.1);slot.rotation.x=-Math.PI/2;
 const toggle=slab(g,mat('#323b37'),3.2,4.2,1.8,-7,17.8,0,.45,.1);toggle.rotation.x=-Math.PI/2;
 // Battery-cover screw at rear, separate from the gearbox fasteners.
 const screw=add(g,new T.CylinderGeometry(1.4,1.4,.5,16),mat('#9ba2a3'),-59,-8,15.42);screw.rotation.x=Math.PI/2;slab(g,dark,1.8,.3,.1,-59,-8,15.72,.04,0);
 return g;
}
export function motorIcon(d){if(d.twoSpeed)return `<svg viewBox="0 0 120 58" aria-hidden="true"><g fill="${d.color}" stroke="#b6c1c7" stroke-width=".65"><rect x="7" y="9" width="78" height="40" rx="6"/><circle cx="88" cy="29" r="23"/><path d="M31 10V48M60 10V48" fill="none" stroke-width="3"/><circle cx="88" cy="29" r="4" fill="#252d30"/><rect x="13" y="15" width="13" height="6" rx="2" fill="#252d30"/><rect x="13" y="32" width="13" height="6" rx="2" fill="#2589b8"/>${[0,90,180,270].map(a=>`<path d="M88 18v4" transform="rotate(${a} 88 29)" stroke-width="2"/>`).join('')}</g></svg>`;return `<svg viewBox="0 0 120 58" aria-hidden="true"><g transform="translate(8 7)"><path d="M6 4h59q7 0 7 8v26H6q-4 0-4-5V9q0-5 4-5" fill="${d.color}" stroke="#1116"/><path d="M8 9h42v11H8z" fill="#1a211b"/><text x="29" y="18" text-anchor="middle" fill="#eee" stroke="none" font-size="10" font-weight="bold">K’NEX</text>${Array.from({length:13},(_,i)=>`<path d="M${6+i*4} 24v12" stroke="#fff2"/>`).join('')}<circle cx="74" cy="25" r="20" fill="${d.color}" stroke="#1116"/><circle cx="74" cy="25" r="4" fill="#dfbd32"/><circle cx="74" cy="25" r="2" fill="#20252d"/>${[0,90,180,270].map(a=>`<path d="M74 13v4" transform="rotate(${a} 74 25)" stroke="#fff4" stroke-width="3"/>`).join('')}</g></svg>`;}

export function twoSpeedMotor(d){
 const g=new T.Group(),plastic=mat(d.color),seam=mat('#596363'),dark=mat('#252d30'),blue=mat('#2589b8');g.name='K’NEX 92401 two-speed motor';
 // Broad four-AA shell. Separate stepped lid panels, transverse ribs and the
 // rounded gearbox reproduce the reference family, not the two-AA casing.
 slab(g,plastic,109,54,55,-59.5,0,0,5,.65);
 for(const sign of [-1,1]){
  slab(g,seam,104,49,.55,-59,0,sign*28,4,.12);
  for(const [x,w] of [[-95,31],[-57,36],[-22,27]])slab(g,plastic,w,47,1.1,x,0,sign*28.65,2,.25);
  for(const x of [-76,-36])slab(g,plastic,2.5,53,2.4,x,0,sign*29.2,.7,.25);
  for(const [x,y] of [[-104,-20],[-104,20],[-41,-20],[-41,20]]){
   const boss=ring(new T.Group(),plastic,3.4,1.7,2.8);boss.position.set(x,y,sign*29.4);g.add(boss);
  }
 }
 ring(g,plastic,29.5,3.35,57);ring(g,seam,29.7,29,.6);
 for(const sign of [-1,1]){
  ring(g,plastic,28.7,3.35,1.4,sign*29.1);ring(g,plastic,18,3.35,.7,sign*30.15);ring(g,dark,4.4,3.15,.55,sign*30.8);
  for(const a of [22.5,112.5,202.5,292.5]){const angle=a*Math.PI/180,o=slab(g,plastic,2.4,3,5.1,8.2*Math.cos(angle),8.2*Math.sin(angle),sign*32.5,.6,.2);o.rotation.z=angle;}
  for(const a of [-48,48,150]){const angle=a*Math.PI/180,boss=ring(new T.Group(),plastic,3.3,1.5,2);boss.position.set(24*Math.cos(angle),24*Math.sin(angle),sign*29.8);g.add(boss);}
 }
 // Two physically separate switches: direction/off and slow/fast. Colors and
 // positions follow the supplier photo; no unverified lettering is invented.
 for(const [x,z,color] of [[-91,-8,dark],[-91,9,blue]]){
  const rim=slab(g,plastic,18,8,2,x,27.6,z,3,.3);rim.rotation.x=-Math.PI/2;
  const slot=slab(g,dark,13.5,4.8,1.2,x,28.4,z,2,.2);slot.rotation.x=-Math.PI/2;
  const button=slab(g,color,5.8,4.5,2.4,x+2,29.1,z,.8,.2);button.rotation.x=-Math.PI/2;
 }
 return g;
}
