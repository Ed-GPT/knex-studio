import {createExample} from './examples.js';
import {exportModel} from './engine.js';
// Keep the original factories and clearance checks, but run them off the UI thread.
self.onmessage=({data})=>{try{self.postMessage({model:exportModel(createExample(data.id))});}catch(e){self.postMessage({error:e.message});}};
