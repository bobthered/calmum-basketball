import mongoose from 'mongoose';

const schema = new mongoose.Schema({
	conversationId: { type: String, required: true, default: 'basketball' },
	senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	senderName: { type: String, required: true },
	text: { type: String, required: true, maxlength: 2000 },
	clientId: { type: String, required: true },
	createdAt: { type: Date, required: true, default: Date.now },
	pushPending: { type: Boolean, default: true },
	pushAfter: { type: Date, default: Date.now },
	pushAttempts: { type: Number, default: 0 },
	pushLease: { type: String, default: '' },
	pushDelivered: { type: [String], default: [] }
});
schema.index({ conversationId: 1, createdAt: -1, _id: -1 });
schema.index({ senderId: 1, clientId: 1 }, { unique: true });
schema.index({ pushPending: 1, pushAfter: 1 });
export const Message =
	(mongoose.models.Message as
		| mongoose.Model<mongoose.InferSchemaType<typeof schema>>
		| undefined) ?? mongoose.model('Message', schema);
