<script lang="ts">
	const moments = [
		{
			title: '11:47 pm',
			quote: 'Sis, do you cover JB?',
			body: 'The same question, thirty times a month. Every answer typed out by hand, usually after a full day of work.'
		},
		{
			title: 'The ghost',
			quote: 'You sent a full quotation. They read it.',
			body: 'Then nothing. No reply, no booking, no way to know if the date is still yours to give.'
		},
		{
			title: '“Bank-in later ya”',
			quote: 'She loved your work. She picked a date.',
			body: 'The deposit was always coming “later”. Later never came — and you held the date for free.'
		},
		{
			title: 'The double-booked Saturday',
			quote: 'Two brides. One Saturday morning.',
			body: "A notebook calendar can't warn you. By the time you noticed, someone had to be disappointed."
		}
	];
</script>

<section class="py-20 sm:py-28">
	<div class="mx-auto w-full max-w-6xl px-5 sm:px-8">
		<h2 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Sound familiar?</h2>

		<div class="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{#each moments as moment (moment.title)}
				<div class="bg-card ring-foreground/10 flex flex-col rounded-xl p-6 ring-1">
					<div class="bg-muted rounded-2xl rounded-tl-md px-3.5 py-2.5">
						<p class="text-[13px] leading-snug">{moment.quote}</p>
					</div>
					<p class="mt-4 text-sm font-semibold">{moment.title}</p>
					<p class="text-muted-foreground mt-1.5 text-sm leading-relaxed">{moment.body}</p>
				</div>
			{/each}
		</div>

		<p
			class="mx-auto mt-16 max-w-2xl text-center text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
		>
			The problem was never WhatsApp. It's everything that happens after the chat.
		</p>
	</div>
</section>
