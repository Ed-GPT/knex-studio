// Classic joint identities from supplier product photos and Hint A9.
// Ball radii, socket profiles, offsets and physical travel limits are unverified.
export const BALL_JOINTS=[
 ['ball-small','Ball-end clip','90940','standard','ball',3.6,0],
 ['socket-small','Socket-end clip','90945','standard','socket',3.6,0],
 ['ball-large','Large ball-end clip','99036B','large','ball',5.2,-5],
 ['socket-large','Large socket-end clip','99036S','large','socket',5.2,-5]
].map(([id,name,partNumber,ballFamily,ballRole,ballRadius,ballCenter])=>({id,name,partNumber,ballFamily,ballRole,ballRadius,ballCenter,group:'extras',color:'#303334',clipGeometry:true,noBore:true,slots:[0],thickness:6.3,bodyDims:ballFamily==='large'?[31,14,12]:[25,11,8],reference:`https://shop.knexusergroup.org.uk/products/${partNumber}`}));
export const ballCompatible=(a,b)=>!!a.ballFamily&&a.ballFamily===b.ballFamily&&a.ballRole!==b.ballRole;
export const ballPort=d=>({key:'joint',kind:d.ballRole,pos:[d.ballCenter,0,0],dir:[-1,0,0]});
