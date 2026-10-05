import { ObjectId } from 'mongodb';
import * as v from 'valibot';
import { command } from '$app/server';
import { requireUser } from '#lib/server/session.js';
import { connect } from '#lib/mongoose/connect.js';
import { UserCalendarStatus } from '#lib/mongoose/models/index.js';

export const updateUserCalendarStatus = command(
	v.object({
		_userId: v.pipe(v.string(), v.nonEmpty()),
		date: v.pipe(v.string(), v.nonEmpty()),
		numberOfGuests: v.pipe(v.number()),
		status: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ _userId, date, numberOfGuests, status }) => {
		const account = requireUser();
		await connect();

		await UserCalendarStatus.findOneAndUpdate(
			{ _userId: new ObjectId(account._id), date },
			{ date, numberOfGuests, status },
			{ upsert: true }
		);

		return { success: true };
	}
);
