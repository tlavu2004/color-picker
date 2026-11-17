import { installOverlay, stopOverlay } from '../content/overlay';

export async function startTabSelection(continuous = false): Promise<void> {
  if (typeof chrome.scripting?.executeScript !== 'function') {
    throw new Error('Tab selection needs the scripting permission. Open chrome://extensions (or edge://extensions), reload Color Picker, then close and reopen this popup.');
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined || tab.windowId === undefined) throw new Error('No active tab is available.');
  if (!tab.url || !/^https?:\/\//i.test(tab.url)) {
    throw new Error('Tab selection works on ordinary HTTP/HTTPS pages. Use the native picker on restricted browser pages.');
  }
  // Remove an earlier session before capture so it is never sampled recursively.
  const [{ result: viewport } = {}] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: stopOverlay });
  if (!viewport) throw new Error('Could not prepare the source tab.');
  const image = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  const [active] = await chrome.tabs.query({ active: true, windowId: tab.windowId });
  if (active?.id !== tab.id) throw new Error('The active tab changed during capture. Start selection again.');
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: installOverlay, args: [image, viewport, continuous] });
}
