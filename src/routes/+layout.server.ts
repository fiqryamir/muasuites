import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	const { session } = await locals.safeGetSession();
	return {
		session,
		// Provide cookie data so the universal client can initialize cleanly during SSR
		cookies: cookies.getAll()
	};
};