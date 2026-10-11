// Original Classic gears. Diameters/tooth counts from supplier listings;
// thickness and molded profile are photo reconstructions, not measured tolerances.
export const CLASSIC_GEARS=[
 ['snap-gray14','Gray snap-on gear · 14 teeth','91324',14,25,'#a8aea5',false,true],
 ['snap-black14','Black snap-on gear · 14 teeth','99119',14,25,'#25292c',false,true],
 ['gold14','Gold gear · 14 teeth','91313',14,25,'#c9b867',false,false],
 ['dark-blue14','Dark blue gear · 14 teeth','91317D',14,25,'#242d61',false,false],
 ['gray34','Gray crown gear · 34 teeth','91993',34,55,'#9b9e95',true,false],
 ['black82','Black crown gear · 82 teeth','90997',82,130,'#292d29',true,false],
].map(([id,name,partNumber,teeth,diameter,color,crown,endBearing])=>({id:'g-'+id,name,partNumber,teeth,diameter,color,crown,endBearing,noBore:endBearing,keyable:!endBearing,pitchRadius:teeth*1.5625/2,gear:true,group:'gears',thickness:6.3,slots:[],reference:'https://shop.knexusergroup.org.uk/products/'+partNumber.toLowerCase(),geometryStatus:'Photo reconstruction; thickness, tooth profile and bearing tolerances unverified'}));
export const SNAP_GEAR_REFERENCE='https://www.knexusergroup.org.uk/en/knex-hint-G2.html';
