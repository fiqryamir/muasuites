import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function downloadCalendarFile(booking: any) {
	// Format Date strings for standard iCalendar format (YYYYMMDDTHHMMSSZ)
	const eventDateClean = booking.event_date.replace(/-/g, ''); // e.g., 2026-05-25 -> 20260525
	const eventTimeClean = booking.event_time.replace(/:/g, ''); // e.g., 08:00:00 -> 080000

	const startTimestamp = `${eventDateClean}T${eventTimeClean}`;

	// Estimate makeup session duration as a default 3-hour window
	const endHour = (parseInt(booking.event_time.split(':')[0]) + 3).toString().padStart(2, '0');
	const endTimestamp = `${eventDateClean}T${endHour}${eventTimeClean.substring(2)}`;

	const summary = `Makeup Session: ${booking.client_name}`;
	const location = booking.venue_address || 'Studio / Venue TBD';

	// Format Description with invoice metadata & direct wa.me link
	const description = `
Bride Name: ${booking.client_name}
WhatsApp Contact: wa.me/${booking.client_phone}
Package: ${booking.packages?.emoji || '💄'} ${booking.packages?.name || 'Service'}
Total Price: RM ${booking.total_amount}
Paid Deposit: RM ${booking.deposit_amount}
Balance Due Post-Event: RM ${booking.balance_amount}
  `
		.trim()
		.replace(/\n/g, '\\n'); // Escape new lines for .ics formatting

	const icsContent = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//MUASuites//Booking Integration v1.0//EN',
		'BEGIN:VEVENT',
		`UID:${booking.id}`,
		`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
		`DTSTART:${startTimestamp}`,
		`DTEND:${timestampToString(endTimestamp)}`,
		`SUMMARY:${summary}`,
		`LOCATION:${location}`,
		`DESCRIPTION:${description}`,
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n');

	// Generate File Blob and trigger automatic browser download
	const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.setAttribute('download', `Booking_${booking.client_name.replace(/\s+/g, '_')}.ics`);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function timestampToString(ts: string) {
	// Pad with trailing Z to denote UTC time boundaries if needed, or leave local
	return ts;
}
