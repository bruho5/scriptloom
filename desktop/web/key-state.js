// Metadata only. Secret material never enters this module.
export function createKeyState(read){
 let state={saved:false,unlocked:false,available:false},revision=0;
 return {
  get:()=>({...state}),
  async refresh(){
   const current=++revision;
   try{
    const value=await read();
    if(typeof value?.saved!=='boolean'||typeof value?.unlocked!=='boolean')throw Error('Invalid key state');
    if(current===revision)state={saved:value.saved,unlocked:value.unlocked,available:true};
   }catch{if(current===revision)state={saved:false,unlocked:false,available:false};}
   return {...state};
  }
 };
}
export function describeKeyState(state){
 if(!state.available)return '无法读取系统凭据管理器。请检查系统权限，或临时输入 Key。 / Credential store unavailable; enter a temporary key to continue.';
 if(state.unlocked)return '已启用保存的 Key；临时 Key 留空即可使用。 / Saved key enabled; temporary key may be blank.';
 if(state.saved)return '已保存 Key，但本次启动尚未启用。请点击「启用已保存 Key」。 / Saved key disabled for this session. Enable it below.';
 return '本机未保存 Key。请输入临时 Key，或先在设置中保存。 / No saved key; enter a temporary key or save one in Settings.';
}
export function credentialIssue(key,state){
 if(key)return /^sk-[A-Za-z0-9_-]{8,500}$/.test(key)?'':'临时 Key 格式无效，请检查是否完整粘贴了 OpenAI API key。 / Check the temporary key format.';
 if(!state.available)return describeKeyState(state);
 if(state.unlocked)return '';
 return describeKeyState(state);
}
export function draftFieldIssue({notes,model,limit}){
 if(!notes.trim())return '笔记为空，请填写要整理的笔记。 / Add notes to process.';
 if(notes.length>12000)return '笔记不能超过 12000 字符。 / Notes exceed 12000 characters.';
 if(!model)return '请选择模型。 / Select a model.';
 if(!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(model))return '模型名称无效，请在设置中检查。 / Check the model name in Settings.';
 if(!Number.isInteger(limit)||limit<256||limit>4000)return '最大输出 tokens 须为 256–4000 的整数。 / Output limit must be an integer from 256 to 4000.';
 return '';
}
