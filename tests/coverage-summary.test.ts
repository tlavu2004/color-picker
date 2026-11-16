import { describe, expect, it } from 'vitest';
import { formatCoverageSummary } from '../scripts/coverage-summary.ts';

function report(covered = 3, total = 4) {
  return { total: Object.fromEntries(['statements', 'branches', 'functions', 'lines'].map(metric => [metric, { covered, total }])) };
}

describe('coverage job summary', () => {
  it('reports actual counters without imposing a gate', () => {
    expect(formatCoverageSummary(report())).toContain('| Lines | 3 | 4 | 75.00% |');
    expect(formatCoverageSummary(report(0, 4))).toContain('0.00%');
    expect(formatCoverageSummary(report())).toContain('no minimum percentage gate');
  });
  it('handles metrics with no instrumented items', () => {
    expect(formatCoverageSummary(report(0, 0))).toContain('100.00%');
  });
  it('rejects missing or inconsistent data rather than displaying misleading coverage', () => {
    expect(() => formatCoverageSummary(null)).toThrow('Missing coverage totals');
    expect(() => formatCoverageSummary({ total: {} })).toThrow('Missing coverage metric');
    expect(() => formatCoverageSummary(report(5, 4))).toThrow('Invalid coverage metric');
    expect(() => formatCoverageSummary(report(Number.NaN))).toThrow('Invalid coverage metric');
  });
});
