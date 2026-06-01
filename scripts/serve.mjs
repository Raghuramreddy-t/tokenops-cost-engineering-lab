import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const port=Number(process.env.PORT||4173), root=process.cwd();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
createServer(async(req,res)=>{
 try{
  const url=decodeURIComponent((req.url||'/').split('?')[0]);
  let file=normalize(join(root,url==='/'?'index.html':url.replace(/^\/+/,'')));
  const info=await stat(file).catch(()=>null); if(info?.isDirectory()) file=join(file,'index.html');
  const body=await readFile(file); res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}); res.end(body);
 }catch{const body=await readFile(join(root,'404.html')); res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}); res.end(body);}
}).listen(port,()=>console.log(`TokenOps available at http://localhost:${port}`));
