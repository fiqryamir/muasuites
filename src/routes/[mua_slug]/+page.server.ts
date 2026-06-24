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

	// 4. Fetch currently occupied time slots grouped by date
	// Optimized: filters out old CHECKING_OUT holds directly in the SQL engine
	const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
	const todayString = new Date().toISOString().split('T')[0];

	const { data: bookings } = await supabase
		.from('bookings')
		.select('event_date, event_time, status, locked_at, client_name, packages!inner(name, emoji, duration_hours)')
		.eq('mua_id', muaId)
		.gte('event_date', todayString)
		.or(`status.in.("CONFIRMED","PENDING_APPROVAL"),and(status.eq.CHECKING_OUT,locked_at.gt.${tenMinutesAgo})`);

	// Group bookings by date into DaySlot arrays
	const daySlots: Record<string, DaySlot[]> = {};
	for (const b of bookings || []) {
		const dateKey = b.event_date;
		if (!daySlots[dateKey]) daySlots[dateKey] = [];
		daySlots[dateKey].push({
			time: b.event_time?.slice(0, 5) || '00:00',
			clientName: b.client_name || 'Client',
			packageName: b.packages?.name || '',
			packageEmoji: b.packages?.emoji || '💄',
			durationHours: b.packages?.duration_hours || 3.0,
			bufferMinutes: 0 // The buffer doesn't need to display publicly
		});
	}

	// Build a set of date strings that are at capacity or blacked out
	// For the public page, we consider a date "disabled" only if:
	//   - It's a blackout date
	//   - OR the working hours have no remaining capacity (simplified: just show blackouts + bookings info)
	const blackoutDateSet = new Set(blackouts?.map((b: any) => b.blackout_date) || []);

	return {
		muaSlug: mua_slug,
		studioName: config?.studio_name || 'Makeup Studio',
		whatsappNumber: config?.whatsapp_number || '',
		packages: packages || [],
		daySlots,
		blackoutDates: Array.from(blackoutDateSet),
		baseLat: config?.base_lat,
		baseLng: config?.base_lng,
		ratePerKm: config?.rate_per_km,
		workingHoursStart: config?.working_hours_start?.slice(0, 5) || '08:00',
		workingHoursEnd: config?.working_hours_end?.slice(0, 5) || '18:00',
		defaultBufferMinutes: config?.default_buffer_minutes ?? 0
	};
};