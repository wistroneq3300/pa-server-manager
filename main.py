"""Wistron PA Server Manager — 後端 (FastAPI)

提供：
- 專案分類（projects）：新增/列出/刪除，機台可掛到某個專案。
- 新增系統：輸入 OS IP/帳號/密碼 + BMC IP/帳號/密碼
  → 後端 SSH 抓 hostname 當系統名稱，並儲存。
- 列出系統（含各機台 OS/BMC 線上狀態，依 ping 判斷）、刪除系統。
- 網頁終端機：WebSocket bridge 到 OS / BMC 的 SSH，前端用 xterm 操作。

安全性註記：
- 目前密碼以明文存在記憶體(僅運行期間)。正式上線前必須加密存放或接秘密管理。
"""
import asyncio
import json
import os
import subprocess
import threading
import base64
import datetime
import time
import websockets
import paramiko
from concurrent.futures import ThreadPoolExecutor

import telemetry_core  # System Telemetry 核心（CPU/DIMM/SSD/NIC/GPU 歷史收集）
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(title="Wistron PA Server Manager API")

# 開發用：允許本機檔案直接開
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- 儲存（存成 JSON 檔，重啟後資料仍在；正式可換 DB） ----
# 資料目錄可由環境變數 PA_DATA_DIR 指定（正式版與試用版隔離用）；未設則用程式所在目錄
def _data_dir():
    d = os.environ.get("PA_DATA_DIR")
    if d:
        os.makedirs(d, exist_ok=True)
        return d
    return os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(_data_dir(), "data.json")

def _load_data():
    global machines, projects, _seq, links
    machines = {}
    projects = {}
    links = []          # 機櫃拓樸連線：[{"a": 名稱, "b": 名稱, "type": "eth"|"ib"|"power"|"coolant"}]
    _seq = 1
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                d = json.load(f)
            machines = d.get("machines", {})
            projects = d.get("projects", {})
            links = d.get("links", []) or []
            _seq = d.get("seq", 1)
        # 遷移：若缺 order 欄位，依插入順序補上
        if not any("order" in p for p in projects.values()):
            for i, n in enumerate(projects):
                projects[n]["order"] = i
        for n, p in projects.items():
            p.setdefault("order", 0)
        if not any("order" in m for m in machines.values()):
            for i, n in enumerate(machines):
                machines[n]["order"] = i
        for n, m in machines.items():
            m.setdefault("order", 0)
            m.setdefault("level", "system")   # system = L10 單機; rack = L11 整櫃
    except Exception as e:
        print("載入 data.json 失敗：", e)


def _reindex_projects():
    """依 order 順序重新整理 projects 的順序。"""
    for i, n in enumerate(sorted(projects, key=lambda k: projects[k].get("order", 0))):
        projects[n]["order"] = i

def _save_data():
    try:
        tmp = DATA_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump({"machines": machines, "projects": projects, "links": links, "seq": _seq}, f,
                      ensure_ascii=False, indent=2)
        os.replace(tmp, DATA_FILE)
    except Exception as e:
        print("儲存 data.json 失敗：", e)

machines = {}    # hostname -> dict
projects = {}    # name -> {name, desc}
links = []       # 機櫃拓樸連線：[{"a", "b", "type"}]
_seq = 1
_load_data()


class AddRackPassive(BaseModel):
    name: str = ""
    mgx_type: str = "switch"
    project: str = ""
    rack_u: int = 1
    rack_side: str = "front"
    manage_ip: str = ""
    rack_size: int = 1


class AddMachine(BaseModel):
    os_ip: str = Field(..., description="OS IP")
    os_user: str
    os_pass: str
    bmc_ip: str = ""
    bmc_user: str = ""
    bmc_pass: str = ""
    os_port: int = 22
    bmc_port: int = 22
    project: str = ""
    level: str = "system"   # 'system' = L10 單機; 'rack' = L11 整櫃
    rack_size: int = 1      # L11 rack level 用：機櫃占用高度（U 數）


class AddProject(BaseModel):
    name: str
    desc: str = ""


def ssh_run(host, user, password, port, command, timeout=8):
    cmd = [
        "sshpass", "-p", password,
        "ssh", "-p", str(port),
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", "ConnectTimeout=5",
        "-o", "NumberOfPasswordPrompts=1",
        f"{user}@{host}",
        command,
    ]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        out = r.stdout.strip()
        return out, r.returncode, (r.stderr or "").strip()
    except subprocess.TimeoutExpired:
        return None, -1, "SSH 連線逾時"


def ssh_ipmi(m, sub_args, timeout=25):
    """在受控 OS 內執行本機 ipmitool（-I open），回 (stdout, rc, stderr)。
    有些 BMC 的 OOB cipher 設定（-C 17）只有透過 OS 本機 ipmitool 才穩，
    且診斷時直接抓本機 SEL/sensor 最貼近真實。OS 不可連時 fallback 到 OOB。"""
    if m.get("passive"):
        return "", -1, "無 OS"
    if m.get("os_ip") and m.get("os_user") and m.get("os_pass"):
        cmd = "ipmitool -I open " + " ".join(sub_args)
        out, rc, err = ssh_run(m["os_ip"], m.get("os_user",""), m.get("os_pass",""),
                               m.get("os_port",22), cmd, timeout=timeout)
        if rc == 0 and out:
            return out, rc, err
        if rc == 0 and sub_args[0] == "sdr":   # sdr 可能全空但也算成功
            return out, rc, err
        # 本機 ipmitool 失敗 → fallback OOB
    if m.get("bmc_ip") and m.get("bmc_user") and m.get("bmc_pass"):
        cmd = _ipmi_cmd(m, sub_args)
        if cmd:
            try:
                r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
                return (r.stdout or "").strip(), r.returncode, (r.stderr or "").strip()
            except Exception as e:
                return "", -1, str(e)
    return "", -1, "無法執行 ipmitool（無 OS 且無 BMC）"


def _ipmi_local(m, sub_args, timeout=25):
    """同 ssh_ipmi 但回傳字串，OS 不可連時用 OOB。失敗回空字串。"""
    out, rc, err = ssh_ipmi(m, sub_args, timeout)
    return out or err or ""


def ping_check(ip, timeout=3):
    """ping 一個 IP，回傳是否『線上』。"""
    if not ip:
        return False
    cmd = ["ping", "-c", "1", "-W", str(timeout), ip]
    # -c 1: 只送一次; -W: 逾時秒數
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 3)
        return r.returncode == 0
    except Exception:
        return False


# ---- BMC 控制 / 讀取（ipmitool / redfish）----
# 額設 cipher suite：fleet_l OpenBMC 需 -C 17（HMAC-SHA1），其他廠牌 BMC 若不接受可設 IPMI_CIPHER=3。
_IPMI_CIPHER = os.environ.get("IPMI_CIPHER", "17")

def _ipmi_cmd(m, sub_args):
    """組 ipmitool 命令（統一 -I lanplus -H -U -P -C cipher + 子指令）。
    依使用者指定格式：ipmitool -I lanplus -H <BMC_IP> -U <user> -P <pass> -C 17 <sub...>。
    sub_args 例如 ["chassis","power","status"]。
    machine.use_c17 為 False 時改用 3（或 IPMI_CIPHER 環境變數），即「不加 -C 17」。"""
    if not m.get("bmc_ip") or not m.get("bmc_user") or not m.get("bmc_pass"):
        return None
    cipher = _IPMI_CIPHER if m.get("use_c17", True) else (os.environ.get("IPMI_CIPHER_NO17", "3"))
    return ["ipmitool", "-I", "lanplus",
            "-H", m["bmc_ip"], "-U", m["bmc_user"], "-P", m["bmc_pass"],
            "-C", cipher] + sub_args


# ---- 自訂開關機 / AUX(AC cycle) 指令（變數代入）----
# 每台元件可存 power_on_cmd / power_off_cmd / aux_cmd；
# 用變數 $BMC_IP $BMC_USER $BMC_PW $BMC_PORT $OS_IP 等代入。留空則用預設 ipmitool。
_VAR_KEYS = {
    "${BMC_IP}": lambda m: m.get("bmc_ip", ""),
    "$BMC_IP": lambda m: m.get("bmc_ip", ""),
    "${BMC_USER}": lambda m: m.get("bmc_user", ""),
    "$BMC_USER": lambda m: m.get("bmc_user", ""),
    "${BMC_AC}": lambda m: m.get("bmc_user", ""),
    "$BMC_AC": lambda m: m.get("bmc_user", ""),
    "${BMC_PW}": lambda m: m.get("bmc_pass", ""),
    "$BMC_PW": lambda m: m.get("bmc_pass", ""),
    "${BMC_PASS}": lambda m: m.get("bmc_pass", ""),
    "$BMC_PASS": lambda m: m.get("bmc_pass", ""),
    "${BMC_PORT}": lambda m: str(m.get("bmc_port", 623)),
    "$BMC_PORT": lambda m: str(m.get("bmc_port", 623)),
    "${OS_IP}": lambda m: m.get("os_ip", ""),
    "$OS_IP": lambda m: m.get("os_ip", ""),
}
def subst_vars(tpl, m):
    out = tpl
    for k, fn in _VAR_KEYS.items():
        out = out.replace(k, fn(m) or "")
    return out

def run_control_cmd(m, action):
    """執行開/關/aux 自訂指令。action in {'poweron','poweroff','aux'}。
    優先：自訂指令（有填就用）→ 預設 ipmitool。回 (ok, info)。"""
    if action == "poweron":
        cmd_tpl = m.get("power_on_cmd") or ""
    elif action == "poweroff":
        cmd_tpl = m.get("power_off_cmd") or ""
    else:
        cmd_tpl = m.get("aux_cmd") or ""
    if cmd_tpl:
        cmd0 = subst_vars(cmd_tpl, m)
        # use_c17 關閉時，將自訂指令中的「-C 17」移除（例如改為 -C 3 / 不加）
        if not m.get("use_c17", True):
            cmd0 = cmd0.replace(" -C 17", "").replace(" -c 17", "")
        cmd = cmd0
        try:
            # 支援用 shell 執行，方便用戶寫 ipmitool / redfishcurl / ssh 等
            r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
            out = (r.stdout or "").strip() or (r.stderr or "").strip()
            return r.returncode == 0, out or "已送出指令"
        except subprocess.TimeoutExpired:
            return False, "指令執行逾時"
        except Exception as e:
            return False, str(e)
    # 沒有自訂指令 → 預設 ipmitool（僅 power on/off）
    if action == "aux":
        return ipmi_power(m, "cycle")
    return ipmi_power(m, "on" if action == "poweron" else "off")


def _ipmi_cipher_suites():
    """CIMC（Cisco）等多用 cipher suite 3；OpenBMC 需 17。回傳嘗試清單。"""
    env_c = os.environ.get("IPMI_CIPHER")
    if env_c:
        return [env_c]
    return [_IPMI_CIPHER, "3", "1"]


def _ipmi_run_any(m, sub_args, timeout=6):
    """用多種 cipher suite 逐一嘗試 ipmitool（OOB lanplus），取第一個成功者。
    回 (returncode, stdout, stderr)。全失敗回最後一筆結果。"""
    last = (1, "", "")
    for c in _ipmi_cipher_suites():
        cmd = ["ipmitool", "-I", "lanplus",
               "-H", m["bmc_ip"], "-U", m["bmc_user"], "-P", m["bmc_pass"],
               "-C", c] + sub_args
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            last = (r.returncode, (r.stdout or "").strip(), (r.stderr or "").strip())
            if r.returncode == 0 or (r.stderr or "").find("Unable") < 0:
                # 有回應（非 unable to establish）就算成功
                if r.returncode == 0 or r.stdout:
                    return last
        except subprocess.TimeoutExpired:
            last = (124, "", "ipmitool 逾時")
        except Exception as e:
            last = (1, "", str(e))
    return last


def ipmi_power(m, action):
    """對 BMC 下 chassis power 指令。回 (ok, info)。
    優先經 OS 本機 ipmitool -I open（快且兼容 CIMC），失敗才 OOB lanplus cipher fallback。"""
    if not m.get("os_ip") and not m.get("bmc_ip"):
        return False, "無 OS 亦無 BMC 位址，無法控制"
    # 1) OS 本機 -I open
    out, rc, err = ssh_ipmi(m, ["chassis", "power", action], timeout=20)
    if rc == 0 and out:
        ok = "on" in out.lower() or "off" in out.lower() if action == "status" else True
        return ok, out.strip()
    # 2) OOB lanplus cipher fallback
    if m.get("bmc_ip") and m.get("bmc_user") and m.get("bmc_pass"):
        rc2, out2, err2 = _ipmi_run_any(m, ["chassis", "power", action])
        o2 = (out2 or err2 or "").strip()
        ok2 = ("on" in o2.lower() or "off" in o2.lower()) if action == "status" else (rc2 == 0)
        return ok2, o2 or "ipmitool 逾時"
    return False, (err or "ipmitool 逾時").strip()


def ipmi_fw_list(m):
    """抓 BMC firmware 清單（ipmitool mc info）。優先 OS 本機 -I open，失敗 OOB fallback。"""
    out, rc, err = ssh_ipmi(m, ["mc", "info"], timeout=20)
    if rc != 0 or not out:
        if m.get("bmc_ip") and m.get("bmc_user") and m.get("bmc_pass"):
            _, out, _ = _ipmi_run_any(m, ["mc", "info"])
    lines = [l.strip() for l in (out or "").splitlines() if ":" in l]
    return [dict(zip(("key", "value"), (l.split(":", 1)[0].strip(), l.split(":", 1)[1].strip()))) for l in lines[:30]]


def ipmi_sensor_summary(m):
    """抓 sensor 摘要，回傳 critical/warning 的筆數與清單 + 完整 SDR 供下拉框。
    優先透過 OS 本機 ipmitool（-I open），OS 不可連時用 OOB。"""
    out, rc, err = ssh_ipmi(m, ["sdr", "list"], timeout=25)
    lines = out.splitlines() if out else []
    # 狀態是該行最後一個欄位；只用最後 token 判定，避免 sensor 名稱含 critical
    def status_token(l):
        parts = l.split()
        return parts[-1].lower() if parts else ""
    ok_n = crit = warn = ns = 0
    crit_entries, warn_entries, entries = [], [], []
    for l in lines:
        st = status_token(l)
        if st in ("cr", "critical"):
            crit += 1
            crit_entries.append(l)
        elif st in ("nc", "warn", "warning"):
            warn += 1
            warn_entries.append(l)
        elif st in ("ok",):
            ok_n += 1
        elif st in ("ns", "nr", "na", "no", "reading", "not_readable"):
            ns += 1
        entries.append(l)
    if not lines:
        return {"error": "sdr 讀取失敗: " + (err.strip() or "無輸出")[:200]}
    return {"total": len(lines), "ok": ok_n, "critical": crit, "warning": warn, "ns": ns,
            "critical_entries": crit_entries[:20], "warning_entries": warn_entries[:20],
            "entries": entries[:400]}


def ssh_login_ok(host, user, password, port=22, timeout=8):
    """用 paramiko 嘗試 SSH 登入，成功回 True（用於驗證 BMC 可連）。"""
    import paramiko
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(host, port=port, username=user, password=password, timeout=timeout,
                       allow_agent=False, look_for_keys=False)
        # 連上且認證成功即代表可連；嘗試執行一個無害指令（有些 BMC 不支援也無妨）
        try:
            client.exec_command("echo ok")
        except Exception:
            pass
        return True
    except Exception:
        return False
    finally:
        try:
            client.close()
        except Exception:
            pass


@app.post("/api/machines")
def add_machine(body: AddMachine):
    global _seq
    if not body.os_ip or not body.os_user or not body.os_pass:
        raise HTTPException(400, "OS IP / 帳號 / 密碼為必填")

    # 1) OS：SSH 抓 hostname（同時驗證 OS 連線）
    hostname, rc, err = ssh_run(body.os_ip, body.os_user, body.os_pass, body.os_port, "hostname")
    if rc != 0 or not hostname:
        raise HTTPException(400, f"OS 連線失敗（SSH）：{err or '無法登入'}")

    # 2) BMC：若有填 BMC IP → ping + SSH 驗證連線（驗證 OS 與 BMC 都可連才新增）
    if body.bmc_ip:
        if not ping_check(body.bmc_ip):
            raise HTTPException(400, f"BMC 連線失敗（{body.bmc_ip} ping 不到）")
        if body.bmc_user and body.bmc_pass:
            # BMC 多半是專屬 CLI，跑一個無害指令確認能登入即可
            bmc_rc_ok = ssh_login_ok(body.bmc_ip, body.bmc_user, body.bmc_pass, body.bmc_port)
            if not bmc_rc_ok:
                raise HTTPException(400, f"BMC SSH 登入失敗（{body.bmc_user}@{body.bmc_ip}）")

    if body.project and body.project not in projects:
        raise HTTPException(400, f"專案不存在: {body.project}")

    name = hostname
    # 衝突檢查：hostname / os_ip / bmc_ip 任一與現有機台重複時明確擋下，
    # 避免「默默覆蓋」造成既有機台消失。允許加入時才寫入。
    conflicts = []
    for mk, mv in machines.items():
        if mk == name:
            conflicts.append(f"主機名稱「{name}」已被 {mk}（專案 {mv.get('project') or '-'}）使用")
        if mv.get("os_ip") and mv["os_ip"] == body.os_ip:
            conflicts.append(f"OS IP {body.os_ip} 已被「{mk}」使用")
        if body.bmc_ip and mv.get("bmc_ip") and mv["bmc_ip"] == body.bmc_ip:
            conflicts.append(f"BMC IP {body.bmc_ip} 已被「{mk}」使用")
    if conflicts:
        detail = "；".join(dict.fromkeys(conflicts))
        raise HTTPException(400, f"無法新增：偵測到衝突 — {detail}。若確實要重複新增，請先處理既有機台，或確認這是同一個名稱/IP。")

    rec = {
        "id": _seq,
        "name": name,
        "os_ip": body.os_ip,
        "os_user": body.os_user,
        "os_pass": body.os_pass,
        "bmc_ip": body.bmc_ip,
        "bmc_user": body.bmc_user,
        "bmc_pass": body.bmc_pass,
        "os_port": body.os_port,
        "bmc_port": body.bmc_port,
        "project": body.project,
        "level": body.level if body.level in ("system", "rack") else "system",
        "rack_size": body.rack_size if body.level == "rack" and 0 < body.rack_size <= 48 else 1,
        "use_c17": True,
        "order": max([x.get("order", 0) for x in machines.values()] or [-1]) + 1,
        "created": datetime.datetime.now().isoformat(timespec="seconds"),
    }
    _seq += 1
    machines[name] = rec
    _save_data()
    return {"ok": True, "machine": rec}


class ProbeBMC(BaseModel):
    os_ip: str
    os_user: str
    os_pass: str
    os_port: int = 22


def _probe_bmc_ip(os_ip, os_user, os_pass, os_port):
    """在 OS 內用本機 ipmitool lan print 抓 BMC IP Address。
    回 (bmc_ip or None, has_ipmitool, err)。"""
    out, rc, err = ssh_run(os_ip, os_user, os_pass, os_port,
                            "ipmitool lan print 2>/dev/null; ipmitool lan print 1 2>/dev/null; command -v ipmitool",
                            timeout=25)
    if rc != 0:
        return None, False, err or "SSH 執行失敗"
    has_ipmi = False
    bmc_ip = None
    for line in (out or "").splitlines():
        s = line.strip()
        if s == "/usr/bin/ipmitool" or s.endswith("/ipmitool"):
            has_ipmi = True
        if "IP Address" in s and ":" in s:
            v = s.split(":", 1)[1].strip()
            if v and v.lower() != "0.0.0.0" and not (
                s.lower().startswith("ip address source") or "source" in s.lower()):
                bmc_ip = v
    if bmc_ip:
        return bmc_ip, has_ipmi, ""
    return None, has_ipmi, "ipmitool 已安裝但取不到 IP Address"


@app.post("/api/machines/probe-bmc")
def probe_bmc(body: ProbeBMC):
    """新增系統前探測：用 OS SSH 抓 hostname，並用 OS 本機 ipmitool lan print
    自動取得 BMC IP Address（填入表單自動帶入）。若 OS 內無 ipmitool 則回傳
    ipmitool_ok=False，由前端提示需下載/安裝 ipmitool。"""
    if not body.os_ip or not body.os_user or not body.os_pass:
        raise HTTPException(400, "請填 OS IP / SSH 帳號 / 密碼")
    hostname, rc, err = ssh_run(body.os_ip, body.os_user, body.os_pass, body.os_port, "hostname", timeout=12)
    if rc != 0 or not hostname:
        return {"ok": False, "error": f"OS 連線失敗（SSH）：{err or '無法登入'}"}
    bmc_ip, has_ipmi, perr = _probe_bmc_ip(body.os_ip, body.os_user, body.os_pass, body.os_port)
    if not has_ipmi:
        return {"ok": False, "hostname": hostname, "ipmitool_ok": False,
                "error": "OS 內未偵測到 ipmitool，無法自動抓取 BMC IP。請先在該主機安裝 ipmitool 後再試。"}
    if not bmc_ip:
        return {"ok": False, "hostname": hostname, "ipmitool_ok": True,
                "error": f"ipmitool 已安裝，但抓取 BMC IP Address 失敗：{perr}"}
    return {"ok": True, "hostname": hostname, "bmc_ip": bmc_ip, "ipmitool_ok": True}


@app.post("/api/rack/passive")
def add_rack_passive(body: AddRackPassive):
    """新增一個『純機櫃元件』（switch / power shelf / CDU / PDU / Storage / Network）。
    這類元件通常沒有 OS / BMC IP，無法用 SSH 加入；只需名稱 + 類型 + U 槽（+可選管理 IP）。
    回傳建立的 record，前端再呼叫 rackAssign 指派 project。"""
    global _seq
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(400, "請填元件名稱")
    if name in machines:
        raise HTTPException(400, f"名稱已存在: {name}")
    valid = ("server", "switch", "powershelf", "pdu", "cdu", "storage", "network", "blanking")
    if body.mgx_type not in valid:
        raise HTTPException(400, f"元件類型無效: {body.mgx_type}")
    rec = {
        "id": _seq,
        "name": name,
        "os_ip": "", "os_user": "", "os_pass": "",
        "bmc_ip": body.manage_ip or "", "bmc_user": "", "bmc_pass": "",
        "os_port": 22, "bmc_port": 623,
        "project": body.project or "",
        "level": "rack",
        "mgx_type": body.mgx_type,
        "rack_u": body.rack_u if 0 < body.rack_u <= 48 else 1,
        "rack_side": body.rack_side if body.rack_side in ("front", "rear") else "front",
        "rack_size": body.rack_size if 0 < body.rack_size <= 48 else 1,
        "use_c17": True,
        "passive": True,
        "order": max([x.get("order", 0) for x in machines.values()] or [-1]) + 1,
        "created": datetime.datetime.now().isoformat(timespec="seconds"),
    }
    _seq += 1
    machines[name] = rec
    _save_data()
    return {"ok": True, "machine": _bmc_safe(rec)}


@app.patch("/api/machines/{name}")
def edit_machine(name: str, body: dict):
    """移動機台：可指定 project 與 order。{project, order}
    order 只在同專案內有意義；此處不重新編號，保留各機台手動排定的順序。"""
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    m = machines[name]
    if "project" in body:
        tgt = body["project"]
        if tgt and tgt not in projects:
            raise HTTPException(400, f"專案不存在: {tgt}")
        m["project"] = tgt
    if "order" in body and isinstance(body["order"], (int, float)):
        m["order"] = int(body["order"])
    if "level" in body and body["level"] in ("system", "rack"):
        m["level"] = body["level"]
    # Rack Manager 擴充欄位：MGX 元件類型 + 機櫃位置（U 數 & 前後排）
    if "mgx_type" in body:
        t = str(body["mgx_type"])
        m["mgx_type"] = t if t in ("server", "switch", "pdu", "powershelf", "cdu", "storage", "network", "blanking") else "server"
    if "rack_u" in body:
        try:
            m["rack_u"] = int(body["rack_u"])
            if m["rack_u"] < 0 or m["rack_u"] > 48:
                m["rack_u"] = 0
        except Exception:
            pass
    if "rack_side" in body:
        side = str(body["rack_side"])
        m["rack_side"] = side if side in ("front", "rear") else "front"
    if "rack_size" in body:
        try:
            m["rack_size"] = max(1, min(48, int(body["rack_size"])))
        except Exception:
            pass
    for f in ("power_on_cmd", "power_off_cmd", "aux_cmd"):
        if f in body:
            m[f] = str(body[f] or "").strip()
    if "use_c17" in body:
        m["use_c17"] = bool(body["use_c17"])
    _save_data()
    return {"ok": True, "machine": m}


# ---- 線上狀態快取（TTL），避免大量機台時每次 API 都同步 ping 卡住 ----
_status_cache = {}
_STATUS_TTL = 5          # 5 秒內不重複 ping 同一台
_STATUS_TIME = None


# ---- 健康度快取（依 BMC 回報，綠/橘/紅/unknown/offline）----
_health_cache = {}
_HEALTH_TTL = 30      # 健康度較慢，快取久一點


def _detect_health(m):
    """判定單台 BMC 健康燈（邏輯已與使用者確認）：
    綠=Redfish HealthRollup OK / 橘=Warning / 紅=Critical；
    若 Redfish 不通再視 EventLog severity；連不到= 'unknown'；無BMC='offline'。
    """
    bmc = m.get("bmc_ip")
    if not bmc:
        return "offline"
    if not _status_cache.get(("bmc", m["name"]), False):
        return "unknown"                      # BMC ping 不到
    u = m.get("bmc_user") or ""
    pw = m.get("bmc_pass") or ""
    try:
        import requests, urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    except Exception:
        return "unknown"
    auth = (u, pw) if u else None
    # 1) Redfish System HealthRollup
    for sysid in ("system", "1"):
        try:
            r = requests.get(f"https://{bmc}/redfish/v1/Systems/{sysid}/", auth=auth, verify=False, timeout=8)
            if r.status_code == 200:
                st = (r.json() or {}).get("Status", {})
                rollup = ((st.get("HealthRollup") or st.get("Health")) or "").upper()
                if rollup == "OK":
                    return "green"
                if rollup == "WARNING":
                    return "amber"
                if rollup in ("CRITICAL", "MAJOR"):
                    return "red"
        except Exception:
            pass
    # 2) EventLog 最近 severity
    try:
        r = requests.get(f"https://{bmc}/redfish/v1/Systems/system/LogServices/EventLog/Entries/",
                         auth=auth, verify=False, timeout=8)
        if r.status_code == 200:
            sevs = [((e or {}).get("Severity") or "").upper() for e in (r.json() or {}).get("Members", [])]
            if any(s == "CRITICAL" for s in sevs):
                return "red"
            if any(s in ("WARNING", "WARN") for s in sevs):
                return "amber"
    except Exception:
        pass
    return "unknown"


def _refresh_status(force=False):
    """並行掃描所有機台的 OS / BMC 線上狀態與健康度，寫入快取。"""
    global _STATUS_TIME
    now = time.time()
    if not force and _STATUS_TIME and (now - _STATUS_TIME) < _STATUS_TTL:
        return
    hosts = set()
    for m in machines.values():
        if m.get("os_ip"):
            hosts.add(("os", m["name"]))
        if m.get("bmc_ip"):
            hosts.add(("bmc", m["name"]))

    def scan(kind, name):
        ip = machines[name].get("os_ip" if kind == "os" else "bmc_ip")
        key = (kind, name)
        _status_cache[key] = ping_check(ip)

    with ThreadPoolExecutor(max_workers=32) as ex:
        list(ex.map(lambda h: scan(*h), list(hosts)))
    # 健康度：僅對 BMC 可達的機台做深度偵測（較慢，獨立快取）
    hnow = time.time()
    with ThreadPoolExecutor(max_workers=12) as ex:
        def hjob(name):
            if name in _health_cache and (hnow - _health_cache[name][1]) < _HEALTH_TTL:
                return
            _health_cache[name] = (_detect_health(machines[name]), hnow)
        list(ex.map(hjob, list(machines.keys())))
    _STATUS_TIME = now


_STATUS_LOCK = threading.Lock()

def _kick_status_scan(force=False):
    """若快取過期，在背景 thread 刷新狀態，立即回傳舊快取（避免阻塞 API 回應）。
    force=True 時同步執行。"""
    if force:
        _refresh_status(force=True)
        return
    now = time.time()
    if _STATUS_TIME and (now - _STATUS_TIME) < _STATUS_TTL:
        return
    if not _STATUS_LOCK.acquire(blocking=False):
        return  # 已有一個掃描在背景跑
    def _run():
        try:
            _refresh_status()
        except Exception as e:
            print("背景狀態掃描失敗：", e)
        finally:
            _STATUS_LOCK.release()
    threading.Thread(target=_run, daemon=True).start()


@app.get("/api/machines")
def list_machines(force_scan: bool = False):
    _kick_status_scan(force=force_scan)
    safe = []
    for name in sorted(machines, key=lambda k: machines[k].get("order", 0)):
        m = machines[name]
        c = dict(m)
        c["os_pass"] = "****" if c.get("os_pass") else ""
        c["bmc_pass"] = "****" if c.get("bmc_pass") else ""
        c["os_alive"] = _status_cache.get(("os", name), False)
        c["bmc_alive"] = _status_cache.get(("bmc", name)) if m.get("bmc_ip") else None
        c["health"] = _health_cache.get(name, ("unknown", 0))[0]
        c.pop("status", None)
        safe.append(c)
    return {"machines": safe}


@app.delete("/api/machines/{name}")
def delete_machine(name: str):
    if name in machines:
        del machines[name]
        _save_data()
    return {"ok": True}


# ---- 單機 / 整櫃 控制與詳細資訊 ----
# OS 系統資訊「最後一次成功抓取」的快取（關機時回給前端當歷史值）
_os_info_cache = {}
_os_info_time = {}


@app.get("/api/machine/{name}")
def machine_get_one(name: str):
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    m = machines[name]
    c = dict(m)
    c["os_pass"] = "****" if c.get("os_pass") else ""
    c["bmc_pass"] = "****" if c.get("bmc_pass") else ""
    c["os_alive"] = ping_check(m.get("os_ip"), 2)
    c["bmc_alive"] = ping_check(m.get("bmc_ip"), 2) if m.get("bmc_ip") else None
    return {"machine": c}


def _bmc_safe(m):
    """回傳不含密碼的機台資訊 + 即時 ping。"""
    c = dict(m)
    c["os_pass"] = "****" if c.get("os_pass") else ""
    c["bmc_pass"] = "****" if c.get("bmc_pass") else ""
    c["os_alive"] = ping_check(m.get("os_ip"), 2) if m.get("os_ip") else None
    c["bmc_alive"] = ping_check(m.get("bmc_ip"), 2) if m.get("bmc_ip") else None
    return c


@app.get("/api/ping-ip")
def ping_ip(ip: str = ""):
    """直接 ping 一個原始 IP，回傳是否在線（用於「新增元件前檢查」）。"""
    ip = (ip or "").strip()
    if not ip:
        return {"ok": False, "alive": False}
    return {"ok": True, "ip": ip, "alive": ping_check(ip, 2)}


@app.get("/api/rack/ping")
def rack_ping(project: str = "", name: str = ""):
    """Ping 一個整櫃（或專案內所有 rack）：OS + BMC 各一燈。
    指定 name 就只 ping 那台；指定 project 就 ping 該專案所有 machine。"""
    if name:
        if name not in machines:
            raise HTTPException(404, f"機台不存在: {name}")
        targets = [machines[name]]
    elif project:
        targets = [m for m in machines.values() if m.get("project") == project]
    else:
        targets = list(machines.values())
    results = []
    def ping_one(m):
        return {
            "name": m["name"],
            "level": m.get("level", "system"),
            "os_ip": m.get("os_ip"),
            "bmc_ip": m.get("bmc_ip"),
            "os_alive": ping_check(m.get("os_ip"), 2) if m.get("os_ip") else None,
            "bmc_alive": ping_check(m.get("bmc_ip"), 2) if m.get("bmc_ip") else None,
        }
    with ThreadPoolExecutor(max_workers=16) as ex:
        results = list(ex.map(ping_one, targets))
    return {"ok": True, "nodes": results}


# ---- 機櫃拓樸 / 連線圖 ----
@app.get("/api/links")
def list_links():
    """回傳所有連線。"""
    return {"ok": True, "links": links}


@app.post("/api/links")
def add_link(body: dict):
    """新增連線 {a, a_port, b, b_port, type}。type: eth/ib/power/coolant。"""
    a = str(body.get("a", "")).strip()
    b = str(body.get("b", "")).strip()
    t = str(body.get("type", "eth")).strip()
    a_port = str(body.get("a_port", "") or "").strip()
    b_port = str(body.get("b_port", "") or "").strip()
    if not a or not b or a == b:
        raise HTTPException(400, "連線需要兩個不同端點")
    # 去重（無向）：同兩端且同類型視為同一條（允許 a_port/b_port 不同→多條同類型連線）
    if not a_port and not b_port:
        for lk in links:
            if {lk.get("a"), lk.get("b")} == {a, b} and lk.get("type") == t:
                return {"ok": True, "note": "已存在", "links": links}
    links.append({"a": a, "b": b, "type": t,
                  "a_port": a_port or None, "b_port": b_port or None})
    _save_data()
    return {"ok": True, "links": links}


@app.delete("/api/links")
def delete_link(body: dict):
    """刪除連線 {a, b}。"""
    a = str(body.get("a", "")).strip()
    b = str(body.get("b", "")).strip()
    for i, lk in enumerate(links):
        if {lk.get("a"), lk.get("b")} == {a, b}:
            links.pop(i)
            _save_data()
            return {"ok": True, "links": links}
    return {"ok": True, "note": "未找到", "links": links}


@app.post("/api/machine/{name}/power")
def machine_power(name: str, body: dict):
    """對機台開/關機。body: {on: bool}。優先使用該機台的自訂 power 指令。"""
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    m = machines[name]
    action = "poweron" if body.get("on") else "poweroff"
    ok, info = run_control_cmd(m, action)
    # 狀態查詢：自訂指令不存在 power status → 略過
    if m.get("power_on_cmd") or m.get("power_off_cmd"):
        return {"ok": ok, "action": "on" if body.get("on") else "off", "info": info, "power_status": ""}
    _, status = ipmi_power(m, "status")
    return {"ok": ok, "action": "on" if body.get("on") else "off", "info": info, "power_status": (status or "").strip()}


@app.post("/api/machine/{name}/aux")
def machine_aux_cycle(name: str, body: dict = None):
    """對機台執行 AUX / AC cycle（ac cycle）。優先使用自訂 aux_cmd。"""
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    m = machines[name]
    ok, info = run_control_cmd(m, "aux")
    return {"ok": ok, "action": "aux", "info": info}


@app.post("/api/machine/{name}/reboot")
def machine_reboot(name: str, body: dict = None):
    """對機台執行 OS reboot。透過 sshpass/ssh 到 OS 下 reboot；無 OS 才改用 BMC chassis power reset。"""
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    m = machines[name]
    ok, info = _reboot_machine(m)
    return {"ok": ok, "action": "reboot", "info": info}


def _reboot_machine(m):
    """OS reboot：SSH 進 OS 下 reboot。若無 OS 連線資訊，退而求其次用 BMC chassis power reset。"""
    if m.get("os_ip") and m.get("os_user") and m.get("os_pass"):
        out, rc, err = ssh_run(m["os_ip"], m.get("os_user", ""), m.get("os_pass", ""),
                               m.get("os_port", 22), "sudo -n true 2>/dev/null && sudo reboot || reboot", timeout=10)
        if rc == 0 or ("reboot" in (out or "") or "Connection" in (err or "")):
            return True, "已送出 reboot（OS）— SSH 可能馬上斷線代表正在重開"
        # ssh 執行 reboot 後連線通常會立刻斷，rc 可能非 0，但能連上且送出即視為成功
        if err and ("closed" in err.lower() or "refused" in err.lower() or "broken" in err.lower()):
            return True, "已送出 reboot（OS 連線中斷，代表正在重開）"
        return False, f"SSH 無法送 reboot：{err or '無回應'}"
    if m.get("bmc_ip") and m.get("bmc_user") and m.get("bmc_pass"):
        ok, info = ipmi_power(m, "reset")
        return ok, f"（無 OS，改用 BMC power reset）{info}"
    return False, "此元件無 OS 亦無 BMC，無法 reboot"


@app.get("/api/machine/{name}/power")
def machine_power_status(name: str):
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    ok, status = ipmi_power(machines[name], "status")
    return {"ok": ok, "power_status": (status or "").strip()}


# ---- 硬體資訊（CPU / DIMM / SSD / NIC / GPU 型號）----
_HW_CMD = (
    "echo '===HW==='; "
    "echo '__CPU__'; lscpu 2>/dev/null | grep -E 'Model name:|Socket\\(s\\)|Core\\(s\\) per socket|Thread\\(s\\) per core|CPU\\(s\\):' ; "
    "echo '__DIMM__'; dmidecode -t memory 2>/dev/null | grep -E 'Size:|Type:|Speed:|Part Number:' | grep -v 'No Module' | grep -v 'Unknown' ; "
    "echo '__SOCKETDIMM__'; dmidecode -t memory 2>/dev/null | grep -c 'Size: ' ; "
    "echo '__BLK__'; lsblk -d -o NAME,MODEL,SIZE,TRAN 2>/dev/null | grep -v loop ; "
    "echo '__NIC__'; lspci 2>/dev/null | grep -Ei 'Ethernet|Network controller|InfiniBand' ; "
    "echo '__IPLINK__'; ip -o link show 2>/dev/null | awk -F': ' '{print $2}' | grep -Ev '^(lo|dummy|docker|virbr|veth|br-|vlan)' | sed 's/@.*//' ; "
    "echo '__GPU__'; nvidia-smi --query-gpu=index,name,memory.total,utilization.gpu --format=csv,noheader 2>/dev/null ; "
    "echo '__FW__'; dmidecode -t bios 2>/dev/null | grep -E 'Vendor:|Version:|Release Date:' | sed 's/^[[:space:]]*//' ; "
    "echo '__FW_SSD__'; for n in /sys/class/nvme/nvme[0-9]/firmware_rev; do [ -f \"$n\" ] && fw=$(cat \"$n\" | tr -d '[:space:]') && [ -n \"$fw\" ] && echo \"$(basename $(dirname $n)): $fw\"; done ; "
    "echo '__FW_NIC__'; for i in $(ls /sys/class/net/ 2>/dev/null | grep -Ev '^(lo|docker|veth|virbr|br-)'); do fw=$(ethtool -i \"$i\" 2>/dev/null | awk -F': ' '/firmware-version/{gsub(/^ +| +$/,\"\",$2); print $2}'); [ -n \"$fw\" ] && echo \"$i: $fw\"; done ; "
    "echo '__FW_GPU__'; nvidia-smi --query-gpu=index,name,vbios_version --format=csv,noheader 2>/dev/null ; "
    "true"
)

def parse_hw(text):
    """解析硬體命令輸出 → {cpu, dimm, ssd, nic, gpu}。回 None 表示無法解析。"""
    if not text:
        return None
    hw = {}
    # CPU
    cpu_line = next((l for l in text.splitlines() if "Model name:" in l), "")
    sockets = next((l.split(":")[1].strip() for l in text.splitlines() if l.strip().startswith("Socket")), "")
    cores_s = next((l.split(":")[1].strip() for l in text.splitlines() if "Core(s) per socket" in l), "")
    thr_s = next((l.split(":")[1].strip() for l in text.splitlines() if "Thread(s) per core" in l), "")
    cpu = cpu_line.split("Model name:")[1].strip() if "Model name:" in cpu_line else ""
    if cpu:
        hw["cpu"] = {"model": cpu, "sockets": sockets, "cores": cores_s, "threads": thr_s}
    # DIMM：抓所有 Size + 唯一 Part Number + Type/Speed
    sizes, parts, types, speeds = [], [], [], []
    for l in text.splitlines():
        s = l.strip()
        if s.startswith("Size:"):
            v = s.split(":", 1)[1].strip()
            if v and v != "No Module Installed":
                sizes.append(v)
        elif s.startswith("Part Number:"):
            v = s.split(":", 1)[1].strip()
            if v and v.upper() != "NO DIMM" and v not in parts:
                parts.append(v)
        elif s.startswith("Type:") and "Error" not in s and s != "Type: Unknown":
            v = s.split(":", 1)[1].strip()
            if v and v not in types:
                types.append(v)
        elif s.startswith("Speed:"):
            v = s.split(":", 1)[1].strip()
            if v and "Unknown" not in v and v not in speeds:
                speeds.append(v)
    if parts:
        hw["dimm"] = {"count": len(sizes), "parts": parts, "types": types, "speeds": speeds}
    def _section(start, end=None):
        """擷取 start 標記到 end（或下一個 __XX__ 標記）之間的非空行。"""
        lines = text.splitlines()
        out, on = [], False
        for ln in lines:
            s = ln.strip()
            if s.startswith("__") and s.endswith("__") and not s.startswith(start):
                if on and end is None:
                    break
            if s == start:
                on = True
                continue
            if end is not None and s == end:
                break
            if on and s:
                out.append(s)
        return out

    # SSD / NVMe（lsblk：NAME MODEL SIZE TRAN）
    devs = []
    for l in _section("__BLK__", "__NIC__"):
        cols = l.split()
        if len(cols) >= 2 and "model" not in cols[1].lower() and cols[0].lower() != "name":
            devs.append({"name": cols[0], "model": " ".join(cols[1:-2]),
                         "size": cols[-2] if len(cols) >= 3 else "", "tran": cols[-1] if cols else ""})
    devs = [d for d in devs if d.get("model") and d["model"].lower() not in ("loop",) and d["name"].lower().startswith(("nvme", "sd", "hd", "vd", "md"))]
    if devs:
        hw["ssd"] = devs
    # NIC（優先 lspci；不同品牌網卡名稱各異，若 LSPCI 抓不到改用 ip link 列出實體網卡）
    nics = _section("__NIC__", "__IPLINK__")
    if not nics:
        nics = [f"網路介面：{s}" for s in _section("__IPLINK__", "__GPU__")]
    if nics:
        hw["nic"] = nics
    # GPU（nvidia-smi: index,name,mem_total,util）
    gpus = []
    for l in _section("__GPU__"):
        parts = [p.strip() for p in l.split(",")]
        if len(parts) >= 4:
            gpus.append({"name": parts[1], "mem": parts[2], "util": parts[3]})
    if gpus:
        hw["gpu"] = gpus

    # Firmware 版本（BIOS / NVMe SSD / NIC / GPU）——跨 vendor 用標準工具容錯收集
    fw = {}
    bios = {}
    for l in _section("__FW__", "__FW_SSD__"):
        k, _, v = l.partition(":")
        ke = k.strip().lower()
        if "vendor" in ke: bios["vendor"] = v.strip()
        elif "version" in ke: bios["version"] = v.strip()
        elif "release" in ke: bios["release"] = v.strip()
    if bios:
        fw["bios"] = bios
    ssd_fw = []
    for l in _section("__FW_SSD__", "__FW_NIC__"):
        d, _, v = l.partition(":")
        if v.strip():
            ssd_fw.append({"dev": d.strip(), "fw": v.strip()})
    if ssd_fw:
        fw["ssd"] = ssd_fw
    nic_fw = []
    for l in _section("__FW_NIC__", "__FW_GPU__"):
        i, _, v = l.partition(":")
        if v.strip():
            nic_fw.append({"iface": i.strip(), "fw": v.strip()})
    if nic_fw:
        fw["nic"] = nic_fw
    gpu_fw = []
    for l in _section("__FW_GPU__"):
        parts = [p.strip() for p in l.split(",")]
        # nvidia-smi csv: index,name,firmware_version
        if len(parts) >= 3:
            gpu_fw.append({"index": parts[0], "name": parts[1], "fw": parts[2]})
    if gpu_fw:
        fw["gpu"] = gpu_fw
    if fw:
        hw["firmware"] = fw
    return hw or None


def _parse_os_summary(raw):
    """從 os_info raw（uname+OSREL+UPTIME+CPU+MEM）解析出簡潔結構。"""
    s = {"uname": "", "distro": "", "uptime": "", "cpu": "", "mem": ""}
    if not raw:
        return s
    section, distro_vals = "", {}
    for line in raw.splitlines():
        line = line.rstrip()
        if line.startswith("---"):
            section = line.strip("-").strip()
            continue
        if section == "OSREL":
            if "=" in line:
                k, v = line.split("=", 1)
                distro_vals[k] = v.strip('"')
        elif section == "UPTIME" and line.strip():
            s["uptime"] = line.strip()
        elif section == "CPU" and line.strip():
            s["cpu"] = line.strip()
        elif section == "MEM" and line.strip():
            s["mem"] = line.strip()
        elif not section and not s["uname"] and line.strip():
            s["uname"] = line.strip()
    s["distro"] = distro_vals.get("PRETTY_NAME", distro_vals.get("NAME", ""))
    if distro_vals.get("VERSION_ID") and "VERSION_ID" not in distro_vals.get("PRETTY_NAME", ""):
        s["distro"] = f'{distro_vals.get("PRETTY_NAME", distro_vals.get("NAME",""))}' or s["distro"]
    return s


_os_hw_cache = {}            # name -> {cpu,dimm,ssd,nic,gpu}（硬體型號，變化極低）
_os_hw_time = {}             # name -> 抓取時間

# BMC FW / 電源快取：OOB lanplus 對 Cisco CIMC 等每連一次可達 15s，避免每次 detail 都卡。
# refresh=1 時強制重抓；一般瀏覽用 TTL 秒數內秒回。
_bmc_fw_cache = {}           # name -> (ts, fw_list)
_bmc_pwr_cache = {}          # name -> (ts, power_str)
_BMC_TTL = 60                # 秒
_bmc_pending = set()         # name -> 背景抓取進行中

@app.get("/api/machine/{name}/detail")
def machine_detail(name: str, refresh: int = 0):
    """單機詳細頁：BMC/OS 資訊（只讀，不做開關機）。
    refresh=1 時強制重新抓取 OS/HW 資訊（「重新整理」按鈕）。"""
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    m = machines[name]
    base = _bmc_safe(m)
    out = {"machine": base}
    now = datetime.datetime.now()

    # ---- OS / 硬體資訊（SSH） ----
    if base.get("os_alive"):
        want_fresh = bool(refresh) or name not in _os_info_cache
        if want_fresh:
            hostname, rc, err = ssh_run(m["os_ip"], m.get("os_user",""), m.get("os_pass",""), m.get("os_port",22),
                                        "uname -a && echo ---OSREL--- && cat /etc/os-release 2>/dev/null | head -4 && echo ---UPTIME--- && uptime && echo ---CPU--- && nproc && echo ---MEM--- && free -h | head -2 && echo ---GPU--- && nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu --format=csv,noheader 2>/dev/null | head -20")
            if rc == 0 and hostname:
                _os_info_cache[name] = hostname
                _os_info_time[name] = now.isoformat(timespec="seconds")
        # 硬體型號（CPU/DIMM/SSD/NIC/GPU）— 變化極低；refresh 時也重新抓
        if name not in _os_hw_cache or refresh:
            try:
                hwout, hw_rc, _ = ssh_run(m["os_ip"], m.get("os_user",""), m.get("os_pass",""), m.get("os_port",22),
                                          _HW_CMD, timeout=20)
                hw = parse_hw(hwout) if hw_rc == 0 else None
                if hw:
                    _os_hw_cache[name] = hw
                    _os_hw_time[name] = now.isoformat(timespec="seconds")
            except Exception:
                pass

        hostname = _os_info_cache.get(name, "")
        out["os_info"] = {"raw": hostname, "fetched_at": _os_info_time.get(name),
                          "os": _parse_os_summary(hostname)}
        out["os_info_cached"] = (not want_fresh and name in _os_info_cache)
        if name in _os_hw_cache:
            out["os_info"]["hw"] = _os_hw_cache.get(name)
            out["os_info"]["hw_fetched_at"] = _os_hw_time.get(name)
        if not hostname:
            out["os_info"]["cached_note"] = "SSH 無回應，暫無 OS 資訊"
    else:
        # 關機/不可連 → 回傳最後一次成功抓取的資訊
        out["os_info"] = {"raw": _os_info_cache.get(name, ""),
                          "fetched_at": _os_info_time.get(name)}
        out["os_info_cached"] = (name in _os_info_cache)
        if name in _os_hw_cache:
            out["os_info"]["hw"] = _os_hw_cache.get(name)
            out["os_info"]["hw_fetched_at"] = _os_hw_time.get(name)
        if name in _os_info_cache:
            out["os_info"]["cached_note"] = "此為最後一次成功抓取的資訊（機台目前不可連）"

    # ---- BMC：FW + 電源（有快取秒回；refresh=1 強制重抓；首次背景非同步） ----
    if base.get("bmc_alive"):
        nowts = time.time()
        fw_ts, fw = _bmc_fw_cache.get(name, (0, []))
        pwr_ts, pwr = _bmc_pwr_cache.get(name, (0, ""))
        fw_fresh = (nowts - fw_ts) < _BMC_TTL
        pwr_fresh = (nowts - pwr_ts) < _BMC_TTL
        if fw_fresh and pwr_fresh:
            out["fw"], out["power"] = fw, pwr
        elif refresh or name in _bmc_pending:
            # refresh 明確要求，或背景抓取已進行中 → 回目前快取（可能為空）
            out["fw"], out["power"] = fw, pwr
            out["bmc_loading"] = (name in _bmc_pending)
        else:
            # 首次進入：背景抓取，先回空 + bmc_loading，前端稍後輪詢
            _bmc_pending.add(name)
            out["fw"], out["power"] = fw, pwr
            out["bmc_loading"] = True
            def _bg(name=name):
                try:
                    nf = ipmi_fw_list(machines.get(name) or m)
                    ok, npwr = ipmi_power(machines.get(name) or m, "status")
                    _bmc_fw_cache[name] = (time.time(), nf)
                    _bmc_pwr_cache[name] = (time.time(), npwr)
                except Exception:
                    pass
                finally:
                    _bmc_pending.discard(name)
            threading.Thread(target=_bg, daemon=True).start()
        # 感測器（sdr list）很慢，由前端呼叫 /sensors 非同步載入。
    return out


# ---- 感測器（慢，獨立端點 + 背景快取）----
_sensors_cache = {}          # name -> data
_sensors_time = {}           # name -> timestamp
_sensors_pending = {}        # name -> 是否有抓取執行中（避免併發重複抓）
_SENSORS_TTL = 600           # 秒內直接回傳快取（感測器 sdr list 抓取慢且狀態變動不快，TTL 太短會讓前端頻繁出現『背景重抓中』）
_sensors_lock = threading.Lock()

def _fetch_sensors_async(name: str):
    """背景執行 ipmitool sdr list，結果寫入快取（同一時間只抓一台一次）。"""
    with _sensors_lock:
        if _sensors_pending.get(name):
            return
        _sensors_pending[name] = True
    try:
        m = machines.get(name)
        if not m:
            return
        data = ipmi_sensor_summary(m)
        with _sensors_lock:
            _sensors_cache[name] = data
            _sensors_time[name] = time.time()
    except Exception:
        pass
    finally:
        with _sensors_lock:
            _sensors_pending.pop(name, None)


@app.get("/api/machine/{name}/sensors")
def machine_sensors(name: str, refresh: int = 0):
    """感測器：有快取立即回，否則啟動背景抓取並回傳 loading 提示。
    refresh=1 時忽略 TTL，直接重新抓取。"""
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    if refresh:
        _sensors_time.pop(name, None)   # 強制視為過期 → 啟動重抓
    now = time.time()
    with _sensors_lock:
        t = _sensors_time.get(name)
        fresh = t is not None and (now - t) < _SENSORS_TTL
        cached = _sensors_cache.get(name)
    if fresh and cached is not None:
        return {"machine": name, "sensors": cached, "loading": False, "cached": True}
    if cached is not None:
        # 快取過期：先回舊值，背後重新抓
        with _sensors_lock:
            pending = _sensors_pending.get(name)
        if not pending:
            th = threading.Thread(target=_fetch_sensors_async, args=(name,), daemon=True)
            th.start()
        return {"machine": name, "sensors": cached, "loading": True, "cached": True, "refreshing": True}
    # 完全沒有快取：啟動背景抓取，回傳 loading
    with _sensors_lock:
        pending = _sensors_pending.get(name)
    if not pending:
        th = threading.Thread(target=_fetch_sensors_async, args=(name,), daemon=True)
        th.start()
    return {"machine": name, "sensors": None, "loading": True, "cached": False}


@app.get("/api/machine/{name}/sensors/analyze")
def machine_sensors_analyze(name: str):
    """針對單機 BMC 感測器摘要（sdr）叫 Ollama 做『簡短』AI 診斷。
    讀取已抓取到的感測器快取，把 critical/warning/ok 數量與異常條目給 LLM，回一段話。"""
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    with _sensors_lock:
        cached = _sensors_cache.get(name)
    if not cached or cached.get("error"):
        return {"ok": False, "error": "感測器尚未抓取完成，稍後再試"}
    if not cached.get("critical") and not cached.get("warning"):
        if cached.get("ns"):
            return {"ok": True,
                    "analysis": f"✅ 主要感測器皆正常（無 Critical / Warning），但 {cached['ns']} 筆感測器 No Reading（ns）未回傳數值，建議留意是否有感測器/線路異常。",
                    "summary": _sensor_summary(cached)}
        return {"ok": True, "analysis": "✅ 所有感測器皆正常（無 Critical / Warning / No Reading）。", "summary": _sensor_summary(cached)}

    summary = _sensor_summary(cached)
    crit_lines = "；".join(cached.get("critical_entries") or [])[-600:]
    warn_lines = "；".join(cached.get("warning_entries") or [])[-600:]
    sys_prompt = (
        "你是伺服器 BMC/IPMI 感測器的資深維運工程師。使用者會給你單台的感測器摘要。\n"
        "請用繁體中文，回覆**非常簡短**的一段話（2~3 句內，勿超過 3 句），語氣平實：\n"
        "1) 先一句：整體感測器狀態『正常』還是『有異常警訊』。\n"
        "2) 若有異常，簡短點出最需注意的感測器（可提名字與數值）與可能方向（散熱/電源/溫度等）；若正常則不需列。\n"
        "3) 不要列點、不要給指令、不要重複列出所有數值。"
    )
    user_prompt = f"以下為該機台 BMC 感測器摘要：\n{summary}\n異常關鍵行：{crit_lines}{('；'+warn_lines) if warn_lines else ''}\n請給簡短診斷："
    payload = {
        "model": OLLAMA_MODEL, "prompt": sys_prompt + "\n\n" + user_prompt + "\nAssistant:",
        "stream": False, "think": False,
        "options": {"temperature": 0.3, "num_predict": 320},
    }
    try:
        import requests
        r = requests.post(OLLAMA_URL + "/api/generate", json=payload, timeout=45)
        txt = (r.json().get("response") or "").strip()
        if not txt:
            return {"ok": False, "error": "Ollama 未產生內容"}
    except Exception as e:
        return {"ok": False, "error": f"AI 診斷失敗: {e}"}
    return {"ok": True, "summary": summary, "analysis": txt}


def _sensor_summary(s):
    return (f"共 {s.get('total',0)} 筆感測器：Critical {s.get('critical',0)}、"
            f"Warning {s.get('warning',0)}、OK {s.get('ok',0)}、其他 {s.get('ns',0)}。")

# ---- 專案分類 ----
@app.post("/api/projects")
def add_project(body: AddProject):
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "專案名稱不能為空")
    if name in projects:
        raise HTTPException(400, f"專案已存在: {name}")
    order = max([p.get("order", 0) for p in projects.values()] or [-1]) + 1
    projects[name] = {"name": name, "desc": body.desc, "order": order}
    _save_data()
    return {"ok": True, "project": projects[name]}


@app.get("/api/projects")
def list_projects():
    result = []
    # 依手動順序排列
    for name in sorted(projects, key=lambda k: projects[k].get("order", 0)):
        p = projects[name]
        count = sum(1 for m in machines.values() if m.get("project") == p["name"])
        result.append({**p, "machine_count": count, "index": list(projects.keys()).index(name)})
    return {"projects": result}


@app.post("/api/machines/reorder")
def reorder_machines(body: dict):
    """批次設定機台順序：{names: [hostname...]} 依序寫入 order，只存檔一次。
    用於 System Manager 拖曳換位，避免逐台 PATCH 多次寫檔。"""
    names = body.get("names", [])
    if not names:
        raise HTTPException(400, "names 不能為空")
    for i, n in enumerate(names):
        if n in machines:
            machines[n]["order"] = i
    _save_data()
    return {"ok": True}


@app.post("/api/projects/reorder")
def reorder_projects(body: dict):
    names = body.get("names", [])
    if not names:
        raise HTTPException(400, "names 不能為空")
    for i, n in enumerate(names):
        if n in projects:
            projects[n]["order"] = i
    _reindex_projects()
    _save_data()
    return {"ok": True}


@app.delete("/api/projects/{name}")
def delete_project(name: str):
    # 有機台的專案不可刪除（避免誤刪整批）；若一定要刪得先移走機台
    count = sum(1 for m in machines.values() if m.get("project") == name)
    if count:
        raise HTTPException(400, f"專案「{name}」下還有 {count} 台機台，請先移走/刪除機台才能刪除專案")
    if name in projects:
        del projects[name]
        _save_data()
    return {"ok": True}


@app.patch("/api/projects/{name}")
def edit_project(name: str, body: AddProject):
    if name not in projects:
        raise HTTPException(404, f"專案不存在: {name}")
    new_name = (body.name or "").strip() or name
    if new_name != name:
        # 改名：不可與現有專案重名
        if new_name in projects and new_name != name:
            raise HTTPException(400, f"專案已存在: {new_name}")
        # 同步更新所有掛在此專案下的機台
        for m in machines.values():
            if m.get("project") == name:
                m["project"] = new_name
        projects[new_name] = {
            "name": new_name,
            "desc": body.desc or projects[name].get("desc", ""),
            "order": projects[name].get("order", 0),
        }
        del projects[name]
    else:
        projects[name]["desc"] = body.desc or projects[name].get("desc", "")
    _save_data()
    return {"ok": True, "project": projects[new_name]}


# ---- 網頁終端機（xterm / SSH bridge）----
def _start_terminal(websocket: WebSocket, machine, kind: str, overrides: dict = None):
    """建立 paramiko 互動 shell，並在 SSH <-> WebSocket 之間橋接。
    kind: 'os' 連 OS；'bmc' 連 BMC。overrides 可覆寫 host/user/pass/port（例如 passive 元件點開時由前端動態填帳密）。"""
    overrides = overrides or {}
    if kind == "os":
        host = overrides.get("host") or machine.get("os_ip", "")
        user = overrides.get("user") or machine.get("os_user", "")
        pw   = overrides.get("pass") or machine.get("os_pass", "")
        port = overrides.get("port") or machine.get("os_port", 22)
    else:
        host = overrides.get("host") or machine.get("bmc_ip", "")
        user = overrides.get("user") or machine.get("bmc_user", "")
        pw   = overrides.get("pass") or machine.get("bmc_pass", "")
        port = overrides.get("port") or machine.get("bmc_port", 623)

    if not host or not user or not pw:
        asyncio.run_coroutine_threadsafe(
            websocket.send_json({"type": "error", "msg": f"{kind} 未設定連線資訊"}),
            asyncio.get_event_loop(),
        )
        return None, None

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(host, port=port, username=user, password=pw, timeout=8)
    except Exception as e:
        asyncio.run_coroutine_threadsafe(
            websocket.send_json({"type": "error", "msg": f"{kind} SSH 連線失敗: {e}"}),
            asyncio.get_event_loop(),
        )
        return None, None

    channel = client.invoke_shell(width=120, height=30)
    channel.settimeout(0.05)
    return client, channel


def _channel_pump(channel, websocket, loop, stop_flag):
    """把 SSH channel 的輸出不斷送到 WebSocket（背景執行緒）。"""
    while not stop_flag.is_set():
        try:
            if channel.recv_ready():
                data = channel.recv(4096)
                if data:
                    asyncio.run_coroutine_threadsafe(
                        websocket.send_bytes(data),
                        loop,
                    )
            elif channel.exit_status_ready() and not channel.recv_ready():
                # 對方 shell 已結束且沒有剩餘輸出
                break
            else:
                import time
                time.sleep(0.02)
        except Exception:
            break
    asyncio.run_coroutine_threadsafe(websocket.close(), loop)


TERM_BRIDGE_URL = "ws://127.0.0.1:6968"


async def _proxy_ws(websocket: WebSocket, target_path: str):
    """把前端 WebSocket 雙向代理到 node terminal bridge（port 6968）。
    target_path 為要連到 bridge 的路徑（例如 /ws/terminal/{name}/{kind} 或 /ws/broadcast）。"""
    await websocket.accept()
    url = TERM_BRIDGE_URL + target_path
    try:
        async with websockets.connect(url, max_size=None) as upstream:
            async def client_to_upstream():
                try:
                    while True:
                        message = await websocket.receive()
                        if message["type"] == "websocket.disconnect":
                            break
                        text = message.get("text")
                        if text is not None:
                            await upstream.send(text)
                        else:
                            await upstream.send(message.get("bytes"))
                except Exception:
                    pass
                finally:
                    try:
                        await upstream.close()
                    except Exception:
                        pass

            async def upstream_to_client():
                try:
                    async for data in upstream:
                        if isinstance(data, (bytes, bytearray)):
                            await websocket.send_bytes(bytes(data))
                        else:
                            await websocket.send_text(str(data))
                except Exception:
                    pass
                finally:
                    try:
                        await websocket.close()
                    except Exception:
                        pass

            await asyncio.gather(client_to_upstream(), upstream_to_client())
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "msg": f"無法連到 terminal bridge：{exc}"})
        except Exception:
            pass
        try:
            await websocket.close()
        except Exception:
            pass


@app.websocket("/ws/terminal/{name}/{kind}")
async def terminal(websocket: WebSocket, name: str, kind: str):
    # 終端已移轉至獨立的 node/ssh2 bridge（port 6968，事件驅動，避免 paramiko
    # 併發 SSH 造成 "Invalid packet blocking"）。此處雙向代理到 bridge 對應路徑。
    await _proxy_ws(websocket, f"/ws/terminal/{name}/{kind}")


# ---- 整櫃廣播終端（Broadcast Terminal）----
# 一台控制端同時把同個輸入送到多台被選取系統的 OS shell，
# 輸出依主機名稱個別標記送回前端（Clusterssh / screen fan-out 風格）。
def _open_broadcast_shell(machine):
    """建立單台機器的 OS SSH shell，回傳 (client, channel)；失敗回 (None, None)。"""
    host = machine.get("os_ip"); user = machine.get("os_user"); pw = machine.get("os_pass")
    port = machine.get("os_port") or 22
    if not host or not user or not pw:
        return None, None
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(host, port=port, username=user, password=pw, timeout=8)
        channel = client.invoke_shell(width=100, height=24)
        channel.settimeout(0.05)
        return client, channel
    except Exception:
        try:
            client.close()
        except Exception:
            pass
        return None, None


@app.websocket("/ws/rack-broadcast")
async def rack_broadcast(websocket: WebSocket):
    # 廣播終端已移轉至 node terminal bridge（/ws/broadcast，port 6968）。此處
    # 把 /ws/rack-broadcast 雙向代理到 bridge 的 /ws/broadcast，路徑不同需轉換。
    await _proxy_ws(websocket, "/ws/broadcast")


# ---- AI Copilot（串本機 Ollama）----
OLLAMA_URL = "http://127.0.0.1:11434"
OLLAMA_MODEL = "qwen3.8:27b"


class CopilotReq(BaseModel):
    message: str = Field(..., description="使用者輸入")


def _copilot_context():
    """把目前機台/健康度整理成給 LLM 的文字 context。"""
    lines = []
    for name in sorted(machines, key=lambda k: machines[k].get("order", 0)):
        m = machines[name]
        h = _health_cache.get(name, ("unknown", 0))[0]
        lines.append(
            f"- {name} | level={m.get('level','system')} | project={m.get('project','-')} | "
            f"os_ip={m.get('os_ip')} | bmc_ip={m.get('bmc_ip') or '-'} | "
            f"os_alive={_status_cache.get(('os',name))} | health={h}"
        )
    return "\n".join(lines)


@app.post("/api/copilot")
def copilot_chat(body: CopilotReq):
    _refresh_status()   # 確保 context 用的是最新掃描/健康資料
    sys = (
        "You are the AI assistant (Copilot) for a Wistron GPU server management system. "
        "Answer the user in Traditional Chinese (zh-TW), concise and practical. "
        "health values: green=OK, amber=warning, red=critical, unknown=offline/unreachable.\n"
        "CRITICAL RULE: you MUST answer ONLY from the CURRENT FLEET below. "
        "Never invent or assume machine names, projects, temperatures, or issues that are "
        "not listed. If a machine has health=unknown, say it is unreachable/offline. "
        "If only one machine is green, say exactly that one.\n\n"
        "CURRENT FLEET:\n" + _copilot_context()
    )
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": sys + "\n\nUser: " + body.message + "\nAssistant:",
        "stream": False,
        "options": {"temperature": 0.4, "num_predict": 600},
    }
    try:
        import requests
        r = requests.post(OLLAMA_URL + "/api/generate", json=payload, timeout=120)
        r.raise_for_status()
        text = (r.json().get("response") or "").strip()
        if not text:
            return {"ok": False, "error": "ollama 回傳空白"}
        return {"ok": True, "reply": text}
    except Exception as e:
        return {"ok": False, "error": f"ollama 呼叫失敗: {e}"}


# ---- 系統診斷（收集 OS/BMC 問題 → 串 Ollama qwen 自動分析）----
class DiagReq(BaseModel):
    include_bmc: bool = True


def _collect_diag(m):
    """收集診斷輸入：OS 側（dmesg/journalctl/nvidia-smi/df/free/uptime）+ 本機 ipmitool（SEL/sensor）。
    一律優先透過 SSH 進 OS 執行（可正確處理 -C 17 這類 OOB cipher），OS 不可連才用 OOB。"""
    if m.get("passive"):
        return {"collect": {}, "note": "此為無 OS/BMC 的純機櫃元件，無法收集診斷資料。"}
    out = {}
    # OS 側：用 SSH 一次收集 + 順帶在 OS 內跑本機 ipmitool（SEL）
    os_cmd = (
        "echo '======= UPTIME ======='; uptime; "
        "echo '======= OS ======='; cat /etc/os-release 2>/dev/null | head -2; "
        "echo '======= MEM ======='; free -h; "
        "echo '======= DISK ======='; df -h | grep -Ev '^tmpfs|^udev|loop'; "
        "echo '======= LOAD/TOP ======='; ps -eo pcpu,pmem,comm --sort=-pcpu | head -12; "
        "echo '======= DMESG-ERR ======='; dmesg -T 2>/dev/null | grep -iE 'error|fail|warn|panic|oops|mce|nvme|pcie|temperature|thermal' | tail -30; "
        "echo '======= JOURNAL-ERR ======='; journalctl -p err -n 30 --no-pager 2>/dev/null | tail -30; "
        "echo '======= GPU ======='; nvidia-smi --query-gpu=index,name,utilization.gpu,temperature.gpu,memory.used,memory.total,power.draw --format=csv,noheader 2>/dev/null | head -10"
    )
    osout, rc, err = ssh_run(m.get("os_ip"), m.get("os_user",""), m.get("os_pass",""),
                             m.get("os_port",22), os_cmd, timeout=30)
    out["os"] = osout or (err or ("OS 連線失敗或收集失敗"))
    # IPMI SEL（event log）：優先 OS 內 -I open，其次 OOB。回傳收集方式供前端顯示。
    sel_out, sel_rc, sel_err = ssh_ipmi(m, ["sel", "elist"], timeout=25)
    bmc_mode = "os_local" if (sel_rc == 0 and sel_out) else "oob"
    out["bmc"] = sel_out or (sel_err or "IPMI SEL 讀取失敗")
    out["bmc_mode"] = bmc_mode
    return {"collect": out}


@app.post("/api/machine/{name}/diagnose")
def machine_diagnose(name: str, body: DiagReq = None):
    """收集單機診斷資料並串 Ollama 分析，回傳問題摘要與處理建議。
    流程：收集 dmesg/journalctl/GPU/BMC event log → 呼叫 qwen3.8 分析。"""
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    m = machines[name]
    body = body or DiagReq()
    diag = _collect_diag(m)
    collect = diag.get("collect", {})
    if diag.get("note"):
        return {"ok": True, "note": diag["note"], "report": None}
    os_snip = (collect.get("os") or "")[:4000]
    bmc_snip = (collect.get("bmc") or "")[:2000] if body.include_bmc else ""
    sys_prompt = (
        "你是伺服器軟體/硬體工程師的 AI 診斷助手。使用者會提供一台伺服器的系統診斷原始輸出"
        "（OS 的 dmesg/journalctl/CPU/記憶體/磁碟/GPU，以及 BMC 的 IPMI SEL event log）。\n"
        "請用繁體中文，條列式輸出：\n"
        "1) **健康摘要**：簡短說明目前看起來正常/異常。\n"
        "2) **發現的問題**：依嚴重度列出（Critical/Hight/Medium/Low），每條給『證據（從輸出引述）』與『可能成因』。\n"
        "3) **建議處理**：給可執行的檢查與處理步驟（指令/順序/注意事項），務必務實、精確。\n"
        "4) **是否需要立即處理**：Yes/No + 一句話。\n"
        "限制：只根據提供的輸出分析，不要編造不存在的數據；若資料不足請明確說無法判斷。"
    )
    user_prompt = "OS/BMC 診斷輸出如下：\n===== OS =====\n" + os_snip + \
                  ("\n===== BMC SEL =====\n" + bmc_snip if bmc_snip else "")
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": sys_prompt + "\n\n" + user_prompt + "\nAssistant:",
        "stream": False,
        "think": False,          # qwen3 是 thinking 模型；關閉思考以免 num_predict 全被推理吃光
        "options": {"temperature": 0.3, "num_predict": 4096},
    }
    report = None
    raw_debug = ""
    try:
        import requests
        for attempt in range(2):
            r = requests.post(OLLAMA_URL + "/api/generate", json=payload, timeout=300)
            raw = r.json()
            raw_debug = raw.get("done_reason") or ""
            report = (raw.get("response") or "").strip()
            if report:
                break
            time.sleep(2)
        if not report:
            return {"ok": False,
                    "error": f"Ollama 未產生分析結果（done_reason={raw_debug or 'unknown'}）。請確認模型 qwen3.8:27b 可用。",
                    "collect": collect}
    except Exception as e:
        return {"ok": False, "error": f"AI 分析失敗: {e}", "collect": collect}
    return {"ok": True, "report": report,
            "collected_at": datetime.datetime.now().isoformat(timespec="seconds"),
            "collect": collect}


# ---- System Telemetry（CPU/DIMM/SSD/NIC/GPU）----
_telemetry_thread = None


@app.on_event("startup")
def _start_telemetry():
    global _telemetry_thread
    if _telemetry_thread is None:
        _telemetry_thread = telemetry_core.start_worker()


@app.get("/api/machine/{name}/telemetry")
def machine_telemetry(name: str, minutes: int = 60, kind: str = "all"):
    """回傳某台機台的 System Telemetry 歷史（時間範圍由 minutes 控制）。
    kind: all=OS+GPU, os=僅 OS, gpu=僅 GPU。
    """
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    telemetry_core.init_db()
    result = {"machine": name, "window_min": int(minutes)}
    if kind in ("all", "os"):
        result["os"] = telemetry_core.get_os_series(name, int(minutes))
    if kind in ("all", "gpu"):
        result["gpu"] = telemetry_core.get_gpu_series(name, int(minutes))
    return result


def _tel_latest(r):
    """取 series 最後幾筆，回傳趨勢文字（最新值 + 方向）。"""
    if not r:
        return None
    vals = [x for x in r if x is not None]
    if not vals:
        return None
    last = vals[-1]
    if len(vals) >= 2:
        prev = vals[-2]
        try:
            delta = last - prev
            if delta > 0.0001: return f"{last:.1f} (升)" if isinstance(last,(int,float)) else str(last)
            if delta < -0.0001: return f"{last:.1f} (降)" if isinstance(last,(int,float)) else str(last)
        except Exception:
            pass
    return f"{last:.1f}" if isinstance(last,(int,float)) else str(last)


@app.get("/api/machine/{name}/telemetry/analyze")
def machine_telemetry_analyze(name: str, minutes: int = 60):
    """針對單機 Telemetry 數據，叫 Ollama 做『簡短』AI 分析（幾句話說明是否正常）。
    避免大量文字：指令要求精簡，適合放在 telemetry 頁頂部的提示列。"""
    if name not in machines:
        raise HTTPException(404, f"機台不存在: {name}")
    telemetry_core.init_db()
    osd = telemetry_core.get_os_series(name, int(minutes))
    gpu = telemetry_core.get_gpu_series(name, int(minutes))
    os_arr = osd.get("os") or []
    if not os_arr:
        return {"ok": False, "error": "此範圍尚無 telemetry 資料，無法分析"}

    # ---- 組成簡短指標摘要 ----
    def last_key(k):
        vals = [r[k] for r in os_arr if r.get(k) is not None]
        return vals[-1] if vals else None
    def trend_key(k):
        vals = [r[k] for r in os_arr if r.get(k) is not None]
        return _tel_latest(vals)

    cpu = trend_key("cpu_used"); load1 = trend_key("load1"); load5 = trend_key("load5")
    memp = last_key("mem_used_pct"); memu = last_key("mem_used_gb"); memt = last_key("mem_total_gb")
    disk = ""
    disks = osd.get("disk") or []
    if disks:
        dm = disks[0]
        pcts = [p for p in dm.get("pct", []) if p is not None]
        if pcts:
            mnt = (dm.get("mount") or "").strip() or "儲存空間"
            disk = f"磁碟 {mnt} {pcts[-1]:.0f}%"
    gpu_line = ""
    gser = gpu.get("series") or []
    if gser:
        g0 = gser[0]
        ut = [u for u in g0.get("util", []) if u is not None]
        tp = [t for t in g0.get("temp", []) if t is not None]
        pw = [p for p in g0.get("power", []) if p is not None]
        gpu_line = (f"GPU[0] util {ut[-1]:.0f}%" if ut else "") + \
                   (f", temp {tp[-1]:.0f}°C" if tp else "") + \
                   (f", power {pw[-1]:.0f}W" if pw else "")

    mem_txt = f"{memp:.1f}%" if isinstance(memp, (int, float)) else "未知"
    summary = (f"CPU使用率最新 {cpu}%，Load 1m={load1} / 5m={load5}；"
               f"記憶體使用率 {mem_txt}（已用 {memu}/{memt}GB）；{disk or '無磁碟資料'}；{gpu_line or '無GPU資料'}。")

    sys_prompt = (
        "你是伺服器 AI/GPU 機房的資深工程師。使用者會給你一台伺服器『監控指標摘要』。\n"
        "請用繁體中文，回覆**非常簡短**的一段話（2~3 句內，勿超過 3 句），語氣平實：\n"
        "1) 先一句：整體『正常』還是『有異常警訊』。\n"
        "2) 若有異常，簡短點出最需注意的 1 個指標與可能方向；若正常則不需列。\n"
        "3) 不要列點、不要給指令、不要重複列出所有數值。"
    )
    user_prompt = "以下為該機台最近數分鐘的監控摘要：\n" + summary + "\n請給簡短分析："
    payload = {
        "model": OLLAMA_MODEL, "prompt": sys_prompt + "\n\n" + user_prompt + "\nAssistant:",
        "stream": False, "think": False,
        "options": {"temperature": 0.3, "num_predict": 300},
    }
    try:
        import requests
        r = requests.post(OLLAMA_URL + "/api/generate", json=payload, timeout=120)
        txt = (r.json().get("response") or "").strip()
        if not txt:
            return {"ok": False, "error": "Ollama 未產生內容"}
    except Exception as e:
        return {"ok": False, "error": f"AI 分析失敗: {e}"}
    return {"ok": True, "summary": summary, "analysis": txt, "minutes": int(minutes)}


# ---- 靜態前端 ----
# no-cache：確保瀏覽器永遠拿到最新 JS/CSS，避免舊版卡住（改版後不用手動清快取）
class _NoCacheStaticFiles(StaticFiles):
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)

    def file_response(self, *a, **kw):
        resp = super().file_response(*a, **kw)
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return resp


app.mount("/static", _NoCacheStaticFiles(directory="static"), name="static")


@app.get("/")
def index():
    resp = FileResponse("static/index.html")
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return resp
