import {pageSize,outputSize,pagePreset,pointerPosition,PAGE_PRESETS} from '../dist/page.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseCSV,detectColumns,normalizeRows,groupSites,roundEven,project,unproject,colorFor,decodeTerrarium,csvEncode} from '../dist/core.mjs';
import {zipBlob,pngBlob,pdfBlob} from '../dist/export.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const parsed=parseCSV('\uFEFFlongitude,latitude,species,note\r\n120.2,23.5,A,"a,b"\r\n120.2,23.5,A,"two\nlines"\r\n120.2,23.5,B,"quote ""one"""\r\n,23.5,B,x\r\n120,91,B,x\r\nno,23.5,B,x');
assert.equal(parsed.rows[0][3],'a,b');assert.equal(parsed.rows[1][3],'two\nlines');assert.equal(parsed.rows[2][3],'quote "one"');
const columns=detectColumns(parsed.headers),norm=normalizeRows(parsed,columns);assert.equal(norm.valid.length,3);assert.deepEqual(norm.invalid.map(x=>x.reason),['缺少座標','超出經緯度或 Web Mercator 範圍','座標不是數字']);
assert.equal(groupSites(norm.valid,5,'presence')[0].values[0].value,1);assert.deepEqual(groupSites(norm.valid,5,'count')[0].values.map(x=>x.value),[2,1]);assert.equal(groupSites(norm.valid,5,'count',false).length,3);
assert.equal(groupSites([{lon:120.0000001,lat:23,group:'A'},{lon:120.0000002,lat:23,group:'B'}],5).length,1);
assert.equal(roundEven(.125,2),.12);assert.equal(roundEven(.135,2),.14);assert.equal(roundEven(-.125,2),-.12);assert.equal(roundEven(-.135,2),-.14);
assert.throws(()=>parseCSV('a,a\n1,2'));assert.throws(()=>parseCSV('a,b\n1,"never ends'));assert.throws(()=>parseCSV('a,b\n1,2,3'));
assert.deepEqual(detectColumns(['經度','緯度','scientificName']),{lon:'經度',lat:'緯度',group:'scientificName'});
assert.equal(parseCSV('lon\tlat\tgroup\n120\t23\tX').rows[0][2],'X');assert.equal(parseCSV(csvEncode([['a','b'],['"one"','two\nlines']])).rows[0][0],'"one"');
for(const [lon,lat] of [[121,23.5],[118.3,24.4],[-160,-30],[0,0]]){const q=unproject(...project(lon,lat));assert.ok(Math.abs(q[0]-lon)<1e-9&&Math.abs(q[1]-lat)<1e-9);}
assert.equal(decodeTerrarium(137,219,68),2523.265625);for(let i=0;i<30;i++)assert.match(colorFor(i),/^#[0-9a-f]{6}$/i);
const boundaries=JSON.parse(await fs.readFile(path.join(root,'dist/assets/boundaries.json'),'utf8'));assert.equal(boundaries.towns.features.length,368);assert.equal(boundaries.counties.features.length,22);for(const name of ['金門縣','連江縣','澎湖縣'])assert.ok(boundaries.counties.features.find(f=>f.properties.COUNTYNAME===name));
const html=await fs.readFile(path.join(root,'dist/index.html'),'utf8'),app=await fs.readFile(path.join(root,'dist/app.mjs'),'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);for(const m of app.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(m[1]),`Missing element ${m[1]}`);
console.log('PASS: CSV quoting/BOM/TSV, numeric exclusions, presence/count, rounding, projection, color stability, DEM decoding, islands, UI bindings');
const {createRequire}=await import('node:module'),require=createRequire(import.meta.url),native=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'):'@napi-rs/canvas');
globalThis.Path2D=native.Path2D;globalThis.Image=native.Image;globalThis.document={createElement(name){assert.equal(name,'canvas');const c=native.createCanvas(256,256);c.toBlob=(callback)=>callback(new Blob([c.toBuffer('image/png')],{type:'image/png'}));return c;}};
globalThis.fetch=async url=>{if(String(url).startsWith('http'))throw Error('Unexpected remote request during bundled z8 test');const file=path.resolve(root,'dist',url);return new Response(await fs.readFile(file));};
process.chdir(path.join(root,'dist'));
const {MapRenderer,defaultCamera}=await import('../dist/map.mjs');
const settings={terrain:true,hillshade:true,shadow:.28,direction:315,angle:45,terrainZoom:8,pies:true,pieMode:'presence',digits:5,radius:7,autoSize:true,counties:true,towns:true,countyLabels:false,townLabels:false,frame:true,grid:false,northArrow:true,scaleBar:true,legend:true,italic:true};
const cv=document.createElement('canvas'),renderer=new MapRenderer(cv,()=>{});await renderer.init();const points=[{lon:120.9,lat:24.1,group:'Species A'},{lon:120.9,lat:24.1,group:'Species B'},{lon:121.2,lat:23.5,group:'Species C'},{lon:120.8,lat:22.5,group:'Species A'}];const state={settings,camera:defaultCamera(settings),sites:groupSites(points),groups:['Species A','Species B','Species C'],colors:{'Species A':'#0072B2','Species B':'#CC79A7','Species C':'#D55E00'},demo:true};
renderer.status(state);for(let i=0;i<200&&!renderer.status(state).ready;i++)await new Promise(r=>setTimeout(r,30));assert.equal(renderer.status(state).ready,true,JSON.stringify(renderer.status(state).message));
const out=path.join(root,'qa');await fs.mkdir(out,{recursive:true});const result=renderer.render(state,{width:1500,svg:true});assert.ok(result.svg.includes('<path'));assert.ok(result.svg.includes('font-style="italic"'));assert.ok(result.svg.includes('data:image/png;base64'));await fs.writeFile(path.join(out,'map.svg'),result.svg);await fs.writeFile(path.join(out,'map.png'),new Uint8Array(await (await pngBlob(cv,'QA source; DEMO DATA')).arrayBuffer()));await fs.writeFile(path.join(out,'map.pdf'),new Uint8Array(await pdfBlob(cv,'QA source; DEMO DATA').arrayBuffer()));
const zip=await zipBlob([{name:'All/map.svg',data:result.svg},{name:'物種/說明.txt',data:'UTF-8 測試'}]);await fs.writeFile(path.join(out,'batch.zip'),new Uint8Array(await zip.arrayBuffer()));assert.ok(renderer.hitMarkers.length===3);
for(const [name,bounds] of [['kinmen',[118.1,24.35,118.52,24.57]],['all',[117.9,21.5,123,26.6]]]){state.camera=defaultCamera(settings,bounds);renderer.status(state);for(let i=0;i<200&&!renderer.status(state).ready;i++)await new Promise(r=>setTimeout(r,30));assert.equal(renderer.status(state).ready,true,`Bundled DEM ${name}`);renderer.render(state,{width:1500});if(name==='kinmen'){const {position,layout}=await import('../dist/map.mjs');const [px,py]=position(118.2,24.5,state.camera,layout(settings));const pixel=cv.getContext('2d').getImageData(Math.round(px*1.25),Math.round(py*1.25),1,1).data;assert.deepEqual([...pixel],[255,255,255,255],'Kinmen sea must be white');}await fs.writeFile(path.join(out,name+'.png'),cv.toBuffer('image/png'));}
console.log('PASS: actual z8 tiles, land masking, main island and Kinmen render, vector SVG, PNG/PDF/ZIP generation');

const {layout:mapLayout,position,inversePosition}=await import('../dist/map.mjs');
assert.equal(pagePreset({}),'5:4');assert.throws(()=>pageSize({pageWidth:0,pageHeight:20}));assert.throws(()=>pageSize({pageWidth:60,pageHeight:5}));assert.throws(()=>outputSize({pageWidth:5,pageHeight:20},5906));
for(const [ratio,[pageWidth,pageHeight]] of Object.entries(PAGE_PRESETS)){
 const st={...settings,terrain:false,pageWidth,pageHeight},page=pageSize(st),pixels=outputSize(st,1500),box=mapLayout(st);assert.ok(Math.abs(pixels.width/pixels.height-page.ratio)<.003);assert.equal(pagePreset(st),ratio);assert.deepEqual(pointerPosition(260,320,{left:10,top:20,width:1000,height:1200},st),[page.width*.25,page.height*.25]);const camera=defaultCamera(st),xy=position(120.85,21.9,camera,box),ll=inversePosition(...xy,camera,box);assert.ok(Math.abs(ll[0]-120.85)<1e-9&&Math.abs(ll[1]-21.9)<1e-9);assert.ok(xy[1]<box.y+box.h-10,'South Taiwan fits in selected bounds');const scene={...state,settings:st,camera};const result=renderer.render(scene,{width:1500,svg:true});assert.equal(cv.width,pixels.width);assert.equal(cv.height,pixels.height);assert.ok(result.svg.includes(`width="${pageWidth}cm" height="${pageHeight}cm"`));if(['1:1','16:9','3:4'].includes(ratio)){const name=ratio.replace(':','x');await fs.writeFile(path.join(out,'aspect-'+name+'.png'),new Uint8Array(await (await pngBlob(cv,'Aspect ratio QA',page)).arrayBuffer()));await fs.writeFile(path.join(out,'aspect-'+name+'.svg'),result.svg);await fs.writeFile(path.join(out,'aspect-'+name+'.pdf'),new Uint8Array(await pdfBlob(cv,'Aspect ratio QA',page).arrayBuffer()));}
}
const custom={pageWidth:23,pageHeight:17};assert.equal(pagePreset(custom),'custom');assert.equal(outputSize(custom,2300).height,1700);
console.log('PASS: all nine aspect presets, custom dimensions, portrait/landscape pointer coordinates, southern bounds, PNG/SVG/PDF page sizes and output guard');

const enScene={...state,language:'en',camera:defaultCamera(settings),settings:{...settings,countyLabels:true}};
const en=renderer.render(enScene,{width:1500,svg:true});assert.ok(en.svg.includes('Groups'));assert.ok(en.svg.includes('Elevation (m)'));assert.ok(en.svg.includes('County'));assert.ok(en.svg.includes('DEMO DATA'));
assert.ok(!/[\u3400-\u9fff]/.test(en.svg));await fs.writeFile(path.join(out,'language-en.svg'),en.svg);
const groupName='物種／分群';const zhScene={...enScene,language:'zh-Hant',groups:[groupName],colors:{[groupName]:'#0072B2'},sites:[]};
const zh=renderer.render(zhScene,{width:1500,svg:true});assert.ok(zh.svg.includes('海拔（m）'));assert.ok(zh.svg.includes('示範資料'));const keep=renderer.render({...zhScene,language:'en'},{width:1500,svg:true});assert.ok(keep.svg.includes(groupName),'User taxon name must not be translated');
console.log('PASS: bilingual SVG legend, demo marker and administrative names; user taxon labels remain original');

const taxa=['TES','TWS','Unknown'],taxonColors={TES:'#0072B2',TWS:'#CC79A7',Unknown:'#D55E00'};
const taxonPoints=taxa.map((group,i)=>({lon:120.8+i*.1,lat:23.5,group}));
const selectionScene={...state,settings:{...settings,terrain:false},camera:defaultCamera(settings),groups:taxa,colors:taxonColors,selected:new Set(['TES','TWS']),sites:groupSites(taxonPoints.filter(p=>p.group!=='Unknown'))};
function checkSelectedLegend(scene,expected){
 const rendered=renderer.render(scene,{width:1200,svg:true});
 assert.deepEqual([...rendered.svg.matchAll(/<text\b[^>]*>(TES|TWS|Unknown)<\/text>/g)].map(m=>m[1]),expected,'Legend follows selection in the original group order');
 const x=pageSize(scene.settings).width-217,ctx=cv.getContext('2d');
 expected.forEach((group,i)=>{const hex=taxonColors[group],rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16));assert.deepEqual([...ctx.getImageData(x,108+i*32,1,1).data],[...rgb,255],`Canvas legend retains ${group} color`);assert.ok(rendered.svg.includes(`<circle cx="${x}" cy="${108+i*32}" r="4.4" fill="${hex}"`),`SVG legend retains ${group} color`);});
 assert.deepEqual([...ctx.getImageData(x,108+expected.length*32,1,1).data],[255,255,255,255],'No extra legend swatch remains');
 return rendered;
}
for(const language of ['zh-Hant','en']){
 const scene={...selectionScene,language};
 checkSelectedLegend(scene,['TES','TWS']);
 for(const group of scene.selected)checkSelectedLegend({...scene,sites:groupSites(taxonPoints.filter(p=>p.group===group))},['TES','TWS']);
 checkSelectedLegend({...scene,selected:new Set(['Unknown','TWS','TES']),sites:groupSites(taxonPoints)},taxa);
 checkSelectedLegend({...scene,selected:new Set(),sites:[]},[]);
}
assert.deepEqual(taxa,['TES','TWS','Unknown']);assert.deepEqual(taxonColors,{TES:'#0072B2',TWS:'#CC79A7',Unknown:'#D55E00'});
const filtered=checkSelectedLegend(selectionScene,['TES','TWS']);await fs.writeFile(path.join(out,'legend-filtered.svg'),filtered.svg);await fs.writeFile(path.join(out,'legend-filtered.png'),cv.toBuffer('image/png'));
console.log('PASS: deselected taxa absent from Canvas/SVG legends, shared selected legend in batch scenes, reselect and empty selection, stable colors in both languages');

const {siteCatalog,withSiteIds}=await import('../dist/core.mjs');
const numberedPoints=points.map((p,i)=>({...p,line:i+2})),catalog=siteCatalog(numberedPoints,settings),numbered=withSiteIds(groupSites(numberedPoints),catalog,true);
for(const [pos,cols] of [['right',1],['left',2],['top-right',2],['top-left',1],['bottom-right',1],['bottom-left',2],['custom',2]]){
 const st={...settings,legendPosition:pos,legendColumns:cols,legendFont:18,legendSymbol:6,legendX:30,legendY:55,siteNumbers:true,siteLabelSize:14};
 const scene={...state,language:'en',settings:st,camera:defaultCamera(st),sites:numbered};
 const result=renderer.render(scene,{width:1500,svg:true});
 assert.deepEqual([...result.svg.matchAll(/>(S\d{3})<\/text>/g)].map(m=>m[1]),numbered.map(s=>s.id));
 assert.ok(result.svg.includes('r="6"'));assert.ok(result.svg.includes('font-size="18"'));
 if(['left','custom','bottom-right'].includes(pos)){await fs.writeFile(path.join(out,'feature-'+pos+'.png'),cv.toBuffer('image/png'));await fs.writeFile(path.join(out,'feature-'+pos+'.svg'),result.svg);await fs.writeFile(path.join(out,'feature-'+pos+'.pdf'),new Uint8Array(await pdfBlob(cv,'Legend and site IDs QA').arrayBuffer()));}
}
const noLabels=renderer.render({...state,settings:{...settings,siteNumbers:false},camera:defaultCamera(settings),sites:numbered},{svg:true});assert.ok(!/>S\d{3}<\/text>/.test(noLabels.svg));
console.log('PASS: actual Canvas/SVG legends in all seven positions, multiple columns/font/symbol sizes, optional site IDs and PNG/SVG/PDF output');

const longGroups=['Very long scientific taxon name alpha','Very long scientific taxon name beta','Very long scientific taxon name gamma'];
const largeSymbols={...settings,terrain:false,legendColumns:2,legendFont:24,legendSymbol:12};
const longLegend=renderer.render({...state,settings:largeSymbols,camera:defaultCamera(largeSymbols),groups:longGroups,colors:Object.fromEntries(longGroups.map((g,i)=>[g,colorFor(i)])),sites:[]},{svg:true});
const labels=[...longLegend.svg.matchAll(/<text x="([^"]+)"[^>]*font-size="([^"]+)"[^>]*>(Very long scientific taxon name [^<]+)<\/text>/g)];assert.equal(labels.length,3);
const swatches=[...longLegend.svg.matchAll(/<circle cx="([^"]+)"[^>]*r="12"/g)];assert.equal(swatches.length,3);
cv.getContext('2d').font=`italic ${labels[0][2]}px Georgia`;assert.ok(Number(labels[0][1])+cv.getContext('2d').measureText(labels[0][3]).width<Number(swatches[2][1])-12-2,'Long labels leave room for the next column symbol');
console.log('PASS: long taxon names and maximum-size legend symbols do not collide across columns');
