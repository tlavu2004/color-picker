import { describe, expect, it, vi } from 'vitest';
import { pickColor } from '../src/services/pickColor';
import { mockBrowser } from './browserMocks';

describe('native color selection and storage', () => {
  it('opens immediately, normalizes HEX, moves duplicates first and does not copy', async () => {
    const browser = mockBrowser(['#123456', '#AABBCC']);
    const result = pickColor();
    expect(browser.open).toHaveBeenCalledOnce();
    expect(browser.get).not.toHaveBeenCalled();
    await expect(result).resolves.toBe('#AABBCC');
    expect(browser.colors()).toEqual(['#AABBCC', '#123456']);
    expect(browser.writeText).not.toHaveBeenCalled();
  });

  it('keeps newest entries and discards older colors beyond the history limit', async () => {
    const oldColors = Array.from({ length: 60 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`);
    const browser = mockBrowser(oldColors);
    await pickColor();
    const result = browser.colors();
    // This baseline stores 50. The independent feature PR lowers the limit to 10.
    // Both retain the same newest-first, bounded-history contract.
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).toBe('#AABBCC');
    expect(result.slice(1)).toEqual(oldColors.slice(0, result.length - 1));
    expect(result).not.toContain(oldColors[59]);
  });

  it('cancels without writing storage or clipboard', async () => {
    const browser = mockBrowser(['#123456']);
    browser.open.mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'));
    await expect(pickColor()).resolves.toBeNull();
    expect(browser.set).not.toHaveBeenCalled();
    expect(browser.writeText).not.toHaveBeenCalled();
  });

  it('reports unsupported browsers without reading storage', async () => {
    const browser = mockBrowser();
    vi.stubGlobal('EyeDropper', undefined);
    await expect(pickColor()).rejects.toThrow(/EyeDropper support/);
    expect(browser.get).not.toHaveBeenCalled();
  });

  it('reports native failures without overwriting history', async () => {
    const browser = mockBrowser(['#123456']);
    browser.open.mockRejectedValueOnce(new DOMException('Unavailable', 'OperationError'));
    await expect(pickColor()).rejects.toThrow('Unavailable');
    expect(browser.colors()).toEqual(['#123456']);
    expect(browser.set).not.toHaveBeenCalled();
  });

  it('reports read failures', async () => {
    const browser = mockBrowser();
    browser.get.mockRejectedValueOnce(new Error('Read failed'));
    await expect(pickColor()).rejects.toThrow('Read failed');
    expect(browser.set).not.toHaveBeenCalled();
  });

  it('reports write failures without claiming success', async () => {
    const browser = mockBrowser(['#123456']);
    browser.set.mockRejectedValueOnce(new Error('Write failed'));
    await expect(pickColor()).rejects.toThrow('Write failed');
    expect(browser.colors()).toEqual(['#123456']);
  });
});
