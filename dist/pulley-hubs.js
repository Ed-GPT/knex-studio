// Original Classic hub/pulleys. Supplier diameters are approximate.
// Widths, groove profile and drive-key tolerances are reconstruction estimates.
export const PULLEY_HUBS=[
 ['h-small','Silver small pulley','90978',37,6.2,'#9ca4a6'],
 ['h-medium','Silver medium pulley','90979',50,12,'#9ca4a6'],
 ['h-small-gray','Gray small pulley','90978G',37,6.2,'#777e7b'],
 ['h-medium-gray','Gray medium pulley','90979G',50,12,'#777e7b'],
 ['h-small-white','White small pulley','909782',37,6.2,'#eeeede'],
].map(([id,name,partNumber,diameter,thickness,color])=>({id,name:`${name} · ${diameter} mm`,partNumber,diameter,thickness,color,pulley:true,wheelHub:true,group:'wheels',slots:[],reference:'https://shop.knexusergroup.org.uk/products/'+partNumber.toLowerCase(),geometryStatus:'Photo reconstruction; approximate diameter; width, groove profile, reverse-face key recesses and tolerances unverified'}));
export const pulleyFits=diameter=>PULLEY_HUBS.filter(d=>d.diameter===diameter).map(d=>d.id);
