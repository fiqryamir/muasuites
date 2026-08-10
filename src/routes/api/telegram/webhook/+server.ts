import { json } from '@sveltejs/kit';
import { TELEGRAM_WEBHOOK_SECRET } from '$env/static/private';
import { sendTelegramAlert } from '$lib/telegram.server';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Telegram echoes the secret token registered via setWebhook on every update.
	if (request.headers.get('x-telegram-bot-api-secret-token') !== TELEGRAM_WEBHOOK_SECRET) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const update = await request.json();

	// Only `/start <token>` deep links matter; everything else is ignored.
	const text: unknown = update?.message?.text;
	if (typeof text !== 'string' || !text.startsWith('/start ')) {
		return json({ success: true });
	}

	const token = text.slice('/start '.length).trim();
	const fromId: unknown = update?.message?.from?.id;
	if (!token || typeof fromId !== 'number') {
		return json({ success: true });
	}

	const chatId = String(fromId);

	// The one-time token is the authorization — the RPC validates it inside SQL.
	const { data, error } = await locals.supabase.rpc('link_telegram_chat', {
		p_token: token,
		p_chat_id: fromId
	});
	const result = (data ?? null) as { success?: boolean } | null;

	if (error || !result?.success) {
		await sendTelegramAlert(
			chatId,
			'⚠️ This connect link is invalid or has expired. Open MUASuites and press Connect Telegram again for a fresh link.'
		);
		return json({ success: true });
	}

	await sendTelegramAlert(
		chatId,
		"✅ <b>You're connected!</b>\n\nYou'll now receive instant notifications whenever a client books or pays."
	);

	return json({ success: true });
};
