import '@testing-library/jest-dom/vitest';
import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Popup from '../src/components/Popup';
import userEvent from '@testing-library/user-event';
import { deferred, mockBrowser } from './browserMocks';

describe('popup interactions', () => {
	it('restores the latest color and tracks only local storage changes', async () => {
		const browser = mockBrowser(['#123456', '#654321']);
		const view = render(<Popup />);
		fireEvent.click(screen.getByText('Advanced'));
		expect(await screen.findByText('#123456')).toBeInTheDocument();
		act(() => browser.emit(['#ABCDEF'], 'sync'));
		expect(screen.getByText('#123456')).toBeInTheDocument();
		act(() => browser.emit(['#ABCDEF']));
		expect(screen.getByText('#ABCDEF')).toBeInTheDocument();
		act(() => browser.emit([]));
		expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument();
		view.unmount();
		expect(browser.listeners.size).toBe(0);
	});

	it('cleans up subscriptions under StrictMode', async () => {
		const browser = mockBrowser(['#123456']);
		const view = render(<StrictMode><Popup /></StrictMode>);
		await screen.findByText('#123456');
		expect(browser.listeners.size).toBe(2);
		view.unmount();
		expect(browser.listeners.size).toBe(0);
	});

	it('reports a restoration failure', async () => {
		const browser = mockBrowser();
		browser.get.mockRejectedValue(new Error('Storage unavailable'));
		render(<Popup />);
		fireEvent.click(screen.getByText('Advanced'));
		expect(await screen.findByRole('alert')).toHaveTextContent('Could not load saved colors');
	});

	it('disables selection while opening and returns to ready after saving', async () => {
		const browser = mockBrowser();
		const selection = deferred<{ sRGBHex: string }>();
		browser.open.mockReturnValueOnce(selection.promise);
		render(<Popup />);
		fireEvent.click(screen.getByText('Advanced'));
		await act(async () => { });
		fireEvent.click(screen.getByRole('button', { name: 'Native screen picker' }));
		expect(screen.getByRole('button', { name: 'Picking…' })).toBeDisabled();
		await act(async () => { selection.resolve({ sRGBHex: '#abcdef' }); });
		expect(await screen.findByText('#ABCDEF')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Native screen picker' })).toBeEnabled();
		expect(browser.writeText).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Native screen picker' }));
		expect(await screen.findByText('#AABBCC')).toBeInTheDocument();
		expect(browser.open).toHaveBeenCalledTimes(2);
	});

	it('preserves the previous result after Escape and allows another selection', async () => {
		const browser = mockBrowser(['#123456']);
		browser.open.mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'));
		render(<Popup />);
		fireEvent.click(screen.getByText('Advanced'));
		await screen.findByText('#123456');
		fireEvent.click(screen.getByRole('button', { name: 'Native screen picker' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Native screen picker' })).toBeEnabled());
		expect(screen.getByText('#123456')).toBeInTheDocument();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(browser.writeText).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Native screen picker' }));
		await screen.findByText('#AABBCC');
	});

	it('reports selection failures and restores the button', async () => {
		const browser = mockBrowser();
		browser.open.mockRejectedValueOnce(new Error('Picker unavailable'));
		render(<Popup />);
		fireEvent.click(screen.getByText('Advanced'));
		await act(async () => { });
		fireEvent.click(screen.getByRole('button', { name: 'Native screen picker' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('Could not pick or save the color');
		expect(screen.getByRole('button', { name: 'Native screen picker' })).toBeEnabled();
	});

	it('blocks repeated copy while pending and for exactly two seconds after success', async () => {
		const browser = mockBrowser(['#123456']);
		const copy = deferred<void>();
		browser.writeText.mockReturnValueOnce(copy.promise);
		const view = render(<Popup />);
		fireEvent.click(screen.getByText('Advanced'));
		await screen.findByText('#123456');
		vi.useFakeTimers();
		fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
		expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled();
		fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
		expect(browser.writeText).toHaveBeenCalledExactlyOnceWith('#123456');
		await act(async () => { copy.resolve(); });
		expect(screen.getByRole('button', { name: 'Copied!' })).toBeDisabled();
		fireEvent.click(screen.getByRole('button', { name: 'Copied!' }));
		expect(browser.writeText).toHaveBeenCalledTimes(1);
		act(() => vi.advanceTimersByTime(1999));
		expect(screen.getByRole('button', { name: 'Copied!' })).toBeDisabled();
		act(() => vi.advanceTimersByTime(1));
		expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled();
		fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
		await act(async () => { });
		view.unmount();
		expect(vi.getTimerCount()).toBe(0);
	});

	it('resets copy feedback when a different color arrives', async () => {
		const browser = mockBrowser(['#123456']);
		render(<Popup />);
		fireEvent.click(screen.getByText('Advanced'));
		await screen.findByText('#123456');
		fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
		await screen.findByRole('button', { name: 'Copied!' });
		act(() => browser.emit(['#ABCDEF']));
		expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled();
		expect(screen.getByText('#ABCDEF')).toBeInTheDocument();
	});

	it('reports clipboard failure and lets the user retry', async () => {
		const user = userEvent.setup();
		const browser = mockBrowser(['#123456']);
		browser.writeText.mockRejectedValueOnce(new Error('Permission denied'));
		render(<Popup />);
		fireEvent.click(screen.getByText('Advanced'));
		await screen.findByText('#123456');
		await user.click(screen.getByRole('button', { name: 'Copy' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('Could not copy');
		expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled();
		await user.click(screen.getByRole('button', { name: 'Copy' }));
		await screen.findByRole('button', { name: 'Copied!' });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
