import { describe, expect, it, vi } from 'vitest';
import { createPickerLifecycle } from '../src/background/pickerLifecycle';
import { deferred } from './browserMocks';

const id = '11111111-1111-4111-8111-111111111111';
const popup = { id: 'extension', url: 'chrome-extension://extension/src/index.html' };
const content = { id: 'extension', tab: { id: 7, windowId: 2 } as chrome.tabs.Tab, frameId: 0, documentId: 'document' };
const begin = { type: 'PICKER_BEGIN', sessionId: id, tabId: 7, windowId: 2, documentId: 'document', url: 'https://example.com/', continuous: true };
const finish = { type: 'PICKER_FINISHED', sessionId: id, reason: 'selected' };

function setup() {
  const stored: Record<string, unknown> = {};
  const get = vi.fn(async (key: string | null) => key ? { [key]: stored[key] } : { ...stored });
  const set = vi.fn(async (value: Record<string, unknown>) => { Object.assign(stored, value); });
  const remove = vi.fn(async (key: string) => { delete stored[key]; });
  const tab = { id: 7, windowId: 2, active: true, url: begin.url };
  const query = vi.fn(async () => [{ ...tab }]);
  const getTab = vi.fn(async () => ({ ...tab }));
  const getWindow = vi.fn(async () => ({ id: 2, focused: true }));
  const openPopup = vi.fn(async () => {});
  const setBadgeText = vi.fn(async () => {});
  const api = {
    storage: { session: { get, set, remove } },
    runtime: { id: 'extension', getURL: (path: string) => `chrome-extension://extension/${path}` },
    tabs: { query, get: getTab }, windows: { get: getWindow }, action: { openPopup, setBadgeText },
  } as unknown as typeof chrome;
  const lifecycle = createPickerLifecycle(api);
  async function start() {
    lifecycle.connected(id);
    await lifecycle.handle(begin, popup);
    await lifecycle.handle({ type: 'PICKER_ARM', sessionId: id }, popup);
    await lifecycle.disconnected(id);
  }
  return { lifecycle, stored, tab, query, getWindow, openPopup, setBadgeText, start, api };
}

describe('popup return lifecycle', () => {
  it.each(['selected', 'cancelled'])('reopens once after %s in the same focused source window', async reason => {
    const api = setup();
    await api.start();
    await api.lifecycle.handle({ ...finish, reason }, content);
    expect(api.openPopup).toHaveBeenCalledExactlyOnceWith({ windowId: 2 });
    await api.lifecycle.handle({ ...finish, reason }, content);
    expect(api.openPopup).toHaveBeenCalledTimes(1);
    expect(api.stored.pickerPopupMode).toBe(true);
  });

  it('waits for the launch popup to close when selection finishes before startup returns', async () => {
    const api = setup();
    api.lifecycle.connected(id);
    await api.lifecycle.handle(begin, popup);
    await api.lifecycle.handle(finish, content);
    await api.lifecycle.handle({ type: 'PICKER_ARM', sessionId: id }, popup);
    expect(api.openPopup).not.toHaveBeenCalled();
    await api.lifecycle.disconnected(id);
    expect(api.openPopup).toHaveBeenCalledTimes(1);
  });

  it('restores after a service worker restart using session metadata', async () => {
    const api = setup();
    await api.start();
    const restarted = createPickerLifecycle(api.api);
    await restarted.handle(finish, content);
    expect(api.openPopup).toHaveBeenCalledTimes(1);
  });

  it('rejects messages from another tab, document, frame or extension', async () => {
    const api = setup();
    await api.start();
    for (const sender of [
      { ...content, id: 'other' }, { ...content, documentId: 'old-document' },
      { ...content, frameId: 1 }, { ...content, tab: { ...content.tab, id: 8 } as chrome.tabs.Tab },
    ]) await expect(api.lifecycle.handle(finish, sender)).rejects.toThrow('Invalid picker completion');
    expect(api.openPopup).not.toHaveBeenCalled();
  });

  it('does not reopen after changing tabs, navigation, abandonment, or expired sessions', async () => {
    for (const action of ['tab', 'navigation', 'abandoned', 'expired']) {
      const api = setup();
      await api.start();
      if (action === 'tab') await api.lifecycle.activated(8, 2);
      if (action === 'navigation') await api.lifecycle.invalidateTab(7);
      if (action === 'expired') (api.stored['picker-return:' + id] as { createdAt: number }).createdAt = 0;
      await api.lifecycle.handle({ ...finish, reason: action === 'abandoned' ? 'abandoned' : 'selected' }, content);
      expect(api.openPopup).not.toHaveBeenCalled();
    }
  });

  it('does not focus an inactive browser window or a replaced active tab', async () => {
    const api = setup();
    await api.start();
    api.getWindow.mockResolvedValueOnce({ id: 2, focused: false });
    await api.lifecycle.handle(finish, content);
    expect(api.openPopup).not.toHaveBeenCalled();
    const other = setup();
    await other.start();
    other.query.mockResolvedValueOnce([{ ...other.tab, id: 8 }]);
    await other.lifecycle.handle(finish, content);
    expect(other.openPopup).not.toHaveBeenCalled();
  });

  it('invalidates a return already in progress when the source changes', async () => {
    const api = setup();
    await api.start();
    const window = deferred<{ id: number; focused: boolean }>();
    api.getWindow.mockReturnValueOnce(window.promise);
    const returning = api.lifecycle.handle(finish, content);
    await vi.waitFor(() => expect(api.getWindow).toHaveBeenCalled());
    await api.lifecycle.activated(8, 2);
    window.resolve({ id: 2, focused: true });
    await returning;
    expect(api.openPopup).not.toHaveBeenCalled();
  });

  it('blocks same-URL reloads even when invalidation and completion arrive together', async () => {
    const api = setup();
    await api.start();
    const invalidation = api.lifecycle.invalidateTab(7);
    const returning = api.lifecycle.handle(finish, content);
    await Promise.all([invalidation, returning]);
    expect(api.openPopup).not.toHaveBeenCalled();
  });

  it('leaves a badge fallback if Chrome refuses to open the popup', async () => {
    const api = setup();
    await api.start();
    api.openPopup.mockRejectedValueOnce(new Error('Popup blocked'));
    await api.lifecycle.handle(finish, content);
    expect(api.setBadgeText).toHaveBeenCalledWith({ tabId: 7, text: '•' });
    await api.lifecycle.handle({ type: 'PICKER_POPUP_OPENED' }, popup);
    expect(api.setBadgeText).toHaveBeenLastCalledWith({ tabId: 7, text: '' });
  });

  it('aborts failed startup and rejects page-originated begin requests', async () => {
    const api = setup();
    await expect(api.lifecycle.handle(begin, content)).rejects.toThrow('Invalid picker start');
    await api.start();
    await api.lifecycle.handle({ type: 'PICKER_ABORT', sessionId: id }, popup);
    await api.lifecycle.handle(finish, content);
    expect(api.openPopup).not.toHaveBeenCalled();
  });
});
