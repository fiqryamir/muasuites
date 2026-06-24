import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { publicProfileKey, kvGetOrFetch } from '$lib/cache.server';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const { mua_slug } = params;
	const { supabase } = locals;

	// ---- KV Cache Lookup ----
	// The public profile page is the #1 traffic source (Instagram bio links).
	// We cache the entire response in Cloudflare KV with a 60s TTL,
	// invalidating explicitly when slots change (booking created/approved/rejected).
	const kv = platform?.env?.MUA_CACHE;
	const cacheKey = publicProfileKey(mua_slug);

	const cached = await kvGetOrFetch<PublicProfilePageData | null>(
		kv,
		cacheKey,
		60, // 60-second TTL fallback
		async () => {
			// ---- Cache Miss: Fetch from Database via Consolidated RPC ----
			const { data: pageData, error: rpcError } = await supabase
				.rpc('get_mua_public_page', { p_slug: mua_slug });

			if (rpcError || !pageData) {
				// If the RPC fails, throw 404 (most likely slug not found)
				throw error(404, 'Makeup artist profile not found.');
			}

			return pageData as PublicProfilePageData;
		}
	);

	// Handle the case where the RPC returned null (slug not found)
	if (!cached) {
		throw error(404, 'Makeup artist profile not found.');
	}

	const config = cached.config ?? {};
	const daySlotsMap = (cached.day_slots ?? {}) as Record<string, DaySlot[]>;
	const blackoutSet = new Set<string>(cached.blackout_dates ?? []);

	return {
		muaSlug: mua_slug,
		studioName: config?.studio_name || 'Makeup Studio',
		whatsappNumber: config?.whatsapp_number || '',
		packages: cached.packages ?? [],
		daySlots: daySlotsMap,
		blackoutDates: Array.from(blackoutSet),
		baseLat: config?.base_lat,
		baseLng: config?.base_lng,
		ratePerKm: config?.rate_per_km,
		workingHoursStart: config?.working_hours_start?.slice(0, 5) || '08:00',
		workingHoursEnd: config?.working_hours_end?.slice(0, 5) || '18:00',
		defaultBufferMinutes: config?.default_buffer_minutes ?? 0
	};
};

/** Shape returned by the get_mua_public_page RPC */
interface PublicProfilePageData {
	slug: string;
	mua_id: string;
	config: Record<string, any> | null;
	packages: any[];
	blackout_dates: string[];
	day_slots: Record<string, DaySlot[]>;
}
