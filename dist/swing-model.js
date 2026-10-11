import {rigidComponent} from './motion.js';
import {V,Q,DEG,part,ports,targets,solve,add,emptyModel,CATALOG} from './engine.js';
export const SWING_REFERENCE='https://www.knexusergroup.org.uk/en/knex-project-swing.html';
// One-bay adaptation of the reference frame. Existing classic 3D corners and
// hole-end clips replace the source's silver color and purple hinge clips.
export function swingModel(){const m=emptyModel('Swing · reference-based single bay'),half=75*Math.SQRT2,H=235;
 const node=(type,pos,q=Q())=>{const p=part(type,pos,q.toArray());m.parts.push(p);return p;};
 const joint=(pos,side)=>{const a=node('c-blue',pos,Q().setFromAxisAngle(V([0,1,0]),side<0?Math.PI:0));const b=add(m,solve(m,'c-purple',targets(m,'c-purple','interlock').find(t=>t.partId===a.id),'interlock'));return[a,b];};
 const find=(group,dir)=>group.flatMap(p=>ports(p).map(t=>({p,t}))).find(x=>V(x.t.dir).dot(V(dir))>.999);
 const join=(as,bs,type)=>{const dir=V(bs[0].pos).sub(V(as[0].pos)).normalize().toArray(),a=find(as,dir),b=find(bs,V(dir).negate().toArray());if(!a||!b)throw Error('Missing swing socket');const r=add(m,solve(m,type,targets(m,type,'end').find(t=>t.partId===a.p.id&&t.key===a.t.key),'end'));if(V(ports(r)[1].pos).distanceTo(V(b.t.pos))>.01)throw Error('Swing span mismatch');return r;};
 const tops=[],feet=[];
 for(const side of[-1,1]){const z=side*half,top=joint([0,H,z],side);tops.push(top);const mids=[];for(const sign of[-1,1]){const f=joint([sign*75,10,z],side);feet.push(f);const q=Q().setFromAxisAngle(V([0,0,1]),-Math.PI/2);if(sign>0)q.premultiply(Q().setFromAxisAngle(V([0,1,0]),Math.PI));const mid=[node('c-green',[sign*75,160,z],q)];mids.push(mid);join(f,mid,'r-red');join(mid,top,'r-yellow');}join(mids[0],mids[1],'r-red');}
 const axle=join(tops[0],tops[1],'r-gray');join(feet[0],feet[2],'r-gray');join(feet[1],feet[3],'r-gray');
 const back=[],front=[];
 for(const side of[-1,1]){const z=side*37.5,b=joint([0,H-150,z],side),f=joint([-75,H-150,z],side);back.push(b);front.push(f);join(b,f,'r-blue');
  const bearing=add(m,solve(m,'c-gray',targets(m,'c-gray','through').find(t=>t.partId===axle.id),'through',{offset:z,roll:-90}));join([bearing],b,'r-red');
 }
 join(back[0],back[1],'r-blue');join(front[0],front[1],'r-blue');
 return m;
}
export function connectorReferenceModels(){const m=emptyModel('Classic connector references');for(const [i,d] of CATALOG.filter(d=>d.group==='connectors').entries())m.parts.push(part(d.id,[(i%3-1)*62,15+Math.floor(i/3)*60,0]));return m;}

// Mechanical variation of the sourced single-bay swing, not another official model.
export function nestedSwingModel(){const m=swingModel();m.name='Nested swing · two hinges';const seat=rigidComponent(m,m.parts.find(p=>p.type==='c-gray').id);for(const p of m.parts)if(!seat.has(p.id))p.grounded=true;const axle=m.parts.find(p=>p.type==='r-blue'&&Math.abs(p.pos[0]+75)<.01&&Math.abs(p.pos[2])<.01);const bearing=add(m,solve(m,'c-gray',targets(m,'c-gray','through').find(t=>t.partId===axle.id),'through',{roll:-90}));add(m,solve(m,'r-red',targets(m,'r-red','end').find(t=>t.partId===bearing.id),'end'));return m;}
