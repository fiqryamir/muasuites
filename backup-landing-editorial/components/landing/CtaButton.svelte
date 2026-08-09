<script lang="ts">
	import { ArrowRight } from 'phosphor-svelte';
	import type { Snippet } from 'svelte';
	import { Button, type ButtonProps } from '$lib/components/ui/button';

	interface Props extends ButtonProps {
		children?: Snippet;
		circleClass?: string;
	}

	let {
		children,
		class: className,
		circleClass = 'bg-white/20 text-white',
		...rest
	}: Props = $props();
</script>

<Button {...rest} data-icon="inline-end" class="group/cta gap-3 pr-1.5 pl-5 {className}">
	{@render children?.()}
	<span
		class="ease-fluid flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-500 group-hover/cta:translate-x-1 group-hover/cta:-translate-y-[1px] group-hover/cta:scale-105 group-active/cta:scale-90 {circleClass}"
		aria-hidden="true"
	>
		<ArrowRight size={13} weight="bold" />
	</span>
</Button>
