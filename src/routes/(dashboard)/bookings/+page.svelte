<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	// State Management
	let loading = $state(true);
	let userId = $state('');
	let muaSlug = $state('');
	let muaPlan = $state('FREE');
	let accessToken = $state(''); // Stores the MUA's session token for secure calendar URLs

	let bookings = $state<any[]>([]);

	// Link Generator Form State
	let showGenerator = $state(false);
	let eventDate = $state('');
	let transportOverride = $state(0);
	let customSurcharge = $state(0);
	let surchargeRemark = $state('');
	let depositModeOverride = $state<'FIXED' | 'PERCENT'>('FIXED');
	let depositValueOverride = $state<number | null>(null);

	// Generated Link Output
	let generatedUrl = $state('');
	let generating = $state(false);

	// Ledger stats
	let pendingCount = $derived(bookings.filter((b) => b.status === 'PENDING_APPROVAL').length);
	let confirmedCount = $derived(
		bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'FULLY_PAID').length
	);

	const todayStr = new Date().toISOString().split('T')[0];

	// Free tier check
	let activeBookingsCount = $derived(
		bookings.filter(
			(b) =>
				b.event_date >= todayStr &&
				['CONFIRMED', 'PENDING_APPROVAL', 'CHECKING_OUT'].includes(b.status)
		).length
	);

	onMount(async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (!session) return;

		userId = session.user.id;
		accessToken = session.access_token || ''; // Extract secure token for link rendering

		// Fetch MUA Slug and subscription tier
		const { data: mua } = await supabase
			.from('muas')
			.select('slug, subscription_plan')
			.eq('id', userId)
			.single();

		if (mua) {
			muaSlug = mua.slug;
			muaPlan = mua.subscription_plan;
		}

		await loadDashboardData();
	});

	async function loadDashboardData() {
		loading = true;

		// Fetch Bookings Ledger
		const { data: bks } = await supabase
			.from('bookings')
			.select('*, packages(*)')
			.eq('mua_id', userId)
			.order('event_date', { ascending: true });
		bookings = bks || [];

		loading = false;
	}

	async function handleGenerateLink(e: Event) {
		e.preventDefault();
		generating = true;
		generatedUrl = '';

		if (!eventDate) {
			alert('Please select an event date.');
			generating = false;
			return;
		}

		const token = crypto.randomUUID(); // Generate unique invite token
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + 48);

		const { data: invite, error } = await supabase
			.from('invites')
			.insert({
				mua_id: userId,
				token,
				package_id: null,
				event_date: eventDate,
				transport_fee_override: transportOverride,
				custom_surcharge: customSurcharge,
				surcharge_remark: surchargeRemark,
				deposit_mode_override: depositValueOverride !== null ? depositModeOverride : null,
				deposit_value_override: depositValueOverride !== null ? depositValueOverride : null,
				expires_at: expiresAt.toISOString()
			})
			.select()
			.single();

		generating = false;

		if (error) {
			alert('Error generating invite link: ' + error.message);
		} else if (invite) {
			generatedUrl = `${window.location.origin}/${muaSlug}/${token}`;
		}
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(generatedUrl);
		alert('Booking link copied to clipboard!');
	}

	// Handle approvals on the server (no popup triggered here anymore)
	async function handleApprovePayment(booking: any) {
		if (
			!confirm(
				`Are you sure you want to approve payment from ${booking.client_name || 'this client'}?`
			)
		)
			return;

		const { error } = await supabase
			.from('bookings')
			.update({ status: 'CONFIRMED' })
			.eq('id', booking.id);

		if (error) {
			alert('Failed to approve booking: ' + error.message);
		} else {
			alert(
				'Booking successfully confirmed! You can now tap the Download .ics button next to their booking card.'
			);
			await loadDashboardData();
		}
	}

	// Segmented Ledger Lists
	let pendingBookings = $derived(bookings.filter((b) => b.status === 'PENDING_APPROVAL'));
	let upcomingBookings = $derived(
		bookings.filter(
			(b) =>
				b.status === 'CONFIRMED' &&
				new Date(b.event_date) >= new Date(new Date().setHours(0, 0, 0, 0))
		)
	);
	let pastBookings = $derived(
		bookings.filter(
			(b) =>
				new Date(b.event_date) < new Date(new Date().setHours(0, 0, 0, 0)) ||
				['REJECTED'].includes(b.status)
		)
	);
</script>

{#if loading}
	<div class="flex items-center justify-center py-12">
		<p class="animate-pulse text-sm font-semibold text-slate-500">Loading bookings workspace...</p>
	</div>
{:else}
	<div class="mx-auto max-w-4xl space-y-6">
		<!-- Header Block -->
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-slate-900">Bookings Ledger</h1>
				<p class="text-sm text-slate-500">
					Track dynamic client checkouts and manage schedule locks.
				</p>
			</div>
			<Button
				onclick={() => {
					showGenerator = !showGenerator;
					generatedUrl = '';
				}}
				class="self-start bg-slate-900 text-white hover:bg-slate-800"
			>
				{showGenerator ? 'Close Generator' : '+ Create Invite Link'}
			</Button>
		</div>

		<!-- Stats Monitor -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description class="text-xs font-semibold tracking-wider text-amber-600 uppercase"
						>Pending Approval</Card.Description
					>
					<Card.Title class="text-2xl font-bold text-amber-950">{pendingCount}</Card.Title>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description class="text-xs font-semibold tracking-wider text-emerald-600 uppercase"
						>Confirmed Slots</Card.Description
					>
					<Card.Title class="text-2xl font-bold text-emerald-950">{confirmedCount}</Card.Title>
				</Card.Header>
			</Card.Root>
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description class="text-xs font-semibold tracking-wider text-slate-500 uppercase">
						Active Capacity ({muaPlan} Plan)
					</Card.Description>
					<Card.Title class="text-2xl font-bold text-slate-900">
						{activeBookingsCount}
						{muaPlan === 'FREE' ? '/ 2' : 'slots used'}
					</Card.Title>
				</Card.Header>
			</Card.Root>
		</div>

		<!-- Generator Panel -->
		{#if showGenerator}
			<Card.Root class="border-indigo-150 bg-indigo-50/10">
				<Card.Header>
					<Card.Title class="text-indigo-950">Dynamic Invite Link Generator</Card.Title>
					<Card.Description
						>Set the parameters for this bridal event. The link allows the client to finalize
						checkout.</Card.Description
					>
				</Card.Header>
				<Card.Content>
					{#if generatedUrl}
						<div
							class="space-y-4 rounded-md border border-indigo-200 bg-indigo-50/50 p-4 text-center"
						>
							<p class="text-sm font-semibold text-indigo-900">Your custom invite link is ready!</p>
							<div
								class="flex items-center space-x-2 overflow-x-auto rounded border border-slate-200 bg-white p-2 font-mono text-xs text-slate-700 select-all"
							>
								<span>{generatedUrl}</span>
							</div>
							<div class="flex justify-center gap-3 pt-2">
								<Button variant="outline" onclick={copyToClipboard}>Copy Link</Button>
								<a
									href={`https://wa.me/?text=Hi! Here is your personalized booking link to lock your slot: ${encodeURIComponent(generatedUrl)}`}
									target="_blank"
									class="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
								>
									Share on WhatsApp
								</a>
							</div>
						</div>
					{:else}
						<form onsubmit={handleGenerateLink} class="space-y-4">
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div class="space-y-1.5 md:col-span-2">
									<label for="date" class="text-xs font-semibold text-slate-500 uppercase"
										>Event Date</label
									>
									<Input id="date" type="date" bind:value={eventDate} required />
								</div>

								<div class="space-y-1.5">
									<label
										for="dep_mode_override"
										class="text-xs font-semibold text-slate-500 uppercase"
										>Custom Deposit Mode (Optional)</label
									>
									<select
										id="dep_mode_override"
										class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
										bind:value={depositModeOverride}
									>
										<option value="FIXED">Fixed Deposit (RM)</option>
										<option value="PERCENT">Percentage of Total (%)</option>
									</select>
								</div>

								<div class="space-y-1.5">
									<label
										for="dep_val_override"
										class="text-xs font-semibold text-slate-500 uppercase"
										>Custom Deposit Value (Optional)</label
									>
									<Input
										id="dep_val_override"
										type="number"
										step="0.01"
										placeholder="Leave empty to use standard settings"
										bind:value={depositValueOverride}
									/>
								</div>

								<div class="space-y-1.5">
									<label for="transport" class="text-xs font-semibold text-slate-500 uppercase"
										>Transport Fee Surcharge (RM)</label
									>
									<Input id="transport" type="number" step="0.01" bind:value={transportOverride} />
								</div>

								<div class="space-y-1.5">
									<label for="surcharge" class="text-xs font-semibold text-slate-500 uppercase"
										>Custom Fee Surcharge (RM)</label
									>
									<Input id="surcharge" type="number" step="0.01" bind:value={customSurcharge} />
								</div>

								<div class="space-y-1.5 md:col-span-2">
									<label for="remark" class="text-xs font-semibold text-slate-500 uppercase"
										>Custom Surcharge Remarks</label
									>
									<Input
										id="remark"
										placeholder="E.g., early morning markup / holiday fee"
										bind:value={surchargeRemark}
									/>
								</div>
							</div>

							<div class="flex justify-end pt-2">
								<Button
									type="submit"
									disabled={generating}
									class="bg-indigo-650 text-white hover:bg-indigo-700"
								>
									{generating ? 'Generating Invite Link...' : 'Generate and Copy Link'}
								</Button>
							</div>
						</form>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Listings segmented by lifecycle -->
		<div class="space-y-6">
			<!-- Section A: Pending Verification -->
			<div>
				<h3 class="mb-2 text-sm font-bold tracking-wider text-amber-800 uppercase">
					Pending Verification ({pendingBookings.length})
				</h3>
				<div class="grid grid-cols-1 gap-4">
					{#each pendingBookings as booking}
						<Card.Root class="border-amber-100 bg-amber-50/10">
							<Card.Content
								class="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center"
							>
								<div>
									<div class="flex items-center space-x-2">
										<span
											class="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
											>Review Receipt</span
										>
										<span class="font-bold text-slate-900"
											>{booking.client_name || 'Anonymous Client'}</span
										>
									</div>
									<p class="pt-1 text-xs text-slate-500">
										Event Date: <span class="font-medium text-slate-800">{booking.event_date}</span>
										| Total:
										<span class="font-medium text-slate-800">RM {booking.total_amount}</span>
										| Paid Deposit:
										<span class="font-semibold text-emerald-700">RM {booking.deposit_amount}</span>
									</p>
								</div>
								<div class="flex items-center gap-2 self-end sm:self-auto">
									{#if booking.receipt_url}
										<a
											href={booking.receipt_url}
											target="_blank"
											class="mr-2 text-xs font-medium text-slate-600 underline hover:text-slate-950"
										>
											View Receipt File
										</a>
									{/if}
									<Button
										variant="outline"
										size="sm"
										onclick={() => handleApprovePayment(booking)}
										class="border-amber-200 text-amber-800 hover:bg-amber-100"
									>
										Approve Payment
									</Button>
								</div>
							</Card.Content>
						</Card.Root>
					{:else}
						<p class="text-xs text-slate-400 italic py-2">No payments awaiting review.</p>
					{/each}
				</div>
			</div>

			<!-- Section B: Upcoming Calendar Schedule (Now with Static .ics Download Link) -->
			<div>
				<h3 class="mb-2 text-sm font-bold tracking-wider text-slate-800 uppercase">
					Upcoming Schedule ({upcomingBookings.length})
				</h3>
				<div class="grid grid-cols-1 gap-4">
					{#each upcomingBookings as booking}
						<Card.Root>
							<Card.Content
								class="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center"
							>
								<div>
									<h4 class="font-bold text-slate-900">
										{booking.client_name} ({booking.client_phone})
									</h4>
									<p class="pt-1 text-xs text-slate-500">
										Date: <span class="font-semibold text-slate-700">{booking.event_date}</span> @
										<span class="font-semibold text-slate-700">{booking.event_time}</span>
										| Venue:
										<span class="font-medium text-slate-700">{booking.venue_address || 'TBD'}</span>
									</p>
								</div>
								<div class="flex items-center gap-4 self-end sm:self-auto">
									<div class="text-right text-xs">
										<span class="font-bold text-slate-900">RM {booking.total_amount}</span>
										<p class="text-[10px] font-medium text-slate-400">
											Balance: RM {booking.balance_amount}
										</p>
									</div>
									<!-- Secure static download link (Never blocked by mobile pop-up blockers) -->
									<a
										href={`/api/calendar/${booking.id}?token=${accessToken}`}
										target="_blank"
										class="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
									>
										Download .ics
									</a>
								</div>
							</Card.Content>
						</Card.Root>
					{:else}
						<p class="text-xs text-slate-400 italic py-2">
							No upcoming confirmed events scheduled.
						</p>
					{/each}
				</div>
			</div>

			<!-- Section C: Past History (Now with Static .ics Download Link) -->
			<div>
				<h3 class="mb-2 text-sm font-bold tracking-wider text-slate-400 uppercase">
					Completed & Past History ({pastBookings.length})
				</h3>
				<div class="grid grid-cols-1 gap-4 opacity-75">
					{#each pastBookings as booking}
						<Card.Root class="bg-slate-50">
							<Card.Content class="flex items-center justify-between gap-4 p-4">
								<div>
									<span class="text-xs font-medium text-slate-500 uppercase">{booking.status}</span>
									<h4 class="font-semibold text-slate-700">
										{booking.client_name || 'Past Client'}
									</h4>
									<p class="text-[10px] text-slate-400">
										{booking.event_date} | {booking.packages?.name || 'Service'}
									</p>
								</div>
								<div class="flex items-center gap-4">
									<span class="text-xs font-semibold text-slate-700">RM {booking.total_amount}</span
									>
									<a
										href={`/api/calendar/${booking.id}?token=${accessToken}`}
										target="_blank"
										class="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
									>
										Download .ics
									</a>
								</div>
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
