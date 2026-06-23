<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';
	import { Toaster } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	let { data, children } = $props<{ data: LayoutData; children: any }>();

	onMount(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event: any, session: any) => {
			if (session?.expires_at !== data.session?.expires_at) {
				invalidateAll();
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Toaster position="bottom-center" richColors />
{@render children()}
