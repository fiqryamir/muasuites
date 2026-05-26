<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { z } from 'zod';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText
	} from '$lib/components/ui/input-group';
	import * as Select from '$lib/components/ui/select';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field';

	let supabase = $derived(page.data.supabase);
	let session = $derived(page.data.session);

	let loading = $state(true);
	let userId = $state('');
	let muaSlug = $state('');
	let muaPlan = $state<'FREE' | 'PRO' | 'ELITE'>('FREE');
	let accessToken = $state('');

	let bookings = $state<any[]>([]);

	// Generator state
	let showGenerator = $state(false);
	let transportOverride = $state(0);
	let customSurcharge = $state(0);
	let surchargeRemark = $state('');
	let depositModeOverride = $state<'FIXED' | 'PERCENT'>('FIXED');
	let depositValueOverride = $state<number | null>(null);
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

	function fmtTime(t: string) {
		if (!t) return '';
		const [h, m] = t.split(':');
		const hr = parseInt(h);
		const sfx = hr >= 12 ? 'PM' : 'AM';
		const dh = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
		return `${dh}:${m} ${sfx}`;
	}

	function fmtCurrency(a: number | string) {
		return `RM ${Number(a).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
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

		await loadBookings();
	});

	async function loadBookings() {
		loading = true;
		const { data } = await supabase
			.from('bookings')
			.select('*, packages(*)')
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
	<div class="flex items-center justify-center py-24">
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
			<span class="text-sm">Loading bookings...</span>
		</div>
	</div>
{:else}
	<div class="space-y-6 sm:space-y-8 animate-in-up">
		<!-- Header -->
		<div class="flex items-start justify-between gap-4">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Bookings</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Your schedule and client checkouts at a glance.
				</p>
			</div>
			<Button
				variant={showGenerator ? 'outline' : 'default'}
				class="shrink-0"
				onclick={() => {
					if (showGenerator) {
						resetGenerator();
					} else {
						showGenerator = true;
					}
				}}
			>
				{showGenerator ? 'Close' : 'Create Link'}
			</Button>
		</div>

		<!-- Quick Stats -->
		<div class="grid grid-cols-3 overflow-hidden rounded-lg border border-border">
			<div class="border-r border-border p-3 text-center sm:p-4">
				<p class="text-xl font-semibold tabular-nums sm:text-2xl">
					{pendingBookings.length}
				</p>
				<p class="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">Pending</p>
			</div>
			<div class="border-r border-border p-3 text-center sm:p-4">
				<p class="text-xl font-semibold tabular-nums sm:text-2xl">
					{upcomingBookings.length}
				</p>
				<p class="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">Confirmed</p>
			</div>
			<div class="p-3 text-center sm:p-4">
				<p class="text-xl font-semibold tabular-nums sm:text-2xl">
					{activeBookingsCount}<span
						class="text-base font-normal text-muted-foreground sm:text-lg"
						>{muaPlan === 'FREE' ? ' / 2' : ''}</span
					>
				</p>
				<p class="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
					{muaPlan === 'FREE' ? 'Free slots' : 'Active'}
				</p>
			</div>
		</div>

		<!-- Generator Panel -->
		{#if showGenerator}
			<Card.Root class="animate-in-up">
				<Card.Header>
					<Card.Title>Invite Link Generator</Card.Title>
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
								class="rounded-lg border border-border bg-muted/40 p-4"
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
									Copy Link
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
									<FieldLabel htmlFor="transport">Transport Fee</FieldLabel>
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
								<!-- <div class="space-y-2">
									<label for="transport" class="text-sm font-medium">
										Transport Fee
									</label>
								</div> -->

								<Field class="gap-2">
									<FieldLabel htmlFor="surcharge">Custom Surcharge</FieldLabel>
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
									<FieldLabel htmlFor="remark">Surcharge Remark</FieldLabel>
									<Input
									id="remark"
									placeholder="e.g., early morning surcharge, holiday fee"
									bind:value={surchargeRemark}
								/>
								</Field>
							</FieldGroup>

							<Separator />

							<!-- Deposit overrides -->
							<FieldGroup class="grid gap-4 sm:grid-cols-2">
								<!-- Deposit Mode Selection -->
								<Field class="gap-2">
									<FieldLabel htmlFor="dep_mode">
										Deposit Override <span class="font-normal text-muted-foreground">(optional)</span>
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
									<FieldLabel htmlFor="dep_val">
										Override Value <span class="font-normal text-muted-foreground">(optional)</span>
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
									{generating ? 'Generating...' : 'Generate Link'}
								</Button>
							</div>
						</form>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Empty state when nothing exists -->
		{#if bookings.length === 0 && !showGenerator}
			<div
				class="rounded-lg border border-dashed border-border py-12 text-center space-y-2"
			>
				<p class="text-sm font-medium">No bookings yet</p>
				<p class="text-xs text-muted-foreground max-w-xs mx-auto">
					Create an invite link and share it with your client on WhatsApp. Their deposit
					payment will appear here for review.
				</p>
				<div class="pt-2">
					<Button onclick={() => (showGenerator = true)}>Create Your First Link</Button>
				</div>
			</div>
		{:else}
			<!-- Pending Review -->
			{#if pendingBookings.length > 0}
				<section class="space-y-3">
					<div class="flex items-center gap-2">
						<span class="h-2 w-2 rounded-full bg-primary"></span>
						<h2 class="text-sm font-semibold">
							Pending Review
							<span class="font-normal text-muted-foreground"
								>({pendingBookings.length})</span
							>
						</h2>
					</div>

					<div class="space-y-2">
						{#each pendingBookings as booking}
							<Card.Root>
								<Card.Content class="space-y-3">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1 space-y-0.5">
											<p class="text-sm font-medium truncate">
												{booking.client_name || 'Anonymous'}
											</p>
											<p class="text-xs text-muted-foreground">
												{fmtDate(booking.event_date)}
												{#if booking.packages?.name}
													&middot; {booking.packages.emoji}
													{booking.packages.name}
												{/if}
											</p>
										</div>
										<div class="shrink-0 text-right">
											<p class="text-sm font-semibold tabular-nums text-primary">
												{fmtCurrency(booking.deposit_amount)}
											</p>
											<p class="text-[11px] text-muted-foreground">deposit</p>
										</div>
									</div>

									<div class="flex items-center gap-2 pt-1">
										{#if booking.receipt_url}
											<a
												href={booking.receipt_url}
												target="_blank"
												class="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
											>
												View receipt
											</a>
										{/if}
										<div class="flex-1"></div>
										<Button
											size="sm"
											onclick={() => handleApprove(booking)}
										>
											Approve
										</Button>
									</div>
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Upcoming Schedule -->
			<section class="space-y-3">
				<h2 class="text-sm font-semibold">
					Upcoming
					<span class="font-normal text-muted-foreground"
						>({upcomingBookings.length})</span
					>
				</h2>

				{#if upcomingBookings.length > 0}
					<div class="space-y-2">
						{#each upcomingBookings as booking}
							<Card.Root>
								<Card.Content class="">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1 space-y-0.5">
											<p class="text-sm font-medium truncate">
												{booking.client_name || 'Client'}
											</p>
											<p class="text-xs text-muted-foreground">
												{fmtDate(booking.event_date)}
												{#if booking.event_time}
													&middot; {fmtTime(booking.event_time)}
												{/if}
												{#if booking.venue_address}
													<br class="sm:hidden" />
													<span class="hidden sm:inline">&middot;</span>
													{booking.venue_address}
												{/if}
											</p>
											{#if booking.packages?.name}
												<p class="text-xs text-muted-foreground">
													{booking.packages.emoji}
													{booking.packages.name}
												</p>
											{/if}
										</div>
										<div class="shrink-0 text-right space-y-0.5">
											<p class="text-sm font-semibold tabular-nums">
												{fmtCurrency(booking.total_amount)}
											</p>
											{#if booking.balance_amount > 0}
												<p class="text-[11px] text-muted-foreground">
													Balance: {fmtCurrency(booking.balance_amount)}
												</p>
											{/if}
										</div>
									</div>

									<div class="flex items-center justify-end gap-2 pt-3">
										{#if booking.client_phone}
											<a
												href={`https://wa.me/${booking.client_phone?.replace?.(/^0/, '60') || booking.client_phone}`}
												target="_blank"
												class="inline-flex h-8 items-center rounded-md px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
											>
												WhatsApp
											</a>
										{/if}
										<a
											href={`/api/calendar/${booking.id}?token=${accessToken}`}
											target="_blank"
											class="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-muted transition-colors"
										>
											Download .ics
										</a>
									</div>
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				{:else}
					<div class="rounded-lg border border-dashed border-border py-8 text-center">
						<p class="text-xs text-muted-foreground">No upcoming confirmed events.</p>
					</div>
				{/if}
			</section>

			<!-- Past History (Collapsible) -->
			{#if pastBookings.length > 0}
				<Separator />

				<section class="space-y-3">
					<button
						type="button"
						onclick={() => (showPast = !showPast)}
						class="flex w-full items-center justify-between text-sm font-semibold hover:text-foreground transition-colors text-muted-foreground"
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
						<div class="space-y-2 animate-in-up">
							{#each pastBookings as booking}
								<Card.Root class="bg-muted/30">
									<Card.Content class="p-3 sm:p-4">
										<div class="flex items-center justify-between gap-3">
											<div class="min-w-0 flex-1 space-y-0.5">
												<div class="flex items-center gap-2">
													<p class="text-sm font-medium truncate">
														{booking.client_name || 'Past Client'}
													</p>
													{#if booking.status === 'REJECTED'}
														<span
															class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground"
														>
															Rejected
														</span>
													{/if}
												</div>
												<p class="text-xs text-muted-foreground">
													{fmtDate(booking.event_date)}
													{#if booking.packages?.name}
														&middot; {booking.packages.name}
													{/if}
												</p>
											</div>
											<div class="flex items-center gap-3 shrink-0">
												<span class="text-sm font-medium tabular-nums text-muted-foreground">
													{fmtCurrency(booking.total_amount)}
												</span>
												<a
													href={`/api/calendar/${booking.id}?token=${accessToken}`}
													target="_blank"
													class="inline-flex h-7 items-center rounded-md border border-border bg-background px-2 text-[11px] font-medium hover:bg-muted transition-colors"
												>
													.ics
												</a>
											</div>
										</div>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					{/if}
				</section>
			{/if}
		{/if}
	</div>
{/if}
