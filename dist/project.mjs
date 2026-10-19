export function createProject(raw,config,{filename='records.csv',demo=false,exportOptions={prefix:'MAP_TW',format:'png',width:3000}}={}){
 return {application:'TaiwanBioTopoMapsProject',version:1,filename,demo,data:{headers:[...raw.headers],rows:raw.rows.map(row=>[...row])},config,exportOptions};
}
export function readProject(text){
 const p=JSON.parse(text),bad=()=>{throw Error('不是支援的完整專案檔。');};
 if(!p||p.application!=='TaiwanBioTopoMapsProject'||p.version!==1||typeof p.filename!=='string'||typeof p.demo!=='boolean'||!p.config)bad();
 const d=p.data;
 if(!d||!Array.isArray(d.headers)||!d.headers.length||d.headers.some(h=>typeof h!=='string'||!h.trim())||new Set(d.headers).size!==d.headers.length||!Array.isArray(d.rows)||!d.rows.length||d.rows.some(row=>!Array.isArray(row)||row.length!==d.headers.length||row.some(v=>typeof v!=='string')))bad();
 const e=p.exportOptions;
 if(!e||typeof e.prefix!=='string'||e.prefix.length>80||!['png','svg','pdf'].includes(e.format)||![1500,3000,5906].includes(e.width))bad();
 return p;
}
