import assert from 'node:assert/strict';
import {openApp} from './support/app-fixture.mjs';

const app=await openApp(),{get,flush,loadCSV,loadConfig,savedConfig}=app;
const csv='longitude,latitude,species\n120.8,23.5,TES\n121.2,24.1,TWS\n121,23.8,Unknown';
let failures=0;
async function check(name,fn){try{await fn();console.log('PASS:',name);}catch(e){failures++;console.error('FAIL:',name,'—',e.message);}}

await check('CSV import, group filters, stable colors, table, language, page dimensions and map controls',async()=>{
 await loadCSV('records.csv',csv);assert.equal(get('recordStat').textContent,'3');assert.equal(get('groupStat').textContent,'3/3');assert.equal(get('fileLabel').textContent,'records.csv');
 const row=get('groupList').children.find(row=>row.children[2].textContent==='Unknown'),color=row.children[1].value;
 row.children[0].checked=false;await row.children[0].emit('change');assert.equal(get('groupStat').textContent,'2/3');
 await get('languageBtn').emit('click');assert.equal(get('groupStat').textContent,'2/3');assert.equal(get('fileLabel').textContent,'records.csv');
 await get('tableTab').emit('click');assert.equal(get('mapView').hidden,true);assert.equal(get('tableBody').children.length,2);
 await get('allGroups').emit('click');assert.equal(get('groupList').children.find(row=>row.children[2].textContent==='Unknown').children[1].value,color);
 get('aspectPreset').value='3:4';await get('aspectPreset').emit('change');assert.equal(get('pageWidth').value,18);assert.equal(get('pageHeight').value,24);
 await get('swapPage').emit('click');assert.equal(get('pageWidth').value,24);assert.equal(get('pageHeight').value,18);
 const before=(await savedConfig()).camera;await get('zoomIn').emit('click');assert.ok((await savedConfig()).camera.zoom>before.zoom);await get('resetBtn').emit('click');
 const map=get('map'),camera=(await savedConfig()).camera;await map.emit('keydown',{key:'ArrowRight'});assert.ok((await savedConfig()).camera.x>camera.x);
 await map.emit('pointerdown',{clientX:200,clientY:200,pointerId:1});const dragStart=(await savedConfig()).camera;await map.emit('pointermove',{clientX:300,clientY:200,pointerId:1});assert.ok((await savedConfig()).camera.x<dragStart.x);await map.emit('pointerup');await get('resetBtn').emit('click');
 await get('infoBtn').emit('click');assert.equal(get('infoDialog').open,true);await get('closeInfo').emit('click');assert.equal(get('infoDialog').open,false);
 await get('mapTab').emit('click');assert.equal(get('mapView').hidden,false);
});

await check('Legend toggles preserve the camera without cumulative zoom drift',async()=>{
 const before=(await savedConfig()).camera;
 for(let i=0;i<4;i++){get('legend').checked=false;await get('legend').emit('change');get('legend').checked=true;await get('legend').emit('change');}
 assert.deepEqual((await savedConfig()).camera,before);
});

await check('Legend title selection persists, rejects invalid values atomically and supports older settings',async()=>{
 assert.equal((await savedConfig()).settings.legendTitle,'species');
 const before=(await savedConfig()).camera;
 get('legendTitle').value='groups';await get('legendTitle').emit('change');
 const config=await savedConfig();assert.equal(config.settings.legendTitle,'groups');assert.deepEqual(config.camera,before);
 await loadConfig(config);assert.equal(get('legendTitle').value,'groups');
 const bad=structuredClone(config);bad.settings.legendTitle='invalid';await loadConfig(bad);assert.deepEqual(await savedConfig(),config);
 delete config.settings.legendTitle;await loadConfig(config);assert.equal((await savedConfig()).settings.legendTitle,'species');assert.equal(get('legendTitle').value,'species');
});

await check('An invalid settings file leaves settings, filters, columns and camera unchanged',async()=>{
 const before=await savedConfig(),bad=structuredClone(before);bad.settings.radius=17;bad.referenceBounds=[122,25,119,21];bad.columns={lon:'longitude',lat:'latitude',group:''};
 await loadConfig(bad);assert.deepEqual(await savedConfig(),before);assert.match(get('toast').textContent,/失敗|Could not load/);
});

await check('Settings reject identical longitude/latitude columns before applying changes',async()=>{
 await loadCSV('records.csv',csv);const before=await savedConfig(),bad=structuredClone(before);bad.columns.lat=bad.columns.lon;
 await loadConfig(bad);assert.deepEqual(await savedConfig(),before);assert.equal(get('recordStat').textContent,'3');
});

await check('Valid settings round-trip, older settings retain page defaults, and incompatible columns are rejected',async()=>{
 await loadCSV('records.csv',csv);const cfg=await savedConfig();cfg.settings.radius=11;cfg.settings.pageWidth=18;cfg.settings.pageHeight=24;cfg.colors.TES='#123456';cfg.selected=['TES','TWS'];cfg.referenceBounds=[118.1,24.35,118.52,24.57];
 await loadConfig(cfg);assert.deepEqual(await savedConfig(),cfg);assert.equal(get('groupStat').textContent,'2/3');assert.equal(get('region').value,'kinmen');
 const bad=structuredClone(cfg);bad.columns.lon='missing';await loadConfig(bad);assert.deepEqual(await savedConfig(),cfg);
 for(const mutate of [c=>c.settings.radius='large',c=>c.selected='TES',c=>c.camera.zoom=99,c=>c.settings.pieMode='other']){const invalid=structuredClone(cfg);mutate(invalid);await loadConfig(invalid);assert.deepEqual(await savedConfig(),cfg);}
 const legacy=structuredClone(cfg);for(const key of ['pageWidth','pageHeight','legendPosition','legendColumns','legendFont','legendSymbol','legendX','legendY','siteNumbers','siteLabelSize','terrainQuality'])delete legacy.settings[key];await loadConfig(legacy);assert.equal(get('pageWidth').value,25);assert.equal(get('pageHeight').value,20);assert.equal(get('legendPosition').value,'right');assert.equal(get('siteNumbers').checked,false);assert.equal(get('terrainQuality').value,'auto');
});

await check('Excluded-row download reports errors, empty selection blocks export, and failed imports preserve data',async()=>{
 await loadCSV('invalid.csv','longitude,latitude,species\n120,23,TES\n,24,TWS\n121,91,TWS');assert.equal(get('recordStat').textContent,'1');assert.equal(get('invalidBtn').hidden,false);
 await get('invalidBtn').emit('click');const excluded=await app.downloads.at(-1).blob.text();assert.ok(excluded.includes('Missing coordinates'));assert.ok(excluded.includes('Outside coordinate'));
 const before=await savedConfig();await loadCSV('bad.csv','lon,lat\n"unclosed');assert.deepEqual(await savedConfig(),before);assert.equal(get('fileLabel').textContent,'invalid.csv');
 const checkbox=get('groupList').children[0].children[0];checkbox.checked=false;await checkbox.emit('change');const count=app.downloads.length;await get('exportBtn').emit('click');assert.equal(app.downloads.length,count);assert.match(get('toast').textContent,/Select at least|至少選擇/);
});

await check('Changing encoding retries the most recently selected file after a decode failure',async()=>{
 await get('demoBtn').emit('click');get('encoding').value='utf-8';
 // Big5 for 台灣, followed by an otherwise ASCII CSV.
 const prefix=new TextEncoder().encode('longitude,latitude,species\n121,23,'),data=new Uint8Array([...prefix,0xa5,0x78,0xc6,0x57]);
 get('csvFile').files=[{name:'big5.csv',arrayBuffer:async()=>data.buffer}];await get('csvFile').emit('change');await flush();
 get('encoding').value='big5';await get('encoding').emit('change');await flush();assert.equal(get('fileLabel').textContent,'big5.csv');assert.equal(get('recordStat').textContent,'1');
});

await check('A slower previous CSV cannot replace the latest import or a newly loaded demo',async()=>{
 get('encoding').value='utf-8';let finish;
 const wait=new Promise(resolve=>finish=resolve);get('csvFile').files=[{name:'old.csv',arrayBuffer:()=>wait}];await get('csvFile').emit('change');
 await loadCSV('new.csv',csv);finish(new TextEncoder().encode('longitude,latitude,species\n120,22,Old').buffer);await flush();assert.equal(get('fileLabel').textContent,'new.csv');
 let finishDemo;const waitDemo=new Promise(resolve=>finishDemo=resolve);get('csvFile').files=[{name:'pending.csv',arrayBuffer:()=>waitDemo}];await get('csvFile').emit('change');
 await get('demoBtn').emit('click');finishDemo(new TextEncoder().encode(csv).buffer);await flush();assert.match(get('fileLabel').textContent,/示範|Demo/);
});

await check('Batch settings remain tied to the exported dataset while the user imports another CSV',async()=>{
 await loadCSV('records.csv',csv);get('format').value='svg';const before=await savedConfig(),count=app.downloads.length;
 const exporting=get('batchBtn').emit('click');
 await loadCSV('other.csv','lon,lat,taxon\n120,23,Other');
 await flush();await exporting;await flush();
 const download=app.downloads.slice(count).find(d=>d.name.endsWith('.zip'));assert.ok(download,'Batch ZIP was created');
 const bytes=new Uint8Array(await download.blob.arrayBuffer()),view=new DataView(bytes.buffer),decoder=new TextDecoder(),files=new Map();let offset=0;
 while(view.getUint32(offset,true)===0x04034b50){const size=view.getUint32(offset+18,true),n=view.getUint16(offset+26,true),extra=view.getUint16(offset+28,true),name=decoder.decode(bytes.subarray(offset+30,offset+30+n)),start=offset+30+n+extra;files.set(name,decoder.decode(bytes.subarray(start,start+size)));offset=start+size;}
 const settings=JSON.parse([...files].find(([name])=>name.endsWith('/settings.json'))[1]);assert.deepEqual(settings,before);
 const notes=[...files].find(([name])=>name.endsWith('/SOURCES.txt'))[1];assert.ok(notes.includes('\nDemonstration data:'));assert.ok(!notes.includes('\\n'));
});

await check('Complete projects restore original records, layout, filters, site IDs, export choices and filenames',async()=>{
 await loadCSV('original.csv',csv+'\n,24,TES');get('prefix').value='project_map';get('format').value='svg';get('exportWidth').value='1500';
 const cfg=await savedConfig();Object.assign(cfg.settings,{legendPosition:'custom',legendColumns:2,legendFont:18,legendSymbol:6,legendX:15,legendY:35,siteNumbers:true,siteLabelSize:14});cfg.selected=['TWS','Unknown'];cfg.colors.TWS='#123456';await loadConfig(cfg);
 await get('downloadSites').emit('click');const reference=await app.downloads.at(-1).blob.text();assert.ok(reference.includes('S002'));assert.ok(!reference.includes('S001'));
 await get('saveProject').emit('click');const download=app.downloads.at(-1);assert.equal(download.name,'project_map.tbm.json');const text=await download.blob.text(),project=JSON.parse(text);assert.equal(project.data.rows.length,4);
 await get('demoBtn').emit('click');get('prefix').value='other';get('projectFile').files=[app.file('saved.tbm.json',text)];await get('projectFile').emit('change');await flush();
 assert.equal(get('fileLabel').textContent,'original.csv');assert.equal(get('invalidBtn').hidden,false);assert.equal(get('groupStat').textContent,'2/3');assert.equal(get('prefix').value,'project_map');assert.equal(Number(get('exportWidth').value),1500);assert.equal(get('legendCustom').hidden,false);assert.deepEqual(await savedConfig(),cfg);
 await get('downloadSites').emit('click');assert.equal(await app.downloads.at(-1).blob.text(),reference);
 const before=await savedConfig(),bad=structuredClone(project);bad.config.settings.legendColumns=0;get('projectFile').files=[app.file('bad.json',JSON.stringify(bad))];await get('projectFile').emit('change');await flush();assert.deepEqual(await savedConfig(),before);assert.equal(get('fileLabel').textContent,'original.csv');
 const exporting=get('batchBtn').emit('click');await flush();await exporting;await flush();const zip=app.downloads.at(-1);assert.ok(zip.name.endsWith('.zip'));const data=new Uint8Array(await zip.blob.arrayBuffer()),v=new DataView(data.buffer),decoder=new TextDecoder();let offset=0,tables=[];
 while(v.getUint32(offset,true)===0x04034b50){const size=v.getUint32(offset+18,true),n=v.getUint16(offset+26,true),name=decoder.decode(data.subarray(offset+30,offset+30+n)),start=offset+30+n;if(name.endsWith('_sites.csv'))tables.push({name,text:decoder.decode(data.subarray(start,start+size))});offset=start+size;}
 assert.equal(tables.length,3);assert.ok(tables.find(t=>t.name.includes('/TWS/')).text.includes('S002'));assert.ok(tables.find(t=>t.name.includes('/Unknown/')).text.includes('S003'));
});

if(failures)throw Error(`${failures} app behavior checks failed`);
