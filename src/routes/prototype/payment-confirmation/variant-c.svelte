<script lang="ts">
	import { sample } from './sample';

	let paymentKind = $state<'Deposit' | 'Balance'>('Deposit');
	let superseded = $state(false);
	let copied = $state(false);

	const amount = $derived(paymentKind === 'Deposit' ? sample.deposit : sample.balance);
	const remaining = $derived(paymentKind === 'Deposit' ? sample.balance : 'RM 0.00');

	async function share() {
		await navigator.clipboard?.writeText(`MUA Payment Confirmation ${sample.confirmationNumber}`);
		copied = true;
		setTimeout(() => (copied = false), 1800);
	}
</script>

<svelte:head>
	<title>Payment Confirmation Prototype - Pocket Pass</title>
</svelte:head>

<div class="min-h-screen bg-[#f3efe8] px-4 pb-32 pt-6 text-[#24231f] sm:px-8 sm:pt-12">
	<div class="mx-auto max-w-5xl">
		<div class="mb-7 flex items-center justify-between text-xs text-[#77736b]">
			<div class="flex items-center gap-2 font-bold tracking-[0.16em] uppercase"><span class="h-2 w-2 rounded-full bg-[#b55a45]"></span>Protected pass</div>
			<span>Preview only</span>
		</div>

		<div class="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[#d8d0c3] bg-[#faf8f4] p-3 text-xs">
			<span class="mr-1 font-semibold tracking-[0.12em] text-[#8a847b] uppercase">Prototype controls</span>
			<button type="button" onclick={() => (paymentKind = paymentKind === 'Deposit' ? 'Balance' : 'Deposit')} class="rounded-full bg-[#b55a45] px-3 py-1.5 font-semibold text-white">Preview {paymentKind === 'Deposit' ? 'Balance' : 'Deposit'}</button>
			<button type="button" onclick={() => (superseded = !superseded)} class="rounded-full border border-[#c9c0b2] px-3 py-1.5 font-semibold">{superseded ? 'Current view' : 'Superseded view'}</button>
		</div>

		<div class="grid items-start gap-8 lg:grid-cols-[minmax(0,390px)_minmax(0,1fr)] lg:justify-center">
			<div class="mx-auto w-full max-w-[390px] overflow-hidden rounded-[2.4rem] border-[7px] border-[#2c2c29] bg-[#fffdf9] shadow-[0_28px_70px_rgba(63,48,32,0.2)]">
				<div class="flex items-center justify-between px-6 pt-4 text-[10px] font-bold text-[#8a847b]"><span>9:41</span><span class="flex gap-1"><i class="h-2 w-2 rounded-full bg-[#2c2c29]"></i><i class="h-2 w-2 rounded-full bg-[#2c2c29]"></i><i class="h-2 w-2 rounded-full bg-[#2c2c29]"></i></span></div>
				<div class="px-6 pb-7 pt-8">
					<div class="flex items-start justify-between">
						<div><p class="text-xs font-bold tracking-[0.16em] text-[#b55a45] uppercase">{sample.studio}</p><p class="mt-2 text-sm text-[#77736b]">Payment confirmation</p></div>
						<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4dfd8] text-xl">✓</div>
					</div>

					{#if superseded}
						<div class="mt-16 rounded-3xl bg-[#fbf0df] p-5">
							<p class="text-xs font-bold tracking-[0.14em] text-[#966d37] uppercase">No longer current</p>
							<h1 class="mt-3 text-2xl font-bold tracking-[-0.04em]">A newer pass is ready.</h1>
							<p class="mt-3 text-sm leading-6 text-[#806c50]">Ask {sample.studio} to share the latest protected confirmation.</p>
							<button type="button" onclick={() => (superseded = false)} class="mt-5 rounded-full bg-[#2c2c29] px-4 py-2.5 text-xs font-bold text-white">View current pass</button>
						</div>
					{:else}
						<div class="mt-10 rounded-3xl bg-[#f4dfd8] p-5">
							<div class="flex items-center justify-between text-xs font-bold text-[#8d4939]"><span>{paymentKind} confirmed</span><span>MYR</span></div>
							<p class="mt-5 text-5xl font-bold tracking-[-0.07em]">{amount}</p>
							<p class="mt-2 text-sm text-[#8d4939]">Confirmed by {sample.studio}</p>
						</div>

						<div class="mt-7 space-y-5">
							<div><p class="text-xs text-[#9a948b]">For</p><p class="mt-1 font-semibold">{sample.client}</p><p class="mt-1 text-sm text-[#77736b]">{sample.packageName}</p></div>
							<div><p class="text-xs text-[#9a948b]">When</p><p class="mt-1 font-semibold">{sample.date}</p><p class="mt-1 text-sm text-[#77736b]">{sample.time}</p></div>
							<div><p class="text-xs text-[#9a948b]">Where</p><p class="mt-1 text-sm leading-6 text-[#4e4a44]">{sample.venue}</p></div>
						</div>

						<div class="mt-7 border-t border-[#e4ddd3] pt-5 text-sm">
							<div class="flex justify-between"><span class="text-[#8a847b]">Booking total</span><span class="font-semibold">{sample.total}</span></div>
							<div class="mt-3 flex justify-between"><span class="text-[#8a847b]">Balance left</span><span class="font-semibold">{remaining}</span></div>
						</div>

						<div class="mt-7 rounded-2xl border border-[#e5dfd6] p-4 text-xs leading-5 text-[#77736b]">
							<p class="font-semibold text-[#4e4a44]">Direct payment</p>
							<p class="mt-1">You paid {sample.studio} directly. MUASuites did not receive or verify the funds. Not a tax invoice.</p>
						</div>
					{/if}

					<div class="mt-7 flex items-center justify-between text-[10px] text-[#9a948b]"><span>{sample.confirmationNumber}</span><span>{sample.bookingRef}</span></div>
				</div>
			</div>

			<div class="max-w-lg pt-2 lg:pt-14">
				<p class="text-xs font-bold tracking-[0.18em] text-[#b55a45] uppercase">A shareable pass</p>
				<h1 class="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">One screen. No receipt hunting.</h1>
				<p class="mt-5 max-w-md text-base leading-7 text-[#77736b]">A compact confirmation that feels easy to save, screenshot, or show at the venue without exposing the uploaded proof.</p>

				<div class="mt-10 grid gap-3 sm:grid-cols-2">
					<button type="button" onclick={() => window.print()} class="rounded-2xl bg-[#2c2c29] px-4 py-4 text-left text-sm font-semibold text-white"><span class="block text-xs font-normal text-white/60">Keep a copy</span><span class="mt-1 block">Print / save pass</span></button>
					<button type="button" onclick={share} class="rounded-2xl border border-[#c9c0b2] bg-[#fffdf9] px-4 py-4 text-left text-sm font-semibold"><span class="block text-xs font-normal text-[#8a847b]">Send to someone</span><span class="mt-1 block">{copied ? 'Link copied' : 'Share protected link'}</span></button>
				</div>

				<div class="mt-8 flex gap-3 rounded-2xl bg-[#e7efe4] p-4 text-sm text-[#426246]"><span class="text-lg">↗</span><p><strong>Safe to share.</strong> This link shows the confirmation, not the Proof of Transfer image.</p></div>
				<p class="mt-6 text-xs leading-5 text-[#9a948b]">Confirmed at {sample.confirmedAt}. Access is protected and expires two years after the event.</p>
			</div>
		</div>
	</div>
</div>
