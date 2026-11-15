export type Snapshot = {
  image: string;
  tabId: number;
  windowId: number;
  title: string;
  capturedAt: number;
};

const PREFIX = 'color-picker-snapshot:';
const EXPIRY_MS = 5 * 60 * 1000;

function validSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Snapshot>;
  return typeof item.image === 'string' && item.image.startsWith('data:image/png;base64,')
    && Number.isInteger(item.tabId) && Number.isInteger(item.windowId)
    && typeof item.title === 'string' && typeof item.capturedAt === 'number';
}

export async function refreshSnapshot(source: Pick<Snapshot, 'tabId' | 'windowId' | 'title'>): Promise<Snapshot> {
  const [active] = await chrome.tabs.query({ active: true, windowId: source.windowId });
  if (active?.id !== source.tabId) throw new Error('The source tab changed. Return to that tab and start a new snapshot.');
  const image = await chrome.tabs.captureVisibleTab(source.windowId, { format: 'png' });
  if (!image.startsWith('data:image/png;base64,')) throw new Error('Could not capture the tab image.');
  return { ...source, image, title: active.title || source.title, capturedAt: Date.now() };
}

export async function openSnapshot(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined || tab.windowId === undefined) throw new Error('No active tab is available to capture.');
  // Keep transient image data out of persistent local storage.
  const pending = await chrome.storage.session.get(null);
  const expired = Object.entries(pending).filter(([key, value]) => key.startsWith(PREFIX)
    && (!validSnapshot(value) || Date.now() - value.capturedAt > EXPIRY_MS)).map(([key]) => key);
  if (expired.length) await chrome.storage.session.remove(expired);
  const snapshot = await refreshSnapshot({ tabId: tab.id, windowId: tab.windowId, title: tab.title || 'Source tab' });
  const id = crypto.randomUUID();
  const key = PREFIX + id;
  await chrome.storage.session.set({ [key]: snapshot });
  try {
    const url = new URL(chrome.runtime.getURL('src/snapshot/index.html'));
    url.searchParams.set('session', id);
    const view = await chrome.windows.create({ url: url.href, type: 'popup', width: 1100, height: 800 });
    if (!view) throw new Error('Could not open the selection window.');
  } catch (error) {
    await chrome.storage.session.remove(key);
    throw error;
  }
}

export async function takeSnapshot(id: string): Promise<Snapshot> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('This snapshot session is invalid. Start a new session from the extension popup.');
  const key = PREFIX + id;
  const result = await chrome.storage.session.get(key);
  const snapshot: unknown = result[key];
  await chrome.storage.session.remove(key);
  if (!validSnapshot(snapshot) || Date.now() - snapshot.capturedAt > EXPIRY_MS) {
    throw new Error('This snapshot expired. Start a new session from the source tab.');
  }
  return snapshot;
}
