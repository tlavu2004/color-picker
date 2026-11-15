import { vi } from 'vitest';

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

type StorageListener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => void;

export function mockBrowser(initialColors: string[] = []) {
  let colors = [...initialColors];
  const listeners = new Set<StorageListener>();
  const emit = (next: string[], area = 'local') => {
    const oldValue = colors;
    if (area === 'local') colors = [...next];
    listeners.forEach(listener => listener({ colors: { oldValue, newValue: next } }, area));
  };
  const get = vi.fn(async () => ({ colors: [...colors] }));
  const set = vi.fn(async (value: { colors: string[] }) => { emit(value.colors); });
  const addListener = vi.fn((listener: StorageListener) => { listeners.add(listener); });
  const removeListener = vi.fn((listener: StorageListener) => { listeners.delete(listener); });
  vi.stubGlobal('chrome', { storage: { local: { get, set }, onChanged: { addListener, removeListener } } });

  const open = vi.fn(async () => ({ sRGBHex: '#aabbcc' }));
  vi.stubGlobal('EyeDropper', class { open = open; });
  const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  return { get, set, open, writeText, emit, addListener, removeListener, listeners, colors: () => [...colors] };
}
