import * as v from 'valibot';
import { form } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { User } from '$lib/mongoose/models';

export const createUser = form(
	v.object({
		firstName: v.pipe(v.string(), v.nonEmpty()),
		lastName: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ firstName, lastName }) => {
		await connect();

		const user = await User.create({ firstName, lastName });

		return JSON.parse(JSON.stringify({ success: true, ...user }));
	}
);
