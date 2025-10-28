import * as v from 'valibot';
import { query } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { UserCalendarStatus } from '$lib/mongoose/models';

export const findUserCalendarStatus = query(
	v.object({
		date: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ date }) => {
		await connect();

		const rows = await UserCalendarStatus.find({ date }).populate('_userId');

		return JSON.parse(JSON.stringify({ success: true, rows }));
	}
);
