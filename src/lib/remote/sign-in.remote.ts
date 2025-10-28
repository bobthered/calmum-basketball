import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import * as v from 'valibot';
import { form } from '$app/server';
import { connect } from '$lib/mongoose/connect';
import { User } from '$lib/mongoose/models';
import { error } from '@sveltejs/kit';

export const signIn = form(
	v.object({
		password: v.pipe(v.string(), v.nonEmpty()),
		username: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ password, username }) => {
		try {
			await connect();

			const result = await User.findOne({ username });
			if (!result) throw "Couldn't find user";
			const { passwordHash, __v, ...user } = result;

			const isPasswordMatch = await bcrypt.compare(password, passwordHash);
			if (!isPasswordMatch) throw 'Credentials do not match';

			return JSON.parse(JSON.stringify({ success: true, ...user }));
		} catch (e: any) {
			let message: string = 'Could not sign in user';
			if (typeof e === 'string') message = e;
			error(400, message);
		}
	}
);
