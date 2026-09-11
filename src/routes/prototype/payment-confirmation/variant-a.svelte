<script lang="ts">
	import { sample } from './sample';

	let paymentKind = $state<'Deposit' | 'Balance'>('Deposit');
	let superseded = $state(false);
	let copied = $state(false);

	const amount = $derived(paymentKind === 'Deposit' ? sample.deposit : sample.balance);
	const remaining = $derived(paymentKind === 'Deposit' ? sample.balance : 'RM 0.00');

	async function share() {
		const shareText = `MUA Payment Confirmation ${sample.confirmationNumber} - ${sample.studio}`;
		if (navigator.share) {
			await navigator.share({ title: 'MUA Payment Confirmation', text: shareText });
			return;
		}
		await navigator.clipboard?.writeText(shareText);
		copied = true;
		setTimeout(() => (copied = false), 1800);
	}
</script>

<svelte:head>
	<title>Payment Confirmation Prototype - Quiet Paper</title>
</svelte:head>

<div class="min-h-screen bg-[#eee9e1] px-4 pb-28 pt-5 text-[#292622] sm:px-8 sm:pt-10">
	<div class="mx-auto max-w-3xl">
		<div class="mb-5 flex items-center justify-between text-xs text-[#716c64]">
			<span class="font-semibold tracking-[0.16em] uppercase">Protected preview</span>
			<span>Client view · {sample.studio}</span>
		</div>

		<div class="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-[#d6cfc4] bg-[#f7f3ed] p-3 text-xs">
			<span class="mr-1 font-semibold text-[#716c64] uppercase">Prototype controls</span>
			<button
				type="button"
				onclick={() => (paymentKind = paymentKind === 'Deposit' ? 'Balance' : 'Deposit')}
				class="rounded-full bg-[#292622] px-3 py-1.5 font-semibold text-[#fffaf2]"
			>
				Preview {paymentKind === 'Deposit' ? 'Balance' : 'Deposit'}
			</button>
			<button
				type="button"
				onclick={() => (superseded = !superseded)}
				class="rounded-full border border-[#bcb3a6] px-3 py-1.5 font-semibold"
			>
				{superseded ? 'Show current confirmation' : 'Preview superseded state'}
			</button>
		</div>

		<article class="overflow-hidden rounded-[2rem] border border-[#d8d0c5] bg-[#fffdf9] shadow-[0_24px_70px_rgba(60,47,30,0.13)]">
			<div class="flex items-start justify-between border-b border-dashed border-[#d8d0c5] px-6 py-7 sm:px-12 sm:py-10">
				<div>
					<div class="mb-5 flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[#a34839] uppercase">
						<span class="h-2 w-2 rounded-full bg-[#a34839]"></span>
						MUA Payment Confirmation
					</div>
					<h1 class="font-serif text-3xl tracking-[-0.04em] sm:text-5xl">{sample.studio}</h1>
					<p class="mt-2 text-sm text-[#716c64]">A payment confirmed directly by your MUA</p>
				</div>
				<div class="rounded-full border border-[#b8d5c0] bg-[#edf7ef] px-3 py-1.5 text-xs font-bold text-[#2f6e45]">
					{superseded ? 'Superseded' : 'Confirmed'}
				</div>
			</div>

			{#if superseded}
				<div class="mx-6 mt-6 rounded-2xl border border-[#e4c99d] bg-[#fff7e8] p-4 text-sm text-[#735528] sm:mx-12">
					<p class="font-semibold">This confirmation has been superseded.</p>
					<p class="mt-1 text-xs leading-5">A newer confirmation is the current record for this payment. The original remains in the MUA's audit history.</p>
					<button type="button" class="mt-3 text-xs font-bold underline underline-offset-4" onclick={() => (superseded = false)}>View current confirmation</button>
				</div>
			{:else}
				<div class="px-6 py-8 sm:px-12 sm:py-10">
					<div class="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p class="text-xs font-bold tracking-[0.14em] text-[#716c64] uppercase">{paymentKind} confirmed</p>
							<p class="mt-2 font-serif text-5xl tracking-[-0.06em] text-[#292622] sm:text-7xl">{amount}</p>
							<p class="mt-2 text-sm text-[#716c64]">Received and confirmed by {sample.studio}</p>
						</div>
						<div class="text-left sm:text-right">
							<p class="text-xs text-[#8c857b]">Confirmation number</p>
							<p class="mt-1 font-mono text-sm font-semibold">{sample.confirmationNumber}</p>
						</div>
					</div>

					<div class="my-9 grid gap-6 border-y border-[#e6dfd6] py-6 sm:grid-cols-2">
						<div>
							<p class="text-xs text-[#8c857b]">Client</p>
							<p class="mt-1 font-semibold">{sample.client}</p>
						</div>
						<div>
							<p class="text-xs text-[#8c857b]">Booking reference</p>
							<p class="mt-1 font-mono font-semibold">{sample.bookingRef}</p>
						</div>
						<div>
							<p class="text-xs text-[#8c857b]">Service</p>
							<p class="mt-1 font-semibold">{sample.packageName}</p>
						</div>
						<div>
							<p class="text-xs text-[#8c857b]">MUA confirmed at</p>
							<p class="mt-1 font-semibold">{sample.confirmedAt}</p>
						</div>
					</div>

					<div class="rounded-2xl bg-[#f6f1e9] p-5 sm:p-6">
						<div class="flex items-start justify-between gap-5">
							<div>
								<p class="text-xs font-bold tracking-[0.12em] text-[#716c64] uppercase">Appointment</p>
								<p class="mt-2 font-semibold">{sample.date} · {sample.time}</p>
								<p class="mt-1 text-sm leading-6 text-[#716c64]">{sample.venue}</p>
							</div>
							<div class="text-right text-sm">
								<p class="text-[#8c857b]">Booking total</p>
								<p class="mt-1 font-semibold">{sample.total}</p>
								<p class="mt-4 text-[#8c857b]">Remaining balance</p>
								<p class="mt-1 font-semibold">{remaining}</p>
							</div>
						</div>
					</div>

					<div class="mt-8 border-l-2 border-[#c97868] pl-4 text-sm leading-6 text-[#716c64]">
						Payment was made directly to {sample.studio}. {sample.studio} confirmed receipt. MUASuites did not receive, hold, or verify these funds. This is an informational MUA Payment Confirmation, not a tax invoice.
					</div>
				</div>
			{/if}

			<div class="flex flex-wrap items-center gap-3 border-t border-[#e6dfd6] bg-[#fbf8f3] px-6 py-5 sm:px-12">
				<button type="button" onclick={() => window.print()} class="rounded-full bg-[#292622] px-4 py-2.5 text-sm font-semibold text-[#fffaf2]">Print / save</button>
				<button type="button" onclick={share} class="rounded-full border border-[#bcb3a6] px-4 py-2.5 text-sm font-semibold">{copied ? 'Link copied' : 'Share protected link'}</button>
				<span class="ml-auto text-xs text-[#8c857b]">Private confirmation · expires in 2 years</span>
			</div>
		</article>
	</div>
</div>
