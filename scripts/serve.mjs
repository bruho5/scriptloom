import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('src');
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const qaPath=/^\/(src|tests|docs)\//.test(url.pathname);const serveRoot=qaPath?resolve('.'):root;const path=resolve(serveRoot,'.'+decodeURIComponent(url.pathname));if(path!==serveRoot&&!path.startsWith(serveRoot+sep)){res.writeHead(403).end();return;}const file=(await stat(path)).isDirectory()?resolve(path,'index.html'):path;const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(bytes);}catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}${process.argv.includes('--qa')?'/src/':'/'}`));
