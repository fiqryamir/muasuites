<script lang="ts">
	import { onMount } from 'svelte';
	import { animate } from 'motion';
	import HeroSequence from './HeroSequence.svelte';
	import Reveal from './Reveal.svelte';
	import CtaButton from './CtaButton.svelte';

	const headline = ['Your', 'WhatsApp', 'stays.', 'The', 'chaos', 'goes.'];

	let heroEl = $state<HTMLElement>();

	onMount(() => {
		if (!heroEl) return;
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const words = heroEl.querySelectorAll<HTMLElement>('[data-hero-word]');
		if (reducedMotion) {
			words.forEach((w) => {
				w.style.opacity = '1';
				w.style.filter = 'none';
				w.style.transform = 'none';
			});
			return;
		}
		words.forEach((w, i) => {
			animate(
				w,
				{
					opacity: [0, 1],
					transform: ['translateY(28px)', 'translateY(0)'],
					filter: ['blur(6px)', 'blur(0px)']
				},
				{ type: 'spring', bounce: 0, duration: 0.7, delay: 0.15 + i * 0.09 }
			);
		});
	});
</script>

<section class="landing-wash relative overflow-hidden">
	<div
		class="bg-primary/[0.05] absolute -top-24 -left-32 size-[34rem] rounded-full"
		aria-hidden="true"
	></div>
	<div
		class="bg-primary/[0.06] orb absolute top-40 -right-40 size-[30rem] rounded-full"
		aria-hidden="true"
	></div>

	<div class="relative mx-auto w-full max-w-5xl px-5 pt-24 pb-20 sm:px-8 sm:pt-32 sm:pb-24">
		<div class="mx-auto flex max-w-3xl flex-col items-center text-center">
			<h1
				bind:this={heroEl}
				class="font-display flex flex-wrap justify-center gap-x-[0.3em] text-[2.75rem] leading-[1.05] font-medium tracking-[-0.02em] sm:text-6xl lg:text-7xl"
			>
				{#each headline as word, i (i)}
					<span
						class="inline-block {i === 4 ? 'text-primary italic' : ''}"
						data-hero-word
						style="opacity: 0; filter: blur(6px);"
					>
						{word}
					</span>
				{/each}
			</h1>

			<Reveal y={24} delay={850} class="mt-7 w-full">
				<p
					class="text-muted-foreground mx-auto max-w-xl text-base leading-relaxed text-pretty sm:text-lg"
				>
					One booking link turns a client inquiry into a paid deposit and a blocked calendar date —
					sent in the WhatsApp chat you're already having.
				</p>
			</Reveal>

			<Reveal y={24} delay={1000} class="mt-9 w-full">
				<div class="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
					<CtaButton href="/login" size="lg" class="w-full sm:w-auto">
						Create your first booking link
					</CtaButton>
					<CtaButton
						href="/aina-beauty"
						variant="outline"
						size="lg"
						circleClass="bg-foreground/5 text-foreground"
						class="w-full sm:w-auto"
					>
						See a demo studio
					</CtaButton>
				</div>
			</Reveal>

			<Reveal y={16} delay={1150} class="mt-6 w-full">
				<p class="text-muted-foreground text-xs">
					Free to start · No app for your clients · Works with the calendar you already use
				</p>
			</Reveal>
		</div>

		<Reveal y={56} delay={1250} class="mt-16 sm:mt-20">
			<div class="shadow-ambient mx-auto w-fit rounded-[2.75rem]">
				<HeroSequence />
			</div>
		</Reveal>
	</div>
</section>
