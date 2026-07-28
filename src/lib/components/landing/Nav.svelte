<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
</script>

<header class="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-sm">
	<nav class="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
		<a href={resolve('/')} class="text-[15px] font-semibold tracking-tight">MUAsuites</a>

		<div class="hidden items-center gap-1 md:flex">
			<a
				href="#how-it-works"
				class="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full px-3 py-1.5 text-sm transition-colors"
			>
				How it works
			</a>
			<a
				href="#features"
				class="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full px-3 py-1.5 text-sm transition-colors"
			>
				Features
			</a>
			<a
				href="#pricing"
				class="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full px-3 py-1.5 text-sm transition-colors"
			>
				Pricing
			</a>
			<a
				href="#faq"
				class="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full px-3 py-1.5 text-sm transition-colors"
			>
				FAQ
			</a>
		</div>

		<div class="flex items-center gap-2">
			<Button variant="ghost" href="/login" class="hidden sm:inline-flex">Log in</Button>
			<Button href="/login">Start free</Button>
		</div>
	</nav>
</header>
