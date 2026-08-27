# KVM 基地代碼(basecode)自動偵測 — 2026-08-27 Session 進度

> 目標：未來專案可能混合不同 BMC 型別。點「📺 KVM 廣播」時先**自動偵測每台 basecode**，
> 協議一致才多格同步；**不一致就跳 popup 提示「無法同步」並列出各台 basecode**。
> 使用者確認後：Phase 1 先做「偵測 + 一致性把關 + popup」，Phase 2 用**方案 C**（SP-X 用 iframe 嵌 AMI 原生 KVM）。

## 一、關鍵決策紀錄（本輪對話）
| 議題 | 結論 |
|------|------|
| 混合專案能否同步？ | **同一協議**可同步（多台 SP-X→IVTP；多台 OneTree/OpenBMC→RFB）；**跨協議**（SP-X 配 OneTree）不能直接同步 |
| SP-X 渲染方案 | 選 **方案 C**：SP-X 用 **iframe 嵌 AMI 原生 KVM 畫面**（後端代理、帳密不上前端），獨立開 |
| 偵測時機 | 點「📺 KVM 廣播」時，前端呼叫後端偵測 API → 決定同步或 popup |

## 二、BMC 兩種帳號分工（使用者 2026-08-27 澄清）— ⚠️ 重要
host_b（MegaRAC SP-X, INTERNAL_IP_2）：
- **KVM Web 登入**（AMI SP-X 網頁 KVM）：`admin` / `CHANGE_ME__SPX_KVM_ADMIN_PASSWORD`
- **Console / SSH（ipmitool 用）**：`sysadmin` / `superuser`  ← 這組 data.json 的 `bmc_user/bmc_pass`，**不能動**（SSH / ipmitool 還要用）

因此 SP-X 的 **KVM 帳密與 Console 帳密分開存**：
- `bmc_user`=`sysadmin`、`bmc_pass`=`superuser` → 給 SSH / ipmitool（不變）
- **新增** `bmc_kvm_user`=`admin`、`bmc_kvm_pass`=`CHANGE_ME__SPX_KVM_ADMIN_PASSWORD` → 給 SP-X KVM Web 專用
> 這驗證了「不能用同一組帳密」的判斷；偵測/連線 SP-X KVM 必須讀 `bmc_kvm_*`。

## 三、技術分析結論（已實測確認）
兩台協議**根本不同**，不是同一套：
| | host_a（OneTree） | host_b（MegaRAC SP-X） |
|---|---|---|
| KVM 路徑 | `/kvm/0` | `/kvm` |
| 協議 | **標準 RFB**（VNC） | **AMI 私有 IVTP** |
| 第一包 | `RFB 003.008` | `17 00 00 00…`（`CONNECTION_ALLOWED` 0x17） |
| 畫面 | RFB framebuffer update | AMI 私有 video packets（每包 ~373 bytes，由 AMI viewer 解碼） |
| 鍵盤滑鼠 | 標準 RFB input | AMI 私有 `CMD_SEND_HID_PACKET`（0x01） |
| noVNC 渲染 | ✅ | ❌（無 RFB / 無 framebuffer） |

- 已抓 `/libs/kvm/videosocket.js`（gzip）實讀 IVTP 協定：**確認無 RFB、無 readUTF、無 framebuffer**，純 AMI 私有。
- 實測連 SP-X `/kvm`：握手後首包 `17 00 00 00 00 00 02 00` = `CONNECTION_ALLOWED`；後續需送 `CMD_VALIDATE_VIDEO_SESSION` 等初始化封包才推流。

## 四、目前進度

### ✅ 已完成（後端 Phase 1，**未 commit**）
1. **`kvm_bridge.py`**（+101 行）
   - 加 `import time`
   - `_BASE_LABEL`（kind→label/proto/rfb）、`basecode_label(kind)`
   - `_detect_basecode_one(name)`：單台偵測 + `bmc_kvm_*` 帳密優先（SP-X 用 Web 帳密）+ TTL 快取
   - `detect_basecode_sync(names)`、`async detect_basecode_async(names)`（並行 `to_thread`）
2. **`main.py`**（+37 行）
   - 加 `import` `Request`
   - 新 `GET /api/kvm/basecode?project=X`：回每個帶 BMC 機台的 `{kind,label,proto,rfb,online,bmc_ip,project}` + `sync_ok` + `reason` + `detected_kinds`
   - `sync_ok` = 全部能偵測、且協議（rfb/ivtp）一致、且 ≥2 台；單一 SP-X 會回 `sync_ok=false, reason="MegaRAC SP-X 的 KVM 同步尚未實作"`
3. **`data.json`**（已備份 `data.json.bak_20260827_151844`）
   - host_b 新增 `bmc_kvm_user=admin` / `bmc_kvm_pass=CHANGE_ME__SPX_KVM_ADMIN_PASSWORD`（**未動** `bmc_user/passer`）

### ✅ 已驗證
- `GET /api/kvm/basecode?project=fleet_l`：host_g / host_f / node_h / host_a 全 `AMI OneTree / RFB / online=true`，**`sync_ok=true`**
- `GET /api/kvm/basecode?project=node_i`：host_b `MegaRAC SP-X / IVTP / online=true`，`sync_ok=false`
- 後端偵測正確分流 RFB / IVTP

### ⬜ 未完成（下一步）
- **[前端] `kvm_broadcast.js`**：`openKvmBroadcast(project)` 改 `async`
  - 先 `fetch /api/kvm/basecode?project=X`；`sync_ok=true` → 正常多格
  - `sync_ok=false` → 調 `showDialog` popup 顯示 `reason`，KVM overlay 標題/狀態位顯示「無法同步 + 各台 basecode」
  - 用現有 `esc()` / `showDialog()` / `alert` 即可
- **[Phase 2] 方案 C**：SP-X 用 iframe 嵌 AMI 原生 KVM（獨立開，非同步）
- **bump 版本**（app.js / kvm_broadcast.js query ver）+ headless chrome 實測
- **commit + push**（GITHUB_TOKEN）
- **OS 備份**

## 五、檔案改動對照
| 檔案 | 狀態 | 說明 |
|------|------|------|
| `kvm_bridge.py` | M（未 commit） | +basecode 偵測 +TTL +SP-X Web 帳密優先 |
| `main.py` | M（未 commit） | +`/api/kvm/basecode` +`Request` import |
| `static/js/kvm_broadcast.js` | 未改 | 待 Phase 1 前端 |
| `data.json` | M（已備份 .bak） | node_i 加 `bmc_kvm_*` |
| `static/js/app.js` | 未改 | 待前端 |

## 六、git 現況
- HEAD：`2195f28`（origin/main 同步）
- 未 commit：`kvm_bridge.py`、`main.py`（+ data.json 為 OS 端資料）
- 下一步 commit 訊息建議：`feat: KVM basecode auto-detect API (fleet_l RFB / SP-X IVTP) + Phase1 frontend guard`

## 七、待使用者確認
- 方案 C 的 iframe 是否也要「後端代理 KVM 網址（保持帳密不上前端）」，還是直接 iframe 指向 BMC（需使用者瀏覽器有 SP-X session）
- 多協議時：是「整組都不開、只 popup」，還是「能開的開、SP-X 另外單開」？
