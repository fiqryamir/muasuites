<script lang="ts">
	import { resolve } from '$app/paths';

	const linkClass =
		'text-background/70 hover:text-background text-sm transition-colors duration-300';
</script>

<footer class="bg-foreground text-background relative overflow-hidden">
	<div class="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
		<div class="grid gap-14 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-10">
			<div>
				<p class="font-display text-6xl font-medium tracking-tight sm:text-7xl">
					MUAsuites<span class="text-primary">.</span>
				</p>
				<p class="text-background/60 mt-5 max-w-xs text-sm leading-relaxed">
					Booking links, deposits and calendar sync for makeup artists.
				</p>
			</div>

			<div>
				<p class="text-sm font-semibold">Product</p>
				<ul class="mt-4 space-y-3">
					<li><a href="#how-it-works" class={linkClass}>How it works</a></li>
					<li><a href="#features" class={linkClass}>Features</a></li>
					<li><a href="#pricing" class={linkClass}>Pricing</a></li>
				</ul>
			</div>

			<div>
				<p class="text-sm font-semibold">Studio</p>
				<ul class="mt-4 space-y-3">
					<li><a href={resolve('/login')} class={linkClass}>Log in</a></li>
					<li><a href={resolve('/login')} class={linkClass}>Start free</a></li>
				</ul>
			</div>
		</div>

		<p class="text-background/40 mt-16 text-xs">© 2026 MUAsuites · Made in Malaysia</p>
	</div>

	<div class="absolute -right-20 -bottom-24 hidden lg:block" aria-hidden="true">
		<div class="relative size-[529px]">
			<div
				class="border-background/15 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[14px]"
				style="width: 151px; height: 151px;"
			></div>
			<div
				class="border-background/15 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[21px]"
				style="width: 277px; height: 277px;"
			></div>
			<div
				class="border-background/15 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[28px]"
				style="width: 403px; height: 403px;"
			></div>
			<div
				class="border-background/15 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[35px]"
				style="width: 529px; height: 529px;"
			></div>
		</div>
	</div>
</footer>
