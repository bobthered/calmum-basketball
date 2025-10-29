import mongoose from 'mongoose';
import { UserCalendarStatus } from './UserCalendarStatus';

export const userSchema = new mongoose.Schema({
	firstName: { type: String, required: true },
	isAdmin: { type: Boolean, default: false },
	lastName: { type: String, required: true },
	passwordHash: { type: String, required: true },
	username: { type: String, required: true, unique: true }
});

userSchema.pre('findOneAndDelete', async function (next) {
	const _id = this.getQuery()._id;
	console.log({ _id });
	await UserCalendarStatus.deleteMany({ _userId: _id });
	next();
});

export const User = mongoose.model('User', userSchema);
