# TaiwanBioTopoMaps｜臺灣生物地形地圖

在瀏覽器內，從 CSV 製作臺灣與離島的物種分布圖、海拔底圖與共域圓餅圖。

[開啟網站](https://taiwan-biotopo-yc-1019.yuchunhsiao1001.chatgpt.site) · [English](#english) · [回報問題](https://github.com/YCHsiao-TW/TaiwanBioTopoMaps/issues)

**版本：3.0.0｜作者：Yu-Chun Hsiao｜應用程式：MIT 授權**

不需要安裝 R、建立帳號或設定 API 金鑰。CSV 與專案資料在瀏覽器內處理；地形圖磚可依範圍從上游服務讀取。

![臺灣與離島的合成示範分布圖，並非真實採集紀錄](docs/images/example-map.png)

*圖中的五個分群及點位均為合成示範資料。*

## 快速使用

1. 開啟網站，在「資料」匯入 CSV／TSV，確認經度、緯度與物種欄位。
2. 勾選物種、調整配色；到「樣式」設定範圍、版面、地形、點位和圖例。
3. 到「輸出」下載 PNG、SVG、PDF，或全部與各物種的 ZIP。
4. 下次需要繼續編輯時，保存完整 `.tbm.json` 專案；重新整理前先保存資料。

右上角 **EN／中文** 切換介面語言。介面、說明與圖例標籤會切換，原始欄位與物種名稱保持原文。

## 功能

| 類別 | 功能 |
| --- | --- |
| 資料 | CSV／TSV、UTF-8／Big5、欄位自動辨識與手動對應、無效資料排除與原因下載 |
| 範圍 | 臺灣本島、臺灣與離島、臺灣＋金門；金門、馬祖、澎湖、綠島、蘭嶼、龜山島、小琉球；自訂範圍及點位定位 |
| 地形 | 彩色海拔、瀏覽器計算陰影、光源與陰影強度、自動／快速／精細／最高品質 DEM |
| 點位 | 同座標整併、多物種共域圓餅、出現與否或紀錄筆數比例、點位大小與可選樣點編號 |
| 圖層 | 縣市／鄉鎮界線及中英文名稱、經緯度外框、網格、指北針、比例尺 |
| 版面 | 9 種比例、自訂寬高、方向交換；圖例位置、1–3 欄、字級與符號尺寸 |
| 輸出 | PNG、SVG、PDF、各物種批次 ZIP、有效資料 CSV、樣點對照 CSV |
| 保存 | 設定 JSON；含全部資料、配色、篩選、視角、版面與輸出選項的完整專案 |

取消勾選物種時，點位與圖例同步篩選；批次圖共用已勾選物種的配色、圖例與地圖範圍。

## 資料格式與範例

第一列為欄位名稱，座標採 **WGS84 十進位經緯度**：

```csv
longitude,latitude,species,locality
121.0000,23.5000,Example species A,Demo site 1
121.0000,23.5000,Example species B,Demo site 1
120.6800,23.9000,Example species A,Demo site 2
```

至少需要兩個不同的經緯度欄位；物種欄位可省略。其他欄位可保留於資料表及下載檔。重複紀錄會保留，並納入紀錄筆數比例。

[五物種與離島示範 CSV](examples/example_5species_all_regions.csv) 含 **28 筆合成紀錄、20 個不同座標、5 個分群**；可熟悉操作，不能推論真實物種分布。

## 計算規則與輸出

- **座標整併**：按選定小數位數採五成雙捨入後分組，是座標格網整併。不同格的近距離點位仍可能分開，同格點位則合併。
- **圓餅比例**：出現／未出現模式中，各物種等比例；紀錄筆數模式按各物種列數分配。
- **樣點編號**：依全部有效資料順序建立，篩選與批次圖共用編號。更改整併設定會重建編號。
- **對照表**：欄位為 site_id、longitude、latitude、taxon、record_count、site_total_records、source_rows。涵蓋已勾選物種的全部樣點，包括目前畫面外的點位；來源列為解析後紀錄列號。
- **完整專案**：保存全部解析後 CSV 紀錄（含排除資料）、檔名、示範標記、語言及製圖設定，不含另外下載的 DEM 圖磚。
- **PNG**：完整點陣圖，保存像素與對應列印密度。
- **SVG**：界線、點位及文字為向量；地形與陰影為嵌入式點陣。
- **PDF**：嵌入完整點陣圖片，文字及點位無法分開編輯。

## DEM 與圖資

自動模式依縮放選擇 z8–z12；快速模式降低一級，精細提高一級，最高品質提高兩級，最高皆為 z12。各模式有圖磚上限，範圍過大時逐級降低等級。畫面下方顯示實際等級與載入進度；載入完成後才允許含地形的輸出。

臺灣範圍的 **25 張 z8 圖磚已內建**。預設臺灣全圖使用內建資料；更高等級及其他範圍需要網路。放大或增加輸出像素不等於提升上游資料的測量精度。

行政界線採 **Taiwan Atlas 2021.9.20** 歷史快照，含 22 縣市與 368 鄉鎮市區。投影為 Web Mercator（EPSG:3857），比例尺依畫面中心緯度計算。地形來源為 Mapzen／AWS Terrain Tiles（Terrarium）。完整署名與各資料授權見 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 本機執行

需要 Python 3，不需額外套件。進入解壓後的專案資料夾執行：

```bash
python3 serve.py
```

Windows 也可用 `py -3 serve.py`；macOS 可雙擊 `START_MAC.command`，未允許執行時使用終端機指令。伺服器僅綁定 127.0.0.1。保留終端機，按 Ctrl+C 停止。以 HTTP 開啟網站，才能正常讀取圖資。

## GitHub Pages

可沿用 [YCHsiao-TW/TaiwanBioTopoMaps](https://github.com/YCHsiao-TW/TaiwanBioTopoMaps)。既有專案替換步驟見 [GitHub 上傳說明](docs/GITHUB_UPLOAD.md)。

1. 將此資料夾的**內容**放在儲存庫根目錄，包含隱藏的 `.github/workflows/` 與完整 `dist/`。
2. 在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。
3. 執行 **Actions → Deploy website to GitHub Pages → Run workflow**。
4. 成功後，從 Pages 設定頁開啟實際部署網址。

預設專案網址預期為 `https://ychsiao-tw.github.io/TaiwanBioTopoMaps/`，啟用並成功部署後才會可用。其他靜態主機可直接發布 `dist/`。

## 測試與貢獻

Node.js 22 或以上可執行無額外套件的測試：

```bash
npm test
```

實際 Canvas 繪圖、接縫與圖檔檢查另外需要：

```bash
npm install --no-save --package-lock=false @napi-rs/canvas
npm run test:render
```

詳見 [驗證範圍](docs/VALIDATION.md) 與 [貢獻方式](CONTRIBUTING.md)。瀏覽器實機下載、行動裝置版面與獨立資料驗證仍需持續測試。

## 引用方式

請引用實際使用版本，並另外引用行政界線及海拔資料。版本 3.0.0 建議格式：

> Hsiao, Y.-C. (2026). TaiwanBioTopoMaps (Version 3.0.0) [Computer software]. https://github.com/YCHsiao-TW/TaiwanBioTopoMaps

機器可讀資訊見 [CITATION.cff](CITATION.cff)。目前未宣告論文或 Zenodo DOI。程式碼採 [MIT License](LICENSE)，圖資保有各自授權；AI 協助範圍見 [AI_USAGE.md](AI_USAGE.md)。

---

## English

TaiwanBioTopoMaps is a browser application for mapping biological occurrence records across Taiwan and its offshore islands. Import CSV/TSV records, configure coordinate and taxon columns, customize terrain and layout, and export maps without installing R or configuring an API key.

**Version:** 3.0.0. **Author:** Yu-Chun Hsiao. **Application license:** MIT.

### Usage and features

Open the [application](https://taiwan-biotopo-yc-1019.yuchunhsiao1001.chatgpt.site), import records, configure Style and download maps from Export. EN / 中文 switches the interface while preserving original records. Save a complete `.tbm.json` project before reloading to resume later.

- UTF-8/Big5 CSV/TSV, automatic/manual column mapping, excluded-record reasons and filtered downloads.
- Taiwan and offshore islands, custom extents, panning, zooming and record fitting.
- Elevation, client-side hillshade, county/township boundaries and bilingual labels, frame, graticule, north arrow and scale bar.
- Rounded-coordinate merging, presence/count-based co-occurrence pies, adjustable markers and stable site IDs.
- Nine page presets, custom dimensions, shared taxon colors and adjustable legend positions, columns, fonts and symbols.
- PNG, vector SVG with raster terrain, raster PDF, combined/individual taxon ZIPs and site-reference CSVs.
- Settings JSON and complete projects containing parsed records, filters, colors, camera, layout and export choices.

CSV/project records stay in browser memory. Additional terrain tiles are requested from AWS.

### Data and interpretation

Use WGS84 decimal longitude and latitude in distinct columns. Taxon grouping is optional; other columns and duplicates are retained. The [example](examples/example_5species_all_regions.csv) contains 28 **synthetic** records, 20 coordinates and five taxa; it is not biological evidence.

Coordinates use ties-to-even decimal rounding. Presence mode gives equal shares per taxon; count mode uses record counts. IDs use all valid records in source order, stay consistent across filters and batch maps, and are rebuilt when merging changes.

Reference CSVs contain site_id, longitude, latitude, taxon, record_count, site_total_records and source_rows, covering selected sites outside the viewport as well. Source rows identify parsed records. Projects retain excluded records but do not bundle extra DEM tiles. SVG preserves vector boundaries, markers and text with raster terrain. PDF is rasterized.

### Terrain and boundaries

Auto adapts to extent using z8–z12; Fast requests one level lower, Detailed one higher, Maximum two higher, capped at z12. Tile limits step down the level when necessary. Terrain exports require current tiles to finish loading.

The 25 Taiwan-region z8 tiles are bundled; other levels and areas require internet. Taiwan Atlas 2021.9.20 is a historical snapshot with 22 counties/cities and 368 townships/districts. Maps use EPSG:3857; scale bars use center latitude. Increasing output pixels does not increase measured elevation accuracy. See [third-party notices](THIRD_PARTY_NOTICES.md).

### Run, deploy, test and cite

Run `python3 serve.py` (Windows: `py -3 serve.py`) from this folder. It serves a loopback-only HTTP URL; keep the terminal open and use Ctrl+C to stop.

Deploy `dist/` to a static host. For Pages, put the package contents at the repository root, select **Settings → Pages → Source → GitHub Actions**, then run the deployment workflow. This archive does not enable hosting automatically. See the [upload guide](docs/GITHUB_UPLOAD.md).

Node.js 22 or later runs `npm test` without extra packages. Optional rendering checks require `@napi-rs/canvas`; run `npm run test:render`. See [validation coverage](docs/VALIDATION.md).

> Hsiao, Y.-C. (2026). TaiwanBioTopoMaps (Version 3.0.0) [Computer software]. https://github.com/YCHsiao-TW/TaiwanBioTopoMaps

[CITATION.cff](CITATION.cff) supplies citation metadata; no paper/archive DOI is claimed. Cite data separately. Application code uses MIT, and third-party data retain their terms. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AI_USAGE.md](AI_USAGE.md).
