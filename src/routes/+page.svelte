<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { Button, Card, Div, H1, Spinner } from '$components';
	import { findUserCalendarStatus } from '$lib/remote/find-user-calendar-status.remote';
	import { updateUserCalendarStatus } from '$lib/remote/update-user-calendar-status.remote';
	import { scheduledDates } from '$lib/scheduledDates';
	import { user } from '$lib/user';

	// $state
	let isRowsPending = $state(true);
	let rows: any[] = $state([]);

	// variables
	const statuses = ['Yes', 'Maybe', 'No'];
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
	const date = $derived.by(() => new Date());
	const dateString = $derived.by(() => {
		const formattedDate = date.toISOString().slice(0, 10);
		return formattedDate;
	});
	const listDates = $derived.by(() =>
		scheduledDates.value
			.map((dateString) => {
				const date = new Date(dateString);
				date.setUTCHours(24);
				return date;
			})
			.filter((date) => date.getTime() >= new Date().getTime())
			.sort((a, b) => a.getTime() - b.getTime())
	);
	const nextBasketballDate = $derived.by(() => {
		return new Date(listDates[0]);
	});

	// $effects
	$effect(() => {
		if (isRowsPending) updateRows();
	});
</script>

{#if user.value}
	<H1>Hi {user.value.firstName}!</H1>
	{#if scheduledDates.value.includes(dateString)}
		<Div class="flex items-center space-x-4">
			<Div class="aspect-square w-6 rounded-full bg-green-500" />
			<Div>Basketball is scheduled for tonight.</Div>
		</Div>
		<Div class="flex items-center space-x-4">
			<Div>Will you be coming?</Div>
			<Div class="flex space-x-2">
				{#each statuses as status}
					<Button
						onclick={async () => {
							try {
								if (!user.value) throw 'No User';
								await updateUserCalendarStatus({
									_userId: user.value._id,
									date: dateString,
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
		<Card class="grid grid-cols-[auto_auto] overflow-hidden p-0 lg:mr-auto">
			<Div class="bg-primary-700 px-6 py-3 text-white">Name</Div>
			<Div class="bg-primary-700 px-6 py-3 text-center text-white">Status</Div>
			{#if !isRowsPending}
				{#if rows.length !== 0}
					{#each rows as { _userId, status }, rowIndex}
						<Div
							class={twMerge(
								'px-6 py-3',
								rowIndex % 2 === 1 ? 'bg-gray-100 dark:bg-gray-800' : undefined
							)}>{_userId.firstName} {_userId.lastName}</Div
						>
						<Div
							class={twMerge(
								'px-6 py-3',
								rowIndex % 2 === 1 ? 'bg-gray-100 dark:bg-gray-800' : undefined,
								'text-center'
							)}>{status}</Div
						>
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
	{:else}
		<Div>No Basketball Scheduled For Today</Div>
		<Div
			>The Next Basketball Date Is {nextBasketballDate.toLocaleString('default', {
				month: 'long',
				day: 'numeric',
				weekday: 'long'
			})}</Div
		>
	{/if}
{/if}
