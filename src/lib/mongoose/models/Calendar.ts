import mongoose from 'mongoose';

export const calendarSchema = new mongoose.Schema({
	date: { type: String, required: true, unique: true },
	isScheduled: { type: Boolean, required: true }
});

export const Calendar = mongoose.model('Calendar', calendarSchema);
