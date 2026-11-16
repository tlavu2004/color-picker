import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const metrics = ['statements', 'branches', 'functions', 'lines'] as const;

export function formatCoverageSummary(report: unknown): string {
  if (!report || typeof report !== 'object' || !('total' in report)) throw new Error('Missing coverage totals.');
  const total = report.total;
  if (!total || typeof total !== 'object') throw new Error('Invalid coverage totals.');
  const rows = metrics.map(metric => {
    const value: unknown = (total as Record<string, unknown>)[metric];
    if (!value || typeof value !== 'object') throw new Error(`Missing coverage metric: ${metric}`);
    const { covered, total: count } = value as Record<string, unknown>;
    if (typeof covered !== 'number' || typeof count !== 'number' || !Number.isInteger(covered)
      || !Number.isInteger(count) || covered < 0 || count < covered) throw new Error(`Invalid coverage metric: ${metric}`);
    const percentage = count === 0 ? 100 : covered / count * 100;
    return `| ${metric[0].toUpperCase() + metric.slice(1)} | ${covered} | ${count} | ${percentage.toFixed(2)}% |`;
  });
  return [
    '## Application coverage', '',
    '| Metric | Covered | Total | Coverage |',
    '| --- | ---: | ---: | ---: |', ...rows, '',
    'Informational only; no minimum percentage gate. Mounting entries are excluded. Browser APIs are mocked; native behavior still requires browser verification.', '',
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = 'coverage/coverage-summary.json';
  const summary = fs.existsSync(file)
    ? formatCoverageSummary(JSON.parse(fs.readFileSync(file, 'utf8')))
    : '## Application coverage\n\nNo coverage report was generated. Check the test step logs.\n';
  process.stdout.write(summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
