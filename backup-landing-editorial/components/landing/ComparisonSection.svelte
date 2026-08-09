<script lang="ts">
	import Reveal from './Reveal.svelte';
	import SectionHeading from './SectionHeading.svelte';

	const rows = [
		{
			aspect: 'Where bookings start',
			theirs: 'A portal your clients have to find and learn',
			ours: "The WhatsApp chat you're already having"
		},
		{
			aspect: 'Your calendar',
			theirs: 'A new calendar you have to maintain',
			ours: 'The calendar you already use — confirmed dates arrive automatically'
		},
		{
			aspect: 'Confirmations',
			theirs: 'Auto-confirmed the moment someone pays',
			ours: 'Nothing confirms until you verify the payment and approve'
		},
		{
			aspect: 'Your brand',
			theirs: 'Their logo, their domain, their look',
			ours: 'Your studio name, your page, your link'
		}
	];
</script>

<section class="py-24 sm:py-36">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<Reveal>
			<SectionHeading
				eyebrow="the reframe"
				title="Why not just use a booking app?"
				sub="Most booking tools want your whole business to move into their dashboard. MUAsuites was built to stay out of the way."
				class="max-w-2xl"
			/>
		</Reveal>

		<!-- Desktop table -->
		<Reveal delay={100} class="mt-14 hidden md:block">
			<div class="bezel-outer">
				<div class="bezel-inner overflow-hidden">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="border-foreground/10 border-b">
								<th class="text-muted-foreground px-7 py-5 font-medium"></th>
								<th class="text-muted-foreground px-7 py-5 font-medium"> Typical booking apps </th>
								<th class="bg-primary/[0.05] px-7 py-5 font-semibold">MUAsuites</th>
							</tr>
						</thead>
						<tbody>
							{#each rows as row (row.aspect)}
								<tr class="border-foreground/10 border-b last:border-0">
									<th class="px-7 py-6 align-top font-medium">{row.aspect}</th>
									<td class="text-muted-foreground px-7 py-6 align-top">
										{row.theirs}
									</td>
									<td class="bg-primary/[0.05] px-7 py-6 align-top font-medium">
										{row.ours}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</Reveal>

		<!-- Mobile stacked cards -->
		<div class="mt-12 space-y-5 md:hidden">
			{#each rows as row, i (row.aspect)}
				<Reveal delay={i * 80} y={32}>
					<div class="bezel-outer">
						<div class="bezel-inner p-6">
							<p class="font-display text-lg font-medium tracking-tight">
								{row.aspect}
							</p>
							<p class="text-muted-foreground mt-3 text-sm">
								<span class="font-medium">Typical booking apps — </span>{row.theirs}
							</p>
							<p class="bg-primary/[0.05] mt-2 rounded-xl px-3.5 py-2.5 text-sm">
								<span class="font-medium">MUAsuites — </span>{row.ours}
							</p>
						</div>
					</div>
				</Reveal>
			{/each}
		</div>

		<Reveal delay={120} class="mt-20 sm:mt-24">
			<p
				class="font-display mx-auto max-w-xl text-center text-2xl leading-snug font-medium tracking-tight text-balance sm:text-3xl"
			>
				Software that knows <span class="text-primary italic">its place.</span>
			</p>
		</Reveal>
	</div>
</section>
