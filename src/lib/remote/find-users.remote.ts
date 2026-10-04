import { query } from '$app/server';
import { connect } from '#lib/mongoose/connect.js';
import { User } from '#lib/mongoose/models/index.js';

export const findUsers = query(async () => {
	await connect();

	const users = await User.find().select('-passwordHash');

	return JSON.parse(JSON.stringify(users));
});
