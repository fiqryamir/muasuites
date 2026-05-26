import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { mua_slug } = params;
	const { supabase } = locals; // Extract the safe, request-scoped client

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

	// 4. Fetch only currently occupied dates
	// Optimized: filters out old CHECKING_OUT holds directly in the SQL engine
	const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
	const todayString = new Date().toISOString().split('T')[0];

	const { data: bookings } = await supabase
		.from('bookings')
		.select('event_date, status, locked_at')
		.eq('mua_id', muaId)
		.gte('event_date', todayString)
		.or(`status.in.("CONFIRMED","PENDING_APPROVAL"),and(status.eq.CHECKING_OUT,locked_at.gt.${tenMinutesAgo})`);

	const occupiedDates = bookings?.map((b: any) => b.event_date) || [];

	const disabledDates = new Set([
		...(blackouts?.map((b: any) => b.blackout_date) || []),
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