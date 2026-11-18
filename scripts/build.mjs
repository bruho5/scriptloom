import {mkdir,copyFile,readdir,readFile,writeFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});
const assets={};const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml'};
for(const name of await readdir('src')){assets['/'+name]={text:await readFile(`src/${name}`,'utf8'),type:types[name.split('.').pop()]||'text/plain'};}
const api=await readFile('server/api.mjs','utf8');
await writeFile('dist/server/index.js',api+'\nconst assets='+JSON.stringify(assets)+';\nexport default {async fetch(request){const path=new URL(request.url).pathname;if(path==="/api/draft")return draft(request);if(request.method!=="GET"&&request.method!=="HEAD")return new Response("Method not allowed",{status:405});const asset=assets[path==="/"?"/index.html":path];return asset?new Response(request.method==="HEAD"?null:asset.text,{headers:{"Content-Type":asset.type,"X-Content-Type-Options":"nosniff","Cache-Control":"no-cache"}}):new Response("Not found",{status:404});}};');
await mkdir('dist/.openai',{recursive:true});
try{await copyFile('.openai/hosting.json','dist/.openai/hosting.json');}catch(error){if(error.code!=='ENOENT')throw error;console.log('No Sites manifest: Worker built for inspection only. Configure your own project before deployment.');}
console.log('Built private worker with same-origin BYOK endpoint.');
