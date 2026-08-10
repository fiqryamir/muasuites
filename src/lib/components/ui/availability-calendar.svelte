<script lang="ts">
	import { toast } from 'svelte-sonner';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { Button } from '$lib/components/ui/button';
	import {
		dateKey,
		isActiveBooking,
		countActiveBookingsOn,
		addBlackoutDate,
		removeBlackoutDate,
		invalidatePublicProfile
	} from '$lib/blackouts';
	import { fmtTime, statusLabel, statusColor } from '$lib/bookings-ui';

	type Booking = {
		id: string;
		event_date: string;
		event_time: string;
		client_name: string | null;
		status: string;
		packages?: { name?: string; emoji?: string } | null;
	};

	type BlackoutRow = {
		id: number;
		blackout_date: string;
		reason: string | null;
	};

	let {
		supabase,
		userId,
		slug,
		bookings = [],
		blackoutDates = [],
		onBookingClick,
		onBlackoutChange
	}: {
		supabase: SupabaseClient;
		userId: string;
		slug: string;
		bookings: Booking[];
		blackoutDates: BlackoutRow[];
		onBookingClick?: (booking: Booking) => void;
		onBlackoutChange?: () => void;
	} = $props();

	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	let currentYear = $state(new Date().getFullYear());
	let currentMonth = $state(new Date().getMonth());
	let selectedKey = $state<string | null>(null);
	let acting = $state(false);

	const todayKey = dateKey(new Date());

	const activeBookings = $derived(bookings.filter(isActiveBooking));

	const bookingsByDate = $derived.by(() => {
		const map: Record<string, Booking[]> = {};
		for (const b of activeBookings) {
			(map[b.event_date] ||= []).push(b);
		}
		return map;
	});

	const blackoutByDate = $derived.by(() => {
		const map: Record<string, BlackoutRow> = {};
		for (const row of blackoutDates) map[row.blackout_date] = row;
		return map;
	});

	const calendarDays = $derived.by(() => {
		const firstDay = new Date(currentYear, currentMonth, 1);
		const firstDayIndex = (firstDay.getDay() + 6) % 7;
		const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
		const days: (number | null)[] = [];
		for (let i = 0; i < firstDayIndex; i++) days.push(null);
		for (let d = 1; d <= daysInMonth; d++) days.push(d);
		return days;
	});

	const selectedDayBookings = $derived(selectedKey ? bookingsByDate[selectedKey] || [] : []);

	const selectedBlackout = $derived(selectedKey ? blackoutByDate[selectedKey] || null : null);

	function navigateMonth(dir: -1 | 1) {
		const next = currentMonth + dir;
		if (next < 0) {
			currentMonth = 11;
			currentYear -= 1;
		} else if (next > 11) {
			currentMonth = 0;
			currentYear += 1;
		} else {
			currentMonth = next;
		}
	}

	function dateKeyFor(day: number) {
		return `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day
			.toString()
			.padStart(2, '0')}`;
	}

	function isPast(day: number) {
		return dateKeyFor(day) < todayKey;
	}

	function isSelected(day: number) {
		return selectedKey === dateKeyFor(day);
	}

	function isToday(day: number) {
		return dateKeyFor(day) === todayKey;
	}

	function selectDay(day: number) {
		const key = dateKeyFor(day);
		if (key < todayKey) return;
		selectedKey = key;
	}

	function fmtFullDate(key: string) {
		return new Date(key + 'T00:00:00').toLocaleDateString('en-MY', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	async function handleMarkOffDay() {
		if (!selectedKey) return;
		acting = true;

		const count = await countActiveBookingsOn(supabase, userId, selectedKey);

		const { error } = await addBlackoutDate(supabase, userId, selectedKey, '');

		acting = false;

		if (error) {
			if (error.code === '23505') {
				toast.error('This date is already an off day.');
			} else {
				toast.error(error.message);
			}
			return;
		}

		if (count > 0) {
			toast.warning(
				`${count} active booking${count === 1 ? '' : 's'} on this date — existing bookings are not affected.`
			);
		} else {
			toast.success('Off day added.');
		}

		invalidatePublicProfile(slug);
		onBlackoutChange?.();
	}

	async function handleRemoveOffDay(id: number) {
		acting = true;

		const { error } = await removeBlackoutDate(supabase, id);

		acting = false;

		if (error) {
			toast.error(error.message);
			return;
		}

		toast.success('Off day removed.');
		invalidatePublicProfile(slug);
		onBlackoutChange?.();
	}
</script>

<div class="space-y-4">
	<!-- Calendar -->
	<div class="border-border bg-card rounded-lg border">
		<div class="flex items-center justify-between px-4 py-3">
			<button
				type="button"
				onclick={() => navigateMonth(-1)}
				class="hover:bg-muted focus-visible:ring-ring flex min-h-9 min-w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-1"
				aria-label="Previous month"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
				</svg>
			</button>
			<p class="text-sm font-semibold">{months[currentMonth]} {currentYear}</p>
			<button
				type="button"
				onclick={() => navigateMonth(1)}
				class="hover:bg-muted focus-visible:ring-ring flex min-h-9 min-w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-1"
				aria-label="Next month"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				</svg>
			</button>
		</div>
		<div class="px-3 pb-3">
			<div class="mb-1 grid grid-cols-7">
				{#each daysOfWeek as day (day)}
					<div
						class="text-muted-foreground flex h-8 items-center justify-center text-[11px] font-medium"
					>
						{day}
					</div>
				{/each}
			</div>
			<div class="grid grid-cols-7">
				{#each calendarDays as day, i (day === null ? 'pad-' + i : day)}
					{#if day === null}
						<div class="h-9"></div>
					{:else}
						{@const dateStr = dateKeyFor(day)}
						{@const booked = bookingsByDate[dateStr]?.length || 0}
						{@const blackedOut = blackoutByDate[dateStr] !== undefined}
						{@const past = isPast(day)}
						<div class="flex items-center justify-center">
							<button
								type="button"
								onclick={() => selectDay(day)}
								disabled={past}
								class="focus-visible:ring-ring relative flex min-h-9 min-w-9 items-center justify-center rounded-md text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-1
									{isSelected(day)
									? 'bg-primary text-primary-foreground font-semibold'
									: past
										? 'text-muted-foreground/30 cursor-not-allowed'
										: blackedOut
											? 'bg-destructive/10 text-destructive/90'
											: booked > 0
												? 'bg-primary/10 text-primary font-medium'
												: 'hover:bg-muted font-medium'}"
							>
								<span
									class={isToday(day) && !isSelected(day)
										? 'ring-foreground/30 -my-0.5 rounded-full px-1.5 py-0.5 ring-1'
										: ''}
								>
									{day}
								</span>
								{#if booked > 0 && !isSelected(day) && !blackedOut}
									<span
										class="bg-primary/80 absolute -top-0.5 -right-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full px-1 text-[9px] leading-none font-medium text-white"
									>
										{booked}
									</span>
								{/if}
							</button>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<!-- Legend -->
	<div class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs">
		<span class="inline-flex items-center gap-1.5">
			<span class="bg-destructive/10 inline-block h-2.5 w-2.5 rounded-sm"></span>
			Off day
		</span>
		<span class="inline-flex items-center gap-1.5">
			<span class="bg-primary/10 inline-block h-2.5 w-2.5 rounded-sm"></span>
			Booked
		</span>
		<span class="inline-flex items-center gap-1.5">
			<span class="ring-foreground/30 inline-block h-2.5 w-2.5 rounded-full ring-1"></span>
			Today
		</span>
	</div>

	<!-- Detail panel -->
	{#if selectedKey}
		<div class="border-border bg-muted/30 rounded-lg border p-4">
			<p class="text-muted-foreground text-xs font-medium">{fmtFullDate(selectedKey)}</p>

			{#if selectedBlackout}
				<div class="mt-2 flex items-start justify-between gap-4">
					<div class="min-w-0">
						<p class="text-sm font-medium">Off day</p>
						<p class="text-muted-foreground mt-0.5 text-xs">
							{selectedBlackout.reason || 'No reason given'}
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						disabled={acting}
						onclick={() => handleRemoveOffDay(selectedBlackout.id)}
						class="text-muted-foreground hover:text-destructive shrink-0"
					>
						{acting ? 'Removing...' : 'Remove'}
					</Button>
				</div>
			{:else if selectedDayBookings.length > 0}
				<div class="mt-2 space-y-1.5">
					{#each selectedDayBookings as b (b.id)}
						<button
							type="button"
							onclick={() => onBookingClick?.(b)}
							class="hover:bg-muted/60 flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors"
						>
							<span class="flex min-w-0 items-center gap-2.5">
								<span class="text-foreground/80 w-16 shrink-0 text-xs font-medium tabular-nums">
									{fmtTime(b.event_time)}
								</span>
								<span class="truncate text-sm">{b.client_name || 'Client'}</span>
								<span class="text-muted-foreground hidden shrink-0 text-xs sm:inline">
									{b.packages?.emoji}
									{b.packages?.name || 'Package'}
								</span>
							</span>
							<span
								class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium {statusColor(
									b.status
								)}"
							>
								{statusLabel(b.status)}
							</span>
						</button>
					{/each}
				</div>
			{:else}
				<div class="mt-2 flex items-center justify-between gap-4">
					<p class="text-muted-foreground text-sm">No bookings on this day.</p>
					<Button
						variant="outline"
						size="sm"
						disabled={acting}
						onclick={handleMarkOffDay}
						class="shrink-0 rounded-full"
					>
						{acting ? 'Adding...' : 'Mark as off day'}
					</Button>
				</div>
			{/if}
		</div>
	{/if}
</div>
