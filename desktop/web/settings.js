import {storage,nativeCall} from './storage.js';
import {createKeyState,describeKeyState} from './key-state.js';
const SETTINGS='shortlife.preferences.v1';
const defaults={groupModifier:'shift',keys:['1','2','3','4','5','6','7','8','9','0'],models:['gpt-4.1-mini'],model:'gpt-4.1-mini',limit:1600};
/** @param {unknown} value */
export function validateSettings(value){
 const p=/** @type {typeof defaults} */(value);
 if(!p)throw Error('Invalid preferences');const groupModifier=p.groupModifier??'shift';if(!['shift','ctrl'].includes(groupModifier))throw Error('Invalid group modifier');
 if(!Array.isArray(p.models)||!p.models.length||p.models.length>30||p.models.some(m=>typeof m!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(m))||new Set(p.models).size!==p.models.length||!p.models.includes(p.model))throw Error('请填写有效、不重复的模型名称，并选择默认模型。');
 if(!Number.isInteger(p.limit)||p.limit<256||p.limit>4000)throw Error('输出上限须为 256–4000。');
 return {groupModifier,keys:[...defaults.keys],models:[...p.models],model:p.model,limit:p.limit};
}
let preferences=structuredClone(defaults);try{const raw=storage.getItem(SETTINGS);if(raw)preferences=validateSettings(JSON.parse(raw));}catch{}
export const getPreferences=()=>structuredClone(preferences);
const keyState=createKeyState(()=>nativeCall('KeyStatus'));
export const getSavedKey=()=>keyState.get().unlocked;
export const getKeyState=()=>keyState.get();
export const refreshKeyState=()=>keyState.refresh();
export function setupSettings(){
 const field=id=>document.getElementById(id),button=field;
 const dialog=field('settings-dialog'),status=field('settings-status');
 const report=async()=>{const state=await refreshKeyState();status.textContent=describeKeyState(state);button('unlock-key').disabled=!state.available||!state.saved||state.unlocked;button('lock-key').disabled=!state.unlocked;};
 button('open-settings').onclick=()=>{const p=getPreferences();field('setting-group-modifier').value=p.groupModifier;field('setting-models').value=p.models.join('\n');field('setting-model').value=p.model;field('setting-limit').value=String(p.limit);void report();dialog.showModal();};
 button('save-settings').onclick=async()=>{button('save-settings').disabled=true;try{const p=validateSettings({groupModifier:field('setting-group-modifier').value,models:field('setting-models').value.split('\n').map(s=>s.trim()).filter(Boolean),model:field('setting-model').value.trim(),limit:Number(field('setting-limit').value)});await storage.setItem(SETTINGS,JSON.stringify(p));preferences=p;window.dispatchEvent(new Event('preferences-changed'));status.textContent='设置已保存到本机 / Saved on this device.';}catch{status.textContent='保存失败：请检查设置内容和本机存储权限。';}finally{button('save-settings').disabled=false;}};
 button('save-key').onclick=async()=>{const key=field('setting-key').value.trim();field('setting-key').value='';if(!/^sk-[A-Za-z0-9_-]{8,500}$/.test(key)){status.textContent='请输入有效 OpenAI key。';return;}button('save-key').disabled=true;try{await nativeCall('SaveKey',[key]);await report();}catch{status.textContent='系统凭据保存失败；没有写入明文文件。请临时输入 Key 使用。';}finally{button('save-key').disabled=false;}};
 for(const [id,method] of [['unlock-key','UnlockKey'],['lock-key','LockKey'],['forget-key','ForgetKey']])button(id).onclick=async()=>{button(id).disabled=true;try{await nativeCall(method);await report();}catch{await refreshKeyState();status.textContent='凭据操作失败；请重试或使用临时 Key。 / Credential operation failed.';}finally{button(id).disabled=false;}};
 dialog.addEventListener('close',()=>{field('setting-key').value='';});
 void report();
}
