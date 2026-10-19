# GitHub 上傳與替換｜Upload and replace

本包為現有 `YCHsiao-TW/TaiwanBioTopoMaps` 儲存庫準備，版本 3.0.0，僅包含 Web 版。

## 保留歷史與移除舊檔

沿用同一儲存庫，以普通 commit 移除 R 檔再加入 Web 檔，可保留提交歷史與既有 [v2.0.0 release](https://github.com/YCHsiao-TW/TaiwanBioTopoMaps/releases/tag/v2.0.0)。已核對的舊主分支快照：

https://github.com/YCHsiao-TW/TaiwanBioTopoMaps/tree/2a666f4ecdabe57c1631dc146d0f7d37e7d540c0

**這份 ZIP 不會自行更動 GitHub。上傳新檔案也不會自動刪掉舊檔。** 在既有 checkout 移除下列舊版檔案，再放入本包：

```text
R/
TaiwanBioTopoMaps.R
TaiwanBioTopoMaps.Rproj
install_dependencies.R
examples/run_example.R
tests/run_tests.R
tools/build_standalone.R
tools/check_project.R
dist/TaiwanBioTopoMaps_standalone_v2.0.0.R
.github/workflows/static-check.yml
NEWS.md
SHA256SUMS.txt
```

舊 SHA256SUMS.txt 對應舊版檔案，新包用 RELEASE_MANIFEST.json。LICENSE 沿用 MIT；README、CITATION.cff 與 CONTRIBUTING.md 使用本包新版。

## GitHub Desktop

1. Clone 或開啟既有儲存庫，確認沒有需要保留的未提交修改。
2. 移除上述舊檔，將 ZIP 裡 **TaiwanBioTopoMaps 資料夾內的全部內容** 放到儲存庫根目錄。
3. 包含隱藏的 `.github/`。macOS Finder 以 Command+Shift+. 顯示隱藏檔。
4. 根目錄應直接看到 README.md、LICENSE、dist/、tests/、docs/、.github/。
5. 查看變更清單，執行 `npm test`，提交並 Push origin。
6. Settings → Pages → Source 選 GitHub Actions，執行部署工作流程。
7. 成功並驗證網址後，可建立 `v3.0.0` release。

網頁上傳也應先解壓並上傳上述內容；單獨上傳 ZIP 不會部署網站。

## 命令列移除清單

以下供你在**既有儲存庫 checkout** 執行，先確認工作目錄及修改狀態：

```bash
git status
git rm -r --ignore-unmatch -- R
git rm --ignore-unmatch -- TaiwanBioTopoMaps.R TaiwanBioTopoMaps.Rproj install_dependencies.R
git rm --ignore-unmatch -- examples/run_example.R tests/run_tests.R
git rm --ignore-unmatch -- tools/build_standalone.R tools/check_project.R
git rm --ignore-unmatch -- dist/TaiwanBioTopoMaps_standalone_v2.0.0.R
git rm --ignore-unmatch -- .github/workflows/static-check.yml NEWS.md SHA256SUMS.txt
```

再複製本包內容、執行測試、檢查 `git diff --stat` 與 `git status`，最後以普通 commit/push 更新。

## GitHub Pages

`.github/workflows/ci.yml` 執行一般檢查；`pages.yml` 於 main 推送及手動觸發時驗證後發布 dist/。初次啟用須配合 Pages 設定。

預設專案網址預期為 `https://ychsiao-tw.github.io/TaiwanBioTopoMaps/`，必須啟用並成功部署後才可確認。

## English

This web-only v3.0.0 package does not modify GitHub by itself. Reuse the existing repository with normal commits to retain history and the v2.0.0 release.

Remove the exact legacy paths listed above, then copy the package folder contents to the repository root, including hidden `.github/`. Uploading new files alone does not remove old files. Preserve unrelated changes, review the diff, run `npm test`, commit and push.

Select Settings → Pages → Source → GitHub Actions, run the deployment workflow and verify its URL. After validation, create a v3.0.0 release. The expected default project URL above is not claimed to be live.
