// Writes the results as one table: page × control × result, one column per language and screen.
// The table goes to report/results.md and, in GitHub Actions, to the run's summary page.
const fs = require('fs');
const path = require('path');

const MARK = { passed: '✅', flaky: '✅ (2nd try)', failed: '❌', timedOut: '❌ timed out', interrupted: '⏹', skipped: '—' };

class TableReporter {
  onBegin(config) {
    this.projects = config.projects.map((p) => p.name);
    this.rows = new Map();
    this.notes = new Map();
    this.fails = [];
  }

  onTestEnd(test, result) {
    // titlePath: ['', project, file, describe, title]
    const [, project, , ...titles] = test.titlePath();
    const page = titles.length > 1 ? titles[0] : '';
    const control = titles[titles.length - 1];
    const key = `${page}\u0000${control}`;
    if (!this.rows.has(key)) this.rows.set(key, { page, control, cells: {} });
    let status = result.status;
    if (status === 'passed' && result.retry > 0) status = 'flaky';
    this.rows.get(key).cells[project] = status;
    if (status === 'skipped') {
      const why = test.annotations.find((a) => a.type === 'skip');
      if (why && why.description) this.notes.set(key, why.description);
    }
    if (['failed', 'timedOut'].includes(status) && result.retry === test.retries) {
      const msg = (result.error && (result.error.message || '')).replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter(Boolean).slice(0, 3).join(' / ');
      this.fails.push(`- **${page} · ${control}** (${project}): ${msg.slice(0, 400)}`);
    }
  }

  onEnd(result) {
    const rows = [...this.rows.values()];
    const count = (s) => rows.reduce((n, r) => n + Object.values(r.cells).filter((c) => c === s).length, 0);
    const head = `| Page | Control | ${this.projects.join(' | ')} |\n| --- | --- |${this.projects.map(() => ' --- |').join('')}`;
    const body = rows.map((r) => {
      const note = this.notes.get(`${r.page}\u0000${r.control}`);
      return `| ${r.page} | ${r.control}${note ? ` <br><sub>— = ${note}</sub>` : ''} | ${this.projects.map((p) => MARK[r.cells[p]] || ' ').join(' | ')} |`;
    }).join('\n');
    const total = `${rows.length} checks × ${this.projects.length} runs: ${count('passed') + count('flaky')} passed` +
      `${count('flaky') ? ` (${count('flaky')} on the second try)` : ''}, ${count('failed') + count('timedOut')} failed, ${count('skipped')} not applicable.`;
    const md = `## Browser tests: every control on every page\n\n${total}\n\n${head}\n${body}\n` +
      (this.fails.length ? `\n### Failures\n\n${this.fails.join('\n')}\n` : '') +
      '\nRuns: English and Chinese, on a 1280 × 800 desktop and a Pixel 7 phone (touch). — means the check does not apply to that run.\n';
    fs.mkdirSync('report', { recursive: true });
    fs.writeFileSync(path.join('report', 'results.md'), md);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
    console.log(`\n${total}\nTable: tests/e2e/report/results.md (status ${result.status})`);
  }

  printsToStdio() { return false; }
}

module.exports = TableReporter;
