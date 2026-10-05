import { query } from '$app/server';
import { requireUser } from '#lib/server/session.js';
import { connect } from '#lib/mongoose/connect.js';
import { Calendar } from '#lib/mongoose/models/index.js';

export const findCalendar = query(async () => {
	requireUser();
	await connect();

	const rows = await Calendar.find().select('date');

	return JSON.parse(JSON.stringify(rows));
});
