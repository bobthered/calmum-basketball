import mongoose, { Types } from 'mongoose';

export const userCalendarStatusSchema = new mongoose.Schema({
	_userId: { type: Types.ObjectId, ref: 'User', required: true },
	date: { type: String, required: true },
	numberOfGuests: { type: Number, default: 0 },
	status: { type: String, enum: ['Yes', 'Maybe', 'No'], required: true }
});

export const UserCalendarStatus =
	(mongoose.models.UserCalendarStatus as
		| mongoose.Model<mongoose.InferSchemaType<typeof userCalendarStatusSchema>>
		| undefined) ?? mongoose.model('UserCalendarStatus', userCalendarStatusSchema);
