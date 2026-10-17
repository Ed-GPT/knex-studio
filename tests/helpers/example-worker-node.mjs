import {parentPort} from 'node:worker_threads';
globalThis.self={postMessage:data=>parentPort.postMessage(data)};
const ready=import('../../dist/example-worker.js');
parentPort.on('message',async data=>{await ready;self.onmessage({data});});
