import {pulleyDriveModel} from './belt-model.js';
import {BELT_REFERENCE} from './belt-parts.js';
import {smallWheelBench} from './small-wheel-model.js';
import {SMALL_WHEEL_REFERENCE} from './small-wheels.js';
import {buildOctagonalGrid} from './octagonal-grid.js';
import {wormReductionModel} from './worm-motor-model.js';
import {WORM_REFERENCE} from './worm-motor.js';
import {springFan} from './spring-motor-model.js';
import {SPRING_REFERENCE} from './spring-motor.js';
import {rodColorBench,rodColorLattice} from './rod-models.js';
import {connectorVariantBench,variantWindmill} from './connector-models.js';
import {buildTruss} from './truss-builder.js';
import {crownGearModel,idlerGearModel,classicGearBench} from './gear-models.js';
import {SNAP_GEAR_REFERENCE} from './classic-gears.js';
import {panelWall,panelBench,PANEL_REFERENCE} from './panel-models.js';
import {buildRadial} from './radial-builder.js';
import {buildFrame} from './frame-builder.js';
import {angledSupportModel,ANGLED_REFERENCE,ballJointModel,BALL_REFERENCE,classicHingeModel,classicClipBench,yClipBench,HINGE_REFERENCE} from './clip-models.js';
import {scaleModel,pantographModel,SCALE_REFERENCE,PANTOGRAPH_REFERENCE} from './mechanism-models.js';
import {exampleModel,emptyModel,part,targets,solve,add} from './engine.js';
import {repeatableSquare,towerModel,compoundGearModel} from './advanced-models.js';
import {repeatPattern} from './pattern.js';
import {swingModel,nestedSwingModel,connectorReferenceModels,SWING_REFERENCE} from './swing-model.js';
import {poweredWindmill,twoSpeedWindmill,motorReferenceModels} from './motor.js';
import {manualVehicle,wheelReferenceModels,racingWheelBench,VEHICLE_MANUAL} from './wheel-models.js';
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
export function rigidTower(){const m=buildFrame({rod:'r-rigid-tan',counts:[1,4,1],braced:true}).model;m.name='Rigid-rod tower';for(const p of m.parts)p.pos[1]+=12;return m;}
export function octagonalTower(){const m=buildRadial({kind:'tube',counts:[2,4,1],rod:'r-yellow',braced:true}).model;m.name='Octagonal observation tower';for(const p of m.parts)p.pos[1]+=12;return m;}
export function paneledTunnel(){const m=buildFrame({kind:'frame',counts:[3,2,2],rod:'r-blue',braced:false,panel:'panel-91072'}).model;m.name='Paneled tunnel';for(const p of m.parts)p.pos[1]+=15;return m;}
export const EXAMPLES=[
 {id:'pulley-drive',title:'Pulley reduction drive',level:'Intermediate',skill:'Rubber band · 0.74× output',hint:'Run the motor. The brown band drives the larger pulley in the same direction at 0.74× speed. Both pulleys are keyed to independently supported axles.',factory:pulleyDriveModel,action:'motors',kind:'Original locked fixture using Classic 92001 and hub/pulleys; reconstructed groove radii, ideal no-slip drive, unverified belt fit/tension',source:BELT_REFERENCE},
 {id:'small-wheels',title:'Small wheels · grip and spin',level:'Simple',skill:'Friction drive · free bearing',hint:'Run the motor: the open-center wheel follows the axle while the closed-center wheel stays free. Select the free wheel and drag its rotation ring to spin it independently.',factory:smallWheelBench,action:'motors',kind:'Original locked comparison fixture for Classic 91140 and 918300; approximate geometry and ideal grip, not a vehicle or official manual build',source:SMALL_WHEEL_REFERENCE},
 {id:'octagonal-cell-frame',title:'Octagonal cell frame',level:'Advanced',skill:'Shared walls · six cells',hint:'Open Grid & frame → Cell frame to grow the columns, rows and levels. Touching cells share rods and connector pairs. Each cell has a scene layer.',factory:()=>{const m=buildOctagonalGrid({kind:'oct-frame',counts:[3,3,2],rod:'r-blue',braced:true}).model;m.name='Octagonal cell frame';for(const p of m.parts)p.pos[1]+=15;return m;},kind:'Original stock-length procedural lattice, not an official manual model; approximate part geometry, no buckling simulation',source:'https://www.knexusergroup.org.uk/en/knex-hint-A4.html'},
 {id:'worm-reduction',title:'12 V reduction bench',level:'Advanced',skill:'Worm drive · keyed axle · 14:82',hint:'The motor engages its dedicated white gear. A separate blue gear on the same keyed axle drives the yellow output at 14/82 speed. RPM previews the white-gear axle; the motor worm ratio is unverified.',factory:wormReductionModel,action:'motors',kind:'Original locked test fixture based on Classic 92815 mounting references; approximate dimensions, not an official manual replica',source:WORM_REFERENCE},
 {id:'crown-gears',title:'Three-axis crown gearbox',level:'Advanced',skill:'Two corners · three axles',hint:'Run the motor. Two crown pairs transfer rotation around two corners at 34:14 each. The gray support connectors stay locked.',factory:crownGearModel,action:'motors',kind:'Original locked test fixture, not a freestanding manual model; ideal pitch contact and approximate tooth clearance',source:'https://www.knexusergroup.org.uk/en/knex-hint-G1.html'},
 {id:'spring-fan',title:'Spring motor fan',level:'Intermediate',skill:'Wind · release · finite turns',hint:'Wind the spring with ↶ +1 turn, then Release spring. The four housing eyes are carried on two locked fixture rods. Preview speed is adjustable; spring torque is unverified.',factory:springFan,action:'motors',kind:'Original test fixture using Classic 92890, with reconstructed mount spacing; not a manual replica or calibrated spring simulation',source:SPRING_REFERENCE},
 {id:'rod-lattice',title:'Rod color lattice',level:'Advanced',skill:'Stock spans · color variants',hint:'Black 54 mm rods form the cells. Gold 86 mm rods brace the available diagonal planes. Use the generator to create another size.',factory:rodColorLattice,kind:'Original generated lattice using identified Classic rod color variants; no structural load analysis',source:'https://shop.knexusergroup.org.uk/products/909523'},
 {id:'variant-windmill',title:'Black connector windmill',level:'Advanced',skill:'Color variants · same mounts',hint:'Start the motor. The black 8-way connectors retain the same mounting and keyed rotor connections as the original white mold.',factory:variantWindmill,action:'motors',kind:'Original windmill using verified Classic connector color variants; approximate geometry and imposed motor speed',source:'https://shop.knexusergroup.org.uk/products/90968'},
 {id:'gable-roof',title:'Gable roof',level:'Advanced',skill:'45° rafters · repeat bays',hint:'Generate → Grid & frame → Gable roof changes the half-span, depth and internal bracing using actual stock rods. Each bay has its own layer.',factory:()=>{const m=buildTruss({kind:'roof',counts:[3,1,3],rod:'r-blue',braced:true}).model;m.name='Gable roof';for(const p of m.parts)p.pos[1]+=20;return m;},kind:'Original stock-length procedural demonstration, not an official manual model; no buckling or load certification',source:'https://www.knexusergroup.org.uk/en/knex-hint-A4.html'},
 {id:'idler-gears',title:'Snap-on idler gears',level:'Intermediate',skill:'Free gear · fixed axle',hint:'Run the motor. The small gray gear spins freely on its locked white rod; the gold output turns in the same direction as the input.',factory:idlerGearModel,action:'motors',kind:'Original parallel-axis test fixture based on Hint G2, not an official model or freestanding structure; approximate tooth geometry',source:SNAP_GEAR_REFERENCE},
 {id:'paneled-tunnel',title:'Paneled tunnel',level:'Advanced',skill:'Generated · four covered faces',hint:'Four faces use original molded panels. The two ends stay open because the blue connector pairs have no diagonal sockets in that plane. Generate → Grid & frame creates more sizes.',factory:paneledTunnel,kind:'Original generated frame with photo-based Classic panels, not an official model or load-bearing design',source:PANEL_REFERENCE},
 {id:'panel-wall',title:'Panel wall',level:'Intermediate',skill:'Panels · shared corners',hint:'Panels snap into the four inward diagonal sockets. Select a panel to disconnect and move it; the surrounding rods stay in place.',factory:panelWall,kind:'Original stock-grid demonstration using Classic molded panels; approximate plate details',source:PANEL_REFERENCE},
 {id:'square',title:'One square',level:'Simple',skill:'Snap · repeat',hint:'Select the square, then use Repeat + to extend it.',factory:repeatableSquare,kind:'Original connection-grid demo',source:JOINT_REFERENCE},
 {id:'hinge',title:'Single hinge',level:'Simple',skill:'Lock · swing',hint:'Run the hinge, pull the red arm, and release it.',factory:singleHinge,action:'hinges',kind:'Joint demo with a fixed axle, not a freestanding model',source:JOINT_REFERENCE},
 {id:'axle',title:'Axle & bearings',level:'Simple',skill:'Slide · spin',hint:'Select a loose connector and drag the gold arrow or ring.',factory:()=>exampleModel('axle'),kind:'Original connection-method demo',source:JOINT_REFERENCE},
 {id:'angled-support',title:'Splayed support',level:'Intermediate',skill:'Angled clips · 3D legs',hint:'Four original angled clips seat in the white connector recesses. Their red rods project 45° out of its plane. Open Stability to inspect the support footprint.',factory:angledSupportModel,kind:'Original 13-part support demonstrating Hint A15, not an exact manual model; peg dimensions are estimated',source:ANGLED_REFERENCE},
 {id:'grid',title:'Shared-edge grid',level:'Intermediate',skill:'Pattern · shared parts',hint:'Select the original square group and repeat it; shared edges are reused.',factory:gridWall,kind:'Original grid demo using standard rod pitch',source:JOINT_REFERENCE},
 {id:'swing',title:'Playground swing',level:'Intermediate',skill:'Pull · release',hint:'Run the hinge, drag the seat, and let go.',factory:swingModel,action:'hinges',kind:'Single-bay adaptation, not an exact manual copy',source:SWING_REFERENCE},
 {id:'vehicle',title:'Wheeled chassis',level:'Intermediate',skill:'Axles · wheels',hint:'Run the motor to turn the front axle; the rear wheels stay free.',factory:manualVehicle,action:'motors',kind:'Based on the illustrated vehicle guide',source:VEHICLE_MANUAL},
 {id:'powered',title:'Motor windmill',level:'Advanced',skill:'Motor · drive clip',hint:'Start the motor. The keyed rotor turns while the supports stay locked.',factory:poweredWindmill,action:'motors',kind:'Original build with referenced motor and keyed hub',source:'https://www.knexusergroup.org.uk/en/knex-hint-M4.html'},
 {id:'two-speed',title:'Two-speed windmill',level:'Advanced',skill:'Original motor · slow / fast',hint:'Run the 92401 motor. Switch between Slow and Fast; the keyed rotor follows and the housing stays fixed.',factory:twoSpeedWindmill,action:'motors',kind:'Original windmill with photo-reconstructed 92401 motor; approximate unloaded preview speeds, no torque simulation',source:'https://www.knexusergroup.org.uk/en/knex-hint-M9.html'},
 {id:'compound',title:'Two-stage gearbox',level:'Advanced',skill:'Gears · ratios',hint:'Start the motor and compare the input and output axles.',factory:compoundGearModel,action:'motors',kind:'Original parallel-axis gear demonstration; approximate tooth geometry',source:'https://shop.knexusergroup.org.uk/collections/knex-parts-gears'},
 {id:'tower',title:'Braced tower',level:'Advanced',skill:'Layers · bracing',hint:'Open Scene to hide a storey or select a whole level.',factory:towerModel,kind:'Original structure using classic 3D joints',source:'https://www.knexusergroup.org.uk/en/knex-hint-A4.html'},
 {id:'octagonal-tower',title:'Octagonal tower',level:'Advanced',skill:'Procedural · eight sides',hint:'Four alternating walls are braced with actual red rods. Levels have separate layers. Open Grid & frame to change the side segments, height and stock size.',factory:octagonalTower,kind:'Original stock-length procedural frame, not an official manual replica; stability does not simulate connector flex or buckling',source:'https://www.knexusergroup.org.uk/en/knex-hint-A4.html'},
 {id:'rigid-tower',title:'Rigid-rod tower',level:'Advanced',skill:'Rigid rods · generated frame',hint:'An original four-storey frame with tan rigid edges and black rigid diagonals. Open Scene for levels, or Simulate → Stability to test its weight and support.',factory:rigidTower,kind:'Original generated structure, not a manual replica; rigid-body stability does not simulate bending or buckling',source:'https://www.knexusergroup.org.uk/en/knex-hint-A7.html'},
 {id:'rover',title:'Twin-motor rover',level:'Advanced',skill:'Drive · controller',hint:'Open Test drive and use the arrow keys to steer.',factory:roverModel,action:'drive',kind:'Original differential-drive demo; approximate flat-ground physics',source:'https://www.knexusergroup.org.uk/en/knex-hint-M4.html'},
 {id:'scales',title:'Balance scale',level:'Advanced',skill:'Loads · coupled hinges',hint:'Run the hinges, pull either weight, then release. Use Left and Right extra payload to compare loads.',factory:scaleModel,action:'hinges',kind:'Adaptation of the 79565 balance mechanism with a braced beam and suspended wheel weights; not an exact manual copy',source:SCALE_REFERENCE},
 {id:'pantograph',title:'Pantograph · 2×',level:'Advanced',skill:'Closed loop · copy ratio',hint:'Use Top view, run the hinges and drag the short-link joint. The outer tip follows at twice its displacement from the locked pivot.',factory:pantographModel,action:'hinges',kind:'Adaptation of Maths activity 16 using rod-axle joints and equal-length arms; no pencil or trace output yet',source:PANTOGRAPH_REFERENCE},
 {id:'ball-joints',title:'Ball-joint pendulum',level:'Advanced',skill:'Spatial joints · pull & release',hint:'Run joints and pull either arm in the screen plane. Orbit the view to pull in another direction. The mounting fixture is fixed in space.',factory:ballJointModel,action:'hinges',kind:'Original spatial-joint demonstration using standard and large Classic ball clips; no physical travel stops or contact collisions',source:BALL_REFERENCE},
 {id:'molded-hinges',title:'Molded double hinge',level:'Advanced',skill:'Classic hinge halves · coupled motion',hint:'Run the hinges and drag either arm. Blue pin halves mate with black or green socket halves. The small mounting fixture is held fixed in space.',factory:classicHingeModel,action:'hinges',kind:'Original stress mechanism using the dedicated Classic hinge parts; approximate pivot dimensions',source:HINGE_REFERENCE},
 {id:'nested',title:'Double hinge',level:'Advanced',skill:'Coupled physics',hint:'Run the hinges and pull either hanging section.',factory:nestedSwingModel,action:'hinges',kind:'Mechanical variation of the single-bay swing',source:SWING_REFERENCE}
];
export const REFERENCE_SCENES=[
 {id:'rod-colors',title:'Classic rod colors',factory:rodColorBench},
 {id:'connector-colors',title:'Classic connector colors',factory:connectorVariantBench},
 {id:'classic-gears',title:'Classic gear variants',factory:classicGearBench},
 {id:'classic-panels',title:'Classic molded panels',factory:panelBench},
 {id:'y-clips',title:'Y clips · grip & peg',factory:yClipBench},
 {id:'classic-clips',title:'Clips & hinge halves',factory:classicClipBench},
 {id:'connectors',title:'Classic connectors',factory:connectorReferenceModels},
 {id:'wheels',title:'Hubs & tyres',factory:wheelReferenceModels},
 {id:'racing-wheels',title:'Racing wheels & bearings',factory:racingWheelBench},
 {id:'motors',title:'Motor housings',factory:motorReferenceModels}
];
export function createExample(id){const entry=[...EXAMPLES,...REFERENCE_SCENES].find(e=>e.id===id);if(!entry)throw Error('Unknown example');const model=entry.factory();prepareGroundedExample(model,id);return model;}
