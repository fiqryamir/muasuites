import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ params }) => {
	const { mua_slug } = params;

	// 1. Fetch MUA Profile
	const { data: mua, error: muaError } = await supabase
		.from('muas')
		.select('id, slug, subscription_plan')
		.eq('slug', mua_slug)
		.single();

	if (muaError || !mua) {
		throw error(404, 'Makeup artist profile not found.');
	}

	const muaId = mua.id;

	// 2. Fetch packages & configs
	const { data: config } = await supabase
		.from('mua_configs')
		.select('*')
		.eq('mua_id', muaId)
		.single();

	const { data: packages } = await supabase
		.from('packages')
		.select('*')
		.eq('mua_id', muaId)
		.eq('is_active', true)
		.order('price', { ascending: true });

	// 3. Fetch Explicit Blackout Dates set by MUA
	const { data: blackouts } = await supabase
		.from('blackout_dates')
		.select('blackout_date')
		.eq('mua_id', muaId);

	// 4. Fetch Occupied Dates (Confirmed, Pending, or unexpired Checking out locks)
	const { data: bookings } = await supabase
		.from('bookings')
		.select('event_date, status, locked_at')
		.eq('mua_id', muaId)
		.gte('event_date', new Date().toISOString().split('T')[0]);

	const occupiedDates =
		bookings
			?.filter(
				(b) =>
					['CONFIRMED', 'PENDING_APPROVAL'].includes(b.status) ||
					(b.status === 'CHECKING_OUT' &&
						new Date(b.locked_at).getTime() > Date.now() - 10 * 60 * 1000)
			)
			.map((b) => b.event_date) || [];

	const disabledDates = new Set([
		...(blackouts?.map((b) => b.blackout_date) || []),
		...occupiedDates
	]);

	return {
		muaSlug: mua_slug,
		studioName: config?.studio_name || 'Makeup Studio',
		whatsappNumber: config?.whatsapp_number || '',
		packages: packages || [],
		disabledDates: Array.from(disabledDates)
	};
};
