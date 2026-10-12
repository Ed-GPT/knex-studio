// 92815 and its dedicated 90983 gear, from Hint M3 and manual 89790 page 11.
// These dimensions are reconstructed estimates, not measured production geometry.
export const WORM_REFERENCE='https://www.knexusergroup.org.uk/en/knex-hint-M3.html';
export const WORM_GEAR_CENTER=[0,24.5,0];
export const WORM_MOTOR={id:'m-12v',name:'12 V worm motor',partNumber:'92815',reference:'https://shop.knexusergroup.org.uk/products/92815',geometryStatus:'Photo reconstruction; mount dimensions and worm ratio unverified',group:'motors',color:'#999e91',motor:true,wormMotor:true,noBore:true,noFaceMount:true,bodyDims:[100,45,85],massCenter:[-29,-3,0],slots:[],bores:[-1,1].map((s,i)=>({key:'hole'+i,kind:'hole',pos:[0,-15,s*37.5],dir:[1,0,0],thickness:45}))};
export const WORM_WHEEL={id:'g-12v',name:'White gear · 12 V motor',partNumber:'90983',reference:'https://shop.knexusergroup.org.uk/products/90983',geometryStatus:'Photo reconstruction; tooth count, diameter and pitch unverified',group:'gears',color:'#eee9d2',gear:true,wormWheel:true,diameter:41,thickness:6.3,slots:[]};
export const wormCompatible=(a,b)=>a.wormMotor&&b.wormWheel||b.wormMotor&&a.wormWheel;
