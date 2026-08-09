<script lang="ts">
	import { cn } from '$lib/utils.js';
	import Eyebrow from './Eyebrow.svelte';

	interface Props {
		eyebrow?: string;
		title: string;
		sub?: string;
		align?: 'left' | 'center';
		class?: string;
	}

	let { eyebrow, title, sub, align = 'left', class: className }: Props = $props();
</script>

<div class={cn(align === 'center' && 'mx-auto max-w-2xl text-center', className)}>
	{#if eyebrow}
		<Eyebrow class={align === 'center' ? 'mx-auto' : ''}>{eyebrow}</Eyebrow>
	{/if}
	<h2 class="font-display text-4xl font-medium tracking-tight text-balance sm:text-5xl">
		{title}
	</h2>
	{#if sub}
		<p class="text-muted-foreground mt-5 max-w-2xl text-lg leading-relaxed text-pretty">
			{sub}
		</p>
	{/if}
</div>
