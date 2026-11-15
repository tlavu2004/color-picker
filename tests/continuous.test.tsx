import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Popup from '../src/components/Popup';
import { SnapshotPicker } from '../src/snapshot/SnapshotPicker';
import { mockSnapshot, sample, sessionId } from './snapshotMocks';

function readyCanvas() {
  const context = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([255, 0, 0, 255]) })),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
  vi.stubGlobal('Image', class {
    naturalWidth = 200;
    naturalHeight = 200;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) { queueMicrotask(() => this.onload?.()); }
  });
  window.history.replaceState({}, '', `/?session=${sessionId}`);
  return context;
}

describe('continuous snapshot selection', () => {
  it('defaults off and starts capture only after explicitly enabling the toggle', async () => {
    const api = mockSnapshot();
    render(<Popup />);
    const toggle = screen.getByRole('checkbox', { name: 'Continuous selection from tab snapshot' });
    expect(toggle).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Pick Color' })).toBeInTheDocument();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name: 'Capture tab and pick' }));
    await waitFor(() => expect(api.create).toHaveBeenCalledOnce());
    expect(api.browser.open).not.toHaveBeenCalled();
  });

  it('saves multiple selected pixels without closing or auto-copying; Escape stops', async () => {
    const api = mockSnapshot();
    const context = readyCanvas();
    render(<SnapshotPicker />);
    await screen.findByText('Ready. Click any pixel in the image.');
    const canvas = screen.getByLabelText('Captured tab image');
    fireEvent.click(canvas, { clientX: 25, clientY: 50 });
    await screen.findByText('#FF0000', { selector: 'strong' });
    expect(context.getImageData).toHaveBeenCalledWith(50, 100, 1, 1);
    context.getImageData.mockReturnValueOnce({ data: new Uint8ClampedArray([0, 255, 0, 255]) });
    fireEvent.click(canvas, { clientX: 50, clientY: 50 });
    await screen.findByText('#00FF00', { selector: 'strong' });
    context.getImageData.mockReturnValueOnce({ data: new Uint8ClampedArray([0, 0, 255, 255]) });
    fireEvent.click(canvas, { clientX: 75, clientY: 75 });
    await screen.findByText('#0000FF', { selector: 'strong' });
    expect(api.browser.colors()).toEqual(['#0000FF', '#00FF00', '#FF0000']);
    expect(api.browser.writeText).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('status')).toHaveTextContent('Selection stopped');
    expect(screen.queryByLabelText('Captured tab image')).not.toBeInTheDocument();
    expect(api.browser.colors()).toEqual(['#0000FF', '#00FF00', '#FF0000']);
  });

  it('keeps the session usable after storage failure and copies only explicitly', async () => {
    const api = mockSnapshot();
    readyCanvas();
    render(<SnapshotPicker />);
    await screen.findByText('Ready. Click any pixel in the image.');
    api.browser.set.mockRejectedValueOnce(new Error('Storage full'));
    fireEvent.click(screen.getByLabelText('Captured tab image'), { clientX: 20, clientY: 20 });
    expect(await screen.findByRole('alert')).toHaveTextContent('Storage full');
    fireEvent.click(screen.getByLabelText('Captured tab image'), { clientX: 20, clientY: 20 });
    await screen.findByText('#FF0000', { selector: 'strong' });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await act(async () => {});
    expect(api.browser.writeText).toHaveBeenCalledWith('#FF0000');
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeDisabled();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled();
  });

  it('refreshes from the original source window without opening another selection view', async () => {
    const api = mockSnapshot();
    readyCanvas();
    render(<SnapshotPicker />);
    await screen.findByText('Ready. Click any pixel in the image.');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh snapshot' }));
    await waitFor(() => expect(api.capture).toHaveBeenCalledWith(sample.windowId, { format: 'png' }));
    await screen.findByText('Ready. Click any pixel in the image.');
    expect(api.create).not.toHaveBeenCalled();
  });
});
