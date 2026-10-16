import {V,Q,ports} from '../dist/engine.js';
// Original flat display design, not an official K'NEX kit or an aerodynamic model.
// Everything is built through the same socket-solving edit API offered to the AI.
export function buildAirplane(workspace){
 let b=workspace.create('Airplane · flat display model');const q=Q().setFromAxisAngle(V([1,0,0]),Math.PI/2).toArray();
 b=workspace.edit(b.buildId,b.revision,[{op:'place',type:'c-white',alias:'center',position:[0,60,0],quaternion:q}]);
 const nodes=new Map([['0,0','center']]);let serial=0;
 function span(a,z){const key=z.join(','),host=nodes.get(a.join(','));const source=workspace.get(b.buildId).model.parts.find(p=>p.id===b.aliases[host]),dir=V([z[0]-a[0],0,z[1]-a[1]]).normalize(),socket=ports(source).find(p=>p.kind==='slot'&&V(p.dir).dot(dir)>.9999),length=Math.hypot(z[0]-a[0],z[1]-a[1]),type=Math.abs(length-75)<.01?'r-blue':'r-yellow',rod='rod'+(++serial);
  const commands=[{op:'attach',type,alias:rod,host,socket:socket.key,mode:'end'}];
  b=workspace.edit(b.buildId,b.revision,commands);
  if(!nodes.has(key)){const p=workspace.get(b.buildId).model.parts.find(p=>p.id===b.aliases[rod]),end=ports(p).find(t=>V(t.dir).dot(dir)>.9999),alias='hub'+serial;
   // Align the new connector's own plane with the horizontal frame after solving.
   let fit=null;for(const roll of [0,90,180,270]){try{const state=workspace.get(b.buildId),before=state.revision;const result=workspace.edit(b.buildId,before,[{op:'attach',type:'c-white',alias,host:rod,socket:end.key,mode:'end',roll}]);const hub=state.model.parts.find(p=>p.id===state.aliases[alias]);if(ports(hub).filter(p=>p.kind==='slot').every(p=>Math.abs(p.dir[1])<1e-6)){fit=result;break;}workspace.undo(b.buildId,result.revision);b=workspace.summary(state);}catch{b=workspace.summary(workspace.get(b.buildId));}}
   if(!fit)throw Error('Cannot orient airplane connector.');b=fit;nodes.set(key,alias);
  }
 }
 for(const [a,z] of [[[0,0],[-75,0]],[[-75,0],[-150,0]],[[0,0],[75,0]],[[75,0],[150,0]],[[0,0],[0,75]],[[0,75],[0,150]],[[0,0],[0,-75]],[[0,-75],[0,-150]],[[150,0],[150,75]],[[150,0],[150,-75]],[[-75,0],[0,75]],[[-75,0],[0,-75]],[[75,0],[0,75]],[[75,0],[0,-75]],[[75,0],[150,75]],[[75,0],[150,-75]]])span(a,z);
 return {...b,note:'Original 27-part flat airplane silhouette using stock rods and 8-way connectors. No flight simulation or official-kit claim.'};
}
