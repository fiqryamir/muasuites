<script lang="ts">
	import { CalendarCheck2, Route, Wallet, Send, ReceiptText, ShieldCheck } from '@lucide/svelte';

	const features = [
		{
			icon: CalendarCheck2,
			title: 'Live availability calendar',
			body: 'Clients check your open dates themselves, before they ever message you. You stop answering the same question thirty times a month.'
		},
		{
			icon: Route,
			title: 'Travel fees without the maths',
			body: 'Set your rate once. The fee from your studio to their venue is calculated automatically — and you can override it for any booking.'
		},
		{
			icon: Wallet,
			title: 'Deposits your way',
			body: 'A fixed amount or a percentage, configured once in your settings — adjusted per booking whenever you need to.'
		},
		{
			icon: Send,
			title: 'Telegram, your front desk',
			body: 'New bookings arrive with the receipt attached. Approve or decline right from the chat — no dashboard required.'
		},
		{
			icon: ReceiptText,
			title: 'Surcharges with a reason',
			body: 'Early call time? Out-of-state venue? Add the fee and its reason. Clients see it itemised on the quote — considered, not invented.'
		},
		{
			icon: ShieldCheck,
			title: 'Double-booking-proof',
			body: 'A paid slot locks the date for everyone else. Two brides, one morning — never again.'
		}
	];
</script>

<section id="features" class="scroll-mt-20 py-20 sm:py-28">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<div class="max-w-2xl">
			<h2 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
				Everything after the chat, handled
			</h2>
		</div>

		<div class="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as feature (feature.title)}
				<div>
					<feature.icon class="text-primary h-5 w-5" />
					<h3 class="mt-4 text-base font-semibold">{feature.title}</h3>
					<p class="text-muted-foreground mt-2 text-sm leading-relaxed">{feature.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
