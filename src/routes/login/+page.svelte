<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	// Pull the scoped client and active session from SvelteKit's page data store
	let supabase = $derived(page.data.supabase);
	let session = $derived(page.data.session);

	let email = $state('');
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	onMount(() => {
		// 1. Immediately forward if a session is already resolved
		if (session) {
			goto('/bookings');
			return;
		}

		// 2. Listen for auth state transitions (e.g., when clicking the Magic Link)
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, currentSession) => {
			if (currentSession) {
				goto('/bookings');
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});

	async function handleMagicLink(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		errorMessage = '';
		successMessage = '';

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			errorMessage = 'Please enter a valid email address.';
			loading = false;
			return;
		}

		// Trigger passwordless Email Magic Link
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${window.location.origin}/login`
			}
		});

		loading = false;

		if (error) {
			errorMessage = error.message;
		} else {
			successMessage = 'Check your inbox! We have sent you a magic login link.';
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
	<Card.Root class="w-full max-w-md shadow-lg">
		<Card.Header class="space-y-1 text-center">
			<Card.Title class="text-2xl font-bold tracking-tight text-slate-900">MUASuites</Card.Title>
			<Card.Description class="text-sm text-slate-500">
				Enter your email to receive a passwordless magic login link.
			</Card.Description>
		</Card.Header>

		<Card.Content>
			{#if successMessage}
				<div class="rounded-md border border-emerald-200 bg-emerald-50 p-4">
					<p class="text-center text-sm font-medium text-emerald-800">
						{successMessage}
					</p>
				</div>
			{:else}
				<form onsubmit={handleMagicLink} class="space-y-4">
					<div class="space-y-1.5">
						<label
							for="email"
							class="text-xs font-semibold tracking-wider text-slate-500 uppercase"
						>
							Work Email Address
						</label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder="name@studio.com"
							bind:value={email}
							required
							disabled={loading}
							class="w-full"
						/>
					</div>

					{#if errorMessage}
						<div class="border-red-150 rounded-md border bg-red-50 p-3">
							<p class="text-center text-xs font-semibold text-red-700">
								{errorMessage}
							</p>
						</div>
					{/if}

					<Button
						type="submit"
						disabled={loading}
						class="w-full bg-slate-900 text-white hover:bg-slate-800"
					>
						{#if loading}
							Sending link...
						{:else}
							Send Magic Link
						{/if}
					</Button>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
</div>