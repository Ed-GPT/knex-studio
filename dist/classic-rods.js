// Original-size rigid rods: supplier photos and Classic Hint A7.
// Match existing stock endpoint spacing; nominal lengths are rounded labels.
export const CLASSIC_RIGID_RODS=[
 ['r-rigid-tan','Tan rigid rod','90957',128,4,'#c4ad78','ribbed',3.73],
 ['r-rigid-black','Black rigid rod','919561',190,5,'#292b2b','ribbed',5.96],
 ['r-rigid-white','Yellow-white rigid rod','91956',190,5,'#d4d09b','square',5.95],
 ['r-rigid-blue','Blue rigid rod','90956B',190,5,'#1c5d9c','ribbed',4.55]
].map(([id,name,partNumber,nominal,stockIndex,color,rodProfile,massG])=>({id,name,partNumber,nominal,stockIndex,color,rodProfile,massG,rigidRod:true,group:'rods',slots:[],length:37.5*Math.SQRT2**stockIndex-20.2,noSide:rodProfile==='square',reference:`https://shop.knexusergroup.org.uk/products/${partNumber}`}));
