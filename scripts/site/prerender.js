// Runs app.js once per page in Node, without a browser, and prints the HTML it would put on the page.
// Used by scripts/build_site.py so that every page is readable before (and without) JavaScript.
// Usage: node scripts/site/prerender.js jobs.json   (jobs.json is a list of window.PQ objects)
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const script = new vm.Script(fs.readFileSync(path.join(__dirname, "app.js"), "utf8"), { filename: "app.js" });
const jobs = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const out = jobs.map((data) => {
  const ctx = vm.createContext({ window: { PQ: data }, URL });
  script.runInContext(ctx);
  return ctx.OUT;
});
process.stdout.write(JSON.stringify(out));
