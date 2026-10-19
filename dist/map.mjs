import {getLanguage,tx} from './i18n.mjs';
import {pageSize,outputSize} from './page.mjs';
import {legendOptions,legendSidebar,legendGeometry} from './legend.mjs';
import {RAMP,project,unproject,fitCamera,decodeTerrarium,rampColor,escapeXML} from './core.mjs';
export const SIZE={width:1200,height:960};
const SOURCE='Taiwan Atlas 2021.9.20 / MOI NLSC; Terrain Tiles: Mapzen, USGS SRTM & GMTED2010, DOC/NOAA/NESDIS/NCEI. Accessed 2026-10-19. EPSG:3857. Hypsometric tint and hillshade modified in browser.';
export function layout(settings){const f=pageSize(settings),side=legendSidebar(settings);return {x:65+(legendOptions(settings).position==='left'?side:0),y:35,w:f.width-105-side,h:f.height-100};}
export function position(lon,lat,camera,p){const q=project(lon,lat),s=256*2**camera.zoom;return [p.x+p.w/2+(q[0]-camera.x)*s,p.y+p.h/2+(q[1]-camera.y)*s];}
export function inversePosition(x,y,camera,p){const s=256*2**camera.zoom;return unproject(camera.x+(x-p.x-p.w/2)/s,camera.y+(y-p.y-p.h/2)/s);}
export const TERRAIN_QUALITIES=['fast','auto','detail','maximum'];
export function terrainPlan(settings,camera){
 if(settings.terrainQuality===undefined&&Number.isInteger(settings.terrainZoom))return {quality:'legacy',zoom:Math.max(7,Math.min(12,settings.terrainZoom)),limit:120};
 const quality=TERRAIN_QUALITIES.includes(settings.terrainQuality)?settings.terrainQuality:'auto';
 const base=Math.max(8,Math.min(12,Math.floor(camera.zoom+.25)));
 const profile={fast:{offset:-1,limit:48},auto:{offset:0,limit:120},detail:{offset:1,limit:220},maximum:{offset:2,limit:420}}[quality];
 return {quality,zoom:Math.max(7,Math.min(12,base+profile.offset)),limit:profile.limit};
}
function pathGeometry(geometry,point){let parts=[];const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;for(const polygon of polygons){if(point.bounds){const xs=polygon[0].map(a=>a[0]),ys=polygon[0].map(a=>a[1]),b=point.bounds;if(Math.max(...xs)<b[0]||Math.min(...xs)>b[2]||Math.max(...ys)<b[1]||Math.min(...ys)>b[3])continue;}for(const ring of polygon){let seg='';for(let i=0;i<ring.length;i++){const a=point(...ring[i]);seg+=(i?'L':'M')+a[0].toFixed(2)+','+a[1].toFixed(2);}parts.push(seg+'Z');}}return parts.join('');}
function labelPoint(g){const polygons=g.type==='Polygon'?[g.coordinates]:g.coordinates;let best=null,areaMax=-1;for(const poly of polygons){const ring=poly[0];let area=0,cx=0,cy=0;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i],z=a[0]*b[1]-b[0]*a[1];area+=z;cx+=(a[0]+b[0])*z;cy+=(a[1]+b[1])*z;}if(Math.abs(area)>areaMax&&area!==0){areaMax=Math.abs(area);best=[cx/(3*area),cy/(3*area)];}}return best||polygons[0][0][0];}
class Painter{
 constructor(ctx,svg=false){this.ctx=ctx;this.parts=svg?[]:null;}
 path(d,{fill='none',stroke='none',width=1,opacity=1}={}){const c=this.ctx;c.save();c.globalAlpha=opacity;const p=new Path2D(d);if(fill!=='none'){c.fillStyle=fill;c.fill(p,'evenodd');}if(stroke!=='none'){c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.stroke(p);}c.restore();this.parts?.push(`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}" fill-rule="evenodd"/>`);}
 line(x1,y1,x2,y2,color='#3a483a',width=1,opacity=1){this.path(`M${x1},${y1}L${x2},${y2}`,{stroke:color,width,opacity});}
 rect(x,y,w,h,fill,stroke='none',width=1){this.ctx.fillStyle=fill;if(fill!=='none')this.ctx.fillRect(x,y,w,h);if(stroke!=='none'){this.ctx.strokeStyle=stroke;this.ctx.lineWidth=width;this.ctx.strokeRect(x,y,w,h);}this.parts?.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`);}
 text(text,x,y,{size=12,color='#374439',italic=false,font='Arial',align='left',weight='normal'}={}){const c=this.ctx;c.font=`${italic?'italic ':''}${weight} ${size}px ${font}`;c.fillStyle=color;c.textAlign=align;c.fillText(text,x,y);this.parts?.push(`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="${font}" font-style="${italic?'italic':'normal'}" font-weight="${weight}" text-anchor="${align==='center'?'middle':align==='right'?'end':'start'}">${escapeXML(text)}</text>`);}
 circle(x,y,r,fill,stroke='#26372b',width=.9){this.ctx.beginPath();this.ctx.arc(x,y,r,0,Math.PI*2);if(fill!=='none'){this.ctx.fillStyle=fill;this.ctx.fill();}if(stroke!=='none'&&width>0){this.ctx.strokeStyle=stroke;this.ctx.lineWidth=width;this.ctx.stroke();}this.parts?.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`);}
 wedge(x,y,r,start,end,fill){const x1=x+r*Math.cos(start),y1=y+r*Math.sin(start),x2=x+r*Math.cos(end),y2=y+r*Math.sin(end);this.path(`M${x},${y}L${x1},${y1}A${r},${r} 0 ${end-start>Math.PI?1:0} 1 ${x2},${y2}Z`,{fill,stroke:'#fff',width:.45});}
}
export class Terrain{
 constructor(onChange){this.tiles=new Map();this.queue=[];this.running=0;this.onChange=onChange;this.local=new Set();this.ready=fetch('./assets/terrain-index.json').then(r=>r.json()).then(x=>this.local=new Set(x));}
 request(key){if(this.tiles.has(key))return this.tiles.get(key);const tile={status:'pending',key};this.tiles.set(key,tile);this.queue.push(tile);this.pump();return tile;}
 pump(){while(this.running<6&&this.queue.length){const tile=this.queue.shift();this.running++;this.load(tile).finally(()=>{this.running--;this.onChange();this.pump();});}}
 async load(tile){try{await this.ready;const [z,x,y]=tile.key.split('/').map(Number);let img=new Image();img.crossOrigin='anonymous';await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{img.src='';reject(Error('DEM 讀取逾時'));},20000);img.onload=()=>{clearTimeout(timeout);resolve();};img.onerror=()=>{clearTimeout(timeout);reject(Error('DEM 圖磚載入失敗'));};img.src=this.local.has(tile.key)?`./assets/terrain/${tile.key}.png`:`https://elevation-tiles-prod.s3.amazonaws.com/terrarium/${tile.key}.png`;});const cv=document.createElement('canvas');cv.width=cv.height=256;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);const pixels=c.getImageData(0,0,256,256).data;const elev=new Float32Array(65536);for(let i=0;i<elev.length;i++)elev[i]=decodeTerrarium(...pixels.subarray(i*4,i*4+3));tile.elev=elev;tile.z=z;tile.x=x;tile.y=y;tile.status='ready';}catch(e){tile.status='error';tile.error=e.message;}}
 retry(){for(const [k,t] of this.tiles)if(t.status==='error')this.tiles.delete(k);this.onChange();}
 visible(camera,p,zoom,limit=120){let z=zoom,keys;do{const n=2**z,s=256*2**camera.zoom;const left=camera.x-p.w/2/s,right=camera.x+p.w/2/s,top=camera.y-p.h/2/s,bottom=camera.y+p.h/2/s;const x0=Math.max(0,Math.floor(left*n)),x1=Math.min(n-1,Math.floor(right*n)),y0=Math.max(0,Math.floor(top*n)),y1=Math.min(n-1,Math.floor(bottom*n));if((x1-x0+1)*(y1-y0+1)<=limit||z<=1){keys=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)keys.push(`${z}/${x}/${y}`);break;}z--;}while(z>=1);return {z,tiles:keys.map(k=>this.request(k))};}
 color(tile,settings){
  const neighbors=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const t=dx===0&&dy===0?tile:this.tiles.get(`${tile.z}/${tile.x+dx}/${tile.y+dy}`);neighbors.push(t?.status==='ready'?t:null);}
  const key=[settings.hillshade,settings.shadow,settings.direction,settings.angle].join('/');
  if(tile.colorKey===key&&tile.colorNeighbors?.every((t,i)=>t===neighbors[i]))return tile.canvas;
  // Two DEM pixels support centered slopes plus a one-pixel texture gutter.
  const stride=260,e=new Float32Array(stride*stride);
  for(let y=-2;y<258;y++)for(let x=-2;x<258;x++){
   const dx=Math.floor(x/256),dy=Math.floor(y/256),t=neighbors[(dy+1)*3+dx+1];
   e[(y+2)*stride+x+2]=t?t.elev[(y-dy*256)*256+x-dx*256]:tile.elev[Math.max(0,Math.min(255,y))*256+Math.max(0,Math.min(255,x))];
  }
  const canvas=tile.canvas||document.createElement('canvas');canvas.width=canvas.height=258;
  const c=canvas.getContext('2d'),image=c.createImageData(258,258),d=image.data;
  const az=settings.direction*Math.PI/180,alt=settings.angle*Math.PI/180,lx=Math.sin(az)*Math.cos(alt),ly=Math.cos(az)*Math.cos(alt),lz=Math.sin(alt);
  for(let y=-1;y<=256;y++){
   // Use the pixel latitude so overlapping gutters have identical shading.
   const lat=unproject(0,(tile.y*256+y+.5)/(256*2**tile.z))[1],meters=40075016.686*Math.cos(lat*Math.PI/180)/(256*2**tile.z);
   for(let x=-1;x<=256;x++){
    const i=(y+2)*stride+x+2,out=((y+1)*258+x+1)*4,col=rampColor(e[i]);let light=1;
    if(settings.hillshade){const dx=(e[i+1]-e[i-1])/(2*meters),dy=(e[i-stride]-e[i+stride])/(2*meters),illum=Math.max(0,(-dx*lx-dy*ly+lz)/Math.hypot(dx,dy,1));light=1-settings.shadow*(1-illum);}
    for(let k=0;k<3;k++)d[out+k]=col[k]*light;d[out+3]=255;
   }
  }
  c.putImageData(image,0,0);tile.colorKey=key;tile.colorNeighbors=neighbors;tile.canvas=canvas;return canvas;
 }
}
export class MapRenderer{
 constructor(canvas,onUpdate){this.canvas=canvas;this.terrain=new Terrain(onUpdate);this.geometry=null;this.hitMarkers=[];}
 async init(){const r=await fetch('./assets/boundaries.json');if(!r.ok)throw Error('行政界線無法載入。');this.geometry=await r.json();for(const k of ['counties','towns'])for(const f of this.geometry[k].features)f.labelPoint=labelPoint(f.geometry);}
 status(state){if(!state.settings.terrain)return {ready:true,message:'彩色海拔已關閉 · 行政區底圖',tiles:[]};const plan=terrainPlan(state.settings,state.camera),v=this.terrain.visible(state.camera,layout(state.settings),plan.zoom,plan.limit),loaded=v.tiles.filter(t=>t.status==='ready').length,failed=v.tiles.filter(t=>t.status==='error').length;return {...v,ready:loaded===v.tiles.length,failed,message:`海拔 ${loaded}/${v.tiles.length} · DEM z${v.z}${v.z!==plan.zoom?'（依範圍調整）':''}${failed?` · ${failed} 張載入失敗`:''}`};}
 render(state,{canvas=this.canvas,width=1200,svg=false}={}){
  const figure=pageSize(state.settings),output=outputSize(state.settings,width);canvas.width=output.width;canvas.height=output.height;const ctx=canvas.getContext('2d'),scale=width/figure.width;ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,figure.width,figure.height);if(!this.geometry)return {canvas};
  const s=state.settings,p=layout(s),camera=state.camera,point=(lon,lat)=>position(lon,lat,camera,p);const sw=inversePosition(p.x,p.y+p.h,camera,p),ne=inversePosition(p.x+p.w,p.y,camera,p);point.bounds=[sw[0],sw[1],ne[0],ne[1]];const land=this.geometry.nation.features.map(f=>pathGeometry(f.geometry,point)).join('');
  ctx.save();ctx.beginPath();ctx.rect(p.x,p.y,p.w,p.h);ctx.clip();ctx.clip(new Path2D(land),'evenodd');ctx.fillStyle='#e9f7e4';ctx.fillRect(p.x,p.y,p.w,p.h);
  if(s.terrain){
   const plan=terrainPlan(s,camera),visible=this.terrain.visible(camera,p,plan.zoom,plan.limit),world=256*2**camera.zoom;
   for(const t of visible.tiles){
    if(t.status!=='ready')continue;
    const n=2**t.z,size=world/n,pad=size/256,x=p.x+p.w/2+(t.x/n-camera.x)*world,y=p.y+p.h/2+(t.y/n-camera.y)*world;
    const left=Math.round(x*scale)/scale,top=Math.round(y*scale)/scale,right=Math.round((p.x+p.w/2+((t.x+1)/n-camera.x)*world)*scale)/scale,bottom=Math.round((p.y+p.h/2+((t.y+1)/n-camera.y)*world)*scale)/scale;
    // Sample through the gutter, but paint only the core. Shared, whole-pixel
    // clip edges avoid both gutter overpainting and antialiased hairline gaps.
    ctx.save();ctx.beginPath();ctx.rect(left,top,right-left,bottom-top);ctx.clip();ctx.imageSmoothingEnabled=true;
    ctx.drawImage(this.terrain.color(t,s),x-pad,y-pad,size+2*pad,size+2*pad);ctx.restore();
   }
  }
  ctx.restore();const paint=new Painter(ctx,svg);
  if(svg)paint.parts.push(`<image width="${figure.width}" height="${figure.height}" href="${canvas.toDataURL('image/png')}"/>`);
  ctx.save();ctx.beginPath();ctx.rect(p.x,p.y,p.w,p.h);ctx.clip();paint.parts?.push(`<g clip-path="url(#plot)">`);
  if(s.grid)this.graticule(paint,state,p,true);
  if(s.towns)for(const f of this.geometry.towns.features)paint.path(pathGeometry(f.geometry,point),{stroke:'#546448',width:.4,opacity:.62});
  if(s.counties)for(const f of this.geometry.counties.features)paint.path(pathGeometry(f.geometry,point),{stroke:'#3e5236',width:.8,opacity:.72});
  paint.path(land,{stroke:'#657c54',width:.7});
  const occupied=[],language=state.language||getLanguage();
  for(const [key,on,property,size] of [['counties',s.countyLabels,'COUNTYNAME',12],['towns',s.townLabels,'TOWNNAME',9]])if(on)for(const f of this.geometry[key].features){const [x,y]=point(...f.labelPoint),text=(language==='en'?f.properties[key==='counties'?'COUNTYENG':'TOWNENG']:null)||f.properties[property];if(x<p.x+15||x>p.x+p.w-15||y<p.y+15||y>p.y+p.h-15)continue;const w=text.length*size;if(occupied.some(a=>Math.abs(x-a.x)<(w+a.w)/2&&Math.abs(y-a.y)<14))continue;occupied.push({x,y,w});paint.text(text,x,y,{size,color:'#44593b',align:'center'});}
  this.hitMarkers=[];
  for(const site of state.sites){const [x,y]=point(site.lon,site.lat);let r=s.radius+(s.autoSize?Math.max(0,site.values.length-1)*2:0);if(x<p.x-r||x>p.x+p.w+r||y<p.y-r||y>p.y+p.h+r)continue;if(site.values.length===1)paint.circle(x,y,r,state.colors[site.values[0].group]);else {const total=site.values.reduce((a,b)=>a+b.value,0);let a=-Math.PI/2;for(const v of site.values){const b=a+v.value/total*Math.PI*2;paint.wedge(x,y,r,a,b,state.colors[v.group]);a=b;}paint.circle(x,y,r,'#ffffff00');}this.hitMarkers.push({x,y,r,site});
   if(s.siteNumbers&&site.id){const font=s.siteLabelSize??11;ctx.font=`600 ${font}px Arial`;const w=ctx.measureText(site.id).width+8,lx=Math.max(p.x+4,Math.min(p.x+p.w-w-4,x+r+5)),ly=Math.max(p.y+font+5,Math.min(p.y+p.h-5,y-r-3));paint.rect(lx-3,ly-font-2,w,font+6,'#fffffff0');paint.text(site.id,lx+1,ly,{size:font,weight:'600',color:'#25352d'});}
  }
  if(s.northArrow){const x=p.x+p.w-31,y=p.y+45;paint.text('N',x,y-15,{size:14,align:'center'});paint.path(`M${x},${y}l-8,32 8,-7 8,7Z`,{fill:'#fff',stroke:'#344b30',width:1});paint.path(`M${x},${y}l-8,32 8,-7Z`,{fill:'#344b30'});}
  if(s.scaleBar){const lat=unproject(camera.x,camera.y)[1],mpp=40075016.686*Math.cos(lat*Math.PI/180)/(256*2**camera.zoom),target=mpp*p.w*.19,power=10**Math.floor(Math.log10(target)),nice=target/power>=5?5:target/power>=2?2:1,meters=nice*power,len=meters/mpp,x=p.x+24,y=p.y+p.h-27;paint.rect(x-8,y-27,len+24,43,'#ffffffd9');paint.line(x,y,x+len,y,'#344b30',2);paint.line(x,y-4,x,y+4);paint.line(x+len,y-4,x+len,y+4);paint.text(meters>=1000?`${meters/1000} km`:`${meters} m`,x+len/2,y-9,{size:12,align:'center'});}
  ctx.restore();paint.parts?.push('</g>');
  if(s.frame){paint.rect(p.x,p.y,p.w,p.h,'none','#4b5b43',1);this.graticule(paint,state,p,false);}
  if(s.legend)this.legend(paint,state);
  if(state.demo)paint.text(tx('demoMap',{},language),p.x,figure.height-21,{size:9,color:'#9a937c'});
  if(svg){const parts=paint.parts;return {canvas,svg:`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${figure.widthCm}cm" height="${figure.heightCm}cm" viewBox="0 0 ${figure.width} ${figure.height}"><metadata>${escapeXML(SOURCE)}; Demo data: ${state.demo}; coordinates merged to ${s.digits} decimal places; mode=${s.pieMode}.</metadata><defs><clipPath id="plot"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}"/></clipPath></defs>${parts.join('')}</svg>`};}
  return {canvas};
 }
 graticule(paint,state,p,grid){const camera=state.camera,a=inversePosition(p.x,p.y,camera,p),b=inversePosition(p.x+p.w,p.y+p.h,camera,p);const nice=span=>{const raw=Math.max(1e-9,span)/5,pow=10**Math.floor(Math.log10(raw)),factor=raw/pow,step=(factor<=1?1:factor<=2?2:factor<=5?5:10)*pow;return {step,digits:step>=1?0:Math.min(5,Math.ceil(-Math.log10(step)))};};const lonTick=nice(b[0]-a[0]),latTick=nice(a[1]-b[1]);for(let lon=Math.ceil(a[0]/lonTick.step)*lonTick.step;lon<=b[0]+1e-8;lon+=lonTick.step){const [x]=position(lon,0,camera,p);if(grid)paint.line(x,p.y,x,p.y+p.h,'#7d9470',.35,.25);else{paint.line(x,p.y+p.h,x,p.y+p.h+5,'#4b5b43',.7);paint.text(`${lon.toFixed(lonTick.digits)}°`,x,p.y+p.h+22,{size:11,align:'center',color:'#78826d'});}}for(let lat=Math.ceil(b[1]/latTick.step)*latTick.step;lat<=a[1]+1e-8;lat+=latTick.step){const [,y]=position(0,lat,camera,p);if(grid)paint.line(p.x,y,p.x+p.w,y,'#7d9470',.35,.25);else{paint.line(p.x-5,y,p.x,y,'#4b5b43',.7);paint.text(`${lat.toFixed(latTick.digits)}°`,p.x-10,y+4,{size:11,align:'right',color:'#78826d'});}}}
 legend(paint,state){
  const s=state.settings,groups=state.groups.filter(group=>!state.selected||state.selected.has(group)),g=legendGeometry(s,groups.length,layout(s));
  if(!g.side)paint.rect(g.x-10,g.headerY-24,g.width,g.height,'#fffffff0','#dce4d5',.6);
  paint.text(tx('groups',{},state.language||getLanguage()),g.x,g.headerY,{size:Math.max(14,g.font+1),weight:'600'});
  groups.forEach((group,i)=>{
   const col=Math.floor(i/Math.max(1,g.rows)),row=i%Math.max(1,g.rows),x=g.x+col*200,y=g.firstY+row*g.gap;
   paint.circle(x+5,y-4,g.symbol,state.colors[group],'none',0);
   const offset=Math.max(19,g.symbol+12),maxW=200-offset-(g.columns>1?g.symbol+4:0),ctx=paint.ctx;ctx.font=`${s.italic?'italic ':''}${g.font}px Georgia`;
   const fs=Math.min(g.font,g.font*maxW/Math.max(1,ctx.measureText(group).width));
   paint.text(group,x+offset,y,{size:fs,italic:s.italic,font:'Georgia',color:'#4c5b43'});
  });
  if(s.terrain){const top=g.terrainTop,h=g.terrainHeight;paint.text(tx('elevation',{},state.language||getLanguage()),g.x,top-14,{size:13,weight:'500'});for(let j=0;j<h;j++){const e=4000*(1-j/h),c=rampColor(e);paint.rect(g.x,top+j,14,1.1,`rgb(${c.join(',')})`);}for(const e of [0,1000,2000,3000,4000])paint.text(String(e),g.x+24,top+h*(1-e/4000)+4,{size:10,color:'#7b846f'});}
 }
}
export function defaultCamera(settings,bounds=[119.5,21.6,122.25,25.55]){const p=layout(settings);return fitCamera(bounds,p.w,p.h);}
export {SOURCE};
