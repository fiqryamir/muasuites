<script lang="ts">
	// VARIANT C — Conversational tutorial: one field per screen, big "why" panel with
	// example, thin progress bar, big tap targets. Maximum hand-holding.
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import { steps } from './steps';
	import type { Field as StepField } from './steps';

	interface Screen extends StepField {
		stepNo: number;
	}

	const screens: Screen[] = [
		...steps[0].fields.map((f) => ({ ...f, stepNo: 1 })),
		...steps[1].fields.map((f) => ({ ...f, stepNo: 2 })),
		...steps[2].fields.map((f) => ({ ...f, stepNo: 3 })),
		...steps[3].fields.map((f) => ({ ...f, stepNo: 4, required: false }))
	];

	const totalScreens = screens.length + 1; // + reveal
	let idx = $state(0);
	const screen = $derived(screens[Math.min(idx, screens.length - 1)]);

	let studioName = $state('');
	let slug = $state('glambysarah');
	let whatsappLocal = $state('');

	let depositMode = $state<'FIXED' | 'PERCENT'>('FIXED');
	let depositValue = $state(200);
	let qrFile = $state<File | null>(null);

	let packages = $state<{ emoji: string; name: string; duration: number; price: number }[]>([]);
	let pkgEmoji = $state('💄');
	let pkgName = $state('');
	let pkgDuration = $state(3);
	let pkgPrice = $state(0);

	let telegramChatId = $state('');
	let baseLocation = $state('');
	let ratePerKm = $state(0);
	let bufferMin = $state(0);

	const link = $derived(`muasuites.com/${slug.trim() || 'your-name'}`);
	const isReveal = $derived(idx >= screens.length);
	const progress = $derived(Math.min(((idx + 1) / totalScreens) * 100, 100));

	const canContinue = $derived.by(() => {
		if (isReveal) return true;
		if (screen.id === 'studio_name') return studioName.trim().length >= 2;
		if (screen.id === 'slug') return slug.trim().length >= 3;
		if (screen.id === 'whatsapp') return whatsappLocal.trim().length >= 8;
		if (screen.id === 'deposit_value') return depositValue > 0;
		if (screen.id === 'qr') return qrFile !== null;
		if (screen.id === 'packages') return packages.length >= 1;
		return true;
	});

	function addPackage() {
		if (!pkgName.trim() || pkgPrice <= 0) return;
		packages = [
			...packages,
			{ emoji: pkgEmoji || '💄', name: pkgName.trim(), duration: pkgDuration, price: pkgPrice }
		];
		pkgName = '';
		pkgPrice = 0;
		pkgEmoji = '💄';
		pkgDuration = 3;
	}

	function removePackage(i: number) {
		packages = packages.filter((_, idx2) => idx2 !== i);
	}

	function copyLink() {
		navigator.clipboard?.writeText(`https://${link}`);
		toast.success('Booking link copied!');
	}

	function finish() {
		toast.success('Prototype: onboarding complete — nothing was saved.');
	}
</script>

<div class="flex min-h-screen flex-col bg-background">
	<!-- Top bar + progress -->
	<header class="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
		<div class="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
			<p class="text-sm font-semibold tracking-tight">MUASuites</p>
			<p class="text-xs text-muted-foreground tabular-nums">
				{isReveal ? 'Almost there' : `Screen ${idx + 1} of ${totalScreens}`}
			</p>
		</div>
		<div class="h-0.5 w-full bg-muted">
			<div class="h-full bg-primary transition-all duration-300" style="width: {progress}%"></div>
		</div>
	</header>

	<main class="flex flex-1 flex-col items-center px-4 py-8">
		<Card.Root class="w-full max-w-md animate-in-up">
			<Card.Content class="space-y-6">
				{#if !isReveal}
					<!-- Teaching panel -->
					<div class="space-y-3 rounded-2xl bg-primary/5 p-4">
						<div class="flex items-center gap-2">
							<span class="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
								Step {screen.stepNo} of 4
							</span>
							{#if !screen.required}
								<span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
									Optional
								</span>
							{/if}
						</div>
						<h1 class="text-xl font-semibold tracking-tight">{screen.label}</h1>
						<p class="text-sm text-muted-foreground">{screen.why}</p>
					</div>

					<!-- One field -->
					{#if screen.type === 'text'}
						<Field class="gap-1.5">
							<FieldLabel class="sr-only">{screen.label}</FieldLabel>
							<Input bind:value={studioName} placeholder={screen.placeholder} class="rounded-full border border-border bg-muted/60 px-4 py-2.5" />
						</Field>
					{:else if screen.type === 'slug'}
						<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
							<span class="shrink-0 text-sm text-muted-foreground">muasuites.com/</span>
							<input class="w-full bg-transparent px-2 py-2.5 text-sm outline-none" bind:value={slug} placeholder="your-name" />
						</div>
					{:else if screen.type === 'phone'}
						<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
							<span class="shrink-0 text-sm text-muted-foreground">+60</span>
							<input class="w-full bg-transparent px-2 py-2.5 text-sm outline-none" bind:value={whatsappLocal} placeholder="123456789" inputmode="numeric" />
						</div>
					{:else if screen.type === 'select'}
						<div class="grid grid-cols-2 gap-2">
							<button
								type="button"
								onclick={() => (depositMode = 'FIXED')}
								class="rounded-2xl border px-4 py-4 text-sm font-medium transition-colors
									{depositMode === 'FIXED' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 hover:bg-muted/70'}"
							>
								Fixed amount (RM)
							</button>
							<button
								type="button"
								onclick={() => (depositMode = 'PERCENT')}
								class="rounded-2xl border px-4 py-4 text-sm font-medium transition-colors
									{depositMode === 'PERCENT' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/40 hover:bg-muted/70'}"
							>
								Percentage (%)
							</button>
						</div>
					{:else if screen.type === 'number'}
						<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
							{#if depositMode === 'FIXED'}<span class="shrink-0 text-sm text-muted-foreground">RM</span>{/if}
							<input class="w-full bg-transparent px-2 py-2.5 text-sm outline-none" type="number" min="0" step="0.01" bind:value={depositValue} />
							{#if depositMode === 'PERCENT'}<span class="shrink-0 text-sm text-muted-foreground">%</span>{/if}
						</div>
					{:else if screen.type === 'qr'}
						<div class="space-y-3">
							<input
								type="file"
								accept="image/png,image/jpeg,image/webp"
								onchange={(e) => (qrFile = (e.target as HTMLInputElement).files?.[0] ?? null)}
								class="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
							/>
							{#if qrFile}
								<div class="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
									<div class="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-white">
										<span class="grid grid-cols-3 gap-0.5 opacity-70">
											<span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span>
											<span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span>
											<span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span>
										</span>
									</div>
									<p class="text-sm font-medium">{qrFile.name}</p>
								</div>
							{/if}
						</div>
					{:else if screen.type === 'package'}
						<div class="space-y-3">
							{#if packages.length > 0}
								<div class="divide-y divide-border rounded-xl border border-border">
									{#each packages as pkg, i (pkg.name)}
										<div class="flex items-center justify-between gap-3 px-4 py-3">
											<div class="flex min-w-0 items-center gap-3">
												<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-base">{pkg.emoji}</span>
												<div class="min-w-0">
													<p class="truncate text-sm font-medium">{pkg.name}</p>
													<p class="text-[11px] text-muted-foreground">{pkg.duration} hrs</p>
												</div>
											</div>
											<div class="flex shrink-0 items-center gap-2">
												<span class="text-sm font-semibold tabular-nums">RM {pkg.price.toFixed(2)}</span>
												<button type="button" onclick={() => removePackage(i)} class="text-xs text-muted-foreground hover:text-destructive">Remove</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
							<div class="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
								<div class="grid grid-cols-[4rem_1fr] gap-2">
									<input class="rounded-full border border-border bg-card px-3 py-2 text-center text-sm outline-none" bind:value={pkgEmoji} aria-label="Icon" />
									<input class="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none" bind:value={pkgName} placeholder="e.g. Bridal Makeup" aria-label="Package name" />
									<input class="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none" type="number" min="0.5" max="12" step="0.5" bind:value={pkgDuration} aria-label="Duration hours" />
									<input class="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none" type="number" min="0" step="0.01" bind:value={pkgPrice} placeholder="Price RM" aria-label="Price" />
								</div>
								<Button type="button" variant="outline" class="mt-3 w-full rounded-full" disabled={!pkgName.trim() || pkgPrice <= 0} onclick={addPackage}>
									Add package
								</Button>
							</div>
						</div>
					{:else if screen.type === 'telegram'}
						<div class="flex gap-2">
							<input class="w-full rounded-full border border-border bg-muted/60 px-4 py-2.5 text-sm outline-none" bind:value={telegramChatId} placeholder="Enter your Chat ID" />
							<Button type="button" variant="outline" class="shrink-0 rounded-full" onclick={() => toast.success('Prototype: test message sent (not really).')}>Test</Button>
						</div>
					{:else if screen.type === 'travel'}
						<div class="grid gap-2 sm:grid-cols-2">
							<input class="rounded-full border border-border bg-muted/60 px-4 py-2.5 text-sm outline-none" bind:value={baseLocation} placeholder="e.g. Shah Alam" />
							<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
								<span class="shrink-0 text-sm text-muted-foreground">RM</span>
								<input class="w-full bg-transparent px-2 py-2.5 text-sm outline-none" type="number" min="0" step="0.01" bind:value={ratePerKm} placeholder="0.00 / km" />
							</div>
						</div>
					{:else if screen.type === 'hours'}
						<div class="flex items-center gap-2 text-sm">
							<span class="rounded-full bg-muted/60 px-4 py-2.5">08:00 AM</span>
							<span class="text-muted-foreground">–</span>
							<span class="rounded-full bg-muted/60 px-4 py-2.5">06:00 PM</span>
						</div>
					{:else if screen.type === 'buffer'}
						<div class="flex flex-wrap gap-1.5">
							{#each ['No buffer', '15 min', '30 min', '45 min', '60 min'] as opt, i}
								<button
									type="button"
									onclick={() => (bufferMin = i)}
									class="rounded-full px-3 py-2 text-xs font-medium transition-colors
										{bufferMin === i ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'}"
								>
									{opt}
								</button>
							{/each}
						</div>
					{/if}

					<div class="flex items-center justify-between pt-2">
						<Button type="button" variant="ghost" class="rounded-full" disabled={idx === 0} onclick={() => (idx -= 1)}>
							Back
						</Button>
						<div class="flex gap-2">
							{#if !screen.required && idx > 0}
								<Button type="button" variant="outline" class="rounded-full" onclick={() => (idx += 1)}>
									Skip
								</Button>
							{/if}
							<Button type="button" class="rounded-full px-6" disabled={!canContinue} onclick={() => (idx += 1)}>
								Continue
							</Button>
						</div>
					</div>
				{:else}
					<!-- Reveal -->
					<div class="space-y-5 text-center">
						<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
							<svg class="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
						</div>
						<div class="space-y-1">
							<h1 class="text-xl font-semibold tracking-tight">{steps[4].title}</h1>
							<p class="text-sm text-muted-foreground">{steps[4].subtitle}</p>
						</div>

						<div class="rounded-2xl border border-border bg-muted/40 p-4">
							<p class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Your booking page</p>
							<p class="mt-1 break-all text-lg font-semibold tracking-tight">{link}</p>
							<Button type="button" class="mt-3 w-full rounded-full" onclick={copyLink}>Copy link</Button>
						</div>

						<div class="space-y-2 rounded-2xl bg-primary/5 p-4 text-left">
							<p class="text-sm font-medium text-primary">What happens next</p>
							<ul class="space-y-1.5 text-xs text-muted-foreground">
								<li>• Put this link in your Instagram bio — clients check your availability, then message you on WhatsApp.</li>
								<li>• When you agree on a date, create a booking link from your dashboard and send it — that's where they pay the deposit.</li>
								<li>• You approve each booking from your dashboard once the receipt arrives.</li>
							</ul>
						</div>

						<Button type="button" class="w-full rounded-full" onclick={finish}>Finish — go to dashboard</Button>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</main>
</div>
