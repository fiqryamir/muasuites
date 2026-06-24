<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { z } from 'zod';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText
	} from '$lib/components/ui/input-group';
	import * as Select from '$lib/components/ui/select';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field';
	import * as Dialog from '$lib/components/ui/dialog';

	let supabase = $derived(page.data.supabase);
	let session = $derived(page.data.session);

	let loading = $state(true);
	let userId = $state('');
	let muaSlug = $state('');
	let muaPlan = $state<'FREE' | 'PRO' | 'ELITE'>('FREE');
	let accessToken = $state('');
	let studioName = $state('');

	let bookings = $state<any[]>([]);

	// Detail dialog state
	let showDetailsDialog = $state(false);
	let selectedBooking = $state<any>(null);

	function openDetails(booking: any) {
		selectedBooking = booking;
		showDetailsDialog = true;
	}

	// Generator state
	let showGenerator = $state(false);
	let transportOverride = $state(0);
	let customSurcharge = $state(0);
	let surchargeRemark = $state('');
	let depositModeOverride = $state<'FIXED' | 'PERCENT'>('FIXED');
	let depositValueOverride = $state<number | null>(null);
	let bufferMinutesOverrideStr = $state('');
	let bufferMinutesOverride = $derived(bufferMinutesOverrideStr === '' ? null : parseInt(bufferMinutesOverrideStr, 10));
	let generatedUrl = $state('');
	let generating = $state(false);

	// Collapsible history
	let showPast = $state(false);

	const todayStr = new Date().toISOString().split('T')[0];

	const pendingBookings = $derived(
		bookings.filter((b) => b.status === 'PENDING_APPROVAL')
	);

	const upcomingBookings = $derived(
		bookings.filter(
			(b) =>
				['CONFIRMED', 'FULLY_PAID'].includes(b.status) &&
				b.event_date >= todayStr
		)
	);

	const pastBookings = $derived(
		bookings.filter(
			(b) => b.event_date < todayStr || b.status === 'REJECTED'
		)
	);

	const activeBookingsCount = $derived(
		bookings.filter(
			(b) =>
				b.event_date >= todayStr &&
				['CONFIRMED', 'PENDING_APPROVAL', 'CHECKING_OUT'].includes(b.status)
		).length
	);

	// Greeting based on time of day
	const greeting = $derived.by(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	});

	const inviteSchema = z.object({
		transportOverride: z.number().nonnegative('Transport fee must be 0 or more.'),
		customSurcharge: z.number().nonnegative('Surcharge must be 0 or more.'),
		surchargeRemark: z.string().optional(),
		depositValueOverride: z.number().positive('Must be greater than 0.').nullable()
	});

	// Helpers
	function fmtDate(d: string) {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function fmtDateShort(d: string) {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
			day: 'numeric',
			month: 'short'
		});
	}

	function fmtTime(t: string) {
		if (!t) return '';
		const [h, m] = t.split(':');
		const hr = parseInt(h);
		const sfx = hr >= 12 ? 'PM' : 'AM';
		const dh = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
		return `${dh}:${m} ${sfx}`;
	}

	function fmtTimeRange(t: string, durationHours?: number) {
		if (!t || !durationHours) return fmtTime(t);
		const [h, m] = t.split(':').map(Number);
		const totalStartMin = h * 60 + m;
		const totalEndMin = totalStartMin + durationHours * 60;
		const endH = Math.floor(totalEndMin / 60) % 24;
		const endM = totalEndMin % 60;
		const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
		return `${fmtTime(t)} – ${fmtTime(endTime)}`;
	}

	function fmtCurrency(a: number | string) {
		return `RM ${Number(a).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
	}

	function getDayNum(d: string) {
		return new Date(d + 'T00:00:00').getDate();
	}

	function getMonthShort(d: string) {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { month: 'short' });
	}

	function getWeekday(d: string) {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { weekday: 'short' });
	}

	function getInitials(name: string | null) {
		if (!name) return '?';
		const parts = name.trim().split(/\s+/);
		if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
	}

	onMount(async () => {
		if (!session) return;
		userId = session.user.id;
		accessToken = session.access_token || '';

		const { data: mua } = await supabase
			.from('muas')
			.select('slug, subscription_plan')
			.eq('id', userId)
			.single();

		if (mua) {
			muaSlug = mua.slug;
			muaPlan = mua.subscription_plan;
		}

		// Fetch studio name for greeting
		const { data: config } = await supabase
			.from('mua_configs')
			.select('studio_name')
			.eq('mua_id', userId)
			.single();

		if (config?.studio_name) {
			studioName = config.studio_name;
		}

		await loadBookings();
	});

	async function loadBookings() {
		loading = true;
		const { data } = await supabase
			.from('bookings')
			.select('*, packages(*), invites(transport_fee_override, custom_surcharge, surcharge_remark)')
			.eq('mua_id', userId)
			.order('event_date', { ascending: true });

		bookings = data || [];
		loading = false;
	}

	async function handleGenerateLink(e: Event) {
		e.preventDefault();
		generating = true;
		generatedUrl = '';

		const result = inviteSchema.safeParse({
			transportOverride,
			customSurcharge,
			surchargeRemark,
			depositValueOverride
		});

		if (!result.success) {
			generating = false;
			toast.warning(result.error.issues[0].message);
			return;
		}

		const token = crypto.randomUUID();
		const expires = new Date();
		expires.setHours(expires.getHours() + 48);

		const { data: invite, error } = await supabase
			.from('invites')
			.insert({
				mua_id: userId,
				token,
				package_id: null,
				event_date: null,
				transport_fee_override: transportOverride,
				custom_surcharge: customSurcharge,
				surcharge_remark: surchargeRemark,
				deposit_mode_override: depositValueOverride !== null ? depositModeOverride : null,
				deposit_value_override: depositValueOverride !== null ? depositValueOverride : null,
				buffer_minutes_override: bufferMinutesOverride,
				is_used: false,
				expires_at: expires.toISOString()
			})
			.select()
			.single();

		generating = false;

		if (error) {
			toast.error('Could not generate link: ' + error.message);
		} else if (invite) {
			generatedUrl = `${window.location.origin}/${muaSlug}/${token}`;
			toast.success('Invite link ready.');
		}
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(generatedUrl);
		toast.success('Copied.');
	}

	function resetGenerator() {
		showGenerator = false;
		generatedUrl = '';
		transportOverride = 0;
		customSurcharge = 0;
		surchargeRemark = '';
		depositModeOverride = 'FIXED';
		depositValueOverride = null;
	}

	async function handleApprove(booking: any) {
		if (!confirm(`Approve payment from ${booking.client_name || 'this client'}?`)) return;

		const { error } = await supabase
			.from('bookings')
			.update({ status: 'CONFIRMED' })
			.eq('id', booking.id);

		if (error) {
			toast.error('Approval failed: ' + error.message);
		} else {
			toast.success('Booking confirmed.');
			await loadBookings();
		}
	}

	const waMessage = $derived(
		`Hi! Here is your booking link to secure your slot:\n\n${generatedUrl}\n\nPlease complete the deposit within 48 hours to confirm your date. Thank you!`
	);
</script>

{#if loading}
	<div class="flex items-center justify-center py-32">
		<div class="flex items-center gap-3 text-muted-foreground">
			<svg
				class="h-4 w-4 animate-spin"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			<span class="text-sm">Loading your bookings…</span>
		</div>
	</div>
{:else}
	<div class="space-y-6 sm:space-y-8 animate-in-up">
		<!-- Greeting header -->
		<div>
			<h1 class="text-wrap-balance text-2xl font-semibold tracking-tight">
				{greeting}{studioName ? `, ${studioName}` : ''}
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{#if bookings.length === 0}
					Your booking calendar is empty — let's fill it.
				{:else if activeBookingsCount > 0}
					{activeBookingsCount} active booking{activeBookingsCount !== 1 ? 's' : ''} this month.
				{:else}
					{bookings.length} booking{bookings.length !== 1 ? 's' : ''} on file.
				{/if}
			</p>
		</div>

		<!-- Stat cards -->
		<div class="grid grid-cols-3 gap-3">
			<div class="rounded-xl bg-muted/40 p-3 text-center sm:p-4">
				<p class="text-xl font-semibold tabular-nums sm:text-2xl">
					{pendingBookings.length}
				</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Needs review</p>
			</div>
			<div class="rounded-xl bg-muted/40 p-3 text-center sm:p-4">
				<p class="text-xl font-semibold tabular-nums sm:text-2xl">
					{upcomingBookings.length}
				</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Confirmed</p>
			</div>
			<div class="rounded-xl bg-muted/40 p-3 text-center sm:p-4">
				<p class="text-xl font-semibold tabular-nums sm:text-2xl">
					{activeBookingsCount}<span
						class="text-sm font-normal text-muted-foreground"
						>{muaPlan === 'FREE' ? ' / 2' : ''}</span
					>
				</p>
				<p class="mt-0.5 text-xs text-muted-foreground">
					{muaPlan === 'FREE' ? 'Free slots' : 'Active'}
				</p>
			</div>
		</div>

		<!-- Create link button (always visible) -->
		<div>
			<Button
				variant={showGenerator ? 'outline' : 'default'}
				onclick={() => {
					if (showGenerator) {
						resetGenerator();
					} else {
						showGenerator = true;
					}
				}}
				class="gap-1.5"
			>
				{#if showGenerator}
					Close
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
					Create link
				{/if}
			</Button>
		</div>

		<!-- Generator Panel -->
		{#if showGenerator}
			<Card.Root class="animate-in-up">
				<Card.Header>
					<Card.Title>Invite link generator</Card.Title>
					<Card.Description>
						Set fees for this client. The link lets them select a package, enter details, and pay
						their deposit.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					{#if generatedUrl}
						<div class="space-y-4">
							<!-- Generated Link Display -->
							<div
								class="rounded-xl bg-muted/40 p-4"
							>
								<p class="mb-2 text-xs font-medium text-muted-foreground">
									Your invite link
								</p>
								<p
									class="break-all font-mono text-sm text-foreground select-all"
								>
									{generatedUrl}
								</p>
							</div>

							<!-- Action Buttons -->
							<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
								<Button variant="outline" onclick={copyToClipboard}>
									Copy link
								</Button>
								<Button
									onclick={() =>
										window.open(
											`https://wa.me/?text=${encodeURIComponent(waMessage)}`,
											'_blank'
										)}
								>
									Share on WhatsApp
								</Button>
							</div>

							<div class="flex justify-center pt-1">
								<button
									type="button"
									onclick={() => (generatedUrl = '')}
									class="text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									Generate another link
								</button>
							</div>
						</div>
					{:else}
						<form onsubmit={handleGenerateLink} class="space-y-4">
							<FieldGroup class="gap-4">
								<Field class="gap-2">
									<FieldLabel>Transport fee</FieldLabel>
									<InputGroup>
										<InputGroupAddon>
											<InputGroupText class="text-muted-foreground"
												>RM</InputGroupText
											>
										</InputGroupAddon>
										<InputGroupInput
											id="transport"
											type="number"
											step="0.01"
											placeholder="0.00"
											bind:value={transportOverride}
										/>
									</InputGroup>
								</Field>

							<Field class="gap-2">
								<FieldLabel>Custom surcharge</FieldLabel>
								<InputGroup>
									<InputGroupAddon>
										<InputGroupText class="text-muted-foreground"
											>RM</InputGroupText
										>
									</InputGroupAddon>
									<InputGroupInput
										id="surcharge"
										type="number"
										step="0.01"
										placeholder="0.00"
										bind:value={customSurcharge}
									/>
								</InputGroup>
							</Field>

							<Field class="gap-2">
								<FieldLabel>Surcharge remark</FieldLabel>
								<Input
								id="remark"
								placeholder="e.g., early morning surcharge, holiday fee"
								bind:value={surchargeRemark}
							/>
							</Field>

							<!-- Buffer Override -->
							<Field class="gap-2">
								<FieldLabel>Buffer override <span class="font-normal text-muted-foreground">(optional)</span></FieldLabel>
								<Select.Root type="single" bind:value={bufferMinutesOverrideStr}>
									<Select.Trigger id="buffer_override" class="flex h-10 w-full items-center justify-between rounded-full border-none bg-muted px-4 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring">
										{bufferMinutesOverride === null ? 'Use default' : bufferMinutesOverride === 0 ? 'No buffer' : `${bufferMinutesOverride} min`}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="">Use default</Select.Item>
										<Select.Item value="0">No buffer</Select.Item>
										<Select.Item value="15">15 min</Select.Item>
										<Select.Item value="30">30 min</Select.Item>
										<Select.Item value="45">45 min</Select.Item>
										<Select.Item value="60">60 min</Select.Item>
									</Select.Content>
								</Select.Root>
								<p class="px-2 text-xs text-muted-foreground">Override the MUA's default travel buffer for this client.</p>
							</Field>
						</FieldGroup>

							<div class="bg-border h-px w-full"></div>

							<!-- Deposit overrides -->
							<FieldGroup class="grid gap-4 sm:grid-cols-2">
								<!-- Deposit Mode Selection -->
								<Field class="gap-2">
									<FieldLabel>
										Deposit override <span class="font-normal text-muted-foreground">(optional)</span>
									</FieldLabel>
									<Select.Root type="single" bind:value={depositModeOverride}>
										<Select.Trigger id="dep_mode" class="flex h-10 w-full items-center justify-between rounded-full border-none bg-muted px-4 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring">
											{depositModeOverride === 'FIXED' ? 'Fixed Amount (RM)' : 
											 depositModeOverride === 'PERCENT' ? 'Percentage (%)' : 
											 'Select mode'}
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="FIXED">Fixed Amount (RM)</Select.Item>
											<Select.Item value="PERCENT">Percentage (%)</Select.Item>
										</Select.Content>
									</Select.Root>
								</Field>
							
								<!-- Deposit Value Input -->
								<Field class="gap-2">
									<FieldLabel>
										Override value <span class="font-normal text-muted-foreground">(optional)</span>
									</FieldLabel>
									<InputGroup>
										{#if depositModeOverride === 'FIXED'}
											<InputGroupAddon>
												<InputGroupText class="text-muted-foreground">RM</InputGroupText>
											</InputGroupAddon>
										{/if}
							
										<InputGroupInput
											id="dep_val"
											type="number"
											step="0.01"
											placeholder="Leave empty for default"
											bind:value={depositValueOverride}
										/>
							
										{#if depositModeOverride === 'PERCENT'}
											<InputGroupAddon>
												<InputGroupText class="text-muted-foreground">%</InputGroupText>
											</InputGroupAddon>
										{/if}
									</InputGroup>
								</Field>
							</FieldGroup>

							<div class="flex justify-end pt-2">
								<Button type="submit" disabled={generating}>
									{generating ? 'Generating…' : 'Generate link'}
								</Button>
							</div>
						</form>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Empty state when nothing exists -->
		{#if bookings.length === 0 && !showGenerator}
			<div class="rounded-xl border border-dashed border-border py-14 text-center space-y-3">
				<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
					📅
				</div>
				<div class="space-y-1">
					<p class="text-sm font-medium">No bookings yet</p>
					<p class="text-xs text-muted-foreground max-w-xs mx-auto">
						Your booking calendar is clear. Create an invite link and share it with your client — their
						payment will appear here for review.
					</p>
				</div>
				<div class="pt-1">
					<Button onclick={() => (showGenerator = true)} class="gap-1.5">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
						Create your first link
					</Button>
				</div>
			</div>
		{:else}
			<!-- Pending Review -->
			{#if pendingBookings.length > 0}
				<section class="space-y-3">
					<h2 class="text-wrap-balance text-sm font-semibold">
						Needs review
						<span class="font-normal text-muted-foreground"
							>({pendingBookings.length})</span
						>
					</h2>

					<div class="space-y-3">
						{#each pendingBookings as booking}
							<div class="bg-card text-card-foreground rounded-xl p-4 space-y-4">
								<!-- Header: avatar + name + price -->
								<div class="flex items-start justify-between gap-3">
									<div class="flex items-center gap-3 min-w-0">
										<div class="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
											{getInitials(booking.client_name)}
										</div>
							<div class="min-w-0">
								<p class="text-sm font-semibold truncate">{booking.client_name || 'Anonymous'}</p>
							</div>
									</div>
									<div class="shrink-0 text-right">
										<p class="text-[11px] text-muted-foreground">Deposit</p>
										<p class="text-base font-bold tabular-nums">{fmtCurrency(booking.deposit_amount)}</p>
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
								<button
									type="button"
									onclick={() => openDetails(booking)}
									class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
									Details
								</button>
								</div>

								<!-- Divider -->
								<div class="border-border border-t"></div>

							<!-- Actions -->
							<div class="flex gap-2">
								{#if booking.receipt_url}
									<a
										href={booking.receipt_url}
										target="_blank"
										class="border-border text-muted-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium transition-colors"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
										View receipt
									</a>
								{/if}
								<button
									type="button"
									onclick={() => handleApprove(booking)}
									class="bg-primary text-primary-foreground inline-flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-medium transition-colors hover:bg-primary/90"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
									Approve
								</button>
							</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Upcoming Schedule -->
			<section class="space-y-3">
				<h2 class="text-wrap-balance text-sm font-semibold">
					Upcoming
					<span class="font-normal text-muted-foreground"
						>({upcomingBookings.length})</span
					>
				</h2>

				{#if upcomingBookings.length > 0}
					<div class="space-y-3">
						{#each upcomingBookings as booking}
							<div class="bg-card text-card-foreground rounded-xl p-4 space-y-4">
								<!-- Header: avatar + name + price -->
								<div class="flex items-start justify-between gap-3">
									<div class="flex items-center gap-3 min-w-0">
										<div class="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
											{getInitials(booking.client_name)}
										</div>
							<div class="min-w-0">
								<p class="text-sm font-semibold truncate">{booking.client_name || 'Client'}</p>
							</div>
									</div>
									<div class="shrink-0 text-right">
										{#if booking.balance_amount > 0}
											<p class="text-[11px] text-muted-foreground">Balance due</p>
										{:else}
											<p class="text-[11px] text-muted-foreground">Total</p>
										{/if}
										<p class="text-base font-bold tabular-nums">{fmtCurrency(booking.total_amount)}</p>
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
								<button
									type="button"
									onclick={() => openDetails(booking)}
									class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
									Details
								</button>
								</div>

								<!-- Divider -->
								<div class="border-border border-t"></div>

								<!-- Actions -->
								<div class="flex gap-2">
									{#if booking.client_phone}
										<a
											href={`https://wa.me/${booking.client_phone?.replace?.(/^0/, '60') || booking.client_phone}`}
											target="_blank"
											class="border-border text-muted-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium transition-colors"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
											WhatsApp
										</a>
									{/if}
									<a
										href={`/api/calendar/${booking.id}?token=${accessToken}`}
										target="_blank"
										class="border-border text-muted-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium transition-colors"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
										Add to calendar
									</a>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="rounded-xl border border-dashed border-border py-8 text-center">
						<p class="text-xs text-muted-foreground">No upcoming confirmed events.</p>
					</div>
				{/if}
			</section>

			<!-- Past History (Collapsible) -->
			{#if pastBookings.length > 0}
				<section class="space-y-3">
					<button
						type="button"
						onclick={() => (showPast = !showPast)}
						class="flex w-full items-center justify-between text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
					>
						<span>
							History
							<span class="font-normal">({pastBookings.length})</span>
						</span>
						<svg
							class="h-4 w-4 transition-transform {showPast ? 'rotate-180' : ''}"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if showPast}
						<div class="space-y-3 animate-in-up">
						{#each pastBookings as booking}
							<div class="bg-card text-card-foreground rounded-xl p-4 space-y-4">
								<!-- Header: avatar + name + price -->
								<div class="flex items-start justify-between gap-3">
									<div class="flex items-center gap-3 min-w-0">
										<div class="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
											{getInitials(booking.client_name)}
										</div>
										<div class="min-w-0">
											<p class="text-sm font-medium truncate">{booking.client_name || 'Past client'}</p>
										</div>
									</div>
									<div class="shrink-0 text-right">
										<p class="text-sm font-semibold tabular-nums">{fmtCurrency(booking.total_amount)}</p>
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
								<button
									type="button"
									onclick={() => openDetails(booking)}
									class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
									Details
								</button>
							</div>

							<!-- Divider -->
							<div class="border-border border-t"></div>

							<!-- Actions -->
							<div class="flex gap-2">
								{#if booking.receipt_url}
									<a
										href={booking.receipt_url}
										target="_blank"
										class="border-border text-muted-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-full border py-2.5 text-xs font-medium transition-colors"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
										View receipt
									</a>
								{/if}
							</div>
							</div>
						{/each}
						</div>
					{/if}
				</section>
			{/if}
		{/if}
	</div>
{/if}

<!-- View Details Dialog -->
{#if selectedBooking}
	<Dialog.Root bind:open={showDetailsDialog}>
		<Dialog.Content class="max-w-md rounded-xl">
			<Dialog.Header>
				<Dialog.Title>Payment details</Dialog.Title>
				<Dialog.Description>
					Breakdown for {selectedBooking.client_name || 'client'}
					{#if selectedBooking.event_date}
						· {fmtDate(selectedBooking.event_date)}
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			<div class="space-y-3">
				{#if selectedBooking.packages?.name}
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Package</span>
						<span class="font-medium">{selectedBooking.packages.emoji} {selectedBooking.packages.name}</span>
					</div>
				{/if}

				{#if selectedBooking.packages?.price}
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Base price</span>
						<span class="font-medium tabular-nums">{fmtCurrency(selectedBooking.packages.price)}</span>
					</div>
				{/if}

				{#if selectedBooking.invites?.transport_fee_override > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Transport fee</span>
						<span class="font-medium tabular-nums">{fmtCurrency(selectedBooking.invites.transport_fee_override)}</span>
					</div>
				{/if}

				{#if selectedBooking.invites?.custom_surcharge > 0}
					<div class="space-y-0.5">
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Extra surcharge</span>
							<span class="font-medium tabular-nums">{fmtCurrency(selectedBooking.invites.custom_surcharge)}</span>
						</div>
						{#if selectedBooking.invites.surcharge_remark}
							<p class="text-right text-xs text-muted-foreground">{selectedBooking.invites.surcharge_remark}</p>
						{/if}
					</div>
				{/if}

				<div class="bg-border h-px w-full"></div>

				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Total amount</span>
					<span class="font-bold tabular-nums">{fmtCurrency(selectedBooking.total_amount)}</span>
				</div>

				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Deposit paid</span>
					<span class="font-medium tabular-nums text-green-600 dark:text-green-400">{fmtCurrency(selectedBooking.deposit_amount)}</span>
				</div>

				{#if selectedBooking.balance_amount > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Balance remaining</span>
						<span class="font-medium tabular-nums">{fmtCurrency(selectedBooking.balance_amount)}</span>
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<Dialog.Close class="inline-flex items-center justify-center rounded-full bg-muted px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors">
					Close
				</Dialog.Close>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
