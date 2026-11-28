// Back and forward, the language switch, links that open with filters or at a section, and reading in one language.
const { test, expect, pathOf, visibleText, openEverything } = require('./helpers');

const hash = (page) => decodeURIComponent(new URL(page.url()).hash);
const other = (lang, path) => (lang === 'zh' ? path.replace('/zh/', '/') : path.replace('/post-quantum-blockchains/', '/post-quantum-blockchains/zh/'));

test.describe('Navigation', () => {
  test('Back from a chain keeps the filters, "show all" and the scroll position', async ({ page, u }) => {
    await page.goto(u(''));
    await page.locator('.fbtn[data-k="scope"][data-v="top"]').click();
    await page.locator('#showall button').click();
    const row = page.locator('#tbody tr.row').nth(25);
    await row.scrollIntoViewIfNeeded();
    const id = await row.getAttribute('data-id');
    // where the reader sees the row, not the scroll number: sections off screen are drawn lazily at an estimated height
    const top = async () => (await page.locator(`#tbody tr.row[data-id="${id}"]`).boundingBox()).y;
    const y = await top();
    await row.locator('a[href*="/chains/"]').first().click();
    await page.waitForURL(`**/chains/${id}/`);
    await page.goBack();
    await expect(page.locator('#showall button')).toHaveAttribute('aria-expanded', 'true');
    expect(hash(page)).toContain('scope=top');
    await expect(page.locator('.fbtn[data-k="scope"][data-v="top"]')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => Math.abs((await top()) - y), { message: 'the row is back where the reader left it' }).toBeLessThan(60);
    await page.goForward();
    await page.waitForURL(`**/chains/${id}/`);
  });

  test('Back and forward between pages', async ({ page, u }) => {
    await page.goto(u(''));
    await page.locator('a[href$="method/"]:visible').first().click();
    await page.waitForURL('**/method/');
    await page.goto(u('data/'));
    await page.goBack(); await page.waitForURL('**/method/');
    await page.goBack(); expect(pathOf(page)).toMatch(/blockchains\/(zh\/)?$/);
    await page.goForward(); await page.waitForURL('**/method/');
  });

  test('The language switch opens the same chain page', async ({ page, u, lang }) => {
    await page.goto(u('chains/algorand/'));
    const from = pathOf(page);
    await page.locator('#lang').click();
    await page.waitForURL((url) => url.pathname === other(lang, from));
    await expect(page.locator('html')).toHaveAttribute('lang', lang === 'zh' ? 'en' : 'zh-Hans');
  });

  test('The language switch keeps the table filters', async ({ page, u, lang }) => {
    await page.goto(u('#chains?scope=top&stage=1'));
    await expect(page.locator('.fbtn[data-k="stage"][data-v="1"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#lang').click();
    await page.waitForURL((url) => url.pathname === other(lang, '/post-quantum-blockchains/' + u('')));
    expect(hash(page)).toContain('scope=top');
    expect(hash(page)).toContain('stage=1');
    await expect(page.locator('.fbtn[data-k="stage"][data-v="1"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('The language switch keeps the section on the method page', async ({ page, u, lang }) => {
    await page.goto(u('method/'));
    await page.locator('#lang').click();
    await page.waitForURL((url) => url.pathname.endsWith(lang === 'zh' ? '/post-quantum-blockchains/method/' : '/zh/method/'));
  });

  test('A link with filters opens the table filtered and sorted', async ({ page, u }) => {
    await page.goto(u('#chains?scope=top&stage=1&sort=name'));
    await expect(page.locator('.fbtn[data-k="scope"][data-v="top"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.fbtn[data-k="stage"][data-v="1"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#sortdd [role=option][data-v="name"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#chains')).toBeInViewport();
    const n = await page.locator('#tbody tr.row').count();
    expect(n).toBeGreaterThan(0);
  });

  test('A search with no match says so, says how else to search and offers a listing request', async ({ page, u }) => {
    await page.goto(u('#chains?q=zzqqxx'));
    await expect(page.locator('#q')).toHaveValue('zzqqxx');
    const box = page.locator('#tbody .ei');
    await expect(box).toContainText('zzqqxx');
    await expect(box).toContainText('BTC');
    await expect(box.locator('a[href*="new-project"]')).toHaveCount(1);
  });

  test('"Check a coin" with no match gives the same help', async ({ page, u }) => {
    await page.goto(u(''));
    await page.locator('#check-q').fill('zzqqxx');
    await page.locator('#check-q').press('Enter');
    const x = page.locator('#check-x');
    await expect(x).toContainText('zzqqxx');
    await expect(x.locator('a[href*="new-project"]')).toHaveCount(1);
  });

  test('A link with a search opens the table searched', async ({ page, u }) => {
    await page.goto(u('#chains?q=falcon'));
    await expect(page.locator('#q')).toHaveValue('falcon');
    await expect(page.locator('#tbody tr.row[data-id="algorand"]')).toBeVisible();
  });

  for (const [label, path, id] of [
    ['home timeline', '#timeline', 'timeline'],
    ['method NIST table', 'method/#nist', 'nist'],
    ['chain embed section', 'chains/bitcoin/#d-embed', 'd-embed'],
    ['data page API section', 'data/#api', 'api'],
  ]) {
    test(`A link to a section opens there: ${label}`, async ({ page, u }) => {
      await page.goto(u(path));
      await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
    });
  }
});

test.describe('Fits the screen', () => {
  test('Every page fits a 375 px wide phone screen', async ({ page, request, lang, phone }) => {
    test.skip(!phone, 'phone runs only');
    test.setTimeout(300000);
    await page.setViewportSize({ width: 375, height: 812 });
    const xml = await (await request.get('sitemap.xml')).text();
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace('/post-quantum-blockchains/', ''))
      .filter((p) => (lang === 'zh') === p.startsWith('zh/'));
    expect(paths.length).toBeGreaterThan(60);
    const wide = [];
    for (const p of [...paths, 'no-such-page/']) {
      await page.goto(p);
      const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      if (sw > cw) wide.push(`/${p}: ${sw} > ${cw}`);
    }
    expect(wide, 'pages wider than the screen').toEqual([]);
  });

  for (const path of ['', 'chains/bitcoin/', 'chains/raqcoin/', 'x/', 'method/', 'data/']) {
    test(`No sideways scrolling, everything opened: /${path}`, async ({ page, u }) => {
      await page.goto(u(path));
      await openEverything(page);
      const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(sw, 'page width').toBeLessThanOrEqual(cw);
    });
  }
});

test.describe('One language per page', () => {
  for (const path of ['', 'chains/bitcoin/', 'chains/raqcoin/', 'x/', 'method/', 'data/']) {
    test(`Everything opened, still one language: /${path}`, async ({ page, u, lang }) => {
      await page.goto(u(path));
      await openEverything(page);
      if (lang === 'en') {
        const text = await visibleText(page);
        expect(text.match(/[㐀-鿿]+/g) || [], 'Chinese on an English page').toEqual([]);
      } else {
        // the page's own labels (names and quoted sources are checked by scripts/lang_purity.py at build time)
        const labels = await page.evaluate(() => [...document.querySelectorAll('button, summary, label, th, h1, h2, h3, [role=status], .count, .l')]
          .filter((e) => !e.closest('[lang]:not(html)') && e.getClientRects().length).map((e) => e.innerText));
        const english = labels.filter((t) => /\b(the|and|of|with|for|not|show|more|less|all|copy|open|close)\b/i.test(t));
        expect(english, 'English labels on a Chinese page').toEqual([]);
      }
    });
  }
});
