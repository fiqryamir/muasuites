<script lang="ts">
	import { resolve } from '$app/paths';

	const linkClass = 'text-muted-foreground hover:text-foreground text-sm transition-colors';
</script>

<footer class="border-border/60 border-t">
	<div class="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
		<div class="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
			<div class="max-w-xs">
				<p class="text-[15px] font-semibold tracking-tight">MUAsuites</p>
				<p class="text-muted-foreground mt-3 text-sm leading-relaxed">
					Booking links, deposits and calendar sync for makeup artists.
				</p>
			</div>

			<div>
				<p class="text-sm font-semibold">Product</p>
				<ul class="mt-3 space-y-2.5">
					<li><a href="#how-it-works" class={linkClass}>How it works</a></li>
					<li><a href="#features" class={linkClass}>Features</a></li>
					<li><a href="#pricing" class={linkClass}>Pricing</a></li>
				</ul>
			</div>

			<div>
				<p class="text-sm font-semibold">Studio</p>
				<ul class="mt-3 space-y-2.5">
					<li><a href={resolve('/login')} class={linkClass}>Log in</a></li>
					<li><a href={resolve('/login')} class={linkClass}>Start free</a></li>
				</ul>
			</div>
		</div>

		<p class="text-muted-foreground/70 mt-12 text-xs">© 2026 MUAsuites · Made in Malaysia</p>
	</div>
</footer>
