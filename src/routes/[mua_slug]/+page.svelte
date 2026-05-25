<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	let { data } = $props();

	let targetDate = $state('');
	let availabilityStatus = $state<'FREE' | 'BOOKED' | ''>('');

	function checkAvailability(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.value) {
			availabilityStatus = '';
			return;
		}

		if (data.disabledDates.includes(target.value)) {
			availabilityStatus = 'BOOKED';
		} else {
			availabilityStatus = 'FREE';
		}
	}

	// Formatting WhatsApp inquiry text
	let whatsappInquiryUrl = $derived.by(() => {
		const dateText = targetDate ? ` on ${targetDate}` : '';
		const message = `Hi ${data.studioName}! I checked your availability profile on MUASuites and saw you are available${dateText}. Are you available to cover my bridal event?`;
		return `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(message)}`;
	});

	const minDateString = new Date().toISOString().split('T')[0];
</script>

<div class="flex min-h-screen flex-col items-center bg-slate-50 px-4 py-12">
	<div class="w-full max-w-lg space-y-6">
		<!-- Studio Profile Header -->
		<Card.Root class="text-center shadow-md">
			<Card.Content class="space-y-2 pt-8 pb-6">
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl font-bold text-white"
				>
					{data.studioName.charAt(0)}
				</div>
				<Card.Title class="text-2xl font-bold text-slate-950">{data.studioName}</Card.Title>
				<Card.Description>Premium Makeup Artist Services</Card.Description>
			</Card.Content>
		</Card.Root>

		<!-- Availability Calendar Checker -->
		<Card.Root class="shadow-md">
			<Card.Header>
				<Card.Title class="text-sm font-bold tracking-wider text-slate-500 uppercase"
					>Check Date Availability</Card.Title
				>
				<Card.Description
					>Select your wedding/event date below to see if our calendar is open.</Card.Description
				>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-1.5">
					<Input
						id="event_date"
						type="date"
						min={minDateString}
						bind:value={targetDate}
						onchange={checkAvailability}
					/>
				</div>

				{#if availabilityStatus === 'FREE'}
					<div
						class="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/35 p-4 text-center"
					>
						<p class="text-sm font-bold text-emerald-800">
							✨ Good News! We are available on this date.
						</p>
						<p class="text-[11px] text-slate-500">
							Click the button below to message us on WhatsApp with your location to receive a
							custom booking link.
						</p>
					</div>
				{:else if availabilityStatus === 'BOOKED'}
					<div class="rounded-md border border-red-200 bg-red-50/35 p-4 text-center">
						<p class="text-sm font-bold text-red-800">🔒 Date Fully Booked</p>
						<p class="text-[11px] text-slate-500">
							We currently have an active reservation holding this date slot. Feel free to inquire
							about other dates.
						</p>
					</div>
				{/if}

				<a
					href={whatsappInquiryUrl}
					target="_blank"
					class="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
				>
					Inquire Booking via WhatsApp
				</a>
			</Card.Content>
		</Card.Root>

		<!-- Service Pricing Menu List -->
		<Card.Root class="shadow-md">
			<Card.Header>
				<Card.Title class="text-sm font-bold tracking-wider text-slate-500 uppercase"
					>Service Packages Menu</Card.Title
				>
			</Card.Header>
			<Card.Content>
				<div class="divide-y divide-slate-100">
					{#each data.packages as pkg}
						<div class="flex items-center justify-between py-3 text-sm">
							<div class="flex items-center space-x-2">
								<span>{pkg.emoji}</span>
								<span class="font-medium text-slate-700">{pkg.name}</span>
							</div>
							<span class="font-bold text-slate-900">RM {pkg.price}</span>
						</div>
					{:else}
						<p class="text-sm text-slate-400 py-4 text-center">
							No service packages registered yet.
						</p>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
