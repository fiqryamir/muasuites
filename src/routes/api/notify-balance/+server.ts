import { json } from '@sveltejs/kit';
import { notifyBalanceLinkReady } from '$lib/telegram.server';

export async function POST({ request, locals }) {
	const supabase = locals.supabase;
	const { bookingId, balanceToken } = await request.json();

	if (!bookingId) {
		return json({ success: false, error: 'Missing bookingId' }, { status: 400 });
	}

	// Fetch booking
	const { data: booking, error } = await supabase
		.from('bookings')
		.select('id, client_name, balance_amount, event_date, mua_id')
		.eq('id', bookingId)
		.single();

	if (error || !booking) {
		return json({ success: false, error: 'Booking not found' }, { status: 404 });
	}

	// Fetch MUA config for telegram chat ID
	const { data: muaConfig } = await supabase
		.from('mua_configs')
		.select('telegram_chat_id')
		.eq('mua_id', booking.mua_id)
		.single();

	const chatId = muaConfig?.telegram_chat_id;
	if (!chatId) {
		return json({ success: true, note: 'MUA has no Telegram chat ID configured' });
	}

	// Use the token from the request body, or fall back to querying the booking
	const token = balanceToken || null;
	if (!token) {
		return json({ success: false, error: 'Missing balanceToken' }, { status: 400 });
	}

	// Build the balance payment URL
	const origin = process.env.ORIGIN || `https://${request.headers.get('host')}`;
	const balanceUrl = `${origin}/pay/balance/${token}`;

	await notifyBalanceLinkReady(
		chatId,
		booking.client_name,
		booking.balance_amount,
		booking.event_date,
		balanceUrl
	);

	return json({ success: true });
}
