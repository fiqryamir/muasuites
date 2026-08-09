<script lang="ts">
	const steps = [
		{
			title: 'A client checks you out',
			body: 'She opens your studio page, sees your live availability and a travel estimate for her venue — then WhatsApps you. The message is already half-written for her.'
		},
		{
			title: 'You reply with a link',
			body: 'You confirm the date, then generate a booking link in under a minute: travel fee auto-calculated from your rate, any surcharge with its reason attached, your price, your deposit. Sent in the same chat you were already in.'
		},
		{
			title: 'She books like a checkout',
			body: 'Five calm steps on her phone: date, package, event details, deposit by DuitNow QR, receipt uploaded. Her slot is held for ten minutes while she pays — no one else can take it.'
		},
		{
			title: 'You approve, and it’s booked',
			body: 'Telegram pings you with the receipt attached. You check the transfer in your own banking app, tap approve — the date is blocked and lands in your calendar automatically.'
		}
	];
</script>

<section id="how-it-works" class="bg-muted/40 scroll-mt-20 py-20 sm:py-28">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<h2 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
			How a booking actually happens
		</h2>

		<ol class="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
			{#each steps as step, i (step.title)}
				<li class="relative">
					<span
						class="bg-card ring-foreground/10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ring-1"
					>
						{i + 1}
					</span>
					<h3 class="mt-5 text-base font-semibold">{step.title}</h3>
					<p class="text-muted-foreground mt-2 text-sm leading-relaxed">{step.body}</p>
				</li>
			{/each}
		</ol>
	</div>
</section>
