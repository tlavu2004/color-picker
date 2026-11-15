import { describe, expect, it } from 'vitest';
import { openSnapshot, refreshSnapshot, takeSnapshot } from '../src/services/snapshot';
import { pixelHex, pixelPosition } from '../src/snapshot/pixels';
import { mockSnapshot, sample, sessionId } from './snapshotMocks';
import { readHistory, saveColor } from '../src/services/pickColor';

describe('snapshot sessions and pixel mapping', () => {
  it('captures the source before opening a separate window and never persists the image locally', async () => {
    const api = mockSnapshot();
    await openSnapshot();
    expect(api.capture).toHaveBeenCalledWith(2, { format: 'png' });
    expect(api.set).toHaveBeenCalledOnce();
    expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'popup', url: expect.stringContaining('src/snapshot/index.html?session=') }));
    expect(api.capture.mock.invocationCallOrder[0]).toBeLessThan(api.create.mock.invocationCallOrder[0]);
    expect(api.browser.set).not.toHaveBeenCalled();
  });

  it('cleans temporary data when window creation fails', async () => {
    const api = mockSnapshot();
    api.create.mockRejectedValueOnce(new Error('Window blocked'));
    await expect(openSnapshot()).rejects.toThrow('Window blocked');
    expect(api.remove).toHaveBeenCalledWith(expect.stringContaining('color-picker-snapshot:'));
  });

  it('consumes a session once and rejects expired or invalid sessions', async () => {
    mockSnapshot();
    await expect(takeSnapshot(sessionId)).resolves.toMatchObject({ tabId: 7 });
    await expect(takeSnapshot(sessionId)).rejects.toThrow('expired');
    await expect(takeSnapshot('bad')).rejects.toThrow('invalid');
  });

  it('removes expired image data before creating a session', async () => {
    const api = mockSnapshot();
    api.stored['color-picker-snapshot:expired'] = { ...sample, capturedAt: Date.now() - 600000 };
    await openSnapshot();
    expect(api.remove).toHaveBeenCalledWith(['color-picker-snapshot:expired']);
  });

  it('refuses refresh when the source tab changed', async () => {
    const api = mockSnapshot();
    api.query.mockResolvedValueOnce([{ id: 8, windowId: 2, title: 'Other tab' }]);
    await expect(refreshSnapshot(sample)).rejects.toThrow('source tab changed');
    expect(api.capture).not.toHaveBeenCalled();
  });

  it('reports capture failure without opening a window', async () => {
    const api = mockSnapshot();
    api.capture.mockRejectedValueOnce(new Error('Permission denied'));
    await expect(openSnapshot()).rejects.toThrow('Permission denied');
    expect(api.create).not.toHaveBeenCalled();
    expect(api.set).not.toHaveBeenCalled();
  });

  it('does not open a view when temporary image storage exceeds its quota', async () => {
    const api = mockSnapshot();
    api.set.mockRejectedValueOnce(new Error('Session quota exceeded'));
    await expect(openSnapshot()).rejects.toThrow('Session quota exceeded');
    expect(api.create).not.toHaveBeenCalled();
  });

  it('migrates legacy history and retains ten distinct colors across both picking paths', async () => {
    const api = mockSnapshot();
    const legacy = Array.from({ length: 50 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`);
    api.browser.get.mockResolvedValueOnce({ colors: legacy });
    expect(await readHistory()).toHaveLength(10);
    await saveColor('#abcdef');
    expect(api.browser.colors()).toHaveLength(10);
    expect(api.browser.colors()[0]).toBe('#ABCDEF');
    await expect(saveColor('invalid')).rejects.toThrow('Invalid HEX');
  });

  it('maps scaled image coordinates and clamps edges to captured pixels', () => {
    const rect = { left: 10, top: 20, width: 100, height: 50 };
    expect(pixelPosition(60, 45, rect, 200, 100)).toEqual({ x: 100, y: 50 });
    expect(pixelPosition(110, 70, rect, 200, 100)).toEqual({ x: 199, y: 99 });
    expect(pixelPosition(0, 0, rect, 200, 100)).toEqual({ x: 0, y: 0 });
    expect(() => pixelPosition(0, 0, { ...rect, width: 0 }, 200, 100)).toThrow('not ready');
    expect(pixelHex(0, 128, 255)).toBe('#0080FF');
  });
});
