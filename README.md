# Wistron PA Server Manager

A web-based management console for **AI GPU servers**, unifying **L10 (System Level / single-node)** and **L11 (Rack Level / whole-rack)** machine monitoring and control in a single overview.

Built with **FastAPI** (Python) + **vanilla JS** frontend. Machines are discovered and managed over **SSH** / **IPMI (BMC)**, with historical telemetry persisted to **SQLite** — no agents required on the managed hosts.

## Features
- **Unified overview dashboard** — managed systems, online/offline status, projects, GPU server health at a glance.
- **L10 System Level** — add & manage individual servers via OS SSH + optional BMC:
  - SSH OS access (IP / user / password / port); hostname auto-discovered on add.
  - BMC IP (auto-probed via the OS `ipmitool`) + BMC credentials.
  - OS info, hardware inventory (CPU/DIMM/SSD/GPU/NIC), sensors, BMC power on/off from the UI.
  - **Telemetry viewer** — historical metrics with charts and trend analysis.
- **L11 Rack Level** — rack view with U-slot layout (bottom-up) for servers, switches, power shelves, PDUs, CDUs, storage; occupancy checks.
- **Projects** — group machines by project (e.g. NCP/H100/Miramar), per-project status.
- **BMC power badge** — live chassis power on/off with color coding.
- **Terminal** — in-browser OS/BMC terminal (xterm.js).
- **AI Copilot** — natural-language assistant wired to local Ollama (qwen3.8:27b).

## Quick start
```bash
cd pa_manager
bash run.sh
```
Supports a **trial instance** (default port `8788`) and a **production instance** (port `6969`) sharing one codebase with **isolated data** via `PA_DATA_DIR`.

## API overview
| Method | Path | Description |
|---|---|---|
| POST | /api/machines | Add machine (SSH-validate, auto hostname) |
| POST | /api/machines/probe-bmc | Probe BMC IP via ipmitool |
| GET | /api/machines | List machines (passwords masked) |
| DELETE | /api/machines/{name} | Remove machine |
| GET | /api/machine/{name} | Machine detail |
| GET | /api/machine/{name}/detail | OS info + hardware inventory |
| GET | /api/machine/{name}/sensors | Sensor readings |
| GET/POST | /api/machine/{name}/power | Read / control BMC power |
| GET | /api/machine/{name}/telemetry | Telemetry history (SQLite) |
| GET | /api/machine/{name}/telemetry/analyze | Telemetry trend analysis |
| GET/POST | /api/machine/{name}/diagnose | Run diagnostics / AI diagnosis |
| GET | /api/rack/ping | Rack-level ping sweep |
| POST/GET/DELETE | /api/rack/passive, /api/links | Rack elements & links |
| GET/POST/DELETE | /api/projects | Project management |
| POST | /api/copilot | AI Copilot |

## Data & security notes
- Inventory in `data.json`; telemetry in SQLite `telemetry.db`; isolated per instance by `PA_DATA_DIR`.
- Credentials stored alongside machine data — encrypt at rest / use a secrets manager before wide rollout.
- Authentication / RBAC not yet implemented — add before exposing to broader audience.
- Production data auto-backed up daily (keep 14) via `backup_prod.sh` + cron.

## Git & releases
- Update production: `sudo systemctl restart pa-manager` (loads shared codebase).
- Roll back: `git log --oneline` → `git checkout <hash>` → restart. See `GIT_USAGE.md`.
