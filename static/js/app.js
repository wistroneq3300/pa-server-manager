"use strict";
/* Wistron PA Server Manager - frontend */
const NAV_ITEMS = [
  { id: "dashboard", icon: "🏠", label: "首頁 / Dashboard", group: "總覽" },
  { id: "projects",  icon: "🖘", label: "System manager", group: "管理" },
  { id: "rack",      icon: "🗄", label: "Rack Manager", group: "管理" },
];
const TITLES = { dashboard: "首頁 / Dashboard", projects: "System manager", rack: "Rack Manager", machine: "單機詳情" };
const RENDERERS = { dashboard: pageDashboard, projects: pageProjects, rack: pageRack, machine: pageMachine };
const state = { view: "dashboard" };
const $ = (id) => document.getElementById(id);
let machines = [];
let projects = [];
const root = document.documentElement;
function applyTheme(t) {
  root.dataset.theme = t;
  localStorage.setItem("pa_theme", t);
  $("mode-label").textContent = "Mode: " + (t === "dark" ? "Dark" : "Light");
}
function loadTheme() {
  const saved = localStorage.getItem("pa_theme") || "light";
  applyTheme(saved);
}
async function api(path, options) {
  const r = await fetch(path, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.detail || "請求失敗"); e.data = data; throw e; }
  return data;
}
async function loadMachines(assignMissingU) {
  const data = await api("/api/machines");
  machines = data.machines || [];
  // 一次性：為尚未有 rack_u 的 rack 機台指派 U（依專案內既有 order，由上往下 42→…）
  if (assignMissingU !== false) {
    const racks = machines.filter(m => m.level === "rack");
    const byProj = {};
    racks.forEach(m => { (byProj[m.project] = byProj[m.project] || []).push(m); });
    for (const p of Object.keys(byProj)) {
      const ms = byProj[p].sort((a,b)=>(a.order||0)-(b.order||0));
      let u = 42;
      for (const m of ms) {
        if (typeof m.rack_u !== "number" || m.rack_u < 1) {
          m.rack_u = u;
          // 同步寫回後端（非等待，失敗也不影響顯示）
          rackAssign(m.name, { rack_u: u }).catch(()=>{});
          u--;
        }
      }
    }
  }
}
async function loadProjects() {
  const data = await api("/api/projects");
  projects = data.projects || [];
}
function statusBadge(alive) {
  if (alive === true) return `<span class="badge green"><span class="dot"></span>在線</span>`;
  if (alive === false) return `<span class="badge red"><span class="dot"></span>離線</span>`;
  return `<span class="badge" style="background:var(--bg-panel-2);color:var(--text-faint)">未設定</span>`;
}
// BMC 電源狀態：解析 ipmitool 原始輸出（如 "Chassis Power is on/off"）→ 彩色 badge
function powerBadge(raw) {
  const s = String(raw || "").toLowerCase();
  if (/\bon\b/.test(s) && !/\boff\b/.test(s)) return `<span class="badge green"><span class="dot"></span>電源開啟 <span class="mono">ON</span></span>`;
  if (/\boff\b/.test(s)) return `<span class="badge red"><span class="dot"></span>電源關閉 <span class="mono">OFF</span></span>`;
  return `<span class="badge" style="background:var(--bg-panel-2);color:var(--text-faint)">未知</span>`;
}
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function projectMembers(pname) {
  return machines.filter(m => m.project === pname).sort((a, b) => (a.order||0) - (b.order||0));
}
function unassignedMachines() { return machines.filter(m => !m.project); }
function pageDashboard() {
  const total = machines.length;
  const online = machines.filter(m => m.os_alive === true).length;
  const offline = machines.filter(m => m.os_alive === false).length;
  const unknown = total - online - offline;
  const racks = machines.filter(m => m.level === "rack").length;
  const systems = machines.filter(m => m.level !== "rack").length;
  const ring = total ? `
    <svg viewBox="0 0 120 120" class="donut">
      <circle class="donut-track" cx="60" cy="60" r="48"/>
      <circle class="donut-val good" cx="60" cy="60" r="48" stroke-dasharray="${(online/total)*301.6} 301.6"/>
      <circle class="donut-val warn" cx="60" cy="60" r="48" stroke-dasharray="${(unknown/total)*301.6} 301.6" stroke-dashoffset="${-(online/total)*301.6}"/>
      <circle class="donut-val bad" cx="60" cy="60" r="48" stroke-dasharray="${(offline/total)*301.6} 301.6" stroke-dashoffset="${-((online+unknown)/total)*301.6}"/>
      <text x="60" y="58" class="donut-n">${total}</text>
      <text x="60" y="74" class="donut-l">受管系統</text>
    </svg>` :
    `<div class="empty-small">尚無系統</div>`;
  const projCards = projects.map(p => {
    const members = projectMembers(p.name);
    const o = members.filter(m => m.os_alive === true).length;
    const off = members.length - o;
    return `
      <div class="dash-proj" onclick="viewProject('${esc(p.name)}')" title="點我看此專案">
        <div class="dash-proj-head">
          <span class="dash-proj-name">📁 ${esc(p.name)}</span>
          <span class="dash-proj-count">${members.length} 台</span>
        </div>
        ${p.desc ? `<div class="dash-proj-desc">${esc(p.desc)}</div>` : ""}
        <div class="dash-proj-bar"><div class="dash-proj-bar-in" style="width:${members.length? o/members.length*100:0}%"></div></div>
        <div class="dash-proj-stats">
          <span class="mini">🖥 L10 ${members.filter(m=>m.level!=="rack").length}</span>
          <span class="mini">🗄 L11 ${members.filter(m=>m.level==="rack").length}</span>
          <span class="mini green">● ${o} 線上</span>
          <span class="mini red">● ${off} 離線</span>
        </div>
      </div>`;
  }).join("");
  return `
    <div class="dash-kpis">
      <div class="stat"><div class="k">受管系統</div><div class="v">${total}</div></div>
      <div class="stat"><div class="k">Rack / L11</div><div class="v" style="color:var(--accent-blue)">${racks}</div></div>
      <div class="stat"><div class="k">System / L10</div><div class="v" style="color:var(--w-green)">${systems}</div></div>
      <div class="stat"><div class="k">線上</div><div class="v" style="color:var(--green)">${online}</div></div>
      <div class="stat"><div class="k">離線</div><div class="v" style="color:var(--red)">${offline}</div></div>
    </div>
    <div class="dash-mid">
      <div class="glass-panel health-panel">
        <div class="card-title">SUT Health Overview</div>
        <div class="health-body">
          ${ring}
          <div class="health-legend">
            <div class="hl"><span class="dot dot-g"></span> Healthy ${online}</div>
            <div class="hl"><span class="dot dot-r"></span> Critical ${offline}</div>
            <div class="hl"><span class="dot dot-y"></span> Unknown ${unknown}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="dash-bottom">
      <div class="glass-panel proj-panel">
        <div class="card-title">Projects <span class="hint">${projects.length} 個專案</span></div>
        <div class="dash-proj-grid">${projCards}</div>
      </div>
      <div class="glass-panel copilot-panel">
        <div class="card-title">AI Copilot <span class="hint" id="cop-model">Ollama · qwen3.8</span></div>
        <div class="copilot-body" id="cop-box" style="max-height:440px;overflow:auto">
          <div class="copilot-msg ai">👋 我是 AI Copilot（串到你本機 Ollama qwen3.8:27b）。目前已監控 <b>${total}</b> 台系統、<b>${online}</b> 線上、<b>${offline}</b> 離線。問我任何問題～（例如「哪台有問題？」「proj_k 專案狀態？」）</div>
        </div>
        <div class="copilot-input">
          <input class="input" id="cop-input" placeholder="輸入指令給 Copilot…" autocomplete="off">
          <button class="btn primary" id="cop-send">送出</button>
        </div>
      </div>
    </div>
  `;
}

function copAppend(role, html) {
  const box = document.getElementById("cop-box");
  if (!box) return;
  box.insertAdjacentHTML("beforeend", `<div class="copilot-msg ${role}">${html}</div>`);
  box.scrollTop = box.scrollHeight;
}
async function copSend() {
  const inp = document.getElementById("cop-input");
  const send = document.getElementById("cop-send");
  const text = (inp ? inp.value : "").trim();
  if (!text) return;
  copAppend("user", esc(text));
  if (inp) inp.value = "";
  if (send) { send.disabled = true; send.textContent = "…"; }
  try {
    const r = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const j = await r.json();
    if (j.ok) copAppend("ai", esc(j.reply).replace(/\n/g, "<br>"));
    else copAppend("ai", `⨠ ${esc(j.error || "呼叫失敗")}`);
  } catch (e) {
    copAppend("ai", `⨠ ${esc("無法連線到後端： " + e.message)}`);
  } finally {
    if (send) { send.disabled = false; send.textContent = "送凨"; }
  }
}
function bindCopilot() {
  const inp = document.getElementById("cop-input");
  const send = document.getElementById("cop-send");
  if (send) send.addEventListener("click", copSend);
  if (inp) inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); copSend(); } });
}

function viewProject(pname) {
  projectLevelFilter.val = "all";
  state.view = "projects";
  setView("projects");
}
/* ============ Rack Manager (L11 整櫃監控/控制) ============ */
const rackView = { mode: "list", project: "", pinged: null };
function rackPowerState(name) {
  return rackSim[name] || (rackSim[name] = { on: true, led: "green" });
}
function rackSetProject(v) {
  rackView.project = v;
  rackView.pinged = null;
  setView("rack");
}
function rackSetMode(mode) {
  rackView.mode = mode;
  setView("rack");
}
async function rackPing(project) {
  const btn = $("rack-ping-btn");
  if (btn) { btn.textContent = "⏳ Ping 中…"; btn.disabled = true; }
  try {
    const data = await api(`/api/rack/ping?project=${encodeURIComponent(project)}`);
    rackView.pinged = data.nodes;
  } catch (e) {
    rackView.pinged = [];
    alert("Ping 失敗：" + e.message);
  }
  if (btn) { btn.textContent = "📡 Ping Rack"; btn.disabled = false; }
  setView("rack");
}
async function rackPowerAll(project, on) {
  const racks = machines.filter(m => m.level === "rack" && m.project === project);
  if (!racks.length) return alert("此專案沒有整櫃機台");
  const okMsg = `正在${on ? "開機" : "關機"}${racks.length} 台整櫃機台…`;
  const done = [];
  for (const m of racks) {
    try {
      const r = await api(`/api/machine/${encodeURIComponent(m.name)}/power`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on })
      });
      done.push(`${m.name}: 錯誤 ${e.message}`);
    } catch (e) {
      done.push(`${m.name}: 錯誤 ${e.message}`);
    }
  }
  setView("rack");
  setTimeout(() => alert(okMsg + "\n\n" + done.join("\n")), 200);
}
async function singlePower(name, on) {
  if (!confirm(`確定要「${on ? "開機" : "關機"}」${name} 嗎？`)) return;
  try {
    const r = await api(`/api/machine/${encodeURIComponent(name)}/power`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on })
    });
    setView("rack");
    setTimeout(() => alert(`${name} ${r.ok ? (on ? "已開機 🟢" : "已關機 ⚪") : "操作失敗：" + (r.info||"")}
目前狀態：${r.power_status}`), 200);
  } catch (e) {
    alert("操作失敗：" + e.message);
  }
}
// 整櫃 list 自選清單 ping 結果
function rackPingNode(m) {
  const n = (rackView.pinged || []).find(x => x.name === m.name);
  const osUp = n ? n.os_alive : null;
  const bmcUp = n ? n.bmc_alive : null;
  const lamp = (v) => v === true ? `<span class="ping-lamp on" title="Online">🟢</span>`
              : v === false ? `<span class="ping-lamp off" title="No reply">🔴</span>`
              : `<span class="ping-lamp none" title="未 Ping">⨪</span>`;
  const nm = `${esc(m.name)}${m.passive ? ' <span class="badge badge-rack" style="font-size:9px;padding:1px 6px">無BMC</span>' : ""}`;
  return `<td class="mono">${nm}</td>
          <td>${m.os_ip ? `${lamp(osUp)} <span class="ping-ip mono">${esc(m.os_ip)}</span>` : `<span style="color:var(--text-faint)">—</span>`}</td>
          <td>${m.bmc_ip ? `${lamp(bmcUp)} <span class="ping-ip mono">${esc(m.bmc_ip)}</span>` : `<span style="color:var(--text-faint)">—</span>`}</td>`;
}
/* ================= Rack Manager 整合頁（Rackmap + 卡片/清單 + MGX 元件） ================= */
const MGX_TYPES = {
  server:      { icon: "🖥", label: "Server 伺服器",    cls: "mgx-server" },
  switch:      { icon: "🔀", label: "Switch 交換器",    cls: "mgx-switch" },
  powershelf:  { icon: "⚡", label: "Power Shelf 電源", cls: "mgx-ps" },
  pdu:         { icon: "🔌", label: "PDU 電源分配器",   cls: "mgx-ps" },
  cdu:         { icon: "💧", label: "CDU 冷卻分配單元", cls: "mgx-cdu" },
  storage:     { icon: "💾", label: "Storage 儲存",     cls: "mgx-storage" },
  network:     { icon: "🌐", label: "Network 網路功能", cls: "mgx-network" },
};
function mgxTypeOf(m) {
  if (m.mgx_type && MGX_TYPES[m.mgx_type]) return m.mgx_type;
  const n = (m.name || "").toLowerCase();
  if (n.includes("sw")) return "switch";
  if (n.includes("ps") || n.includes("pdu") || n.includes("power")) return "powershelf";
  if (n.includes("cdu")) return "cdu";
  if (n.includes("stor") || n.includes("nas")) return "storage";
  if (n.includes("gw") || n.includes("fw") || n.includes("router")) return "network";
  return "server";
}
function mgxInfo(m) { return MGX_TYPES[mgxTypeOf(m)] || MGX_TYPES.server; }
async function rackAssign(machine, patch) {
  await api(`/api/machines/${encodeURIComponent(machine)}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch)
  });
}
function rackMoveDialog(name) {
  const m = machines.find(x => x.name === name);
  if (!m) return;
  const proj = m.project;
  const members = machines.filter(x => x.level === "rack" && x.project === proj);
  const usedUs = new Set(members
    .filter(x => x.name !== name && typeof x.rack_u === "number" && x.rack_u > 0)
    .map(x => x.rack_u));
  let opts = "";
  for (let u = 42; u >= 1; u--) {
    opts += `<option value="${u}" ${(m.rack_u || 0) === u ? "selected" : ""} ${usedUs.has(u) ? "disabled" : ""}>U${u}${usedUs.has(u) ? "（已占用）" : ""}</option>`;
  }
  const typeBtns = Object.entries(MGX_TYPES)
    .map(([k, v]) => `<button class="btn small ${mgxTypeOf(m) === k ? "active" : ""}" onclick="rackMoveSetType('${esc(m.name)}','${k}')">${v.icon} ${esc(v.label)}</button>`)
    .join("");
  showDialog("⇅ 移動 / 設定位置", `
    <div class="rm-modal-body">
      <p style="margin-bottom:12px">機台：<b>${esc(m.name)}</b>（目前 U${m.rack_u || "—"}）</p>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">選擇目標 U 槽（已占用顯示灰）</label>
      <select class="input" id="rm-move-u" style="width:100%;padding:8px">${opts}</select>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">${typeBtns}</div>
      <p style="font-size:11px;color:var(--text-faint);margin-top:10px">元件類型：<b id="rm-newtype">${esc(MGX_TYPES[mgxTypeOf(m)].label)}</b></p>
    </div>`,
    [
      { txt: "取消", cls: "", fn: () => closeDialog() },
      { txt: "儲存位置", cls: "primary", fn: () => {
        const u = +$("rm-move-u").value;
        const patch = { rack_u: u };
        if (rackMoveTargetType) patch.mgx_type = rackMoveTargetType;
        rackAssign(m.name, patch).then(() => { closeDialog(); setView("rack"); });
      } },
    ]);
}
function rackMoveSetType(name, type) {
  const lbl = $("rm-newtype"); if (lbl) lbl.textContent = MGX_TYPES[type].label;
  rackMoveTargetType = type;
}
let rackMoveTargetType = null;
async function rackAddPassive() {
  const proj = rackView.project;
  showDialog("➕ 新增機櫃元件（無 OS/BMC 亦可）", `
    <div class="rm-modal-body">
      <p style="margin-bottom:12px;font-size:12px;color:var(--text-faint)">用於加入 switch / power shelf / CDU / PDU / Storage 等<b>沒有 OS 或 BMC</b>的元件。只需名稱 + 類型 + U 槽即可，加入後可再指派專案。</p>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">元件名稱 *</label>
      <input class="input" id="rp-name" style="width:100%;padding:8px;margin-bottom:12px" placeholder="例如 SW-01 / CDU-1 / PS-3">
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">類型</label>
      <select class="input" id="rp-type" style="width:100%;padding:8px;margin-bottom:12px">
        ${Object.entries(MGX_TYPES).map(([k,v]) => `<option value="${k}">${v.icon} ${esc(v.label)}</option>`).join("")}
      </select>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">U 槽</label>
      <select class="input" id="rp-u" style="width:100%;padding:8px;margin-bottom:12px">
        ${Array.from({length:42},(_,i)=>42-i).map(u => `<option value="${u}">U${u}</option>`).join("")}
      </select>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">管理 IP（選填，可 ping 用）</label>
      <input class="input" id="rp-ip" style="width:100%;padding:8px" placeholder="留空則無 IP">
    </div>`,
    [
      { txt: "取消", cls: "", fn: () => closeDialog() },
      { txt: "建立並加入", cls: "primary", fn: () => {
        const name = $("rp-name").value.trim();
        if (!name) return alert("請填元件名稱");
        api("/api/rack/passive", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, mgx_type: $("rp-type").value, rack_u: +$("rp-u").value, manage_ip: $("rp-ip").value.trim(), project: proj }) })
          .then(() => loadMachines())
          .then(() => { closeDialog(); setView("rack"); })
          .catch(e => alert("建立失敗：" + e.message));
      } },
    ]);
}
function rackAddDialog() {
  const proj = rackView.project;
  const inRack = new Set(machines.filter(x => x.project === proj && x.level === "rack").map(x => x.name));
  const candidates = machines.filter(x => !inRack.has(x.name));
  if (!candidates.length) { alert("沒有可加入的機台（所有機台都已在此機櫃）"); return; }
  const selOpts = candidates.map(m => `<option value="${esc(m.name)}">${esc(m.name)} (${esc(m.os_ip||"—")})</option>`).join("");
  const members = machines.filter(x => x.level === "rack" && x.project === proj);
  const usedUs = new Set(members.filter(x => typeof x.rack_u === "number" && x.rack_u > 0).map(x => x.rack_u));
  let uopts = "";
  for (let u = 42; u >= 1; u--) uopts += `<option value="${u}" ${usedUs.has(u) ? "disabled" : ""}>U${u}${usedUs.has(u) ? "（已用）" : ""}</option>`;
  showDialog("➕ 加入機櫃", `
    <div class="rm-modal-body">
      <p style="margin-bottom:12px;font-size:12px;color:var(--text-faint)">把既有機台（L10 或 L11）加入機櫃專案「${esc(proj)}」並指派 U 槽。</p>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">選擇機台</label>
      <select class="input" id="rm-add-m" style="width:100%;padding:8px;margin-bottom:12px">${selOpts}</select>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">選擇 U 槽</label>
      <select class="input" id="rm-add-u" style="width:100%;padding:8px">${uopts}</select>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin:12px 0 6px">元件類型</label>
      <select class="input" id="rm-add-type" style="width:100%;padding:8px">
        ${Object.entries(MGX_TYPES).map(([k, v]) => `<option value="${k}">${v.icon} ${esc(v.label)}</option>`).join("")}
      </select>
    </div>`,
    [
      { txt: "取消", cls: "", fn: () => closeDialog() },
      { txt: "加入", cls: "primary", fn: () => {
        const nm = $("rm-add-m").value, u = +$("rm-add-u").value, ty = $("rm-add-type").value;
        rackAssign(nm, { project: proj, level: "rack", rack_u: u, mgx_type: ty })
          .then(() => { closeDialog(); setView("rack"); })
          .catch(e => alert("加入失敗：" + e.message));
      } },
    ]);
}
function dialogBackdrop() {
  let b = $("rm-dialog");
  if (b) return b;
  b = document.createElement("div");
  b.className = "modal-backdrop"; b.id = "rm-dialog"; b.style.display = "none";
  b.innerHTML = `<div class="modal rm-modal"><div class="modal-head"><div class="modal-title" id="rm-dialog-title"></div><button class="btn small" onclick="closeDialog()">✕</button></div><div class="modal-body" id="rm-dialog-body"></div><div class="modal-foot" id="rm-dialog-foot"></div></div>`;
  document.body.appendChild(b);
  return b;
}
function showDialog(title, bodyHtml, actions) {
  const b = dialogBackdrop();
  $("rm-dialog-title").textContent = title;
  $("rm-dialog-body").innerHTML = bodyHtml;
  const foot = $("rm-dialog-foot");
  foot.innerHTML = "";
  (actions || []).forEach(a => {
    const btn = document.createElement("button");
    btn.textContent = a.txt; btn.className = "btn " + (a.cls || "");
    btn.onclick = () => a.fn();
    foot.appendChild(btn);
  });
  b.style.display = "flex";
}
function closeDialog() { const b = $("rm-dialog"); if (b) b.style.display = "none"; rackMoveTargetType = null; }

function pageRack() {
  const racksAll = machines.filter(m => m.level === "rack");
  const projSet = [...new Set(racksAll.map(m => m.project).filter(Boolean))];
  if (!projSet.includes(rackView.project)) rackView.project = projSet[0] || "";
  const proj = rackView.project;
  const members = racksAll.filter(m => m.project === proj);
  const pinged = rackView.pinged || [];
  const anyRack = racksAll.length > 0;
  if (!rackView._linksLoaded) {
    rackView._linksLoaded = true;
    loadLinks().then(() => { if (state.view === "rack") setView("rack"); });
  }

  // 只列「有 L11（Rack）機台」的專案
  const selOpts = projSet.map(pn => `<option value="${esc(pn)}" ${pn === proj ? "selected" : ""}>${esc(pn)}（${racksAll.filter(m=>m.project===pn).length} 台）</option>`).join("");
  const toolbar = `
    <span class="spacer"></span>
    <label class="rack-sel">機櫃專案
      <select class="input" onchange="rackSetProject(this.value)">
        <option value="">（選擇機櫃專案）</option>
        ${selOpts}
      </select>
    </label>`;

  return `
    <div class="rack-hero">
      <div class="rack-hero-title">🗄 Rack Manager <span class="hint">（整合頁：機櫃平面圖 + 卡片 + 清單）</span></div>
      <div class="rack-hero-sub">${esc(proj || "（未選專案）")} 專案 · ${members.length} 台 | MGX 元件：Server / Switch / Power Shelf / CDU</div>
      ${toolbar}
      ${anyRack ? `
      <button class="btn primary" id="rack-ping-btn" onclick="rackPing('${esc(rackView.project)}')">📡 Ping Rack</button>
      <button class="btn" onclick="rackAddDialog()">➕ 加入機櫃</button>
      <button class="btn" onclick="rackAddPassive()">➕ 新增元件</button>
      <button class="btn" onclick="linkAddDialog()">➕ 新增連線</button>
      <button class="btn" onclick="rackPowerAll('${esc(rackView.project)}',true)">⏻ 開機整櫃</button>
      <button class="btn btn-danger" onclick="rackPowerAll('${esc(rackView.project)}',false)">⏻ 關機整櫃</button>
      <button class="btn primary" onclick="rackBroadcastDialog('${esc(rackView.project)}')">📡 廣播終端</button>` : ""}
    </div>
    <div class="rack-status-legend">
      ${Object.values(MGX_TYPES).filter((v, i, a) => a.findIndex(x => x.cls === v.cls) === i).map(v => `<span class="mgx-legend"><span class="mgx-dot ${v.cls}"></span>${esc(v.label)}</span>`).join("")}
      &nbsp;·&nbsp; 狀態：<span class="ping-lamp on">🟢</span> Up &nbsp;<span class="ping-lamp off">🔴</span> Down &nbsp;<span class="ping-lamp none">⨪</span> 未 Ping
    </div>
    ${anyRack && members.length ? rackLayoutHtml(members, pinged) : (anyRack ? emptyRackCard() : "")}
    `;
}
// 機櫃頁面排版：只有「平面圖」檢視在右欄顯示拓樸連線圖；卡片/清單為全寬、不顯示拓樸。
function rackLayoutHtml(members, pinged) {
  if (devicesView === "plane") {
    const left = `<div class="rack-main-pad"><div class="rack-main-head">
        <span class="rack-hero-sub">機櫃平面圖（＋放置）</span>${rackSubviewTabs()}</div>${rackmapHtml(members, pinged)}
      </div>`;
    return `<div class="rack-layout plane">
      <div class="rack-left">${left}</div>
      <div class="rack-right">${rackTopoHtml(members)}</div>
    </div>`;
  }
  // 卡片 / 清單：全寬顯示，無拓樸
  return `<div class="rack-layout alone">${devicesHtml(members, pinged)}</div>`;
}
function emptyRackCard() {
  return `<div class="card" style="margin-top:18px"><div class="empty">目前沒有 L11（Rack）整櫃機台。<br>請在「新增系統」把層級選成 <b>L11 · Rack Level</b>，或「➕ 加入機櫃」把既有機台放進來。</div></div>`;
}
function rackmapHtml(members, pinged) {
  const rackU = {};
  members.forEach(m => {
    const u = (typeof m.rack_u === "number" && m.rack_u > 0) ? m.rack_u : 42;
    rackU[u] = m;
  });
  let rows = "";
  for (let u = 42; u >= 1; u--) {
    const m = rackU[u];
    if (!m) {
      rows += `<div class="rm-row rm-empty"><span class="rm-u mono">U${u}</span><div class="rm-empty-space" onclick="rackEmptyClick(${u})" title="點擊放置機台">＋</div></div>`;
      continue;
    }
    const n = pinged.find(x => x.name === m.name);
    const up = n ? n.os_alive : null;
    const info = mgxInfo(m);
    const cls = up === true ? "green" : up === false ? "red" : "none";
    const isPassive = !!m.passive;
    const click = isPassive ? `rackMoveDialog('${esc(m.name)}')` : `openMachine('${esc(m.name)}')`;
    const powerBtns = isPassive ? "" : `
          <button class="btn small" title="開機" onclick="singlePower('${esc(m.name)}',true)">⏻</button>
          <button class="btn small btn-danger" title="關機" onclick="singlePower('${esc(m.name)}',false)">⏻</button>`;
    const nm = `${info.icon} ${esc(m.name)}${isPassive ? ' <span class="badge badge-rack" style="font-size:9px;padding:1px 6px">無BMC</span>' : ''}`;
    rows += `
    <div class="rm-row" data-u="${u}">
      <span class="rm-u mono">U${u}</span>
      <div class="rm-cell ${cls} ${info.cls}" onclick="${click}">
        <span class="rm-lamp">${up === true ? "🟢" : up === false ? "🔴" : "⨪"}</span>
        <span class="rm-name">${nm}</span>
        <span class="rm-ip mono">${esc(m.os_ip || m.bmc_ip || "")}</span>
        <span class="rm-actions" onclick="event.stopPropagation()">
          ${powerBtns}
          <button class="btn small" title="換位/類型" onclick="rackMoveDialog('${esc(m.name)}')">⇅</button>
        </span>
      </div>
    </div>`;
  }
  return `
  <div class="rm-rack">
    <div class="rm-head"><span></span><span>${esc(rackView.project)} — 42U 機櫃（＋放置）</span></div>
    ${rows}
  </div>`;
}
function rackEmptyClick(u) {
  const proj = rackView.project;
  const members = machines.filter(x => x.project === proj && x.level === "rack");
  const inRack = new Set(members.map(x => x.name));
  const candidates = machines.filter(x => !inRack.has(x.name));
  if (!candidates.length) { alert("沒有未放置的機台。請先「➕ 加入機櫃」新增，或把機台移入此專案。"); return; }
  const opts = candidates.map(m => `<option value="${esc(m.name)}">${esc(m.name)} (${esc(m.os_ip)})</option>`).join("");
  showDialog(`放置到 U${u}`, `
    <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">選擇要放到 U${u} 的機台</label>
    <select class="input" id="rm-empty-m" style="width:100%;padding:8px">${opts}</select>`,
    [
      { txt: "取消", cls: "", fn: () => closeDialog() },
      { txt: "放置", cls: "primary", fn: () => {
        const nm = $("rm-empty-m").value;
        rackAssign(nm, { project: proj, level: "rack", rack_u: u }).then(() => { closeDialog(); setView("rack"); }).catch(e => alert("失敗：" + e.message));
      } },
    ]);
}
let devicesView = "plane";   // "plane" | "cards" | "list"
function devicesSetView(v) { devicesView = v; setView("rack"); }

// 機櫃檢視分頁（取代往下捲：切換卡片/清單/平面圖）
function rackSubviewTabs() {
  const defs = [
    ["plane", "🗄 平面圖"],
    ["cards", "▦ 卡片"],
    ["list", "▰ 清單"],
  ];
  return `<div class="rack-subtabs" role="tablist">` + defs.map(([k, lbl]) =>
    `<button class="btn small ${devicesView === k ? "active" : ""}" onclick="devicesSetView('${k}')">${lbl}</button>`
  ).join("") + `</div>`;
}

function devicesHtml(members, pinged) {
  const cardsView = devicesView === "cards";
  // 清單/卡片都依 U 由大到小（U42→U1）排列
  const byU = (a, b) => ((b.rack_u || 0) - (a.rack_u || 0));
  members = members.slice().sort(byU);
  let body;
  if (cardsView) {
    body = `<div class="rack-grid">` + members.map(m => {
      const n = pinged.find(x => x.name === m.name);
      const up = n ? n.os_alive : null;
      const info = mgxInfo(m);
      const isPassive = !!m.passive;
      const powerBtns = isPassive ? "" : `
          <button class="btn small" onclick="singlePower('${esc(m.name)}',true)">⏻ 開機</button>
          <button class="btn small btn-danger" onclick="singlePower('${esc(m.name)}',false)">⏻ 關機</button>`;
      return `
      <div class="rack-card ${info.cls}-card" ${isPassive ? `onclick="rackMoveDialog('${esc(m.name)}')" style="cursor:pointer"` : ""}>
        <div class="rack-card-top">
          <span class="rack-name">${info.icon} ${esc(m.name)}${isPassive ? ' <span class="badge badge-rack" style="font-size:9px;padding:1px 6px">無BMC</span>' : ''}</span>
          <span class="rstatus ${up === true ? "green" : up === false ? "red" : "amber"}">${up === true ? "🟢 上線" : up === false ? "🔴 離線" : "⨪ 未知"}</span>
        </div>
        <div class="rack-mgx"><span class="mgx-dot ${info.cls}"></span> ${esc(info.label)} · U${m.rack_u || "—"}</div>
        <div class="rack-proj">專案 ${esc(m.project || "—")} · OS ${esc(m.os_ip || "—")}<br>BMC ${esc(m.bmc_ip || "無")}</div>
        <div class="rack-actions" ${isPassive ? `onclick="event.stopPropagation()"` : ""}>
          ${powerBtns}
          <button class="btn small" onclick="rackMoveDialog('${esc(m.name)}')">⇅ 換位</button>
          <button class="btn small" onclick="openMachine('${esc(m.name)}')">ℹ 詳情</button>
        </div>
      </div>`;
    }).join("") + `</div>`;
  } else {
    body = `<div class="card"><div class="table-scroll"><table class="t rack-ping-table">
      <thead><tr><th>U</th><th>Node</th><th>類型</th><th>OS IP</th><th>BMC IP</th><th>狀態</th><th>操作</th></tr></thead>
      <tbody>` + members.map(m => {
        const n = pinged.find(x => x.name === m.name);
        const up = n ? n.os_alive : null;
        const info = mgxInfo(m);
        const lamp = v => v === true ? `<span class="ping-lamp on">🟢</span>` : v === false ? `<span class="ping-lamp off">🔴</span>` : `<span class="ping-lamp none">⨪</span>`;
        return `<tr>
          <td class="mono">U${m.rack_u || "—"}</td>
          <td class="mono">${esc(m.name)}</td>
          <td>${info.icon} ${esc(info.label)}</td>
          <td class="mono">${esc(m.os_ip)}</td>
          <td class="mono">${esc(m.bmc_ip || "—")}</td>
          <td>${lamp(up)}</td>
          <td style="white-space:nowrap">
            <button class="btn small" onclick="singlePower('${esc(m.name)}',true)">⏻ 開</button>
            <button class="btn small btn-danger" onclick="singlePower('${esc(m.name)}',false)">⏻ 關</button>
            <button class="btn small" onclick="rackMoveDialog('${esc(m.name)}')">⇅</button>
            <button class="btn small" onclick="openMachine('${esc(m.name)}')">ℹ</button>
          </td>
        </tr>`;
      }).join("") + `</tbody></table></div></div>`;
  }
  return `<div class="rack-main-pad">
    <div class="rack-main-head"><span class="rack-hero-sub">機櫃元件（${members.length}）</span>${rackSubviewTabs()}</div>
    ${body}
  </div>`;
}

/* ---------- 機櫃拓樸 / 連線圖 ---------- */
let linksCache = [];          // [{a,b,type,a_port,b_port}]
async function loadLinks() {
  try { const d = await api("/api/links"); linksCache = d.links || []; }
  catch (e) { linksCache = []; }
  return linksCache;
}
const LINK_TYPE = { eth: "Ethernet", ib: "InfiniBand", power: "電源", coolant: "液冷" };
function linkCss(t) { return "lk-" + (t || "eth"); }
// 連線類型 → SVG 顏色
const LINK_COLOR = { eth: "#2563eb", ib: "#a855f7", power: "#e0a800", coolant: "#14b8a6" };

// 由 mgx_type 決定 SVG 節點屬於哪一群（左欄 hub / 右欄 leaf）
function topoGroupOf(m) {
  const t = mgxTypeOf(m);
  return (t === "server" || t === "storage" || t === "network") ? "leaf" : "hub";
}

// 依成員與連線資料產生 SVG 連接圖。
// 版面：左＝交換/電源/冷卻（hub），右＝伺服/儲存（leaf）；每台可有多條連線到不同 switch。
// 每條邊依 a_port/b_port 在對應節點上標出 NIC 埠；顏色區分 eth/ib/power/coolant。
function rackTopoHtml(members) {
  const names = new Set(members.map(m => m.name));
  // 只取「兩端都在本專案」的連線，避免跨專案雜訊
  const rel = linksCache.filter(lk => names.has(lk.a) && names.has(lk.b));
  const involvedNm = new Set();
  rel.forEach(lk => { involvedNm.add(lk.a); involvedNm.add(lk.b); });

  if (!rel.length) {
    return `<div class="topo-card">
      <div class="topo-card-title">🔀 機櫃拓樸 / 連線圖 <span class="hint">（${rel.length} 條連線）</span></div>
      <div class="topo-empty">此機櫃沒有連線資料。<br>點「➕ 新增連線」把 server↔switch/PDU/CDU 接起來，即會顯示實體連線圖。</div>
    </div>`;
  }

  // 分類節點：有連線的 leaf（放右欄）與 hub（放左欄）；依 U 排列 leaf
  const byU = (a, b) => ((b.rack_u || 0) - (a.rack_u || 0));
  const leaves = members.filter(m => topoGroupOf(m) === "leaf" && involvedNm.has(m.name)).slice().sort(byU);
  const hubs = members.filter(m => topoGroupOf(m) === "hub" && involvedNm.has(m.name));

  const W = 780, H = Math.max(340, leaves.length * 44 + 50);
  const LEFTX = 150, RIGHTX = W - 26;
  const hubY = hubs.length ? Math.max(50, H / 2 - (hubs.length - 1) * 56 / 2) : 50;

  // ---- 節點（hub 左欄 / leaf 右欄）----
  let defs = "";
  let nodesSvg = "";
  hubs.forEach((m, i) => {
    const info = mgxInfo(m);
    const y = hubY + i * 55;
    defs += `<g id="port-hub-${esc(m.name)}" class="port-dot"></g>`;
    nodesSvg += `<g class="topo-svg-node hub">
      <rect x="${LEFTX-110}" y="${y-16}" width="108" height="32" rx="7" class="topo-node-box ${info.cls}"/>
      <text x="${LEFTX-110+8}" y="${y+4}" class="topo-node-ico">${info.icon}</text>
      <text x="${LEFTX-110+24}" y="${y+4}" class="topo-node-txt">${esc(m.name)}</text>
    </g>`;
  });
  leaves.forEach((m, i) => {
    const info = mgxInfo(m);
    const y = 30 + i * 46;
    nodesSvg += `<g class="topo-svg-node leaf">
      <rect x="${RIGHTX-150}" y="${y-15}" width="146" height="30" rx="7" class="topo-node-box ${info.cls}"/>
      <text x="${RIGHTX-150+8}" y="${y+4}" class="topo-node-ico">${info.icon}</text>
      <text x="${RIGHTX-150+24}" y="${y+4}" class="topo-node-txt">${esc(m.name)}</text>
    </g>`;
  });

  // ---- 連線（SVG 曲線）----
  // 收集每個 leaf 到每個 hub 的連線，依序分佈在 y 上偏移避免重疊
  const leafYof = {}; leaves.forEach((m, i) => leafYof[m.name] = 30 + i * 46);
  const hubYof = {}; hubs.forEach((m, i) => hubYof[m.name] = hubY + i * 55);

  // 為同一 leaf↔hub 對的多條連線做垂直偏移
  const lanes = {};   // key: "leaf|hub" -> idx
  const laneCount = {};// key: "leaf|hub" -> n
  rel.forEach(lk => {
    // 判斷 leaf/hub 各是哪邊
    const lkPair = [lk.a, lk.b];
    const leafSide = lkPair.find(n => leaves.find(l => l.name === n));
    const hubSide = lkPair.find(n => hubs.find(h => h.name === n));
    if (!leafSide || !hubSide) return;   // 跳過 leaf-leaf / hub-hub（罕見）
    const key = leafSide + "|" + hubSide;
    laneCount[key] = (laneCount[key] || 0) + 1;
  });
  let edgeSvg = "";
  const usedCurve = {};
  rel.forEach(lk => {
    const lkPair = [lk.a, lk.b];
    const leafSide = lkPair.find(n => leaves.find(l => l.name === n));
    const hubSide = lkPair.find(n => hubs.find(h => h.name === n));
    if (!leafSide || !hubSide) return;
    const key = leafSide + "|" + hubSide;
    const cnt = laneCount[key];
    usedCurve[key] = (usedCurve[key] || 0);
    const laneIdx = usedCurve[key]++;
    const col = LINK_COLOR[lk.type] || "#8b8b8b";
    const lY = leafYof[leafSide], hY = hubYof[hubSide];
    // 多條同 leaf↔hub：縱向偏移 ±(laneIdx)*7
    const offset = (cnt > 1 ? (laneIdx - (cnt - 1) / 2) * 10 : 0);
    const y1 = lY + offset, y2 = hY;   // 從 leaf 到 hub
    // 控制點（水平 S 曲線）
    const mx = (RIGHTX - 150 + LEFTX) / 2;
    // a/b 哪邊是 leaf：葉端在右、hub端在左
    const fromX = RIGHTX, fromY = y1;
    const toX = LEFTX, toY = y2;
    const mid = (fromX + toX) / 2;
    const d = `M ${fromX} ${fromY} C ${mid} ${fromY}, ${mid} ${toY}, ${toX} ${toY}`;
    // 標籤：埠號
    const isAleaf = leafSide === lk.a;
    const leafPort = isAleaf ? (lk.a_port || "?") : (lk.b_port || "?");
    const hubPort = isAleaf ? (lk.b_port || "") : (lk.a_port || "");
    const lbl = `${esc(lk.type)} ${leafPort}${hubPort ? "→" + esc(hubPort) : ""}`;
    edgeSvg += `
      <path d="${d}" class="topo-edge" stroke="${col}" fill="none" stroke-width="2" stroke-dasharray="0" />
      <text x="${mid}" y="${(fromY + toY) / 2 - 3}" text-anchor="middle" class="topo-edge-lbl" fill="${col}">${lbl}</text>`;
  });

  // 圖例
  const legendSvg = Object.entries(LINK_TYPE).map(([k, v]) =>
    `<span class="topo-legend lk-${k}"><i style="background:${LINK_COLOR[k]}"></i>${esc(v)}</span>`).join("");

  return `<div class="topo-card">
    <div class="topo-card-title">🔀 機櫃拓樸 / 連線圖 <span class="hint">（${rel.length} 條連線 · 拖曳可看全圖）</span></div>
    <div class="topo-svg-wrap">
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="topo-svg">${defs}${edgeSvg}${nodesSvg}</svg>
    </div>
    <div class="topo-legends">${legendSvg}
      <span class="hint" style="margin-left:auto">左＝交換/電源/冷卻 · 右＝伺服/儲存</span>
    </div>
  </div>`;
}
function linkAddDialog() {
  const proj = rackView.project;
  const members = machines.filter(x => x.project === proj && x.level === "rack");
  const opts = members.map(m => `<option value="${esc(m.name)}">${esc(m.name)} (${esc(mgxInfo(m).label)})</option>`).join("");
  if (!members.length) { alert("此專案沒有機櫃元件可連線"); return; }
  showDialog("➕ 新增連線", `
    <div class="rm-modal-body">
      <p style="margin-bottom:12px;font-size:12px;color:var(--text-faint)">把兩個機櫃元件連起來（node ↔ switch / PDU / CDU）。可填兩端「埠號/網卡」（例如 eth0 / 1/1），讓連接圖標出是哪條 NIC 接到哪個口；留空也行。</p>
      <div style="display:flex;gap:12px">
        <div style="flex:1">
          <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">元件 A</label>
          <select class="input" id="lk-a" style="width:100%;padding:8px;margin-bottom:6px">${opts}</select>
          <input class="input" id="lk-a-port" style="width:100%;padding:8px" placeholder="A 埠 / 網卡（如 eth0、1/1）">
        </div>
        <div style="flex:1">
          <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">元件 B</label>
          <select class="input" id="lk-b" style="width:100%;padding:8px;margin-bottom:6px">${opts}</select>
          <input class="input" id="lk-b-port" style="width:100%;padding:8px" placeholder="B 埠 / 網卡（如 1/1、eth0）">
        </div>
      </div>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin:12px 0 6px">連線類型</label>
      <select class="input" id="lk-type" style="width:100%;padding:8px">
        ${Object.entries(LINK_TYPE).map(([k,v]) => `<option value="${k}">${esc(v)}</option>`).join("")}
      </select>
    </div>`,
    [
      { txt: "取消", cls: "", fn: () => closeDialog() },
      { txt: "新增連線", cls: "primary", fn: () => {
        const a = $("lk-a").value, b = $("lk-b").value, t = $("lk-type").value;
        const ap = $("lk-a-port") ? $("lk-a-port").value.trim() : "";
        const bp = $("lk-b-port") ? $("lk-b-port").value.trim() : "";
        if (a === b) return alert("A 與 B 不能相同");
        api("/api/links", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ a, b, type: t, a_port: ap, b_port: bp }) })
          .then(d => { linksCache = d.links || linksCache; closeDialog(); setView("rack"); })
          .catch(e => alert("新增失敗：" + e.message));
      } },
    ]);
}
async function deleteLink(a, b) {
  if (!confirm(`刪除此連線（${a} — ${b}）？`)) return;
  try {
    const d = await api("/api/links", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a, b }) });
    linksCache = d.links || linksCache;
    setView("rack");
  } catch (e) { alert("刪除失敗：" + e.message); }
}


/* ---------- System manager頁：L10/L11 層級 + 專案分組 ---------- */
const projectLevelFilter = { val: "all" };
function setProjectLevelFilter(v) {
  projectLevelFilter.val = v;
  document.querySelectorAll(".lvl-tab").forEach(b => b.classList.toggle("active", b.dataset.lvl === v));
  const holder = $("proj-sort-list");
  if (holder) { holder.outerHTML = renderProjectsList(); initProjectDrag(); }
}
// 專案收合狀態（以專案名記錄，大量機台如 PROJ_K 可直接收起來）
const projectCollapsed = {};   // { pname: bool }
function renderCollapsed() {
  const holder = $("proj-sort-list");
  if (holder) { holder.outerHTML = renderProjectsList(); initProjectDrag(); }
}
function toggleProject(pname) {
  projectCollapsed[pname] = !projectCollapsed[pname];
  renderCollapsed();
}
function collapseAllProjects(collapse) {
  projects.forEach(p => { projectCollapsed[p.name] = collapse; });
  renderCollapsed();
}
function renderProjectsList() {
  const f = projectLevelFilter.val;
  const un = unassignedMachines().filter(m => f === "all" || m.level === f);
  let html = `<div id="proj-sort-list" class="proj-sort-list">`;
  const visibleProjects = projects.filter(p => projectMembers(p.name).some(m => f === "all" || m.level === f));
  if (!visibleProjects.length && !un.length) {
    html += `<div class="card"><div class="empty">目前這個層級還沒有機台，先新增一台。</div></div>`;
    return html + `</div>`;
  }
  visibleProjects.forEach((p, pi) => {
    const members = projectMembers(p.name).filter(m => f === "all" || m.level === f);
    const rows = members.map((m, mi) => machineRowSortable(m, pi, mi, members.length));
    const rackN = members.filter(m=>m.level==="rack").length;
    const sysN = members.length - rackN;
    const collapsed = !!projectCollapsed[p.name];
    html += `
      <div class="proj-card card ${collapsed ? "collapsed" : ""}" data-pname="${esc(p.name)}">
        <div class="proj-card-head" draggable="true" title="拖動以調整專案順序">
          <div class="proj-card-grip">⠿</div>
          <div class="proj-card-info">
            <span class="proj-card-name">${esc(p.name)}</span>
            <span class="proj-card-count">${members.length} 台 ${f==="all" ? `(R${rackN}/S${sysN})` : f==="rack" ? "· L11" : "· L10"}</span>
            ${p.desc ? `<span class="proj-card-desc">${esc(p.desc)}</span>` : ""}
          </div>
          <span class="spacer"></span>
          <button class="btn small proj-collapse-btn" onclick="event.stopPropagation();toggleProject('${esc(p.name)}')" title="${collapsed ? "展開此專案" : "收合此專案（隱藏機台清單）"}">${collapsed ? "▼ 展開" : "▲ 收合"}</button>
        </div>
        ${!collapsed && members.length ? `<table class="t">
            <thead><tr><th></th><th>系統名稱</th><th>層級</th><th>OS IP</th><th>BMC IP</th><th>OS 狀態</th><th>BMC 狀態</th><th>移動</th><th>操作</th></tr></thead>
            <tbody>${rows.join("")}</tbody></table>`
          : `${!collapsed ? `<div style="padding:10px 14px;color:var(--text-faint)">此專案在此層級內沒有機台</div>` : ""}`}
      </div>`;
  });
  if (un.length) {
    html += `
      <div class="proj-card card" data-pname="">
        <div class="proj-card-head">
          <div class="proj-card-grip" style="opacity:.35">⠿</div>
          <div class="proj-card-info"><span class="proj-card-name">未分類</span><span class="proj-card-count">${un.length} 台</span></div>
        </div>
        <table class="t"><thead><tr><th></th><th>系統名稱</th><th>層級</th><th>OS IP</th><th>BMC IP</th><th>移動</th><th>操作</th></tr></thead>
        <tbody>${un.map(m => machineRowUnassigned(m)).join("")}</tbody></table>
      </div>`;
  }
  html += `</div>`;
  return html;
}
function pageProjects() {
  const nSys = machines.filter(m => m.level !== "rack").length;
  const nRack = machines.filter(m => m.level === "rack").length;
  return `
    <div class="section-h flex-wrap">
      <span class="t" style="font-size:18px">System manager</span>
      <span class="hint">專案分組 · 拖曳卡片調整順序</span>
      <div class="lvl-tabs">
        <button class="btn small lvl-tab ${projectLevelFilter.val==="all"?"active":""}" data-lvl="all" onclick="setProjectLevelFilter('all')">全部 ${machines.length}</button>
        <button class="btn small lvl-tab ${projectLevelFilter.val==="system"?"active":""}" data-lvl="system" onclick="setProjectLevelFilter('system')">🖘 L10 系統 ${nSys}</button>
        <button class="btn small lvl-tab ${projectLevelFilter.val==="rack"?"active":""}" data-lvl="rack" onclick="setProjectLevelFilter('rack')">🗄 L11 整櫃 ${nRack}</button>
      </div>
      <span class="spacer"></span>
      <button class="btn small" onclick="collapseAllProjects(true)" title="把各專案的機台清單全部收合（適合大量機台）">▲ 全部收合</button>
      <button class="btn small" onclick="collapseAllProjects(false)">▼ 全部展開</button>
      <button class="btn" onclick="openProjectModal()">📁 管理專案</button>
      <button class="btn" onclick="refreshStatus()" id="refresh-btn">⟳ 重新掃描</button>
      <button class="btn primary" onclick="openAdd()">＋ 新增系統</button>
    </div>
    ${renderProjectsList()}
  `;
}
function machineRowSortable(m, pi, mi, total) {
  const targetOpts = projects.filter(p => p.name !== m.project).map(p =>
    `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("");
  const lvlBadge = m.level === "rack"
    ? `<span class="badge badge-rack">L11 · Rack</span>`
    : `<span class="badge badge-system">L10 · Sys</span>`;
  return `
    <tr>
      <td style="white-space:nowrap">
        <button class="btn small" onclick="moveMachine('${esc(m.name)}',-1)" ${mi===0?"disabled":""} title="嫀線">▲</button>
        <button class="btn small" onclick="moveMachine('${esc(m.name)}',1)" ${mi===total-1?"disabled":""} title="下移">▼</button>
      </td>
      <td class="mono"><a href="#" class="mach-link" onclick="event.preventDefault();openMachine('${esc(m.name)}')"><b>${esc(m.name)}</b></a></td>
      <td>${lvlBadge}</td>
      <td class="mono">${esc(m.os_ip)}${m.os_user ? `<span style="color:var(--text-faint)"> (${esc(m.os_user)})</span>` : ""}</td>
      <td class="mono">${esc(m.bmc_ip || "—")}</td>
      <td>${statusBadge(m.os_alive)}</td>
      <td>${m.bmc_ip ? statusBadge(m.bmc_alive) : `<span style="color:var(--text-faint)">—</span>`}</td>
      <td>
        <select class="input move-sel" onchange="moveMachineTo('${esc(m.name)}', this.value)">
          <option value="">移至…</option>
          ${targetOpts}
          ${m.project ? `<option value="">（移鷤專案）</option>` : ""}
        </select>
      </td>
      <td style="white-space:nowrap">
        <button class="btn small" onclick="openTerm('${esc(m.name)}')">▶ Terminal</button>
        <button class="btn small" onclick="deleteMachine('${esc(m.name)}')">刪除</button>
      </td>
    </tr>`;
}
function machineRowUnassigned(m) {
  const opts = projects.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("");
  const lvlBadge = m.level === "rack"
    ? `<span class="badge badge-rack">L11 · Rack</span>`
    : `<span class="badge badge-system">L10 · Sys</span>`;
  return `
    <tr>
      <td></td>
      <td class="mono"><a href="#" class="mach-link" onclick="event.preventDefault();openMachine('${esc(m.name)}')"><b>${esc(m.name)}</b></a></td>
      <td>${lvlBadge}</td>
      <td class="mono">${esc(m.os_ip)}</td>
      <td class="mono">${esc(m.bmc_ip || "—")}</td>
      <td>
        <select class="input move-sel" onchange="moveMachineTo('${esc(m.name)}', this.value)">
          <option value="">移至…</option>
          ${opts}
        </select>
      </td>
      <td style="white-space:nowrap">
        <button class="btn small" onclick="openTerm('${esc(m.name)}')">▶ Terminal</button>
        <button class="btn small" onclick="deleteMachine('${esc(m.name)}')">刪除</button>
      </td>
    </tr>`;
}
/* ---------- 移動：專案拖曳排序 / 機台排序 / 機台搬移 ---------- */
function projectNamesInOrder() { return projects.map(p => p.name); }
let _dragSrc = null;
function initProjectDrag() {
  const cards = document.querySelectorAll("#proj-sort-list .proj-card");
  cards.forEach(card => {
    const head = card.querySelector(".proj-card-head");
    if (!head || !head.hasAttribute("draggable")) return;
    head.addEventListener("dragstart", (e) => {
      $("content").querySelectorAll(".proj-card").forEach(c => c.classList.add("drag-idle"));
      card.classList.add("drag-src");
      _dragSrc = card.dataset.pname;
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", card.dataset.pname); } catch (_) {}
    });
    head.addEventListener("dragend", () => {
      $("content").querySelectorAll(".proj-card").forEach(c => c.classList.remove("drag-idle", "drag-src", "drag-over"));
      _dragSrc = null;
    });
    card.addEventListener("dragover", (e) => {
      if (!_dragSrc) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      card.classList.add("drag-over");
    });
    card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      if (!_dragSrc || _dragSrc === card.dataset.pname) return;
      reorderProjects(_dragSrc, card.dataset.pname);
    });
  });
}
async function reorderProjects(a, b) {
  const names = projectNamesInOrder();
  const ia = names.indexOf(a), ib = names.indexOf(b);
  if (ia < 0 || ib < 0 || ia === ib) return;
  names.splice(ia, 1);
  names.splice(ib, 0, a);
  await api("/api/projects/reorder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ names }) });
  await Promise.all([loadProjects(), loadMachines()]);
  setView("projects");
}
async function moveMachine(name, dir) {
  const m = machines.find(x => x.name === name);
  if (!m) return;
  const members = projectMembers(m.project).map(x => x.name);
  const i = members.indexOf(name);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= members.length) return;
  await swapMachineOrder(members[i], members[j]);
  await Promise.all([loadMachines(), loadProjects()]);
  setView("projects");
}
async function swapMachineOrder(a, b) {
  const ma = machines.find(x => x.name === a), mb = machines.find(x => x.name === b);
  const ea = ma.order, eb = mb.order;
  await api("/api/machines/" + encodeURIComponent(a), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: eb }) });
  await api("/api/machines/" + encodeURIComponent(b), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: ea }) });
}
async function moveMachineTo(name, project) {
  const targetMembers = (project || "" ? machines.filter(m => m.project === project) : unassignedMachines()).filter(m => m.name !== name);
  const targetOrder = targetMembers.length ? Math.max(...targetMembers.map(m => m.order||0)) + 1 : 0;
  await api("/api/machines/" + encodeURIComponent(name), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project, order: targetOrder }) });
  await Promise.all([loadMachines(), loadProjects()]);
  setView("projects");
}

// 機器詳情頁去抖：多個非同步載入（感測器 poll / detail / refresh）完成時各自要求重繪，
// 若每次都整頁重繪會造成 chart 反覆重建 + telemetry 重抓 → 狂跳卡死。
// 已在 machine view 時的重複請求，於一短暫視窗內合併為一次。從其他 view 切入則立即渲染。
let _machineRenderTimer = null;
function setView(view) {
  if (view === "machine" && state.view === "machine") {
    if (_machineRenderTimer) clearTimeout(_machineRenderTimer);
    _machineRenderTimer = setTimeout(() => { _renderMachine(state.view); }, 250);
    state.view = view;
    syncHash();
    return;
  }
  // 切到其他 view：取消可能尚未執行的 machine 去抖重繪
  if (_machineRenderTimer) { clearTimeout(_machineRenderTimer); _machineRenderTimer = null; }
  _renderMachine(view);
}
function _renderMachine(view) {
  state.view = view;
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  $("page-title").textContent = TITLES[view] || TITLES.machine;
  $("content").innerHTML = RENDERERS[view]();
  if (view === "projects") { initProjectDrag(); }
  if (view === "dashboard") bindCopilot();
  if (view === "machine") initTelemetry();
  syncHash();
}

/* ---- URL 分頁路由（hash）：重新整理不回首頁 ---- */
function currentRoute() {
  if (state.view === "machine") return "machine/" + encodeURIComponent(_activeMachine || "");
  return state.view || "dashboard";
}
function syncHash() {
  const h = "#/" + currentRoute();
  if (location.hash !== h) history.replaceState(null, "", h);
}
function parseHash() {
  const h = (location.hash || "").replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean);
  const view = parts[0] || "dashboard";
  if (view === "machine" && parts[1]) {
    state.view = "machine";
    _activeMachine = decodeURIComponent(parts[1]).trim();
  } else {
    state.view = ["dashboard", "projects", "rack"].includes(view) ? view : "dashboard";
  }
}

/* ============ System Telemetry（CPU/DIMM/SSD/NIC/GPU） ============ */
let telCharts = {};
const TEL_PALETTE = ["#2563eb", "#22c55e", "#e5484d", "#7c5cff", "#e0a800", "#14b8a6", "#f97316", "#ec4899", "#0ea5e9", "#84cc16"];
let telMinutes = 60;

function telT(ts) {
  const d = new Date(ts * 1000);
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function telWindowLabel(min) {
  if (min >= 1440) { const d = min / 1440; return d >= 1 && Number.isInteger(d) ? `${d} 天` : `${d} 天`; }
  if (min >= 60) { const h = min / 60; return `${h} 小時`; }
  return `${min} 分鐘`;
}
function telToggleAllBtn(anyOpen) {
  const b = $("tel-collapse-all");
  if (b) b.textContent = anyOpen ? "▲ 全部收合" : "▼ 全部展開";
}
function syncTelBlocks() {
  document.querySelectorAll("#tel-grid .tel-block").forEach(blk => {
    const open = blk.dataset.open === "1";
    const arrow = blk.querySelector(".tel-arrow");
    if (arrow) arrow.textContent = open ? "▼" : "▶";
    const body = blk.querySelector(".tel-block-body");
    if (body) body.style.display = open ? "" : "none";
  });
  const anyOpen = [...document.querySelectorAll("#tel-grid .tel-block")].some(b => b.dataset.open === "1");
  telToggleAllBtn(anyOpen);
}
function toggleTel(key) {
  const blk = document.querySelector(`#tel-grid .tel-block[data-key="${key}"]`) ||
              document.querySelector(`#tel-grid .tel-block`);
  // 找不到 data-key 時用 canvas id 反查
  let target = blk;
  if (key) {
    const cv = document.getElementById(`tel-${key}`);
    target = cv ? cv.closest(".tel-block") : blk;
  }
  if (!target) return;
  target.dataset.open = target.dataset.open === "1" ? "0" : "1";
  syncTelBlocks();
  // 展開後重繪（canvas 原先隱藏可能沒畫全）
  loadTelemetry();
}
function toggleTelAll() {
  const anyOpen = [...document.querySelectorAll("#tel-grid .tel-block")].some(b => b.dataset.open === "1");
  document.querySelectorAll("#tel-grid .tel-block").forEach(b => b.dataset.open = anyOpen ? "0" : "1");
  syncTelBlocks();
  loadTelemetry();
}
function initTelemetry() {
  if (!document.getElementById("tel-cpu")) return;  // 非 machine 頁
  // 清除舊 chart（避免重建時重複）
  Object.keys(telCharts).forEach(k => { try { telCharts[k].destroy(); } catch(e){} });
  telCharts = {};
  const sel = $("tel-select");
  if (sel) {
    sel.value = String(telMinutes);
    sel.onchange = () => { telMinutes = +sel.value; loadTelemetry(); };
  }
  // 給每個 block 補 data-key（由 canvas id 推得）
  document.querySelectorAll("#tel-grid .tel-block").forEach(blk => {
    const cv = blk.querySelector("canvas");
    if (cv && !blk.dataset.key) {
      const id = cv.id.replace("tel-", "");
      const map = { "tel-cpu": "cpu", "tel-mem": "mem", "tel-disk": "disk", "tel-net": "net", "tel-gpu": "gpu" };
      for (const [cid, key] of Object.entries(map)) if (blk.querySelector(cid)) { blk.dataset.key = key; break; }
    }
  });
  syncTelBlocks();
  // 若全收合則展開 CPU（確保至少有圖）
  if (![...document.querySelectorAll("#tel-grid .tel-block")].some(b => b.dataset.open === "1")) {
    const first = document.querySelector("#tel-grid .tel-block");
    if (first) first.dataset.open = "1";
    syncTelBlocks();
  }
  loadTelemetry();
}
function telChart(id, unit) {
  const ctx = document.getElementById(id);
  if (!ctx) return null;
  if (telCharts[id]) return telCharts[id];
  const ch = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [] },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom", maxHeight: 64, labels: { boxWidth: 10, font: { size: 9.5 }, padding: 6 } },
                 tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y} ${unit||""}` } } },
      scales: { x: { ticks: { maxTicksLimit: 6, font: { size: 10 } } },
                y: { beginAtZero: true, grid: { color: "rgba(0,0,0,.05)" } } }
    }
  });
  telCharts[id] = ch;
  return ch;
}
function telSet(ch, labels, series, defs) {
  if (!ch) return;
  ch.data.labels = labels;
  ch.data.datasets = series.map(s => {
    const d = defs[s.key] || { color: TEL_PALETTE[0] };
    return { label: d.label, data: s.data, borderColor: d.color, backgroundColor: d.color,
             tension: .3, pointRadius: 0, borderWidth: 2, borderDash: d.dash || undefined };
  });
  ch.update();
}
// Telemetry 簡短 AI 分析：抓單機該範圍趨勢 → Ollama 回一小段文字 → 填入 #tel-ai
// 同一機台+範圍重複載入直接用快取，避免每次重整都打 Ollama（較慢）。
const aiTelCache = {};
async function telAnalyze(name, minutes) {
  const box = $("tel-ai");
  if (!box) return;
  const key = `${name}|${minutes}`;
  if (aiTelCache[key] && box.dataset.k === key) {
    box.innerHTML = aiTelCache[key]; return;
  }
  box.innerHTML = "✨ 正在分析此範圍的監控趨勢…";
  box.dataset.k = key;
  let d;
  try {
    d = await api(`/api/machine/${encodeURIComponent(name)}/telemetry/analyze?minutes=${minutes}`);
  } catch (e) {
    box.innerHTML = ""; return;
  }
  if (d.error) { box.innerHTML = ""; return; }
  const html = `${esc(d.analysis || d.summary || "")}`;
  aiTelCache[key] = html;
  if (box) box.innerHTML = html;
}

async function loadTelemetry() {
  const name = _activeMachine;
  if (!name) return;
  const win = $("tel-window"); if (win) win.textContent = telWindowLabel(telMinutes);
  telAnalyze(name, telMinutes);   // 背景觸發簡短 AI 分析（不阻塞 telemetry 繪圖）
  let d;
  try {
    d = await api(`/api/machine/${encodeURIComponent(name)}/telemetry?minutes=${telMinutes}`);
  } catch (e) { return; }
  const os = d.os || {}, gpu = d.gpu || {};
  const oarr = os.os || [];
  const oLabels = oarr.map(r => telT(r.ts));

  // CPU：使用率 %
  let ch = telChart("tel-cpu", "%");
  telSet(ch, oLabels, [{ key: "cpu", data: oarr.map(r => r.cpu_used) }], { cpu: { label: "CPU 使用率", color: "#2563eb" } });

  // CPU Load（1/5/15 min）
  ch = telChart("tel-load", "load");
  telSet(ch, oLabels, [
    { key: "l1", data: oarr.map(r => r.load1) },
    { key: "l5", data: oarr.map(r => r.load5) },
    { key: "l15", data: oarr.map(r => r.load15) },
  ], { l1: { label: "Load 1m", color: "#2563eb" }, l5: { label: "Load 5m", color: "#7c5cff" }, l15: { label: "Load 15m", color: "#84cc16" } });

  // DIMM：記憶體使用率 %（後端 mem_used_pct，缺值時由 used/total 推算）
  ch = telChart("tel-mem", "%");
  telSet(ch, oLabels, [{ key: "usedpct", data: oarr.map(r => r.mem_used_pct != null ? r.mem_used_pct : (r.mem_total_gb ? r.mem_used_gb / r.mem_total_gb * 100 : null)) }], { usedpct: { label: "記憶體使用率", color: "#e5484d" } });

  // DIMM：已用 + 總量 GB
  ch = telChart("tel-memgb", "GB");
  telSet(ch, oLabels, [
    { key: "used", data: oarr.map(r => r.mem_used_gb) },
    { key: "total", data: oarr.map(r => r.mem_total_gb) },
  ], { used: { label: "已用", color: "#e5484d" }, total: { label: "總量", color: "#94a3b8" } });

  // DIMM：可用
  ch = telChart("tel-swap", "GB");
  telSet(ch, oLabels, [{ key: "avail", data: oarr.map(r => r.mem_avail_gb) }], { avail: { label: "可用記憶體", color: "#22c55e" } });

  // SSD：各掛載點 %
  ch = telChart("tel-disk", "%");
  const mounts = os.disk || [];
  const dLabels = mounts[0] ? mounts[0].ts.map(telT) : [];
  const dDefs = {}; mounts.forEach((m,i) => dDefs[m.mount] = { label: m.mount, color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(ch, dLabels, mounts.map((m,i) => ({ key: m.mount, data: m.pct })), dDefs);

  // SSD：已用量 GB
  ch = telChart("tel-diskused", "GB");
  const dUsedDefs = {}; mounts.forEach((m,i) => dUsedDefs[m.mount] = { label: m.mount, color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(ch, dLabels, mounts.map((m,i) => ({ key: m.mount, data: m.used_gb })), dUsedDefs);

  // NIC（網路吞吐 MB/s）
  ch = telChart("tel-net", "MB/s");
  const nets = os.net || [];
  const allPts = nets.flatMap(n => n.points);
  const tsArr = [...new Set(allPts.map(p => p.ts))].sort((a,b)=>a-b);
  const nLabels = tsArr.map(telT);
  const nSeries = [], nDefs = {};
  const MB = 1024*1024;
  nets.forEach((n,i) => {
    const col = TEL_PALETTE[i%TEL_PALETTE.length];
    const byTs = {}; n.points.forEach(p => byTs[p.ts] = p);
    const rx = tsArr.map(ts => byTs[ts] && byTs[ts].rx != null ? byTs[ts].rx/MB : null);
    const tx = tsArr.map(ts => byTs[ts] && byTs[ts].tx != null ? byTs[ts].tx/MB : null);
    const tag = n.iface.length>14 ? n.iface.slice(0,13)+"…" : n.iface;
    nSeries.push({ key: `tx${i}`, data: tx }); nSeries.push({ key: `rx${i}`, data: rx });
    nDefs[`tx${i}`] = { label: `${tag} TX`, color: col };
    nDefs[`rx${i}`] = { label: `${tag} RX`, color: col, dash: [4,4] };
  });
  telSet(ch, nLabels, nSeries, nDefs);

  // GPU：利用率 %
  let gch = telChart("tel-gpu", "%");
  const gser = gpu.series || [];
  const gLabels = gser[0] ? gser[0].ts.map(telT) : [];
  const gName = s => (s.name && String(s.name).trim()) ? `${s.name} (GPU ${s.gpu})` : `GPU ${s.gpu}`;
  const gDefs = {}; gser.forEach((s,i) => gDefs[`g${s.gpu}`] = { label: gName(s), color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(gch, gLabels, gser.map(s => ({ key: `g${s.gpu}`, data: s.util })), gDefs);

  // GPU：記憶體使用
  gch = telChart("tel-gpumem", "GB");
  const gmDefs = {}; gser.forEach((s,i) => gmDefs[`g${s.gpu}`] = { label: gName(s), color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(gch, gLabels, gser.map(s => ({ key: `g${s.gpu}`, data: s.mem_used })), gmDefs);

  // GPU：溫度
  gch = telChart("tel-gputemp", "°C");
  const gtDefs = {}; gser.forEach((s,i) => gtDefs[`g${s.gpu}`] = { label: gName(s), color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(gch, gLabels, gser.map(s => ({ key: `g${s.gpu}`, data: s.temp })), gtDefs);

  // GPU：功耗
  gch = telChart("tel-gpupow", "W");
  const gpDefs = {}; gser.forEach((s,i) => gpDefs[`g${s.gpu}`] = { label: gName(s), color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(gch, gLabels, gser.map(s => ({ key: `g${s.gpu}`, data: s.power })), gpDefs);
}
/* ---------- 單機詳情頁 ---------- */
let _activeMachine = null;
function openMachine(name) {
  _activeMachine = name;
  state.view = "machine";
  setView("machine");
}
function machineBack() {
  setView("projects");
}
function machineGo(view) {
  state.view = view;
}
async function machineRefresh() {
  const name = _activeMachine;
  if (!name) return;
  delete machineDetailCache[name];     // 強制重抓詳情 + OS/HW（refresh=1）
  await machineLoadDetail(name, true);
  // 感測器不強制重抓：TTL 內直接用快取，避免按重新整理後陷入長時間『背景抓取中』
  if (_activeMachine === name) await machineLoadSensors(name, false);
  if (_activeMachine === name) setView("machine");
}
const machineSensorsCache = {};
// 感測器是背景抓取的（OpenBMC sdr list 約 20 秒）。
// 只更新 #sensor-body 區塊，絕不整頁重繪（避免每次都重畫 telemetry 造成狂跳/卡死）。
// 無快取時每 3 秒查一次；有舊值（refreshing）時改每 12 秒緩查，減少開銷。
async function machineLoadSensors(name, refresh = false) {
  const poll = async () => {
    let d;
    try {
      d = await api(`/api/machine/${encodeURIComponent(name)}/sensors${refresh ? "?refresh=1" : ""}`);
      machineSensorsCache[name] = d;
    } catch (e) {
      d = { error: e.message };
      machineSensorsCache[name] = d;
    }
    if (_activeMachine !== name) return;         // 已切走，停止
    const st = d && d.sensors;
    // 只更新感測器卡片本體，不動整個頁面（sensor-body 只存在於 bmc_alive 的詳情頁）
    const body = $("sensor-body");
    if (body) {
      const oldScroll = body.querySelector(".sdr-scroll");
      const keepTop = oldScroll ? oldScroll.scrollTop : 0;
      body.innerHTML = machineSensorsHtml(d, { bmc_alive: true }, name);
      const newScroll = body.querySelector(".sdr-scroll");
      if (newScroll && keepTop) newScroll.scrollTop = keepTop; // 保留捲動位置，避免重繪跳回頂部
    }
    // 感測器有資料（含背景刷新中）即自動觸發一次 Sensor AI 診斷
    if (d && !d.error && d.sensors && (d.sensors.total || d.sensors.ok)) sensorAnalyze(name);
    if (d.error) return;                         // 出錯就停（不再輪詢）
    if (d.loading) {
      // refreshing（回舊值）或尚無資料 → 排下一輪；無資料時更快
      setTimeout(poll, (st && (st.total || st.ok)) ? 12000 : 3000);
    }
  };
  poll();
}
function machineSensorsHtml(d, base, name) {
  if (!base.bmc_alive) return `<div class="empty">BMC 目前不可連</div>`;
  if (d && d.error) return `<div class="empty">${esc(d.error)}</div>`;
  const s = (d && d.sensors) || {};
  // 完全沒有資料時才顯示「抓取中」；有舊快取（refreshing）時照常顯示資料並在背景更新
  if (!d || (d.loading && !Object.keys(s).length)) {
    return `<div class="empty">🔍 感測器抓取中（sdr list 較慢，約 20 秒）…</div>`;
  }
  const critRow = (s.critical_entries || []).map(l => `<li>🔴 ${esc(l)}</li>`).join("");
  const warnRow = (s.warning_entries || []).map(l => `<li>🟠 ${esc(l)}</li>`).join("");
  const nsRow = (s.ns && s.ns > 0) ? `<li class="no-alert" style="color:var(--text-dim)">⚠️ ${s.ns} 筆感測器 No Reading（ns，未讀取到數值）</li>` : "";
  // 完整 SDR：放固定高度框內可往下拉，避免網頁過長
  const allRows = (s.entries || []).map(l => `<tr><td class="mono">${esc(l)}</td></tr>`).join("");
  const sdrBox = s.entries && s.entries.length
    ? `<div class="sdr-scroll">
        <table class="t sdr-table"><tbody>${allRows}</tbody></table>
      </div>
      <span class="hint">共 ${s.entries.length} 筆感測器（可捲動）</span>`
    : "";
  return `
    <div class="sensor-kpis">
      <div class="sensor-kpi ${s.critical>0?'bad':''}"><b>${s.critical||0}</b><span>Critical</span></div>
      <div class="sensor-kpi ${s.warning>0?'warn':''}"><b>${s.warning||0}</b><span>Warning</span></div>
      <div class="sensor-kpi"><b>${s.ok||0}</b><span>${s.ns>0 ? `OK (+${s.ns||0} ns)` : "OK"}</span></div>
    </div>
    <ul class="alerts" style="margin-top:10px">
      ${critRow || warnRow || nsRow || `<li class="no-alert">✔ 無異常感測器（無 Critical / Warning / No Reading）</li>`}
    </ul>
    <div class="tel-ai sensor-ai" id="sensor-ai">${sensorAiResult[name] != null ? sensorAiResult[name] : "🤖 正在分析感測器狀況…"}</div>
    ${d.refreshing ? `<span class="hint">（快取已過期，背景重新抓取中…）</span>` : ""}
    ${sdrBox}`;
}
// Sensor AI 診斷（比照 Telemetry AI）：感測器就緒後自動分析一次，結果快取，重繪可還原。
const sensorAiDone = new Set();
const sensorAiResult = {};
async function sensorAnalyze(name) {
  if (!name) return;
  const show = (html) => { const el = $("#sensor-ai"); if (el) el.innerHTML = html; };
  if (sensorAiDone.has(name)) { if (sensorAiResult[name] != null) show(sensorAiResult[name]); return; }
  show("🤖 正在分析感測器狀況…");
  let d;
  try {
    d = await api(`/api/machine/${encodeURIComponent(name)}/sensors/analyze`);
  } catch (e) {
    sensorAiResult[name] = "⚙️   Sensor AI 無法連線"; show(sensorAiResult[name]); return;
  }
  if (!d || d.error) { sensorAiResult[name] = "⚙️   Sensor AI 尚無資料"; show(sensorAiResult[name]); return; }
  if (d.ok !== undefined && !d.ok) { sensorAiResult[name] = `⚙️   ${esc(d.error || "感測器未就緒")}`; show(sensorAiResult[name]); return; }
  sensorAiDone.add(name);
  sensorAiResult[name] = `🤖 ${esc(d.analysis || d.summary || "")}`;
  show(sensorAiResult[name]);
}

const machineDetailCache = {};
async function machineLoadDetail(name, refresh = false) {
  try {
    const d = await api(`/api/machine/${encodeURIComponent(name)}/detail${refresh ? "?refresh=1" : ""}`);
    machineDetailCache[name] = d;
  } catch (e) {
    machineDetailCache[name] = { error: e.message };
  }
  if (_activeMachine === name) setView("machine");
}

/* ---- 單機詳情頁 ---- */

/* 硬體資訊（CPU/DIMM/SSD/NIC/GPU）專業表格式卡片呈現（無 emoji） */
function hwItem(label, lines) {
  const rows = lines.filter(x=>x).map(l => `<div class="hw-line">${l}</div>`).join("");
  return `<div class="hw-item"><div class="hw-label">${label}</div><div class="hw-body"><div class="hw-lines">${rows}</div></div></div>`;
}
function hwHtml(oi) {
  const hw = (oi && oi.hw) || null;
  if (!hw) {
    if (oi && oi.raw) return `<pre class="mach-pre mono">${esc(oi.raw)}</pre>`;
    return `<div class="empty">尚未抓取硬體型號（需 root + dmidecode/lspci）</div>`;
  }
  let out = `<div class="hw-grid">`;
  const cpu = hw.cpu;
  if (cpu) {
    const sockets = parseInt(cpu.sockets) || 0;
    const cores = parseInt(cpu.cores) || 0;
    const threads = parseInt(cpu.threads) || 0;
    const totalCores = sockets && cores ? sockets * cores : 0;
    const totalThreads = totalCores && threads ? totalCores * threads : 0;
    const specs = [
      cpu.sockets ? `${cpu.sockets} × ${cpu.cores||"?"} 核` : "",
      totalCores ? `共 ${totalCores} 核` : "",
      threads ? `每核 ${threads} 執行緒` : "",
      totalThreads ? `共 ${totalThreads} 執行緒` : "",
    ].filter(Boolean).join("　") || "";
    out += hwItem("CPU", [
      `<div class="cpu-model"><b>${esc(cpu.model || "—")}</b></div>`,
      specs ? `<div class="cpu-spec">${esc(specs)}</div>` : "",
    ]);
  }
  const d = hw.dimm;
  if (d) {
    const size = `${d.count||""} 條記憶體`;
    const parts = (d.parts||[]).map(p=>`<span class="hw-part">${esc(p)}</span>`).join("");
    out += hwItem("DIMM", [
      `<b>${size}</b> <span class="mono">${(d.types||[]).join(" · ")} ${(d.speeds||[]).join(" · ")}</span>`,
      parts ? `<span class="hw-parts">${parts}</span>` : "",
    ]);
  }
  const ssd = hw.ssd;
  if (ssd && ssd.length) {
    const rows = ssd.slice(0,12).map(dd => `
      <div class="ssd-cell">
        <span class="ssd-name mono">${esc(dd.name)}</span>
        <span class="ssd-model">${esc(dd.model)}</span>
        <span class="ssd-size">${esc(dd.size)}</span>
      </div>`).join("");
    out += `<div class="hw-item"><div class="hw-label">SSD</div><div class="hw-body"><div class="ssd-grid">${rows}</div></div></div>`;
  }
  const gpu = hw.gpu;
  if (gpu && gpu.length) {
    // GPU 多顆時用兩欄網格，減少垂直空間
    const rows = gpu.map(g => `<div class="gpu-cell"><span class="gpu-name">${esc(g.name)}</span> <span class="gpu-mem">${esc(g.mem)}</span> <span class="gpu-util">${esc(g.util)}</span></div>`).join("");
    out += `<div class="hw-item"><div class="hw-label">GPU</div><div class="hw-body"><div class="gpu-grid">${rows}</div></div></div>`;
  }
  const nic = hw.nic;
  if (nic && nic.length) {
    // 解析 lspci 網卡行 → {type,model,count,buses}；同型號合併計數，用多欄卡片精簡呈現
    function tidyModel(raw) {
      let m = String(raw).replace(/\s*\(rev \d+\)\s*$/i, "").trim();
      // 連續移除結尾的 Controller / Integrated / Network 等修飾詞（會疊加出現）
      while (/\b(controller|integrated|network|adapter)\b[\s:]*$/i.test(m)) {
        const next = m.replace(/\b(controller|integrated|network|adapter)\b[\s:]*$/i, "").replace(/\s{2,}/g, " ").trim();
        if (next === m) break;
        m = next;
      }
      return m.replace(/^\s*(Mellanox Technologies|Intel Corporation|Broadcom Limited|Broadcom Inc\.|Marvell Technology Group|NVIDIA Corporation)\s*/i, "").trim();
    }
    const groups = new Map();
    (nic || []).forEach(l => {
      const mm = String(l).match(/^([\da-fA-F]{2}:[\da-fA-F]{2}\.[\da-fA-F])\s+(\S+) controller:\s*(.+)$/i);
      if (mm) {
        const type = (mm[2].toLowerCase().includes("infiniband") ? "InfiniBand"
                    : mm[2].toLowerCase().includes("ethernet") ? "Ethernet" : mm[2]);
        const model = tidyModel(mm[3]);
        const key = `${type}|${model}`;
        if (!groups.has(key)) groups.set(key, { type, model, count: 0, buses: [] });
        groups.get(key).count++; groups.get(key).buses.push(mm[1]);
      } else {
        const key = "__raw__|" + l;
        if (!groups.has(key)) groups.set(key, { type: "NIC", model: String(l), count: 0, buses: [] });
        groups.get(key).count++;
      }
    });
    const cells = [...groups.values()].map(g => `
      <div class="nic-cell">
        <div class="nic-top">
          <span class="nic-type ${g.type === "InfiniBand" ? "ib" : (g.type === "Ethernet" ? "eth" : "")}">${esc(g.type)}</span>
          <span class="nic-model">${esc(g.model)}</span>
          ${g.count > 1 ? `<span class="nic-n">×${g.count}</span>` : ""}
        </div>
        <div class="nic-bus mono">${esc(g.buses.join(", "))}</div>
      </div>`).join("");
    out += `<div class="hw-item"><div class="hw-label">NIC <span class="hw-sub">${(nic||[]).length} 埠</span></div><div class="hw-body"><div class="nic-list">${cells}</div></div></div>`;
  }
  out += `</div>`;
  // OS 摘要（distro/uptime/cpu/mem）在最上面
  const os = (oi && oi.os) || null;
  if (os && (os.distro || os.uptime)) {
    const osStats = [
      os.distro ? `<b>${esc(os.distro)}</b>` : "",
      os.uptime ? `已開機 ${esc(os.uptime)}` : "",
      os.cpu ? `CPU ${esc(os.cpu)} 執行緒` : "",
      os.mem ? esc(os.mem) : "",
    ].filter(v => v).map(v => `<span class="os-stat">${v}</span>`).join("");
    out = `<div class="os-summary">${osStats}</div>` + out;
  }
  if (oi && oi.raw) {
    out += `<details class="hw-raw"><summary>原始輸出 (raw)</summary><pre class="mach-pre mono">${esc(oi.raw)}</pre></details>`;
  }
  return out;
}

function pageMachine() {
  const name = _activeMachine;
  const m = machines.find(x => x.name === name);
  if (!m) return `<div class="card"><div class="empty">找不到機台</div></div>`;
  const d = machineDetailCache[name];
  if (!d) {
    machineLoadDetail(name);
    return `
      <div class="mach-toolbar">
        <button class="btn small" onclick="machineBack()">← 返回</button>
        <span class="mach-name">🖥 ${esc(name)}</span>
        <span class="spacer"></span>
      <span class="hint">專案分組 · 拖曳卡片調整順序</span>
      </div>
      <div class="card"><div class="empty">正在抓取機台資訊（開機資訊需要 SSH, BMC 用 ipmitool）…</div></div>`;
  }
  if (d.error) {
    return `
      <div class="mach-toolbar">
        <button class="btn small" onclick="machineBack()">← 返回</button>
        <span class="mach-name">🖥 ${esc(name)}</span>
        <span class="spacer"></span>
        <button class="btn small" onclick="machineRefresh()">⟳ 重試</button>
      </div>
      <div class="card"><div class="empty">載入失敗：${esc(d.error)}</div></div>`;
  }
  const base = d.machine || {};
  const lvlBadge = base.level === "rack"
    ? `<span class="badge badge-rack">L11 · Rack</span>` : `<span class="badge badge-system">L10 · Sys</span>`;
  const osState = base.os_alive ? statusBadge(true) : statusBadge(false);
  const bmcState = base.bmc_ip ? (base.bmc_alive ? statusBadge(true) : statusBadge(false)) : `<span style="color:var(--text-faint)">無</span>`;
  // OS 系統資訊（可能為快取歷史值）
  // OS 系統資訊（硬體型號卡片）
  let osInfoHtml = hwHtml(d.os_info || {});
  if (d.os_info && d.os_info.fetched_at) osInfoHtml += `<span class="hint">抓取時間：${esc(d.os_info.fetched_at)}</span>`;
  // BMC FW + 電源 + 感測
  let fwHtml = `<div class="empty">BMC 目前不可連，無從抓取</div>`;
  if (base.bmc_alive) {
    const fwRows = (d.fw || []).map(f => `<tr><td class="mono">${esc(f.key)}</td><td class="mono">${esc(f.value)}</td></tr>`).join("");
    fwHtml = fwRows ? `<table class="t fw-table"><tbody>${fwRows}</tbody></table>`
                    : d.bmc_loading ? `<div class="empty">BMC 連線抓取中（Cisco CIMC 較慢約 15–30 秒）…<br><span class="mono" style="font-size:11px">稍後自動更新</span></div>`
                    : `<div class="empty">無 FW 資料</div>`;
  }
  // BIOS / Device Firmware（dmidecode + smartctl + ethtool + nvidia-smi，跨 vendor 容錯）
  const hwFw = (d.os_info && d.os_info.hw && d.os_info.hw.firmware) || null;
  if (hwFw) {
    let fwRows = "";
    if (hwFw.bios) {
      const parts = [hwFw.bios.vendor, hwFw.bios.version, hwFw.bios.release].filter(Boolean).join(" · ");
      fwRows += `<tr><td class="mono bfw-tag">BIOS</td><td class="mono">${esc(parts)}</td></tr>`;
    }
    (hwFw.ssd || []).forEach(s => fwRows += `<tr><td class="mono bfw-tag">SSD ${esc(s.dev)}</td><td class="mono">${esc(s.fw)}</td></tr>`);
    (hwFw.nic || []).forEach(n => fwRows += `<tr><td class="mono bfw-tag">NIC ${esc(n.iface)}</td><td class="mono">${esc(n.fw)}</td></tr>`);
    (hwFw.gpu || []).forEach(g => fwRows += `<tr><td class="mono bfw-tag">GPU ${esc(g.index)}</td><td class="mono">${esc(g.fw) || "—"}</td></tr>`);
    if (fwRows) {
      fwHtml += `
      <details class="bfw-wrap">
        <summary class="bfw-title">＋ BIOS / 裝置韌體 (OS) <span class="bfw-count">${(fwRows.match(/<tr>/g)||[]).length} 項</span></summary>
        <table class="t fw-table bfw-table"><tbody>${fwRows}</tbody></table>
      </details>`;
    }
  }
  // 感測器：獨立 /sensors 端點，非同步載入（不阻塞主畫面）
  const sd = machineSensorsCache[name];
  if (base.bmc_alive && !sd) machineLoadSensors(name);
  const sensorHtml = machineSensorsHtml(sd, base, name);
  // 只要 BMC 在線就安排一次 Sensor AI 診斷（含已有快取、重繪回詳情頁時）
  if (base.bmc_alive && _activeMachine === name) {
    setTimeout(() => { if (state.view === "machine") sensorAnalyze(name); }, 60);
  }

  // BMC 背景抓取進行中 → 數秒後自動重打 detail（不打 refresh，讀快取）更新
  if (d.bmc_loading) {
    setTimeout(() => {
      if (_activeMachine === name && state.view === "machine") {
        delete machineDetailCache[name];
        machineLoadDetail(name);
      }
    }, 12000);
  }
  return `
    <div class="mach-toolbar">
      <button class="btn small" onclick="machineBack()">← 返回</button>
      <span class="mach-name">🖥 ${esc(name)} ${lvlBadge}</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="openTerm('${esc(name)}')">▶ Terminal</button>
      ${m.passive ? "" : `<button class="btn small" onclick="runDiagnose('${esc(name)}')">🩺 系統診斷</button>`}
      <button class="btn small" onclick="machineRefresh()">⟳ 重新整理</button>
    </div>
    <div class="mach-grid">
      <div class="card">
        <div class="card-title">基本資訊</div>
        <table class="t mach-info">
          <tr><td>專案</td><td>${esc(base.project || "未分類")}</td></tr>
          <tr><td>層級</td><td>${lvlBadge}</td></tr>
          <tr><td>OS IP</td><td class="mono">${esc(base.os_ip)} (${esc(base.os_user||"")}) — <b>${osState}</b></td></tr>
          <tr><td>BMC IP</td><td class="mono">${esc(base.bmc_ip||"—")} (${esc(base.bmc_user||"")}) — <b>${bmcState}</b></td></tr>
          <tr><td>BMC 電源</td><td>${base.bmc_alive ? powerBadge(d.power) : "—"}</td></tr>
        </table>
        ${base.bmc_ip ? `
        <div class="mach-power-actions">
          <button class="btn small" onclick="machinePower('${esc(name)}',true)">⏻ 開機 (ipmitool)</button>
          <button class="btn small btn-danger" onclick="machinePower('${esc(name)}',false)">⏻ 關機 (ipmitool)</button>
      <span class="hint">專案分組 · 拖曳卡片調整順序</span>
        </div>` : ""}
      </div>
      <div class="card">
        <div class="card-title">OS 系統資訊 ${d.os_info && d.os_info.fetched_at ? `<span class="hint">(${d.os_info.fetched_at})</span>` : ""}</div>
        <div class="os-scroll">${osInfoHtml}</div>
      </div>
    </div>
    ${base.bmc_alive ? `
    <div class="mach-grid">
      <div class="card">
        <div class="card-title">BMC 感測器 (ipmitool sdr)</div>
        <div id="sensor-body">${sensorHtml}</div>
      </div>
      <div class="card">
        <div class="card-title">BMC Firmware (ipmitool mc info)</div>
        ${fwHtml}
      </div>
    </div>` : `
    <div class="card"><div class="empty">BMC (${esc(base.bmc_ip||"—")}) 目前不可連，無法抓取感測器與 FW 資訊。</div></div>`}
    ${m.passive ? "" : `<div class="card diag-card" style="margin-top:18px">
      <div class="card-title">🩺 系統診斷（Ollama 分析）</div>
      <div class="diag-body" id="diag-body"></div>
      ${diagBodyFill(name)}
    </div>`}
    <div class="card" style="margin-top:18px">
      <div class="card-title tel-card-title" onclick="toggleTelAll()">
        <span>📊 System Telemetry <span class="hint" id="tel-window"></span></span>
        <span class="tel-collapse-all" id="tel-collapse-all">▲ 全部收合</span>
      </div>
      <div class="tel-toolbar">
        <label class="tel-range-sel">時間範圍
          <select class="input" id="tel-select">
            <option value="10">10 分鐘</option>
            <option value="30">30 分鐘</option>
            <option value="60" selected>1 小時</option>
            <option value="360">6 小時</option>
            <option value="720">12 小時</option>
            <option value="1440">24 小時</option>
            <option value="2880">2 天</option>
            <option value="10080">7 天</option>
            <option value="43200">30 天</option>
          </select>
        </label>
        <span class="tel-ai-hint">🤖 Telemetry AI</span>
      </div>
      <div class="tel-ai" id="tel-ai">✨ 正在分析此範圍的監控趨勢…</div>
      <div class="tel-grid" id="tel-grid">
        <div class="tel-block" data-open="1">
          <div class="tel-block-head"><span class="tel-label">CPU <em>（中央處理器）</em></span></div>
          <div class="tel-block-body">
            <div class="chart-box"><div class="chart-title">CPU 使用率 <span class="unit">＝ 各核心忙碌比例的平均，0~100%</span></div><canvas id="tel-cpu"></canvas></div>
            <div class="chart-box"><div class="chart-title">CPU Load（平均負載） <span class="unit">＝ 排隊等待的核心任務數，超過核心數代表過載</span></div><canvas id="tel-load"></canvas></div>
          </div>
        </div>
        <div class="tel-block" data-open="1">
          <div class="tel-block-head"><span class="tel-label">DIMM <em>（記憶體）</em></span></div>
          <div class="tel-block-body">
            <div class="chart-box"><div class="chart-title">記憶體使用率 <span class="unit">＝ 已用／總容量</span></div><canvas id="tel-mem"></canvas></div>
            <div class="chart-box"><div class="chart-title">記憶體使用量 <span class="unit">＝ 已用 vs 總量（GB）</span></div><canvas id="tel-memgb"></canvas></div>
            <div class="chart-box"><div class="chart-title">可用記憶體 <span class="unit">＝ 可用的 GB</span></div><canvas id="tel-swap"></canvas></div>
          </div>
        </div>
        <div class="tel-block" data-open="1">
          <div class="tel-block-head"><span class="tel-label">SSD <em>（固態硬碟 / 儲存）</em></span></div>
          <div class="tel-block-body">
            <div class="chart-box"><div class="chart-title">掛載點使用率 <span class="unit">＝ 每個分割區已用百分比</span></div><canvas id="tel-disk"></canvas></div>
            <div class="chart-box"><div class="chart-title">掛載點已用量 <span class="unit">＝ 每個分割區已用空間（GB）</span></div><canvas id="tel-diskused"></canvas></div>
          </div>
        </div>
        <div class="tel-block" data-open="1">
          <div class="tel-block-head"><span class="tel-label">NIC <em>（網路卡）</em></span></div>
          <div class="tel-block-body">
            <div class="chart-box"><div class="chart-title">網路吞吐量 <span class="unit">＝ 每張網卡 RX↓收 / TX↑送（MB/s）</span></div><canvas id="tel-net"></canvas></div>
          </div>
        </div>
        <div class="tel-block" data-open="1">
          <div class="tel-block-head"><span class="tel-label">GPU <em>（顯示卡）</em></span></div>
          <div class="tel-block-body">
            <div class="chart-box"><div class="chart-title">GPU 使用率 <span class="unit">＝ GPU 核心運算負載</span></div><canvas id="tel-gpu"></canvas></div>
            <div class="chart-box"><div class="chart-title">GPU 記憶體使用 <span class="unit">＝ VRAM（GB）</span></div><canvas id="tel-gpumem"></canvas></div>
            <div class="chart-box"><div class="chart-title">GPU 溫度 <span class="unit">＝ 顯示卡溫度（°C）</span></div><canvas id="tel-gputemp"></canvas></div>
            <div class="chart-box"><div class="chart-title">GPU 功耗 <span class="unit">＝ 顯示卡功耗（W）</span></div><canvas id="tel-gpupow"></canvas></div>
          </div>
        </div>
      </div>
      <div class="footer-hint">Telemetry 由後端定時透過 SSH 收集（nvidia-smi + /proc），不需在被監控機器安裝 agent。</div>
    </div>`;
}
// 系統診斷結果暫存（key=機台名），避免頁面 async 更新時被清掉
const diagStore = {};   // { name: {state:'loading'|'done'|'error', html:'...'} }

function diagBodyFill(name) {
  const s = diagStore[name];
  if (!s) return `<div class="empty">點上方「🩺 系統診斷」按鈕，收集 dmesg / journalctl / GPU / BMC event log，並由 Ollama 分析問題與建議處理。</div>`;
  if (s.state === "loading") return `<div class="empty">⏳ 正在收集資料並呼叫 Ollama 分析（約 30~60 秒）…</div>`;
  return s.html || `<div class="empty">(無結果)</div>`;
}
function runDiagnose(name) {
  const btn = [...document.querySelectorAll("button")].find(b => b.textContent.includes("系統診斷") || b.textContent.includes("診斷中"));
  diagStore[name] = { state: "loading", html: "" };
  if (btn) { btn.disabled = true; btn.textContent = "⏳ 診斷中…"; }
  const body = $("diag-body");
  if (body) body.innerHTML = diagBodyFill(name);
  api(`/api/machine/${encodeURIComponent(name)}/diagnose`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ include_bmc: true })
  }).then(d => {
    if (!d.ok) throw new Error(d.error || "分析失敗");
    if (d.note) { diagStore[name] = { state: "done", html: `<div class="empty">${esc(d.note)}</div>` }; return; }
    const md = d.report || "(無分析結果)";
    const bmcMode = d.collect && d.collect.bmc_mode === "os_local"
      ? "本機 ipmitool（SSH 進 OS 執行）"
      : d.collect && d.collect.bmc ? "OOB lanplus" : "—";
    diagStore[name] = { state: "done", html: `
      <div class="diag-report"><pre class="mach-pre mono">${esc(md)}</pre></div>
      <details class="diag-raw"><summary>診斷原始資料（收集時間 ${esc(d.collected_at||"—")} · IPMI：${esc(bmcMode)}）</summary>
        <pre class="mach-pre mono">${esc((d.collect&&d.collect.os)||"(無 OS 資料)")}</pre>
        ${d.collect && d.collect.bmc ? `<pre class="mach-pre mono">===== BMC SEL =====\n${esc(d.collect.bmc)}</pre>` : ""}
      </details>` };
  }).catch(e => {
    diagStore[name] = { state: "error", html: `<div class="empty" style="color:var(--danger)">診斷失敗：${esc(e.message)}</div>` };
  }).finally(() => {
    const b2 = $("diag-body");
    if (b2) b2.innerHTML = diagBodyFill(name);
    if (btn) { btn.disabled = false; btn.textContent = "🩺 系統診斷"; }
  });
}
async function machinePower(name, on) {
  if (!confirm(`確定要「${on?"開機":"關機"}」${name} 嗎？（透過 BMC ipmitool）`)) return;
  try {
    const r = await api(`/api/machine/${encodeURIComponent(name)}/power`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on })
    });
    await machineLoadDetail(name);
    setTimeout(() => alert(`${name} ${r.ok?(on?"已開機":"已關機"):"操作失敗："+(r.info||"")}\nBMC 目前狀態：${r.power_status}`), 250);
  } catch (e) {
    alert("操作失敗：" + e.message);
  }
}
/* ---------- 新增系統 ---------- */
async function fillProjectSelect(selId) {
  const sel = $(selId);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">— 未分類 —</option>` + projects.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("");
  sel.value = cur;
}
function openAdd() {
  fillProjectSelect("f-project");
  resetBmcProbe();
  $("add-modal").style.display = "flex";
  $("add-err").style.display = "none";
  $("save-btn").disabled = false;
  $("save-btn").textContent = "儲存並測試連線";
}
function closeAdd() { $("add-modal").style.display = "none"; }
function showErr(msg) { const e = $("add-err"); e.textContent = msg; e.style.display = "block"; }
// 依 OS 資訊探測：抓 hostname 並用 OS 本機 ipmitool lan print 自動帶入 BMC IP
async function probeBmc() {
  const btn = $("probe-bmc-btn");
  const os_ip = $("f-os-ip").value.trim();
  const os_user = $("f-os-user").value.trim();
  const os_pass = $("f-os-pass").value;
  if (!os_ip || !os_user || !os_pass) { showErr("請先填 OS IP、SSH 帳號跟密碼，再抓取 BMC IP"); return; }
  btn.disabled = true; btn.textContent = "🔍 抓取中…"; showErr("");
  try {
    const d = await api("/api/machines/probe-bmc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ os_ip, os_user, os_pass, os_port: parseInt($("f-os-port").value) || 22 }),
    });
    if (d.ok) {
      $("f-bmc-ip").value = d.bmc_ip;
      showErr(""); // 成功：BMC IP 已自動帶入（反灰欄位）
    } else {
      if (d.ipmitool_ok === false) {
        alert("⚠️ 無法自動抓取 BMC IP：\nOS 內未偵測到 ipmitool。\n\n請先在該主機安裝 ipmitool（例如 apt-get install ipmitool），之後再重新抓取。");
      } else {
        alert("⚠️ 抓取 BMC IP 失敗：\n" + (d.error || "未知錯誤"));
      }
    }
  } catch (e) {
    alert("⚠️ 抓取 BMC IP 失敗：\n" + e.message);
  } finally {
    btn.disabled = false; btn.textContent = "🔍 依 OS 抓取 BMC IP（需 ipmitool）";
  }
}
// 開啟新增系統表單時重設 BMC IP（避免殘留上次的）
function resetBmcProbe() {
  const f = $("f-bmc-ip");
  if (f) f.value = "";
}
async function saveMachine() {
  const body = {
    os_ip: $("f-os-ip").value.trim(),
    os_user: $("f-os-user").value.trim(),
    os_pass: $("f-os-pass").value,
    os_port: parseInt($("f-os-port").value) || 22,
    bmc_ip: $("f-bmc-ip").value.trim(),
    bmc_user: $("f-bmc-user").value.trim(),
    bmc_pass: $("f-bmc-pass").value,
    project: $("f-project").value,
    level: $("f-level").value == "rack" ? "rack" : "system",
  };
  if (!body.os_ip || !body.os_user || !body.os_pass) { showErr("請填 OS IP、SSH 帳號跟密碼"); return; }
  if (!body.project) { showErr("請選擇專案（沒有案子的請先開專案分類）"); return; }
  const btn = $("save-btn");
  btn.disabled = true; btn.textContent = "連線中…"; showErr("");
  try {
    const data = await api("/api/machines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const name = data.machine.name;
    await Promise.all([loadMachines(), loadProjects()]);
    closeAdd(); setView("dashboard");
    alert("✅ 系統已新增：hostname = " + name + "\n層級 = " + (body.level === "rack" ? "L11 Rack" : "L10 System"));
  } catch (e) {
    showErr("新增失敗：\n" + e.message);
    btn.disabled = false; btn.textContent = "儲存並測試連線";
  }
}
/* ---------- 刪除 ---------- */
function deleteMachine(name) {
  if (!confirm("確定要刪除系統 " + name + " 嗎？")) return;
  fetch("/api/machines/" + encodeURIComponent(name), { method: "DELETE" })
    .then(() => Promise.all([loadMachines(), loadProjects()]))
    .then(() => setView(state.view));
}
/* ---------- 重新掃描 ---------- */
async function refreshStatus() {
  const btn = $("refresh-btn");
  if (btn) { btn.disabled = true; btn.textContent = "掃描中…"; }
  try { await loadMachines(); setView(state.view); }
  catch (e) { alert("重新掃描失敗：" + e.message); }
  finally { if (btn) { btn.disabled = false; btn.textContent = "⟳ 重新掃描"; } }
}
/* ---------- 專案管理 ---------- */
function togglePw(id, btn) {
  const el = $(id);
  if (el.type === "password") { el.type = "text"; btn.textContent = "🷈"; }
  else { el.type = "password"; btn.textContent = "👁"; }
}
/* ---------- 專案管理 ---------- */
function openProjectModal() {
  resetProjectForm();
  renderProjectList();
  $("project-err").style.display = "none";
  $("project-modal").style.display = "flex";
}
function closeProjectModal() { resetProjectForm(); $("project-modal").style.display = "none"; }
const LEVELS = { system: "L10 · System", rack: "L11 · Rack" };
function renderProjectList() {
  $("project-list-body").innerHTML = projects.map(p => {
    const canDelete = p.machine_count === 0;
    const racks = machines.filter(m => m.project === p.name && m.level === "rack").length;
    const systems = machines.filter(m => m.project === p.name && m.level !== "rack").length;
    return `<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.desc || "")}</td><td>${p.machine_count}（R${racks}/S${systems}）</td>
      <td style="white-space:nowrap">
        <button class="btn small" onclick="editProjectStart('${esc(p.name)}')">翮改</button>
        <button class="btn small${canDelete ? "" : " disabled"}" title="${canDelete ? "刪除" : "此專案還有機台，無法刪除"}" ${canDelete ? `onclick="deleteProject('${esc(p.name)}')"` : "disabled"}>刪除</button>
      </td></tr>`;
  }).join("") || `<tr><td colspan="4" style="color:var(--text-faint)">還沒有專案，請先在線新增。</td></tr>`;
}
let editingProjectName = null;
function editProjectStart(name) {
  const proj = projects.find(p => p.name === name);
  if (!proj) return;
  editingProjectName = name;
  $("new-project-name").value = proj.name;
  $("new-project-desc").value = proj.desc || "";
  $("project-add-btn").textContent = "儲存修改";
  $("project-err").style.display = "none";
}
function resetProjectForm() {
  editingProjectName = null;
  $("new-project-name").value = "";
  $("new-project-desc").value = "";
  $("project-add-btn").textContent = "新增專案";
}
async function addProject() {
  const name = $("new-project-name").value.trim();
  const desc = $("new-project-desc").value.trim();
  const err = $("project-err");
  if (!name) { err.style.display = "block"; err.textContent = "請填專案名稱"; return; }
  err.style.display = "none";
  try {
    if (editingProjectName) {
      await api("/api/projects/" + encodeURIComponent(editingProjectName), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, desc }) });
      resetProjectForm();
    } else {
      await api("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, desc }) });
      resetProjectForm();
    }
    await Promise.all([loadProjects(), loadMachines()]);
    renderProjectList(); setView(state.view);
  } catch (e) {
    err.style.display = "block"; err.textContent = e.message;
  }
}
async function deleteProject(name) {
  if (!confirm("確定要刪除專案「" + name + "」嗎？")) return;
  const err = $("project-err");
  try {
    await api("/api/projects/" + encodeURIComponent(name), { method: "DELETE" });
    err.style.display = "none";
    await Promise.all([loadProjects(), loadMachines()]);
    renderProjectList(); setView(state.view);
  } catch (e) {
    err.style.display = "block"; err.textContent = e.message;
  }
}
/* ---------- 終端機（左右：左 OS / 右 BMC） ---------- */
let termInstances = null;
function openTerm(name) {
  $("term-title").innerHTML = `<span class="grip">▦</span> 終端機 — ${esc(name)}`;
  resetTermGeometry();
  $("term-os-status").innerHTML = `OS <span class="term-badge warn">連線中</span>`;
  $("term-bmc-status").innerHTML = `BMC <span class="term-badge warn">連線中</span>`;
  $("term-modal").style.display = "flex";
  setupTermPane("term-os");
  setupTermPane("term-bmc");
  termInstances = {
    os: new Term("term-os", `/ws/terminal/${encodeURIComponent(name)}/os`, "term-os-status"),
    bmc: new Term("term-bmc", `/ws/terminal/${encodeURIComponent(name)}/bmc`, "term-bmc-status"),
  };
  termInstances.os.connect();
  termInstances.bmc.connect();
  requestAnimationFrame(() => fitAll());
}
function setupTermPane(id) { $(id).innerHTML = ""; }
function fitAll() {
  Object.values(termInstances || {}).forEach(t => t.fit());
}
function resetTermGeometry() {
  const box = $("term-modal-box");
  if (!box) return;
  box.classList.remove("maximized");
  box.style.left = ""; box.style.top = ""; box.style.transform = "";
}

/* ===== 廣播終端（同時控制多台 rack 系統 OS shell；Clusterssh 風格 fan-out） ===== */
const bcState = { ws: null, order: [], terms: {}, stat: {}, active: null, broadcast: true };

function rackBroadcastDialog(project) {
  // 只列出該機櫃專案中「有 OS 連線資訊」的系統
  const cands = machines.filter(m => m.project === project && m.level === "rack" && m.os_ip);
  if (!cands.length) {
    const anyCands = machines.filter(m => m.level === "rack" && m.os_ip);
    if (anyCands.length) {
      showDialog("廣播終端", `<div class="empty">目前機櫃專案「${esc(project)}」沒有可連線的系統。\n有 OS 連線資訊的機櫃機台：${esc(anyCands.map(m=>m.name).join("、"))}</div>`);
    } else {
      showDialog("廣播終端", `<div class="empty">目前沒有任何帶 OS 連線資訊的機櫃機台可用。</div>`);
    }
    return;
  }
  const rows = cands.map(m =>
    `<label class="bc-check" style="display:block;padding:7px 10px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer">
       <input type="checkbox" class="bc-chk" value="${esc(m.name)}" checked>
       <b>${esc(m.name)}</b> <span class="mono" style="color:var(--text-dim)">${esc(m.os_ip)}</span>
     </label>`).join("");
  showDialog("📡 廣播終端 — 選擇要同時控制的主機", `
    <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:10px">
      勾選要同步下指令的系統（同一次指令，會同時送到所有勾選的主機 OS shell）。
    </label>
    <div class="table-scroll" style="max-height:46vh;overflow:auto;margin-bottom:12px">${rows}</div>
    <div style="display:flex;gap:8px">
      <button class="btn small" onclick="bcSetAll(true)">☑ 全選</button>
      <button class="btn small" onclick="bcSetAll(false)">☐ 全不選</button>
      <span class="spacer"></span><span class="hint" id="bc-sel-count">已選 ${cands.length} 台</span>
    </div>`,
    [
      { txt: "取消", cls: "", fn: () => closeDialog() },
      { txt: "開啟廣播", cls: "primary", fn: () => {
        const sel = [...document.querySelectorAll(".bc-chk:checked")].map(x => x.value);
        closeDialog();
        if (!sel.length) { alert("請至少勾選一台主機。"); return; }
        openBroadcast(sel);
      } },
    ]);
}

function bcSetAll(v) {
  document.querySelectorAll(".bc-chk").forEach(c => c.checked = v);
  const n = document.querySelectorAll(".bc-chk:checked").length;
  const el = $("bc-sel-count"); if (el) el.textContent = `已選 ${n} 台`;
}

function openBroadcast(names) {
  // 重置狀態
  bcState.ws = null; bcState.order = names.slice(); bcState.terms = {}; bcState.stat = {}; bcState.ack = {}; bcState.active = names[0] || null;
  const tabsEl = $("bc-tabs"), panesEl = $("bc-panes");
  tabsEl.innerHTML = ""; panesEl.innerHTML = "";
  $("bc-title-hint").textContent = `${names.length} 台`;
  names.forEach(nm => {
    // tab
    const tab = document.createElement("div");
    tab.className = "bc-tab" + (nm === bcState.active ? " active" : "");
    tab.id = "bc-tab-" + nm;
    tab.innerHTML = `<span class="lamp none" id="lamp-${nm}"></span><span class="tname">${esc(nm)}</span><span class="bc-ack" id="bc-ack-${nm}"></span><span class="x" title="關閉此主機">✕</span>`;
    tab.querySelector(".tname").onclick = () => bcSelect(nm);
    tab.querySelector(".x").onclick = (e) => { e.stopPropagation(); bcCloseHost(nm); };
    tabsEl.appendChild(tab);
    // pane
    const pane = document.createElement("div");
    pane.className = "bc-pane" + (nm === bcState.active ? " active" : "");
    pane.id = "bc-pane-" + nm;
    pane.innerHTML = `<div class="bc-pane-label"><span>${esc(nm)}</span><span class="mono" style="color:var(--text-dim);font-size:10px">${esc((machines.find(m=>m.name===nm)||{}).os_ip||"")}</span></div><div class="bc-box" id="bc-box-${nm}"></div>`;
    panesEl.appendChild(pane);
    // xterm
    const t = new Terminal({ cursorBlink: true, fontSize: 12.5, fontFamily: '"Cascadia Mono","Consolas","Noto Sans Mono CJK TC",monospace', theme: { background: "#0b0f14", foreground: "#e6edf3", cursor: "#0a7d78" }, scrollback: 2000 });
    const fit = new FitAddon.FitAddon();
    t.loadAddon(fit);
    t.open($("bc-box-" + nm));
    try { fit.fit(); } catch {}
    t.onData(d => {
      if (!bcState.ws || bcState.ws.readyState !== 1) return;
      if (bcState.broadcast) bcState.ws.send(JSON.stringify({ type: "broadcast", data: d }));
      else bcState.ws.send(JSON.stringify({ type: "sendOne", name: nm, data: d }));
    });
    bcState.terms[nm] = { term: t, fit };
    bcState.stat[nm] = "wait";
  });
  $("bc-input").value = "";
  $("bc-input").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); bcSendInput(); } });
  $("bc-modal").style.display = "flex";
  setTimeout(() => bcFitAll(), 60);
  // 連線
  const proto = location.protocol === "https:" ? "wss://" : "ws://";
  bcState.ws = new WebSocket(proto + location.host + `/ws/rack-broadcast`);
  bcState.ws.onopen = () => { bcState.ws.send(JSON.stringify({ targets: names, kind: "os" })); bcStatus(`連接 ${names.length} 台…`); };
  bcState.ws.onmessage = e => { bcWsMsg(e.data); };
  bcState.ws.onclose = () => { bcStatus("已斷線"); bcSetAllLamp("err"); };
  bcState.ws.onerror = () => { bcStatus("連線錯誤"); };
  bcStatus(bcState.broadcast ? "廣播模式：指令列會送到全部主機" : "目前主機模式：只送到目前選取主機");
}

function bcStatus(txt) { const el = $("bc-status-txt"); if (el) el.textContent = txt; }

function bcSetAllLamp(state) {
  bcState.order.forEach(nm => { const l = $("lamp-" + nm); if (l) { l.className = "lamp " + (state || (bcState.stat[nm] || "none")); } });
}
function bcLamp(nm, st) { bcState.stat[nm] = st; const l = $("lamp-" + nm); if (l) l.className = "lamp " + st; }

function bcSelect(nm) {
  if (!bcState.order.includes(nm)) return;
  bcState.active = nm;
  bcState.order.forEach(n => {
    const tab = $("bc-tab-" + n), pane = $("bc-pane-" + n);
    if (tab) tab.classList.toggle("active", n === nm);
    if (pane) pane.classList.toggle("active", n === nm);
  });
  const t = bcState.terms[nm]; if (t) { try { t.fit.fit(); } catch {} bcFitOne(nm); }
  bcStatus(bcState.broadcast ? "廣播模式：指令列會送到全部主機；此窗顯示 " + nm : `目前主機：${nm}`);
}

function bcCloseHost(nm) {
  bcState.ws.send(JSON.stringify({ type: "closeOne", name: nm })); // 後端可忽略，前端直接關
  delete bcState.terms[nm]; delete bcState.stat[nm];
  bcState.order = bcState.order.filter(x => x !== nm);
  const t = $("bc-tab-" + nm), p = $("bc-pane-" + nm); if (t) t.remove(); if (p) p.remove();
  if (bcState.active === nm) bcState.active = bcState.order[0] || null;
  if (bcState.order.length === 0) closeBroadcast();
  else if (bcState.active) bcSelect(bcState.active);
}

function bcSetBroadcast(v) {
  bcState.broadcast = v;
  $("bc-bcast-on").classList.toggle("active", v);
  $("bc-bcast-off").classList.toggle("active", !v);
  bcStatus(v ? "廣播模式：指令列會送到全部主機" : "目前主機模式：只送到目前「" + (bcState.active||"") + "」");
}

function bcWsMsg(raw) {
  if (typeof raw === "string") {
    let j; try { j = JSON.parse(raw); } catch { return; }
    if (j.type === "ready") {
      bcStatus(`已就緒：${j.joined.length} 台`);
      j.joined.forEach(nm => bcLamp(nm, "on"));
      j.failed.forEach(nm => { bcLamp(nm, "err"); bcAppend(nm, "\r\n\x1b[31m[連線失敗]\x1b[0m\r\n"); });
    } else if (j.type === "out") {
      bcAppend(j.name, j.data);
    } else if (j.type === "closed") {
      bcLamp(j.name, "err");
    } else if (j.type === "error") {
      bcStatus(j.msg);
    }
  }
}

function bcAppend(nm, txt) {
  const t = bcState.terms[nm]; if (t && t.term) { try { t.term.write(txt); } catch {} }
  bcMarkAck(nm, "ok");   // 有輸出回來 = 該台確實收到指令
}

function bcFitAll() { Object.values(bcState.terms).forEach(t => { try { t.fit.fit(); } catch {} }); bcSendResize(); }
function bcFitOne(nm) { const t = bcState.terms[nm]; if (t) { try { t.fit.fit(); } catch {} } bcSendResize(); }
function bcSendResize() {
  if (!bcState.ws || bcState.ws.readyState !== 1) return;
  const t = bcState.terms[bcState.active]; if (!t) return;
  const d = t.fit.proposeDimensions(); if (!d) return;
  bcState.ws.send(JSON.stringify({ type: "resize", cols: d.cols, rows: d.rows }));
}

// 指令列：Enter 送出（廣播 or 目前主機）
function bcSendInput() {
  const inp = $("bc-input"); if (!inp) return;
  const cmd = inp.value; inp.value = "";
  if (!cmd || !bcState.ws || bcState.ws.readyState !== 1) return;
  const payload = cmd + "\r";
  const targets = bcState.broadcast
    ? bcState.order.filter(n => bcState.stat[n] === "on" || bcState.stat[n] === "wait")
    : (bcState.active ? [bcState.active] : []);
  if (bcState.broadcast) bcState.ws.send(JSON.stringify({ type: "broadcast", data: payload }));
  else if (bcState.active) bcState.ws.send(JSON.stringify({ type: "sendOne", name: bcState.active, data: payload }));
  // 📡 B：標記「已送出，等收確認」：廣播→所有已連線主機都亮「…」；單台→只亮該台
  targets.forEach(nm => bcMarkAck(nm, "send"));
  bcStatus(`${esc(cmd)} → ${bcState.broadcast ? `廣播 ${targets.length} 台（等待確認）` : esc(bcState.active) + "（等待確認）"}`);
}

// 每台 tab 的「收到指令 ✓」燈號（send=送出待回 / ok=收到輸出）
function bcMarkAck(nm, state) {
  bcState.ack = bcState.ack || {};
  bcState.ack[nm] = state;
  const a = $("bc-ack-" + nm);
  if (a) {
    a.textContent = state === "ok" ? "✓" : state === "send" ? "…" : "";
    a.classList.toggle("ok", state === "ok");
    a.classList.toggle("send", state === "send");
  }
}

function closeBroadcast() {
  try { bcState.ws && bcState.ws.close(); } catch {}
  bcState.ws = null; bcState.order = []; bcState.terms = {}; bcState.stat = {}; bcState.active = null;
  $("bc-modal").style.display = "none";
}

let bcMax = false;
function toggleBcMaximize() {
  const box = $("bc-modal-box"), btn = $("bc-max-btn");
  if (!box) return;
  bcMax = !bcMax;
  box.classList.toggle("maximized", bcMax);
  btn.textContent = bcMax ? "🗗" : "⛶";
  setTimeout(bcFitAll, 60);
}

function resetBcGeometry() {
  const box = $("bc-modal-box"); if (!box) return;
  box.classList.remove("maximized"); box.style.left = ""; box.style.top = ""; box.style.transform = "";
}

class Term {

  constructor(containerId, url, statusId) {
    this.container = $(containerId); this.url = url; this.statusEl = $(statusId);
    this.term = null; this.ws = null; this.fitAddon = null;
  }
  connect() {
    if (!window.Terminal) { this.setStatus("程式娫未載兘", "err"); return; }
    this.term = new Terminal({
      cursorBlink: true, fontSize: 13,
      fontFamily: '"Cascadia Mono","Consolas","Noto Sans Mono CJK TC",monospace',
      theme: { background: "#0b0f14", foreground: "#e6edf3", cursor: "#0a7d78" },
      scrollback: 2000,
    });
    this.fitAddon = new FitAddon.FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.term.open(this.container);
    this.fitAddon.fit();
    const proto = location.protocol === "https:" ? "wss://" : "ws://";
    this.ws = new WebSocket(proto + location.host + this.url);
    this.term.onData(d => { if (this.ws && this.ws.readyState === 1) this.ws.send(d); });
    this.ws.onopen = () => { this.setStatus("已連線", "ok"); this.sendResize(); };
    this.ws.onmessage = e => {
      if (e.data instanceof Blob) { e.data.arrayBuffer().then(buf => this.term.write(new Uint8Array(buf))); }
      else { try { const j = JSON.parse(e.data); if (j.type === "error") this.setStatus(j.msg, "err"); } catch { this.term.write(e.data); } }
    };
    this.ws.onclose = () => this.setStatus("已斷線", "err");
    this.ws.onerror = () => this.setStatus("連線錯誤", "err");
  }
  setStatus(text, cls) { if (this.statusEl) this.statusEl.innerHTML = `${this.url.includes("/bmc") ? "BMC" : "OS"} <span class="term-badge ${cls}">${esc(text)}</span>`; }
  fit() {
    if (!this.fitAddon || !this.term) return;
    try { this.fitAddon.fit(); } catch {}
    this.sendResize();
  }
  sendResize() {
    if (!this.fitAddon) return;
    const dims = this.fitAddon.proposeDimensions();
    if (dims && this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ type: "resize", cols: dims.cols, rows: dims.rows }));
  }
}
function closeTerm() {
  [termInstances?.os, termInstances?.bmc].forEach(t => { try { t?.ws && t.ws.close(); } catch {} });
  termInstances = null;
  $("term-modal").style.display = "none";
}
function toggleTermMaximize() {
  const box = $("term-modal-box");
  if (!box) return;
  box.classList.toggle("maximized");
  box.style.left = ""; box.style.top = ""; box.style.transform = "";
  requestAnimationFrame(() => fitAll());
}
let dragState = null;
function initTermDrag() {
  const handle = $("term-head");
  const box = $("term-modal-box");
  if (!handle || !box) return;
  handle.addEventListener("mousedown", (e) => {
    if (box.classList.contains("maximized")) return;
    if (e.target.closest("button")) return;
    const r = box.getBoundingClientRect();
    dragState = { startX: e.clientX, startY: e.clientY, origX: r.left, origY: r.top };
    box.classList.add("dragging");
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
    e.preventDefault();
  });
  function onDragMove(e) {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    box.style.left = (dragState.origX + dx) + "px";
    box.style.top = (dragState.origY + dy) + "px";
    box.style.transform = "none";
  }
  function onDragEnd() {
    dragState = null;
    box.classList.remove("dragging");
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    requestAnimationFrame(() => fitAll());
  }
}
let bcDragState = null;
function initBcDrag() {
  const handle = $("bc-head");
  const box = $("bc-modal-box");
  if (!handle || !box) return;
  handle.addEventListener("mousedown", (e) => {
    if (box.classList.contains("maximized")) return;
    if (e.target.closest("button")) return;
    const r = box.getBoundingClientRect();
    bcDragState = { startX: e.clientX, startY: e.clientY, origX: r.left, origY: r.top };
    box.classList.add("dragging");
    document.addEventListener("mousemove", onBcDragMove);
    document.addEventListener("mouseup", onBcDragEnd);
    e.preventDefault();
  });
  function onBcDragMove(e) {
    if (!bcDragState) return;
    box.style.left = (bcDragState.origX + (e.clientX - bcDragState.startX)) + "px";
    box.style.top = (bcDragState.origY + (e.clientY - bcDragState.startY)) + "px";
    box.style.transform = "none";
  }
  function onBcDragEnd() {
    bcDragState = null;
    box.classList.remove("dragging");
    document.removeEventListener("mousemove", onBcDragMove);
    document.removeEventListener("mouseup", onBcDragEnd);
    requestAnimationFrame(() => bcFitAll());
  }
}
/* ---------- 啟動 ---------- */
function buildNav() {
  const nav = $("nav");
  let cur = null;
  NAV_ITEMS.forEach(it => {
    if (it.group !== cur) { cur = it.group; nav.insertAdjacentHTML("beforeend", `<div class="nav-group">${it.group}</div>`); }
    const b = document.createElement("button");
    b.className = "nav-btn"; b.dataset.view = it.id;
    b.innerHTML = `<span class="ico">${it.icon}</span><span>${esc(it.label)}</span>`;
    b.addEventListener("click", () => setView(it.id));
    nav.appendChild(b);
  });
}
$("theme-toggle")?.addEventListener("click", () => applyTheme(root.dataset.theme === "dark" ? "light" : "dark"));
window.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeAdd(); closeProjectModal(); } });
document.addEventListener("DOMContentLoaded", async () => {
  loadTheme(); buildNav(); initTermDrag(); initBcDrag();
  parseHash();                      // 讀取 URL hash，指定初始分頁
  window.addEventListener("resize", () => { fitAll(); bcFitAll(); });
  window.addEventListener("hashchange", () => { parseHash(); setView(state.view); });
  try {
    await Promise.all([loadMachines(), loadProjects()]);
    setView(state.view);
  } catch (e) {
    $("content").innerHTML = `<div class="empty">後端無法連線（${esc(e.message)}）<br>請確認有啟動 python 後端程式。</div>`;
  }
});
