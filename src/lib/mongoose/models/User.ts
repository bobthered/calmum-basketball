import mongoose from 'mongoose';

export const userSchema = new mongoose.Schema({
	firstName: { type: String, required: true },
	isAdmin: { type: Boolean, default: false },
	lastName: { type: String, required: true }
});

export const User = mongoose.model('User', userSchema);
