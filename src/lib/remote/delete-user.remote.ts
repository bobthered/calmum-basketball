import { ObjectId } from 'mongodb';
import * as v from 'valibot';
import { form } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { User } from '$lib/mongoose/models';

export const deleteUser = form(
	v.object({
		_id: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ _id }) => {
		await connect();

		const result = await User.findOneAndDelete({ _id: new ObjectId(_id) });

		return { success: true };
	}
);
