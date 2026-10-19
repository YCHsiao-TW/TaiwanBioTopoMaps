# Validation coverage｜驗證範圍

本文件記錄本包的程式測試範圍；測試可在本機重做。

| 指令 | 檢查範圍 |
| --- | --- |
| `npm test` | CSV 引號／BOM／TSV、無效資料、欄位對應、分組、出現／筆數比例、投影往返、DEM 解碼、行政區與 UI 對應 |
| 同上 | 中英文、檔名與 Unicode 衝突、ZIP CRC、完整專案與錯誤驗證、跨篩選樣點編號、圖例幾何、DEM 模式 |
| 同上 | 輕量 DOM fixture 執行實際應用事件：匯入／編碼、過期讀取、篩選、視角、設定恢復、批次資料快照 |
| `npm run test:render` | native Canvas 繪製內建 z8；界線、海域遮罩、比例、圖例、物種篩選、樣點編號及 PNG／SVG／PDF |
| 同上 | 合成地表的邊界梯度、鄰磚載入快取、紋理留邊、四磚交會、小數縮放與高解析輸出接縫 |

測試產生的 `qa/` 為本機檢查輸出，不必發布。

## 尚未完成或不在上述測試範圍

- 各目標瀏覽器／行動裝置的實際操作、版面與下載。
- 所有遠端 DEM 等級、地理範圍及網路環境的可用性與效能。
- 與獨立參考程式逐項核對的完整計算結果。
- 高程與實測值的精度、歷史界線與現況的一致性。
- 有預先設計流程的外部使用者研究，以及與其他工具的效能／易用性比較。

CSV 與 README 圖片為合成示範。程式測試不能視為生物學發現，也不代表已通過同行審查。

## English

Portable checks cover parsing, invalid records, grouping, proportions, projection, DEM decoding, boundary counts, UI bindings, localization, ZIP/naming integrity, projects, site IDs, legend geometry, DEM selection and application events in a lightweight DOM fixture.

Native Canvas checks render bundled z8 terrain, layouts, legends, filters, labels and PNG/SVG/PDF. Synthetic continuous surfaces test slopes, neighbor readiness, texture gutters and tile joins at fractional/high-resolution rendering.

These do not constitute browser/device QA, guaranteed remote DEM availability, independent end-to-end reference validation, measured elevation accuracy, current boundary verification or a usability study. Examples are synthetic, and no peer-reviewed validation is claimed.
