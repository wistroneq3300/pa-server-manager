# PA Server Manager — Agents 工作脈絡備忘

本文件是給 OpenHands（或任何接續工作的 agent）讀取的專案脈絡。重新開啟對話視窗接續本專案工作前，
**務必先讀此檔**。工作目錄：`/root/user/manager/pa_manager`。

## 一、專案是什麼

Wistron PA Server Manager：Web 管理介面（FastAPI 後端 + 原生 JS 前端），管理機房 rack 元件
（Server/Switch/Power Shelf/PDU/CDU 等）的資料、拓樸與 telemetry 監控。無 agent 安裝在被監控機器，
由後端透過 SSH 定時收集。

## 二、執行環境（Production）

- 本機網頁：`http://INTERNAL_IP_10:6969`（入口 `http://localhost:3000` 是 agent-canvas ingress，勿混淆）
- 後端啟動方式：由 **systemd service** 管理，**不是**手動 nohup。
  - `systemctl restart pa-manager.service`、`systemctl status pa-manager.service`、`systemctl is-active pa-manager.service`
  - service 檔含 `Environment=PA_DATA_DIR=/srv/pa-manager-prod/data`（重要！telemetry 資料目錄）
  - 後端 command：`python3.12 -m uvicorn main:app --port 6969`（無 --reload，改 code 要 restart）
- 資料檔：`/srv/pa-manager-prod/data/data.json`（machines/projects）
- Telemetry DB：`/srv/pa-manager-prod/data/telemetry.db`（SQLite）
- 本機（dev/workdir）另有 `./data.json`、`./telemetry.db`（dev 用的樣本，勿與 prod 混淆）
- 檢查 6969 是否被正確 service 佔用：`ss -tlnp | grep 6969` 應顯示 `python3.12 (pa-manager.service)`
  （曾有手動殘留 uvicorn 卡住 port，記得清掉，只留 service）

## 三、資料架構

- `machines`: name → machine dict。欄位含 `level`(rack/…) 、`project`、`rack_u`、`rack_size`、
  `os_ip/os_user/os_pass`(server SSH)、`bmc_ip/...`、`mgx_type`(blanking/server/switch/powershelf/pdu/cdu/…)，
  多數 switch/powershelf 目前有 `os_ip` 但無 `os_user/os_pass`（尚未有真實系統）。
- 元件類型判定：前端 `mgxTypeOf(m)`（app.js ~line 558），後端 `telemetry_core.kind_of(m,name)`
  （兩者需同步）。blanking 擋板為 passive、無監控指標，telemetry 端點會排除。
- 目前實例：proj_k 是**唯一的 L11 rack 專案**（server 33 / switch 2 / powershelf 3，其餘為 blanking）。
  fleet_l / node_i / host_e / node_h / client_c 是 L10 單機專案（不在 rack 平面圖）。

## 四、Telemetry（Rack Level，依元件類型）——本次重大架構

「整櫃 telemetry」需依元件類型區分監控指標，因為 server / switch / powershelf / CDU 的撈法全不同。
架構（2026-08 完成，commit chain 見 §七）：

### 後端 `telemetry_core.py`
- `RACK_METRIC_DEF`（~line 85）：每類型定義專屬指標 label/unit/color。
  - server = cpu_used/mem_used_pct/gpu_power
  - switch = port_rx/port_tx/temp/fan_rpm
  - powershelf = power_w/voltage/current_a/temp
  - pdu = power_w/voltage/current_a
  - cdu = flow_lpm/inlet_temp/outlet_temp/pressure  ← **CDU 已預留水流量/水溫/水壓**
  - storage/network 亦定義。
- `kind_of(m,name)`：由 mgx_type / 名稱回退判定類型（blanking 回 "blanking"）。
- DB 表 `rack_metrics(ts,machine,kind,metric,value)`（EAV 泛型），`store_rack()` 寫入。
- `collect_rack(m,kind)`：各非-server 類型收集器**占位**，目前回空。等有真實系統/憑證後，
  在 `collect_rack` 內依 kind + vendor/model 實作 CLI（switch `show interfaces`…、
  powershelf/pdu SNMP…、cdu 水流量/水溫/水壓…）。
- `get_rack_series(project, minutes)`：依專案聚合。server 沿用 os/gpu_metrics；其它從 rack_metrics。
  回 `{kind: {defs, machines(每台最新值), history(每metric 平均/總和折線)}}`。檔案末尾（~line 552）。
- `_job`：依 `kind_of` 派發——server 走 collect_gpu/collect_os，其它走 collect_rack。

### 後端端點 `main.py`
- `GET /api/rack/{project}/telemetry?minutes=`（~line 1667）
  回 `{project, window_min, kinds:[…], kinds_count:{kind:count}, components:[…], data:{kind:…}}`。
  排除 blanking；無資料類型也會回 `defs`（供前端畫佔位區塊）。

### 前端 `static/js/app.js`（Rack Manager「📊 Telemetry」分頁）
- `rackSubviewTabs()` 第三個 tab；`devicesView` 值 "plane"|"list"|"telemetry"（~line 1023/1034）。
- `rackTelemetryHtml()`（~1082）產生容器；`loadRackTelemetry()`（~1164）依 `d.kinds` 動態生成
  各類型 tel-block（`rackTelKindBlock()`）：每類型一個可收合的 `.rt-kind` tel-block，
  有資料→該類型指標折線(canvas `racktel-{kind}-{metric}`) + 每台最新值表格(bars)；
  無資料→佔位「等待接上真實系統後自動開始收集」。
- `rackTelChart()/rackTelSet()`（~1221）：Chart.js 通用（與 L10 單機 telChart 同款機制）。
  **每次重新 load 時 `rackTelCharts={}`**（因 canvas 被 innerHTML 重建，舊 Chart 綁舊節點會失效）。
- rack 子檢視 deep-link：`#/rack/telemetry`、`#/rack/telemetry/{project}`、`#/rack/list|plane`（parseHash ~1847）。
- CSS：`.rt-kind-*`、`.rt-bars-*`、`.rt-bar-*`（style.css ~673）。`#racktel-grid{grid-template-columns:1fr}` 單欄。

## 五、L10 單機 telemetry（既有，格式參考來源）

- 端點 `/api/machines/{name}/telemetry`（get_os_series/get_gpu_series）。
- 前端 `telChart/telSet/TEL_PALETTE/telT/telWindowLabel/telToggleAllBtn` 為 rack telemetry 格式化基礎。

## 六、常見開發/驗證流程

1. 改後端 code → `python3 -c "import ast;ast.parse(open('X.py').read())"` 驗語法 → `systemctl restart pa-manager.service`
2. 改前端 app.js → `node --check static/js/app.js`（後端 restart 後靜態檔自動更新）
3. 端點測試：`curl -s "http://127.0.0.1:6969/api/rack/proj_k/telemetry?minutes=60"`
4. 瀏覽器渲染驗證（headless chrome + virtual-time，**不要用 iframe**，nested iframe 在 virtual-time 不會載入）：
   `google-chrome --headless=new --disable-gpu --no-sandbox --disable-dev-shm-usage \
      --virtual-time-budget=90000 --dump-dom "http://INTERNAL_IP_10:6969/#/rack/telemetry"`
   直接開 app 頁，靠 deep-link 進 telemetry；`--dump-dom` 比 `--screenshot` 可靠（screenshot 會抓到 render 前 frame）。
5. git：`git add <檔> && git commit -m ... && timeout 60 git push origin main`

## 七、Git 狀態 / 最近 commit

- 遠端 repo：`github.com/wistroneq3300/pa-server-manager.git`，分支 `main`
- 最近 commit（新→舊）：
  - `4ebccc5` 整櫃Telemetry改為依元件類型架構（本次）
  - `9c07339` 新增整櫃(Rack Level) Telemetry 監控面板（第一版，之後被類型化重構）
  - `9a51307` 首頁專案卡片 UI 優化（分級+異常角標）
- 尚未 commit/處理的工作見 §八。

## 八、目前已知狀態 / 待辦

- ✅ 整櫃 telemetry 類型化架構完成（後端 + 前端 + deep-link），已 push（4ebccc5）。
- ⚠️ **目前 proj_k（唯一 rack 專案）43 台全離線，暫無 telemetry 資料** → 面板顯示各類型佔位「等待接上真實系統」。
  一旦機器上線、後端 SSH 收集到資料，區塊與折線會自動出現。
- ⏳ **後續功能（等使用者提供真實系統/憑證後實作）**：
  1. 在 `collect_rack` 依 vendor/model 實作 switch / powershelf / pdu / **cdu** 的實際收集
     （cdu 要抓 flow_lpm / inlet_temp / outlet_temp / pressure——即「水壓/水溫」）。
  2. 每個類型可能需要前端「該類型的專屬圖表型態」（例如 switch 的 port 流量折線 vs CDU 水溫折線）。

## 九、備份與接續

- 完整對話紀錄與本 AGENTS.md 的備份位置，由最近一次工作階段告知使用者實際路徑。
- 建議新對話開啟後：`cat AGENTS.md` 或請 agent 讀本檔，即可接續 §八 的待辦。
