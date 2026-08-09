<script lang="ts">
	import { Check } from 'phosphor-svelte';
	import Reveal from './Reveal.svelte';
	import SectionHeading from './SectionHeading.svelte';
	import CtaButton from './CtaButton.svelte';

	const freeFeatures = [
		'5 active bookings at a time',
		'Studio page with live availability',
		'Calculated travel fees',
		'Telegram notifications with receipts',
		'Calendar file on every confirmed booking'
	];

	const proFeatures = ['Unlimited active bookings', 'Everything in Free', 'Priority support'];
</script>

<section id="pricing" class="scroll-mt-24 py-24 sm:py-36">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<Reveal>
			<SectionHeading
				eyebrow="the pricing"
				title="Simple pricing, honest limits"
				class="max-w-2xl"
			/>
		</Reveal>

		<div class="mx-auto mt-16 grid max-w-4xl gap-6 lg:grid-cols-2">
			<!-- Free -->
			<Reveal y={44} class="h-full">
				<div class="bezel-outer h-full">
					<div class="bezel-inner flex h-full flex-col p-8">
						<p class="text-sm font-semibold">Free</p>
						<p class="mt-4">
							<span class="font-display text-5xl font-medium tracking-tight"> RM 0 </span>
						</p>
						<p class="text-muted-foreground mt-2 text-sm">For trying it on real clients.</p>

						<ul class="mt-7 space-y-3 text-sm">
							{#each freeFeatures as feature (feature)}
								<li class="flex items-start gap-3">
									<span
										class="bg-primary/10 text-primary flex size-5 shrink-0 items-center justify-center rounded-full"
									>
										<Check size={10} weight="bold" />
									</span>
									<span>{feature}</span>
								</li>
							{/each}
						</ul>

						<p
							class="text-muted-foreground bg-muted/70 mt-8 rounded-2xl p-4 text-xs leading-relaxed"
						>
							Reach your limit and everything keeps working — existing bookings carry on as normal.
							You simply can't generate new links until a slot frees up, or you upgrade. No surprise
							charges, ever.
						</p>

						<div class="flex-1"></div>

						<CtaButton
							href="/login"
							variant="outline"
							size="lg"
							circleClass="bg-foreground/5 text-foreground"
							class="mt-8 w-full"
						>
							Start free
						</CtaButton>
					</div>
				</div>
			</Reveal>

			<!-- Pro -->
			<Reveal y={44} delay={120} class="h-full">
				<div
					class="shadow-ambient bg-primary/10 ring-primary/30 h-full rounded-[calc(var(--radius)*3+0.5rem)] p-0.5 ring-1"
				>
					<div class="bezel-inner relative flex h-full flex-col p-8">
						<span
							class="bg-primary text-primary-foreground absolute -top-3.5 right-6 rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.18em] uppercase"
						>
							Most booked
						</span>
						<p class="text-sm font-semibold">Pro</p>
						<p class="mt-4">
							<span class="font-display text-5xl font-medium tracking-tight"> RM 30 </span>
							<span class="text-muted-foreground text-sm">/month</span>
						</p>
						<p class="text-muted-foreground mt-2 text-sm">For fully booked calendars.</p>

						<ul class="mt-7 space-y-3 text-sm">
							{#each proFeatures as feature (feature)}
								<li class="flex items-start gap-3">
									<span
										class="bg-primary/10 text-primary flex size-5 shrink-0 items-center justify-center rounded-full"
									>
										<Check size={10} weight="bold" />
									</span>
									<span>{feature}</span>
								</li>
							{/each}
						</ul>

						<div class="flex-1"></div>

						<CtaButton href="/login" size="lg" class="mt-8 w-full">Go pro</CtaButton>
					</div>
				</div>
			</Reveal>
		</div>

		<Reveal delay={100} class="mt-14">
			<p
				class="font-display text-muted-foreground mx-auto max-w-xl text-center text-xl font-medium tracking-tight text-balance sm:text-2xl"
			>
				Less than one Grab ride to a venue. Far less than
				<span class="text-primary italic">one no-show.</span>
			</p>
		</Reveal>
	</div>
</section>
