import { page } from 'vitest/browser';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { calendar, scheduledDates } from '#lib/state/index.js';
const mocks = vi.hoisted(() => ({ update: vi.fn(), refresh: vi.fn() }));
vi.mock('#lib/remote/find-calendar.remote.js', () => ({
	findCalendar: () =>
		Object.assign(Promise.resolve([{ date: '2026-01-15' }, { date: '2026-01-22' }]), {
			refresh: mocks.refresh
		})
}));
vi.mock('#lib/remote/update-calendar.remote.js', () => ({ updateCalendar: mocks.update }));
import Calendar from './Calendar.svelte';
import '../../app.css';

beforeEach(() => {
	vi.clearAllMocks();
	calendar.currentDate = new Date(2026, 0, 31);
	scheduledDates.value = [];
	mocks.refresh.mockResolvedValue(undefined);
	mocks.update.mockResolvedValue({ success: true });
});
afterEach(() => {
	cleanup();
	scheduledDates.value = [];
});

it('shows scheduled dates read-only and navigates months without skipping February', async () => {
	render(Calendar);
	const date = page.getByRole('button', { name: 'Thursday, January 15, 2026', exact: true });
	await expect.element(date).toHaveAttribute('aria-disabled', 'true');
	await vi.waitFor(() => expect(scheduledDates.value).toEqual(['2026-01-15', '2026-01-22']));
	for (const key of ['2026-01-15', '2026-01-16']) {
		const day = document.querySelector<HTMLButtonElement>(`[data-calendar-date="${key}"]`)!;
		const style = getComputedStyle(day);
		expect(style.borderTopWidth).toBe('0px');
		expect(style.getPropertyValue('--tw-ring-shadow')).toContain('1px');
		expect(style.getPropertyValue('--tw-inset-ring-shadow').trim()).toBe('0 0 #0000');
	}
	expect(
		document.querySelector('[data-calendar-date="2026-01-15"] span')?.getAttribute('title')
	).toBe('Basketball scheduled');
	document.querySelector<HTMLButtonElement>('[data-calendar-date="2026-01-15"]')!.click();
	expect(mocks.update).not.toHaveBeenCalled();
	await page.getByRole('button', { name: 'Next month' }).click();
	await expect.element(page.getByText('February 2026', { exact: true })).toBeVisible();
	expect(calendar.currentDate.getMonth()).toBe(1);
});

it('uses one ring for today, with a different color from ordinary dates', async () => {
	calendar.currentDate = new Date();
	render(Calendar);
	await vi.waitFor(() => expect(scheduledDates.value).toHaveLength(2));
	const today = document.querySelector<HTMLButtonElement>(
		'[data-calendar-date][aria-current="date"]'
	)!;
	const other = document.querySelector<HTMLButtonElement>(
		'[data-calendar-date]:not([aria-current])'
	)!;
	const todayStyle = getComputedStyle(today);
	const otherStyle = getComputedStyle(other);
	expect(todayStyle.borderTopWidth).toBe('0px');
	expect(todayStyle.getPropertyValue('--tw-ring-shadow')).toContain('1px');
	expect(todayStyle.getPropertyValue('--tw-inset-ring-shadow').trim()).toBe('0 0 #0000');
	expect(todayStyle.getPropertyValue('--tw-ring-color')).not.toBe(
		otherStyle.getPropertyValue('--tw-ring-color')
	);
});

it('lets an administrator toggle the same scheduled day off and back on', async () => {
	render(Calendar, { isEditable: true });
	const date = page.getByRole('button', { name: 'Thursday, January 15, 2026', exact: true });
	await expect.element(date).toHaveAttribute('aria-disabled', 'false');
	await date.click();
	await vi.waitFor(() => expect(scheduledDates.value).toEqual(['2026-01-22']));
	expect(mocks.update).toHaveBeenLastCalledWith({ date: '2026-01-15', isScheduled: false });
	await date.click();
	await vi.waitFor(() => expect(scheduledDates.value).toContain('2026-01-15'));
	expect(mocks.update).toHaveBeenLastCalledWith({ date: '2026-01-15', isScheduled: true });
});

it('keeps scheduled dates intact when an administrator save fails', async () => {
	mocks.update.mockRejectedValueOnce(new Error('Network unavailable'));
	render(Calendar, { isEditable: true });
	const date = page.getByRole('button', { name: 'Thursday, January 15, 2026', exact: true });
	await expect.element(date).toHaveAttribute('aria-disabled', 'false');
	await date.click();
	await expect
		.element(page.getByRole('alert'))
		.toHaveTextContent('Could not save the schedule. The date has not changed; please try again.');
	expect(scheduledDates.value).toEqual(['2026-01-15', '2026-01-22']);
	await expect.element(date).toHaveAttribute('aria-disabled', 'false');
});
