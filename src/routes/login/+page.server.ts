import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const { session } = await locals.safeGetSession();

	if (session) {
		redirect(303, '/bookings');
	}

	return {
		session,
		// Provide cookie data so the universal client can initialize cleanly during SSR
		cookies: cookies.getAll()
	};
};
