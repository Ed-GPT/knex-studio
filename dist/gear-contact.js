import {Vector3,Quaternion} from './vendor/three.module.js';
const v=a=>new Vector3(...a),axis=p=>v([0,0,1]).applyQuaternion(new Quaternion(...p.quat));
// Ideal pitch contact. The 3 mm crown tooth plane is a photo estimate.
export function gearContact(p,a,q,b){
 const n=axis(p),m=axis(q),gap=v(q.pos).sub(v(p.pos));
 if(Math.abs(n.dot(m))>.999){if(Math.abs(gap.dot(n))>2||Math.abs(gap.length()-a.pitchRadius-b.pitchRadius)>.6)return null;return v(p.pos).addScaledVector(gap.normalize(),a.pitchRadius).toArray();}
 if(Math.abs(n.dot(m))>.001)return null;
 for(const[c,cd,s,sd,cn,sn]of[[p,a,q,b,n,m],[q,b,p,a,m,n]]){
  if(!cd.crown)continue;const delta=v(s.pos).sub(v(c.pos)),height=delta.dot(cn),radial=delta.clone().addScaledVector(cn,-height);
  if(Math.abs(height-3-sd.pitchRadius)>.6||Math.abs(radial.length()-cd.pitchRadius)>.6||Math.abs(radial.clone().normalize().dot(sn))<.999)continue;
  return v(c.pos).addScaledVector(radial.normalize(),cd.pitchRadius).addScaledVector(cn,3).toArray();
 }return null;
}
