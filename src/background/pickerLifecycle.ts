type FinishReason = 'selected' | 'cancelled' | 'abandoned';
type Session = {
  id: string; tabId: number; windowId: number; documentId: string; url: string;
  createdAt: number; armed: boolean; popupClosed: boolean; finished?: FinishReason;
};
const PREFIX = 'picker-return:';
const TTL = 30 * 60 * 1000;
const validId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);

export function createPickerLifecycle(api: typeof chrome) {
  const ports = new Set<string>();
  const queues = new Map<string, Promise<void>>();
  const returning = new Map<string, Session>();
  const invalidatedTabs = new Set<number>();
  const activeByWindow = new Map<number, number>();
  const currentStarts = new Map<number, string>();
  const popupSender = (sender: chrome.runtime.MessageSender) => sender.id === api.runtime.id
    && sender.url?.split(/[?#]/)[0] === api.runtime.getURL('src/index.html');
  const key = (id: string) => PREFIX + id;
  async function read(id: string): Promise<Session | undefined> {
    return (await api.storage.session.get(key(id)))[key(id)] as Session | undefined;
  }
  async function write(session: Session) { await api.storage.session.set({ [key(session.id)]: session }); }
  function enqueue<T>(id: string, task: () => Promise<T>): Promise<T> {
    const work = (queues.get(id) ?? Promise.resolve()).then(task);
    const tail = work.then(() => {}, () => {}).finally(() => { if (queues.get(id) === tail) queues.delete(id); });
    queues.set(id, tail);
    return work;
  }
  async function maybeReturn(session: Session) {
    if (!session.armed || !session.popupClosed || !session.finished) return;
    if (session.finished === 'abandoned' || Date.now() - session.createdAt > TTL) {
      await api.storage.session.remove(key(session.id));
      return;
    }
    returning.set(session.id, session);
    try {
      // Consume before opening: duplicate messages must not reopen twice.
      await api.storage.session.remove(key(session.id));
      const [tab] = await api.tabs.query({ active: true, windowId: session.windowId });
      const window = await api.windows.get(session.windowId);
      if (!window.focused || tab?.id !== session.tabId || tab.url !== session.url) return;
      const [current] = await api.tabs.query({ active: true, windowId: session.windowId });
      if (current?.id !== session.tabId || current.url !== session.url || returning.get(session.id) !== session
        || invalidatedTabs.has(session.tabId)
        || (activeByWindow.has(session.windowId) && activeByWindow.get(session.windowId) !== session.tabId)
        || (currentStarts.has(session.tabId) && currentStarts.get(session.tabId) !== session.id)) return;
      try {
        await api.action.openPopup({ windowId: session.windowId });
        await api.action.setBadgeText({ tabId: session.tabId, text: '' });
      } catch {
        // Colors are already persisted. A manual icon click remains available.
        await api.action.setBadgeText({ tabId: session.tabId, text: '•' }).catch(() => {});
      }
    } catch { /* Source tab/window may have closed. Never focus a replacement. */ }
    finally { returning.delete(session.id); }
  }
  async function invalidate(predicate: (session: Session) => boolean) {
    for (const [id, session] of returning) if (predicate(session)) returning.delete(id);
    const stored = await api.storage.session.get(null);
    const sessions = Object.entries(stored).filter(([name, value]) => name.startsWith(PREFIX) && value && typeof value === 'object')
      .map(([, value]) => value as Session).filter(predicate);
    await Promise.all(sessions.map(session => enqueue(session.id, async () => { await api.storage.session.remove(key(session.id)); })));
  }
  return {
    isPopupSender: popupSender,
    connected(id: string) { if (validId(id)) ports.add(id); },
    disconnected(id: string) {
      ports.delete(id);
      return enqueue(id, async () => {
        const session = await read(id);
        if (!session) return;
        session.popupClosed = true;
        await write(session);
        await maybeReturn(session);
      });
    },
    invalidateTab(tabId: number) {
      invalidatedTabs.add(tabId);
      return invalidate(session => session.tabId === tabId);
    },
    activated(tabId: number, windowId: number) {
      activeByWindow.set(windowId, tabId);
      return invalidate(session => session.windowId === windowId && session.tabId !== tabId);
    },
    async handle(input: unknown, sender: chrome.runtime.MessageSender) {
      if (!input || typeof input !== 'object') throw new Error('Invalid picker message.');
      const message = input as Record<string, unknown>;
      if (message.type === 'PICKER_POPUP_OPENED') {
        if (!popupSender(sender)) throw new Error('Invalid popup sender.');
        const [tab] = await api.tabs.query({ active: true, currentWindow: true });
        if (tab?.id !== undefined) await api.action.setBadgeText({ tabId: tab.id, text: '' });
        return;
      }
      const id = message.sessionId;
      if (!validId(id)) throw new Error('Invalid picker session.');
      return enqueue(id, async () => {
        if (message.type === 'PICKER_BEGIN') {
          if (!popupSender(sender) || !Number.isInteger(message.tabId) || !Number.isInteger(message.windowId)
            || typeof message.documentId !== 'string' || typeof message.url !== 'string' || typeof message.continuous !== 'boolean') {
            throw new Error('Invalid picker start request.');
          }
          // Record intent synchronously; navigation/activation events after this
          // point must remain authoritative even while storage operations await.
          invalidatedTabs.delete(message.tabId as number);
          currentStarts.set(message.tabId as number, id);
          activeByWindow.set(message.windowId as number, message.tabId as number);
          const tab = await api.tabs.get(message.tabId as number);
          if (!tab.active || tab.windowId !== message.windowId || tab.url !== message.url) throw new Error('The source tab changed.');
          await invalidate(session => session.tabId === tab.id && session.id !== id);
          await write({ id, tabId: message.tabId as number, windowId: message.windowId as number,
            documentId: message.documentId, url: message.url, createdAt: Date.now(), armed: false, popupClosed: !ports.has(id) });
          await api.storage.session.set({ pickerPopupMode: message.continuous });
          return;
        }
        const session = await read(id);
        if (!session) {
          if (message.type === 'PICKER_ARM') throw new Error('The picker session ended. Start selection again.');
          return;
        }
        if (message.type === 'PICKER_ARM' || message.type === 'PICKER_ABORT') {
          if (!popupSender(sender)) throw new Error('Invalid popup sender.');
          if (message.type === 'PICKER_ABORT') { await api.storage.session.remove(key(id)); return; }
          session.armed = true;
        } else if (message.type === 'PICKER_FINISHED') {
          if (sender.id !== api.runtime.id || sender.tab?.id !== session.tabId || sender.tab.windowId !== session.windowId
            || sender.frameId !== 0 || sender.documentId !== session.documentId
            || !['selected', 'cancelled', 'abandoned'].includes(message.reason as string)) throw new Error('Invalid picker completion.');
          if (message.reason === 'abandoned') { await api.storage.session.remove(key(id)); return; }
          session.finished = message.reason as FinishReason;
        } else { throw new Error('Unknown picker message.'); }
        await write(session);
        await maybeReturn(session);
      });
    },
  };
}
