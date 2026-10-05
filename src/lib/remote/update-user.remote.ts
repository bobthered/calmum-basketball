import { ObjectId } from 'mongodb';
import * as v from 'valibot';
import { form } from '$app/server';
import { requireUser } from '#lib/server/session.js';
import { connect } from '#lib/mongoose/connect.js';
import { User } from '#lib/mongoose/models/index.js';

export const updateUser = form(
	v.object({
		_id: v.pipe(v.string(), v.nonEmpty()),
		firstName: v.pipe(v.string(), v.nonEmpty()),
		lastName: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ _id, firstName, lastName }) => {
		const account = requireUser();
		await connect();

		await User.findOneAndUpdate(
			{ _id: new ObjectId(account._id) },
			{ firstName, lastName },
			{ runValidators: true }
		);

		return { success: true };
	}
);
