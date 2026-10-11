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

// Y clips grip a rod sideways. Their peg is a male rod end, not an axle bore.
export const CLASSIC_Y_CLIPS=[
 ['black','Black','90914','#292b2b'],['blue','Blue','90916','#225e9e'],
 ['fluor-green','Fluorescent green','90914FG','#6cda47'],['fluor-orange','Fluorescent orange','90922','#ff7b17'],
 ['gold','Gold','90917','#998451'],['green','Green','90914G','#187461'],
 ['gray','Gray','909141','#989c9f'],['mid-blue','Mid blue','909142','#39a9de'],
 ['red','Red','90923','#be2331'],['silver','Silver','90918','#a4a5a1']
].map(([key,colorName,partNumber,color])=>({id:'y-'+key,name:colorName+' Y clip',partNumber,color,yClip:true,clipGeometry:true,noBore:true,noSide:false,group:'extras',slots:[0],thickness:6.3,bodyDims:[14.5,9,6.3],reference:`https://shop.knexusergroup.org.uk/products/${partNumber}`}));
export const yClipPorts=()=>[{key:'slot0',kind:'clip',pos:[5.7,0,0],dir:[1,0,0]},{key:'end0',kind:'end',pos:[0,0,0],dir:[-1,0,0]}];
