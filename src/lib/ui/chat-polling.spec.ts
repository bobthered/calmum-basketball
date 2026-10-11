import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startChatPolling } from './chat-polling.js';

let browser: EventTarget;
let connection: { onLine: boolean };
let page: EventTarget & { visibilityState: string };
let stop: (() => void) | undefined;

beforeEach(() => {
	vi.useFakeTimers();
	browser = new EventTarget();
	connection = { onLine: true };
	page = Object.assign(new EventTarget(), { visibilityState: 'visible' });
	vi.stubGlobal('document', page);
	vi.stubGlobal('navigator', connection);
	vi.stubGlobal('window', browser);
});

afterEach(() => {
	stop?.();
	stop = undefined;
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

describe('chat polling', () => {
	it('refreshes immediately and every five seconds, then stops on disposal', async () => {
		const refresh = vi.fn().mockResolvedValue(undefined);
		stop = startChatPolling(refresh);
		expect(refresh).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(5000);
		expect(refresh).toHaveBeenCalledTimes(2);
		stop();
		browser.dispatchEvent(new Event('online'));
		await vi.advanceTimersByTimeAsync(10000);
		expect(refresh).toHaveBeenCalledTimes(2);
	});

	it('pauses while hidden or offline and refreshes immediately on return', async () => {
		const refresh = vi.fn().mockResolvedValue(undefined);
		stop = startChatPolling(refresh);
		await vi.advanceTimersByTimeAsync(0);
		page.visibilityState = 'hidden';
		page.dispatchEvent(new Event('visibilitychange'));
		await vi.advanceTimersByTimeAsync(15000);
		expect(refresh).toHaveBeenCalledTimes(1);
		page.visibilityState = 'visible';
		page.dispatchEvent(new Event('visibilitychange'));
		expect(refresh).toHaveBeenCalledTimes(2);
		connection.onLine = false;
		browser.dispatchEvent(new Event('offline'));
		await vi.advanceTimersByTimeAsync(15000);
		expect(refresh).toHaveBeenCalledTimes(2);
		connection.onLine = true;
		browser.dispatchEvent(new Event('online'));
		expect(refresh).toHaveBeenCalledTimes(3);
	});

	it('pauses in the back-forward cache and resumes on pageshow', async () => {
		const refresh = vi.fn().mockResolvedValue(undefined);
		stop = startChatPolling(refresh);
		browser.dispatchEvent(new Event('pagehide'));
		await vi.advanceTimersByTimeAsync(15000);
		expect(refresh).toHaveBeenCalledTimes(1);
		browser.dispatchEvent(new Event('pageshow'));
		expect(refresh).toHaveBeenCalledTimes(2);
	});

	it('avoids overlapping slow requests and honors a pending resume', async () => {
		let finish = () => {};
		const refresh = vi
			.fn()
			.mockImplementationOnce(
				() =>
					new Promise<void>((resolve) => {
						finish = resolve;
					})
			)
			.mockResolvedValue(undefined);
		stop = startChatPolling(refresh);
		await vi.advanceTimersByTimeAsync(15000);
		browser.dispatchEvent(new Event('online'));
		expect(refresh).toHaveBeenCalledTimes(1);
		finish();
		await vi.advanceTimersByTimeAsync(0);
		expect(refresh).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(5000);
		expect(refresh).toHaveBeenCalledTimes(3);
	});

	it('retries failed requests without leaving an open request', async () => {
		const refresh = vi
			.fn()
			.mockRejectedValueOnce(new Error('Offline'))
			.mockResolvedValue(undefined);
		stop = startChatPolling(refresh);
		await vi.advanceTimersByTimeAsync(5000);
		expect(refresh).toHaveBeenCalledTimes(2);
	});
});
