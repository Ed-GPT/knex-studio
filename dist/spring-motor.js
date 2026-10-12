// 92890: M1, supplier photo and USD394286 drawings. Housing dimensions, bore
// spacing, center of mass and internal gear profiles remain reconstruction estimates.
const span=37.5*Math.SQRT2/2;
export const SPRING_MOTOR={id:'m-spring',name:'Spring motor',partNumber:'92890',reference:'https://shop.knexusergroup.org.uk/products/92890',geometryStatus:'Photo and patent reconstruction; dimensions and spring torque unverified',group:'motors',color:'#bdcbd0',motor:true,springMotor:true,noFaceMount:true,thickness:18.9,bodyDims:[63,44,18.9],massCenter:[0,9,0],slots:[],bores:[{key:'hole',kind:'hole',pos:[0,0,0],dir:[0,0,1],thickness:18.9},...[-1,1].flatMap((s,i)=>[-1,1].map((z,j)=>({key:'hole'+(i*2+j),kind:'hole',pos:[s*span,span,z*6.3],dir:[0,0,1],thickness:6.3})))]};
export const SPRING_REFERENCE='https://www.knexusergroup.org.uk/en/knex-hint-M1.html';
export const SPRING_PREVIEW_LIMIT=20; // Software preview guard; not a real maximum winding specification.
