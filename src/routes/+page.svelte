<script lang="ts">
	// Imports
	import { Minus, Plus } from '@lucide/svelte';
	import {
		Button,
		Card,
		Div,
		H1,
		H2,
		Hr,
		P,
		Span,
		Spinner,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Toast,
		Toaster,
		Tr
	} from '#components';
	import { findUserCalendarStatus } from '#lib/remote/find-user-calendar-status.remote.js';
	import { updateUserCalendarStatus } from '#lib/remote/update-user-calendar-status.remote.js';
	import { scheduledDates, user } from '#lib/state/index.js';
	import type { ToastItem } from 'sveltewind/components';
	import { subtleReveal } from 'sveltewind/transitions';
	import { twMerge } from 'tailwind-merge';

	// Constants
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

	// Helper functions
	const saveAttendance = async (status: string, guests: number) => {
		if (!user.value || isRowsPending || isAttendancePending || guests < 0) return;
		isAttendancePending = true;
		toasts = [{ duration: 0, id: 'attendance', message: 'Saving attendance...', status: 'info' }];
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
				{ duration: 2500, id: 'attendance', message: 'Attendance saved.', status: 'success' }
			];
		} catch {
			rows = previousRows;
			toasts = [
				{
					duration: 0,
					id: 'attendance',
					message: 'Could not save your attendance or guests. Please try again.',
					status: 'error'
				}
			];
		} finally {
			isAttendancePending = false;
		}
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
				hasSubmittedAttendance = rows.some((row) => row._userId._id === user.value?._id);
			}
		} catch (error) {}
	};

	// $state
	let hasSubmittedAttendance = $state(false);

	let isAttendancePending = $state(false);

	let isRowsPending = $state(true);

	let rows: any[] = $state([]);

	let toasts: ToastItem[] = $state([]);

	// $derived
	const allRows = $derived.by(() => {
		let allRows: {
			name: string;
			status: string;
		}[] = [];
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

	const numberOfGuests = $derived(answer?.numberOfGuests ?? 0);

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
		<Div
			class="grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start"
		>
			<Card class="min-w-0 gap-6">
				<Div>
					<H2 class="text-xl font-semibold">Your plans</H2>
					<P class="mt-1 text-sm text-gray-600 dark:text-gray-400">
						Basketball is scheduled for today.
					</P>
				</Div>
				{@render statusUpdate()}
				<Hr class="border-0 border-t border-gray-200 dark:border-gray-700" />
				{@render guests()}
			</Card>
			{#if hasSubmittedAttendance && isAnswered}
				<Div class="flex min-w-0 flex-col gap-6">
					<Card class="gap-4">
						<Div class="flex flex-wrap items-center justify-between gap-3">
							<H2 class="text-xl font-semibold">Today's game</H2>
							{#if !isRowsPending}
								<Span
									class={committed + maybies / 2 >= 10
										? 'rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 dark:bg-green-950 dark:text-green-200'
										: 'rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200'}
									>{committed + maybies / 2 >= 10 ? 'Game on!' : 'Need more players'}</Span
								>
							{/if}
						</Div>
						{#if isRowsPending}
							<P role="status" class="flex items-center gap-2 text-sm">
								<Spinner class="size-4" />Loading attendance...
							</P>
						{:else}
							<Div class="grid grid-cols-2 gap-4" role="group" aria-label="Attendance summary">
								<Div class="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
									<Span class="block text-3xl font-semibold">{committed}</Span><Span
										class="text-sm text-gray-600 dark:text-gray-400">Committed</Span
									>
								</Div>
								<Div class="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
									<Span class="block text-3xl font-semibold">{maybies}</Span><Span
										class="text-sm text-gray-600 dark:text-gray-400">Maybe</Span
									>
								</Div>
							</Div>
							<P class="text-sm text-gray-600 dark:text-gray-400">
								Guest counts are included in committed players.
							</P>
						{/if}
					</Card>
					<Card class="min-w-0 gap-4">
						<H2 class="text-xl font-semibold">Who's coming</H2>
						{#if !isRowsPending}
							{#if allRows.length}
								<Table class="w-full table-fixed text-left text-sm">
									<Thead
										><Tr
											class="border-b border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
											><Th scope="col" class="pb-3 font-medium">Player</Th><Th
												scope="col"
												class="w-24 pb-3 text-right font-medium">Status</Th
											></Tr
										></Thead
									>
									<Tbody>
										{#each allRows as { name, status }}
											<Tr class="border-b border-gray-100 last:border-0 dark:border-gray-800">
												<Td class="py-3 pr-3 break-words">{name}</Td>
												<Td class="py-3 text-right"
													><Span
														class={status === 'Yes'
															? 'inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-200'
															: status === 'Maybe'
																? 'inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200'
																: 'inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300'}
														>{status}</Span
													></Td
												>
											</Tr>
										{/each}
									</Tbody>
								</Table>
							{:else}<P class="text-sm text-gray-600 dark:text-gray-400">
									No one has answered yet.
								</P>{/if}
						{:else}<P class="text-sm text-gray-600 dark:text-gray-400">Loading players...</P>{/if}
					</Card>
				</Div>
			{/if}
		</Div>
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
		{#if !isRowsPending && !isAnswered}<P class="text-sm text-gray-600 dark:text-gray-400">
				Select your attendance before adding guests.
			</P>{/if}
	</Div>
{/snippet}
{#snippet noBasketball()}
	<Card class="w-full max-w-xl gap-3">
		<H2 class="text-xl font-semibold">No basketball scheduled for today</H2>
		{#if nextBasketballDate}<P class="text-gray-600 dark:text-gray-400">
				The next basketball date is {nextBasketballDate.toLocaleString('default', {
					month: 'long',
					day: 'numeric',
					weekday: 'long'
				})}.
			</P>
		{:else}<P class="text-gray-600 dark:text-gray-400">No upcoming dates are scheduled yet.</P>{/if}
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
