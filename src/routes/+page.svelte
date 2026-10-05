<script lang="ts">
	import { Minus, Plus } from '@lucide/svelte';
	import { twMerge } from 'tailwind-merge';
	import { Button, Card, Div, H1, Spinner, Toast, Toaster } from '#components';
	import { subtleReveal } from 'sveltewind/transitions';
	import type { ToastItem } from 'sveltewind/components';
	import { findUserCalendarStatus } from '#lib/remote/find-user-calendar-status.remote.js';
	import { updateUserCalendarStatus } from '#lib/remote/update-user-calendar-status.remote.js';
	import { scheduledDates, user } from '#lib/state/index.js';

	// $state
	let isRowsPending = $state(true);
	let isAttendancePending = $state(false);
	let toasts: ToastItem[] = $state([]);
	let rows: any[] = $state([]);
	let timestamp = $state(new Date().getTime());

	// variables
	const statuses = [
		{
			className:
				'bg-green-500 hover:bg-green-600 focus:bg-green-600 focus:outline-green-500/30 dark:focus:outline-green-500/30 ',
			emoji: '👍',
			status: 'Yes'
		},
		{
			className:
				'bg-amber-500 hover:bg-amber-600 focus:bg-amber-600 focus:outline-amber-500/30 dark:focus:outline-amber-500/30 ',
			emoji: '🤷',
			status: 'Maybe'
		},
		{
			className:
				'bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:outline-red-500/30 dark:focus:outline-red-500/30 ',
			emoji: '👎',
			status: 'No'
		}
	];
	const step = () => {
		timestamp = new Date().getTime();
		requestAnimationFrame(step);
	};
	const updateRows = async () => {
		try {
			const query = findUserCalendarStatus({ date: dateString });
			await query.refresh();
			const result = await query;
			if (result.success) {
				rows = result.rows.sort((a: any, b: any) =>
					`${a._userId.firstName} ${b._userId.lastName}`.localeCompare(
						`${b._userId.firstName} ${b._userId.lastName}`
					)
				);
				isRowsPending = false;
			}
		} catch (error) {}
	};

	// $derives
	const allRows = $derived.by(() => {
		let allRows: { name: string; status: string }[] = [];
		for (const row of rows) {
			allRows.push({
				name: `${row._userId.firstName} ${row._userId.lastName}`,
				status: row.status
			});
			if (row.numberOfGuests > 0) {
				for (let i = 0; i < row.numberOfGuests; i++) {
					allRows.push({
						name: `${row._userId.firstName} ${row._userId.lastName} Guest ${i + 1}`,
						status: 'Yes'
					});
				}
			}
		}
		allRows.sort((a, b) => a.name.localeCompare(b.name));
		return allRows;
	});
	const answer = $derived.by(
		() => (rows.filter(({ _userId: { _id } }) => _id === user?.value?._id) ?? [])[0]
	);
	const numberOfGuests = $derived(answer?.numberOfGuests ?? 0);
	async function saveAttendance(status: string, guests: number) {
		if (!user.value || isRowsPending || isAttendancePending || guests < 0) return;
		isAttendancePending = true;
		toasts = [{ id: 'attendance', message: 'Saving attendance...', status: 'info', duration: 0 }];
		const previousRows = $state.snapshot(rows);
		const account = $state.snapshot(user.value);
		const nextAnswer = { ...answer, _userId: account, status, numberOfGuests: guests };
		rows = answer
			? rows.map((row) => (row._userId._id === account._id ? nextAnswer : row))
			: [...rows, nextAnswer];
		try {
			const result = await updateUserCalendarStatus({
				_userId: account._id,
				date: dateString,
				numberOfGuests: guests,
				status
			});
			if (!result.success) throw new Error('Save failed');
			toasts = [
				{ id: 'attendance', message: 'Attendance saved.', status: 'success', duration: 2500 }
			];
		} catch {
			rows = previousRows;
			toasts = [
				{
					id: 'attendance',
					message: 'Could not save your attendance or guests. Please try again.',
					status: 'error',
					duration: 0
				}
			];
		} finally {
			isAttendancePending = false;
		}
	}
	const committed = $derived.by(() =>
		allRows.reduce((total, { status }) => {
			if (status === 'Yes') total++;
			return total;
		}, 0)
	);
	const date = $derived.by(() => new Date());
	const dateString = $derived.by(() => {
		const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
		return formattedDate;
	});
	const isAnswered = $derived.by(() => answer !== undefined);
	const listDates = $derived.by(() =>
		scheduledDates.value
			.map((dateString) => {
				const [year, month, day] = dateString.split('-').map(Number);
				const date = new Date(year, month - 1, day);
				return date;
			})
			.filter((date) => date.getTime() >= new Date().getTime())
			.sort((a, b) => a.getTime() - b.getTime())
	);
	const maybies = $derived.by(() =>
		allRows.reduce((total, { status }) => {
			if (status === 'Maybe') total++;
			return total;
		}, 0)
	);
	const nextBasketballDate = $derived.by(() => {
		return new Date(listDates[0]);
	});
	const timeRemaining = $derived.by(() => {
		let remainingMilliseconds = new Date(nextBasketballDate).getTime() - timestamp;

		const days = Math.floor(remainingMilliseconds / 1000 / 60 / 60 / 24);
		remainingMilliseconds -= days * 1000 * 60 * 60 * 24;

		const hours = Math.floor(remainingMilliseconds / 1000 / 60 / 60);
		remainingMilliseconds -= hours * 1000 * 60 * 60;

		const minutes = Math.floor(remainingMilliseconds / 1000 / 60);
		remainingMilliseconds -= minutes * 1000 * 60;

		const seconds = Math.floor(remainingMilliseconds / 1000);
		remainingMilliseconds -= seconds * 1000;

		let array = [];

		if (days > 0) array.push(`${days} day${days !== 1 ? 's' : ''}`);
		if (hours > 0) array.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
		if (minutes > 0) array.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
		if (seconds > 0) array.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

		const display = array.join(', ');

		return {
			days,
			hours,
			minutes,
			seconds,
			display
		};
	});

	// $effects
	$effect(() => {
		if (isRowsPending) updateRows();
	});
	$effect(() => {
		requestAnimationFrame(step);
	});
</script>

<Toaster
	position="top-right"
	class="top-[calc(env(safe-area-inset-top)+1rem)]"
	aria-label="Attendance notifications"
>
	{#each toasts as toast (toast.id)}
		<Toast
			{...toast}
			transition={[subtleReveal, { duration: 200 }]}
			onDismiss={() => {
				toasts = toasts.filter((item) => item.id !== toast.id);
			}}
		/>
	{/each}
</Toaster>
{#if user.value}
	<H1>Hi {user.value.firstName}!</H1>
	{#if scheduledDates.value.includes(dateString)}
		<Div class="flex space-x-4">
			{@render statusUpdate()}
			{@render guests()}
		</Div>
		{#if isAnswered}
			<Card
				class={twMerge(
					'text-white dark:text-white',
					committed + maybies / 2 >= 10
						? 'bg-green-500 dark:bg-green-500'
						: 'bg-red-500 dark:bg-red-500'
				)}
			>
				We currently have {committed} committed{maybies !== 0
					? ` and ${maybies} ${maybies === 1 ? 'maybe' : 'maybies'}`
					: ''}.<br />
				{#if committed + maybies / 2 >= 10}Game On!{:else}Need More!{/if}
			</Card>
			<Card class="relative grid grid-cols-[auto_auto] overflow-auto p-0 lg:mr-auto">
				<Div class="sticky top-0 bg-primary-700 px-6 py-3 text-white">Name</Div>
				<Div class="sticky top-0 bg-primary-700 px-6 py-3 text-center text-white">Status</Div>
				{#if !isRowsPending}
					{#if rows.length !== 0}
						{#each allRows as { name, status }, rowIndex}
							{@render rowSnippet({
								name,
								rowIndex,
								status
							})}
						{/each}
					{:else}
						<Div class={twMerge('col-span-2 px-6 py-3')}>No One Signed Up</Div>
					{/if}
				{:else}
					<Div class="col-span-2 px-6 py-3">
						<Spinner />
					</Div>
				{/if}
			</Card>
		{/if}
	{:else}
		{@render noBasketball()}
	{/if}
{/if}

{#snippet guests()}
	<Div class="flex flex-col space-y-2">
		<Div>Guests - {numberOfGuests}</Div>
		<Div class="flex space-x-2">
			<Button
				type="button"
				aria-label="Add guest"
				class="flex aspect-square h-12 items-center justify-center p-0"
				disabled={isRowsPending || isAttendancePending || !isAnswered}
				onclick={() => saveAttendance(answer.status, numberOfGuests + 1)}
			>
				<Plus />
			</Button>
			<Button
				type="button"
				aria-label="Remove guest"
				class="flex aspect-square h-12 items-center justify-center p-0"
				disabled={isRowsPending || isAttendancePending || !isAnswered || numberOfGuests < 1}
				onclick={() => saveAttendance(answer.status, numberOfGuests - 1)}
			>
				<Minus />
			</Button>
		</Div>
		{#if !isRowsPending && !isAnswered}<p class="text-sm text-gray-600 dark:text-gray-400">
				Select your attendance before adding guests.
			</p>{/if}
	</Div>
{/snippet}
{#snippet noBasketball()}
	<Div>No Basketball Scheduled For Today</Div>
	<Div>
		The Next Basketball Date Is {nextBasketballDate.toLocaleString('default', {
			month: 'long',
			day: 'numeric',
			weekday: 'long'
		})}
	</Div>
{/snippet}
{#snippet rowSnippet({
	name,
	rowIndex,
	status
}: {
	name: string;
	rowIndex: number;
	status: string;
})}
	<Div
		class={twMerge('px-6 py-3', rowIndex % 2 === 1 ? 'bg-gray-100 dark:bg-gray-800' : undefined)}
	>
		{name}
	</Div>
	<Div
		class={twMerge(
			'px-6 py-3',
			rowIndex % 2 === 1 ? 'bg-gray-100 dark:bg-gray-800' : undefined,
			'text-center'
		)}
	>
		{status}
	</Div>
{/snippet}
{#snippet statusUpdate()}
	<Div class="flex flex-col space-y-2">
		<Div>Will you be coming?</Div>
		<Div class="flex space-x-2">
			{#each statuses as { className, emoji, status }}
				<Button
					type="button"
					disabled={isRowsPending || isAttendancePending}
					class={twMerge(
						className,
						answer?.status !== status
							? 'bg-gray-500 hover:bg-gray-600 focus:bg-gray-600 focus:outline-gray-500/30 dark:focus:outline-gray-500/30'
							: undefined
					)}
					onclick={() => saveAttendance(status, numberOfGuests)}
				>
					{status}
				</Button>
			{/each}
		</Div>
	</Div>
{/snippet}
