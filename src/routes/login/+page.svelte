<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import FieldGroup from '$lib/components/ui/field/field-group.svelte';
	import Field from '$lib/components/ui/field/field.svelte';
	import FieldLabel from '$lib/components/ui/field/field-label.svelte';

	let supabase = $derived(page.data.supabase);
	let session = $derived(page.data.session);

	let email = $state('');
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	onMount(() => {
		if (session) {
			goto('/bookings');
			return;
		}

		const { data: { subscription } } = supabase.auth.onAuthStateChange((_, currentSession) => {
			if (currentSession) goto('/bookings');
		});

		return () => subscription.unsubscribe();
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

		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: { emailRedirectTo: `${window.location.origin}/login` }
		});

		loading = false;

		if (error) {
			errorMessage = error.message;
		} else {
			successMessage = 'Check your inbox — we sent you a magic login link.';
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4 py-8">
	<div class="w-full max-w-sm space-y-6 animate-in-up">

		<!-- Brand -->
		<div class="space-y-2 text-center">
			<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-lg font-semibold text-background">
				M
			</div>
			<div class="space-y-1">
				<h1 class="text-lg font-semibold tracking-tight">Sign in to MUASuites</h1>
				<p class="text-sm text-muted-foreground">
					Enter your email to receive a passwordless login link.
				</p>
			</div>
		</div>

		<Card.Root>
			<Card.Content>
				{#if successMessage}
					<div class="space-y-4 text-center">
						<div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
							<svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
							</svg>
						</div>
						<div class="space-y-1">
							<p class="text-sm font-medium">Check your inbox</p>
							<p class="text-xs text-muted-foreground">{successMessage}</p>
						</div>
						<button
							type="button"
							onclick={() => { successMessage = ''; email = ''; }}
							class="text-xs text-muted-foreground hover:text-foreground transition-colors"
						>
							Use a different email
						</button>
					</div>
				{:else}
					<form onsubmit={handleMagicLink} class="space-y-4">
					<FieldGroup class="gap-4">
						<Field class="gap-2">
							<FieldLabel htmlFor="email">Email address</FieldLabel>
							<Input
								id="email"
								type="email"
								placeholder="name@studio.com"
								bind:value={email}
								required
								disabled={loading}
							/>
						</Field>
					</FieldGroup>

						{#if errorMessage}
							<p class="text-xs text-destructive">{errorMessage}</p>
						{/if}

						<Button type="submit" disabled={loading} class="w-full">
							{loading ? 'Sending link...' : 'Send Magic Link'}
						</Button>
					</form>
				{/if}
			</Card.Content>
		</Card.Root>

		<p class="text-center text-[11px] text-muted-foreground/60">
			Powered by MUASuites
		</p>
	</div>
</div>
