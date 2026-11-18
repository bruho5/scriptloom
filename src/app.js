import {getPreferences,setupSettings} from './settings.js';
import {STORAGE_KEY,BACKUP_KEY,KEYS,PALETTE,demo,hamletDemo,makeGroup,replaceRange,reconcile,annotate,shortcutIndex,cycleIndex,History,parseImport,serialize,buildPrompt,blankWorkspace,exportHTML} from './core.js';
import {strings} from './i18n.js';
import {setupAssistant} from './assistant.js';
import {setupNotebook} from './notebook.js';
/** @template {HTMLElement} T @param {string} id @param {{new():T}} type @returns {T} */
function get(id,type){const el=document.getElementById(id);if(!(el instanceof type))throw Error(`Missing ${id}`);return el;}
/** @param {string} id */ const el=id=>get(id,HTMLElement);
/** @param {string} id */ const btn=id=>get(id,HTMLButtonElement);
/** @param {string} id */ const input=id=>get(id,HTMLInputElement);
/** @param {string} id */ const area=id=>get(id,HTMLTextAreaElement);
/** @param {string} id */ const select=id=>get(id,HTMLSelectElement);
/** @param {string} id */ const dialog=id=>get(id,HTMLDialogElement);
const editor=area('editor'),scratch=area('scratchpad'),highlight=el('highlight');
let noteHistory=new History(),noteComposing=false,noteBefore={start:0,end:0};
let state=hamletDemo(),history=new History(),shortcut=false,composing=false,paused=false,corrupt=false,saveFailed=false,leavingAfterExport=false,dirty=false;
/** @type {string|null} */ let lastRaw=null;
let rawRecovery='',saveTimer=0,noticeTimer=0,selection={start:0,end:0},beforeSelection={start:0,end:0};
try {lastRaw=localStorage.getItem(STORAGE_KEY);if(lastRaw)state=parseImport(lastRaw);} catch {if(lastRaw){corrupt=true;paused=true;rawRecovery=lastRaw;}else saveFailed=true;}
/** @param {string} key */ const t=key=>strings[key]?.[state.language==='zh'?0:1]??key;
/** @param {string} message @param {boolean} sticky */
function notify(message,sticky=false){window.clearTimeout(noticeTimer);el('notice').textContent=message;el('notice').hidden=false;if(!sticky)noticeTimer=window.setTimeout(()=>el('notice').hidden=true,4500);}
function status(){el('save-status').textContent=t(paused?'paused':saveFailed?'saveFailed':dirty?'saving':'saved');}
function conflict(){paused=true;el('conflict').hidden=false;status();}
function persist(){window.clearTimeout(saveTimer);if(paused||leavingAfterExport)return;try{const current=localStorage.getItem(STORAGE_KEY);if(current!==lastRaw){conflict();return;}const raw=serialize(state);localStorage.setItem(STORAGE_KEY,raw);lastRaw=raw;saveFailed=false;dirty=false;}catch{saveFailed=true;notify(t('saveFailed'),true);}status();}
function scheduleSave(){dirty=true;status();window.clearTimeout(saveTimer);saveTimer=window.setTimeout(persist,250);}
function group(){return state.groups.find(g=>g.id===state.activeGroupId)??state.groups[0];}
function snapshot(){return {doc:structuredClone(state.script),...selection};}
function rememberSelection(){selection={start:editor.selectionStart,end:editor.selectionEnd};updateFooter();}
function updateFooter(){const count=Array.from(state.script.text).length;el('word-count').textContent=`${count} ${t('characters')} · ${state.script.text.split('\n').length} ${t('lines')}`;const mark=state.script.marks.find(m=>selection.start>=m.start&&selection.start<m.end);el('selection-info').textContent=selection.end>selection.start?`${t('selected')} ${Array.from(state.script.text.slice(selection.start,selection.end)).length}`:mark?`${mark.attribute||t('noAttribute')} · ${mark.color}`:`${t('caret')} ${selection.start}`;btn('undo').disabled=!history.past.length;btn('redo').disabled=!history.future.length;}
function paint(){highlight.replaceChildren();let pos=0;for(const m of state.script.marks){highlight.append(document.createTextNode(state.script.text.slice(pos,m.start)));const span=document.createElement('span');span.className='mark';span.style.setProperty('--token',m.color);span.textContent=state.script.text.slice(m.start,m.end);highlight.append(span);pos=m.end;}highlight.append(document.createTextNode(state.script.text.slice(pos)+'\n'));syncScroll();updateFooter();}
function syncScroll(){highlight.scrollTop=editor.scrollTop;highlight.scrollLeft=editor.scrollLeft;}
/** @param {import('./core.js').Script} doc @param {number} start @param {number} end @param {boolean} focus */
function setDocument(doc,start,end=start,focus=true){state.script=doc;editor.value=doc.text;selection={start,end};if(focus)editor.focus({preventScroll:true});editor.setSelectionRange(start,end);paint();scheduleSave();}
/** @param {string} text @param {import('./core.js').Binding=} binding */
function insert(text,binding){if(composing)return;const {start,end}=selection;if(state.script.text.length-(end-start)+text.length>2_000_000){notify(state.language==='zh'?'剧本已达到容量上限，请先导出并分卷。':'Script capacity reached. Export and split into another file.');return;}history.push(snapshot());const doc=replaceRange(state.script,start,end,text,binding);setDocument(doc,start+text.length);}
/** @param {boolean} redo */
function travel(redo){if(composing)return;const next=redo?history.redo(snapshot()):history.undo(snapshot());if(next)setDocument(next.doc,next.start,next.end);}
function onInput(){if(composing)return;if(editor.value===state.script.text)return;history.push({doc:structuredClone(state.script),...beforeSelection});state.script=reconcile(state.script,editor.value);rememberSelection();paint();scheduleSave();}
editor.addEventListener('beforeinput',()=>{if(!composing){rememberSelection();beforeSelection={...selection};}});
editor.addEventListener('input',onInput);
editor.addEventListener('compositionstart',()=>{rememberSelection();beforeSelection={...selection};composing=true;el('editor-wrap').classList.add('composing');});
editor.addEventListener('compositionend',()=>{composing=false;el('editor-wrap').classList.remove('composing');onInput();});
editor.addEventListener('scroll',syncScroll);
editor.addEventListener('select',rememberSelection);
editor.addEventListener('keyup',()=>{if(!composing)rememberSelection();});
editor.addEventListener('click',rememberSelection);
editor.addEventListener('blur',()=>{if(!composing)rememberSelection();});
document.addEventListener('selectionchange',()=>{if(document.activeElement===editor&&!composing)rememberSelection();});
editor.addEventListener('keydown',event=>{
  if(composing||event.isComposing||event.keyCode===229)return;
  if((event.ctrlKey||event.metaKey)&&!event.altKey){const key=event.key.toLowerCase();if(key==='z'||key==='y'){event.preventDefault();travel(key==='y'||event.shiftKey);return;}}
  shortcut=event.getModifierState('CapsLock');renderMode();
  const index=configuredIndex(event,shortcut,document.activeElement===editor,composing);
  if(index>=0){const binding=group().bindings[index];if(binding.text){event.preventDefault();rememberSelection();insert(binding.text,binding);}}
});
/** @param {KeyboardEvent} event @param {boolean} enabled @param {boolean} focused @param {boolean} composing */
function configuredIndex(event,enabled,focused,composing){return shortcutIndex(event,enabled,focused,composing);}
btn('undo').onclick=()=>travel(false);btn('redo').onclick=()=>travel(true);
function renderMode(){btn('shortcut').setAttribute('aria-pressed',String(shortcut));el('shortcut-label').textContent=t(shortcut?'modeOn':'modeOff');el('shortcut-help').textContent=t(shortcut?'helpOn':'helpOff').replace('Shift＋滚轮',getPreferences().groupModifier==='ctrl'?'Ctrl＋滚轮':'Shift＋滚轮');}
document.addEventListener('keydown',event=>{shortcut=event.getModifierState('CapsLock');renderMode();});
document.addEventListener('keyup',event=>{shortcut=event.getModifierState('CapsLock');renderMode();});
btn('shortcut').onclick=()=>notify(t('capsHelp')); 
function renderGroups(){const tip=document.querySelector('.binding-tip .keycap');if(tip)tip.textContent=getPreferences().groupModifier==='ctrl'?'Ctrl':'Shift';
  select('group-select').replaceChildren(...state.groups.map(g=>new Option(g.name,g.id)));select('group-select').value=group().id;
  el('group-position').textContent=`${String(state.groups.findIndex(g=>g.id===group().id)+1).padStart(2,'0')} / ${String(state.groups.length).padStart(2,'0')}`;
  el('binding-list').replaceChildren(...group().bindings.map((binding,index)=>{const b=document.createElement('button');b.className='binding'+(!binding.text?' empty':'');b.style.setProperty('--token',binding.color);b.setAttribute('aria-label',`${getPreferences().keys[index]} · ${binding.text||t('empty')} · ${binding.attribute||t('noAttribute')}`);const k=document.createElement('span');k.className='keycap';k.textContent=getPreferences().keys[index];const dot=document.createElement('span');dot.className='binding-dot';const word=document.createElement('span');word.className='binding-word';word.textContent=binding.text||t('empty');const attr=document.createElement('span');attr.className='attribute';attr.textContent=binding.attribute||'—';b.append(k,dot,word,attr);b.title=`${binding.text} · ${binding.attribute||t('noAttribute')} · ${binding.color}`;b.onpointerdown=e=>{if(e.pointerType==='mouse')e.preventDefault();};b.onclick=()=>binding.text?insert(binding.text,binding):openManager(index);return b;}));
}
/** @param {number} direction */
function cycle(direction){const index=state.groups.findIndex(g=>g.id===group().id);state.activeGroupId=state.groups[cycleIndex(index,direction,state.groups.length)].id;renderGroups();scheduleSave();}
btn('prev-group').onclick=()=>cycle(-1);btn('next-group').onclick=()=>cycle(1);
select('group-select').onchange=()=>{state.activeGroupId=select('group-select').value;renderGroups();scheduleSave();};
let lastWheel=0;
document.addEventListener('wheel',event=>{const modifier=getPreferences().groupModifier;const active=modifier==='ctrl'?event.ctrlKey&&!event.shiftKey:event.shiftKey&&!event.ctrlKey;if(!active||event.metaKey||event.altKey||composing||noteComposing||document.querySelector('dialog[open]'))return;const target=event.target;if(!(target instanceof Element)||(!target.closest('.binding-panel')&&!target.closest('.script-panel')&&!target.closest('#notebook')))return;if(target.matches('input,select,textarea')&&target!==editor&&target!==scratch)return;const delta=event.deltaY||event.deltaX;if(!delta)return;event.preventDefault();if(Date.now()-lastWheel<220)return;lastWheel=Date.now();cycle(delta>0?1:-1);},{passive:false});
/** @param {number=} focusIndex */
function openManager(focusIndex){const g=group();input('group-name').value=g.name;el('binding-fields').replaceChildren(...g.bindings.map((b,i)=>{const row=document.createElement('div');row.className='binding-field-row';const key=document.createElement('span');key.className='keycap';key.textContent=KEYS[i];const word=document.createElement('input');word.id=`binding-word-${i}`;word.value=b.text;word.maxLength=10000;word.setAttribute('aria-label',`${KEYS[i]} ${t('word')}`);const attr=document.createElement('input');attr.id=`binding-attr-${i}`;attr.value=b.attribute;attr.maxLength=100;attr.setAttribute('aria-label',`${KEYS[i]} ${t('attribute')}`);const color=document.createElement('input');color.id=`binding-color-${i}`;color.type='color';color.value=b.color;color.setAttribute('aria-label',`${KEYS[i]} ${t('color')}`);row.append(key,word,attr,color);return row;}));btn('delete-group').disabled=state.groups.length<2;dialog('manage-dialog').showModal();if(focusIndex!==undefined)input(`binding-word-${focusIndex}`).focus();}
function readManager(){const name=input('group-name').value.trim();if(!name){input('group-name').setCustomValidity(t('invalidName'));input('group-name').reportValidity();return null;}input('group-name').setCustomValidity('');return {...group(),name,bindings:KEYS.map((_,i)=>({text:input(`binding-word-${i}`).value,attribute:input(`binding-attr-${i}`).value,color:input(`binding-color-${i}`).value}))};}
input('group-name').oninput=()=>input('group-name').setCustomValidity('');
btn('manage').onclick=()=>openManager();
btn('add-group').onclick=()=>{const g=makeGroup(`${t('newGroup')} ${state.groups.length+1}`);state.groups.push(g);state.activeGroupId=g.id;renderGroups();persist();openManager();};
get('binding-form',HTMLFormElement).onsubmit=event=>{event.preventDefault();const g=readManager();if(!g)return;state.groups[state.groups.findIndex(x=>x.id===g.id)]=g;renderGroups();persist();dialog('manage-dialog').close();};
btn('duplicate-group').onclick=()=>{const g=readManager();if(!g)return;const copy=makeGroup(`${g.name.slice(0,85)} (${t('copy')})`);copy.bindings=g.bindings;state.groups.push(copy);state.activeGroupId=copy.id;dialog('manage-dialog').close();renderGroups();persist();openManager();};
btn('delete-group').onclick=()=>{if(state.groups.length<=1){notify(t('lastGroup'));return;}if(!confirm(t('deleteConfirm')))return;state.groups=state.groups.filter(g=>g.id!==group().id);state.activeGroupId=state.groups[0].id;dialog('manage-dialog').close();renderGroups();persist();};
btn('tag-selection').onclick=()=>{if(selection.start===selection.end){notify(t('selectFirst'));return;}el('selected-preview').textContent=state.script.text.slice(selection.start,selection.end);const mark=state.script.marks.find(m=>m.start<=selection.start&&m.end>=selection.end);input('tag-attribute').value=mark?.attribute??'';input('tag-color').value=mark?.color??PALETTE[0];el('attribute-list').replaceChildren(...[...new Set(state.groups.flatMap(g=>g.bindings.map(b=>b.attribute)).filter(Boolean))].map(value=>new Option(value)));dialog('tag-dialog').showModal();};
/** @param {boolean} clear */
function applyTag(clear){history.push(snapshot());const style=clear?null:{text:'',attribute:input('tag-attribute').value,color:input('tag-color').value};const doc=annotate(state.script,selection.start,selection.end,style);dialog('tag-dialog').close();setDocument(doc,selection.start,selection.end);}
get('tag-form',HTMLFormElement).onsubmit=event=>{event.preventDefault();applyTag(false);};btn('clear-tag').onclick=()=>applyTag(true);
input('title').oninput=()=>{state.title=input('title').value;scheduleSave();};
function noteSnapshot(){return {doc:{text:state.scratchpad,marks:[]},start:scratch.selectionStart,end:scratch.selectionEnd};}
function noteInput(){if(noteComposing||scratch.value===state.scratchpad)return;noteHistory.push({doc:{text:state.scratchpad,marks:[]},...noteBefore});state.scratchpad=scratch.value;scheduleSave();}
scratch.addEventListener('beforeinput',()=>{if(!noteComposing)noteBefore={start:scratch.selectionStart,end:scratch.selectionEnd};});
scratch.addEventListener('input',noteInput);
scratch.addEventListener('compositionstart',()=>{noteBefore={start:scratch.selectionStart,end:scratch.selectionEnd};noteComposing=true;});
scratch.addEventListener('compositionend',()=>{noteComposing=false;noteInput();});
scratch.addEventListener('keydown',event=>{
 if(noteComposing||event.isComposing||event.keyCode===229)return;
 if((event.ctrlKey||event.metaKey)&&!event.altKey&&['z','y'].includes(event.key.toLowerCase())){
  event.preventDefault();const next=(event.key.toLowerCase()==='y'||event.shiftKey)?noteHistory.redo(noteSnapshot()):noteHistory.undo(noteSnapshot());
  if(next){scratch.value=state.scratchpad=next.doc.text;scratch.setSelectionRange(next.start,next.end);scheduleSave();}return;
 }
 const index=configuredIndex(event,event.getModifierState('CapsLock'),document.activeElement===scratch,noteComposing);
 if(index<0)return;const text=group().bindings[index].text;if(!text)return;
 const start=scratch.selectionStart,end=scratch.selectionEnd;if(scratch.value.length-(end-start)+text.length>2_000_000)return;
 event.preventDefault();noteHistory.push(noteSnapshot());scratch.setRangeText(text,start,end,'end');state.scratchpad=scratch.value;scheduleSave();
});
btn('insert-note').onclick=()=>{const text=scratch.value.slice(scratch.selectionStart,scratch.selectionEnd);if(!text){notify(t('selectNote'));return;}insert(text);};
function localize(){document.documentElement.lang=state.language==='zh'?'zh-CN':'en';document.title=`Scriptloom · ${state.language==='zh'?'剧本工作台':'Script Desk'}`;document.querySelectorAll('[data-i18n]').forEach(node=>{const key=node.getAttribute('data-i18n');if(key)node.textContent=t(key);});for(const [attr,target] of [['data-i18n-title','title'],['data-i18n-aria','aria-label'],['data-i18n-placeholder','placeholder']])document.querySelectorAll(`[${attr}]`).forEach(node=>{const key=node.getAttribute(attr);if(key){node.setAttribute(target,t(key));if(attr==='data-i18n-title')node.setAttribute('aria-label',t(key));}});document.querySelectorAll('.close').forEach(x=>x.setAttribute('aria-label',t('close')));btn('language').textContent=state.language==='zh'?'EN':'中文';btn('language').setAttribute('aria-label',state.language==='zh'?'Switch to English':'切换为中文');status();renderMode();renderGroups();paint();}
function renderAll(){noteHistory=new History();noteComposing=false;input('title').value=state.title;editor.value=state.script.text;scratch.value=state.scratchpad;selection={start:0,end:0};localize();}
btn('language').onclick=()=>{state.language=state.language==='zh'?'en':'zh';localize();persist();};
for(const close of document.querySelectorAll('.close'))close.addEventListener('click',()=>close.closest('dialog')?.close());
/** @param {string} text @param {string} name @param {string} type */
function download(text,name,type='text/plain;charset=utf-8'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function filename(){return (state.title||t('untitled')).replace(/[\\/:*?"<>|]/g,'-').slice(0,80);}
function exportJSON(){download(serialize(state),`${filename()}-workspace.json`,'application/json');}
btn('export-html').onclick=()=>download(exportHTML(state),`${filename()}-reading.html`,'text/html;charset=utf-8');
btn('export-json').onclick=exportJSON;btn('export-script').onclick=()=>download(state.script.text,`${filename()}-script.txt`);btn('export-notes').onclick=()=>download(state.scratchpad,`${filename()}-notes.txt`);
btn('open-files').onclick=()=>{persist();++importSequence;pendingImport=null;input('import-file').value='';el('import-preview').hidden=true;el('import-error').textContent='';dialog('files-dialog').showModal();};
/** @type {{kind:'json',state:import('./core.js').Workspace}|{kind:'text',text:string}|null} */ let pendingImport=null;
let importSequence=0;
input('import-file').onchange=async()=>{const sequence=++importSequence;pendingImport=null;el('import-preview').hidden=true;el('import-error').textContent='';const file=input('import-file').files?.[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error('Size');const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());if(sequence!==importSequence)return;if(file.name.toLowerCase().endsWith('.json')){const next=parseImport(text);pendingImport={kind:'json',state:next};el('import-description').textContent=`${t('importReady')}: ${next.title} · ${next.groups.length} ${t('group')} · ${Array.from(next.script.text).length} ${t('characters')}`;el('text-target-label').hidden=true;}else if(file.name.toLowerCase().endsWith('.txt')&&text.length<=2_000_000){pendingImport={kind:'text',text};el('import-description').textContent=t('txtReady')+Array.from(text).length;el('text-target-label').hidden=false;}else throw Error('Format');el('import-preview').hidden=false;}catch{if(sequence===importSequence)el('import-error').textContent=t('importBad');}};
/** Commit both pieces of a replacement only after validation. Failed main write leaves the old main untouched. @param {import('./core.js').Workspace} next @param {string} backup */
function commitImport(next,backup){const raw=serialize(next);let priorBackup=null,backupWritten=false;try{if(localStorage.getItem(STORAGE_KEY)!==lastRaw){conflict();throw Error('Conflict');}priorBackup=localStorage.getItem(BACKUP_KEY);if(corrupt)localStorage.setItem(STORAGE_KEY+'.recovery',rawRecovery);localStorage.setItem(BACKUP_KEY,backup);backupWritten=true;localStorage.setItem(STORAGE_KEY,raw);lastRaw=raw;}catch{if(backupWritten){try{if(priorBackup===null)localStorage.removeItem(BACKUP_KEY);else localStorage.setItem(BACKUP_KEY,priorBackup);}catch{/* Current main workspace remains intact even if storage cannot roll back its backup. */}}notify(t(paused&&!corrupt?'importBusy':'backupFail'),true);return false;}state=next;paused=false;corrupt=false;saveFailed=false;dirty=false;history=new History();shortcut=false;window.clearTimeout(saveTimer);el('conflict').hidden=true;renderAll();return true;}
btn('confirm-import').onclick=()=>{if(!pendingImport)return;let next;if(pendingImport.kind==='json')next=pendingImport.state;else{next=structuredClone(state);if(select('text-target').value==='scratchpad')next.scratchpad+=(next.scratchpad?'\n\n':'')+pendingImport.text;else next.script=replaceRange(next.script,next.script.text.length,next.script.text.length,(next.script.text?'\n\n':'')+pendingImport.text);}try{if(!commitImport(next,serialize(state)))return;}catch{notify(t('importBad'));return;}pendingImport=null;el('import-preview').hidden=true;input('import-file').value='';dialog('files-dialog').close();notify(t('importDone'));};
btn('load-hamlet').onclick=()=>{if(paused||corrupt){notify(t('newBlocked'),true);return;}if(!confirm(t('hamletConfirm')))return;if(commitImport(hamletDemo(state.language),serialize(state))){dialog('files-dialog').close();editor.focus();notify(t('hamletDone'));}};
btn('new-draft').onclick=()=>{if(paused||corrupt){notify(t('newBlocked'),true);return;}if(!confirm(t('newConfirm')))return;if(commitImport(blankWorkspace(state),serialize(state))){dialog('files-dialog').close();editor.focus();notify(t('newDone'));}};

btn('restore-backup').onclick=()=>{try{const raw=localStorage.getItem(BACKUP_KEY);if(!raw){notify(t('noBackup'));return;}const next=parseImport(raw);if(!confirm(t('restoreConfirm')))return;if(commitImport(next,serialize(state))){dialog('files-dialog').close();notify(t('restored'));}}catch{notify(t('noBackup'));}};
btn('resolve-conflict').onclick=()=>{exportJSON();leavingAfterExport=true;window.location.reload();};
window.addEventListener('storage',event=>{if((event.key===STORAGE_KEY||event.key===null)&&event.newValue!==lastRaw)conflict();});
window.addEventListener('pagehide',persist);
window.addEventListener('beforeunload',event=>{if(leavingAfterExport)return;persist();if(paused||saveFailed){event.preventDefault();event.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persist();});
btn('open-ai').onclick=()=>{area('prompt-preview').value=buildPrompt(state,area('direction').value);dialog('ai-dialog').showModal();};
area('direction').oninput=()=>{area('prompt-preview').value=buildPrompt(state,area('direction').value);};
btn('copy-prompt').onclick=async()=>{try{await navigator.clipboard.writeText(area('prompt-preview').value);notify(t('copied'));}catch{area('prompt-preview').focus();area('prompt-preview').select();notify(t('copyFallback'),true);}};
btn('export-prompt').onclick=()=>download(area('prompt-preview').value,`${filename()}-prompt.txt`);
renderAll();if(corrupt){notify(t('corrupt'),true);const b=document.createElement('button');b.className='outline';b.textContent=t('recovery');b.onclick=()=>download(rawRecovery,'scriptloom-recovery.json','application/json');dialog('files-dialog').append(b);}else if(!lastRaw)persist();

setupAssistant(()=>state.script.text,()=>state.language);
setupNotebook();setupSettings();window.addEventListener('preferences-changed',()=>{renderGroups();renderMode();});
