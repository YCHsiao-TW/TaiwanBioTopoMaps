export const PAGE_PRESETS={
 '5:4':[25,20], '4:3':[24,18], '3:2':[24,16], '16:9':[32,18],
 '1:1':[20,20], '4:5':[20,25], '3:4':[18,24], '2:3':[16,24], '9:16':[18,32]
};
export function pageSize(settings={}){
 const widthCm=settings.pageWidth??25,heightCm=settings.pageHeight??20;
 if(!Number.isFinite(widthCm)||!Number.isFinite(heightCm)||widthCm<5||widthCm>60||heightCm<5||heightCm>60)throw Error('寬、高請填入 5–60 cm 的數值。');
 const ratio=widthCm/heightCm;
 if(ratio<.25||ratio>4)throw Error('畫面比例請介於 1:4 與 4:1 之間。');
 // Keep the working short side large enough for labels and the shared legend.
 const width=Math.max(1200,960*ratio),height=width/ratio;
 return {width,height,widthCm,heightCm,ratio};
}
export function outputSize(settings,width){const page=pageSize(settings);if(!Number.isInteger(width)||width<100||width>10000)throw Error('匯出寬度無效。');const height=Math.round(width/page.ratio);if(width*height>64000000)throw Error(`圖檔為 ${width} × ${height} px，請降低匯出寬度後再試。`);return {width,height};}
export function pagePreset(settings){const ratio=pageSize(settings).ratio;return Object.keys(PAGE_PRESETS).find(k=>Math.abs(PAGE_PRESETS[k][0]/PAGE_PRESETS[k][1]-ratio)<1e-6)||'custom';}
export function pointerPosition(clientX,clientY,rect,settings){const page=pageSize(settings);return [(clientX-rect.left)*page.width/rect.width,(clientY-rect.top)*page.height/rect.height];}
