"use strict";
/* Wistron PA Server Manager - frontend */
const NAV_ITEMS = [
  { id: "dashboard", icon: "рҹҸ ", label: "йҰ–й Ғ / Dashboard", group: "зёҪиҰҪ" },
  { id: "projects",  icon: "рҹ–ҳ", label: "System manager", group: "з®ЎзҗҶ" },
  { id: "rack",      icon: "рҹ—„", label: "Rack Manager", group: "з®ЎзҗҶ" },
];
const TITLES = { dashboard: "йҰ–й Ғ / Dashboard", projects: "System manager", rack: "Rack Manager", machine: "е–®ж©ҹи©іжғ…" };
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
  if (!r.ok) { const e = new Error(data.detail || "и«ӢжұӮеӨұж•—"); e.data = data; throw e; }
  return data;
}
async function loadMachines(assignMissingU) {
  const data = await api("/api/machines");
  machines = data.machines || [];
  // дёҖж¬ЎжҖ§пјҡзӮәе°ҡжңӘжңү rack_u зҡ„ rack ж©ҹеҸ°жҢҮжҙҫ UпјҲдҫқе°ҲжЎҲе…§ж—ўжңү orderпјҢз”ұдёҠеҫҖдёӢ 42вҶ’вҖҰпјү
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
          // еҗҢжӯҘеҜ«еӣһеҫҢз«ҜпјҲйқһзӯүеҫ…пјҢеӨұж•—д№ҹдёҚеҪұйҹҝйЎҜзӨәпјү
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
  if (alive === true) return `<span class="badge green"><span class="dot"></span>еңЁз·ҡ</span>`;
  if (alive === false) return `<span class="badge red"><span class="dot"></span>йӣўз·ҡ</span>`;
  return `<span class="badge" style="background:var(--bg-panel-2);color:var(--text-faint)">жңӘиЁӯе®ҡ</span>`;
}
// BMC йӣ»жәҗзӢҖж…Ӣпјҡи§Јжһҗ ipmitool еҺҹе§ӢијёеҮәпјҲеҰӮ "Chassis Power is on/off"пјүвҶ’ еҪ©иүІ badge
function powerBadge(raw) {
  const s = String(raw || "").toLowerCase();
  if (/\bon\b/.test(s) && !/\boff\b/.test(s)) return `<span class="badge green"><span class="dot"></span>йӣ»жәҗй–Ӣе•ҹ <span class="mono">ON</span></span>`;
  if (/\boff\b/.test(s)) return `<span class="badge red"><span class="dot"></span>йӣ»жәҗй—ңй–ү <span class="mono">OFF</span></span>`;
  return `<span class="badge" style="background:var(--bg-panel-2);color:var(--text-faint)">жңӘзҹҘ</span>`;
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
      <text x="60" y="74" class="donut-l">еҸ—з®Ўзі»зөұ</text>
    </svg>` :
    `<div class="empty-small">е°ҡз„Ўзі»зөұ</div>`;
  const projCards = projects.map(p => {
    const members = projectMembers(p.name);
    const o = members.filter(m => m.os_alive === true).length;
    const off = members.length - o;
    return `
      <div class="dash-proj" onclick="viewProject('${esc(p.name)}')" title="й»һжҲ‘зңӢжӯӨе°ҲжЎҲ">
        <div class="dash-proj-head">
          <span class="dash-proj-name">рҹ“Ғ ${esc(p.name)}</span>
          <span class="dash-proj-count">${members.length} еҸ°</span>
        </div>
        ${p.desc ? `<div class="dash-proj-desc">${esc(p.desc)}</div>` : ""}
        <div class="dash-proj-bar"><div class="dash-proj-bar-in" style="width:${members.length? o/members.length*100:0}%"></div></div>
        <div class="dash-proj-stats">
          <span class="mini">рҹ–Ҙ L10 ${members.filter(m=>m.level!=="rack").length}</span>
          <span class="mini">рҹ—„ L11 ${members.filter(m=>m.level==="rack").length}</span>
          <span class="mini green">в—Ҹ ${o} з·ҡдёҠ</span>
          <span class="mini red">в—Ҹ ${off} йӣўз·ҡ</span>
        </div>
      </div>`;
  }).join("");
  return `
    <div class="dash-kpis">
      <div class="stat"><div class="k">еҸ—з®Ўзі»зөұ</div><div class="v">${total}</div></div>
      <div class="stat"><div class="k">Rack / L11</div><div class="v" style="color:var(--accent-blue)">${racks}</div></div>
      <div class="stat"><div class="k">System / L10</div><div class="v" style="color:var(--w-green)">${systems}</div></div>
      <div class="stat"><div class="k">з·ҡдёҠ</div><div class="v" style="color:var(--green)">${online}</div></div>
      <div class="stat"><div class="k">йӣўз·ҡ</div><div class="v" style="color:var(--red)">${offline}</div></div>
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
        <div class="card-title">Projects <span class="hint">${projects.length} еҖӢе°ҲжЎҲ</span></div>
        <div class="dash-proj-grid">${projCards}</div>
      </div>
      <div class="glass-panel copilot-panel">
        <div class="card-title">AI Copilot <span class="hint" id="cop-model">Ollama В· qwen3.8</span></div>
        <div class="copilot-body" id="cop-box" style="max-height:440px;overflow:auto">
          <div class="copilot-msg ai">рҹ‘Ӣ жҲ‘жҳҜ AI CopilotпјҲдёІеҲ°дҪ жң¬ж©ҹ Ollama qwen3.8:27bпјүгҖӮзӣ®еүҚе·ІзӣЈжҺ§ <b>${total}</b> еҸ°зі»зөұгҖҒ<b>${online}</b> з·ҡдёҠгҖҒ<b>${offline}</b> йӣўз·ҡгҖӮе•ҸжҲ‘д»»дҪ•е•ҸйЎҢпҪһпјҲдҫӢеҰӮгҖҢе“ӘеҸ°жңүе•ҸйЎҢпјҹгҖҚгҖҢproj_k е°ҲжЎҲзӢҖж…ӢпјҹгҖҚпјү</div>
        </div>
        <div class="copilot-input">
          <input class="input" id="cop-input" placeholder="ијёе…ҘжҢҮд»ӨзөҰ CopilotвҖҰ" autocomplete="off">
          <button class="btn primary" id="cop-send">йҖҒеҮә</button>
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
  if (send) { send.disabled = true; send.textContent = "вҖҰ"; }
  try {
    const r = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const j = await r.json();
    if (j.ok) copAppend("ai", esc(j.reply).replace(/\n/g, "<br>"));
    else copAppend("ai", `вЁ  ${esc(j.error || "е‘јеҸ«еӨұж•—")}`);
  } catch (e) {
    copAppend("ai", `вЁ  ${esc("з„Ўжі•йҖЈз·ҡеҲ°еҫҢз«Ҝпјҡ " + e.message)}`);
  } finally {
    if (send) { send.disabled = false; send.textContent = "йҖҒеҮЁ"; }
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
/* ============ Rack Manager (L11 ж•ҙж«ғзӣЈжҺ§/жҺ§еҲ¶) ============ */
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
  if (btn) { btn.textContent = "вҸі Ping дёӯвҖҰ"; btn.disabled = true; }
  try {
    const data = await api(`/api/rack/ping?project=${encodeURIComponent(project)}`);
    rackView.pinged = data.nodes;
  } catch (e) {
    rackView.pinged = [];
    alert("Ping еӨұж•—пјҡ" + e.message);
  }
  if (btn) { btn.textContent = "рҹ“Ў Ping Rack"; btn.disabled = false; }
  setView("rack");
}
async function rackPowerAll(project, on) {
  const racks = machines.filter(m => m.level === "rack" && m.project === project);
  if (!racks.length) return alert("жӯӨе°ҲжЎҲжІ’жңүж•ҙж«ғж©ҹеҸ°");
  const okMsg = `жӯЈеңЁ${on ? "й–Ӣж©ҹ" : "й—ңж©ҹ"}${racks.length} еҸ°ж•ҙж«ғж©ҹеҸ°вҖҰ`;
  const done = [];
  for (const m of racks) {
    try {
      const r = await api(`/api/machine/${encodeURIComponent(m.name)}/power`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on })
      });
      done.push(`${m.name}: йҢҜиӘӨ ${e.message}`);
    } catch (e) {
      done.push(`${m.name}: йҢҜиӘӨ ${e.message}`);
    }
  }
  setView("rack");
  setTimeout(() => alert(okMsg + "\n\n" + done.join("\n")), 200);
}
async function singlePower(name, on) {
  if (!confirm(`зўәе®ҡиҰҒгҖҢ${on ? "й–Ӣж©ҹ" : "й—ңж©ҹ"}гҖҚ${name} е—Һпјҹ`)) return;
  try {
    const r = await api(`/api/machine/${encodeURIComponent(name)}/power`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on })
    });
    setView("rack");
    setTimeout(() => alert(`${name} ${r.ok ? (on ? "е·Ій–Ӣж©ҹ рҹҹў" : "е·Ій—ңж©ҹ вҡӘ") : "ж“ҚдҪңеӨұж•—пјҡ" + (r.info||"")}
зӣ®еүҚзӢҖж…Ӣпјҡ${r.power_status}`), 200);
  } catch (e) {
    alert("ж“ҚдҪңеӨұж•—пјҡ" + e.message);
  }
}
// ж•ҙж«ғ list иҮӘйҒёжё…е–® ping зөҗжһң
function rackPingNode(m) {
  const n = (rackView.pinged || []).find(x => x.name === m.name);
  const osUp = n ? n.os_alive : null;
  const bmcUp = n ? n.bmc_alive : null;
  const lamp = (v) => v === true ? `<span class="ping-lamp on" title="Online">рҹҹў</span>`
              : v === false ? `<span class="ping-lamp off" title="No reply">рҹ”ҙ</span>`
              : `<span class="ping-lamp none" title="жңӘ Ping">вЁӘ</span>`;
  const nm = `${esc(m.name)}${m.passive ? ' <span class="badge badge-rack" style="font-size:9px;padding:1px 6px">з„ЎBMC</span>' : ""}`;
  return `<td class="mono">${nm}</td>
          <td>${m.os_ip ? `${lamp(osUp)} <span class="ping-ip mono">${esc(m.os_ip)}</span>` : `<span style="color:var(--text-faint)">вҖ”</span>`}</td>
          <td>${m.bmc_ip ? `${lamp(bmcUp)} <span class="ping-ip mono">${esc(m.bmc_ip)}</span>` : `<span style="color:var(--text-faint)">вҖ”</span>`}</td>`;
}
/* ================= Rack Manager ж•ҙеҗҲй ҒпјҲRackmap + еҚЎзүҮ/жё…е–® + MGX е…ғд»¶пјү ================= */
const MGX_TYPES = {
  server:      { icon: "рҹ–Ҙ", label: "Server дјәжңҚеҷЁ",    cls: "mgx-server" },
  switch:      { icon: "рҹ”Җ", label: "Switch дәӨжҸӣеҷЁ",    cls: "mgx-switch" },
  powershelf:  { icon: "вҡЎ", label: "Power Shelf йӣ»жәҗ", cls: "mgx-ps" },
  pdu:         { icon: "рҹ”Ң", label: "PDU йӣ»жәҗеҲҶй…ҚеҷЁ",   cls: "mgx-ps" },
  cdu:         { icon: "рҹ’§", label: "CDU еҶ·еҚ»еҲҶй…Қе–®е…ғ", cls: "mgx-cdu" },
  storage:     { icon: "рҹ’ҫ", label: "Storage е„Іеӯҳ",     cls: "mgx-storage" },
  network:     { icon: "рҹҢҗ", label: "Network з¶Іи·ҜеҠҹиғҪ", cls: "mgx-network" },
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
    opts += `<option value="${u}" ${(m.rack_u || 0) === u ? "selected" : ""} ${usedUs.has(u) ? "disabled" : ""}>U${u}${usedUs.has(u) ? "пјҲе·ІеҚ з”Ёпјү" : ""}</option>`;
  }
  const typeBtns = Object.entries(MGX_TYPES)
    .map(([k, v]) => `<button class="btn small ${mgxTypeOf(m) === k ? "active" : ""}" onclick="rackMoveSetType('${esc(m.name)}','${k}')">${v.icon} ${esc(v.label)}</button>`)
    .join("");
  showDialog("вҮ… з§»еӢ• / иЁӯе®ҡдҪҚзҪ®", `
    <div class="rm-modal-body">
      <p style="margin-bottom:12px">ж©ҹеҸ°пјҡ<b>${esc(m.name)}</b>пјҲзӣ®еүҚ U${m.rack_u || "вҖ”"}пјү</p>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">йҒёж“Үзӣ®жЁҷ U ж§ҪпјҲе·ІеҚ з”ЁйЎҜзӨәзҒ°пјү</label>
      <select class="input" id="rm-move-u" style="width:100%;padding:8px">${opts}</select>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">${typeBtns}</div>
      <p style="font-size:11px;color:var(--text-faint);margin-top:10px">е…ғд»¶йЎһеһӢпјҡ<b id="rm-newtype">${esc(MGX_TYPES[mgxTypeOf(m)].label)}</b></p>
    </div>`,
    [
      { txt: "еҸ–ж¶Ҳ", cls: "", fn: () => closeDialog() },
      { txt: "е„ІеӯҳдҪҚзҪ®", cls: "primary", fn: () => {
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
  showDialog("вһ• ж–°еўһж©ҹж«ғе…ғд»¶пјҲз„Ў OS/BMC дәҰеҸҜпјү", `
    <div class="rm-modal-body">
      <p style="margin-bottom:12px;font-size:12px;color:var(--text-faint)">з”Ёж–јеҠ е…Ҙ switch / power shelf / CDU / PDU / Storage зӯү<b>жІ’жңү OS жҲ– BMC</b>зҡ„е…ғд»¶гҖӮеҸӘйңҖеҗҚзЁұ + йЎһеһӢ + U ж§ҪеҚіеҸҜпјҢеҠ е…ҘеҫҢеҸҜеҶҚжҢҮжҙҫе°ҲжЎҲгҖӮ</p>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">е…ғд»¶еҗҚзЁұ *</label>
      <input class="input" id="rp-name" style="width:100%;padding:8px;margin-bottom:12px" placeholder="дҫӢеҰӮ SW-01 / CDU-1 / PS-3">
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">йЎһеһӢ</label>
      <select class="input" id="rp-type" style="width:100%;padding:8px;margin-bottom:12px">
        ${Object.entries(MGX_TYPES).map(([k,v]) => `<option value="${k}">${v.icon} ${esc(v.label)}</option>`).join("")}
      </select>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">U ж§Ҫ</label>
      <select class="input" id="rp-u" style="width:100%;padding:8px;margin-bottom:12px">
        ${Array.from({length:42},(_,i)=>42-i).map(u => `<option value="${u}">U${u}</option>`).join("")}
      </select>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">з®ЎзҗҶ IPпјҲйҒёеЎ«пјҢеҸҜ ping з”Ёпјү</label>
      <input class="input" id="rp-ip" style="width:100%;padding:8px" placeholder="з•ҷз©әеүҮз„Ў IP">
    </div>`,
    [
      { txt: "еҸ–ж¶Ҳ", cls: "", fn: () => closeDialog() },
      { txt: "е»әз«ӢдёҰеҠ е…Ҙ", cls: "primary", fn: () => {
        const name = $("rp-name").value.trim();
        if (!name) return alert("и«ӢеЎ«е…ғд»¶еҗҚзЁұ");
        api("/api/rack/passive", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, mgx_type: $("rp-type").value, rack_u: +$("rp-u").value, manage_ip: $("rp-ip").value.trim(), project: proj }) })
          .then(() => loadMachines())
          .then(() => { closeDialog(); setView("rack"); })
          .catch(e => alert("е»әз«ӢеӨұж•—пјҡ" + e.message));
      } },
    ]);
}
function rackAddDialog() {
  const proj = rackView.project;
  const inRack = new Set(machines.filter(x => x.project === proj && x.level === "rack").map(x => x.name));
  const candidates = machines.filter(x => !inRack.has(x.name));
  if (!candidates.length) { alert("жІ’жңүеҸҜеҠ е…Ҙзҡ„ж©ҹеҸ°пјҲжүҖжңүж©ҹеҸ°йғҪе·ІеңЁжӯӨж©ҹж«ғпјү"); return; }
  const selOpts = candidates.map(m => `<option value="${esc(m.name)}">${esc(m.name)} (${esc(m.os_ip||"вҖ”")})</option>`).join("");
  const members = machines.filter(x => x.level === "rack" && x.project === proj);
  const usedUs = new Set(members.filter(x => typeof x.rack_u === "number" && x.rack_u > 0).map(x => x.rack_u));
  let uopts = "";
  for (let u = 42; u >= 1; u--) uopts += `<option value="${u}" ${usedUs.has(u) ? "disabled" : ""}>U${u}${usedUs.has(u) ? "пјҲе·Із”Ёпјү" : ""}</option>`;
  showDialog("вһ• еҠ е…Ҙж©ҹж«ғ", `
    <div class="rm-modal-body">
      <p style="margin-bottom:12px;font-size:12px;color:var(--text-faint)">жҠҠж—ўжңүж©ҹеҸ°пјҲL10 жҲ– L11пјүеҠ е…Ҙж©ҹж«ғе°ҲжЎҲгҖҢ${esc(proj)}гҖҚдёҰжҢҮжҙҫ U ж§ҪгҖӮ</p>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">йҒёж“Үж©ҹеҸ°</label>
      <select class="input" id="rm-add-m" style="width:100%;padding:8px;margin-bottom:12px">${selOpts}</select>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">йҒёж“Ү U ж§Ҫ</label>
      <select class="input" id="rm-add-u" style="width:100%;padding:8px">${uopts}</select>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin:12px 0 6px">е…ғд»¶йЎһеһӢ</label>
      <select class="input" id="rm-add-type" style="width:100%;padding:8px">
        ${Object.entries(MGX_TYPES).map(([k, v]) => `<option value="${k}">${v.icon} ${esc(v.label)}</option>`).join("")}
      </select>
    </div>`,
    [
      { txt: "еҸ–ж¶Ҳ", cls: "", fn: () => closeDialog() },
      { txt: "еҠ е…Ҙ", cls: "primary", fn: () => {
        const nm = $("rm-add-m").value, u = +$("rm-add-u").value, ty = $("rm-add-type").value;
        rackAssign(nm, { project: proj, level: "rack", rack_u: u, mgx_type: ty })
          .then(() => { closeDialog(); setView("rack"); })
          .catch(e => alert("еҠ е…ҘеӨұж•—пјҡ" + e.message));
      } },
    ]);
}
function dialogBackdrop() {
  let b = $("rm-dialog");
  if (b) return b;
  b = document.createElement("div");
  b.className = "modal-backdrop"; b.id = "rm-dialog"; b.style.display = "none";
  b.innerHTML = `<div class="modal rm-modal"><div class="modal-head"><div class="modal-title" id="rm-dialog-title"></div><button class="btn small" onclick="closeDialog()">вң•</button></div><div class="modal-body" id="rm-dialog-body"></div><div class="modal-foot" id="rm-dialog-foot"></div></div>`;
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

  // еҸӘеҲ—гҖҢжңү L11пјҲRackпјүж©ҹеҸ°гҖҚзҡ„е°ҲжЎҲ
  const selOpts = projSet.map(pn => `<option value="${esc(pn)}" ${pn === proj ? "selected" : ""}>${esc(pn)}пјҲ${racksAll.filter(m=>m.project===pn).length} еҸ°пјү</option>`).join("");
  const toolbar = `
    <span class="spacer"></span>
    <label class="rack-sel">ж©ҹж«ғе°ҲжЎҲ
      <select class="input" onchange="rackSetProject(this.value)">
        <option value="">пјҲйҒёж“Үж©ҹж«ғе°ҲжЎҲпјү</option>
        ${selOpts}
      </select>
    </label>`;

  return `
    <div class="rack-hero">
      <div class="rack-hero-title">рҹ—„ Rack Manager <span class="hint">пјҲж•ҙеҗҲй Ғпјҡж©ҹж«ғе№ійқўең– + еҚЎзүҮ + жё…е–®пјү</span></div>
      <div class="rack-hero-sub">${esc(proj || "пјҲжңӘйҒёе°ҲжЎҲпјү")} е°ҲжЎҲ В· ${members.length} еҸ° | MGX е…ғд»¶пјҡServer / Switch / Power Shelf / CDU</div>
      ${toolbar}
      ${anyRack ? `
      <button class="btn primary" id="rack-ping-btn" onclick="rackPing('${esc(rackView.project)}')">рҹ“Ў Ping Rack</button>
      <button class="btn" onclick="rackAddDialog()">вһ• еҠ е…Ҙж©ҹж«ғ</button>
      <button class="btn" onclick="rackAddPassive()">вһ• ж–°еўһе…ғд»¶</button>
      <button class="btn" onclick="linkAddDialog()">вһ• ж–°еўһйҖЈз·ҡ</button>
      <button class="btn" onclick="rackPowerAll('${esc(rackView.project)}',true)">вҸ» й–Ӣж©ҹж•ҙж«ғ</button>
      <button class="btn btn-danger" onclick="rackPowerAll('${esc(rackView.project)}',false)">вҸ» й—ңж©ҹж•ҙж«ғ</button>` : ""}
    </div>
    <div class="rack-status-legend">
      ${Object.values(MGX_TYPES).filter((v, i, a) => a.findIndex(x => x.cls === v.cls) === i).map(v => `<span class="mgx-legend"><span class="mgx-dot ${v.cls}"></span>${esc(v.label)}</span>`).join("")}
      &nbsp;В·&nbsp; зӢҖж…Ӣпјҡ<span class="ping-lamp on">рҹҹў</span> Up &nbsp;<span class="ping-lamp off">рҹ”ҙ</span> Down &nbsp;<span class="ping-lamp none">вЁӘ</span> жңӘ Ping
      <span class="hint" style="float:right">вҮ… еҸҜжҸӣ U ж§Ҫ / е…ғд»¶йЎһеһӢпјӣй»һпјӢж”ҫзҪ®з©әж§Ҫпјӣй»һж јеӯҗзңӢи©іжғ…</span>
    </div>
    ${anyRack ? rackmapHtml(members, pinged) : emptyRackCard()}
    ${anyRack && members.length ? devicesHtml(members, pinged) : ""}
    ${anyRack && members.length ? rackTopoHtml(members) : ""}`;
}
function emptyRackCard() {
  return `<div class="card" style="margin-top:18px"><div class="empty">зӣ®еүҚжІ’жңү L11пјҲRackпјүж•ҙж«ғж©ҹеҸ°гҖӮ<br>и«ӢеңЁгҖҢж–°еўһзі»зөұгҖҚжҠҠеұӨзҙҡйҒёжҲҗ <b>L11 В· Rack Level</b>пјҢжҲ–гҖҢвһ• еҠ е…Ҙж©ҹж«ғгҖҚжҠҠж—ўжңүж©ҹеҸ°ж”ҫйҖІдҫҶгҖӮ</div></div>`;
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
      rows += `<div class="rm-row rm-empty"><span class="rm-u mono">U${u}</span><div class="rm-empty-space" onclick="rackEmptyClick(${u})" title="й»һж“Ҡж”ҫзҪ®ж©ҹеҸ°">пјӢ</div></div>`;
      continue;
    }
    const n = pinged.find(x => x.name === m.name);
    const up = n ? n.os_alive : null;
    const info = mgxInfo(m);
    const cls = up === true ? "green" : up === false ? "red" : "none";
    const isPassive = !!m.passive;
    const click = isPassive ? `rackMoveDialog('${esc(m.name)}')` : `openMachine('${esc(m.name)}')`;
    const powerBtns = isPassive ? "" : `
          <button class="btn small" title="й–Ӣж©ҹ" onclick="singlePower('${esc(m.name)}',true)">вҸ»</button>
          <button class="btn small btn-danger" title="й—ңж©ҹ" onclick="singlePower('${esc(m.name)}',false)">вҸ»</button>`;
    const nm = `${info.icon} ${esc(m.name)}${isPassive ? ' <span class="badge badge-rack" style="font-size:9px;padding:1px 6px">з„ЎBMC</span>' : ''}`;
    rows += `
    <div class="rm-row" data-u="${u}">
      <span class="rm-u mono">U${u}</span>
      <div class="rm-cell ${cls} ${info.cls}" onclick="${click}">
        <span class="rm-lamp">${up === true ? "рҹҹў" : up === false ? "рҹ”ҙ" : "вЁӘ"}</span>
        <span class="rm-name">${nm}</span>
        <span class="rm-ip mono">${esc(m.os_ip || m.bmc_ip || "")}</span>
        <span class="rm-actions" onclick="event.stopPropagation()">
          ${powerBtns}
          <button class="btn small" title="жҸӣдҪҚ/йЎһеһӢ" onclick="rackMoveDialog('${esc(m.name)}')">вҮ…</button>
        </span>
      </div>
    </div>`;
  }
  return `
  <div class="rm-rack">
    <div class="rm-head"><span></span><span>${esc(rackView.project)} вҖ” 42U ж©ҹж«ғпјҲпјӢж”ҫзҪ®пјү</span></div>
    ${rows}
  </div>`;
}
function rackEmptyClick(u) {
  const proj = rackView.project;
  const members = machines.filter(x => x.project === proj && x.level === "rack");
  const inRack = new Set(members.map(x => x.name));
  const candidates = machines.filter(x => !inRack.has(x.name));
  if (!candidates.length) { alert("жІ’жңүжңӘж”ҫзҪ®зҡ„ж©ҹеҸ°гҖӮи«Ӣе…ҲгҖҢвһ• еҠ е…Ҙж©ҹж«ғгҖҚж–°еўһпјҢжҲ–жҠҠж©ҹеҸ°з§»е…ҘжӯӨе°ҲжЎҲгҖӮ"); return; }
  const opts = candidates.map(m => `<option value="${esc(m.name)}">${esc(m.name)} (${esc(m.os_ip)})</option>`).join("");
  showDialog(`ж”ҫзҪ®еҲ° U${u}`, `
    <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">йҒёж“ҮиҰҒж”ҫеҲ° U${u} зҡ„ж©ҹеҸ°</label>
    <select class="input" id="rm-empty-m" style="width:100%;padding:8px">${opts}</select>`,
    [
      { txt: "еҸ–ж¶Ҳ", cls: "", fn: () => closeDialog() },
      { txt: "ж”ҫзҪ®", cls: "primary", fn: () => {
        const nm = $("rm-empty-m").value;
        rackAssign(nm, { project: proj, level: "rack", rack_u: u }).then(() => { closeDialog(); setView("rack"); }).catch(e => alert("еӨұж•—пјҡ" + e.message));
      } },
    ]);
}
let devicesView = "cards";
function devicesSetView(v) { devicesView = v; setView("rack"); }
function devicesHtml(members, pinged) {
  const cardsView = devicesView === "cards";
  // жё…е–®/еҚЎзүҮйғҪдҫқ U з”ұеӨ§еҲ°е°ҸпјҲU42вҶ’U1пјүжҺ’еҲ—
  const byU = (a, b) => ((b.rack_u || 0) - (a.rack_u || 0));
  members = members.slice().sort(byU);
  const switchBtns = `
    <div class="dview-tabs">
      <button class="btn small ${cardsView ? "active" : ""}" onclick="devicesSetView('cards')">в–Ұ еҚЎзүҮ</button>
      <button class="btn small ${!cardsView ? "active" : ""}" onclick="devicesSetView('list')">в–° жё…е–®</button>
    </div>`;
  let body;
  if (cardsView) {
    body = `<div class="rack-grid">` + members.map(m => {
      const n = pinged.find(x => x.name === m.name);
      const up = n ? n.os_alive : null;
      const info = mgxInfo(m);
      const isPassive = !!m.passive;
      const powerBtns = isPassive ? "" : `
          <button class="btn small" onclick="singlePower('${esc(m.name)}',true)">вҸ» й–Ӣж©ҹ</button>
          <button class="btn small btn-danger" onclick="singlePower('${esc(m.name)}',false)">вҸ» й—ңж©ҹ</button>`;
      return `
      <div class="rack-card ${info.cls}-card" ${isPassive ? `onclick="rackMoveDialog('${esc(m.name)}')" style="cursor:pointer"` : ""}>
        <div class="rack-card-top">
          <span class="rack-name">${info.icon} ${esc(m.name)}${isPassive ? ' <span class="badge badge-rack" style="font-size:9px;padding:1px 6px">з„ЎBMC</span>' : ''}</span>
          <span class="rstatus ${up === true ? "green" : up === false ? "red" : "amber"}">${up === true ? "рҹҹў дёҠз·ҡ" : up === false ? "рҹ”ҙ йӣўз·ҡ" : "вЁӘ жңӘзҹҘ"}</span>
        </div>
        <div class="rack-mgx"><span class="mgx-dot ${info.cls}"></span> ${esc(info.label)} В· U${m.rack_u || "вҖ”"}</div>
        <div class="rack-proj">е°ҲжЎҲ ${esc(m.project || "вҖ”")} В· OS ${esc(m.os_ip || "вҖ”")}<br>BMC ${esc(m.bmc_ip || "з„Ў")}</div>
        <div class="rack-actions" ${isPassive ? `onclick="event.stopPropagation()"` : ""}>
          ${powerBtns}
          <button class="btn small" onclick="rackMoveDialog('${esc(m.name)}')">вҮ… жҸӣдҪҚ</button>
          <button class="btn small" onclick="openMachine('${esc(m.name)}')">в„№ и©іжғ…</button>
        </div>
      </div>`;
    }).join("") + `</div>`;
  } else {
    body = `<div class="card"><div class="table-scroll"><table class="t rack-ping-table">
      <thead><tr><th>U</th><th>Node</th><th>йЎһеһӢ</th><th>OS IP</th><th>BMC IP</th><th>зӢҖж…Ӣ</th><th>ж“ҚдҪң</th></tr></thead>
      <tbody>` + members.map(m => {
        const n = pinged.find(x => x.name === m.name);
        const up = n ? n.os_alive : null;
        const info = mgxInfo(m);
        const lamp = v => v === true ? `<span class="ping-lamp on">рҹҹў</span>` : v === false ? `<span class="ping-lamp off">рҹ”ҙ</span>` : `<span class="ping-lamp none">вЁӘ</span>`;
        return `<tr>
          <td class="mono">U${m.rack_u || "вҖ”"}</td>
          <td class="mono">${esc(m.name)}</td>
          <td>${info.icon} ${esc(info.label)}</td>
          <td class="mono">${esc(m.os_ip)}</td>
          <td class="mono">${esc(m.bmc_ip || "вҖ”")}</td>
          <td>${lamp(up)}</td>
          <td style="white-space:nowrap">
            <button class="btn small" onclick="singlePower('${esc(m.name)}',true)">вҸ» й–Ӣ</button>
            <button class="btn small btn-danger" onclick="singlePower('${esc(m.name)}',false)">вҸ» й—ң</button>
            <button class="btn small" onclick="rackMoveDialog('${esc(m.name)}')">вҮ…</button>
            <button class="btn small" onclick="openMachine('${esc(m.name)}')">в„№</button>
          </td>
        </tr>`;
      }).join("") + `</tbody></table></div></div>`;
  }
  return `
    <div class="dview-toolbar" style="display:flex;align-items:center;gap:10px;margin-top:18px">
      <span class="rack-hero-sub">ж©ҹж«ғе…ғд»¶пјҲ${members.length}пјү</span>
      ${switchBtns}
    </div>
    ${body}`;
}

/* ---------- ж©ҹж«ғжӢ“жЁё / йҖЈз·ҡең– ---------- */
let linksCache = [];          // [{a,b,type}]
async function loadLinks() {
  try { const d = await api("/api/links"); linksCache = d.links || []; }
  catch (e) { linksCache = []; }
  return linksCache;
}
const LINK_TYPE = { eth: "Ethernet", ib: "InfiniBand", power: "йӣ»жәҗ", coolant: "ж¶ІеҶ·" };
function linkCss(t) { return "lk-" + (t || "eth"); }
function rackTopoHtml(members) {
  // дҫқзӣ®еүҚе°ҲжЎҲзҜ©йҒёпјҡе…©з«ҜйғҪеңЁжң¬е°ҲжЎҲпјҲжҲ–иҮіе°‘дёҖз«ҜеңЁжң¬е°ҲжЎҲпјүзҡ„йҖЈз·ҡ
  const names = new Set(members.map(m => m.name));
  const rel = linksCache.filter(lk => names.has(lk.a) || names.has(lk.b));
  const involvedNm = new Set();
  rel.forEach(lk => { if (names.has(lk.a)) involvedNm.add(lk.a); if (names.has(lk.b)) involvedNm.add(lk.b); });
  const nodeHtml = [];
  members.forEach(m => {
    const deg = rel.filter(lk => lk.a === m.name || lk.b === m.name).length;
    if (deg === 0 && involvedNm.size) return;   // жңүйҖЈз·ҡжҷӮеҸӘз•«жңүиў«йҖЈз·ҡзҡ„зҜҖй»һ
    const info = mgxInfo(m);
    nodeHtml.push(`<div class="topo-node ${info.cls}" title="${esc(m.name)}">
      <span class="topo-ico">${info.icon}</span><span class="topo-name">${esc(m.name)}</span>
      <span class="topo-deg">${deg} йҖЈз·ҡ</span></div>`);
  });
  if (!rel.length) {
    return `<div class="card" style="margin-top:14px">
      <div class="card-title">рҹ”Җ ж©ҹж«ғжӢ“жЁё / йҖЈз·ҡең–</div>
      <div class="empty">жӯӨе°ҲжЎҲзӣ®еүҚжІ’жңүйҖЈз·ҡиіҮж–ҷгҖӮй»һгҖҢвһ• ж–°еўһйҖЈз·ҡгҖҚжҠҠ nodeвҶ”switch/PDU/CDU жҺҘиө·дҫҶгҖӮ<br>
      е»әиӯ°е…ҲеҲҮжҸӣеҲ°гҖҢв–° жё…е–®гҖҚжҲ–дҪҝз”ЁгҖҢв–Ұ еҚЎзүҮгҖҚзўәиӘҚиҰҒйҖЈз·ҡзҡ„е…ғд»¶еҗҚзЁұгҖӮ</div>
    </div>`;
  }
  const linkList = rel.map(lk => {
    const t = LINK_TYPE[lk.type] || lk.type;
    return `<div class="topo-link ${linkCss(lk.type)}">
      <span>${esc(lk.a)}</span><span class="topo-link-line">вҖ”${esc(t)}вҖ”</span><span>${esc(lk.b)}</span>
      <button class="btn small" onclick="deleteLink('${esc(lk.a)}','${esc(lk.b)}')">вң•</button>
    </div>`;
  }).join("");
  return `<div class="card" style="margin-top:14px">
    <div class="card-title">рҹ”Җ ж©ҹж«ғжӢ“жЁё / йҖЈз·ҡең– <span class="hint">пјҲ${rel.length} жўқйҖЈз·ҡпјү</span></div>
    <div class="topo-box">
      <div class="topo-nodes">${nodeHtml.join("")}</div>
      <div class="topo-legends">
        ${Object.entries(LINK_TYPE).map(([k,v]) => `<span class="topo-legend ${linkCss(k)}">вҖ”${esc(v)}вҖ”</span>`).join("")}
      </div>
    </div>
    <div class="topo-links">${linkList}</div>
  </div>`;
}
function linkAddDialog() {
  const proj = rackView.project;
  const members = machines.filter(x => x.project === proj && x.level === "rack");
  const opts = members.map(m => `<option value="${esc(m.name)}">${esc(m.name)} (${esc(mgxInfo(m).label)})</option>`).join("");
  if (!members.length) { alert("жӯӨе°ҲжЎҲжІ’жңүж©ҹж«ғе…ғд»¶еҸҜйҖЈз·ҡ"); return; }
  showDialog("вһ• ж–°еўһйҖЈз·ҡ", `
    <div class="rm-modal-body">
      <p style="margin-bottom:12px;font-size:12px;color:var(--text-faint)">жҠҠе…©еҖӢж©ҹж«ғе…ғд»¶йҖЈиө·дҫҶпјҲnode вҶ” switch / PDU / CDUпјүгҖӮ</p>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">е…ғд»¶ A</label>
      <select class="input" id="lk-a" style="width:100%;padding:8px;margin-bottom:12px">${opts}</select>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin-bottom:6px">е…ғд»¶ B</label>
      <select class="input" id="lk-b" style="width:100%;padding:8px;margin-bottom:12px">${opts}</select>
      <label style="display:block;font-size:12px;color:var(--text-faint);margin:12px 0 6px">йҖЈз·ҡйЎһеһӢ</label>
      <select class="input" id="lk-type" style="width:100%;padding:8px">
        ${Object.entries(LINK_TYPE).map(([k,v]) => `<option value="${k}">${esc(v)}</option>`).join("")}
      </select>
    </div>`,
    [
      { txt: "еҸ–ж¶Ҳ", cls: "", fn: () => closeDialog() },
      { txt: "ж–°еўһйҖЈз·ҡ", cls: "primary", fn: () => {
        const a = $("lk-a").value, b = $("lk-b").value, t = $("lk-type").value;
        if (a === b) return alert("A иҲҮ B дёҚиғҪзӣёеҗҢ");
        api("/api/links", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ a, b, type: t }) })
          .then(d => { linksCache = d.links || linksCache; closeDialog(); setView("rack"); })
          .catch(e => alert("ж–°еўһеӨұж•—пјҡ" + e.message));
      } },
    ]);
}
async function deleteLink(a, b) {
  if (!confirm(`еҲӘйҷӨжӯӨйҖЈз·ҡпјҲ${a} вҖ” ${b}пјүпјҹ`)) return;
  try {
    const d = await api("/api/links", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ a, b }) });
    linksCache = d.links || linksCache;
    setView("rack");
  } catch (e) { alert("еҲӘйҷӨеӨұж•—пјҡ" + e.message); }
}


/* ---------- System managerй ҒпјҡL10/L11 еұӨзҙҡ + е°ҲжЎҲеҲҶзө„ ---------- */
const projectLevelFilter = { val: "all" };
function setProjectLevelFilter(v) {
  projectLevelFilter.val = v;
  document.querySelectorAll(".lvl-tab").forEach(b => b.classList.toggle("active", b.dataset.lvl === v));
  const holder = $("proj-sort-list");
  if (holder) { holder.outerHTML = renderProjectsList(); initProjectDrag(); }
}
// е°ҲжЎҲж”¶еҗҲзӢҖж…ӢпјҲд»Ҙе°ҲжЎҲеҗҚиЁҳйҢ„пјҢеӨ§йҮҸж©ҹеҸ°еҰӮ PROJ_K еҸҜзӣҙжҺҘж”¶иө·дҫҶпјү
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
    html += `<div class="card"><div class="empty">зӣ®еүҚйҖҷеҖӢеұӨзҙҡйӮ„жІ’жңүж©ҹеҸ°пјҢе…Ҳж–°еўһдёҖеҸ°гҖӮ</div></div>`;
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
        <div class="proj-card-head" draggable="true" title="жӢ–еӢ•д»ҘиӘҝж•ҙе°ҲжЎҲй ҶеәҸ">
          <div class="proj-card-grip">в ҝ</div>
          <div class="proj-card-info">
            <span class="proj-card-name">${esc(p.name)}</span>
            <span class="proj-card-count">${members.length} еҸ° ${f==="all" ? `(R${rackN}/S${sysN})` : f==="rack" ? "В· L11" : "В· L10"}</span>
            ${p.desc ? `<span class="proj-card-desc">${esc(p.desc)}</span>` : ""}
          </div>
          <span class="spacer"></span>
          <button class="btn small proj-collapse-btn" onclick="event.stopPropagation();toggleProject('${esc(p.name)}')" title="${collapsed ? "еұ•й–ӢжӯӨе°ҲжЎҲ" : "ж”¶еҗҲжӯӨе°ҲжЎҲпјҲйҡұи—Ҹж©ҹеҸ°жё…е–®пјү"}">${collapsed ? "в–ј еұ•й–Ӣ" : "в–І ж”¶еҗҲ"}</button>
        </div>
        ${!collapsed && members.length ? `<table class="t">
            <thead><tr><th></th><th>зі»зөұеҗҚзЁұ</th><th>еұӨзҙҡ</th><th>OS IP</th><th>BMC IP</th><th>OS зӢҖж…Ӣ</th><th>BMC зӢҖж…Ӣ</th><th>з§»еӢ•</th><th>ж“ҚдҪң</th></tr></thead>
            <tbody>${rows.join("")}</tbody></table>`
          : `${!collapsed ? `<div style="padding:10px 14px;color:var(--text-faint)">жӯӨе°ҲжЎҲеңЁжӯӨеұӨзҙҡе…§жІ’жңүж©ҹеҸ°</div>` : ""}`}
      </div>`;
  });
  if (un.length) {
    html += `
      <div class="proj-card card" data-pname="">
        <div class="proj-card-head">
          <div class="proj-card-grip" style="opacity:.35">в ҝ</div>
          <div class="proj-card-info"><span class="proj-card-name">жңӘеҲҶйЎһ</span><span class="proj-card-count">${un.length} еҸ°</span></div>
        </div>
        <table class="t"><thead><tr><th></th><th>зі»зөұеҗҚзЁұ</th><th>еұӨзҙҡ</th><th>OS IP</th><th>BMC IP</th><th>з§»еӢ•</th><th>ж“ҚдҪң</th></tr></thead>
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
      <span class="hint">е°ҲжЎҲеҲҶзө„ В· жӢ–жӣіеҚЎзүҮиӘҝж•ҙй ҶеәҸ</span>
      <div class="lvl-tabs">
        <button class="btn small lvl-tab ${projectLevelFilter.val==="all"?"active":""}" data-lvl="all" onclick="setProjectLevelFilter('all')">е…ЁйғЁ ${machines.length}</button>
        <button class="btn small lvl-tab ${projectLevelFilter.val==="system"?"active":""}" data-lvl="system" onclick="setProjectLevelFilter('system')">рҹ–ҳ L10 зі»зөұ ${nSys}</button>
        <button class="btn small lvl-tab ${projectLevelFilter.val==="rack"?"active":""}" data-lvl="rack" onclick="setProjectLevelFilter('rack')">рҹ—„ L11 ж•ҙж«ғ ${nRack}</button>
      </div>
      <span class="spacer"></span>
      <button class="btn small" onclick="collapseAllProjects(true)" title="жҠҠеҗ„е°ҲжЎҲзҡ„ж©ҹеҸ°жё…е–®е…ЁйғЁж”¶еҗҲпјҲйҒ©еҗҲеӨ§йҮҸж©ҹеҸ°пјү">в–І е…ЁйғЁж”¶еҗҲ</button>
      <button class="btn small" onclick="collapseAllProjects(false)">в–ј е…ЁйғЁеұ•й–Ӣ</button>
      <button class="btn" onclick="openProjectModal()">рҹ“Ғ з®ЎзҗҶе°ҲжЎҲ</button>
      <button class="btn" onclick="refreshStatus()" id="refresh-btn">вҹі йҮҚж–°жҺғжҸҸ</button>
      <button class="btn primary" onclick="openAdd()">пјӢ ж–°еўһзі»зөұ</button>
    </div>
    ${renderProjectsList()}
  `;
}
function machineRowSortable(m, pi, mi, total) {
  const targetOpts = projects.filter(p => p.name !== m.project).map(p =>
    `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("");
  const lvlBadge = m.level === "rack"
    ? `<span class="badge badge-rack">L11 В· Rack</span>`
    : `<span class="badge badge-system">L10 В· Sys</span>`;
  return `
    <tr>
      <td style="white-space:nowrap">
        <button class="btn small" onclick="moveMachine('${esc(m.name)}',-1)" ${mi===0?"disabled":""} title="е«Җз·ҡ">в–І</button>
        <button class="btn small" onclick="moveMachine('${esc(m.name)}',1)" ${mi===total-1?"disabled":""} title="дёӢз§»">в–ј</button>
      </td>
      <td class="mono"><a href="#" class="mach-link" onclick="event.preventDefault();openMachine('${esc(m.name)}')"><b>${esc(m.name)}</b></a></td>
      <td>${lvlBadge}</td>
      <td class="mono">${esc(m.os_ip)}${m.os_user ? `<span style="color:var(--text-faint)"> (${esc(m.os_user)})</span>` : ""}</td>
      <td class="mono">${esc(m.bmc_ip || "вҖ”")}</td>
      <td>${statusBadge(m.os_alive)}</td>
      <td>${m.bmc_ip ? statusBadge(m.bmc_alive) : `<span style="color:var(--text-faint)">вҖ”</span>`}</td>
      <td>
        <select class="input move-sel" onchange="moveMachineTo('${esc(m.name)}', this.value)">
          <option value="">з§»иҮівҖҰ</option>
          ${targetOpts}
          ${m.project ? `<option value="">пјҲз§»й·Өе°ҲжЎҲпјү</option>` : ""}
        </select>
      </td>
      <td style="white-space:nowrap">
        <button class="btn small" onclick="openTerm('${esc(m.name)}')">в–¶ Terminal</button>
        <button class="btn small" onclick="deleteMachine('${esc(m.name)}')">еҲӘйҷӨ</button>
      </td>
    </tr>`;
}
function machineRowUnassigned(m) {
  const opts = projects.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("");
  const lvlBadge = m.level === "rack"
    ? `<span class="badge badge-rack">L11 В· Rack</span>`
    : `<span class="badge badge-system">L10 В· Sys</span>`;
  return `
    <tr>
      <td></td>
      <td class="mono"><a href="#" class="mach-link" onclick="event.preventDefault();openMachine('${esc(m.name)}')"><b>${esc(m.name)}</b></a></td>
      <td>${lvlBadge}</td>
      <td class="mono">${esc(m.os_ip)}</td>
      <td class="mono">${esc(m.bmc_ip || "вҖ”")}</td>
      <td>
        <select class="input move-sel" onchange="moveMachineTo('${esc(m.name)}', this.value)">
          <option value="">з§»иҮівҖҰ</option>
          ${opts}
        </select>
      </td>
      <td style="white-space:nowrap">
        <button class="btn small" onclick="openTerm('${esc(m.name)}')">в–¶ Terminal</button>
        <button class="btn small" onclick="deleteMachine('${esc(m.name)}')">еҲӘйҷӨ</button>
      </td>
    </tr>`;
}
/* ---------- з§»еӢ•пјҡе°ҲжЎҲжӢ–жӣіжҺ’еәҸ / ж©ҹеҸ°жҺ’еәҸ / ж©ҹеҸ°жҗ¬з§» ---------- */
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

// ж©ҹеҷЁи©іжғ…й ҒеҺ»жҠ–пјҡеӨҡеҖӢйқһеҗҢжӯҘијүе…ҘпјҲж„ҹжё¬еҷЁ poll / detail / refreshпјүе®ҢжҲҗжҷӮеҗ„иҮӘиҰҒжұӮйҮҚз№ӘпјҢ
// иӢҘжҜҸж¬ЎйғҪж•ҙй ҒйҮҚз№ӘжңғйҖ жҲҗ chart еҸҚиҰҶйҮҚе»ә + telemetry йҮҚжҠ“ вҶ’ зӢӮи·іеҚЎжӯ»гҖӮ
// е·ІеңЁ machine view жҷӮзҡ„йҮҚиӨҮи«ӢжұӮпјҢж–јдёҖзҹӯжҡ«иҰ–зӘ—е…§еҗҲдҪөзӮәдёҖж¬ЎгҖӮеҫһе…¶д»– view еҲҮе…ҘеүҮз«ӢеҚіжёІжҹ“гҖӮ
let _machineRenderTimer = null;
function setView(view) {
  if (view === "machine" && state.view === "machine") {
    if (_machineRenderTimer) clearTimeout(_machineRenderTimer);
    _machineRenderTimer = setTimeout(() => { _renderMachine(state.view); }, 250);
    state.view = view;
    syncHash();
    return;
  }
  // еҲҮеҲ°е…¶д»– viewпјҡеҸ–ж¶ҲеҸҜиғҪе°ҡжңӘеҹ·иЎҢзҡ„ machine еҺ»жҠ–йҮҚз№Ә
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

/* ---- URL еҲҶй Ғи·Ҝз”ұпјҲhashпјүпјҡйҮҚж–°ж•ҙзҗҶдёҚеӣһйҰ–й Ғ ---- */
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

/* ============ System TelemetryпјҲCPU/DIMM/SSD/NIC/GPUпјү ============ */
let telCharts = {};
const TEL_PALETTE = ["#2563eb", "#22c55e", "#e5484d", "#7c5cff", "#e0a800", "#14b8a6", "#f97316", "#ec4899", "#0ea5e9", "#84cc16"];
let telMinutes = 60;

function telT(ts) {
  const d = new Date(ts * 1000);
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function telWindowLabel(min) {
  if (min >= 1440) { const d = min / 1440; return d >= 1 && Number.isInteger(d) ? `${d} еӨ©` : `${d} еӨ©`; }
  if (min >= 60) { const h = min / 60; return `${h} е°ҸжҷӮ`; }
  return `${min} еҲҶйҗҳ`;
}
function telToggleAllBtn(anyOpen) {
  const b = $("tel-collapse-all");
  if (b) b.textContent = anyOpen ? "в–І е…ЁйғЁж”¶еҗҲ" : "в–ј е…ЁйғЁеұ•й–Ӣ";
}
function syncTelBlocks() {
  document.querySelectorAll("#tel-grid .tel-block").forEach(blk => {
    const open = blk.dataset.open === "1";
    const arrow = blk.querySelector(".tel-arrow");
    if (arrow) arrow.textContent = open ? "в–ј" : "в–¶";
    const body = blk.querySelector(".tel-block-body");
    if (body) body.style.display = open ? "" : "none";
  });
  const anyOpen = [...document.querySelectorAll("#tel-grid .tel-block")].some(b => b.dataset.open === "1");
  telToggleAllBtn(anyOpen);
}
function toggleTel(key) {
  const blk = document.querySelector(`#tel-grid .tel-block[data-key="${key}"]`) ||
              document.querySelector(`#tel-grid .tel-block`);
  // жүҫдёҚеҲ° data-key жҷӮз”Ё canvas id еҸҚжҹҘ
  let target = blk;
  if (key) {
    const cv = document.getElementById(`tel-${key}`);
    target = cv ? cv.closest(".tel-block") : blk;
  }
  if (!target) return;
  target.dataset.open = target.dataset.open === "1" ? "0" : "1";
  syncTelBlocks();
  // еұ•й–ӢеҫҢйҮҚз№ӘпјҲcanvas еҺҹе…Ҳйҡұи—ҸеҸҜиғҪжІ’з•«е…Ёпјү
  loadTelemetry();
}
function toggleTelAll() {
  const anyOpen = [...document.querySelectorAll("#tel-grid .tel-block")].some(b => b.dataset.open === "1");
  document.querySelectorAll("#tel-grid .tel-block").forEach(b => b.dataset.open = anyOpen ? "0" : "1");
  syncTelBlocks();
  loadTelemetry();
}
function initTelemetry() {
  if (!document.getElementById("tel-cpu")) return;  // йқһ machine й Ғ
  // жё…йҷӨиҲҠ chartпјҲйҒҝе…ҚйҮҚе»әжҷӮйҮҚиӨҮпјү
  Object.keys(telCharts).forEach(k => { try { telCharts[k].destroy(); } catch(e){} });
  telCharts = {};
  const sel = $("tel-select");
  if (sel) {
    sel.value = String(telMinutes);
    sel.onchange = () => { telMinutes = +sel.value; loadTelemetry(); };
  }
  // зөҰжҜҸеҖӢ block иЈң data-keyпјҲз”ұ canvas id жҺЁеҫ—пјү
  document.querySelectorAll("#tel-grid .tel-block").forEach(blk => {
    const cv = blk.querySelector("canvas");
    if (cv && !blk.dataset.key) {
      const id = cv.id.replace("tel-", "");
      const map = { "tel-cpu": "cpu", "tel-mem": "mem", "tel-disk": "disk", "tel-net": "net", "tel-gpu": "gpu" };
      for (const [cid, key] of Object.entries(map)) if (blk.querySelector(cid)) { blk.dataset.key = key; break; }
    }
  });
  syncTelBlocks();
  // иӢҘе…Ёж”¶еҗҲеүҮеұ•й–Ӣ CPUпјҲзўәдҝқиҮіе°‘жңүең–пјү
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
// Telemetry з°Ўзҹӯ AI еҲҶжһҗпјҡжҠ“е–®ж©ҹи©ІзҜ„еңҚи¶ЁеӢў вҶ’ Ollama еӣһдёҖе°Ҹж®өж–Үеӯ— вҶ’ еЎ«е…Ҙ #tel-ai
// еҗҢдёҖж©ҹеҸ°+зҜ„еңҚйҮҚиӨҮијүе…ҘзӣҙжҺҘз”Ёеҝ«еҸ–пјҢйҒҝе…ҚжҜҸж¬ЎйҮҚж•ҙйғҪжү“ OllamaпјҲијғж…ўпјүгҖӮ
const aiTelCache = {};
async function telAnalyze(name, minutes) {
  const box = $("tel-ai");
  if (!box) return;
  const key = `${name}|${minutes}`;
  if (aiTelCache[key] && box.dataset.k === key) {
    box.innerHTML = aiTelCache[key]; return;
  }
  box.innerHTML = "вңЁ жӯЈеңЁеҲҶжһҗжӯӨзҜ„еңҚзҡ„зӣЈжҺ§и¶ЁеӢўвҖҰ";
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
  telAnalyze(name, telMinutes);   // иғҢжҷҜи§ёзҷјз°Ўзҹӯ AI еҲҶжһҗпјҲдёҚйҳ»еЎһ telemetry з№Әең–пјү
  let d;
  try {
    d = await api(`/api/machine/${encodeURIComponent(name)}/telemetry?minutes=${telMinutes}`);
  } catch (e) { return; }
  const os = d.os || {}, gpu = d.gpu || {};
  const oarr = os.os || [];
  const oLabels = oarr.map(r => telT(r.ts));

  // CPUпјҡдҪҝз”ЁзҺҮ %
  let ch = telChart("tel-cpu", "%");
  telSet(ch, oLabels, [{ key: "cpu", data: oarr.map(r => r.cpu_used) }], { cpu: { label: "CPU дҪҝз”ЁзҺҮ", color: "#2563eb" } });

  // CPU LoadпјҲ1/5/15 minпјү
  ch = telChart("tel-load", "load");
  telSet(ch, oLabels, [
    { key: "l1", data: oarr.map(r => r.load1) },
    { key: "l5", data: oarr.map(r => r.load5) },
    { key: "l15", data: oarr.map(r => r.load15) },
  ], { l1: { label: "Load 1m", color: "#2563eb" }, l5: { label: "Load 5m", color: "#7c5cff" }, l15: { label: "Load 15m", color: "#84cc16" } });

  // DIMMпјҡиЁҳжҶ¶й«”дҪҝз”ЁзҺҮ %пјҲеҫҢз«Ҝ mem_used_pctпјҢзјәеҖјжҷӮз”ұ used/total жҺЁз®—пјү
  ch = telChart("tel-mem", "%");
  telSet(ch, oLabels, [{ key: "usedpct", data: oarr.map(r => r.mem_used_pct != null ? r.mem_used_pct : (r.mem_total_gb ? r.mem_used_gb / r.mem_total_gb * 100 : null)) }], { usedpct: { label: "иЁҳжҶ¶й«”дҪҝз”ЁзҺҮ", color: "#e5484d" } });

  // DIMMпјҡе·Із”Ё + зёҪйҮҸ GB
  ch = telChart("tel-memgb", "GB");
  telSet(ch, oLabels, [
    { key: "used", data: oarr.map(r => r.mem_used_gb) },
    { key: "total", data: oarr.map(r => r.mem_total_gb) },
  ], { used: { label: "е·Із”Ё", color: "#e5484d" }, total: { label: "зёҪйҮҸ", color: "#94a3b8" } });

  // DIMMпјҡеҸҜз”Ё
  ch = telChart("tel-swap", "GB");
  telSet(ch, oLabels, [{ key: "avail", data: oarr.map(r => r.mem_avail_gb) }], { avail: { label: "еҸҜз”ЁиЁҳжҶ¶й«”", color: "#22c55e" } });

  // SSDпјҡеҗ„жҺӣијүй»һ %
  ch = telChart("tel-disk", "%");
  const mounts = os.disk || [];
  const dLabels = mounts[0] ? mounts[0].ts.map(telT) : [];
  const dDefs = {}; mounts.forEach((m,i) => dDefs[m.mount] = { label: m.mount, color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(ch, dLabels, mounts.map((m,i) => ({ key: m.mount, data: m.pct })), dDefs);

  // SSDпјҡе·Із”ЁйҮҸ GB
  ch = telChart("tel-diskused", "GB");
  const dUsedDefs = {}; mounts.forEach((m,i) => dUsedDefs[m.mount] = { label: m.mount, color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(ch, dLabels, mounts.map((m,i) => ({ key: m.mount, data: m.used_gb })), dUsedDefs);

  // NICпјҲз¶Іи·Ҝеҗһеҗҗ MB/sпјү
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
    const tag = n.iface.length>14 ? n.iface.slice(0,13)+"вҖҰ" : n.iface;
    nSeries.push({ key: `tx${i}`, data: tx }); nSeries.push({ key: `rx${i}`, data: rx });
    nDefs[`tx${i}`] = { label: `${tag} TX`, color: col };
    nDefs[`rx${i}`] = { label: `${tag} RX`, color: col, dash: [4,4] };
  });
  telSet(ch, nLabels, nSeries, nDefs);

  // GPUпјҡеҲ©з”ЁзҺҮ %
  let gch = telChart("tel-gpu", "%");
  const gser = gpu.series || [];
  const gLabels = gser[0] ? gser[0].ts.map(telT) : [];
  const gName = s => (s.name && String(s.name).trim()) ? `${s.name} (GPU ${s.gpu})` : `GPU ${s.gpu}`;
  const gDefs = {}; gser.forEach((s,i) => gDefs[`g${s.gpu}`] = { label: gName(s), color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(gch, gLabels, gser.map(s => ({ key: `g${s.gpu}`, data: s.util })), gDefs);

  // GPUпјҡиЁҳжҶ¶й«”дҪҝз”Ё
  gch = telChart("tel-gpumem", "GB");
  const gmDefs = {}; gser.forEach((s,i) => gmDefs[`g${s.gpu}`] = { label: gName(s), color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(gch, gLabels, gser.map(s => ({ key: `g${s.gpu}`, data: s.mem_used })), gmDefs);

  // GPUпјҡжә«еәҰ
  gch = telChart("tel-gputemp", "В°C");
  const gtDefs = {}; gser.forEach((s,i) => gtDefs[`g${s.gpu}`] = { label: gName(s), color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(gch, gLabels, gser.map(s => ({ key: `g${s.gpu}`, data: s.temp })), gtDefs);

  // GPUпјҡеҠҹиҖ—
  gch = telChart("tel-gpupow", "W");
  const gpDefs = {}; gser.forEach((s,i) => gpDefs[`g${s.gpu}`] = { label: gName(s), color: TEL_PALETTE[i%TEL_PALETTE.length] });
  telSet(gch, gLabels, gser.map(s => ({ key: `g${s.gpu}`, data: s.power })), gpDefs);
}
/* ---------- е–®ж©ҹи©іжғ…й Ғ ---------- */
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
  delete machineDetailCache[name];     // еј·еҲ¶йҮҚжҠ“и©іжғ… + OS/HWпјҲrefresh=1пјү
  await machineLoadDetail(name, true);
  delete machineSensorsCache[name];    // еј·еҲ¶йҮҚжҠ“ж„ҹжё¬еҷЁпјҲrefresh=1пјү
  if (_activeMachine === name) await machineLoadSensors(name, true);
  if (_activeMachine === name) setView("machine");
}
const machineSensorsCache = {};
// ж„ҹжё¬еҷЁжҳҜиғҢжҷҜжҠ“еҸ–зҡ„пјҲOpenBMC sdr list зҙ„ 20 з§’пјүгҖӮ
// еҸӘжӣҙж–° #sensor-body еҚҖеЎҠпјҢзө•дёҚж•ҙй ҒйҮҚз№ӘпјҲйҒҝе…ҚжҜҸж¬ЎйғҪйҮҚз•« telemetry йҖ жҲҗзӢӮи·і/еҚЎжӯ»пјүгҖӮ
// з„Ўеҝ«еҸ–жҷӮжҜҸ 3 з§’жҹҘдёҖж¬ЎпјӣжңүиҲҠеҖјпјҲrefreshingпјүжҷӮж”№жҜҸ 12 з§’з·©жҹҘпјҢжёӣе°‘й–ӢйҠ·гҖӮ
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
    if (_activeMachine !== name) return;         // е·ІеҲҮиө°пјҢеҒңжӯў
    const st = d && d.sensors;
    // еҸӘжӣҙж–°ж„ҹжё¬еҷЁеҚЎзүҮжң¬й«”пјҢдёҚеӢ•ж•ҙеҖӢй ҒйқўпјҲsensor-body еҸӘеӯҳеңЁж–ј bmc_alive зҡ„и©іжғ…й Ғпјү
    const body = $("sensor-body");
    if (body) body.innerHTML = machineSensorsHtml(d, { bmc_alive: true }, name);
    // ж„ҹжё¬еҷЁжңүиіҮж–ҷпјҲеҗ«иғҢжҷҜеҲ·ж–°дёӯпјүеҚіиҮӘеӢ•и§ёзҷјдёҖж¬Ў Sensor AI иЁәж–·
    if (d && !d.error && d.sensors && (d.sensors.total || d.sensors.ok)) sensorAnalyze(name);
    if (d.error) return;                         // еҮәйҢҜе°ұеҒңпјҲдёҚеҶҚијӘи©ўпјү
    if (d.loading) {
      // refreshingпјҲеӣһиҲҠеҖјпјүжҲ–е°ҡз„ЎиіҮж–ҷ вҶ’ жҺ’дёӢдёҖијӘпјӣз„ЎиіҮж–ҷжҷӮжӣҙеҝ«
      setTimeout(poll, (st && (st.total || st.ok)) ? 12000 : 3000);
    }
  };
  poll();
}
function machineSensorsHtml(d, base, name) {
  if (!base.bmc_alive) return `<div class="empty">BMC зӣ®еүҚдёҚеҸҜйҖЈ</div>`;
  if (d && d.error) return `<div class="empty">${esc(d.error)}</div>`;
  const s = (d && d.sensors) || {};
  // е®Ңе…ЁжІ’жңүиіҮж–ҷжҷӮжүҚйЎҜзӨәгҖҢжҠ“еҸ–дёӯгҖҚпјӣжңүиҲҠеҝ«еҸ–пјҲrefreshingпјүжҷӮз…§еёёйЎҜзӨәиіҮж–ҷдёҰеңЁиғҢжҷҜжӣҙж–°
  if (!d || (d.loading && !Object.keys(s).length)) {
    return `<div class="empty">рҹ”Қ ж„ҹжё¬еҷЁжҠ“еҸ–дёӯпјҲsdr list ијғж…ўпјҢзҙ„ 20 з§’пјүвҖҰ</div>`;
  }
  const critRow = (s.critical_entries || []).map(l => `<li>рҹ”ҙ ${esc(l)}</li>`).join("");
  const warnRow = (s.warning_entries || []).map(l => `<li>рҹҹ  ${esc(l)}</li>`).join("");
  // е®Ңж•ҙ SDRпјҡж”ҫеӣәе®ҡй«ҳеәҰжЎҶе…§еҸҜеҫҖдёӢжӢүпјҢйҒҝе…Қз¶Ій ҒйҒҺй•·
  const allRows = (s.entries || []).map(l => `<tr><td class="mono">${esc(l)}</td></tr>`).join("");
  const sdrBox = s.entries && s.entries.length
    ? `<div class="sdr-scroll">
        <table class="t sdr-table"><tbody>${allRows}</tbody></table>
      </div>
      <span class="hint">е…ұ ${s.entries.length} зӯҶж„ҹжё¬еҷЁпјҲеҸҜжҚІеӢ•пјү</span>`
    : "";
  return `
    <div class="sensor-kpis">
      <div class="sensor-kpi ${s.critical>0?'bad':''}"><b>${s.critical||0}</b><span>Critical</span></div>
      <div class="sensor-kpi ${s.warning>0?'warn':''}"><b>${s.warning||0}</b><span>Warning</span></div>
      <div class="sensor-kpi"><b>${s.ok||0}</b><span>OK</span></div>
    </div>
    <ul class="alerts" style="margin-top:10px">
      ${critRow || warnRow || `<li class="no-alert">вң” з„Ўз•°еёёж„ҹжё¬еҷЁ</li>`}
    </ul>
    <div class="tel-ai sensor-ai" id="sensor-ai">рҹӨ– жӯЈеңЁеҲҶжһҗж„ҹжё¬еҷЁзӢҖжіҒвҖҰ</div>
    ${d.refreshing ? `<span class="hint">пјҲеҝ«еҸ–е·ІйҒҺжңҹпјҢиғҢжҷҜйҮҚж–°жҠ“еҸ–дёӯвҖҰпјү</span>` : ""}
    ${sdrBox}`;
}
// Sensor AI иЁәж–·пјҲжҜ”з…§ Telemetry AIпјүпјҡж„ҹжё¬еҷЁе°ұз·’еҫҢиҮӘеӢ•еҲҶжһҗдёҖж¬ЎпјҢзөҗжһңеҝ«еҸ–пјҢйҮҚз№ӘеҸҜйӮ„еҺҹгҖӮ
const sensorAiDone = new Set();
const sensorAiResult = {};
async function sensorAnalyze(name) {
  const box = $("#sensor-ai");
  if (!name || !box) return;
  if (sensorAiDone.has(name)) {
    if (sensorAiResult[name] != null) box.innerHTML = sensorAiResult[name];
    return;
  }
  box.innerHTML = "рҹӨ– жӯЈеңЁеҲҶжһҗж„ҹжё¬еҷЁзӢҖжіҒвҖҰ";
  let d;
  try {
    d = await api(`/api/machine/${encodeURIComponent(name)}/sensors/analyze`);
  } catch (e) {
    box.innerHTML = "вҡҷпёҸ  Sensor AI з„Ўжі•йҖЈз·ҡ"; return;
  }
  if (d && d.ok !== undefined && !d.ok) { box.innerHTML = `вҡҷпёҸ  ${esc(d.error || "ж„ҹжё¬еҷЁжңӘе°ұз·’")}`; return; }
  if (!d || d.error) { box.innerHTML = "вҡҷпёҸ  Sensor AI е°ҡз„ЎиіҮж–ҷ"; return; }
  sensorAiDone.add(name);
  sensorAiResult[name] = `рҹӨ– ${esc(d.analysis || d.summary || "")}`;
  const cur = $("#sensor-ai");
  if (cur) cur.innerHTML = sensorAiResult[name];
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

/* ---- е–®ж©ҹи©іжғ…й Ғ ---- */

/* зЎ¬й«”иіҮиЁҠпјҲCPU/DIMM/SSD/NIC/GPUпјүе°ҲжҘӯиЎЁж јејҸеҚЎзүҮе‘ҲзҸҫпјҲз„Ў emojiпјү */
function hwItem(label, lines) {
  const rows = lines.filter(x=>x).map(l => `<div class="hw-line">${l}</div>`).join("");
  return `<div class="hw-item"><div class="hw-label">${label}</div><div class="hw-body"><div class="hw-lines">${rows}</div></div></div>`;
}
function hwHtml(oi) {
  const hw = (oi && oi.hw) || null;
  if (!hw) {
    if (oi && oi.raw) return `<pre class="mach-pre mono">${esc(oi.raw)}</pre>`;
    return `<div class="empty">е°ҡжңӘжҠ“еҸ–зЎ¬й«”еһӢиҷҹпјҲйңҖ root + dmidecode/lspciпјү</div>`;
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
      cpu.sockets ? `${cpu.sockets} Г— ${cpu.cores||"?"} ж ё` : "",
      totalCores ? `е…ұ ${totalCores} ж ё` : "",
      threads ? `жҜҸж ё ${threads} еҹ·иЎҢз·’` : "",
      totalThreads ? `е…ұ ${totalThreads} еҹ·иЎҢз·’` : "",
    ].filter(Boolean).join("гҖҖ") || "";
    out += hwItem("CPU", [
      `<div class="cpu-model"><b>${esc(cpu.model || "вҖ”")}</b></div>`,
      specs ? `<div class="cpu-spec">${esc(specs)}</div>` : "",
    ]);
  }
  const d = hw.dimm;
  if (d) {
    const size = `${d.count||""} жўқиЁҳжҶ¶й«”`;
    const parts = (d.parts||[]).map(p=>`<span class="hw-part">${esc(p)}</span>`).join("");
    out += hwItem("DIMM", [
      `<b>${size}</b> <span class="mono">${(d.types||[]).join(" В· ")} ${(d.speeds||[]).join(" В· ")}</span>`,
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
    // GPU еӨҡйЎҶжҷӮз”Ёе…©ж¬„з¶Іж јпјҢжёӣе°‘еһӮзӣҙз©әй–“
    const rows = gpu.map(g => `<div class="gpu-cell"><span class="gpu-name">${esc(g.name)}</span> <span class="gpu-mem">${esc(g.mem)}</span> <span class="gpu-util">${esc(g.util)}</span></div>`).join("");
    out += `<div class="hw-item"><div class="hw-label">GPU</div><div class="hw-body"><div class="gpu-grid">${rows}</div></div></div>`;
  }
  const nic = hw.nic;
  if (nic && nic.length) {
    // и§Јжһҗ lspci з¶ІеҚЎиЎҢ вҶ’ {type,model,count,buses}пјӣеҗҢеһӢиҷҹеҗҲдҪөиЁҲж•ёпјҢз”ЁеӨҡж¬„еҚЎзүҮзІҫз°Ўе‘ҲзҸҫ
    function tidyModel(raw) {
      let m = String(raw).replace(/\s*\(rev \d+\)\s*$/i, "").trim();
      // йҖЈзәҢз§»йҷӨзөҗе°ҫзҡ„ Controller / Integrated / Network зӯүдҝ®йЈҫи©һпјҲжңғз–ҠеҠ еҮәзҸҫпјү
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
          ${g.count > 1 ? `<span class="nic-n">Г—${g.count}</span>` : ""}
        </div>
        <div class="nic-bus mono">${esc(g.buses.join(", "))}</div>
      </div>`).join("");
    out += `<div class="hw-item"><div class="hw-label">NIC <span class="hw-sub">${(nic||[]).length} еҹ </span></div><div class="hw-body"><div class="nic-list">${cells}</div></div></div>`;
  }
  out += `</div>`;
  // OS ж‘ҳиҰҒпјҲdistro/uptime/cpu/memпјүеңЁжңҖдёҠйқў
  const os = (oi && oi.os) || null;
  if (os && (os.distro || os.uptime)) {
    const osStats = [
      os.distro ? `<b>${esc(os.distro)}</b>` : "",
      os.uptime ? `е·Ій–Ӣж©ҹ ${esc(os.uptime)}` : "",
      os.cpu ? `CPU ${esc(os.cpu)} еҹ·иЎҢз·’` : "",
      os.mem ? esc(os.mem) : "",
    ].filter(v => v).map(v => `<span class="os-stat">${v}</span>`).join("");
    out = `<div class="os-summary">${osStats}</div>` + out;
  }
  if (oi && oi.raw) {
    out += `<details class="hw-raw"><summary>еҺҹе§ӢијёеҮә (raw)</summary><pre class="mach-pre mono">${esc(oi.raw)}</pre></details>`;
  }
  return out;
}

function pageMachine() {
  const name = _activeMachine;
  const m = machines.find(x => x.name === name);
  if (!m) return `<div class="card"><div class="empty">жүҫдёҚеҲ°ж©ҹеҸ°</div></div>`;
  const d = machineDetailCache[name];
  if (!d) {
    machineLoadDetail(name);
    return `
      <div class="mach-toolbar">
        <button class="btn small" onclick="machineBack()">вҶҗ иҝ”еӣһ</button>
        <span class="mach-name">рҹ–Ҙ ${esc(name)}</span>
        <span class="spacer"></span>
      <span class="hint">е°ҲжЎҲеҲҶзө„ В· жӢ–жӣіеҚЎзүҮиӘҝж•ҙй ҶеәҸ</span>
      </div>
      <div class="card"><div class="empty">жӯЈеңЁжҠ“еҸ–ж©ҹеҸ°иіҮиЁҠпјҲй–Ӣж©ҹиіҮиЁҠйңҖиҰҒ SSH, BMC з”Ё ipmitoolпјүвҖҰ</div></div>`;
  }
  if (d.error) {
    return `
      <div class="mach-toolbar">
        <button class="btn small" onclick="machineBack()">вҶҗ иҝ”еӣһ</button>
        <span class="mach-name">рҹ–Ҙ ${esc(name)}</span>
        <span class="spacer"></span>
        <button class="btn small" onclick="machineRefresh()">вҹі йҮҚи©Ұ</button>
      </div>
      <div class="card"><div class="empty">ијүе…ҘеӨұж•—пјҡ${esc(d.error)}</div></div>`;
  }
  const base = d.machine || {};
  const lvlBadge = base.level === "rack"
    ? `<span class="badge badge-rack">L11 В· Rack</span>` : `<span class="badge badge-system">L10 В· Sys</span>`;
  const osState = base.os_alive ? statusBadge(true) : statusBadge(false);
  const bmcState = base.bmc_ip ? (base.bmc_alive ? statusBadge(true) : statusBadge(false)) : `<span style="color:var(--text-faint)">з„Ў</span>`;
  // OS зі»зөұиіҮиЁҠпјҲеҸҜиғҪзӮәеҝ«еҸ–жӯ·еҸІеҖјпјү
  // OS зі»зөұиіҮиЁҠпјҲзЎ¬й«”еһӢиҷҹеҚЎзүҮпјү
  let osInfoHtml = hwHtml(d.os_info || {});
  if (d.os_info && d.os_info.fetched_at) osInfoHtml += `<span class="hint">жҠ“еҸ–жҷӮй–“пјҡ${esc(d.os_info.fetched_at)}</span>`;
  // BMC FW + йӣ»жәҗ + ж„ҹжё¬
  let fwHtml = `<div class="empty">BMC зӣ®еүҚдёҚеҸҜйҖЈпјҢз„ЎеҫһжҠ“еҸ–</div>`;
  if (base.bmc_alive) {
    const fwRows = (d.fw || []).map(f => `<tr><td class="mono">${esc(f.key)}</td><td class="mono">${esc(f.value)}</td></tr>`).join("");
    fwHtml = fwRows ? `<table class="t fw-table"><tbody>${fwRows}</tbody></table>`
                    : d.bmc_loading ? `<div class="empty">BMC йҖЈз·ҡжҠ“еҸ–дёӯпјҲCisco CIMC ијғж…ўзҙ„ 15вҖ“30 з§’пјүвҖҰ<br><span class="mono" style="font-size:11px">зЁҚеҫҢиҮӘеӢ•жӣҙж–°</span></div>`
                    : `<div class="empty">з„Ў FW иіҮж–ҷ</div>`;
  }
  // BIOS / Device FirmwareпјҲdmidecode + smartctl + ethtool + nvidia-smiпјҢи·Ё vendor е®№йҢҜпјү
  const hwFw = (d.os_info && d.os_info.hw && d.os_info.hw.firmware) || null;
  if (hwFw) {
    let fwRows = "";
    if (hwFw.bios) {
      const parts = [hwFw.bios.vendor, hwFw.bios.version, hwFw.bios.release].filter(Boolean).join(" В· ");
      fwRows += `<tr><td class="mono bfw-tag">BIOS</td><td class="mono">${esc(parts)}</td></tr>`;
    }
    (hwFw.ssd || []).forEach(s => fwRows += `<tr><td class="mono bfw-tag">SSD ${esc(s.dev)}</td><td class="mono">${esc(s.fw)}</td></tr>`);
    (hwFw.nic || []).forEach(n => fwRows += `<tr><td class="mono bfw-tag">NIC ${esc(n.iface)}</td><td class="mono">${esc(n.fw)}</td></tr>`);
    (hwFw.gpu || []).forEach(g => fwRows += `<tr><td class="mono bfw-tag">GPU ${esc(g.index)}</td><td class="mono">${esc(g.fw) || "вҖ”"}</td></tr>`);
    if (fwRows) {
      fwHtml += `
      <details class="bfw-wrap">
        <summary class="bfw-title">пјӢ BIOS / иЈқзҪ®йҹҢй«” (OS) <span class="bfw-count">${(fwRows.match(/<tr>/g)||[]).length} й …</span></summary>
        <table class="t fw-table bfw-table"><tbody>${fwRows}</tbody></table>
      </details>`;
    }
  }
  // ж„ҹжё¬еҷЁпјҡзҚЁз«Ӣ /sensors з«Ҝй»һпјҢйқһеҗҢжӯҘијүе…ҘпјҲдёҚйҳ»еЎһдё»з•«йқўпјү
  const sd = machineSensorsCache[name];
  if (base.bmc_alive && !sd) machineLoadSensors(name);
  const sensorHtml = machineSensorsHtml(sd, base, name);
  // 只要 BMC 在線就安排一次 Sensor AI 診斷（含已有快取、重繪回詳情頁時）
  if (base.bmc_alive && _activeMachine === name) {
    setTimeout(() => { if (state.view === "machine") sensorAnalyze(name); }, 60);
  }
  // BMC иғҢжҷҜжҠ“еҸ–йҖІиЎҢдёӯ вҶ’ ж•ёз§’еҫҢиҮӘеӢ•йҮҚжү“ detailпјҲдёҚжү“ refreshпјҢи®Җеҝ«еҸ–пјүжӣҙж–°
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
      <button class="btn small" onclick="machineBack()">вҶҗ иҝ”еӣһ</button>
      <span class="mach-name">рҹ–Ҙ ${esc(name)} ${lvlBadge}</span>
      <span class="spacer"></span>
      <button class="btn small" onclick="openTerm('${esc(name)}')">в–¶ Terminal</button>
      ${m.passive ? "" : `<button class="btn small" onclick="runDiagnose('${esc(name)}')">рҹ©ә зі»зөұиЁәж–·</button>`}
      <button class="btn small" onclick="machineRefresh()">вҹі йҮҚж–°ж•ҙзҗҶ</button>
    </div>
    <div class="mach-grid">
      <div class="card">
        <div class="card-title">еҹәжң¬иіҮиЁҠ</div>
        <table class="t mach-info">
          <tr><td>е°ҲжЎҲ</td><td>${esc(base.project || "жңӘеҲҶйЎһ")}</td></tr>
          <tr><td>еұӨзҙҡ</td><td>${lvlBadge}</td></tr>
          <tr><td>OS IP</td><td class="mono">${esc(base.os_ip)} (${esc(base.os_user||"")}) вҖ” <b>${osState}</b></td></tr>
          <tr><td>BMC IP</td><td class="mono">${esc(base.bmc_ip||"вҖ”")} (${esc(base.bmc_user||"")}) вҖ” <b>${bmcState}</b></td></tr>
          <tr><td>BMC йӣ»жәҗ</td><td>${base.bmc_alive ? powerBadge(d.power) : "вҖ”"}</td></tr>
        </table>
        ${base.bmc_ip ? `
        <div class="mach-power-actions">
          <button class="btn small" onclick="machinePower('${esc(name)}',true)">вҸ» й–Ӣж©ҹ (ipmitool)</button>
          <button class="btn small btn-danger" onclick="machinePower('${esc(name)}',false)">вҸ» й—ңж©ҹ (ipmitool)</button>
      <span class="hint">е°ҲжЎҲеҲҶзө„ В· жӢ–жӣіеҚЎзүҮиӘҝж•ҙй ҶеәҸ</span>
        </div>` : ""}
      </div>
      <div class="card">
        <div class="card-title">OS зі»зөұиіҮиЁҠ ${d.os_info && d.os_info.fetched_at ? `<span class="hint">(${d.os_info.fetched_at})</span>` : ""}</div>
        <div class="os-scroll">${osInfoHtml}</div>
      </div>
    </div>
    ${base.bmc_alive ? `
    <div class="mach-grid">
      <div class="card">
        <div class="card-title">BMC ж„ҹжё¬еҷЁ (ipmitool sdr)</div>
        <div id="sensor-body">${sensorHtml}</div>
      </div>
      <div class="card">
        <div class="card-title">BMC Firmware (ipmitool mc info)</div>
        ${fwHtml}
      </div>
    </div>` : `
    <div class="card"><div class="empty">BMC (${esc(base.bmc_ip||"вҖ”")}) зӣ®еүҚдёҚеҸҜйҖЈпјҢз„Ўжі•жҠ“еҸ–ж„ҹжё¬еҷЁиҲҮ FW иіҮиЁҠгҖӮ</div></div>`}
    ${m.passive ? "" : `<div class="card diag-card" style="margin-top:18px">
      <div class="card-title">рҹ©ә зі»зөұиЁәж–·пјҲOllama еҲҶжһҗпјү</div>
      <div class="diag-body" id="diag-body"></div>
      ${diagBodyFill(name)}
    </div>`}
    <div class="card" style="margin-top:18px">
      <div class="card-title tel-card-title" onclick="toggleTelAll()">
        <span>рҹ“Ҡ System Telemetry <span class="hint" id="tel-window"></span></span>
        <span class="tel-collapse-all" id="tel-collapse-all">в–І е…ЁйғЁж”¶еҗҲ</span>
      </div>
      <div class="tel-toolbar">
        <label class="tel-range-sel">жҷӮй–“зҜ„еңҚ
          <select class="input" id="tel-select">
            <option value="10">10 еҲҶйҗҳ</option>
            <option value="30">30 еҲҶйҗҳ</option>
            <option value="60" selected>1 е°ҸжҷӮ</option>
            <option value="360">6 е°ҸжҷӮ</option>
            <option value="720">12 е°ҸжҷӮ</option>
            <option value="1440">24 е°ҸжҷӮ</option>
            <option value="2880">2 еӨ©</option>
            <option value="10080">7 еӨ©</option>
            <option value="43200">30 еӨ©</option>
          </select>
        </label>
        <span class="tel-ai-hint">рҹӨ– Telemetry AI</span>
      </div>
      <div class="tel-ai" id="tel-ai">вңЁ жӯЈеңЁеҲҶжһҗжӯӨзҜ„еңҚзҡ„зӣЈжҺ§и¶ЁеӢўвҖҰ</div>
      <div class="tel-grid" id="tel-grid">
        <div class="tel-block" data-open="1">
          <div class="tel-block-head"><span class="tel-label">CPU <em>пјҲдёӯеӨ®иҷ•зҗҶеҷЁпјү</em></span></div>
          <div class="tel-block-body">
            <div class="chart-box"><div class="chart-title">CPU дҪҝз”ЁзҺҮ <span class="unit">пјқ еҗ„ж ёеҝғеҝҷзўҢжҜ”дҫӢзҡ„е№іеқҮпјҢ0~100%</span></div><canvas id="tel-cpu"></canvas></div>
            <div class="chart-box"><div class="chart-title">CPU LoadпјҲе№іеқҮиІ ијүпјү <span class="unit">пјқ жҺ’йҡҠзӯүеҫ…зҡ„ж ёеҝғд»»еӢҷж•ёпјҢи¶…йҒҺж ёеҝғж•ёд»ЈиЎЁйҒҺијү</span></div><canvas id="tel-load"></canvas></div>
          </div>
        </div>
        <div class="tel-block" data-open="1">
          <div class="tel-block-head"><span class="tel-label">DIMM <em>пјҲиЁҳжҶ¶й«”пјү</em></span></div>
          <div class="tel-block-body">
            <div class="chart-box"><div class="chart-title">иЁҳжҶ¶й«”дҪҝз”ЁзҺҮ <span class="unit">пјқ е·Із”ЁпјҸзёҪе®№йҮҸ</span></div><canvas id="tel-mem"></canvas></div>
            <div class="chart-box"><div class="chart-title">иЁҳжҶ¶й«”дҪҝз”ЁйҮҸ <span class="unit">пјқ е·Із”Ё vs зёҪйҮҸпјҲGBпјү</span></div><canvas id="tel-memgb"></canvas></div>
            <div class="chart-box"><div class="chart-title">еҸҜз”ЁиЁҳжҶ¶й«” <span class="unit">пјқ еҸҜз”Ёзҡ„ GB</span></div><canvas id="tel-swap"></canvas></div>
          </div>
        </div>
        <div class="tel-block" data-open="1">
          <div class="tel-block-head"><span class="tel-label">SSD <em>пјҲеӣәж…ӢзЎ¬зўҹ / е„Іеӯҳпјү</em></span></div>
          <div class="tel-block-body">
            <div class="chart-box"><div class="chart-title">жҺӣијүй»һдҪҝз”ЁзҺҮ <span class="unit">пјқ жҜҸеҖӢеҲҶеүІеҚҖе·Із”ЁзҷҫеҲҶжҜ”</span></div><canvas id="tel-disk"></canvas></div>
            <div class="chart-box"><div class="chart-title">жҺӣијүй»һе·Із”ЁйҮҸ <span class="unit">пјқ жҜҸеҖӢеҲҶеүІеҚҖе·Із”Ёз©әй–“пјҲGBпјү</span></div><canvas id="tel-diskused"></canvas></div>
          </div>
        </div>
        <div class="tel-block" data-open="1">
          <div class="tel-block-head"><span class="tel-label">NIC <em>пјҲз¶Іи·ҜеҚЎпјү</em></span></div>
          <div class="tel-block-body">
            <div class="chart-box"><div class="chart-title">з¶Іи·ҜеҗһеҗҗйҮҸ <span class="unit">пјқ жҜҸејөз¶ІеҚЎ RXвҶ“ж”¶ / TXвҶ‘йҖҒпјҲMB/sпјү</span></div><canvas id="tel-net"></canvas></div>
          </div>
        </div>
        <div class="tel-block" data-open="1">
          <div class="tel-block-head"><span class="tel-label">GPU <em>пјҲйЎҜзӨәеҚЎпјү</em></span></div>
          <div class="tel-block-body">
            <div class="chart-box"><div class="chart-title">GPU дҪҝз”ЁзҺҮ <span class="unit">пјқ GPU ж ёеҝғйҒӢз®—иІ ијү</span></div><canvas id="tel-gpu"></canvas></div>
            <div class="chart-box"><div class="chart-title">GPU иЁҳжҶ¶й«”дҪҝз”Ё <span class="unit">пјқ VRAMпјҲGBпјү</span></div><canvas id="tel-gpumem"></canvas></div>
            <div class="chart-box"><div class="chart-title">GPU жә«еәҰ <span class="unit">пјқ йЎҜзӨәеҚЎжә«еәҰпјҲВ°Cпјү</span></div><canvas id="tel-gputemp"></canvas></div>
            <div class="chart-box"><div class="chart-title">GPU еҠҹиҖ— <span class="unit">пјқ йЎҜзӨәеҚЎеҠҹиҖ—пјҲWпјү</span></div><canvas id="tel-gpupow"></canvas></div>
          </div>
        </div>
      </div>
      <div class="footer-hint">Telemetry з”ұеҫҢз«Ҝе®ҡжҷӮйҖҸйҒҺ SSH ж”¶йӣҶпјҲnvidia-smi + /procпјүпјҢдёҚйңҖеңЁиў«зӣЈжҺ§ж©ҹеҷЁе®үиЈқ agentгҖӮ</div>
    </div>`;
}
// зі»зөұиЁәж–·зөҗжһңжҡ«еӯҳпјҲkey=ж©ҹеҸ°еҗҚпјүпјҢйҒҝе…Қй Ғйқў async жӣҙж–°жҷӮиў«жё…жҺү
const diagStore = {};   // { name: {state:'loading'|'done'|'error', html:'...'} }

function diagBodyFill(name) {
  const s = diagStore[name];
  if (!s) return `<div class="empty">й»һдёҠж–№гҖҢрҹ©ә зі»зөұиЁәж–·гҖҚжҢүйҲ•пјҢж”¶йӣҶ dmesg / journalctl / GPU / BMC event logпјҢдёҰз”ұ Ollama еҲҶжһҗе•ҸйЎҢиҲҮе»әиӯ°иҷ•зҗҶгҖӮ</div>`;
  if (s.state === "loading") return `<div class="empty">вҸі жӯЈеңЁж”¶йӣҶиіҮж–ҷдёҰе‘јеҸ« Ollama еҲҶжһҗпјҲзҙ„ 30~60 з§’пјүвҖҰ</div>`;
  return s.html || `<div class="empty">(з„Ўзөҗжһң)</div>`;
}
function runDiagnose(name) {
  const btn = [...document.querySelectorAll("button")].find(b => b.textContent.includes("зі»зөұиЁәж–·") || b.textContent.includes("иЁәж–·дёӯ"));
  diagStore[name] = { state: "loading", html: "" };
  if (btn) { btn.disabled = true; btn.textContent = "вҸі иЁәж–·дёӯвҖҰ"; }
  const body = $("diag-body");
  if (body) body.innerHTML = diagBodyFill(name);
  api(`/api/machine/${encodeURIComponent(name)}/diagnose`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ include_bmc: true })
  }).then(d => {
    if (!d.ok) throw new Error(d.error || "еҲҶжһҗеӨұж•—");
    if (d.note) { diagStore[name] = { state: "done", html: `<div class="empty">${esc(d.note)}</div>` }; return; }
    const md = d.report || "(з„ЎеҲҶжһҗзөҗжһң)";
    const bmcMode = d.collect && d.collect.bmc_mode === "os_local"
      ? "жң¬ж©ҹ ipmitoolпјҲSSH йҖІ OS еҹ·иЎҢпјү"
      : d.collect && d.collect.bmc ? "OOB lanplus" : "вҖ”";
    diagStore[name] = { state: "done", html: `
      <div class="diag-report"><pre class="mach-pre mono">${esc(md)}</pre></div>
      <details class="diag-raw"><summary>иЁәж–·еҺҹе§ӢиіҮж–ҷпјҲж”¶йӣҶжҷӮй–“ ${esc(d.collected_at||"вҖ”")} В· IPMIпјҡ${esc(bmcMode)}пјү</summary>
        <pre class="mach-pre mono">${esc((d.collect&&d.collect.os)||"(з„Ў OS иіҮж–ҷ)")}</pre>
        ${d.collect && d.collect.bmc ? `<pre class="mach-pre mono">===== BMC SEL =====\n${esc(d.collect.bmc)}</pre>` : ""}
      </details>` };
  }).catch(e => {
    diagStore[name] = { state: "error", html: `<div class="empty" style="color:var(--danger)">иЁәж–·еӨұж•—пјҡ${esc(e.message)}</div>` };
  }).finally(() => {
    const b2 = $("diag-body");
    if (b2) b2.innerHTML = diagBodyFill(name);
    if (btn) { btn.disabled = false; btn.textContent = "рҹ©ә зі»зөұиЁәж–·"; }
  });
}
async function machinePower(name, on) {
  if (!confirm(`зўәе®ҡиҰҒгҖҢ${on?"й–Ӣж©ҹ":"й—ңж©ҹ"}гҖҚ${name} е—ҺпјҹпјҲйҖҸйҒҺ BMC ipmitoolпјү`)) return;
  try {
    const r = await api(`/api/machine/${encodeURIComponent(name)}/power`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on })
    });
    await machineLoadDetail(name);
    setTimeout(() => alert(`${name} ${r.ok?(on?"е·Ій–Ӣж©ҹ":"е·Ій—ңж©ҹ"):"ж“ҚдҪңеӨұж•—пјҡ"+(r.info||"")}\nBMC зӣ®еүҚзӢҖж…Ӣпјҡ${r.power_status}`), 250);
  } catch (e) {
    alert("ж“ҚдҪңеӨұж•—пјҡ" + e.message);
  }
}
/* ---------- ж–°еўһзі»зөұ ---------- */
async function fillProjectSelect(selId) {
  const sel = $(selId);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = `<option value="">вҖ” жңӘеҲҶйЎһ вҖ”</option>` + projects.map(p => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("");
  sel.value = cur;
}
function openAdd() {
  fillProjectSelect("f-project");
  resetBmcProbe();
  $("add-modal").style.display = "flex";
  $("add-err").style.display = "none";
  $("save-btn").disabled = false;
  $("save-btn").textContent = "е„ІеӯҳдёҰжё¬и©ҰйҖЈз·ҡ";
}
function closeAdd() { $("add-modal").style.display = "none"; }
function showErr(msg) { const e = $("add-err"); e.textContent = msg; e.style.display = "block"; }
// дҫқ OS иіҮиЁҠжҺўжё¬пјҡжҠ“ hostname дёҰз”Ё OS жң¬ж©ҹ ipmitool lan print иҮӘеӢ•её¶е…Ҙ BMC IP
async function probeBmc() {
  const btn = $("probe-bmc-btn");
  const os_ip = $("f-os-ip").value.trim();
  const os_user = $("f-os-user").value.trim();
  const os_pass = $("f-os-pass").value;
  if (!os_ip || !os_user || !os_pass) { showErr("и«Ӣе…ҲеЎ« OS IPгҖҒSSH еёіиҷҹи·ҹеҜҶзўјпјҢеҶҚжҠ“еҸ– BMC IP"); return; }
  btn.disabled = true; btn.textContent = "рҹ”Қ жҠ“еҸ–дёӯвҖҰ"; showErr("");
  try {
    const d = await api("/api/machines/probe-bmc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ os_ip, os_user, os_pass, os_port: parseInt($("f-os-port").value) || 22 }),
    });
    if (d.ok) {
      $("f-bmc-ip").value = d.bmc_ip;
      showErr(""); // жҲҗеҠҹпјҡBMC IP е·ІиҮӘеӢ•её¶е…ҘпјҲеҸҚзҒ°ж¬„дҪҚпјү
    } else {
      if (d.ipmitool_ok === false) {
        alert("вҡ пёҸ з„Ўжі•иҮӘеӢ•жҠ“еҸ– BMC IPпјҡ\nOS е…§жңӘеҒөжё¬еҲ° ipmitoolгҖӮ\n\nи«Ӣе…ҲеңЁи©Ідё»ж©ҹе®үиЈқ ipmitoolпјҲдҫӢеҰӮ apt-get install ipmitoolпјүпјҢд№ӢеҫҢеҶҚйҮҚж–°жҠ“еҸ–гҖӮ");
      } else {
        alert("вҡ пёҸ жҠ“еҸ– BMC IP еӨұж•—пјҡ\n" + (d.error || "жңӘзҹҘйҢҜиӘӨ"));
      }
    }
  } catch (e) {
    alert("вҡ пёҸ жҠ“еҸ– BMC IP еӨұж•—пјҡ\n" + e.message);
  } finally {
    btn.disabled = false; btn.textContent = "рҹ”Қ дҫқ OS жҠ“еҸ– BMC IPпјҲйңҖ ipmitoolпјү";
  }
}
// й–Ӣе•ҹж–°еўһзі»зөұиЎЁе–®жҷӮйҮҚиЁӯ BMC IPпјҲйҒҝе…Қж®ҳз•ҷдёҠж¬Ўзҡ„пјү
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
  if (!body.os_ip || !body.os_user || !body.os_pass) { showErr("и«ӢеЎ« OS IPгҖҒSSH еёіиҷҹи·ҹеҜҶзўј"); return; }
  if (!body.project) { showErr("и«ӢйҒёж“Үе°ҲжЎҲпјҲжІ’жңүжЎҲеӯҗзҡ„и«Ӣе…Ҳй–Ӣе°ҲжЎҲеҲҶйЎһпјү"); return; }
  const btn = $("save-btn");
  btn.disabled = true; btn.textContent = "йҖЈз·ҡдёӯвҖҰ"; showErr("");
  try {
    const data = await api("/api/machines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const name = data.machine.name;
    await Promise.all([loadMachines(), loadProjects()]);
    closeAdd(); setView("dashboard");
    alert("вң… зі»зөұе·Іж–°еўһпјҡhostname = " + name + "\nеұӨзҙҡ = " + (body.level === "rack" ? "L11 Rack" : "L10 System"));
  } catch (e) {
    showErr("ж–°еўһеӨұж•—пјҡ\n" + e.message);
    btn.disabled = false; btn.textContent = "е„ІеӯҳдёҰжё¬и©ҰйҖЈз·ҡ";
  }
}
/* ---------- еҲӘйҷӨ ---------- */
function deleteMachine(name) {
  if (!confirm("зўәе®ҡиҰҒеҲӘйҷӨзі»зөұ " + name + " е—Һпјҹ")) return;
  fetch("/api/machines/" + encodeURIComponent(name), { method: "DELETE" })
    .then(() => Promise.all([loadMachines(), loadProjects()]))
    .then(() => setView(state.view));
}
/* ---------- йҮҚж–°жҺғжҸҸ ---------- */
async function refreshStatus() {
  const btn = $("refresh-btn");
  if (btn) { btn.disabled = true; btn.textContent = "жҺғжҸҸдёӯвҖҰ"; }
  try { await loadMachines(); setView(state.view); }
  catch (e) { alert("йҮҚж–°жҺғжҸҸеӨұж•—пјҡ" + e.message); }
  finally { if (btn) { btn.disabled = false; btn.textContent = "вҹі йҮҚж–°жҺғжҸҸ"; } }
}
/* ---------- е°ҲжЎҲз®ЎзҗҶ ---------- */
function togglePw(id, btn) {
  const el = $(id);
  if (el.type === "password") { el.type = "text"; btn.textContent = "рҹ·Ҳ"; }
  else { el.type = "password"; btn.textContent = "рҹ‘Ғ"; }
}
/* ---------- е°ҲжЎҲз®ЎзҗҶ ---------- */
function openProjectModal() {
  resetProjectForm();
  renderProjectList();
  $("project-err").style.display = "none";
  $("project-modal").style.display = "flex";
}
function closeProjectModal() { resetProjectForm(); $("project-modal").style.display = "none"; }
const LEVELS = { system: "L10 В· System", rack: "L11 В· Rack" };
function renderProjectList() {
  $("project-list-body").innerHTML = projects.map(p => {
    const canDelete = p.machine_count === 0;
    const racks = machines.filter(m => m.project === p.name && m.level === "rack").length;
    const systems = machines.filter(m => m.project === p.name && m.level !== "rack").length;
    return `<tr><td><b>${esc(p.name)}</b></td><td>${esc(p.desc || "")}</td><td>${p.machine_count}пјҲR${racks}/S${systems}пјү</td>
      <td style="white-space:nowrap">
        <button class="btn small" onclick="editProjectStart('${esc(p.name)}')">зҝ®ж”№</button>
        <button class="btn small${canDelete ? "" : " disabled"}" title="${canDelete ? "еҲӘйҷӨ" : "жӯӨе°ҲжЎҲйӮ„жңүж©ҹеҸ°пјҢз„Ўжі•еҲӘйҷӨ"}" ${canDelete ? `onclick="deleteProject('${esc(p.name)}')"` : "disabled"}>еҲӘйҷӨ</button>
      </td></tr>`;
  }).join("") || `<tr><td colspan="4" style="color:var(--text-faint)">йӮ„жІ’жңүе°ҲжЎҲпјҢи«Ӣе…ҲеңЁз·ҡж–°еўһгҖӮ</td></tr>`;
}
let editingProjectName = null;
function editProjectStart(name) {
  const proj = projects.find(p => p.name === name);
  if (!proj) return;
  editingProjectName = name;
  $("new-project-name").value = proj.name;
  $("new-project-desc").value = proj.desc || "";
  $("project-add-btn").textContent = "е„Іеӯҳдҝ®ж”№";
  $("project-err").style.display = "none";
}
function resetProjectForm() {
  editingProjectName = null;
  $("new-project-name").value = "";
  $("new-project-desc").value = "";
  $("project-add-btn").textContent = "ж–°еўһе°ҲжЎҲ";
}
async function addProject() {
  const name = $("new-project-name").value.trim();
  const desc = $("new-project-desc").value.trim();
  const err = $("project-err");
  if (!name) { err.style.display = "block"; err.textContent = "и«ӢеЎ«е°ҲжЎҲеҗҚзЁұ"; return; }
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
  if (!confirm("зўәе®ҡиҰҒеҲӘйҷӨе°ҲжЎҲгҖҢ" + name + "гҖҚе—Һпјҹ")) return;
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
/* ---------- зөӮз«Ҝж©ҹпјҲе·ҰеҸіпјҡе·Ұ OS / еҸі BMCпјү ---------- */
let termInstances = null;
function openTerm(name) {
  $("term-title").innerHTML = `<span class="grip">в–Ұ</span> зөӮз«Ҝж©ҹ вҖ” ${esc(name)}`;
  resetTermGeometry();
  $("term-os-status").innerHTML = `OS <span class="term-badge warn">йҖЈз·ҡдёӯ</span>`;
  $("term-bmc-status").innerHTML = `BMC <span class="term-badge warn">йҖЈз·ҡдёӯ</span>`;
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
class Term {
  constructor(containerId, url, statusId) {
    this.container = $(containerId); this.url = url; this.statusEl = $(statusId);
    this.term = null; this.ws = null; this.fitAddon = null;
  }
  connect() {
    if (!window.Terminal) { this.setStatus("зЁӢејҸеЁ«жңӘијүе…ҳ", "err"); return; }
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
    this.ws.onopen = () => { this.setStatus("е·ІйҖЈз·ҡ", "ok"); this.sendResize(); };
    this.ws.onmessage = e => {
      if (e.data instanceof Blob) { e.data.arrayBuffer().then(buf => this.term.write(new Uint8Array(buf))); }
      else { try { const j = JSON.parse(e.data); if (j.type === "error") this.setStatus(j.msg, "err"); } catch { this.term.write(e.data); } }
    };
    this.ws.onclose = () => this.setStatus("е·Іж–·з·ҡ", "err");
    this.ws.onerror = () => this.setStatus("йҖЈз·ҡйҢҜиӘӨ", "err");
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
/* ---------- е•ҹеӢ• ---------- */
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
  loadTheme(); buildNav(); initTermDrag();
  parseHash();                      // и®ҖеҸ– URL hashпјҢжҢҮе®ҡеҲқе§ӢеҲҶй Ғ
  window.addEventListener("resize", () => fitAll());
  window.addEventListener("hashchange", () => { parseHash(); setView(state.view); });
  try {
    await Promise.all([loadMachines(), loadProjects()]);
    setView(state.view);
  } catch (e) {
    $("content").innerHTML = `<div class="empty">еҫҢз«Ҝз„Ўжі•йҖЈз·ҡпјҲ${esc(e.message)}пјү<br>и«ӢзўәиӘҚжңүе•ҹеӢ• python еҫҢз«ҜзЁӢејҸгҖӮ</div>`;
  }
});
