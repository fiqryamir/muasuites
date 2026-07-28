<script lang="ts">
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

<section class="py-20 sm:py-28">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<div class="max-w-2xl">
			<h2 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
				Why not just use a booking app?
			</h2>
			<p class="text-muted-foreground mt-4 leading-relaxed text-pretty sm:text-lg">
				Most booking tools want your whole business to move into their dashboard. MUAsuites was
				built to stay out of the way.
			</p>
		</div>

		<!-- Desktop table -->
		<div class="bg-card ring-foreground/10 mt-10 hidden overflow-hidden rounded-xl ring-1 md:block">
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="border-border/60 border-b">
						<th class="text-muted-foreground px-6 py-4 font-medium"></th>
						<th class="text-muted-foreground px-6 py-4 font-medium">Typical booking apps</th>
						<th class="bg-primary/[0.04] px-6 py-4 font-semibold">MUAsuites</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.aspect)}
						<tr class="border-border/60 border-b last:border-0">
							<th class="px-6 py-4 align-top font-medium">{row.aspect}</th>
							<td class="text-muted-foreground px-6 py-4 align-top">{row.theirs}</td>
							<td class="bg-primary/[0.04] px-6 py-4 align-top">{row.ours}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile stacked cards -->
		<div class="mt-10 space-y-4 md:hidden">
			{#each rows as row (row.aspect)}
				<div class="bg-card ring-foreground/10 rounded-xl p-5 ring-1">
					<p class="text-sm font-semibold">{row.aspect}</p>
					<p class="text-muted-foreground mt-3 text-sm">
						<span class="font-medium">Typical booking apps — </span>{row.theirs}
					</p>
					<p class="bg-primary/[0.04] mt-2 rounded-lg px-3 py-2 text-sm">
						<span class="font-medium">MUAsuites — </span>{row.ours}
					</p>
				</div>
			{/each}
		</div>

		<p
			class="mx-auto mt-16 max-w-xl text-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
		>
			Software that knows its place.
		</p>
	</div>
</section>
