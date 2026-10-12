import {emptyModel,part,V,Q,ports,autoLinks,BY_ID} from './engine.js';
import {SPLICE_TAB} from './track-fittings.js';
import {ORANGE_TAB} from './flexible-parts.js';
import * as T from './vendor/three.module.js';
export function supportedTrackSplice(){
 const model=emptyModel('Rod-mounted tubing splice'),rod=part('r-blue',[0,100,0]);model.parts.push(rod);
 const connectorQ=Q().setFromAxisAngle(V([0,0,1]),Math.PI),pitch=BY_ID['r-blue'].length+20.2;
 const mounts=[-1,1].map(sign=>part('c-track-orange',[sign*pitch/2,100,0],connectorQ.toArray()));model.parts.push(...mounts);model.links.push(...autoLinks(model,rod));
 const q=Q().setFromRotationMatrix(new T.Matrix4().makeBasis(V([0,-1,0]),V([0,0,-1]),V([1,0,0]))),splice=part('k-track-splicer',rod.pos,q.toArray()),center=V(SPLICE_TAB).applyQuaternion(q).add(V(splice.pos));model.parts.push(splice);model.links.push({a:splice.id,ap:'slot0',b:rod.id,bp:'shaft',mode:'side',offset:0});
 for(let side=0;side<2;side++){const mount=mounts[side],tab=V(ORANGE_TAB).applyQuaternion(Q(mount.quat)).add(V(mount.pos)),outside=tab.clone().add(V([side?15:-15,0,0])),points=side?[center,outside]:[outside,center],tube=part('track-orange',center.toArray());tube.path=points.map(p=>p.clone().sub(center).toArray());model.parts.push(tube);model.links.push({a:splice.id,ap:'rail'+side,b:tube.id,bp:side?'tube0':'tube1',mode:'track',offset:side?0:points[0].distanceTo(points[1])},{a:mount.id,ap:'rail',b:tube.id,bp:'tube',mode:'track',offset:side?center.distanceTo(tab):15});}
 return model;
}
