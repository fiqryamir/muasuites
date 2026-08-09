<script lang="ts">
	import { Landmark, BadgeCheck, HeartHandshake } from '@lucide/svelte';

	const points = [
		{
			icon: Landmark,
			title: 'You verify every ringgit',
			body: 'A screenshot alone never books a date'
		},
		{
			icon: BadgeCheck,
			title: 'You approve every booking',
			body: 'No auto-confirmations, no surprise clients'
		},
		{
			icon: HeartHandshake,
			title: 'You keep the relationship',
			body: 'Client names and numbers are yours, always'
		}
	];
</script>

<section class="bg-muted/40 py-20 sm:py-28">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<div class="mx-auto max-w-2xl text-center">
			<h2 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
				Nothing confirms until you say so
			</h2>
			<p class="text-muted-foreground mt-4 leading-relaxed text-pretty sm:text-lg">
				Payments go straight to your own bank account — MUAsuites never touches your money. You
				verify every transfer in your banking app before a date is confirmed. Declined bookings are
				released politely, with your reason attached.
			</p>
		</div>

		<div class="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
			{#each points as point (point.title)}
				<div class="text-center">
					<point.icon class="text-primary mx-auto h-5 w-5" />
					<h3 class="mt-3 text-sm font-semibold">{point.title}</h3>
					<p class="text-muted-foreground mt-1.5 text-sm">{point.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
