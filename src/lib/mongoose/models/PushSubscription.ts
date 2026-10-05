import mongoose from 'mongoose';

const schema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	endpoint: { type: String, required: true, unique: true },
	keys: { auth: { type: String, required: true }, p256dh: { type: String, required: true } },
	createdAt: { type: Date, default: Date.now }
});
schema.index({ userId: 1 });
export const PushSubscription =
	mongoose.models.PushSubscription ?? mongoose.model('PushSubscription', schema);
