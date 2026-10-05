import { ObjectId } from 'mongodb';
import * as v from 'valibot';
import { form } from '$app/server';
import { connect } from '#lib/mongoose/connect.js';
import { User } from '#lib/mongoose/models/index.js';
import { error } from '@sveltejs/kit';
import { requireUser, destroySession } from '#lib/server/session.js';
import { Session } from '#lib/mongoose/models/Session.js';
import { PushSubscription } from '#lib/mongoose/models/PushSubscription.js';

export const deleteUser = form(
	v.object({
		_id: v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ _id }) => {
		const account = requireUser();
		if (_id !== account._id && !account.isAdmin) error(403, 'Forbidden');
		await connect();

		const result = await User.findOneAndDelete({ _id: new ObjectId(_id) });
		await Session.deleteMany({ userId: _id });
		await PushSubscription.deleteMany({ userId: _id });
		if (_id === account._id) await destroySession();

		return { success: true };
	}
);
