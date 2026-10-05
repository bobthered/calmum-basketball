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
	let hasSubmittedAttendance = $state(false);
	let toasts: ToastItem[] = $state([]);
	let rows: any[] = $state([]);

	// variables
	const statuses = [
		{
			className:
				'bg-green-500 hover:bg-green-600 focus:bg-green-600 focus:outline-green-500/30 dark:focus:outline-green-500/30 ',
			status: 'Yes'
		},
		{
			className:
				'bg-amber-500 hover:bg-amber-600 focus:bg-amber-600 focus:outline-amber-500/30 dark:focus:outline-amber-500/30 ',
			status: 'Maybe'
		},
		{
			className:
				'bg-red-500 hover:bg-red-600 focus:bg-red-600 focus:outline-red-500/30 dark:focus:outline-red-500/30 ',
			status: 'No'
		}
	];
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
				hasSubmittedAttendance = rows.some((row) => row._userId._id === user.value?._id);
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
			hasSubmittedAttendance = true;
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
		return listDates[0];
	});
	// $effects
	$effect(() => {
		if (isRowsPending) updateRows();
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
		<div
			class="grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start"
		>
			<Card class="min-w-0 gap-6">
				<div>
					<h2 class="text-xl font-semibold">Your plans</h2>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
						Basketball is scheduled for today.
					</p>
				</div>
				{@render statusUpdate()}
				<hr class="border-0 border-t border-gray-200 dark:border-gray-700" />
				{@render guests()}
			</Card>
			{#if hasSubmittedAttendance && isAnswered}
				<div class="flex min-w-0 flex-col gap-6">
					<Card class="gap-4">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<h2 class="text-xl font-semibold">Today's game</h2>
							{#if !isRowsPending}
								<span
									class={committed + maybies / 2 >= 10
										? 'rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-950 dark:text-green-200'
										: 'rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200'}
									>{committed + maybies / 2 >= 10 ? 'Game on!' : 'Need more players'}</span
								>
							{/if}
						</div>
						{#if isRowsPending}
							<p role="status" class="flex items-center gap-2 text-sm">
								<Spinner class="size-4" />Loading attendance...
							</p>
						{:else}
							<div class="grid grid-cols-2 gap-4" role="group" aria-label="Attendance summary">
								<div class="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
									<span class="block text-3xl font-semibold">{committed}</span><span
										class="text-sm text-gray-600 dark:text-gray-400">Committed</span
									>
								</div>
								<div class="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
									<span class="block text-3xl font-semibold">{maybies}</span><span
										class="text-sm text-gray-600 dark:text-gray-400">Maybe</span
									>
								</div>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Guest counts are included in committed players.
							</p>
						{/if}
					</Card>
					<Card class="min-w-0 gap-4">
						<h2 class="text-xl font-semibold">Who's coming</h2>
						{#if !isRowsPending}
							{#if allRows.length}
								<table class="w-full table-fixed text-left text-sm">
									<thead
										><tr
											class="border-b border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
											><th scope="col" class="pb-3 font-medium">Player</th><th
												scope="col"
												class="w-24 pb-3 text-right font-medium">Status</th
											></tr
										></thead
									>
									<tbody>
										{#each allRows as { name, status }}
											<tr class="border-b border-gray-100 last:border-0 dark:border-gray-800">
												<td class="py-3 pr-3 break-words">{name}</td>
												<td class="py-3 text-right"
													><span
														class={status === 'Yes'
															? 'inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-200'
															: status === 'Maybe'
																? 'inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200'
																: 'inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300'}
														>{status}</span
													></td
												>
											</tr>
										{/each}
									</tbody>
								</table>
							{:else}<p class="text-sm text-gray-600 dark:text-gray-400">
									No one has answered yet.
								</p>{/if}
						{:else}<p class="text-sm text-gray-600 dark:text-gray-400">Loading players...</p>{/if}
					</Card>
				</div>
			{/if}
		</div>
	{:else}
		{@render noBasketball()}
	{/if}
{/if}
{#snippet guests()}
	<Div class="flex flex-col gap-3">
		<Div>Guests - {numberOfGuests}</Div>
		<Div class="flex gap-3">
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
	<Card class="w-full max-w-xl gap-3">
		<h2 class="text-xl font-semibold">No basketball scheduled for today</h2>
		{#if nextBasketballDate}<p class="text-gray-600 dark:text-gray-400">
				The next basketball date is {nextBasketballDate.toLocaleString('default', {
					month: 'long',
					day: 'numeric',
					weekday: 'long'
				})}.
			</p>
		{:else}<p class="text-gray-600 dark:text-gray-400">No upcoming dates are scheduled yet.</p>{/if}
	</Card>
{/snippet}
{#snippet statusUpdate()}
	<Div class="flex flex-col gap-3">
		<Div>Will you be coming?</Div>
		<Div class="grid grid-cols-3 gap-2">
			{#each statuses as { className, status }}
				<Button
					type="button"
					disabled={isRowsPending || isAttendancePending}
					class={twMerge(
						'min-w-0 px-3 py-3',
						className,
						answer?.status !== status
							? 'bg-gray-500 hover:bg-gray-600 focus:bg-gray-600 focus:outline-gray-500/30 dark:focus:outline-gray-500/30'
							: undefined
					)}
					aria-pressed={answer?.status === status}
					onclick={() => saveAttendance(status, numberOfGuests)}
				>
					{status}
				</Button>
			{/each}
		</Div>
	</Div>
{/snippet}
