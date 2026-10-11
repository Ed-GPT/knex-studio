import {partsOverlap} from './slide-collision.js';
import {V,ports,busy,autoLinks,parseModel,exportModel} from './engine.js';
import {editBlockReason} from './editor-state.js';
import {externalLinks} from './relocation.js';
// Translation only: magnetic end connections never rotate an existing section.
export function translatedSelection(source,ids,delta,{grid=0,magnet=0}={}){
 ids=new Set(ids);const reason=editBlockReason(source,ids);if(reason)throw Error(reason);
 if(externalLinks(source,ids).length)throw Error('Move the connected assembly, or disconnect the selection first.');
 if(delta.length!==3||delta.some(v=>!Number.isFinite(v)||Math.abs(v)>10000))throw Error('Invalid movement.');
 const model=parseModel(exportModel(source)),d=V(delta.map(v=>grid?Math.round(v/grid)*grid:v));
 const moved=model.parts.filter(p=>ids.has(p.id)),fixed=model.parts.filter(p=>!ids.has(p.id));
 for(const p of moved)p.pos=V(p.pos).add(d).toArray();
 let snap=null;
 if(magnet>0){const outside=fixed.flatMap(p=>ports(p).filter(t=>!busy(model,p.id,t.key)).map(t=>({...t,owner:p.id})));
 for(const p of moved)for(const a of ports(p)){if(busy(model,p.id,a.key)||a.kind==='chain')continue;for(const b of outside){if(a.kind===b.kind||b.kind==='chain'||V(a.dir).dot(V(b.dir))>-.999)continue;const distance=V(a.pos).distanceTo(V(b.pos));if(distance<=magnet&&(!snap||distance<snap.distance))snap={distance,delta:V(b.pos).sub(V(a.pos)),target:b};}}
 if(snap)for(const p of moved)p.pos=V(p.pos).add(snap.delta).toArray();}
 const links=[];for(const p of moved){const next=autoLinks(model,p);model.links.push(...next);links.push(...next);}
 const blocked=new Set();for(const p of moved){const neighbours=new Set(model.links.filter(l=>l.a===p.id||l.b===p.id).map(l=>l.a===p.id?l.b:l.a));const context={parts:fixed.filter(o=>!neighbours.has(o.id))};for(const other of context.parts)if(partsOverlap(p,other))blocked.add(other.id);}
 return{model,links,snap:!!snap,blocked:[...blocked]};
}
