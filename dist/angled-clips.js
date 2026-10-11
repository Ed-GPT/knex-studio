// Classic 91690, documented in Hint A15. Mount position and peg dimensions are
// photo estimates. The original clip has a keyed wedge, not a round axle hole.
const H=Math.SQRT1_2;
export const ANGLED_CLIP={id:'clip-angled',name:'Orange angled clip',partNumber:'91690',color:'#f48a18',group:'extras',angledClip:true,clipGeometry:true,noBore:true,slots:[0],thickness:6.3,bodyDims:[20,9,20],reference:'https://shop.knexusergroup.org.uk/products/91690'};
export const angledPorts=()=>[{key:'slot0',kind:'slot',pos:[10.1*H,0,1.5+10.1*H],dir:[H,0,H],sideAxis:[-H,0,H]},{key:'wedge',kind:'wedge',pos:[0,0,0],dir:[0,0,-1],tangent:[1,0,0]}];
export const hasRecesses=d=>['90901','90902','90903','90904','90905','90906','90908','90907','90909'].includes(d.partNumber);
export function recessPorts(d){return hasRecesses(d)?d.slots.flatMap((degrees,i)=>{const a=degrees*Math.PI/180,x=Math.cos(a),y=Math.sin(a);return [1,-1].map(face=>({key:`recess${i}${face===1?'f':'b'}`,kind:'recess',pos:[7.3*x,7.3*y,face*3.15],dir:[0,0,face],tangent:[x,y,0]}));}):[];}
export const occupancyKey=key=>/^recess\d+[fb]$/.test(key)?key.slice(0,-1):key;
