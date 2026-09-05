*** W20 — READ THIS FIRST *** - /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW20_RELIABILITY_1_202.md - W20 = Reliability sheet rows 1..202 (202 rows, the last unreviewed sheet). After W20 → W21 switches to Stability (88).
    - W19 (CONSUMED) DONE this session: Compat rows 302..459 reviewed + fixed (69 cells across 69 rows; Compatibility sheet now 459/459 = 100%). Highlights: applied W18's 14 GO findings (9 Q-LIT + row 134 structural pipe + 8 hardcoded-cred OAM 182-189 + row 86 ipmitool sdr) + W19 slice Q-LIT/R10 + 26 NVQ-hint rows (NVIDIA portal download notice) + **row 405 DBLBS fix** (W18 note wrongly said it was "already escaped"; it was double-backslash = actually broken — proven via local bash exec). build 3112/6; 3-way md5 7ef8dd5e… (repo==prod==/tmp). S5 zero-regression PASS (only Compat.ai_commands touched).
    - W19 open findings (awaiting GO, DO NOT auto-touch — all in Compat rows < 302 which W17/W18 claimed done): rows 141 (DBLBS same as 405), 85/104/110/112/118 (Q-LIT `echo "== $d =="`), 42/124/125 (nested sshpass inside ssh). See W20 handoff doc §findings.
    - SOP-SEM executed: 56 YES rows span all 6 sub-functions (NV GPU 42 / AMD GPU 6 / Net 4 / Storage 2 / OS 1 / Memory 1), ≥15 required ✔.
    - Backup chain: _w18pre (8db23735…) → _w19pre (2f9a854c…, pre-W19). W20 S1 should make _w20pre from current xlsx md5 = d5eb8572….
    - git HEAD 2a109d5, NO commit/stage/push (awaiting user GO).

 0. (window19 CONSUMED) the W19 handoff (SESSION_HANDOFF_WINDOW19_COMPAT_FINAL_302_459.md) stays as the SOP reference for W20+ (Reliability onwards). W20's doc is above.

*** W19 — CONSUMED THIS WINDOW (Compat rows 302..459 = DONE; SUPERSEDED by W20 above) *** - /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW19_COMPAT_FINAL_302_459.md - W19 = FINAL slice of Compatibility sheet (rows 302..460, 159 rows). After W19 → W20 switches to Reliability (202).
    - W18 (CONSUMED) DONE this session: Compat rows 102..301 reviewed (200 rows). Applied 44 cells = 38 R10 dup-2>&1 + 6 Q inner-quote (5 W17-A user-GO'd + row 128 W18-discovered same class). build 3112/6; 3-way md5 5ce2de807d71481bb80e3866c50be7a5 (repo==prod==/tmp). S5 zero-regression PASS (only Compat.ai_commands touched).
    - W18 open findings (14 items awaiting user GO, DO NOT auto-apply): 9 Q-class literal rows (122,126,135,139,142,143,150,216,285) — suggested `"→'`; 1 structural row 134 (pipe outside sshpass) — suggested rewrite; 8 hardcoded-cred OAM rows 182-189 (`curl -k -u bmc_user:bmc_pass`) — suggested `"$BMC_USER:$BMC_PASS"`; + W17 row 86 carryover.
    - SOP-SEM executed: 15 YES rows sampled across all 4 sub-functions (2 Storage + 2 OS + 6 AMD GPU + 5 NV GPU).
    - Backup chain: _w17pre (273be539…) → _w18pre (8db23735…, pre-W18 = post-W17). W19 S1 should make _w19pre from current xlsx md5 = 2f9a854c….
    - git HEAD 2a109d5, NO commit/stage/push.

 0. (window18 CONSUMED) the doc above stays as the SOP reference for W19 + W20+ (Reliability onwards).

*** W18 — CONSUMED (this window Compat rows 102..301 + W17 A group = DONE; SUPERSEDED by W19 above) ***
    - NOTE: the original W18 handoff (SCOPE was rows 102..201) was expanded by the user to rows 102..301 (200 rows) mid-session.
      W18 final results + 14 open findings live in **SESSION_HANDOFF_WINDOW19_COMPAT_FINAL_302_459.md** (opens with
      "W18 close-of-window" + "W18 findings" tables). Read THAT doc for W18 outcomes, not the stale 102..201 one
      (SESSION_HANDOFF_WINDOW18_REMAINING_COMPAT_102_201.md is historical only).
    - git HEAD 2a109d5, NO commit/NO stage/NO push (user has not said 'commit').

 0. (window17 CONSUMED) /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW17_REMAINING_5_SHEETS.md - W17 window Compat 2..101 DONE. W17 doc STILL holds the SOP-SEM block + full 5-sheet scope + redlines for W18+/W19+.

*** W17 — CONSUMED (this window Compat rows 2..101 = DONE) *** - /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW17_REMAINING_5_SHEETS.md - W17 = the remaining full-library review:
    - W16 (CONSUMED) is DONE: STEP A = W15's 85 cells applied + verified (3-way md5 d254e8f7...); STEP B = Functionality di 2084..2291 reviewed, 20 cells applied (A2 R29 / C15 R10 / D6 sshpass-var; 3-way md5 65e003bb4d968621ce9a6b23f931cfff). Functionality now 2291/2291 = 100%.
    - W17 = STEP C: audit the 5 non-Functionality sheets = 821 rows (Compatibility 459/162 YES first, Reliability 202/5, Stability 88, Performance 60, (No Main Function) 12), same rules (R5-R31) + KEEP guards + detectors (bare-cmd / 2>&1 2>&1 / <placeholder> / sshpass -p "$BMC_USER" variant / R28 path / R31 -C 17).
    - Current xlsx md5 273be53906782e9b410e14fc7a5f202c; tests.json md5 65e003bb4d968621ce9a6b23f931cfff (repo==prod); git HEAD 2a109d5, no stage/commit.
    - Backup chain intact: _w15pre (c504ba97...) -> _w16pre (56085381...) -> current (= _w16pre + 20 STEP-B cells).
    - SOP per sheet is inside the W17 doc; scripts /root/w15_fix.py + /root/w16_fix.py are the DRY+sandbox+post-audit pattern to copy.

 0. (window16 CONSUMED) /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW16_SCOPE_CHANGE_FULL_3112.md:
    - W16 scope EXPANDED: full-library review = ALL 3112 rows across ALL 6 sheets (was Functionality-only).
    - New plan: STEP A = apply W15's 85 cells (unchanged); STEP B = review Functionality di 2084..2291 (208 rows, unchanged);
      STEP C (NEW) = review the other 5 sheets = 821 rows (Reliability 202 / Performance 60 / Compatibility 459 /
      Stability 88 / (No Main Function) 12; 168 rows ai_can=YES). After W16: 3112/3112 = 100%.
    - STATUS: STEP A + STEP B DONE this session (see W17 doc above); STEP C = W17.
    - W15 PENDING doc below stays the SOP for the STEP A/B history.

0. /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW15_REVIEW_1884_2083_PENDING.md - (window15, CONSUMED by W16 — its 85 cells were APPLIED + verified as STEP A of W16; kept for the defect table/SOP reference):
    - W15 STEP A (DONE): applied W14's 95 cells (di 1684..1883) with full verification:
      S4 post-audit NONE; S5 exactly the 95 W14 di, ai_commands only, KEEP rows 0 diff;
      S6 build 3112/6 sheets, 3-way md5 8a3c6ca0... (repo==prod==/tmp);
      S7 15/15 spot-check EXACT + full sweep 0 true mismatches (43 apparent = duplicate-code variants, pre-existing).
      xlsx baseline is now c504ba97... (= _w15pre backup).
    - W15 STEP B (review di 1884..2083 = excel rows 1886..2085, Wistron-BMC-00975-V002 .. AMD SVM-00129-V003): 85 cells to fix, all ai_commands ONLY:
      A) 72 rows: bare `sensor get 'X'` (21 with SPACES in sensor name, e.g. 'Sensor Check - MB') / `chassis status` x2 / `sel info` x1, missing `ipmitool` prefix (R29). Whole-line OOB rewrite:
         ipmitool -I lanplus -C 17 -H "$BMC_IP" -U "$BMC_USER" -P "$BMC_PASS" <cmd> 2>&1
         (regex MUST use `[^']+` up to the closing quote — NOT `[^'\s]+`; first attempt with `[^'\s]+` missed all space names.)
      B) 1 row (row 1975, Wistron-AMD SVM-00038-V003): amdgpuras `-d <device_id>` -> ${AMDGPU_DEVICE_ID:?operator must provide the amdgpuras GPU device index (library samples use -d 0/1/2/3)} (R7+R30-safe)
      C) 12 rows: adjacent `2>&1 2>&1` dedup (rows 1959,2046,2052,2053,2055,2056,2060,2063,2064,2065,2067,2070; 2052 has x2)
      D) 0 sudo / 0 other classes this window.
    - KEEP confirmed: OOB-direct rows 1917-1926 untouched; curl+ipmitool mixed cells untouched; $MANAGER/$LOGS/$ENTRY placeholder rows (1973/1974) left as-is (W14-1688 policy); ~80 NO/PARTIAL description rows untouched.
    - DRY=1: 85 cells (72/1/12). sandbox APPLY via W15_XLSX=/tmp/w15_sandbox.xlsx: 85 cells, post-audit NONE. repo xlsx NOT modified (c504ba97... baseline).
    - Apply script: /root/w15_fix.py   (DRY=1 dry; bare run apply+save+audit; W15_XLSX=... for a copy)
    - 200-row raw audit dump (corrected alignment): /tmp/w15_window.txt
    - Read FULL details in SESSION_HANDOFF_WINDOW15_REVIEW_1884_2083_PENDING.md (especially §3 for the W16 step-by-step SOP + §1.2 for the di/excel-row alignment note).

    === W16 FIRST — do these in order (user must say go first): ===
    STEP A: APPLY W15's 85 cells (S4-S7)
      S4: cd /root/sheng/manager/pa_manager && python3 /root/w15_fix.py
          EXPECT: "changed cells: 85"  +  "post-audit issues: NONE"
          If post-audit is NOT NONE: STOP, check §1.2 table in W15 PENDING doc, fix, re-run.
      S5: zero-regression vs backup `data/…xlsx.bak_batch_20260905_w15pre`:
          only Functionality.ai_commands x85 cells changed; other 5 sheets + 17 cols x0 diff;
          KEEP rows (excel 1963 curl+ipmitool mixed / 2039 PARTIAL / 1973-1974 placeholder / 1922 OOB-direct) 0 diff.
          Anchor on Code + excel row, not on di labels.
      S6: build + 3-way md5:
          python3 scripts/build_testlib_json_xlsx.py data/REVISED_commands_merged_with_raw.xlsx /tmp/w16_tests_build.json
          EXPECT 3112/6 sheets. cp /tmp/w16_tests_build.json data/tests.json
          cp /tmp/w16_tests_build.json /srv/pa-manager-prod/data/tests.json
          3-way md5: repo data/tests.json == prod /srv/pa-manager-prod/data/tests.json == /tmp/w16_tests_build.json
      S7: spot-check >=13 rows xlsx == tests.json ai_commands EXACT (not just contains):
          excel rows 1886(A head) 1903(A zone end) 2010(A space-name) 1960/1961(A chassis x2) 1971(A sel info) 2040(A tail)
          1975(B device_id) 1959(C pldmtool) 2052(C x2) 2070(C tail)
          1963(KEEP mixed) 2039(KEEP PARTIAL) 1922(KEEP OOB-direct)
    STEP B: REVIEW di 2084..2291 (LAST 208 rows = excel rows 2086..2292, AMD SVM-00130-V003 .. Wistron-HW-00164-V003) — CLOSING WINDOW:
      S1: backup to ...xlsx.bak_batch_20260905_w16pre
      S2: audit di 2084..2291 (same R5/R7/R26/R28/R29/R30 rules + KEEP guards; bare-command regex must allow spaces in sensor names)
      S3: DRY  S4: APPLY+audit  S5: zero-regression  S6: build+3-way  S7: spot-check
      S8: handoff — after this, library is 2291/2291 = 100% reviewed. Write W17 = full-library final verification
          (re-run W14/W15 audit regexes over ALL 2291 rows + KEEP guards + 3-way md5) or a DONE recap window.
    Read this FIRST (newest, PENDING).

 0. /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW14_REVIEW_1684_1883_PENDING.md - (window14, CONSUMED — W15 STEP A has APPLIED its 95 cells and verified S4-S7; archive only):
    - The original 95-cell fix definition (di 1684..1883). W15 executed it; see W15 PENDING doc §1.1 for the delivery record.
    - Apply script /root/w14_fix.py remains for reference; do NOT re-run it (already applied).

 0. /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW13_APPLY_W12_1384_1683_DONE.md - (window13, DONE; W14 PENDING above now covers its 'W14 FIRST' scope):
    - W13 took over W12's PENDING (di 1384..1683, 43-cell fix) and COMPLETED S1-S7 (APPLY + build + zero-regression).
    - W13 fixed 3 W12 blind spots: 1629-1633 curl URL Systems/1->system (missed by W12), 1497 KEEP, self-audit KEEP guard.
    - FINAL: xlsx d668c3b4... (43 cells, post-audit NONE); tests.json db44b71d... (3112/6 sheets, 3-way identical);
      zero-regression 43 cells ONLY in Functionality.ai_commands; spot-check 13/13 PASS.
    - git HEAD 2a109d5; NOT staged/committed/pushed. DELIVERED di 0..1683 = 1684/2291 (73.5%).
    Read for W12/W13 background context only.

0. /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW12_REVIEW_1384_1683_PENDING.md - window12 (SUPERSEDED by W13 DONE above — its pending fix is now APPLIED):
   - The original 43-cell fix definition. Read ONLY if you need the original per-row STRIP_INWIN/KEEP/EDITS lists.
   - Its "W13 FIRST / S1–S8" checklist has been fully executed by the W13 DONE doc above.

0. /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW11_TASK_CIPHER_R31_DONE.md - prior window (W11, DONE):
   - DONE (window11): added `-C 17` (capital -C) to all 336 `ipmitool -I lanplus` rows across 6 sheets
     (334 Functionality + 2 Reliability; 419 invocations incl. multi-invocation rows; 7 already-`-C 17`
     rows skipped). In-band ipmitool (no `-I lanplus`, ~220 rows) NEVER touched — 0 in-band got `-C 17`.
   - Also stripped the R31 `ssh DUT "…"` wrapper on exactly 9 rows (00408/00411/00414/00415/00480/00481/00482/
     00510/00511) -> agent-host direct `ipmitool -I lanplus -C 17 …`. 00480/00482 hardcoded bytes ->
     ${RECV_BYTES_HEX:?…} / ${EVENT_BYTES_HEX:?…} (R7/R30).
   - Live-verified on EQ3300-AIAgent (10.35.228.145): `-C 17 mc info` -> Device ID 32 / FW 3.08 / Wistron (PASS).
   - Zero-regression: 336 rows x ai_commands ONLY; ai_can_execute / risk / ai_packages_needed = 0 diff.
     build 3112 / 6 sheets. 3-way md5 a93b9341e5d0b7f5cc5352753df737c2 (repo==prod==/tmp).
     6969 spot-check 13/13 PASS. NOT committed / NOT pushed / NOT staged (bak_*/RestAPI/123.txt untracked).
   - Cursor: next batch review data_index 1384..1583 (00676→00875, 200 rows).
   - 65 more ssh+lanplus cells remain (HW/BIOS/BMC spread) — NOT in window11 scope; user to decide whether to strip.
   Read this FIRST (newest, DONE).

0. /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW11_TASK_CIPHER_R31.md - the window11 TASK spec (superseded by DONE above):
   - The cipher rule + 9-row R31 list + S0..S8 procedure that the DONE doc executed.
   Read before the DONE doc if you need the original spec.

0.0. /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW10_REVIEW_20260818.md - prior window (data_index 1184-1383, 200 rows):
   - Reviewed Functional data_index 1184..1383 (200 rows; Wistron-BMC-00476-V003 -> 00675-V003, single family BMC).
     YES 98 / PARTIAL 73 / NO 29. 0 changed ai_can_execute (conservative).
   - Fixed 24 cells (24 rows, all ai_commands only): A double/triple 2>&1 dedup x12 (00480-00482, 00510-00511,
     00622-00624, 00655/00658/00659); B R28 canonical Redfish paths x7 (00613-00615 Systems/1->system +
     STORAGE_ID R7, 00619 Systems/1->system + CPU0->PROC_ID R7, 00620/00621 + NIC_ID R7, 00670 Managers/1->bmc);
     C R7 bare <placeholder> x5 (00512 FRU_OFFSET/FRU_DATA, 00656 NEW_ACCOUNT_NAME/PASS, 00662 METRIC_REPORT_DEF,
     00668 EVENT_LISTENER_URL); 00666 WHOLE rewrite (double-fix: R27/R28 UpdateService real path = HttpPushUri
     per data/11+12.RestAPI + R5/R31 agent-host drop ssh wrap + R7 BMC_IMAGE).
   - 24 cells, 24 rows, ONLY ai_commands. build 3112 / 6 sheets unchanged. Zero-regression confirmed.
   - md5 c3e747d365cf2d70d71c77db6f5c7335 (repo == prod == /tmp). 6969 alive, 13 spot-checks PASS.
   - Progress: delivered data_index 0..1383 = 1384 / 2291 Functional rows; 907 remain.
   - USER DECISION: 0penBmc / 10.36.x IPs = local 6969 machine-db operational data (NOT a leak); no redaction
     required before push. RestAPI 11+12 = canonical redfish path reference.
   - Next: continue at Functional data_index 1384..1583 (= Wistron-BMC-00676-V003 -> 00875-V003, 200 rows).
     ALWAYS verify against surrounding codes (di 1383=00675, 1384=00676, 1385=00677); do NOT rely on bare row idx.
   Read this FIRST (newest).

0.0. /root/sheng/manager/pa_manager/SESSION_HANDOFF_WINDOW9_REVIEW_20260818.md - prior window (data_index 984-1183, 200 rows):
   - GO-A: cleared 16 residual <placeholder> rows in the delivered region (00095/00096/00097, 00276-00283,
     00034-00037, 00091/00092) -> ${VAR:?operator must ...} (R7/R30). 0 leftover <...> in data_index 0..983.
   - GO-B: reviewed Functional data_index 984..1183 (200 rows; Wistron-BMC-00276-V003 -> 00475-V003, single family).
     YES 35 / PARTIAL 76 / NO 89. 0 changed ai_can_execute (conservative).
   - Fixed 10 cells (6 rows, all ai_commands only): R26 in-band ipmitool +sudo x5 (00353/00354/00355/00383/00384);
     R7 FRU-write placeholder x1 (00385 ${FRU_OFFSET:?}/${FRU_DATA:?}); cosmetic "2>&1" dedup x4 (00408/00411/00414/00415).
   - Build 3112 / 6 sheets unchanged. Zero-regression: 22 rows x ai_commands ONLY; ai_can_execute 0 diff.
   - md5 c00c2cd2508111791b1ae6e9329dd32f (repo == prod == /tmp). 6969 live, 11 spot-checks PASS.
   - Progress: delivered data_index 0..1183 = 1184 / 2291 Functional rows; 1107 remain.
   - Next: continue at Functional data_index 1184..1383 (= Wistron-BMC-00476-V003 -> 00675-V003, 200 rows).
     ALWAYS verify against surrounding codes (di 1183=00475, 1184=00476, 1185=00477); do NOT rely on bare row idx / Excel row.
   Read this FIRST (newest).

0.1. /root/sheng/manager/pa_manager/SESSION_HANDOFF_708_REVIEW_20260905.md - prior window (rowidx 784-983, 200 rows):
   - Reviewed Functionality in-file rowidx 784-983 (200 rows; Wistron-BMC-00076-V003 -> 00275-V003, single family BMC).
     YES 98 / PARTIAL 85 / NO 17. 0 changed ai_can_execute (conservative).
   - Fixed 66 rows (115 cells, all ai_commands + some ai_logs_output/risk):
     * R29 fake-command x42 ("sensor get 'X'" x38 + "chassis ..." x4 bare literals, missing ipmitool -> command not found)
       -> OOB `ipmitool -I lanplus ... sensor get` / `chassis`, chassis power rows get BEFORE/AFTER read-back + risk.
     * R28 canonical path: 830 /Systems/1/LogServices/PlatformLog -> Managers/bmc/LogServices{,/Journal|Dump|FaultLog,Entries};
       836 NTP Managers/1 -> Managers/bmc/NetworkProtocol + ${NTP_SERVER:?...} (both verified in 11+12.RestAPI).
     * R26 sudo x1 (803 "reboot" -> "sudo reboot"); R7 placeholder x13 (LDAP 925-932, IPMI acct 938-940, VirtualMedia 914);
       cosmetic x9 (2>&1 2>&1 + double -k). R30 NEW: no backticks inside ${VAR:?...} messages.
   - Build 3112 / 6 sheets (unchanged). Zero-regression: 66 rows x 3 cols ONLY; ai_can_execute 0 diff.
   - md5 55abf9d7427350d088cacc54e01b4fac (repo == prod == /tmp). 6969 live, 6 spot-checks PASS.
   - Progress at the time: 1008 / 2977 unique codes (~33.9%).

0.2. /root/sheng/manager/pa_manager/SESSION_HANDOFF_500_REVIEW_20260905.md - prior window (rowidx 284-783, 500 rows):
   - YES 272 / PARTIAL 93 / NO 135, 0 changed ai_can_execute. R26 sudo x242 + R7 SNMP x12, all ai_commands.
   - Audit note: 867-904 & 980-983 bare-literal commands slipped past that batch; fixed THIS window (R29 rule added).

0-alt. /root/sheng/manager/pa_manager/SESSION_HANDOFF_300_REVIEW_20260905.md - prior window (Functionality 00104-00300):
   - 197 rows. YES 17 / PARTIAL 121 / NO 59. 21 fixed (R7 placeholder 00113/00213, R26 sudo 00228/00273/00274,
     R5 host-placement 00116/00230/00233/00263-00299). Build 3112/6 sheets.

0-alt. /root/sheng/manager/pa_manager/SESSION_HANDOFF_PILOT_100_REVIEW_20260905.md - prior window (Functionality 00001-00100, 18 sudo fixes):
   - 100 rows. YES 10 / PARTIAL 27 / NO 63. 18 rows fixed for R26 sudo (dmidecode / i2cdetect / i3cdetect / ipmitool).
   - NOT COMMITTED YET - user to approve commit + .bak_* inclusion before push.

0-1. /root/sheng/manager/pa_manager/SESSION_HANDOFF_20260904_REVIEW_WORKFLOW.md - prior window (R1-R28 rules + 00149/00286/00618 fixes + UI layout).

0-2. /root/test-library/SESSION_HANDOFF_8FIO_MERGE_XLSX.md - prior window (merged xlsx = single source + 8 fio + earlier UI fix).
   - MERGED XLSX is now the SINGLE SOURCE OF TRUTH: new scripts/build_testlib_json_xlsx.py reads
     data/REVISED_commands_merged_with_raw.xlsx directly (adds Script/bundle/remark; zero-regression).

Please read the following files, then follow the instructions in them, and report your
understanding of the current state and the next step BEFORE acting. Strictly follow the CJK
safety rule in AGENTS.md (all code must use \uXXXX escapes, never type CJK directly).

0. /root/test-library/SESSION_HANDOFF_T4_IMPORT_6969.md - the LATEST handoff: goal is to take the
   reviewed test library (merged with raw) INTO pa-manager and VERIFY it live on port 6969.

0b. /root/test-library/REVISED_commands_merged_with_raw.xlsx - NEW merged workbook (3112 rows, raw 12 cols
   + AI block = 18 cols, joined by code; review artifact, NOT an app input).

1. /root/test-library/SESSION_HANDOFF_T4_REVIEW_FINAL_WITH_REMARK.md - the LATEST (FINAL) state handoff.
   Grind is COMPLETE: 2977 unique codes = 100% of workbook.
2. /root/test-library/SESSION_HANDOFF_T4_REVIEW_START.md - the T4 framework/re-approach handoff.
3. /root/test-library/SESSION_HANDOFF_ASSIGN_TASK_20260903.md - prior handoff (full strict per-case re-review spec).
4. /root/test-library/AI_TESTCASE_PROJECT_CONTEXT.md - project blueprint/context.
5. Repo /root/sheng/manager/pa_manager/AGENTS.md - project context notes (Option C Step 2).

Project repo : /root/sheng/manager/pa_manager  (branch main, HEAD = 2a109d5)
Source Excels (do NOT modify originals):
  /root/test-library/TestCaseLibrary_Wistron.xlsx
  /root/test-library/AI_Simplified_Review_20260828/TestCaseLibrary_Wistron_Simplified_AI_Review_20260828.xlsx
Output: /srv/pa-manager-prod/data/tests.json   (the app reads only this file; mtime-cached, no restart)
