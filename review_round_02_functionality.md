# Review Round-02 — Functionality (第 1–200 條)

> 日期:2026-09-18。L1 靜態 review,不實跑(§十八 a/j)。
> 每條輸出:8 問(Q1..Q8)+ 5 段(🎯/📥/▶/📤/🚧)+ §十八 h 三項 + verdict(§二十一 鎖版定義)。
> 四類必抓:e 跑錯位置 / c 應全量卻挑行 / d sensor 無 fallback / b vendor slot 未標。
> 範圍:xlsx `Functionality` sheet row 2–201(前 200 條,對應 2291 全表之首段)。
>
> **判定基準(§二十一 鎖版)**:
> - YES = operator 一次性給完輸入後 agent 自跑到底、中途不需人動手/在場/批准;會 reboot 只要備註風險+提前問仍 YES。
> - PARTIAL = 執行中某步要人動手/在場看/批准。
> - NO/PHYSICAL = 要人手動物理操作,agent 只給事後證據包。
> - UNRESOLVED = 8 問任一答不出 / 5 段任一缺 / TBD。
>
> **Q-LIT 規則(沿用 Round-1 已拍板)**:ssh 內層 grep 雙引號 → 改單引號,避免 agent-host 端字串切爆。
> **⚠️ 本批缺陷已實際修進 xlsx(2026-09-18)**:29 Q-LIT + 8 PMBus 共 37 條 `ai_commands` 已改。
> 零回歸:2977 cases 僅此 37 field 變更(全 `ai_commands`);total=3112 / 6 sheets 不變;cyrillic=0。git 未 commit/push。



---

## 批次說明(第 1–200 條組成)

| 區段 | 約 row | 類型 | 主判定 |
|---|---|---|---|
| Mechanical(HW-00001~00032)| 2–28 | 物理/目視 | NO/PHYSICAL |
| Power Supply CRPS Latch/LED/Fault(HW-00032~00069)| 29–66 | LED 目視 + PMBus | NO / PARTIAL |
| Processor(HW-00072~00082)| 69–79 | 部分只讀 / stress | YES / PARTIAL |
| Memory(HW-00083~00090)| 80–88 | dmidecode / stress | YES / PARTIAL |
| NIC / Panel / LED / 等等(HW-00091+)| 89–201 | 混合 | 逐條 |
## 第 1–200 條 review 統計

**verdict(§二十一 鎖版)分布**:
| verdict | 條數 | 說明 |
|---|---|---|
| NO/PHYSICAL | 108 | 物理/目視(Mechanical、PSU Latch/LED/fault 注入、CPU/LED、Button、Power cycle...) |
| PARTIAL | 76 | 有前置(PMBus、VGA/Resolution 需人眼、RTC/AC、TPM BIOS-side、BMC-LAN set...) |
| YES | 16 | 只讀/自跑(dmidecode/lscpu/ipmitool OOB 讀、Fan speed get...) |

**瑕疵統計(四類必抓 + Q-LIT)**:
| class | 條數 | 對應編號 |
|---|---|---|
| Q-LIT(ssh 內層 grep 雙引號) | 29 | HW-00072/73/74/75、00094、00110、00116、00127/128、00148、00155、00158、00162、00184~00193、00196~00199、00201、00210 |
| §十九 o 假完成(僅列設備名、未讀實際 PMBus register) | 8 | HW-00049~00056 |
| §十八 d(sensor get 未附 fallback) | 0(未命中) | — |
| §十八 c(應全量卻挑行) | 本批讀取題多為全量+粗篩,未見漏抓 | — |
| §十八 b(vendor slot 未標) | PMBus 需 `${PMBUS_BUS_ADDR:?}`;處理中 | HW-00049~00056 |

> 註:Q-LIT 29 條為**真缺陷**(內層未跳脫雙引號),非 escaped 合法型;沿用 Round-1 已拍板修法(內層單引號)。
> 假完成 8 條 = operator 已拍板採 **B**:標 PARTIAL + 補真 `i2cget <reg>` + `${PMBUS_BUS_ADDR:?}`。

---

## 逐條 review(第 1–200 條)

### 1/200 — `Wistron-HW-00001-V006` · Items=Mechanical_Seat_accuracy · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Seat_accuracy
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Seat_accuracy
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 2/200 — `Wistron-HW-00002-V005` · Items=Mechanical_Sharp_edge · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Sharp_edge
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:There should be no sharp edges to effect users' operation
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Sharp_edge
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 3/200 — `Wistron-HW-00003-V002` · Items=Mechanical_install_and_uninstall · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_install_and_uninstall
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Nodes and componnets should be installed and uninstalled easily
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_install_and_uninstall
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 4/200 — `Wistron-HW-00004-V002` · Items=Mechanical_Handle - PSU · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Handle - PSU
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check hardware accuracy
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Handle - PSU
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 5/200 — `Wistron-HW-00005-V002` · Items=Mechanical_Handle - NV GPU Sled · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Handle - NV GPU Sled
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check hardware accuracy
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Handle - NV GPU Sled
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 6/200 — `Wistron-HW-00006-V004` · Items=Mechanical_Handle - AMD GPU Sled · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Handle - AMD GPU Sled
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check hardware accuracy
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Handle - AMD GPU Sled
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 7/200 — `Wistron-HW-00007-V002` · Items=Mechanical_Latch - PSU · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Latch - PSU
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check hardware accuracy
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Latch - PSU
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 8/200 — `Wistron-HW-00008-V002` · Items=Mechanical_Latch - System · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Latch - System
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check hardware accuracy
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Latch - System
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 9/200 — `Wistron-HW-00009-V002` · Items=Front IOB · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Front IOB
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Front IOB
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 10/200 — `Wistron-HW-00010-V002` · Items=CEM Riser · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:CEM Riser
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:CEM Riser
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 11/200 — `Wistron-HW-00011-V002` · Items=HIB · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:HIB
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:HIB
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 12/200 — `Wistron-HW-00012-V002` · Items=PDB · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:PDB
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:PDB
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 13/200 — `Wistron-HW-00013-V002` · Items=Fan module · TestSet=Mechanical -System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Fan module
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Fan module
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 14/200 — `Wistron-HW-00014-V002` · Items=Mechanical_Cable_Connection · TestSet=Mechanical -Cable
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Cable_Connection
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. All parts should be connected and positioned correctly
2. There should be no mismatch, bent pin or cable routing issue when connecting
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Cable_Connection
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 15/200 — `Wistron-HW-00015-V002` · Items=PCIe Connector · TestSet=Mechanical -Cable
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:PCIe Connector
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:i2c-tools (i3c support if vendor provides)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:PCIe Connector
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "echo ---i3c_cpu1---; ls /sys/bus/i3c 2>&1; sudo i3cdetect -l 2>&1; ls /sys/bus/i3c/devices 2>&1;`
- 📤 產出人:
  log 取位:return FULL kernel/sysfs I3C presence + dmesg i3c/i2c lines so the user confirms the CPU1 I3C controller/bus is enumerated per spec; actual 
  risk:RISK: I3C probing needs vendor tooling that may not be installed; agent reports sysfs/dmesg enumeration and leaves the deep I3C probe to the
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 16/200 — `Wistron-HW-00016-V002` · Items=PCIe Routing · TestSet=Mechanical -Cable
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:PCIe Routing
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:PCIe Routing
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 17/200 — `Wistron-HW-00017-V002` · Items=PCIe Stability · TestSet=Mechanical -Cable
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:PCIe Stability
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:PCIe Stability
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 18/200 — `Wistron-HW-00018-V002` · Items=Power Connector · TestSet=Mechanical -Cable
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Power Connector
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power Connector
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 19/200 — `Wistron-HW-00019-V002` · Items=Power Routing · TestSet=Mechanical -Cable
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Power Routing
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power Routing
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 20/200 — `Wistron-HW-00020-V002` · Items=Power Stability · TestSet=Mechanical -Cable
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Power Stability
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power Stability
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 21/200 — `Wistron-HW-00021-V003` · Items=Mechanical_Cable_Adapters · TestSet=Mechanical -Cable
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Cable_Adapters
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Adapters should be installed and removed easily
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Cable_Adapters
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 22/200 — `Wistron-HW-00022-V002` · Items=Mechanical_Adapters · TestSet=Mechanical -AVL
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Adapters
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Adapters should be installed and removed easily
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Adapters
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 23/200 — `Wistron-HW-00023-V002` · Items=SSD · TestSet=Mechanical -AVL
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:SSD
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:SSD
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 24/200 — `Wistron-HW-00028-V002` · Items=Mechanical_Connection · TestSet=Mechanical -AVL
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical_Connection
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. All parts should be connected and positioned correctly
2. There should be no mismatch, bent pin or cable routing issue when connecting
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical_Connection
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 25/200 — `Wistron-HW-00029-V002` · Items=Connector · TestSet=Mechanical -Cooling
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Connector
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none (physical inspection - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Connector
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Connector: liquid-cooling connector inspection verifies the physical connector seating/seal; human visual/physical check at the cooling loop.`
- 📤 產出人:
  log 取位:operator visually inspects + records the cooling connector; agent cannot inspect hardware.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 26/200 — `Wistron-HW-00030-V002` · Items=Manifold · TestSet=Mechanical -Cooling
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Manifold
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All components should be seated properly
- Q6 補什麼:none (physical inspection - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Manifold
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Manifold: cooling manifold inspection is a physical visual/seal check of the liquid manifold; human-only.`
- 📤 產出人:
  log 取位:operator inspects the manifold and records; agent cannot inspect hardware.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 27/200 — `Wistron-HW-00031-V002` · Items=Liquid Level Scale Check · TestSet=Mechanical -Cooling
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Liquid Level Scale Check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. The status should be Okay and could not low level
- Q6 補什麼:none (physical observation - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Liquid Level Scale Check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Liquid Level Scale Check: liquid-level-scale check reads the coolant reservoir level visually; the scale reading requires a person observing the physical level indicat`
- 📤 產出人:
  log 取位:operator records the liquid level scale reading; agent cannot see the physical level.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 28/200 — `Wistron-HW-00032-V004` · Items=Latch_on_fault_offset_To_Next_Block · TestSet=Power Supply - L10 : CRPS -Latch on fault
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Latch_on_fault_offset_To_Next_Block
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Offset in bytes from this location to the beginning of the next configuration block
- Q6 補什麼:PSU vendor config-block decode tool (operator/vendor)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Latch_on_fault_offset_To_Next_Block
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Latch_on_fault_offset_To_Next_Block: verify the offset-in-bytes field between consecutive configuration blocks per a PSU configuration layout. This is a PSU vendor doc`
- 📤 產出人:
  log 取位:operator reads the PSU configuration-block offset via the vendor tool and compares it to Table in the spec; agent cannot access the PSU PMBu
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 29/200 — `Wistron-HW-00033-V004` · Items=Latch connecter check · TestSet=Power Supply - L10 : CRPS -Latch on fault
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Latch connecter check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check latch connecter can lock and won't broken
- Q6 補什麼:physical PSU latch/handle (operator)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Latch connecter check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Latch connecter check: physically verify the PSU (CRPS) latch connector locks and does not break. This is a physical insertion/actuation check of the PSU handle/latch `
- 📤 產出人:
  log 取位:operator manually latches and unlatches the PSU connector and confirms it locks and is not broken; agent cannot physically touch the chassis
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 30/200 — `Wistron-HW-00034-V004` · Items=Latch_on_fault_configBlockType · TestSet=Power Supply - L10 : CRPS -Latch on fault
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Latch_on_fault_configBlockType
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Configuration block type base on Table 1248 Configuration block types
- Q6 補什麼:PSU vendor config-block decode tool (operator/vendor)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Latch_on_fault_configBlockType
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Latch_on_fault_configBlockType: confirm the configuration-block type field is set per Table 1248 Configuration block types. This is a PSU vendor config-block decode vs`
- 📤 產出人:
  log 取位:operator reads the config-block type via the vendor tool and checks it matches Table 1248 Configuration block types; agent cannot access the
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 31/200 — `Wistron-HW-00035-V004` · Items=LED_OFF · TestSet=Power Supply - L10 : CRPS -LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:LED_OFF
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check LED Off status
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:LED_OFF
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 32/200 — `Wistron-HW-00036-V004` · Items=LED_ON · TestSet=Power Supply - L10 : CRPS -LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:LED_ON
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check LED On status
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:LED_ON
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 33/200 — `Wistron-HW-00037-V004` · Items=LED_Blinking · TestSet=Power Supply - L10 : CRPS -LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:LED_Blinking
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check LED Blinking status
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:LED_Blinking
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 34/200 — `Wistron-HW-00038-V004` · Items=LED_Blink_N_Times_then_Off · TestSet=Power Supply - L10 : CRPS -LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:LED_Blink_N_Times_then_Off
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check LED Blinking behavior
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:LED_Blink_N_Times_then_Off
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 35/200 — `Wistron-HW-00039-V004` · Items=LED_Blink_N_Times_then_On · TestSet=Power Supply - L10 : CRPS -LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:LED_Blink_N_Times_then_On
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check LED Blinking behavior
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:LED_Blink_N_Times_then_On
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 36/200 — `Wistron-HW-00040-V004` · Items=LED_behavior_from_PWM_High_State · TestSet=Power Supply - L10 : CRPS -LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:LED_behavior_from_PWM_High_State
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check LED status if PWM High state
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:LED_behavior_from_PWM_High_State
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 37/200 — `Wistron-HW-00041-V004` · Items=LED_behavior_from_PWM_Low_State · TestSet=Power Supply - L10 : CRPS -LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:LED_behavior_from_PWM_Low_State
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check LED status if PWM Low state
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:LED_behavior_from_PWM_Low_State
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 38/200 — `Wistron-HW-00042-V004` · Items=Color · TestSet=Power Supply - L10 : CRPS -LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Color
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check LED Color match SPEC
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Color
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 39/200 — `Wistron-HW-00043-V004` · Items=Flashing_Eight_Times · TestSet=Power Supply - L10 : CRPS -LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Flashing_Eight_Times
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check LED Flashing from 1 to 8 Times
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Flashing_Eight_Times
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 40/200 — `Wistron-HW-00044-V004` · Items=Frequecy_0.5_to_8_Hz · TestSet=Power Supply - L10 : CRPS -LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Frequecy_0.5_to_8_Hz
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check LED Flashing 0.5、1、2、3、4、5、6、7、8 Frequency
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Frequecy_0.5_to_8_Hz
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 41/200 — `Wistron-HW-00045-V004` · Items=Input_power_cycling · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Input_power_cycling
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:The_PSU_shall_reset_the_warning_and_fault_limits_to_default_values_for_the_following_case.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Input_power_cycling
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 42/200 — `Wistron-HW-00046-V004` · Items=PSON_power_cycling · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:PSON_power_cycling
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Fault behavior checking
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:PSON_power_cycling
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 43/200 — `Wistron-HW-00047-V004` · Items=Faults and Error Checking · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Faults and Error Checking
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:The PSU shall support PEC per the SMBus 2.0
- Q6 補什麼:i2c-tools
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Faults and Error Checking
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no "$DUT_USER@$DUT_IP"  "echo ---pmbus_names---; head -n 1 /sys/class/hwmon/hwmon*/name 2>/dev/null | grep -iE 'pmbus|`
- 📤 產出人:
  log 取位:first enumerate the hwmon/PMBus device names on the DUT and return any dmesg SMBus/PEC errors, to confirm the PMBus master is present; the a
  risk:RISK: requires a PEC-capable PMBus master and controlled SMBus error-injection hardware; the fault injection (Faults and Error Checking (Fau
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 44/200 — `Wistron-HW-00048-V004` · Items=Packet Error Checking · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Packet Error Checking
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:The PSU shall support packet error checking to support error checking and handling.
- Q6 補什麼:i2c-tools
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Packet Error Checking
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no "$DUT_USER@$DUT_IP"  "echo ---pmbus_names---; head -n 1 /sys/class/hwmon/hwmon*/name 2>/dev/null | grep -iE 'pmbus|`
- 📤 產出人:
  log 取位:first enumerate the hwmon/PMBus device names on the DUT and return any dmesg SMBus/PEC errors, to confirm the PMBus master is present; the a
  risk:RISK: requires a PEC-capable PMBus master and controlled SMBus error-injection hardware; the fault injection (Packet Error Checking) is stat
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 45/200 — `Wistron-HW-00049-V004` · Items=Capability and Inventory Reporting  CAPABILITY · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Capability and Inventory Reporting  CAPABILITY
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Defines the power supplies PEC support, bus speed, and support of SMBAlert
- Q6 補什麼:i2c-tools ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Capability and Inventory Reporting  CAPABILITY
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no "$DUT_USER@$DUT_IP"  "echo ---pmbus_names---; head -n 1 /sys/class/hwmon/hwmon*/name 2>/dev/null | grep -iE 'pmbus|`
- 📤 產出人:
  log 取位:enumerate the hwmon PMBus + i2c buses on the DUT so the CAPABILITY register (0x0x19, PEC support / bus speed / SMBAlert capability) can be r
  risk:RISK: requires the PSU to be PMBus-connected and the exact PSU i2c bus/address from the board schematic; reading a raw PMBus register needs 
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:§十九 o 假完成:命令僅列 hwmon/i2c 設備名,未讀實際 PMBus register → 需補真 i2cget <reg> + ${PMBUS_BUS_ADDR:?}

---

### 46/200 — `Wistron-HW-00050-V004` · Items=Capability and Inventory Reporting  QUERY · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Capability and Inventory Reporting  QUERY
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Used to determine if the PSU supports a specific command.
It should return the proper information about any commands listed in Table 1223 Summary of PMBus commands
- Q6 補什麼:i2c-tools ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Capability and Inventory Reporting  QUERY
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no "$DUT_USER@$DUT_IP"  "echo ---pmbus_names---; head -n 1 /sys/class/hwmon/hwmon*/name 2>/dev/null | grep -iE 'pmbus|`
- 📤 產出人:
  log 取位:enumerate the hwmon PMBus + i2c buses on the DUT so the QUERY via MFR_SPECIFIC register (0x0xE0, the PSU model/capability query via MFR-spec
  risk:RISK: requires the PSU to be PMBus-connected and the exact PSU i2c bus/address from the board schematic; reading a raw PMBus register needs 
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:§十九 o 假完成:命令僅列 hwmon/i2c 設備名,未讀實際 PMBus register → 需補真 i2cget <reg> + ${PMBUS_BUS_ADDR:?}

---

### 47/200 — `Wistron-HW-00051-V005` · Items=Capability and Inventory Reporting  PMBUS_REVISION · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Capability and Inventory Reporting  PMBUS_REVISION
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Used to verify the PMBUS_REVISION the PSU is based on. This shall be set to revision 1.2.
- Q6 補什麼:i2c-tools ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Capability and Inventory Reporting  PMBUS_REVISION
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no "$DUT_USER@$DUT_IP"  "echo ---pmbus_names---; head -n 1 /sys/class/hwmon/hwmon*/name 2>/dev/null | grep -iE 'pmbus|`
- 📤 產出人:
  log 取位:enumerate the hwmon PMBus + i2c buses on the DUT so the PMBUS_REVISION register (0x0x98, PMBus protocol revision - expected 1.2) can be read
  risk:RISK: requires the PSU to be PMBus-connected and the exact PSU i2c bus/address from the board schematic; reading a raw PMBus register needs 
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:§十九 o 假完成:命令僅列 hwmon/i2c 設備名,未讀實際 PMBus register → 需補真 i2cget <reg> + ${PMBUS_BUS_ADDR:?}

---

### 48/200 — `Wistron-HW-00052-V005` · Items=Capability and Inventory Reporting  MFR_TEMP1_MAX · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Capability and Inventory Reporting  MFR_TEMP1_MAX
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Defines the maximum inlet temperature to generate a warning condition in the STATUS_TEMPERATURE command.
- Q6 補什麼:i2c-tools ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Capability and Inventory Reporting  MFR_TEMP1_MAX
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no "$DUT_USER@$DUT_IP"  "echo ---pmbus_names---; head -n 1 /sys/class/hwmon/hwmon*/name 2>/dev/null | grep -iE 'pmbus|`
- 📤 產出人:
  log 取位:enumerate the hwmon PMBus + i2c buses on the DUT so the MFR_TEMP1_MAX register (0x0xB0, max temperature-1 factory limit) can be read; then, 
  risk:RISK: requires the PSU to be PMBus-connected and the exact PSU i2c bus/address from the board schematic; reading a raw PMBus register needs 
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:§十九 o 假完成:命令僅列 hwmon/i2c 設備名,未讀實際 PMBus register → 需補真 i2cget <reg> + ${PMBUS_BUS_ADDR:?}

---

### 49/200 — `Wistron-HW-00053-V004` · Items=Capability and Inventory Reporting  MFR_TEMP2_MAX · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Capability and Inventory Reporting  MFR_TEMP2_MAX
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Defines the maximum hotspot temperature to generate a warning condition in the STATUS_TEMPERATURE command.
- Q6 補什麼:i2c-tools ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Capability and Inventory Reporting  MFR_TEMP2_MAX
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no "$DUT_USER@$DUT_IP"  "echo ---pmbus_names---; head -n 1 /sys/class/hwmon/hwmon*/name 2>/dev/null | grep -iE 'pmbus|`
- 📤 產出人:
  log 取位:enumerate the hwmon PMBus + i2c buses on the DUT so the MFR_TEMP2_MAX register (0x0xB1, max temperature-2 factory limit) can be read; then, 
  risk:RISK: requires the PSU to be PMBus-connected and the exact PSU i2c bus/address from the board schematic; reading a raw PMBus register needs 
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:§十九 o 假完成:命令僅列 hwmon/i2c 設備名,未讀實際 PMBus register → 需補真 i2cget <reg> + ${PMBUS_BUS_ADDR:?}

---

### 50/200 — `Wistron-HW-00054-V004` · Items=Capability and Inventory Reporting  MFR_IOUT_MAX · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Capability and Inventory Reporting  MFR_IOUT_MAX
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Defines the maximum rated output current on the 12V rail.
- Q6 補什麼:i2c-tools ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Capability and Inventory Reporting  MFR_IOUT_MAX
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no "$DUT_USER@$DUT_IP"  "echo ---pmbus_names---; head -n 1 /sys/class/hwmon/hwmon*/name 2>/dev/null | grep -iE 'pmbus|`
- 📤 產出人:
  log 取位:enumerate the hwmon PMBus + i2c buses on the DUT so the MFR_IOUT_MAX register (0x0xB5, max output-current factory limit) can be read; then, 
  risk:RISK: requires the PSU to be PMBus-connected and the exact PSU i2c bus/address from the board schematic; reading a raw PMBus register needs 
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:§十九 o 假完成:命令僅列 hwmon/i2c 設備名,未讀實際 PMBus register → 需補真 i2cget <reg> + ${PMBUS_BUS_ADDR:?}

---

### 51/200 — `Wistron-HW-00055-V004` · Items=Capability and Inventory Reporting  MFR_POUT_MAX · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Capability and Inventory Reporting  MFR_POUT_MAX
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Defines the maximum rated output power of the PSU.
- Q6 補什麼:i2c-tools ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Capability and Inventory Reporting  MFR_POUT_MAX
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no "$DUT_USER@$DUT_IP"  "echo ---pmbus_names---; head -n 1 /sys/class/hwmon/hwmon*/name 2>/dev/null | grep -iE 'pmbus|`
- 📤 產出人:
  log 取位:enumerate the hwmon PMBus + i2c buses on the DUT so the MFR_POUT_MAX register (0x0xB6, max output-power factory limit) can be read; then, on
  risk:RISK: requires the PSU to be PMBus-connected and the exact PSU i2c bus/address from the board schematic; reading a raw PMBus register needs 
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:§十九 o 假完成:命令僅列 hwmon/i2c 設備名,未讀實際 PMBus register → 需補真 i2cget <reg> + ${PMBUS_BUS_ADDR:?}

---

### 52/200 — `Wistron-HW-00056-V004` · Items=Capability and Inventory Reporting  APP_PROFILE_SUPPORT · TestSet=Power Supply - L10 : CRPS -Fault Behavior
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Capability and Inventory Reporting  APP_PROFILE_SUPPORT
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Fault behavior checking
- Q6 補什麼:i2c-tools ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Capability and Inventory Reporting  APP_PROFILE_SUPPORT
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no "$DUT_USER@$DUT_IP"  "echo ---pmbus_names---; head -n 1 /sys/class/hwmon/hwmon*/name 2>/dev/null | grep -iE 'pmbus|`
- 📤 產出人:
  log 取位:enumerate the hwmon PMBus + i2c buses on the DUT so the APP_PROFILE_SUPPORT register (0x0xEA, application-profile support flag) can be read;
  risk:RISK: requires the PSU to be PMBus-connected and the exact PSU i2c bus/address from the board schematic; reading a raw PMBus register needs 
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:§十九 o 假完成:命令僅列 hwmon/i2c 設備名,未讀實際 PMBus register → 需補真 i2cget <reg> + ${PMBUS_BUS_ADDR:?}

---

### 53/200 — `Wistron-HW-00057-V004` · Items=General fault · TestSet=Power Supply - L10 : CRPS -Blackbox to log fault conditions
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:General fault
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check data is saved to blackbox is this status
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:General fault
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 54/200 — `Wistron-HW-00058-V004` · Items=Over voltage on output · TestSet=Power Supply - L10 : CRPS -Blackbox to log fault conditions
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Over voltage on output
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check data is saved to blackbox is this status
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Over voltage on output
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 55/200 — `Wistron-HW-00059-V004` · Items=Over current on output · TestSet=Power Supply - L10 : CRPS -Blackbox to log fault conditions
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Over current on output
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check data is saved to blackbox is this status
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Over current on output
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 56/200 — `Wistron-HW-00060-V004` · Items=Loss of AC input · TestSet=Power Supply - L10 : CRPS -Blackbox to log fault conditions
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Loss of AC input
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check data is saved to blackbox is this status
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Loss of AC input
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 57/200 — `Wistron-HW-00061-V004` · Items=Input voltage fault · TestSet=Power Supply - L10 : CRPS -Blackbox to log fault conditions
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Input voltage fault
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check data is saved to blackbox is this status
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Input voltage fault
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 58/200 — `Wistron-HW-00062-V004` · Items=Fan failure · TestSet=Power Supply - L10 : CRPS -Blackbox to log fault conditions
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Fan failure
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check data is saved to blackbox is this status
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Fan failure
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 59/200 — `Wistron-HW-00063-V004` · Items=Over temperature · TestSet=Power Supply - L10 : CRPS -Blackbox to log fault conditions
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Over temperature
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check data is saved to blackbox is this status
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Over temperature
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 60/200 — `Wistron-HW-00064-V004` · Items=Plug-in · TestSet=Power Supply - L10 : Function
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Plug-in
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Power supply should be inserted without any problem.
2. Power supply should be workable after inserted (LED and FAN should be working)
3. PSU information in sensor list and SEL of BMC should be correct
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Plug-in
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 61/200 — `Wistron-HW-00065-V004` · Items=Fail · TestSet=Power Supply - L10 : Function
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Fail
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Power cord should be unplugged without any problem
2. Power supply should be OFF when power cord is unplugged (FAN should be off. LED should be AMBER.)
3. PSU information in sensor list and SEL of BMC should be correct when power cord is unplugged
4. PSU information in sensor list and SEL of BMC should be correct when power cord is plugged back
5. All the reset PSU should have the same behavior as PSU 1
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Fail
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 62/200 — `Wistron-HW-00066-V004` · Items=Repair · TestSet=Power Supply - L10 : Function
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Repair
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Power cord should be unplugged without any problem
2. Power supply should be OFF when power cord is unplugged (FAN should be off. LED should be AMBER.)
3. PSU information in sensor list and SEL of BMC should be correct when power cord is unplugged
4. PSU information in sensor list and SEL of BMC should be correct when power cord is plugged back
5. All the reset PSU should have the same behavior as PSU 1
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Repair
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 63/200 — `Wistron-HW-00067-V004` · Items=Remove · TestSet=Power Supply - L10 : Function
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Remove
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Power cord should be unplugged without any problem
2. Power supply should be removed without any problem
3. Power supply should be OFF when power cord is unplugged (FAN and LED should be OFF)
4. PSU information in sensor list and SEL of BMC should be correct when PSU is removed
5. Power supply should be inserted without any problem
6. PSU information in sensor list and SEL of BMC should be correct when power cord is plugged back
7. All other modules in use should keep working without any interference
8. All reset of PSU should have the same behavior as PSU 1
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Remove
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 64/200 — `Wistron-HW-00068-V004` · Items=Insert · TestSet=Power Supply - L10 : Function
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Insert
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Power cord should be unplugged without any problem
2. Power supply should be removed without any problem
3. Power supply should be OFF when power cord is unplugged (FAN and LED should be OFF)
4. PSU information in sensor list and SEL of BMC should be correct when PSU is removed
5. Power supply should be inserted without any problem
6. PSU information in sensor list and SEL of BMC should be correct when power cord is plugged back
7. All other modules in use should keep working without any interference
8. All reset of PSU should have the same behavior as PSU 1
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Insert
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 65/200 — `Wistron-HW-00069-V004` · Items=Power supply fan failure · TestSet=Power Supply - L10 : Function
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Power supply fan failure
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. PSU information in sensor list and SEL of BMC should be correct when PSU FAN is jammed
2. PSU LED should be AMBER when FAN failure.
3. PSU LED should be GREEN after removed the obstruction and replug power cord.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power supply fan failure
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 66/200 — `Wistron-HW-00070-V004` · Items=FW upgrade/downgrade · TestSet=Power Supply - L10 : Function
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:FW upgrade/downgrade
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Login BMC webUI successfully.
2. Find the page.
3. PSU firmware update successfully without issue.
4. SUT can power cycle without issue.
- Q6 補什麼:ipmitool, PSU FW image (user-provided)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:FW upgrade/downgrade
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- PSU firmware upgrade/downgrade is a multi-step flash (place the user-supplied PSU FW image on the DUT, run the vendor/BMC flash command) that resets the PSU; needs the`
- 📤 產出人:
  log 取位:return FULL ipmitool PSU sensor/FW-version readback after the user completes the PSU FW flash, so the user confirms the new/downgraded FW ve
  risk:RISK: PSU FW flash resets the PSU and momentarily drops its output; only run in a maintenance window with the confirmed image and a recovery
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 67/200 — `Wistron-HW-00071-V005` · Items=PSU rule redundent · TestSet=Power Supply - L10 : Function
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:PSU rule redundent
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. System should be unable to power on with 2PSU
2. System should not shutdowm when hot-remove one PSU
3. System should shutdowm when hot-remove two PSU
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:PSU rule redundent
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 68/200 — `Wistron-HW-00072-V003` · Items=Power on with two sockets · TestSet=Processor
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Power on with two sockets
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. System can power on normally with full CPU.
2. CPU information should match with SPEC.
3. Core/Thread should be correct as the setting in BIOS setup menu.
- Q6 補什麼:numactl util-linux
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power on with two sockets
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "lscpu 2>&1 | grep -iE "socket|core|model name"; echo ---; ls /sys/devices/system/cpu 2>&1 | head`
- 📤 產出人:
  log 取位:return FULL lscpu socket count + NUMA topology so the user confirms two CPU sockets are populated and enumerated; the physical install of th
  risk:RISK: reading socket/NUMA is read-only; the physical dual-socket install is operator.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 69/200 — `Wistron-HW-00073-V002` · Items=Frequency · TestSet=Processor
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:Frequency
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. CPU can be install  in motherboard normally.2. CPU information can check in setup menu and follow spec. (for example : socket 0 ,1)3, CPU information can check in OS successfully.
- Q6 補什麼:util-linux (lscpu) dmidecode
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Frequency
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "lscpu 2>&1 | grep -iE "model name|cpu mhz|max mhz|min mhz"; echo ---; cat /proc/cpuinfo | grep -`
- 📤 產出人:
  log 取位:return FULL Frequency output (lscpu 2>&1 | grep -iE "model name|cpu mhz|max mhz|min mhz") so the user confirms the value(s) match the spec/d
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 70/200 — `Wistron-HW-00074-V002` · Items=Last Level Cache · TestSet=Processor
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:Last Level Cache
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. CPU can be install  in motherboard normally.2. CPU information can check in setup menu and follow spec. (for example : socket 0 ,1)3, CPU information can check in OS successfully.
- Q6 補什麼:util-linux (lscpu) dmidecode
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Last Level Cache
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "lscpu 2>&1 | grep -iE "cache" 2>&1"`
- 📤 產出人:
  log 取位:return FULL Last Level Cache output (lscpu 2>&1 | grep -iE "cache") so the user confirms the value(s) match the spec/datasheet. No RISK (rea
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 71/200 — `Wistron-HW-00075-V002` · Items=Core number · TestSet=Processor
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:Core number
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. CPU can be install  in motherboard normally.2. CPU information can check in setup menu and follow spec. (for example : socket 0 ,1)3, CPU information can check in OS successfully.
- Q6 補什麼:util-linux (lscpu) dmidecode
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Core number
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "lscpu 2>&1 | grep -iE "^CPU\(s\)|core|socket|thread|model name" 2>&1"`
- 📤 產出人:
  log 取位:return FULL Core number output (lscpu 2>&1 | grep -iE "^CPU\(s\)|core|socket|thread|model name") so the user confirms the value(s) match the
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 72/200 — `Wistron-HW-00076-V002` · Items=CPU Error LED · TestSet=Processor
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:CPU Error LED
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1.LED location should match motherboard spec.
2.LED working mode need to match SPEC
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:CPU Error LED
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 73/200 — `Wistron-HW-00077-V002` · Items=Install test · TestSet=Processor
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Install test
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. CPU size is follow spec , and can install in motherboard.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Install test
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 74/200 — `Wistron-HW-00078-V002` · Items=Remove test · TestSet=Processor
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Remove test
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. CPU size is follow spec , and can remove in motherboard.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Remove test
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 75/200 — `Wistron-HW-00079-V002` · Items=Mechanical Check(每個socket皆需要) · TestSet=Processor
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Mechanical Check(每個socket皆需要)
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Heatsink can lock down CPU .
2. CPU information can show correctly.
3. Remove CPU on heatsink normally.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Mechanical Check(每個socket皆需要)
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 76/200 — `Wistron-HW-00080-V003` · Items=CPU Stress · TestSet=Processor
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:CPU Stress
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. System can power on without error2. Slot number is correct in BIOS/BMC/OS 3. system still can work without error4. No error in BMC log
- Q6 補什麼:stress-ng (amdsst for AMD SST - user installs)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:CPU Stress
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "stress-ng --cpu $(nproc) --timeout 600s 2>&1 | tail 2>&1"`
- 📤 產出人:
  log 取位:return FULL stress-tool run summary (stress-ng metrics tail) so the user confirms the CPU survived the stress without throttling/hang; long-
  risk:RISK: long CPU stress raises core temps/power; confirm adequate cooling and user approval before the run.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 77/200 — `Wistron-HW-00081-V003` · Items=CPU Stress - AMDSST · TestSet=Processor
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:CPU Stress - AMDSST
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:System should be workable and no error message in system log after stress
- Q6 補什麼:stress-ng (amdsst for AMD SST - user installs)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:CPU Stress - AMDSST
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "amdsst -p 2>&1 | tail -30; echo ---; amdsst -s 600 2>&1 | tail -30 2>&1"`
- 📤 產出人:
  log 取位:return FULL stress-tool run summary (AMDSST result tail) so the user confirms the CPU survived the stress without throttling/hang; long-run 
  risk:RISK: long CPU stress raises core temps/power; confirm adequate cooling and user approval before the run.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 78/200 — `Wistron-HW-00082-V004` · Items=CPU Stress - Stress-NG · TestSet=Processor
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:CPU Stress - Stress-NG
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:After stress, system should be workable, and no unexpected error message generates.
- Q6 補什麼:stress-ng (amdsst for AMD SST - user installs)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:CPU Stress - Stress-NG
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "stress-ng --cpu 0 --timeout 600s --metrics-brief 2>&1 | tail 2>&1"`
- 📤 產出人:
  log 取位:return FULL stress-tool run summary (stress-ng metrics tail) so the user confirms the CPU survived the stress without throttling/hang; long-
  risk:RISK: long CPU stress raises core temps/power; confirm adequate cooling and user approval before the run.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 79/200 — `Wistron-HW-00083-V004` · Items=RDIMM · TestSet=Memory
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:RDIMM
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Total memory number and size should be correct as DIMM installed.
2. Total available memory size should be the same in the output of meminfo and free.
3. Need to confirm: slot 1 to slot 24
- Q6 補什麼:dmidecode
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:RDIMM
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "sudo dmidecode -t memory 2>&1"`
- 📤 產出人:
  log 取位:return FULL raw `dmidecode -t memory` output (each DIMM: size/type/speed/rank/slot) so user confirms total memory number+size match installe
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 80/200 — `Wistron-HW-00084-V003` · Items=3DS RDIMM · TestSet=Memory
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:3DS RDIMM
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Total memory number and size should be correct as DIMM installed.
2. Total available memory size should be the same in the output of meminfo and free.
3. Need to confirm: slot 1 to slot 24
- Q6 補什麼:dmidecode
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:3DS RDIMM
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "sudo dmidecode -t memory 2>&1"`
- 📤 產出人:
  log 取位:return FULL raw `dmidecode -t memory` output (each DIMM: size/type/speed/rank/slot) so user confirms total memory number+size match installe
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 81/200 — `Wistron-HW-00085-V003` · Items=MRDIMM · TestSet=Memory
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:MRDIMM
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Total memory number and size should be correct as DIMM installed.
2. Total available memory size should be the same in the output of meminfo and free.
3. Also remind you that Genoa CPU can’t test with 6400 DIMM, please use 5600 DIMM with Genoa.
4. Need to confirm: slot 1 to slot 24
- Q6 補什麼:dmidecode
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:MRDIMM
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "sudo dmidecode -t memory 2>&1"`
- 📤 產出人:
  log 取位:return FULL raw `dmidecode -t memory` output (each DIMM: size/type/speed/rank/slot) so user confirms total memory number+size match installe
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 82/200 — `Wistron-HW-00086-V002` · Items=Memory Slot · TestSet=Memory
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:Memory Slot
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:All memoty slot should be checked
Memory information should be correct in the slot.
- Q6 補什麼:dmidecode
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Memory Slot
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "sudo dmidecode -t memory 2>&1"`
- 📤 產出人:
  log 取位:return FULL raw `dmidecode -t memory` output (each DIMM: size/type/speed/rank/slot) so user confirms total memory number+size match installe
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 83/200 — `Wistron-HW-00087-V002` · Items=Power on with patial memory(1DPC) · TestSet=Memory
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:Power on with patial memory(1DPC)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. System can power on normally with patial memory.
2. Memory information should be correct in the slot.
- Q6 補什麼:dmidecode + procps (free)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power on with patial memory(1DPC)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "sudo dmidecode -t memory 2>&1; echo ---; free -m 2>&1"`
- 📤 產出人:
  log 取位:return FULL `dmidecode -t memory` + `free -m` output after powering on with full memory so user confirms the SUT powers on normally and memo
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 84/200 — `Wistron-HW-00088-V002` · Items=Power on with full memory · TestSet=Memory
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:Power on with full memory
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. System can power on normally with full memory.
2. Memory information should be correct in the slot.
- Q6 補什麼:dmidecode + procps (free)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power on with full memory
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "sudo dmidecode -t memory 2>&1; echo ---; free -m 2>&1"`
- 📤 產出人:
  log 取位:return FULL `dmidecode -t memory` + `free -m` output after powering on with full memory so user confirms the SUT powers on normally and memo
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 85/200 — `Wistron-HW-00089-V003` · Items=Memory Stress - AMDSST · TestSet=Memory
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Memory Stress - AMDSST
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:System should be workable and no error message in system log after stress
- Q6 補什麼:AMDSST (AMD tool) + user-provided binary/config
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Memory Stress - AMDSST
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Memory Stress - AMDSST: run the AMD System Stress Test (AMDSST) which is a specialized AMD memory-stress tool; agent needs it installed, then runs the stress and check`
- 📤 產出人:
  log 取位:return the AMDSST run log + post-stress dmesg/mcelog (no MC errors) so user confirms no error after stress.
  risk:RISK: memory stress is long-running and heat/power intensive; ensure the SUT is dedicated + cooled.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 86/200 — `Wistron-HW-00090-V004` · Items=Memory Stress - Stress-NG · TestSet=Memory
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Memory Stress - Stress-NG
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. SUT should be workable after stress.
2. There should be no badblock after stress.
3. There should be no error message in system event log.
- Q6 補什麼:stress-ng
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Memory Stress - Stress-NG
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Memory Stress - Stress-NG: run memory stress with `stress-ng --mem-alloc/all` for a fixed duration, then check dmesg/mcelog for errors/badblocks. Agent runs the stress`
- 📤 產出人:
  log 取位:return the stress-ng summary (workers/tests/bogo-ops/bad) + post-stress dmesg/mcelog so user confirms no badblock/error.
  risk:RISK: memory stress is long-running and heat/power intensive; the SUT must be dedicated + cooled.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 87/200 — `Wistron-HW-00091-V002` · Items=NIC LED Check (Link) · TestSet=NIC (Network)
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:NIC LED Check (Link)
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. OFF - Link is not eastablished or System is OFF
2. LED color should match the speed definition
3. Need to confirm: 1G Lan, PDB BMC NIC, BMC dedicate NIC
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:NIC LED Check (Link)
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 88/200 — `Wistron-HW-00092-V002` · Items=NIC LED Check (Activity) · TestSet=NIC (Network)
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:NIC LED Check (Activity)
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. OFF - No network activity
2. Green (Blinking) - Linked and activity on the network
3. Need to confirm: 1G Lan, PDB BMC NIC, BMC dedicate NIC
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:NIC LED Check (Activity)
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 89/200 — `Wistron-HW-00093-V002` · Items=NIC Speed & LED · TestSet=NIC (Network)
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:NIC Speed & LED
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. OFF - Link is not eastablished or System is OFF
2. LED color should match the speed definition
    - 100 Mbps -> Off
    - 1000 Mbps -> Green Solid on
    - 10000 Mbps -> Off
3. After change NIC speed, need to check OS dmesg and ethtool log.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:NIC Speed & LED
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 90/200 — `Wistron-HW-00094-V003` · Items=MAC Address · TestSet=NIC (Network)
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:MAC Address
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:MAC Addresses in both OS & BIOS should be correct.
- Q6 補什麼:iproute2 (ip, usually present)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:MAC Address
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "ip -o link 2>&1 | grep -vE "lo:|docker|veth" 2>&1"`
- 📤 產出人:
  log 取位:return `ip -o link` MAC addresses for all physical NICs so the user confirms the OS MAC matches the BIOS/asset MAC. (BIOS MAC is read in Set
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 91/200 — `Wistron-HW-00095-V002` · Items=Link flap · TestSet=NIC (Network)
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Link flap
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. NIC should work when it link up and not work when it link down
2. NIC should still be normal after 5 times link flap
3. BMC network should work without problem during test.
4. Need to confirm: 1G Lan, PDB BMC NIC, BMC dedicate NIC
- Q6 補什麼:iproute2 (ip)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Link flap
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Link flap: repeat link up/down 5x per port via sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "for i in $(seq 1 5); do ip link set ${IFACE:?o`
- 📤 產出人:
  log 取位:return the 5x link flap loop output (link state per iteration) + final `ip link show` + BMC ping check so the user confirms the NIC and BMC 
  risk:RISK: link flapping drops networking on that port 5x; use a non-management test port to avoid losing the SSH session.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 92/200 — `Wistron-HW-00096-V002` · Items=Driver reload · TestSet=NIC (Network)
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Driver reload
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Network interface should be removed when driver unload and should be identified when driver loaded.
2. BMC network should work without problem during test.
3. Need to confirm: 1G Lan
- Q6 補什麼:the NIC kernel driver (present) + rescan support
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Driver reload
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Driver reload: unload/reload the NIC driver 5x per port via sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "for i in $(seq 1 5); do echo 1 > `
- 📤 產出人:
  log 取位:return the 5x unload/reload loop output (interface present/absent each iteration) so the user confirms the driver reloads cleanly and the BM
  risk:RISK: removing a NIC driver drops that interface during the test; use a secondary port and never the SSH/management NIC.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 93/200 — `Wistron-HW-00097-V003` · Items=Check bandwidth · TestSet=NIC (Network)
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Check bandwidth
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Bandwidth should match with SPEC definition.
2. Need to confirm: 1G Lan
- Q6 補什麼:iperf3 (Ethernet) or Mellanox OFED ib_write_bw (IB) + a reachable 2nd host
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Check bandwidth
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Check bandwidth: for Ethernet run iPerf against a 2nd host sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "iperf3 -c ${PEER_IP:?operator must`
- 📤 產出人:
  log 取位:return the iperf3/ib_write_bw throughput result so the user confirms it matches the spec. Needs the 2nd-host IP/tool from the user.
  risk:RISK: high-bandwidth test saturates the link; run only against a dedicated peer host, not production traffic.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 94/200 — `Wistron-HW-00098-V004` · Items=VGA - Resolution test · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:VGA - Resolution test
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Resolutions should be changed successfully and monitor should display correctly (No moire, screen flicker or color difference).
- Q6 補什麼:x11-utils mesa-utils xrandr
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:VGA - Resolution test
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "xrandr --query 2>&1; echo ---; cat /sys/class/drm/card*/modes 2>/dev/null | head 2>&1"`
- 📤 產出人:
  log 取位:return FULL `xrandr --query` + DRM modes so the user confirms the VGA resolution options/current mode; actually changing the on-screen resol
  risk:RISK: display tests need a physical monitor head + a person to observe rendering; agent runs the read-only/headless probe for mode/status ev
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 95/200 — `Wistron-HW-00099-V003` · Items=Front and Rear_Resolution Multiplexing Functionality · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Front and Rear_Resolution Multiplexing Functionality
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. To verify that you can hot plug a monitor into a multiple VGA port system without loss of video functionality and with proper detection of monitors.
2. Only one VGA port is driven at a time and the front VGA port overrides the back VGA port when both are connected.
- Q6 補什麼:x11-utils mesa-utils xrandr
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Front and Rear_Resolution Multiplexing Functionality
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "xrandr --query 2>&1; cat /sys/class/drm/card*/modes 2>/dev/null; for m in /sys/class/drm/card*/s`
- 📤 產出人:
  log 取位:return FULL `xrandr` + DRM connector status/modes to identify the front/rear display mux present; confirming mux switching output actually m
  risk:RISK: display tests need a physical monitor head + a person to observe rendering; agent runs the read-only/headless probe for mode/status ev
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 96/200 — `Wistron-HW-00100-V003` · Items=VGA - Screensaver test · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:VGA - Screensaver test
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. System should enter screensaver after time-out of system idle.
2. System should display logon screen when resume.
3. System should be logged in successfully.
- Q6 補什麼:x11-utils mesa-utils xrandr
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:VGA - Screensaver test
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "echo ---dpms---; for m in /sys/class/drm/card*/status; do echo $m=$(cat $m 2>/dev/null); done 2>`
- 📤 產出人:
  log 取位:return FULL DRM connector status before/after a screensaver/DPMS cycle; observing the screensaver render on the physical monitor needs a per
  risk:RISK: display tests need a physical monitor head + a person to observe rendering; agent runs the read-only/headless probe for mode/status ev
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 97/200 — `Wistron-HW-00101-V003` · Items=VGA - Stress test · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:VGA - Stress test
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. The on-board VGA should still be detected after stress.
2. System should be OK and no error message after stress.
- Q6 補什麼:x11-utils mesa-utils xrandr
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:VGA - Stress test
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "glxinfo -B 2>&1 | head -40; echo ---; glxgears -info 2>&1 & sleep 10; kill %1 2>/dev/null 2>&1"`
- 📤 產出人:
  log 取位:return FULL glxinfo + a short glxgears run so the user confirms VGA/GPU renders under stress without error; a long visual stress needs a per
  risk:RISK: display tests need a physical monitor head + a person to observe rendering; agent runs the read-only/headless probe for mode/status ev
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 98/200 — `Wistron-HW-00102-V003` · Items=Onboard power LED · TestSet=L10 System - LED
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Onboard power LED
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Onboard power LED should be GREEN without flashing when SUT is on.
2. Onboard power LED should be AMBER without flashing when SUT is off.
3. Onboard power LED should be off after remove AC power cable form SUT.
- Q6 補什麼:ipmitool chassis power (agent) + person for LED observation
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Onboard power LED
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Onboard power LED: requires powering the system on/off to observe the LED color. Agent can power the SUT on/off via `sudo ipmitool chassis power` and read power state,`
- 📤 產出人:
  log 取位:return the power-state change + LED color/blink observed by the operator at each power state so user confirms it matches SPEC.
  risk:RISK: powering the SUT on/off affects availability; confirm the SUT is free.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 99/200 — `Wistron-HW-00103-V004` · Items=UID (include rear and front) · TestSet=L10 System - LED
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:UID (include rear and front)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. UID LED should be bright Blue when turning on manually
2. UID LED should be OFF when turning off manually
3. UID LED should be bright Blue when turning on by IPMI command
4. UID LED should be OFF when turning on by IPMI command
- Q6 補什麼:ipmitool (or curl for Redfish)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:UID (include rear and front)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- UID (include rear and front): drive the UID/identify LED with `sudo ipmitool chassis identify <on|off>` (or Redfish IndicatorLED PATCH), then confirm color (Blue) + bl`
- 📤 產出人:
  log 取位:return the `ipmitool chassis identify` result + indicator-LED state readback (and note the LED color seen) so user confirms the Blue UID LED
  risk:RISK: turning the UID LED on/off changes an indicator state; restore it to Off after the check.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 100/200 — `Wistron-HW-00104-V003` · Items=Post code LED · TestSet=L10 System - LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Post code LED
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Post code led will light during system power on.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Post code LED
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 101/200 — `Wistron-HW-00105-V003` · Items=BMC heart beat LED · TestSet=L10 System - LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:BMC heart beat LED
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:The LED should be GREEN with flashing.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:BMC heart beat LED
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 102/200 — `Wistron-HW-00106-V003` · Items=PDB BMC heart beat LED · TestSet=L10 System - LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:PDB BMC heart beat LED
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:The LED should be GREEN with flashing.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:PDB BMC heart beat LED
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 103/200 — `Wistron-HW-00107-V003` · Items=CPU node LED · TestSet=L10 System - LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:CPU node LED
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:The fault LED will response the system fault status.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:CPU node LED
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 104/200 — `Wistron-HW-00108-V003` · Items=DUT node LED · TestSet=L10 System - LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:DUT node LED
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:The fault LED will response the system fault status.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:DUT node LED
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 105/200 — `Wistron-HW-00109-V003` · Items=BMC UART debugging · TestSet=Debug Console
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:BMC UART debugging
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Output of console should be human readable
2. Should be able to control SUT in console mode via keyboard.
- Q6 補什麼:physical USB-UART debug cable (human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:BMC UART debugging
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- BMC UART debugging: BMC UART debugging requires a physical serial console (USB-UART) attached to the BMC debug header; the agent has no physical UART and cannot observ`
- 📤 產出人:
  log 取位:operator captures the BMC UART serial-boot log; agent cannot produce serial capture over SSH. (context: BMC-UART-debug (Debug Console set))
  risk:RISK: physical debug UART operation is human-only; do not attempt via SSH.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 106/200 — `Wistron-HW-00110-V002` · Items=PCIe slot check ( x16 on slot 1 to 10) · TestSet=MB  PCIE Slot
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:PCIe slot check ( x16 on slot 1 to 10)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. PCIe device information should show correctly in BIOS, uEFI shell and OS
2. Link status and speed should match the SPEC definition.
- Q6 補什麼:lspci (busybox/pciutils)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:PCIe slot check ( x16 on slot 1 to 10)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- PCIe slot check (x16 on slot 1 to 10): agent can auto-dump the OS-side PCIe device+link info sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "`
- 📤 產出人:
  log 取位:return lspci -vvv LnkCap/LnkSta + the PCIe device list so the operator confirms widths/speeds on slots 1..10 match SPEC; the BIOS/uEFI-shell
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 107/200 — `Wistron-HW-00111-V005` · Items=Set Fan Speed Control · TestSet=Cooling System
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Set Fan Speed Control
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Commands should be sent without any error.
2. Make sure the result by Get Fan Speed Control command is align with setting.
- Q6 補什麼:ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Set Fan Speed Control
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" raw 0x30 0x81 0x1 0xf8 0x0 0x24 0x32 2>&1 ; echo ---check---; ipmitool -I lanplus -C 17 -H "$BMC_IP" `
- 📤 產出人:
  log 取位:return FULL ipmitool raw response for the fan-speed-control set + the get readback (0x30 0x22) so the user confirms the fan control mode was
  risk:RISK: this sets the BMC fan control to the specified mode (0x81 set + 0x22 get pattern); state-changing fan behavior - confirm the mode valu
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 108/200 — `Wistron-HW-00112-V004` · Items=Get Fan Speed Control · TestSet=Cooling System
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:Get Fan Speed Control
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Commands should be sent without any error.
2. Make sure the parameter should be as same as setting.
- Q6 補什麼:ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Get Fan Speed Control
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" raw 0x30 0x22 2>&1`
- 📤 產出人:
  log 取位:return FULL `ipmitool raw 0x30 0x22` response (fan control mode bytes) so the user confirms the get fan control value matches spec. No RISK 
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 109/200 — `Wistron-HW-00113-V004` · Items=Manually FAN speed control · TestSet=Cooling System
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Manually FAN speed control
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. FAN speed percentage should be displayed correctly as setting.
2. No FAN speed log when using manaul setting
- Q6 補什麼:ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Manually FAN speed control
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" raw 0x30 0x31 0x01 ${FAN_DUTY:?operator must set fan duty, e.g. 0x00=0% / 0x14=20% / 0x32=50% / 0x64=`
  `---read back---`
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" raw 0x30 0x32 2>&1`
- 📤 產出人:
  log 取位:return FULL ipmitool raw response for manual fan duty set + readback (0x32) so the user confirms the manual duty took effect; the user suppl
  risk:RISK: setting manual fan duty changes cooling behavior immediately; confirm the duty value with the user and restore automatic fan control a
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 110/200 — `Wistron-HW-00114-V004` · Items=Critical Sensor_FAN · TestSet=Cooling System
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Critical Sensor_FAN
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1.Check FAN1 sensor  presented on here
2. Make sure sensors can present on here during trigegr critical event
- Q6 補什麼:ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Critical Sensor_FAN
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" sensor list 2>&1 | grep -iE "fan|FAN" ; echo ---sel---; ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$B`
- 📤 產出人:
  log 取位:return FULL ipmitool fan sensor list + SEL fan/threshold entries so the user verifies the critical-fan sensor threshold and whether a critic
  risk:RISK: this reads current fan sensor/threshold state; the actual fan-critical event injection is physical and done by the operator - agent on
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 111/200 — `Wistron-HW-00115-V004` · Items=Fan speed (in RPM) · TestSet=Cooling System
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:Fan speed (in RPM)
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Sensor value should be OK in the reasonable range.
2. Sensor value is same as ipmi sdr command and web ui
3. SEL should have an event log when sensor reach to threshold.
- Q6 補什麼:ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Fan speed (in RPM)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" sdr list 2>&1 | grep -iE "fan" ; echo ---; ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "`
- 📤 產出人:
  log 取位:return FULL ipmitool fan SDR/sensor values (RPM) so the user confirms each fan speed is within the expected RPM band. No RISK (read-only).
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 112/200 — `Wistron-HW-00116-V005` · Items=Fan speed change test with power assume. · TestSet=Cooling System
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Fan speed change test with power assume.
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Make sure fan speed would change with different power consumption.
- Q6 補什麼:ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Fan speed change test with power assume.
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `# agent host: sample fan RPM now, apply a brief CPU load on the DUT, then re-sample`
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" sdr list 2>&1 | grep -iE "fan"`
  `---load (DUT, 30s)---`
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "sudo stress-ng --cpu $(nproc) --timeout 30s 2>&1 & sleep 40"`
  `---after (agent host)---`
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" sdr list 2>&1 | grep -iE "fan"`
- 📤 產出人:
  log 取位:return FULL fan-RPM snapshots monitoring fan RPM as power/load changes (before + after a load/duty change) so the user confirms fan speed re
  risk:RISK: this observes fan RPM under load/duty changes; for the Manual case setting fan duty is a state change - restore auto control after.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 113/200 — `Wistron-HW-00117-V003` · Items=Redundant /normal FAN exist in BIOS/BMC · TestSet=Cooling System
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Redundant /normal FAN exist in BIOS/BMC
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. No error during POST
2. Check fan rule in Spec
3. Check fan information in BMC
- Q6 補什麼:ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Redundant /normal FAN exist in BIOS/BMC
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" sdr elist 2>&1 | grep -iE "fan|redund" ; echo ---sel---; ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$`
- 📤 產出人:
  log 取位:return FULL ipmitool fan SDR + SEL so the user confirms redundant/normal fan presence is reported correctly in BMC; the BIOS-setup fan-avail
  risk:RISK: fan presence/redundancy state is read over IPMI; the BIOS-screen portion requires the operator to view BIOS.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 114/200 — `Wistron-HW-00118-V003` · Items=Hot plug/non hot plug FAN  exist  in BIOS/BMC log · TestSet=Cooling System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Hot plug/non hot plug FAN  exist  in BIOS/BMC log
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. No error during POST
2. Check fan rule in Spec
3. Check fan information in BMC
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Hot plug/non hot plug FAN  exist  in BIOS/BMC log
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 115/200 — `Wistron-HW-00119-V003` · Items=FAN LED · TestSet=Cooling System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:FAN LED
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:check fan led as Spec
fan LED should be blink or green
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:FAN LED
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 116/200 — `Wistron-HW-00120-V003` · Items=FAN speed/number/location in BMC · TestSet=Cooling System
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:FAN speed/number/location in BMC
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check fan speed/location in BMC webpage
- Q6 補什麼:ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:FAN speed/number/location in BMC
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" sdr list 2>&1 | grep -iE "fan" ; echo ---loc---; ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER`
- 📤 產出人:
  log 取位:return FULL ipmitool fan SDR + SEL elist + FRU fan lines so the user confirms fan speed/number/location reported by BMC matches the physical
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 117/200 — `Wistron-HW-00121-V003` · Items=Fan failure · TestSet=Cooling System
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Fan failure
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Fan information in sensor list and SEL of BMC should be correct when fan is jammed
2. Fan information in sensor list and SEL of BMC should be correct when fan is back to normal state
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Fan failure
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 118/200 — `Wistron-HW-00122-V003` · Items=Heating temperature sensor · TestSet=Feature
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Heating temperature sensor
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. fan speed get faster and faster
2. System will restart
3. Make sure system can boot again
- Q6 補什麼:thermal control equipment (physical)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Heating temperature sensor
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Heating temperature sensor: the heating-temp-sensor test heats the chassis with an external heat/thermal source and observes the sensor response; requires physical env`
- 📤 產出人:
  log 取位:operator applies heat and records the sensor read; agent cannot apply physical heat over SSH.
  risk:RISK: external heating requires thermal safety precautions; human-only.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 119/200 — `Wistron-HW-00123-V002` · Items=Fan Fail protection · TestSet=Feature
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Fan Fail protection
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Make sure Fan would change speed when some fan fail
2. Make sure fan would be adjust its speed to orginal when the problem is solved
- Q6 補什麼:ipmitool + BMC creds + operator (fail a fan)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Fan Fail protection
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Fan Fail protection: with a fan faulted by the operator, confirm the fan-fail protection response via ipmitool -I lanplus -C 17 -U "$BMC_USER" -P "$BMC_PASS" -H "$BMC_`
- 📤 產出人:
  log 取位:return the fan-fault SEL + the fan-speed response so the user confirms the fan-fail protection acted (alarm/ramp).
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 120/200 — `Wistron-HW-00124-V003` · Items=Power Button · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Power Button
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Node should power on after pressing power button when power status is off.
2. Node should boot into OS successfully when power on.
3. Node should be force off after pressing power button and hold over 4 seconds when power status is on.
4. Node that is off should be power on and the node that is on should keep on state after pressing power button one time.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power Button
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 121/200 — `Wistron-HW-00125-V003` · Items=UID switch button ( Include Front and Rear ) · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:UID switch button ( Include Front and Rear )
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. UID should be ON after press UID button when UID is off
2. UID should be OFF after press UID button when UID is on
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:UID switch button ( Include Front and Rear )
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 122/200 — `Wistron-HW-00126-V003` · Items=USB hot plug test of all ports · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:USB hot plug test of all ports
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. All USB ports should be plugged devices successfully.
2. All USB devices should be detected and functional when plugged.
3. All information of USB devices should be removed when unplugged.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:USB hot plug test of all ports
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 123/200 — `Wistron-HW-00127-V005` · Items=File transmission USB 3.0 · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:File transmission USB 3.0
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. File should be copied successfully
2. Speed value should be reasonable from USB definition
3. All USB port should match exceed USB 2.0 speed.(60MB/s)
- Q6 補什麼:usbutils
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:File transmission USB 3.0
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- after an operator connects a USB-3.0 storage device, agent copies a test file to/from it and checks speed (needs the mounted USB device path). Agent part: sshpass -p "`
- 📤 產出人:
  log 取位:return FULL `lsusb` list + dmesg USB enumeration lines so the user confirms the File transmission USB 3.0 device(s) appear on the expected p
  risk:RISK: physical USB insertion is operator; agent reads the enumeration/traffic evidence only.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 124/200 — `Wistron-HW-00128-V005` · Items=USB Hub Hot-Plug of all ports · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:USB Hub Hot-Plug of all ports
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. All USB ports should be plugged devices successfully.
2. All USB devices should be detected and functional when plugged.
3. All information of USB devices should be removed when unplugged.
- Q6 補什麼:usbutils
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:USB Hub Hot-Plug of all ports
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- repeated USB add/remove via the kernel is triggered by physical plug; agent reads `dmesg` USB enumeration after the operator hot-plugs. Agent part: sshpass -p "$DUT_PA`
- 📤 產出人:
  log 取位:return FULL `lsusb` list + dmesg USB enumeration lines so the user confirms the USB Hub Hot-Plug of all ports device(s) appear on the expect
  risk:RISK: physical USB insertion is operator; agent reads the enumeration/traffic evidence only.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 125/200 — `Wistron-HW-00129-V003` · Items=System power / status LED · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:System power / status LED
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. System power LED should be OFF when removed AC power
2. System power LED should be blinking with Green when AC on and system should auto power on.
3. System power LED should be Green without blinking after boot into OS.
4. System power LED should be Amber without blinking  when system is off
5. System power LED should be Fast blinking with Amber when system have error
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:System power / status LED
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 126/200 — `Wistron-HW-00130-V003` · Items=UID(include rear and front) · TestSet=Front and Rear Panel
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:UID(include rear and front)
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. UID LED should be bright Blue when turning on manually
2. UID LED should be OFF when turning off manually
3. UID LED should be bright Blue when turning on by IPMI command
4. UID LED should be OFF when turning on by IPMI command
- Q6 補什麼:ipmitool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:UID(include rear and front)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" chassis identify 1 2>&1 ; sleep 5 ; ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PA`
- 📤 產出人:
  log 取位:return FULL ipmitool chassis-identify + chassis-status output so the user confirms the UID (front/rear) LED toggled on and off; the physical
  risk:RISK: chassis identify toggles the physical UID LED (visual for operator); confirming both front+rear LEDs requires a person at the machine.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 127/200 — `Wistron-HW-00131-V004` · Items=Clear CMOS · TestSet=Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Clear CMOS
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Remove the Battery for 5 minutes.
2.Insert the battery again, boot into BIOS, check date/time would be reset.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Clear CMOS
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 128/200 — `Wistron-HW-00132-V003` · Items=AC supplied (power off) · TestSet=RTC Timer
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:AC supplied (power off)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. NTP should be disabled successfully
2. SUT time should be adjusted successfully
3. SUT time should not over or less than 1.73 seconds (1.73 seconds / 24 hours) after idle over 24 hrs
- Q6 補什麼:util-linux (hwclock) systemd (timedatectl)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:AC supplied (power off)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- after the operator cuts and restores AC, reads /dev/rtc vs host clock over the idle dwell. Agent first disables NTP and reads the RTC via sshpass -p "$DUT_PASS" ssh -o`
- 📤 產出人:
  log 取位:return FULL RTC (`hwclock -r`) vs system UTC (`date -u`) timestamps at start and after the dwell so the user computes the drift (<=1.73s/day
  risk:RISK: disabling NTP + comparing RTC is a state change; restore NTP after the dwell, and the AC-cycle portion is a physical operator action.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 129/200 — `Wistron-HW-00133-V003` · Items=System idle · TestSet=RTC Timer
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:System idle
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. NTP should be disabled successfully
2. SUT time should be adjusted successfully
3. SUT time should be accuracy (The tolerance is within 5 secend)
- Q6 補什麼:util-linux (hwclock) systemd (timedatectl)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:System idle
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- RTC drift under 24h system idle. Agent first disables NTP and reads the RTC via sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "timedatectl s`
- 📤 產出人:
  log 取位:return FULL RTC (`hwclock -r`) vs system UTC (`date -u`) timestamps at start and after the dwell so the user computes the drift (<=1.73s/day
  risk:RISK: disabling NTP + comparing RTC is a state change; restore NTP after the dwell, and the AC-cycle portion is a physical operator action.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 130/200 — `Wistron-HW-00134-V002` · Items=System warm reboot test · TestSet=RTC Timer
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:System warm reboot test
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:SUT should not hang during warm reboot.
Information of lspci should not have any change during warm reboot.
SUT should be workable after warm reboot stress.
SUT time should not over or less than 1.73 seconds (1.73 seconds / 24 hours) after idle over 24 hrs.
- Q6 補什麼:util-linux (hwclock) systemd (timedatectl)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:System warm reboot test
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- RTC drift across warm reboots. Agent first disables NTP and reads the RTC via sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "timedatectl set`
- 📤 產出人:
  log 取位:return FULL RTC (`hwclock -r`) vs system UTC (`date -u`) timestamps at start and after the dwell so the user computes the drift (<=1.73s/day
  risk:RISK: disabling NTP + comparing RTC is a state change; restore NTP after the dwell, and the AC-cycle portion is a physical operator action.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 131/200 — `Wistron-HW-00135-V002` · Items=AC lost · TestSet=RTC Timer
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:AC lost
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. NTP should be disabled successfully
2. SUT time should be adjusted successfully
3. SUT time should be accuracy (The tolerance is within 5 secend)
- Q6 補什麼:util-linux (hwclock) systemd (timedatectl)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:AC lost
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- RTC drift after an AC loss/recovery. Agent first disables NTP and reads the RTC via sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "timedatec`
- 📤 產出人:
  log 取位:return FULL RTC (`hwclock -r`) vs system UTC (`date -u`) timestamps at start and after the dwell so the user computes the drift (<=1.73s/day
  risk:RISK: disabling NTP + comparing RTC is a state change; restore NTP after the dwell, and the AC-cycle portion is a physical operator action.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 132/200 — `Wistron-HW-00136-V006` · Items=PROCHOT Thermal Throttling (CPU) · TestSet=Thermal Throttling
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:PROCHOT Thermal Throttling (CPU)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. CPU frequency should be maximum value when runnig CPU stress tool
2. CPU frequency and power usage should become lower when thermal throttling
3. BMC SEL should have log about CPU thermal throttling
4. System should power off without problem
5. System should power on without problem
6. System should work without problem after AC cycle
note: CPU caution1: 95/caution2: 97 /caution3: 99  dgree C
- Q6 補什麼:stress-ng + coreutils
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:PROCHOT Thermal Throttling (CPU)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- PROCHOT Thermal Throttling (CPU): read CPU core temp + clock while loading to observe PROCHOT throttling sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_US`
- 📤 產出人:
  log 取位:return the CPU temp + clock before/during/after the load so the user confirms whether PROCHOT engaged; full PROCHOT assertion may need contr
  risk:RISK: stressing the CPU raises temperature; keep cooling adequate and run briefly.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 133/200 — `Wistron-HW-00137-V004` · Items=Thermal Trip(CPU) · TestSet=Thermal Throttling
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Thermal Trip(CPU)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. System should shutdown when CPU temperature arrive Thermal Trip
2. BMC SEL should have log about Thermal Trip
3. System should power off without problem
4. System should power on without problem
5. System should work without problem after AC cycle
note: CPU caution1: 95/caution2: 97 /caution3: 99  dgree C
- Q6 補什麼:none (physical/thermal operation - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Thermal Trip(CPU)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Thermal Trip(CPU): forced thermal trip (over-temp shutdown) is a fault-injection physical test; requires removing the heatsink/heating the CPU and confirming shutdown.`
- 📤 產出人:
  log 取位:operator evidence (SEL thermal-trip entry + visual/system log); agent cannot reproduce.
  risk:RISK: thermal trip is destructive to the thermal state; human-only.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 134/200 — `Wistron-HW-00138-V004` · Items=PROCHOT Thermal Throttling (GPU) · TestSet=Thermal Throttling
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:PROCHOT Thermal Throttling (GPU)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. GPU frequency should be maximum value when runnig GPU stress tool
2. GPU frequency and power usage should become lower when thermal throttling
3. BMC SEL should have log about GPU thermal throttling ???
4. System should power off without problem
5. System should power on without problem
6. System should work without problem after AC cycle
Note:need to see fan table spec caution1、2、3 value
- Q6 補什麼:nvidia-smi + a GPU stress workload
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:PROCHOT Thermal Throttling (GPU)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- PROCHOT Thermal Throttling (GPU): observe GPU PROCHOT throttling under a GPU stress: sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "nvidia-s`
- 📤 產出人:
  log 取位:return the GPU throttling reason + temp/clock so the user confirms PROCHOT throttling engaged on the GPU under load.
  risk:RISK: GPU thermal stress can overheat; run under user direction with cooling.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 135/200 — `Wistron-HW-00139-V002` · Items=CMOS check · TestSet=Jumper Audit
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:CMOS check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check for Date & Time return to default (minimum) by Remove Battery. (Switch/Jumper will keep that you set.)2. Check the settings you set before test are returned to default. (Remove Battery/Switch/Jumper)3. The PAP/POP should NOT be cleared.4. Check POST event log.
- Q6 補什麼:none (physical inspection - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:CMOS check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- CMOS check: CMOS-jumper check verifies the CMOS clear jumper presence/setting; a physical visual inspection + (if used) clearing CMOS, which needs a person at the boar`
- 📤 產出人:
  log 取位:operator records the CMOS jumper state; agent cannot inspect the board.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 136/200 — `Wistron-HW-00140-V002` · Items=Jumper check · TestSet=Jumper Audit
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Jumper check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Jumper should match with system spec.
- Q6 補什麼:none (physical inspection - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Jumper check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Jumper check: jumper audit (all jumpers correct position/setting) is a physical visual inspection; human-only.`
- 📤 產出人:
  log 取位:operator audits and records all jumpers; agent cannot inspect the board.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 137/200 — `Wistron-HW-00141-V002` · Items=Function Check · TestSet=Jumper Audit
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Function Check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Switch jumper to another pin , systerm still can power onsuccessfully.
2. Jumper need functionaly.
3. Switch jumper to default pin , system should not hang or create error log.
- Q6 補什麼:none (physical jumper action - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Function Check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Function Check: jumper function-check audit requires physically exercising jumpers and observing behaviour; human-only.`
- 📤 產出人:
  log 取位:operator exercises jumper functions and records effects; agent cannot move jumpers.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 138/200 — `Wistron-HW-00142-V002` · Items=Location Check · TestSet=Jumper Audit
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Location Check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Make sure Jumoer location is correct.
- Q6 補什麼:none (physical inspection - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Location Check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Location Check: jumper location audit is a physical visual inspection of all jumper positions; human-only.`
- 📤 產出人:
  log 取位:operator photographs each jumper location; agent cannot inspect hardware.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 139/200 — `Wistron-HW-00143-V002` · Items=Location check · TestSet=Information
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Location check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Make sure Switch location is correct.
- Q6 補什麼:physical access to the switch (operator)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Location check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Location check: visually confirm the switch (location) is in the correct labeled position on the chassis. A physical/visual placement check of a board switch; the agen`
- 📤 產出人:
  log 取位:operator inspects the switch and confirms its location is correct per the label; agent cannot physically locate or view the switch.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 140/200 — `Wistron-HW-00144-V002` · Items=Check switch function about BIOS Password clear. · TestSet=Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Check switch function about BIOS Password clear.
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Switch to another side , systerm still can power onsuccessfully.
2. Switch need functionaly.
3. Switch to orginal side , system should not hang or create error log.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Check switch function about BIOS Password clear.
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 141/200 — `Wistron-HW-00145-V002` · Items=Check switch function about ME recover · TestSet=Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Check switch function about ME recover
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Switch to another side , systerm still can power onsuccessfully.
2. Switch need functionaly.
3. Switch to orginal side , system should not hang or create error log.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Check switch function about ME recover
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 142/200 — `Wistron-HW-00146-V002` · Items=Check switch function about BIOS SPI Write protect · TestSet=Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Check switch function about BIOS SPI Write protect
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Switch to another side , systerm still can power onsuccessfully.
2. Switch need functionaly.
3. Switch to orginal side , system should not hang or create error log.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Check switch function about BIOS SPI Write protect
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 143/200 — `Wistron-HW-00147-V002` · Items=Check switch function about Clear CMOS · TestSet=Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Check switch function about Clear CMOS
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Switch to another side , systerm still can power onsuccessfully.
2. Switch need functionaly.
3. Switch to orginal side , system should not hang or create error log.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Check switch function about Clear CMOS
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 144/200 — `Wistron-HW-00148-V003` · Items=TPM detection · TestSet=TPM
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:TPM detection
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check TPM in BIOS/OS
- Q6 補什麼:none (kernel TPM driver)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:TPM detection
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- TPM detection: the agent reads the OS TPM detection sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "ls -l /dev/tpm0 2>&1; dmesg 2>&1 | grep -`
- 📤 產出人:
  log 取位:return /dev/tpm0 + tpm_version_major + the "found/2.0 TPM" dmesg lines; BIOS TPM setting read by user/KVM.
  risk:RISK: BIOS-side detection check needs a person/KVM; agent provides the OS-equivalent read.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 145/200 — `Wistron-HW-00149-V002` · Items=TPM device on/off and support check · TestSet=TPM
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:TPM device on/off and support check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check TPM can be disable
- Q6 補什麼:none (kernel TPM driver); BIOS access by person/KVM
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:TPM device on/off and support check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- TPM device on/off and support check (TPM enable/disable): toggling the TPM Security Device Enable/Disable is a BIOS Setup action (Advanced -> Trusted Computing) that n`
- 📤 產出人:
  log 取位:return the post-change OS TPM state (dmesg tpm lines + /dev/tpm0) so the user confirms the disable/enable took effect.
  risk:RISK: TPM disable requires BIOS setup + reboot; the change is done by a person/KVM, agent only reads the resulting OS state.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 146/200 — `Wistron-HW-00150-V002` · Items=TPM information check · TestSet=TPM
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:TPM information check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Check basic information, ex: IC, version of Rev TPM ACPI table, TPM Device Interface, Hash Algorithm,......
- Q6 補什麼:none (kernel TPM driver)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:TPM information check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "ls -l /dev/tpm* /dev/tpmrm* 2>&1; echo ---; cat /sys/class/tpm/tpm0/tpm_version_major 2>&1; echo`
- 📤 產出人:
  log 取位:return /dev/tpm* presence + tpm_version_major + the TPM dmesg lines (firmware rev, TPM ACPI table rev, device interface, hash algorithms) so
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 147/200 — `Wistron-HW-00151-V002` · Items=TPM tool testing · TestSet=TPM
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:TPM tool testing
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Test TPM function by vendor tool.
- Q6 補什麼:vendor TPM tool (user provides; e.g. tpm2-tools / vendor diagnostic)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:TPM tool testing
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- TPM tool testing (vendor tool testing): the vendor TPM tool name/procedure is not specified in the library; agent needs the exact vendor tool + invocation from the use`
- 📤 產出人:
  log 取位:return the vendor tool output after the user supplies it; pass/fail judged by the user against the vendor criteria.
  risk:RISK: vendor tool may perform destructive TPM operations; run only after the user specifies the tool and its safety.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 148/200 — `Wistron-HW-00152-V002` · Items=TPM linux command · TestSet=TPM
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:TPM linux command
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Verify can install OS with TPM  device enable.
- Q6 補什麼:OS installer media (user provides) + tpm2-tools (post-OS check)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:TPM linux command
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- TPM linux command (OS install with TPM enabled): verifying a clean OS install with TPM on is a long OS-install task the agent can stage (boot to installer) but needs t`
- 📤 產出人:
  log 取位:return the post-install OS TPM detection (tpm0, dmesg, cryptenroll device list) so the user confirms TPM works with the installed OS.
  risk:RISK: OS install repartitions the disk; run only on a dedicated SUT/drive the user designates.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 149/200 — `Wistron-HW-00153-V002` · Items=OS installing · TestSet=TPM
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:OS installing
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Verify can revise TPM setting or not.
- Q6 補什麼:OS installer media (user provides) + tpm2-tools (post-OS check)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:OS installing
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- OS installing (OS install with TPM enabled): verifying a clean OS install with TPM on is a long OS-install task the agent can stage (boot to installer) but needs the i`
- 📤 產出人:
  log 取位:return the post-install OS TPM detection (tpm0, dmesg, cryptenroll device list) so the user confirms TPM works with the installed OS.
  risk:RISK: OS install repartitions the disk; run only on a dedicated SUT/drive the user designates.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 150/200 — `Wistron-HW-00154-V004` · Items=ROT(PFR) FW Flash · TestSet=ROT - Security mode
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:ROT(PFR) FW Flash
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Verify SUT status after using SF600 flash successfully .
- Q6 補什麼:SF600 ROT flash tool + signed PFR image (user-provided)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:ROT(PFR) FW Flash
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- ROT(PFR) FW Flash (ROT/PFR FW): flash the ROT PFR firmware via the SF600 flash tooling. Agent can verify post-flash SUT status from OS sshpass -p "$DUT_PASS" ssh -o St`
- 📤 產出人:
  log 取位:return the post-flash system status (dmesg tail, uptime, device count) so the user confirms the SUT is stable after the ROT(PFR) FW flash su
  risk:RISK: flashing ROT/PFR firmware is destructive; only use the approved SF600 image and never auto-run during production.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 151/200 — `Wistron-HW-00155-V004` · Items=Security mode · TestSet=ROT - Security mode
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Security mode
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Security mode can be changed successfully.
- Q6 補什麼:mokutil (read-only state check)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Security mode
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Security mode: change the ROT security mode. Agent can only read current state from OS sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "mokuti`
- 📤 產出人:
  log 取位:return the current secure-boot/ROT-related dmesg lines so the user confirms the state before an operator changes the ROT security mode in BI
  risk:RISK: ROT security-mode change needs physical TPM-presence assertion + BIOS setup - operator required; do not auto-run.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 152/200 — `Wistron-HW-00156-V002` · Items=TPM enabled · TestSet=TPM Visiable
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:TPM enabled
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. The TPM can be enabled in BIOS.
2. Check the device exists.
Windows:
The OS has TPM device in device manager.
Linux:
The OS has TPM device in lspci command.
- Q6 補什麼:tpm2-tools (tpm2_getcap) + pciutils
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:TPM enabled
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- TPM enabled: check the TPM is enabled in BIOS then verify the TPM device is visible in OS. Agent can verify the OS-side presence sshpass -p "$DUT_PASS" ssh -o StrictHo`
- 📤 產出人:
  log 取位:return the /dev/tpm* listing + lspci TPM grep + sys TPM flag so the user confirms TPM device should exist on the OS side.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 153/200 — `Wistron-HW-00157-V002` · Items=TPM disbled · TestSet=TPM Visiable
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:TPM disbled
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. The TPM can be disabled in BIOS.
2. Check the device not exists.
Windows:
The OS has no TPM device in device manager.
Linux:
The OS has no TPM device in lspci command.
- Q6 補什麼:tpm2-tools (tpm2_getcap) + pciutils
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:TPM disbled
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- TPM disbled: disabling TPM is done in the BIOS Security/TPM setup page by an operator; the agent can only check OS-side TPM absence after it is disabled sshpass -p "$D`
- 📤 產出人:
  log 取位:return the /dev/tpm* listing + lspci TPM grep + sys TPM flag so the user confirms TPM device should NOT exist on the OS side.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 154/200 — `Wistron-HW-00158-V003` · Items=Vendor Tool Testing · TestSet=Function Check
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Vendor Tool Testing
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:The test result has completed and no error state shown. (0001FFFF)
- Q6 補什麼:tpm2-tools
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Vendor Tool Testing
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "ls -l /dev/tpm0 /dev/tpmrm0 2>&1; echo ---tpm_sysfs---; ls -l /sys/class/tpm/tpm0 2>&1; echo ---`
- 📤 產出人:
  log 取位:return the TPM device nodes (/dev/tpm0, /dev/tpmrm0), the tpm sysfs class, and tpm2_getcap version so the user confirms TPM 2.0 is exposed a
  risk:RISK: the vendor TPM test is an interactive licensed vendor tool; agent cannot drive its menu. Agent does the read-only OS TPM-presence chec
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 155/200 — `Wistron-HW-00159-V003` · Items=Bitlocker Testing · TestSet=Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Bitlocker Testing
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check TPM is enabled in BIOS.
2. The OS has TPM device in device manager.
3. The control panel has bitlocker option.
4. The TPM management has TPM present.
5. The drive can shrin as small as possible.
6. The disk will perform the encrypt process completed.
7. The OS can boot after encrypting the drive without unlock the boot drive.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Bitlocker Testing
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 156/200 — `Wistron-HW-00160-V003` · Items=Bitlocker OS boot · TestSet=Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Bitlocker OS boot
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:The OS cannot boot directally. It shows the bitlocker recovery menu.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Bitlocker OS boot
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 157/200 — `Wistron-HW-00161-V002` · Items=Security mode · TestSet=Security mode
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Security mode
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Security mode can be changed successfully.
- Q6 補什麼:mokutil + tpm2-tools (for read-only state check)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Security mode
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Security mode (sheet-A): change Secure Boot mode/TPM via the BIOS Security page. Agent can read the current secure-boot/TPM state from OS sshpass -p "$DUT_PASS" ssh -o`
- 📤 產出人:
  log 取位:return the secure-boot state (mokutil --sb-state) + TPM device presence so the user confirms the current state before the operator changes t
  risk:RISK: changing Secure Boot mode needs TPM physical-presence assertion (jumper/switch) and BIOS setup access - operator/setup page required; 
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 158/200 — `Wistron-HW-00162-V002` · Items=Install OS · TestSet=Security mode
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Install OS
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1.SUT can install OS, DD and FW successfully with Security boot Enabled
2. CSM disabled and secure boot Standard Mode. And then reboot into OS normal without any warning/error.
- Q6 補什麼:Windows Server ISO + install media; mokutil (for pre-check)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Install OS
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Install OS sheet-A (Secure Boot enabled): install Windows Server with Secure Boot/TPM on the SUT. Agent can pre-check the secure-boot state from OS sshpass -p "$DUT_PA`
- 📤 產出人:
  log 取位:return the pre-install secure-boot status (SecureBoot state + Setup Mode) so the user confirms CSM disabled / Secure Boot Standard Mode befo
  risk:RISK: OS install wipes the boot disk; do not auto-run without an approved ISO and backup of the current OS.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 159/200 — `Wistron-HW-00166-V003` · Items=Power LED · TestSet=L10 System - LED
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Power LED
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. LED working mode need to match SPEC • Off = No AC, system off• Blue = Powered on
- Q6 補什麼:ipmitool chassis power (agent) + person for LED observation
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power LED
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Power LED: requires powering the system on/off to observe the LED color. Agent can power the SUT on/off via `ipmitool chassis power` and read power state, but the LED `
- 📤 產出人:
  log 取位:return the power-state change + LED color/blink observed by the operator at each power state so user confirms it matches SPEC.
  risk:RISK: powering the SUT on/off affects availability; confirm the SUT is free.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 160/200 — `Wistron-HW-00168-V003` · Items=ME · TestSet=L10 System - LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:ME
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. LED working mode need to match SPEC
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:ME
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 161/200 — `Wistron-HW-00169-V003` · Items=FPGA · TestSet=L10 System - LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:FPGA
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. LED working mode need to match SPEC
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:FPGA
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 162/200 — `Wistron-HW-00170-V002` · Items=Power on · TestSet=Button Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Power on
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. SUT should power on without any error.
2. SUT should power off normally.
3. SUT should be forced power off immediately.
- Q6 補什麼:none (physical button - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power on
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Power on: pressing the physical power button to power on/off requires a person at the machine; agent cannot press the button.`
- 📤 產出人:
  log 取位:operator presses the power button + records the power-on result; agent cannot press hardware buttons.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 163/200 — `Wistron-HW-00171-V002` · Items=UID · TestSet=Button Function Check
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:UID
- Q2 位置:agent-host(OOB/BMC)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. UID button should lit.
- Q6 補什麼:ipmitool + BMC creds + operator (visual LED)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:UID
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- UID: the UID button toggles the front/back UID LED; agent can toggle the UID state via ipmitool -I lanplus -C 17 -U "$BMC_USER" -P "$BMC_PASS" -H "$BMC_IP" raw 0x30 0x`
- 📤 產出人:
  log 取位:return the UID set response + operator confirmation the LED toggled; agent cannot see the LED.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 164/200 — `Wistron-HW-00172-V002` · Items=Error · TestSet=Button Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Error
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Error button should lit.
- Q6 補什麼:none (physical - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Error
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Error: the front error/status button/indicator is tested by observing/clearing the fault LED (visual) or pressing it physically; human observation required.`
- 📤 產出人:
  log 取位:operator observes the error button/LED behaviour + records; agent cannot see the panel.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 165/200 — `Wistron-HW-00173-V003` · Items=System idle · TestSet=Power cycle
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:System idle
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. NTP should be disabled successfully
2. SUT time should be adjusted successfully
3. SUT time should be accuracy (The tolerance is within 5 secend)
- Q6 補什麼:ipmitool + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:System idle
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- System idle: idle the system then power-cycle sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "uptime 2>&1" before/after; agent starts the idl`
- 📤 產出人:
  log 取位:return the idle uptime + the post-cycle reboot uptime so the user confirms the system idled and power-cycled cleanly.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 166/200 — `Wistron-HW-00174-V003` · Items=System warm reboot test · TestSet=Power cycle
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:System warm reboot test
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. NTP should be disabled successfully
2. SUT time should be adjusted successfully
3. SUT time should be accuracy (The tolerance is within 5 secend)
- Q6 補什麼:coreutils
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:System warm reboot test
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- System warm reboot test: warm reboot the system sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "reboot 2>&1" and confirm it boots to the OS; `
- 📤 產出人:
  log 取位:return the reboot trigger + post-boot uptime so the user confirms the warm reboot completed successfully.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 167/200 — `Wistron-HW-00175-V002` · Items=AC lost · TestSet=Power cycle
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:AC lost
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. NTP should be disabled successfully
2. SUT time should be adjusted successfully
3. SUT time should be accuracy (The tolerance is within 5 secend)
- Q6 補什麼:none (physical AC - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:AC lost
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- AC lost: AC-lost (power loss) test requires physically removing AC power and observing the response (power-policy + crash-free recovery); human-only AC handling.`
- 📤 產出人:
  log 取位:operator drops AC + records the recovery; agent cannot unplug AC.
  risk:RISK: AC loss drops power abruptly; human-only.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 168/200 — `Wistron-HW-00177-V002` · Items=BIOS PASSWORD CLEAR · TestSet=Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:BIOS PASSWORD CLEAR
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Switch to another side , systerm still can power onsuccessfully.
2. Switch need functionaly.
3. Switch to orginal side , system should not hang or create error log.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:BIOS PASSWORD CLEAR
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 169/200 — `Wistron-HW-00178-V002` · Items=ME recover · TestSet=Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:ME recover
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Switch to another side , systerm still can power onsuccessfully.
2. Switch need functionaly.
3. Switch to orginal side , system should not hang or create error log.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:ME recover
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 170/200 — `Wistron-HW-00179-V002` · Items=BIOS SPI Write protect · TestSet=Function Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:BIOS SPI Write protect
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Switch to another side , systerm still can power onsuccessfully.
2. Switch need functionaly.
3. Switch to orginal side , system should not hang or create error log.
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:BIOS SPI Write protect
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 171/200 — `Wistron-HW-00181-V002` · Items=Location check · TestSet=Detection
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Location check
- Q2 位置:物理/目視(agent 不跑)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Dedicated Port location should be correct as system spec
- Q6 補什麼:none
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Location check
- 📥 變數:無(物理動作 operator 執行)
- ▶ 指令:`-- not runnable by agent`(物理/目視)
- 📤 產出人:operator 事後照片/證據,agent 不產生(§十九 q)
- 🚧 判斷閘:PHYSICAL/NO,agent 給事後證據包

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`物理目視,agent 無法 SSH 觸發;維持 NO`

---

### 172/200 — `Wistron-HW-00182-V002` · Items=Power on status · TestSet=RJ45
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Power on status
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check RJ45 LED if soild green as system spec
- Q6 補什麼:none (visual LED - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Power on status
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Power on status: RJ45 power-on status checks the port LED when the system powers on (link activity); the LED observation is a physical visual check.`
- 📤 產出人:
  log 取位:operator observes the RJ45 LEDs at power-on + records; agent cannot see the port LEDs.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 173/200 — `Wistron-HW-00183-V003` · Items=Speed status · TestSet=RJ45
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:Speed status
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. System should be no error
2. Internet should work normally
3. Check LED by speed
- Q6 補什麼:iproute2 + ethtool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Speed status
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Speed status: read the RJ45/port speed + link state sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "ip -s link 2>&1 | grep -A3 -E 'eth|eno'; `
- 📤 產出人:
  log 取位:return the NIC speed/link/duplex so the user confirms the port is at the expected negotiated speed.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 174/200 — `Wistron-HW-00184-V002` · Items=Active NIC - dedicated · TestSet=BMC-LAN Dedicated
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Active NIC - dedicated
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the ip can be present on BIOS
2. Check the Web can be login
- Q6 補什麼:iproute2/nmcli (on host) + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Active NIC - dedicated
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Active NIC - dedicated (Dedicated): verify the Dedicated NIC link is up and reachable: agent checks sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$D`
- 📤 產出人:
  log 取位:return the host link/state + a `ping` to the BMC dedicated/shared IP so the user confirms the Dedicated NIC is active and reachable; BIOS IP
  risk:RISK: none (read-only link/address checks); plugging the cable + BIOS page are operator/KVM.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 175/200 — `Wistron-HW-00185-V002` · Items=Set dedicated port as DHCP(IPv4) · TestSet=BMC-LAN Dedicated
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Set dedicated port as DHCP(IPv4)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the ip can be present on BIOS
2. Check the Web can be login
- Q6 補什麼:ipmitool or curl (Redfish) + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Set dedicated port as DHCP(IPv4)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Set dedicated port as DHCP(IPv4) (Dedicated as DHCP IPv4): agent reads the BMC LAN source/address with ipmitool -I lanplus -C 17 -U "$BMC_USER" -P "$BMC_PASS" -H "$BMC`
- 📤 產出人:
  log 取位:return the lan-print/Redfish IPv4 address-source output so the user confirms the Dedicated port is on DHCP(IPv4) and the IP is present; the 
  risk:RISK: enabling DHCP may drop the operator's static management IP; confirm the console path before toggling.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 176/200 — `Wistron-HW-00186-V002` · Items=Set dedicated port as static(IPv4) · TestSet=BMC-LAN Dedicated
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Set dedicated port as static(IPv4)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the ip can be present on BIOS
2. Check the Web can be login
- Q6 補什麼:ipmitool or curl (Redfish) + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Set dedicated port as static(IPv4)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Set dedicated port as static(IPv4) (Dedicated as static IPv4): agent verifies the assigned static address with ipmitool -I lanplus -C 17 -U "$BMC_USER" -P "$BMC_PASS" `
- 📤 產出人:
  log 取位:return the lan-print/Redfish IPv4 static address so the user confirms the Dedicated port is static(IPv4) and reachable; the static-entry + w
  risk:RISK: changing to a bad static IP can cut management access; enter a valid address and keep a console path.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 177/200 — `Wistron-HW-00187-V002` · Items=Set dedicated port as DHCP(IPv6) · TestSet=BMC-LAN Dedicated
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Set dedicated port as DHCP(IPv6)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the ip can be present on BIOS
2. Check the Web can be login
- Q6 補什麼:ipmitool or curl (Redfish) + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Set dedicated port as DHCP(IPv6)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Set dedicated port as DHCP(IPv6) (Dedicated as DHCP IPv6): agent reads the BMC LAN source/address with ipmitool -I lanplus -C 17 -U "$BMC_USER" -P "$BMC_PASS" -H "$BMC`
- 📤 產出人:
  log 取位:return the lan-print/Redfish IPv6 address-source output so the user confirms the Dedicated port is on DHCP(IPv6) and the IP is present; the 
  risk:RISK: enabling DHCP may drop the operator's static management IP; confirm the console path before toggling.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 178/200 — `Wistron-HW-00188-V002` · Items=Set dedicated port as static(IPv6) · TestSet=BMC-LAN Dedicated
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Set dedicated port as static(IPv6)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the ip can be present on BIOS
2. Check the Web can be login
- Q6 補什麼:ipmitool or curl (Redfish) + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Set dedicated port as static(IPv6)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Set dedicated port as static(IPv6) (Dedicated as static IPv6): agent verifies the assigned static address with ipmitool -I lanplus -C 17 -U "$BMC_USER" -P "$BMC_PASS" `
- 📤 產出人:
  log 取位:return the lan-print/Redfish IPv6 static address so the user confirms the Dedicated port is static(IPv6) and reachable; the static-entry + w
  risk:RISK: changing to a bad static IP can cut management access; enter a valid address and keep a console path.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 179/200 — `Wistron-HW-00189-V004` · Items=Active NIC - shared · TestSet=BMC-LAN Shared - NC-SI
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Active NIC - shared
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the ip can be present on BIOS
2. Check the Web can be login
3. DHCP or Static IP should display correctly
- Q6 補什麼:iproute2/nmcli (on host) + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Active NIC - shared
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Active NIC - shared (Shared - NC-SI): verify the Shared - NC-SI NIC link is up and reachable: agent checks sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_`
- 📤 產出人:
  log 取位:return the host link/state + a `ping` to the BMC dedicated/shared IP so the user confirms the Shared - NC-SI NIC is active and reachable; BI
  risk:RISK: none (read-only link/address checks); plugging the cable + BIOS page are operator/KVM.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 180/200 — `Wistron-HW-00190-V003` · Items=Set shared port as DHCP(IPv4) · TestSet=BMC-LAN Shared - NC-SI
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Set shared port as DHCP(IPv4)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the ip can be present on BIOS
2. Check the Web can be login
3. DHCP or Static IP should display correctly
- Q6 補什麼:ipmitool or curl (Redfish) + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Set shared port as DHCP(IPv4)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Set shared port as DHCP(IPv4) (Shared - NC-SI as DHCP IPv4): agent reads the BMC LAN source/address with ipmitool -I lanplus -C 17 -U "$BMC_USER" -P "$BMC_PASS" -H "$B`
- 📤 產出人:
  log 取位:return the lan-print/Redfish IPv4 address-source output so the user confirms the Shared - NC-SI port is on DHCP(IPv4) and the IP is present;
  risk:RISK: enabling DHCP may drop the operator's static management IP; confirm the console path before toggling.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 181/200 — `Wistron-HW-00191-V004` · Items=Set shared port as static(IPv4) · TestSet=BMC-LAN Shared - NC-SI
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Set shared port as static(IPv4)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the ip can be present on BIOS
2. Check the Web can be login
3. DHCP or Static IP should display correctly
- Q6 補什麼:ipmitool or curl (Redfish) + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Set shared port as static(IPv4)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Set shared port as static(IPv4) (Shared - NC-SI as static IPv4): agent verifies the assigned static address with ipmitool -I lanplus -C 17 -U "$BMC_USER" -P "$BMC_PASS`
- 📤 產出人:
  log 取位:return the lan-print/Redfish IPv4 static address so the user confirms the Shared - NC-SI port is static(IPv4) and reachable; the static-entr
  risk:RISK: changing to a bad static IP can cut management access; enter a valid address and keep a console path.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 182/200 — `Wistron-HW-00192-V003` · Items=Set shared port as DHCP(IPv6) · TestSet=BMC-LAN Shared - NC-SI
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Set shared port as DHCP(IPv6)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the ip can be present on BIOS
2. Check the Web can be login
3. DHCP or Static IP should display correctly
- Q6 補什麼:ipmitool or curl (Redfish) + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Set shared port as DHCP(IPv6)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Set shared port as DHCP(IPv6) (Shared - NC-SI as DHCP IPv6): agent reads the BMC LAN source/address with ipmitool -I lanplus -C 17 -U "$BMC_USER" -P "$BMC_PASS" -H "$B`
- 📤 產出人:
  log 取位:return the lan-print/Redfish IPv6 address-source output so the user confirms the Shared - NC-SI port is on DHCP(IPv6) and the IP is present;
  risk:RISK: enabling DHCP may drop the operator's static management IP; confirm the console path before toggling.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 183/200 — `Wistron-HW-00193-V003` · Items=Set shared port as static(IPv6) · TestSet=BMC-LAN Shared - NC-SI
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Set shared port as static(IPv6)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the ip can be present on BIOS
2. Check the Web can be login
3. DHCP and Static IP should display correctly
- Q6 補什麼:ipmitool or curl (Redfish) + BMC creds
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Set shared port as static(IPv6)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Set shared port as static(IPv6) (Shared - NC-SI as static IPv6): agent verifies the assigned static address with ipmitool -I lanplus -C 17 -U "$BMC_USER" -P "$BMC_PASS`
- 📤 產出人:
  log 取位:return the lan-print/Redfish IPv6 static address so the user confirms the Shared - NC-SI port is static(IPv6) and reachable; the static-entr
  risk:RISK: changing to a bad static IP can cut management access; enter a valid address and keep a console path.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 184/200 — `Wistron-HW-00194-V002` · Items=BMC Port LED Checking · TestSet=BMC port LED
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:BMC Port LED Checking
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Check the LED lit as spec.
- Q6 補什麼:physical sight of the BMC port LED (operator)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:BMC Port LED Checking
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- BMC Port LED Checking: visually confirm the BMC port LED lights as SPEC (color/state). A physical LED inspection; the agent cannot see the chassis LEDs.`
- 📤 產出人:
  log 取位:operator checks the BMC port LED and confirms it lights as SPEC; agent cannot visually observe the LED.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 185/200 — `Wistron-HW-00195-V002` · Items=MiniDP port mechanical check · TestSet=Mechanical Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:MiniDP port mechanical check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Make sure the cable can plug/unplug without any problem.
- Q6 補什麼:none (physical inspection - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:MiniDP port mechanical check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- MiniDP port mechanical check: MiniDP port mechanical check is a physical inspection of the connector seating/strain; human-only.`
- 📤 產出人:
  log 取位:operator inspects the MiniDP port + records; agent cannot inspect hardware.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 186/200 — `Wistron-HW-00196-V002` · Items=Resolution change up - 1920x1200x16bit · TestSet=Resolution
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Resolution change up - 1920x1200x16bit
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1.All selectable changes up to 1920x1200 at a 16bit color depth should function properly. Higher resolutions may not work properly because of limitations of the video driver used and the supported resolutions of the monitor used.
2.Screen can display w/o error.
- Q6 補什麼:OS desktop GUI (operator) + xrandr (optional read)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Resolution change up - 1920x1200x16bit
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Resolution change up - 1920x1200x16bit: change the Mini-DP video resolution/color depth up to 1920x1200@16bit in the OS display settings. Requires a person at the disp`
- 📤 產出人:
  log 取位:return the xrandr/DRM mode list so the user confirms 1920x1200@16bit applied properly on the Mini-DP display; the GUI apply + visual check a
  risk:RISK: resolution change is a GUI/visual check on the Mini-DP display - operator performs it; agent only reads the OS mode.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 187/200 — `Wistron-HW-00197-V002` · Items=Resolution change up - 2560 x 1440x16bit · TestSet=Resolution
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Resolution change up - 2560 x 1440x16bit
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1.All selectable changes up to 2560 x 1440 at a 16bit color depth should function properly. Higher resolutions may not work properly because of limitations of the video driver used and the supported resolutions of the monitor used.
2.Screen can display w/o error.
- Q6 補什麼:OS desktop GUI (operator) + xrandr (optional read)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Resolution change up - 2560 x 1440x16bit
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Resolution change up - 2560 x 1440x16bit: change the Mini-DP video resolution/color depth up to 2560x1440@16bit in the OS display settings. Requires a person at the di`
- 📤 產出人:
  log 取位:return the xrandr/DRM mode list so the user confirms 2560x1440@16bit applied properly on the Mini-DP display; the GUI apply + visual check a
  risk:RISK: resolution change is a GUI/visual check on the Mini-DP display - operator performs it; agent only reads the OS mode.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 188/200 — `Wistron-HW-00198-V002` · Items=Resolution change up - 3840 x 2160x16bit · TestSet=Resolution
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Resolution change up - 3840 x 2160x16bit
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1.All selectable changes up to 3840 x 2160 at a 16bit color depth should function properly. Higher resolutions may not work properly because of limitations of the video driver used and the supported resolutions of the monitor used.
2.Screen can display w/o error.
- Q6 補什麼:OS desktop GUI (operator) + xrandr (optional read)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Resolution change up - 3840 x 2160x16bit
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Resolution change up - 3840 x 2160x16bit: change the Mini-DP video resolution/color depth up to 3840x2160@16bit in the OS display settings. Requires a person at the di`
- 📤 產出人:
  log 取位:return the xrandr/DRM mode list so the user confirms 3840x2160@16bit applied properly on the Mini-DP display; the GUI apply + visual check a
  risk:RISK: resolution change is a GUI/visual check on the Mini-DP display - operator performs it; agent only reads the OS mode.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 189/200 — `Wistron-HW-00199-V002` · Items=Resolution change up - 4096 x 2160 x 16bit · TestSet=Resolution
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Resolution change up - 4096 x 2160 x 16bit
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1.All selectable changes up to 4096 x 2160 at a 16bit color depth should function properly. Higher resolutions may not work properly because of limitations of the video driver used and the supported resolutions of the monitor used.
2.Screen can display w/o error.
- Q6 補什麼:OS desktop GUI (operator) + xrandr (optional read)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Resolution change up - 4096 x 2160 x 16bit
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Resolution change up - 4096 x 2160 x 16bit: change the Mini-DP video resolution/color depth up to 4096x2160@16bit in the OS display settings. Requires a person at the `
- 📤 產出人:
  log 取位:return the xrandr/DRM mode list so the user confirms 4096x2160@16bit applied properly on the Mini-DP display; the GUI apply + visual check a
  risk:RISK: resolution change is a GUI/visual check on the Mini-DP display - operator performs it; agent only reads the OS mode.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 190/200 — `Wistron-HW-00200-V002` · Items=Resolution change down · TestSet=Resolution
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Resolution change down
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1.All selectable changes up to 800X600 at a 16 bit color depth should function properly. Higher resolutions may not work properly because of limitations of the video driver used and the supported resolutions of the monitor used.
2.Screen can display w/o error.
- Q6 補什麼:OS desktop GUI (operator) + xrandr (optional read)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Resolution change down
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Resolution change down: change the video resolution/color depth down (e.g. to 1024x768@16bit) in the OS display settings. Requires a person at the Mini-DP display + OS`
- 📤 產出人:
  log 取位:return the current xrandr/DRM resolution list so the user confirms the resolution change-down to 16bit applied correctly on the Mini-DP disp
  risk:RISK: resolution change is a GUI/visual check on the Mini-DP display - operator performs it; agent only reads the OS mode.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 191/200 — `Wistron-HW-00201-V003` · Items=Driver · TestSet=VGA
- **ai_can_execute(現行)** = `YES` | **verdict(§二十一)= YES** | exec 模式 = `agent 直跑(一次給完後自跑)`

**8 問**:
- Q1 測什麼:Driver
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1.VGA can be installed without any problem.
2.VGA driver version is correct.
3.Digital Signer should be Microsoft Windows Hardware Compatibility Singed.
- Q6 補什麼:pciutils + coreutils
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Driver
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Driver: check the VGA driver is loaded sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "lspci | grep -i -E "VGA|display" 2>&1; sshpass -p "$DU`
- 📤 產出人:
  log 取位:return the VGA device + loader driver + DRM dmesg so the user confirms the VGA driver is present and initialized.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`agent 直跑(一次給完後自跑)` / operator slot=`見 `${...:?}` 變數` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---

### 192/200 — `Wistron-HW-00202-V003` · Items=Monitor detection · TestSet=VGA
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Monitor detection
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Make sure the devices can be detected under OS
- Q6 補什麼:physical monitor (human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Monitor detection
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Monitor detection: monitor detection verifies the physical display shows POST/output; requires a person at the monitor to confirm the display signal.`
- 📤 產出人:
  log 取位:operator confirms the monitor detected the output; agent cannot see a physical monitor.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 193/200 — `Wistron-HW-00203-V003` · Items=MiniDP output (Display / resolution / Ripple-less) · TestSet=VGA
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:MiniDP output (Display / resolution / Ripple-less)
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Screen can display w/o error.
- Q6 補什麼:physical monitor on MiniDP (human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:MiniDP output (Display / resolution / Ripple-less)
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- MiniDP output (Display / resolution / Ripple-less): MiniDP output (display/resolution/ripple-less) verification requires observing a physical display connected to the `
- 📤 產出人:
  log 取位:operator confirms the MiniDP display/resolution + the absence of ripple; agent cannot see the display.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 194/200 — `Wistron-HW-00204-V002` · Items=Burnin 3 hours · TestSet=Stress
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Burnin 3 hours
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1.BurnIN results should have no error.0
2.Graphic card after BurnIN still can work normally.
3.BurnIN can run 3 hrs successfully.
- Q6 補什麼:BurnInTest (user-provided, licensed)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Burnin 3 hours
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- "Burnin 3 hours" stresses the Mini-DP/display function with the licensed BurnInTest tool; install the user-supplied BurnInTest binary, configure the 3h run, execute, a`
- 📤 產出人:
  log 取位:return FULL BurnInTest report (duration + pass/fail per test) so the user confirms the 3h burnin passed on the Mini-DP stress.
  risk:RISK: BurnInTest is license-restricted and long-running (3h); user must provide the licensed package and approve the window.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 195/200 — `Wistron-HW-00205-V002` · Items=FurMark Longrun Test · TestSet=Stress
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:FurMark Longrun Test
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. No abnormal display or hang up
2. Graphic card after Fumark still can work normally.
- Q6 補什麼:mesa-utils (FurMark user-provided; headless fallback via xvfb)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:FurMark Longrun Test
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- FurMark long-run: install + run FurMark (headless: sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "xvfb-run -a glmark2 2>&1 | tail -30 2>&1" `
- 📤 產出人:
  log 取位:return FULL render/score output + stability (no hang/artifact) so the user confirms the GPU survived the long run; the full-length FurMark i
  risk:RISK: long GPU render stress raises temperature/power; confirm cooling and user approval.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 196/200 — `Wistron-HW-00206-V002` · Items=Serial Port mechanical check · TestSet=Mechanical Check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Serial Port mechanical check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Make sure the cable can plug/unplug without any problem.
- Q6 補什麼:none (physical inspection - human)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Serial Port mechanical check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Serial Port mechanical check: serial-port mechanical check is a physical inspection of the DB-9 connector; human-only.`
- 📤 產出人:
  log 取位:operator inspects the serial port + records; agent cannot inspect hardware.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 197/200 — `Wistron-HW-00207-V002` · Items=Communication check · TestSet=Function check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Communication check
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Make sure the communcation work normally.
- Q6 補什麼:serial cable + a client terminal (operator)
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Communication check
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Communication check: serial-port communication check requires a person to physically plug the serial cable between the SUT COM port and a client and type commands to v`
- 📤 產出人:
  log 取位:operator plugs the serial cable, makes the connection and confirms two-way communication works; the agent cannot physically wire or observe 
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 198/200 — `Wistron-HW-00208-V002` · Items=Bios update · TestSet=Function check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:Bios update
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Make sure bios could be update successfully.
- Q6 補什麼:BIOS image + serial cable/client (operator); biosupdate tool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Bios update
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Bios update: updating the BIOS via the serial port requires a physical serial connection to the client plus running the BIOS update over that serial console; the agent`
- 📤 產出人:
  log 取位:operator connects the serial port, runs the BIOS update command to the newest version, restarts the SUT and checks the new BIOS version; age
  risk:RISK: BIOS update over serial re-flashes BIOS firmware; operator-only with the approved image, do not auto-run.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 199/200 — `Wistron-HW-00209-V002` · Items=BMC update · TestSet=Function check
- **ai_can_execute(現行)** = `NO` | **verdict(§二十一)= NO** | exec 模式 = `物理(agent 不跑)`

**8 問**:
- Q1 測什麼:BMC update
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:1. Make sure BMC could be update successfully.
- Q6 補什麼:BMC image + serial cable/client (operator); bmcupdate tool
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:BMC update
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- BMC update: updating the BMC via the serial port requires a physical serial connection to the client plus running the BMC update over that serial console; the agent ca`
- 📤 產出人:
  log 取位:operator connects the serial port, runs the BMC update to the newest version, restarts the SUT and checks the BMC version; agent cannot phys
  risk:RISK: BMC update over serial re-flashes BMC firmware; operator-only with the approved image, do not auto-run.
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`物理(agent 不跑)` / operator slot=`無(operator 現場執行)` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`

---

### 200/200 — `Wistron-HW-00210-V002` · Items=Devcie detection · TestSet=Detection
- **ai_can_execute(現行)** = `PARTIAL` | **verdict(§二十一)= PARTIAL** | exec 模式 = `有前置(需 operator 給變數/決目標/在場)`

**8 問**:
- Q1 測什麼:Devcie detection
- Q2 位置:DUT host(ssh 穿透)
- Q3 機台:待 operator 圈定實際 SUT(L2 才跑)
- Q4 時機:單次
- Q5 看什麼:Make sure the devices can be detected under OS
- Q6 補什麼:usbutils + operator to attach the device
- Q7 回報:R36(agent 陳述事實,operator 判)
- Q8 邊界:見 🚧

**5 段**:
- 🎯 目的:Devcie detection
- 📥 變數:見 ai_commands 內 `${...:?}` 提示;SSH 需 DUT_USER/DUT_PASS
- ▶ 指令(現行)
  `-- Devcie detection: verify device detection in OS sshpass -p "$DUT_PASS" ssh -o StrictHostKeyChecking=no $DUT_USER@$DUT_IP "lsusb 2>&1; ip link 2>&1 | grep -E "^[0-9]+:"`
- 📤 產出人:
  log 取位:return the lsusb/device list so the user confirms the devices are detected in OS.
  risk:
- 🚧 判斷閘:READ/WRITE 視命令;agent 不實跑(L1)

**§十八 h 三項**:執行模式=`有前置(需 operator 給變數/決目標/在場)` / operator slot=`見 `${...:?}` 變數;PMBus/工具類標 vendor/bus slot` / 邏輯 sanity=`L1 靜態審;命令存在,引號/位置待實跑前再驗`
**⚠️ 缺陷**:Q-LIT:ssh 內層 grep pattern 用雙引號 → 改單引號(Round-1 已拍板),避免 agent-host 端字串切爆 ; fix:內層 grep 的雙引號改單引號,保持外層 ssh 參數雙引號

---
