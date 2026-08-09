<script lang="ts">
	import { Bank, SealCheck, HandHeart } from 'phosphor-svelte';
	import Reveal from './Reveal.svelte';
	import SectionHeading from './SectionHeading.svelte';

	const points = [
		{
			icon: Bank,
			title: 'You verify every ringgit',
			body: 'A screenshot alone never books a date'
		},
		{
			icon: SealCheck,
			title: 'You approve every booking',
			body: 'No auto-confirmations, no surprise clients'
		},
		{
			icon: HandHeart,
			title: 'You keep the relationship',
			body: 'Client names and numbers are yours, always'
		}
	];
</script>

<section class="bg-muted/40 py-24 sm:py-36">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<Reveal>
			<SectionHeading
				eyebrow="the control"
				title="Nothing confirms until you say so"
				sub="Payments go straight to your own bank account — MUAsuites never touches your money. You verify every transfer in your banking app before a date is confirmed. Declined bookings are released politely, with your reason attached."
				align="center"
			/>
		</Reveal>

		<div class="mx-auto mt-16 grid max-w-4xl gap-10 sm:grid-cols-3">
			{#each points as point, i (point.title)}
				<Reveal delay={i * 110} y={36}>
					<div class="text-center">
						<div class="mx-auto w-fit">
							<div class="ring-foreground/10 rounded-2xl p-1 ring-1">
								<div
									class="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl"
								>
									<point.icon size={22} weight="light" />
								</div>
							</div>
						</div>
						<h3 class="mt-5 text-base font-semibold">{point.title}</h3>
						<p class="text-muted-foreground mt-2 text-sm">{point.body}</p>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
