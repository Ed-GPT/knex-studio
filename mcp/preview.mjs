import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
export async function startPreview(workspace,{port=0}={}){
 const token=randomBytes(24).toString('hex');let origin;
 const server=http.createServer(async(req,res)=>{
  const reply=(code,data,type='application/json')=>{res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(data);};
  try{
   if(req.headers.host!==new URL(origin).host||req.headers.origin&&req.headers.origin!==origin)return reply(403,'Forbidden','text/plain');
   if(req.method!=='GET'&&req.method!=='HEAD')return reply(405,'Read-only preview','text/plain');
   const url=new URL(req.url,origin);
   if(url.pathname==='/ai-build'){
    if(url.searchParams.get('token')!==token)return reply(403,'Forbidden','text/plain');
    return reply(200,JSON.stringify(workspace.published||{sequence:0}));
   }
   const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
   if(!file.startsWith(root+path.sep))return reply(404,'Not found','text/plain');
   const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf','.png':'image/png'};
   reply(200,await readFile(file),types[path.extname(file)]||'application/octet-stream');
  }catch{reply(404,'Not found','text/plain');}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 origin=`http://127.0.0.1:${server.address().port}`;
 return{url:`${origin}/?aiBridge=${token}`,origin,token,close:()=>new Promise(resolve=>server.close(resolve))};
}
