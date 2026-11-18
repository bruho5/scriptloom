const SETTINGS='shortlife.preferences.v1',VAULT='shortlife.key-vault.v1';
const defaults={groupModifier:'shift',keys:['1','2','3','4','5','6','7','8','9','0'],models:['gpt-4.1-mini'],model:'gpt-4.1-mini',limit:1600};
/** @param {unknown} value */
export function validateSettings(value){
 const p=/** @type {typeof defaults} */(value);
 if(!p)throw Error('Invalid preferences');const groupModifier=p.groupModifier??'shift';if(!['shift','ctrl'].includes(groupModifier))throw Error('Invalid group modifier');
 if(!Array.isArray(p.models)||!p.models.length||p.models.length>30||p.models.some(m=>typeof m!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(m))||new Set(p.models).size!==p.models.length||!p.models.includes(p.model))throw Error('请填写有效、不重复的模型名称，并选择默认模型。');
 if(!Number.isInteger(p.limit)||p.limit<256||p.limit>4000)throw Error('输出上限须为 256–4000。');
 return {groupModifier,keys:[...defaults.keys],models:[...p.models],model:p.model,limit:p.limit};
}
let preferences=structuredClone(defaults);try{const raw=localStorage.getItem(SETTINGS);if(raw)preferences=validateSettings(JSON.parse(raw));}catch{}
export const getPreferences=()=>structuredClone(preferences);
let unlocked='';export const getSavedKey=()=>unlocked;
/** @param {Uint8Array} bytes */const b64=bytes=>btoa(String.fromCharCode(...bytes));
/** @param {string} text */const unb64=text=>Uint8Array.from(atob(text),c=>c.charCodeAt(0));
/** @param {string} password @param {Uint8Array<ArrayBuffer>} salt */
async function derive(password,salt){const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
/** @param {string} key @param {string} password */
export async function seal(key,password){if(password.length<12)throw Error('口令至少 12 个字符 / Use 12+ characters.');const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},await derive(password,salt),new TextEncoder().encode(key));return {version:1,salt:b64(salt),iv:b64(iv),data:b64(new Uint8Array(encrypted))};}
/** @param {{version:number,salt:string,iv:string,data:string}} vault @param {string} password */
export async function unseal(vault,password){if(vault.version!==1)throw Error('Unknown vault');const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(vault.iv)},await derive(password,unb64(vault.salt)),unb64(vault.data));return new TextDecoder().decode(bytes);}
export function setupSettings(){
 /** @param {string} id */const field=id=>/** @type {HTMLInputElement} */(document.getElementById(id));
 /** @param {string} id */const button=id=>/** @type {HTMLButtonElement} */(document.getElementById(id));
 const dialog=/** @type {HTMLDialogElement} */(document.getElementById('settings-dialog')),status=/** @type {HTMLElement} */(document.getElementById('settings-status'));
 const report=()=>{status.textContent=unlocked?'Key 已解锁，仅本标签页内存可用。':localStorage.getItem(VAULT)?'已加密保存在此浏览器；需口令解锁。':'未保存 Key。';};
 button('open-settings').onclick=()=>{const p=getPreferences();field('setting-group-modifier').value=p.groupModifier;field('setting-models').value=p.models.join('\n');field('setting-model').value=p.model;field('setting-limit').value=String(p.limit);try{report();}catch{status.textContent='浏览器存储不可用。';}dialog.showModal();};
 button('save-settings').onclick=()=>{try{const p=validateSettings({groupModifier:field('setting-group-modifier').value,models:field('setting-models').value.split('\n').map(s=>s.trim()).filter(Boolean),model:field('setting-model').value.trim(),limit:Number(field('setting-limit').value)});localStorage.setItem(SETTINGS,JSON.stringify(p));preferences=p;window.dispatchEvent(new Event('preferences-changed'));status.textContent='设置已保存在此浏览器 / Saved.';}catch(e){status.textContent=e instanceof Error?e.message:'保存失败';}};
 button('save-key').onclick=async()=>{const key=field('setting-key').value.trim(),password=field('vault-password').value;if(!/^sk-[A-Za-z0-9_-]{8,500}$/.test(key)){status.textContent='请输入有效 OpenAI key。';return;}try{const vault=await seal(key,password);localStorage.setItem(VAULT,JSON.stringify(vault));unlocked=key;status.textContent='Key 已加密保存并解锁；刷新后需要口令。';}catch{status.textContent='保存失败：确认口令至少 12 字符且浏览器存储可用。';}finally{field('setting-key').value='';field('vault-password').value='';}};
 button('unlock-key').onclick=async()=>{try{const raw=localStorage.getItem(VAULT);if(!raw)throw Error();unlocked=await unseal(JSON.parse(raw),field('vault-password').value);status.textContent='已解锁，仅本标签页内存可用。';}catch{status.textContent='无法解锁：口令错误或没有有效的已保存 Key。';}finally{field('vault-password').value='';}};
 button('lock-key').onclick=()=>{unlocked='';report();};
 button('forget-key').onclick=()=>{try{localStorage.removeItem(VAULT);unlocked='';report();}catch{status.textContent='无法移除，请检查浏览器存储权限。';}};
 dialog.addEventListener('close',()=>{field('setting-key').value='';field('vault-password').value='';});window.addEventListener('pagehide',()=>{unlocked='';});
}
