<script lang="ts">
	// PROTOTYPE route — protected MUA Payment Confirmation variants, switchable via ?variant=A|B|C.
	// Throwaway: this is a visual interaction prototype, not the real confirmation route.
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import VariantA from './variant-a.svelte';
	import VariantB from './variant-b.svelte';
	import VariantC from './variant-c.svelte';
	import Switcher from './switcher.svelte';

	const variants = [
		{ key: 'A', name: 'Quiet paper' },
		{ key: 'B', name: 'Ledger timeline' },
		{ key: 'C', name: 'Pocket pass' }
	];

	const current = $derived(
		variants.some((variant) => variant.key === page.url.searchParams.get('variant'))
			? (page.url.searchParams.get('variant') as string)
			: 'A'
	);
</script>

{#if current === 'A'}
	<VariantA />
{:else if current === 'B'}
	<VariantB />
{:else}
	<VariantC />
{/if}

{#if dev}
	<Switcher {variants} {current} />
{/if}
