import { afterEach, describe, expect, it, vi } from 'vitest';
import { LiveSignal } from './live-signal.js';

afterEach(() => vi.useRealTimers());
describe('live conversation wakeups', () => {
	it('wakes all connected users and removes their listeners', async () => {
		const hub = new LiveSignal();
		const signal = new AbortController().signal;
		const first = hub.wait(0, signal);
		const second = hub.wait(0, signal);
		expect(hub.listenerCount).toBe(2);
		hub.notify();
		await Promise.all([first, second]);
		expect(hub.listenerCount).toBe(0);
	});
	it('does not miss a save that happens before a subscriber starts waiting', async () => {
		const hub = new LiveSignal();
		const revision = hub.revision;
		hub.notify();
		await hub.wait(revision, new AbortController().signal);
		expect(hub.listenerCount).toBe(0);
	});
	it('cleans up a disconnected user without waiting for another message', async () => {
		const hub = new LiveSignal();
		const controller = new AbortController();
		const waiting = hub.wait(0, controller.signal);
		controller.abort();
		await waiting;
		expect(hub.listenerCount).toBe(0);
	});
	it('wakes for database reconciliation even without local writes', async () => {
		vi.useFakeTimers();
		const hub = new LiveSignal();
		const waiting = hub.wait(0, new AbortController().signal);
		await vi.advanceTimersByTimeAsync(5000);
		await waiting;
		expect(hub.listenerCount).toBe(0);
	});
});
