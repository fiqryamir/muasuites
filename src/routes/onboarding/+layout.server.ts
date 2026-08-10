import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	return {
		// Provide cookie data so the universal client can initialize cleanly during SSR
		cookies: cookies.getAll()
	};
};
