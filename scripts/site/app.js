/* Post-Quantum Blockchains · page script.
   Each page embeds its data as window.PQ (written by scripts/build_site.py). The page is already readable without
   this script; the script adds filtering, sorting, clickable rows, chart filters and the definitions popover. */
"use strict";
/* scripts/build_site.py also runs this file in Node (no document) to write the same HTML into each page ahead of time. */
const PRE = typeof document === "undefined";
const OUT = {};
const put = (id, html) => { if (PRE) OUT[id] = html; else document.getElementById(id).innerHTML = html; };
const D = window.PQ;
const lang = D.lang;
const REPO = D.repo;
const URL_FIX = REPO + "/issues/new?template=correction.yml";
const URL_SUBMIT = REPO + "/issues/new?template=new-project.yml";
const fixURL = (c) => c ? `${URL_FIX}&title=${encodeURIComponent("Correction: " + c.name)}&project=${encodeURIComponent(c.name)}` : URL_FIX;
const href = (p) => D.base + (lang === "zh" ? "zh/" : "") + p;
const chainURL = (id) => href(`chains/${id}/`);
const blob = (path) => `${REPO}/blob/main/${path}`;
const URL_TALK = REPO + "/discussions", URL_X = "https://x.com/balance0014";
const state = { group: "all", stage: null, net: "all", fam: "all", q: "", sort: "default" };
/* page hooks: where the language switch should land, and copy-with-confirmation (set up in the browser) */
const TIP = { pos: () => location.hash, copy: () => {} };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const UI = {
  en: {
    nav_chains: "Chains", nav_changes: "This week", nav_method: "Method", gh: "Data on GitHub",
    eyebrow: (d) => `Post-quantum signatures · checked ${d}`,
    verdict: (k, n) => k === 0 ? `None of the ${n} largest blockchains lets holders use a post-quantum signature on mainnet today.`
      : `${k} of the ${n} largest blockchains ${k === 1 ? "lets" : "let"} holders use a <em>post-quantum signature</em> on mainnet today.`,
    verdict_sub: (names, t3) => `${names ? `On mainnet today: ${names}. ` : ""}${t3 ? `Next closest, on a public testnet: ${t3}. ` : ""}Every rating links to a primary source.`,
    kpi_top: "of the largest blockchains offer post-quantum signatures on mainnet",
    kpi_native: "post-quantum native chains, with post-quantum signatures by default",
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
    search: "Search chains, schemes or tickers", f_all: "All", f_top: "Top 100", f_optin: "Mainnet opt-in", f_native: "Post-quantum native", f_early: "Early",
    f_label: "Filter by group", sort_label: "Sort",
    stage_chip: (s, nm) => `Stage ${s} · ${nm}`, stage_clear: "Clear the stage filter",
    sort_default: "Biggest chains first", sort_stage_d: "Stage: high to low", sort_stage_a: "Stage: low to high", sort_latest: "Latest change", sort_name: "Name",
    shown: (n, t) => `${n} of ${t} chains`, empty: "No chains match. Clear the search or the filters.",
    th_chain: "Chain", th_stage: "Stage", th_algo: "Algorithm and standard", th_net: "Network", th_latest: "Latest change", th_open: "Open",
    g_top: "The largest blockchains", g_top_s: "CoinGecko top 100 by market cap; only coins with their own network. Most have no post-quantum option yet, and that is worth knowing too.",
    g_optin: "Chains with a mainnet opt-in", g_optin_s: "Launched with classical keys; post-quantum accounts or locking scripts are live on mainnet for holders who choose them.",
    g_native: "Post-quantum native", g_native_s: "Every transfer on mainnet is signed with a post-quantum scheme by default. Check the algorithm and network columns too.",
    g_early: "Early projects", g_early_s: "No mainnet running yet.",
    k_upgrading: "Upgrading", k_native: "Native", k_early: "Native · testnet",
    rank: (r) => `#${r} by market cap`,
    more: "More", less: "Less",
    blocks_ago: (m) => m < 1 ? "Block was under 1 min old at the check" : `Block was ${Math.round(m)} min old at the check`,
    blocks_short: (m) => m < 1 ? "Latest block · under 1 min ago" : `Latest block · ${Math.round(m)} min ago`,
    no_block: "Endpoint did not respond", no_probe: "No public block endpoint", commits: (n) => `${n.toLocaleString("en-US")} commit${n === 1 ? "" : "s"} in 90 days`, no_repo: "No public node repo found",
    threshold: (m) => `Counts as running while the newest block is under ${m} min old.`,
    queried: "queried",
    st_ok: "Running", st_quiet: "Blocks flowing, code quiet", st_stalled: "Blocks stopped", st_unknown: "Could not check",
    checked_tag: "checked",
    xchk_ok: (h, a) => `Independent explorer: block #${h}, ${a} min old.`, xchk_no: "The independent explorer did not answer.", xchk_none: "Only this source shows an old block, and no independent explorer confirms it, so the network is marked “could not check”.",
    own_src: { project: "Read from the project's own node or explorer, not an independent one.", community: "Read from a community-run explorer." },
    e_src: "Sources", e_consensus: "Consensus", e_release: "Latest release", e_code: "Code activity", e_reviewed: "Claims last reviewed",
    pre: " (pre-release)", tag_only: " (tag only)", also: "Also",
    lead: "lead",
    stage_names: ["Nothing public", "Research", "Formal proposal", "Testnet", "Mainnet opt-in", "Default"],
    stage_word: "Stage",
    d_back: "All chains", d_today: "Protection today", d_watch: "Watch out for", d_can: "What you can do now", d_next: "What to watch next",
    d_timeline: "Timeline", d_facts: "At a glance", d_stage: "Stage", d_algo: "Algorithm", d_net: "Network", d_checked: "Network checked", d_unv: "Claims we could not verify",
    d_unv_note: "These are left out of the stage until a primary source confirms them.", d_no_tl: "No dated milestones recorded yet. The sources below back the current entry.",
    d_fix: "See something wrong or out of date on this page? Report it with a primary source. We reply within 7 days, and every change is recorded in the public changelog.",
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
    foot_fix: "The data lives on GitHub. Spot an error, or know a newer milestone? Open a correction with a primary source. We reply within 7 days.",
    foot_btn_fix: "Report an error", foot_btn_submit: "Submit a project", foot_btn_repo: "Open the repository",
    foot_fine: "A tracker, not a forecast. It rates only what is already live, never predicts when today's cryptography might be broken, and says nothing about prices. Stages are never paid for. Data and scripts are public, so anyone can check them.",
    foot_cite: (v, d) => `Version ${v}, ${d}. Data CC BY 4.0, scripts MIT.`, foot_cite_link: "How to cite", foot_log: "Changelog",
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
    data_lic: "Data CC BY 4.0, scripts MIT.",
    ct_h: "Talk to us in public", ct_lede: "Questions, corrections and new projects all go through public channels, so every answer stays on the record.",
    ct: [["Questions and ideas", "GitHub Discussions"], ["Report an error", "GitHub issue, with a primary source"], ["Submit a project", "GitHub issue form"], ["Follow updates", "X · @balance0014"]],
    ct_reply: "We reply within 7 days.",
    any: "Any", group_label: "Group", stage_label: "Stage", fam_label: "Algorithm", search_label: "Search",
    fam: { mldsa: "ML-DSA", falcon: "Falcon", slhdsa: "SLH-DSA", hash: "Other hash-based", other: "Custom or other", none: "None yet" },
    remove: (x) => `Remove filter: ${x}`, clear_all: "Clear all", clear_filters: "Clear all filters",
    empty_h: "No chains match these filters.", empty_p: "Remove a filter or try a different search.",
    keys_h: "What the colours mean",
    fig_src: "Source", fig_checked: (d) => `checked ${d}`, fig_dl: "Download data (CSV)", mcap_src: (d) => `CoinGecko market cap, ${d}`,
    cum_title: "Post-quantum mainnet launches over time",
    cum_note: (n, k, y, u) => `Running total of chains where post-quantum signatures are live on mainnet, each placed on the day they arrived. ${k} of the ${n} arrived in ${y}.${u ? ` ${u} more have no sourced date yet.` : ""}`,
    cum_total: "chains",
    tap_open: "Tap again to open", copy_link: "Copy a link to this section", link_copied: "Link copied",
    grp_more: (n) => `+${n} more`, show_all: (n) => `Show all ${n} chains`,
  },
  zh: {
    nav_chains: "链列表", nav_changes: "本周变化", nav_method: "评档方法", gh: "数据在 GitHub",
    eyebrow: (d) => `抗量子签名 · 核对于 ${d}`,
    verdict: (k, n) => k === 0 ? `市值最大的 ${n} 条区块链，目前没有一条能让持币人在主网上使用抗量子签名。`
      : `市值最大的 ${n} 条区块链中，今天有 ${k} 条能让持币人在主网上使用<em>抗量子签名</em>。`,
    verdict_sub: (names, t3) => `${names ? `主网上已能用的：${names}。` : ""}${t3 ? `离主网最近、已上公开测试网的：${t3}。` : ""}每个档位都附原始出处。`,
    kpi_top: "市值最大的区块链中，主网已能用抗量子签名",
    kpi_native: "条原生抗量子链，默认使用抗量子签名",
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
    search: "搜索链名、算法或币种代码", f_all: "全部", f_top: "市值前 100", f_optin: "主网可选用", f_native: "原生抗量子", f_early: "早期项目",
    f_label: "按分组筛选", sort_label: "排序",
    stage_chip: (s, nm) => `第 ${s} 档 · ${nm}`, stage_clear: "清除档位筛选",
    sort_default: "大链在前", sort_stage_d: "档位从高到低", sort_stage_a: "档位从低到高", sort_latest: "最近变化", sort_name: "名称",
    shown: (n, t) => `显示 ${n} / ${t} 条`, empty: "没有符合条件的链。请清除搜索或筛选。",
    th_chain: "链", th_stage: "档位", th_algo: "算法与标准", th_net: "网络", th_latest: "最近一次变化", th_open: "打开",
    g_top: "市值前 100 的区块链", g_top_s: "按 CoinGecko 市值排名前 100，只取有自己网络的币。大多还没有抗量子选项，这本身也值得知道。",
    g_optin: "主网可选抗量子的链", g_optin_s: "上线时使用传统密钥；抗量子账户或锁定脚本已上主网，持币人可自行选用。",
    g_native: "原生抗量子链", g_native_s: "主网上的每笔转账默认使用抗量子签名。请同时留意算法和网络两列。",
    g_early: "早期项目", g_early_s: "主网尚未运行。",
    k_upgrading: "升级中", k_native: "原生", k_early: "原生 · 测试网",
    rank: (r) => `市值第 ${r}`,
    more: "展开", less: "收起",
    blocks_ago: (m) => m < 1 ? "核查时最新区块不到 1 分钟" : `核查时最新区块已出 ${Math.round(m)} 分钟`,
    blocks_short: (m) => m < 1 ? "最新区块 · 不到 1 分钟前" : `最新区块 · ${Math.round(m)} 分钟前`,
    no_block: "接口没有响应", no_probe: "没有公开的出块接口", commits: (n) => `90 天内 ${n.toLocaleString("en-US")} 次提交`, no_repo: "未找到公开的节点代码库",
    threshold: (m) => `最新区块在 ${m} 分钟以内，算正常出块。`,
    queried: "查询时间",
    st_ok: "运行中", st_quiet: "在出块，代码 90 天无提交", st_stalled: "出块停了", st_unknown: "无法核实",
    checked_tag: "核对于",
    xchk_ok: (h, a) => `独立区块浏览器：第 ${h} 号区块，${a} 分钟前。`, xchk_no: "独立区块浏览器没有响应。", xchk_none: "只有这一个来源显示区块过旧，没有独立的区块浏览器可以印证，所以网络状态记为「无法核实」。",
    own_src: { project: "数据来自项目自己的节点或浏览器，不是独立来源。", community: "数据来自社区运营的区块浏览器。" },
    e_src: "出处", e_consensus: "共识机制", e_release: "最新版本", e_code: "代码活跃度", e_reviewed: "说法最近核对",
    pre: "（预发布）", tag_only: "（仅有标签，未发正式版本）", also: "另看",
    lead: "线索",
    stage_names: ["无公开进展", "仅有研究", "已有正式提案", "仅限测试网", "主网可选用", "默认抗量子"],
    stage_word: "档位",
    d_back: "全部链", d_today: "当前保护", d_watch: "需要注意", d_can: "现在能做什么", d_next: "接下来关注什么",
    d_timeline: "时间线", d_facts: "速览", d_stage: "档位", d_algo: "算法", d_net: "网络", d_checked: "网络核对", d_unv: "尚未核实的说法",
    d_unv_note: "在原始出处确认之前，这些说法不计入档位。", d_no_tl: "还没有记录带日期的里程碑。当前条目以下方出处为依据。",
    d_fix: "发现本页有误或已过时？请附上原始出处报错。我们 7 天内回复，每次修改都记录在公开的更新记录里。",
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
    foot_fix: "数据公开在 GitHub 上。发现错误，或掌握更新的进展？请附上原始出处提交纠错。我们 7 天内回复。",
    foot_btn_fix: "报错", foot_btn_submit: "提交项目", foot_btn_repo: "打开代码库",
    foot_fine: "本站是进度追踪，不做预测：只按已经上线的内容评档，不预测量子计算机何时能破解现有密码，也不评论币价。档位不能花钱买。数据和脚本全部公开，谁都可以复核。",
    foot_cite: (v, d) => `版本 ${v}，${d}。数据采用 CC BY 4.0 许可，脚本采用 MIT 许可。`, foot_cite_link: "如何引用", foot_log: "更新记录",
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
    data_lic: "数据采用 CC BY 4.0 许可，脚本采用 MIT 许可。",
    ct_h: "通过公开渠道联系我们", ct_lede: "提问、纠错、提交新项目都走公开渠道，每条回复都留有记录。",
    ct: [["提问和建议", "GitHub Discussions"], ["报错", "GitHub issue，请附原始出处"], ["提交项目", "GitHub issue 表单"], ["关注更新", "X · @balance0014"]],
    ct_reply: "我们 7 天内回复。",
    any: "全部", group_label: "分组", stage_label: "档位", fam_label: "算法", search_label: "搜索",
    fam: { mldsa: "ML-DSA", falcon: "Falcon", slhdsa: "SLH-DSA", hash: "其他哈希签名", other: "自研或其他", none: "尚无" },
    remove: (x) => `移除筛选：${x}`, clear_all: "全部清除", clear_filters: "清除全部筛选",
    empty_h: "没有符合这些条件的链。", empty_p: "去掉一个筛选条件，或换个搜索词试试。",
    keys_h: "颜色说明",
    fig_src: "来源", fig_checked: (d) => `核对于 ${d}`, fig_dl: "下载数据（CSV）", mcap_src: (d) => `CoinGecko 市值，${d}`,
    cum_title: "抗量子主网上线时间线",
    cum_note: (n, k, y, u) => `主网上已能用抗量子签名的链，按上线当天累计，每条链一个点。${n} 条中有 ${k} 条是 ${y} 年上线的。${u ? `另有 ${u} 条尚未找到带出处的日期。` : ""}`,
    cum_total: "条",
    tap_open: "再点一次打开", copy_link: "复制本节链接", link_copied: "链接已复制",
    grp_more: (n) => `另有 ${n} 条`, show_all: (n) => `显示全部 ${n} 条`,
  },
};

/* One sentence for every label on the page. */
const DEFS = {
  en: {
    pqsig: "A digital signature designed to resist attacks by large quantum computers, such as ML-DSA, Falcon or SLH-DSA. A holder signs with one to authorize a transfer.",
    f_group: "Top 100: the largest coins with their own network. Mainnet opt-in: stage 4 chains that launched with classical keys. Post-quantum native: post-quantum signatures by default. Early: no mainnet yet.",
    f_fam: "The post-quantum signature family a chain uses or proposes. NIST selected ML-DSA (Dilithium), Falcon and SLH-DSA (SPHINCS+). Other hash-based schemes include XMSS and WOTS+. Custom or other covers schemes without an outside standard.",
    stage: [
      "No public post-quantum research, roadmap or proposal from the core developers, the foundation or the main client teams.",
      "Official research, a roadmap, an open proposal or prototype code exists, but nothing is merged into the official proposal repository yet.",
      "A quantum-related protocol change is merged into the official proposal repository (BIP, EIP, ZIP and so on) at Draft status or later.",
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
      broken: "A public attack breaks parameters this chain used or still allows.",
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
    th_since: "The day post-quantum signatures became usable on the chain's current mainnet: the genesis block for post-quantum native chains, the day the upgrade went live for the others. Only chains at stage 4 or 5 have one; the chain's page links the source.",
    th_checked: "When the weekly patrol last read this chain's network data.",
    reviewed: "When the claims on this page were last checked against their sources.",
  },
  zh: {
    pqsig: "为抵御大型量子计算机攻击而设计的数字签名，例如 ML-DSA、Falcon、SLH-DSA。持币人用它签名来授权转账。",
    f_group: "市值前 100：有自己网络的最大币种。主网可选用：上线时用传统密钥、现已到第 4 档的链。原生抗量子：默认使用抗量子签名。早期项目：主网尚未运行。",
    f_fam: "链所用或提议的抗量子签名类别。ML-DSA（Dilithium）、Falcon 和 SLH-DSA（SPHINCS+）由 NIST 选定；其他哈希签名包括 XMSS 和 WOTS+；「自研或其他」指没有外部标准的方案。",
    stage: [
      "核心开发者、基金会和主要客户端团队都没有公开的抗量子研究、路线图或提案。",
      "有官方研究、路线图、未合并的提案或原型代码，但还没有内容合并进官方提案库。",
      "与量子相关的协议改动已合并进官方提案库（如 BIP、EIP、ZIP），状态为草案或更高。",
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
      broken: "该链用过或仍允许使用的参数，已有公开的破解方法。",
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
    th_since: "抗量子签名在这条链现行主网上可用的日期：原生抗量子链取创世区块，其他链取升级生效当天。只有第 4、5 档的链有这个日期，出处见链的详情页。",
    th_checked: "每周自动巡查最近一次读取这条链网络数据的日期。",
    reviewed: "本页说法最近一次对照出处核对的日期。",
  },
};

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
  const nav = [["overview", "nav_overview"], ["chains", "nav_chains"], ["timeline", "nav_timeline"], ["method/", "nav_method"], ["data", "nav_data"], ["contact", "nav_contact"]];
  put("nav", nav.map(([p, k]) => p.endsWith("/")
    ? `<a href="${href(p)}"${view === "method" ? ' aria-current="page"' : ""}>${esc(L(k))}</a>`
    : `<a href="${href("")}#${p}" data-sec="${p}">${esc(L(k))}</a>`).join(""));
  put("foot", `
    <div class="row1"><p>${esc(L("foot_fix"))}</p>
      <a class="btn primary" href="${URL_FIX}" target="_blank" rel="noopener">${esc(L("foot_btn_fix"))} ↗</a>
      <a class="btn" href="${URL_SUBMIT}" target="_blank" rel="noopener">${esc(L("foot_btn_submit"))} ↗</a>
      <a class="btn" href="${URL_TALK}" target="_blank" rel="noopener">GitHub Discussions ↗</a>
      <a class="btn" href="${URL_X}" target="_blank" rel="noopener">X · @balance0014 ↗</a></div>
    <div class="fine">${esc(L("foot_fine"))}</div>
    <div class="fine">${esc(L("foot_cite")(D.release.version, D.release.date))} <a href="${href("method/")}#cite">${esc(L("foot_cite_link"))}</a>${D.has_changes ? ` · <a href="${href("changes/")}">${esc(L("nav_changes"))}</a>` : ""} · <a href="${D.base}llms.txt">llms.txt</a> · <a href="${blob("CHANGELOG.md")}" target="_blank" rel="noopener">${esc(L("foot_log"))} ↗</a></div>`);
}

/* ---------- home ---------- */
const GROUP_ORDER = { top: 0, optin: 1, native: 2, early: 3 };
const GROUPS = ["all", "top", "optin", "native", "early"];
const NETS = ["ok", "quiet", "stalled", "unknown"];
const FAMS = ["mldsa", "falcon", "slhdsa", "hash", "other", "none"];
const SORTS = ["default", "stage_d", "stage_a", "since", "latest", "name"];
const DEFAULT = { group: "all", stage: null, net: "all", fam: "all", q: "", sort: "default" };
const defaultOrder = (a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || (a.rank || 999) - (b.rank || 999) || b.stage - a.stage || a.name.localeCompare(b.name);
const inGroup = (c, g) => g === "all" || (g === "top" ? c.rank != null : g === "optin" ? c.kind === "upgrading" && c.stage === 4 : c.group === g);
/* search text: names, ticker, algorithm and labels, plus the older names of each family (Dilithium, SPHINCS+, FN-DSA) */
const FAM_WORDS = { mldsa: "ml-dsa dilithium", falcon: "falcon fn-dsa", slhdsa: "slh-dsa sphincs", hash: "hash xmss wots winternitz", other: "", none: "" };
const hay = (c) => c._hay || (c._hay = [c.name, c.zh_name, c.ticker, c.algo.en, c.algo.zh, ...c.chips.map((k) => `${D.chips[k].en} ${D.chips[k].zh}`), ...c.fam.map((f) => FAM_WORDS[f])].join(" ").toLowerCase());
/* every filter is one test; a chain is listed when it passes all of them */
const TEST = {
  group: (c, v) => inGroup(c, v),
  stage: (c, v) => v == null || c.stage === v,
  net: (c, v) => v === "all" || c.net.status === v,
  fam: (c, v) => v === "all" || c.fam.includes(v),
  q: (c, v) => !v.trim() || hay(c).includes(v.trim().toLowerCase()),
};
const matches = (c, over) => Object.keys(TEST).every((k) => TEST[k](c, over && k in over ? over[k] : state[k]));
const countWith = (k, v) => D.chains.filter((c) => matches(c, { [k]: v })).length;
const isDefault = () => Object.keys(TEST).every((k) => (k === "q" ? !state.q.trim() : state[k] === DEFAULT[k]));
function filtered() {
  const rows = D.chains.filter((c) => matches(c));
  const s = state.sort;
  if (s === "default") rows.sort(defaultOrder);
  else if (s === "stage_d") rows.sort((a, b) => b.stage - a.stage || defaultOrder(a, b));
  else if (s === "stage_a") rows.sort((a, b) => a.stage - b.stage || defaultOrder(a, b));
  else if (s === "latest") rows.sort((a, b) => sortKey(b.latest.date).localeCompare(sortKey(a.latest.date)) || defaultOrder(a, b));
  else if (s === "name") rows.sort((a, b) => name(a).localeCompare(name(b)));
  else if (s === "since") rows.sort((a, b) => (a.since ? 0 : a.stage >= 4 ? 1 : 2) - (b.since ? 0 : b.stage >= 4 ? 1 : 2) || (a.since && b.since ? a.since.date.localeCompare(b.since.date) : 0) || defaultOrder(a, b));
  return rows;
}
/* the view in the address bar: #chains?group=top&stage=4 opens the table with those filters */
function stateQS() {
  const p = new URLSearchParams();
  for (const k of Object.keys(DEFAULT)) { const v = k === "q" ? state.q.trim() : state[k]; if (v !== DEFAULT[k] && v !== "") p.set(k, String(v)); }
  return p.toString();
}
function readHash() {
  Object.assign(state, DEFAULT);
  if (!location.hash.startsWith("#chains?")) return false;
  const p = new URLSearchParams(location.hash.slice(8));
  if (GROUPS.includes(p.get("group"))) state.group = p.get("group");
  if (/^[0-5]$/.test(p.get("stage") || "")) state.stage = +p.get("stage");
  if (NETS.includes(p.get("net"))) state.net = p.get("net");
  if (FAMS.includes(p.get("fam"))) state.fam = p.get("fam");
  if (p.get("q")) state.q = p.get("q").slice(0, 80);
  if (SORTS.includes(p.get("sort"))) state.sort = p.get("sort");
  return true;
}
function writeHash() {
  const qs = stateQS();
  if (qs) history.replaceState(null, "", "#chains?" + qs);
  else if (location.hash.startsWith("#chains?")) history.replaceState(null, "", "#chains");
}
function netCell(c) {
  const n = c.net, b = n.block, code = n.code;
  const parts = [b.ok ? L("blocks_short")(b.age) : (b.url ? L("no_block") : L("no_probe"))];
  if (code) parts.push(code.c90 == null ? (code.repo ? "" : L("no_repo")) : L("commits")(code.c90));
  return `<div class="net"><span class="l1"><span class="dot ${n.status}" aria-hidden="true"></span>${statusTerm(n.status)}</span><span class="l2">${parts.filter(Boolean).map(esc).join(" · ")}</span></div>`;
}
function sinceCell(c) {
  if (c.stage < 4) return `<span class="na">—</span>`;
  const ml = `<span class="ml">${esc(L("th_since"))}</span>`;
  if (!c.since) return `${ml}<span class="na">${esc(L("since_na"))}</span>`;
  return `${ml}<span class="sd mono">${esc(fmtDate(c.since.date))}</span><span class="sb">${esc(L("since_basis")[c.since.basis])}</span>`;
}
/* on a phone the list shows the first rows as cards, then a "show all" button (desktop and no-JS pages list everything) */
const FIRST = 12;
let expanded = PRE;
function rowHTML(c, later) {
  const sub = [esc(c.ticker), c.rank ? esc(L("rank")(c.rank)) : "", kindTerm(c)].filter(Boolean).join(" · ");
  const latestD = c.latest.date ? (c.latest.checked ? `${L("checked_tag")} ${fmtDate(c.latest.date)}` : fmtDate(c.latest.date)) : "—";
  const x = T(c.latest);
  return `<tr class="row${later ? " later" : ""}" data-id="${c.id}">
    <td class="c-chain"><div class="chain"><a class="nm" href="${chainURL(c.id)}">${esc(name(c))}</a><span class="sub">${sub}</span></div></td>
    <td class="c-stage">${stageCell(c.stage)}</td>
    <td class="c-algo"><div class="algo"><span class="a">${esc(T(c.algo))}</span>${chips(c.chips)}</div></td>
    <td class="c-net">${netCell(c)}</td>
    <td class="c-since${c.stage >= 4 ? "" : " none"}">${sinceCell(c)}</td>
    <td class="c-latest"><div class="latest"><span class="d">${esc(latestD)}</span><span class="x">${esc(x || "—")}</span>${x ? `<button type="button" class="more" hidden aria-expanded="false">${esc(L("more"))}</button>` : ""}</div></td>
    <td class="c-go">${ICON_GO}</td></tr>`;
}
function tableBody() {
  const rows = filtered();
  const grouped = state.sort === "default" && isDefault();
  let html = "", last = null, i = 0;
  for (const c of rows) {
    if (grouped && c.group !== last) { last = c.group; html += `<tr class="grp"><td colspan="7"><span class="gt">${term(esc(L("g_" + c.group)), DF["g_" + c.group], L("g_" + c.group))}</span><span class="gs">${esc(L("g_" + c.group + "_s"))}</span></td></tr>`; }
    html += rowHTML(c, !expanded && i++ >= FIRST);
  }
  if (!rows.length) html = `<tr class="none"><td colspan="7" class="empty"><div class="ei"><b>${esc(L("empty_h"))}</b><span>${esc(L("empty_p"))}</span><button type="button" class="btn" data-clear>${esc(L("clear_filters"))}</button></div></td></tr>`;
  return { html, count: L("shown")(rows.length, D.chains.length), hidden: expanded ? 0 : Math.max(0, rows.length - FIRST) };
}
/* filter rows: group, stage, network status, algorithm family; each button shows how many chains it would list */
const LAB = { group: "group_label", stage: "stage_label", net: "net_label", fam: "fam_label", q: "search_label" };
const fLabel = (k, v) => k === "group" ? L("f_" + v) : k === "stage" ? stageTitle(v) : k === "net" ? L("st_" + v) : k === "fam" ? L("fam")[v] : `“${v}”`;
function fbtn(k, v, inner, tip) {
  const n = countWith(k, v), on = state[k] === v;
  return `<button type="button" class="fbtn" data-k="${k}" data-v="${v == null ? "" : v}" aria-pressed="${on}"${!on && !n ? " disabled" : ""}${tip ? ` data-tip="${esc(tip)}"` : ""}>${inner}<span class="n">${n}</span></button>`;
}
function filtersHTML() {
  const rows = [
    ["group", GROUPS.slice(1), L("f_all"), DF.f_group, (v) => esc(L("f_" + v))],
    ["stage", [0, 1, 2, 3, 4, 5], L("any"), DF.th_stage, (v) => `<i class="sw s${v}" aria-hidden="true"></i>${v}<span class="sr"> · ${esc(stageName(v))}</span>`],
    ["net", NETS, L("any"), DF.th_net, (v) => `<span class="dot ${v}" aria-hidden="true"></span>${esc(L("st_" + v))}`],
    ["fam", FAMS, L("any"), DF.f_fam, (v) => esc(L("fam")[v])],
  ];
  return `<div class="filters">${rows.map(([k, vals, any, def, inner]) =>
    `<div class="frow" role="group" aria-label="${esc(L(LAB[k]))}"><span class="lab">${esc(L(LAB[k]))}${info(def, L(LAB[k]))}</span><div class="fopts">${fbtn(k, DEFAULT[k], esc(any))}${vals.map((v) => fbtn(k, v, inner(v), k === "stage" ? stageTitle(v) : "")).join("")}</div></div>`).join("")}</div>`;
}
function activeHTML() {
  const chips = [];
  for (const k of ["group", "stage", "net", "fam", "q"]) {
    const v = k === "q" ? state.q.trim() : state[k];
    if (v === DEFAULT[k]) continue;
    const text = `${L(LAB[k])}${CO()}${fLabel(k, v)}`;
    chips.push(`<button type="button" class="fchip" data-unset="${k}" aria-label="${esc(L("remove")(text))}">${esc(text)}<span class="x" aria-hidden="true">×</span></button>`);
  }
  return chips.length ? chips.join("") + `<button type="button" class="link-btn" data-clear>${esc(L("clear_all"))}</button>` : "";
}
/* the legend for both colour scales, next to the table */
function keybarHTML() {
  const st = [0, 1, 2, 3, 4, 5].map((s) => `<span class="ks s${s}"><i aria-hidden="true"></i><b>${s}</b>${stageTerm(s)}</span>`).join("");
  const nt = NETS.map((s) => `<span class="ks"><span class="dot ${s}" aria-hidden="true"></span>${statusTerm(s)}</span>`).join("");
  return `<div class="keybar" role="note" aria-label="${esc(L("keys_h"))}"><div class="kg"><span class="kt">${esc(L("stage_label"))}</span>${st}</div><div class="kg"><span class="kt">${esc(L("net_label"))}</span>${nt}</div></div>`;
}
/* charts: every one has a title, a one-line subtitle, the source and date, and its numbers as a CSV */
const ICON_DL = `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ICON_LINK = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5l3-3M7 4.5l1-1a2.8 2.8 0 014 4l-1 1M9 11.5l-1 1a2.8 2.8 0 01-4-4l1-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
function fig(o) {
  return `<figure class="fig" id="${o.id}" aria-labelledby="${o.id}-h"><div class="fig-h"><${o.h} id="${o.id}-h">${esc(o.title)}</${o.h}><p>${o.sub}</p></div><div class="fig-b">${o.body}</div>
    <figcaption class="fig-f"><span>${esc(L("fig_src"))}${CO()}${o.src} · ${esc(L("fig_checked")(fmtDate(D.checked)))}</span><span class="acts"><a href="${D.base}data/${o.csv}" download>${ICON_DL}${esc(L("fig_dl"))}</a></span></figcaption></figure>`;
}
const SRC_CHAINS = `<a href="${D.base}data/chains.json">chains.json</a>`;
const anchorBtn = (id, title) => `<button type="button" class="anchor" data-anchor="${id}" aria-label="${esc(L("copy_link"))}${CO()}${esc(title)}">${ICON_LINK}</button>`;
const secH = (id, eyebrow, title, lede) => `<div class="sec-h">${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ""}<div class="h2row"><h2 id="${id}-h">${esc(title)}</h2>${anchorBtn(id, title)}</div>${lede ? `<p>${lede}</p>` : ""}</div>`;
/* chart 1: the largest chains as one bar stacked by stage */
function stackHTML(top) {
  const by = [0, 1, 2, 3, 4, 5].map((s) => top.filter((c) => c.stage === s).length);
  const segs = by.map((n, s) => n ? `<button type="button" class="s${s}" style="--n:${n}" data-stage="${s}" aria-pressed="${state.stage === s}" aria-label="${esc(L("ov_seg")(s, stageName(s), n))}" data-tip="${esc(L("ov_seg")(s, stageName(s), n))}"><i aria-hidden="true">${s}</i><span>${n}</span></button>` : "").join("");
  const legend = by.map((n, s) => `<button type="button" class="s${s}" data-stage="${s}"${n ? "" : " disabled"} aria-label="${esc(L("ov_seg")(s, stageName(s), n))}"><span class="k"><i></i>${s} · ${esc(stageName(s))}</span><span class="c">${n}</span></button>`).join("");
  /* which of them sit at stage 2 or higher, named; the rest are counted */
  const who = `<div class="who">${[5, 4, 3, 2].filter((s) => by[s]).map((s) => `<div class="who-r">${badge(s)}<span>${top.filter((c) => c.stage === s).sort((a, b) => a.rank - b.rank).map((c) => `<a href="${chainURL(c.id)}">${esc(name(c))}</a>`).join(lang === "zh" ? "、" : ", ")}</span></div>`).join("")}
    <p class="note-small">${esc(L("ov_rest")(by[0] + by[1]))}</p></div>`;
  return fig({ id: "fig-stages", h: "h2", title: L("ov_title")(top.length), sub: esc(L("ov_note")(top.length, fmtDate(D.mcap_date))), csv: "chart-top-stages.csv",
    src: `${SRC_CHAINS} · ${esc(L("mcap_src")(fmtDate(D.mcap_date)))}`,
    body: `<div class="stack" role="group" aria-label="${esc(L("ov_title")(top.length))}">${segs}</div><div class="legend6">${legend}</div>${who}` });
}
/* chart 2: running total of chains with post-quantum signatures live on mainnet, one dot per chain on its date */
function cumHTML() {
  const live = D.chains.filter((c) => c.stage >= 4);
  const pts = live.filter((c) => c.since).sort((a, b) => a.since.date.localeCompare(b.since.date) || a.name.localeCompare(b.name));
  const N = pts.length;
  if (!N) return "";
  const ms = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  const y0 = +pts[0].since.date.slice(0, 4), yc = +D.checked.slice(0, 4);
  const T0 = Date.UTC(y0, 0, 1), T1 = ms(D.checked);
  const X = (d) => (((ms(d) - T0) / (T1 - T0)) * 100).toFixed(2);
  const top = Math.ceil((N + 1) / 4) * 4;
  const Y = (i) => ((i / top) * 100).toFixed(2);
  let line = "M0,100";
  pts.forEach((c, i) => { line += `H${X(c.since.date)}V${(100 - Y(i + 1)).toFixed(2)}`; });
  line += "H100";
  const dots = pts.map((c, i) => {
    const tip = `${L("since_tip")(name(c), fmtDate(c.since.date), L("since_basis")[c.since.basis])} · ${stageTitle(c.stage)}`;
    return `<a class="pt s${c.stage}" href="${chainURL(c.id)}" style="left:${X(c.since.date)}%;bottom:${Y(i + 1)}%" aria-label="${esc(tip)}" data-tip="${esc(tip)}"></a>`;
  }).join("");
  const xl = []; for (let y = y0; y <= yc; y++) xl.push(`<span${(yc - y) % 2 ? ' class="d2"' : ""} style="left:${X(`${y}-01-01`)}%">${y}</span>`);
  const yl = [0, top / 2, top].map((v) => `<span style="bottom:${Y(v)}%">${v}</span>`).join("");
  const k = pts.filter((c) => +c.since.date.slice(0, 4) === yc).length;
  const keys = [5, 4].map((s) => `<span class="s${s}"><i class="round"></i>${esc(stageTitle(s))}</span>`).join("");
  return fig({ id: "fig-since", h: "h2", title: L("cum_title"), sub: esc(L("cum_note")(N, k, yc, live.length - N)), csv: "chart-mainnet-since.csv", src: SRC_CHAINS,
    body: `<div class="cum"><div class="yax" aria-hidden="true">${yl}</div><div class="cw"><div class="plot">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="area" d="${line}V100H0Z"/><path d="${line}"/></svg>${dots}
      <span class="ann" style="right:0;bottom:calc(${Y(N)}% + 12px)"><b>${N}</b> ${esc(L("cum_total"))}</span></div>
      <div class="xax" aria-hidden="true">${xl.join("")}</div></div></div><div class="keys">${keys}</div>` });
}
/* milestones per month, stacked by type (columns are plain HTML so the labels stay readable at any width) */
function monthsHTML() {
  const rows = D.months.months;
  const max = Math.max(1, ...rows.map((r) => r[1] + r[2] + r[3]));
  const top = max <= 4 ? 4 : Math.ceil(max / 2) * 2;
  const lab = (ym) => { const [y, m] = ym.split("-"); return lang === "zh" ? `${y}.${m}` : `${MON[+m - 1]} ${y}`; };
  const cols = rows.map((r) => {
    const a = [r[1], r[2], r[3]];
    const segs = a.map((n, j) => n ? `<i class="s${j + 2}" style="height:${(n / top) * 100}%"></i>` : "").join("");
    const tip = L("mo_tip")(lab(r[0]), a);
    return `<div class="mc" tabindex="0" data-tip="${esc(tip)}" aria-label="${esc(tip)}" role="img">${segs}</div>`;
  }).join("");
  const xl = rows.map((r, i) => { const k = rows.length - 1 - i; return k % 3 ? "<span></span>" : `<span${k % 6 ? ' class="d3"' : ""}>${esc(lab(r[0]))}</span>`; }).join("");
  const keys = L("mo_types").map((t, j) => `<span class="s${j + 2}"><i></i>${esc(t)}</span>`).join("");
  return fig({ id: "fig-months", h: "h3", title: L("mo_title"), sub: esc(L("mo_note")(D.chain_count, lab(rows[0][0]), lab(rows[rows.length - 1][0]))), csv: "chart-milestones-month.csv", src: SRC_CHAINS,
    body: `<div class="mchart"><div class="yax" aria-hidden="true"><span>${top}</span><span>${top / 2}</span><span>0</span></div><div class="mplot"><div class="mbars">${cols}</div><div class="mx" aria-hidden="true">${xl}</div></div></div>
    <div class="keys">${keys}</div><p class="fine-note" style="margin-top:var(--sp-3)">${esc(L("mo_fine"))}</p>` });
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
/* layer 2: one card per group, with its largest chains; "show all" filters the table */
function groupsHTML() {
  const cards = GROUPS.slice(1).map((g) => {
    const cs = D.chains.filter((c) => inGroup(c, g)).sort(defaultOrder);
    const by = [0, 1, 2, 3, 4, 5].map((s) => [s, cs.filter((c) => c.stage === s).length]).filter(([, n]) => n);
    const shown = cs.slice(0, 4);
    return `<div class="card gcard${state.group === g ? " on" : ""}" data-g="${g}">
      <h3 class="gname">${term(esc(L("g_" + g)), DF["g_" + g], L("g_" + g))}</h3><span class="gnum">${cs.length}</span>
      <span class="mini" aria-hidden="true">${by.map(([s, n]) => `<i class="s${s}" style="--n:${n}"></i>`).join("")}</span><span class="gmix">${esc(L("grp_mix")(by))}</span>
      <div class="gtop">${shown.map((c) => `<a href="${chainURL(c.id)}"><b class="gs s${c.stage}" aria-label="${esc(stageTitle(c.stage))}">${c.stage}</b>${esc(name(c))}</a>`).join("")}${cs.length > shown.length ? `<span class="more-n">${esc(L("grp_more")(cs.length - shown.length))}</span>` : ""}</div>
      <button type="button" class="btn gcta" data-g="${g}">${esc(L("grp_cta")(cs.length))} <span aria-hidden="true">→</span></button></div>`;
  }).join("");
  return `<section id="groups" class="layer" aria-labelledby="groups-h">${secH("groups", "", L("grp_h"), esc(L("grp_note")))}<div class="groups">${cards}</div></section>`;
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
        <div class="row"><button type="button" class="btn" id="copy-cite">${esc(L("copy"))}</button><a href="${href("method/")}#cite">${esc(L("foot_cite_link"))} <span aria-hidden="true">→</span></a></div></div>
    </div></section>`;
}
function contactHTML() {
  const urls = [URL_TALK, URL_FIX, URL_SUBMIT, URL_X];
  return `<section id="contact" class="layer" aria-labelledby="contact-h">${secH("contact", L("nav_contact"), L("ct_h"), `${esc(L("ct_lede"))} <b>${esc(L("ct_reply"))}</b>`)}
    <div class="contacts">${L("ct").map(([h, sub], i) => `<a class="card ct" href="${urls[i]}" target="_blank" rel="noopener"><b>${esc(h)} <span aria-hidden="true">↗</span></b><span>${esc(sub)}</span></a>`).join("")}</div></section>`;
}
function renderTable(write) {
  const t = tableBody();
  document.getElementById("tbody").innerHTML = t.html;
  document.getElementById("count").textContent = t.count;
  const more = document.getElementById("showall"); more.hidden = !t.hidden; more.firstElementChild.textContent = L("show_all")(t.hidden + FIRST);
  document.getElementById("active").innerHTML = activeHTML();
  document.querySelectorAll(".fbtn[data-k]").forEach((b) => {
    const k = b.dataset.k, v = k === "stage" ? (b.dataset.v === "" ? null : +b.dataset.v) : b.dataset.v;
    const n = countWith(k, v), on = state[k] === v;
    b.querySelector(".n").textContent = n;
    b.setAttribute("aria-pressed", String(on));
    b.disabled = !on && n === 0;
  });
  document.querySelectorAll(".stack button").forEach((b) => b.setAttribute("aria-pressed", String(state.stage === +b.dataset.stage && state.group === "top")));
  document.querySelectorAll(".gcard").forEach((c) => c.classList.toggle("on", state.group === c.dataset.g));
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
}
/* show "More" only where the two-line clamp actually hides text */
function clampCheck() {
  document.querySelectorAll(".latest").forEach((l) => { const x = l.querySelector(".x"), b = l.querySelector(".more"); if (b) b.hidden = !(x.scrollHeight > x.clientHeight + 2 || l.classList.contains("open")); });
}
function renderHome() {
  chrome("home");
  const fromHash = !PRE && readHash();
  const top = D.chains.filter((c) => c.rank != null);
  const usable = top.filter((c) => c.stage >= 4).sort((a, b) => a.rank - b.rank);
  const t3 = top.filter((c) => c.stage === 3).sort((a, b) => a.rank - b.rank).map(name);
  const native = D.chains.filter((c) => c.group === "native").length;
  const opts = SORTS.map((k) => `<option value="${k}" ${state.sort === k ? "selected" : ""}>${esc(L("sort_" + k))}</option>`).join("");
  const th = (k, sortKeyName, cls) => sortKeyName
    ? `<th scope="col" class="${cls}"><button type="button" data-sort="${sortKeyName}">${esc(L(k))}<span class="ar" aria-hidden="true">↓</span></button>${info(DF[k], L(k))}</th>`
    : `<th scope="col" class="${cls}">${term(esc(L(k)), DF[k], L(k))}</th>`;
  const tb = tableBody();
  const kpi = (v, l, cls) => `<div class="card kpi${cls ? " " + cls : ""}"><span class="v">${v}</span><span class="l">${esc(l)}</span></div>`;
  const verdict = L("verdict")(usable.length, top.length).replace(/<em>(.*?)<\/em>/, (m, t) => `<em>${term(t, DF.pqsig, t)}</em>`);
  put("app", `<div class="page">
    <section id="overview" class="layer" aria-label="${esc(L("nav_overview"))}">
      <div class="hero"><span class="eyebrow">${esc(L("eyebrow")(fmtDate(D.checked)))}</span><h1>${verdict}</h1><p>${esc(L("verdict_sub")(list(usable.map(name)), list(t3)))}</p></div>
      <div class="kpis">
        ${kpi(`${usable.length}<small>/${top.length}</small>`, L("kpi_top"), "lead")}${kpi(String(native), L("kpi_native"))}${kpi(String(D.chains.length), L("kpi_all"))}${kpi(`<span class="date">${esc(fmtDate(D.checked))}</span>`, L("kpi_date"))}
      </div>
      <div class="duo">${stackHTML(top)}${cumHTML()}</div>
    </section>
    ${groupsHTML()}
    <section id="chains" class="layer" aria-labelledby="chains-h">
      ${secH("chains", L("nav_chains"), L("list_h")(D.chains.length), "")}
      <div class="toolbar">
        <label class="search">${ICON_SEARCH}<span class="sr">${esc(L("search"))}</span><input id="q" type="search" autocomplete="off" placeholder="${esc(L("search"))}" value="${esc(state.q)}"><kbd aria-hidden="true">/</kbd></label>
        <label class="sortl"><span class="sr">${esc(L("sort_label"))}</span><select id="sort">${opts}</select></label>
      </div>
      ${filtersHTML()}
      <div class="list-h"><div class="active-f" id="active">${activeHTML()}</div><span class="count" id="count" role="status">${esc(tb.count)}</span></div>
      ${keybarHTML()}
      <div class="tablebox"><table class="ledger">
        <thead><tr>${th("th_chain", "name", "c-chain")}${th("th_stage", "stage", "c-stage")}${th("th_algo", null, "c-algo")}${th("th_net", null, "c-net")}${th("th_since", "since", "c-since")}${th("th_latest", "latest", "c-latest")}<th scope="col" class="c-go"><span class="sr">${esc(L("th_open"))}</span></th></tr></thead>
        <tbody id="tbody">${tb.html}</tbody></table></div>
      <div class="showall" id="showall"${tb.hidden ? "" : " hidden"}><button type="button" class="btn">${esc(L("show_all")(tb.hidden + FIRST))}</button></div>
    </section>
    <section id="timeline" class="layer" aria-labelledby="timeline-h">
      ${secH("timeline", L("nav_timeline"), L("tl_h"), "")}
      ${sinceHTML()}
      ${monthsHTML()}
      ${D.has_changes ? `<a class="btn more-link" href="${href("changes/")}">${esc(L("tl_changes"))} <span aria-hidden="true">→</span></a>` : ""}
    </section>
    ${howShort()}
    ${dataHTML()}
    ${contactHTML()}</div>`);
  if (PRE) return;
  syncSort(); clampCheck();
  const app = document.getElementById("app");
  const q = document.getElementById("q"), sort = document.getElementById("sort");
  const smooth = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  const toTable = () => document.getElementById("chains").scrollIntoView({ behavior: smooth(), block: "start" });
  const reset = (keep) => { Object.assign(state, DEFAULT, { sort: state.sort }, keep || {}); q.value = state.q; };
  q.addEventListener("input", () => { state.q = q.value; renderTable(true); });
  sort.addEventListener("change", () => { state.sort = sort.value; renderTable(true); });
  app.addEventListener("click", (e) => {
    const f = e.target.closest(".fbtn[data-k]");
    if (f) { const k = f.dataset.k, v = k === "stage" ? (f.dataset.v === "" ? null : +f.dataset.v) : f.dataset.v; state[k] = state[k] === v ? DEFAULT[k] : v; renderTable(true); return; }
    const u = e.target.closest("[data-unset]");
    if (u) { state[u.dataset.unset] = DEFAULT[u.dataset.unset]; if (u.dataset.unset === "q") q.value = ""; renderTable(true); q.focus(); return; }
    if (e.target.closest("[data-clear]")) { reset(); renderTable(true); q.focus(); return; }
    const g = e.target.closest(".gcta");
    if (g) { reset({ group: g.dataset.g }); renderTable(true); toTable(); return; }
    const s = e.target.closest(".stack button, .legend6 button");
    if (s) { const v = +s.dataset.stage; const on = state.stage === v && state.group === "top"; reset(on ? {} : { group: "top", stage: v }); renderTable(true); if (!on) toTable(); return; }
    const a = e.target.closest(".anchor");
    if (a) { const id = a.dataset.anchor, qs = id === "chains" ? stateQS() : ""; const hash = "#" + id + (qs ? "?" + qs : ""); history.replaceState(null, "", hash); TIP.copy(a, location.origin + location.pathname + hash, L("link_copied")); return; }
    if (e.target.closest("#showall button")) { expanded = true; const n = document.querySelectorAll(".ledger tr.row").length; renderTable(false); const r = document.querySelectorAll(".ledger tr.row")[Math.min(FIRST, n - 1)]; if (r) r.querySelector("a").focus(); return; }
    const sb = e.target.closest(".ledger th button");
    if (sb) { const k = sb.dataset.sort; state.sort = k === "stage" ? (state.sort === "stage_d" ? "stage_a" : "stage_d") : (state.sort === k ? "default" : k); sort.value = state.sort; renderTable(true); }
  });
  document.getElementById("tbody").addEventListener("click", (e) => {
    const more = e.target.closest(".more");
    if (more) { const l = more.closest(".latest"); const open = l.classList.toggle("open"); more.textContent = L(open ? "less" : "more"); more.setAttribute("aria-expanded", String(open)); return; }
    if (e.target.closest("a, button, .term")) return;
    const tr = e.target.closest("tr.row");
    if (tr && !window.getSelection().toString()) location.href = chainURL(tr.dataset.id);
  });
  const copy = document.getElementById("copy-cite");
  copy.addEventListener("click", () => TIP.copy(copy, document.getElementById("cite-text").textContent, L("copied"), document.getElementById("cite-text")));
  /* "/" jumps to the search box */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]"))) return;
    e.preventDefault(); q.focus(); q.select();
  });
  window.addEventListener("hashchange", () => { if (readHash()) { q.value = state.q; sort.value = state.sort; renderTable(false); toTable(); } });
  /* the header link for the section in view is marked; the language switch keeps the section and the filters */
  const links = document.querySelectorAll("a[data-sec]");
  const secs = ["overview", "groups", "chains", "timeline", "how", "data", "contact"].map((id) => document.getElementById(id));
  let spy = 0, cur = "overview";
  const mark = () => {
    spy = 0;
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    let el = atEnd ? secs[secs.length - 1] : secs[0];
    if (!atEnd) for (const s of secs) if (s.getBoundingClientRect().top < window.innerHeight * 0.35) el = s;
    cur = el.id;
    const id = cur === "groups" ? "overview" : cur;
    links.forEach((a) => { if (a.dataset.sec === id) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
  };
  window.addEventListener("scroll", () => { if (!spy) spy = requestAnimationFrame(mark); }, { passive: true });
  mark();
  TIP.pos = () => { const qs = stateQS(); return qs ? "#chains?" + qs : (cur !== "overview" && window.scrollY > 40 ? "#" + cur : location.hash); };
  if (fromHash) { renderTable(false); document.getElementById("chains").scrollIntoView(); mark(); }
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(clampCheck, 150); });
  if (document.fonts) document.fonts.ready.then(clampCheck);
}

/* ---------- chain page ---------- */
/* the independent explorer read when the chain's own endpoint shows an old block; one source alone never says "stopped" */
function xchkHTML(c) {
  const x = c.net.check;
  if (x) return `<br><span class="note-small">${esc(x.ok ? L("xchk_ok")(x.h.toLocaleString("en-US"), x.age) : L("xchk_no"))} <a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(host(x.url))} ↗</a></span>`;
  return c.net.status === "unknown" && c.net.block.ok ? `<br><span class="note-small">${esc(L("xchk_none"))}</span>` : "";
}
function blockHTML(c) {
  const b = c.net.block;
  if (b.ok) return `<span class="mono">#${b.h.toLocaleString("en-US")}</span> · ${esc(b.t.replace("T", " ").replace("Z", " UTC"))}<br>${esc(L("blocks_ago")(b.age))}<br><span class="note-small">${esc(L("threshold")(c.net.threshold))}</span><br><a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(host(b.url))} ↗</a>${c.net.own ? `<br><span class="note-small">${esc(L("own_src")[c.net.own])}</span>` : ""}${xchkHTML(c)}`;
  if (!b.url) return `${esc(L("no_probe"))}${c.net.reason ? `<br><span class="note-small">${esc(T(c.net.reason))}</span>` : ""}`;
  return `${esc(L("no_block"))}<span class="note-small">${b.q ? PAR(L("queried") + " " + esc(b.q.slice(0, 16).replace("T", " ")) + " UTC") : ""}</span><br><a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(host(b.url))} ↗</a>`;
}
function codeHTML(code) {
  const rel = code.rel ? `${esc(code.rel)}${code.rel_pre ? esc(L("pre")) : ""}${code.rel_tag ? esc(L("tag_only")) : ""} · ${esc(fmtDate(code.rel_date))}` : esc(T(code.note) || "—");
  const also = (code.also || []).filter((a) => a.c90 != null).map((a) => `${esc(L("also"))}${CO()}github.com/${esc(a.repo)} · ${esc(L("commits")(a.c90))}`).join("<br>");
  return `${esc(L("e_release"))}${CO()}${rel}<br>${code.c90 == null ? "" : esc(L("commits")(code.c90)) + (code.rel && T(code.note) ? PAR(esc(T(code.note))) : "") + "<br>"}${also ? also + "<br>" : ""}${code.repo ? `<a href="https://github.com/${esc(code.repo)}" target="_blank" rel="noopener">github.com/${esc(code.repo)} ↗</a>` : ""}`;
}
function tlItem(m) {
  const grade = m.grade || "primary", ts = TYPE_STAGE[m.type] ?? 0;
  return `<li class="tl s${ts}"><span class="when">${m.checked ? `<small>${esc(L("checked_tag"))}</small>` : ""}${esc(fmtDate(m.date))}</span><span class="pin" aria-hidden="true"></span>
    <div class="body"><div class="tags">${term(`<span class="ttag s${ts}">${esc(L("types")[m.type])}</span>`, DF.types[m.type], L("types")[m.type], "plain")}${term(`<span class="grade ${grade}">${esc(L("grades")[grade])}</span>`, DF.grades[grade], L("grades")[grade])}</div>
    <div class="txt">${esc(T(m))}</div>${m.status ? `<div class="st">${esc(L("status"))}${CO()}${esc(T(m.status))}</div>` : ""}
    ${m.url ? `<div class="src">${esc(L("source"))}${CO()}<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(host(m.url))} ↗</a></div>` : ""}</div></li>`;
}
function scale6(s) {
  return `<div class="scale6" role="img" aria-label="${esc(stageTitle(s))}">${[0, 1, 2, 3, 4, 5].map((i) =>
    `<div class="lv s${i}${i <= s ? " on" : ""}${i === s ? " cur" : ""}"><span class="blk"></span><span><span class="n">${i}</span> <span class="nm">${esc(stageName(i))}</span></span></div>`).join("")}</div>`;
}
function sinceLine(c) {
  if (c.stage < 4) return "";
  if (!c.since) return `<p class="since-line na">${esc(L("since_missing"))}</p>`;
  const sv = c.since;
  return `<p class="since-line"><span class="k">${term(esc(L("d_since")), DF.th_since)}</span><b class="mono">${esc(fmtDate(sv.date))}</b><span class="ev">${esc(T(sv.event))}</span>
    <span class="src">${esc(sv.grade === "official" ? L("since_own") : L("source"))}${CO()}<a href="${esc(sv.source_url)}" target="_blank" rel="noopener">${esc(host(sv.source_url))} ↗</a></span></p>`;
}
function renderChain() {
  const c = D.chains[0];
  chrome("home");
  const tl = [...c.timeline].sort((a, b) => sortKey(a.date).localeCompare(sortKey(b.date)));
  const four = c.four || { today: c.holder, watch: c.note };
  const boxes = [["today", "d_today"], ["watch", "d_watch"], ["can", "d_can"], ["next", "d_next"]].filter(([k]) => T(four[k])).map(([k, l]) => `<div class="card"><h3>${esc(L(l))}</h3><p>${esc(T(four[k]))}</p></div>`).join("");
  const unv = c.unverified && c.unverified.length ? `<section class="unv"><h3>${esc(L("d_unv"))}</h3><span class="note-small">${esc(L("d_unv_note"))}</span>${c.unverified.map((u) => `<div class="it"><span>${esc(T(u.claim))}</span><span class="why">${esc(T(u.reason))}</span><a href="${esc(u.url)}" target="_blank" rel="noopener" style="font-size:13px">${esc(L("lead"))}${CO()}${esc(host(u.url))} ↗</a></div>`).join("")}</section>` : "";
  const used = [...new Set(tl.map((m) => m.type))];
  const legend = used.map((t) => `<span class="s${TYPE_STAGE[t] ?? 0}"><i></i>${esc(L("types")[t])}</span>`).join("");
  const timeline = tl.length ? `<section><div class="section-h"><h2>${esc(L("d_timeline"))}</h2><div class="legend">${legend}</div></div><ol class="timeline">${tl.map(tlItem).join("")}</ol></section>`
    : `<section><div class="section-h"><h2>${esc(L("d_timeline"))}</h2></div><p style="color:var(--ink-2);margin:0">${esc(L("d_no_tl"))}</p></section>`;
  const srcs = c.sources || [];
  const srcList = srcs.length ? `<section><h2 style="font-size:19px;margin-bottom:10px">${esc(L("e_src"))}</h2><ul class="src">${srcs.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label || host(s.url))}</a>${s.kind ? ` <span style="color:var(--ink-3)">· ${esc(T(s.kind))}</span>` : ""}</li>`).join("")}</ul></section>` : "";
  const meta = [`<span class="mono">${esc(c.ticker)}</span>`, c.rank ? `<span>${esc(L("rank")(c.rank))}</span>` : "", `<span>${kindTerm(c)}</span>`,
    `<span>${term(esc(L("d_checked")), DF.th_checked)} <span class="mono">${esc(fmtDate(c.checked) || "—")}</span></span>`].filter(Boolean).join('<span aria-hidden="true">·</span>');
  put("app", `<div class="page">
    <div class="crumb"><a href="${href("")}">← ${esc(L("d_back"))}</a></div>
    <header class="dhead"><h1>${esc(name(c))}${lang === "zh" && c.zh_name ? ` <span class="alt">${esc(c.name)}</span>` : ""}</h1><div class="meta">${meta}</div></header>
    <section class="card scalebox6" aria-label="${esc(L("d_scale"))}"><div class="cap">${badgeTerm(c.stage)}<span>${esc(L("d_scale"))}</span></div>${scale6(c.stage)}${sinceLine(c)}</section>
    <section class="card answer s${c.stage}"><span class="eyebrow">${esc(L("q")(name(c)))}</span>
      <p class="claim">${esc(L("answer")(c.reviewed, name(c), c.stage, stageName(c.stage)))}</p>
      <p class="basis">${esc(T(c.basis))}</p>
      ${c.basis_src ? `<span class="cite-src">${esc(L("answer_src")(c.stage))}${CO()}<a href="${esc(c.basis_src)}" target="_blank" rel="noopener">${esc(host(c.basis_src))} ↗</a></span>` : ""}</section>
    ${c.stale_days > 90 ? `<p class="stale" role="note">${esc(L("stale")(c.reviewed, c.stale_days))}</p>` : ""}
    <div class="dgrid"><div style="display:grid;gap:32px;min-width:0">
      <section class="four">${boxes}</section>
      ${timeline}
      ${unv}
      ${srcList}
      <section class="card fix"><p>${esc(L("d_fix"))}</p><a class="btn primary" href="${fixURL(c)}" target="_blank" rel="noopener">${esc(L("d_fix_btn"))} ↗</a></section>
    </div>
    <aside class="side"><section class="card panel"><h3>${esc(L("d_facts"))}</h3>
      <div class="kv"><span class="k">${term(esc(L("d_stage")), DF.th_stage)}</span><span class="v">${stageCell(c.stage, true)}</span></div>
      <div class="kv"><span class="k">${term(esc(L("d_algo")), DF.th_algo)}</span><span class="v">${esc(T(c.algo))}</span>${chips(c.chips)}</div>
      <div class="kv"><span class="k">${term(esc(L("d_net")), DF.th_net)}</span><span class="v"><span class="dot ${c.net.status}" style="margin-right:7px"></span>${statusTerm(c.net.status)}<br>${blockHTML(c)}</span></div>
      ${c.net.code ? `<div class="kv"><span class="k">${esc(L("e_code"))}</span><span class="v">${codeHTML(c.net.code)}</span></div>` : ""}
      ${c.stage >= 4 ? `<div class="kv"><span class="k">${term(esc(L("th_since")), DF.th_since)}</span><span class="v">${c.since ? `<span class="mono">${esc(fmtDate(c.since.date))}</span> · ${esc(L("since_basis")[c.since.basis])}` : esc(L("since_na"))}</span></div>` : ""}
      ${c.consensus ? `<div class="kv"><span class="k">${esc(L("e_consensus"))}</span><span class="v">${esc(T(c.consensus))}</span></div>` : ""}
      <div class="kv"><span class="k">${term(esc(L("e_reviewed")), DF.reviewed)}</span><span class="v mono">${esc(c.reviewed)}</span></div>
      <a class="btn" href="${D.data_url}" target="_blank" rel="noopener">${esc(L("gh"))} ↗</a>
    </section></aside></div></div>`);
}

/* ---------- this week ---------- */
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
  put("app", `<div class="page">
    <section class="issue"><span class="eyebrow">${esc(L("c_eyebrow"))} · ${esc(range)}</span><h1>${esc(L("c_title")(C.items.length, changed))}</h1><p>${esc(L("c_sub"))}</p></section>
    <div class="stat"><div class="card"><b>${changed}</b><span>${esc(L("c_s1"))}</span></div><div class="card"><b>${C.items.length}</b><span>${esc(L("c_s2"))}</span></div><div class="card"><b>${D.chain_count}</b><span>${esc(L("c_s3"))}</span></div></div>
    <ol class="clist">${items}</ol>
    ${older.length ? `<section class="watch"><h2 style="font-size:19px">${esc(L("c_older"))}</h2><ul>${older.map((o) => `<li>${esc(fmtDate(o.range.from))} – ${esc(fmtDate(o.range.to))} · ${esc(L("c_title")(o.items.length, o.items.filter((i) => i.stage && i.stage[0] !== i.stage[1]).length))}</li>`).join("")}</ul></section>` : ""}
    <section class="card fix" style="max-width:860px"><p>${esc(L("foot_fix"))}</p><a class="btn primary" href="${URL_FIX}" target="_blank" rel="noopener">${esc(L("foot_btn_fix"))} ↗</a></section>
  </div>`);
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
    groups_h: "The groups", groups_cols: ["Group", "Who is in it"],
    net_h: "Network status", net_cols: ["Status", "When we show it"],
    net_rule: "Where blocks come from: each chain's row names the explorer or public RPC we read, and every chain page shows the exact endpoint, the block height and time, and when we read it. The limit is 10 minutes, or six target block times when a chain's target is longer than 100 seconds (for example 60 minutes for Bitcoin's 10-minute blocks). At six target block times, a healthy chain misses the limit by chance about once in 400 checks. Public RPCs can answer from a lagging node, so we read every endpoint two or three times and keep the highest block. A chain is marked stopped only when an independent explorer also shows an old block; with one source, it is marked could not check. Commits are counted on the default branch of the main node repository over the 90 days before the check.",
    algo_h: "Algorithm labels", algo_cols: ["Label", "What it means"],
    grades_h: "Where evidence comes from",
    cite_rule: "The opening sentence on each chain page links one source. A chain with an entry in the project list (projects.json) links its pinned code or another pinned primary source. Other chains link the primary source (or, if there is none, the official claim) that supports the stage and best matches the stated reason. Node endpoints are not linked there because the network panel shows them. Every source is listed further down the page.",
    grades: [["Primary source · can set the stage", "primary"], ["Official claim · recorded as a plan", "official"], ["Lead · marked unverified", "unverified"]],
    charts_h: "How the charts are made",
    charts: [
      "Every chart on the home page is drawn from the same data as the table, when the site is built. Nothing in them is typed by hand.",
      "Stages by the largest blockchains: the coins in the CoinGecko top 100 that have their own network, counted by stage.",
      "Post-quantum mainnet launches over time: a running total of the chains at stage 4 or 5 that have a sourced date (see the next item), one dot per chain on that day, coloured by stage. The vertical axis counts chains; the horizontal axis runs from the start of the first year with a dated chain to the check date.",
      "Milestones per month: dated proposal, testnet and mainnet milestones from primary sources and official claims, over the last 24 months. Entries that record our own checks (marked \"checked\" on the chain pages) are left out, as are entries dated only to a quarter.",
      "Post-quantum signatures on mainnet, by year: every chain at stage 4 or 5, placed by the day post-quantum signatures became usable on its current mainnet. For a post-quantum native chain that is the genesis block of the current mainnet; for the others, the day the upgrade or account type went live. Each date carries its own source, shown on the chain's page; chains without a sourced date are listed apart, not guessed.",
    ],
    dims_h: "What we collect", dims_cols: ["Field", "Where it comes from", "How often", "Script"],
    dims: [
      ["Stage, milestones, summary", "Official proposal repositories, client releases, chain parameters from official endpoints; websites count only as plans", "Watched proposals weekly; every row re-checked monthly; a person changes the stage", ["scripts/patrol.py", "data/chains.json"]],
      ["Algorithm and standard label", "NIST FIPS 204 and 205, NIST's FN-DSA selection, IETF RFC 8391, and the chain's own specification", "Monthly", ["data/chains.json"]],
      ["Latest block: height, time, age", "The explorer or public RPC listed for each chain", "Weekly", ["scripts/patrol.py"]],
      ["Latest release", "GitHub releases of the main node repository (its newest tag if there are no releases)", "Weekly", ["scripts/patrol.py"]],
      ["Commits in 90 days, last commit", "GitHub commits on the default branch of the main node repository", "Weekly", ["scripts/patrol.py"]],
      ["Post-quantum on mainnet since", "Genesis block or activation record: block explorer, pinned code or release notes; the project's own announcement only when nothing more direct exists, and marked as such", "Set once; re-checked with the row monthly", ["data/chains.json"]],
      ["Market-cap rank", "CoinGecko, top 100 by market cap", "Monthly", ["scripts/rank.py"]],
      ["This week's changes", "What differs from the previous patrol, reviewed by a person", "Weekly", ["scripts/patrol.py"]],
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
      "Not investment advice. We do not comment on prices or predict when quantum computers might break today's cryptography.",
      "A snapshot, not a live feed: every entry shows the date its claims were last checked, and an entry not reviewed for 90 days is flagged on its page.",
      "All data and every script are public on GitHub, so anyone can re-run the checks."],
    cite_h: "How to cite",
    cite: (v, d, url) => `Balance Zhao. Post-Quantum Blockchains, version ${v} (${d}). ${url}. Data licensed CC BY 4.0.`,
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
    groups_h: "分组", groups_cols: ["分组", "收录哪些链"],
    net_h: "网络状态", net_cols: ["状态", "什么情况下显示"],
    net_rule: "出块数据从哪来：每条链都写明读取的区块浏览器或公开 RPC，详情页列出具体接口、区块高度和时间，以及读取时间。时限是 10 分钟；目标出块间隔超过 100 秒的链，按 6 倍目标出块间隔算（比如比特币 10 分钟一个块，时限就是 60 分钟）。取 6 倍时，一条正常出块的链大约每 400 次核查才会偶然超时一次。公开 RPC 可能由落后的节点应答，所以每个接口都读两到三次，取最高的区块。只有独立的区块浏览器也显示区块过旧，才判定「出块停了」；只有一个来源时，记为「无法核实」。提交次数按主节点代码库的默认分支、核查日之前 90 天统计。",
    algo_h: "算法标签", algo_cols: ["标签", "含义"],
    grades_h: "证据来源",
    cite_rule: "每条链详情页开头那句结论附一个出处。在项目清单（projects.json）里有条目的链，附固定版本的代码或其他固定版本的原始出处。其他链附能支持该档位、且与所写依据最贴合的原始出处，没有原始出处时才用官方说法。节点接口不放在这里，因为网络状态栏已经列出。全部来源列在页面下方。",
    grades: [["原始出处 · 可作定档依据", "primary"], ["官方说法 · 记为计划", "official"], ["线索 · 标为未核实", "unverified"]],
    charts_h: "图表怎么画的",
    charts: [
      "首页的每张图和表格用同一份数据，在构建网站时生成，没有手写的数字。",
      "市值最大的区块链档位分布：CoinGecko 市值前 100 中有自己网络的币，按档位计数。",
      "抗量子主网上线时间线：第 4、5 档中有带出处日期的链（见下一条）按日期累计，每条链一个点，颜色表示档位。纵轴是链的条数，横轴从第一条链所在年份的年初到核对日。",
      "每月里程碑：最近 24 个月里，原始出处和官方说法中带日期的提案、测试网和主网进展。标为「核对于」的条目是本站自己的核查记录，不计入；只精确到季度的条目也不计入。",
      "抗量子签名上主网的年份：第 4、5 档的每条链，按抗量子签名在其现行主网上可用的日期排列。原生抗量子链取现行主网的创世区块，其他链取升级或新账户类型上线当天。每个日期都有自己的出处，见链的详情页；找不到出处的链单独列出，不做推测。",
    ],
    dims_h: "我们收集哪些数据", dims_cols: ["字段", "来源", "更新频率", "脚本"],
    dims: [
      ["档位、里程碑、摘要", "官方提案库、客户端发布版本、从官方接口读取的链上参数；官网只记为计划", "跟踪的提案每周查；每行每月重核；档位由人修改", ["scripts/patrol.py", "data/chains.json"]],
      ["算法与标准标签", "NIST FIPS 204 和 205、NIST 对 FN-DSA 的选定、IETF RFC 8391，以及链自己的规范", "每月", ["data/chains.json"]],
      ["最新区块：高度、时间、距今多久", "每条链写明的区块浏览器或公开 RPC", "每周", ["scripts/patrol.py"]],
      ["最新发布版本", "主节点代码库的 GitHub 发布记录（没有发布记录时取最新标签）", "每周", ["scripts/patrol.py"]],
      ["90 天内提交次数、最后一次提交", "主节点代码库默认分支在 GitHub 上的提交记录", "每周", ["scripts/patrol.py"]],
      ["抗量子主网起始日期", "创世区块或升级生效记录：区块浏览器、固定版本的代码或发布说明；找不到更直接的记录时才用项目方公告，并注明是项目方说法", "录入一次；每月随整行重核", ["data/chains.json"]],
      ["市值排名", "CoinGecko 市值前 100", "每月", ["scripts/rank.py"]],
      ["本周变化", "与上一次巡查相比的差异，经人工核对", "每周", ["scripts/patrol.py"]],
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
      "不构成投资建议。我们不评论币价，也不预测量子计算机何时能破解现有密码。",
      "这是某一时点的快照，不是实时数据：每条都标明说法最近核对的日期，超过 90 天没有复核的会在页面上提示。",
      "所有数据和脚本都公开在 GitHub 上，谁都可以重新跑一遍核查。"],
    cite_h: "如何引用",
    cite: (v, d, url) => `Balance Zhao. Post-Quantum Blockchains, version ${v} (${d}). ${url}. Data licensed CC BY 4.0.`,
    cite_p: "引用某一条链时，请写它的页面网址和页面顶部标明的最近核对日期。每次数据变更都会升版本号，并记录在更新记录里。",
    cite_files: "下载数据（JSON）：", cite_meta: "引用元数据：",
  },
};
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
  const toc = [["stages", "scale_h"], ["rules", "rules_h"], ["groups", "groups_h"], ["network", "net_h"], ["algorithms", "algo_h"], ["evidence", "grades_h"], ["charts", "charts_h"], ["data", "dims_h"], ["coverage", "who_h"], ["updates", "cad_h"], ["limits", "open_h"], ["cite", "cite_h"]];
  const cite = `${H("cite", "cite_h")}<p><code class="cite">${esc(M.cite(D.release.version, D.release.date, D.site_url))}</code></p><p>${esc(M.cite_p)}</p>
    <p>${esc(M.cite_files)} ${["chains.json", "network.json", "projects.json", "sources.json"].map((f) => `<a href="${raw(f)}" target="_blank" rel="noopener" class="mono">${f}</a>`).join(" · ")}</p>
    <p>${esc(M.cite_meta)} <a href="${blob("CITATION.cff")}" target="_blank" rel="noopener" class="mono">CITATION.cff</a> · <a href="${blob("CHANGELOG.md")}" target="_blank" rel="noopener" class="mono">CHANGELOG.md</a></p>`;
  const groups = ["top", "optin", "native", "early"].map((g) => `<tr><td>${esc(L("g_" + g))}</td><td>${esc(DF["g_" + g])}</td></tr>`).join("");
  const net = ["ok", "quiet", "stalled", "unknown"].map((s) => `<tr><td><span class="dot ${s}" style="margin-right:7px"></span>${esc(L("st_" + s))}</td><td>${esc(DF["st_" + s])}</td></tr>`).join("");
  const algo = Object.keys(D.chips).map((k) => `<tr><td><span class="chip ${D.chips[k].tone}">${esc(T(D.chips[k]))}</span></td><td>${esc(DF.chips[k])}</td></tr>`).join("");
  const grades = `<div class="grades">${M.grades.map(([h, g], i) => `<div class="card"><span class="grade ${g} grade-ic" aria-hidden="true">${["●", "◐", "○"][i]}</span><b>${esc(h)}</b><p>${esc(DF.grades[g])}</p></div>`).join("")}</div>`;
  const dims = M.dims.map(([f, src, how, scripts]) => `<tr><td>${esc(f)}</td><td>${esc(src)}</td><td>${esc(how)}</td><td>${scripts.map((p) => `<a href="${blob(p)}" target="_blank" rel="noopener" class="mono">${esc(p)}</a>`).join("<br>")}</td></tr>`).join("");
  return `<section class="how" id="how"><article class="prose">
    <span class="eyebrow">${esc(L("nav_method"))}</span><h1>${esc(M.title)}</h1>
    <p class="lede">${esc(M.lede)}</p>
    <nav class="toc" aria-label="${esc(L("toc"))}">${toc.map(([id, k]) => `<a href="#${id}">${esc(M[k])}</a>`).join("")}</nav>
    ${H("stages", "scale_h")}${table(M.cols, stages)}
    ${H("rules", "rules_h")}${ul(M.rules)}
    ${H("groups", "groups_h")}${table(M.groups_cols, groups)}
    ${H("network", "net_h")}${table(M.net_cols, net)}<p>${esc(M.net_rule)}</p>
    ${H("algorithms", "algo_h")}${table(M.algo_cols, algo)}
    ${H("evidence", "grades_h")}${grades}<p>${esc(M.cite_rule)}</p>
    ${H("charts", "charts_h")}${ul(M.charts)}
    ${H("data", "dims_h")}${table(M.dims_cols, dims, "dims")}
    ${H("coverage", "who_h")}${ul(M.who)}
    ${D.left_out && D.left_out.length ? `<details class="left"><summary>${esc(M.left_h(D.left_out.length))}</summary>${table(M.left_cols, D.left_out.map((x) => `<tr><td class="mono">#${x.rank}</td><td>${esc(x.name)} <span class="mono" style="color:var(--ink-3)">${esc(x.symbol)}</span></td><td>${esc(T(x.reason))}${x.note ? PAR(esc(T(x.note))) : ""}</td></tr>`).join(""))}</details>` : ""}
    ${H("updates", "cad_h")}${ul(M.cad)}
    ${H("limits", "open_h")}${ul(M.open)}
    ${cite}
    <p>${esc(M.rules_link)} <a href="${blob("docs/stages.md")}" target="_blank" rel="noopener" class="mono">docs/stages.md</a></p>
  </article></section>`;
}
function renderMethod() {
  chrome("method");
  put("app", `<div class="page">${howHTML()}
    <section class="card fix" style="max-width:820px"><p>${esc(L("foot_fix"))}</p><a class="btn primary" href="${URL_FIX}" target="_blank" rel="noopener">${esc(L("foot_btn_fix"))} ↗</a></section></div>`);
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
function showPop(el, tapped) {
  const def = el.dataset.def || (el.dataset.ref && refDef(el.dataset.ref));
  if (def) pop.innerHTML = (el.dataset.title ? `<b>${esc(el.dataset.title)}</b>` : "") + esc(def);
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
({ home: renderHome, chain: renderChain, changes: renderChanges, method: renderMethod })[D.page]();
if (PRE) globalThis.OUT = OUT;
