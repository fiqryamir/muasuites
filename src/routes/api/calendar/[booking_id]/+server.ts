import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { supabase } from '$lib/supabaseClient';

export const GET: RequestHandler = async ({ params, url }) => {
	const { booking_id } = params;

	// Extract the MUA's JWT token from the secure query parameters
	const token = url.searchParams.get('token') || '';

	// Initialize an authenticated Supabase client on the server using the MUA's token.
	// This securely enforces RLS policies in the database!
	const authenticatedSupabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: {
			headers: {
				Authorization: `Bearer ${token}`
			}
		}
	});

	// 1. Fetch booking and package details using the authenticated client
	// const { data: booking, error: dbError } = await supabase; // Using standard client to bypass RLS for public info?
	// No, we use authenticatedSupabase to securely enforce the MUA's access rights!
	const { data: bookingAuth, error: authDbError } = await authenticatedSupabase
		.from('bookings')
		.select('*, packages(*)')
		.eq('id', booking_id)
		.single();

	if (authDbError || !bookingAuth) {
		console.error('Secure Calendar fetch failed:', authDbError);
		throw error(404, 'Booking event not found or unauthorized access.');
	}

	// 2. Format iCalendar (.ics) String
	const eventDateClean = bookingAuth.event_date.replace(/-/g, ''); // e.g., 20260525
	const eventTimeClean = bookingAuth.event_time.replace(/:/g, ''); // e.g., 080000

	const startTimestamp = `${eventDateClean}T${eventTimeClean}`;
	const endHour = (parseInt(bookingAuth.event_time.split(':')[0]) + 3).toString().padStart(2, '0');
	const endTimestamp = `${eventDateClean}T${endHour}${eventTimeClean.substring(2)}`;

	const summary = `Makeup Session: ${bookingAuth.client_name}`;
	const location = bookingAuth.venue_address || 'Studio / Venue TBD';

	const description = `
Bride Name: ${bookingAuth.client_name}
WhatsApp Contact: wa.me/${bookingAuth.client_phone}
Package: ${bookingAuth.packages?.emoji || '💄'} ${bookingAuth.packages?.name || 'Service'}
Total Price: RM ${bookingAuth.total_amount}
Paid Deposit: RM ${bookingAuth.deposit_amount}
Balance Due Post-Event: RM ${bookingAuth.balance_amount}
  `
		.trim()
		.replace(/\n/g, '\\n'); // Escape new lines for .ics standard

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

	// 3. Serve the payload with official text/calendar Headers
	return new Response(icsContent, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="Booking_${bookingAuth.client_name.replace(/\s+/g, '_')}.ics"`
		}
	});
};
