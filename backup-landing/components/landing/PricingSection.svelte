<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Check } from '@lucide/svelte';

	const freeFeatures = [
		'5 active bookings at a time',
		'Studio page with live availability',
		'Auto-calculated travel fees',
		'Telegram notifications with receipts',
		'Calendar file on every confirmed booking'
	];

	const proFeatures = ['Unlimited active bookings', 'Everything in Free', 'Priority support'];
</script>

<section id="pricing" class="scroll-mt-20 py-20 sm:py-28">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<div class="max-w-2xl">
			<h2 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
				Simple pricing, honest limits
			</h2>
		</div>

		<div class="mt-10 grid gap-4 lg:grid-cols-2">
			<!-- Free -->
			<div class="bg-card ring-foreground/10 flex flex-col rounded-xl p-8 ring-1">
				<p class="text-sm font-semibold">Free</p>
				<p class="mt-4">
					<span class="text-4xl font-semibold tracking-tight">RM 0</span>
				</p>
				<p class="text-muted-foreground mt-2 text-sm">For trying it on real clients.</p>

				<ul class="mt-6 space-y-2.5 text-sm">
					{#each freeFeatures as feature (feature)}
						<li class="flex items-start gap-2.5">
							<Check class="text-primary mt-0.5 h-4 w-4 shrink-0" />
							<span>{feature}</span>
						</li>
					{/each}
				</ul>

				<p class="bg-muted/70 text-muted-foreground mt-6 rounded-xl p-4 text-xs leading-relaxed">
					Reach your limit and everything keeps working — existing bookings carry on as normal. You
					simply can't generate new links until a slot frees up, or you upgrade. No surprise
					charges, ever.
				</p>

				<Button href="/login" variant="outline" size="lg" class="mt-6 w-full">Start free</Button>
			</div>

			<!-- Pro -->
			<div class="bg-card ring-primary flex flex-col rounded-xl p-8 ring-2">
				<p class="text-sm font-semibold">Pro</p>
				<p class="mt-4">
					<span class="text-4xl font-semibold tracking-tight">RM 30</span>
					<span class="text-muted-foreground text-sm">/month</span>
				</p>
				<p class="text-muted-foreground mt-2 text-sm">For fully booked calendars.</p>

				<ul class="mt-6 space-y-2.5 text-sm">
					{#each proFeatures as feature (feature)}
						<li class="flex items-start gap-2.5">
							<Check class="text-primary mt-0.5 h-4 w-4 shrink-0" />
							<span>{feature}</span>
						</li>
					{/each}
				</ul>

				<div class="flex-1"></div>

				<Button href="/login" size="lg" class="mt-6 w-full">Go pro</Button>
			</div>
		</div>

		<p class="text-muted-foreground mx-auto mt-10 max-w-xl text-center text-sm text-balance">
			Less than one Grab ride to a venue. Far less than one no-show.
		</p>
	</div>
</section>
