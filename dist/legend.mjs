import {pageSize} from './page.mjs';
export const LEGEND_POSITIONS=['right','left','top-right','top-left','bottom-right','bottom-left','custom'];
export function legendOptions(s={}){return {position:s.legendPosition??'right',columns:s.legendColumns??1,font:s.legendFont??13,symbol:s.legendSymbol??4.4,x:s.legendX??75,y:s.legendY??10};}
export function legendSidebar(s){const o=legendOptions(s);return s.legend&&['left','right'].includes(o.position)?220+(o.columns-1)*200:0;}
export function legendGeometry(s,count,plot){
 const f=pageSize(s),o=legendOptions(s),rows=Math.ceil(count/o.columns),width=200*o.columns+20,side=['left','right'].includes(o.position);
 const gap=Math.min(Math.max(32,o.font*1.8,o.symbol*2+10),(Math.min(f.height,plot.h)-(s.terrain?290:80))/Math.max(1,rows));
 const font=Math.min(o.font,gap*.65),symbol=Math.min(o.symbol,gap*.3),height=56+rows*gap+(s.terrain?210:0);
 let x=o.position==='left'?30:f.width-222-(o.columns-1)*200,headerY=84;
 if(!side){
  const roomX=Math.max(0,plot.w-width-24),roomY=Math.max(0,plot.h-height-24);
  x=plot.x+12+(o.position==='custom'?roomX*o.x/100:o.position.endsWith('right')?roomX:0);
  headerY=plot.y+32+(o.position==='custom'?roomY*o.y/100:o.position.startsWith('bottom')?roomY:0);
 }
 const firstY=headerY+28,endY=firstY+rows*gap,terrainTop=side?Math.max(f.height-300,endY+26):endY+32;
 return {x,headerY,firstY,rows,width,height,gap,font,symbol,columns:o.columns,side,terrainTop,terrainHeight:Math.max(1,Math.min(150,f.height-90-terrainTop))};
}
