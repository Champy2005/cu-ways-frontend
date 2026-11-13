import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const option=process.argv.indexOf('--port'),port=Number(option<0?4175:process.argv[option+1]);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Use --port between 1024 and 65535');
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.woff':'font/woff','.md':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end('Read-only design server');return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+pathname),relative=path.relative(root,file);
  if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);res.end('Outside design folder');return;}
  let target=file;const stat=await fs.stat(target);if(stat.isDirectory())target=path.join(target,'index.html');
  const data=await fs.readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404);res.end('Design file not found');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is in use. Try node serve.mjs --port ${port+1}`:e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`CU Ways design workbench: http://127.0.0.1:${port}/ (Ctrl+C to stop)`));
