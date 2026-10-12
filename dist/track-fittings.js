import * as T from './vendor/three.module.js';
export const TRACK_FITTINGS=[
 {id:'k-track-splicer',name:'Orange rod-mounted track splicer',partNumber:'90911',color:'#f79d32',trackSplicer:true,clipGeometry:true,noSide:false,slots:[0],bodyDims:[17,9,14]},
 {id:'k-track-joiner',name:'Red inline track splice',partNumber:'20501',color:'#d83248',trackJoiner:true,noSide:true,slots:[],bodyDims:[1.6,1.6,18]}
].map(d=>({...d,group:'extras',splice:true,trackFamily:'orange',noBore:true,reference:'https://shop.knexusergroup.org.uk/products/'+d.partNumber}));
// Manual 63030 photo 6: the tube is parallel to the clipped rod, above it.
// Dimensions are photo estimates, not factory/CAD measurements.
export const SPLICE_TAB=[-10,0,0];
export const trackSplicerPorts=()=>[{key:'slot0',kind:'clip',pos:[-4.4,0,0],dir:[1,0,0]}];
export function trackFittingGeometry(d,mat){const g=new T.Group();g.name='Classic track fitting '+d.partNumber;
 const box=(x,y,z,w,h,l)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,l),mat);m.position.set(x,y,z);g.add(m);};
 if(d.trackJoiner){box(0,0,0,1.6,1.6,18);box(0,.65,0,.65,.5,17);}
 else{const s=new T.Shape();s.moveTo(-4.5,-4.5);for(const p of [[4.3,-4.5],[4.3,-2.6],[1.5,-2.6],[0,-3.1],[-2.5,-2.3],[-3.1,0],[-2.5,2.3],[0,3.1],[1.5,2.6],[4.3,2.6],[4.3,4.5],[-4.5,4.5]])s.lineTo(...p);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:6.3,bevelEnabled:false});geo.translate(0,0,-3.15);g.add(new T.Mesh(geo,mat));box(-6.5,0,0,4,1.8,6.3);box(-9,0,0,2,1.8,14);box(...SPLICE_TAB,2,3,14);}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;
}
export function trackFittingIcon(d){return `<svg viewBox="0 0 120 58" aria-hidden="true"><g fill="${d.color}" stroke="#a3adbc" stroke-width=".6">${d.trackJoiner?'<path d="M25 42 29 46 96 15 92 11Z"/>':'<path d="M52 18H76V23H62L58 29 62 35H76V40H52Z"/><path d="M52 26H43V10H37V48H43V32H52Z"/>'}</g></svg>`;}
