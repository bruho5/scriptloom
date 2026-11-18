import {getPreferences,getSavedKey} from './settings.js';
/** @param {()=>string} script @param {()=>string} language */
export function setupAssistant(script,language){
 /** @param {string} id */ const input=id=>/** @type {HTMLInputElement} */(document.getElementById(id));
 /** @param {string} id */ const area=id=>/** @type {HTMLTextAreaElement} */(document.getElementById(id));
 /** @param {string} id */ const button=id=>/** @type {HTMLButtonElement} */(document.getElementById(id));
 const dialog=/** @type {HTMLDialogElement} */(document.getElementById('generate-dialog'));
 const mode=/** @type {HTMLSelectElement} */(document.getElementById('ai-context-mode'));
 let joined='',previousBefore='',previousAfter='';
 const contextCount=()=>{/** @type {HTMLElement} */(document.getElementById('ai-context-count')).textContent=`本次剧本上下文：${area('ai-style').value.length+(mode.value==='split'?area('ai-after').value.length:0)} / 24000 字符；完整剧本：${script().length} 字符。`;};
 for(const id of ['ai-style','ai-after'])area(id).addEventListener('input',contextCount);
 mode.onchange=()=>{if(mode.value==='split'){const text=area('ai-style').value;if(text===joined){area('ai-style').value=previousBefore;area('ai-after').value=previousAfter;}else{const at=area('ai-style').selectionStart;area('ai-style').value=text.slice(0,at);area('ai-after').value=text.slice(at);}}else{previousBefore=area('ai-style').value;previousAfter=area('ai-after').value;joined=previousBefore+previousAfter;area('ai-style').value=joined;area('ai-after').value='';}/** @type {HTMLElement} */(document.getElementById('ai-after-wrap')).hidden=mode.value!=='split';/** @type {HTMLElement} */(document.getElementById('ai-style-label')).textContent=mode.value==='split'?'上文 / Previous context':'发送给 AI 的剧本片段 / Script excerpt';contextCount();};
 const status=/** @type {HTMLElement} */(document.getElementById('ai-status'));
 /** @type {AbortController|null} */ let controller=null;
 let generation=0;
 /** @param {boolean} value */ const busy=value=>{button('ai-send').disabled=value;button('ai-cancel').disabled=!value;};
 const stop=()=>{generation++;controller?.abort();controller=null;busy(false);input('ai-key').value='';};
 const open=()=>{
  const notes=area('scratchpad');const selected=notes.value.slice(notes.selectionStart,notes.selectionEnd);
  if(!selected.trim()){alert(language()==='zh'?'请先在笔记中选中要处理的文字。':'Select some notebook text first.');return;}
  if(selected.length>12000){alert('所选笔记请控制在 12000 字符内 / Select at most 12000 characters.');return;}
  mode.value='single';/** @type {HTMLElement} */(document.getElementById('ai-style-label')).textContent='发送给 AI 的剧本片段 / Script excerpt';area('ai-after').value='';joined='';previousBefore='';previousAfter='';/** @type {HTMLElement} */(document.getElementById('ai-after-wrap')).hidden=true;area('ai-notes').value=selected;area('ai-style').value=script().slice(0,24000);
  /** @type {HTMLElement} */(document.getElementById('ai-truncated')).hidden=script().length<=24000;
  const p=getPreferences();const models=/** @type {HTMLSelectElement} */(document.getElementById('ai-model'));models.replaceChildren(...p.models.map(m=>new Option(m,m)));models.value=p.model;input('ai-limit').value=String(p.limit);contextCount();input('ai-consent').checked=false;status.textContent=getSavedKey()?'将使用已解锁 Key。':'';area('ai-output').value='';dialog.showModal();
 };
 button('generate-notes').onclick=open;button('notebook-generate').onclick=open;
 const clear=()=>{stop();for(const id of ['ai-notes','ai-style','ai-after','ai-direction','ai-output'])area(id).value='';input('ai-consent').checked=false;};
 button('generate-close').onclick=()=>{clear();dialog.close();};
 dialog.addEventListener('cancel',clear);dialog.addEventListener('close',clear);
 window.addEventListener('pagehide',stop);
 button('ai-cancel').onclick=()=>{stop();status.textContent='已停止等待；已发生的 API 费用不会撤销 / Stopped.';};
 button('ai-send').onclick=async()=>{
  if(controller)return;
  if(!input('ai-consent').checked){status.textContent='请先确认发送内容及 API 计费。';return;}
  if(area('ai-style').value.length+area('ai-after').value.length>24000){status.textContent='上下文合计不能超过 24000 字符，请自行删减后发送。';return;}
  const key=input('ai-key').value.trim()||getSavedKey(),model=input('ai-model').value.trim(),limit=Number(input('ai-limit').value);
  if(!key||!area('ai-notes').value.trim()||!model||limit<256||limit>4000||!Number.isInteger(limit)){status.textContent='请填写 Key、笔记、模型及有效输出上限。';return;}
  const current=++generation;controller=new AbortController();busy(true);status.textContent='生成中 / Generating…';
  input('ai-key').value='';
  try{
   const response=await fetch('/api/draft',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${key}`},body:JSON.stringify({notes:area('ai-notes').value,style:area('ai-style').value,after:mode.value==='split'?area('ai-after').value:'',context_mode:mode.value,direction:area('ai-direction').value,model,max_output_tokens:limit}),signal:controller.signal});
   if(!response.ok)throw Error(String(response.status));
   const result=await response.json();if(current!==generation)return;
   if(typeof result.text!=='string'||!result.text.trim())throw Error('empty');
   area('ai-output').value=result.text;status.textContent='已生成预览，正文未改动 / Preview ready; script unchanged.';
  }catch(error){if(current!==generation)return;const code=error instanceof Error?error.message:'';status.textContent=code==='401'?'认证失败：请检查站点登录或 API key。':code==='429'?'额度或速率受限，请检查 API 账户后手动重试。':code==='403'?'访问被拒绝，请检查账户权限。':'生成失败或超时。请检查网络、模型和 API 账户；不会自动重试。';}
  finally{if(current===generation){controller=null;busy(false);}}
 };
 button('ai-copy').onclick=async()=>{try{await navigator.clipboard.writeText(area('ai-output').value);status.textContent='已复制 / Copied';}catch{area('ai-output').select();status.textContent='请手动复制选中的结果 / Copy the selected result manually.';}};
 button('ai-download').onclick=()=>{const url=URL.createObjectURL(new Blob([area('ai-output').value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='scriptloom-ai-preview.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
