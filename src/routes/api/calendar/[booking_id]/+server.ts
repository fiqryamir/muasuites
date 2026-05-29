import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/dynamic/public';

// Helper function to escape text in compliance with RFC 5545 iCalendar standard
function escapeIcsText(str: string): string {
	return (str || '')
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '');
}

export const GET: RequestHandler = async ({ params, url }) => {
	const { booking_id } = params;

	// Extract the MUA's session token from the secure query parameters
	const token = url.searchParams.get('token') || '';

	if (!token) {
		throw error(401, 'Unauthorized access request.');
	}

	// Initialize an authenticated client scoped to the MUA's token
	// This forces RLS engine verification directly in the Postgres database
	const authenticatedSupabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			headers: {
				Authorization: `Bearer ${token}`
			}
		},
		auth: {
			persistSession: false
		}
	});

	// Fetch booking details utilizing RLS credentials
	const { data: bookingAuth, error: authDbError } = await authenticatedSupabase
		.from('bookings')
		.select('*, packages(*)')
		.eq('id', booking_id)
		.single();

	if (authDbError || !bookingAuth) {
		console.error('Secure Calendar fetch failed:', authDbError);
		throw error(404, 'Booking event not found or unauthorized access.');
	}

	// Format iCalendar dates safely (e.g., eventDateClean yields "20260525")
	const eventDateClean = bookingAuth.event_date.replace(/-/g, '');

	// Normalize time formatting (forces HHMMSS, handling both "08:00" and "08:00:00")
	const rawTime = bookingAuth.event_time;
	const parts = rawTime.split(':');
	const hh = parts[0].padStart(2, '0');
	const mm = (parts[1] || '00').padStart(2, '0');
	const ss = (parts[2] || '00').padStart(2, '0');
	const eventTimeClean = `${hh}${mm}${ss}`;

	const startTimestamp = `${eventDateClean}T${eventTimeClean}`;

	// Calculate a safe default 3-hour duration for the calendar event block
	const endHour = (parseInt(hh, 10) + 3).toString().padStart(2, '0');
	const endTimestamp = `${eventDateClean}T${endHour}${mm}${ss}`;

	// Escape custom field strings to lock down CRLF injection vectors
	const summary = escapeIcsText(`Makeup Session: ${bookingAuth.client_name}`);
	const location = escapeIcsText(bookingAuth.venue_address || 'Studio / Venue TBD');

	const rawDescription = `
Bride Name: ${bookingAuth.client_name}
WhatsApp Contact: wa.me/${bookingAuth.client_phone}
Service: ${bookingAuth.packages?.emoji || '💄'} ${bookingAuth.packages?.name || 'Service'}
Total Price: RM ${bookingAuth.total_amount}
Paid Deposit: RM ${bookingAuth.deposit_amount}
Balance Due Post-Event: RM ${bookingAuth.balance_amount}
	`.trim();

	const description = escapeIcsText(rawDescription);

	// Assemble RFC 5545 iCalendar payload
	const icsContent = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//MUASuites//Booking Integration v1.0//EN',
		'BEGIN:VEVENT',
		`UID:${bookingAuth.id}`,
		`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
		`DTSTART:${startTimestamp}`,
		`DTEND:${endTimestamp}`,
		`SUMMARY:${summary}`,
		`LOCATION:${location}`,
		`DESCRIPTION:${description}`,
		'END:VEVENT',
		'END:VCALENDAR'
	].join('\r\n');

	// Return correct text/calendar content header and handle attachment triggers
	return new Response(icsContent, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="Booking_${bookingAuth.client_name.replace(/\s+/g, '_')}.ics"`
		}
	});
};