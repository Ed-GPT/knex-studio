import {repeatPattern} from './pattern.js';
import {makeGroup,layerFor,editorState} from './editor-state.js';
import {copyMass} from './mass.js';
import {V,Q,BY_ID,part,ports,targets,solve,add,component,autoLinks,busy,exportModel,parseModel,emptyModel} from './engine.js';
const countCheck=(n,max=100)=>{if(!Number.isInteger(n)||n<1||n>max)throw Error(`Choose a whole number from 1 to ${max}.`);};
function room(m,n){if(m.parts.length+n>2500)throw Error('This would exceed 2500 parts. Reduce the repeat count.');}
// Always work on a copy. A rejected generation cannot leave a half-built model.
export function repeatSection(source,options={}){return repeatPattern(source,{copies:3,delta:[150,0,0],...options}).model;}
export function extendRun(source,{id,portKey,rod='r-yellow',segments=4}={}){
 countCheck(segments);if(BY_ID[rod]?.group!=='rods')throw Error('Choose a classic rod length.');const m=parseModel(exportModel(source));room(m,segments*2+1);
 let host=m.parts.find(p=>p.id===id);if(!host)throw Error('Select a rod or connector with an open end.');
 let port=ports(host).find(p=>p.key===portKey&&!busy(m,host.id,p.key));if(!port)throw Error('Choose an unused socket or rod end.');
 for(let i=0;i<segments;i++){
  if(port.kind==='end'){host=add(m,solve(m,'c-orange',port,'end',{portIndex:0}));port=ports(host).find(p=>p.key==='slot1');}
  const r=add(m,solve(m,rod,port,'end',{portIndex:0}));host=add(m,solve(m,'c-orange',ports(r).find(p=>p.key==='end1'),'end',{portIndex:0}));port=ports(host).find(p=>p.key==='slot1');
 }
 return m;
}
export function rodRun({segments=5,rod='r-yellow',origin=[0,30,0]}={}){const m=emptyModel('Generated rod run'),c=part('c-orange',origin);m.parts.push(c);return extendRun(m,{id:c.id,portKey:'slot0',rod,segments});}
export function chainModel({count=16,closed=false,origin=[0,40,0]}={}){
 countCheck(count,160);if(closed&&count<10)throw Error('Use at least 10 links for a closed chain.');const m=emptyModel('Generated large-link chain'),pitch=BY_ID['chain-large'].pitch,R=closed?pitch/(2*Math.sin(Math.PI/count)):0;
 for(let i=0;i<count;i++){const a=closed?i*Math.PI*2/count:0,pos=closed?[R*Math.sin(a),R*(1-Math.cos(a)),0]:[i*pitch,0,0],p=part('chain-large',V(pos).add(V(origin)).toArray(),Q().setFromAxisAngle(V([0,0,1]),a+(closed?Math.PI/count:0)).toArray());m.parts.push(p);if(i)m.links.push({a:m.parts[i-1].id,ap:'pin',b:p.id,bp:'socket',mode:'chain'});}
 if(closed)m.links.push({a:m.parts.at(-1).id,ap:'pin',b:m.parts[0].id,bp:'socket',mode:'chain'});return m;
}
export function mergeGenerated(source,generated){const m=parseModel(exportModel(source));room(m,generated.parts.length);m.parts.push(...generated.parts);m.links.push(...generated.links);return m;}
