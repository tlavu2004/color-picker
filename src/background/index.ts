import { createPickerLifecycle } from './pickerLifecycle';

const lifecycle = createPickerLifecycle(chrome);
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (typeof message?.type !== 'string' || !message.type.startsWith('PICKER_')) return false;
  void lifecycle.handle(message, sender).then(() => sendResponse({ ok: true }), error => {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Picker lifecycle failed.' });
  });
  return true;
});
chrome.runtime.onConnect.addListener(port => {
  const prefix = 'picker-launch:';
  if (!port.name.startsWith(prefix) || !port.sender || !lifecycle.isPopupSender(port.sender)) return;
  const id = port.name.slice(prefix.length);
  lifecycle.connected(id);
  port.onDisconnect.addListener(() => { void lifecycle.disconnected(id).catch(() => {}); });
});
chrome.tabs.onUpdated.addListener((tabId, changes) => {
  if (changes.status === 'loading' || changes.url) void lifecycle.invalidateTab(tabId).catch(() => {});
});
chrome.tabs.onRemoved.addListener(tabId => { void lifecycle.invalidateTab(tabId).catch(() => {}); });
chrome.tabs.onActivated.addListener(info => { void lifecycle.activated(info.tabId, info.windowId).catch(() => {}); });
