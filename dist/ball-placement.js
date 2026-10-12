import * as T from './vendor/three.module.js';
import {V,Q,definition} from './engine.js';
// Center a drop over nearby paired rails. Other parts keep the clicked X/Z.
export function ballDropAnchor(model,id,point){const p=model.parts.find(p=>p.id===id),hit=V(point);if(!p||!definition(p).tubing)return hit;
 const closest=tube=>{let best=null;const points=tube.path?.map(v=>V(v).applyQuaternion(Q(tube.quat)).add(V(tube.pos)))||[];for(let i=1;i<points.length;i++){const line=new T.Line3(points[i-1],points[i]),pos=line.closestPointToPoint(hit,true,V()),distance=pos.distanceTo(hit);if(!best||distance<best.distance)best={pos,distance,axis:points[i].clone().sub(points[i-1]).normalize()};}return best;};
 const a=closest(p);if(!a)return hit;let mate=null;for(const tube of model.parts){if(tube.id===p.id||!definition(tube).tubing)continue;const b=closest(tube);if(!b)continue;const separation=a.pos.distanceTo(b.pos);if(separation>10&&separation<49&&Math.abs(a.axis.dot(b.axis))>.95&&(!mate||separation<mate.distance))mate={pos:b.pos,distance:separation};}return mate?a.pos.add(mate.pos).multiplyScalar(.5):hit;
}
