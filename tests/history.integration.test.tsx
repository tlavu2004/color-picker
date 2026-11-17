import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Popup from '../src/components/Popup';
import * as service from '../src/services/pickColor';
import { deferred, mockBrowser } from './browserMocks';

// The two PRs start independently from main. These cases activate when the
// history feature's service is present, including during integration checks.
const available = Object.hasOwn(service, 'readHistory');
const history = service as typeof service & {
  readHistory: () => Promise<string[]>;
  clearHistory: () => Promise<void>;
};

describe.skipIf(!available)('history feature integration', () => {
  it('normalizes legacy history and persists only the newest ten distinct colors', async () => {
    const browser = mockBrowser(['#abcdef', '#ABCDEF', 'invalid', ...Array.from({ length: 50 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`)]);
    const result = await history.readHistory();
    expect(result).toHaveLength(10);
    expect(result[0]).toBe('#ABCDEF');
    expect(new Set(result).size).toBe(10);
    expect(browser.colors()).toEqual(result);
  });

  it('displays ten legacy colors, selects an older swatch without copying, and clears history', async () => {
    const colors = Array.from({ length: 50 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`);
    const browser = mockBrowser(colors);
    render(<Popup />);
    await screen.findByText(colors[0]);
    await waitFor(() => expect(screen.getByRole('button', { name: `Select ${colors[1]}` })).toBeEnabled());
    expect(screen.getAllByRole('button', { name: /^Select #/ })).toHaveLength(10);
    fireEvent.click(screen.getByRole('button', { name: `Select ${colors[1]}` }));
    expect(screen.getByText(colors[1])).toBeInTheDocument();
    expect(browser.writeText).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    await screen.findByText('Pick a color to start your history.');
    expect(browser.colors()).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
  });

  it('moves a re-picked color first and keeps at most ten colors', async () => {
    const browser = mockBrowser(['#123456', '#AABBCC', ...Array.from({ length: 8 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`)]);
    await service.pickColor();
    expect(browser.colors()[0]).toBe('#AABBCC');
    expect(browser.colors()).toHaveLength(10);
    expect(browser.colors().filter(color => color === '#AABBCC')).toHaveLength(1);
  });

  it('preserves history and reports clear failure, then permits retry', async () => {
    const browser = mockBrowser(['#123456']);
    render(<Popup />);
    await screen.findByText('#123456');
    browser.set.mockRejectedValueOnce(new Error('Write failed'));
    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not clear history');
    expect(screen.getByText('#123456')).toBeInTheDocument();
    expect(browser.colors()).toEqual(['#123456']);
    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    await screen.findByText('Pick a color to start your history.');
  });

  it('blocks copy and selection while clearing history', async () => {
    const browser = mockBrowser(['#123456']);
    const operation = deferred<void>();
    render(<Popup />);
    await screen.findByText('#123456');
    browser.set.mockReturnValueOnce(operation.promise);
    fireEvent.click(screen.getByRole('button', { name: 'Clear history' }));
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pick Color' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Select #123456' })).toBeDisabled();
    await act(async () => { operation.resolve(); });
    expect(screen.getByText('Pick a color to start your history.')).toBeInTheDocument();
  });
});
