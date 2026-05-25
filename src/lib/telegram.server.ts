import { TELEGRAM_BOT_TOKEN } from '$env/static/private';

export async function sendTelegramAlert(chatId: string | null | undefined, message: string) {
	if (!TELEGRAM_BOT_TOKEN || !chatId) {
		console.warn('Telegram Dispatch Skipped: Bot token or MUA chat ID is not configured.');
		return;
	}

	const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: chatId,
				text: message,
				parse_mode: 'HTML'
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Telegram API returned error status:', response.status, errorText);
		}
	} catch (e) {
		console.error('Failed to dispatch Telegram bot notification:', e);
	}
}
