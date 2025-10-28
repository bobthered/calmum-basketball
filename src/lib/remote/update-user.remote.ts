import { ObjectId } from 'mongodb';
import * as v from 'valibot';
import { form } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { User } from '$lib/mongoose/models';

export const updateUser = form(
	v.object({
		_id: v.pipe(v.string(), v.nonEmpty()),
		firstName: v.pipe(v.string(), v.nonEmpty()),
		lastName: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ _id, firstName, lastName }) => {
		await connect();

		await User.findOneAndUpdate(
			{ _id: new ObjectId(_id) },
			{ firstName, lastName },
			{ upsert: true }
		);

		return { success: true };
	}
);
