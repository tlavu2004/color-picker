import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Popup from '../src/components/Popup';
import { messages, parsePreference, resolveLanguage } from '../src/i18n/messages';

function browser(language: unknown = 'auto', browserLanguage = 'en-US') {
  Object.defineProperty(navigator, 'language', { configurable: true, value: browserLanguage });
  const state: Record<string, unknown> = { language, colors: ['#123456'] };
  const listeners = new Set<(changes: Record<string, chrome.storage.StorageChange>, area: string) => void>();
  const get = vi.fn(async (defaults: Record<string, unknown>) => ({ ...defaults, ...state }));
  const set = vi.fn(async (changes: Record<string, unknown>) => {
    Object.assign(state, changes);
    const event = Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, { newValue: value }]));
    listeners.forEach(listener => listener(event, 'local'));
  });
  vi.stubGlobal('chrome', { storage: { local: { get, set }, onChanged: {
    addListener: (listener: (changes: Record<string, chrome.storage.StorageChange>, area: string) => void) => listeners.add(listener),
    removeListener: (listener: (changes: Record<string, chrome.storage.StorageChange>, area: string) => void) => listeners.delete(listener),
  } } });
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  return { state, get, set, listeners, writeText };
}

describe('language selection', () => {
  it('resolves auto Vietnamese and falls back to English for unsupported locales', () => {
    expect(resolveLanguage('auto', 'vi-VN')).toBe('vi');
    expect(resolveLanguage('auto', 'fr-FR')).toBe('en');
    expect(resolveLanguage('en', 'vi-VN')).toBe('en');
    expect(parsePreference('bad')).toBe('auto');
    expect(Object.keys(messages.vi)).toEqual(Object.keys(messages.en));
  });

  it('uses browser language, persists English choice, and restores it on reopen', async () => {
    const api = browser('auto', 'vi-VN');
    const view = render(<Popup />);
    await screen.findByRole('button', { name: 'Chọn màu' });
    expect(document.documentElement.lang).toBe('vi');
    fireEvent.change(screen.getByRole('combobox', { name: 'Ngôn ngữ' }), { target: { value: 'en' } });
    await screen.findByRole('button', { name: 'Pick Color' });
    expect(api.state.language).toBe('en');
    expect(api.writeText).not.toHaveBeenCalled();
    view.unmount();
    expect(api.listeners.size).toBe(0);
    render(<Popup />);
    await screen.findByRole('button', { name: 'Pick Color' });
    expect(document.documentElement.lang).toBe('en');
  });

  it('translates copy feedback and resets it after two seconds', async () => {
    const api = browser('vi');
    render(<Popup />);
    await screen.findByRole('button', { name: 'Sao chép' });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép' }));
    await act(async () => {});
    expect(screen.getByRole('button', { name: 'Đã chép!' })).toBeDisabled();
    expect(api.writeText).toHaveBeenCalledWith('#123456');
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('button', { name: 'Sao chép' })).toBeEnabled();
  });

  it('shows translated language-save errors and keeps the previous preference', async () => {
    const api = browser('vi');
    render(<Popup />);
    await screen.findByRole('combobox', { name: 'Ngôn ngữ' });
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('vi'));
    api.set.mockRejectedValueOnce(new Error('Denied'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể lưu ngôn ngữ');
    expect(screen.getByRole('combobox')).toHaveValue('vi');
  });

  it('responds to browser-language changes in Auto mode', async () => {
    browser('auto', 'en-US');
    render(<Popup />);
    await screen.findByRole('button', { name: 'Pick Color' });
    Object.defineProperty(navigator, 'language', { configurable: true, value: 'vi-VN' });
    act(() => window.dispatchEvent(new Event('languagechange')));
    expect(screen.getByRole('button', { name: 'Chọn màu' })).toBeInTheDocument();
  });
});
