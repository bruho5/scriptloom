import {test} from 'node:test';
import assert from 'node:assert/strict';
let disk={draft:'old'},fail=false,active=0,max=0;
globalThis.window={desktop:{call:async(method,args)=>{
 if(method==='Desktop.LoadStorage')return {...disk};
 if(method==='Desktop.SaveStorage'){
  active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,3));active--;
  if(fail)throw Error('disk full');disk={...args[0]};return;
 }throw Error('unexpected method');
}}};
const {storage}=await import('../web/storage.js');
test('initial persisted data loaded without overwrite',()=>assert.equal(storage.getItem('draft'),'old'));
test('serial transactions preserve unrelated concurrent settings',async()=>{
 await Promise.all([storage.setItem('draft','new'),storage.setItem('prefs','settings')]);
 assert.deepEqual(disk,{draft:'new',prefs:'settings'});assert.equal(max,1);
});
test('failed write keeps prior cached and durable state',async()=>{
 fail=true;await assert.rejects(storage.setItem('draft','lost'));assert.equal(storage.getItem('draft'),'new');assert.equal(disk.draft,'new');
 fail=false;await storage.setItem('draft','recovered');assert.equal(disk.draft,'recovered');
});
test('backup + replacement committed as one snapshot',async()=>{
 await storage.transact(v=>{v.backup=v.draft;v.draft='imported';});assert.equal(disk.backup,'recovered');assert.equal(disk.draft,'imported');
});
