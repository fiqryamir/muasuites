<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	let visible = $state(false);

	onMount(() => {
		const onScroll = () => {
			visible = window.scrollY > 640;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

{#if visible}
	<div
		class="animate-in-up bg-foreground text-background shadow-ambient fixed inset-x-4 bottom-4 z-40 rounded-full px-5 py-3 backdrop-blur-xl"
		style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom) * 0.4);"
	>
		<div class="flex items-center justify-between gap-3">
			<p class="text-background/70 text-xs leading-snug">
				Free to start<br />No card required
			</p>
			<Button href="/login" class="shrink-0">Start free</Button>
		</div>
	</div>
{/if}
