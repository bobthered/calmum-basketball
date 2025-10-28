import { ObjectId } from 'mongodb';
import * as v from 'valibot';
import { command } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { UserCalendarStatus } from '$lib/mongoose/models';

export const updateUserCalendarStatus = command(
	v.object({
		_userId: v.pipe(v.string(), v.nonEmpty()),
		date: v.pipe(v.string(), v.nonEmpty()),
		status: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ _userId, date, status }) => {
		await connect();

		await UserCalendarStatus.findOneAndUpdate(
			{ _userId: new ObjectId(_userId), date },
			{ date, status },
			{ upsert: true }
		);

		return { success: true };
	}
);
