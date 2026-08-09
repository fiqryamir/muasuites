<script lang="ts">
	import { onMount } from 'svelte';
	import { animate, inView } from 'motion';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		delay?: number;
		y?: number;
		class?: string;
	}

	let { children, delay = 0, y = 36, class: className }: Props = $props();

	let el = $state<HTMLDivElement>();

	onMount(() => {
		if (!el) return;
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reducedMotion) {
			el.style.opacity = '1';
			el.style.filter = 'none';
			el.style.transform = 'none';
			return;
		}

		let stopped = false;
		const stop = inView(
			el,
			() => {
				if (stopped) return;
				stopped = true;
				animate(
					el,
					{ opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
					{ duration: 0.9, ease: [0.32, 0.72, 0, 1], delay: delay / 1000 }
				);
			},
			{ amount: 0.15 }
		);
		return () => {
			stopped = true;
			stop();
		};
	});
</script>

<div
	bind:this={el}
	class={className}
	style="opacity: 0; transform: translateY({y}px); filter: blur(6px);"
>
	{@render children?.()}
</div>
