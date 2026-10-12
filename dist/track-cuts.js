// Partition sampled rails into stock-sized cuts. Splices stay clear of mounting
// tabs; the clearance is a modeled envelope, not a verified fit tolerance.
import {Vector3} from './vendor/three.module.js';
export function stockCuts(points,stockLength,mountIndices=[]){
 const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+new Vector3(...points[i]).distanceTo(new Vector3(...points[i-1])));
 const ends=[0],last=points.length-1;while(ends.at(-1)<last){const start=ends.at(-1);let end=start+1;while(end<last&&lengths[end+1]-lengths[start]<=stockLength)end++;
  if(end<last)while(end>start&&(lengths[last]-lengths[end]<1||mountIndices.some(i=>Math.abs(lengths[i]-lengths[end])<15)))end--;
  if(end<=start||lengths[end]-lengths[start]>stockLength||lengths[end]-lengths[start]<1)throw Error('No clear stock-length splice position. Adjust support spacing or the path.');ends.push(end);
 }
 return ends.slice(1).map((end,i)=>({start:ends[i],end,startDistance:lengths[ends[i]],length:lengths[end]-lengths[ends[i]],points:points.slice(ends[i],end+1)}));
}
