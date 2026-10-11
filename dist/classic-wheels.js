// Classic supplier references, checked 2026-10-11. Diameter in hub names is
// the hub diameter, not the fitted tyre's outside diameter. Widths/profile
// and racing tyre outside diameters below are photo estimates, not CAD data.
const reference=number=>'https://shop.knexusergroup.org.uk/products/'+number;
export const CLASSIC_WHEELS=[
 ...[
  ['h-spoked37-silver','Silver spoked hub','91978',37,6.2,'#929699','spoked',6],
  ['h-spoked37-black','Black spoked hub','919780',37,6.2,'#272b30','spoked-flat',6],
  ['h-racing37-gray','Gray racing hub','91174',37,18,'#929699','racing',5],
  ['h-racing37-black','Black racing hub','91170',37,18,'#25282c','racing',5],
  ['h-racing50','Large racing hub','91184',50,20,'#929699','racing',5],
  ['h-narrow50-gray','Gray narrow hub','91254',50,10,'#929699','narrow',6],
  ['h-narrow50-black','Black narrow hub','91254B',50,10,'#25282c','narrow',6],
 ].map(([id,name,partNumber,diameter,thickness,color,wheelStyle,spokes])=>({id,name:`${name} · ${diameter} mm`,partNumber,diameter,thickness,color,wheelStyle,spokes,wheelHub:true,endBearing:wheelStyle==='racing',bearingDepth:wheelStyle==='racing'?thickness-2:undefined,keyDepth:wheelStyle==='racing'?2:undefined,keyable:wheelStyle!=='spoked-flat',group:'wheels',slots:[],reference:reference(partNumber),geometryStatus:'Photo reconstruction; hub diameter approximate; width and tolerances unverified'})),
 ...[
  ['t-racing37','Racing tyre · 37 mm hub','91150',45,37,18,'racing',['h-racing37-gray','h-racing37-black','c-white']],
  ['t-slick37','Slick tyre · 37 mm hub','91380',45,37,18,'slick',['h-racing37-gray','h-racing37-black']],
  ['t-racing50','Racing tyre · 50 mm hub','91160',60,50,20,'racing',['h-racing50','h-narrow50-gray','h-narrow50-black']],
  ['t-narrow50','Narrow tyre · 50 mm hub','91240',60,50,10,'racing',['h-narrow50-gray','h-narrow50-black']],
 ].map(([id,name,partNumber,diameter,fitDiameter,thickness,tread,fits])=>({id,name,partNumber,diameter,fitDiameter,thickness,tread,fits,tire:true,group:'wheels',color:'#242629',slots:[],reference:reference(partNumber),geometryStatus:'Photo reconstruction; width, tread and racing tyre outside diameter unverified'})),
];
// The 50 mm racing tyre takes one full racing hub OR two narrow hubs.
// Each narrow hub occupies its own half; a full hub occupies both halves.
export function tyreSeats(tyre,hub){return tyre.id==='t-racing50'&&hub.wheelStyle==='narrow'?[{key:'tire0',z:-(tyre.thickness-hub.thickness)/2},{key:'tire1',z:(tyre.thickness-hub.thickness)/2}]:[{key:'tire',z:0}];}
export function tyreSeatBusy(model,id,key){return model.links.some(l=>[[l.a,l.ap],[l.b,l.bp]].some(([part,port])=>part===id&&/^tire[01]?$/.test(port)&&(key==='tire'||port==='tire'||port===key)));}
export const bearingPoint=d=>[0,0,d.thickness/2-2];
