// Shared fixtures. Every test gets a page that
//  - fails the test on any script error, console error or broken file on our own site,
//  - never reaches the internet: other hosts get an empty page, so outside links can be clicked without network,
//  - may read and write the clipboard (for the copy buttons).
const base = require('@playwright/test');

const ORIGIN = 'http://127.0.0.1:8090';
const SITE = `${ORIGIN}/post-quantum-blockchains/`;

const test = base.test.extend({
  lang: async ({}, use, info) => use(info.project.metadata.lang),
  // a site path in the test's language: u('method/') is /zh/method/ in a Chinese run
  u: async ({ lang }, use) => use((p = '') => (lang === 'zh' ? 'zh/' : '') + p),
  phone: async ({ isMobile }, use) => use(!!isMobile),
  page: async ({ page, context }, use, info) => {
    const errors = [];
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
    await context.route((url) => url.origin !== ORIGIN, (route) => (route.request().resourceType() === 'document'
      ? route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>outside</title>' })
      : route.fulfill({ status: 204, body: '' })));
    page.on('pageerror', (e) => errors.push(`script error: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/status of 404|Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
    page.on('response', (r) => {
      const t = r.request().resourceType();
      if (r.url().startsWith(ORIGIN) && r.status() >= 400 && t !== 'document') errors.push(`${r.status()} ${t} ${r.url()}`);
    });
    await use(page);
    base.expect(errors, `no errors on ${info.title}`).toEqual([]);
  },
});
const expect = base.expect;

// A site page's own address, without the origin: "/post-quantum-blockchains/zh/method/"
const pathOf = (page) => new URL(page.url()).pathname;

// Visible elements a keyboard user can reach with Tab, each tagged with data-e2e="<n>".
async function tagFocusable(page) {
  return page.evaluate(() => {
    const sel = 'a[href], button:not([disabled]), input:not([type=hidden]):not([disabled]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
    const shown = (el) => {
      if (el.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
      for (let d = el.parentElement.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) {
        if (!d.open && !(el.tagName === 'SUMMARY' && el.parentElement === d)) return false;
      }
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const els = [...document.querySelectorAll(sel)].filter((el) => shown(el) && !el.closest('#pop'));
    els.forEach((el, i) => el.setAttribute('data-e2e', String(i)));
    return els.length;
  });
}

// Presses Tab until focus has visited every tagged element (or a limit), and returns the ones never reached.
async function tabThrough(page, n) {
  await page.evaluate(() => {
    window.__reached = new Set();
    document.addEventListener('focusin', (e) => { const t = e.target.closest('[data-e2e]'); if (t) window.__reached.add(t.dataset.e2e); }, true);
    document.activeElement && document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  for (let i = 0; i < n + 40; i++) {
    await page.keyboard.press('Tab');
    if (i % 25 === 24 && (await page.evaluate((m) => window.__reached.size >= m, n))) break;
  }
  return page.evaluate((m) => {
    const missed = [];
    for (let i = 0; i < m; i++) if (!window.__reached.has(String(i))) {
      const el = document.querySelector(`[data-e2e="${i}"]`);
      missed.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + String(el.className).split(' ')[0] : ''} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40)}"`);
    }
    return missed;
  }, n);
}

// Every outside link opens in a new tab and doesn't pass the page to it; one of them is clicked to prove it.
async function outsideLinks(page) {
  const bad = await page.evaluate((origin) => [...document.querySelectorAll('a[href]')]
    .filter((a) => a.href.startsWith('http') && new URL(a.href).origin !== origin)
    .filter((a) => a.target !== '_blank' || !/noopener/.test(a.rel))
    .map((a) => a.href), ORIGIN);
  expect(bad, 'outside links without target=_blank rel=noopener').toEqual([]);
  const link = page.locator(`a[target=_blank][href^="http"]:not([href^="${ORIGIN}"]):visible`).first();
  if (await link.count()) {
    const [tab] = await Promise.all([page.context().waitForEvent('page'), link.click()]);
    expect(new URL(tab.url()).origin).not.toBe(ORIGIN);
    await tab.close();
    expect(page.url().startsWith(ORIGIN)).toBe(true);
  }
}

// Every link to our own site answers 200, and every "#id" on this page has its target.
async function ownLinks(page, request) {
  const { urls, anchors } = await page.evaluate((origin) => {
    const as = [...document.querySelectorAll('a[href]')].map((a) => a.href).filter((h) => h.startsWith(origin));
    const here = location.origin + location.pathname;
    const anchors = as.filter((h) => h.startsWith(here + '#')).map((h) => decodeURIComponent(h.split('#')[1]).split('?')[0]).filter(Boolean);
    return { urls: [...new Set(as.map((h) => h.split('#')[0]))], anchors: [...new Set(anchors)] };
  }, ORIGIN);
  const broken = [];
  for (const u of urls) { const r = await request.get(u); if (r.status() !== 200) broken.push(`${r.status()} ${u}`); }
  expect(broken, 'links to our own pages').toEqual([]);
  const missing = await page.evaluate((ids) => ids.filter((id) => !document.getElementById(id)), anchors);
  expect(missing, 'in-page anchors without a target').toEqual([]);
  return urls.length;
}

// What a reader sees, with elements marked as another language taken out
async function visibleText(page) {
  return page.evaluate(() => {
    const c = document.body.cloneNode(true);
    c.querySelectorAll('script, style, svg, [lang], [hidden]').forEach((e) => e.remove());
    return c.innerText || c.textContent;
  });
}

// Opens everything that folds: details, "show all", list folds, row "More" buttons
async function openEverything(page) {
  await page.evaluate(() => {
    document.querySelectorAll('details').forEach((d) => { d.open = true; });
    const all = document.querySelector('#showall button[aria-expanded="false"]'); if (all) all.click();
    document.querySelectorAll('[data-fold][aria-expanded="false"]').forEach((b) => b.click());
  });
}

module.exports = { test, expect, ORIGIN, SITE, pathOf, tagFocusable, tabThrough, outsideLinks, ownLinks, visibleText, openEverything };
