import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { startTabSelection } from '../src/services/tabSelection';
import { installOverlay, stopOverlay } from '../src/content/overlay';
import Popup from '../src/components/Popup';
import { deferred, mockBrowser } from './browserMocks';

function setup() {
  const browser = mockBrowser();
  const query = vi.fn(async () => [{ id: 7, windowId: 2, url: 'https://example.com' }]);
  const capture = vi.fn(async () => 'data:image/png;base64,AA==');
  const execute = vi.fn().mockResolvedValueOnce([{ documentId: 'source-document', result: { width: 100, height: 80, scale: 1 } }]).mockResolvedValue([]);
  const createWindow = vi.fn();
  const disconnect = vi.fn();
  const sendMessage = vi.fn(async () => ({ ok: true }));
  const connect = vi.fn(() => ({ disconnect, onDisconnect: { addListener: vi.fn() } }));
  Object.assign(chrome, { tabs: { query, captureVisibleTab: capture }, scripting: { executeScript: execute }, windows: { create: createWindow }, runtime: { sendMessage, connect } });
  return { browser, query, capture, execute, createWindow, sendMessage, disconnect };
}

describe('continuous overlay startup', () => {
  it('removes the old overlay before capture and injects the new image into the same tab', async () => {
    const api = setup();
    await startTabSelection();
    expect(api.execute.mock.calls[0][0]).toMatchObject({ target: { tabId: 7 }, func: stopOverlay });
    expect(api.execute.mock.invocationCallOrder[0]).toBeLessThan(api.capture.mock.invocationCallOrder[0]);
    expect(api.execute.mock.calls[1][0]).toMatchObject({ target: { tabId: 7, documentIds: ['source-document'] }, func: installOverlay, args: ['data:image/png;base64,AA==', { width: 100, height: 80, scale: 1 }, false, expect.any(String)] });
    expect(api.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'PICKER_BEGIN', documentId: 'source-document' }));
    expect(api.sendMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'PICKER_ARM' }));
    expect(api.createWindow).not.toHaveBeenCalled();
  });

  it('refuses restricted pages without capturing or injecting', async () => {
    const api = setup();
    api.query.mockResolvedValueOnce([{ id: 7, windowId: 2, url: 'chrome://extensions' }]);
    await expect(startTabSelection()).rejects.toThrow('HTTP/HTTPS');
    expect(api.capture).not.toHaveBeenCalled();
    expect(api.execute).not.toHaveBeenCalled();
  });

  it('does not inject if the active tab changed after capture', async () => {
    const api = setup();
    api.query.mockResolvedValueOnce([{ id: 7, windowId: 2, url: 'https://example.com' }]).mockResolvedValueOnce([{ id: 8, windowId: 2, url: 'https://example.com' }]);
    await expect(startTabSelection()).rejects.toThrow('active tab changed');
    expect(api.execute).toHaveBeenCalledTimes(1);
  });

  it('reports capture or injection failures without opening another window', async () => {
    const api = setup();
    api.capture.mockRejectedValueOnce(new Error('Capture denied'));
    await expect(startTabSelection()).rejects.toThrow('Capture denied');
    expect(api.execute).toHaveBeenCalledTimes(1);
    expect(api.createWindow).not.toHaveBeenCalled();
  });

  it('passes continuous mode explicitly and closes only the popup after successful startup', async () => {
    const api = setup();
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    render(<Popup />);
    const toggle = screen.getByRole('switch', { name: 'Continuous selection' });
    await waitFor(() => expect(toggle).toBeEnabled());
    expect(toggle).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Pick Color' })).toBeInTheDocument();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Start continuous selection' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(api.browser.open).not.toHaveBeenCalled();
    expect(api.createWindow).not.toHaveBeenCalled();
    expect(api.execute.mock.calls[1][0].args[2]).toBe(true);
  });

  it('uses the shared tab picker in single mode by default, without opening native EyeDropper', async () => {
    const api = setup();
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    render(<Popup />);
    expect(screen.getByRole('button', { name: 'Native screen picker' }).closest('details')).not.toHaveAttribute('open');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pick Color' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Pick Color' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(api.execute.mock.calls[1][0].args[2]).toBe(false);
    expect(api.browser.open).not.toHaveBeenCalled();
  });

  it('removes the overlay and aborts the return session if startup arming fails', async () => {
    const api = setup();
    api.sendMessage.mockResolvedValueOnce({ ok: true }).mockRejectedValueOnce(new Error('Worker unavailable'));
    await expect(startTabSelection()).rejects.toThrow('Worker unavailable');
    expect(api.execute).toHaveBeenLastCalledWith(expect.objectContaining({ func: stopOverlay }));
    expect(api.sendMessage).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'PICKER_ABORT' }));
    expect(api.disconnect).toHaveBeenCalledOnce();
  });

  it('restores continuous mode when the popup reopens without overriding an explicit switch change', async () => {
    setup();
    Object.assign(chrome.storage, { session: { get: vi.fn(async () => ({ pickerPopupMode: true })) } });
    const view = render(<Popup />);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Continuous selection' })).toBeChecked());
    view.unmount();
    const saved = deferred<{ pickerPopupMode: boolean }>();
    Object.assign(chrome.storage, { session: { get: vi.fn(() => saved.promise) } });
    render(<Popup />);
    const toggle = screen.getByRole('switch', { name: 'Continuous selection' });
    await waitFor(() => expect(toggle).toBeEnabled());
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    await act(async () => { saved.resolve({ pickerPopupMode: true }); });
    expect(toggle).not.toBeChecked();
  });

  it('explains how to reload the extension when scripting permission has not been applied', async () => {
    const api = setup();
    Object.assign(chrome, { scripting: undefined });
    await expect(startTabSelection()).rejects.toThrow('reload Color Picker');
    expect(api.query).not.toHaveBeenCalled();
    expect(api.capture).not.toHaveBeenCalled();
    const close = vi.spyOn(window, 'close').mockImplementation(() => {});
    render(<Popup />);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Continuous selection' })).toBeEnabled());
    fireEvent.click(screen.getByRole('switch', { name: 'Continuous selection' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start continuous selection' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('scripting permission');
    expect(screen.getByRole('button', { name: 'Start continuous selection' })).toBeEnabled();
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Advanced'));
    fireEvent.click(screen.getByRole('button', { name: 'Native screen picker' }));
    await screen.findByText('#AABBCC');
    expect(api.browser.open).toHaveBeenCalledOnce();
    expect(close).not.toHaveBeenCalled();
  });
});
