import { vi } from 'vitest';
import { mockBrowser } from './browserMocks';
import type { Snapshot } from '../src/services/snapshot';

export const sessionId = '11111111-1111-4111-8111-111111111111';
export const sample: Snapshot = { image: 'data:image/png;base64,AA==', tabId: 7, windowId: 2, title: 'Example page', capturedAt: Date.now() };

export function mockSnapshot() {
  const browser = mockBrowser();
  const stored: Record<string, unknown> = { [`color-picker-snapshot:${sessionId}`]: { ...sample, capturedAt: Date.now() } };
  const get = vi.fn(async (key: string | null) => key === null ? { ...stored } : { [key]: stored[key] });
  const set = vi.fn(async (value: Record<string, unknown>) => { Object.assign(stored, value); });
  const remove = vi.fn(async (keys: string | string[]) => { for (const key of [keys].flat()) delete stored[key]; });
  const query = vi.fn(async () => [{ id: 7, windowId: 2, title: 'Example page' }]);
  const capture = vi.fn(async () => sample.image);
  const create = vi.fn(async () => ({ id: 3 }));
  Object.assign(chrome, {
    tabs: { query, captureVisibleTab: capture },
    windows: { create },
    runtime: { getURL: (path: string) => `chrome-extension://test/${path}` },
  });
  Object.assign(chrome.storage, { session: { get, set, remove } });
  return { browser, stored, get, set, remove, query, capture, create };
}
