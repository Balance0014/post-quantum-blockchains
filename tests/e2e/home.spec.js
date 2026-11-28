// The home page: every control, in each language, on desktop and phone.
const { test, expect, pathOf, tagFocusable, tabThrough, outsideLinks, ownLinks } = require('./helpers');

const rows = (page) => page.locator('#tbody tr.row');
const hash = (page) => decodeURIComponent(new URL(page.url()).hash);

test.describe('Home', () => {
  test.beforeEach(async ({ page, u }) => { await page.goto(u('')); });

  test('First screen: title, search and three figures', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#check-q')).toBeVisible();
    await expect(page.locator('.kpis .kpi')).toHaveCount(3);
    await expect(page.locator('details.howc')).not.toHaveAttribute('open', '');
  });

  test('"How the numbers are counted" opens and closes', async ({ page }) => {
    const d = page.locator('details.howc'), s = d.locator('summary');
    await s.click(); await expect(d).toHaveAttribute('open', '');
    await expect(d.locator('.howc-b')).toBeVisible();
    await s.click(); await expect(d).not.toHaveAttribute('open', '');
  });

  for (const [label, q, id] of [
    ['exact name', { en: 'bitcoin', zh: '比特币' }, 'bitcoin'],
    ['ticker', { en: 'eth', zh: 'ETH' }, 'ethereum'],
    ['alias', { en: 'BSC', zh: '币安链' }, 'bnb-chain'],
    ['pinyin initials', { en: 'Dogecoin', zh: 'ggb' }, 'dogecoin'],
    ['one letter wrong', { en: 'soalna', zh: 'soalna' }, 'solana'],
  ]) {
    test(`Check a coin: ${label} opens the chain`, async ({ page, lang }) => {
      await page.fill('#check-q', q[lang]);
      await page.press('#check-q', 'Enter');
      await page.waitForURL(`**/chains/${id}/`);
    });
  }

  test('Check a coin: no match says what is close instead of nothing', async ({ page }) => {
    await page.fill('#check-q', 'qzxqzxqzx');
    await page.click('#check button[type=submit]');
    await expect(page.locator('#check-x')).toBeVisible();
    await expect(page.locator('#check-x')).not.toHaveText('');
  });

  test('Table search: case, spaces and typos', async ({ page }) => {
    for (const [q, id] of [['ETHEREUM', 'ethereum'], ['bit coin cash', 'bitcoin-cash'], ['etherium', 'ethereum'], ['matic', 'polygon']]) {
      await page.fill('#q', q);
      await expect(page.locator(`#tbody tr.row[data-id="${id}"]`)).toBeVisible();
    }
    await page.fill('#q', 'qzxqzxqzx');
    await expect(rows(page)).toHaveCount(0);
    await expect(page.locator('#tbody .empty')).toBeVisible();
    await page.locator('#tbody [data-clear]').click();
    await expect(rows(page)).toHaveCount(20);
  });

  test('Table search: "did you mean" suggestions fill the search', async ({ page }) => {
    await page.fill('#q', 'solanq');
    const s = page.locator('#tbody [data-suggest]').first();
    if (await s.count()) { await s.click(); await expect(rows(page).first()).toBeVisible(); }
    else await expect(page.locator('#tbody tr.row[data-id="solana"]')).toBeVisible();
  });

  test('Filters: two rows shown, the rest under "More filters"', async ({ page }) => {
    const more = page.locator('details.moref');
    await expect(more).not.toHaveAttribute('open', '');
    await expect(page.locator('.fbtn[data-k="scope"]').first()).toBeVisible();
    await expect(page.locator('.fbtn[data-k="stage"]').first()).toBeVisible();
    await expect(page.locator('.fbtn[data-k="design"]').first()).toBeHidden();
    await more.locator('summary').click();
    await expect(page.locator('.fbtn[data-k="design"]').first()).toBeVisible();
    await more.locator('summary').click();
    await expect(more).not.toHaveAttribute('open', '');
  });

  test('Filters: every button turns on and off, and the address follows', async ({ page }) => {
    await page.locator('details.moref summary').click();
    const n = await page.locator('.fbtn[data-k]').count();
    let tried = 0;
    for (let i = 0; i < n; i++) {
      const b = page.locator('.fbtn[data-k]').nth(i);
      if (await b.isDisabled() || (await b.getAttribute('data-v')) === '') continue;
      const k = await b.getAttribute('data-k'), v = await b.getAttribute('data-v');
      await b.click();
      await expect(b).toHaveAttribute('aria-pressed', 'true');
      expect(hash(page)).toContain(`${k}=${v}`);
      await b.click();
      await expect(b).toHaveAttribute('aria-pressed', 'false');
      expect(hash(page)).not.toContain(`${k}=${v}`);
      tried++;
    }
    expect(tried).toBeGreaterThan(20);
  });

  test('Filters: active filter chips remove one filter or all', async ({ page }) => {
    await page.locator('.fbtn[data-k="scope"][data-v="top"]').click();
    await page.fill('#q', 'a');
    await expect(page.locator('#active [data-unset]').first()).toBeVisible();
    await page.locator('#active [data-unset="q"]').click();
    await expect(page.locator('#q')).toHaveValue('');
    expect(hash(page)).toContain('scope=top');
    const clear = page.locator('#active [data-clear]');
    if (await clear.count()) { await clear.click(); expect(hash(page)).not.toContain('scope='); }
  });

  test('Stage bars filter the table, a second press clears it', async ({ page }) => {
    const bar = page.locator('.stack button[data-stage="1"]');
    await bar.click();
    expect(hash(page)).toContain('stage=1');
    await expect(bar).toHaveAttribute('aria-pressed', 'true');
    await bar.click();
    expect(hash(page)).not.toContain('stage=1');
  });

  test('Stage legend buttons filter the table', async ({ page }) => {
    const n = await page.locator('.legend6 button[data-stage]').count();
    for (let i = 0; i < n; i++) {
      const b = page.locator('.legend6 button[data-stage]').nth(i);
      if (await b.isDisabled()) continue; // a stage no chain has reached yet: nothing to filter
      const st = await b.getAttribute('data-stage');
      await b.click();
      expect(hash(page)).toContain(`stage=${st}`);
    }
  });

  test('Question cards: each list folds open and closed, in place', async ({ page }) => {
    const n = await page.locator('[data-fold]').count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const b = page.locator('[data-fold]').nth(i);
      await b.scrollIntoViewIfNeeded();
      const hidden = b.locator('xpath=ancestor::ul[1]').locator('li[data-x]');
      await b.click();
      await expect(b).toHaveAttribute('aria-expanded', 'true');
      await expect(hidden.first()).toBeVisible();
      await b.scrollIntoViewIfNeeded();
      // measured in the page at the moment of the click: while the page settles, a real click may scroll first
      const [before, after] = await b.evaluate((el) => { const y = el.getBoundingClientRect().top; el.click(); return [y, el.getBoundingClientRect().top]; });
      await expect(b).toHaveAttribute('aria-expanded', 'false');
      await expect(hidden.first()).toBeHidden();
      expect(Math.abs(after - before), 'the button stays where the reader clicked it').toBeLessThan(2);
    }
  });

  test('Question cards: "show in the table" buttons filter the table', async ({ page }) => {
    const n = await page.locator('[data-view]').count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const b = page.locator('[data-view]').nth(i);
      const v = await b.getAttribute('data-view');
      await b.click();
      expect(hash(page)).toContain(`view=${v}`);
      await expect(page.locator('#chains')).toBeInViewport();
    }
  });

  test('Sort menu: mouse', async ({ page }) => {
    const btn = page.locator('#sortdd .dd-btn'), list = page.locator('#sortdd .dd-list');
    await btn.click(); await expect(list).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await list.locator('[role=option][data-v="name"]').click();
    await expect(list).toBeHidden();
    expect(hash(page)).toContain('sort=name');
    await btn.click(); await expect(list).toBeVisible();
    await page.locator('h1').click(); // a click outside closes it
    await expect(list).toBeHidden();
  });

  test('Sort menu: keyboard (arrows, Enter, Escape)', async ({ page, phone }) => {
    test.skip(phone, 'no keyboard on a phone');
    const btn = page.locator('#sortdd .dd-btn'), list = page.locator('#sortdd .dd-list');
    await btn.focus();
    await page.keyboard.press('ArrowDown');
    await expect(list).toBeVisible();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    expect(hash(page)).toContain('sort=name');
    await expect(btn).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(list).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await expect(btn).toBeFocused();
  });

  test('Column headers sort the table', async ({ page, phone }) => {
    const n = await page.locator('.ledger th button[data-sort]').count();
    let shown = 0;
    for (let i = 0; i < n; i++) {
      const b = page.locator('.ledger th button[data-sort]').nth(i);
      if (!(await b.isVisible())) continue; // the phone layout sorts from the menu
      await b.click();
      await expect(b).toHaveAttribute('aria-sort', /ascending|descending/);
      shown++;
    }
    if (!phone) expect(shown).toBe(n);
  });

  test('"Show all" expands, "Show fewer" folds back to the same place', async ({ page }) => {
    const btn = page.locator('#showall button');
    await expect(rows(page)).toHaveCount(20);
    await btn.scrollIntoViewIfNeeded();
    // where the button is on screen, measured in the page at the moment of each click (a real click may scroll first)
    const click = () => btn.evaluate((el) => { const y = el.getBoundingClientRect().top; el.click(); return [y, document.querySelector('#showall button').getBoundingClientRect().top]; });
    const [y0] = await click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(await rows(page).count()).toBeGreaterThan(20);
    await btn.scrollIntoViewIfNeeded();
    const [, y1] = await click();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(rows(page)).toHaveCount(20);
    expect(Math.abs(y1 - y0), 'the button is back where it was when the list was opened').toBeLessThan(5);
  });

  test('"More" on a row expands the latest step and folds it', async ({ page }) => {
    await page.locator('#tbody').scrollIntoViewIfNeeded();
    const more = page.locator('#tbody .more:visible').first();
    await expect(more).toBeVisible();
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(more.locator('xpath=ancestor::*[contains(@class,"latest")][1]')).toHaveClass(/open/);
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'false');
  });

  test('A table row opens its chain', async ({ page }) => {
    const r = rows(page).first();
    const id = await r.getAttribute('data-id');
    await r.locator('a').first().click();
    await page.waitForURL(`**/chains/${id}/`);
  });

  test('Timeline range buttons', async ({ page }) => {
    const n = await page.locator('[data-rng]').count();
    for (let i = n - 1; i >= 0; i--) {
      const b = page.locator('[data-rng]').nth(i);
      await b.click();
      await expect(b).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('[data-rng][aria-pressed="true"]')).toHaveCount(1);
    }
  });

  test('Definitions: tap or click shows one, again or Escape hides it', async ({ page, phone }) => {
    const t = page.locator('#tbody .term:visible, .kpis .term:visible, .hero .term:visible').first();
    await t.scrollIntoViewIfNeeded();
    const pop = page.locator('#pop');
    if (phone) await t.tap(); else await t.click();
    await expect(pop).toBeVisible();
    await expect(pop).not.toHaveText('');
    await page.keyboard.press('Escape');
    await expect(pop).toBeHidden();
    if (phone) await t.tap(); else await t.click();
    await expect(pop).toBeVisible();
    if (phone) await t.tap(); else await t.click();
    await expect(pop).toBeHidden();
  });

  test('Definitions: keyboard focus shows one', async ({ page, phone }) => {
    test.skip(phone, 'no keyboard on a phone');
    const t = page.locator('.term[tabindex="0"]:visible').first();
    await t.focus();
    await expect(page.locator('#pop')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('#pop')).toHaveClass(/pinned/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#pop')).toBeHidden();
  });

  test('Section link buttons copy a link to the section', async ({ page }) => {
    const a = page.locator('button.anchor').first();
    await a.scrollIntoViewIfNeeded();
    const id = await a.getAttribute('data-anchor');
    await a.click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(`#${id}`);
  });

  test('Citation copy buttons', async ({ page }) => {
    const cite = (await page.locator('#cite-text').textContent()).trim();
    await page.locator('#copy-cite').click();
    expect((await page.evaluate(() => navigator.clipboard.readText())).trim()).toBe(cite);
    await page.locator('[data-bib]').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^@\w+\{/);
  });

  test('"/" jumps to the table search', async ({ page, phone }) => {
    test.skip(phone, 'no keyboard on a phone');
    await page.locator('h1').click();
    await page.keyboard.press('/');
    await expect(page.locator('#q')).toBeFocused();
  });

  test('"Submit a project" opens the form in a new tab', async ({ page }) => {
    const a = page.locator('.subbox a');
    await expect(a).toHaveAttribute('href', /new-project/);
    const [tab] = await Promise.all([page.context().waitForEvent('page'), a.click()]);
    expect(tab.url()).toContain('github.com');
    await tab.close();
  });
});

test.describe('All pages', () => {
  test('Home: links to our pages open, outside links open a new tab', async ({ page, u, request }) => {
    await page.goto(u(''));
    expect(await ownLinks(page, request)).toBeGreaterThan(70);
    await outsideLinks(page);
  });

  test('Home: Tab reaches every control', async ({ page, u, phone }) => {
    test.skip(phone, 'no keyboard on a phone');
    await page.goto(u(''));
    const n = await tagFocusable(page);
    expect(await tabThrough(page, n)).toEqual([]);
  });

  test('Home: the header menu opens and closes', async ({ page, u }) => {
    await page.goto(u(''));
    // up to 1100 px wide the section links fold behind the menu button; wider, they sit in the header bar
    const menu = page.locator('details.menu'), summary = menu.locator('summary');
    const folded = await summary.isVisible();
    const link = folded ? menu.locator('a[data-sec="timeline"]') : page.locator('nav.main a[data-sec="timeline"]');
    if (folded) {
      await expect(link).toBeHidden();
      await summary.click();
      await expect(link).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(menu).not.toHaveAttribute('open', '');
      await summary.click();
    }
    await link.click();
    await expect(page.locator('#timeline')).toBeInViewport();
    await expect(menu).not.toHaveAttribute('open', '');
    expect(pathOf(page)).toMatch(/post-quantum-blockchains\/(zh\/)?$/);
  });

  test('Home: the theme switch flips and is remembered', async ({ page, u }) => {
    await page.goto(u(''));
    const html = page.locator('html');
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    const after = before === 'dark' ? 'light' : 'dark';
    await page.locator('#theme').click();
    await expect(html).toHaveAttribute('data-theme', after);
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', after);
    await page.locator('#theme').click();
    await expect(html).toHaveAttribute('data-theme', before);
  });
});
