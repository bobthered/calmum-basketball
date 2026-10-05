import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import * as v from 'valibot';
import { form } from '$app/server';
import { createSession, publicUser } from '#lib/server/session.js';
import { connect } from '#lib/mongoose/connect.js';
import { User } from '#lib/mongoose/models/index.js';
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
			const { passwordHash } = result;

			const isPasswordMatch = await bcrypt.compare(password, passwordHash);
			if (!isPasswordMatch) throw 'Credentials do not match';

			await createSession(String(result._id));
			return { success: true, user: publicUser(result) };
		} catch (e: any) {
			let message: string = 'Could not sign in user';
			if (typeof e === 'string') message = e;
			error(400, message);
		}
	}
);
