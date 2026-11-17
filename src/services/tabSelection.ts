import { overlayTranslations } from '../i18n/overlayMessages';
import type { Language } from '../i18n/messages';
import { installOverlay, stopOverlay } from '../content/overlay';

const launchPorts = new Set<chrome.runtime.Port>();
async function lifecycleMessage(message: Record<string, unknown>) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(response?.error || 'Reload Color Picker to enable popup restoration.');
}

export async function startTabSelection(continuous = false, language: Language = 'en'): Promise<void> {
  if (typeof chrome.scripting?.executeScript !== 'function') {
    throw new Error('Tab selection needs the scripting permission. Open chrome://extensions (or edge://extensions), reload Color Picker, then close and reopen this popup.');
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined || tab.windowId === undefined) throw new Error('No active tab is available.');
  if (!tab.url || !/^https?:\/\//i.test(tab.url)) {
    throw new Error('Tab selection works on ordinary HTTP/HTTPS pages. Use the native picker on restricted browser pages.');
  }
  const [source] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: stopOverlay });
  const viewport = source?.result;
  if (!viewport || !source.documentId) throw new Error('Could not identify the source document. Reload the extension and try again.');
  const image = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  const [active] = await chrome.tabs.query({ active: true, windowId: tab.windowId });
  if (active?.id !== tab.id) throw new Error('The active tab changed during capture. Start selection again.');
  const sessionId = crypto.randomUUID();
  const port = chrome.runtime.connect({ name: 'picker-launch:' + sessionId });
  launchPorts.add(port);
  port.onDisconnect.addListener(() => launchPorts.delete(port));
  try {
    await lifecycleMessage({ type: 'PICKER_BEGIN', sessionId, tabId: tab.id, windowId: tab.windowId,
      documentId: source.documentId, url: tab.url, continuous });
    await chrome.scripting.executeScript({ target: { tabId: tab.id, documentIds: [source.documentId] },
      func: installOverlay, args: [image, viewport, continuous, sessionId, overlayTranslations[language]] });
    await lifecycleMessage({ type: 'PICKER_ARM', sessionId });
    // The caller closes the popup. The port disconnect is the worker's signal
    // that it is safe to reopen later, even if selection finished very quickly.
  } catch (error) {
    await chrome.runtime.sendMessage({ type: 'PICKER_ABORT', sessionId }).catch(() => {});
    await chrome.scripting.executeScript({ target: { tabId: tab.id, documentIds: [source.documentId] }, func: stopOverlay }).catch(() => {});
    port.disconnect();
    launchPorts.delete(port);
    throw error;
  }
}
