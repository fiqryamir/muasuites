<script lang="ts">
	import {
		CalendarCheck,
		MapPin,
		Wallet,
		PaperPlaneTilt,
		Receipt,
		ShieldCheck
	} from 'phosphor-svelte';
	import Reveal from './Reveal.svelte';
	import SectionHeading from './SectionHeading.svelte';

	const features = [
		{
			icon: CalendarCheck,
			title: 'Live availability calendar',
			body: 'Clients check your open dates themselves, before they ever message you. You stop answering the same question thirty times a month.'
		},
		{
			icon: MapPin,
			title: 'Travel fees without the maths',
			body: 'Set your rate once. The fee from your studio to their venue is calculated automatically — and you can override it for any booking.'
		},
		{
			icon: Wallet,
			title: 'Deposits your way',
			body: 'A fixed amount or a percentage, configured once in your settings — adjusted per booking whenever you need to.'
		},
		{
			icon: PaperPlaneTilt,
			title: 'Telegram, your front desk',
			body: 'New bookings arrive with the receipt attached. Approve or decline right from the chat — no dashboard required.'
		},
		{
			icon: Receipt,
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

<section id="features" class="scroll-mt-24 py-24 sm:py-36">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<Reveal>
			<SectionHeading
				eyebrow="the toolkit"
				title="Everything after the chat, handled"
				class="max-w-2xl"
			/>
		</Reveal>

		<div class="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
			{#each features as feature, i (feature.title)}
				<Reveal delay={(i % 3) * 90} y={36} class="h-full">
					<article
						class="group bezel-outer ease-fluid h-full transition-all duration-700 hover:-translate-y-1"
					>
						<div class="bezel-inner h-full p-7">
							<div class="ring-foreground/10 rounded-2xl p-1 ring-1">
								<div
									class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl"
								>
									<feature.icon size={19} weight="light" />
								</div>
							</div>
							<h3 class="mt-5 text-lg font-semibold tracking-tight">
								{feature.title}
							</h3>
							<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
								{feature.body}
							</p>
						</div>
					</article>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
