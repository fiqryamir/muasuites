<script lang="ts">
	import Reveal from './Reveal.svelte';
	import CtaButton from './CtaButton.svelte';
</script>

<section class="landing-wash relative overflow-hidden">
	<div
		class="bg-primary/[0.05] absolute -right-40 -bottom-52 size-[36rem] rounded-full"
		aria-hidden="true"
	></div>

	<div class="relative mx-auto w-full max-w-6xl px-5 py-28 text-center sm:px-8 sm:py-40">
		<Reveal>
			<h2
				class="font-display mx-auto max-w-3xl text-4xl leading-[1.08] font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl"
			>
				Next time someone asks if you cover their venue — answer with
				<span class="text-primary italic">a link.</span>
			</h2>
		</Reveal>

		<Reveal delay={120} class="mt-10">
			<div class="flex justify-center">
				<CtaButton href="/login" size="lg" class="px-7">Create your first booking link</CtaButton>
			</div>
		</Reveal>

		<Reveal delay={200} class="mt-6">
			<p class="text-muted-foreground text-xs">
				Free to start · Set up in minutes · No card required
			</p>
		</Reveal>
	</div>
</section>
