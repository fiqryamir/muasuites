<script lang="ts">
	import Reveal from './Reveal.svelte';
	import SectionHeading from './SectionHeading.svelte';

	const moments = [
		{
			title: '11:47 pm',
			quote: 'Sis, do you cover JB?',
			body: 'The same question, thirty times a month. Every answer typed out by hand, usually after a full day of work.',
			rotate: '-rotate-2'
		},
		{
			title: 'The ghost',
			quote: 'You sent a full quotation. They read it.',
			body: 'Then nothing. No reply, no booking, no way to know if the date is still yours to give.',
			rotate: 'rotate-[1.5deg]'
		},
		{
			title: '"Bank-in later ya"',
			quote: 'She loved your work. She picked a date.',
			body: 'The deposit was always coming "later". Later never came — and you held the date for free.',
			rotate: '-rotate-1'
		},
		{
			title: 'The double-booked Saturday',
			quote: 'Two brides. One Saturday morning.',
			body: "A notebook calendar can't warn you. By the time you noticed, someone had to be disappointed.",
			rotate: 'rotate-2'
		}
	];
</script>

<section class="relative overflow-hidden py-24 sm:py-36">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<Reveal>
			<SectionHeading eyebrow="the problem" title="Sound familiar?" class="max-w-2xl" />
		</Reveal>

		<div class="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
			{#each moments as moment, i (moment.title)}
				<Reveal delay={i * 90} y={40} class="h-full">
					<div
						class="ease-fluid h-full transition-transform duration-700 hover:z-10 hover:rotate-0 {moment.rotate}"
					>
						<div class="bezel-outer h-full">
							<div class="bezel-inner flex h-full flex-col p-6">
								<div class="bg-muted rounded-2xl rounded-tl-md px-3.5 py-2.5">
									<p class="text-[13px] leading-snug">{moment.quote}</p>
								</div>
								<p class="font-display mt-5 text-lg font-medium tracking-tight">
									{moment.title}
								</p>
								<p class="text-muted-foreground mt-2 text-sm leading-relaxed">
									{moment.body}
								</p>
							</div>
						</div>
					</div>
				</Reveal>
			{/each}
		</div>

		<Reveal delay={120} class="mt-20 sm:mt-24">
			<p
				class="font-display mx-auto max-w-3xl text-center text-2xl leading-snug font-medium tracking-tight text-balance sm:text-4xl"
			>
				The problem was never WhatsApp. It's everything that
				<span class="text-primary italic">happens after the chat.</span>
			</p>
		</Reveal>
	</div>
</section>
