/* Post-Quantum Blockchains · page script.
   Each page embeds its data as window.PQ (written by scripts/build_site.py). The page is already readable without
   this script; the script adds filtering, sorting, clickable rows, chart filters and the definitions popover. */
"use strict";
/* scripts/build_site.py also runs this file in Node (no document) to write the same HTML into each page ahead of time. */
const PRE = typeof document === "undefined";
const OUT = {};
/* the build prerenders every page; in the browser the same markup is kept (hydrated) instead of being built again,
   so the first paint stays and the main thread is free. A page without prerendered markup is rendered here. */
const HYD = !PRE && !!document.querySelector("#app > *");
const put = (id, html) => { if (HYD) return; const h = typeof html === "function" ? html() : html; if (PRE) OUT[id] = h; else document.getElementById(id).innerHTML = h; };
const D = window.PQ;
const lang = D.lang;
/* the space before an inline link or a following sentence: none after Chinese full-width punctuation */
const SEP = (s) => (/[。，：；！？、]$/.test(s) ? "" : " ");
const REPO = D.repo;
const URL_FIX = REPO + "/issues/new?template=correction.yml";
const URL_SUBMIT = REPO + "/issues/new?template=new-project.yml";
const fixURL = (c) => c ? `${URL_FIX}&title=${encodeURIComponent("Correction: " + c.name)}&project=${encodeURIComponent(`${c.name} (id: ${c.id})`)}` : URL_FIX;
const href = (p) => D.base + (lang === "zh" ? "zh/" : "") + p;
const chainURL = (id) => href(`chains/${id}/`);
const blob = (path) => `${REPO}/blob/main/${path}`;
const URL_LOG = REPO + "/issues?q=label%3Acorrection";
const bibtex = () => `@misc{pqblockchains_${D.release.version.replace(/\W/g, "")},
  author = {Zhao, Balance},
  title = {Post-Quantum Blockchains},
  version = {${D.release.version}},
  year = {${D.release.date.slice(0, 4)}},
  url = {${D.site_url}},
  note = {Data checked ${D.checked}. Licensed CC BY-NC 4.0}
}`;
const URL_TALK = REPO + "/discussions", URL_X = "https://x.com/balance0014";
/* page hooks: where the language switch should land, and copy-with-confirmation (set up in the browser) */
const TIP = { pos: () => location.hash, copy: () => {} };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const UI = {
  en: {
    nav_chains: "Chains", nav_changes: "This week", nav_x: "On X", nav_method: "Method", gh: "Data on GitHub",
    eyebrow: (d) => `Post-quantum signatures · checked ${d}`,
    verdict: (k, n) => k === 0 ? `None of the ${n} largest blockchains lets holders use a post-quantum signature on mainnet today.`
      : `${k} of the ${n} largest blockchains ${k === 1 ? "lets" : "let"} holders use a <em>post-quantum signature</em> on mainnet today.`,
    verdict_sub: (names, t3) => `${names ? `On mainnet today: ${names}. ` : ""}${t3 ? `Next closest, on a public testnet: ${t3}. ` : ""}Every rating links to a primary source.`,
    kpi_top: "of the largest blockchains offer post-quantum signatures on mainnet",
    who: "For holders and analysts who want to know whether a chain's signatures can resist a quantum attack today.",
    check_l: "Check a coin", check_ph: "Bitcoin, ETH, Algorand…", check_go: "Check",
    big: (names, s, sn) => s >= 4 ? `${names}: yes, stage ${s} of 5 (${sn}).` : `${names}: not yet. Stage ${s} of 5 (${sn}).`,
    scope_eyebrow: (n, d) => `Scope: the ${n} chains in the CoinGecko top 100 that run their own network · checked ${d}`,
    recon: (all, top, others, use, def, opt, k) => `Tracked: ${all} chains = ${top} of the CoinGecko top 100 that run their own network + ${others} others. Usable on mainnet today: ${use} of the ${all} (${def} by default, ${opt} opt-in); among the ${top} largest, ${k}.`,
    recon_dates: (dated, use) => `The timeline dates ${dated} of the ${use}; the rest have no sourced date yet.`,
    recon_mig: (nat, def, names) => `Migration shows ${nat} native rather than ${def}: ${names} still has coins outside its post-quantum chain.`,
    strip_bib: "Copy BibTeX",
    about_h: "About", about_who: "Built and maintained by Balance Zhao, an AI and crypto writer who has researched post-quantum blockchains since 2020.",
    about_money: "Self-funded. Listing is free, no project pays to be listed or rated, and the site carries no sponsors or ads.",
    about_ind: "Stages follow public rules and primary sources that anyone can check. Every data change is a public commit, and corrections are public issues.",
    about_links: "Profiles", ct_list: "To be listed or re-rated, open an issue with a primary source: code at a pinned commit, a release, chain data or the official proposal repository. A project's own statement alone never raises a stage.",
    ct_log: "Public correction log",
    appeal: "Wrong? Report or appeal", appeal_def: "Opens a correction form prefilled with this chain. A stage changes only with a primary source: code, a release, chain data or the official proposal repository.",
    pop_more: "More on the method page",
    holder_h: "For holders", holder_today: "Today", holder_next: "Next step", holder_note: "No one can say when a quantum computer could break today's signatures; this site does not predict it.",
    na_deploy: "Not applicable (not deployed yet)", map_multi: "A chain can appear in more than one row.",
    kpi_use: (d, o) => `of all tracked chains offer post-quantum signatures on mainnet: ${d} by default, ${o} opt-in`,
    kpi_all: "chains tracked, each rated 0 to 5 against primary sources",
    kpi_date: "last checked. Network data weekly, sources monthly",
    ov_title: (n) => `The ${n} largest blockchains by stage`,
    ov_note: (n, d) => `${n} coins with their own network in the CoinGecko top 100, ${d}. Select a stage to filter the table.`,
    ov_seg: (s, nm, c) => `Stage ${s} · ${nm}: ${plural(c, "chain", "chains")}. Show them in the table`,
    ov_count: (c) => plural(c, "chain", "chains"),
    ov_rest: (n) => `The other ${n} are at stage 0 or 1: no formal proposal yet.`,
    mo_title: "Post-quantum milestones per month",
    mo_note: (n, a, b) => `Dated proposals, testnet steps and mainnet steps across all ${n} chains, ${a} to ${b}.`,
    mo_fine: "Entries marked \"checked\" record our own checks, not project events, so they are not counted. The current month runs to the check date.",
    mo_types: ["Proposal", "Testnet", "Mainnet"],
    mo_tip: (m, a) => `${m}: ${plural(a[0], "proposal", "proposals")}, ${a[1]} testnet, ${a[2]} mainnet`,
    list_h: (n) => `All ${n} chains`,
    none: "None", and: " and ",
    search: "Search chains, schemes or tickers", f_all: "All", f_top: "Top 100", f_optin: "Mainnet opt-in", f_native: "Post-quantum native", f_early: "Not on mainnet yet",
    f_label: "Filter by group", sort_label: "Sort",
    stage_chip: (s, nm) => `Stage ${s} · ${nm}`, stage_clear: "Clear the stage filter",
    sort_default: "Biggest chains first", sort_stage_d: "Stage: high to low", sort_stage_a: "Stage: low to high", sort_latest: "Latest change", sort_name: "Name",
    shown: (n, t) => `${n} of ${t} chains`, empty: "No chains match. Clear the search or the filters.",
    th_chain: "Chain", th_stage: "Stage", th_algo: "Algorithm and standard", th_net: "Network", th_latest: "Latest change", th_open: "Open",
    g_top: "The largest blockchains", g_top_s: "CoinGecko top 100 by market cap; only coins with their own network. Most have no post-quantum option yet, and that is worth knowing too.",
    g_optin: "Chains with a mainnet opt-in", g_optin_s: "Launched with classical keys; post-quantum accounts or locking scripts are live on mainnet for holders who choose them.",
    g_native: "Post-quantum native", g_native_s: "Every transfer on mainnet is signed with a post-quantum scheme by default. Check the algorithm and network columns too.",
    g_early: "Not on mainnet yet", g_early_s: "Public code or a public testnet, but no mainnet.",
    k_upgrading: "Upgrading", k_native: "Native", k_early: "Native · testnet",
    rank: (r) => `#${r} by market cap`,
    more: "More", less: "Less",
    blocks_ago: (m) => m < 1 ? "Block was under 1 min old at the check" : `Block was ${Math.round(m)} min old at the check`,
    blocks_short: (m) => m < 1 ? "Latest block · under 1 min ago" : `Latest block · ${Math.round(m)} min ago`,
    no_block: "Endpoint did not respond", no_probe: "No public block endpoint", commits: (n) => `${n.toLocaleString("en-US")} commit${n === 1 ? "" : "s"} in 90 days`, no_repo: "No public node repo found",
    threshold: (m) => `Counts as running while the newest block is under ${m} min old.`,
    queried: "queried",
    st_ok: "Running", st_quiet: "Blocks flowing, code quiet", st_stalled: "Blocks stopped", st_unknown: "Could not check",
    checked_tag: "checked", np_tag: "Not counted", k_supply: "Supply", k_algo_note: "Signing details",
    today_lead: (s) => s === 5 ? "Yes, by default." : s === 4 ? "Yes, if you opt in." : s === 3 ? "Only on a testnet." : "No.",
    xchk_ok: (h, a) => `Independent explorer: block #${h}, ${a} min old.`, xchk_no: "The independent explorer did not answer.", xchk_none: "Only this source shows an old block, and no independent explorer confirms it, so the network is marked “could not check”.",
    own_src: { project: "Read from the project's own node or explorer, not an independent one.", community: "Read from a community-run explorer." },
    e_src: "Sources", e_consensus: "Consensus", e_release: "Latest release", e_code: "Code activity", e_reviewed: "Page checked against sources",
    pre: " (pre-release)", tag_only: " (tag only)", also: "Also",
    lead: "lead",
    stage_names: ["Nothing public", "Research", "Formal proposal", "Testnet", "Mainnet opt-in", "Default"],
    stage_word: "Stage",
    d_back: "All chains", d_today: "Protection today", d_watch: "Watch out for", d_can: "What you can do now", d_next: "What to watch next",
    d_timeline: "Timeline", d_facts: "At a glance", d_stage: "Stage", d_algo: "Algorithm", d_net: "Network", d_checked: "Network checked", d_unv: "Claims we could not verify",
    d_unv_note: "These are left out of the stage until a primary source confirms them.", d_no_tl: "No dated milestones recorded yet. The sources below back the current entry.",
    d_fix: "See something wrong or out of date on this page? Report it with a primary source. We reply within 2 days, usually decide within 3 days, and every change is recorded in the public changelog.",
    d_fix_btn: "Report an error", d_scale: "Where it stands on the 0 to 5 scale",
    q: (nm) => `Is ${nm} quantum-resistant?`,
    answer: (date, nm, n, label) => `As of ${date}, ${nm} is at stage ${n} of 5: ${label}.`,
    answer_src: (stage) => (stage === 0 ? "Where we looked" : "Source"),
    stale: (date, d) => `These claims were last checked on ${date}, ${d} days ago. They may be out of date until the next review.`,
    types: { research: "Research", proposal: "Proposal", code: "Code", testnet: "Testnet", mainnet: "Mainnet", wallet: "Wallet", thirdparty: "Third party", tracker: "Tracker", network: "Network" },
    grades: { primary: "Primary source", official: "Official claim · recorded as a plan", unverified: "Unverified" },
    source: "Source", undated: "Undated", status: "Status",
    c_eyebrow: "This week", c_title: (n, s) => `${n} change${n === 1 ? "" : "s"} logged, ${s === 0 ? "no stage changes" : s + " stage change" + (s === 1 ? "" : "s")}.`,
    c_sub: "Found by the weekly patrol and reviewed by a person before publishing. A stage changes only when a primary source supports it.",
    c_s1: "stage changes", c_s2: "changes logged", c_s3: "chains checked", c_stage: "Stage", c_older: "Earlier issues",
    tracker: "Tracker",
    foot_fix: "The data lives on GitHub. Spot an error, or know a newer milestone? Open a correction with a primary source. We reply within 2 days, and a review decision usually comes within 3 days.",
    foot_btn_fix: "Report an error", foot_btn_submit: "Submit a project", foot_btn_repo: "Open the repository",
    foot_fine: "A tracker, not a forecast. It rates only what is already live, never predicts when today's cryptography might be broken, and says nothing about prices. Stages are never paid for. Data and scripts are public, so anyone can check them.",
    foot_cite: (v, d) => `Version ${v}, ${d}. Data CC BY-NC 4.0 (free commercial use with credit), scripts MIT.`, foot_cite_link: "How to cite", foot_log: "Changelog",
    how_h: "How we rate", toc: "On this page",
    nav_overview: "Overview", nav_timeline: "Timeline", nav_data: "Data & AI", nav_contact: "Contact",
    grp_h: "Browse by group", grp_note: "Pick a group to list its chains in the table below.",
    grp_cta: (n) => `Show ${plural(n, "chain", "chains")}`,
    grp_mix: (a) => `Stage ${a.map(([s, n]) => `${s}: ${n}`).join(" · ")}`,
    net_label: "Network", net_all: "Any status",
    th_since: "On mainnet since", sort_since: "On mainnet since, oldest first",
    since_na: "Not yet sourced", since_basis: { genesis: "genesis block", relaunch: "current mainnet's genesis", activation: "upgrade went live", deployment: "first deployed" },
    d_since: "Post-quantum on mainnet since", since_missing: "We have not yet found a source for the day post-quantum signatures reached this mainnet.",
    since_own: "Project's own statement",
    tl_h: "How post-quantum signatures reached mainnet",
    since_title: "Post-quantum signatures on mainnet, by year",
    since_note: (n, k) => `All ${n} chains at stage 4 or 5. Native chains count from their genesis block, the others from the day the upgrade went live.${k ? ` ${k} still need a sourced date.` : ""}`,
    since_year: (a, t) => `+${a} · ${t} in total`, since_undated: "No sourced date yet",
    since_tip: (nm, d, b) => `${nm} · since ${d}, ${b}`,
    tl_changes: "Every change, week by week",
    how_more: "Read the full method",
    data_h: "Open data for people and AI", data_lede: "Every number on this site comes from public files. Download them, reuse them and cite them.",
    data_dl_h: "Download", data_files: { "chains.csv": "One row per chain, for spreadsheets", "chains.json": "Every chain with its stage, evidence and milestones", "network.json": "The latest weekly network check", "sources.json": "Pinned primary sources" },
    data_ai_h: "For AI assistants", data_ai_p: "llms.txt lists every page and data file in plain text, so AI assistants and AI search can read the tracker and cite the right page.",
    data_llms: "Pages, data files and every chain's stage", data_cite_h: "How to cite", copy: "Copy", copied: "Copied",
    data_lic: "Data CC BY-NC 4.0, free for commercial use with the credit shown. Scripts MIT.",
    ct_h: "Talk to us in public", ct_lede: "Questions, corrections and new projects all go through public channels, so every answer stays on the record.",
    ct: [["Questions and ideas", "GitHub Discussions"], ["Report an error", "GitHub issue, with a primary source"], ["Submit a project", "GitHub issue form"], ["Follow updates", "X · @balance0014"]],
    ct_reply: "We reply within 2 days, and a review decision usually comes within 3 days.",
    any: "Any", group_label: "Group", stage_label: "Stage", fam_label: "Algorithm", search_label: "Search",
    fam: { mldsa: "ML-DSA", falcon: "Falcon", slhdsa: "SLH-DSA", hash: "Other hash-based", other: "Custom or other", none: "None yet" },
    remove: (x) => `Remove filter: ${x}`, clear_all: "Clear all", clear_filters: "Clear all filters",
    empty_h: "No chains match these filters.", empty_p: "Remove a filter or try a different search.",
    nf_q: (q) => `No chain matches “${q}”.`, nf_hint: "Try the English name or the ticker (such as BTC or ETH).",
    keys_h: "What the colours mean",
    fig_src: "Source", fig_checked: (d) => `checked ${d}`, fig_dl: "Download data (CSV)", mcap_src: (d) => `CoinGecko market cap, ${d}`,
    cum_title: "Post-quantum mainnet launches over time",
    cum_note: (n, k, y, u) => `Running total of chains where post-quantum signatures are live on mainnet, each placed on the day they arrived. ${k} of the ${n} arrived in ${y}.${u ? ` ${u} more have no sourced date yet.` : ""}`,
    cum_total: "chains",
    tap_open: "Tap again to open", copy_link: "Copy a link to this section", link_copied: "Link copied",
    grp_more: (n) => `+${n} more`, show_all: (n) => `Show all ${n} chains`, show_less: "Show fewer", sub_h: "Chain not listed?", sub_p: "Request a listing with one primary source: code, a release or chain data. We reply within 2 days.", src_site: "This site's data (each entry links its primary source)", howc: "How the numbers are counted", dym: "Did you mean: ", list_more: (n) => `Show ${n} more`, list_less: "Show fewer",
    th_cov: "Coverage", th_prog: "Latest post-quantum progress",
    prog_n90: (n) => `${n} in the last 90 days`, prog_none: "None recorded here",
    ss: { std: "NIST standard", sel: "NIST-selected, not final", var: "Variant, version not reviewed", hash: "Stateful hash-based", custom: "Own construction", none: "No post-quantum scheme" },
    ss_s: { std: "standard", sel: "selected, not final", var: "variant, not reviewed", hash: "hash-based", custom: "own construction", none: "none" },
    scheme_other: "Own construction",
    level: (a, open) => a === "unassessed" ? "Security level not assessed" : a === "not_stated" ? "Parameter set not stated" : `NIST level ${a.join(" / ")}` + (open && open.length ? ` · ${open.join(", ")} set not stated` : ""),
    hybrid: "Hybrid",
    cov: { default: "Default for new accounts", optin: "Opt-in on mainnet", testnet: "Testnet only", none: "No post-quantum option on mainnet" },
    mig: { native: "No old keys to move", available: "Existing coins can move", testnet: "Moving coins: testnet only", planned: "Moving coins: planned", none: "No way to move coins yet", unknown: "Moving coins: unknown" },
    mig_s: { native: "Native", available: "Available", testnet: "Testnet only", planned: "Planned", none: "None", unknown: "Unknown" },
    audit: { audited: "Audited", partial: "Partly audited", none_found: "No audit found", unknown: "Audit unknown" },
    scope: { top: "Top 100 by market cap", other: "Others" }, design: { native: "Post-quantum native", upgraded: "Added later", notyet: "Not yet" }, early_tag: "Early · testnet only", design_built: "Designed as post-quantum native",
    fl: { custom: "Own construction", var: "Variant not reviewed", noaudit: "No audit found", projdata: "No independent network data" }, proposed: "Proposed, not deployed", netw: { mainnet: "Mainnet", testnet: "Not on mainnet yet" },
    scope_label: "Scope", design_label: "Design", ss_label: "Standard", cov_label: "Coverage", mig_label: "Migration", audit_label: "Audit", netw_label: "Network", net_label2: "Block status", view_label: "Showing",
    more_filters: "More filters", more_bg: "includes background",
    view: { use: "Usable today", close: "Closest", move: "Moving now", quiet: "No progress in a year", broken: "Still accepts broken legacy parameters", custom: "Own construction", claim: "Project's own statement" },
    sort_prog: "Latest progress", sort_n90: "Most progress, 90 days", sort_by: "Sort",
    q5_h: "Five questions for holders", q5_note: "Each card states its rule; its count matches the table it opens.",
    q_use_h: "Post-quantum signatures usable today", q_use_r: "Stage 4 or 5: on mainnet, holders already sign with a post-quantum scheme by default, or can choose one.",
    t_default: "Used by default", t_optin: "Can be chosen",
    q_close_h: "Closest to mainnet", q_close_r: "Stage 3: works on an official public testnet, not yet on mainnet. The next step is shown.",
    q_move_h: "Moving now", q_move_r: (d) => `At least one post-quantum milestone with a primary source in the 90 days to ${d}. Newest first.`,
    q_quiet_h: "No post-quantum progress in the past year", q_quiet_r: (d) => `Top-100 chains at stage 0 or 1 with no post-quantum milestone recorded here in the 12 months to ${d}.`,
    q_risk_h: "Worth a closer look", q_risk_r: "Select a line to list those chains.",
    risk: { broken: "still accept a parameter set that was publicly broken", custom: "use their own construction, or a variant whose version no outside body has reviewed", claim: "rest a key date or their stage on the project's own statement" },
    q_show: (n) => `Show ${plural(n, "chain", "chains")} in the table`, q_more: (n) => `+${n} more`, q_none: "None at the moment.",
    dagger_key: "† The project's own statement (official claim): shown, never used to raise a stage.",
    rng: { all: "All · by year", y2: "2 years · by month", m3: "3 months · by week" }, rng_label: "Range",
    mo_title2: "Post-quantum milestones over time", mo_note2: (n) => `Dated proposals, testnet steps and mainnet steps across all ${n} chains. Empty periods keep their place.`,
    mo_sparse: (y, n) => `Before ${y}, at most ${plural(n, "milestone", "milestones")} a year. Choose “All” to see them.`,
    wk: (d) => `week of ${d}`,
    run_title: "How long post-quantum signatures have run on mainnet", run_note: (d) => `One bar per chain, from the day post-quantum signatures became usable on its current mainnet to ${d}. Earliest first.`,
    run_len: (days) => days >= 365 ? `${(days / 365.25).toFixed(1)} years` : days >= 60 ? `${Math.round(days / 30.44)} months` : plural(days, "day", "days"),
    am_title: "Algorithm map", am_note: (n) => `The ${n} chains at stage 2 or higher, by the mathematical family of the signature they use or propose (NIST\u2019s grouping), coloured by its NIST status.`,
    d_algo_h: "Algorithm", d_cov_h: "Coverage", d_prog_h: "Progress", d_ev_h: "Evidence", d_bg_h: "Background",
    d_bg_note: "Not post-quantum measures. They help judge the rest: a chain that stops producing blocks protects nothing, and market cap shows how much value is at stake.",
    k_status: "Standard status", k_level: "Security level", k_sizes: "Reference sizes", k_hybrid: "Hybrid signature", k_audit: "Audit of the post-quantum code",
    k_new: "New accounts", k_mig: "Coins that already exist", k_expo: "Coins with exposed public keys", k_n90: "Progress in the last 90 days", k_latest: "Latest progress", k_mcap: "Market-cap rank",
    yes: "Yes", no: "No", size_row: (n, pk, sig) => `${n}: public key ${pk.toLocaleString("en-US")} B · signature ${sig.toLocaleString("en-US")} B`,
    size_ref: (r) => `Reference encoding of ${r}; a chain's own encoding can differ.`,
    expo_none: "No reliable data. We cite published research only and do not estimate this ourselves.",
    commits2: (n) => `Main repository: ${n.toLocaleString("en-US")} commit${n === 1 ? "" : "s"} in 90 days (all changes, bots left out)`,
    code_off_gh: (h) => `Code is hosted on ${h}, not GitHub, so commits are not counted.`, mirror: "Official mirror",
    commits_tip: (repo, br, q) => `Repository: github.com/${repo}${br ? `, branch ${br}` : ""}. Every commit on that branch in the 90 days before the check, whatever it changed; commits by bot accounts (logins ending in [bot]) are left out. Queried ${q}.`,
    bg_tag: "background",
    since_dagger: "Date from the project's own statement",
  },
  zh: {
    nav_chains: "链列表", nav_changes: "本周变化", nav_x: "X 上的讨论", nav_method: "评档方法", gh: "数据在 GitHub",
    eyebrow: (d) => `抗量子签名 · 核对于 ${d}`,
    verdict: (k, n) => k === 0 ? `市值最大的 ${n} 条区块链，目前没有一条能让持币人在主网上使用抗量子签名。`
      : `市值最大的 ${n} 条区块链中，今天有 ${k} 条能让持币人在主网上使用<em>抗量子签名</em>。`,
    verdict_sub: (names, t3) => `${names ? `主网上已能用的：${names}。` : ""}${t3 ? `离主网最近、已上公开测试网的：${t3}。` : ""}每个档位都附原始出处。`,
    kpi_top: "市值最大的区块链中，主网已能用抗量子签名",
    who: "写给想知道一条链的签名今天能否抵御量子攻击的持币人和分析师。",
    check_l: "查我的币", check_ph: "比特币、ETH、Algorand…", check_go: "查看",
    big: (names, s, sn) => s >= 4 ? `${names}：能用，第 ${s} 档（${sn}）。` : `${names}：还没有，第 ${s} 档（${sn}）。`,
    scope_eyebrow: (n, d) => `范围：CoinGecko 市值前 100 里有自己网络的 ${n} 条链 · 核对于 ${d}`,
    recon: (all, top, others, use, def, opt, k) => `收录 ${all} 条 = CoinGecko 市值前 100 里有自己网络的 ${top} 条 + 其他 ${others} 条。主网上今天已能用抗量子签名的：${all} 条里有 ${use} 条（默认 ${def} 条、可选 ${opt} 条）；最大的 ${top} 条里有 ${k} 条。`,
    recon_dates: (dated, use) => `时间线标出了这 ${use} 条中 ${dated} 条的上线日期，其余还没有带出处的日期。`,
    recon_mig: (nat, def, names) => `迁移筛选里「原生」是 ${nat} 条而不是 ${def} 条：${names} 还有币不在抗量子链上。`,
    strip_bib: "复制 BibTeX",
    about_h: "关于", about_who: "由 Balance Zhao 制作和维护：AI 与加密内容作者，2020 年起研究抗量子区块链。",
    about_money: "自费运营。收录免费，没有项目为收录或评级付费，本站没有赞助和广告。",
    about_ind: "档位只按公开规则和任何人都能核对的原始出处评定。每次数据变更都是公开提交，纠错走公开 issue。",
    about_links: "主页", ct_list: "要收录或改档，请开 issue 并附原始出处：固定版本的代码、版本发布、链上数据或官方提案仓库。只有项目方自己的说法，不会据此升档。",
    ct_log: "公开的纠错记录",
    appeal: "这条不对？报错或申诉", appeal_def: "打开已预填这条链的纠错表单。只有原始出处（代码、版本发布、链上数据或官方提案仓库）才能改变档位。",
    pop_more: "方法页详解",
    holder_h: "对持币人意味着什么", holder_today: "今天", holder_next: "下一步", holder_note: "没有人能说清量子计算机何时能破解现有签名，本站不做预测。",
    na_deploy: "不适用（尚未部署）", map_multi: "一条链可能出现在多行。",
    kpi_use: (d, o) => `全部收录的链中，主网已能用抗量子签名：默认 ${d} 条、可选 ${o} 条`,
    kpi_all: "条链已收录，每条按原始出处评 0 到 5 档",
    kpi_date: "最近核对。网络数据每周查，出处每月重核",
    ov_title: (n) => `市值最大的 ${n} 条区块链：档位分布`,
    ov_note: (n, d) => `${d} CoinGecko 市值前 100 中有自己网络的 ${n} 个币。点选档位可筛选下方表格。`,
    ov_seg: (s, nm, c) => `第 ${s} 档 · ${nm}：${c} 条。在表格中只看这些`,
    ov_count: (c) => `${c} 条`,
    ov_rest: (n) => `其余 ${n} 条在第 0 或第 1 档，还没有正式提案。`,
    mo_title: "每月抗量子里程碑",
    mo_note: (n, a, b) => `全部 ${n} 条链带日期的提案、测试网和主网进展，${a} 至 ${b}。`,
    mo_fine: "标为「核对于」的条目是本站自己的核查记录，不是项目进展，不计入。本月数据截至核对日。",
    mo_types: ["提案", "测试网", "主网"],
    mo_tip: (m, a) => `${m}：提案 ${a[0]} · 测试网 ${a[1]} · 主网 ${a[2]}`,
    list_h: (n) => `全部 ${n} 条链`,
    none: "暂无", and: "、",
    search: "搜索链名、算法或币种代码", f_all: "全部", f_top: "市值前 100 名", f_optin: "主网可选用", f_native: "原生抗量子", f_early: "还没上主网",
    f_label: "按分组筛选", sort_label: "排序",
    stage_chip: (s, nm) => `第 ${s} 档 · ${nm}`, stage_clear: "清除档位筛选",
    sort_default: "大链在前", sort_stage_d: "档位从高到低", sort_stage_a: "档位从低到高", sort_latest: "最近变化", sort_name: "名称",
    shown: (n, t) => `显示 ${n} / ${t} 条`, empty: "没有符合条件的链。请清除搜索或筛选。",
    th_chain: "链", th_stage: "档位", th_algo: "算法与标准", th_net: "网络", th_latest: "最近一次变化", th_open: "打开",
    g_top: "市值前 100 的区块链", g_top_s: "按 CoinGecko 市值排名前 100，只取有自己网络的币。大多还没有抗量子选项，这本身也值得知道。",
    g_optin: "主网可选抗量子的链", g_optin_s: "上线时使用传统密钥；抗量子账户或锁定脚本已上主网，持币人可自行选用。",
    g_native: "原生抗量子链", g_native_s: "主网上的每笔转账默认使用抗量子签名。请同时留意算法和网络两列。",
    g_early: "还没上主网", g_early_s: "有公开代码或公开测试网，但还没有主网。",
    k_upgrading: "升级中", k_native: "原生", k_early: "原生 · 测试网",
    rank: (r) => `市值第 ${r}`,
    more: "展开", less: "收起",
    blocks_ago: (m) => m < 1 ? "核查时最新区块不到 1 分钟" : `核查时最新区块已出 ${Math.round(m)} 分钟`,
    blocks_short: (m) => m < 1 ? "最新区块 · 不到 1 分钟前" : `最新区块 · ${Math.round(m)} 分钟前`,
    no_block: "接口没有响应", no_probe: "没有公开的出块接口", commits: (n) => `90 天内 ${n.toLocaleString("en-US")} 次提交`, no_repo: "未找到公开的节点代码库",
    threshold: (m) => `最新区块在 ${m} 分钟以内，算正常出块。`,
    queried: "查询时间",
    st_ok: "运行中", st_quiet: "在出块，代码 90 天无提交", st_stalled: "出块停了", st_unknown: "无法核实",
    checked_tag: "核对于", np_tag: "不计入进展", k_supply: "供应说明", k_algo_note: "签名细节",
    today_lead: (s) => s === 5 ? "能，默认就是。" : s === 4 ? "能，需要自己选用。" : s === 3 ? "只在测试网上。" : "不能。",
    xchk_ok: (h, a) => `独立区块浏览器：第 ${h} 号区块，${a} 分钟前。`, xchk_no: "独立区块浏览器没有响应。", xchk_none: "只有这一个来源显示区块过旧，没有独立的区块浏览器可以印证，所以网络状态记为「无法核实」。",
    own_src: { project: "数据来自项目自己的节点或浏览器，不是独立来源。", community: "数据来自社区运营的区块浏览器。" },
    e_src: "出处", e_consensus: "共识机制", e_release: "最新版本", e_code: "代码活跃度", e_reviewed: "本页对照出处核对",
    pre: "（预发布）", tag_only: "（仅有标签，未发正式版本）", also: "另看",
    lead: "线索",
    stage_names: ["无公开进展", "仅有研究", "已有正式提案", "仅限测试网", "主网可选用", "默认抗量子"],
    stage_word: "档位",
    d_back: "全部链", d_today: "当前保护", d_watch: "需要注意", d_can: "现在能做什么", d_next: "接下来关注什么",
    d_timeline: "时间线", d_facts: "速览", d_stage: "档位", d_algo: "算法", d_net: "网络", d_checked: "网络核对", d_unv: "尚未核实的说法",
    d_unv_note: "在原始出处确认之前，这些说法不计入档位。", d_no_tl: "还没有记录带日期的里程碑。当前条目以下方出处为依据。",
    d_fix: "发现本页有误或已过时？请附上原始出处报错。我们 2 天内回复，审核结果一般 3 天内给出，每次修改都记录在公开的更新记录里。",
    d_fix_btn: "报错", d_scale: "在 0 到 5 档中的位置",
    q: (nm) => `${nm}${/[\x00-\x7f]$/.test(nm) ? " " : ""}能抗量子吗？`,
    answer: (date, nm, n, label) => `截至 ${date}，${nm}${/[\x00-\x7f]$/.test(nm) ? " " : ""}处于第 ${n} 档（最高 5 档）：${label}。`,
    answer_src: (stage) => (stage === 0 ? "查过的地方" : "出处"),
    stale: (date, d) => `这些说法最近一次核对是 ${date}，已经过去 ${d} 天，在下次复核前可能已过时。`,
    types: { research: "研究", proposal: "提案", code: "代码", testnet: "测试网", mainnet: "主网", wallet: "钱包", thirdparty: "第三方", tracker: "本站", network: "网络" },
    grades: { primary: "原始出处", official: "官方说法 · 记为计划", unverified: "未核实" },
    source: "出处", undated: "日期不详", status: "状态",
    c_eyebrow: "本周变化", c_title: (n, s) => `本期记录 ${n} 条变化，${s === 0 ? "没有链调整档位" : `${s} 条链调整了档位`}。`,
    c_sub: "由每周自动巡查发现，经人工核对后发布。只有原始出处支持时，才会调整档位。",
    c_s1: "次档位调整", c_s2: "条变化", c_s3: "条链已核对", c_stage: "档位", c_older: "往期",
    tracker: "本站",
    foot_fix: "数据公开在 GitHub 上。发现错误，或掌握更新的进展？请附上原始出处提交纠错。我们 2 天内回复，审核结果一般 3 天内给出。",
    foot_btn_fix: "报错", foot_btn_submit: "申请收录", foot_btn_repo: "打开代码库",
    foot_fine: "本站是进度追踪，不做预测：只按已经上线的内容评档，不预测量子计算机何时能破解现有密码，也不评论币价。档位不能花钱买。数据和脚本全部公开，谁都可以复核。",
    foot_cite: (v, d) => `版本 ${v}，${d}。数据采用 CC BY-NC 4.0 许可（署名后可免费商用），脚本采用 MIT 许可。`, foot_cite_link: "如何引用", foot_log: "更新记录",
    how_h: "如何评档", toc: "本页目录",
    nav_overview: "总览", nav_timeline: "时间线", nav_data: "数据与 AI", nav_contact: "联系",
    grp_h: "按分组浏览", grp_note: "选一个分组，下方表格只列这一组的链。",
    grp_cta: (n) => `查看这 ${n} 条链`,
    grp_mix: (a) => a.map(([s, n]) => `${s} 档 ${n}`).join(" · "),
    net_label: "网络", net_all: "全部状态",
    th_since: "抗量子主网起始", sort_since: "抗量子主网起始，从早到晚",
    since_na: "尚未找到出处", since_basis: { genesis: "创世区块", relaunch: "现行主网的创世区块", activation: "升级生效", deployment: "首次部署" },
    d_since: "抗量子签名上主网的日期", since_missing: "还没有找到出处，能确认抗量子签名是哪一天在这条链的主网上可用的。",
    since_own: "项目方说法",
    tl_h: "抗量子签名是怎样一步步上主网的",
    since_title: "抗量子签名上主网的年份",
    since_note: (n, k) => `第 4、5 档的全部 ${n} 条链。原生链从创世区块算起，其他链从升级生效当天算起。${k ? `另有 ${k} 条还没有找到带出处的日期。` : ""}`,
    since_year: (a, t) => `新增 ${a} · 累计 ${t}`, since_undated: "尚无带出处的日期",
    since_tip: (nm, d, b) => `${nm} · ${d} 起，${b}`,
    tl_changes: "每周变化记录",
    how_more: "阅读完整的评档方法",
    data_h: "开放数据，人和 AI 都能直接用", data_lede: "本站每个数字都来自公开文件，可以下载、复用和引用。",
    data_dl_h: "下载", data_files: { "chains.csv": "每条链一行，可用表格软件打开", "chains.json": "每条链的档位、依据和里程碑", "network.json": "最近一次每周网络巡查", "sources.json": "固定版本的原始出处" },
    data_ai_h: "给 AI 助手", data_ai_p: "llms.txt 用纯文本列出全部页面和数据文件，方便 AI 助手和 AI 搜索读取本站、引用正确的页面。",
    data_llms: "页面、数据文件和每条链的档位", data_cite_h: "如何引用", copy: "复制", copied: "已复制",
    data_lic: "数据采用 CC BY-NC 4.0 许可，按要求署名即可免费商用；脚本采用 MIT 许可。",
    ct_h: "通过公开渠道联系我们", ct_lede: "提问、纠错、提交新项目都走公开渠道，每条回复都留有记录。",
    ct: [["提问和建议", "GitHub Discussions"], ["报错", "GitHub issue，请附原始出处"], ["申请收录", "GitHub issue 表单"], ["关注更新", "X · @balance0014"]],
    ct_reply: "我们 2 天内回复，审核结果一般 3 天内给出。",
    any: "全部", group_label: "分组", stage_label: "档位", fam_label: "算法", search_label: "搜索",
    fam: { mldsa: "ML-DSA", falcon: "Falcon", slhdsa: "SLH-DSA", hash: "其他哈希签名", other: "自研或其他", none: "尚无" },
    remove: (x) => `移除筛选：${x}`, clear_all: "全部清除", clear_filters: "清除全部筛选",
    empty_h: "没有符合这些条件的链。", empty_p: "去掉一个筛选条件，或换个搜索词试试。",
    nf_q: (q) => `没有找到「${q}」。`, nf_hint: "试试英文名、代号（如 BTC、ETH），或中文名的拼音首字母（如狗狗币打 ggb）。",
    keys_h: "颜色说明",
    fig_src: "来源", fig_checked: (d) => `核对于 ${d}`, fig_dl: "下载数据（CSV）", mcap_src: (d) => `CoinGecko 市值，${d}`,
    cum_title: "抗量子主网上线时间线",
    cum_note: (n, k, y, u) => `主网上已能用抗量子签名的链，按上线当天累计，每条链一个点。${n} 条中有 ${k} 条是 ${y} 年上线的。${u ? `另有 ${u} 条尚未找到带出处的日期。` : ""}`,
    cum_total: "条",
    tap_open: "再点一次打开", copy_link: "复制本节链接", link_copied: "链接已复制",
    grp_more: (n) => `另有 ${n} 条`, show_all: (n) => `显示全部 ${n} 条`, show_less: "收起", sub_h: "没找到你的链？", sub_p: "附一个原始出处（代码、版本发布或链上数据）就能申请收录。2 天内回复。", src_site: "本站数据（每条附原始出处）", howc: "数字怎么算的", dym: "你是不是要找：", list_more: (n) => `展开其余 ${n} 条`, list_less: "收起",
    th_cov: "覆盖", th_prog: "最近一次抗量子进展",
    prog_n90: (n) => `近 90 天 ${n} 条`, prog_none: "本站未收录",
    ss: { std: "NIST 标准", sel: "NIST 选定、未定稿", var: "变体，版本未审", hash: "有状态哈希签名", custom: "项目自研", none: "尚无抗量子方案" },
    ss_s: { std: "标准", sel: "选定未定稿", var: "变体·版本未审", hash: "哈希签名", custom: "自研", none: "无" },
    scheme_other: "项目自研方案",
    level: (a, open) => a === "unassessed" ? "强度等级未评估" : a === "not_stated" ? "未写明参数集" : `NIST 强度等级 ${a.join(" / ")}` + (open && open.length ? ` · ${open.join("、")} 未写明参数集` : ""),
    hybrid: "混合签名",
    cov: { default: "新账户默认", optin: "主网可选用", testnet: "仅限测试网", none: "主网上还不能用" },
    mig: { native: "原生链，没有旧密钥要迁移", available: "已有的币可以迁移", testnet: "迁移：仅限测试网", planned: "迁移：计划中", none: "还没有迁移办法", unknown: "迁移：情况不明" },
    mig_s: { native: "原生", available: "可迁移", testnet: "仅测试网", planned: "计划中", none: "没有", unknown: "不明" },
    audit: { audited: "已审计", partial: "部分审计", none_found: "未找到审计", unknown: "审计情况不明" },
    scope: { top: "市值前 100 名", other: "其他" }, design: { native: "原生抗量子", upgraded: "后来加上", notyet: "还没有" }, early_tag: "早期 · 只有测试网", design_built: "设计为原生抗量子",
    fl: { custom: "自研方案", var: "变体未审", noaudit: "未找到审计", projdata: "无独立出块数据" }, proposed: "提案中，未部署", netw: { mainnet: "主网", testnet: "还没上主网" },
    scope_label: "范围", design_label: "设计", ss_label: "标准状态", cov_label: "覆盖", mig_label: "迁移路径", audit_label: "审计", netw_label: "网络", net_label2: "出块状态", view_label: "正在看",
    more_filters: "更多筛选", more_bg: "含背景信息",
    view: { use: "今天已能用", close: "最接近的", move: "正在推进", quiet: "近一年没有进展", broken: "仍接受已被攻破的旧参数", custom: "项目自研", claim: "只有项目方说法" },
    sort_prog: "最近进展", sort_n90: "近 90 天进展最多", sort_by: "排序",
    q5_h: "持币人关心的五个问题", q5_note: "每张卡片都写明规则，数字和点开后的表格一致。",
    q_use_h: "今天已经能用上抗量子签名", q_use_r: "第 4、5 档：主网上已默认使用抗量子签名，或持币人可以选用。",
    t_default: "已默认使用", t_optin: "可选使用",
    q_close_h: "最接近的", q_close_r: "第 3 档：官方公开测试网上已能用，主网还没有。下面写了下一步。",
    q_move_h: "正在推进", q_move_r: (d) => `截至 ${d} 的 90 天内，至少有一条带原始出处的抗量子进展。最近的在前。`,
    q_quiet_h: "近一年没有抗量子进展", q_quiet_r: (d) => `市值前 100、处于第 0 或第 1 档，截至 ${d} 的 12 个月内本站没有收录任何抗量子进展的链。`,
    q_risk_h: "值得多看一眼", q_risk_r: "点选一行，在表格中列出这些链。",
    risk: { broken: "仍接受某组已被公开攻破的参数", custom: "使用项目自研方案，或版本未经外部评估的变体", claim: "关键日期或档位只以项目方说法为依据" },
    q_show: (n) => `在表格中查看这 ${n} 条`, q_more: (n) => `另有 ${n} 条`, q_none: "目前没有。",
    dagger_key: "† 项目方自己的说法（官方说法）：会列出，但不据此升档。",
    rng: { all: "全部 · 按年", y2: "近 2 年 · 按月", m3: "近 3 个月 · 按周" }, rng_label: "范围",
    mo_title2: "抗量子里程碑数量", mo_note2: (n) => `全部 ${n} 条链带日期的提案、测试网和主网进展。没有进展的时段也留着位置。`,
    mo_sparse: (y, n) => `${y} 年以前每年最多 ${n} 件，选「全部」可以看到。`,
    wk: (d) => `${d} 当周`,
    run_title: "抗量子签名在主网上运行了多久", run_note: (d) => `每条链一根条，从抗量子签名在现行主网可用的那天起，到 ${d} 为止。最早的在上。`,
    run_len: (days) => days >= 365 ? `${(days / 365.25).toFixed(1)} 年` : days >= 60 ? `${Math.round(days / 30.44)} 个月` : `${days} 天`,
    am_title: "算法版图", am_note: (n) => `第 2 档及以上的 ${n} 条链，按所用或提议的签名所属的数学家族分行（按 NIST 的分法），颜色表示它在 NIST 的状态。`,
    d_algo_h: "算法", d_cov_h: "覆盖", d_prog_h: "进展", d_ev_h: "证据", d_bg_h: "背景",
    d_bg_note: "这些不是抗量子指标，只帮助判断其他信息：出块停了的链谈不上保护，市值说明有多少价值面临风险。",
    k_status: "标准状态", k_level: "强度等级", k_sizes: "参考大小", k_hybrid: "混合签名", k_audit: "抗量子代码的审计",
    k_new: "新账户", k_mig: "已有的币", k_expo: "公钥已暴露的币", k_n90: "近 90 天进展", k_latest: "最近一次进展", k_mcap: "市值排名",
    yes: "是", no: "否", size_row: (n, pk, sig) => `${n}：公钥 ${pk.toLocaleString("en-US")} 字节 · 签名 ${sig.toLocaleString("en-US")} 字节`,
    size_ref: (r) => `${r} 的参考编码大小；各链自己的编码可能不同。`,
    expo_none: "暂无可靠数据。本站只引用已发表的研究，不自行估算。",
    commits2: (n) => `主仓库 90 天提交 ${n.toLocaleString("en-US")} 次（全部改动，不含机器人）`,
    code_off_gh: (h) => `代码托管在 ${h}，不在 GitHub，没有统计提交次数。`, mirror: "官方镜像",
    commits_tip: (repo, br, q) => `代码库：github.com/${repo}${br ? `，${br} 分支` : ""}。核查日之前 90 天该分支上的每次提交，不论改了什么；机器人账户（用户名以 [bot] 结尾）的提交不计。查询时间 ${q}。`,
    bg_tag: "背景",
    since_dagger: "日期来自项目方说法",
  },
};

/* One sentence for every label on the page. */
/* what people with a public identity say on X about a chain's quantum plans */
Object.assign(UI.en, {
  xt_h: "Quantum discussion on X", xt_note: "These are claims. They do not count toward the stage.", xt_post: "Post", xt_checked: (d) => `original post checked ${d}`,
  xt_type: { plan: "Plan or timeline", proposal: "Proposal", release: "Release", research: "Research", statement: "Statement" },
  /* the home card and the x/ page: every number is counted at build time from data/chains.json */
  kpi_x: (n) => ["of all tracked chains had an official account or a core figure ", "post about their quantum plans on X", ` in the last 90 days: ${n} original posts, each opened and checked`],
  kpi_x_go: "See the posts on X", kpi_x_note: "Claims only; they never change a stage.",
  kpi_date_line: (d) => `Last checked ${d} · network data weekly, sources monthly`,
  x_eyebrow: (d) => `Discussion on X · 90 days to ${d}`, x_title: "What blockchains say about their quantum plans on X",
  x_lede: "Posts by official accounts and by people with a public identity and a stated role around a chain. We opened every original post and recorded the date we checked it. These are claims: they never set or change a stage.",
  x_s: ["chains", "accounts", "original posts", "in the last 30 days"],
  x_fact: (c, u, r, br, top, tt, tu) => `Of the ${c} chains with posts here, ${u} offer post-quantum signatures on mainnet and ${r} do not yet (${br}). Of the ${top} largest blockchains, ${tt} are discussed on X, and ${tu} of those offer post-quantum signatures on mainnet.`,
  x_stage_short: ["nothing public", "research", "formal proposal", "testnet"],
  x_all: "All", x_count: (n) => `${n} ${n === 1 ? "post" : "posts"}`, x_filter: "Type of post",
  x_rule: "We include only official accounts and people with a public identity and a stated role around the chain. Ordinary users are not named, and questions from holders are not published.",
  x_rule_link: "How we collect posts on X",
  xt_new_h: "New on X", xt_new_p: "Posts by people with a public identity about a chain's quantum plans, checked against the original post. Claims only: they never change a stage.",
});
Object.assign(UI.zh, {
  xt_h: "X 上的抗量子讨论", xt_note: "这些是说法，不计入档位。", xt_post: "原帖", xt_checked: (d) => `原帖核对于 ${d}`,
  xt_type: { plan: "计划或时间表", proposal: "提案讨论", release: "上线", research: "研究", statement: "表态" },
  kpi_x: (n) => ["全部收录的链中，近 90 天有官方号或核心人物", "在 X 上谈抗量子", `：${n} 条原帖，逐条打开核对`],
  kpi_x_go: "看 X 上的讨论", kpi_x_note: "只算说法，不计入档位",
  kpi_date_line: (d) => `最近核对 ${d} · 网络数据每周查，出处每月重核`,
  x_eyebrow: (d) => `X 上的讨论 · 截至 ${d} 的 90 天`, x_title: "各条链在 X 上怎么谈抗量子",
  x_lede: "官方号，以及有公开身份、和这条链关系明确的人发的帖子。每一条都打开原帖核对，并记下核对日期。这些都只是说法，不决定也不改变档位。",
  x_s: ["条链", "个账号", "条原帖", "近 30 天"],
  x_fact: (c, u, r, br, top, tt, tu) => `这 ${c} 条链里，主网已能用抗量子签名的 ${u} 条，还不能用的 ${r} 条（${br}）；市值最大的 ${top} 条里有 ${tt} 条在 X 上谈，其中主网能用的 ${tu} 条。`,
  x_stage_short: ["无公开进展", "仅有研究", "已有正式提案", "仅限测试网"],
  x_all: "全部", x_count: (n) => `${n} 条`, x_filter: "帖子类型",
  x_rule: "只收官方号，以及有公开身份、和这条链关系明确的人。普通用户不写名字，持币人的追问不上网站。",
  x_rule_link: "X 上的讨论怎么收录",
  xt_new_h: "X 上的新动态", xt_new_p: "有公开身份的人谈某条链量子计划的帖子，都已打开原帖核对。只算说法，不改变档位。",
});
/* the algorithm map: NIST families and statuses */
Object.assign(UI.en, {
  nfam: { lattice: "Lattice-based", hash: "Hash-based", multivariate: "Multivariate", code: "Code-based", isogeny: "Isogeny-based", mpcith: "MPC-in-the-Head", symmetric: "Symmetric-based", other: "Other" },
  nist: { fips: "NIST standard (FIPS 204/205)", draft: "NIST-selected, standard in development (FN-DSA)", sp800208: "NIST stateful hash-based standard (SP 800-208)", round3: "Round 3 candidate, NIST additional signatures", dropped: "Dropped by NIST after round 3 (2022)", broken: "Publicly broken at every parameter set", notnist: "Not submitted to NIST" },
  nist_var: "variant or version not reviewed by NIST", nist_h: "NIST status on the algorithm map", nist_p: "The map groups schemes by NIST\u2019s mathematical families and colours them by where each stands at NIST. A variant keeps the colour of the scheme it varies and gets a dashed outline.", nist_cols: ["Status", "What it means", "NIST record"], nist_var_k: "Dashed: variant, version not reviewed", nist_own: "own construction",
  nist_rainbow: "NIST judged all submitted parameter sets below their security targets, and the Rainbow-I (SL1) parameters can be practically broken; no source says the scheme fails at every parameter set. Each chain's parameters are on its chain page", nist_wots: "a part of XMSS and SLH-DSA, not a NIST standard on its own",
  nist_snova: "SNOVA: a key-recovery attack published on 2026-09-22 (Beullens and Hess, ePrint 2026/2154) breaks its six odd-characteristic alternative parameter sets; the recommended q=16 sets are not affected.",
  nist_next: "NIST status as of 2026-11-28. FN-DSA (FIPS 206) has no final version yet. Round 3 of the additional-signature call began on 2026-05-14 with 9 candidates (8 after HAWK withdrew); NIST expects it to take about two years, and the next NIST PQC standardization conference is planned for spring or summer 2027.",
});
Object.assign(UI.zh, {
  nfam: { lattice: "格", hash: "哈希", multivariate: "多变量", code: "编码", isogeny: "同源", mpcith: "MPC-in-the-Head", symmetric: "对称", other: "其他" },
  nist: { fips: "NIST 正式标准（FIPS 204/205）", draft: "NIST 已选定、标准制定中（FN-DSA）", sp800208: "NIST 有状态哈希签名标准（SP 800-208）", round3: "NIST 附加签名第 3 轮候选", dropped: "NIST 第 3 轮后落选（2022）", broken: "任何参数下都已被公开攻破", notnist: "没有提交 NIST" },
  nist_var: "变体，或 NIST 没有审查过的版本", nist_h: "算法版图上的 NIST 状态", nist_p: "版图按 NIST 的数学家族给方案分行，按各自在 NIST 的进度上色。变体沿用所变方案的颜色，加虚线框。", nist_cols: ["状态", "含义", "NIST 记录"], nist_var_k: "虚线框：变体，版本未审", nist_own: "项目自研",
  nist_rainbow: "NIST 判定全部提交参数组都低于目标强度，其中 Rainbow-I（SL1）参数可被实际攻破；没有来源说这个方案在任何参数下都被攻破。各链现用的参数见链详情页", nist_wots: "是 XMSS 和 SLH-DSA 的组成部分，单独使用不是 NIST 标准",
  nist_snova: "SNOVA：2026-09-22 公布的密钥恢复攻击（Beullens 和 Hess，ePrint 2026/2154）攻破了它的 6 组奇数特征备选参数；推荐的 q=16 参数不受影响。",
  nist_next: "NIST 状态截至 2026-11-28。FN-DSA（FIPS 206）还没有正式版。附加签名征集第 3 轮于 2026-05-14 开始，共 9 个候选（HAWK 退出后剩 8 个）；NIST 预计第 3 轮约需两年，下一届 NIST 抗量子密码标准化会议计划在 2027 年春夏举行。",
});
/* data page, embeds and license: strings kept together so both languages stay in step */
Object.assign(UI.en, {
  dp_eyebrow: "Data & AI", dp_h: "Data, API and embeds", dp_lede: "Everything on this site is public: download the files, read them as a JSON API, or embed a live badge or card for any chain. Free for commercial use when you show the credit.",
  dp_toc: [["files", "Download"], ["api", "API"], ["fields", "Fields"], ["embed", "Embed"], ["license", "License"], ["cite", "Cite"]],
  api_h: "API", api_p: "Plain JSON files on GitHub Pages: no key, no rate limit beyond GitHub's own, and open to any website (CORS is allowed). They are rebuilt from the data on every update.",
  api_cols: ["Request", "Returns"],
  api_rows: [["data/chains/index.json", "Every chain in one short list: id, name, stage, group, rank, review date and the link to its own file"], ["data/chains/{id}.json", "One chain: stage, algorithm and standard status per scheme, coverage, migration, audit, mainnet start date, the sentence its stage rests on with the source, page, badge and card links, credit and license"], ["data/chains.json", "The full dataset as we maintain it, with milestones and sources"], ["data/chains.csv", "One row per chain, for spreadsheets"], ["data/network.json", "The latest weekly network check"], ["llms.txt", "A plain-text summary for AI assistants"]],
  api_ex: "Example", api_freq: (v) => `Updates: network data weekly, sources monthly, and whenever a correction is merged. Each file carries the version (now ${v}) and the date its data was checked. A field is only ever added, not renamed or removed, within schema version 1.`,
  fields_h: "Fields of data/chains/{id}.json", fields_cols: ["Field", "Meaning"],
  fields_rows: [["stage, stage_name", "0 to 5, see the method page; the name in English and Chinese"], ["group", "`top` (CoinGecko top 100), `optin` (mainnet opt-in), `native` (post-quantum native), `early` (no mainnet yet)"], ["schemes", "Each signature scheme with its status: `std` (NIST standard), `sel` (NIST-selected, not final), `var` (variant, version not reviewed), `hash` (stateful hash-based, NIST SP 800-208), `custom` (own construction), `none`"], ["coverage", "`default`, `optin`, `testnet` or `none`: who can use post-quantum signatures today"], ["migration, audit", "How existing coins move; whether the post-quantum code has an outside audit"], ["post_quantum_mainnet_since", "The day post-quantum signatures became usable on the current mainnet, or `null`"], ["basis, basis_source", "The sentence the stage rests on, and its primary source"], ["last_reviewed, data_checked", "When a person last reviewed this chain; when the network data was read"], ["page, badge, card", "Links in English and Chinese"], ["attribution, license", "The credit to show and the terms"]],
  emb_h: "Embed a live badge or card", emb_p: "Pick a chain. The badge and card are images served by this site, so they always show the current stage and check date. Both carry the credit, so they meet the license on their own.",
  emb_chain: "Chain", emb_lang: "Language", emb_badge: "Badge", emb_card: "Card", emb_md: "Markdown badge (README)", emb_html: "HTML badge", emb_cardc: "HTML card with credit",
  emb_page_h: "Embed this chain", emb_page_p: "Put this chain's live badge or card in a README or on a website. It updates itself and carries the credit.", emb_more: "More embeds and the license",
  lic_h: "License", lic_p: "Data, charts and text: CC BY-NC 4.0 from version 0.5.0. Scripts: MIT. Commercial use is free when all three conditions are met:",
  lic_list: ["Every screen that uses the data shows the credit below with both links, or the official badge or card. A credit only in a footer or an about page does not count.", "The check date is shown, and your copy is updated at least once a week.", "The use is registered in a “Used by” issue. Registered products are listed in the README."],
  lic_credit: "Credit to show", lic_other: "Can't meet the conditions? Ask in a GitHub issue or by direct message on X. Versions up to 0.4.0 stay under CC BY 4.0.", lic_reg: "Register a use", lic_full: "Full license",
  credit: "Data: Post-Quantum Blockchains, by Balance Zhao",
});
Object.assign(UI.zh, {
  dp_eyebrow: "数据与 AI", dp_h: "数据、接口和嵌入", dp_lede: "本站的一切都公开：可以下载文件、按 JSON 接口读取，也可以给任意一条链嵌入实时更新的徽章或卡片。按要求署名即可免费商用。",
  dp_toc: [["files", "下载"], ["api", "接口"], ["fields", "字段"], ["embed", "嵌入"], ["license", "授权"], ["cite", "引用"]],
  api_h: "接口", api_p: "放在 GitHub Pages 上的纯 JSON 文件：不用密钥，除 GitHub 自身的限制外不限频，任何网站都能直接读取（允许跨域）。每次更新都按数据重新生成。",
  api_cols: ["请求", "返回内容"],
  api_rows: [["data/chains/index.json", "全部链的简表：编号、名称、档位、分组、市值排名、核对日期和单条文件的链接"], ["data/chains/{id}.json", "单条链：档位、算法和每个方案的标准状态、覆盖范围、迁移、审计、主网起始日期、档位依据和出处、页面、徽章和卡片链接、署名和授权"], ["data/chains.json", "我们维护的完整数据集，含里程碑和出处"], ["data/chains.csv", "每条链一行，可用表格软件打开"], ["data/network.json", "最近一次每周网络巡查"], ["llms.txt", "给 AI 助手的纯文本摘要"]],
  api_ex: "示例", api_freq: (v) => `更新频率：网络数据每周查，出处每月重核，合并纠错时随时更新。每个文件都带版本号（现在是 ${v}）和数据核对日期。在第 1 版结构内，字段只增加，不改名、不删除。`,
  fields_h: "data/chains/{id}.json 的字段", fields_cols: ["字段", "含义"],
  fields_rows: [["stage、stage_name", "0 到 5 档，见评档方法；中英文档位名"], ["group", "`top`（CoinGecko 市值前 100）、`optin`（主网可选用）、`native`（原生抗量子）、`early`（还没有主网）"], ["schemes", "每个签名方案及其状态：`std`（NIST 标准）、`sel`（NIST 选定、未定稿）、`var`（变体，版本未审）、`hash`（有状态哈希签名，NIST SP 800-208）、`custom`（项目自研）、`none`（尚无）"], ["coverage", "`default`、`optin`、`testnet` 或 `none`：今天谁能用上抗量子签名"], ["migration、audit", "已有的币怎样迁移；抗量子代码有没有外部审计"], ["post_quantum_mainnet_since", "抗量子签名在现行主网上可用的日期，没有则为 `null`"], ["basis、basis_source", "档位依据的那句话及其原始出处"], ["last_reviewed、data_checked", "人工最近一次复核这条链的日期；读取网络数据的日期"], ["page、badge、card", "中英文页面、徽章和卡片的链接"], ["attribution、license", "要显示的署名和授权条款"]],
  emb_h: "嵌入实时徽章或卡片", emb_p: "选一条链。徽章和卡片是本站提供的图片，档位和核对日期总是最新的；两者都自带署名，单用就满足授权要求。",
  emb_chain: "链", emb_lang: "语言", emb_badge: "徽章", emb_card: "卡片", emb_md: "Markdown 徽章（README 用）", emb_html: "HTML 徽章", emb_cardc: "带署名的 HTML 卡片",
  emb_page_h: "嵌入这条链", emb_page_p: "把这条链的实时徽章或卡片放进 README 或网站。它会自动更新，并且自带署名。", emb_more: "更多嵌入方式和授权说明",
  lic_h: "授权", lic_p: "从 0.5.0 版起，数据、图表和文字采用 CC BY-NC 4.0，脚本采用 MIT。满足下面三个条件即可免费商用：",
  lic_list: ["用到数据的每一屏都显示下面这条带两个链接的署名，或者直接用官方徽章或卡片。只放在页脚或「关于」页不算。", "标出核对日期，并且至少每周同步一次。", "开一个「Used by」issue 登记用途，登记过的产品会列在 README 里。"],
  lic_credit: "要显示的署名", lic_other: "做不到这些条件？请在 GitHub issue 里或在 X 上私信联系。0.4.0 及更早的版本仍按 CC BY 4.0。", lic_reg: "登记用途", lic_full: "完整授权条款",
  credit: "数据来源：Post-Quantum Blockchains，作者 Balance Zhao",
});
const DEFS = {
  en: {
    pqsig: "A digital signature designed to resist attacks by large quantum computers, such as ML-DSA, Falcon or SLH-DSA. A holder signs with one to authorize a transfer.",
    f_group: "Top 100: the largest coins with their own network. Mainnet opt-in: stage 4 chains that launched with classical keys. Post-quantum native: post-quantum signatures by default. Early: no mainnet yet.",
    f_fam: "The post-quantum signature family a chain uses or proposes. NIST selected ML-DSA (Dilithium), Falcon and SLH-DSA (SPHINCS+). Other hash-based schemes include XMSS and WOTS+. Custom or other covers schemes without an outside standard.",
    stage: [
      "No public post-quantum research, roadmap or proposal from the core developers, the foundation or the main client teams.",
      "Official research, a roadmap, an open proposal or prototype code from the core developers, the foundation or the main client teams exists, but nothing is merged into the official proposal repository yet. Outside contributors' proposals are shown on the timeline and do not set a stage.",
      "A quantum-related protocol change is merged into the official proposal repository (BIP, EIP, ZIP and so on) at Draft status or later. A chain with no public proposal process counts a formal protocol specification published by its core team.",
      "On the chain's official public testnet, holders can authorize a transfer with a post-quantum signature.",
      "On mainnet, holders can choose post-quantum protection for their funds at the protocol level.",
      "New accounts use post-quantum signatures by default, or transfers require them.",
    ],
    g_top: "Coins in the CoinGecko top 100 by market cap that pay fees or secure consensus on a network of their own, layer 1 or layer 2. Stablecoins, wrapped and staked tokens, and exchange, app or meme tokens without their own chain are left out.",
    g_optin: "Chains that launched with classical keys and now let holders choose post-quantum protection on mainnet (stage 4).",
    g_native: "Chains whose mainnet signs every transfer with a post-quantum scheme by default.",
    g_early: "Projects with public code or a running testnet, and at least one sign of activity, but no mainnet running yet.",
    k_upgrading: "Launched with classical signatures. Any post-quantum protection is being added afterwards.",
    k_native: "Built post-quantum: transfers on mainnet use a post-quantum scheme by default.",
    k_early: "Built post-quantum, but only a testnet or devnet is running.",
    st_ok: "The newest block is recent, and the main public repository had commits in the last 90 days (or no repository is tracked).",
    st_quiet: "The newest block is recent, but the main public repository had no commits in the last 90 days.",
    st_stalled: "The chain's endpoint and an independent explorer both show a newest block older than the limit: 10 minutes, or six target block times for chains whose target block time is over 100 seconds.",
    st_unknown: "The block endpoint did not answer, the chain has no public endpoint, or the endpoint shows an old block and no independent explorer confirms it. We record that instead of guessing.",
    chips: {
      fips204: "ML-DSA as published in NIST FIPS 204 (August 2024).",
      fips205: "SLH-DSA as published in NIST FIPS 205 (August 2024).",
      falcon: "Falcon was selected by NIST and is being standardized as FN-DSA (FIPS 206, not final yet).",
      xmss: "XMSS, a stateful hash-based signature standardized in IETF RFC 8391.",
      family: "From a NIST-selected family, but a pre-standard version (such as round-3 Dilithium) or a parameter set not reviewed here.",
      sphincs: "SPHINCS+, the submission NIST standardized as SLH-DSA. Pre-standard versions differ in details.",
      wots: "A hash-based one-time signature such as WOTS+. It is a building block of standards like XMSS, not a standard on its own.",
      nonstd: "Not standardized by NIST or the IETF.",
      custom: "A construction designed by the project itself, without an outside standard.",
      broken: "The protocol still accepts a parameter set that was publicly broken; the chain page names it. A chain that used such parameters only in the past does not get this label.",
      none: "The chain has no post-quantum signature scheme yet.",
    },
    grades: {
      primary: "Running code, releases, chain parameters read from an official endpoint, or the official proposal repository. Only these can set a stage.",
      official: "Project websites, blogs and roadmaps. Shown on the timeline, never used to raise a stage.",
      unverified: "Media and third-party claims. Listed apart until a primary source confirms them.",
    },
    types: {
      research: "Papers, research posts, forum threads and roadmaps.", proposal: "A formal improvement proposal (BIP, EIP and so on), open or merged.",
      code: "Implementation work in a node client or library.", testnet: "Something running on a public testnet.", mainnet: "Something running on mainnet.",
      wallet: "Wallet support.", thirdparty: "Wallets, vaults or contracts built by others. Recorded, never rated.", tracker: "A note from this tracker.",
      network: "A change in the network checks: blocks, releases or code activity.",
    },
    th_chain: "Name and ticker. The rank is CoinGecko's market-cap rank on the snapshot date.",
    th_kind: "Upgrading: launched with classical keys. Native: post-quantum by default. Native · testnet: no mainnet yet.",
    th_stage: "0 to 5: how far a holder can use post-quantum signatures today. The six stages are defined at the bottom of the page.",
    th_algo: "The post-quantum scheme in use or proposed, and where it stands as a standard.",
    th_net: "Is the chain still producing blocks, and is its code still being worked on? Read by the weekly patrol.",
    th_latest: "The most recent dated step on the chain's timeline.",
    th_cov: "Who is covered: whether new accounts get post-quantum signatures by default, by choice or only on a testnet, and whether coins that already exist can move under post-quantum protection.",
    th_prog: "The newest post-quantum milestone on the chain's timeline (its event date and one line), and how many with a primary source fell in the last 90 days. † marks the project's own statement.",
    th_since: "The day post-quantum signatures became usable on the chain's current mainnet: the genesis block for post-quantum native chains, the day the upgrade went live for the others. Only chains at stage 4 or 5 have one; the chain's page links the source.",
    th_checked: "When the weekly patrol last read this chain's network data.",
    ss: {
      std: "ML-DSA (NIST FIPS 204) or SLH-DSA (NIST FIPS 205): final NIST standards, published August 2024.",
      sel: "Selected by NIST but not a final standard yet: Falcon (to become FN-DSA, FIPS 206), or SPHINCS+, the scheme SLH-DSA was standardized from.",
      var: "A variant or pre-standard version of a NIST scheme, such as a project's own Dilithium, a deterministic Falcon or a reduced-usage SLH-DSA profile. No outside body has reviewed the version used, so its security level is not assessed here.",
      hash: "Stateful hash-based signatures. XMSS is standardized in NIST SP 800-208 and IETF RFC 8391; one-time WOTS+ key trees use the same building blocks but are not standardized as built.",
      custom: "A construction designed by the project itself, without an outside standard. Its security level is not assessed here.",
      none: "No post-quantum signature scheme is live or formally proposed.",
    },
    level: "NIST's security categories, from the parameter set: ML-DSA-44 is level 2, ML-DSA-65 level 3, ML-DSA-87 level 5, Falcon-512 level 1, Falcon-1024 level 5, SLH-DSA-128s level 1. A project's own construction is not assessed.",
    hybrid: "Every transaction carries a classical signature (such as Ed25519 or secp256k1) and a post-quantum one, and both must verify. A chain where an account can sign with either one is not hybrid. Shown only once the scheme is deployed (stage 3 and up).",
    cov: {
      default: "On mainnet, new accounts sign with a post-quantum scheme by default, or every transfer must (stage 5).",
      optin: "On mainnet, holders can choose post-quantum protection; the default is still classical (stage 4).",
      testnet: "Only on the chain's official public testnet (stage 3).",
      none: "No post-quantum signing for holders on mainnet or an official testnet (stage 0 to 2).",
    },
    mig: {
      native: "The current mainnet has signed post-quantum since its genesis block, so there are no classical-key coins to move.",
      available: "On mainnet today, a holder can move existing coins under post-quantum protection (a new key, account type or address).",
      testnet: "A way to move existing coins works only on a public testnet.",
      planned: "An official proposal or roadmap describes how existing coins would move; it is not live.",
      none: "No published way to move existing coins under post-quantum protection.",
      unknown: "Primary and official sources do not settle it.",
    },
    audit: {
      audited: "An independent party audited the post-quantum signing code this chain uses, or the upgrade that added it.",
      partial: "Only a library it depends on was audited or formally verified, or the audit covers an older version or part of the code.",
      none_found: "No audit found in the repository, on the project site or in the main auditors' public report lists.",
      unknown: "We could not tell.",
    },
    scope: { top: "In the CoinGecko top 100 by market cap, with a network of its own (layer 1 or layer 2).", other: "Outside the top 100: chains that already offer post-quantum signatures, or projects built post-quantum." },
    design: { native: "The current mainnet's default signature has been post-quantum since its genesis block (or the chain has no mainnet yet and is built that way).", upgraded: "Launched with classical signatures; post-quantum signatures were added later and run on a public testnet or mainnet (stage 3 and up).", notyet: "Launched with classical signatures; no post-quantum signature runs on a public network yet (stage 0 to 2)." },
    fl: { custom: "The chain signs with a construction the project designed itself, with no outside standard. The stage is unchanged; this marks where the evidence stops.", var: "The chain uses a variant of a NIST scheme whose version no outside body has reviewed. The stage is unchanged.", noaudit: "No audit by an outside firm covering the post-quantum signature code was found. The stage is unchanged.", projdata: "Outside the top 100, and the network data this site reads comes only from the project's own node or explorer, with no independent explorer to confirm it. The stage is unchanged." },
    proposed: "The scheme is proposed in the official process but runs on no public network yet, so deployment properties such as security level and hybrid signing do not apply.",
    netw: { mainnet: "A mainnet is running.", testnet: "Public code or a public testnet, but no mainnet." },
    xtalk: "Posts on X about a chain's post-quantum work, by its official accounts or by people with a public identity and a stated role around it: founders, foundations, core developers, proposal authors, researchers, wallets and exchanges. We open every original post and record the date. Claims only: they never set or change a stage.",
    prog: "Post-quantum events with a primary source, one rule for every chain. Counted: the core team opens or merges a post-quantum proposal in the official process; the official client merges post-quantum code; a testnet or mainnet turns on or changes a post-quantum scheme; an official release whose notes include a post-quantum change; an audit report of the post-quantum code; the mainnet launch of a post-quantum native chain. Not counted: ordinary releases, comments, target dates and roadmaps, checks that found nothing new, proposals by outside contributors, and changes that touch only validators, not holders' signatures.",
    supply: "A neutral note on a premine, treasury or developer share, with its source. Background only; it never changes a stage.",
    np: "Shown for context, not counted as post-quantum progress: an ordinary release, a comment, a target date, a check that found nothing new, an outside contributor's proposal, or a change that touches only validators.",
    bg_rank: "Background, not a post-quantum measure: CoinGecko market-cap rank, a rough guide to how much value is at stake.",
    bg_dot: "Background: is the chain still producing blocks? Details on the chain's page.",
    view: "A preset from the five questions above the table.",
    reviewed: "When the claims on this page were last checked against their sources.",
  },
  zh: {
    pqsig: "为抵御大型量子计算机攻击而设计的数字签名，例如 ML-DSA、Falcon、SLH-DSA。持币人用它签名来授权转账。",
    f_group: "市值前 100：有自己网络的最大币种。主网可选用：上线时用传统密钥、现已到第 4 档的链。原生抗量子：默认使用抗量子签名。早期项目：主网尚未运行。",
    f_fam: "链所用或提议的抗量子签名类别。ML-DSA（Dilithium）、Falcon 和 SLH-DSA（SPHINCS+）由 NIST 选定；其他哈希签名包括 XMSS 和 WOTS+；「自研或其他」指没有外部标准的方案。",
    stage: [
      "核心开发者、基金会和主要客户端团队都没有公开的抗量子研究、路线图或提案。",
      "核心开发者、基金会或主要客户端团队有官方研究、路线图、未合并的提案或原型代码，但还没有内容合并进官方提案库。外部贡献者的提案只列在时间线上，不计档。",
      "与量子相关的协议改动已合并进官方提案库（如 BIP、EIP、ZIP），状态为草案或更高。没有公开提案流程的链，以核心团队发布的正式协议规范为准。",
      "在该链官方的公开测试网上，持币人可以用抗量子签名授权转账。",
      "在主网上，持币人可自行选择，在协议层为资产启用抗量子保护。",
      "新账户默认使用抗量子签名，或转账必须使用抗量子签名。",
    ],
    g_top: "CoinGecko 市值前 100 中，在自己的网络（L1 或 L2）上用于支付手续费或维护共识的币。稳定币、包装币、质押凭证，以及没有自己链的交易所币、应用币和 meme 币不收录。",
    g_optin: "上线时使用传统密钥、现在主网已允许持币人自行选用抗量子保护的链（4 档）。",
    g_native: "主网上每笔转账默认使用抗量子签名的链。",
    g_early: "有公开代码或运行中的测试网、至少有一项活跃迹象，但主网尚未运行的项目。",
    k_upgrading: "上线时使用传统签名，抗量子保护是之后才加的。",
    k_native: "按抗量子设计：主网转账默认使用抗量子签名。",
    k_early: "按抗量子设计，但目前只有测试网或开发网在运行。",
    st_ok: "最新区块在时限以内，且主代码库最近 90 天有提交（或没有跟踪代码库）。",
    st_quiet: "最新区块在时限以内，但主代码库最近 90 天没有提交。",
    st_stalled: "链自己的接口和一个独立的区块浏览器都显示最新区块已超出时限：一般为 10 分钟；目标出块间隔超过 100 秒的链，时限为 6 倍目标出块间隔。",
    st_unknown: "出块接口没有响应，或这条链没有公开接口，或接口显示的区块过旧、又没有独立的区块浏览器可以印证。我们如实记录，不做推测。",
    chips: {
      fips204: "ML-DSA，即 NIST 于 2024 年 8 月发布的 FIPS 204 标准。",
      fips205: "SLH-DSA，即 NIST 于 2024 年 8 月发布的 FIPS 205 标准。",
      falcon: "Falcon 已被 NIST 选定，正以 FN-DSA 之名标准化（FIPS 206 尚未定稿）。",
      xmss: "XMSS，有状态的哈希签名，已由 IETF 定为 RFC 8391 标准。",
      family: "属于 NIST 选定的方案族，但用的是标准发布前的版本（如第三轮 Dilithium），或参数集本站尚未核实。",
      sphincs: "SPHINCS+，即后来被 NIST 定为 SLH-DSA 的方案；标准发布前的版本在细节上有差别。",
      wots: "WOTS+ 这类哈希一次性签名，是 XMSS 等标准的组成部分，单独使用没有对应标准。",
      nonstd: "没有被 NIST 或 IETF 标准化。",
      custom: "项目自己设计的方案，没有外部标准。",
      broken: "协议仍接受某组已被公开攻破的参数，链详情页写明是哪一组。只在过去用过、现在已不接受的链不挂这个标签。",
      none: "这条链还没有抗量子签名方案。",
    },
    grades: {
      primary: "运行中的代码、发布版本、从官方接口读取的链上参数，或官方提案库。只有这类证据能定档。",
      official: "项目官网、博客和路线图。会列在时间线上，但不会据此升档。",
      unverified: "媒体和第三方的说法。单独列出，待原始出处确认。",
    },
    types: {
      research: "论文、研究文章、论坛讨论和路线图。", proposal: "正式的改进提案（如 BIP、EIP），未合并或已合并。",
      code: "节点客户端或工具库中的实现工作。", testnet: "已在公开测试网上运行的功能。", mainnet: "已在主网上运行的功能。",
      wallet: "钱包支持。", thirdparty: "他人开发的钱包、保险库或合约。只做记录，不影响档位。", tracker: "本站的说明。",
      network: "网络核查结果的变化：出块、发布版本或代码活跃度。",
    },
    th_chain: "链名和币种代码。排名取自 CoinGecko 在取数当日的市值排名。",
    th_kind: "升级中：上线时使用传统密钥。原生：默认抗量子。原生 · 测试网：还没有主网。",
    th_stage: "0 到 5 档：持币人今天能在多大程度上使用抗量子签名。六个档位的定义见页面底部。",
    th_algo: "正在使用或已提出的抗量子方案，以及它的标准化程度。",
    th_net: "这条链是否还在出块、代码是否还有人在维护。由每周自动巡查读取。",
    th_latest: "这条链时间线上最近一个带日期的进展。",
    th_cov: "覆盖了谁：新账户是默认、可选还是只在测试网用上抗量子签名，已有的币能不能转到抗量子保护之下。",
    th_prog: "这条链时间线上最近一条抗量子进展（事件日期和一句话），以及近 90 天内带原始出处的条数。† 表示项目方自己的说法。",
    th_since: "抗量子签名在这条链现行主网上可用的日期：原生抗量子链取创世区块，其他链取升级生效当天。只有第 4、5 档的链有这个日期，出处见链的详情页。",
    th_checked: "每周自动巡查最近一次读取这条链网络数据的日期。",
    ss: {
      std: "ML-DSA（NIST FIPS 204）或 SLH-DSA（NIST FIPS 205）：NIST 于 2024 年 8 月发布的正式标准。",
      sel: "已被 NIST 选定、但还不是正式标准：Falcon（将成为 FN-DSA，即 FIPS 206），或 SLH-DSA 标准化前的 SPHINCS+。",
      var: "NIST 方案的变体或标准发布前版本，例如项目自己改的 Dilithium、确定性 Falcon、限定用法的 SLH-DSA。所用版本没有经过外部机构评估，本站不评估它的强度等级。",
      hash: "有状态的哈希签名。XMSS 已由 NIST SP 800-208 和 IETF RFC 8391 标准化；WOTS+ 一次性密钥树用的是同样的构件，但按其做法并没有对应标准。",
      custom: "项目自己设计的方案，没有外部标准。本站不评估它的强度等级。",
      none: "没有上线或正式提出的抗量子签名方案。",
    },
    level: "NIST 的强度等级，按参数集确定：ML-DSA-44 为 2 级，ML-DSA-65 为 3 级，ML-DSA-87 为 5 级，Falcon-512 为 1 级，Falcon-1024 为 5 级，SLH-DSA-128s 为 1 级。项目自研方案不评估。",
    hybrid: "每笔交易同时带一个传统签名（如 Ed25519、secp256k1）和一个抗量子签名，两个都要验证通过。账户可以二选一的不算混合签名。只在方案已部署（第 3 档及以上）时显示。",
    cov: {
      default: "主网上新账户默认使用抗量子签名，或每笔转账都必须使用（第 5 档）。",
      optin: "主网上持币人可以自行选用抗量子保护，默认仍是传统签名（第 4 档）。",
      testnet: "只在该链官方的公开测试网上可用（第 3 档）。",
      none: "主网和官方测试网上，持币人都还不能用抗量子签名（第 0 至 2 档）。",
    },
    mig: {
      native: "现行主网从创世区块起就用抗量子签名，没有传统密钥下的币需要迁移。",
      available: "今天在主网上，持币人可以把已有的币转到抗量子保护之下（新密钥、新账户类型或新地址）。",
      testnet: "把已有的币迁过去的办法只在公开测试网上可用。",
      planned: "官方提案或路线图写了已有的币怎么迁移，但还没上线。",
      none: "没有公开的办法把已有的币转到抗量子保护之下。",
      unknown: "原始出处和官方说法都不足以判断。",
    },
    audit: {
      audited: "独立机构审计过该链使用的抗量子签名代码，或加入它的那次升级。",
      partial: "只审计或形式化验证过它依赖的库，或审计只覆盖旧版本、部分代码。",
      none_found: "代码库、项目官网和主要审计机构公开的报告列表里都没有找到审计。",
      unknown: "无法判断。",
    },
    scope: { top: "CoinGecko 市值前 100 中，有自己网络（L1 或 L2）的币。", other: "市值前 100 以外：已经提供抗量子签名的链，或按抗量子设计的项目。" },
    design: { native: "现行主网从创世区块起默认就用抗量子签名（还没有主网的，则是按这种方式设计的）。", upgraded: "上线时用传统签名，抗量子签名是后来加上的，已在公开测试网或主网运行（第 3 档及以上）。", notyet: "上线时用传统签名，还没有抗量子签名在公开网络上运行（第 0 到 2 档）。" },
    fl: { custom: "这条链用项目自己设计的方案签名，没有外部标准。档位不变，这里标出证据的边界。", var: "这条链用 NIST 方案的变体，所用版本没有经过外部机构评估。档位不变。", noaudit: "没有找到外部机构对抗量子签名代码的审计。档位不变。", projdata: "不在市值前 100，本站读取的出块数据只来自项目自己的节点或浏览器，没有独立浏览器可以印证。档位不变。" },
    proposed: "方案已在官方流程中提出，但还没有在任何公开网络上运行，所以强度等级、混合签名这类部署属性不适用。",
    netw: { mainnet: "主网在运行。", testnet: "有公开代码或公开测试网，但还没有主网。" },
    xtalk: "这条链的官方号，或有公开身份、和这条链关系明确的人（创始人、基金会、核心开发者、提案作者、研究者、钱包、交易所）在 X 上谈这条链抗量子进展的原帖，每条都打开核对，并记下日期。只算说法，不决定也不改变档位。",
    prog: "带原始出处的抗量子事件，所有链用同一条规则。计入：核心团队在官方流程里开出或合并抗量子提案；官方客户端合并抗量子代码；测试网或主网启用或调整抗量子方案；发布说明含抗量子改动的官方版本；抗量子实现的审计报告发布；原生抗量子链主网上线。不计：普通版本发布、评论表态、目标日期和路线图、没有新发现的核查、外部贡献者的提案、只涉及验证者而不涉及持币人签名的改动。",
    supply: "关于预铸、金库或开发者分成的中性说明，附出处。只是背景信息，不影响档位。",
    np: "列出来供参考，不计入抗量子进展：普通版本发布、评论表态、目标日期、没有新发现的核查、外部贡献者的提案，或只涉及验证者的改动。",
    bg_rank: "背景信息，不是抗量子指标：CoinGecko 市值排名，大致说明有多少价值面临风险。",
    bg_dot: "背景信息：这条链是否还在出块。详情见链的页面。",
    view: "表格上方五个问题之一的预设筛选。",
    reviewed: "本页说法最近一次对照出处核对的日期。",
  },
};

/* NIST status of each scheme on the algorithm map (NIST's record as of 2026-11-28) */
Object.assign(DEFS.en, {
  nist: {
    fips: "Published as a final standard on 2024-08-13: ML-DSA in FIPS 204 (lattice-based) and SLH-DSA in FIPS 205 (stateless hash-based).",
    draft: "NIST selected Falcon and is writing it up as FN-DSA in FIPS 206; no final version has been published. Chains run the Falcon submission, which the standard may change in details.",
    sp800208: "LMS/HSS and XMSS/XMSS^MT, final since 2020-10-29. These schemes are stateful: a key must never sign twice from the same state.",
    round3: "One of the 8 schemes left in round 3 of NIST's call for additional signatures (9 announced on 2026-05-14; HAWK withdrew on 2026-07-29). The multivariate candidates are UOV, MAYO, QR-UOV and SNOVA. NIST expects round 3 to take about two years.",
    dropped: "A round 3 finalist that NIST did not advance in 2022. For Rainbow, NIST judged all submitted parameter sets below their security targets, and a 2022 attack recovers keys for the round-2 SL1 parameters, Rainbow(16,32,32,32), in about 53 hours on a laptop. No source says the scheme fails at every parameter set; each chain page names the parameters that chain uses.",
    broken: "A published attack breaks the scheme at every parameter set, as the 2022 attack on SIDH did for SIKE (a key exchange scheme). No signature scheme on this map is in this group.",
    notnist: "Not a NIST standard or candidate: constructions a project designed itself, and WOTS+ used on its own (NIST uses WOTS+ only inside XMSS and SLH-DSA).",
  },
  nist_var: "A variant of a NIST scheme, or a version NIST has not reviewed, such as a deterministic Falcon, a project's own Dilithium, a reduced-use SLH-DSA profile that is not one of the draft SP 800-230 parameter sets, or UOV with its own parameters.",
});
Object.assign(DEFS.zh, {
  nist: {
    fips: "2024-08-13 正式发布：ML-DSA 为 FIPS 204（格），SLH-DSA 为 FIPS 205（无状态哈希）。",
    draft: "NIST 已选定 Falcon，正在把它制定为 FIPS 206（FN-DSA），还没有正式版。链上用的是 Falcon 的提交版本，正式标准可能在细节上有改动。",
    sp800208: "LMS/HSS 和 XMSS/XMSS^MT，2020-10-29 起为正式标准。属于有状态签名：同一状态的密钥绝不能签两次。",
    round3: "NIST 附加签名征集第 3 轮剩下的 8 个方案之一（2026-05-14 公布 9 个，HAWK 于 2026-07-29 退出）。多变量类的候选是 UOV、MAYO、QR-UOV 和 SNOVA。NIST 预计第 3 轮约需两年。",
    dropped: "进入过第 3 轮决赛、2022 年未被 NIST 选中的方案。对 Rainbow，NIST 判定全部提交参数组都低于目标强度；2022 年的一项攻击可在笔记本上约 53 小时恢复出第二轮 SL1 参数 Rainbow（16,32,32,32）的密钥。没有来源说这个方案在任何参数下都被攻破；各链详情页写明该链用的参数。",
    broken: "已有公开攻击在任何参数下都攻破这个方案，例如 2022 年针对 SIDH 的攻击攻破了 SIKE（一个密钥交换方案）。本版图上没有签名方案属于这一组。",
    notnist: "不是 NIST 标准或候选：项目自己设计的构造，以及单独使用的 WOTS+（NIST 只在 XMSS 和 SLH-DSA 内部使用 WOTS+）。",
  },
  nist_var: "NIST 方案的变体，或 NIST 没有审查过的版本，例如确定性的 Falcon、项目自己的 Dilithium、不属于 SP 800-230 草案参数集的限次 SLH-DSA，或者用自己参数的 UOV。",
});
const L = (k) => UI[lang][k];
const DF = DEFS[lang];
const CO = () => (lang === "zh" ? "：" : ": ");
const PAR = (s) => (lang === "zh" ? `（${s}）` : ` (${s})`);
const T = (o) => o == null ? "" : (typeof o === "string" ? o : (o[lang] || o.en || ""));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(d) {
  if (!d) return L("undated");
  let m;
  if ((m = /^(\d{4})-Q(\d)$/.exec(d))) return lang === "zh" ? `${m[1]} 年 Q${m[2]}` : `Q${m[2]} ${m[1]}`;
  if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d))) return lang === "zh" ? d : `${+m[3]} ${MON[+m[2] - 1]} ${m[1]}`;
  if ((m = /^(\d{4})-(\d{2})$/.exec(d))) return lang === "zh" ? `${m[1]}-${m[2]}` : `${MON[+m[2] - 1]} ${m[1]}`;
  return d;
}
const sortKey = (d) => d ? d.replace("-Q1", "-02").replace("-Q2", "-05").replace("-Q3", "-08").replace("-Q4", "-11").padEnd(10, "-15").slice(0, 10) : "0000";
const name = (c) => lang === "zh" && c.zh_name ? c.zh_name : c.name;
const list = (a) => a.length < 2 ? a.join("") : a.slice(0, -1).join(lang === "zh" ? "、" : ", ") + L("and") + a[a.length - 1];
/* a label with a definition: hover, focus or tap shows it */
const term = (label, def, title, cls) => `<span class="term${cls ? " " + cls : ""}" tabindex="0" data-def="${esc(def)}"${title ? ` data-title="${esc(title)}"` : ""}>${label}</span>`;
/* the same, with the definition looked up by key when shown (keeps the repeated table rows small) */
const termRef = (label, ref, title, cls) => `<span class="term${cls ? " " + cls : ""}" tabindex="0" data-ref="${ref}"${title ? ` data-title="${esc(title)}"` : ""}>${label}</span>`;
const refDef = (ref) => ref.split(".").reduce((o, k) => (o == null ? o : o[k]), DF);
const info = (def, title) => `<span class="term i" tabindex="0" role="button" aria-label="${esc(title)}" data-def="${esc(def)}" data-title="${esc(title)}">?</span>`;
const stageName = (s) => L("stage_names")[s];
const stageTitle = (s) => `${L("stage_word")} ${s} · ${stageName(s)}`;
const stageTerm = (s) => term(esc(stageName(s)), DF.stage[s], stageTitle(s));

/* The stage everywhere: a colour badge with the number and name, plus a six-cell bar. */
const badge = (s) => `<span class="badge s${s}"><b>${s}</b>${esc(stageName(s))}</span>`;
const badgeTerm = (s) => term(badge(s), DF.stage[s], stageTitle(s), "plain");
function bar6(s) {
  let h = `<span class="bar6 s${s}" role="img" aria-label="${esc(stageTitle(s))}">`;
  for (let i = 0; i <= 5; i++) h += `<i${i <= s ? ' class="on"' : ""}></i>`;
  return h + "</span>";
}
const stageCell = (s, withTerm) => `<div class="stagecell">${withTerm ? badgeTerm(s) : badge(s)}${bar6(s)}</div>`;
/* where the evidence behind a stage 4 or 5 rating stops; the stage itself is unchanged */
const flagsHTML = (c) => c.flags && c.flags.length ? `<span class="fls">${c.flags.map((f) => term(`<span class="fl">${esc(L("fl")[f])}</span>`, DF.fl[f], L("fl")[f], "plain")).join("")}</span>` : "";
/* milestone types take the colour of the stage they point to */
const TYPE_STAGE = { research: 1, proposal: 2, code: 2, testnet: 3, mainnet: 4, wallet: 4, thirdparty: 0, tracker: 0, network: 0 };

function chips(ids) { return `<span class="chips">${ids.map((k) => { const c = D.chips[k]; return termRef(`<span class="chip ${c.tone}">${esc(T(c))}</span>`, "chips." + k, T(c), "plain"); }).join("")}</span>`; }
function kindKey(c) { return c.group === "early" ? "k_early" : (c.kind === "native" ? "k_native" : "k_upgrading"); }
const kindTerm = (c) => termRef(esc(L(kindKey(c))), kindKey(c), L(kindKey(c)));
const statusTerm = (st) => termRef(esc(L("st_" + st)), "st_" + st, L("st_" + st));
const ICON_SEARCH = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const ICON_GO = `<svg class="go" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ---------- shared chrome ---------- */
function chrome(view) {
  const nav = [["overview", "nav_overview"], ["chains", "nav_chains"], ["timeline", "nav_timeline"], ["x/", "nav_x"], ["method/", "nav_method"], ["data/", "nav_data"], ["contact", "nav_contact"]];
  put("nav", nav.map(([p, k]) => p.endsWith("/")
    ? `<a href="${href(p)}"${view === p.slice(0, -1) ? ' aria-current="page"' : ""}>${esc(L(k))}</a>`
    : `<a href="${href("")}#${p}" data-sec="${p}">${esc(L(k))}</a>`).join(""));
  put("foot", `
    <div class="row1"><p>${esc(L("foot_fix"))}</p>
      <a class="btn primary" href="${URL_FIX}" target="_blank" rel="noopener">${esc(L("foot_btn_fix"))} ↗</a>
      <a class="btn" href="${URL_SUBMIT}" target="_blank" rel="noopener">${esc(L("foot_btn_submit"))} ↗</a>
      <a class="btn" href="${URL_TALK}" target="_blank" rel="noopener">GitHub Discussions ↗</a>
      <a class="btn" href="${URL_X}" target="_blank" rel="noopener">X · @balance0014 ↗</a></div>
    <div class="fine">${esc(L("foot_fine"))}</div>
    <div class="fine">${esc(L("foot_cite")(D.release.version, D.release.date))}${SEP(L("foot_cite")(D.release.version, D.release.date))}<a href="${href("method/")}#cite">${esc(L("foot_cite_link"))}</a>${D.has_changes ? ` · <a href="${href("changes/")}">${esc(L("nav_changes"))}</a>` : ""} · <a href="${D.base}llms.txt">llms.txt</a> · <a href="${blob("CHANGELOG.md")}" target="_blank" rel="noopener">${esc(L("foot_log"))} ↗</a></div>`);
}

/* ---------- home ---------- */
const GROUP_ORDER = { top: 0, optin: 1, native: 2, early: 3 };
const NETS = ["ok", "quiet", "stalled", "unknown"];
const FAMS = ["mldsa", "falcon", "slhdsa", "hash", "other", "none"];
const STATUSES = ["std", "sel", "var", "hash", "custom", "none"];
const SCHEME = { mldsa: "ML-DSA", falcon: "Falcon", slhdsa: "SLH-DSA", xmss: "XMSS", wots: "WOTS+" };
const hasSS = (c, v) => c.schemes.some(([, st]) => st === v);
const COVS = ["default", "optin", "testnet", "none"];
const MIGS = ["native", "available", "testnet", "planned", "none", "unknown"];
const AUDITS = ["audited", "partial", "none_found", "unknown"];
const VIEWS = ["use", "close", "move", "quiet", "broken", "custom", "claim"];
const SORTS = ["default", "stage_d", "stage_a", "prog", "n90", "since", "name"];
/* every filter: its values, the label of each value, and the test a chain must pass */
const F = {
  scope: { vals: ["top", "other"], lab: (v) => L("scope")[v], def: (v) => DF.scope[v], test: (c, v) => c.scope === v },
  stage: { vals: [0, 1, 2, 3, 4, 5], lab: (v) => stageTitle(v), def: (v) => DF.stage[v], test: (c, v) => c.stage === v },
  design: { vals: ["native", "upgraded", "notyet"], lab: (v) => L("design")[v], def: (v) => DF.design[v], test: (c, v) => c.design === v },
  ss: { vals: STATUSES, lab: (v) => L("ss")[v], def: (v) => DF.ss[v], test: (c, v) => hasSS(c, v) },
  cov: { vals: COVS, lab: (v) => L("cov")[v], def: (v) => DF.cov[v], test: (c, v) => c.cov === v },
  fam: { vals: FAMS, lab: (v) => L("fam")[v], def: () => DF.f_fam, test: (c, v) => c.fam.includes(v) },
  mig: { vals: MIGS, lab: (v) => L("mig_s")[v], def: (v) => DF.mig[v], test: (c, v) => !!c.mig && c.mig.value === v },
  audit: { vals: AUDITS, lab: (v) => L("audit")[v], def: (v) => DF.audit[v], test: (c, v) => c.audit === v },
  netw: { vals: ["mainnet", "testnet"], lab: (v) => L("netw")[v], def: (v) => DF.netw[v], test: (c, v) => c.netw === v },
  net: { vals: NETS, lab: (v) => L("st_" + v), def: (v) => DF["st_" + v], test: (c, v) => c.net.status === v },
  view: { vals: VIEWS, lab: (v) => L("view")[v], def: () => DF.view, test: (c, v) => VIEW[v](c) },
};
const VIEW = {
  use: (c) => c.stage >= 4, close: (c) => c.stage === 3, move: (c) => c.prog.n90 > 0,
  quiet: (c) => c.rank != null && c.stage <= 1 && !c.prog.y1,
  broken: (c) => c.chips.includes("broken"), custom: (c) => hasSS(c, "custom") || hasSS(c, "var"), claim: (c) => c.claim,
};
const MAIN_F = ["scope", "stage"], MORE_F = ["design", "ss", "cov", "fam", "mig", "audit", "netw", "net"];
const KEYS = [...MAIN_F, ...MORE_F, "view"];
const DEFAULT = Object.assign(Object.fromEntries(KEYS.map((k) => [k, null])), { q: "", sort: "default" });
const state = Object.assign({}, DEFAULT);
const defaultOrder = (a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || (a.rank || 999) - (b.rank || 999) || b.stage - a.stage || a.name.localeCompare(b.name);
/* search text: names, ticker, algorithm and labels, plus the older names of each family (Dilithium, SPHINCS+, FN-DSA) */
const FAM_WORDS = { mldsa: "ml-dsa dilithium", falcon: "falcon fn-dsa", slhdsa: "slh-dsa sphincs", hash: "hash xmss wots winternitz", other: "", none: "" };
/* search ignores case, spaces, hyphens and dots; names also match their aliases (BSC, MATIC, 瑞波), the pinyin
   initials of Chinese names (ggb → 狗狗币) and, from four letters on, a name with one letter wrong (two from eight letters) */
const norm = (s) => String(s || "").normalize("NFKC").toLowerCase().replace(/[\s\-_.·'’()（）]/g, "");
const hay = (c) => c._hay || (c._hay = norm([c.algo.en, c.algo.zh, ...c.chips.map((k) => `${D.chips[k].en} ${D.chips[k].zh}`), ...c.fam.map((f) => FAM_WORDS[f])].join("|")));
const keysOf = (c) => c._keys || (c._keys = [c.name, c.zh_name, c.ticker, c.id, `${name(c)} ${c.ticker}`, ...(c.aliases || []), ...(c.pinyin || [])].filter(Boolean).map(norm));
function editDist(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1); /* swapped letters */
    }
    prev2 = prev; prev = cur;
  }
  return prev[b.length];
}
const tol = (q) => (/^[a-z0-9]+$/.test(q) ? (q.length >= 8 ? 2 : q.length >= 4 ? 1 : 0) : 0);
/* how far a query is from a chain's names: 0 for a hit, 1 or 2 for a near miss, Infinity for none */
function nameDist(c, q) {
  const t = tol(q);
  let best = Infinity;
  for (const k of keysOf(c)) {
    if (k.includes(q)) return 0;
    if (!t) continue;
    best = Math.min(best, editDist(q, k, t), k.length > q.length ? editDist(q, k.slice(0, q.length), t) : Infinity);
  }
  return best <= t ? best : Infinity;
}
const hitQ = (c, q) => { const n = norm(q); return !n || nameDist(c, n) !== Infinity || hay(c).includes(n); };
/* "did you mean": the names closest to a query that matched nothing */
function suggest(q) {
  const n = norm(q);
  if (n.length < 2) return [];
  return D.chains.map((c) => [c, Math.min(...keysOf(c).map((k) => Math.min(editDist(n, k, 3), k.length > n.length ? editDist(n, k.slice(0, n.length), 3) : 9)))])
    .filter(([, d]) => d <= 3).sort((a, b) => a[1] - b[1] || (a[0].rank || 999) - (b[0].rank || 999)).slice(0, 3).map(([c]) => c);
}
const passes = (c, k, v) => k === "q" ? hitQ(c, v) : (v == null || F[k].test(c, v));
const matches = (c, over) => [...KEYS, "q"].every((k) => passes(c, k, over && k in over ? over[k] : state[k]));
const countWith = (k, v) => D.chains.filter((c) => matches(c, { [k]: v })).length;
const isDefault = () => KEYS.every((k) => state[k] == null) && !state.q.trim();
const progKey = (c) => (c.prog.latest ? sortKey(c.prog.latest.date) : "0000");
function filtered() {
  const rows = D.chains.filter((c) => matches(c));
  const s = state.sort;
  if (s === "default") rows.sort(state.view === "move" ? (a, b) => progKey(b).localeCompare(progKey(a)) || defaultOrder(a, b) : defaultOrder);
  else if (s === "stage_d") rows.sort((a, b) => b.stage - a.stage || defaultOrder(a, b));
  else if (s === "stage_a") rows.sort((a, b) => a.stage - b.stage || defaultOrder(a, b));
  else if (s === "prog") rows.sort((a, b) => progKey(b).localeCompare(progKey(a)) || defaultOrder(a, b));
  else if (s === "n90") rows.sort((a, b) => b.prog.n90 - a.prog.n90 || progKey(b).localeCompare(progKey(a)) || defaultOrder(a, b));
  else if (s === "name") rows.sort((a, b) => name(a).localeCompare(name(b)));
  else if (s === "since") rows.sort((a, b) => (a.since ? 0 : a.stage >= 4 ? 1 : 2) - (b.since ? 0 : b.stage >= 4 ? 1 : 2) || (a.since && b.since ? a.since.date.localeCompare(b.since.date) : 0) || defaultOrder(a, b));
  return rows;
}
/* the view in the address bar: #chains?scope=top&stage=4 opens the table with those filters */
function stateQS() {
  const p = new URLSearchParams();
  for (const k of KEYS) if (state[k] != null) p.set(k, String(state[k]));
  if (state.q.trim()) p.set("q", state.q.trim());
  if (state.sort !== "default") p.set("sort", state.sort);
  return p.toString();
}
function readHash() {
  Object.assign(state, DEFAULT);
  if (!location.hash.startsWith("#chains?")) return false;
  const p = new URLSearchParams(location.hash.slice(8));
  if (p.get("group") === "top") state.scope = "top"; /* links made before the scope filter */
  for (const k of KEYS) { const raw = p.get(k); if (raw == null) continue; const v = k === "stage" ? +raw : raw; if (F[k].vals.includes(v)) state[k] = v; }
  if (p.get("q")) state.q = p.get("q").slice(0, 80);
  if (SORTS.includes(p.get("sort"))) state.sort = p.get("sort");
  return true;
}
function writeHash() {
  const qs = stateQS();
  if (qs) history.replaceState(null, "", "#chains?" + qs);
  else if (location.hash.startsWith("#chains?")) history.replaceState(null, "", "#chains");
}
const dagger = (g) => g === "official" ? `<span class="dg" aria-label="${esc(L("grades").official)}">†</span>` : "";
/* background: a small status dot beside the name; its tooltip says what it counts */
function dotHTML(c) {
  const n = c.net, b = n.block, code = n.code;
  const parts = [L("st_" + n.status), b.ok ? L("blocks_short")(b.age) : (b.url ? L("no_block") : L("no_probe"))];
  if (code && code.c90 != null) parts.push(L("commits2")(code.c90));
  return `<span class="sdot ${n.status}" tabindex="0" role="img" aria-label="${esc(parts.join(" · "))}" data-tip="${esc(parts.join(" · ") + " — " + DF.bg_dot)}"></span>`;
}
const ssChip = (st) => termRef(`<span class="chip ss ${st}">${esc(L("ss")[st])}</span>`, "ss." + st, L("ss")[st], "plain");
/* standard status is per scheme: Ethereum proposes ML-DSA (a standard) and Falcon (not final yet), so it gets two chips */
const schemeName = (k) => SCHEME[k] || L("scheme_other");
function ssChips(c, full) {
  const real = c.schemes.filter(([k]) => k !== "none");
  if (!real.length) return ssChip("none");
  if (real.length === 1 && !full) return ssChip(real[0][1]);
  return real.map(([k, st]) => termRef(`<span class="chip ss ${st}">${esc(SCHEME[k] ? `${SCHEME[k]} · ${(full ? L("ss") : L("ss_s"))[st]}` : L("ss")[st])}</span>`, "ss." + st, L("ss")[st], "plain")).join("");
}
const levelText = (lv, open) => lv == null ? "" : termRef(esc(L("level")(lv, open)), "level", L("k_level"));
function sinceCell(c) {
  if (c.stage < 4) return `<span class="na">—</span>`;
  const ml = `<span class="ml">${esc(L("th_since"))}</span>`;
  if (!c.since) return `${ml}<span class="na">${esc(L("since_na"))}</span>`;
  return `${ml}<span class="sd mono">${esc(fmtDate(c.since.date))}${dagger(c.since.grade)}</span><span class="sb">${esc(L("since_basis")[c.since.basis])}</span>`;
}
function covCell(c) {
  const m = c.mig ? `<span class="mg">${termRef(esc(L("mig")[c.mig.value]), "mig." + c.mig.value, L("mig_label"))}</span>` : "";
  return `<div class="cov"><span class="cv ${c.cov}">${termRef(esc(L("cov")[c.cov]), "cov." + c.cov, L("cov_label"))}</span>${m}</div>`;
}
function progCell(c) {
  const p = c.prog, l = p.latest;
  const n = `<span class="n9${p.n90 ? " on" : ""}">${esc(L("prog_n90")(p.n90))}</span>`;
  if (!l) return `<div class="latest"><span class="x na">${esc(L("prog_none"))}</span>${n}</div>`;
  const x = T(l);
  return `<div class="latest"><span class="d">${esc(fmtDate(l.date))}${dagger(l.grade)}</span><span class="x">${esc(x)}</span><button type="button" class="more" hidden aria-expanded="false">${esc(L("more"))}</button>${n}</div>`;
}
/* the list shows the first rows, then a "show all" button (no-JS pages list everything) */
const FIRST = 20;
let expanded = false, openY = 0; /* openY: where the "Show all" button sat on screen when the list was opened */
function rowHTML(c, later) {
  const sub = [esc(c.ticker), c.rank ? termRef(esc(L("rank")(c.rank)), "bg_rank", L("k_mcap")) : ""].filter(Boolean).join(" · ");
  return `<tr class="row${later ? " later" : ""}" data-id="${c.id}">
    <td class="c-chain"><div class="chain"><span class="nmr"><a class="nm" href="${chainURL(c.id)}">${esc(name(c))}</a>${dotHTML(c)}</span><span class="sub">${sub}</span></div></td>
    <td class="c-stage">${stageCell(c.stage)}${dagger(c.basis_grade)}${flagsHTML(c)}</td>
    <td class="c-algo"><div class="algo"><span class="a">${esc(T(c.algo))}</span><span class="chips">${ssChips(c)}${c.stage < 3 && c.schemes.some(([k]) => k !== "none") ? term(`<span class="chip">${esc(L("proposed"))}</span>`, DF.proposed, L("proposed"), "plain") : ""}${c.hybrid ? termRef(`<span class="chip">${esc(L("hybrid"))}</span>`, "hybrid", L("hybrid"), "plain") : ""}${c.chips.includes("broken") ? termRef(`<span class="chip bad">${esc(T(D.chips.broken))}</span>`, "chips.broken", T(D.chips.broken), "plain") : ""}</span>${c.level != null && c.stage >= 3 ? `<span class="lvl">${levelText(c.level, c.level_open)}</span>` : ""}</div></td>
    <td class="c-cov">${covCell(c)}</td>
    <td class="c-since${c.stage >= 4 ? "" : " none"}">${sinceCell(c)}</td>
    <td class="c-latest">${progCell(c)}</td>
    <td class="c-go">${ICON_GO}</td></tr>`;
}
function tableBody() {
  const rows = filtered();
  const grouped = state.sort === "default" && isDefault();
  let html = "", last = null, i = 0;
  for (const c of rows) {
    if (!expanded && i >= FIRST) { i++; continue; } /* rows after the first ones are built only when the reader asks for them */
    if (grouped && c.group !== last) { last = c.group; html += `<tr class="grp"><td colspan="7"><span class="gt">${term(esc(L("g_" + c.group)), DF["g_" + c.group], L("g_" + c.group))}</span><span class="gs">${esc(L("g_" + c.group + "_s"))}</span></td></tr>`; }
    html += rowHTML(c, false); i++;
  }
  if (!rows.length) {
    const sug = state.q.trim() ? suggest(state.q) : [];
    const dym = sug.length ? `<span class="dym">${esc(L("dym"))}${sug.map((c) => `<button type="button" class="link-btn" data-suggest="${esc(name(c))}">${esc(name(c))} <span class="mono">${esc(c.ticker)}</span></button>`).join(lang === "zh" ? "、" : ", ")}</span>` : "";
    const body = state.q.trim() ? notFound(state.q, dym) : `<b>${esc(L("empty_h"))}</b>${dym}<span>${esc(L("empty_p"))}</span>`;
    html = `<tr class="none"><td colspan="7" class="empty"><div class="ei">${body}<button type="button" class="btn" data-clear>${esc(L("clear_filters"))}</button></div></td></tr>`;
  }
  return { html, count: L("shown")(rows.length, D.chains.length), total: rows.length };
}
/* filter rows; each button shows how many chains it would list, and its definition on hover */
const LAB = { scope: "scope_label", stage: "stage_label", design: "design_label", ss: "ss_label", cov: "cov_label", fam: "fam_label", mig: "mig_label", audit: "audit_label", netw: "netw_label", net: "net_label2", view: "view_label", q: "search_label" };
const fLabel = (k, v) => k === "q" ? `“${v}”` : F[k].lab(v);
function fbtn(k, v, inner, tip) {
  const n = countWith(k, v), on = state[k] === v;
  return `<button type="button" class="fbtn" data-k="${k}" data-v="${v == null ? "" : v}" aria-pressed="${on}"${!on && !n ? " disabled" : ""}${tip ? ` data-tip="${esc(tip)}"` : ""}>${inner}<span class="n">${n}</span></button>`;
}
function frow(k) {
  const f = F[k];
  const inner = (v) => k === "stage" ? `<i class="sw s${v}" aria-hidden="true"></i>${v}<span class="sr"> · ${esc(stageName(v))}</span>`
    : k === "net" ? `<span class="dot ${v}" aria-hidden="true"></span>${esc(f.lab(v))}` : k === "ss" ? `<i class="ssw ${v}" aria-hidden="true"></i>${esc(f.lab(v))}` : esc(f.lab(v));
  /* the row's "?" lists every option with its definition (the same text as the method page) */
  const all = k === "fam" ? DF.f_fam : f.vals.map((v) => `${f.lab(v)}${CO()}${f.def(v)}`).join("\n");
  return `<div class="frow" role="group" aria-label="${esc(L(LAB[k]))}"><span class="lab">${esc(L(LAB[k]))}${info(all, L(LAB[k]))}</span><div class="fopts">${fbtn(k, null, esc(L("any")))}${f.vals.map((v) => fbtn(k, v, inner(v), k === "fam" ? "" : `${f.lab(v)}${CO()}${f.def(v)}`)).join("")}</div></div>`;
}
function filtersHTML() {
  const nMore = MORE_F.filter((k) => state[k] != null).length;
  return `<div class="filters">${MAIN_F.map(frow).join("")}
    <details class="moref"${nMore ? " open" : ""}><summary><span>${esc(L("more_filters"))}</span><span class="mb">${esc(L("more_bg"))}</span>${ICON_CHEV}</summary><div class="filters">${MORE_F.map(frow).join("")}</div></details></div>`;
}
function activeHTML() {
  const chips = [];
  for (const k of [...KEYS, "q"]) {
    const v = k === "q" ? state.q.trim() : state[k];
    if (v == null || v === "") continue;
    const text = `${L(LAB[k])}${CO()}${fLabel(k, v)}`;
    chips.push(`<button type="button" class="fchip" data-unset="${k}" aria-label="${esc(L("remove")(text))}">${esc(text)}<span class="x" aria-hidden="true">×</span></button>`);
  }
  return chips.length ? chips.join("") + `<button type="button" class="link-btn" data-clear>${esc(L("clear_all"))}</button>` : "";
}
/* the legend beside the table: stage colours, standard-status colours and the dagger */
function keybarHTML() {
  const st = [0, 1, 2, 3, 4, 5].map((s) => `<span class="ks s${s}"><i aria-hidden="true"></i><b>${s}</b>${stageTerm(s)}</span>`).join("");
  const ss = STATUSES.filter((v) => D.chains.some((c) => hasSS(c, v))).map((v) => `<span class="ks"><i class="ssw ${v}" aria-hidden="true"></i>${termRef(esc(L("ss")[v]), "ss." + v, L("ss")[v])}</span>`).join("");
  return `<div class="keybar" role="note" aria-label="${esc(L("keys_h"))}"><div class="kg"><span class="kt">${esc(L("stage_label"))}</span>${st}</div><div class="kg"><span class="kt">${esc(L("ss_label"))}</span>${ss}</div><div class="kg"><span class="kd">${esc(L("dagger_key"))}</span></div></div>`;
}
/* the sort control: a design-system dropdown (listbox), operable by mouse, touch and keyboard */
const ICON_CHEV = `<svg class="chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function sortHTML() {
  return `<div class="dd" id="sortdd"><span class="sr" id="sort-l">${esc(L("sort_by"))}</span>
    <button type="button" class="dd-btn" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="sort-l sort-v"><span class="dd-k" aria-hidden="true">${esc(L("sort_by"))}</span><span class="dd-v" id="sort-v">${esc(L("sort_" + state.sort))}</span>${ICON_CHEV}</button>
    <ul class="dd-list" role="listbox" tabindex="-1" aria-labelledby="sort-l" hidden>${SORTS.map((k) => `<li role="option" id="so-${k}" data-v="${k}" aria-selected="${state.sort === k}">${esc(L("sort_" + k))}</li>`).join("")}</ul></div>`;
}
/* charts: every one has a title, a one-line subtitle, the source and date, and its numbers as a CSV */
const ICON_DL = `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_LINK = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 014 4l-1 1M9 11.5l-1 1a2.8 2.8 0 01-4-4l1-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
function fig(o) {
  return `<figure class="fig" id="${o.id}" aria-labelledby="${o.id}-h"><div class="fig-h"><div class="fig-t"><${o.h} id="${o.id}-h">${esc(o.title)}</${o.h}>${o.tools || ""}</div><p>${o.sub}</p></div><div class="fig-b">${o.body}</div>
    <figcaption class="fig-f"><span>${esc(L("fig_src"))}${CO()}${o.src} · ${esc(L("fig_checked")(fmtDate(D.checked)))}</span>${o.csv ? `<span class="acts"><a href="${D.base}data/${o.csv}" download>${ICON_DL}${esc(L("fig_dl"))}</a></span>` : ""}</figcaption></figure>`;
}
const SRC_CHAINS = `<a href="${href("data/")}">${esc(L("src_site"))}</a>`;
/* a search with no match: what was searched, how else to search, and the way to ask for a listing */
const notFound = (q, dym) => `<b>${esc(L("nf_q")(q.trim().slice(0, 40)))}</b>${dym}<span>${esc(L("nf_hint"))}</span><span>${esc(L("sub_h"))}${SEP(L("sub_h"))}<a href="${URL_SUBMIT}" target="_blank" rel="noopener">${esc(L("foot_btn_submit"))} ↗</a></span>`;
const submitBox = () => `<div class="card subbox"><div><b>${esc(L("sub_h"))}</b><p>${esc(L("sub_p"))}</p></div><a class="btn primary" href="${URL_SUBMIT}" target="_blank" rel="noopener">${esc(L("foot_btn_submit"))} ↗</a></div>`;
const anchorBtn = (id, title) => `<button type="button" class="anchor" data-anchor="${id}" aria-label="${esc(L("copy_link"))}${CO()}${esc(title)}">${ICON_LINK}</button>`;
const secH = (id, eyebrow, title, lede) => `<div class="sec-h">${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ""}<div class="h2row"><h2 id="${id}-h">${esc(title)}</h2>${anchorBtn(id, title)}</div>${lede ? `<p>${lede}</p>` : ""}</div>`;
/* chart 1: the largest chains as one bar stacked by stage */
function stackHTML(top) {
  const by = [0, 1, 2, 3, 4, 5].map((s) => top.filter((c) => c.stage === s).length);
  const segs = by.map((n, s) => n ? `<button type="button" class="s${s}" style="--n:${n}" data-stage="${s}" aria-pressed="${state.stage === s && state.scope === "top"}" aria-label="${esc(L("ov_seg")(s, stageName(s), n))}" data-tip="${esc(L("ov_seg")(s, stageName(s), n))}"><i aria-hidden="true">${s}</i><span>${n}</span></button>` : "").join("");
  const legend = by.map((n, s) => `<button type="button" class="s${s}" data-stage="${s}"${n ? "" : " disabled"} aria-label="${esc(L("ov_seg")(s, stageName(s), n))}"><span class="k"><i></i>${s} · ${esc(stageName(s))}</span><span class="c">${n}</span></button>`).join("");
  const who = `<div class="who">${[5, 4, 3, 2].filter((s) => by[s]).map((s) => `<div class="who-r">${badge(s)}<span>${top.filter((c) => c.stage === s).sort((a, b) => a.rank - b.rank).map((c) => `<a href="${chainURL(c.id)}">${esc(name(c))}</a>`).join(lang === "zh" ? "、" : ", ")}</span></div>`).join("")}
    <p class="note-small">${esc(L("ov_rest")(by[0] + by[1]))}</p></div>`;
  return fig({ id: "fig-stages", h: "h2", title: L("ov_title")(top.length), sub: esc(L("ov_note")(top.length, fmtDate(D.mcap_date))), csv: "chart-top-stages.csv",
    src: `${SRC_CHAINS} · ${esc(L("mcap_src")(fmtDate(D.mcap_date)))}`,
    body: `<div class="stack grow-x" role="group" aria-label="${esc(L("ov_title")(top.length))}">${segs}</div><div class="legend6">${legend}</div>${who}` });
}
const msUTC = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +(d.slice(8, 10) || 15));
/* chart 2: a step line of chains with post-quantum signatures live on mainnet, one step per chain, from the earliest */
function cumHTML() {
  const live = D.chains.filter((c) => c.stage >= 4);
  const pts = live.filter((c) => c.since).sort((a, b) => a.since.date.localeCompare(b.since.date) || a.name.localeCompare(b.name));
  const N = pts.length;
  if (!N) return "";
  const y0 = +pts[0].since.date.slice(0, 4), yc = +D.checked.slice(0, 4);
  const T0 = Date.UTC(y0, 0, 1), T1 = msUTC(D.checked);
  const X = (d) => (((msUTC(d) - T0) / (T1 - T0)) * 100).toFixed(2);
  const top = Math.ceil((N + 1) / 4) * 4;
  const Y = (i) => ((i / top) * 100).toFixed(2);
  let line = "M0,100";
  pts.forEach((c, i) => { line += `H${X(c.since.date)}V${(100 - Y(i + 1)).toFixed(2)}`; });
  line += "H100";
  const dots = pts.map((c, i) => {
    const tip = `${L("since_tip")(name(c), fmtDate(c.since.date), L("since_basis")[c.since.basis])} · ${stageTitle(c.stage)}${c.since.grade === "official" ? " · " + L("since_dagger") : ""}`;
    return `<a class="pt s${c.stage}" href="${chainURL(c.id)}" style="left:${X(c.since.date)}%;bottom:${Y(i + 1)}%" aria-label="${esc(tip)}" data-tip="${esc(tip)}"></a>`;
  }).join("");
  /* steps before the current year are named on the chart; neighbours less than 6% apart share one label */
  const early = pts.map((c, i) => ({ c, i })).filter(({ c }) => +c.since.date.slice(0, 4) < yc);
  const labels = [];
  for (const p of early) { const last = labels[labels.length - 1]; if (last && X(p.c.since.date) - X(last.at.c.since.date) < 6) { last.names.push(name(p.c)); last.at = p; } else labels.push({ names: [name(p.c)], at: p }); }
  const lab = labels.map(({ names, at }) => `<span class="sl" style="left:${X(at.c.since.date)}%;bottom:${Y(at.i + 1)}%" aria-hidden="true">${esc(names.join(lang === "zh" ? "、" : ", "))}</span>`).join("");
  const xl = []; for (let y = y0; y <= yc; y++) xl.push(`<span${(yc - y) % 2 ? ' class="d2"' : ""} style="left:${X(`${y}-01-01`)}%">${y}</span>`);
  const yl = [0, top / 2, top].map((v) => `<span style="bottom:${Y(v)}%">${v}</span>`).join("");
  const k = pts.filter((c) => +c.since.date.slice(0, 4) === yc).length;
  const keys = [5, 4].map((s) => `<span class="s${s}"><i class="round"></i>${esc(stageTitle(s))}</span>`).join("");
  return fig({ id: "fig-since", h: "h2", title: L("cum_title"), sub: esc(L("cum_note")(N, k, yc, live.length - N)), csv: "chart-mainnet-since.csv", src: SRC_CHAINS,
    body: `<div class="cum"><div class="yax" aria-hidden="true">${yl}</div><div class="cw"><div class="plot grow-y">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="area" d="${line}V100H0Z"/><path d="${line}"/></svg>${lab}${dots}
      <span class="ann" style="right:0;bottom:calc(${Y(N)}% + 12px)"><b>${N}</b> ${esc(L("cum_total"))}</span></div>
      <div class="xax" aria-hidden="true">${xl.join("")}</div></div></div><div class="keys">${keys}</div>` });
}
/* milestones over time: range and granularity change together (all by year, 2 years by month, 3 months by week) */
let mrange = "y2";
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
function bins(range) {
  const ev = D.events, c = D.checked;
  const cy = +c.slice(0, 4), cm = +c.slice(5, 7);
  const out = [];
  if (range === "all") {
    const y0 = ev.length ? +ev[0][0].slice(0, 4) : cy;
    for (let y = y0; y <= cy; y++) out.push({ k: String(y), lab: String(y), test: (d) => +d.slice(0, 4) === y });
  } else if (range === "y2") {
    for (let i = 23; i >= 0; i--) { const t = new Date(Date.UTC(cy, cm - 1 - i, 1)); const ym = isoDay(t).slice(0, 7); out.push({ k: ym, lab: lang === "zh" ? ym.replace("-", ".") : `${MON[t.getUTCMonth()]} ${t.getUTCFullYear()}`, test: (d) => d.slice(0, 7) === ym }); }
  } else {
    const now = msUTC(c), dow = (new Date(now).getUTCDay() + 6) % 7, mon = now - dow * 864e5;
    for (let i = 12; i >= 0; i--) { const a = mon - i * 7 * 864e5, b = a + 7 * 864e5; const lab = fmtDate(isoDay(a)); out.push({ k: isoDay(a), lab: lang === "zh" ? isoDay(a).slice(5) : lab.replace(/ \d{4}$/, ""), full: L("wk")(lab), test: (d) => d.length === 10 && msUTC(d) >= a && msUTC(d) < b }); }
  }
  return out.map((bn) => { const a = [0, 0, 0]; for (const [d, t] of ev) if (bn.test(d)) a[t]++; return Object.assign(bn, { a }); });
}
function monthsBody(range) {
  const rows = bins(range);
  const max = Math.max(1, ...rows.map((r) => r.a[0] + r.a[1] + r.a[2]));
  const top = max <= 4 ? 4 : Math.ceil(max / 2) * 2;
  const cols = rows.map((r) => {
    const segs = r.a.map((n, j) => n ? `<i class="s${j + 2}" style="height:${(n / top) * 100}%"></i>` : "").join("");
    const tip = L("mo_tip")(r.full || r.lab, r.a);
    return `<div class="mc" tabindex="0" data-tip="${esc(tip)}" aria-label="${esc(tip)}" role="img">${segs}</div>`;
  }).join("");
  const every = rows.length > 16 ? 3 : rows.length > 8 ? 2 : 1;
  const xl = rows.map((r, i) => { const k = rows.length - 1 - i; return k % every ? "<span></span>" : `<span${every > 1 && k % (every * 2) ? ' class="d3"' : ""}>${esc(r.lab)}</span>`; }).join("");
  /* the years before the 2-year window are sparse: say how sparse, so the window does not hide them silently */
  let note = "";
  if (range !== "all") {
    const y = +rows[0].k.slice(0, 4) + (range === "y2" && rows[0].k.slice(5) !== "01" ? 1 : 0);
    const before = {}; for (const [d] of D.events) { const yy = +d.slice(0, 4); if (yy < y) before[yy] = (before[yy] || 0) + 1; }
    const m = Math.max(0, ...Object.values(before));
    if (m) note = `<p class="fine-note mo-note">${esc(L("mo_sparse")(y, m))}</p>`;
  }
  return `<div class="mchart"><div class="yax" aria-hidden="true"><span>${top}</span><span>${top / 2}</span><span>0</span></div><div class="mplot"><div class="mbars grow-y" style="--cols:${rows.length}">${cols}</div><div class="mx" aria-hidden="true" style="--cols:${rows.length}">${xl}</div></div></div>${note}`;
}
function monthsHTML() {
  const seg = `<div class="seg" role="group" aria-label="${esc(L("rng_label"))}">${["all", "y2", "m3"].map((r) => `<button type="button" data-rng="${r}" aria-pressed="${mrange === r}">${esc(L("rng")[r])}</button>`).join("")}</div>`;
  const keys = L("mo_types").map((t, j) => `<span class="s${j + 2}"><i></i>${esc(t)}</span>`).join("");
  return fig({ id: "fig-months", h: "h3", title: L("mo_title2"), sub: esc(L("mo_note2")(D.chain_count)), csv: "chart-milestones-month.csv", src: SRC_CHAINS, tools: seg,
    body: `<div id="mbody">${monthsBody(mrange)}</div><div class="keys">${keys}</div><p class="fine-note" style="margin-top:var(--sp-3)">${esc(L("mo_fine"))}</p>` });
}
/* the same dates by year, with every chain named; empty years collapse into one span */
function sinceHTML() {
  const live = D.chains.filter((c) => c.stage >= 4);
  const dated = live.filter((c) => c.since).sort((a, b) => a.since.date.localeCompare(b.since.date) || a.name.localeCompare(b.name));
  const undated = live.filter((c) => !c.since).sort((a, b) => name(a).localeCompare(name(b)));
  const chip = (c, withMonth) => {
    const tip = c.since ? L("since_tip")(name(c), fmtDate(c.since.date), L("since_basis")[c.since.basis]) : `${name(c)} · ${L("since_na")}`;
    const mo = withMonth ? `<span class="m">${esc(lang === "zh" ? +c.since.date.slice(5, 7) + " 月" : MON[+c.since.date.slice(5, 7) - 1])}</span>` : "";
    return `<a class="rc s${c.stage}" href="${chainURL(c.id)}" data-tip="${esc(tip)}" aria-label="${esc(tip)}"><b>${c.stage}</b>${esc(name(c))}${mo}</a>`;
  };
  let cols = "";
  if (dated.length) {
    const y0 = +dated[0].since.date.slice(0, 4), y1 = +D.checked.slice(0, 4);
    let total = 0, gap = null;
    const flush = (end) => { if (gap != null) { cols += `<div class="yr gap"><div class="yh"><b>${gap === end ? gap : `${gap}–${String(end).slice(2)}`}</b></div></div>`; gap = null; } };
    for (let y = y0; y <= y1; y++) {
      const inY = dated.filter((c) => +c.since.date.slice(0, 4) === y);
      if (!inY.length) { if (gap == null) gap = y; continue; }
      flush(y - 1);
      total += inY.length;
      cols += `<div class="yr"><div class="yh"><b>${y}</b><span>${esc(L("since_year")(inY.length, total))}</span></div><div class="yl">${inY.map((c) => chip(c, true)).join("")}</div></div>`;
    }
    flush(y1);
  }
  const und = undated.length ? `<div class="und"><span class="lab">${esc(L("since_undated"))}</span>${undated.map((c) => chip(c, false)).join("")}</div>` : "";
  return fig({ id: "fig-years", h: "h3", title: L("since_title"), sub: esc(L("since_note")(live.length, undated.length)), csv: "chart-mainnet-since.csv", src: SRC_CHAINS,
    body: `<div class="rail">${cols}</div>${und}` });
}
/* how long post-quantum signatures have run on each mainnet: one bar per chain, from its start date to the check date */
function runHTML() {
  const dated = D.chains.filter((c) => c.stage >= 4 && c.since).sort((a, b) => a.since.date.localeCompare(b.since.date) || a.name.localeCompare(b.name));
  if (!dated.length) return "";
  const y0 = +dated[0].since.date.slice(0, 4), yc = +D.checked.slice(0, 4);
  const T0 = Date.UTC(y0, 0, 1), T1 = msUTC(D.checked);
  const X = (d) => (((msUTC(d) - T0) / (T1 - T0)) * 100).toFixed(2);
  /* a bar that starts within 14% of the left edge carries its length inside, so it never runs into the name */
  const rows = dated.map((c) => {
    const days = Math.round((T1 - msUTC(c.since.date)) / 864e5);
    const tip = `${L("since_tip")(name(c), fmtDate(c.since.date), L("since_basis")[c.since.basis])} · ${L("run_len")(days)}${c.since.grade === "official" ? " · " + L("since_dagger") : ""}`;
    return `<a class="rr" href="${chainURL(c.id)}" data-tip="${esc(tip)}" aria-label="${esc(tip)}"><span class="rn">${esc(name(c))}${dagger(c.since.grade)}</span><span class="rt"><i class="rb s${c.stage}" style="left:${X(c.since.date)}%"></i><span class="rl${+X(c.since.date) < 14 ? " in" : ""}" style="left:${X(c.since.date)}%">${esc(L("run_len")(days))}</span></span></a>`;
  }).join("");
  const xl = []; for (let y = y0; y <= yc; y++) xl.push(`<span${(yc - y) % 2 ? ' class="d2"' : ""} style="left:${X(`${y}-01-01`)}%">${y}</span>`);
  return fig({ id: "fig-run", h: "h3", title: L("run_title"), sub: esc(L("run_note")(fmtDate(D.checked))), csv: "chart-mainnet-since.csv", src: SRC_CHAINS,
    body: `<div class="run grow-x">${rows}<div class="rr ax" aria-hidden="true"><span></span><span class="rt xax">${xl.join("")}</span></div></div>` });
}
/* algorithm map: chains at stage 2 or higher, one row per NIST mathematical family (lattice, hash-based, multivariate …),
   each scheme coloured by its NIST status. A chain naming two schemes appears twice; a dashed outline marks a variant or
   a version NIST has not reviewed, and a filled dot marks chains whose new accounts use the scheme by default */
const NFAMS = ["lattice", "hash", "multivariate", "code", "isogeny", "mpcith", "symmetric", "other"];
const NSTS = ["fips", "draft", "sp800208", "round3", "dropped", "broken", "notnist"];
const NIST_SRC = {
  fips: [["https://csrc.nist.gov/pubs/fips/204/final", "FIPS 204"], ["https://csrc.nist.gov/pubs/fips/205/final", "FIPS 205"]],
  draft: [["https://csrc.nist.gov/projects/post-quantum-cryptography", "NIST PQC"]],
  sp800208: [["https://csrc.nist.gov/pubs/sp/800/208/final", "SP 800-208"]],
  round3: [["https://csrc.nist.gov/projects/pqc-dig-sig/round-3-additional-signatures", "NIST round 3"]],
  dropped: [["https://nvlpubs.nist.gov/nistpubs/ir/2022/NIST.IR.8413-upd1.pdf", "NIST IR 8413"], ["https://eprint.iacr.org/2022/214", "Beullens 2022"]],
  broken: [["https://eprint.iacr.org/2022/975", "Castryck and Decru 2022 (SIKE)"]],
};
function algoMapHTML() {
  const cs = D.chains.filter((c) => c.stage >= 2 && c.nist && c.nist.length);
  const entries = cs.flatMap((c) => c.nist.map((n) => ({ c, n })));
  const rows = NFAMS.map((f) => {
    const inR = entries.filter(({ n }) => n.fam === f)
      .sort((a, b) => NSTS.indexOf(a.n.st) - NSTS.indexOf(b.n.st) || b.c.stage - a.c.stage || (a.c.rank || 999) - (b.c.rank || 999) || a.c.name.localeCompare(b.c.name));
    if (!inR.length) return "";
    const schemes = [...new Set(inR.map(({ n }) => n.scheme || L("nist_own")))].join(lang === "zh" ? "、" : ", ");
    const chips = inR.map(({ c, n }) => {
      const sch = n.scheme || L("nist_own");
      const tip = `${name(c)} · ${stageTitle(c.stage)} · ${sch} · ${L("nist")[n.st]}${n.var ? " · " + L("nist_var") : ""}${n.scheme === "Rainbow" ? " · " + L("nist_rainbow") : ""}${n.scheme === "WOTS+" ? " · " + L("nist_wots") : ""}${c.stage === 5 ? " · " + L("cov").default : ""}`;
      return `<a class="am n-${n.st}${n.var ? " vr" : ""}${c.stage === 5 ? " dft" : ""}" href="${chainURL(c.id)}" data-tip="${esc(tip)}" aria-label="${esc(tip)}"><b>${c.stage}</b>${esc(name(c))}<span class="am-s">${esc(sch)}</span></a>`;
    }).join("");
    return `<div class="am-r"><div class="am-f"><span>${esc(L("nfam")[f])}<b>${inR.length}</b></span><small>${esc(schemes)}</small></div><span class="am-c">${chips}</span></div>`;
  }).join("");
  const used = NSTS.filter((v) => entries.some(({ n }) => n.st === v));
  const keys = used.map((v) => `<span><i class="ssw n-${v}"></i>${term(esc(L("nist")[v]), DF.nist[v], L("nist")[v])}</span>`).join("")
    + (entries.some(({ n }) => n.var) ? `<span><i class="ssw vr" aria-hidden="true"></i>${term(esc(L("nist_var_k")), DF.nist_var, L("nist_var_k"))}</span>` : "");
  return fig({ id: "fig-algo", h: "h3", title: L("am_title"), sub: esc(`${L("am_note")(cs.length)}${SEP(L("am_note")(cs.length))}${L("map_multi")}`), src: `${SRC_CHAINS} · <a href="https://csrc.nist.gov/projects/post-quantum-cryptography" target="_blank" rel="noopener">NIST ↗</a>`,
    body: `<div class="amap">${rows}</div><div class="keys">${keys}<span><i class="amd" aria-hidden="true"></i>${esc(L("cov").default)}</span></div><p class="fine-note">${esc(L("nist_next"))}</p>` });
}
/* layer 2: the five questions a holder asks; each card states its rule and opens the matching table */
function q5HTML() {
  const by = (v) => D.chains.filter(VIEW[v]);
  const show = (v, n) => `<button type="button" class="btn qcta" data-view="${v}"${n ? "" : " disabled"}>${esc(L("q_show")(n))} <span aria-hidden="true">→</span></button>`;
  const link = (c, extra) => `<li><a href="${chainURL(c.id)}"><b class="gs s${c.stage}" aria-label="${esc(stageTitle(c.stage))}">${c.stage}</b>${esc(name(c))}</a>${extra || ""}</li>`;
  /* a long list shows its first entries and a button that unfolds the rest in place, and folds them again */
  const more = (n, max) => n > max ? `<li class="more-n"><button type="button" class="link-btn" data-fold aria-expanded="false" data-n="${n - max}">${esc(L("list_more")(n - max))}</button></li>` : "";
  const items = (a, max, f) => a.map((c, i) => i < max ? f(c) : f(c).replace(/^<li/, "<li hidden data-x")).join("");
  const card = (cls, h, rule, n, body, v) => `<div class="card qcard ${cls}"><div class="qh"><h3>${esc(h)}</h3><span class="qn">${n}</span></div><p class="qr">${esc(rule)}</p>${body}${v ? show(v, n) : ""}</div>`;
  const use = by("use").sort((a, b) => b.stage - a.stage || (a.since ? a.since.date : "9").localeCompare(b.since ? b.since.date : "9"));
  const tag = (c) => `<span class="qt ${c.stage === 5 ? "def" : "opt"}">${esc(L(c.stage === 5 ? "t_default" : "t_optin"))}</span>${c.schemes.filter(([k]) => k !== "none").map(([k, st]) => `<span class="qt ss ${st}">${esc(SCHEME[k] ? `${SCHEME[k]} · ${L("ss_s")[st]}` : L("ss")[st])}</span>`).join("")}${c.audit ? `<span class="qt au ${c.audit}">${esc(L("audit")[c.audit])}</span>` : ""}`;
  const close = by("close").sort((a, b) => (a.rank || 999) - (b.rank || 999));
  const move = by("move").sort((a, b) => progKey(b).localeCompare(progKey(a)) || defaultOrder(a, b));
  const quiet = by("quiet").sort((a, b) => a.rank - b.rank);
  const risk = ["broken", "custom", "claim"].map((v) => { const n = by(v).length; return `<li><button type="button" class="qrisk" data-view="${v}"${n ? "" : " disabled"}><b>${n}</b><span>${esc(L("risk")[v])}</span><span class="go-a" aria-hidden="true">→</span></button></li>`; }).join("");
  const M = 8;
  const cards = [
    card("q-use", L("q_use_h"), L("q_use_r"), use.length, `<ul class="ql tags">${items(use, M, (c) => link(c, tag(c)))}${more(use.length, M)}</ul>`, "use"),
    card("q-close", L("q_close_h"), L("q_close_r"), close.length, close.length ? `<ul class="ql">${close.map((c) => link(c, c.next ? `<span class="qx">${esc(T(c.next))}</span>` : "")).join("")}</ul>` : `<p class="qr">${esc(L("q_none"))}</p>`, "close"),
    card("q-move", L("q_move_h"), L("q_move_r")(fmtDate(D.checked)), move.length, `<ul class="ql">${items(move, M, (c) => link(c, `<span class="qd mono">${esc(fmtDate(c.prog.latest.date))}</span>`))}${more(move.length, M)}</ul>`, "move"),
    card("q-quiet", L("q_quiet_h"), L("q_quiet_r")(fmtDate(D.checked)), quiet.length, `<ul class="qnames">${items(quiet, 12, (c) => `<li><a href="${chainURL(c.id)}">${esc(name(c))}</a></li>`)}${more(quiet.length, 12)}</ul>`, "quiet"),
    card("q-risk", L("q_risk_h"), L("q_risk_r"), "", `<ul class="qrl">${risk}</ul>`, ""),
  ].join("");
  return `<section id="questions" class="layer" aria-labelledby="questions-h">${secH("questions", "", L("q5_h"), esc(L("q5_note")))}<div class="q5">${cards}</div></section>`;
}
/* a short version of the method for the home page; the full text has its own page */
function howShort() {
  const M = METHOD[lang];
  return `<section id="how" class="layer" aria-labelledby="how-h">${secH("how", L("nav_method"), L("how_h"), esc(M.lede))}
    <div class="stages6">${DF.stage.map((t, s) => `<div class="card st">${badge(s)}${bar6(s)}<p>${esc(t)}</p></div>`).join("")}</div>
    <a class="btn more-link" href="${href("method/")}">${esc(L("how_more"))} <span aria-hidden="true">→</span></a></section>`;
}
function dataHTML() {
  const M = METHOD[lang];
  const file = (n, sub) => `<a class="file" href="${D.base}${n.endsWith(".txt") ? "" : "data/"}${n}"><span class="fn mono">${n}</span><span class="fs">${esc(sub)}</span></a>`;
  return `<section id="data" class="layer" aria-labelledby="data-h">${secH("data", L("nav_data"), L("data_h"), esc(L("data_lede")))}
    <div class="tri">
      <div class="card box"><h3>${esc(L("data_dl_h"))}</h3><div class="files">${Object.entries(L("data_files")).map(([n, sub]) => file(n, sub)).join("")}</div><p class="fine-note">${esc(L("data_lic"))}</p></div>
      <div class="card box"><h3>${esc(L("data_ai_h"))}</h3><p>${esc(L("data_ai_p"))}</p><div class="files">${file("llms.txt", L("data_llms"))}</div></div>
      <div class="card box"><h3>${esc(L("data_cite_h"))}</h3><code class="cite" id="cite-text">${esc(M.cite(D.release.version, D.release.date, D.site_url))}</code>
        <div class="row"><button type="button" class="btn" id="copy-cite">${esc(L("copy"))}</button><button type="button" class="btn" data-bib>${esc(L("strip_bib"))}</button><a href="${href("method/")}#cite">${esc(L("foot_cite_link"))} <span aria-hidden="true">→</span></a></div></div>
    </div></section>`;
}
function contactHTML() {
  const urls = [URL_TALK, URL_FIX, URL_SUBMIT, URL_X];
  return `<section id="contact" class="layer" aria-labelledby="contact-h">${secH("contact", L("nav_contact"), L("ct_h"), `${esc(L("ct_lede"))}${SEP(L("ct_lede"))}<b>${esc(L("ct_reply"))}</b>`)}
    <div class="contacts">${L("ct").map(([h, sub], i) => `<a class="card ct" href="${urls[i]}" target="_blank" rel="noopener"><b>${esc(h)} <span aria-hidden="true">↗</span></b><span>${esc(sub)}</span></a>`).join("")}</div>
    <p class="ct-list">${esc(L("ct_list"))}${SEP(L("ct_list"))}<a href="${URL_LOG}" target="_blank" rel="noopener">${esc(L("ct_log"))} ↗</a></p>
    <div class="card about" id="about"><h3>${esc(L("about_h"))}</h3><p>${esc(L("about_who"))}</p><p>${esc(L("about_money"))}</p><p>${esc(L("about_ind"))}</p>
      <p class="about-l"><span>${esc(L("about_links"))}${CO()}</span><a href="https://github.com/Balance0014" target="_blank" rel="noopener">GitHub · Balance0014 ↗</a><a href="${URL_X}" target="_blank" rel="noopener">X · @balance0014 ↗</a></p></div></section>`;
}
const reduced = () => !PRE && matchMedia("(prefers-reduced-motion: reduce)").matches;
function renderTable(write) {
  const t = tableBody();
  const tb = document.getElementById("tbody");
  tb.innerHTML = t.html;
  if (!reduced()) { tb.classList.remove("enter"); void tb.offsetWidth; tb.classList.add("enter"); }
  document.getElementById("count").textContent = t.count;
  const more = document.getElementById("showall"); more.hidden = t.total <= FIRST; more.firstElementChild.textContent = expanded ? L("show_less") : L("show_all")(t.total); more.firstElementChild.setAttribute("aria-expanded", String(expanded));
  document.getElementById("active").innerHTML = activeHTML();
  document.querySelectorAll(".fbtn[data-k]").forEach((b) => {
    const k = b.dataset.k, v = b.dataset.v === "" ? null : (k === "stage" ? +b.dataset.v : b.dataset.v);
    const n = countWith(k, v), on = state[k] === v;
    b.querySelector(".n").textContent = n;
    b.setAttribute("aria-pressed", String(on));
    b.disabled = !on && n === 0;
  });
  document.querySelectorAll(".stack button").forEach((b) => b.setAttribute("aria-pressed", String(state.stage === +b.dataset.stage && state.scope === "top")));
  syncSort(); clampCheck();
  if (write) writeHash();
}
function syncSort() {
  document.querySelectorAll(".ledger th button").forEach((b) => {
    const k = b.dataset.sort; const on = (k === "stage" && state.sort.startsWith("stage")) || k === state.sort;
    const asc = ["stage_a", "name", "since"].includes(state.sort);
    if (on) b.setAttribute("aria-sort", asc ? "ascending" : "descending"); else b.removeAttribute("aria-sort");
    b.querySelector(".ar").textContent = on && asc ? "↑" : "↓";
  });
  const v = document.getElementById("sort-v"); if (v) v.textContent = L("sort_" + state.sort);
  document.querySelectorAll("#sortdd [role=option]").forEach((o) => o.setAttribute("aria-selected", String(o.dataset.v === state.sort)));
}
/* show "More" only where the two-line clamp actually hides text */
let clampOn = false; // measured only once the table is near the screen, so loading the page forces no layout of it
function clampCheck() {
  if (!clampOn) return;
  document.querySelectorAll(".latest").forEach((l) => { const x = l.querySelector(".x"), b = l.querySelector(".more"); if (b) b.hidden = !(x.scrollHeight > x.clientHeight + 2 || l.classList.contains("open")); });
}
/* the sort dropdown's behaviour: click or Enter opens; arrows, Home and End move; Enter or click picks; Escape closes */
function initSort(onPick) {
  const dd = document.getElementById("sortdd"), btn = dd.querySelector(".dd-btn"), list = dd.querySelector(".dd-list");
  const opts = () => [...list.querySelectorAll("[role=option]")];
  let act = 0;
  const mark = (i) => { act = (i + opts().length) % opts().length; opts().forEach((o, j) => o.classList.toggle("act", j === act)); list.setAttribute("aria-activedescendant", opts()[act].id); opts()[act].scrollIntoView({ block: "nearest" }); };
  const open = () => { list.hidden = false; btn.setAttribute("aria-expanded", "true"); dd.classList.add("open"); mark(SORTS.indexOf(state.sort)); list.focus(); };
  const close = (refocus) => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); dd.classList.remove("open"); if (refocus) btn.focus(); };
  const pick = (i) => { onPick(opts()[i].dataset.v); close(true); };
  btn.addEventListener("click", () => (list.hidden ? open() : close(false)));
  btn.addEventListener("keydown", (e) => { if (["ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); open(); } });
  list.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k === "ArrowDown") mark(act + 1); else if (k === "ArrowUp") mark(act - 1); else if (k === "Home") mark(0); else if (k === "End") mark(opts().length - 1);
    else if (k === "Enter" || k === " ") pick(act); else if (k === "Escape" || k === "Tab") { close(k === "Escape"); if (k === "Tab") return; } else return;
    e.preventDefault();
  });
  list.addEventListener("click", (e) => { const o = e.target.closest("[role=option]"); if (o) pick(opts().indexOf(o)); });
  list.addEventListener("mousemove", (e) => { const o = e.target.closest("[role=option]"); if (o) mark(opts().indexOf(o)); });
  /* capture phase: a click on a term's tooltip stops the click from bubbling, and must still close the menu */
  document.addEventListener("click", (e) => { if (!list.hidden && !dd.contains(e.target)) close(false); }, true);
}
/* motion: KPI numbers count up once, charts grow the first time they scroll into view (transform and opacity only) */
function initMotion() {
  if (reduced() || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("anim");
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0, rootMargin: "0px 0px -15% 0px" });
  document.querySelectorAll(".fig").forEach((f) => io.observe(f));
  document.querySelectorAll(".kpi .v [data-n]").forEach((el) => {
    const n = +el.dataset.n, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / 600); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    el.textContent = "0"; requestAnimationFrame(step);
  });
}
/* the third home card: chains with posts on X in the 90 days before the check, counted at build time (D.xs) */
function xCard() {
  const s = D.xs, [a, t, b] = L("kpi_x")(s.posts);
  return `<div class="card kpi xk"><span class="v"><span data-n="${s.chains}">${s.chains}</span><small>/${D.chain_count}</small></span><span class="l">${esc(a)}${termRef(esc(t), "xtalk", t)}${esc(b)}</span><a class="xk-go" href="${href("x/")}">${esc(L("kpi_x_go"))} <span aria-hidden="true">→</span></a><span class="xk-n">${esc(L("kpi_x_note"))}</span></div>`;
}
function renderHome() {
  chrome("home");
  const fromHash = !PRE && readHash();
  const top = D.chains.filter((c) => c.rank != null);
  const usable = top.filter((c) => c.stage >= 4).sort((a, b) => a.rank - b.rank);
  const t3 = top.filter((c) => c.stage === 3).sort((a, b) => a.rank - b.rank).map(name);
  const th = (k, sortKeyName, cls) => sortKeyName
    ? `<th scope="col" class="${cls}"><button type="button" data-sort="${sortKeyName}">${esc(L(k))}<span class="ar" aria-hidden="true">↓</span></button>${info(DF[k], L(k))}</th>`
    : `<th scope="col" class="${cls}">${term(esc(L(k)), DF[k], L(k))}</th>`;
  const tb = tableBody();
  const num = (n) => `<span data-n="${n}">${n}</span>`;
  const kpi = (v, l, cls) => `<div class="card kpi${cls ? " " + cls : ""}"><span class="v">${v}</span><span class="l">${esc(l)}</span></div>`;
  const big = top.filter((c) => c.rank <= 2).sort((a, b) => a.rank - b.rank);
  const bigLine = [...new Set(big.map((c) => c.stage))].map((st) => { const g = big.filter((c) => c.stage === st); return esc(L("big")(list(g.map(name)), st, "\u0001")).replace("\u0001", stageTerm(st)); }).join(" ");
  const all = D.chains.length, use = D.chains.filter((c) => c.stage >= 4), def = use.filter((c) => c.stage === 5).length;
  const dated = use.filter((c) => c.since).length, natMig = D.chains.filter((c) => c.mig && c.mig.value === "native").length;
  const notNat = use.filter((c) => c.stage === 5 && !(c.mig && c.mig.value === "native")).map(name);
  const recon = `<div class="recon"><p>${esc(L("recon")(all, top.length, all - top.length, use.length, def, use.length - def, usable.length))}</p><ul>${dated < use.length ? `<li>${esc(L("recon_dates")(dated, use.length))}</li>` : ""}${notNat.length ? `<li>${esc(L("recon_mig")(natMig, def, list(notNat)))}</li>` : ""}</ul></div>`;
  const check = `<form class="check" id="check" role="search"><label for="check-q">${esc(L("check_l"))}</label><span class="search">${ICON_SEARCH}<input id="check-q" list="check-l" autocomplete="off" placeholder="${esc(L("check_ph"))}"></span><button type="submit" class="btn primary">${esc(L("check_go"))}</button>
    <datalist id="check-l">${[...D.chains].sort((a, b) => (a.rank || 999) - (b.rank || 999)).map((c) => `<option value="${esc(name(c))} ${esc(c.ticker)}"></option>`).join("")}</datalist><p class="check-x" id="check-x" role="status" hidden></p></form>`;
  const verdict = L("verdict")(usable.length, top.length).replace(/<em>(.*?)<\/em>/, (m, t) => `<em>${term(t, DF.pqsig, t)}</em>`);
  put("app", () => `<div class="page">
    <section id="overview" class="layer" aria-label="${esc(L("nav_overview"))}">
      <div class="hero"><h1>${verdict}</h1><p>${esc(L("verdict_sub")(list(usable.map(name)), list(t3)))}</p>${check}</div>
      <div class="kpis">
        ${kpi(`${num(usable.length)}<small>/${top.length}</small>`, L("kpi_top"), "lead")}${kpi(`${num(use.length)}<small>/${all}</small>`, L("kpi_use")(def, use.length - def))}${xCard()}
      </div>
      <p class="kpi-date">${esc(L("kpi_date_line")(fmtDate(D.checked)))}</p>
      <details class="howc"><summary>${esc(L("howc"))}${ICON_CHEV}</summary><div class="howc-b"><p class="big">${bigLine}</p>${recon}<p>${esc(L("scope_eyebrow")(top.length, fmtDate(D.mcap_date || D.checked)))}${lang === "zh" ? "。" : ". "}${esc(L("who"))}</p></div></details>
      <div class="duo">${stackHTML(top)}${cumHTML()}</div>
      ${algoMapHTML()}
    </section>
    ${q5HTML()}
    <section id="chains" class="layer" aria-labelledby="chains-h">
      ${secH("chains", L("nav_chains"), L("list_h")(D.chains.length), "")}
      <div class="toolbar">
        <label class="search">${ICON_SEARCH}<span class="sr">${esc(L("search"))}</span><input id="q" type="search" autocomplete="off" placeholder="${esc(L("search"))}" value="${esc(state.q)}"><kbd aria-hidden="true">/</kbd></label>
        ${sortHTML()}
      </div>
      ${filtersHTML()}
      <div class="list-h"><div class="active-f" id="active">${activeHTML()}</div><span class="count" id="count" role="status">${esc(tb.count)}</span></div>
      ${keybarHTML()}
      <div class="tablebox"><table class="ledger">
        <thead><tr>${th("th_chain", "name", "c-chain")}${th("th_stage", "stage", "c-stage")}${th("th_algo", null, "c-algo")}${th("th_cov", null, "c-cov")}${th("th_since", "since", "c-since")}${th("th_prog", "prog", "c-latest")}<th scope="col" class="c-go"><span class="sr">${esc(L("th_open"))}</span></th></tr></thead>
        <tbody id="tbody">${tb.html}</tbody></table></div>
      <div class="showall" id="showall"${tb.total > FIRST ? "" : " hidden"}><button type="button" class="btn" aria-expanded="false" aria-controls="tbody">${esc(L("show_all")(tb.total))}</button><noscript><a class="btn" href="${D.base}data/chains.csv">chains.csv</a></noscript></div>
      ${submitBox()}
    </section>
    <section id="timeline" class="layer" aria-labelledby="timeline-h">
      ${secH("timeline", L("nav_timeline"), L("tl_h"), "")}
      ${runHTML()}
      ${monthsHTML()}
      ${sinceHTML()}
      ${D.has_changes ? `<a class="btn more-link" href="${href("changes/")}">${esc(L("tl_changes"))} <span aria-hidden="true">→</span></a>` : ""}
    </section>
    ${howShort()}
    ${dataHTML()}
    ${contactHTML()}</div>`);
  if (PRE) return;
  syncSort();
  const tbody = document.getElementById("tbody");
  if ("IntersectionObserver" in window) {
    const near = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { near.disconnect(); clampOn = true; clampCheck(); } }, { rootMargin: "800px 0px" });
    near.observe(tbody);
  } else { clampOn = true; clampCheck(); }
  const app = document.getElementById("app");
  const q = document.getElementById("q");
  q.value = state.q; /* a link such as #chains?q=near fills the search box as well as the table */
  const toTable = () => document.getElementById("chains").scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
  const reset = (keep) => { Object.assign(state, DEFAULT, { sort: state.sort }, keep || {}); q.value = state.q; };
  initSort((v) => { state.sort = v; renderTable(true); });
  q.addEventListener("input", () => { state.q = q.value; renderTable(true); });
  app.addEventListener("click", (e) => {
    const f = e.target.closest(".fbtn[data-k]");
    if (f) { const k = f.dataset.k, v = f.dataset.v === "" ? null : (k === "stage" ? +f.dataset.v : f.dataset.v); state[k] = state[k] === v ? null : v; renderTable(true); return; }
    const u = e.target.closest("[data-unset]");
    if (u) { const k = u.dataset.unset; if (k === "q") { state.q = ""; q.value = ""; } else state[k] = null; renderTable(true); q.focus(); return; }
    if (e.target.closest("[data-clear]")) { reset(); renderTable(true); q.focus(); return; }
    const vw = e.target.closest("[data-view]");
    if (vw) { reset({ view: vw.dataset.view }); renderTable(true); toTable(); return; }
    const rg = e.target.closest("[data-rng]");
    if (rg) { mrange = rg.dataset.rng; document.getElementById("mbody").innerHTML = monthsBody(mrange); document.querySelectorAll("[data-rng]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.rng === mrange))); return; }
    const s = e.target.closest(".stack button, .legend6 button");
    if (s) { const v = +s.dataset.stage; const on = state.stage === v && state.scope === "top"; reset(on ? {} : { scope: "top", stage: v }); renderTable(true); if (!on) toTable(); return; }
    const a = e.target.closest(".anchor");
    if (a) { const id = a.dataset.anchor, qs = id === "chains" ? stateQS() : ""; const hash = "#" + id + (qs ? "?" + qs : ""); history.replaceState(null, "", hash); TIP.copy(a, location.origin + location.pathname + hash, L("link_copied")); return; }
    /* "Show all" expands in place; "Show fewer" folds the list and returns the reader to where they opened it */
    if (e.target.closest("#showall button")) {
      if (!expanded) { expanded = true; openY = document.querySelector("#showall button").getBoundingClientRect().top; renderTable(false); const r = document.querySelectorAll(".ledger tr.row")[FIRST]; if (r) r.querySelector("a").focus({ preventScroll: true }); }
      else { expanded = false; renderTable(false); const b = document.querySelector("#showall button"); window.scrollBy(0, b.getBoundingClientRect().top - openY); b.focus({ preventScroll: true }); }
      return;
    }
    const fd = e.target.closest("[data-fold]");
    if (fd) { foldList(fd); return; }
    const sg = e.target.closest("[data-suggest]");
    if (sg) { state.q = sg.dataset.suggest; q.value = state.q; renderTable(true); q.focus(); return; }
    const sb = e.target.closest(".ledger th button");
    if (sb) { const k = sb.dataset.sort; state.sort = k === "stage" ? (state.sort === "stage_d" ? "stage_a" : "stage_d") : (state.sort === k ? "default" : k); renderTable(true); }
  });
  document.getElementById("tbody").addEventListener("click", (e) => {
    const more = e.target.closest(".more");
    if (more) { const l = more.closest(".latest"); const open = l.classList.toggle("open"); more.textContent = L(open ? "less" : "more"); more.setAttribute("aria-expanded", String(open)); return; }
    if (e.target.closest("a, button, .term, .sdot")) return;
    const tr = e.target.closest("tr.row");
    if (tr && !window.getSelection().toString()) location.href = chainURL(tr.dataset.id);
  });
  const copy = document.getElementById("copy-cite");
  copy.addEventListener("click", () => TIP.copy(copy, document.getElementById("cite-text").textContent, L("copied"), document.getElementById("cite-text")));
  document.querySelectorAll("[data-cite]").forEach((b) => b.addEventListener("click", () => TIP.copy(b, document.getElementById("cite-text").textContent, L("copied"))));
  document.querySelectorAll("[data-bib]").forEach((b) => b.addEventListener("click", () => TIP.copy(b, bibtex(), L("copied"))));
  /* "Check a coin": an exact name or ticker opens its page; anything else opens the table filtered by it */
  document.getElementById("check").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = document.getElementById("check-q").value.trim(), n = norm(v), x = document.getElementById("check-x");
    if (!n) return;
    /* an exact name, ticker or alias opens the chain; one close match opens it too; several open the filtered table;
       none offers the nearest names instead of an empty table */
    const exact = D.chains.find((c) => keysOf(c).includes(n));
    const hits = D.chains.filter((c) => hitQ(c, v));
    if (exact || hits.length === 1) { location.href = chainURL((exact || hits[0]).id); return; }
    if (!hits.length) { const sug = suggest(v); x.hidden = false; x.innerHTML = sug.length ? `${esc(L("dym"))}${sug.map((c) => `<a href="${chainURL(c.id)}">${esc(name(c))} <span class="mono">${esc(c.ticker)}</span></a>`).join(lang === "zh" ? "、" : ", ")}` : `<span class="ei">${notFound(v, "")}</span>`; return; }
    x.hidden = true;
    reset({ q: v.slice(0, 80) }); q.value = state.q; renderTable(true); toTable();
  });
  /* "/" jumps to the search box */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || (e.target.closest && e.target.closest("input, textarea, select, [contenteditable], [role=listbox]"))) return;
    e.preventDefault(); q.focus(); q.select();
  });
  /* a link with filters ("#chains?…") applies them; any other in-page link, "#chains" included, keeps the
     reader's filters, and the address is put back so it still describes the table */
  window.addEventListener("hashchange", () => {
    if (location.hash.startsWith("#chains?")) { readHash(); q.value = state.q; renderTable(false); toTable(); }
    else if (location.hash === "#chains" && stateQS()) writeHash();
  });
  /* the header link for the section in view is marked; the language switch keeps the section and the filters */
  const links = document.querySelectorAll("a[data-sec]");
  const secs = ["overview", "questions", "chains", "timeline", "how", "data", "contact"].map((id) => document.getElementById(id));
  let spy = 0, cur = "overview";
  const mark = () => {
    spy = 0;
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    let el = atEnd ? secs[secs.length - 1] : secs[0];
    if (!atEnd) for (const s of secs) if (s.getBoundingClientRect().top < window.innerHeight * 0.35) el = s;
    cur = el.id;
    const id = cur === "questions" ? "overview" : cur;
    links.forEach((a) => { if (a.dataset.sec === id) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
  };
  window.addEventListener("scroll", () => { if (!spy) spy = requestAnimationFrame(mark); }, { passive: true });
  mark();
  TIP.pos = () => { const qs = stateQS(); return qs ? "#chains?" + qs : (cur !== "overview" && window.scrollY > 40 ? "#" + cur : location.hash); };
  /* coming back (the browser's Back or Forward) puts the reader where they left: same filters from the address,
     same "show all" state and the same scroll position, saved when they left the page */
  const nav = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  const back = nav && nav.type === "back_forward" && history.state && typeof history.state.y === "number" ? history.state : null;
  /* the anchor is the first table row on screen, else the section at the top of the screen, with its distance from
     the top: sections off screen are drawn lazily at an estimated height, so a bare scroll number lands elsewhere */
  const anchorNow = () => {
    for (const r of document.querySelectorAll("#tbody tr.row")) { const t = r.getBoundingClientRect(); if (t.bottom > 0 && t.top < window.innerHeight) return { row: r.dataset.id, off: t.top }; }
    let s = secs[0]; for (const x of secs) if (x.getBoundingClientRect().top <= 1) s = x;
    return { sec: s.id, off: s.getBoundingClientRect().top };
  };
  window.addEventListener("pagehide", () => { try { history.replaceState(Object.assign({ y: window.scrollY, exp: expanded }, anchorNow()), ""); } catch (e) { /* not allowed in some frames */ } });
  if (back && back.exp) expanded = true;
  if (fromHash || back) { renderTable(false); if (!back) document.getElementById("chains").scrollIntoView(); mark(); }
  /* "#timeline" and other section links: land on the section again once fonts and charts have settled, unless the reader has scrolled */
  const backTo = () => {
    const el = back.row ? document.querySelector(`#tbody tr.row[data-id="${CSS.escape(back.row)}"]`) : back.sec && document.getElementById(back.sec);
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - back.off); else window.scrollTo(0, back.y);
  };
  const sec = back ? { scrollIntoView: backTo } : !fromHash && /^#[a-z]+$/.test(location.hash) && document.getElementById(location.hash.slice(1));
  if (sec) {
    let moved = false;
    const stop = () => { moved = true; };
    ["wheel", "touchstart", "keydown"].forEach((t) => window.addEventListener(t, stop, { once: true, passive: true }));
    const go = () => { if (!moved) { sec.scrollIntoView(); mark(); } };
    go(); requestAnimationFrame(go);
    if (document.fonts) document.fonts.ready.then(() => requestAnimationFrame(go));
    window.addEventListener("load", go, { once: true });
  }
  initMotion();
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(clampCheck, 150); });
  if (document.fonts) document.fonts.ready.then(clampCheck);
}

/* ---------- chain page ---------- */
/* the independent explorer read when the chain's own endpoint shows an old block; one source alone never says "stopped" */
function xchkHTML(c) {
  const x = c.net.check;
  if (x) return `<br><span class="note-small">${((t) => esc(t) + SEP(t))(x.ok ? L("xchk_ok")(x.h.toLocaleString("en-US"), x.age) : L("xchk_no"))}<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(host(x.url))} ↗</a></span>`;
  return c.net.status === "unknown" && c.net.block.ok ? `<br><span class="note-small">${esc(L("xchk_none"))}</span>` : "";
}
function blockHTML(c) {
  const b = c.net.block;
  if (b.ok) return `<span class="mono">#${b.h.toLocaleString("en-US")}</span> · ${esc(b.t.replace("T", " ").replace("Z", " UTC"))}<br>${esc(L("blocks_ago")(b.age))}<br><span class="note-small">${esc(L("threshold")(c.net.threshold))}</span><br><a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(host(b.url))} ↗</a>${c.net.own ? `<br><span class="note-small">${esc(L("own_src")[c.net.own])}</span>` : ""}${xchkHTML(c)}`;
  if (!b.url) return `${esc(L("no_probe"))}${c.net.reason ? `<br><span class="note-small">${esc(T(c.net.reason))}</span>` : ""}`;
  return `${esc(L("no_block"))}<span class="note-small">${b.q ? PAR(L("queried") + " " + esc(b.q.slice(0, 16).replace("T", " ")) + " UTC") : ""}</span><br><a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(host(b.url))} ↗</a>`;
}
function codeHTML(code) {
  const rel = code.rel ? `<span class="mono" translate="no">${esc(code.rel)}</span>${code.rel_pre ? esc(L("pre")) : ""}${code.rel_tag ? esc(L("tag_only")) : ""} · ${esc(fmtDate(code.rel_date))}` : esc(T(code.note) || "—");
  const tip = code.repo ? L("commits_tip")(code.repo, code.branch, (code.q || "").slice(0, 16).replace("T", " ") + " UTC") : "";
  const c90 = code.c90 == null ? "" : term(esc(L("commits2")(code.c90)), tip, L("e_code")) + (code.rel && T(code.note) ? PAR(esc(T(code.note))) : "") + "<br>";
  const also = (code.also || []).filter((a) => a.c90 != null).map((a) => `${esc(L("also"))}${CO()}github.com/${esc(a.repo)} · ${esc(L("commits")(a.c90))}`).join("<br>");
  if (code.host) return `${esc(L("e_release"))}${CO()}—<br>${esc(L("code_off_gh")(code.host_name || code.host))}<br><a href="https://${esc(code.host)}/${esc(code.repo)}" target="_blank" rel="noopener">${esc(code.host)}/${esc(code.repo)} ↗</a>`;
  return `${esc(L("e_release"))}${CO()}${rel}<br>${c90}${also ? also + "<br>" : ""}${code.repo ? `<a href="https://github.com/${esc(code.repo)}" target="_blank" rel="noopener">github.com/${esc(code.repo)} ↗</a>` : ""}${(code.mirrors || []).map((u) => `<br>${esc(L("mirror"))}${CO()}<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))} ↗</a>`).join("")}`;
}
const srcLink = (u, label) => u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(label || host(u))} ↗</a>` : "";
function tlItem(m) {
  const grade = m.grade || "primary", ts = TYPE_STAGE[m.type] ?? 0;
  return `<li class="tl s${ts}${grade === "official" ? " off" : ""}${m.np ? " np" : ""}"><span class="when">${m.checked ? `<small>${esc(L("checked_tag"))}</small>` : ""}${esc(fmtDate(m.date))}</span><span class="pin" aria-hidden="true"></span>
    <div class="body"><div class="tags">${m.np ? term(`<span class="ttag np">${esc(L("np_tag"))}</span>`, DF.np, L("np_tag"), "plain") : ""}${term(`<span class="ttag s${ts}">${esc(L("types")[m.type])}</span>`, DF.types[m.type], L("types")[m.type], "plain")}${term(`<span class="grade ${grade}">${grade === "official" ? "† " : ""}${esc(L("grades")[grade])}</span>`, DF.grades[grade], L("grades")[grade])}</div>
    <div class="txt">${esc(T(m))}</div>${m.status ? `<div class="st">${esc(L("status"))}${CO()}${esc(T(m.status))}</div>` : ""}
    ${m.url ? `<div class="src">${esc(L("source"))}${CO()}${srcLink(m.url)}</div>` : ""}</div></li>`;
}
function scale6(s) {
  return `<div class="scale6" role="img" aria-label="${esc(stageTitle(s))}">${[0, 1, 2, 3, 4, 5].map((i) =>
    `<div class="lv s${i}${i <= s ? " on" : ""}${i === s ? " cur" : ""}"><span class="blk"></span><span><span class="n">${i}</span> <span class="nm">${esc(stageName(i))}</span></span></div>`).join("")}</div>`;
}
function sinceLine(c) {
  if (c.stage < 4) return "";
  if (!c.since) return `<p class="since-line na">${esc(L("since_missing"))}</p>`;
  const sv = c.since;
  return `<p class="since-line"><span class="k">${term(esc(L("d_since")), DF.th_since)}</span><b class="mono">${esc(fmtDate(sv.date))}${dagger(sv.grade)}</b><span class="ev">${esc(T(sv.event))}</span>
    <span class="src">${esc(sv.grade === "official" ? L("since_own") : L("source"))}${CO()}${srcLink(sv.source_url)}</span></p>`;
}
const kv = (k, v, def) => v ? `<div class="kv"><span class="k">${def ? term(esc(k), def, k) : esc(k)}</span><span class="v">${v}</span></div>` : "";
const rfield = (x, labels, defs) => x ? `<b>${esc(labels[x.value] || x.value)}</b>${T(x) ? `<br>${esc(T(x))}` : ""}${x.auditor ? `<br><span class="note-small">${esc(x.auditor)}${x.date ? " · " + esc(fmtDate(x.date)) : ""}</span>` : ""}${x.source_url ? `<br><span class="note-small">${esc(L("source"))}${CO()}${srcLink(x.source_url)}${dagger(x.grade)}</span>` : ""}` : "";
function dsec(id, h, body, note) { return `<section class="dsec" id="${id}" aria-labelledby="${id}-h"><div class="section-h"><h2 id="${id}-h">${esc(h)}</h2>${note ? `<p class="note-small">${esc(note)}</p>` : ""}</div>${body}</section>`; }
function renderChain() {
  const c = D.chains[0];
  chrome("home");
  const tl = [...c.timeline].sort((a, b) => sortKey(a.date).localeCompare(sortKey(b.date)));
  const four = c.four || { today: c.holder, watch: c.note };
  const box = (k, l) => T(four[k]) ? `<div class="card"><h3>${esc(L(l))}</h3><p>${esc(T(four[k]))}</p></div>` : "";
  const unv = c.unverified && c.unverified.length ? `<section class="unv"><h3>${esc(L("d_unv"))}</h3><span class="note-small">${esc(L("d_unv_note"))}</span>${c.unverified.map((u) => `<div class="it"><span>${esc(T(u.claim))}</span><span class="why">${esc(T(u.reason))}</span><a href="${esc(u.url)}" target="_blank" rel="noopener" style="font-size:13px">${esc(L("lead"))}${CO()}${esc(host(u.url))} ↗</a></div>`).join("")}</section>` : "";
  const used = [...new Set(tl.map((m) => m.type))];
  const legend = used.map((t) => `<span class="s${TYPE_STAGE[t] ?? 0}"><i></i>${esc(L("types")[t])}</span>`).join("") + (tl.some((m) => m.grade === "official") ? `<span class="off"><i></i>† ${esc(L("grades").official)}</span>` : "");
  const timeline = tl.length ? `<div class="tlbox"><div class="legend">${legend}</div><ol class="timeline">${tl.map(tlItem).join("")}</ol></div>` : `<p style="color:var(--ink-2);margin:0">${esc(L("d_no_tl"))}</p>`;
  const srcs = c.sources || [];
  const srcList = srcs.length ? `<ul class="src">${srcs.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label || host(s.url))}</a>${s.kind ? ` <span style="color:var(--ink-3)">· ${esc(T(s.kind))}</span>` : ""}</li>`).join("")}</ul>` : "";
  const ap = c.ap || { params: [] };
  const sizes = ap.params.filter((p) => p.pk && p.sig).map((p) => esc(L("size_row")(p.name, p.pk, p.sig)) + (p.ref ? `<br><span class="note-small">${esc(L("size_ref")(p.ref))}</span>` : "")).join("<br>");
  const algo = `<div class="card dcard kvgrid">
    ${kv(L("d_algo"), `${esc(T(c.algo))}${chips(c.chips)}`, DF.th_algo)}
    ${c.group === "early" ? kv(L("design_label"), esc(L("design_built")), DF.design[c.design]) : ""}
    ${kv(L("k_status"), ssChips(c, true) + (c.stage < 3 && c.schemes.some(([k]) => k !== "none") ? term(`<span class="chip">${esc(L("proposed"))}</span>`, DF.proposed, L("proposed"), "plain") : ""), [...new Set(c.schemes.map(([, st]) => st))].map((st) => `${L("ss")[st]}${CO()}${DF.ss[st]}`).join("\n"))}
    ${c.stage < 3 ? kv(L("k_level"), esc(L("na_deploy")), DF.proposed) : ap.level != null ? kv(L("k_level"), esc(L("level")(ap.level, ap.open)), DF.level) : ""}
    ${kv(L("k_hybrid"), esc(c.stage >= 3 ? L(c.hybrid ? "yes" : "no") : L("na_deploy")), DF.hybrid)}
    ${kv(L("k_sizes"), sizes)}
    ${c.algo_note ? kv(L("k_algo_note"), esc(T(c.algo_note))) : ""}
    ${c.stage >= 3 ? kv(L("k_audit"), c.audit ? rfield(c.audit, L("audit")) : esc(L("audit").unknown), DF.audit[c.audit ? c.audit.value : "unknown"]) : ""}</div>`;
  const expo = c.expo ? `<b>${esc((lang === "zh" && c.expo.figure_zh) || c.expo.figure || "")}</b>${T(c.expo) ? `<br>${esc(T(c.expo))}` : ""}<br><span class="note-small">${esc((lang === "zh" && c.expo.publisher_zh) || c.expo.publisher || "")}${c.expo.date ? " · " + esc(fmtDate(c.expo.date)) : ""} · ${srcLink(c.expo.source_url)}</span>` : `<span class="note-small">${esc(L("expo_none"))}</span>`;
  const cov = `<div class="card dcard kvgrid">
    ${kv(L("k_new"), `<b>${esc(L("cov")[c.cov])}</b>`, DF.cov[c.cov])}
    ${c.stage >= 2 ? kv(L("k_mig"), c.mig ? rfield(c.mig, L("mig")) : esc(L("mig").unknown), DF.mig[c.mig ? c.mig.value : "unknown"]) : ""}
    ${kv(L("k_expo"), expo)}
</div>`;
  const hrow = (k, l) => T(four[k]) ? `<div><dt>${esc(L(l))}</dt><dd>${k === "today" ? `<b>${esc(L("today_lead")(c.stage))}</b>${SEP(L("today_lead")(c.stage))}` : ""}${esc(T(four[k]))}</dd></div>` : "";
  const holder = `<div class="holder"><h2>${esc(L("holder_h"))}</h2><dl>${hrow("today", "holder_today")}${hrow("next", "holder_next")}${hrow("can", "d_can")}</dl><p class="note-small">${esc(L("holder_note"))}</p></div>`;
  const p = c.prog;
  const prog = `<div class="four">${`<div class="card"><h3>${term(esc(L("k_n90")), DF.prog, L("k_n90"))}</h3><p><b class="mono">${p.n90}</b> · ${p.latest ? `${esc(L("k_latest"))}${CO()}<span class="mono">${esc(fmtDate(p.latest.date))}</span>${dagger(p.latest.grade)}` : esc(L("prog_none"))}</p></div>`}${box("watch", "d_watch")}</div>${xtalkHTML(c)}${timeline}`;
  const evidence = `${srcList}${unv}<p class="note-small">${esc(L("dagger_key"))}</p>`;
  const b = c.net;
  const bg = `<div class="card dcard kvgrid">
    ${kv(L("d_net"), `<span class="dot ${b.status}" style="margin-right:7px"></span>${statusTerm(b.status)}<br>${blockHTML(c)}`, DF.th_net)}
    ${b.code ? kv(L("e_code"), codeHTML(b.code)) : ""}
    ${kv(L("k_mcap"), c.rank ? esc(L("rank")(c.rank)) + `<br><span class="note-small">${esc(L("mcap_src")(fmtDate(D.mcap_date)))}</span>` : "—", DF.bg_rank)}
    ${c.consensus ? kv(L("e_consensus"), esc(T(c.consensus))) : ""}
    ${c.supply ? kv(L("k_supply"), `${esc(T(c.supply))}<br><span class="note-small">${esc(L("source"))}${CO()}${srcLink(c.supply.source_url)}${dagger(c.supply.grade)}</span>`, DF.supply) : ""}
    ${kv(L("d_checked"), `<span class="mono">${esc(fmtDate(c.checked) || "—")}</span>`, DF.th_checked)}</div>`;
  const meta = [`<span class="mono">${esc(c.ticker)}</span>`, c.rank ? `<span>${termRef(esc(L("rank")(c.rank)), "bg_rank", L("k_mcap"))}</span>` : "", `<span>${c.group === "early" ? termRef(esc(L("early_tag")), "k_early", L("early_tag")) : termRef(esc(L("design")[c.design]), "design." + c.design, L("design_label"))}</span>`,
    `<span>${term(esc(L("e_reviewed")), DF.reviewed)} <span class="mono">${esc(c.reviewed)}</span></span>`].filter(Boolean).join('<span aria-hidden="true">·</span>');
  const toc = [["d-algo", "d_algo_h"], ["d-cov", "d_cov_h"], ["d-prog", "d_prog_h"], ["d-ev", "d_ev_h"], ["d-bg", "d_bg_h"], ["d-embed", "emb_page_h"]];
  put("app", () => `<div class="page">
    <div class="crumb"><a href="${href("")}">← ${esc(L("d_back"))}</a></div>
    <header class="dhead"><h1>${esc(name(c))}${lang === "zh" && c.zh_name ? ` <span class="alt">${esc(c.name)}</span>` : ""}</h1><div class="meta">${meta}</div></header>
    <section class="card answer s${c.stage}" aria-label="${esc(L("q")(name(c)))}"><span class="eyebrow">${esc(L("q")(name(c)))}</span>
      <p class="claim">${esc(L("answer")(c.reviewed, name(c), c.stage, stageName(c.stage)))}</p>
      <p class="basis">${esc(T(c.basis))}</p>
      ${c.basis_src ? `<span class="cite-src">${esc(L("answer_src")(c.stage))}${CO()}${srcLink(c.basis_src)}${dagger(c.basis_grade)}</span>` : ""}
      <div class="scalebox6"><div class="cap">${badgeTerm(c.stage)}<span>${esc(L("d_scale"))}</span>${flagsHTML(c)}</div>${scale6(c.stage)}${sinceLine(c)}</div>
      ${holder}
      <div class="appeal"><a class="btn" href="${fixURL(c)}" target="_blank" rel="noopener">${esc(L("appeal"))} ↗</a><span class="note-small">${esc(L("appeal_def"))}</span></div></section>
    ${c.stale_days > 90 ? `<p class="stale" role="note">${esc(L("stale")(c.reviewed, c.stale_days))}</p>` : ""}
    <nav class="toc dtoc" aria-label="${esc(L("toc"))}">${toc.map(([id, k]) => `<a href="#${id}">${esc(L(k))}</a>`).join("")}</nav>
    <div class="dmain">
      ${dsec("d-algo", L("d_algo_h"), algo)}
      ${dsec("d-cov", L("d_cov_h"), cov)}
      ${dsec("d-prog", L("d_prog_h"), prog)}
      ${dsec("d-ev", L("d_ev_h"), evidence)}
      ${dsec("d-bg", L("d_bg_h"), bg, L("d_bg_note"))}
      ${dsec("d-embed", L("emb_page_h"), `<p class="note-small">${esc(L("emb_page_p"))}${SEP(L("emb_page_p"))}<a href="${href("data/")}#embed">${esc(L("emb_more"))} →</a></p>${embedBody(c, D.embed, lang, true)}`)}
      <section class="card fix"><p>${esc(L("d_fix"))}</p><a class="btn primary" href="${fixURL(c)}" target="_blank" rel="noopener">${esc(L("d_fix_btn"))} ↗</a><a class="btn" href="${D.data_url}" target="_blank" rel="noopener">${esc(L("gh"))} ↗</a></section>
    </div></div>`);
  if (!PRE) { initCopy(); document.getElementById("app").addEventListener("click", (e) => { const fd = e.target.closest("[data-fold]"); if (fd) foldList(fd); }); }
}

/* the X block on a chain page: shown only when there is something; no data means no block, never "nobody said anything" */
/* a list that shows its first few items: the button opens the rest and folds them again, keeping the button in place */
function foldList(fd) {
  const open = fd.getAttribute("aria-expanded") !== "true", y = fd.getBoundingClientRect().top;
  fd.closest("ul, ol").querySelectorAll("li[data-x]").forEach((li) => { li.hidden = !open; });
  fd.setAttribute("aria-expanded", String(open));
  fd.textContent = open ? L("list_less") : L("list_more")(+fd.dataset.n);
  if (!open) window.scrollBy(0, fd.getBoundingClientRect().top - y);
}
const XMAX = 3; // posts on X shown per chain before "Show N more"
const xItem = (t, who) => `<li><span class="when mono">${esc(fmtDate(t.date))}</span><div class="xb"><div class="xh">${who || ""}<b>${esc(t.who)}</b><span class="xr">${esc(PAR(T(t.relation)).trim())}</span><span class="ttag">${esc(L("xt_type")[t.type])}</span></div><p>${esc(T(t.summary))}</p><span class="note-small"><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(L("xt_post"))} ↗</a> · ${esc(L("xt_checked")(fmtDate(t.checked)))}</span></div></li>`;
function xtalkHTML(c) {
  const talk = c.x_talk || [];
  if (!talk.length) return "";
  const more = talk.length > XMAX ? `<li class="more-n"><button type="button" class="link-btn" data-fold aria-expanded="false" data-n="${talk.length - XMAX}">${esc(L("list_more")(talk.length - XMAX))}</button></li>` : "";
  return `<section class="xtalk" aria-labelledby="xt-h"><h3 id="xt-h">${esc(L("xt_h"))}</h3><span class="note-small">${esc(L("xt_note"))}</span><ol class="xl">${talk.map((t, i) => (i < XMAX ? xItem(t) : xItem(t).replace(/^<li/, "<li hidden data-x"))).join("")}${more}</ol></section>`;
}

/* ---------- this week ---------- */
function renderX() {
  chrome("x");
  const s = D.xs, X = D.xposts;
  const nameOf = (id) => { const c = D.names[id]; return c ? (lang === "zh" && c.zh ? c.zh : c.en) : null; };
  const types = Object.keys(L("xt_type")).filter((k) => X.some((t) => t.type === k));
  const br = s.rest_by_stage.map((n, st) => (n ? `${L("x_stage_short")[st]} ${n}` : "")).filter(Boolean).join(lang === "zh" ? "、" : ", ");
  const fb = (v, lab, n) => `<button type="button" class="fbtn" data-xt="${v}" aria-pressed="${v === "" ? "true" : "false"}">${esc(lab)}<span class="n">${n}</span></button>`;
  put("app", () => `<div class="page">
    <section class="issue"><span class="eyebrow">${esc(L("x_eyebrow")(fmtDate(D.checked)))}</span><h1>${esc(L("x_title"))}</h1><p>${esc(L("x_lede"))}</p></section>
    <div class="stat xs">${[s.chains, s.accounts, s.posts, s.posts30].map((n, i) => `<div class="card"><b data-x="${["chains", "accounts", "posts", "posts30"][i]}">${n}</b><span>${esc(L("x_s")[i])}</span></div>`).join("")}</div>
    <p class="xfact">${esc(L("x_fact")(s.chains, s.usable, s.chains - s.usable, br, s.top, s.top_talk, s.top_usable))}</p>
    <div class="xbar"><div class="fgroup" role="group" aria-label="${esc(L("x_filter"))}">${fb("", L("x_all"), X.length)}${types.map((k) => fb(k, L("xt_type")[k], X.filter((t) => t.type === k).length)).join("")}</div><span class="count" id="xcount" role="status">${esc(L("x_count")(X.length))}</span></div>
    <section class="xtalk xall" aria-label="${esc(L("nav_x"))}"><ol class="xl" id="xlist">${X.map((t) => xItem(t, nameOf(t.chain) ? `<a href="${chainURL(t.chain)}">${esc(nameOf(t.chain))}</a> · ` : "").replace(/^<li/, `<li data-t="${t.type}"`)).join("")}</ol></section>
    <p class="note-small xrule">${esc(L("x_rule"))}${SEP(L("x_rule"))}<a href="${href("method/")}#xtalk">${esc(L("x_rule_link"))} <span aria-hidden="true">→</span></a></p>
  </div>`);
  if (PRE) return;
  const bar = document.querySelector(".xbar");
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-xt]");
    if (!b) return;
    const v = b.dataset.xt;
    bar.querySelectorAll("[data-xt]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    let n = 0;
    document.querySelectorAll("#xlist > li").forEach((li) => { const on = !v || li.dataset.t === v; li.hidden = !on; n += on; });
    document.getElementById("xcount").textContent = L("x_count")(n);
  });
}
function renderChanges() {
  chrome("changes");
  const [C, ...older] = D.changes;
  const nameOf = (id) => { const c = D.names[id]; return c ? (lang === "zh" && c.zh ? c.zh : c.en) : null; };
  const items = C.items.map((it) => {
    const nm = nameOf(it.chain);
    const who = nm ? `<a href="${chainURL(it.chain)}">${esc(nm)}</a>` : esc(L("tracker"));
    const ts = TYPE_STAGE[it.type] ?? 0;
    const stg = it.stage ? `<span class="stg">${esc(L("c_stage"))} <span class="mono">${it.stage[0]} → ${it.stage[1]}</span> ${badge(it.stage[1])}</span>` : "";
    return `<li class="ci"><span class="when">${esc(fmtDate(it.date))}</span><div class="body"><div class="head"><span class="who">${who}</span>${term(`<span class="ttag s${ts}">${esc(L("types")[it.type])}</span>`, DF.types[it.type], L("types")[it.type], "plain")}${stg}</div><p>${esc(T(it))}</p>${it.url ? `<span class="src">${esc(L("source"))}${CO()}<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(host(it.url))} ↗</a></span>` : ""}</div></li>`;
  }).join("");
  const changed = C.items.filter((i) => i.stage && i.stage[0] !== i.stage[1]).length;
  const range = `${fmtDate(C.range.from)} – ${fmtDate(C.range.to)}`;
  put("app", () => `<div class="page">
    <section class="issue"><span class="eyebrow">${esc(L("c_eyebrow"))} · ${esc(range)}</span><h1>${esc(L("c_title")(C.items.length, changed))}</h1><p>${esc(L("c_sub"))}</p></section>
    <div class="stat"><div class="card"><b>${changed}</b><span>${esc(L("c_s1"))}</span></div><div class="card"><b>${C.items.length}</b><span>${esc(L("c_s2"))}</span></div><div class="card"><b>${D.chain_count}</b><span>${esc(L("c_s3"))}</span></div></div>
    <ol class="clist">${items}</ol>
    ${D.xnew && D.xnew.length ? `<section class="xtalk xnew" aria-labelledby="xn-h"><h2 id="xn-h" style="font-size:19px">${esc(L("xt_new_h"))}</h2><p class="note-small">${esc(L("xt_new_p"))}</p><ol class="xl">${D.xnew.map((t) => xItem(t, nameOf(t.chain) ? `<a href="${chainURL(t.chain)}">${esc(nameOf(t.chain))}</a> · ` : "")).join("")}</ol></section>` : ""}
    ${older.length ? `<section class="watch"><h2 style="font-size:19px">${esc(L("c_older"))}</h2><ul>${older.map((o) => `<li>${esc(fmtDate(o.range.from))} – ${esc(fmtDate(o.range.to))} · ${esc(L("c_title")(o.items.length, o.items.filter((i) => i.stage && i.stage[0] !== i.stage[1]).length))}</li>`).join("")}</ul></section>` : ""}
    <section class="card fix" style="max-width:860px"><p>${esc(L("foot_fix"))}</p><a class="btn primary" href="${URL_FIX}" target="_blank" rel="noopener">${esc(L("foot_btn_fix"))} ↗</a></section>
  </div>`);
}

/* ---------- embeds and the data page ---------- */
/* the three snippets for one chain: a Markdown badge, an HTML badge and an HTML card with the credit line */
function snippets(c, e, l) {
  const nm = l === "zh" && c.zh_name ? c.zh_name : c.name, page = e.page[l], site = D.site_root + (l === "zh" ? "zh/" : ""); /* the site's home page in that language */
  const alt = l === "zh" ? `${nm}：抗量子第 ${c.stage} 档` : `${nm}: post-quantum stage ${c.stage} of 5`;
  const credit = l === "zh" ? `数据来源：<a href="${site}">Post-Quantum Blockchains</a>，作者 <a href="${URL_X}">Balance Zhao</a>`
    : `Data: <a href="${site}">Post-Quantum Blockchains</a>, by <a href="${URL_X}">Balance Zhao</a>`;
  return {
    credit,
    md: `[![${alt}](${e.badge[l]})](${page})`,
    html: `<a href="${page}"><img src="${e.badge[l]}" alt="${alt}" height="20"></a>`,
    card: `<div><a href="${page}"><img src="${e.card[l]}" alt="${alt}" width="360" height="112"></a>\n<p style="margin:4px 0 0;font:12px/1.4 sans-serif;color:#5b5873">${credit}</p></div>`,
  };
}
const snipBox = (id, label, code) => `<div class="snip"><div class="snip-h"><span>${esc(label)}</span><button type="button" class="btn sm" data-copy="${id}">${esc(L("copy"))}</button></div><pre class="mono" id="${id}">${esc(code)}</pre></div>`;
/* the previews load from this site itself (so they also work before launch and in a local preview); the copied code keeps the full address */
const local = (u) => u.replace(/^https?:\/\/[^/]+/, "");
function embedBody(c, e, l, withPreview) {
  const s = snippets(c, e, l);
  const prev = withPreview ? `<div class="emb-prev"><figure><figcaption>${esc(L("emb_badge"))}</figcaption><img src="${local(e.badge[l])}" alt="" height="20" loading="lazy"></figure><figure><figcaption>${esc(L("emb_card"))}</figcaption><img src="${local(e.card[l])}" alt="" width="360" height="112" loading="lazy"></figure></div>` : "";
  return `${prev}<div class="snips">${snipBox("sn-md", L("emb_md"), s.md)}${snipBox("sn-html", L("emb_html"), s.html)}${snipBox("sn-card", L("emb_cardc"), s.card)}</div>`;
}
const embURLs = (id) => { const o = D.origin + D.base; return { page: { en: `${o}chains/${id}/`, zh: `${o}zh/chains/${id}/` }, badge: { en: `${o}badges/${id}.svg`, zh: `${o}badges/zh/${id}.svg` }, card: { en: `${o}badges/card/${id}.svg`, zh: `${o}badges/card/zh/${id}.svg` } }; };
function initCopy() {
  document.getElementById("app").addEventListener("click", (ev) => { const b = ev.target.closest("[data-copy]"); if (b) { const el = document.getElementById(b.dataset.copy); TIP.copy(b, el.textContent, L("copied"), el); } });
}
function renderData() {
  chrome("data");
  const M = METHOD[lang];
  const pick = [...D.pick].sort((a, b) => (a.rank || 999) - (b.rank || 999) || a.name.localeCompare(b.name));
  const first = pick[0], o = D.origin + D.base;
  const file = (n, sub) => `<a class="file" href="${D.base}${n.endsWith(".txt") ? "" : "data/"}${n}"><span class="fn mono">${n}</span><span class="fs">${esc(sub)}</span></a>`;
  const rows = (cols, rs) => `<div class="scalebox"><table class="scale"><thead><tr>${cols.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${rs.map(([a, b]) => `<tr><td data-l="${esc(cols[0])}"><code class="mono">${esc(a)}</code></td><td data-l="${esc(cols[1])}">${esc(b).replace(/`([^`]+)`/g, "<code>$1</code>")}</td></tr>`).join("")}</tbody></table></div>`;
  const ex = `fetch("${o}data/chains/near.json")\n  .then((r) => r.json())\n  .then((c) => console.log(c.name, c.stage, c.stage_name.en, c.data_checked));`;
  const opts = pick.map((c) => `<option value="${c.id}"${c === first ? " selected" : ""}>${esc(name(c))} · ${esc(c.ticker)}</option>`).join("");
  const H = (id, t) => `<h2 id="${id}">${esc(t)}</h2>`;
  put("app", () => `<div class="page"><article class="prose dpage">
    <span class="eyebrow">${esc(L("dp_eyebrow"))}</span><h1>${esc(L("dp_h"))}</h1><p class="lede">${esc(L("dp_lede"))}</p>
    <nav class="toc" aria-label="${esc(L("toc"))}">${L("dp_toc").map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join("")}</nav>
    ${H("files", L("data_dl_h"))}<div class="files">${Object.entries(L("data_files")).map(([n, sub]) => file(n, sub)).join("")}${file("llms.txt", L("data_llms"))}</div><p class="fine-note">${esc(L("data_lic"))}${SEP(L("data_lic"))}<a href="#license">${esc(L("lic_h"))}</a></p>
    ${H("api", L("api_h"))}<p>${esc(L("api_p"))}</p>${rows(L("api_cols"), L("api_rows").map(([a, b]) => [`GET ${o}${a}`, b]))}
    <div class="snip"><div class="snip-h"><span>${esc(L("api_ex"))}</span><button type="button" class="btn sm" data-copy="sn-ex">${esc(L("copy"))}</button></div><pre class="mono" id="sn-ex">${esc(ex)}</pre></div>
    <p class="note-small">${esc(L("api_freq")(D.release.version))}</p>
    ${H("fields", L("fields_h"))}${rows(L("fields_cols"), L("fields_rows"))}
    ${H("embed", L("emb_h"))}<p>${esc(L("emb_p"))}</p>
    <div class="emb-ctl"><label>${esc(L("emb_chain"))}<select id="emb-c">${opts}</select></label>
      <div class="seg" role="group" aria-label="${esc(L("emb_lang"))}">${["en", "zh"].map((l) => `<button type="button" data-elang="${l}" lang="${l === "zh" ? "zh-Hans" : "en"}" aria-pressed="${l === lang}">${l === "zh" ? "中文" : "English"}</button>`).join("")}</div></div>
    <div id="emb-b">${embedBody(first, embURLs(first.id), lang, true)}</div>
    ${H("license", L("lic_h"))}<p>${esc(L("lic_p"))}</p><ol>${L("lic_list").map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
    <div class="snip"><div class="snip-h"><span>${esc(L("lic_credit"))}</span><button type="button" class="btn sm" data-copy="sn-credit">${esc(L("copy"))}</button></div><pre class="mono" id="sn-credit">${esc(snippets(first, embURLs(first.id), lang).credit)}</pre></div>
    <p>${esc(L("lic_other"))}</p>
    <p class="row-btns"><a class="btn primary" href="${REPO}/issues/new?template=used-by.yml" target="_blank" rel="noopener">${esc(L("lic_reg"))} ↗</a><a class="btn" href="${blob("LICENSE")}" target="_blank" rel="noopener">${esc(L("lic_full"))} ↗</a><a class="btn" href="${URL_X}" target="_blank" rel="noopener">X · @balance0014 ↗</a></p>
    ${H("cite", L("data_cite_h"))}<p><code class="cite" id="cite-text">${esc(M.cite(D.release.version, D.release.date, D.site_url))}</code></p>
    <p class="row-btns"><button type="button" class="btn" data-copy="cite-text">${esc(L("copy"))}</button><a class="btn" href="${blob("CITATION.cff")}" target="_blank" rel="noopener">CITATION.cff ↗</a></p>
    ${submitBox()}
  </article></div>`);
  if (PRE) return;
  initCopy();
  let el = lang;
  const draw = () => { const id = document.getElementById("emb-c").value; document.getElementById("emb-b").innerHTML = embedBody(D.pick.find((c) => c.id === id), embURLs(id), el, true); };
  document.getElementById("emb-c").addEventListener("change", draw);
  document.querySelectorAll("[data-elang]").forEach((b) => b.addEventListener("click", () => { el = b.dataset.elang; document.querySelectorAll("[data-elang]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); }));
}

/* ---------- how we rate (home bottom and method page) ---------- */
const METHOD = {
  en: {
    title: "How we rate", lede: "Every chain answers one question for the person holding the coin: do I have post-quantum protection today? We rate the outcome, not the route a chain takes to get there.",
    scale_h: "The six stages", cols: ["Stage", "What it means", "Example"],
    rules_h: "Rating rules",
    rules: [
      "A chain gets the highest stage that primary sources support on the check date.",
      "Stages 3 to 5 need a post-quantum way to authorize spending. Hiding public keys or making funds recoverable later is recorded, but caps a chain at stage 2.",
      "Third-party wallets, vaults and contracts are listed but do not change a chain's stage. One exception: on a chain where every account is a contract and the protocol has no built-in account signature (Starknet), a post-quantum account class declared on mainnet counts, whoever wrote it. The chain's page names the author and whether it is audited.",
      "Plans and target dates are shown and never rated. When only a project's own documents describe a feature, and no code, release or chain data confirms it, the stage is capped at 2.",
    ],
    groups_h: "Filters and what each option means", groups_cols: ["Filter", "Option", "What it means"],
    net_h: "Network status", net_cols: ["Status", "When we show it"],
    net_rule: "Where blocks come from: each chain's row names the explorer or public RPC we read, and every chain page shows the exact endpoint, the block height and time, and when we read it. The limit is 10 minutes, or six target block times when a chain's target is longer than 100 seconds (for example 60 minutes for Bitcoin's 10-minute blocks). At six target block times, a healthy chain misses the limit by chance about once in 400 checks. Public RPCs can answer from a lagging node, so we read every endpoint two or three times and keep the highest block. A chain is marked stopped only when an independent explorer also shows an old block; with one source, it is marked could not check. Commits are counted on the default branch of the main node repository over the 90 days before the check, whatever they change, leaving out commits by bot accounts (logins ending in [bot]). Blocks and commits are background: they show whether a chain is alive and maintained, not how far its post-quantum work has come.",
    algo_h: "Algorithm labels", algo_cols: ["Label", "What it means"],
    grades_h: "Where evidence comes from",
    cite_rule: "The opening sentence on each chain page links one source. A chain with an entry in the project list links its pinned code or another pinned primary source. Other chains link the primary source (or, if there is none, the official claim) that supports the stage and best matches the stated reason. Node endpoints are not linked there because the network panel shows them. Every source is listed further down the page.",
    grades: [["Primary source · can set the stage", "primary"], ["Official claim · recorded as a plan", "official"], ["Lead · marked unverified", "unverified"]],
    charts_h: "How the charts are made",
    charts: [
      "Every chart on the home page is drawn from the same data as the table, when the site is built. Nothing in them is typed by hand.",
      "Stages by the largest blockchains: the coins in the CoinGecko top 100 that have their own network, counted by stage.",
      "Post-quantum mainnet launches over time: a step line of the chains at stage 4 or 5 with a sourced start date, one step per chain on that day, from the start of the first year with a dated chain to the check date; the axis is not broken. Steps before the current year are named; the rest show their name on hover.",
      "Algorithm map: every chain at stage 2 or higher, in the row of each signature family it uses or proposes, coloured by its standard status.",
      "How long post-quantum signatures have run on mainnet: one bar per dated chain, from its start date to the check date, on the same time axis.",
      "Milestones over time: dated proposal, testnet and mainnet milestones (primary sources and official claims), counted by year for all years, by month for the last two years, or by week for the last three months. Empty periods keep their place. Entries that record our own checks, and entries dated only to a quarter, are left out.",
      "Post-quantum signatures on mainnet, by year: every chain at stage 4 or 5, placed by the day post-quantum signatures became usable on its current mainnet: the genesis block for a post-quantum native chain, the day the upgrade or account type went live for the others. Chains without a sourced date are listed apart, not guessed.",
    ],
    dims_h: "Every metric: what it counts, where it comes from, how often, and its limits", dims_cols: ["Metric", "What it counts", "Where it comes from", "How often", "Limits", "Script or file"],
    dims: [
      ["Stage (0 to 5)", "How far a holder can use post-quantum signatures today", "Official proposal repositories, client releases, chain parameters; websites count only as plans", "Watched proposals weekly; every row monthly; a person changes the stage", "Protocol level only; wallets, exchanges and bridges are not rated", ["scripts/patrol.py", "data/chains.json"]],
      ["Standard status and security level", "Where the scheme stands as a standard; the NIST category of each named parameter set", "NIST FIPS 204 and 205, the FN-DSA selection, NIST SP 800-208, IETF RFC 8391, the chain's own specification", "Monthly", "A project's own construction is not assessed; a standard scheme can still be implemented badly", ["scripts/build_site.py"]],
      ["Reference sizes", "Public key and signature bytes of each named parameter set", "The algorithm specifications", "When a parameter set is added", "Reference encodings, not whole transactions; a chain's own encoding can differ", ["data/signature-sizes.json"]],
      ["Coverage", "Default for new accounts, opt-in, testnet only, or none", "Follows from the stage", "With the stage", "Says nothing about wallet support", ["scripts/build_site.py"]],
      ["Migration", "Whether coins that already exist can move under post-quantum protection, and how (stage 2 and up)", "Specifications, code and release notes; official posts only when nothing more direct exists, and marked †", "Monthly", "Read from specifications and code; we do not run a migration on mainnet ourselves", ["data/chains.json"]],
      ["Coins with exposed public keys", "Published estimates only", "Research named on the chain page", "When new research appears", "We do not compute it ourselves; most chains show “no reliable data”", ["data/chains.json"]],
      ["Audit", "An independent audit of the post-quantum signing code in use (stage 3 and up)", "Audit reports linked from the repository or project site, and the auditors' public report lists", "Monthly", "An audit covers one version; no public report is recorded as “no audit found”, not as a flaw", ["data/chains.json"]],
      ["Post-quantum progress", "Milestones with a primary source in the 90 days to the check date, and the newest milestone of any grade", "Milestones recorded on this site", "Weekly patrol, monthly review", "Only what we have recorded; not a keyword count of commits", ["scripts/build_site.py", "data/chains.json"]],
      ["Post-quantum on mainnet since", "The day post-quantum signatures became usable on the current mainnet", "Genesis block or activation record: block explorer, pinned code or release notes; the project's own statement only when nothing more direct exists, marked †", "Set once; re-checked with the row monthly", "Chains without a sourced date are listed apart, not guessed", ["data/chains.json"]],
      ["Latest block (background)", "Height, time and age of the newest block, the highest of two or three reads; running while younger than max(10 min, 6 target block times)", "The explorer or public RPC named for each chain", "Weekly", "A public endpoint can lag; one source alone never marks a chain as stopped", ["scripts/patrol.py"]],
      ["Main repository commits (background)", "Commits on the default branch of the main node repository in the 90 days before the check, whatever they change; bot accounts left out", "GitHub API", "Weekly", "Measures maintenance, not post-quantum work; large chains spread work over many repositories", ["scripts/patrol.py"]],
      ["Latest release (background)", "Newest release of the main node repository (its newest tag if there are no releases)", "GitHub releases", "Weekly", "Release names differ by project", ["scripts/patrol.py"]],
      ["Market-cap rank (background)", "CoinGecko rank on the snapshot date, top 100 only", "CoinGecko", "Monthly", "A rough guide to value at stake, not a quality signal", ["scripts/rank.py"]],
      ["This week's changes", "What differs from the previous patrol, reviewed by a person", "The patrol's output", "Weekly", "A change appears only after review", ["scripts/patrol.py"]],
    ],
    who_h: "Which chains are listed",
    who: [
      "Every coin in the CoinGecko top 100 by market cap that pays fees or secures consensus on a network of its own, layer 1 or layer 2. Stablecoins, wrapped and staked tokens, and exchange, app or meme tokens without their own chain are left out; the list of coins left out, with reasons, is in the data.",
      "Chains outside the top 100 that use classical keys by default and already let holders choose a post-quantum option on mainnet.",
      "Post-quantum chains with public code or a running network, plus at least one sign of activity: a CoinGecko or CoinMarketCap listing, 50 or more stars on the main GitHub repository, or posts from the project or its community in the last 30 days (the team's own commits do not count). Projects with only a white paper are kept as leads, not listed.",
      "New projects can submit themselves through GitHub with primary sources. Listing is free.",
    ],
    cad_h: "How it stays current",
    cad: ["Every week, an automated patrol reads each chain's newest block, latest release and commit count, and the watched proposals, and opens a pull request with what changed. A person reviews it before anything is published or a stage changes.", "Every month, every row is re-checked from its sources and the market-cap list is refreshed. Each row shows the date it was last checked."],
    left_h: (n) => `Top-100 coins left out (${n})`, left_cols: ["Rank", "Coin", "Why it is left out"],
    rules_link: "The full rulebook, with every threshold and data file:",
    open_h: "Independence and limits",
    open: ["Listing and stages are free. No project can pay to be listed or to change its stage, and we accept no payment for either.",
      "This is not a security audit. A stage says what a chain offers at the protocol level; it does not say that the chain's code or any wallet is free of flaws.",
      "Protocol level only: wallets, exchanges, custodians and bridges are not assessed.",
      "We do not compute how many coins sit behind exposed public keys on each chain: that needs a full analysis of the chain. We cite published research where it exists and show “no reliable data” elsewhere.",
      "We do not count “post-quantum commits” by keyword: keywords miss real work and catch unrelated changes, the count means nothing for chains built post-quantum, and large chains spread the work over many repositories. Progress is counted from dated milestones with primary sources instead.",
      "The security level of a project's own construction is shown as “not assessed”. We do not rate schemes that no outside body has reviewed.",
      "Not investment advice. We do not comment on prices or predict when quantum computers might break today's cryptography.",
      "A snapshot, not a live feed: every entry shows the date its claims were last checked, and an entry not reviewed for 90 days is flagged on its page.",
      "All data and every script are public on GitHub, so anyone can re-run the checks."],
    cite_h: "How to cite",
    cite: (v, d, url) => `Balance Zhao. Post-Quantum Blockchains, version ${v} (${d}). ${url}. Data licensed CC BY-NC 4.0.`,
    cite_p: "To cite one chain, use its page address and the date its claims were last checked, shown at the top of the page. Every data change raises the version number and is recorded in the changelog.",
    cite_files: "Download the data (JSON):", cite_meta: "Citation metadata:",
  },
  zh: {
    title: "如何评档", lede: "每条链都回答持币人的同一个问题：我持有它，今天有没有抗量子保护？我们只统一结果，不要求各链走同一条路线。",
    scale_h: "六个档位", cols: ["档位", "含义", "例子"],
    rules_h: "评档规则",
    rules: [
      "按核对当日原始出处能支持的最高档位评定。",
      "3 至 5 档要求能用抗量子方式授权转账。仅隐藏公钥，或让资产将来可以恢复，会被记录，但最高只评 2 档。",
      "第三方钱包、保险库和合约只做记录，不影响链的档位。唯一例外：如果一条链的每个账户都是合约、协议本身没有内置账户签名（如 Starknet），那么主网上已声明的抗量子账户类计入档位，不论作者是谁；该链页面会写明作者和是否经过审计。",
      "计划和目标日期会列出，但不参与评档。如果只有项目自己的文档或公告描述某项功能，没有代码、版本发布或链上数据证实，最高记 2 档。",
    ],
    groups_h: "筛选项和每个选项的含义", groups_cols: ["筛选项", "选项", "含义"],
    net_h: "网络状态", net_cols: ["状态", "什么情况下显示"],
    net_rule: "出块数据从哪来：每条链都写明读取的区块浏览器或公开 RPC，详情页列出具体接口、区块高度和时间，以及读取时间。时限是 10 分钟；目标出块间隔超过 100 秒的链，按 6 倍目标出块间隔算（比如比特币 10 分钟一个块，时限就是 60 分钟）。取 6 倍时，一条正常出块的链大约每 400 次核查才会偶然超时一次。公开 RPC 可能由落后的节点应答，所以每个接口都读两到三次，取最高的区块。只有独立的区块浏览器也显示区块过旧，才判定「出块停了」；只有一个来源时，记为「无法核实」。提交次数按主节点代码库的默认分支、核查日之前 90 天统计，不论改了什么，不计机器人账户（用户名以 [bot] 结尾）的提交。出块和提交是背景信息：说明链还在不在运行、有没有人维护，不说明抗量子工作进展到哪一步。",
    algo_h: "算法标签", algo_cols: ["标签", "含义"],
    grades_h: "证据来源",
    cite_rule: "每条链详情页开头那句结论附一个出处。在项目清单里有条目的链，附固定版本的代码或其他固定版本的原始出处。其他链附能支持该档位、且与所写依据最贴合的原始出处，没有原始出处时才用官方说法。节点接口不放在这里，因为网络状态栏已经列出。全部来源列在页面下方。",
    grades: [["原始出处 · 可作定档依据", "primary"], ["官方说法 · 记为计划", "official"], ["线索 · 标为未核实", "unverified"]],
    charts_h: "图表怎么画的",
    charts: [
      "首页的每张图和表格用同一份数据，在构建网站时生成，没有手写的数字。",
      "市值最大的区块链档位分布：CoinGecko 市值前 100 中有自己网络的币，按档位计数。",
      "抗量子主网上线时间线：第 4、5 档中有带出处起始日期的链画成阶梯线，每条链在那一天上一级；横轴从第一条链所在年份的年初到核对日，不截断。今年以前的台阶标出链名，其余悬停可见。",
      "算法版图：第 2 档及以上的每条链，放进它所用或提议的每个签名家族那一行，颜色表示标准状态。",
      "抗量子签名在主网上运行了多久：每条有日期的链一根条，从起始日期到核对日，和上一张图用同一条时间轴。",
      "里程碑数量：带日期的提案、测试网和主网进展（原始出处和官方说法），可按年看全部年份、按月看近两年，或按周看近三个月。没有进展的时段也留着位置。本站自己的核查记录和只精确到季度的条目不计入。",
      "抗量子签名上主网的年份：第 4、5 档的每条链，按抗量子签名在其现行主网上可用的日期排列：原生抗量子链取创世区块，其他链取升级或新账户类型上线当天。找不到出处的链单独列出，不做推测。",
    ],
    dims_h: "每个指标：统计什么、从哪来、多久更新、有什么局限", dims_cols: ["指标", "统计什么", "来源", "更新频率", "局限", "脚本或文件"],
    dims: [
      ["档位（0 到 5）", "持币人今天能在多大程度上用上抗量子签名", "官方提案库、客户端发布版本、链上参数；官网只记为计划", "跟踪的提案每周查；每行每月重核；档位由人修改", "只看协议层；钱包、交易所和跨链桥不评", ["scripts/patrol.py", "data/chains.json"]],
      ["标准状态和强度等级", "方案的标准化程度；每个写明的参数集对应的 NIST 强度等级", "NIST FIPS 204 和 205、FN-DSA 选定结果、NIST SP 800-208、IETF RFC 8391、链自己的规范", "每月", "项目自研方案不评估；标准方案也可能实现得不好", ["scripts/build_site.py"]],
      ["参考大小", "每个写明的参数集的公钥和签名字节数", "算法规范", "新增参数集时", "是参考编码，不是整笔交易；各链自己的编码可能不同", ["data/signature-sizes.json"]],
      ["覆盖", "新账户默认、可选、仅限测试网或没有", "由档位推出", "随档位", "不反映钱包是否支持", ["scripts/build_site.py"]],
      ["迁移路径", "已有的币能否、以及怎样转到抗量子保护之下（第 2 档及以上）", "规范、代码和发布说明；找不到更直接的记录时才用官方文章，并标 †", "每月", "依据规范和代码判断；本站不在主网上亲自做迁移", ["data/chains.json"]],
      ["公钥已暴露的币", "只引用已发表的估算", "链页面写明的研究", "有新研究时", "本站不自行计算；大多数链显示「暂无可靠数据」", ["data/chains.json"]],
      ["审计", "正在使用的抗量子签名代码是否经过独立审计（第 3 档及以上）", "代码库或项目官网链接的审计报告，以及审计机构公开的报告列表", "每月", "审计只覆盖某个版本；找不到公开报告记为「未找到审计」，不等于有缺陷", ["data/chains.json"]],
      ["抗量子进展", "截至核对日的 90 天内带原始出处的进展条数，以及最近一条进展（不限等级）", "本站收录的里程碑", "每周巡查，每月复核", "只算本站收录的；不按关键词数提交", ["scripts/build_site.py", "data/chains.json"]],
      ["抗量子主网起始日期", "抗量子签名在现行主网上可用的日期", "创世区块或升级生效记录：区块浏览器、固定版本的代码或发布说明；找不到更直接的记录时才用项目方说法，并标 †", "录入一次；每月随整行重核", "找不到出处的链单独列出，不做推测", ["data/chains.json"]],
      ["最新区块（背景）", "最新区块的高度、时间和距今多久，读两到三次取最高；不超过 10 分钟与 6 倍目标出块间隔中较大的那个，算正常出块", "每条链写明的区块浏览器或公开 RPC", "每周", "公开接口可能落后；只有一个来源时不会判定「出块停了」", ["scripts/patrol.py"]],
      ["主仓库提交（背景）", "核查日之前 90 天主节点代码库默认分支上的提交，不论改了什么；不含机器人账户", "GitHub API", "每周", "反映有没有人维护，不反映抗量子工作；大链的工作分散在很多仓库", ["scripts/patrol.py"]],
      ["最新发布版本（背景）", "主节点代码库的最新发布（没有发布记录时取最新标签）", "GitHub 发布记录", "每周", "各项目的版本命名不同", ["scripts/patrol.py"]],
      ["市值排名（背景）", "取数当日的 CoinGecko 排名，只看前 100", "CoinGecko", "每月", "大致说明有多少价值面临风险，不代表质量", ["scripts/rank.py"]],
      ["本周变化", "与上一次巡查相比的差异，经人工核对", "巡查输出", "每周", "核对后才会出现", ["scripts/patrol.py"]],
    ],
    who_h: "收录范围",
    who: [
      "CoinGecko 市值前 100 中，在自己的网络（L1 或 L2）上用于支付手续费或维护共识的币。稳定币、包装币、质押凭证，以及没有自己链的交易所币、应用币和 meme 币不收录；未收录的币和原因写在数据里。",
      "市值前 100 以外、默认使用传统密钥、但已在主网让持币人自行选用抗量子方案的链。",
      "有公开代码或在跑的网络、且至少有一项活跃迹象的抗量子链。活跃迹象指：CoinGecko 或 CoinMarketCap 已收录，GitHub 主代码库收藏数不少于 50，或项目方、社区最近 30 天有发帖（团队自己提交代码不算）。只有白皮书的项目记为线索，不进表。",
      "新项目可以在 GitHub 上附原始出处自行提交。收录免费。",
    ],
    cad_h: "如何保持更新",
    cad: ["每周自动巡查一次：读取每条链的最新区块、最新发布版本、提交次数和跟踪的提案，把变化整理成一个拉取请求。人工核对后才会发布，档位也只由人修改。", "每月按出处把每一行重新核对一遍，并刷新市值名单。每行都显示最近核对日期。"],
    left_h: (n) => `市值前 100 中未收录的币（${n} 个）`, left_cols: ["排名", "币", "未收录原因"],
    rules_link: "完整规则（含全部阈值和数据文件）：",
    open_h: "独立性与局限",
    open: ["收录和档位都免费。任何项目都不能付费上榜或改档，我们也不收这两类费用。",
      "这不是安全审计。档位只说明一条链在协议层提供了什么，不代表这条链的代码或任何钱包没有缺陷。",
      "只看协议层：钱包、交易所、托管方和跨链桥不在评估范围内。",
      "本站不逐条链计算有多少币的公钥已经暴露：这需要对整条链做分析。有已发表研究的就引用，其余写「暂无可靠数据」。",
      "本站不按关键词统计「抗量子提交」：关键词会漏掉真正的工作、又会把无关改动算进来；对原生抗量子链这个数没有意义；大链的工作分散在很多仓库。进展改用带原始出处、带日期的里程碑来数。",
      "项目自研方案的强度等级显示为「未评估」。没有外部机构评审过的方案，本站不替项目下结论。",
      "不构成投资建议。我们不评论币价，也不预测量子计算机何时能破解现有密码。",
      "这是某一时点的快照，不是实时数据：每条都标明说法最近核对的日期，超过 90 天没有复核的会在页面上提示。",
      "所有数据和脚本都公开在 GitHub 上，谁都可以重新跑一遍核查。"],
    cite_h: "如何引用",
    cite: (v, d, url) => `Balance Zhao. Post-Quantum Blockchains, version ${v} (${d}). ${url}. Data licensed CC BY-NC 4.0.`,
    cite_p: "引用某一条链时，请写它的页面网址和页面顶部标明的最近核对日期。每次数据变更都会升版本号，并记录在更新记录里。",
    cite_files: "下载数据（JSON）：", cite_meta: "引用元数据：",
  },
};
Object.assign(METHOD.en, {
  x_h: "Discussion on X",
  x_list: ["Chain pages can show what people say on X about a chain's post-quantum work. We include only people and accounts with a public identity and a stated role around the chain, such as founders, foundations, core developers, proposal authors, researchers, wallets, exchanges and official accounts.", "We open every original post and record the date we checked it. Each line gives the date, who posted and their role, the kind of post (a plan or timeline, a proposal, a release, research or a statement), our one-sentence summary and a link to the post. A chain page shows the three newest; the rest open with \"Show more\".", "These are claims. They never set or change a stage, and a chain with no posts listed is not marked down: a decentralized chain may have no single voice. Ordinary users are not named."],
});
Object.assign(METHOD.zh, {
  x_h: "X 上的讨论",
  x_list: ["链的详情页可以列出 X 上关于这条链抗量子进展的说法。只收有公开身份、和这条链关系明确的人和账号，例如创始人、基金会、核心开发者、提案作者、研究者、钱包、交易所和官方号。", "每一条我们都打开原帖核对，并记下核对日期。每行写明日期、谁发的及其身份、帖子类型（计划或时间表、提案讨论、上线、研究、表态）、我们的一句话转述和原帖链接。详情页显示最新的 3 条，其余点「展开」查看。", "这些都只是说法，不决定也不改变档位。没有列出帖子的链不会因此扣分：去中心化的链可能本来就没有统一的发言人。普通用户不写名字。"],
});
function howHTML() {
  const M = METHOD[lang];
  const ul = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  /* each cell carries its column name, so on a phone a row can stack as a labelled card */
  const labelled = (cols, rows) => rows.replace(/<tr>([\s\S]*?)<\/tr>/g, (m, inner) => { let i = 0; return "<tr>" + inner.replace(/<td(?=[ >])/g, () => `<td data-l="${esc(cols[i++] || "")}"`) + "</tr>"; });
  const table = (cols, rows, cls) => `<div class="scalebox"><table class="scale${cls ? " " + cls : ""}"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${labelled(cols, rows)}</tbody></table></div>`;
  const ex = (s) => { const e = D.examples && D.examples[s]; return e ? `<a href="${chainURL(e.id)}">${esc(lang === "zh" && e.zh_name ? e.zh_name : e.name)}</a>` : "—"; };
  const stages = DF.stage.map((t, s) => `<tr><td>${badge(s)}</td><td>${esc(t)}</td><td>${ex(s)}</td></tr>`).join("");
  const raw = (f) => `https://raw.githubusercontent.com/Balance0014/post-quantum-blockchains/main/data/${f}`;
  const H = (id, k) => `<h2 id="${id}">${esc(M[k])}</h2>`;
  const toc = [["stages", "scale_h"], ["rules", "rules_h"], ["groups", "groups_h"], ["network", "net_h"], ["algorithms", "algo_h"], ["evidence", "grades_h"], ["xtalk", "x_h"], ["charts", "charts_h"], ["data", "dims_h"], ["coverage", "who_h"], ["updates", "cad_h"], ["limits", "open_h"], ["cite", "cite_h"]];
  const cite = `${H("cite", "cite_h")}<p><code class="cite">${esc(M.cite(D.release.version, D.release.date, D.site_url))}</code></p><p>${esc(M.cite_p)}</p>
    <p>${esc(M.cite_files)}${SEP(M.cite_files)}${["chains.json", "network.json", "projects.json", "sources.json"].map((f) => `<a href="${raw(f)}" target="_blank" rel="noopener" class="mono">${f}</a>`).join(" · ")}</p>
    <p>${esc(M.cite_meta)}${SEP(M.cite_meta)}<a href="${blob("CITATION.cff")}" target="_blank" rel="noopener" class="mono">CITATION.cff</a> · <a href="${blob("CHANGELOG.md")}" target="_blank" rel="noopener" class="mono">CHANGELOG.md</a></p>`;
  const groups = ["scope", "design", "netw", "ss", "cov", "mig", "audit"].map((k) => F[k].vals.map((v, i) => `<tr><td>${i ? "" : esc(L(LAB[k]))}</td><td>${esc(F[k].lab(v))}</td><td>${esc(F[k].def(v))}</td></tr>`).join("")).join("");
  const net = ["ok", "quiet", "stalled", "unknown"].map((s) => `<tr><td><span class="dot ${s}" style="margin-right:7px"></span>${esc(L("st_" + s))}</td><td>${esc(DF["st_" + s])}</td></tr>`).join("");
  const algo = Object.keys(D.chips).map((k) => `<tr><td><span class="chip ${D.chips[k].tone}">${esc(T(D.chips[k]))}</span></td><td>${esc(DF.chips[k])}</td></tr>`).join("")
    + `<tr id="hybrid"><td><span class="chip">${esc(L("hybrid"))}</span></td><td>${esc(DF.hybrid)}</td></tr>`;
  const grades = `<div class="grades">${M.grades.map(([h, g], i) => `<div class="card"><span class="grade ${g} grade-ic" aria-hidden="true">${["●", "◐", "○"][i]}</span><b>${esc(h)}</b><p>${esc(DF.grades[g])}</p></div>`).join("")}</div>`;
  const dims = M.dims.map(([f, what, src, how, lim, scripts]) => `<tr><td>${esc(f)}</td><td>${esc(what)}</td><td>${esc(src)}</td><td>${esc(how)}</td><td>${esc(lim)}</td><td>${scripts.map((p) => `<a href="${blob(p)}" target="_blank" rel="noopener" class="mono">${esc(p)}</a>`).join("<br>")}</td></tr>`).join("");
  return `<section class="how" id="how"><article class="prose">
    <span class="eyebrow">${esc(L("nav_method"))}</span><h1>${esc(M.title)}</h1>
    <p class="lede">${esc(M.lede)}</p>
    <nav class="toc" aria-label="${esc(L("toc"))}">${toc.map(([id, k]) => `<a href="#${id}">${esc(M[k])}</a>`).join("")}</nav>
    ${H("stages", "scale_h")}${table(M.cols, stages)}
    ${H("rules", "rules_h")}${ul(M.rules)}
    ${H("groups", "groups_h")}${table(M.groups_cols, groups)}
    ${H("network", "net_h")}${table(M.net_cols, net)}<p>${esc(M.net_rule)}</p>
    ${H("algorithms", "algo_h")}${table(M.algo_cols, algo)}
    <h3 id="nist">${esc(L("nist_h"))}</h3><p>${esc(L("nist_p"))}</p>${table(L("nist_cols"), NSTS.map((k) => `<tr><td><span class="nk"><i class="ssw n-${k}"></i>${esc(L("nist")[k])}</span></td><td>${esc(DF.nist[k])}</td><td>${(NIST_SRC[k] || []).map(([u, t]) => `<a href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`).join("<br>") || "—"}</td></tr>`).join(""))}<p class="note-small">${esc(L("nist_snova"))}${SEP(L("nist_snova"))}<a href="https://eprint.iacr.org/2026/2154" target="_blank" rel="noopener">ePrint 2026/2154 ↗</a></p>
    ${H("evidence", "grades_h")}${grades}<p>${esc(M.cite_rule)}</p>
    ${H("xtalk", "x_h")}${ul(M.x_list)}
    ${H("charts", "charts_h")}${ul(M.charts)}
    ${H("data", "dims_h")}${table(M.dims_cols, dims, "dims")}
    ${H("coverage", "who_h")}${ul(M.who)}
    ${D.left_out && D.left_out.length ? `<details class="left"><summary>${esc(M.left_h(D.left_out.length))}</summary>${table(M.left_cols, D.left_out.map((x) => `<tr><td class="mono">#${x.rank}</td><td>${esc(x.name)} <span class="mono" style="color:var(--ink-3)">${esc(x.symbol)}</span></td><td>${esc(T(x.reason))}${x.note ? PAR(esc(T(x.note))) : ""}</td></tr>`).join(""))}</details>` : ""}
    ${H("updates", "cad_h")}${ul(M.cad)}
    ${H("limits", "open_h")}${ul(M.open)}
    ${cite}
    <p>${esc(M.rules_link)}${SEP(M.rules_link)}<a href="${blob("docs/stages.md")}" target="_blank" rel="noopener" class="mono">docs/stages.md</a></p>
  </article></section>`;
}
function renderMethod() {
  chrome("method");
  put("app", () => `<div class="page">${howHTML()}
    <div class="fixrow">${submitBox()}<section class="card fix"><p>${esc(L("foot_fix"))}</p><a class="btn" href="${URL_FIX}" target="_blank" rel="noopener">${esc(L("foot_btn_fix"))} ↗</a></section></div></div>`);
}

/* ---------- definitions popover, chart tooltips, theme and language ---------- */
if (!PRE) {
const pop = document.getElementById("pop");
let pinned = null, touch = false, flashT = 0;
function place(el) {
  pop.hidden = false;
  const r = el.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  const left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
  const top = r.bottom + 8 + h > window.innerHeight ? r.top - h - 8 : r.bottom + 8;
  pop.style.left = left + "px"; pop.style.top = Math.max(8, top) + "px";
}
/* where each defined term is explained in full on the method page */
function methodAnchor(ref) {
  const k = ref.split(".")[0];
  if (["ss", "cov", "mig", "audit", "design", "scope", "netw"].includes(k)) return "groups";
  if (k === "hybrid") return "hybrid";
  if (k === "xtalk") return "xtalk";
  if (k === "chips" || k === "level") return "algorithms";
  if (k === "stage") return "stages";
  if (k.startsWith("st_")) return "network";
  return "";
}
function showPop(el, tapped) {
  const def = el.dataset.def || (el.dataset.ref && refDef(el.dataset.ref));
  const more = el.dataset.ref && methodAnchor(el.dataset.ref);
  if (def) pop.innerHTML = (el.dataset.title ? `<b>${esc(el.dataset.title)}</b>` : "") + esc(def) + (more ? `<a class="pmore" href="${href("method/")}#${more}">${esc(L("pop_more"))} →</a>` : "");
  else pop.innerHTML = esc(el.dataset.tip) + (tapped && el.matches("a[href]") ? `<span class="hint">${esc(L("tap_open"))}</span>` : "");
  place(el);
}
function hidePop() { pop.hidden = true; pinned = null; pop.classList.remove("pinned"); }
function pin(el, tapped) { pinned = el; pop.classList.add("pinned"); showPop(el, tapped); }
/* copy text, confirm next to the control; if the browser refuses, select the text instead */
TIP.copy = (el, text, done, selectEl) => {
  const ok = () => { clearTimeout(flashT); pop.textContent = done; pop.classList.remove("pinned"); pinned = null; place(el); el.classList.add("done"); flashT = setTimeout(() => { pop.hidden = true; el.classList.remove("done"); }, 1600); };
  const pick = () => { if (!selectEl) { pop.textContent = text; pin(el); return; } const r = document.createRange(); r.selectNodeContents(selectEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(ok, pick); else pick();
};
const tipOf = (t) => t && t.closest && t.closest(".term, [data-tip]");
document.addEventListener("pointerdown", (e) => { touch = e.pointerType === "touch" || e.pointerType === "pen"; }, true);
document.addEventListener("mouseover", (e) => { const t = tipOf(e.target); if (t && !pinned && !touch) showPop(t); });
document.addEventListener("mouseout", (e) => { const t = tipOf(e.target); if (t && !pinned && !t.contains(e.relatedTarget)) pop.hidden = true; });
document.addEventListener("focusin", (e) => { const t = tipOf(e.target); if (t && !touch) showPop(t); });
document.addEventListener("focusout", (e) => { if (tipOf(e.target) && !pinned) pop.hidden = true; });
document.addEventListener("click", (e) => {
  const t = e.target.closest(".term");
  if (t) { e.preventDefault(); e.stopPropagation(); if (pinned === t) hidePop(); else pin(t); return; }
  /* on a touch screen the first tap on a chart mark shows its values; a second tap on a link opens it */
  const d = touch && e.target.closest("[data-tip]");
  if (d && !d.matches("button")) {
    if (pinned !== d) { e.preventDefault(); e.stopPropagation(); pin(d, true); return; }
    if (!d.matches("a[href]")) { e.preventDefault(); hidePop(); return; }
  }
  if (!e.target.closest("#pop")) hidePop();
  const m = document.querySelector("details.menu[open]");
  if (m && (!e.target.closest("details.menu") || e.target.closest(".menu-pop a"))) m.open = false;
}, true);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { hidePop(); const m = document.querySelector("details.menu[open]"); if (m) { m.open = false; m.querySelector("summary").focus(); } }
  const t = e.target.closest && e.target.closest(".term");
  if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.stopPropagation(); if (pinned === t) hidePop(); else pin(t); }
}, true);
window.addEventListener("scroll", () => { if (!pop.hidden) hidePop(); }, { passive: true });
/* theme: follows the system until the reader picks one; the choice is remembered on this device */
const themeBtn = document.getElementById("theme");
const isDark = () => { const t = document.documentElement.getAttribute("data-theme"); return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; };
const syncTheme = () => themeBtn.setAttribute("aria-pressed", String(isDark()));
themeBtn.addEventListener("click", () => { const next = isDark() ? "light" : "dark"; document.documentElement.setAttribute("data-theme", next); try { localStorage.setItem("pq-theme", next); } catch (e) { /* storage blocked: the choice lasts for this page only */ } syncTheme(); });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncTheme);
syncTheme();
/* the language switch opens the same page at the same section, with the same filters */
const langA = document.getElementById("lang");
langA.addEventListener("click", () => { langA.href = langA.getAttribute("href").split("#")[0] + TIP.pos(); });
}

/* ---------- start ---------- */
({ home: renderHome, chain: renderChain, changes: renderChanges, x: renderX, method: renderMethod, data: renderData })[D.page]();
if (PRE) globalThis.OUT = OUT;
