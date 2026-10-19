import assert from 'node:assert/strict';
import {parseCSV,normalizeRows,groupSites,siteCatalog,withSiteIds,siteTable} from '../dist/core.mjs';
import {createProject,readProject} from '../dist/project.mjs';
import {LEGEND_POSITIONS,legendGeometry} from '../dist/legend.mjs';
import {layout,terrainPlan} from '../dist/map.mjs';
import {PAGE_PRESETS,pageSize} from '../dist/page.mjs';

const raw=parseCSV('longitude,latitude,species,note\n120.8,23.5,A,"one, two"\n120.8,23.5,B,"line\nline"\n121.1,24,A,third\n121.2,24.2,B,fourth\n,23,A,excluded');
const points=normalizeRows(raw,{lon:'longitude',lat:'latitude',group:'species'}).valid;
for(const pies of [true,false]){
 const settings={digits:5,pieMode:'count',pies},catalog=siteCatalog(points,settings),all=withSiteIds(groupSites(points,5,'count',pies),catalog,pies);
 for(const group of ['A','B']){
  const subset=withSiteIds(groupSites(points.filter(p=>p.group===group),5,'count',pies),catalog,pies);
  for(const site of subset){assert.ok(site.id);for(const record of site.records)assert.equal(site.id,all.find(s=>s.records.some(p=>p.line===record.line)).id);}
  const csv=parseCSV(siteTable(subset));assert.equal(csv.headers[0],'site_id');assert.ok(csv.rows.every(row=>row[3]===group));assert.ok(csv.rows.every(row=>Number(row[4])>0));
 }
 assert.equal(new Set(catalog.map(s=>s.id)).size,catalog.length);
}
const catalog=siteCatalog(points,{digits:5,pieMode:'presence',pies:true});assert.equal(catalog[0].id,'S001');assert.equal(catalog[0].count,2);
const config={application:'TaiwanBioTopoMaps',version:1,settings:{siteNumbers:true,legendColumns:2}};
const project=createProject(raw,config,{filename:'原始資料.csv',demo:false,exportOptions:{prefix:'研究圖',format:'svg',width:1500}});
assert.deepEqual(readProject(JSON.stringify(project)),project);assert.deepEqual(project.data,raw,'Original values, newlines and excluded records survive');
for(const mutate of [p=>p.data.rows[0].pop(),p=>p.data.headers[1]=p.data.headers[0],p=>p.exportOptions.width=999,p=>p.version=99,p=>p.data.rows[0][0]=120]){const p=structuredClone(project);mutate(p);assert.throws(()=>readProject(JSON.stringify(p)));}
for(const [pageWidth,pageHeight] of Object.values(PAGE_PRESETS))for(const position of LEGEND_POSITIONS)for(const columns of [1,2,3]){
 const s={pageWidth,pageHeight,legend:true,legendPosition:position,legendColumns:columns,legendFont:20,legendSymbol:10,legendX:100,legendY:100,terrain:true},plot=layout(s),f=pageSize(s),g=legendGeometry(s,30,plot);
 assert.ok(plot.w>0&&plot.h>0);assert.ok(g.x>=0&&g.x+g.width<=f.width+1);assert.ok(g.firstY>g.headerY);assert.ok(g.terrainTop+g.terrainHeight+4<f.height);
 if(!g.side){assert.ok(g.x>=plot.x&&g.x+g.width<=plot.x+plot.w);assert.ok(g.headerY-24>=plot.y);assert.ok(g.headerY-24+g.height<=plot.y+plot.h);}
}
const whole={zoom:7.1},local={zoom:11.2};
assert.deepEqual(terrainPlan({terrainQuality:'auto'},whole),{quality:'auto',zoom:8,limit:120});
assert.equal(terrainPlan({terrainQuality:'detail'},whole).zoom,9);
assert.equal(terrainPlan({terrainQuality:'maximum'},whole).zoom,10);
assert.equal(terrainPlan({terrainQuality:'auto'},local).zoom,11);
assert.equal(terrainPlan({terrainQuality:'maximum'},local).zoom,12);
console.log('PASS: stable site IDs across filters and batch scenes, complete projects, legend layouts, and adaptive DEM quality profiles');
