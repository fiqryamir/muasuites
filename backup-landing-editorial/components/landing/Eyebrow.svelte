<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		class?: string;
	}

	let { children, class: className }: Props = $props();
</script>

<span class="eyebrow bg-foreground/5 text-foreground/60 ring-foreground/10 ring-1 {className}">
	<span class="bg-primary size-1.5 rounded-full" aria-hidden="true"></span>
	{@render children?.()}
</span>
