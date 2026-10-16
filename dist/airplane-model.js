import {buildShapeFrame,airplaneShapes} from './shape-builder.js';
import {ports,targets,solve,component,parseModel,exportModel} from './engine.js';
import {makeLayer,makeGroup} from './editor-state.js';
import {assertClearPlacement} from './interference.js';

// Original stock-part airframe, not an official kit or an aerodynamic model.
export function airplaneModel(){
 const built=buildShapeFrame({name:'3D airplane · shape-built airframe',shapes:airplaneShapes(),validate:false}),m=built.model;
 const ids=new Map(m.parts.map(p=>[p.id,p]));
 for(const layer of m.editor.layers){const colors=layer.name==='Fuselage'?['r-90952w','r-909532']:layer.name==='Cockpit'?['r-909523','r-909532d']:/tailplane|fin/.test(layer.name)?['r-952002','r-909533']:null;if(colors)for(const id of layer.partIds){const p=ids.get(id);if(p.type==='r-blue')p.type=colors[0];else if(p.type==='r-yellow')p.type=colors[1];}}
 const gear=[];
 const attach=(type,host,mode,options={},socket)=>{const local={parts:[host],links:m.links.filter(l=>l.a===host.id||l.b===host.id)},t=targets(local,type,mode).find(t=>!socket||t.key===socket);if(!t)throw Error('Landing gear has no compatible socket.');const proposal=solve(local,type,t,mode,options),p=proposal.part;m.parts.push(p);m.links.push(proposal.link);gear.push(p.id);return p;};
 for(const x of[-3,3]){
  const bearings=[];
  for(const z of[0,1]){const pair=built.nodes.get(`${x},2,${z}`),t=pair?.flatMap(ports).find(p=>p.kind==='slot'&&p.dir[1]<-.999);if(!t)throw Error('Missing landing-gear anchor.');const leg=attach('r-blue',ids.get(t.partId),'end',{},t.key),end=ports(leg).find(p=>p.dir[1]<-.999);bearings.push(attach('c-gray',leg,'end',{},end.key));}
  const axle=attach('r-red',bearings[0],'through',{offset:-37.5});
  m.links.push({a:axle.id,ap:'shaft',b:bearings[1].id,bp:'hole',mode:'through',offset:37.5});
  // Blue spacers and end caps retain the bearings; stock hubs turn on the axle.
  for(const sign of[-1,1]){attach('s-blue',axle,'through',{offset:sign*43});const hub=attach('h-small',axle,'through',{offset:sign*53.2});attach('t-small',hub,'tire');}
  for(const end of['end0','end1'])attach('k-cap',axle,'end',{},end);
 }
 // Rest the 47 mm tyres on the ground. Keep shell and axle coordinates together.
 for(const p of m.parts)p.pos[1]-=75-23.5;
 makeLayer(m,gear,'Landing gear');makeGroup(m,m.parts.map(p=>p.id),'3D airplane');
 const validated=parseModel(exportModel(m));if(component(validated,validated.parts[0].id).size!==validated.parts.length)throw Error('Airplane contains disconnected parts.');
 assertClearPlacement(validated,new Set(validated.parts.map(p=>p.id)));
 return validated;
}
