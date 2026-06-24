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
	import { Separator } from '$lib/components/ui/separator';
	import BookingDetailDialog from '$lib/components/ui/booking-detail-dialog.svelte';
	import ReceiptButtons from '$lib/components/ui/receipt-buttons.svelte';
	import WhatsAppRemind from '$lib/components/ui/whatsapp-remind.svelte';
	import { fmtDate, fmtDateShort, fmtTime, fmtTimeRange, fmtCurrency, getInitials, relativeTime, statusLabel, statusColor } from '$lib/bookings-ui';

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
	let showAdvanced = $state(false);
	let transportOverride = $state(0);
	let customSurcharge = $state(0);
	let surchargeRemark = $state('');
	let depositModeOverride = $state<'FIXED' | 'PERCENT'>('FIXED');
	let depositValueOverride = $state<number | null>(null);
	let bufferMinutesOverrideStr = $state('');
	let bufferMinutesOverride = $derived(bufferMinutesOverrideStr === '' ? null : parseInt(bufferMinutesOverrideStr, 10));
	let balanceDueDaysOverrideStr = $state('');
	let balanceDueDaysOverride = $derived(balanceDueDaysOverrideStr === '' ? null : parseInt(balanceDueDaysOverrideStr, 10));
	let generatedUrl = $state('');
	let generating = $state(false);

	const todayStr = new Date().toISOString().split('T')[0];

	const pendingBookings = $derived(
		bookings.filter((b) => b.status === 'PENDING_APPROVAL')
	);

	const upcomingBookingsAll = $derived(
		bookings.filter(
			(b) =>
				['CONFIRMED', 'FULLY_PAID'].includes(b.status) &&
				b.event_date >= todayStr
		)
	);

	const upcomingBookings = $derived(upcomingBookingsAll.slice(0, 5));

	const activeBookingsCount = $derived(
		bookings.filter(
			(b) =>
				b.event_date >= todayStr &&
				['CONFIRMED', 'FULLY_PAID', 'PENDING_APPROVAL', 'CHECKING_OUT'].includes(b.status)
		).length
	);

	const thisMonthRevenue = $derived(
		bookings
			.filter(
				(b) =>
					['CONFIRMED', 'FULLY_PAID'].includes(b.status) &&
					b.event_date?.startsWith(todayStr.slice(0, 7))
			)
			.reduce((sum, b) => sum + Number(b.total_amount || 0), 0)
	);

	const atCapacity = $derived(muaPlan === 'FREE' && activeBookingsCount >= 2);

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

	// Local helpers not in shared bookings-ui
	function getDayNum(d: string) {
		return new Date(d + 'T00:00:00').getDate();
	}

	function getMonthShort(d: string) {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { month: 'short' });
	}

	function getWeekday(d: string) {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { weekday: 'short' });
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

		// Fetch studio name and config defaults for greeting
		const { data: config } = await supabase
			.from('mua_configs')
			.select('studio_name, default_transport_fee')
			.eq('mua_id', userId)
			.single();

		if (config?.studio_name) {
			studioName = config.studio_name;
		}

		// Pre-fill transport fee from config if set
		if (config?.default_transport_fee) {
			transportOverride = config.default_transport_fee;
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
				balance_due_days_before_override: balanceDueDaysOverride,
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
		showAdvanced = false;
		generatedUrl = '';
		transportOverride = 0;
		customSurcharge = 0;
		surchargeRemark = '';
		depositModeOverride = 'FIXED';
		depositValueOverride = null;
	}

	async function handleReject(booking: any) {
		if (!confirm(`Reject deposit from ${booking.client_name || 'this client'}? This will cancel the booking.`)) return;

		const { error } = await supabase
			.from('bookings')
			.update({ status: 'CANCELLED' })
			.eq('id', booking.id);

		if (error) {
			toast.error('Rejection failed: ' + error.message);
		} else {
			toast.success('Booking rejected.');
			await loadBookings();
		}
	}

	async function handleApprove(booking: any) {
		if (!confirm(`Approve payment from ${booking.client_name || 'this client'}?`)) return;

		// Compute balance_due_date: event_date - balance_due_days_before
		if (booking.balance_amount > 0) {
			// Fetch MUA's configured cutoff from mua_configs
			const { data: cfg } = await supabase
				.from('mua_configs')
				.select('balance_due_days_before')
				.eq('mua_id', userId)
				.single();
			const dueDays = cfg?.balance_due_days_before ?? 3;

			const eventDate = new Date(booking.event_date + 'T00:00:00');
			const dueDate = new Date(eventDate);
			dueDate.setDate(dueDate.getDate() - dueDays);
			const dueDateStr = dueDate.toISOString().split('T')[0];

			// Generate a balance token for the payment page
			const balanceToken = crypto.randomUUID();

			const { error } = await supabase
				.from('bookings')
				.update({
					status: 'CONFIRMED',
					balance_due_date: dueDateStr,
					balance_token: balanceToken
				})
				.eq('id', booking.id);

			if (error) {
				toast.error('Approval failed: ' + error.message);
			} else {
				toast.success('Booking confirmed.');
				// Notify MUA via Telegram about balance link
				fetch('/api/notify-balance', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ bookingId: booking.id, balanceToken })
				}).catch(() => {});
				await loadBookings();
			}
		} else {
			// No balance — just confirm directly
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
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-xl bg-muted/40 p-3 text-center ring-1 ring-foreground/10 sm:p-4">
				<p class="text-xl font-semibold tabular-nums sm:text-2xl">
					{pendingBookings.length}
				</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Needs review</p>
			</div>
			<div class="rounded-xl bg-muted/40 p-3 text-center ring-1 ring-foreground/10 sm:p-4">
				<p class="text-xl font-semibold tabular-nums sm:text-2xl">
					{upcomingBookings.length}
				</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Confirmed</p>
			</div>
			<div class="rounded-xl bg-muted/40 p-3 text-center ring-1 ring-foreground/10 sm:p-4">
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
			<div class="rounded-xl bg-muted/40 p-3 text-center ring-1 ring-foreground/10 sm:p-4">
				<p class="text-base font-semibold tabular-nums sm:text-xl">
					{fmtCurrency(thisMonthRevenue)}
				</p>
				<p class="mt-0.5 text-xs text-muted-foreground">Revenue this month</p>
			</div>
		</div>

		{#if atCapacity}
			<!-- Capacity limit reached: warm upgrade nudge -->
			<div class="rounded-xl border border-border bg-muted/30 p-4 text-center space-y-2">
				<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
				</div>
				<p class="text-sm font-medium">You're all booked up</p>
				<p class="text-xs text-muted-foreground max-w-xs mx-auto">
					You're at the free plan's 2-booking cap. Upgrading to Pro or Elite unlocks unlimited bookings, so you never have to turn a client away.
				</p>
			</div>
		{:else}
			<!-- Create link button — label stays "Create link" regardless of generator state -->
			<div>
				<Button
					variant={showGenerator ? 'outline' : pendingBookings.length > 0 ? 'secondary' : 'default'}
					onclick={() => {
						if (showGenerator) {
							resetGenerator();
						} else {
							showGenerator = true;
						}
					}}
					aria-expanded={showGenerator}
					class="gap-1.5"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
					Create link
				</Button>
			</div>
		{/if}

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
									Create another link
								</button>
							</div>
						</div>
					{:else}
						<form onsubmit={handleGenerateLink} class="space-y-4">
							<!-- Core fields (always visible) -->
							<FieldGroup class="gap-4">
								<div class="grid gap-4 sm:grid-cols-2">
									<Field class="gap-2">
										<FieldLabel>Transport fee</FieldLabel>
										<InputGroup>
											<InputGroupAddon>
												<InputGroupText class="text-muted-foreground">RM</InputGroupText>
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
												<InputGroupText class="text-muted-foreground">RM</InputGroupText>
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
								</div>

								<Field class="gap-2">
									<FieldLabel>Surcharge remark</FieldLabel>
									<Input
										id="remark"
										placeholder="e.g., early morning surcharge, holiday fee"
										bind:value={surchargeRemark}
									/>
								</Field>
							</FieldGroup>

							<!-- Advanced options toggle -->
							<div class="flex justify-center">
								<button
									type="button"
									onclick={() => (showAdvanced = !showAdvanced)}
									class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="transition-transform {showAdvanced ? 'rotate-180' : ''}"
									>
										<path d="m6 9 6 6 6-6"/>
									</svg>
									{showAdvanced ? 'Hide advanced options' : 'Advanced options'}
								</button>
							</div>

							{#if showAdvanced}
								<div class="space-y-4 animate-in-up">
									<FieldGroup class="gap-4">
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

									<Field class="gap-2">
										<FieldLabel>Balance payment deadline <span class="font-normal text-muted-foreground">(optional)</span></FieldLabel>
										<div class="flex items-center gap-2">
											<Input
												id="balance_due_override"
												type="number"
												min="0"
												max="30"
												placeholder="Use default"
												bind:value={balanceDueDaysOverrideStr}
												class="w-36 rounded-full bg-muted border-none px-4"
											/>
											<span class="text-sm text-muted-foreground">days before event</span>
										</div>
									</Field>

									<Separator />

									<!-- Deposit overrides -->
									<FieldGroup class="grid gap-4 sm:grid-cols-2">
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
								</div>
							{/if}

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
		{#if bookings.length === 0 && !showGenerator && !atCapacity}
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
						{#each pendingBookings as booking, i}
							<div class="bg-card text-card-foreground ring-1 ring-foreground/10 rounded-xl p-4 space-y-4">
								<!-- Header: avatar + name + price + status pill -->
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
										<p class="text-xs text-muted-foreground">Deposit</p>
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
									<div class="ml-auto"></div>
									<button
										type="button"
										onclick={() => openDetails(booking)}
										class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
										Details
									</button>
								</div>

								<Separator />

							<!-- Actions -->
							<div class="flex gap-2">
								<ReceiptButtons depositReceiptUrl={booking.receipt_url} balanceReceiptUrl={booking.balance_receipt_url} />
									<Button
										variant="default"
										onclick={() => handleApprove(booking)}
										class="min-h-[44px] flex-1"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
										Approve
									</Button>
									<Button
										variant="destructive"
										onclick={() => handleReject(booking)}
										class="min-h-[44px] flex-1"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
										Reject
									</Button>
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
							{@const todayStr2 = new Date().toISOString().split('T')[0]}
							{@const _isOverdue = booking.status === 'CONFIRMED' && booking.balance_due_date ? booking.balance_due_date < todayStr2 : false}
							{@const _overdueDays = _isOverdue && booking.balance_due_date
								? Math.max(1, Math.ceil((Date.now() - new Date(booking.balance_due_date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)))
								: 0}
							<div class="bg-card text-card-foreground ring-1 ring-foreground/10 rounded-xl p-4 space-y-4">
								<!-- Header: avatar + name + price + status pill -->
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
										{#if booking.balance_amount > 0}
											<p class="text-xs {_isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}">
												{_isOverdue ? 'Overdue' : 'Balance due'}
											</p>
										{:else}
											<p class="text-xs text-muted-foreground">Total</p>
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
									<a
										href={`/api/calendar/${booking.id}?token=${accessToken}`}
										target="_blank"
										class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
										Calendar
									</a>
									<button
										type="button"
										onclick={() => openDetails(booking)}
										class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
										Details
									</button>
								</div>

								<Separator />

							<!-- Actions -->
							<div class="flex gap-2">
								<ReceiptButtons depositReceiptUrl={booking.receipt_url} balanceReceiptUrl={booking.balance_receipt_url} />
									{#if booking.client_phone}
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
							</div>
						{/each}
					</div>
				{:else}
					<div class="rounded-xl border border-dashed border-border py-8 text-center">
						<p class="text-xs text-muted-foreground">No upcoming confirmed events.</p>
					</div>
				{/if}
			</section>

			<!-- View all links -->
			<section class="space-y-2 pt-1">
				{#if pendingBookings.length > 0}
					<a
						href="/bookings/all?status=PENDING_APPROVAL"
						class="flex items-center justify-between rounded-xl bg-muted/30 p-3 text-sm text-muted-foreground hover:text-foreground transition-colors ring-1 ring-foreground/10"
					>
						<span>View all needs review</span>
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
					</a>
				{/if}
				{#if upcomingBookingsAll.length > 5}
					<a
						href="/bookings/all?status=CONFIRMED"
						class="flex items-center justify-between rounded-xl bg-muted/30 p-3 text-sm text-muted-foreground hover:text-foreground transition-colors ring-1 ring-foreground/10"
					>
						<span>View all upcoming</span>
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
					</a>
				{/if}
				<a
					href="/bookings/all?status=COMPLETED&sort=event_date&dir=desc"
					class="flex items-center justify-between rounded-xl bg-muted/30 p-3 text-sm text-muted-foreground hover:text-foreground transition-colors ring-1 ring-foreground/10"
				>
					<span>View history</span>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
				</a>
			</section>
		{/if}
	</div>
{/if}

<!-- View Details Dialog -->
<BookingDetailDialog bind:open={showDetailsDialog} booking={selectedBooking} />