const span=37.5*Math.SQRT2/2;
export const TETHERED_REFERENCE='https://www.knexusergroup.org.uk/en/knex-hint-M2.html';
export const TETHERED_MOTORS=[['m-tethered-red','Red tethered motor','92875','#b92532',1160],['m-tethered-gray','Gray tethered motor','20554','#7e8587',150]].map(([id,name,partNumber,color,leadLength])=>({id,name,partNumber,color,leadLength,reference:'https://shop.knexusergroup.org.uk/products/'+partNumber,geometryStatus:'Photo reconstruction; docked battery holder; dimensions and output ratio unverified',group:'motors',motor:true,tetheredMotor:true,noFaceMount:true,thickness:18.9,bodyDims:[108,80,31],massCenter:[8,-20,0],slots:[],bores:[{key:'hole',kind:'hole',pos:[0,0,0],dir:[0,0,1],thickness:18.9},...[-1,1].map((s,i)=>({key:'mount'+i,kind:'hole',pos:[s*span,-span,0],dir:[0,0,1],thickness:31}))],endSocket:{key:'drive-end',kind:'bearing',pos:[-25,0,0],dir:[-1,0,0]}}));
// The supplier lists approx.36 RPM without identifying the axis or load.
// Both outputs use a clearly uncalibrated 1:1 preview, not a measured ratio.
export const TETHERED_PREVIEW_RATIO=1;
