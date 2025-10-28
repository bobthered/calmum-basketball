import * as v from 'valibot';
import { command } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { Calendar } from '$lib/mongoose/models';

export const updateCalendar = command(
	v.object({
		date: v.pipe(v.string(), v.nonEmpty()),
		isScheduled: v.pipe(v.boolean())
	}),
	async ({ date, isScheduled }) => {
		await connect();

		if (isScheduled) {
			await Calendar.findOneAndUpdate({ date }, { isScheduled }, { upsert: true });
		}
		if (!isScheduled) {
			await Calendar.findOneAndDelete({ date });
		}

		return { success: true };
	}
);
