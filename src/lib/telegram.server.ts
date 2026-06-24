import { TELEGRAM_BOT_TOKEN } from '$env/static/private';

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

/**
 * Send a Telegram notification to the MUA about a balance payment link being ready.
 * Called after MUA approves a booking with a balance due.
 */
export async function notifyBalanceLinkReady(
	chatId: string,
	clientName: string,
	balanceAmount: number,
	eventDate: string,
	balanceUrl: string
) {
	const formattedAmount = `RM ${Number(balanceAmount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
	const message = `
<b>🔔 Balance Payment Link Ready</b>

<b>Client:</b> ${clientName || 'Client'}
<b>Event:</b> ${eventDate}
<b>Balance:</b> ${formattedAmount}

Send this link to the client for balance payment:
<a href="${balanceUrl}">Open Balance Payment Page</a>

Or copy and share:
${balanceUrl}
	`.trim();

	await sendTelegramAlert(chatId, message);
}

/**
 * Send a Telegram notification to the MUA that balance has been received and booking is fully paid.
 */
export async function notifyBalancePaid(
	chatId: string,
	clientName: string,
	totalAmount: number,
	eventDate: string,
	balanceReceiptUrl: string | null
) {
	const formattedTotal = `RM ${Number(totalAmount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
	let message = `
<b>✅ Booking Fully Paid!</b>

<b>Client:</b> ${clientName || 'Client'}
<b>Event:</b> ${eventDate}
<b>Total:</b> ${formattedTotal}
<b>Status:</b> FULLY_PAID
	`.trim();

	if (balanceReceiptUrl) {
		message += `\n\n<a href="${balanceReceiptUrl}">View Balance Receipt</a>`;
	}

	await sendTelegramAlert(chatId, message);
}

/**
 * Send a Telegram reminder about overdue balance.
 */
export async function notifyBalanceOverdue(
	chatId: string,
	clientName: string,
	balanceAmount: number,
	eventDate: string,
	daysOverdue: number,
	balanceUrl: string
) {
	const formattedAmount = `RM ${Number(balanceAmount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
	const message = `
<b>⚠️ Balance Overdue (${daysOverdue} day${daysOverdue !== 1 ? 's' : ''})</b>

<b>Client:</b> ${clientName || 'Client'}
<b>Event:</b> ${eventDate}
<b>Balance:</b> ${formattedAmount}

Remind the client to pay:
<a href="${balanceUrl}">Balance Payment Link</a>
	`.trim();

	await sendTelegramAlert(chatId, message);
}