import { scheduledDates } from '$lib/state/scheduledDates';

class Calendar {
	_currentDate = $state(new Date());

	// $derives
	_firstOfCurrentMonth = $derived.by(
		() => new Date(this._currentDate.getFullYear(), this._currentDate.getMonth(), 1)
	);
	_firstOfNextMonth = $derived.by(
		() => new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 1)
	);
	_lastOfPreviousMonth = $derived.by(
		() => new Date(this._firstOfCurrentMonth.getFullYear(), this._firstOfCurrentMonth.getMonth(), 0)
	);
	_calendar = $derived.by(() => {
		let calendar: { date: Date; dateString: string; isScheduled: boolean }[] = [];
		const dayOfLastOfPreviousMonth = this._lastOfPreviousMonth.getDay();
		let tempDate = new Date(
			this._lastOfPreviousMonth.getFullYear(),
			this._lastOfPreviousMonth.getMonth(),
			this._lastOfPreviousMonth.getDate() - dayOfLastOfPreviousMonth
		);

		for (let i = 0; i < 42; i++) {
			const dateString = new Date(tempDate).toISOString().split('T')[0];
			calendar.push({
				date: new Date(tempDate),
				dateString,
				isScheduled: scheduledDates.value.includes(dateString)
			});
			tempDate.setDate(tempDate.getDate() + 1);
		}

		return calendar;
	});

	get calendar() {
		return this._calendar;
	}
	get currentDate() {
		return this._currentDate;
	}
	get firstOfCurrentMonth() {
		return this._firstOfCurrentMonth;
	}
	get firstOfNextMonth() {
		return this._firstOfNextMonth;
	}
	get lastOfPreviousMonth() {
		return this._lastOfPreviousMonth;
	}

	set currentDate(value: Date) {
		this._currentDate = value;
	}
}

export const calendar = new Calendar();
