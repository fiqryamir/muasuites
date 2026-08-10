import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	if (!session) {
		return json({ success: false, error: 'Not signed in.' }, { status: 401 });
	}

	const { data: config } = await locals.supabase
		.from('mua_configs')
		.select('telegram_chat_id')
		.eq('mua_id', session.user.id)
		.maybeSingle();

	return json({
		success: true,
		connected: Boolean(config?.telegram_chat_id),
		chatId: config?.telegram_chat_id ?? null
	});
};
