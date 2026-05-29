import { TELEGRAM_BOT_TOKEN } from '$env/dynamic/private';

export async function sendTelegramAlert(chatId: string | null | undefined, message: string) {
	if (!TELEGRAM_BOT_TOKEN || !chatId) {
		console.warn('Telegram Dispatch Skipped: Bot token or MUA chat ID is not configured.');
		return;
	}

	const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
	
	// Enforce execution safety in serverless environments via fetch timeout constraints
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second threshold

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			signal: controller.signal,
			body: JSON.stringify({
				chat_id: chatId,
				text: message,
				parse_mode: 'HTML'
			})
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Telegram API returned error status:', response.status, errorText);
		}
	} catch (e: any) {
		clearTimeout(timeoutId);
		if (e.name === 'AbortError') {
			console.error('Telegram dispatch failed: Request timed out after 5 seconds.');
		} else {
			console.error('Failed to dispatch Telegram bot notification:', e);
		}
	}
}