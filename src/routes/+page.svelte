<script lang="ts">
	import { Minus, Plus } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { Button, Card, Div, H1, Spinner } from '$components';
	import { findUserCalendarStatus } from '$lib/remote/find-user-calendar-status.remote';
	import { updateUserCalendarStatus } from '$lib/remote/update-user-calendar-status.remote';
	import { scheduledDates, user } from '$lib/state';

	// $state
	let isRowsPending = $state(true);
	let numberOfGuests = $state(0);
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
			const result = await findUserCalendarStatus({ date: dateString });
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
				for (let i = 0; i < numberOfGuests; i++) {
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
		const formattedDate = date.toISOString().slice(0, 10);
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
		if (isAnswered) {
			untrack(() => {
				numberOfGuests = answer.numberOfGuests;
			});
		}
	});
	$effect(() => {
		requestAnimationFrame(step);
	});
</script>

{#if user.value}
	<H1>Hi {user.value.firstName}!</H1>
	{#if user.value.isAdmin}
		<Div>dateString: {dateString}</Div>
		<Div>
			{timeRemaining.display}
		</Div>
	{/if}
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
				class="flex aspect-square h-12 items-center justify-center p-0"
				onclick={async () => {
					try {
						if (!user.value) throw 'No User';
						numberOfGuests++;
						await updateUserCalendarStatus({
							_userId: user.value._id,
							date: dateString,
							numberOfGuests,
							status: answer.status
						});
						isRowsPending = true;
					} catch (error) {}
				}}
			>
				<Plus />
			</Button>
			<Button
				class="flex aspect-square h-12 items-center justify-center p-0"
				disabled={numberOfGuests < 1 ? true : undefined}
				onclick={async () => {
					try {
						if (!user.value) throw 'No User';
						numberOfGuests--;
						await updateUserCalendarStatus({
							_userId: user.value._id,
							date: dateString,
							numberOfGuests,
							status: answer.status
						});
						isRowsPending = true;
					} catch (error) {}
				}}
			>
				<Minus />
			</Button>
		</Div>
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
					class={twMerge(
						className,
						answer?.status !== status
							? 'bg-gray-500 hover:bg-gray-600 focus:bg-gray-600 focus:outline-gray-500/30 dark:focus:outline-gray-500/30'
							: undefined
					)}
					onclick={async () => {
						try {
							if (!user.value) throw 'No User';
							await updateUserCalendarStatus({
								_userId: user.value._id,
								date: dateString,
								numberOfGuests,
								status
							});
							isRowsPending = true;
						} catch (error) {}
					}}
				>
					{status}
				</Button>
			{/each}
		</Div>
	</Div>
{/snippet}
