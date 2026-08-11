import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { sendTelegramAlert } from '$lib/telegram.server';

const CANARY_EMAIL = process.env.AUTH_CANARY_EMAIL || 'demo@muasuite.com';
const ALERT_CHAT_ID = process.env.AUTH_ALERT_TELEGRAM_CHAT_ID;
const ALERT_INTERVAL_MS = Number(process.env.AUTH_BOMB_ALERT_INTERVAL_MS || 4 * 60 * 60 * 1000);

/**
 * Cron endpoint: canary probe for auth-email budget exhaustion (email bombing).
 * Called externally (same scheduler as overdue-reminders). Protected by CRON_API_KEY.
 *
 * Probes /auth/v1/otp with a known dummy account. 429 over_email_send_rate_limit
 * means the instance-wide email budget is burned -> Telegram alert (deduped via KV).
 */
export const GET: RequestHandler = async ({ url, platform }) => {
	const apiKey = url.searchParams.get('key');
	if (apiKey !== process.env.CRON_API_KEY) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const kv = platform?.env?.MUA_CACHE;

	if (url.searchParams.get('test') === '1') {
		await sendTelegramAlert(
			ALERT_CHAT_ID,
			'🔔 <b>Auth-bomb detector test</b>\n\nAlert path OK — the canary is watching the auth email budget.'
		);
		return json({ tested: true });
	}

	let response: Response | null = null;
	let body: { error_code?: string } = {};
	for (let attempt = 1; attempt <= 2 && !response; attempt++) {
		try {
			response = await fetch(`${PUBLIC_SUPABASE_URL}/auth/v1/otp`, {
				method: 'POST',
				headers: { apikey: PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: CANARY_EMAIL,
					create_user: false,
					options: { emailRedirectTo: `${PUBLIC_SUPABASE_URL}/login` }
				})
			});
			body = await response.json().catch(() => ({}));
		} catch (err) {
			console.error(`[auth-bomb-detector] canary probe attempt ${attempt} failed:`, err);
			if (attempt === 1) await new Promise((r) => setTimeout(r, 5000));
		}
	}

	if (!response) {
		return json(
			{ checkedAt: new Date().toISOString(), canary: CANARY_EMAIL, error: 'probe failed' },
			{ status: 500 }
		);
	}

	const code = body.error_code || '';

	let alerted = false;

	if (response.status === 429 && code === 'over_email_send_rate_limit') {
		const now = Date.now();
		let shouldAlert = true;
		if (kv) {
			try {
				const last = await kv.get('auth:bomb:last-alerted');
				shouldAlert = !last || now - new Date(last).getTime() > ALERT_INTERVAL_MS;
			} catch {
				shouldAlert = true;
			}
		}

		if (shouldAlert) {
			await sendTelegramAlert(
				ALERT_CHAT_ID,
				'🚨 <b>Auth email budget exhausted</b>\n\n' +
					'GoTrue is refusing ALL auth email sends (email bombing in progress, or the 30/hr cap was hit).\n' +
					`Canary: ${CANARY_EMAIL}\n` +
					`Detected: ${new Date().toISOString()}\n\n` +
					'Magic links will resume next hour unless the attack continues.'
			);
			if (kv) {
				await kv.put('auth:bomb:last-alerted', new Date(now).toISOString()).catch(() => {});
			}
			alerted = true;
		}
	}

	return json({
		checkedAt: new Date().toISOString(),
		canary: CANARY_EMAIL,
		status: response.status,
		code,
		alerted
	});
};
