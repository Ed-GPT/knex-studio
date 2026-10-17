import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import * as T from '../dist/vendor/three.module.js';
import {makeRenderPart} from '../dist/render-part.js';
import {createPartHighlighter} from '../dist/part-highlight.js';
import {selectionClosure} from '../dist/editor-state.js';
import {createExampleLoader} from '../dist/example-loader.js';
import {part,emptyModel,exportModel} from '../dist/engine.js';

test('selection closure includes disconnected selections, cycles and locked neighbours after links change',()=>{
 const m=emptyModel();m.parts=Array.from({length:8},()=>part('r-blue'));const id=i=>m.parts[i].id;
 m.parts[2].grounded=true;m.editor={layers:[{id:'hidden',partIds:[id(3)],visible:false}],groups:[]};
 m.links=[[0,1],[1,2],[2,0],[2,3],[4,5],[6,7]].map(([a,b])=>({a:id(a),b:id(b)}));
 assert.deepEqual(selectionClosure(m,[id(1),id(0),id(5),'missing']),new Set([0,1,2,3,4,5].map(id)));
 m.links=m.links.filter(l=>l.b!==id(3));
 assert.deepEqual(selectionClosure(m,[id(0)]),new Set([0,1,2].map(id)));
 m.links.push({a:id(2),b:id(6)});
 assert.deepEqual(selectionClosure(m,[id(0)]),new Set([0,1,2,6,7].map(id)));
 assert.equal(selectionClosure(m,[]).size,0);
});

test('hover changes retain selected materials, restore originals, and dispose only owned highlights',()=>{
 const root=new T.Group(),a=makeRenderPart('c-white'),b=makeRenderPart('c-white');a.userData.partId='a';b.userData.partId='b';root.add(a,b);
 const original=a.children[0].material;assert.equal(original,b.children[0].material);
 let disposed=0;original.addEventListener('dispose',()=>disposed++);
 const highlight=createPartHighlighter();highlight.update(root,new Set(['a']),null);
 const selected=a.children[0].material;assert.notEqual(selected,original);assert.equal(selected.color.getHexString(),'ff29d6');
 highlight.update(root,new Set(['a']),'b');const hovered=b.children[0].material;
 assert.equal(a.children[0].material,selected);assert.equal(hovered.color.getHexString(),'8effed');
 let hoverDisposed=0;hovered.addEventListener('dispose',()=>hoverDisposed++);
 highlight.update(root,new Set(['a']),'a');assert.equal(a.children[0].material,selected);assert.equal(b.children[0].material,original);assert.equal(hoverDisposed,1);
 a.visible=false;highlight.update(root,new Set(['a']),null);assert.equal(a.children[0].material,original);
 highlight.clear();assert.equal(disposed,0);
});

test('accelerated picking preserves nearest hits through socket holes and transformed shared parts',()=>{
 const root=new T.Group();for(let i=0;i<8;i++){const g=makeRenderPart(['c-white','c-yellow','r-blue','c-blue'][i%4]);g.position.set((i%4)*32,Math.floor(i/4)*30,i*3);g.rotation.set(i*.13,i*.17,i*.11);root.add(g);}root.updateMatrixWorld(true);
 const meshes=[];root.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const ray=new T.Raycaster();ray.firstHitOnly=true;
 let hitCount=0,missCount=0;
 for(let i=0;i<160;i++){
  ray.set(new T.Vector3((i*17)%150-20,(i*23)%80-20,200),new T.Vector3(0,0,-1));ray.near=i%3?0:190;ray.far=i%5?500:195;
  const fast=ray.intersectObjects(root.children,true)[0];const overrides=meshes.map(m=>m.raycast);
  meshes.forEach(m=>m.raycast=T.Mesh.prototype.raycast);const slow=ray.intersectObjects(root.children,true)[0];meshes.forEach((m,j)=>m.raycast=overrides[j]);
  assert.equal(!!fast,!!slow);if(slow){hitCount++;assert.equal(fast.object,slow.object);assert.ok(fast.point.distanceTo(slow.point)<1e-5);}else missCount++;
 }
 assert.ok(hitCount>5&&missCount>5);
 const clone=makeRenderPart('c-white');assert.equal(clone.children[0].geometry,root.children[0].children[0].geometry);assert.notEqual(clone.children[0].raycast,T.Mesh.prototype.raycast);
});

function workerAdapter(){const w=new Worker(new URL('./helpers/example-worker-node.mjs',import.meta.url)),adapter={postMessage:data=>w.postMessage(data),terminate:()=>w.terminate()};w.on('message',data=>adapter.onmessage?.({data}));w.on('error',e=>adapter.onerror?.(e));return adapter;}
test('example worker builds a validated plane and cached loads cannot inherit edits',async()=>{
 let started=0;const load=createExampleLoader(()=>{started++;return workerAdapter();});
 const a=await load('swept-plane');assert.equal(a.parts.length,317);const before=exportModel(a);a.parts[0].pos[0]+=500;a.editor.groups[0].name='Edited';
 const b=await load('swept-plane');assert.equal(exportModel(b),before);assert.equal(started,1);
 await assert.rejects(load('missing-example'),/Unknown example/);assert.equal(started,2);
});
test('cancelled example loads terminate workers and do not return a late model',async()=>{
 let stopped=0,sent=0;const load=createExampleLoader(()=>({postMessage(){sent++;},terminate(){stopped++;}}));
 const controller=new AbortController(),pending=load('swept-plane',{signal:controller.signal});controller.abort();
 await assert.rejects(pending,{name:'AbortError'});assert.equal(stopped,1);assert.equal(sent,1);
 await assert.rejects(load('swept-plane',{signal:controller.signal}),{name:'AbortError'});assert.equal(sent,1);
});
test('worker startup failures leave the loader retryable',async()=>{
 let fail=true;const saved=exportModel(emptyModel());const load=createExampleLoader(()=>{if(fail)throw Error('Worker unavailable');return{postMessage(){queueMicrotask(()=>this.onmessage({data:{model:saved}}));},terminate(){}};});
 await assert.rejects(load('square'),/Worker unavailable/);fail=false;assert.equal((await load('square')).parts.length,0);
});
