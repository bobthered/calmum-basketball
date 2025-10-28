import { error } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import * as v from 'valibot';
import { form } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { User } from '$lib/mongoose/models';

export const signUp = form(
	v.object({
		firstName: v.pipe(v.string(), v.nonEmpty()),
		lastName: v.pipe(v.string(), v.nonEmpty()),
		password: v.pipe(v.string(), v.nonEmpty()),
		username: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ firstName, lastName, password, username }) => {
		try {
			await connect();

			const passwordHash = await bcrypt.hash(password, 10);
			const result = await User.create({ firstName, lastName, passwordHash, username });

			const { passwordHash: _, __v, ...user } = result;

			return JSON.parse(JSON.stringify({ success: true, ...user }));
		} catch (e: any) {
			let message: string = 'Could not create user';
			if (e.code === 11000) message = 'Username already exists';
			error(400, message);
		}
	}
);
