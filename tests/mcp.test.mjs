import test from 'node:test';
import http from 'node:http';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';
import {BuildWorkspace} from '../mcp/workspace.mjs';
import {buildAirplane} from '../mcp/airplane-flat.mjs';
import {startPreview} from '../mcp/preview.mjs';
import {parseModel,exportModel,ports,V} from '../dist/engine.js';
const seed={op:'place',type:'c-white',position:[0,60,0],quaternion:[0,0,0,1],alias:'hub'};
test('MCP batches snap real parts, close endpoints, reject collisions atomically and enforce revisions',()=>{
 const w=new BuildWorkspace();let b=w.create('Test');b=w.edit(b.buildId,0,[seed,{op:'attach',type:'r-blue',host:'hub',socket:'slot0',mode:'end',alias:'rod'}]);assert.equal(b.parts,2);assert.equal(b.connections,1);
 const before=exportModel(w.get(b.buildId).model);assert.throws(()=>w.edit(b.buildId,0,[seed]),/Revision conflict/);
 assert.throws(()=>w.edit(b.buildId,b.revision,[{...seed,alias:'collision'}]),/intersects/);assert.equal(exportModel(w.get(b.buildId).model),before);assert.equal(w.get(b.buildId).revision,b.revision);
 assert.throws(()=>w.edit(b.buildId,b.revision,[{op:'remove',part:'rod'},{op:'place',type:'invented-part',position:[0,0,0]}]),/Unknown/);assert.equal(exportModel(w.get(b.buildId).model),before);
 assert.throws(()=>w.edit(b.buildId,b.revision,[{op:'attach',type:'r-blue',host:'hub',socket:'slot0',mode:'end'}]),/occupied/);
 b=w.undo(b.buildId,b.revision);assert.equal(b.parts,0);assert.throws(()=>w.publish(b.buildId,b.revision),/Cannot publish/);
});
test('airplane uses stock parts, actual aligned sockets, one connected component and no mesh interference',()=>{
 const w=new BuildWorkspace(),b=buildAirplane(w),m=w.get(b.buildId).model,r=w.validate(b.buildId);assert.equal(m.parts.length,27);assert.equal(m.links.length,32);assert.equal(r.valid,true);assert.equal(r.connected,true);
 for(const l of m.links){const a=ports(m.parts.find(p=>p.id===l.a)).find(p=>p.key===l.ap),z=ports(m.parts.find(p=>p.id===l.b)).find(p=>p.key===l.bp);assert.ok(V(a.pos).distanceTo(V(z.pos))<1e-6);assert.ok(V(a.dir).dot(V(z.dir))<-.9999);}
 const snapshot=w.publish(b.buildId,b.revision);w.edit(b.buildId,b.revision,[{op:'remove',part:'rod1'}]);assert.equal(snapshot.model.parts.length,27);assert.doesNotThrow(()=>parseModel(JSON.stringify(snapshot.model)));
});
test('preview is loopback only, validates Host/Origin/token and exposes no mutation endpoint',async()=>{
 const w=new BuildWorkspace(),preview=await startPreview(w);try{
 assert.equal((await fetch(preview.origin+'/ai-build')).status,403);
 assert.equal((await fetch(preview.origin+'/ai-build?token='+preview.token,{headers:{Origin:'https://evil.invalid'}})).status,403);
 assert.equal(await new Promise((resolve,reject)=>http.get(preview.origin+'/ai-build?token='+preview.token,{headers:{Host:'evil.invalid'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject)),403);
 assert.equal((await fetch(preview.origin+'/ai-build?token='+preview.token,{method:'POST'})).status,405);
 assert.deepEqual(await (await fetch(preview.origin+'/ai-build?token='+preview.token)).json(),{sequence:0});
 assert.equal((await fetch(preview.origin+'/%2e%2e%2fpackage.json')).status,404);
 assert.match(await (await fetch(preview.origin)).text(),/K.NEX Studio/);
 }finally{await preview.close();}
});
test('real MCP stdio client discovers tools, edits a build, calls the prompt and publishes an editor snapshot',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'knex-mcp-test-')),transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../mcp/server.mjs',import.meta.url))],env:{...process.env,KNEX_BUILDS_DIR:directory},stderr:'pipe'}),client=new Client({name:'knex-test',version:'1.0.0'});
 let stderr='';transport.stderr?.on('data',data=>stderr+=data);
 try{
 await client.connect(transport);const tools=await client.listTools();assert.equal(tools.tools.length,10);
 const call=async(name,args={})=>{const r=await client.callTool({name,arguments:args});assert.ok(!r.isError,JSON.stringify(r));return JSON.parse(r.content[0].text);};
 const catalog=await call('search_parts',{query:'r-blue'});assert.ok(catalog.parts.some(p=>p.type==='r-blue'));
 let draft=await call('create_build',{name:'Protocol assembly'});draft=await call('edit_build',{buildId:draft.buildId,expectedRevision:0,commands:[seed,{op:'attach',type:'r-blue',host:'hub',socket:'slot0',mode:'end',alias:'rod'}]});assert.equal(draft.connections,1);
 const bad=await client.callTool({name:'edit_build',arguments:{buildId:draft.buildId,expectedRevision:0,commands:[seed]}});assert.equal(bad.isError,true);
 const prompt=await client.getPrompt({name:'build_knex',arguments:{description:'Build an airplane'}});assert.match(prompt.messages[0].content.text,/Build an airplane/);
 const preview=await call('shape_to_frame',{shapes:[{name:'Box',kind:'box',center:[37.5,112.5,37.5],size:[75,75,75]}]});assert.equal(preview.previewOnly,true);const generated=await call('shape_to_frame',{previewOnly:false,shapes:[{name:'Box',kind:'box',center:[37.5,112.5,37.5],size:[75,75,75]}]});assert.equal(generated.revision,1);
 const b=await call('example_airplane'),result=await call('publish_build',{buildId:b.buildId,expectedRevision:b.revision});
 const file=parseModel(await readFile(result.file,'utf8'));assert.equal(file.parts.length,1700);const url=new URL(result.previewUrl),snapshot=await (await fetch(url.origin+'/ai-build?token='+url.searchParams.get('aiBridge'))).json();assert.equal(snapshot.model.parts.length,1700);assert.equal(snapshot.revision,b.revision);assert.match(stderr,/MCP ready/);
 }finally{await client.close();}
});
