# Wistron PA Server Manager

A centralized **web management console** for **AI GPU servers** (and racks). It unifies **L10 (System Level / single node)** and **L11 (Rack Level / whole rack)** monitoring and control in a single view.

- Backend: **FastAPI (Python 3.12)**; Frontend: **vanilla JavaScript** (no framework, no build step).
- No agent required on managed hosts — everything works over **SSH** (OS) and **IPMI / BMC**.
- Historical telemetry (sensors / hardware health) is persisted in **SQLite**.
- In-browser terminal (xterm.js) is provided by a separate **node/ssh2 bridge** service.

> This README is both the **deployment guide** and the **handover doc for OpenHands / AI agents**.
> If you have a clean clone, follow "Deployment Guide" to bring the whole site up.

---

## 1. Feature Overview

### 1.1 Unified Overview Dashboard
- Aggregate view of all managed systems: online/offline status, grouped by project, GPU server health at a glance, ping status lights.

### 1.2 L10 System Level (single node)
- Add / manage individual servers over OS SSH (IP / user / password / port); hostname auto-probed on add.
- BMC support: BMC IP can be auto-probed from the OS via `ipmitool` (`use_c17` maps to newer OpenBMC cipher 17).
- View OS info, hardware inventory (CPU/DIMM/SSD/GPU/NIC), sensors, BMC power on/off.
- **Telemetry viewer**: SQLite history + charts + trend analysis.
- **BMC power badge**: live chassis power state with color coding.

### 1.3 L11 Rack Level (rack view)
- Rack floor plan (U slots, **numbered bottom-up**) for servers / switches / power shelves / PDUs / CDUs / storage.
- Empty-slot **"+"** adds a system (only shows **existing L11 systems of the same project, placed outside the rack**; U count is locked to that system's `rack_size`, not editable).
- Occupancy checks: avoids occupied U ranges; multi-U devices need contiguous free slots.
- **Rack topology map**: draws node ↔ switch/PDU/CDU links as an SVG connection diagram.
  - The **"New Topology / Simulate Topology" buttons are currently paused** — they show a "feature under development" popup. (Original implementations `linkAddDialog()` / `rackDemoTopo()` are still fully preserved in `app.js`; point the button `onclick` back to them to re-enable.)
- Topology toolbar: "expand/collapse" (`.topo-compact`), "delete all" (clear this project's links), SVG height-limited scrolling.

### 1.4 Projects
- Group machines by project (e.g. NCP / H100 / Miramar); L10 and L11 tabs are independent.
- Each project has its own status; system cards can be collapsed/expanded.

### 1.5 Web Terminal (xterm)
- Operate the **OS / BMC** SSH terminal directly in the browser.
- Runs via the separate **pa-terminal-bridge** (node + `ssh2`, port 6968), event-driven to avoid paramiko concurrency crashes.
- Passwords are not trusted from the frontend: the bridge always reads real credentials from `data.json` using `name + kind`.

### 1.6 System Broadcast (L10 tab)
- List L10 systems with OS grouped by project, and send one command to many hosts' OS shells at once.
- Command history `bcLog` records only **time + command**, **not** the target host list.

### 1.7 AI Copilot
- Natural-language assistant wired to a local Ollama (qwen3.8:27b). Also assists diagnostics / trend analysis.

---

## 2. System Architecture (read before deploying)

```
Browser (index.html + app.js + xterm.js)
   |
   | HTTP (REST)    /api/*
   | WebSocket      /ws/*
   v
pa-manager  ----(FastAPI, uvicorn)----  port 6969 (prod) / 8788 (trial)
   |  * handles REST API, WebSocket proxy, reads/writes data.json & telemetry.db
   |  * /ws/terminal/* and /ws/rack-broadcast are two-way proxies to the node bridge
   v
pa-terminal-bridge  ----(node + ssh2)----  port 6968
   |  * actually opens SSH connections to each host (OS / BMC)
   v
Managed hosts  (OS over SSH, BMC over IPMI/Redfish)
```

- `pa-manager`: Python backend — data, REST, and proxies terminal WebSockets to the bridge.
- `pa-terminal-bridge`: Node service that opens the real SSH channels; **without it the web terminal is unavailable** (everything else still works).
- Data: the machine list lives in `data.json`, telemetry history in SQLite `telemetry.db`.

---

## 3. Directory Layout

```
pa_server_manager/
├── main.py                 # FastAPI backend (main program)
├── telemetry_core.py       # telemetry collection core
├── requirements.txt        # Python dependencies
├── run.sh                  # dev / trial launch script
├── pa-manager.service      # systemd unit (production, port 6969)
├── backup_prod.sh          # daily backup script
├── scripts/
│   └── seed_simulated_telemetry.py
├── static/
│   ├── index.html          # frontend entry
│   ├── css/style.css
│   ├── js/app.js           # frontend logic (all features live here)
│   ├── img/
│   └── vendor/             # chartjs / xterm
├── terminal_bridge/        # Node terminal bridge (ssh2 + ws)
│   ├── server.js
│   ├── package.json
│   └── package-lock.json    # run `npm ci` after clone
└── AGENTS.md               # project knowledge for OpenHands (development)
```

---

## 4. Deployment Guide (for anyone with a clean clone)

> Environment requirements: **Linux**, **Python 3.12**, **Node.js 18+** (npm).
> The steps below assume a fresh machine and fresh clone — follow them top to bottom.

### Step 1 — Get the code

```bash
git clone https://github.com/wistroneq3300/pa-server-manager.git
cd pa-server-manager
```

### Step 2 — Python environment + dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> Use Python 3.12 if possible. If the system default differs, call it out explicitly with `python3.12`.

### Step 3 — Node terminal bridge dependencies

```bash
cd terminal_bridge
npm ci            # installs from package-lock.json (ssh2 + ws)
cd ..
```

> If `npm ci` is not available, `npm install` works too.

### Step 4 — Prepare a data directory

The program picks its data location from the environment variable `PA_DATA_DIR`
(if unset, it uses the directory the program lives in).

For production, keep data in a dedicated folder (separate from any trial instance):

```bash
export PA_DATA_DIR=/srv/pa-server-manager-data
mkdir -p "$PA_DATA_DIR"
```

**First launch**: the data directory may be empty — after it is online you simply
use "Add System" on the web UI to create machines.
(If migrating an existing site, copy the old `data.json` and `telemetry.db` into `$PA_DATA_DIR/`.)

### Step 5 — Launch (trial vs production)

**Trial mode (default port 8788, handy for testing):**

```bash
source .venv/bin/activate
PORT=8788 bash run.sh
# http://localhost:8788/
```

**Production mode (recommended: systemd, persistent + boot-enabled):**

Sample unit files are provided: `pa-manager.service` and `pa-terminal-bridge.service`:

```bash
# Install the units
sudo cp pa-manager.service pa-terminal-bridge.service /etc/systemd/system/
#   WARNING: edit BOTH files — WorkingDirectory, the ExecStart python path, and
#   Environment PA_DATA_DIR — to this machine's actual paths.

sudo systemctl daemon-reload
sudo systemctl enable --now pa-terminal-bridge   # start the node bridge first
sudo systemctl enable --now pa-manager           # then the python backend
sudo systemctl status pa-manager pa-terminal-bridge
```

> Both services must run, and **pa-terminal-bridge must be able to read the same
> `$PA_DATA_DIR/data.json`** (it reads credentials from that same file).

### Step 6 — Verify

- Open http://<host>:6969/ — the UI should load.
- In "System Manager", add a system (OS IP/user/password), then open its web
  terminal to confirm SSH works.

---

## 5. Operations

### Backup
- Daily auto-backup: `backup_prod.sh` (keeps 14 copies). Enable via cron:
  ```bash
  crontab -e
  # daily 02:00, backup production data
  0 2 * * * /srv/.../backup_prod.sh >> /tmp/pa_backup.log 2>&1
  ```
- Manual backup: copy `$PA_DATA_DIR/` (contains `data.json` + `telemetry.db`).

### Update
```bash
cd pa-server-manager
git pull
# if python deps changed : pip install -r requirements.txt
# if node deps changed :   cd terminal_bridge && npm ci
sudo systemctl restart pa-manager pa-terminal-bridge
```

### Roll back
```bash
git log --oneline
git checkout <commit you want to roll back to>
sudo systemctl restart pa-manager pa-terminal-bridge
```

---

## 6. Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PA_DATA_DIR` | program directory | folder that holds `data.json` & `telemetry.db` (trial/prod isolation) |
| `PORT` | 8788 | uvicorn port for run.sh; production uses service (6969) |
| `TELEMETRY_INTERVAL` | - | telemetry collection interval (seconds) |
| `MONITOR_MACHINES` | all with OS in data.json | restrict which machines are monitored |
| `TERM_BRIDGE_PORT` | 6968 | node terminal bridge port |
| `TERM_BRIDGE_HOST` | 0.0.0.0 | node terminal bridge bind address |
| `IPMI_CIPHER` | 17 | ipmitool cipher (use 17 for newer OpenBMC) |

---

## 7. REST API Overview

| Method | Path | Description |
|---|---|---|
| POST | `/api/machines` | Add machine (SSH-validated, auto hostname, level, rack_size) |
| POST | `/api/machines/probe-bmc` | Probe BMC IP via ipmitool |
| GET | `/api/machines` | List machines (passwords masked) |
| DELETE | `/api/machines/{name}` | Remove machine |
| GET | `/api/machine/{name}` | Machine detail |
| GET | `/api/machine/{name}/detail` | OS info + hardware inventory |
| GET | `/api/machine/{name}/sensors` | Sensor readings |
| GET/POST | `/api/machine/{name}/power` | Read / control BMC power |
| GET | `/api/machine/{name}/telemetry` | Telemetry history (SQLite) |
| GET | `/api/machine/{name}/telemetry/analyze` | Trend analysis |
| GET/POST | `/api/machine/{name}/diagnose` | Diagnostics / AI analysis |
| GET | `/api/rack/ping` | Rack-level ping sweep |
| POST/GET/DELETE | `/api/rack/passive`, `/api/links` | Rack elements & links |
| GET/POST/DELETE | `/api/projects` | Project management |
| POST | `/api/copilot` | AI Copilot |

WebSocket:
- `/ws/terminal/{name}/{kind}` — OS/BMC terminal (kind = `os` | `bmc`), proxied two-way to the bridge.
- `/ws/rack-broadcast` — rack broadcast terminal (same-project multi-host).

---

## 8. Data & Security Notes

- Machine list is stored in `data.json`; telemetry in SQLite `telemetry.db`; isolated per instance by `PA_DATA_DIR`.
- **Credentials are stored in plaintext in `data.json`.** There is no login / RBAC yet.
  **Add authentication before exposing to a broader audience**, and consider
  encrypting passwords at rest (`ADMIN_PERMISSION_BLUEPRINT.md` is an unimplemented auth blueprint).
- `prod-data.json` (an old snapshot that contained plaintext real-machine credentials)
  has been **removed from version control and added to `.gitignore`** — it will not leak with a clone.
- Managed hosts need no agent, but you do need their SSH and IPMI credentials to be managed by this system.

---

## 9. Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| Web terminal won't connect | pa-terminal-bridge is down or wrong port: `sudo systemctl status pa-terminal-bridge`; make sure it can read `$PA_DATA_DIR/data.json` credentials |
| `python: command not found` | venv not built or not activated: `source .venv/bin/activate` |
| Power on/off fails | wrong BMC credentials, or cipher mismatch; set `IPMI_CIPHER` (17 for OpenBMC) |
| Page 403 / unreachable | service not running: `sudo systemctl status pa-manager` |
| No telemetry data | host offline or not connected; wait for next collection (tune `TELEMETRY_INTERVAL`) |

---

## 10. For OpenHands / Developers

- The repo has an `AGENTS.md` with project knowledge and development caveats — read it before continuing work.
- Frontend logic is all in `static/js/app.js` (~170KB, no framework, no build).
- The `index.html` modals/DOM and `style.css` styling are under version control.
- **When editing strings that contain emoji, prefer doing the edit with a Python script**,
  to avoid an editor surrogate-pair issue that can wipe the whole file (historical lesson; see AGENTS.md for details).
