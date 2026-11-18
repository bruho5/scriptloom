// Desktop storage is loaded before any editor module runs. A failed load stops
// startup instead of silently replacing a user's existing workspace.
export const nativeCall=(method,args=[],options={})=>window.desktop.call(`Desktop.${method}`,args,options);
let cache=await nativeCall('LoadStorage');
if(!cache||typeof cache!=='object'||Array.isArray(cache))throw Error('Invalid desktop storage');
let tail=Promise.resolve();
export const storage={
 getItem(key){return Object.hasOwn(cache,key)?cache[key]:null;},
 transact(change){
  const operation=tail.catch(()=>{}).then(async()=>{
   const next={...cache};change(next);await nativeCall('SaveStorage',[next]);cache=next;
  });tail=operation;return operation;
 },
 setItem(key,value){return this.transact(next=>{next[key]=value;});},
 removeItem(key){return this.transact(next=>{delete next[key];});},
 flush(){return tail;}
};
