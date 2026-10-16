#!/usr/bin/env python3
"""Checks shared/roadmap.yaml before anything draws it. Run: python3 shared/check_roadmap.py

Fails when:
- an item has an unknown status or category, or a duplicate id
- waits_on names an id that does not exist, or the item itself
- waits_on goes round in a circle
- an item is further along than something it waits on (live waiting on next, say)
- a redacted item carries a real summary, or any text has an em or en dash
"""
import sys
from pathlib import Path

import yaml

data = yaml.safe_load((Path(__file__).resolve().parent.parent / "src/data/roadmap.yaml").read_text(encoding="utf-8"))
order = [s["key"] for s in data["statuses"]]
cats = {c["key"] for c in data["categories"]}
items = data["items"]
ids = [i["id"] for i in items]
by = {i["id"]: i for i in items}
problems = []

if len(ids) != len(set(ids)):
    problems.append("duplicate ids: " + ", ".join(sorted({i for i in ids if ids.count(i) > 1})))
for i in items:
    if i["status"] not in order:
        problems.append(f'{i["id"]}: unknown status {i["status"]}')
    if i["category"] not in cats:
        problems.append(f'{i["id"]}: unknown category {i["category"]}')
    for d in i.get("waits_on") or []:
        if d == i["id"]:
            problems.append(f'{i["id"]}: waits on itself')
        elif d not in by:
            problems.append(f'{i["id"]}: waits on unknown id {d}')
        elif order.index(i["status"]) < order.index(by[d]["status"]):
            problems.append(f'{i["id"]} is {i["status"]} but waits on {d}, which is only {by[d]["status"]}')
    if i.get("redacted") and i["summary"] not in ("Classified.", "Held back."):
        problems.append(f'{i["id"]}: redacted items say "Classified." or "Held back." and nothing more')
    for field in ("title", "summary"):
        if chr(0x2013) in i[field] or chr(0x2014) in i[field]:
            problems.append(f'{i["id"]}: dash in {field}')

# circles: walk every chain
state = {}


def visit(n, path):
    if state.get(n) == "done":
        return
    if state.get(n) == "open":
        problems.append("circle: " + " -> ".join(path + [n]))
        return
    state[n] = "open"
    for d in by[n].get("waits_on") or []:
        if d in by:
            visit(d, path + [n])
    state[n] = "done"


for n in by:
    visit(n, [])

counts = {s: sum(1 for i in items if i["status"] == s) for s in order}
if problems:
    print("\n".join(problems))
    sys.exit(1)
print(f"roadmap.yaml ok: {len(items)} items, " + ", ".join(f"{k} {v}" for k, v in counts.items()))
