import * as T from './vendor/three.module.js';
import {MeshBVH,acceleratedRaycast} from './vendor/three-mesh-bvh.js';
import {BY_ID} from './engine.js';
import {makePart} from './geometry.js';
const cache=new Map();
// Trees are shared with the cached geometry; mesh overrides are reapplied after
// cloning because Object3D.clone does not copy an instance's raycast function.
function picking(root){root.traverse(o=>{if(o.isMesh&&o.geometry.boundsTree)o.raycast=acceleratedRaycast;});return root;}

// Cache a merged rendering of each rigid rod/connector. Keep original geometry
// builders intact for references and specialty parts. Triangles and materials
// are retained, so ray picking and the visible socket profiles are unchanged.
export function makeRenderPart(type,p){const d=BY_ID[type];if(!['rods','connectors'].includes(d.group)||p?.path)return makePart(type,p);if(cache.has(type))return picking(cache.get(type).clone(true));const original=makePart(type,p),buckets=new Map();original.updateMatrixWorld(true);original.traverse(o=>{if(!o.isMesh)return;if(Array.isArray(o.material))throw Error('Unexpected multi-material rod/connector');let b=buckets.get(o.material);if(!b){b={position:[],normal:[],uv:[]};buckets.set(o.material,b);}const g=o.geometry,a=g.attributes,ix=g.index,normalMatrix=new T.Matrix3().getNormalMatrix(o.matrixWorld),v=new T.Vector3();for(let k=0;k<(ix?.count??a.position.count);k++){const i=ix?ix.getX(k):k;v.fromBufferAttribute(a.position,i).applyMatrix4(o.matrixWorld);b.position.push(v.x,v.y,v.z);if(a.normal)v.fromBufferAttribute(a.normal,i).applyNormalMatrix(normalMatrix);else v.set(0,1,0);b.normal.push(v.x,v.y,v.z);b.uv.push(a.uv?.getX(i)||0,a.uv?.getY(i)||0);}});const root=new T.Group();for(const [material,b]of buckets){const geometry=new T.BufferGeometry();for(const [key,size]of[['position',3],['normal',3],['uv',2]])geometry.setAttribute(key,new T.Float32BufferAttribute(b[key],size));geometry.computeBoundingBox();geometry.computeBoundingSphere();geometry.boundsTree=new MeshBVH(geometry,{maxLeafTris:8});const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}cache.set(type,root);return picking(root.clone(true));}
