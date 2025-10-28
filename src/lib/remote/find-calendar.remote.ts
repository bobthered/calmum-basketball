import { query } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { Calendar } from '$lib/mongoose/models';

export const findCalendar = query(async () => {
	await connect();

	const rows = await Calendar.find().select('date');

	return JSON.parse(JSON.stringify(rows));
});
