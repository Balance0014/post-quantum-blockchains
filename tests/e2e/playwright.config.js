// Runs in CI only (.github/workflows/e2e.yml). The website is built into $SERVE_DIR/post-quantum-blockchains and
// served the way GitHub Pages serves it. Four runs of every test: English and Chinese, desktop and phone.
const { defineConfig, devices } = require('@playwright/test');

const PORT = 8090;
const phone = devices['Pixel 7']; // Chromium with a touch screen, 412 by 915
module.exports = defineConfig({
  testDir: '.',
  timeout: 90_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  workers: process.env.CI ? 4 : 2,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['./table-reporter.js'], ['html', { outputFolder: 'report/html', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/post-quantum-blockchains/`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'en-desktop', metadata: { lang: 'en' }, use: { viewport: { width: 1280, height: 800 }, locale: 'en-US' } },
    { name: 'en-phone', metadata: { lang: 'en' }, use: { ...phone, locale: 'en-US' } },
    { name: 'zh-desktop', metadata: { lang: 'zh' }, use: { viewport: { width: 1280, height: 800 }, locale: 'zh-CN' } },
    { name: 'zh-phone', metadata: { lang: 'zh' }, use: { ...phone, locale: 'zh-CN' } },
  ],
  webServer: {
    command: `python3 ../../scripts/serve_site.py "${process.env.SERVE_DIR || '../../_serve'}" ${PORT}`,
    url: `http://127.0.0.1:${PORT}/post-quantum-blockchains/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
