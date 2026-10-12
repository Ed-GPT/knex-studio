import {SAPBroadphase} from './vendor/cannon-es.js';
// Cannon's SAP sorts AABB lower bounds but terminates pairs using sphere bounds.
// For long compounds those orders differ, so a valid later pair can be skipped.
export class BoundsBroadphase extends SAPBroadphase{
 constructor(world){super(world);this.useBoundingBoxes=true;}
 collisionPairs(world,p1,p2){if(this.dirty){this.sortList();this.dirty=false;}const axis=['x','y','z'][this.axisIndex],bodies=this.axisList;
  for(let i=0;i<bodies.length;i++){const a=bodies[i];for(let j=i+1;j<bodies.length;j++){const b=bodies[j];if(b.aabb.lowerBound[axis]>a.aabb.upperBound[axis])break;if(this.needBroadphaseCollision(a,b))this.intersectionTest(a,b,p1,p2);}}
 }
}
