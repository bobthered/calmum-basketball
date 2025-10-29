import { ObjectId } from 'mongodb';
import * as v from 'valibot';
import { command } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { User } from '$lib/mongoose/models';

export const updateUserField = command(
	v.object({
		_id: v.pipe(v.string(), v.nonEmpty()),
		firstName: v.optional(v.string()),
		isAdmin: v.optional(v.boolean()),
		lastName: v.optional(v.string()),
		username: v.optional(v.string())
	}),
	async ({ _id, firstName, isAdmin, lastName, username }) => {
		await connect();

		let update: { firstName?: string; isAdmin?: boolean; lastName?: string; username?: string } =
			{};

		if (firstName !== undefined) update.firstName = firstName;
		if (isAdmin !== undefined) update.isAdmin = isAdmin;
		if (lastName !== undefined) update.lastName = lastName;
		if (username !== undefined) update.username = username;

		await User.findOneAndUpdate(
			{
				_id: new ObjectId(_id)
			},
			update
		);

		return { success: true };
	}
);
