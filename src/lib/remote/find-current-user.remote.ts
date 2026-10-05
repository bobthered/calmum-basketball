import { ObjectId } from 'mongodb';
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { requireUser } from '#lib/server/session.js';
import { query } from '$app/server';
import { connect } from '#lib/mongoose/connect.js';
import { User } from '#lib/mongoose/models/index.js';

export const findCurrentUser = query(
	v.object({
		_id: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ _id }) => {
		const account = requireUser();
		if (_id !== account._id && !account.isAdmin) error(403, 'Forbidden');
		await connect();

		const user = await User.findOne({ _id: new ObjectId(_id) }).select(
			'firstName lastName username isAdmin'
		);

		return JSON.parse(JSON.stringify({ success: true, user }));
	}
);
