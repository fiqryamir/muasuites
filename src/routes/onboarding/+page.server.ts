import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		redirect(303, '/login');
	}

	// Already onboarded — the wizard is a one-time flow (decision 01/03)
	const { data: config } = await locals.supabase
		.from('mua_configs')
		.select('onboarded_at')
		.eq('mua_id', session.user.id)
		.maybeSingle();

	if (config?.onboarded_at) {
		redirect(303, '/bookings');
	}

	// Prefill — same shapes as the settings page's loadSettings(), so the
	// wizard renders resume-from-last-step without re-typing anything.
	const { data: mua } = await locals.supabase
		.from('muas')
		.select('slug')
		.eq('id', session.user.id)
		.maybeSingle();

	const { data: prefill } = await locals.supabase
		.from('mua_configs')
		.select('*')
		.eq('mua_id', session.user.id)
		.maybeSingle();

	const { data: packages } = await locals.supabase
		.from('packages')
		.select('*')
		.eq('mua_id', session.user.id)
		.eq('is_active', true)
		.order('price', { ascending: true });

	return {
		session,
		// Provide cookie data so the universal client can initialize cleanly during SSR
		cookies: cookies.getAll(),
		prefill: {
			slug: mua?.slug ?? null,
			config: prefill ?? null,
			packages: packages ?? []
		}
	};
};
