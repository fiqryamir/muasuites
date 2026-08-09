<script lang="ts">
	import { onMount } from 'svelte';
	import { animate } from 'motion';
	import { Button } from '$lib/components/ui/button';
	import HeroSequence from './HeroSequence.svelte';

	let heroEl = $state<HTMLElement>();

	onMount(() => {
		if (!heroEl) return;

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const lines = heroEl.querySelectorAll('[data-hero-line]');

		if (reducedMotion) {
			lines.forEach((line) => {
				(line as HTMLElement).style.opacity = '1';
				(line as HTMLElement).style.transform = 'none';
				(line as HTMLElement).style.filter = 'none';
			});
			return;
		}

		lines.forEach((line, i) => {
			animate(
				line as HTMLElement,
				{
					opacity: [0, 1],
					transform: ['translateY(20px)', 'translateY(0)'],
					filter: ['blur(4px)', 'blur(0px)']
				},
				{ type: 'spring', bounce: 0, duration: 0.4, delay: i * 0.1 }
			);
		});
	});
</script>

<section class="landing-wash relative overflow-hidden">
	<div
		class="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-20 sm:px-8 sm:py-28"
		bind:this={heroEl}
	>
		<div class="flex max-w-xl flex-col items-center text-center">
			<h1
				class="text-4xl leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-5xl lg:text-6xl"
				data-hero-line
				style="opacity: 0; filter: blur(4px);"
			>
				Your WhatsApp stays. The chaos goes.
			</h1>
			<p
				class="text-muted-foreground mt-6 text-base leading-relaxed text-pretty sm:text-lg"
				data-hero-line
				style="opacity: 0; filter: blur(4px);"
			>
				One booking link turns a client inquiry into a paid deposit and a blocked calendar date —
				sent in the WhatsApp chat you're already having.
			</p>
			<div
				class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
				data-hero-line
				style="opacity: 0; filter: blur(4px);"
			>
				<Button href="/login" size="lg" class="w-full sm:w-auto">
					Create your first booking link
				</Button>
				<Button href="/aina-beauty" variant="outline" size="lg" class="w-full sm:w-auto">
					See a demo studio
				</Button>
			</div>
			<p
				class="text-muted-foreground mt-5 text-xs"
				data-hero-line
				style="opacity: 0; filter: blur(4px);"
			>
				Free to start · No app for your clients · Works with the calendar you already use
			</p>
		</div>

		<div class="mt-14" data-hero-line style="opacity: 0; filter: blur(4px);">
			<HeroSequence />
		</div>
	</div>
</section>
