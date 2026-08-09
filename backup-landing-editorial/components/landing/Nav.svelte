<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import CtaButton from './CtaButton.svelte';

	let open = $state(false);

	const links = [
		{ href: '#how-it-works', label: 'How it works' },
		{ href: '#features', label: 'Features' },
		{ href: '#pricing', label: 'Pricing' },
		{ href: '#faq', label: 'FAQ' }
	];

	$effect(() => {
		if (typeof document === 'undefined') return;
		document.body.style.overflow = open ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<header class="sticky top-4 z-40 mt-4 flex justify-center px-4">
	<nav
		class="ring-foreground/10 shadow-ambient flex h-14 w-full max-w-xl items-center justify-between gap-3 rounded-full border border-white/50 bg-white/70 pr-2 pl-5 ring-1 backdrop-blur-xl"
	>
		<a
			href={resolve('/')}
			class="font-display text-lg font-medium tracking-tight"
			aria-label="MUAsuites home"
		>
			MUAsuites
		</a>

		<div class="hidden items-center gap-1 md:flex">
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="text-muted-foreground hover:text-foreground hover:bg-foreground/5 ease-fluid rounded-full px-3 py-1.5 text-sm transition-all duration-300"
				>
					{link.label}
				</a>
			{/each}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>

		<div class="flex items-center gap-1.5">
			<Button variant="ghost" href={resolve('/login')} class="hidden rounded-full sm:inline-flex">
				Log in
			</Button>
			<CtaButton href={resolve('/login')} size="sm" class="hidden md:inline-flex">
				Start free
			</CtaButton>

			<button
				type="button"
				class="ring-foreground/10 text-foreground relative flex size-10 items-center justify-center rounded-full ring-1 md:hidden"
				aria-label={open ? 'Close menu' : 'Open menu'}
				aria-expanded={open}
				onclick={() => (open = !open)}
			>
				<span
					class="bg-foreground ease-fluid absolute h-[1.5px] w-4 rounded-full transition-all duration-500 {open
						? 'rotate-45'
						: '-translate-y-[3px]'}"
				></span>
				<span
					class="bg-foreground ease-fluid absolute h-[1.5px] w-4 rounded-full transition-all duration-500 {open
						? '-rotate-45'
						: 'translate-y-[3px]'}"
				></span>
			</button>
		</div>
	</nav>
</header>

{#if open}
	<div
		class="bg-background/85 fixed inset-0 z-50 backdrop-blur-2xl"
		role="dialog"
		aria-modal="true"
		aria-label="Menu"
	>
		<div
			class="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-between px-8 pt-28 pb-12"
		>
			<nav class="flex flex-col gap-2">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				{#each links as link, i (link.href)}
					<a
						href={link.href}
						onclick={() => (open = false)}
						class="mask-in border-foreground/10 text-foreground font-display ease-fluid hover:text-primary border-b py-5 text-4xl font-medium tracking-tight transition-colors duration-300"
						style="animation-delay: {100 + i * 90}ms"
					>
						{link.label}
					</a>
				{/each}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</nav>

			<div class="flex flex-col gap-3">
				<a
					href={resolve('/login')}
					class="mask-in border-foreground/10 ease-fluid border py-4 text-center text-sm font-medium transition-colors duration-300"
					style="animation-delay: 480ms"
				>
					Log in
				</a>
				<a
					href={resolve('/login')}
					class="bg-primary text-primary-foreground mask-in ease-fluid flex items-center justify-center gap-2 rounded-full py-4 text-sm font-medium transition-colors duration-300"
					style="animation-delay: 570ms"
				>
					Start free
				</a>
			</div>
		</div>
	</div>
{/if}
