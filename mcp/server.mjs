#!/usr/bin/env node
import {McpServer} from '@modelcontextprotocol/server';
import {serveStdio} from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {BuildWorkspace} from './workspace.mjs';
import {buildShapeFrame,shapePlan} from '../dist/shape-builder.js';
import {buildAirplane} from './airplane.mjs';
import {startPreview} from './preview.mjs';
const ref=z.string().min(1).max(100),alias=z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,49}$/),vec=z.tuple([z.number().min(-10000).max(10000),z.number().min(-10000).max(10000),z.number().min(-10000).max(10000)]),quat=z.tuple([z.number(),z.number(),z.number(),z.number()]);
const mode=z.enum(['end','through','side','interlock','hinge','ball','keyed','mount','tire','mesh','crown','chain','wedge','worm']);
const edit=z.discriminatedUnion('op',[
 z.object({op:z.literal('place'),type:ref,alias:alias.optional(),position:vec,quaternion:quat.default([0,0,0,1])}).strict(),
 z.object({op:z.literal('attach'),type:ref,alias:alias.optional(),host:ref,socket:ref,mode,roll:z.number().min(-360).max(360).optional(),offset:z.number().min(-10000).max(10000).optional(),portIndex:z.number().int().min(0).max(40).optional()}).strict(),
 z.object({op:z.literal('translate'),part:ref,delta:vec}).strict(),
 z.object({op:z.literal('lock'),part:ref,locked:z.boolean()}).strict(),
 z.object({op:z.literal('remove'),part:ref}).strict(),
 z.object({op:z.literal('repeat'),parts:z.array(ref).min(1).max(2500),copies:z.number().int().min(1).max(50),delta:vec,angle:z.number().min(-360).max(360).optional(),axis:vec.optional()}).strict()
]);
const build={buildId:z.string().uuid()},revision={...build,expectedRevision:z.number().int().nonnegative()},page={offset:z.number().int().nonnegative().default(0),limit:z.number().int().min(1).max(100).default(25)};
export const instructions=`Build original models using real K'NEX catalog parts. Use search_parts and connection_targets instead of inventing types or socket IDs. Positions are millimetres, quaternions are [x,y,z,w], Y is up. Attach computes exact modeled snap alignment; it adds a NEW part, and automatically closes matching free endpoints. Alias parts in edit_build batches, inspect geometry, validate, repair errors and publish_build only after a connected, collision-clear result. Each mutation needs the last expectedRevision. Failed batches are atomic. Never claim flight, strength or measured tolerances from validation. Publish returns a local preview URL and a saved .knex file. The browser offers Load AI build; it archives the prior model and supports Undo. Prompting happens in the MCP host, not inside this server. For recognizable models such as aircraft, inspect an identifiable real K'NEX manual first and record the set, pages, parts and assembly steps. Treat rough volumes only as proportion guides. Build connected subassemblies using their real socket directions and stock lengths, including diagonal members; never substitute a voxel shell for a manual-based reconstruction. Do not bend rigid rods or stretch parts to close gaps. Flag unsupported connections or deformation explicitly. shape_to_frame is only an experimental axis-aligned grid-shell converter: curves become steps, even with bracing. Use it only when the user specifically wants that construction. Preview before converting. example_airplane preserves the rejected grid experiment; it is not a reference-quality airplane. Flexible paths and importing a browser's unsaved changes are not supported yet.`;
export function createServer(workspace,{previewUrl,persist=async()=>null}={}){
 const server=new McpServer({name:'knex-studio',version:'0.1.0'},{instructions});
 const tool=(name,description,schema,handler,readOnly=false)=>server.registerTool(name,{description,inputSchema:z.object(schema).strict(),annotations:{readOnlyHint:readOnly,destructiveHint:false,openWorldHint:false}},async args=>{try{const result=await handler(args);return{content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result};}catch(e){return{isError:true,content:[{type:'text',text:JSON.stringify({error:e.message,code:e.code||'BUILD_ERROR',partIds:e.partIds||[],point:e.point||null})}]};}});
 tool('search_parts','Search real catalog shapes, dimensions, colors and reference links. Paginated.',{query:z.string().max(100).default(''),group:z.string().max(30).optional(),...page},a=>workspace.catalog(a),true);
 tool('create_build','Create an isolated draft. Does not replace a browser model.',{name:z.string().min(1).max(100)},a=>workspace.create(a.name));
 tool('inspect_build','Read parts, world-space ports, connections, aliases and revision.',{...build,...page,partRef:ref.optional()},a=>workspace.inspect(a.buildId,a),true);
 tool('connection_targets','List compatible unoccupied host sockets for a NEW part and connection mode.',{...build,type:ref,mode,host:ref.optional(),...page},a=>workspace.targets(a.buildId,a),true);
 tool('edit_build','Atomically place, attach, translate a whole connected assembly, repeat, lock or remove parts. Collision checks run before commit. Aliases can reference earlier operations in the batch.',{...revision,commands:z.array(edit).min(1).max(200)},a=>workspace.edit(a.buildId,a.expectedRevision,a.commands));
 tool('undo_build','Restore the preceding draft edit. Revision still increases.',revision,a=>workspace.undo(a.buildId,a.expectedRevision));
 tool('validate_build','Check collisions and connected components. Does not certify physical strength or flight.',build,a=>workspace.validate(a.buildId),true);
 const shape=z.object({name:z.string().min(1).max(60),kind:z.enum(['box','ellipsoid','taper']),center:vec,size:z.tuple([z.number().positive().max(10000),z.number().positive().max(10000),z.number().positive().max(10000)]),axis:z.number().int().min(0).max(2).optional(),tipScale:z.number().positive().max(1).optional(),reverse:z.boolean().optional()}).strict();
 tool('shape_to_frame','Experimental grid-shell conversion, not a manual-based aircraft builder. Convert rough 3D shapes into a stepped stock-part surface frame. Preview first to inspect quantization, dimensions and part count. Rejects disconnected or too-small features. Creates a new reversible draft when previewOnly=false.',{name:z.string().min(1).max(100).default('Shape-built frame'),shapes:z.array(shape).min(1).max(24),rod:z.enum(['r-green','r-white','r-blue','r-yellow','r-red','r-gray']).default('r-blue'),braced:z.boolean().default(true),previewOnly:z.boolean().default(true)},a=>{const p=shapePlan(a),summary={parts:p.total,cells:p.cells,gridPitchMm:p.pitch,sizeMm:p.size,boundsMm:{min:p.min,max:p.max},warnings:p.warnings};return a.previewOnly?{previewOnly:true,...summary}:{...workspace.adopt(buildShapeFrame(a).model),...summary,previewOnly:false};});
 tool('example_airplane','Load the preserved experimental aircraft-shaped grid shell (1700 parts). This is a stepped voxel-style experiment, not a faithful K’NEX airplane reconstruction. Do not use it to satisfy requests for a realistic or manual-based airplane.',{},()=>buildAirplane(workspace));
 tool('publish_build','Validate and save an immutable .knex snapshot, then offer it in the local editor. Does not overwrite a browser model automatically.',revision,async a=>{const b=workspace.check(a.buildId,a.expectedRevision),report=workspace.validate(a.buildId);if(!report.valid||!report.connected)throw Error('Repair collisions and disconnected assemblies before publishing.');const file=await persist(b);const snapshot=workspace.publish(a.buildId,a.expectedRevision);return{buildId:b.id,revision:b.revision,sequence:snapshot.sequence,previewUrl,file,parts:b.model.parts.length,connections:b.model.links.length,instruction:'Open previewUrl and click Load AI build. Previous work is archived; Undo restores it.'};});
 server.registerPrompt('build_knex',{description:'Build an original K’NEX model from a description.',argsSchema:z.object({description:z.string().min(1).max(4000)})},({description})=>({messages:[{role:'user',content:{type:'text',text:`${instructions}\n\nBuild this: ${description}`}}]}));
 server.registerResource('building-guide','knex://guide',{mimeType:'text/plain',description:'Units, safe workflow and limitations'},()=>({contents:[{uri:'knex://guide',mimeType:'text/plain',text:instructions}]}));
 return server;
}
export async function main(){
 const workspace=new BuildWorkspace(),preview=await startPreview(workspace),directory=path.resolve(process.env.KNEX_BUILDS_DIR||path.join(os.homedir(),'knex-studio-builds'));
 let serial=0;const persist=async b=>{await mkdir(directory,{recursive:true});const file=path.join(directory,`${b.id}-r${b.revision}-${Date.now()}-${++serial}.knex`);const {exportModel}=await import('../dist/engine.js');await writeFile(file,exportModel(b.model),{flag:'wx',mode:0o600});return file;};
 const handle=serveStdio(()=>createServer(workspace,{previewUrl:preview.url,persist}));
 console.error('K’NEX MCP ready. Preview: '+preview.url);
 let closing=false;const close=async()=>{if(closing)return;closing=true;await handle.close();await preview.close();};process.stdin.on('end',close);process.on('SIGINT',()=>close().finally(()=>process.exit(0)));process.on('SIGTERM',()=>close().finally(()=>process.exit(0)));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
