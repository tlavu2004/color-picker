import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { installOverlay, stopOverlay } from '../src/content/overlay';
import { deferred, mockBrowser } from './browserMocks';

const viewport = { width: 100, height: 80, scale: 1 };
const imageData = 'data:image/png;base64,AA==';

function setup(decode = true) {
  const api = mockBrowser();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 100 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 80 });
  vi.stubGlobal('visualViewport', Object.assign(new EventTarget(), { scale: 1 }));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id));
  const context = {
    drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([255, 0, 0, 255]) })),
    fillRect: vi.fn(), strokeRect: vi.fn(), imageSmoothingEnabled: true,
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 80, right: 100, bottom: 80, x: 0, y: 0, toJSON: () => ({}) });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(CSSStyleSheet.prototype, 'replaceSync', { configurable: true, value: vi.fn() });
  const roots: ShadowRoot[] = [];
  const attach = Element.prototype.attachShadow;
  vi.spyOn(Element.prototype, 'attachShadow').mockImplementation(function (this: Element, options) {
    const root = attach.call(this, options);
    roots.push(root);
    return root;
  });
  vi.stubGlobal('createImageBitmap', vi.fn(async () => {
    if (!decode) throw new Error('Decode failed');
    return { width: 200, height: 160, close: vi.fn() };
  }));
  return { api, context, roots };
}

afterEach(() => {
  stopOverlay();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
});

describe('on-tab frozen picker', () => {
  it('shows a saved-color swatch only after persistence and keeps it on failed saves', async () => {
    const { roots, api, context } = setup();
    await installOverlay(imageData, viewport, true);
    const swatch = roots[0].querySelector('.saved-swatch') as HTMLElement;
    expect(swatch).toHaveAttribute('hidden');
    const save = deferred<void>();
    api.set.mockReturnValueOnce(save.promise);
    fireEvent.click(roots[0].querySelector('canvas')!, { clientX: 20, clientY: 20 });
    await waitFor(() => expect(api.set).toHaveBeenCalled());
    expect(swatch).toHaveAttribute('hidden');
    save.resolve();
    await waitFor(() => expect(swatch).not.toHaveAttribute('hidden'));
    expect(swatch.style.backgroundColor).toBe('rgb(255, 0, 0)');
    api.set.mockRejectedValueOnce(new Error('Denied'));
    context.getImageData.mockReturnValueOnce({ data: new Uint8ClampedArray([0, 255, 0, 255]) });
    fireEvent.click(roots[0].querySelector('canvas')!, { clientX: 30, clientY: 30 });
    await waitFor(() => expect(roots[0].querySelector('[role=alert]')).toHaveTextContent('Could not save'));
    expect(swatch.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(api.writeText).not.toHaveBeenCalled();
  });
  it('uses a closed shadow root and displays a persistent non-smoothed magnifier', async () => {
    const { roots, context, api } = setup();
    await installOverlay(imageData, viewport, true);
    const host = document.querySelector('dialog[data-color-picker-overlay]');
    expect(host).toHaveAttribute('open');
    expect(host?.shadowRoot).toBeNull();
    expect(roots[0].querySelector('.loupe')).not.toHaveAttribute('hidden');
    expect(context.imageSmoothingEnabled).toBe(false);
    expect(context.strokeRect).toHaveBeenCalled();
    expect(api.writeText).not.toHaveBeenCalled();
  });

  it('maps each click directly to the captured pixels and serializes rapid saves', async () => {
    const { roots, context, api } = setup();
    await installOverlay(imageData, viewport, true);
    const canvas = roots[0].querySelector('canvas')!;
    fireEvent.click(canvas, { clientX: 20, clientY: 30 });
    context.getImageData.mockReturnValueOnce({ data: new Uint8ClampedArray([0, 255, 0, 255]) });
    fireEvent.click(canvas, { clientX: 30, clientY: 40 });
    context.getImageData.mockReturnValueOnce({ data: new Uint8ClampedArray([0, 0, 255, 255]) });
    fireEvent.click(canvas, { clientX: 40, clientY: 50 });
    await waitFor(() => expect(api.colors()).toEqual(['#0000FF', '#00FF00', '#FF0000']));
    expect(context.getImageData).toHaveBeenCalledWith(40, 60, 1, 1);
    expect(document.querySelector('dialog')).toBeInTheDocument();
    expect(api.writeText).not.toHaveBeenCalled();
  });

  it('retains only ten normalized colors and reports storage failures without ending the session', async () => {
    const { roots, api } = setup();
    api.get.mockResolvedValueOnce({ colors: Array.from({ length: 50 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`) });
    await installOverlay(imageData, viewport, true);
    const canvas = roots[0].querySelector('canvas')!;
    fireEvent.click(canvas, { clientX: 20, clientY: 20 });
    await waitFor(() => expect(api.colors()).toHaveLength(10));
    api.set.mockRejectedValueOnce(new Error('Denied'));
    fireEvent.click(canvas, { clientX: 20, clientY: 20 });
    await waitFor(() => expect(roots[0].querySelector('[role=alert]')).toHaveTextContent('Could not save'));
    fireEvent.click(canvas, { clientX: 20, clientY: 20 });
    await waitFor(() => expect(roots[0].querySelector('[role=alert]')).toBeEmptyDOMElement());
    expect(document.querySelector('dialog')).toBeInTheDocument();
  });

  it('Escape removes the overlay, magnifier and callbacks while preserving saved colors', async () => {
    const { roots, api } = setup();
    await installOverlay(imageData, viewport, true);
    fireEvent.click(roots[0].querySelector('canvas')!, { clientX: 20, clientY: 20 });
    await waitFor(() => expect(api.colors()).toEqual(['#FF0000']));
    const key = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    window.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(true);
    expect(document.querySelector('dialog')).not.toBeInTheDocument();
    expect(api.colors()).toEqual(['#FF0000']);
    expect(api.writeText).not.toHaveBeenCalled();
    expect(stopOverlay()).toEqual(viewport);
  });

  it('Stop removes the overlay and restores previous focus', async () => {
    const { roots } = setup();
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();
    await installOverlay(imageData, viewport, true);
    fireEvent.click(roots[0].querySelector('button')!);
    expect(document.querySelector('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(button);
    button.remove();
  });

  it('does not stack sessions and exits on viewport changes', async () => {
    setup();
    await installOverlay(imageData, viewport, true);
    await installOverlay(imageData, viewport, true);
    expect(document.querySelectorAll('dialog')).toHaveLength(1);
    window.dispatchEvent(new Event('resize'));
    expect(document.querySelector('dialog')).not.toBeInTheDocument();
  });

  it('moves controls without saving a pixel and blocks wheel scrolling', async () => {
    const { roots, api } = setup();
    await installOverlay(imageData, viewport, true);
    const panel = roots[0].querySelector('.panel') as HTMLElement;
    const move = roots[0].querySelectorAll('button')[1];
    expect(move.textContent).toBe('Move to next corner');
    fireEvent.click(move);
    expect(panel.style.right).toBe('12px');
    expect(panel.style.top).toBe('12px');
    fireEvent.click(move);
    expect(panel.style.right).toBe('12px');
    expect(panel.style.bottom).toBe('12px');
    fireEvent.click(move);
    expect(panel.style.left).toBe('12px');
    expect(panel.style.bottom).toBe('12px');
    fireEvent.click(move);
    expect(panel.style.left).toBe('12px');
    expect(panel.style.top).toBe('12px');
    expect(api.set).not.toHaveBeenCalled();
    const wheel = new WheelEvent('wheel', { cancelable: true, bubbles: true });
    roots[0].querySelector('canvas')!.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
  });

  it('times out a stalled decode without leaving listeners or a session', async () => {
    setup();
    vi.useFakeTimers();
    vi.stubGlobal('createImageBitmap', () => new Promise(() => {}));
    const result = expect(installOverlay(imageData, viewport, true)).rejects.toThrow('cancelled');
    vi.advanceTimersByTime(15000);
    await result;
    expect(document.querySelector('dialog')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects changed viewport and decoding failures without leaving an overlay', async () => {
    setup(false);
    await expect(installOverlay(imageData, { ...viewport, width: 99 })).rejects.toThrow('viewport changed');
    await expect(installOverlay(imageData, viewport, true)).rejects.toThrow('decode');
    expect(document.querySelector('dialog')).not.toBeInTheDocument();
  });

  it('remains self-contained when serialized for scripting.executeScript', async () => {
    setup();
    const injected = new Function(`return (${installOverlay.toString()})`)() as typeof installOverlay;
    await injected(imageData, viewport);
    expect(document.querySelector('dialog')).toBeInTheDocument();
    const remove = new Function(`return (${stopOverlay.toString()})`)() as typeof stopOverlay;
    remove();
    expect(document.querySelector('dialog')).not.toBeInTheDocument();
  });

  it('uses the same magnifier in single mode and accepts only one click until save completes', async () => {
    const { roots, api } = setup();
    await installOverlay(imageData, viewport, false);
    expect(roots[0].querySelector('.loupe')).not.toHaveAttribute('hidden');
    const canvas = roots[0].querySelector('canvas')!;
    fireEvent.click(canvas, { clientX: 20, clientY: 20 });
    fireEvent.click(canvas, { clientX: 60, clientY: 60 });
    await waitFor(() => expect(document.querySelector('dialog')).not.toBeInTheDocument());
    expect(api.set).toHaveBeenCalledTimes(1);
    expect(api.colors()).toEqual(['#FF0000']);
    expect(api.writeText).not.toHaveBeenCalled();
  });

  it('keeps single mode open after save failure and closes after successful retry', async () => {
    const { roots, api } = setup();
    api.set.mockRejectedValueOnce(new Error('Storage full'));
    await installOverlay(imageData, viewport, false);
    const canvas = roots[0].querySelector('canvas')!;
    fireEvent.click(canvas, { clientX: 20, clientY: 20 });
    await waitFor(() => expect(roots[0].querySelector('[role=alert]')).toHaveTextContent('Could not save'));
    expect(document.querySelector('dialog')).toBeInTheDocument();
    expect(roots[0].querySelector('[role=status]')).toHaveTextContent('Not saved');
    fireEvent.click(canvas, { clientX: 20, clientY: 20 });
    await waitFor(() => expect(document.querySelector('dialog')).not.toBeInTheDocument());
    expect(api.colors()).toEqual(['#FF0000']);
  });

  it('cancels single mode without saving or copying', async () => {
    const { api } = setup();
    await installOverlay(imageData, viewport, false);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('dialog')).not.toBeInTheDocument();
    expect(api.set).not.toHaveBeenCalled();
    expect(api.writeText).not.toHaveBeenCalled();
  });

  it('notifies popup return only after the single-color save is persisted', async () => {
    const { roots, api } = setup();
    const sendMessage = vi.fn(async () => ({ ok: true }));
    Object.assign(chrome, { runtime: { sendMessage } });
    await installOverlay(imageData, viewport, false, 'session');
    fireEvent.click(roots[0].querySelector('canvas')!, { clientX: 20, clientY: 20 });
    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: 'PICKER_FINISHED', sessionId: 'session', reason: 'selected' }));
    expect(sendMessage.mock.invocationCallOrder[0]).toBeGreaterThan(api.set.mock.invocationCallOrder[0]);
    expect(api.colors()).toEqual(['#FF0000']);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('waits for pending writes before notifying cancellation', async () => {
    const { roots, api } = setup();
    const save = deferred<void>();
    api.set.mockReturnValueOnce(save.promise);
    const sendMessage = vi.fn(async () => ({ ok: true }));
    Object.assign(chrome, { runtime: { sendMessage } });
    await installOverlay(imageData, viewport, true, 'session');
    fireEvent.click(roots[0].querySelector('canvas')!, { clientX: 20, clientY: 20 });
    await waitFor(() => expect(api.set).toHaveBeenCalled());
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('dialog')).not.toBeInTheDocument();
    expect(sendMessage).not.toHaveBeenCalled();
    save.resolve();
    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: 'PICKER_FINISHED', sessionId: 'session', reason: 'cancelled' }));
  });

  it('marks viewport cleanup as abandonment instead of requesting popup return', async () => {
    setup();
    const sendMessage = vi.fn(async () => ({ ok: true }));
    Object.assign(chrome, { runtime: { sendMessage } });
    await installOverlay(imageData, viewport, true, 'session');
    window.dispatchEvent(new Event('resize'));
    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: 'PICKER_FINISHED', sessionId: 'session', reason: 'abandoned' }));
  });
});
