import { json } from '@sveltejs/kit';
import { TELEGRAM_BOT_TOKEN } from '$env/static/private';
import type { RequestHandler } from './$types';

const TOKEN_TTL_MS = 15 * 60 * 1000;

// Per-isolate cache — the username is stable; refresh on miss.
let cachedBotUsername: string | null = null;

async function getBotUsername(): Promise<string> {
	if (cachedBotUsername) return cachedBotUsername;
	if (!TELEGRAM_BOT_TOKEN) {
		throw new Error('Telegram bot is not configured — add TELEGRAM_BOT_TOKEN to .env.');
	}

	const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
	const data = await res.json();
	const username: unknown = data?.result?.username;

	if (!data?.ok || typeof username !== 'string') {
		throw new Error('Could not reach the Telegram bot — check TELEGRAM_BOT_TOKEN.');
	}

	cachedBotUsername = username;
	return cachedBotUsername;
}

export const POST: RequestHandler = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return json({ success: false, error: 'Not signed in.' }, { status: 401 });
	}

	// One-time connect token — random 32 bytes, hex, 15-minute expiry.
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

	const { error } = await locals.supabase
		.from('mua_configs')
		.update({
			telegram_connect_token: token,
			telegram_connect_expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString()
		})
		.eq('mua_id', session.user.id);

	if (error) {
		return json({ success: false, error: error.message }, { status: 500 });
	}

	try {
		const username = await getBotUsername();
		return json({ success: true, url: `https://t.me/${username}?start=${token}` });
	} catch (err) {
		return json({
			success: false,
			error: err instanceof Error ? err.message : 'Telegram setup error.'
		});
	}
};
