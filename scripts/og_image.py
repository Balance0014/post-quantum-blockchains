#!/usr/bin/env python3
"""Render the 1200x630 Open Graph image (scripts/site/og.png) with headless Chrome.

Usage:
  python3 scripts/og_image.py           render og.png and og.json
  python3 scripts/og_image.py --check   exit 1 if og.json is out of date (no Chrome needed)
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data", "chains.json")
OUT_DIR = os.path.join(HERE, "site")
OUT_PNG = os.path.join(OUT_DIR, "og.png")
OUT_JSON = os.path.join(OUT_DIR, "og.json")
W, H = 1200, 630
CHROME = os.environ.get("CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]
STAGES = ["Nothing public", "Research", "Formal proposal", "Testnet", "Mainnet opt-in", "Default"]


def load():
    with open(DATA, encoding="utf-8") as f:
        chains = json.load(f)["chains"]
    return {"chains": len(chains),
            "reviewed": max(c["last_reviewed"] for c in chains if c.get("last_reviewed")),
            "by_stage": [sum(1 for c in chains if c["stage"] == s) for s in range(6)]}


def pretty(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return "%s %d, %d" % (MONTHS[m - 1], d, y)


def html(info):
    top = max(info["by_stage"]) or 1
    rows = "".join(
        '<div class="row"><span class="n">%d</span><span class="lbl">%s</span>'
        '<span class="bar" style="width:%dpx"></span><span class="cnt">%d</span></div>'
        % (i, label, max(4, round(120 * n / top)), n)
        for i, (label, n) in enumerate(zip(STAGES, info["by_stage"])))
    return """<!doctype html><meta charset="utf-8"><style>
:root{--bg1:#0f1530;--bg2:#18214a;--fg:#f1f4ff;--muted:#aab5df;--accent:#8ea6ff;--line:#3a4780;--panel:#0b1026}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:%dpx;height:%dpx;overflow:hidden}
body{font-family:"Avenir Next","Helvetica Neue",sans-serif;color:var(--fg);position:relative;
 background:linear-gradient(180deg,var(--bg1),var(--bg2))}
.tag{position:absolute;left:64px;top:52px;font:500 20px/1 Menlo,monospace;letter-spacing:.06em;color:var(--accent);display:flex;align-items:center;gap:12px}
.tag::before{content:"";width:15px;height:15px;border-radius:50%%;background:var(--accent)}
.left{position:absolute;left:64px;top:112px;width:560px}
h1{font-weight:800;font-size:52px;line-height:1.1;letter-spacing:-.01em}
.sub{margin-top:28px;font-size:25px;line-height:1.45;color:var(--muted)}
.right{position:absolute;right:64px;top:100px;width:470px;background:var(--panel);border:2px solid var(--line);border-radius:16px;padding:26px 28px}
.big{font-weight:800;font-size:64px;line-height:1;color:var(--accent)}
.big span{font-size:30px;font-weight:700;color:var(--fg);margin-left:10px}
.rev{margin-top:12px;font:500 19px/1 Menlo,monospace;color:var(--muted)}
.ladder{margin-top:22px;border-top:2px solid var(--line);padding-top:18px;display:grid;gap:11px}
.row{display:flex;align-items:center;gap:14px;font:500 18px/1 Menlo,monospace}
.n{width:28px;height:28px;border-radius:50%%;border:2px solid var(--accent);color:var(--accent);text-align:center;line-height:24px;font-size:15px}
.bar{height:10px;border-radius:5px;background:var(--accent);opacity:.85;flex:none}
.cnt{color:var(--muted);font-size:15px;margin-left:10px}
.lbl{color:var(--fg);white-space:nowrap;width:190px}
.foot{position:absolute;left:64px;right:64px;bottom:32px;border-top:2px solid var(--line);padding-top:18px;display:flex;justify-content:space-between;font:500 18px/1 Menlo,monospace;color:var(--muted);letter-spacing:.02em}
</style>
<div class="tag">POST-QUANTUM BLOCKCHAINS</div>
<div class="left"><h1>Which blockchains can sign with <span style="white-space:nowrap">post-quantum</span> keys today?</h1>
<p class="sub">Stage 0 to 5 for every chain, each one checked against primary sources.</p></div>
<div class="right"><div class="big">%d<span>chains tracked</span></div>
<div class="rev">Last reviewed %s</div><div class="rev" style="margin-top:6px">Chains at each stage</div><div class="ladder">%s</div></div>
<div class="foot"><span>balance0014.github.io/post-quantum-blockchains</span><span>by Balance Zhao · @balance0014</span></div>
""" % (W, H, info["chains"], pretty(info["reviewed"]), rows)


def check(info):
    try:
        with open(OUT_JSON, encoding="utf-8") as f:
            old = json.load(f)
    except (OSError, ValueError):
        old = {}
    if any(old.get(k) != info[k] for k in ("chains", "reviewed", "by_stage")):
        print("og image is out of date (have %s/%s, data says %s/%s). Run: python3 scripts/og_image.py"
              % (old.get("chains"), old.get("reviewed"), info["chains"], info["reviewed"]))
        return 1
    print("og image is current")
    return 0


def render(info):
    os.makedirs(OUT_DIR, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "og.html")
        with open(src, "w", encoding="utf-8") as f:
            f.write(html(info))
        subprocess.run([CHROME, "--headless=new", "--user-data-dir=" + os.path.join(tmp, "prof"),
                        "--hide-scrollbars", "--force-device-scale-factor=1",
                        "--window-size=%d,%d" % (W, H), "--screenshot=" + OUT_PNG, "file://" + src],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    for tool, args in (("pngquant", ["--force", "--output", OUT_PNG, "--", OUT_PNG]),
                       ("oxipng", ["-o", "4", "--strip", "safe", OUT_PNG])):
        if shutil.which(tool):
            subprocess.run([tool] + args, check=False)
            break
    with open(OUT_PNG, "rb") as f:
        head = f.read(24)
    w, h = int.from_bytes(head[16:20], "big"), int.from_bytes(head[20:24], "big")
    if (w, h) != (W, H):
        sys.exit("unexpected image size %dx%d" % (w, h))
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump({"chains": info["chains"], "reviewed": info["reviewed"], "by_stage": info["by_stage"], "width": W, "height": H}, f)
        f.write("\n")
    print("%s (%d KB)" % (OUT_PNG, os.path.getsize(OUT_PNG) // 1024))


def main():
    info = load()
    if "--check" in sys.argv[1:]:
        sys.exit(check(info))
    render(info)


if __name__ == "__main__":
    main()
