import test from 'node:test';
import assert from 'node:assert/strict';
import {shapePlan,buildShapeFrame,airplaneShapes,insideShape} from '../dist/shape-builder.js';
import {airplaneModel} from '../dist/airplane-grid-model.js';
import {BY_ID,V,ports,borePorts,component,parseModel,exportModel} from '../dist/engine.js';
import {createInterferenceGuard} from '../dist/interference.js';
import {BuildWorkspace} from '../mcp/workspace.mjs';
const box=(center=[75,75,75],size=[150,150,150])=>({name:'Box',kind:'box',center,size});
function socketsFit(m){const parts=new Map(m.parts.map(p=>[p.id,p])),used=new Set();for(const l of m.links){if(l.mode!=='end')continue;const a=ports(parts.get(l.a)).find(p=>p.key===l.ap),b=ports(parts.get(l.b)).find(p=>p.key===l.bp);assert.ok(a&&b);assert.ok(V(a.pos).distanceTo(V(b.pos))<1e-6);assert.ok(V(a.dir).dot(V(b.dir))<-.999999);for(const [id,key]of[[l.a,l.ap],[l.b,l.bp]]){assert.ok(!used.has(id+':'+key));used.add(id+':'+key);}}}
test('volume union shares nodes and edges, leaves the interior empty and closes actual stock sockets',()=>{
 const options={shapes:[box([112.5,112.5,112.5],[225,225,225])]},one=buildShapeFrame(options),two=buildShapeFrame({shapes:[...options.shapes,...options.shapes]});
 assert.equal(one.model.parts.length,two.model.parts.length);assert.equal(one.plan.total,one.model.parts.length);assert.equal(one.plan.cells,27);assert.ok(!one.nodes.has('1,1,1'));assert.equal(component(one.model,one.model.parts[0].id).size,one.model.parts.length);socketsFit(one.model);assert.deepEqual(createInterferenceGuard(one.model).check({all:true}),[]);assert.equal(parseModel(exportModel(one.model)).parts.length,one.plan.total);
});
test('curved and tapered rough volumes quantize into 3D stock frames, with planar connectors where possible',()=>{
 const shapes=[{name:'Round',kind:'ellipsoid',center:[0,150,0],size:[450,225,225]}],built=buildShapeFrame({shapes});
 assert.ok(built.model.parts.some(p=>p.type==='c-white'));assert.ok(built.model.parts.some(p=>p.type==='c-blue'));assert.ok(built.plan.size.every(n=>n>0));socketsFit(built.model);
 const taper={name:'Wing',kind:'taper',center:[0,0,0],size:[300,75,600],axis:2,tipScale:.25};assert.equal(insideShape([100,0,-250],taper),true);assert.equal(insideShape([100,0,250],taper),false);assert.equal(insideShape([100,0,250],{...taper,reverse:true}),true);
});
test('conversion reports undersized or disconnected volumes and bounds sampling and output cost',()=>{
 assert.throws(()=>shapePlan({shapes:[box([0,0,0],[1,1,1])]}),/Too small/);
 assert.throws(()=>shapePlan({shapes:[box(),box([600,600,600])]}),/disconnected/);
 assert.throws(()=>shapePlan({shapes:[box([0,0,0],[10000,10000,10000])]}),/sampling is too large/);
 assert.throws(()=>shapePlan({shapes:[box([0,0,0],[1500,1500,1500])]}),/Maximum 2500/);
 assert.throws(()=>shapePlan({shapes:[box([0,0,0],[NaN,75,75])]}),/positive size/);
 assert.throws(()=>shapePlan({shapes:[{...box(),kind:'taper',tipScale:0}]}),/Tapers need/);
 assert.throws(()=>shapePlan({shapes:[box()],rod:'r-gray'}),/no stock diagonal/);
});
test('large airplane has volumetric wings, a cockpit, tail surfaces, four retained wheels and no mesh collisions',()=>{
 const m=airplaneModel();assert.equal(m.parts.length,1700);assert.equal(component(m,m.parts[0].id).size,m.parts.length);assert.equal(m.parts.filter(p=>p.type==='t-small').length,4);assert.equal(m.parts.filter(p=>p.type==='k-cap').length,4);assert.equal(m.parts.filter(p=>p.type==='s-blue').length,4);assert.ok(m.parts.every(p=>BY_ID[p.type]&&!BY_ID[p.type].legacy));
 assert.ok(m.editor.layers.some(l=>l.name==='Cockpit'));assert.ok(m.editor.layers.some(l=>l.name==='Vertical fin'));for(const name of['Left wing','Right wing']){const ids=new Set(m.editor.layers.find(l=>l.name===name).partIds);assert.ok(new Set(m.parts.filter(p=>ids.has(p.id)).map(p=>Math.round(p.pos[1]))).size>1);}
 socketsFit(m);assert.deepEqual(createInterferenceGuard(m).check({all:true}),[]);
 for(const l of m.links.filter(l=>l.mode==='through')){const a=m.parts.find(p=>p.id===l.a),b=m.parts.find(p=>p.id===l.b),rod=BY_ID[a.type].group==='rods'?a:b,host=rod===a?b:a,bore=borePorts(host)[0],axis=V(ports(rod)[1].dir);assert.ok(V(bore.pos).sub(V(rod.pos)).cross(axis).length()<1e-6);}
 const w=new BuildWorkspace(),draft=w.adopt(m);assert.equal(w.validate(draft.buildId).connected,true);assert.equal(w.undo(draft.buildId,1).parts,0);
});
