import type { SupabaseClient } from '@supabase/supabase-js';

/** Sort field for bookings query */
export type BookingSortField = 'event_date' | 'client_name' | 'total_amount' | 'created_at';

/** Sort direction */
export type BookingSortDir = 'asc' | 'desc';

/** Filters for searching bookings */
export interface BookingFilters {
	status?: string | string[];
	query?: string;
	dateFrom?: string;
	dateTo?: string;
	sort?: BookingSortField;
	dir?: BookingSortDir;
	page?: number;
	perPage?: number;
}

/** Paginated result */
export interface BookingSearchResult {
	data: any[];
	count: number;
	page: number;
	perPage: number;
	totalPages: number;
}

/**
 * Server-side booking search with pagination, filtering, and sorting.
 * Designed to be called from +page.server.ts load() functions.
 */
export async function searchBookings(
	supabase: SupabaseClient,
	muaId: string,
	filters: BookingFilters = {}
): Promise<BookingSearchResult> {
	const {
		status,
		query,
		dateFrom,
		dateTo,
		sort = 'event_date',
		dir = 'asc',
		page = 1,
		perPage = 20
	} = filters;

	// Build the query
	let builder = supabase
		.from('bookings')
		.select('*, packages(*), invites(transport_fee_override, custom_surcharge, surcharge_remark)', {
			count: 'exact'
		})
		.eq('mua_id', muaId);

	// Status filter (single or multi)
	if (status) {
		if (Array.isArray(status) && status.length > 0) {
			builder = builder.in('status', status);
		} else if (typeof status === 'string' && status.length > 0) {
			builder = builder.eq('status', status as string);
		}
	}

	// Text search on client name (case-insensitive)
	if (query && query.trim().length > 0) {
		builder = builder.ilike('client_name', `%${query.trim()}%`);
	}

	// Date range filters
	if (dateFrom) {
		builder = builder.gte('event_date', dateFrom);
	}
	if (dateTo) {
		builder = builder.lte('event_date', dateTo);
	}

	// Validate sort field is allowed (prevent SQL injection via field name)
	const allowedSorts: BookingSortField[] = ['event_date', 'client_name', 'total_amount', 'created_at'];
	const sortField = allowedSorts.includes(sort) ? sort : 'event_date';
	const sortDir = dir === 'desc' ? { ascending: false } : { ascending: true };

	// Apply pagination
	const from = (page - 1) * perPage;
	const to = from + perPage - 1;

	builder = builder
		.order(sortField, sortDir)
		.range(from, to);

	const { data, count, error } = await builder;

	if (error) {
		console.error('searchBookings error:', error);
		return {
			data: [],
			count: 0,
			page,
			perPage,
			totalPages: 0
		};
	}

	return {
		data: data || [],
		count: count ?? 0,
		page,
		perPage,
		totalPages: count ? Math.ceil(count / perPage) : 0
	};
}

/**
 * Returns only the "active" statuses that should appear in the dashboard.
 * Excludes EXPIRED, CANCELLED, COMPLETED.
 */
export const ACTIVE_STATUSES = ['CONFIRMED', 'PENDING_APPROVAL', 'CHECKING_OUT'] as const;