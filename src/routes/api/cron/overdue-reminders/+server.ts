import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { notifyBalanceOverdue } from '$lib/telegram.server';

/**
 * Cron endpoint for overdue balance reminders.
 * Called externally (e.g. via pg_cron's pg_net extension or a separate scheduler).
 * Protected by CRON_API_KEY env variable.
 */
export async function GET({ url }) {
	const apiKey = url.searchParams.get('key');
	if (apiKey !== process.env.CRON_API_KEY) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Use service role key from env for admin access (bypasses RLS)
	const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceRole) {
		return json({ error: 'Service role key not configured' }, { status: 500 });
	}

	const supabase = createClient(PUBLIC_SUPABASE_URL, serviceRole);

	// Fetch overdue CONFIRMED bookings with balance
	const today = new Date().toISOString().split('T')[0];
	const { data: bookings, error } = await supabase
		.from('bookings')
		.select('id, client_name, balance_amount, event_date, balance_token, mua_id')
		.eq('status', 'CONFIRMED')
		.gt('balance_amount', 0)
		.lt('balance_due_date', today)
		.or(`last_overdue_notified_at.is.null,last_overdue_notified_at.lt.${today}`);

	if (error) {
		console.error('Overdue reminders cron error:', error);
		return json({ error: error.message }, { status: 500 });
	}

	if (!bookings || bookings.length === 0) {
		return json({ notified: 0 });
	}

	const origin = process.env.ORIGIN || 'https://muasuites.com';
	let notified = 0;

	for (const booking of bookings) {
		// Fetch MUA config separately
		const { data: muaConfig } = await supabase
			.from('mua_configs')
			.select('telegram_chat_id')
			.eq('mua_id', booking.mua_id)
			.single();

		const chatId = muaConfig?.telegram_chat_id;
		if (!chatId) continue;

		const eventDate = new Date(booking.event_date + 'T00:00:00');
		const todayDate = new Date();
		const diffMs = todayDate.getTime() - eventDate.getTime();
		const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

		const balanceUrl = `${origin}/pay/balance/${booking.balance_token}`;

		await notifyBalanceOverdue(
			chatId,
			booking.client_name,
			booking.balance_amount,
			booking.event_date,
			daysOverdue,
			balanceUrl
		);

		// Mark as notified
		await supabase
			.from('bookings')
			.update({ last_overdue_notified_at: new Date().toISOString() })
			.eq('id', booking.id);

		notified++;
	}

	return json({ notified });
}