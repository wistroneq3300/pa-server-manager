#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build tests.json (test library) by merging the lazy AI-review Excel with the
raw source Excel. Pure-ASCII script: any CJK in output JSON is carried over
verbatim from the source workbooks via openpyxl (using json ensure_ascii=True would
escape CJK, but we write UTF-8 directly so the review text is NOT re-typed). This script does NOT
any CJK literal. All UI-ish labels are emitted as unicode-escape (4-hex)
sequences so this file stays 7-bit clean (avoids LLM-output CJK corruption).

Output: /srv/pa-manager-prod/data/tests.json
"""
import openpyxl, json, os, sys

RAW     = "/root/test-library/TestCaseLibrary_Wistron.xlsx"
REVIEW  = "/root/test-library/AI_Simplified_Review_20260828/TestCaseLibrary_Wistron_Simplified_AI_Review_20260828.xlsx"
OUT     = "/srv/pa-manager-prod/data/tests.json"

SHEET_LABELS = {
    "Functionality": "\u529f\u80fd\u6027",        # Functional
    "Performance":   "\u6548\u80fd",              # Performance
    "Reliability":   "\u53ef\u9760\u6027",        # Reliability
    "Compatibility": "\u76f8\u5bb9\u6027",        # Compatibility
    "Stability":     "\u7a69\u5b9a\u6027",        # Stability
    "(No Main Function)": "\u7121\u4e3b\u529f\u80fd",  # No Main Function
}

def col_map(hdr):
    return {str(h).strip(): i for i, h in enumerate(hdr) if h is not None}

def main():
    wb_raw = openpyxl.load_workbook(RAW, read_only=True)
    wb_rev = openpyxl.load_workbook(REVIEW, read_only=True)

    raw_by_key = {}   # (sheet, code) -> row dict
    for sn in wb_raw.sheetnames:
        if sn == "Summary":
            continue
        idx = None
        for r in wb_raw[sn].iter_rows(values_only=True):
            if idx is None:
                idx = col_map(r)
                continue
            code = r[idx["Code"]] if "Code" in idx else None
            if not code:
                continue
            raw_by_key[(sn, str(code).strip())] = {
                "sub_function": r[idx.get("Sub Function", -1)] if "Sub Function" in idx else None,
                "test_set":     r[idx.get("Test Set", -1)] if "Test Set" in idx else None,
                "items":        r[idx.get("Items", -1)] if "Items" in idx else None,
                "procedure":    r[idx.get("Procedure", -1)] if "Procedure" in idx else None,
                "criteria":     r[idx.get("Criteria", -1)] if "Criteria" in idx else None,
            }

    wb_raw.close()

    library = {"sheets": {}, "total": 0, "generated_at": None}
    for sn in wb_rev.sheetnames:
        if sn == "Summary":
            continue
        idx = None
        items = []
        for r in wb_rev[sn].iter_rows(values_only=True):
            if idx is None:
                idx = col_map(r)
                continue
            code = r[idx["Code"]] if "Code" in idx else None
            if not code:
                continue
            key = (sn, str(code).strip())
            raw = raw_by_key.get(key) or {}
            items.append({
                "code":       str(code).strip(),
                "sub_function": raw.get("sub_function"),
                "test_set":   raw.get("test_set") or (r[idx["Test Set"]] if "Test Set" in idx else None),
                "items":      raw.get("items") or (r[idx["Items"]] if "Items" in idx else None),
                "procedure":  raw.get("procedure"),
                "criteria":   raw.get("criteria"),
                "ai_can_execute": r[idx["AI_Can_Execute"]] if "AI_Can_Execute" in idx else None,
                "ai_packages_needed": r[idx["AI_Packages_Needed"]] if "AI_Packages_Needed" in idx else None,
                "ai_commands": r[idx["AI_Commands"]] if "AI_Commands" in idx else None,
                "ai_logs_output": r[idx["AI_Logs_Output"]] if "AI_Logs_Output" in idx else None,
            })
        if items:
            library["sheets"][SHEET_LABELS.get(sn, sn)] = {
                "name": sn,
                "label": SHEET_LABELS.get(sn, sn),
                "count": len(items),
                "items": items,
            }
            library["total"] += len(items)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(library, f, ensure_ascii=False, indent=1)
    print("wrote", OUT, "total", library["total"])
    for label, s in library["sheets"].items():
        print("  ", label, s["name"], s["count"])

if __name__ == "__main__":
    main()
