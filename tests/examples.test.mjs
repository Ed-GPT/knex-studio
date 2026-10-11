import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAMPLES,REFERENCE_SCENES,createExample} from '../dist/examples.js';
import {parseModel,exportModel,V,ports,component,definition} from '../dist/engine.js';
import {hingeSystem,nudgeHingeSystem,stepHingeSystem,applyHingeSystem} from '../dist/hinge-system.js';
import {motorDrive} from '../dist/motor.js';
for(const entry of [...EXAMPLES,...REFERENCE_SCENES])test(`example ${entry.id} opens, round-trips, and has closed end joints`,()=>{
 const m=createExample(entry.id);assert.ok(m.parts.length);assert.deepEqual(JSON.parse(exportModel(parseModel(exportModel(m)))),JSON.parse(exportModel(m)));
 for(const l of m.links.filter(l=>l.mode==='end')){const a=m.parts.find(p=>p.id===l.a),b=m.parts.find(p=>p.id===l.b),ap=ports(a).find(p=>p.key===l.ap),bp=ports(b).find(p=>p.key===l.bp);assert.ok(V(ap.pos).distanceTo(V(bp.pos))<1e-5);assert.ok(V(ap.dir).dot(V(bp.dir))<-.999);}
 if(entry.action==='hinges')assert.ok(hingeSystem(m).jointCount>0);
 if(entry.action==='motors')assert.ok(motorDrive(m,m.parts.find(p=>definition(p).motor).id).ready);
});
test('single hinge moves its arm while the locked axle remains exact',()=>{const m=createExample('hinge'),axle=m.parts.find(p=>p.grounded),arm=m.parts.find(p=>p.type==='r-red'),before=structuredClone(axle),pos=[...arm.pos],s=hingeSystem(m);nudgeHingeSystem(s);for(let i=0;i<60;i++){stepHingeSystem(m,s,1/60);}assert.deepEqual(axle,before);assert.ok(V(pos).distanceTo(V(arm.pos))>1);});
test('3 by 2 grid reuses every shared edge and forms one connected model',()=>{const m=createExample('grid');assert.equal(m.parts.length,29);assert.equal(m.links.length,34);assert.equal(component(m,m.parts[0].id).size,29);const coordinates=m.parts.map(p=>p.type+':'+p.pos.map(x=>x.toFixed(4)).join(','));assert.equal(new Set(coordinates).size,29);});
