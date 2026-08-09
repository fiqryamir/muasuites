<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

	let { children } = $props();

	let supabase = $derived(page.data.supabase);
	let session = $derived(page.data.session);
	let currentPath = $derived(page.url.pathname);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, newSession: Session | null) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidateAll();
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});

	async function handleLogout() {
		await supabase.auth.signOut();
		invalidateAll();
	}

	const navLinks = [
		{ href: resolve('/bookings'), label: 'Dashboard', mobileLabel: 'Dashboard' },
		{ href: resolve('/bookings/all'), label: 'All bookings', mobileLabel: 'All' },
		{ href: resolve('/settings'), label: 'Settings', mobileLabel: 'Settings' }
	];
</script>

<div class="min-h-screen bg-background">
	<header
		class="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm"
	>
		<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
			<a
				href={resolve('/bookings')}
				class="text-base font-semibold tracking-tight text-foreground"
			>
				MUASuites
			</a>

			<nav class="flex items-center gap-0.5 sm:gap-1">
				{#each navLinks as link (link.href)}
					{@const active = currentPath.startsWith(link.href)}
					<a
						href={link.href}
						class="rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm
							{active
								? 'bg-muted text-foreground'
								: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
					>
						<span class="sm:hidden">{link.mobileLabel}</span>
						<span class="hidden sm:inline">{link.label}</span>
					</a>
				{/each}

				<div class="mx-1 h-4 w-px bg-border sm:mx-1.5"></div>

				<button
					onclick={handleLogout}
					class="rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors sm:px-3 sm:text-sm hover:text-destructive"
				>
					Log out
				</button>
			</nav>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
		{@render children()}
	</main>
</div>
