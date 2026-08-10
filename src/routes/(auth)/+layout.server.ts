import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		redirect(303, '/login');
	}

	// Onboarding gate — not-onboarded MUAs are sent to the wizard. Reads the
	// one-time `onboarded_at` flag only (never the data, never onboarding_step).
	const { data: config } = await locals.supabase
		.from('mua_configs')
		.select('onboarded_at')
		.eq('mua_id', session.user.id)
		.maybeSingle();

	if (!config?.onboarded_at) {
		redirect(303, '/onboarding');
	}

	return {
		session,
		// Provide cookie data so the universal client can initialize cleanly during SSR
		cookies: cookies.getAll()
	};
};
