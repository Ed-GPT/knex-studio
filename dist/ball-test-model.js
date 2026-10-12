import {buildPath} from './path-builder.js';
import {BY_ID} from './engine.js';
// Original 92602 tubing and 90910 clips, side-gripped to blue cross-rods.
// A fixed test fixture, not a claimed freestanding or manual-derived build.
export function ballRamp(){
 const model=buildPath({kind:'track',trackType:'track-orange',points:[[-230,190,0],[230,65,0]],spacing:100,bank:0}).model;
 const before=(BY_ID['r-90958'].length-16)/2,after=(BY_ID['r-blue'].length-16)/2;
 for(const p of model.parts){if(p.type==='r-90958')p.type='r-blue';else p.pos[2]+=Math.sign(p.pos[2])*(after-before);}
 for(const l of model.links)if(l.mode==='side')l.offset=Math.sign(l.offset)*after;
 model.name='Ball test ramp';return model;
}
export const RAMP_DROP=[-195,240,0];
