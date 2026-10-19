import assert from 'node:assert/strict';
import {safeName,uniqueName,zipBlob,crc32} from '../dist/export.mjs';

for(const value of ['CON','con.txt','PRN','AUX','NUL','COM1','LPT9.pdf'])assert.ok(safeName(value).startsWith('_'),'Reserved Windows filename: '+value);
assert.equal(safeName('../A/B:C*D?'),'_A_B_C_D_');
assert.equal(safeName('...'),'MAP_TW');assert.equal(safeName('泉字雲斑蛛'),'泉字雲斑蛛');
assert.equal(safeName('e\u0301'),safeName('é'));assert.ok(Array.from(safeName('🕷️'.repeat(80))).length<=80);
assert.ok(!safeName('A'.repeat(79)+'.More').endsWith('.'));
const used=new Set(),names=['All','all','ALL','A/B','A:B','e\u0301','é','CON'].map(name=>uniqueName(name,used));
assert.equal(new Set(names.map(name=>name.toLowerCase())).size,names.length);assert.equal(names[0],'All');assert.equal(names[1],'all_2');assert.equal(names[2],'ALL_3');
const longUsed=new Set();for(let i=0;i<12;i++)assert.ok(Array.from(uniqueName('a'.repeat(80),longUsed)).length<=80);

const files=names.map((name,i)=>({name:`figures/${name}/map.svg`,data:`<svg><text>物種 ${i}</text></svg>`}));
const bytes=new Uint8Array(await (await zipBlob(files)).arrayBuffer()),view=new DataView(bytes.buffer),decoder=new TextDecoder();let offset=0;
for(const file of files){
 assert.equal(view.getUint32(offset,true),0x04034b50);assert.equal(view.getUint16(offset+6,true),0x0800);
 const size=view.getUint32(offset+18,true),length=view.getUint16(offset+26,true),start=offset+30+length;
 assert.equal(decoder.decode(bytes.subarray(offset+30,start)),file.name);assert.equal(decoder.decode(bytes.subarray(start,start+size)),file.data);assert.equal(crc32(bytes.subarray(start,start+size)),view.getUint32(offset+14,true));offset=start+size;
}
assert.equal(view.getUint32(offset,true),0x02014b50);assert.equal(view.getUint16(bytes.length-22+10,true),files.length);
console.log('PASS: Windows-safe names, case/Unicode collision handling, bounded suffixes, UTF-8 ZIP paths and file CRCs');
