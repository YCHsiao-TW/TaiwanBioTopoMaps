import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {Terrain,MapRenderer,layout} from '../dist/map.mjs';
import {unproject} from '../dist/core.mjs';

const require=createRequire(import.meta.url);
const native=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'):'@napi-rs/canvas');
globalThis.Path2D=native.Path2D;
globalThis.document={createElement(name){assert.equal(name,'canvas');return native.createCanvas(1,1);}};
globalThis.fetch=async url=>{assert.equal(url,'./assets/terrain-index.json');return new Response('[]');};

// A repeating surface has the same height and slope at each tile edge and
// 128 pixels inside it. Tile boundaries must not change the resulting light.
const z=12,cx=3424,cy=1760,terrain=new Terrain(()=>{});await terrain.ready;
for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
 const x=cx+dx,y=cy+dy,key=`${z}/${x}/${y}`,elev=new Float32Array(256*256);
 for(let row=0;row<256;row++)for(let col=0;col<256;col++)elev[row*256+col]=2000+500*Math.sin(2*Math.PI*(col%128)/128)+500*Math.sin(2*Math.PI*(row%128)/128);
 terrain.tiles.set(key,{key,z,x,y,elev,status:'ready'});
}
const center=terrain.tiles.get(`${z}/${cx}/${cy}`),east=terrain.tiles.get(`${z}/${cx+1}/${cy}`),south=terrain.tiles.get(`${z}/${cx}/${cy+1}`);
const settings={terrain:true,hillshade:true,shadow:.6,direction:315,angle:45,terrainZoom:z,legend:false};
const pixel=(canvas,x,y)=>[...canvas.getContext('2d').getImageData(x,y,1,1).data];
const corePixel=(canvas,x,y)=>pixel(canvas,x+(canvas.width-256)/2,y+(canvas.height-256)/2);
const close=(a,b,tolerance,message)=>assert.ok(a.every((v,i)=>Math.abs(v-b[i])<=tolerance),`${message}: ${a} versus ${b}`);
let texture=terrain.color(center,settings);
for(const y of [7,64,128,200]){
 close(corePixel(texture,0,y),corePixel(texture,128,y),0,'West edge keeps the interior slope');
 close(corePixel(texture,255,y),corePixel(texture,127,y),0,'East edge keeps the interior slope');
}
for(const x of [7,64,128,200]){
 close(corePixel(texture,x,0),corePixel(texture,x,128),1,'North edge keeps the interior slope');
 close(corePixel(texture,x,255),corePixel(texture,x,127),1,'South edge keeps the interior slope');
}

east.status='pending';const pending=corePixel(terrain.color(center,settings),255,128);
east.status='ready';const loaded=corePixel(terrain.color(center,settings),255,128);
assert.notDeepEqual(loaded,pending,'A newly loaded neighbor invalidates the cached border');
close(loaded,corePixel(terrain.color(center,settings),127,128),0,'Loaded neighbor restores the continuous slope');

for(const hillshade of [true,false]){
 const style={...settings,hillshade},a=terrain.color(center,style),b=terrain.color(east,style),c=terrain.color(south,style);
 assert.equal(a.width,258);assert.equal(a.height,258);
 for(let y=0;y<256;y++){
  close(pixel(a,257,y+1),pixel(b,1,y+1),0,'East gutter matches the next tile');
  close(pixel(a,256,y+1),pixel(b,0,y+1),0,'West gutter matches the previous tile');
 }
 for(let x=0;x<256;x++){
  close(pixel(a,x+1,257),pixel(c,x+1,1),0,'South gutter matches the next tile');
  close(pixel(a,x+1,256),pixel(c,x+1,0),0,'North gutter matches the previous tile');
 }
}

// Compare the actual renderer at a four-tile junction with a single continuous
// raster. This also checks fractional positions and high-resolution exports.
const canvas=native.createCanvas(1,1),renderer=new MapRenderer(canvas,()=>{});await renderer.terrain.ready;
renderer.terrain=terrain;
const tiles=[[-1,-1],[0,-1],[-1,0],[0,0]].map(([dx,dy])=>terrain.tiles.get(`${z}/${cx+dx}/${cy+dy}`));
terrain.visible=()=>({z,tiles});
const n=2**z,ring=[[cx-1,cy-1],[cx+1,cy-1],[cx+1,cy+1],[cx-1,cy+1],[cx-1,cy-1]].map(([x,y])=>unproject(x/n,y/n));
renderer.geometry={nation:{features:[{geometry:{type:'Polygon',coordinates:[ring]}}]},counties:{features:[]},towns:{features:[]}};
const zoom=z+2.37,world=256*2**zoom,camera={x:cx/n+.37/world,y:cy/n-.21/world,zoom};
for(const hillshade of [true,false]){
 const style={...settings,hillshade},scene={settings:style,camera,groups:[],colors:{},sites:[],demo:false},p=layout(style),size=world/n;
 const mosaic=native.createCanvas(512,512),mc=mosaic.getContext('2d');
 for(const tile of tiles){const tex=terrain.color(tile,style);mc.putImageData(tex.getContext('2d').getImageData(1,1,256,256),(tile.x-cx+1)*256,(tile.y-cy+1)*256);}
 for(const width of [1200,3000]){
  const rendered=renderer.render(scene,{width,svg:true});assert.ok(rendered.svg.includes('data:image/png;base64'));
  const expected=native.createCanvas(canvas.width,canvas.height),ctx=expected.getContext('2d'),scale=width/1200;ctx.scale(scale,scale);
  ctx.drawImage(mosaic,p.x+p.w/2+((cx-1)/n-camera.x)*world,p.y+p.h/2+((cy-1)/n-camera.y)*world,size*2,size*2);
  const a=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,b=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const junctionX=(p.x+p.w/2+(cx/n-camera.x)*world)*scale,junctionY=(p.y+p.h/2+(cy/n-camera.y)*world)*scale;
  let maxDifference=0;
  for(let y=Math.ceil((p.y+12)*scale);y<(p.y+p.h-12)*scale;y++)for(let x=Math.ceil((p.x+12)*scale);x<(p.x+p.w-12)*scale;x++){
   if(Math.abs(x-junctionX)>8*scale&&Math.abs(y-junctionY)>8*scale)continue;
   const i=(y*canvas.width+x)*4;for(let channel=0;channel<4;channel++)maxDifference=Math.max(maxDifference,Math.abs(a[i+channel]-b[i+channel]));
  }
  assert.ok(maxDifference<=1,`Continuous raster match at ${width}px, hillshade=${hillshade}: maximum difference ${maxDifference}`);
 }
}
console.log('PASS: continuous edge slopes, neighbor-load cache refresh, matching horizontal/vertical gutters, four-tile junctions and fractional high-resolution rendering with/without hillshade');
