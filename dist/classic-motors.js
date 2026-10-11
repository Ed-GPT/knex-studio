// Original-size 92401. Supplier overall dimensions and speeds are approximate;
// mounting plane, shell detail and center of mass are photo estimates.
export const TWO_SPEED_MOTOR={id:'m-two-speed',name:'Two-speed motor · Tony',partNumber:'92401',reference:'https://shop.knexusergroup.org.uk/products/92401',geometryStatus:'Photo reconstruction; mounting dimensions unverified',group:'motors',color:'#81898a',motor:true,twoSpeed:true,thickness:60,mountPlane:33.15,bodyDims:[145,60,60],massCenter:[-43,0,0],slots:[]};
export const motorMountPlane=d=>d.mountPlane??18.75;
export const motorRate=(p,fallback=20)=>p?.type==='m-two-speed'?(p.motorSpeed==='fast'?240:48):fallback;
