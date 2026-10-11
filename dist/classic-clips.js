// Original-size Classic parts. Profiles are photo reconstructions, not CAD.
export const CLASSIC_CLIPS=[
 ['hinge-blue','Blue hinge half','90912','#1396ce','pin',.8],
 ['hinge-black','Black hinge half','90919','#252a2b','socket',.62],
 ['hinge-green','Green hinge half','90913','#84c936','socket',.62],
 ['clip-blue','Blue rod-end stop','91440','#405a88',null,.61],
 ['clip-bronze','Bronze rod-end stop','914401','#927f70',null,null]
].map(([id,name,partNumber,color,hingeHalf,massG])=>({id,name,partNumber,color,hingeHalf,massG,clipGeometry:true,noBore:true,noSide:!hingeHalf,group:'extras',slots:[0],thickness:6.3,bodyDims:hingeHalf?[25,10,10]:[14,9,6.3],reference:`https://shop.knexusergroup.org.uk/products/${partNumber}`}));
export const hingeCompatible=(a,b)=>!!a.hingeHalf&&!!b.hingeHalf&&a.hingeHalf!==b.hingeHalf;
export function hingePort(d){return{key:'pivot',kind:'hinge',pos:[0,0,d.hingeHalf==='pin'?3.15:-3.15],dir:[0,0,d.hingeHalf==='pin'?1:-1]};}
