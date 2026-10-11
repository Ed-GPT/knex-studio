import {PART_SPECS} from './part-specs.js';
// Use sourced approximate weights first. Unsourced legacy parts retain explicit estimates. Overrides are grams.
export function massOf(d){return PART_SPECS[d.id]?.massG??(d.group==='rods'?d.length*.019:d.tire?d.diameter*.08:d.motor?65:d.wheelHub?4:d.group==='connectors'?.55+d.slots.length*.38:.7);}
export function partMass(p,d){return p.massG??massOf(d);}
export function localMassCenter(p,d){return p.massCenter??(d.motor&&!d.legacy?[-28,0,0]:[0,0,0]);}
export function copyMass(from,to){if(from.massG!==undefined)to.massG=from.massG;if(from.massCenter)to.massCenter=[...from.massCenter];return to;}
