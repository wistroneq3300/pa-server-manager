# Wistron PA Server Manager（後端 + 前端正式版雛形）

統一管理 GPU Server 的實際可運行版本（FastAPI 後端 + 前端）。
支援「新增系統」：輸入 OS/BMC 連線資訊 → 後端 SSH 抓 hostname 當系統名稱。

## 快速啟動
```bash
cd /root/user/manager/pa_manager
bash run.sh        # 啟動後瀏覽器開 http://localhost:8788/
```

## 功能
- 白底為主 + 右上 🌓 切換 dark/light
- 品牌：Wistron 深藍側欄 + 深藍/綠色（貼圖風格）
- **系統管理**：＋新增系統 → 表單輸入
  - OS IP / OS 帳號 / OS 密碼 / OS SSH port
  - BMC IP（選填）/ BMC 帳號 / BMC 密碼（選填）
  → 儲存時後端 `sshpass ssh ... hostname`，抓到 hostname 當系統名稱
- 列出系統、查狀態、刪除系統

## API
- `POST /api/machines` ：新增（含 SSH 抓 hostname）
- `GET  /api/machines` ：列出（回傳時密碼遮罩）
- `DELETE /api/machines/{name}` ：刪除

## 目前限制 / 待辦
- **資料存記憶體**：重啟即清空。正式需接 DB（SQLite/Postgres）。
- **密碼明文暫存於記憶體**：正式上線前必須加密存放或接秘密管理。
- **SSH 只抓 hostname**；BMC 欄位已備好，尚未接開/關機等操作。
- 尚未有登入認證 / 權限控管（部門多人使用前需補）。
- 尚未接真實 nvidia-smi / 監控。

## 本機測試
`bash setup_test_ssh.sh`：在本機 127.0.0.1:2200 起測試 SSH server
（帳號 pa_test / pa_test_pass），可用它在新增系統填：
OS IP=127.0.0.1, OS 帳號=pa_test, OS 密碼=pa_test_pass, OS port=2200
驗證整個「新增→SSH→抓 hostname」流程。
