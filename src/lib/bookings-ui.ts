/**
 * Shared UI helpers for the bookings dashboard.
 * Deduplicated from inline functions in bookings/+page.svelte and bookings/all/+page.svelte.
 */

export function fmtDate(d: string) {
	return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

export function fmtDateShort(d: string) {
	return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
		day: 'numeric',
		month: 'short'
	});
}

export function fmtTime(t: string) {
	if (!t) return '';
	const [h, m] = t.split(':');
	const hr = parseInt(h);
	const sfx = hr >= 12 ? 'PM' : 'AM';
	const dh = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
	return `${dh}:${m} ${sfx}`;
}

export function fmtTimeRange(t: string, durationHours?: number) {
	if (!t || !durationHours) return fmtTime(t);
	const [h, m] = t.split(':').map(Number);
	const totalStartMin = h * 60 + m;
	const totalEndMin = totalStartMin + durationHours * 60;
	const endH = Math.floor(totalEndMin / 60) % 24;
	const endM = totalEndMin % 60;
	const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
	return `${fmtTime(t)} – ${fmtTime(endTime)}`;
}

export function fmtCurrency(a: number | string) {
	return `RM ${Number(a).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
}

export function getInitials(name: string | null) {
	if (!name) return '?';
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
	return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function relativeTime(dateStr: string): string {
	if (!dateStr) return '';
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const date = new Date(dateStr + 'T00:00:00');
	const diffMs = date.getTime() - today.getTime();
	const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
	if (diffDays === 0) return 'today';
	if (diffDays === 1) return 'tomorrow';
	if (diffDays === -1) return 'yesterday';
	if (diffDays > 0) return `in ${diffDays} days`;
	return `${Math.abs(diffDays)} days ago`;
}

export function statusLabel(status: string): string {
	const labels: Record<string, string> = {
		PENDING_APPROVAL: 'Needs review',
		CONFIRMED: 'Confirmed',
		FULLY_PAID: 'Fully paid',
		CHECKING_OUT: 'Checking out',
		EXPIRED: 'Expired',
		CANCELLED: 'Cancelled',
		COMPLETED: 'Completed'
	};
	return labels[status] || status;
}

export function statusColor(status: string): string {
	const colors: Record<string, string> = {
		PENDING_APPROVAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
		CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
		FULLY_PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
		CHECKING_OUT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
		EXPIRED: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
		CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
		COMPLETED: 'bg-muted text-muted-foreground'
	};
	return colors[status] || 'bg-muted text-muted-foreground';
}