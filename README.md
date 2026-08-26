# Wistron PA Server Manager

一套**集中管理 AI GPU 伺服器（與機櫃）**的 Web 管理主控台。把 **L10 單機層級**（單台 Node）與 **L11 機櫃層級**（整櫃 rack）的監控與控制整合在單一介面。

- 後端：**FastAPI (Python 3.12)**；前端：**原生 JavaScript**（無框架、無 build 步驟）。
- 被管理的主機不需安裝任何 agent——透過 **SSH**（OS）與 **IPMI / BMC** 收集與控制。
- 歷史 telemetry（感測器/硬體健康）寫入 **SQLite**。
- 網頁終端（xterm.js）透過獨立的 **node/ssh2 橋接服務**提供 SSH 連線。

> 本 README 同時作為「**部署指引**」與「**給 OpenHands 等 AI 的接續文件**」。
> 若你拿到的是乾淨 clone，請依「部署指南」即可把整站跑起來。

---

## 一、功能總覽

### 1. 統一總覽儀表板
- 所有被管理系統的彙整：上線/離線狀態、分專案、GPU 伺服器健康速覽、Ping 燈號。

### 2. L10 System Level（單機）
- 新增/管理單台伺服器：OS SSH（IP/user/password/port）；新增時自動探測 hostname。
- BMC：可由 OS 內 `ipmitool` 自動探測 BMC IP（`use_c17` 對應新版 OpenBMC 的 cipher 17）。
- 檢視 OS 資訊、硬體庫存（CPU/DIMM/SSD/GPU/NIC）、感測器、BMC 開關機。
- **Telemetry 檢視器**：SQLite 歷史指標 + 圖表 + 趨勢分析。
- **BMC power badge**：即時機殼電源開關、顏色區分。

### 3. L11 Rack Level（機櫃）
- 機櫃平面圖（U 槽，**由下往上**編號），可放置伺服器 / switch / power shelf / PDU / CDU / storage。
- 空槽「＋」新增系統（**只能選同專案、且固定在架外的既有 L11 系統**，U 數由該系統的 rack_size 鎖定，不可改）。
- 佔用檢查：避開已佔用的 U 槽區間、多 U 元件需連續空位。
- **機櫃拓撲圖**：把 node↔switch/PDU/CDU 的連線畫成 SVG 實體連線圖。
  - 「新增拓樸 / 模擬拓樸」按鈕**目前暫停**，點擊跳出「功能待開發」。（原始實作 `linkAddDialog()` / `rackDemoTopo()` 仍完整保留在 `app.js`，日後把按鈕 onclick 指回去即可恢復。）
- 拓樸工具列：「↕」收合/展開（`.topo-compact`）、「🗑 刪除全部」（清除本專案連線）、SVG 限高捲動。

### 4. 專案（Projects）
- 依專案分組機器（例如 NCP / H100 / Miramar），L10/L11 分頁各自獨立。
- 每個專案有各自狀態；系統卡片可收合/展開。

### 5. Web 終端機（xterm）
- 瀏覽器內直接操作 **OS / BMC** 的 SSH 終端。
- 走獨立的 **pa-terminal-bridge**（node + `ssh2`，port 6968），事件驅動避免 paramiko 併發 SSH 崩潰。
- 密碼不信任前端傳遞：bridge 一律以 `name + kind` 直接從 `data.json` 取真實帳密。

### 6. 系統廣播（System Broadcast，L10 分頁）
- 依專案把帶 OS 的 L10 系統分組列出，一次把同一指令送到多台主機的 OS shell。
- 指令歷史 `bcLog` 只記錄「時間 + 指令」，**不含目標主機列表**。

### 7. AI Copilot
- 自然語言助手，接本機 Ollama（qwen3.8:27b）。診斷/趨勢分析也可由 AI 輔助。

---

## 二、系統架構（部署前先懂這張圖）

```
瀏覽器 (index.html + app.js + xterm.js)
   │
   │ HTTP (REST)   /api/*
   │ WebSocket     /ws/*
   ▼
pa-manager  ──(FastAPI, uvicorn)──  port 6969 (正式) / 8788 (試用)
   │  * 處理 REST API、WebSocket 代理、讀寫 data.json、telemetry.db
   │  * /ws/terminal/* 與 /ws/rack-broadcast 是「雙向代理」到 node bridge
   ▼
pa-terminal-bridge  ──(node + ssh2)──  port 6968
   │  * 真正建立 SSH 連線到各機台 OS / BMC
   ▼
各被管理主機  (OS via SSH, BMC via IPMI/Redfish)
```

- `pa-manager`：Python 後端，負責資料、REST、把 terminal WS 代理給 bridge。
- `pa-terminal-bridge`：Node 服務，真正開 SSH 通道；**沒有它則網頁終端無法使用**（其餘功能不受影響）。
- 資料：機台清單在 `data.json`，telemetry 歷史在 SQLite `telemetry.db`。

---

## 三、目錄結構

```
pa_server_manager/
├── main.py                 # FastAPI 後端（主程式）
├── telemetry_core.py       # telemetry 收集核心
├── requirements.txt        # Python 依賴
├── run.sh                  # 開發/試用啟動腳本
├── pa-manager.service      # systemd 服務（正式，port 6969）
├── backup_prod.sh          # 每日備份腳本
├── scripts/
│   └── seed_simulated_telemetry.py
├── static/
│   ├── index.html          # 前端入口
│   ├── css/style.css
│   ├── js/app.js           # 前端邏輯（所有功能在此）
│   ├── img/
│   └── vendor/             # chartjs / xterm
├── terminal_bridge/        # Node 終端橋接（ssh2 + ws）
│   ├── server.js
│   ├── package.json
│   └── package-lock.json    # clone 後需 npm ci
└── AGENTS.md               # 給 OpenHands 的專案知識（開發用）
```

---

## 四、部署指南（給「拿到乾淨 clone」的人）

> 環境需求：**Linux**，`Python 3.12`，`Node.js 18+`（npm）。
> 以下全部以「新機器、全新 clone」為前提，一步一步可完成。

### 第 1 步：取得程式碼

```bash
git clone https://github.com/wistroneq3300/pa-server-manager.git
cd pa-server-manager
```

### 第 2 步：Python 環境 + 依賴

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> 建議 Python 3.12。若系統預設版本不同，用 `python3.12` 明確指定。

### 第 3 步：Node 終端橋接的依賴

```bash
cd terminal_bridge
npm ci            # 依 package-lock.json 安裝（ssh2 + ws）
cd ..
```

> 若沒有 `npm ci`，用 `npm install` 亦可。

### 第 4 步：準備資料目錄

程式會依環境變數 `PA_DATA_DIR` 決定資料放哪（未設 = 程式所在目錄）。

正式版建議獨立資料夾（與「試用版」隔離）：

```bash
export PA_DATA_DIR=/srv/pa-server-manager-data
mkdir -p "$PA_DATA_DIR"
```

**首次啟動**：資料目錄可為空——上線後你在 Web UI 直接「新增系統」就有機台。
（若你要把舊站資料搬過來，把舊機的 `data.json` 與 `telemetry.db` 複製進 `$PA_DATA_DIR/` 即可。）

### 第 5 步：啟動（試用 vs 正式）

**試用模式（預設 port 8788，方便測試）：**

```bash
source .venv/bin/activate
PORT=8788 bash run.sh
# http://localhost:8788/
```

**正式模式（推薦用 systemd 常駐 + 開機自啟）：**

範例服務檔已附：`pa-manager.service` / `pa-terminal-bridge.service`：

```bash
# 把服務檔放到 systemd
sudo cp pa-manager.service pa-terminal-bridge.service /etc/systemd/system/
#   ⚠️ 編輯兩檔：WorkingDirectory、ExecStart 的 python path、Environment 的 PA_DATA_DIR，
#      改成這台機器的實際路徑。

sudo systemctl daemon-reload
sudo systemctl enable --now pa-terminal-bridge   # node bridge 先起
sudo systemctl enable --now pa-manager           # python 後端
sudo systemctl status pa-manager pa-terminal-bridge
```

> 兩個服務都要開，且 **pa-terminal-bridge 需能讀到同一份 `$PA_DATA_DIR/data.json`**（它從同一檔案取帳密）。

### 第 6 步：確認

- 開 http://<主機>:6969/ 應看到介面。
- 在「System Manager」加一台系統（填 OS IP/帳密），開其網頁終端確認 SSH 可用。

---

## 五、系統管理運維

### 備份
- 每日自動備份：`backup_prod.sh`（保留 14 份）。設定 cron 即可啟用：
  ```bash
  crontab -e
  # 每天 02:00 備份正式資料
  0 2 * * * /srv/.../backup_prod.sh >> /tmp/pa_backup.log 2>&1
  ```
- 手動備份：直接複製 `$PA_DATA_DIR/`（含 `data.json` + `telemetry.db`）。

### 更新
```bash
cd pa-server-manager
git pull
# 若 Python 依賴有變：pip install -r requirements.txt
# 若 node 依賴有變：cd terminal_bridge && npm ci
sudo systemctl restart pa-manager pa-terminal-bridge
```

### 回滾
```bash
git log --oneline
git checkout <想回滾的 commit hash>
sudo systemctl restart pa-manager pa-terminal-bridge
```

---

## 六、環境變數

| 變數 | 預設 | 用途 |
|---|---|---|
| `PA_DATA_DIR` | 程式所在目錄 | `data.json` 與 `telemetry.db` 的存放資料夾（試用/正式隔離） |
| `PORT` | 8788 | run.sh 的 uvicorn 埠；正式用 service 固定 6969 |
| `TELEMETRY_INTERVAL` | - | telemetry 收集間隔（秒） |
| `MONITOR_MACHINES` | 掃描 data.json 所有有 OS 機台 | 只監控指定的機台 |
| `TERM_BRIDGE_PORT` | 6968 | node 終端橋接埠 |
| `TERM_BRIDGE_HOST` | 0.0.0.0 | node 終端橋接監聽位址 |
| `IPMI_CIPHER` | 17 | ipmitool cipher（新 OpenBMC 用 17） |

---

## 七、REST API 概覽

| Method | Path | 說明 |
|---|---|---|
| POST | `/api/machines` | 新增機器（SSH 驗證、自動 hostname、level、rack_size） |
| POST | `/api/machines/probe-bmc` | 經 ipmitool 探測 BMC IP |
| GET | `/api/machines` | 列出機台（**密碼遮蔽**） |
| DELETE | `/api/machines/{name}` | 移除機台 |
| GET | `/api/machine/{name}` | 機台細節 |
| GET | `/api/machine/{name}/detail` | OS 資訊 + 硬體庫存 |
| GET | `/api/machine/{name}/sensors` | 感測器讀值 |
| GET/POST | `/api/machine/{name}/power` | 讀取 / 控制 BMC 電源 |
| GET | `/api/machine/{name}/telemetry` | telemetry 歷史（SQLite） |
| GET | `/api/machine/{name}/telemetry/analyze` | 趨勢分析 |
| GET/POST | `/api/machine/{name}/diagnose` | 診斷 / AI 分析 |
| GET | `/api/rack/ping` | 機櫃級 ping 掃描 |
| POST/GET/DELETE | `/api/rack/passive`、`/api/links` | 機櫃元件與連線 |
| GET/POST/DELETE | `/api/projects` | 專案管理 |
| POST | `/api/copilot` | AI Copilot |

WebSocket：
- `/ws/terminal/{name}/{kind}` — OS/BMC 終端（kind=os|bmc），雙向代理到 bridge。
- `/ws/rack-broadcast` — 機櫃廣播終端（同專案多主機）。

---

## 八、資料與安全注意事項

- 機台清單存於 `data.json`；telemetry 存於 SQLite `telemetry.db`；彼此以 `PA_DATA_DIR` 隔離。
- **帳密以明文存於 `data.json`**。目前無登入/RBAC。**要對外部開放前請先加認證**，並考慮把密碼加密存放（`ADMIN_PERMISSION_BLUEPRINT.md` 是未實作的認證藍圖）。
- `prod-data.json`（含實機明碼帳密的舊快照）已從版本控制移除並加入 `.gitignore`，不會隨 clone 外洩。
- 被管理主機不需 agent；但需要該主機的 SSH 與 IPMI 帳密才能被這套系統管控。

---

## 九、常見問題（Troubleshooting）

| 症狀 | 原因 / 解法 |
|---|---|
| 網頁終端連不上 | pa-terminal-bridge 沒起來或埠不符：`sudo systemctl status pa-terminal-bridge`；確認它能讀到 `$PA_DATA_DIR/data.json` 的帳密 |
| `python: command not found` | 未建 venv 或未 activate：`source .venv/bin/activate` |
| 開關機失敗 | BMC 帳密錯誤或 cipher 不匹配；設 `IPMI_CIPHER`（OpenBMC 用 17） |
| 頁面 403 / 連不上 | 服務未開：`sudo systemctl status pa-manager` |
| telemetry 沒有資料 | 主機離線或沒接上；等下一次收集（可調 `TELEMETRY_INTERVAL`） |

---

## 十、給 OpenHands / 開發者

- 本專案已有 `AGENTS.md` 記錄專案知識與開發注意事項，接續開發前先讀。
- 前端所有邏輯集中在 `static/js/app.js`（約 170KB，無框架、無 build）。
- `index.html` 的 modal/DOM 與 `style.css` 樣式皆在版本控制內。
- **編輯含 emoji 的字串時建議用 Python 腳本取代**，避免編輯器 surrogate 對問題把整檔清空（歷史教訓，詳見 AGENTS.md §十一）。
