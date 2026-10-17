import {parseModel} from './engine.js';
export function createExampleLoader(makeWorker=()=>new Worker(new URL('./example-worker.js',import.meta.url),{type:'module'})){
 const cache=new Map();
 return async function load(id,{signal}={}){
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  if(cache.has(id)){const saved=cache.get(id);cache.delete(id);cache.set(id,saved);return parseModel(saved);}
  const saved=await new Promise((resolve,reject)=>{
   let worker,timer;const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);worker?.terminate();};
   const fail=error=>{cleanup();reject(error);};
   const abort=()=>fail(new DOMException('Cancelled','AbortError'));
   try{worker=makeWorker();signal?.addEventListener('abort',abort,{once:true});
    worker.onmessage=({data})=>{cleanup();if(data.error)reject(new Error(data.error));else resolve(data.model);};
    worker.onerror=()=>fail(new Error('Could not prepare this example. Please reload and try again.'));
    timer=setTimeout(()=>fail(new Error('Example preparation timed out. Please try again.')),60000);
    worker.postMessage({id});
   }catch(e){fail(e);}
  });
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  const model=parseModel(saved);cache.set(id,saved);while(cache.size>4)cache.delete(cache.keys().next().value);
  // Saved strings never become the editable model. Every caller gets a fresh copy.
  return model;
 };
}
export const loadExampleModel=createExampleLoader();
