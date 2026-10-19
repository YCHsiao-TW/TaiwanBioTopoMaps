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

assert.equal(pagePreset({}),'5:4');assert.throws(()=>pageSize({pageWidth:0,pageHeight:20}));assert.throws(()=>pageSize({pageWidth:60,pageHeight:5}));assert.throws(()=>outputSize({pageWidth:5,pageHeight:20},5906));
for(const [ratio,[pageWidth,pageHeight]] of Object.entries(PAGE_PRESETS)){
 const st={pageWidth,pageHeight},page=pageSize(st),pixels=outputSize(st,1500);assert.ok(Math.abs(pixels.width/pixels.height-page.ratio)<.003);assert.equal(pagePreset(st),ratio);assert.deepEqual(pointerPosition(260,320,{left:10,top:20,width:1000,height:1200},st),[page.width*.25,page.height*.25]);
}
assert.equal(outputSize({pageWidth:23,pageHeight:17},2300).height,1700);
console.log('PASS: aspect presets, custom page dimensions and pointer transforms');
