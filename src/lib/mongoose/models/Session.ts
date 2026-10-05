import mongoose from 'mongoose';

const schema = new mongoose.Schema({
	_id: { type: String, required: true },
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	expiresAt: { type: Date, required: true }
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const Session = mongoose.models.Session ?? mongoose.model('Session', schema);
