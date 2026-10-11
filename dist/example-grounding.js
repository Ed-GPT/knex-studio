import {definition} from './engine.js';
import {axleInfo} from './motion.js';
import {physicsCandidates} from './physics.js';
import {motorDrive} from './motor.js';
import {gearTransmission} from './gears.js';
import {setGrounded} from './grounding.js';
import {makeGroup,makeLayer} from './editor-state.js';
// Applied only when explicitly loading an example. Existing user models keep their constraints.
export function prepareGroundedExample(m,name){
 if(name==='tower'){setGrounded(m,new Set(m.editor.layers[0].partIds));return m;}
 let stages=[];
 if(['powered','gears','compound'].includes(name)){const motor=m.parts.find(p=>definition(p).motor),drive=motorDrive(m,motor.id);stages=gearTransmission(m,drive.shaftId).map(s=>s.ids);}
 else if(name==='windmill')stages=[axleInfo(m,m.parts.find(p=>p.type==='r-gray').id).ids];
 else if(name==='swing')stages=[physicsCandidates(m)[0].body.ids];else return m;
 const moving=new Set(stages.flatMap(s=>[...s])),fixed=m.parts.filter(p=>!moving.has(p.id)).map(p=>p.id);setGrounded(m,new Set(fixed));
 makeGroup(m,fixed,'Locked supports');if(!m.editor.layers.length)makeLayer(m,fixed,'Supports');
 stages.forEach((ids,i)=>{const label=name==='swing'?'Swing seat':stages.length===1?'Rotor':i===0?'Input axle':i===stages.length-1?'Output axle':'Intermediate axle';makeGroup(m,[...ids],label);if(['powered','windmill','swing','gears'].includes(name))makeLayer(m,[...ids],label);});return m;
}
