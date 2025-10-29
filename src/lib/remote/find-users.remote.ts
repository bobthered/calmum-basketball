import { query } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { User } from '$lib/mongoose/models';

export const findUsers = query(async () => {
	await connect();

	const users = await User.find().select('-passwordHash');

	return JSON.parse(JSON.stringify(users));
});
