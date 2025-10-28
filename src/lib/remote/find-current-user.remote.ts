import { ObjectId } from 'mongodb';
import * as v from 'valibot';
import { query } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { User } from '$lib/mongoose/models';

export const findCurrentUser = query(
	v.object({
		_id: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ _id }) => {
		await connect();

		const user = await User.findOne({ _id: new ObjectId(_id) });

		return JSON.parse(JSON.stringify({ success: true, user }));
	}
);
