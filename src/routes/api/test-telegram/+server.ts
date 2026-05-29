import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TELEGRAM_BOT_TOKEN } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { chatId } = await request.json();

		if (!TELEGRAM_BOT_TOKEN) {
			return json({
				success: false,
				error: 'SECRET_TOKEN_MISSING: TELEGRAM_BOT_TOKEN is not configured in the server .env file.'
			});
		}

		if (!chatId) {
			return json({ success: false, error: 'CHAT_ID_MISSING: Please enter a Chat ID.' });
		}

		const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: chatId,
				text: '👋 <b>MUASuites Connection Successful!</b>\n\nYour Telegram bot is now successfully linked to your booking workspace. You will receive instant notifications whenever a client uploads a receipt!',
				parse_mode: 'HTML'
			})
		});

		const result = await response.json();

		if (response.ok && result.ok) {
			return json({ success: true });
		} else {
			// Return the raw error message directly from Telegram's API
			return json({
				success: false,
				error: `TELEGRAM_API_ERROR: ${result.description || 'Unknown error'}.`
			});
		}
	} catch (e: any) {
		return json({ success: false, error: e.message });
	}
};
