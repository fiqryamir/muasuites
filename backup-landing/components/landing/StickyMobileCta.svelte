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
		class="border-border/60 bg-background/90 animate-in-up fixed inset-x-0 bottom-0 z-40 border-t px-5 pt-3 backdrop-blur-sm md:hidden"
		style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));"
	>
		<div class="flex items-center justify-between gap-3">
			<p class="text-muted-foreground text-xs leading-snug">
				Free to start<br />No card required
			</p>
			<Button href="/login" class="shrink-0">Start free</Button>
		</div>
	</div>
{/if}
