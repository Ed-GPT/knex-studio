// Original Classic wheel families, supplier photos and Hint W1.
// 25 mm diameter is approximate; width, holes and bearing depth are estimates.
export const SMALL_WHEELS=[
 {id:'w-small-open',name:'Open-center wheel · 25 mm',partNumber:'91140',axleGrip:true,keyable:true},
 {id:'w-small-closed',name:'Closed-center wheel · 25 mm',partNumber:'918300',endBearing:true,bearingDepth:4.3,keyable:false},
].map(d=>({...d,smallWheel:true,rollingSurface:true,diameter:25,thickness:6.3,color:'#24272b',group:'wheels',slots:[],reference:'https://shop.knexusergroup.org.uk/products/'+d.partNumber,geometryStatus:'Photo reconstruction; approximate diameter; width, hole profile and bearing depth unverified'}));
export const SMALL_WHEEL_REFERENCE='https://www.knexusergroup.org.uk/en/knex-hint-W1.html';
export const isRollingSurface=d=>!!(d.tire||d.rollingSurface);
