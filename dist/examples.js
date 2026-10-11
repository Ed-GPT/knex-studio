import {exampleModel,emptyModel,part,targets,solve,add} from './engine.js';
import {repeatableSquare,towerModel,compoundGearModel} from './advanced-models.js';
import {repeatPattern} from './pattern.js';
import {swingModel,nestedSwingModel,connectorReferenceModels,SWING_REFERENCE} from './swing-model.js';
import {poweredWindmill,motorReferenceModels} from './motor.js';
import {manualVehicle,wheelReferenceModels,VEHICLE_MANUAL} from './wheel-models.js';
import {roverModel} from './playground.js';
import {prepareGroundedExample} from './example-grounding.js';
import {makeGroup,makeLayer} from './editor-state.js';
const JOINT_REFERENCE='https://www.knexusergroup.org.uk/en/knex-hint-A2.html';
export function singleHinge(){
 const m=emptyModel('Single hinge'),axle=part('r-blue',[0,170,0]);axle.grounded=true;m.parts.push(axle);
 const bearing=add(m,solve(m,'c-gray',targets(m,'c-gray','through').find(t=>t.partId===axle.id),'through',{roll:-90}));
 const arm=add(m,solve(m,'r-red',targets(m,'r-red','end').find(t=>t.partId===bearing.id),'end'));
 makeGroup(m,[bearing.id,arm.id],'Moving arm');makeLayer(m,[axle.id],'Locked axle');makeLayer(m,[bearing.id,arm.id],'Pendulum');return m;
}
export function gridWall(){
 const square=repeatableSquare(),row=repeatPattern(square,{ids:square.parts.map(p=>p.id),copies:2,delta:[75,0,0]}).model;
 const m=repeatPattern(row,{ids:row.parts.map(p=>p.id),copies:1,delta:[0,75,0]}).model;m.name='Shared-edge grid · 3 × 2';
 // Keep the original module selectable; neighbouring copies share its boundary.
 return m;
}
export const EXAMPLES=[
 {id:'square',title:'One square',level:'Simple',skill:'Snap · repeat',hint:'Select the square, then use Repeat + to extend it.',factory:repeatableSquare,kind:'Original connection-grid demo',source:JOINT_REFERENCE},
 {id:'hinge',title:'Single hinge',level:'Simple',skill:'Lock · swing',hint:'Run the hinge, pull the red arm, and release it.',factory:singleHinge,action:'hinges',kind:'Joint demo with a fixed axle, not a freestanding model',source:JOINT_REFERENCE},
 {id:'axle',title:'Axle & bearings',level:'Simple',skill:'Slide · spin',hint:'Select a loose connector and drag the gold arrow or ring.',factory:()=>exampleModel('axle'),kind:'Original connection-method demo',source:JOINT_REFERENCE},
 {id:'grid',title:'Shared-edge grid',level:'Intermediate',skill:'Pattern · shared parts',hint:'Select the original square group and repeat it; shared edges are reused.',factory:gridWall,kind:'Original grid demo using standard rod pitch',source:JOINT_REFERENCE},
 {id:'swing',title:'Playground swing',level:'Intermediate',skill:'Pull · release',hint:'Run the hinge, drag the seat, and let go.',factory:swingModel,action:'hinges',kind:'Single-bay adaptation, not an exact manual copy',source:SWING_REFERENCE},
 {id:'vehicle',title:'Wheeled chassis',level:'Intermediate',skill:'Axles · wheels',hint:'Run the motor to turn the front axle; the rear wheels stay free.',factory:manualVehicle,action:'motors',kind:'Based on the illustrated vehicle guide',source:VEHICLE_MANUAL},
 {id:'powered',title:'Motor windmill',level:'Advanced',skill:'Motor · drive clip',hint:'Start the motor. The keyed rotor turns while the supports stay locked.',factory:poweredWindmill,action:'motors',kind:'Original build with referenced motor and keyed hub',source:'https://www.knexusergroup.org.uk/en/knex-hint-M4.html'},
 {id:'compound',title:'Two-stage gearbox',level:'Advanced',skill:'Gears · ratios',hint:'Start the motor and compare the input and output axles.',factory:compoundGearModel,action:'motors',kind:'Original parallel-axis gear demonstration; approximate tooth geometry',source:'https://shop.knexusergroup.org.uk/collections/knex-parts-gears'},
 {id:'tower',title:'Braced tower',level:'Advanced',skill:'Layers · bracing',hint:'Open Scene to hide a storey or select a whole level.',factory:towerModel,kind:'Original structure using classic 3D joints',source:'https://www.knexusergroup.org.uk/en/knex-hint-A4.html'},
 {id:'rover',title:'Twin-motor rover',level:'Advanced',skill:'Drive · controller',hint:'Open Test drive and use the arrow keys to steer.',factory:roverModel,action:'drive',kind:'Original differential-drive demo; approximate flat-ground physics',source:'https://www.knexusergroup.org.uk/en/knex-hint-M4.html'},
 {id:'nested',title:'Double hinge',level:'Advanced',skill:'Coupled physics',hint:'Run the hinges and pull either hanging section.',factory:nestedSwingModel,action:'hinges',kind:'Mechanical variation of the single-bay swing',source:SWING_REFERENCE}
];
export const REFERENCE_SCENES=[
 {id:'connectors',title:'Classic connectors',factory:connectorReferenceModels},
 {id:'wheels',title:'Hubs & tyres',factory:wheelReferenceModels},
 {id:'motors',title:'Motor housings',factory:motorReferenceModels}
];
export function createExample(id){const entry=[...EXAMPLES,...REFERENCE_SCENES].find(e=>e.id===id);if(!entry)throw Error('Unknown example');const model=entry.factory();prepareGroundedExample(model,id);return model;}
