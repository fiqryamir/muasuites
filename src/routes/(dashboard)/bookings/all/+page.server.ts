import type { PageServerLoad } from './$types';
import { searchBookings, type BookingFilters } from '$lib/bookings';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	const { session } = await parent();

	if (!session?.user?.id) {
		return {
			bookings: { data: [], count: 0, page: 1, perPage: 20, totalPages: 0 },
			filters: {} as BookingFilters
		};
	}

	const supabase = locals.supabase;
	const muaId = session.user.id;

	// Parse filters from URL query params
	const filters: BookingFilters = {
		status: url.searchParams.get('status') || undefined,
		query: url.searchParams.get('q') || undefined,
		dateFrom: url.searchParams.get('dateFrom') || undefined,
		dateTo: url.searchParams.get('dateTo') || undefined,
		sort: (url.searchParams.get('sort') as any) || 'event_date',
		dir: (url.searchParams.get('dir') as any) || 'desc',
		page: parseInt(url.searchParams.get('page') || '1', 10),
		perPage: 20
	};

	const result = await searchBookings(supabase, muaId, filters);

	return {
		bookings: result,
		filters
	};
};