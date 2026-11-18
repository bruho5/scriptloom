import {callWith} from 'mygo-runtime';
window.desktop={call:(method,args=[],options={})=>callWith(method,args,options)};
try {await import('./app.js');} catch { document.body.replaceChildren();const panel=document.createElement('section');panel.style.cssText='padding:40px;font:18px system-ui;line-height:1.7';panel.textContent='Scriptloom 无法载入本地草稿。文件不会被覆盖。请保留 workspace.json 和 workspace.previous.json 以恢复。 / Cannot load local workspace. Existing files have not been overwritten. Keep both workspace files for recovery.';document.body.append(panel);window.scriptloomFlush=async()=>true;}
