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
    const y = await page.evaluate(() => window.scrollY);
    await row.locator('a[href*="/chains/"]').first().click();
    await page.waitForURL(`**/chains/${id}/`);
    await page.goBack();
    await expect(page.locator('#showall button')).toHaveAttribute('aria-expanded', 'true');
    expect(hash(page)).toContain('scope=top');
    await expect(page.locator('.fbtn[data-k="scope"][data-v="top"]')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y - 60);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - y)).toBeLessThan(60);
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

test.describe('One language per page', () => {
  for (const path of ['', 'chains/bitcoin/', 'chains/raqcoin/', 'method/', 'data/']) {
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
