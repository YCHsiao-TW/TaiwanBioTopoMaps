import assert from 'node:assert/strict';
import fs from 'node:fs';
import {t,tx,setLanguage,getLanguage,readLanguage,applyLanguage} from '../dist/i18n.mjs';

const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
assert.equal(readLanguage(storage),'zh-Hant');setLanguage('en',storage);assert.equal(readLanguage(storage),'en');assert.equal(getLanguage(),'en');
const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
assert.equal(readLanguage(blocked),'zh-Hant');assert.doesNotThrow(()=>setLanguage('en',blocked));
assert.equal(t('匯出地圖'),'Export map');assert.equal(t('來源列'),'Source row');assert.equal(tx('color',{group:'泉字雲斑蛛'}),'Color for 泉字雲斑蛛');
assert.equal(t('缺少座標'),'Missing coordinates');assert.ok(t('第 9 列欄位數與標題不同；含逗號的文字需加雙引號。').startsWith('Row 9'));
assert.equal(t('海拔 4/5 · DEM z8（依範圍調整） · 1 張載入失敗'),'Elevation 4/5 · DEM z8 (adjusted to extent) · 1 failed');
assert.ok(t('圖檔為 5906 × 23624 px，請降低匯出寬度後再試。').includes('5906 × 23624'));
assert.ok(!/[\u3400-\u9fff]/.test(tx('precision',{lat:'23.5',east:'1.02 m',north:'1.11 m'})));

// A minimal DOM fixture checks reversible copy updates while excluding user content.
const node=(text,excluded=false)=>({nodeValue:text,parentElement:{closest:()=>excluded?{}:null}});
const nodes=[node(' 使用說明 '),node('畫面比例'),node('物種／分群',true),node('來源列',true)];
const attrs={'aria-label':'地圖設定'};const element={closest:()=>null,hasAttribute:k=>k in attrs,getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v};
const button={textContent:'EN',setAttribute(){}},meta={content:''};
const doc={documentElement:{lang:''},body:{},createTreeWalker(){let i=0;return {nextNode:()=>nodes[i++]||null};},querySelectorAll:()=>[element],querySelector:()=>meta,getElementById:()=>button};
applyLanguage(doc);assert.equal(doc.documentElement.lang,'en');assert.equal(nodes[0].nodeValue,' Help ');assert.equal(nodes[1].nodeValue,'Page aspect ratio');assert.equal(nodes[2].nodeValue,'物種／分群');assert.equal(nodes[3].nodeValue,'來源列');assert.equal(attrs['aria-label'],'Map settings');assert.equal(button.textContent,'中文');
setLanguage('zh-Hant',storage);applyLanguage(doc);assert.equal(nodes[0].nodeValue,' 使用說明 ');assert.equal(nodes[1].nodeValue,'畫面比例');assert.equal(attrs['aria-label'],'地圖設定');assert.equal(button.textContent,'EN');

const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const copy=[...html.matchAll(/>([^<>]*[\u3400-\u9fff][^<>]*)</g)].map(m=>m[1].trim());
const attributes=[...html.matchAll(/(?:aria-label|title)="([^"]*[\u3400-\u9fff][^"]*)"/g)].map(m=>m[1]);
for(const value of new Set([...copy,...attributes]))assert.ok(!/[\u3400-\u9fff]/.test(t(value,'en')),'Untranslated UI copy: '+value);
console.log('PASS: Chinese/English copy coverage, reversible switching, persistent preference, blocked storage, errors, templates and untouched user data');
