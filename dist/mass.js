import {beltOutline} from './belt-parts.js';
import {pathLength} from './flexible-parts.js';
import {PART_SPECS} from './part-specs.js';
// Use sourced approximate weights first. Unsourced legacy parts retain explicit estimates. Overrides are grams.
export function massOf(d){return PART_SPECS[d.id]?.massG??(d.group==='rods'||d.flexi?d.length*.019:d.tire?d.diameter*.08:d.motor?65:d.wheelHub?4:d.group==='connectors'?.55+d.slots.length*.38:.7);}
export function partMass(p,d){return p.massG??(d.tubing&&p.path?pathLength(p.path)*(d.massPerMm??.019):massOf(d));}
export function localMassCenter(p,d){if(p.belt&&!p.massCenter){const points=beltOutline(p.belt).map(x=>x.pos);return localMassCenter({path:[...points,points[0]]},d);}if(!p.massCenter&&p.path){let total=0;const center=[0,0,0];for(let i=1;i<p.path.length;i++){const a=p.path[i-1],b=p.path[i],length=Math.hypot(...a.map((v,j)=>v-b[j]));total+=length;for(let j=0;j<3;j++)center[j]+=(a[j]+b[j])*.5*length;}return center.map(v=>v/total);}return p.massCenter??d.massCenter??(d.motor&&!d.legacy?[-28,0,0]:[0,0,0]);}
export function copyMass(from,to){if(from.springTurns!==undefined)to.springTurns=from.springTurns;if(from.motorSpeed!==undefined)to.motorSpeed=from.motorSpeed;if(from.massG!==undefined)to.massG=from.massG;if(from.massCenter)to.massCenter=[...from.massCenter];return to;}
