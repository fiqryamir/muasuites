import type { SupabaseClient } from '@supabase/supabase-js';

export type ActiveBookingStatus = 'CONFIRMED' | 'FULLY_PAID' | 'PENDING_APPROVAL' | 'CHECKING_OUT';

export const ACTIVE_BOOKING_STATUSES: ActiveBookingStatus[] = [
	'CONFIRMED',
	'FULLY_PAID',
	'PENDING_APPROVAL',
	'CHECKING_OUT'
];

export function dateKey(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
		d.getDate()
	).padStart(2, '0')}`;
}

export function isActiveBooking(booking: { status: string; locked_at?: string | null }) {
	if (!ACTIVE_BOOKING_STATUSES.includes(booking.status as ActiveBookingStatus)) return false;
	if (booking.status === 'CHECKING_OUT') {
		const tenMinAgo = Date.now() - 10 * 60 * 1000;
		return (
			booking.locked_at !== null &&
			booking.locked_at !== undefined &&
			new Date(booking.locked_at).getTime() > tenMinAgo
		);
	}
	return true;
}

export async function countActiveBookingsOn(
	supabase: SupabaseClient,
	muaId: string,
	eventDate: string
) {
	const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
	const { count } = await supabase
		.from('bookings')
		.select('id', { count: 'exact', head: true })
		.eq('mua_id', muaId)
		.eq('event_date', eventDate)
		.or(
			`status.in.(CONFIRMED,FULLY_PAID,PENDING_APPROVAL),and(status.eq.CHECKING_OUT,locked_at.gt.${tenMinAgo})`
		);
	return count ?? 0;
}

export async function addBlackoutDate(
	supabase: SupabaseClient,
	muaId: string,
	eventDate: string,
	reason: string
) {
	const { error } = await supabase.from('blackout_dates').insert({
		mua_id: muaId,
		blackout_date: eventDate,
		reason: reason.trim() || null
	});
	return { error };
}

export async function removeBlackoutDate(supabase: SupabaseClient, id: number) {
	const { error } = await supabase.from('blackout_dates').delete().eq('id', id);
	return { error };
}

export function invalidatePublicProfile(slug: string) {
	if (!slug) return;
	fetch('/api/cache/invalidate', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ slugs: [slug] })
	}).catch(() => {});
}
