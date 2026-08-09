<script lang="ts">
	import Reveal from './Reveal.svelte';
	import Eyebrow from './Eyebrow.svelte';

	const items = [
		['Bridal makeup', 'RM 888.00'],
		['Travel fee — Grand Hyatt KL', 'RM 50.00'],
		['Early call time — before 6 am', 'RM 50.00']
	];
</script>

<section class="py-24 sm:py-36">
	<div
		class="mx-auto grid w-full max-w-6xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20"
	>
		<Reveal>
			<div class="max-w-xl">
				<Eyebrow>your studio</Eyebrow>
				<h2 class="font-display mt-5 text-4xl font-medium tracking-tight text-balance sm:text-5xl">
					Look like a studio, even if
					<span class="text-primary italic">it's just you</span>
				</h2>
				<p class="text-muted-foreground mt-6 text-lg leading-relaxed text-pretty">
					Every link you send opens a page with your studio name, your packages, and an itemised
					quote — service, travel, and any surcharge with its reason printed next to it.
				</p>
				<p class="text-muted-foreground mt-4 text-lg leading-relaxed text-pretty">
					Clients stop negotiating when the numbers look this considered.
				</p>
			</div>
		</Reveal>

		<Reveal delay={140} y={48}>
			<div class="lg:sticky lg:top-28">
				<div class="shadow-ambient bezel-outer mx-auto w-full max-w-md">
					<div class="bezel-inner p-6 sm:p-8">
						<p class="text-muted-foreground text-xs font-medium">Aina Beauty Studio</p>
						<p class="font-display mt-1 text-xl font-medium tracking-tight">Your booking quote</p>

						<div class="mt-6 space-y-4 text-sm">
							{#each items as [label, amount] (label)}
								<div class="flex items-baseline gap-2.5">
									<span>{label}</span>
									<span
										class="border-foreground/15 flex-1 border-b border-dotted"
										aria-hidden="true"
									></span>
									<span class="font-medium">{amount}</span>
								</div>
							{/each}
						</div>

						<div
							class="border-foreground/10 mt-6 flex items-baseline justify-between gap-4 border-t pt-5"
						>
							<span class="font-medium">Total</span>
							<span class="font-display text-2xl font-medium tracking-tight"> RM 988.00 </span>
						</div>

						<div class="bg-primary/[0.06] mt-6 rounded-2xl p-4">
							<div class="flex items-baseline justify-between gap-4 text-sm">
								<span class="font-medium">Deposit to secure your date</span>
								<span class="text-primary font-semibold">RM 469.00</span>
							</div>
							<p class="text-muted-foreground mt-1 text-xs">
								Balance of RM 519.00 on the event day
							</p>
						</div>
					</div>
				</div>
			</div>
		</Reveal>
	</div>
</section>
