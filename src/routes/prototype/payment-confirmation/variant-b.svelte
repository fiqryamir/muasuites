<script lang="ts">
	import { sample } from './sample';

	let paymentKind = $state<'Deposit' | 'Balance'>('Deposit');
	let superseded = $state(false);
	let copied = $state(false);

	const amount = $derived(paymentKind === 'Deposit' ? sample.deposit : sample.balance);
	const remaining = $derived(paymentKind === 'Deposit' ? sample.balance : 'RM 0.00');

	async function share() {
		await navigator.clipboard?.writeText(`https://app.muasuites.com/confirm/demo-${sample.bookingRef}`);
		copied = true;
		setTimeout(() => (copied = false), 1800);
	}
</script>

<svelte:head>
	<title>Payment Confirmation Prototype - Ledger Timeline</title>
</svelte:head>

<div class="min-h-screen bg-[#1e211f] px-4 pb-28 pt-4 text-[#f6f1e8] sm:px-8 sm:pt-8">
	<div class="mx-auto max-w-6xl">
		<div class="mb-8 flex items-center justify-between border-b border-white/10 pb-4 text-xs">
			<div class="flex items-center gap-3">
				<span class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#d87f62] font-bold text-[#1e211f]">GA</span>
				<span class="font-semibold tracking-[0.16em] uppercase">{sample.studio}</span>
			</div>
			<span class="text-[#aeb1a8]">Protected confirmation / Client view</span>
		</div>

		<div class="mb-7 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-[#c7c8bf]">
			<span class="mr-1 font-semibold tracking-[0.12em] text-[#8e958b] uppercase">Prototype controls</span>
			<button type="button" onclick={() => (paymentKind = paymentKind === 'Deposit' ? 'Balance' : 'Deposit')} class="rounded-full bg-[#f6f1e8] px-3 py-1.5 font-semibold text-[#1e211f]">Preview {paymentKind === 'Deposit' ? 'Balance' : 'Deposit'}</button>
			<button type="button" onclick={() => (superseded = !superseded)} class="rounded-full border border-white/20 px-3 py-1.5 font-semibold">{superseded ? 'Current view' : 'Superseded view'}</button>
		</div>

		<div class="grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#292d2a] shadow-[0_28px_90px_rgba(0,0,0,0.32)] lg:grid-cols-[0.86fr_1.4fr]">
			<aside class="relative overflow-hidden bg-[#c66d58] p-7 text-[#211d1a] sm:p-10 lg:min-h-[700px]">
				<div class="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-[#e7a087]/50"></div>
				<div class="relative flex h-full flex-col">
					<div class="flex items-center justify-between text-xs font-bold tracking-[0.15em] uppercase">
						<span>MUA payment confirmation</span>
						<span class="rounded-full bg-[#211d1a]/10 px-2 py-1">{superseded ? 'Old' : 'Live'}</span>
					</div>

					{#if superseded}
						<div class="mt-20 max-w-xs">
							<p class="text-xs font-bold tracking-[0.18em] uppercase">Record superseded</p>
							<h1 class="mt-4 text-5xl font-semibold tracking-[-0.06em]">This is not the current confirmation.</h1>
							<p class="mt-5 text-sm leading-6 text-[#5f3329]">The original is retained in the MUA's audit history. Use the current protected link to view the active record.</p>
						</div>
					{:else}
						<div class="mt-auto pt-28 lg:pt-48">
							<p class="text-xs font-bold tracking-[0.18em] uppercase">{paymentKind} confirmed</p>
							<p class="mt-4 text-7xl font-semibold tracking-[-0.08em] sm:text-8xl">{amount}</p>
							<p class="mt-4 max-w-xs text-sm leading-6 text-[#5f3329]">The MUA confirmed receipt of this payment directly.</p>
						</div>

						<div class="mt-auto border-t border-[#211d1a]/20 pt-5 text-xs">
							<div class="flex justify-between gap-4"><span class="text-[#5f3329]">Confirmation</span><strong class="font-mono">{sample.confirmationNumber}</strong></div>
							<div class="mt-2 flex justify-between gap-4"><span class="text-[#5f3329]">Booking</span><strong class="font-mono">{sample.bookingRef}</strong></div>
						</div>
					{/if}
				</div>
			</aside>

			<section class="p-7 sm:p-10 lg:p-14">
				{#if superseded}
					<div class="flex h-full min-h-[420px] flex-col justify-center">
						<p class="text-xs font-bold tracking-[0.18em] text-[#d87f62] uppercase">Protected notice</p>
						<h2 class="mt-4 max-w-md text-3xl font-semibold tracking-[-0.04em]">A newer confirmation is available.</h2>
						<p class="mt-4 max-w-md text-sm leading-7 text-[#aeb1a8]">This link no longer displays a current payment record. The MUA can share the replacement confirmation with you.</p>
						<button type="button" onclick={() => (superseded = false)} class="mt-8 w-fit rounded-full bg-[#f6f1e8] px-4 py-2.5 text-sm font-semibold text-[#1e211f]">View current record</button>
					</div>
				{:else}
					<div class="flex items-start justify-between gap-5">
						<div>
							<p class="text-xs font-bold tracking-[0.18em] text-[#d87f62] uppercase">Booking snapshot</p>
							<h2 class="mt-3 text-3xl font-semibold tracking-[-0.04em]">{sample.packageName}</h2>
						</div>
						<span class="rounded-full border border-[#6da77e]/40 bg-[#6da77e]/10 px-3 py-1.5 text-xs font-bold text-[#94d0a0]">Confirmed</span>
					</div>

					<div class="mt-10 grid gap-5 border-y border-white/10 py-6 sm:grid-cols-2">
						<div><p class="text-xs text-[#8e958b]">Client</p><p class="mt-2 font-semibold">{sample.client}</p></div>
						<div><p class="text-xs text-[#8e958b]">Appointment</p><p class="mt-2 font-semibold">{sample.date}</p><p class="mt-1 text-sm text-[#aeb1a8]">{sample.time}</p></div>
						<div class="sm:col-span-2"><p class="text-xs text-[#8e958b]">Venue</p><p class="mt-2 font-semibold">{sample.venue}</p></div>
					</div>

					<div class="mt-9">
						<div class="mb-4 flex items-center justify-between"><p class="text-xs font-bold tracking-[0.16em] text-[#8e958b] uppercase">Payment trail</p><p class="text-xs text-[#8e958b]">{sample.confirmedAt}</p></div>
						<div class="relative space-y-5 pl-7 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-white/15">
							<div class="relative"><span class="absolute -left-7 top-1.5 h-3.5 w-3.5 rounded-full border-4 border-[#292d2a] bg-[#d87f62]"></span><p class="text-sm font-semibold">{paymentKind} received</p><p class="mt-1 text-xs text-[#aeb1a8]">{amount} · {sample.confirmedAt}</p></div>
							<div class="relative"><span class="absolute -left-7 top-1.5 h-3.5 w-3.5 rounded-full border-4 border-[#292d2a] bg-[#6da77e]"></span><p class="text-sm font-semibold">Confirmed by {sample.studio}</p><p class="mt-1 text-xs text-[#aeb1a8]">MUA confirmation time, not bank transfer time</p></div>
						</div>
					</div>

					<div class="mt-9 grid gap-3 rounded-2xl bg-white/[0.045] p-5 text-sm sm:grid-cols-3">
						<div><p class="text-xs text-[#8e958b]">Booking total</p><p class="mt-1 font-semibold">{sample.total}</p></div>
						<div><p class="text-xs text-[#8e958b]">Paid now</p><p class="mt-1 font-semibold">{amount}</p></div>
						<div><p class="text-xs text-[#8e958b]">Balance left</p><p class="mt-1 font-semibold">{remaining}</p></div>
					</div>

					<p class="mt-8 text-xs leading-5 text-[#8e958b]">Paid directly to {sample.studio}. MUASuites is booking software; it did not receive, hold, or verify these funds. Not a tax invoice.</p>
				{/if}

				<div class="mt-10 flex flex-wrap gap-3 border-t border-white/10 pt-6">
					<button type="button" onclick={() => window.print()} class="rounded-full bg-[#f6f1e8] px-4 py-2.5 text-sm font-semibold text-[#1e211f]">Print / save</button>
					<button type="button" onclick={share} class="rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold">{copied ? 'Link copied' : 'Share protected link'}</button>
				</div>
			</section>
		</div>
	</div>
</div>
