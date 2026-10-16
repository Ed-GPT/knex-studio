import {buildShapeFrame,shapePlan} from './shape-builder.js';
import {parseModel,exportModel,part} from './engine.js';
import {createInterferenceGuard,assertClearPlacement} from './interference.js';
// Conversion and clearance checks stay off the editor's input/render thread.
self.onmessage=({data})=>{try{
 const estimate=shapePlan(data.options);if(data.source.parts.length+estimate.total>2500)throw Error('The combined model exceeds 2500 parts. Use fewer cells or start a new model.');
 const {model:generated,plan}=buildShapeFrame(data.options),source=parseModel(exportModel(data.source)),model=parseModel(exportModel(generated));
 if(source.parts.length+model.parts.length>2500)throw Error('The combined model exceeds 2500 parts. Use fewer cells or start a new model.');
 const ids=new Map(model.parts.map(p=>[p.id,part(p.type).id]));for(const p of model.parts)p.id=ids.get(p.id);for(const l of model.links){l.a=ids.get(l.a);l.b=ids.get(l.b);}for(const list of Object.values(model.editor||{}))for(const item of list)item.partIds=item.partIds.map(id=>ids.get(id));
 const bounds=m=>{const g=createInterferenceGuard(m);g.check({changedIds:new Set()});return{min:Math.min(...g.entries.map(e=>e.bounds.min.x)),max:Math.max(...g.entries.map(e=>e.bounds.max.x)),bottom:Math.min(...g.entries.map(e=>e.bounds.min.y))};};
 const b=bounds(model),shift=[source.parts.length?bounds(source).max+75-b.min:0,Math.max(0,15-b.bottom),0],added=new Set(model.parts.map(p=>p.id));
 const preview=parseModel(exportModel(model));for(const p of model.parts)p.pos=p.pos.map((v,i)=>v+shift[i]);
 source.parts.push(...model.parts);source.links.push(...model.links);source.editor??={groups:[],layers:[]};for(const kind of['groups','layers']){source.editor[kind]??=[];source.editor[kind].push(...(model.editor?.[kind]||[]));}
 if(!data.source.parts.length)source.name=generated.name;
 assertClearPlacement(source,added);
 self.postMessage({model:source,preview,summary:{parts:generated.parts.length,connections:generated.links.length,size:plan.size,pitch:plan.pitch,cells:plan.cells,warnings:plan.warnings}});
 }catch(e){self.postMessage({error:e.message});}};
