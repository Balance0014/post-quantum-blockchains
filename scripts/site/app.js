/* Post-Quantum Blockchains · page script.
   Each page embeds its data as window.PQ (written by scripts/build_site.py). The page is already readable without
   this script; the script adds sorting, filtering, expandable rows and the definitions popover. */
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
const state = { group: "all", q: "", sort: "default", open: null };

const UI = {
  en: {
    nav_chains: "Chains", nav_changes: "This week", nav_method: "Method", gh: "Data on GitHub", other_lang: "中文", other_lang_label: "切换到中文",
    eyebrow: (d) => `Post-quantum protection · checked ${d}`,
    verdict: (k, n, names) => k === 0 ? `None of the ${n} largest blockchains with their own network lets holders use a post-quantum signature on mainnet today.`
      : `${k} of the ${n} largest blockchains with their own network ${k === 1 ? "lets" : "let"} holders use a post-quantum signature on mainnet today: ${names}.`,
    verdict_sub: (t3, o, g) => `${t3 ? `Furthest along among the rest: ${t3}, on a public testnet. ` : ""}${o} other chain${o === 1 ? "" : "s"} offer${o === 1 ? "s" : ""} an opt-in on mainnet, and ${g} chain${g === 1 ? "" : "s"} built post-quantum sign with post-quantum keys by default. Every rating links to its source.`,
    ov_title: "The largest blockchains, by stage", ov_note: (d) => `CoinGecko top 100 by market cap on ${d}, coins with their own network`,
    none: "None", and: " and ",
    search: "Search chains, schemes or tickers", f_all: "All", f_top: "Top 100", f_optin: "Mainnet opt-in", f_native: "Post-quantum native", f_early: "Early",
    sort_default: "Biggest chains first", sort_stage_d: "Protection: high to low", sort_stage_a: "Protection: low to high", sort_latest: "Latest change", sort_name: "Name",
    shown: (n, t) => `${n} of ${t} chains`,
    th_chain: "Chain", th_kind: "Type", th_stage: "Protection today", th_algo: "Algorithm and standard", th_net: "Network running?", th_latest: "Latest change", th_checked: "Checked",
    g_top: "The largest blockchains", g_top_s: "CoinGecko top 100 by market cap, coins with their own network. Most have no post-quantum option yet; that is worth knowing too.",
    g_optin: "Chains with a mainnet opt-in", g_optin_s: "Launched with classical keys; post-quantum accounts or locks are on mainnet if you choose them.",
    g_native: "Post-quantum native", g_native_s: "Every transfer on mainnet is signed with a post-quantum scheme by default. Check the algorithm and network columns too.",
    g_early: "Early projects", g_early_s: "No mainnet running yet.",
    k_upgrading: "Upgrading", k_native: "Native", k_early: "Native · testnet",
    rank: (r) => `#${r} by market cap`, fullpage: "Full page",
    blocks_ago: (m) => m < 1 ? "Block <1 min before check" : `Block ${Math.round(m)} min before check`,
    blocks_short: (m) => m < 1 ? "Blocks · <1 min" : `Blocks · ${Math.round(m)} min`,
    no_block: "Endpoint did not respond", no_probe: "No public block endpoint", commits: (n) => `${n} commit${n === 1 ? "" : "s"} in 90 days`, no_repo: "No public node repo found",
    threshold: (m) => `Counts as running while the newest block is under ${m} min old.`,
    queried: "queried",
    st_ok: "Running", st_quiet: "Blocks yes, code quiet", st_stalled: "Blocks stopped", st_unknown: "Could not check",
    checked_tag: "checked",
    e_holder: "What holders can use today", e_note: "Read this first", e_src: "Sources", e_unv: "Unverified, not counted", e_tl: "Milestones",
    e_open: "Open the full page", e_consensus: "Consensus", e_release: "Latest release", e_code: "Code activity", e_block: "Latest block", e_reviewed: "Claims last reviewed",
    pre: " (pre-release)", tag_only: " (tag only)", also: "Also",
    lead: "lead",
    stage_names: ["Nothing public", "Research", "Formal proposal", "Testnet", "Mainnet opt-in", "Default"],
    d_back: "All chains", d_today: "Protection today", d_watch: "Watch out for", d_can: "What you can do now", d_next: "What to watch next",
    d_timeline: "Timeline", d_facts: "At a glance", d_stage: "Stage", d_algo: "Algorithm", d_net: "Network", d_checked: "Checked", d_unv: "Claims we could not verify",
    d_unv_note: "These are left out of the stage until a primary source confirms them.", d_no_tl: "No dated milestones recorded yet. The sources below back the current entry.",
    d_fix: "See something wrong or out of date on this page? Report it with a primary source. We reply within 7 days, and every change is recorded in the public changelog.",
    d_fix_btn: "Report an error",
    answer: (date, nm, n, label) => `As of ${date}, ${nm} is at stage ${n} of 5: ${label}.`,
    answer_src: (stage) => (stage === 0 ? "Where we looked" : "Source"),
    why: (n) => `Why stage ${n}`,
    stale: (date, d) => `These claims were last checked on ${date}, ${d} days ago. They may be out of date until the next review.`,
    types: { research: "Research", proposal: "Proposal", code: "Code", testnet: "Testnet", mainnet: "Mainnet", wallet: "Wallet", thirdparty: "Third party", tracker: "Tracker", network: "Network" },
    grades: { primary: "Primary source", official: "Official claim · not rated", unverified: "Unverified" },
    source: "Source", undated: "Undated", status: "Status",
    c_eyebrow: "This week", c_range: "Covers", c_title: (n, s) => `${n} change${n === 1 ? "" : "s"} logged, ${s === 0 ? "no stage changes" : s + " stage change" + (s === 1 ? "" : "s")}.`,
    c_sub: "Found by the weekly patrol and reviewed by a person before publishing. A stage changes only when a primary source supports it.",
    c_s1: "stage changes", c_s2: "changes logged", c_s3: "chains checked", c_stage: "Stage", c_older: "Earlier issues",
    tracker: "Tracker",
    foot_fix: "The data lives on GitHub. Spot an error, or know a newer milestone? Open a correction with a primary source.",
    foot_btn_fix: "Report an error", foot_btn_submit: "Submit a project", foot_btn_repo: "Open the repository",
    foot_fine: "A tracker, not a forecast. It rates only what is already live, never predicts when today's cryptography might be broken, and says nothing about prices. Stages are never paid for. Data and scripts are public, so anyone can check them.",
    foot_cite: (v, d) => `Version ${v}, ${d}. Data CC BY 4.0, scripts MIT.`, foot_cite_link: "How to cite", foot_log: "Changelog",
    how_h: "How it's calculated",
  },
  zh: {
    nav_chains: "链列表", nav_changes: "本周变化", nav_method: "评档方法", gh: "数据在 GitHub", other_lang: "English", other_lang_label: "Switch to English",
    eyebrow: (d) => `抗量子保护 · 核对于 ${d}`,
    verdict: (k, n, names) => k === 0 ? `市值前 100 中有自己网络的 ${n} 条区块链，目前没有一条能让持币人在主网上使用抗量子签名。`
      : `市值前 100 中有自己网络的 ${n} 条区块链里，目前有 ${k} 条能让持币人在主网上使用抗量子签名：${names}。`,
    verdict_sub: (t3, o, g) => `${t3 ? `其余链中进展最快的是 ${t3}，目前仅在公开测试网上。` : ""}另有 ${o} 条链已在主网提供可选的抗量子保护，${g} 条原生抗量子链默认使用抗量子签名。每个档位都附有出处。`,
    ov_title: "市值前 100 区块链的档位分布", ov_note: (d) => `按 ${d} CoinGecko 市值排名前 100，只取有自己网络的币`,
    none: "暂无", and: "、",
    search: "搜索链名、算法或币种代码", f_all: "全部", f_top: "市值前 100", f_optin: "主网可选", f_native: "原生抗量子", f_early: "早期项目",
    sort_default: "大链在前", sort_stage_d: "保护程度从高到低", sort_stage_a: "保护程度从低到高", sort_latest: "最近变化", sort_name: "名称",
    shown: (n, t) => `显示 ${n} / ${t} 条`,
    th_chain: "链", th_kind: "类型", th_stage: "当前保护", th_algo: "算法与标准", th_net: "网络是否在运行", th_latest: "最近一次变化", th_checked: "核对日期",
    g_top: "市值前 100 的区块链", g_top_s: "按 CoinGecko 市值排名前 100，只取有自己网络的币。大多还没有抗量子选项，这本身也值得知道。",
    g_optin: "主网可选抗量子的链", g_optin_s: "上线时使用传统密钥；抗量子账户或锁定脚本已上主网，需要持币人自行选用。",
    g_native: "原生抗量子链", g_native_s: "主网上的每笔转账默认使用抗量子签名。请同时留意算法和网络两列。",
    g_early: "早期项目", g_early_s: "还没有在跑的主网。",
    k_upgrading: "升级中", k_native: "原生", k_early: "原生 · 测试网",
    rank: (r) => `市值第 ${r}`, fullpage: "详情页",
    blocks_ago: (m) => m < 1 ? "核查前不到 1 分钟出块" : `核查前 ${Math.round(m)} 分钟出块`,
    blocks_short: (m) => m < 1 ? "最新区块 · 不到 1 分钟前" : `最新区块 · ${Math.round(m)} 分钟前`,
    no_block: "接口没有响应", no_probe: "没有公开的出块接口", commits: (n) => `90 天内 ${n} 次提交`, no_repo: "未找到公开的节点代码库",
    threshold: (m) => `最新区块在 ${m} 分钟以内，算正常出块。`,
    queried: "查询时间",
    st_ok: "运行中", st_quiet: "在出块，代码 90 天无提交", st_stalled: "出块停了", st_unknown: "无法核实",
    checked_tag: "核对于",
    e_holder: "持币人目前能用什么", e_note: "注意事项", e_src: "出处", e_unv: "未核实，不计入档位", e_tl: "里程碑",
    e_open: "打开详情页", e_consensus: "共识机制", e_release: "最新版本", e_code: "代码活跃度", e_block: "最新区块", e_reviewed: "说法最近核对",
    pre: "（预发布）", tag_only: "（仅有标签，未发正式版本）", also: "另看",
    lead: "线索",
    stage_names: ["无公开进展", "仅有研究", "已有正式提案", "仅限测试网", "主网可选用", "默认抗量子"],
    d_back: "全部链", d_today: "当前保护", d_watch: "需要注意", d_can: "现在能做什么", d_next: "接下来关注什么",
    d_timeline: "时间线", d_facts: "速览", d_stage: "档位", d_algo: "算法", d_net: "网络", d_checked: "核对日期", d_unv: "尚未核实的说法",
    d_unv_note: "在原始出处确认之前，这些说法不计入档位。", d_no_tl: "还没有记录带日期的里程碑。当前条目以下方出处为依据。",
    d_fix: "发现本页有误或已过时？请附上原始出处报错。我们 7 天内回复，每次修改都记录在公开的更新记录里。",
    d_fix_btn: "报错",
    answer: (date, nm, n, label) => `截至 ${date}，${nm} 处于第 ${n} 档（满档 5 档）：${label}。`,
    answer_src: (stage) => (stage === 0 ? "查过的地方" : "出处"),
    why: (n) => `为什么是 ${n} 档`,
    stale: (date, d) => `这些说法最近一次核对是 ${date}，已经过去 ${d} 天，在下次复核前可能已过时。`,
    types: { research: "研究", proposal: "提案", code: "代码", testnet: "测试网", mainnet: "主网", wallet: "钱包", thirdparty: "第三方", tracker: "本站", network: "网络" },
    grades: { primary: "原始出处", official: "官方说法 · 不据此升档", unverified: "未核实" },
    source: "出处", undated: "日期不详", status: "状态",
    c_eyebrow: "本周变化", c_range: "时间范围", c_title: (n, s) => `本期记录 ${n} 条变化，${s === 0 ? "没有链调整档位" : `${s} 条链调整了档位`}。`,
    c_sub: "由每周自动巡查发现，经人工核对后发布。只有原始出处支持时，才会调整档位。",
    c_s1: "次档位调整", c_s2: "条变化", c_s3: "条链已核对", c_stage: "档位", c_older: "往期",
    tracker: "本站",
    foot_fix: "数据公开在 GitHub 上。发现错误，或掌握更新的进展？请附上原始出处提交纠错。",
    foot_btn_fix: "报错", foot_btn_submit: "提交项目", foot_btn_repo: "打开代码库",
    foot_fine: "本站是进度追踪，不做预测：只按已经上线的内容评档，不预测量子计算机何时能破解现有密码，也不评论币价。档位永不收费。数据和脚本全部公开，谁都可以复核。",
    foot_cite: (v, d) => `版本 ${v}，${d}。数据采用 CC BY 4.0 许可，脚本采用 MIT 许可。`, foot_cite_link: "如何引用", foot_log: "更新记录",
    how_h: "怎么算的",
  },
};

/* One sentence for every label on the page. */
const DEFS = {
  en: {
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
    st_stalled: "The newest block is older than the limit: 10 minutes, or six target block times for chains slower than 100 seconds.",
    st_unknown: "The block endpoint did not answer after three tries, or the chain has no public endpoint. We record that instead of guessing.",
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
    th_checked: "When the weekly patrol last read this chain's network data.",
    reviewed: "When the claims in this row were last checked against their sources.",
  },
  zh: {
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
    g_early: "有公开代码或在跑的测试网，且至少有一项活跃迹象，但还没有在跑的主网的项目。",
    k_upgrading: "上线时使用传统签名，抗量子保护是之后才加的。",
    k_native: "按抗量子设计：主网转账默认使用抗量子签名。",
    k_early: "按抗量子设计，但目前只有测试网或开发网在运行。",
    st_ok: "最新区块在时限以内，且主代码库最近 90 天有提交（或没有跟踪代码库）。",
    st_quiet: "最新区块在时限以内，但主代码库最近 90 天没有提交。",
    st_stalled: "最新区块超出时限：10 分钟；目标出块间隔超过 100 秒的链，按 6 倍目标出块间隔算。",
    st_unknown: "出块接口试了三次都没有响应，或这条链没有公开接口。我们如实记录，不做推测。",
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
    th_checked: "每周自动巡查最近一次读取这条链网络数据的日期。",
    reviewed: "这一行的说法最近一次对照出处核对的日期。",
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
const term = (label, def, title) => `<span class="term" tabindex="0" data-def="${esc(def)}"${title ? ` data-title="${esc(title)}"` : ""}>${label}</span>`;
const info = (def, title) => `<span class="term i" tabindex="0" role="button" aria-label="${esc(title)}" data-def="${esc(def)}" data-title="${esc(title)}">?</span>`;
const stageTerm = (s) => term(esc(L("stage_names")[s]), DF.stage[s], `${s} · ${L("stage_names")[s]}`);

function meter(s, lg) {
  let h = `<span class="meter${lg ? " lg" : ""}" role="img" aria-label="${s} / 5">`;
  for (let i = 1; i <= 5; i++) h += `<i class="${i <= s ? "f" + i : ""}"></i>`;
  return h + "</span>";
}
function chips(ids) { return `<span class="chips">${ids.map((k) => { const c = D.chips[k]; return term(`<span class="chip ${c.tone}">${esc(T(c))}</span>`, DF.chips[k], T(c)); }).join("")}</span>`; }
function kindKey(c) { return c.group === "early" ? "k_early" : (c.kind === "native" ? "k_native" : "k_upgrading"); }
const kindTerm = (c) => term(esc(L(kindKey(c))), DF[kindKey(c)], L(kindKey(c)));
const statusTerm = (st) => term(esc(L("st_" + st)), DF["st_" + st], L("st_" + st));

/* ---------- shared chrome ---------- */
function chrome(view) {
  const nav = [["", "nav_chains", "home"]];
  if (D.has_changes) nav.push(["changes/", "nav_changes", "changes"]);
  nav.push(["method/", "nav_method", "method"]);
  put("nav", nav.map(([p, k, v]) => `<a href="${href(p)}"${view === v ? ' aria-current="page"' : ""}>${esc(L(k))}</a>`).join(""));
  put("foot", `
    <div class="row1"><p>${esc(L("foot_fix"))}</p>
      <a class="btn primary" href="${URL_FIX}" target="_blank" rel="noopener">${esc(L("foot_btn_fix"))} ↗</a>
      <a class="btn" href="${URL_SUBMIT}" target="_blank" rel="noopener">${esc(L("foot_btn_submit"))} ↗</a>
      <a class="btn" href="${REPO}" target="_blank" rel="noopener">${esc(L("foot_btn_repo"))} ↗</a></div>
    <div class="fine">${esc(L("foot_fine"))}</div>
    <div class="fine">${esc(L("foot_cite")(D.release.version, D.release.date))} <a href="${href("method/")}#cite">${esc(L("foot_cite_link"))}</a> · <a href="${blob("CHANGELOG.md")}" target="_blank" rel="noopener">${esc(L("foot_log"))} ↗</a></div>`);
}

/* ---------- home ---------- */
const GROUP_ORDER = { top: 0, optin: 1, native: 2, early: 3 };
const defaultOrder = (a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || (a.rank || 999) - (b.rank || 999) || b.stage - a.stage || a.name.localeCompare(b.name);
const inFilter = (c, g) => g === "all" || (g === "top" ? c.rank != null : g === "optin" ? c.kind === "upgrading" && c.stage === 4 : c.group === g);
function filtered() {
  const q = state.q.trim().toLowerCase();
  let rows = D.chains.filter((c) => inFilter(c, state.group));
  if (q) rows = rows.filter((c) => [c.name, c.zh_name, c.ticker, T(c.algo), c.algo.en, ...(c.chips.map((k) => D.chips[k].en))].join(" ").toLowerCase().includes(q));
  const s = state.sort;
  if (s === "default") rows.sort(defaultOrder);
  else if (s === "stage_d") rows.sort((a, b) => b.stage - a.stage || defaultOrder(a, b));
  else if (s === "stage_a") rows.sort((a, b) => a.stage - b.stage || defaultOrder(a, b));
  else if (s === "latest") rows.sort((a, b) => sortKey(b.latest.date).localeCompare(sortKey(a.latest.date)));
  else if (s === "name") rows.sort((a, b) => name(a).localeCompare(name(b)));
  return rows;
}
function netCell(c) {
  const n = c.net, b = n.block, code = n.code;
  const parts = [];
  parts.push(b.ok ? L("blocks_short")(b.age) : (b.url ? L("no_block") : L("no_probe")));
  if (code) parts.push(code.c90 == null ? (code.repo ? "" : L("no_repo")) : L("commits")(code.c90));
  return `<div class="net"><span class="l1"><span class="dot ${n.status}"></span>${statusTerm(n.status)}</span><span class="l2">${parts.filter(Boolean).map(esc).join(" · ")}</span></div>`;
}
function rowHTML(c) {
  const sub = c.rank ? `${esc(c.ticker)} · ${esc(L("rank")(c.rank))}` : esc(c.ticker);
  const nm = `<a class="nm" href="${chainURL(c.id)}">${esc(name(c))}</a>`;
  const latestD = c.latest.date ? (c.latest.checked ? `${L("checked_tag")} ${fmtDate(c.latest.date)}` : fmtDate(c.latest.date)) : "—";
  const open = state.open === c.id;
  return `<tr class="row" data-id="${c.id}" tabindex="0" aria-expanded="${open}">
    <td class="c-chain"><div class="chain">${nm}<span class="sub">${sub}</span></div></td>
    <td class="c-kind"><span class="kind">${kindTerm(c)}</span></td>
    <td class="c-stage"><div class="stagecell">${meter(c.stage)}<b>${c.stage}</b><span>${stageTerm(c.stage)}</span></div></td>
    <td class="c-algo"><div class="algo"><span class="a">${esc(T(c.algo))}</span>${chips(c.chips)}</div></td>
    <td class="c-net">${netCell(c)}</td>
    <td class="c-latest"><div class="latest"><span class="d">${esc(latestD)}</span><span class="x">${esc(T(c.latest))}</span></div></td>
    <td class="c-checked"><span class="checked">${esc(c.checked || "—")}</span></td></tr>` + (open ? expandHTML(c) : "");
}
function blockHTML(c) {
  const b = c.net.block;
  if (b.ok) return `<span class="mono">#${b.h.toLocaleString("en-US")}</span> · ${esc(b.t.replace("T", " ").replace("Z", " UTC"))} · ${esc(L("blocks_ago")(b.age))}<br><span class="note-small">${esc(L("threshold")(c.net.threshold))}</span><br><a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(host(b.url))} ↗</a>`;
  if (!b.url) return `${esc(L("no_probe"))}${c.net.reason ? `<br><span class="note-small">${esc(T(c.net.reason))}</span>` : ""}`;
  return `${esc(L("no_block"))}<span class="note-small">${b.q ? PAR(L("queried") + " " + esc(b.q.slice(0, 16).replace("T", " ")) + " UTC") : ""}</span><br><a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(host(b.url))} ↗</a>`;
}
function codeHTML(code) {
  const rel = code.rel ? `${esc(code.rel)}${code.rel_pre ? esc(L("pre")) : ""}${code.rel_tag ? esc(L("tag_only")) : ""} · ${esc(fmtDate(code.rel_date))}` : esc(T(code.note) || "—");
  const also = (code.also || []).filter((a) => a.c90 != null).map((a) => `${esc(L("also"))}${CO()}github.com/${esc(a.repo)} · ${esc(L("commits")(a.c90))}`).join("<br>");
  return `${esc(L("e_release"))}${CO()}${rel}<br>${code.c90 == null ? "" : esc(L("commits")(code.c90)) + (code.rel && T(code.note) ? PAR(esc(T(code.note))) : "") + "<br>"}${also ? also + "<br>" : ""}${code.repo ? `<a href="https://github.com/${esc(code.repo)}" target="_blank" rel="noopener">github.com/${esc(code.repo)} ↗</a>` : ""}`;
}
function sourcesOf(c) { return c.sources || []; }
function expandHTML(c) {
  const code = c.net.code;
  let left = "";
  left += `<h4>${esc(L("e_holder"))}</h4><p>${esc(T(c.holder))}</p>`;
  if (T(c.note)) left += `<h4>${esc(L("e_note"))}</h4><p>${esc(T(c.note))}</p>`;
  if (c.unverified && c.unverified.length) left += `<h4 style="margin-top:10px">${esc(L("e_unv"))}</h4><ul>${c.unverified.map((u) => `<li>${esc(T(u.claim))} <span style="color:var(--ink-3)">${esc(T(u.reason))}</span> <a href="${esc(u.url)}" target="_blank" rel="noopener">${esc(L("lead"))}${CO()}${esc(host(u.url))} ↗</a></li>`).join("")}</ul>`;
  left += `<p style="margin-top:12px"><a class="btn" href="${chainURL(c.id)}">${esc(L("e_open"))} →</a></p>`;
  let right = `<h4>${esc(L("e_block"))}</h4><p>${blockHTML(c)}</p>`;
  if (code) right += `<h4>${esc(L("e_code"))}</h4><p>${codeHTML(code)}</p>`;
  if (c.consensus) right += `<h4>${esc(L("e_consensus"))}</h4><p>${esc(T(c.consensus))}</p>`;
  right += `<h4>${term(esc(L("e_reviewed")), DF.reviewed)}</h4><p class="mono">${esc(c.reviewed)}</p>`;
  return `<tr class="exp"><td colspan="7"><div class="expand"><div>${left}</div><div>${right}</div></div></td></tr>`;
}
function tableBody() {
  const rows = filtered();
  const grouped = state.sort === "default" && !state.q && state.group === "all";
  let html = "", last = null;
  for (const c of rows) {
    if (grouped && c.group !== last) { last = c.group; html += `<tr class="grp"><td colspan="7"><span class="gt">${term(esc(L("g_" + c.group)), DF["g_" + c.group], L("g_" + c.group))}</span><span class="gs">${esc(L("g_" + c.group + "_s"))}</span></td></tr>`; }
    html += rowHTML(c);
  }
  if (!rows.length) html = `<tr><td colspan="7" class="empty">—</td></tr>`;
  return { html, count: L("shown")(rows.length, D.chains.length) };
}
function renderTable() {
  const t = tableBody();
  document.getElementById("tbody").innerHTML = t.html;
  document.getElementById("count").textContent = t.count;
  syncSort();
}
function syncSort() {
  document.querySelectorAll(".ledger th button").forEach((b) => {
    const k = b.dataset.sort; const on = (k === "stage" && state.sort.startsWith("stage")) || k === state.sort;
    if (on) b.setAttribute("aria-sort", state.sort === "stage_a" ? "ascending" : "descending"); else b.removeAttribute("aria-sort");
    b.querySelector(".ar").textContent = on && state.sort === "stage_a" ? "↑" : "↓";
  });
}
function renderHome() {
  chrome("home");
  const top = D.chains.filter((c) => c.rank != null);
  const usable = top.filter((c) => c.stage >= 4).sort((a, b) => a.rank - b.rank);
  const t3 = top.filter((c) => c.stage === 3).map(name);
  const optin = D.chains.filter((c) => c.rank == null && c.kind === "upgrading" && c.stage === 4).length;
  const gen = D.chains.filter((c) => c.group === "native").length;
  let ov = "";
  for (let s = 0; s <= 5; s++) {
    const l = top.filter((c) => c.stage === s).sort((a, b) => a.rank - b.rank);
    ov += `<div class="ov-col"><div class="h">${meter(s)}<span>${s} · ${stageTerm(s)}</span></div><div class="n ${l.length ? "" : "zero"}">${l.length}</div>${l.length ? `<ul>${l.map((c) => `<li><a href="${chainURL(c.id)}">${esc(name(c))}</a></li>`).join("")}</ul>` : `<div class="none">${esc(L("none"))}</div>`}</div>`;
  }
  const opts = ["default", "stage_d", "stage_a", "latest", "name"].map((k) => `<option value="${k}" ${state.sort === k ? "selected" : ""}>${esc(L("sort_" + k))}</option>`).join("");
  const segs = ["all", "top", "optin", "native", "early"].map((g) => `<button type="button" data-g="${g}" aria-pressed="${state.group === g}">${esc(L("f_" + g))}</button>`).join("");
  const th = (k, sortKeyName) => sortKeyName
    ? `<th scope="col"><button type="button" data-sort="${sortKeyName}">${esc(L(k))}<span class="ar">↓</span></button>${info(DF[k], L(k))}</th>`
    : `<th scope="col">${term(esc(L(k)), DF[k], L(k))}</th>`;
  const tb = tableBody();
  put("app", `<div class="page">
    <section class="verdict"><span class="eyebrow">${esc(L("eyebrow")(fmtDate(D.checked)))}</span><h1>${esc(L("verdict")(usable.length, top.length, list(usable.map(name))))}</h1><p>${esc(L("verdict_sub")(list(t3), optin, gen))}</p></section>
    <section class="overview" aria-label="${esc(L("ov_title"))}"><header><b>${esc(L("ov_title"))}</b><span>${esc(L("ov_note")(fmtDate(D.mcap_date)))}</span></header><div class="ov-grid">${ov}</div></section>
    <section style="display:grid;gap:12px">
      <div class="toolbar">
        <label class="search"><span class="eyebrow" style="position:absolute;left:-9999px">${esc(L("search"))}</span><input id="q" type="search" placeholder="${esc(L("search"))}" value="${esc(state.q)}"></label>
        <div class="seg" role="group" aria-label="Filter">${segs}</div>
        <select id="sort" aria-label="Sort">${opts}</select>
        <span class="count" id="count">${esc(tb.count)}</span>
      </div>
      <div class="tablebox"><table class="ledger">
        <thead><tr>${th("th_chain", "name")}${th("th_kind")}${th("th_stage", "stage")}${th("th_algo")}${th("th_net")}${th("th_latest", "latest")}${th("th_checked")}</tr></thead>
        <tbody id="tbody">${tb.html}</tbody></table></div>
    </section>
    ${howHTML(true)}</div>`);
  if (PRE) return;
  syncSort();
  const app = document.getElementById("app");
  app.querySelector("#q").addEventListener("input", (e) => { state.q = e.target.value; renderTable(); });
  app.querySelector("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderTable(); });
  app.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => { state.group = b.dataset.g; app.querySelectorAll(".seg button").forEach((x) => x.setAttribute("aria-pressed", x === b)); renderTable(); }));
  app.querySelectorAll(".ledger th button").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.sort;
    state.sort = k === "stage" ? (state.sort === "stage_d" ? "stage_a" : "stage_d") : (state.sort === k ? "default" : k);
    app.querySelector("#sort").value = state.sort; renderTable();
  }));
  const body = document.getElementById("tbody");
  const toggle = (tr) => { const id = tr.dataset.id; state.open = state.open === id ? null : id; renderTable(); const n = document.querySelector(`tr.row[data-id="${id}"]`); if (n) n.focus({ preventScroll: true }); };
  body.addEventListener("click", (e) => { if (e.target.closest("a, .term")) return; const tr = e.target.closest("tr.row"); if (tr) toggle(tr); });
  body.addEventListener("keydown", (e) => { const tr = e.target.closest("tr.row"); if (tr && (e.key === "Enter" || e.key === " ") && e.target === tr) { e.preventDefault(); toggle(tr); } });
}

/* ---------- chain page ---------- */
function tlItem(m) {
  const grade = m.grade || "primary";
  return `<li class="tl t-${m.type}"><span class="when">${esc(fmtDate(m.date))}</span><span class="pin" aria-hidden="true"></span>
    <div class="body"><div class="tags">${term(`<span class="ttag">${esc(L("types")[m.type])}</span>`, DF.types[m.type], L("types")[m.type])}${term(`<span class="grade ${grade}">${esc(L("grades")[grade])}</span>`, DF.grades[grade], L("grades")[grade])}</div>
    <div class="txt">${esc(T(m))}</div>${m.status ? `<div class="st">${esc(L("status"))}${CO()}${esc(T(m.status))}</div>` : ""}
    ${m.url ? `<div class="src">${esc(L("source"))}${CO()}<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(host(m.url))} ↗</a></div>` : ""}</div></li>`;
}
function renderChain() {
  const c = D.chains[0];
  chrome("home");
  const tl = [...c.timeline].sort((a, b) => sortKey(a.date).localeCompare(sortKey(b.date)));
  const four = c.four || { today: c.holder, watch: c.note };
  const boxes = [["today", "d_today"], ["watch", "d_watch"], ["can", "d_can"], ["next", "d_next"]].filter(([k]) => T(four[k])).map(([k, l]) => `<div><h3>${esc(L(l))}</h3><p>${esc(T(four[k]))}</p></div>`).join("");
  const unv = c.unverified && c.unverified.length ? `<section class="unv"><h3>${esc(L("d_unv"))}</h3><span style="font-size:13px;color:var(--ink-3)">${esc(L("d_unv_note"))}</span>${c.unverified.map((u) => `<div class="it"><span>${esc(T(u.claim))}</span><span class="why">${esc(T(u.reason))}</span><a href="${esc(u.url)}" target="_blank" rel="noopener" style="font-size:12.5px">${esc(L("lead"))}${CO()}${esc(host(u.url))} ↗</a></div>`).join("")}</section>` : "";
  const legend = ["research", "proposal", "code", "testnet", "mainnet", "wallet", "thirdparty"].map((t) => `<span class="t-${t}">${term(`<span class="ttag" style="padding:0 5px">${esc(L("types")[t])}</span>`, DF.types[t], L("types")[t])}</span>`).join("");
  const timeline = tl.length ? `<section><div class="section-h"><h2>${esc(L("d_timeline"))}</h2><div class="legend">${legend}</div></div><ol class="timeline">${tl.map(tlItem).join("")}</ol></section>`
    : `<section><div class="section-h"><h2>${esc(L("d_timeline"))}</h2></div><p style="color:var(--ink-2)">${esc(L("d_no_tl"))}</p></section>`;
  const srcs = sourcesOf(c);
  const srcList = srcs.length ? `<section><h2 style="font-size:19px">${esc(L("e_src"))}</h2><ul class="src">${srcs.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label || host(s.url))}</a>${s.kind ? ` <span style="color:var(--ink-3)">· ${esc(T(s.kind))}</span>` : ""}</li>`).join("")}</ul></section>` : "";
  const sub = c.rank ? L("rank")(c.rank) : "";
  put("app", `<div class="page">
    <div class="crumb"><a href="${href("")}">${esc(L("d_back"))}</a> / ${esc(name(c))}</div>
    <header class="dhead"><div><h1>${esc(name(c))}${lang === "zh" && c.zh_name ? ` <span style="font-size:.5em;color:var(--ink-3);font-weight:500">${esc(c.name)}</span>` : ""}</h1>
      <div class="meta"><span class="mono">${esc(c.ticker)}</span>${sub ? `<span>· ${esc(sub)}</span>` : ""}<span>· ${kindTerm(c)}</span><span>· ${term(esc(L("d_checked")), DF.th_checked)} <span class="mono">${esc(c.checked || "—")}</span></span></div></div>
      <div class="bigstage">${meter(c.stage, true)}<div class="num">${c.stage}<small> / 5</small></div><div class="lab">${stageTerm(c.stage)}</div></div></header>
    <p class="answer"><b>${esc(L("answer")(c.reviewed, name(c), c.stage, L("stage_names")[c.stage]))}</b> ${esc(T(c.basis))}${c.basis_src ? ` <span class="cite-src">${esc(L("answer_src")(c.stage))}${CO()}<a href="${esc(c.basis_src)}" target="_blank" rel="noopener">${esc(host(c.basis_src))} ↗</a></span>` : ""}</p>
    ${c.stale_days > 90 ? `<p class="stale" role="note">${esc(L("stale")(c.reviewed, c.stale_days))}</p>` : ""}
    <div class="dgrid"><div style="display:grid;gap:28px;min-width:0">
      <section class="four">${boxes}</section>
      ${timeline}
      ${unv}
      ${srcList}
      <section class="fix"><p>${esc(L("d_fix"))}</p><a class="btn primary" href="${fixURL(c)}" target="_blank" rel="noopener">${esc(L("d_fix_btn"))} ↗</a></section>
    </div>
    <aside class="side"><section class="panel"><h3>${esc(L("d_facts"))}</h3>
      <div class="kv"><span class="k">${term(esc(L("d_stage")), DF.th_stage)}</span><span class="v">${meter(c.stage)} <b class="mono">${c.stage}</b> ${stageTerm(c.stage)}</span></div>
      <div class="kv"><span class="k">${term(esc(L("d_algo")), DF.th_algo)}</span><span class="v">${esc(T(c.algo))}</span>${chips(c.chips)}</div>
      <div class="kv"><span class="k">${term(esc(L("d_net")), DF.th_net)}</span><span class="v"><span class="dot ${c.net.status}" style="display:inline-block;margin-right:6px"></span>${statusTerm(c.net.status)}<br>${blockHTML(c)}</span></div>
      ${c.net.code ? `<div class="kv"><span class="k">${esc(L("e_code"))}</span><span class="v">${codeHTML(c.net.code)}</span></div>` : ""}
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
    const stg = it.stage ? `<span class="stg">${esc(L("c_stage"))} ${meter(it.stage[1])} <span class="mono">${it.stage[0]} → ${it.stage[1]}</span></span>` : "";
    return `<li class="ci t-${it.type}"><span class="when">${esc(fmtDate(it.date))}</span><div class="body"><div class="head"><span class="who">${who}</span>${term(`<span class="ttag">${esc(L("types")[it.type])}</span>`, DF.types[it.type], L("types")[it.type])}${stg}</div><p>${esc(T(it))}</p>${it.url ? `<span class="src">${esc(L("source"))}${CO()}<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(host(it.url))} ↗</a></span>` : ""}</div></li>`;
  }).join("");
  const changed = C.items.filter((i) => i.stage && i.stage[0] !== i.stage[1]).length;
  const range = `${fmtDate(C.range.from)} – ${fmtDate(C.range.to)}`;
  put("app", `<div class="page">
    <section class="issue"><span class="eyebrow">${esc(L("c_eyebrow"))} · ${esc(range)}</span><h1>${esc(L("c_title")(C.items.length, changed))}</h1><p>${esc(L("c_sub"))}</p></section>
    <div class="stat"><div><b>${changed}</b><span>${esc(L("c_s1"))}</span></div><div><b>${C.items.length}</b><span>${esc(L("c_s2"))}</span></div><div><b>${D.chain_count}</b><span>${esc(L("c_s3"))}</span></div></div>
    <ol class="clist">${items}</ol>
    ${older.length ? `<section class="watch"><h2 style="font-size:19px">${esc(L("c_older"))}</h2><ul>${older.map((o) => `<li>${esc(fmtDate(o.range.from))} – ${esc(fmtDate(o.range.to))} · ${esc(L("c_title")(o.items.length, o.items.filter((i) => i.stage && i.stage[0] !== i.stage[1]).length))}</li>`).join("")}</ul></section>` : ""}
    <section class="fix" style="max-width:860px"><p>${esc(L("foot_fix"))}</p><a class="btn primary" href="${URL_FIX}" target="_blank" rel="noopener">${esc(L("foot_btn_fix"))} ↗</a></section>
  </div>`);
}

/* ---------- how it's calculated (home bottom and method page) ---------- */
const METHOD = {
  en: {
    title: "How we rate", lede: "Every chain answers one question for the person holding the coin: do I have post-quantum protection today? We unify the result, not the route a chain takes to get there.",
    scale_h: "The six stages", cols: ["Stage", "Name", "What it means", "Example"],
    rules_h: "Rating rules",
    rules: [
      "A chain gets the highest stage that primary sources support on the check date.",
      "Stages 3 to 5 need a post-quantum way to authorize spending. Hiding public keys or making funds recoverable later is recorded, but tops out at stage 2.",
      "Third-party wallets, vaults and contracts are listed but do not change a chain's stage. One exception: on a chain where every account is a contract and the protocol has no built-in account signature (Starknet), a post-quantum account class declared on mainnet counts, whoever wrote it. The chain's page names the author and whether it is audited.",
      "Plans and target dates are shown and never rated. When only a project's own documents describe a feature, and no code, release or chain data confirms it, the stage is capped at 2.",
    ],
    groups_h: "The groups", groups_cols: ["Group", "Who is in it"],
    net_h: "Network status", net_cols: ["Status", "When we show it"],
    net_rule: "Where blocks come from: each chain's row names the explorer or public RPC we read, and every chain page shows the exact endpoint, the block height and time, and when we read it. The limit is 10 minutes, or six target block times when a chain's target is longer than 100 seconds (for example 60 minutes for Bitcoin's 10-minute blocks). At six target block times, a healthy chain misses the limit by chance about once in 400 checks. Public RPCs can answer from a lagging node, so before marking a chain stopped we read it twice more and keep the newest block. Commits are counted on the default branch of the main node repository over the 90 days before the check.",
    algo_h: "Algorithm labels", algo_cols: ["Label", "What it means"],
    grades_h: "Where evidence comes from",
    cite_rule: "The opening sentence on each chain page links one source. A chain with an entry in the project list (projects.json) links its pinned code or another pinned primary source. Other chains link the primary source (or, if there is none, the official claim) that supports the stage and best matches the stated reason. Node endpoints are not linked there because the network panel shows them. Every source is listed further down the page.",
    grades: [["Primary source · can set the stage", "primary"], ["Official claim · recorded as a plan", "official"], ["Lead · marked unverified", "unverified"]],
    dims_h: "What we collect", dims_cols: ["Field", "Where it comes from", "How often", "Script"],
    dims: [
      ["Stage, milestones, summary", "Official proposal repositories, client releases, chain parameters from official endpoints; websites count only as plans", "Watched proposals weekly; every row re-checked monthly; a person changes the stage", ["scripts/patrol.py", "data/chains.json"]],
      ["Algorithm and standard label", "NIST FIPS 204 and 205, NIST's FN-DSA selection, IETF RFC 8391, and the chain's own specification", "Monthly", ["data/chains.json"]],
      ["Latest block: height, time, age", "The explorer or public RPC listed for each chain", "Weekly", ["scripts/patrol.py"]],
      ["Latest release", "GitHub releases of the main node repository (its newest tag if there are no releases)", "Weekly", ["scripts/patrol.py"]],
      ["Commits in 90 days, last commit", "GitHub commits on the default branch of the main node repository", "Weekly", ["scripts/patrol.py"]],
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
    scale_h: "六个档位", cols: ["档位", "名称", "含义", "例子"],
    rules_h: "评档规则",
    rules: [
      "按核对当日原始出处能支持的最高档位评定。",
      "3 至 5 档要求能用抗量子方式授权转账。仅隐藏公钥，或让资产将来可以恢复，会被记录，但最高只评 2 档。",
      "第三方钱包、保险库和合约只做记录，不影响链的档位。唯一例外：如果一条链的每个账户都是合约、协议本身没有内置账户签名（如 Starknet），那么主网上已声明的抗量子账户类计入档位，不论作者是谁；该链页面会写明作者和是否经过审计。",
      "计划和目标日期会列出，但不参与评档。如果只有项目自己的文档或公告描述某项功能，没有代码、版本发布或链上数据证实，最高记 2 档。",
    ],
    groups_h: "分组", groups_cols: ["分组", "收录哪些链"],
    net_h: "网络状态", net_cols: ["状态", "什么情况下显示"],
    net_rule: "出块数据从哪来：每条链都写明读取的区块浏览器或公开 RPC，详情页列出具体接口、区块高度和时间，以及读取时间。时限是 10 分钟；目标出块间隔超过 100 秒的链，按 6 倍目标出块间隔算（比如比特币 10 分钟一个块，时限就是 60 分钟）。取 6 倍时，一条正常出块的链大约每 400 次核查才会偶然超时一次。公开 RPC 可能由落后的节点应答，所以判定「出块停了」之前会再读两次，取最新的区块。提交次数按主节点代码库的默认分支、核查日之前 90 天统计。",
    algo_h: "算法标签", algo_cols: ["标签", "含义"],
    grades_h: "证据来源",
    cite_rule: "每条链详情页开头那句结论带一个出处。在项目清单（projects.json）里有条目的链，链到钉住版本的代码或其他钉住的原始出处。其他链链到能支持该档位、并且和写明的依据最贴合的原始出处，没有原始出处时才用官方说法。节点接口不在这里链出，因为网络状态栏已经列出。全部来源列在页面下方。",
    grades: [["原始出处 · 可作定档依据", "primary"], ["官方说法 · 记为计划", "official"], ["线索 · 标为未核实", "unverified"]],
    dims_h: "我们抓哪些维度", dims_cols: ["字段", "从哪抓", "多久抓一次", "脚本"],
    dims: [
      ["档位、里程碑、摘要", "官方提案库、客户端发布版本、从官方接口读取的链上参数；官网只记为计划", "跟踪的提案每周查；每行每月重核；档位由人修改", ["scripts/patrol.py", "data/chains.json"]],
      ["算法与标准标签", "NIST FIPS 204 和 205、NIST 对 FN-DSA 的选定、IETF RFC 8391，以及链自己的规范", "每月", ["data/chains.json"]],
      ["最新区块：高度、时间、距今多久", "每条链写明的区块浏览器或公开 RPC", "每周", ["scripts/patrol.py"]],
      ["最新发布版本", "主节点代码库的 GitHub 发布记录（没有发布记录时取最新标签）", "每周", ["scripts/patrol.py"]],
      ["90 天内提交次数、最后一次提交", "主节点代码库默认分支在 GitHub 上的提交记录", "每周", ["scripts/patrol.py"]],
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
function howHTML(onHome) {
  const M = METHOD[lang];
  const ul = (a) => `<ul>${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const table = (cols, rows) => `<div class="scalebox"><table class="scale"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const ex = (s) => { const e = D.examples && D.examples[s]; return e ? `<a href="${chainURL(e.id)}">${esc(lang === "zh" && e.zh_name ? e.zh_name : e.name)}</a>` : "—"; };
  const stages = DF.stage.map((t, s) => `<tr><td>${meter(s)} <b class="mono">${s}</b></td><td>${esc(L("stage_names")[s])}</td><td>${esc(t)}</td><td>${ex(s)}</td></tr>`).join("");
  const raw = (f) => `https://raw.githubusercontent.com/Balance0014/post-quantum-blockchains/main/data/${f}`;
  const cite = `<h2 id="cite">${esc(M.cite_h)}</h2><p><code class="cite">${esc(M.cite(D.release.version, D.release.date, D.site_url))}</code></p><p>${esc(M.cite_p)}</p>
    <p>${esc(M.cite_files)} ${["chains.json", "network.json", "projects.json", "sources.json"].map((f) => `<a href="${raw(f)}" target="_blank" rel="noopener" class="mono">${f}</a>`).join(" · ")}</p>
    <p>${esc(M.cite_meta)} <a href="${blob("CITATION.cff")}" target="_blank" rel="noopener" class="mono">CITATION.cff</a> · <a href="${blob("CHANGELOG.md")}" target="_blank" rel="noopener" class="mono">CHANGELOG.md</a></p>`;
  const groups = ["top", "optin", "native", "early"].map((g) => `<tr><td>${esc(L("g_" + g))}</td><td>${esc(DF["g_" + g])}</td></tr>`).join("");
  const net = ["ok", "quiet", "stalled", "unknown"].map((s) => `<tr><td><span class="dot ${s}" style="display:inline-block;margin-right:6px"></span>${esc(L("st_" + s))}</td><td>${esc(DF["st_" + s])}</td></tr>`).join("");
  const algo = Object.keys(D.chips).map((k) => `<tr><td><span class="chip ${D.chips[k].tone}">${esc(T(D.chips[k]))}</span></td><td>${esc(DF.chips[k])}</td></tr>`).join("");
  const grades = `<div class="grades">${M.grades.map(([h, g], i) => `<div><span class="grade ${g}" style="font-size:12px">${["●", "◐", "○"][i]}</span><b>${esc(h)}</b><p>${esc(DF.grades[g])}</p></div>`).join("")}</div>`;
  const dims = M.dims.map(([f, src, how, scripts]) => `<tr><td>${esc(f)}</td><td>${esc(src)}</td><td>${esc(how)}</td><td>${scripts.map((p) => `<a href="${blob(p)}" target="_blank" rel="noopener" class="mono">${esc(p)}</a>`).join("<br>")}</td></tr>`).join("");
  const H = onHome ? "h2" : "h2";
  return `<section class="how" id="how"><article class="prose">
    ${onHome ? `<span class="eyebrow">${esc(L("nav_method"))}</span><h2 style="font-size:clamp(24px,3vw,30px);margin-top:0">${esc(L("how_h"))}</h2>` : `<span class="eyebrow">${esc(L("nav_method"))}</span><h1 style="font-size:clamp(26px,3.4vw,36px);font-weight:600">${esc(M.title)}</h1>`}
    <p style="font-size:16px;color:var(--ink-2)">${esc(M.lede)}</p>
    <${H}>${esc(M.scale_h)}</${H}>${table(M.cols, stages)}
    <${H}>${esc(M.rules_h)}</${H}>${ul(M.rules)}
    <${H}>${esc(M.groups_h)}</${H}>${table(M.groups_cols, groups)}
    <${H}>${esc(M.net_h)}</${H}>${table(M.net_cols, net)}<p>${esc(M.net_rule)}</p>
    <${H}>${esc(M.algo_h)}</${H}>${table(M.algo_cols, algo)}
    <${H}>${esc(M.grades_h)}</${H}>${grades}<p>${esc(M.cite_rule)}</p>
    <${H}>${esc(M.dims_h)}</${H}><div class="scalebox"><table class="scale dims"><thead><tr>${M.dims_cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${dims}</tbody></table></div>
    <${H}>${esc(M.who_h)}</${H}>${ul(M.who)}
    ${D.left_out && D.left_out.length ? `<details class="left"><summary>${esc(M.left_h(D.left_out.length))}</summary>${table(M.left_cols, D.left_out.map((x) => `<tr><td class="mono">#${x.rank}</td><td>${esc(x.name)} <span class="mono" style="color:var(--ink-3)">${esc(x.symbol)}</span></td><td>${esc(T(x.reason))}${x.note ? PAR(esc(T(x.note))) : ""}</td></tr>`).join(""))}</details>` : ""}
    <${H}>${esc(M.cad_h)}</${H}>${ul(M.cad)}
    <${H} id="limits">${esc(M.open_h)}</${H}>${ul(M.open)}
    ${cite}
    <p>${esc(M.rules_link)} <a href="${blob("docs/stages.md")}" target="_blank" rel="noopener" class="mono">docs/stages.md</a></p>
  </article></section>`;
}
function renderMethod() {
  chrome("method");
  put("app", `<div class="page">${howHTML(false)}
    <section class="fix" style="max-width:860px"><p>${esc(L("foot_fix"))}</p><a class="btn primary" href="${URL_FIX}" target="_blank" rel="noopener">${esc(L("foot_btn_fix"))} ↗</a></section></div>`);
}

/* ---------- definitions popover ---------- */
if (!PRE) {
const pop = document.getElementById("pop");
let pinned = null;
function showPop(el) {
  pop.innerHTML = (el.dataset.title ? `<b>${esc(el.dataset.title)}</b>` : "") + esc(el.dataset.def);
  pop.hidden = false;
  const r = el.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  const left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
  const top = r.bottom + 8 + h > window.innerHeight ? r.top - h - 8 : r.bottom + 8;
  pop.style.left = left + "px"; pop.style.top = Math.max(8, top) + "px";
}
function hidePop() { pop.hidden = true; pinned = null; }
document.addEventListener("mouseover", (e) => { const t = e.target.closest(".term"); if (t && !pinned) showPop(t); });
document.addEventListener("mouseout", (e) => { const t = e.target.closest(".term"); if (t && !pinned && !t.contains(e.relatedTarget)) pop.hidden = true; });
document.addEventListener("focusin", (e) => { const t = e.target.closest && e.target.closest(".term"); if (t) showPop(t); });
document.addEventListener("focusout", (e) => { if (e.target.closest && e.target.closest(".term") && !pinned) pop.hidden = true; });
document.addEventListener("click", (e) => {
  const t = e.target.closest(".term");
  if (t) { e.preventDefault(); e.stopPropagation(); if (pinned === t) hidePop(); else { pinned = t; showPop(t); } return; }
  if (!e.target.closest("#pop")) hidePop();
}, true);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hidePop();
  const t = e.target.closest && e.target.closest(".term");
  if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.stopPropagation(); if (pinned === t) hidePop(); else { pinned = t; showPop(t); } }
}, true);
window.addEventListener("scroll", () => { if (!pop.hidden) hidePop(); }, { passive: true });
}

/* ---------- start ---------- */
({ home: renderHome, chain: renderChain, changes: renderChanges, method: renderMethod })[D.page]();
if (PRE) globalThis.OUT = OUT;
