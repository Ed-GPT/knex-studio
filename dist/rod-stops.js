import {Vector3,Quaternion} from './vendor/three.module.js';
import {localBores} from './bores.js';
const v=a=>new Vector3(...a),q=a=>new Quaternion(...a);
// Photo-estimated 90958 cross stops, shared by rendering and axial contact.
// These are conservative editor clearances, not measured molding tolerances.
export const STOP_FROM_END=11.8,STOP_WIDTH=1.2,STOP_DIAMETER=7.4;
export const rodStopCenters=d=>d.trackStops?[-1,1].map(s=>s*(d.length/2-STOP_FROM_END)):[];
function stopBores(a,da,b,db){
 const rod=da.trackStops?a:db.trackStops?b:null;if(!rod)return null;
 const d=rod===a?da:db,holder=rod===a?b:a,h=rod===a?db:da,axis=v([1,0,0]).applyQuaternion(q(rod.quat)),rotation=q(holder.quat);
 const bores=localBores(h).map(b=>({...b,dir:v(b.dir).applyQuaternion(rotation),pos:v(b.pos).applyQuaternion(rotation).add(v(holder.pos))})).filter(b=>{const delta=b.pos.clone().sub(v(rod.pos));return Math.abs(b.dir.dot(axis))>.9999&&delta.addScaledVector(axis,-delta.dot(axis)).length()<.2;});
 return{rod,d,axis,bores};
}
export function rodStopOverlap(a,da,b,db){const fit=stopBores(a,da,b,db);if(!fit)return false;return fit.bores.some(bore=>{const x=bore.pos.clone().sub(v(fit.rod.pos)).dot(fit.axis),half=(bore.thickness+STOP_WIDTH)/2;return rodStopCenters(fit.d).some(stop=>Math.abs(x-stop)<half-.03);});}
// a moves; b stays fixed. Work in rod-local distance even if the rod moves.
// Clamp continuously, so a single large pointer jump cannot skip a stop.
export function rodStopSweep(a,da,b,db,direction,distance){
 const fit=stopBores(a,da,b,db);if(!fit)return distance;
 const speed=v(direction).dot(fit.axis)*(fit.rod===a?-1:1);if(Math.abs(speed)<1e-9)return distance;
 let limit=distance;
 for(const bore of fit.bores){const x=bore.pos.clone().sub(v(fit.rod.pos)).dot(fit.axis),half=(bore.thickness+STOP_WIDTH)/2;
  for(const stop of rodStopCenters(fit.d)){const gap=x-stop;
   if(Math.abs(gap)<half-.03){if(gap*speed<0)limit=0;continue;} // allow withdrawing from old overlapping saves
   const hit=(stop-Math.sign(speed)*half-x)/speed;
   if(hit>=-.04&&hit<=limit)limit=Math.max(0,hit-.04);
  }
 }
 return limit;
}
