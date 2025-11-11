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
	const answer = $derived.by(
		() => (rows.filter(({ _userId: { _id } }) => _id === user?.value?._id) ?? [])[0]
	);
	const committed = $derived.by(() => rows.filter(({ status }) => status === 'Yes'));
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
	const maybies = $derived.by(() => rows.filter(({ status }) => status === 'Maybe'));
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
		{@render statusUpdate()}
		{#if isAnswered}
			<Div
				>We currently have {committed.length} committed{maybies.length !== 0
					? ` and ${maybies.length} ${maybies.length == 1 ? 'maybe' : 'maybies'}`
					: ''}.</Div
			>
			<Card class="relative grid grid-cols-[auto_auto] overflow-auto p-0 lg:mr-auto">
				<Div class="sticky top-0 bg-primary-700 px-6 py-3 text-white">Name</Div>
				<Div class="sticky top-0 bg-primary-700 px-6 py-3 text-center text-white">Status</Div>
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
		{/if}
	{:else}
		{@render noBasketball()}
	{/if}
{/if}

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
{#snippet statusUpdate()}
	<Div class="flex flex-col space-y-2">
		<Div>Will you be coming?</Div>
		<Div class="flex space-x-2">
			{#each statuses as { className, status }}
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
