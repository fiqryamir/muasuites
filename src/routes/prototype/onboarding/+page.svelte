<script lang="ts">
	// PROTOTYPE route — onboarding wizard variants, switchable via ?variant=A|B|C.
	// Throwaway: not the real onboarding flow. Switcher is dev-only.
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import VariantA from './variant-a.svelte';
	import VariantB from './variant-b.svelte';
	import VariantC from './variant-c.svelte';
	import Switcher from './switcher.svelte';

	const variants = [
		{ key: 'A', name: 'Linear wizard' },
		{ key: 'B', name: 'One-page checklist' },
		{ key: 'C', name: 'Conversational tutorial' }
	];

	const current = $derived(
		variants.some((v) => v.key === page.url.searchParams.get('variant'))
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
