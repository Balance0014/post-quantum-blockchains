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
    # Market-cap ranks as the website reads them (scripts/build_site.py): data/market_cap.json when present.
    mc_path = os.path.join(ROOT, "data", "market_cap.json")
    ranks = None
    if os.path.exists(mc_path):
        with open(mc_path, encoding="utf-8") as f:
            ranks = {x["id"]: x["rank"] for x in json.load(f)["coins"]}
    def rank(c):
        r = ranks.get(c.get("coingecko_id")) if ranks is not None else c.get("mcap_rank")
        return r if r is not None and r <= 100 else None
    top = [c for c in chains if rank(c) is not None]
    return {"chains": len(chains),
            "reviewed": max(c["last_reviewed"] for c in chains if c.get("last_reviewed")),
            "by_stage": [sum(1 for c in chains if c["stage"] == s) for s in range(6)],
            "top_by_stage": [sum(1 for c in top if c["stage"] == s) for s in range(6)]}


def pretty(iso):
    y, m, d = (int(x) for x in iso.split("-"))
    return "%d %s %d" % (d, MONTHS[m - 1][:3], y)


# The site's dark-theme stage colours (scripts/site/style.css) and the text colour that reads on each.
STAGE_BG = ["#3d4045", "#535075", "#6b61a9", "#8f84dd", "#b4adf4", "#dcd9fe"]
STAGE_FG = ["#eeecf6", "#eeecf6", "#eeecf6", "#0f0e18", "#0f0e18", "#0f0e18"]


def html(info):
    top = info["top_by_stage"]
    n_top = sum(top)
    usable = top[4] + top[5]
    segs = "".join(
        '<div class="seg" style="flex:%d 1 0;background:%s;color:%s"><i>%d</i><b>%d</b></div>' % (n, STAGE_BG[s], STAGE_FG[s], s, n)
        for s, n in enumerate(top) if n)
    legend = "".join('<span><i style="background:%s"></i>%d %s</span>' % (STAGE_BG[s], s, label) for s, label in enumerate(STAGES))
    from build_site import LOGO_SVG  # the site's own mark, so the share image and the site carry the same logo
    glyph = LOGO_SVG
    return """<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&family=Space+Grotesk:wght@600&display=block">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:%dpx;height:%dpx;overflow:hidden}
body{font-family:Inter,"Helvetica Neue",sans-serif;color:#eeeef5;background:radial-gradient(900px 500px at 100%% 0%%,#2a2160 0%%,transparent 60%%),#0f0e18;padding:56px 64px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:14px;font:600 21px/1 "JetBrains Mono",Menlo,monospace;letter-spacing:.08em;color:#c3bdff}
.glyph{display:flex}.glyph svg{width:36px;height:36px;display:block}
h1{margin-top:30px;font:600 58px/1.08 "Space Grotesk","Avenir Next",sans-serif;letter-spacing:-.02em;max-width:1000px}
h1 em{font-style:normal;color:#b0a8fc}
.cap{margin-top:34px;font:500 18px/1 "JetBrains Mono",Menlo,monospace;color:#9796a6;letter-spacing:.02em}
.bar{margin-top:14px;display:flex;gap:4px;height:64px}
.seg{border-radius:10px;display:flex;align-items:center;justify-content:center;gap:10px;min-width:70px;font:600 26px/1 "JetBrains Mono",Menlo,monospace}
.seg i{font-style:normal;display:grid;place-items:center;width:28px;height:28px;border-radius:50%%;background:rgba(255,255,255,.16);font-size:15px}
.legend{margin-top:14px;display:flex;gap:26px;font:500 17px/1 Inter,sans-serif;color:#bdbccc}
.legend span{display:flex;align-items:center;gap:8px}.legend i{width:14px;height:14px;border-radius:4px}
.kpis{margin-top:auto;display:flex;gap:64px;align-items:flex-end;border-top:2px solid #292934;padding-top:22px}
.k b{display:block;font:600 40px/1 "JetBrains Mono",Menlo,monospace;color:#eeeef5}.k b small{font-size:22px;color:#9796a6}
.k{flex:none;white-space:nowrap}.k span{display:block;margin-top:8px;font:500 17px/1.25 Inter,sans-serif;color:#bdbccc}
.k.lead b{color:#b0a8fc}
.head{display:flex;justify-content:space-between;align-items:center}.sign{text-align:right;white-space:nowrap;font:500 15px/1.55 "JetBrains Mono",Menlo,monospace;color:#9796a6}
</style>
<div class="head"><div class="brand"><span class="glyph">%s</span>POST-QUANTUM BLOCKCHAINS</div><div class="sign">balance0014.github.io/post-quantum-blockchains<br>by Balance Zhao · @balance0014</div></div>
<h1>Which blockchains can sign with <em>post-quantum keys</em> today?</h1>
<div class="cap">The %d largest blockchains, by stage 0 to 5</div>
<div class="bar">%s</div>
<div class="legend">%s</div>
<div class="kpis"><div class="k lead"><b>%d<small>/%d</small></b><span>largest chains offer it on mainnet</span></div>
<div class="k"><b>%d</b><span>chains tracked</span></div><div class="k"><b>%s</b><span>last checked</span></div></div>
""" % (W, H, glyph, n_top, segs, legend, usable, n_top, info["chains"], pretty(info["reviewed"]))


def check(info):
    try:
        with open(OUT_JSON, encoding="utf-8") as f:
            old = json.load(f)
    except (OSError, ValueError):
        old = {}
    if any(old.get(k) != info[k] for k in ("chains", "reviewed", "by_stage", "top_by_stage")):
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
                        "--virtual-time-budget=8000", "--window-size=%d,%d" % (W, H), "--screenshot=" + OUT_PNG, "file://" + src],
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
        json.dump({"chains": info["chains"], "reviewed": info["reviewed"], "by_stage": info["by_stage"],
                   "top_by_stage": info["top_by_stage"], "width": W, "height": H}, f)
        f.write("\n")
    print("%s (%d KB)" % (OUT_PNG, os.path.getsize(OUT_PNG) // 1024))


def main():
    info = load()
    if "--check" in sys.argv[1:]:
        sys.exit(check(info))
    render(info)


if __name__ == "__main__":
    main()
