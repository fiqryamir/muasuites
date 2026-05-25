<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';

	let { children } = $props();
	let authenticated = $state(false);
	let loading = $state(true);

	onMount(async () => {
		// 1. First, check if there is an immediate session
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (session) {
			authenticated = true;
			loading = false;
			return;
		}

		// 2. If session is null, wait a brief moment for Supabase to finish parsing storage
		// This resolves the storage race condition on cold page refreshes
		const unsubscribe = supabase.auth.onAuthStateChange(async (event, currentSession) => {
			if (currentSession) {
				authenticated = true;
				loading = false;
				unsubscribe.data.subscription.unsubscribe();
			} else {
				// Only redirect if absolutely no session is found after initialization
				goto('/login?error=Please log in to access your dashboard');
			}
		});
	});

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-slate-50">
		<p class="animate-pulse text-sm font-semibold text-slate-500">Verifying workspace session...</p>
	</div>
{:else if authenticated}
	<div class="flex min-h-screen flex-col bg-slate-50">
		<nav class="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
			<div class="mx-auto flex max-w-7xl items-center justify-between">
				<a href="/bookings" class="text-lg font-bold tracking-tight text-slate-900"> MUASuites </a>
				<div class="flex items-center space-x-6">
					<a href="/bookings" class="text-sm font-medium text-slate-600 hover:text-slate-900"
						>Bookings</a
					>
					<a href="/settings" class="text-sm font-medium text-slate-600 hover:text-slate-900"
						>Settings</a
					>
					<button
						onclick={handleLogout}
						class="text-sm font-semibold text-red-600 transition hover:text-red-700"
					>
						Logout
					</button>
				</div>
			</div>
		</nav>

		<main class="mx-auto w-full max-w-7xl flex-grow px-4 py-6 sm:px-6">
			{@render children()}
		</main>
	</div>
{/if}
