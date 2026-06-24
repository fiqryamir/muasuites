<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { children } = $props();

	let supabase = $derived(page.data.supabase);
	let session = $derived(page.data.session);
	let currentPath = $derived(page.url.pathname);

	let loading = $state(true);
	let authenticated = $state(false);
	let studioName = $state('');

	$effect(() => {
		if (session) {
			authenticated = true;
			loading = false;
		} else {
			authenticated = false;
			loading = false;
			goto('/login');
		}
	});

	$effect(() => {
		if (session?.user?.id && supabase) {
			supabase
				.from('mua_configs')
				.select('studio_name')
				.eq('mua_id', session.user.id)
				.single()
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				.then((res: { data: any }) => {
					if (res.data?.studio_name) studioName = res.data.studio_name;
				});
		}
	});

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}

	const navLinks = [
		{ href: '/bookings', label: 'Dashboard' },
		{ href: '/bookings/all', label: 'All bookings' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

{#if loading}
	<div class="flex min-h-screen items-center justify-center">
		<span class="text-sm text-muted-foreground">Loading...</span>
	</div>
{:else if authenticated}
	<div class="min-h-screen bg-background">
		<header
			class="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm"
		>
			<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
				<a
					href="/bookings"
					class="text-base font-semibold tracking-tight text-foreground"
				>
					MUASuites
				</a>

				<nav class="flex items-center gap-0.5 sm:gap-1">
					{#each navLinks as link}
						{@const active = currentPath.startsWith(link.href)}
						<a
							href={link.href}
							class="rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm
								{active
									? 'bg-muted text-foreground'
									: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}
								{link.href === '/bookings/all' ? 'hidden sm:inline-flex' : ''}"
						>
							{link.label}
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
{/if}
