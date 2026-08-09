<script lang="ts">
	import Reveal from './Reveal.svelte';
	import SectionHeading from './SectionHeading.svelte';

	const steps = [
		{
			title: 'A client checks you out',
			body: 'She opens your studio page, sees your live availability and a travel estimate for her venue — then WhatsApps you. The message is already half-written for her.'
		},
		{
			title: 'You reply with a link',
			body: 'You confirm the date, then generate a booking link in under a minute: travel fee calculated automatically from your rate, any surcharge with its reason attached, your price, your deposit. Sent in the same chat you were already in.'
		},
		{
			title: 'She books like a checkout',
			body: 'Five calm steps on her phone: date, package, event details, deposit by DuitNow QR, receipt uploaded. Her slot is held for ten minutes while she pays — no one else can take it.'
		},
		{
			title: "You approve, and it's booked",
			body: 'Telegram pings you with the receipt attached. You check the transfer in your own banking app, tap approve — the date is blocked and lands in your calendar automatically.'
		}
	];
</script>

<section id="how-it-works" class="bg-muted/40 scroll-mt-24 py-24 sm:py-36">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<Reveal>
			<SectionHeading eyebrow="the flow" title="How a booking actually happens" class="max-w-2xl" />
		</Reveal>

		<ol class="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
			{#each steps as step, i (step.title)}
				<Reveal delay={i * 110} y={40}>
					<li class="border-foreground/10 border-t pt-7">
						<span class="font-display text-primary text-5xl font-medium tracking-tight">
							{i + 1}
						</span>
						<h3 class="mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
						<p class="text-muted-foreground mt-2.5 text-sm leading-relaxed">
							{step.body}
						</p>
					</li>
				</Reveal>
			{/each}
		</ol>
	</div>
</section>
