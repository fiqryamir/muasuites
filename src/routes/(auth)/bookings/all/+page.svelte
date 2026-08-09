<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import * as Select from '$lib/components/ui/select';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field';
	import { Separator } from '$lib/components/ui/separator';
	import * as Dialog from '$lib/components/ui/dialog';
	import BookingDetailDialog from '$lib/components/ui/booking-detail-dialog.svelte';
	import type { BookingSearchResult, BookingFilters } from '$lib/bookings';
	import ReceiptButtons from '$lib/components/ui/receipt-buttons.svelte';
	import WhatsAppRemind from '$lib/components/ui/whatsapp-remind.svelte';
	import { fmtDate, fmtDateShort, fmtTime, fmtTimeRange, fmtCurrency, getInitials, relativeTime, statusLabel, statusColor } from '$lib/bookings-ui';

	let { data } = $props();

	let bookingsResult = $state<BookingSearchResult>(data.bookings);
	let filters = $state<BookingFilters>(data.filters);

	// Detail dialog state
	let showDetailsDialog = $state(false);
	let selectedBooking = $state<any>(null);

	// Pending local filter changes before navigation
	let localQuery = $state(filters.query || '');
	let localDateFrom = $state<Date | undefined>(filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00') : undefined);
	let localDateTo = $state<Date | undefined>(filters.dateTo ? new Date(filters.dateTo + 'T00:00:00') : undefined);
	let localStatus = $state<string>(typeof filters.status === 'string' ? filters.status : '');

	// Sync Date objects → YYYY-MM-DD strings when applying filters
	function dateToStr(d: Date | undefined): string {
		if (!d) return '';
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	// Sync when page data changes (e.g. browser back/forward)
	$effect(() => {
		bookingsResult = data.bookings;
		filters = data.filters;
		localQuery = data.filters.query || '';
		localDateFrom = data.filters.dateFrom ? new Date(data.filters.dateFrom + 'T00:00:00') : undefined;
		localDateTo = data.filters.dateTo ? new Date(data.filters.dateTo + 'T00:00:00') : undefined;
		localStatus = typeof data.filters.status === 'string' ? data.filters.status : '';
	});

	const todayStr = new Date().toISOString().split('T')[0];

	function openDetails(booking: any) {
		selectedBooking = booking;
		showDetailsDialog = true;
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (localQuery) params.set('q', localQuery);
		const dateFromStr = dateToStr(localDateFrom);
		if (dateFromStr) params.set('dateFrom', dateFromStr);
		const dateToStrVal = dateToStr(localDateTo);
		if (dateToStrVal) params.set('dateTo', dateToStrVal);
		if (localStatus) params.set('status', localStatus);
		if (filters.sort && filters.sort !== 'event_date') params.set('sort', filters.sort);
		if (filters.dir && filters.dir !== 'desc') params.set('dir', filters.dir);
		params.set('page', '1');
		goto(`/bookings/all?${params.toString()}`);
	}

	function clearFilters() {
		goto('/bookings/all');
	}

	function goToPage(p: number) {
		const params = new URLSearchParams(window.location.search);
		params.set('page', String(p));
		goto(`/bookings/all?${params.toString()}`);
	}

	function setSort(field: string) {
		const params = new URLSearchParams(window.location.search);
		if (filters.sort === field) {
			params.set('dir', filters.dir === 'asc' ? 'desc' : 'asc');
		} else {
			params.set('sort', field);
			params.set('dir', 'desc');
		}
		params.set('page', '1');
		goto(`/bookings/all?${params.toString()}`);
	}

	function sortIcon(field: string) {
		if (filters.sort !== field) return '';
		return filters.dir === 'asc' ? ' ↑' : ' ↓';
	}

	// Exposed from $lib/bookings-ui:
	// fmtDate, fmtDateShort, fmtTime, fmtTimeRange, fmtCurrency, getInitials, relativeTime, statusLabel, statusColor
</script>

<div class="space-y-6 animate-in-up">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-xl font-semibold tracking-tight">All bookings</h1>
			<p class="mt-0.5 text-sm text-muted-foreground">
				{bookingsResult.count} booking{bookingsResult.count !== 1 ? 's' : ''}
			</p>
		</div>
		<Button
			variant="outline"
			onclick={() => goto('/bookings')}
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
			Back to dashboard
		</Button>
	</div>

	<!-- Filter bar -->
	<div class="rounded-xl bg-muted/30 p-4 ring-1 ring-foreground/10 space-y-4">
		<div class="grid gap-3 sm:grid-cols-4">
			<!-- Search -->
			<div class="sm:col-span-2">
				<Input
					placeholder="Search by client name…"
					bind:value={localQuery}
					onkeydown={(e) => { if (e.key === 'Enter') applyFilters(); }}
				/>
			</div>

			<!-- Status filter -->
			<div>
				<Select.Root type="single" bind:value={localStatus}>
					<Select.Trigger id="status-filter" class="flex h-10 w-full items-center justify-between rounded-full border-none bg-muted px-4 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring">
						{localStatus ? statusLabel(localStatus) : 'All statuses'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">All statuses</Select.Item>
						<Select.Item value="PENDING_APPROVAL">Needs review</Select.Item>
						<Select.Item value="CONFIRMED">Confirmed</Select.Item>
						<Select.Item value="FULLY_PAID">Fully paid</Select.Item>
						<Select.Item value="CHECKING_OUT">Checking out</Select.Item>
						<Select.Item value="COMPLETED">Completed</Select.Item>
						<Select.Item value="EXPIRED">Expired</Select.Item>
						<Select.Item value="CANCELLED">Cancelled</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<!-- Date range (second row) -->
		<div class="grid gap-3 sm:grid-cols-3">
			<div>
				<label for="dateFrom" class="mb-1 block text-xs text-muted-foreground">From date</label>
				<DatePicker
					bind:value={localDateFrom}
					placeholder="Pick a start date"
				/>
			</div>
			<div>
				<label for="dateTo" class="mb-1 block text-xs text-muted-foreground">To date</label>
				<DatePicker
					bind:value={localDateTo}
					placeholder="Pick an end date"
				/>
			</div>
			<div class="flex items-end gap-2">
				<Button onclick={applyFilters} class="flex-1">
					Apply
				</Button>
				<Button variant="outline" onclick={clearFilters} class="flex-1">
					Clear
				</Button>
			</div>
		</div>
	</div>

	<!-- Sort bar -->
	<div class="flex items-center gap-2 text-xs text-muted-foreground">
		<span>Sort by:</span>
		<button
			onclick={() => setSort('event_date')}
			class="rounded-full px-3 py-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {filters.sort === 'event_date' ? 'bg-muted font-medium text-foreground' : ''}"
		>
			Date{sortIcon('event_date')}
		</button>
		<button
			onclick={() => setSort('client_name')}
			class="rounded-full px-3 py-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {filters.sort === 'client_name' ? 'bg-muted font-medium text-foreground' : ''}"
		>
			Name{sortIcon('client_name')}
		</button>
		<button
			onclick={() => setSort('total_amount')}
			class="rounded-full px-3 py-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {filters.sort === 'total_amount' ? 'bg-muted font-medium text-foreground' : ''}"
		>
			Amount{sortIcon('total_amount')}
		</button>
	</div>

	<!-- Empty state -->
	{#if bookingsResult.data.length === 0}
		<div class="rounded-xl border border-dashed border-border py-14 text-center space-y-3">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
				🔍
			</div>
			<div class="space-y-1">
				<p class="text-sm font-medium">No bookings match your filters</p>
				<p class="text-xs text-muted-foreground max-w-xs mx-auto">
					Try adjusting your search or clearing the filters.
				</p>
			</div>
			<div class="pt-1">
				<Button variant="outline" onclick={clearFilters}>Clear filters</Button>
			</div>
		</div>
	{:else}
		<!-- Booking cards -->
		<div class="space-y-3">
						{#each bookingsResult.data as booking}
							{@const _todayStr = new Date().toISOString().split('T')[0]}
							{@const _isOverdue = booking.status === 'CONFIRMED' && booking.balance_due_date ? booking.balance_due_date < _todayStr : false}
							{@const _overdueDays = _isOverdue && booking.balance_due_date
								? Math.max(1, Math.ceil((Date.now() - new Date(booking.balance_due_date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)))
								: 0}
							<div class="bg-card text-card-foreground ring-1 ring-foreground/10 rounded-xl p-4 space-y-4">
					<!-- Header: avatar + name + price + status badge -->
					<div class="flex items-start justify-between gap-3">
						<div class="flex items-center gap-3 min-w-0">
							<div class="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
								{getInitials(booking.client_name)}
							</div>
							<div class="min-w-0">
								<p class="text-sm font-semibold truncate">{booking.client_name || 'Client'}</p>
								<span class="inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium {statusColor(booking.status)}">
									{statusLabel(booking.status)}
								</span>
							</div>
						</div>
						<div class="shrink-0 text-right">
							<p class="text-xs text-muted-foreground">
								{#if booking.status === 'PENDING_APPROVAL'}
									Deposit
								{:else if booking.balance_amount > 0}
									Balance due
								{:else}
									Total
								{/if}
							</p>
							<p class="text-base font-bold tabular-nums">
								{booking.status === 'PENDING_APPROVAL'
									? fmtCurrency(booking.deposit_amount)
									: fmtCurrency(booking.total_amount)}
							</p>
						</div>
					</div>

					<!-- Pill tags -->
					<div class="flex flex-wrap items-center gap-2">
						{#if booking.event_date}
							<span class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
								<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
								{fmtDateShort(booking.event_date)}
								{#if booking.event_time && booking.packages?.duration_hours}
									· {fmtTimeRange(booking.event_time, booking.packages.duration_hours)}
								{:else if booking.event_time}
									· {fmtTime(booking.event_time)}
								{/if}
								· {relativeTime(booking.event_date)}
							</span>
						{/if}
						{#if booking.venue_address}
							<span class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground truncate max-w-[200px]">
								<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
								{booking.venue_address}
							</span>
						{/if}
						{#if booking.packages?.name}
							<span class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
								{booking.packages.emoji} {booking.packages.name}
							</span>
						{/if}
						{#if _isOverdue}
							<span class="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-1 text-xs text-destructive">
								Overdue · {_overdueDays}d
							</span>
						{/if}
						<div class="ml-auto"></div>
						{#if ['CONFIRMED', 'FULLY_PAID'].includes(booking.status) && booking.id && page.data.session?.access_token}
							<a
								href={`/api/calendar/${booking.id}?token=${page.data.session.access_token}`}
								target="_blank"
								class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
								Calendar
							</a>
						{/if}
						<button
							type="button"
							onclick={() => openDetails(booking)}
							class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
							Details
						</button>
					</div>

					<!-- Divider + Actions -->
					{#if booking.receipt_url || (booking.client_phone && ['CONFIRMED', 'FULLY_PAID'].includes(booking.status))}
						<Separator />
						<div class="flex gap-2">
					<ReceiptButtons depositReceiptUrl={booking.receipt_url} balanceReceiptUrl={booking.balance_receipt_url} />
							{#if booking.client_phone && ['CONFIRMED', 'FULLY_PAID'].includes(booking.status)}
								<WhatsAppRemind
									clientPhone={booking.client_phone}
									clientName={booking.client_name}
									bookingStatus={booking.status}
									balanceAmount={booking.balance_amount}
									balanceToken={booking.balance_token}
									eventDate={booking.event_date}
									isOverdue={_isOverdue}
									overdueDays={_overdueDays}
								/>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Pagination -->
		{#if bookingsResult.totalPages > 1}
			<nav class="flex items-center justify-center gap-2 pt-2">
				<button
					type="button"
					disabled={bookingsResult.page <= 1}
					onclick={() => goToPage(bookingsResult.page - 1)}
					class="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {bookingsResult.page <= 1 ? 'text-muted-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
					Previous
				</button>

				<div class="flex items-center gap-1">
					{#each { length: Math.min(bookingsResult.totalPages, 7) } as _, i}
						{@const pageNum = (() => {
							const total = bookingsResult.totalPages;
							const current = bookingsResult.page;
							if (total <= 7) return i + 1;
							if (current <= 4) return i + 1;
							if (current >= total - 3) return total - 6 + i;
							return current - 3 + i;
						})()}
						<button
							type="button"
							onclick={() => goToPage(pageNum)}
							class="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {pageNum === bookingsResult.page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}"
						>
							{pageNum}
						</button>
					{/each}
				</div>

				<button
					type="button"
					disabled={bookingsResult.page >= bookingsResult.totalPages}
					onclick={() => goToPage(bookingsResult.page + 1)}
					class="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {bookingsResult.page >= bookingsResult.totalPages ? 'text-muted-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}"
				>
					Next
					<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
				</button>
			</nav>
		{/if}
	{/if}
</div>

<!-- View Details Dialog -->
<BookingDetailDialog bind:open={showDetailsDialog} booking={selectedBooking} />
