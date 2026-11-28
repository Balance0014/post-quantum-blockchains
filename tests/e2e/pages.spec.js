// The chain pages, the method page, the data page, the weekly changes page and the 404 page.
const { test, expect, ORIGIN, pathOf, tagFocusable, tabThrough, outsideLinks, ownLinks } = require('./helpers');

const clip = (page) => page.evaluate(() => navigator.clipboard.readText());

// the in-page contents: each link lands on its section
async function contents(page) {
  const links = page.locator('nav.toc a[href^="#"]');
  const n = await links.count();
  expect(n).toBeGreaterThan(1);
  for (let i = 0; i < n; i++) {
    const a = links.nth(i);
    const id = (await a.getAttribute('href')).slice(1);
    await a.scrollIntoViewIfNeeded();
    await a.click();
    await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
    expect(new URL(page.url()).hash).toBe(`#${id}`);
  }
}

// every copy button puts its snippet on the clipboard
async function copyButtons(page) {
  const btns = page.locator('[data-copy]:visible');
  const n = await btns.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const b = btns.nth(i);
    const text = (await page.locator(`[id="${await b.getAttribute('data-copy')}"]`).textContent()).trim();
    await b.scrollIntoViewIfNeeded();
    await b.click();
    expect((await clip(page)).trim()).toBe(text);
    await expect(b, 'this button shows it copied').toHaveClass(/\bdone\b/);
    await expect(page.locator('#pop'), 'the "Copied" note next to the button').toHaveText(/^(Copied|已复制)$/);
  }
}

// every address inside the embed code: the published site, and the same page or image exists in this build
async function embedLinks(page, request) {
  const codes = await page.locator('.snip pre').allTextContents();
  expect(codes.length).toBeGreaterThan(0);
  const urls = [...new Set(codes.flatMap((c) => [...c.matchAll(/(?:href="|\]\(|src=")(https:\/\/[^"\s)]+)/g)].map((m) => m[1])))];
  expect(urls.length).toBeGreaterThan(2);
  for (const url of urls) {
    if (/^https:\/\/x\.com\//.test(url)) continue; // the author's X profile: scripts never request X
    expect(url, 'embed links use the published address').toMatch(/^https:\/\/balance0014\.github\.io\/post-quantum-blockchains\//);
    const local = url.replace('https://balance0014.github.io/post-quantum-blockchains/', '');
    expect((await request.get(local)).status(), url).toBe(200);
  }
  return urls;
}

test.describe('Chain pages', () => {
  test('Every chain page loads, with its answer and a way back', async ({ page, u, request }) => {
    const ids = (await (await request.get('data/chains/index.json')).json()).chains.map((c) => c.id);
    expect(ids.length).toBeGreaterThan(60);
    for (const id of ids) {
      const r = await page.goto(u(`chains/${id}/`));
      expect(r.status(), id).toBe(200);
      await expect(page.locator('h1'), id).toBeVisible();
      await expect(page.locator('.crumb a'), id).toBeVisible();
    }
  });

  for (const id of ['bitcoin', 'algorand', 'raqcoin']) {
    test(`${id}: contents links land on each section`, async ({ page, u }) => {
      await page.goto(u(`chains/${id}/`));
      await contents(page);
    });
  }

  test('The embed code is folded into one button that opens and closes', async ({ page, u }) => {
    await page.goto(u('chains/bitcoin/'));
    const d = page.locator('#d-embed'), s = d.locator('summary');
    await expect(d).not.toHaveAttribute('open', '');
    await s.click(); await expect(d).toHaveAttribute('open', '');
    await expect(d.locator('.snip').first()).toBeVisible();
    await s.click(); await expect(d).not.toHaveAttribute('open', '');
  });

  test('A link to the embed code opens it', async ({ page, u }) => {
    await page.goto(u('chains/bitcoin/#d-embed'));
    await expect(page.locator('#d-embed')).toHaveAttribute('open', '');
  });

  test('Copy buttons copy the badge, card and credit code', async ({ page, u }) => {
    await page.goto(u('chains/bitcoin/'));
    await page.locator('#d-embed > summary').click();
    await copyButtons(page);
    expect(await clip(page)).toContain('chains/bitcoin/');
  });

  test('Every link in the embed code, the credit line included, opens our site', async ({ page, u, request }) => {
    await page.goto(u('chains/bitcoin/'));
    const urls = await embedLinks(page, request);
    expect(urls).toContain(`https://balance0014.github.io/post-quantum-blockchains/${u('')}`);
  });

  test('The badge and card images load', async ({ page, u }) => {
    await page.goto(u('chains/bitcoin/'));
    await page.locator('#d-embed > summary').click();
    const imgs = page.locator('#d-embed img');
    await imgs.first().scrollIntoViewIfNeeded();
    const n = await imgs.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await imgs.nth(i).scrollIntoViewIfNeeded();
      await expect.poll(() => imgs.nth(i).evaluate((im) => im.complete && im.naturalWidth > 0)).toBe(true);
    }
  });

  test('"X discussion" is left out when there is nothing to show', async ({ page, u, request }) => {
    const all = await (await request.get('data/chains.json')).json();
    const quiet = all.chains.find((c) => !(c.x_talk || []).length);
    await page.goto(u(`chains/${quiet.id}/`));
    await expect(page.locator('.xtalk')).toHaveCount(0);
  });

  test('"X discussion" shows the three newest posts, and "Show more" opens and closes the rest', async ({ page, u, request }) => {
    const all = await (await request.get('data/chains.json')).json();
    const busy = all.chains.find((c) => (c.x_talk || []).length > 3);
    test.skip(!busy, 'no chain has more than three posts yet');
    const n = busy.x_talk.length;
    await page.goto(u(`chains/${busy.id}/`));
    const items = page.locator('.xtalk ol.xl > li:not(.more-n)');
    await expect(items).toHaveCount(n);
    await expect(page.locator('.xtalk ol.xl > li:not(.more-n):visible')).toHaveCount(3);
    const more = page.locator('.xtalk [data-fold]');
    await more.scrollIntoViewIfNeeded();
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.xtalk ol.xl > li:not(.more-n):visible')).toHaveCount(n);
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.xtalk ol.xl > li:not(.more-n):visible')).toHaveCount(3);
    const links = await page.locator('.xtalk a[href*="/status/"]').evaluateAll((as) => as.map((x) => x.href));
    expect(links.length).toBe(n);
    for (const h of links) expect(h).toMatch(/^https:\/\/(x|twitter)\.com\/[A-Za-z0-9_]+\/status\/\d+/);
  });

  test('"All chains" goes back to the home page', async ({ page, u }) => {
    await page.goto(u('chains/bitcoin/'));
    await page.locator('.crumb a').click();
    expect(pathOf(page)).toMatch(/post-quantum-blockchains\/(zh\/)?$/);
  });

  test('Links to our pages open, outside links open a new tab', async ({ page, u, request }) => {
    for (const id of ['bitcoin', 'qrl', 'near']) {
      await page.goto(u(`chains/${id}/`));
      await ownLinks(page, request);
      await outsideLinks(page);
    }
  });

  test('Tab reaches every control', async ({ page, u, phone }) => {
    test.skip(phone, 'no keyboard on a phone');
    await page.goto(u('chains/bitcoin/'));
    expect(await tabThrough(page, await tagFocusable(page))).toEqual([]);
  });
});

test.describe('Method page', () => {
  test.beforeEach(async ({ page, u }) => { await page.goto(u('method/')); });

  test('Contents links land on each section', async ({ page }) => { await contents(page); });

  test('NIST status table and the X paragraph are there', async ({ page }) => {
    await expect(page.locator('#nist')).toBeAttached();
    await expect(page.locator('#xtalk')).toBeAttached();
  });

  test('The left-out list opens and closes', async ({ page }) => {
    const d = page.locator('details.left');
    await d.locator('summary').scrollIntoViewIfNeeded();
    await d.locator('summary').click();
    await expect(d).toHaveAttribute('open', '');
    await expect(d.locator('tbody tr, li').first()).toBeVisible(); // the header row is hidden on a phone
    await d.locator('summary').click();
    await expect(d).not.toHaveAttribute('open', '');
  });

  test('"Submit a project" opens the form in a new tab', async ({ page }) => {
    const a = page.locator('.subbox a');
    await a.scrollIntoViewIfNeeded();
    const [tab] = await Promise.all([page.context().waitForEvent('page'), a.click()]);
    expect(tab.url()).toContain('new-project');
    await tab.close();
  });

  test('Links to our pages open, outside links open a new tab', async ({ page, request }) => {
    await ownLinks(page, request);
    await outsideLinks(page);
  });

  test('Tab reaches every control', async ({ page, phone }) => {
    test.skip(phone, 'no keyboard on a phone');
    expect(await tabThrough(page, await tagFocusable(page))).toEqual([]);
  });
});

test.describe('Data page', () => {
  test.beforeEach(async ({ page, u }) => { await page.goto(u('data/')); });

  test('Contents links land on each section', async ({ page }) => { await contents(page); });

  test('Embed picker: choosing a chain and a language updates the code', async ({ page }) => {
    const sel = page.locator('#emb-c');
    await sel.scrollIntoViewIfNeeded();
    const code = page.locator('#emb-b #sn-md');
    await sel.selectOption('algorand');
    await expect(code).toContainText('chains/algorand/');
    for (const l of ['zh', 'en']) {
      const b = page.locator(`[data-elang="${l}"]`);
      await b.click();
      await expect(b).toHaveAttribute('aria-pressed', 'true');
      if (l === 'zh') await expect(code).toContainText('/zh/');
      else await expect(code).not.toContainText('/zh/chains/');
    }
  });

  test('Copy buttons copy each snippet', async ({ page }) => { await copyButtons(page); });

  test('Every link in the embed code, the credit line included, opens our site, in both languages', async ({ page, request }) => {
    for (const l of ['en', 'zh']) {
      const b = page.locator(`[data-elang="${l}"]`);
      await b.scrollIntoViewIfNeeded();
      await b.click();
      const urls = await embedLinks(page, request);
      expect(urls).toContain(`https://balance0014.github.io/post-quantum-blockchains/${l === 'zh' ? 'zh/' : ''}`);
    }
  });

  test('The API files answer, with the license in each chain file', async ({ page, request }) => {
    const idx = await request.get('data/chains/index.json');
    expect(idx.status()).toBe(200);
    expect(idx.headers()['content-type']).toContain('json');
    const one = await (await request.get('data/chains/bitcoin.json')).json();
    expect(one.schema).toBe('post-quantum-blockchains/chain@1');
    expect(one.license.name).toBe('CC BY-NC 4.0');
    for (const f of ['data/chains.json', 'data/chains.csv']) expect((await request.get(f)).status(), f).toBe(200);
  });

  test('"Submit a project" and "Used by" open GitHub in a new tab', async ({ page }) => {
    for (const sel of ['.subbox a', 'a[href*="used-by"]']) {
      const a = page.locator(sel).first();
      await a.scrollIntoViewIfNeeded();
      const [tab] = await Promise.all([page.context().waitForEvent('page'), a.click()]);
      expect(tab.url()).toContain('github.com');
      await tab.close();
    }
  });

  test('Links to our pages open, outside links open a new tab', async ({ page, request }) => {
    await ownLinks(page, request);
    await outsideLinks(page);
  });

  test('Tab reaches every control', async ({ page, phone }) => {
    test.skip(phone, 'no keyboard on a phone');
    expect(await tabThrough(page, await tagFocusable(page))).toEqual([]);
  });
});

// the posts on X the home card and the x/ page count: the 90 days up to the network check, worked out here from the data
async function xWindow(request) {
  const [all, net] = await Promise.all([(await request.get('data/chains.json')).json(), (await request.get('data/network.json')).json()]);
  const to = net.checked_at_utc.slice(0, 10), from = new Date(Date.parse(to) - 90 * 864e5).toISOString().slice(0, 10);
  const posts = all.chains.flatMap((c) => (c.x_talk || []).filter((t) => t.date >= from && t.date <= to).map((t) => ({ ...t, chain: c.id })));
  return { posts, chains: new Set(posts.map((t) => t.chain)).size, total: all.chains.length };
}

test.describe('Discussion on X', () => {
  test('Home: the X card counts what the data holds and opens the X page', async ({ page, u, request }) => {
    const w = await xWindow(request);
    await page.goto(u(''));
    const card = page.locator('.kpis .kpi.xk');
    await expect(card.locator('.v [data-n]')).toHaveText(String(w.chains));
    await expect(card.locator('.v small')).toHaveText(`/${w.total}`);
    await expect(card.locator('.l')).toContainText(String(w.posts.length));
    await expect(card.locator('.term')).toHaveCount(1);
    await card.locator('a.xk-go').click();
    await page.waitForURL(`**/${u('x/')}`);
    await expect(page.locator('#xlist > li')).toHaveCount(w.posts.length);
  });

  test('X page: counts, every post, and the type filters', async ({ page, u, request }) => {
    const w = await xWindow(request);
    await page.goto(u('x/'));
    await expect(page.locator('[data-x="chains"]')).toHaveText(String(w.chains));
    await expect(page.locator('[data-x="posts"]')).toHaveText(String(w.posts.length));
    await expect(page.locator('[data-x="accounts"]')).toHaveText(String(new Set(w.posts.map((t) => t.who)).size));
    const items = page.locator('#xlist > li');
    await expect(items).toHaveCount(w.posts.length);
    // shown as "25 Nov 2026" or "2026-11-25": compare as days, not as text
    const days = (await items.locator('.when').allTextContents()).map((d) => Date.parse(d));
    expect(days.every((d) => !Number.isNaN(d)), 'every date reads').toBe(true);
    expect(days, 'newest first').toEqual([...days].sort((a, b) => b - a));
    const links = await page.locator('#xlist a[href*="/status/"]').evaluateAll((as) => as.map((x) => x.href));
    expect(links.length).toBe(w.posts.length);
    for (const h of links) expect(h).toMatch(/^https:\/\/(x|twitter)\.com\/[A-Za-z0-9_]+\/status\/\d+/);
    expect(await page.locator('#xlist a[href*="/chains/"]').count(), 'each post links its chain').toBe(w.posts.length);
    const btns = page.locator('.xbar [data-xt]');
    const n = await btns.count();
    expect(n).toBeGreaterThan(2);
    for (let i = 1; i < n; i++) {
      const b = btns.nth(i), type = await b.getAttribute('data-xt'), want = w.posts.filter((t) => t.type === type).length;
      await b.click();
      await expect(b).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#xlist > li:visible')).toHaveCount(want);
      await expect(page.locator('#xcount')).toContainText(String(want));
    }
    await btns.first().click();
    await expect(page.locator('#xlist > li:visible')).toHaveCount(w.posts.length);
  });

  test('X page: links to our pages open, outside links open a new tab, the rule links to the method', async ({ page, u, request }) => {
    await page.goto(u('x/'));
    await expect(page.locator('.xrule a[href$="method/#xtalk"]')).toHaveCount(1);
    await expect(page.locator(`nav.main a[href$="/${u('x/')}"]`)).toHaveAttribute('aria-current', 'page');
    await ownLinks(page, request);
    await outsideLinks(page);
  });
});

test.describe('Weekly changes page', () => {
  test('Loads and links each change to its chain, when there is a weekly issue', async ({ page, u, request }) => {
    const r = await request.get(u('changes/'));
    test.skip(r.status() === 404, 'no weekly issue published yet, so the page is not built');
    await page.goto(u('changes/'));
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await ownLinks(page, request);
    await outsideLinks(page);
  });
});

test.describe('404 page', () => {
  test('A missing address shows the 404 page, and its search opens the table', async ({ page, lang }) => {
    const r = await page.goto('chains/no-such-chain/');
    expect(r.status()).toBe(404);
    const form = page.locator(`#nfq-${lang}`);
    await expect(form).toBeVisible();
    await expect(form).toHaveValue('no such chain');
    await form.fill('bitcoin');
    await form.press('Enter');
    await page.waitForURL(/#chains\?q=bitcoin$/);
    await expect(page.locator('#tbody tr.row[data-id="bitcoin"]')).toBeVisible();
    expect(page.url().includes('/zh/')).toBe(lang === 'zh');
  });

  test('Its links go to the table and the method page', async ({ page, request }) => {
    await page.goto('chains/no-such-chain/');
    const hrefs = await page.locator('.nf a.btn').evaluateAll((as) => as.map((a) => a.href));
    expect(hrefs.length).toBe(4);
    for (const h of hrefs) expect((await request.get(h.split('#')[0])).status(), h).toBe(200);
    expect(hrefs.every((h) => h.startsWith(ORIGIN))).toBe(true);
  });
});
