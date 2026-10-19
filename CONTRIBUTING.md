# Contributing｜參與開發

請在 [Issues](https://github.com/YCHsiao-TW/TaiwanBioTopoMaps/issues) 回報問題或提出建議；修正可透過 pull request 提交。維護者視研究需求與可用時間處理，目前沒有固定回覆時限。

## 回報與開發

- 附上版本、作業系統、瀏覽器、重現步驟，以及預期／實際結果。
- 提供最小的合成 CSV 或設定範例；專案檔含原始資料，分享前確認資料可公開。
- DEM 問題附實際 z 等級、載入進度與大致範圍。
- 網站位於 `dist/`，無須建置，以 `python3 serve.py` 執行。
- Node.js 22 或以上執行 `npm test`；地形、繪圖與輸出變更另以 `@napi-rs/canvas` 執行 `npm run test:render`。
- 維持繁體中文／英文，保留原始物種名稱及 CSV 欄位。
- 修改計算時，說明預期規則並提供可獨立判定的測試案例；同步更新文件與第三方署名。
- 提交內容採專案現有 MIT 授權。

## English

Report bugs and requests through Issues; submit changes through pull requests. Include version, OS, browser, reproduction steps, expected/actual behavior and a minimal synthetic example. Complete projects contain original records; disclose only data suitable for public sharing.

The buildless website is in `dist/`. Serve with `python3 serve.py` and run `npm test` using Node.js 22 or later. Terrain/render/export changes should additionally pass `npm run test:render` with `@napi-rs/canvas`. Preserve both interface languages and original taxon/column text. Explain changed calculation rules and provide independently checkable cases, documentation and attribution.

Maintenance is performed as time permits, without a guaranteed response time. Contributions use the project MIT License.
