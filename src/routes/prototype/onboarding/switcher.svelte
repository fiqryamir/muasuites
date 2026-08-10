<script lang="ts">
	// PROTOTYPE switcher — floating bar to cycle UI variants. Throwaway.
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	interface Variant {
		key: string;
		name: string;
	}

	let { variants, current }: { variants: Variant[]; current: string } = $props();

	const label = $derived(variants.find((v) => v.key === current)?.name ?? current);

	function cycle(dir: 1 | -1) {
		const i = Math.max(variants.findIndex((v) => v.key === current), 0);
		const next = variants[(i + dir + variants.length) % variants.length];
		goto(`/prototype/onboarding?variant=${next.key}`, { replaceState: true });
	}

	function onKey(e: KeyboardEvent) {
		const t = e.target as HTMLElement | null;
		if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
		if (e.key === 'ArrowRight') cycle(1);
		if (e.key === 'ArrowLeft') cycle(-1);
	}

	onMount(() => {
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<div
	class="fixed bottom-4 left-1/2 z-[999] flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-2 py-1.5 text-background shadow-xl"
>
	<button
		type="button"
		onclick={() => cycle(-1)}
		class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-background/20"
		aria-label="Previous variant"
	>
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
	</button>
	<span class="px-1 text-xs font-semibold">Prototype · {current} — {label}</span>
	<button
		type="button"
		onclick={() => cycle(1)}
		class="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-background/20"
		aria-label="Next variant"
	>
		<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" /></svg>
	</button>
</div>
