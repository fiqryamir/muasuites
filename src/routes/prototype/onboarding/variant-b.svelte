<script lang="ts">
	// VARIANT B — One long page, sections unlock progressively, sticky checklist rail,
	// teaching copy tucked into expandable "What's this for?" details.
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import { steps } from './steps';

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

	// done[0..3] = identity, payment, packages, extras (optional)
	let done = $state([false, false, false, false]);

	const link = $derived(`muasuites.com/${slug.trim() || 'your-name'}`);
	const completedCount = $derived(done.filter(Boolean).length);

	const sectionComplete = $derived.by(() => {
		if (studioName.trim().length < 2 || slug.trim().length < 3 || whatsappLocal.trim().length < 8) return false;
		if (depositValue <= 0 || qrFile === null) return false;
		if (packages.length < 1) return false;
		return true;
	});

	function sectionDone(i: number) {
		return done[i];
	}

	function sectionUnlocked(i: number) {
		return i === 0 || done[i - 1];
	}

	function saveSection(i: number) {
		done[i] = true;
		if (i < 3) {
			document.getElementById(`section-${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

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
		packages = packages.filter((_, idx) => idx !== i);
	}

	function copyLink() {
		navigator.clipboard?.writeText(`https://${link}`);
		toast.success('Booking link copied!');
	}

	function finish() {
		toast.success('Prototype: onboarding complete — nothing was saved.');
	}
</script>

<div class="bg-background px-4 py-8">
	<div class="mx-auto max-w-4xl">
		<p class="text-center text-sm font-semibold tracking-tight text-foreground">MUASuites</p>

		<!-- Mobile progress strip -->
		<div class="mt-6 flex items-center justify-center gap-2 md:hidden">
			{#each steps.slice(0, 4) as s, i (s.id)}
				<span
					class="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold
						{sectionDone(i) ? 'bg-primary text-primary-foreground' : sectionUnlocked(i) ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}"
				>
					{i + 1}
				</span>
			{/each}
		</div>

		<div class="mt-6 flex items-start gap-8">
			<!-- Sticky checklist rail (desktop) -->
			<aside class="sticky top-8 hidden w-52 shrink-0 md:block">
				<p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
					Setup checklist
				</p>
				<ol class="space-y-1">
					{#each steps.slice(0, 4) as s, i (s.id)}
						<li>
							<button
								type="button"
								disabled={!sectionUnlocked(i)}
								onclick={() => document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
								class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors
									{sectionUnlocked(i) ? 'hover:bg-muted' : 'cursor-not-allowed opacity-40'}"
							>
								<span
									class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold
										{sectionDone(i) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}"
								>
									{#if sectionDone(i)}
										<svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
									{:else}
										{s.number}
									{/if}
								</span>
								<span class="{sectionDone(i) ? 'text-muted-foreground line-through' : ''}">
									{s.id === 'identity' ? 'Identity' : s.id === 'payment' ? 'Payment' : s.id === 'packages' ? 'Services' : 'Extras (optional)'}
								</span>
							</button>
						</li>
					{/each}
					<li class="px-2 pt-2 text-xs text-muted-foreground">{completedCount} of 4 done</li>
				</ol>
			</aside>

			<!-- Sections -->
			<div class="min-w-0 flex-1 space-y-6">
				<!-- 1. Identity -->
				<section id="section-0" class="scroll-mt-8 {sectionUnlocked(0) ? '' : 'pointer-events-none opacity-40'}">
					<Card.Root>
						<Card.Content class="space-y-5">
							<div class="flex items-start justify-between gap-3">
								<div class="space-y-1">
									<p class="text-[11px] font-semibold uppercase tracking-wider text-primary">Section 1 of 4</p>
									<h1 class="text-lg font-semibold tracking-tight">{steps[0].title}</h1>
									<p class="text-sm text-muted-foreground">{steps[0].subtitle}</p>
								</div>
								{#if sectionDone(0)}
									<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
										<svg class="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
									</span>
								{/if}
							</div>

							{#each steps[0].fields as f (f.id)}
								<Field class="gap-1.5">
									<FieldLabel>{f.label}</FieldLabel>
									{#if f.type === 'slug'}
										<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
											<span class="shrink-0 text-sm text-muted-foreground">muasuites.com/</span>
											<input class="w-full bg-transparent px-2 py-2 text-sm outline-none" bind:value={slug} placeholder="your-name" />
										</div>
									{:else if f.type === 'phone'}
										<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
											<span class="shrink-0 text-sm text-muted-foreground">+60</span>
											<input class="w-full bg-transparent px-2 py-2 text-sm outline-none" bind:value={whatsappLocal} placeholder="123456789" inputmode="numeric" />
										</div>
									{:else}
										<Input bind:value={studioName} placeholder={f.placeholder} class="rounded-full border border-border bg-muted/60" />
									{/if}
									<details class="group">
										<summary class="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
											<span class="mr-1 text-primary">+</span>What's this for?
										</summary>
										<p class="pt-1 text-xs text-muted-foreground">{f.why}</p>
									</details>
								</Field>
							{/each}

							<Button
								type="button"
								class="w-full rounded-full"
								disabled={!sectionComplete || sectionDone(0)}
								onclick={() => saveSection(0)}
							>
								{sectionDone(0) ? 'Done ✓' : 'Save & continue'}
							</Button>
						</Card.Content>
					</Card.Root>
				</section>

				<!-- 2. Payment -->
				<section id="section-1" class="scroll-mt-8 {sectionUnlocked(1) ? '' : 'pointer-events-none opacity-40'}">
					<Card.Root>
						<Card.Content class="space-y-5">
							<div class="flex items-start justify-between gap-3">
								<div class="space-y-1">
									<p class="text-[11px] font-semibold uppercase tracking-wider text-primary">Section 2 of 4</p>
									<h1 class="text-lg font-semibold tracking-tight">{steps[1].title}</h1>
									<p class="text-sm text-muted-foreground">{steps[1].subtitle}</p>
								</div>
								{#if sectionDone(1)}
									<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
										<svg class="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
									</span>
								{/if}
							</div>

							<Field class="gap-1.5">
								<FieldLabel>{steps[1].fields[0].label}</FieldLabel>
								<Select.Root type="single" bind:value={depositMode}>
									<Select.Trigger class="w-full rounded-full border border-border bg-muted/60 px-4 py-2 text-sm">
										{depositMode === 'FIXED' ? 'Fixed amount (RM)' : 'Percentage (%)'}
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="FIXED">Fixed amount (RM)</Select.Item>
										<Select.Item value="PERCENT">Percentage (%)</Select.Item>
									</Select.Content>
								</Select.Root>
								<details class="group">
									<summary class="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
										<span class="mr-1 text-primary">+</span>What's this for?
									</summary>
									<p class="pt-1 text-xs text-muted-foreground">{steps[1].fields[0].why}</p>
								</details>
							</Field>

							<Field class="gap-1.5">
								<FieldLabel>{depositMode === 'FIXED' ? 'Deposit amount (RM)' : 'Deposit percentage (%)'}</FieldLabel>
								<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
									{#if depositMode === 'FIXED'}<span class="shrink-0 text-sm text-muted-foreground">RM</span>{/if}
									<input class="w-full bg-transparent px-2 py-2 text-sm outline-none" type="number" min="0" step="0.01" bind:value={depositValue} />
									{#if depositMode === 'PERCENT'}<span class="shrink-0 text-sm text-muted-foreground">%</span>{/if}
								</div>
								<details class="group">
									<summary class="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
										<span class="mr-1 text-primary">+</span>What's this for?
									</summary>
									<p class="pt-1 text-xs text-muted-foreground">{steps[1].fields[1].why}</p>
								</details>
							</Field>

							<Field class="gap-1.5">
								<FieldLabel>{steps[1].fields[2].label}</FieldLabel>
								<input
									type="file"
									accept="image/png,image/jpeg,image/webp"
									onchange={(e) => (qrFile = (e.target as HTMLInputElement).files?.[0] ?? null)}
									class="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
								/>
								{#if qrFile}
									<p class="text-xs font-medium text-primary">Uploaded: {qrFile.name}</p>
								{/if}
								<details class="group">
									<summary class="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
										<span class="mr-1 text-primary">+</span>What's this for?
									</summary>
									<p class="pt-1 text-xs text-muted-foreground">{steps[1].fields[2].why}</p>
								</details>
							</Field>

							<Button
								type="button"
								class="w-full rounded-full"
								disabled={depositValue <= 0 || qrFile === null || sectionDone(1)}
								onclick={() => saveSection(1)}
							>
								{sectionDone(1) ? 'Done ✓' : 'Save & continue'}
							</Button>
						</Card.Content>
					</Card.Root>
				</section>

				<!-- 3. Packages -->
				<section id="section-2" class="scroll-mt-8 {sectionUnlocked(2) ? '' : 'pointer-events-none opacity-40'}">
					<Card.Root>
						<Card.Content class="space-y-5">
							<div class="flex items-start justify-between gap-3">
								<div class="space-y-1">
									<p class="text-[11px] font-semibold uppercase tracking-wider text-primary">Section 3 of 4</p>
									<h1 class="text-lg font-semibold tracking-tight">{steps[2].title}</h1>
									<p class="text-sm text-muted-foreground">{steps[2].subtitle}</p>
								</div>
								{#if sectionDone(2)}
									<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
										<svg class="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
									</span>
								{/if}
							</div>

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
								<p class="mb-3 text-sm font-semibold">Add a package</p>
								<div class="grid grid-cols-2 gap-2">
									<input class="rounded-full border border-border bg-card px-3 py-2 text-center text-sm outline-none" bind:value={pkgEmoji} aria-label="Icon" />
									<input class="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none" bind:value={pkgName} placeholder="e.g. Bridal Makeup" aria-label="Package name" />
									<input class="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none" type="number" min="0.5" max="12" step="0.5" bind:value={pkgDuration} aria-label="Duration hours" />
									<input class="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none" type="number" min="0" step="0.01" bind:value={pkgPrice} placeholder="Price RM" aria-label="Price" />
								</div>
								<Button type="button" variant="outline" class="mt-3 w-full rounded-full" disabled={!pkgName.trim() || pkgPrice <= 0} onclick={addPackage}>
									Add package
								</Button>
								<details class="group mt-2">
									<summary class="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
										<span class="mr-1 text-primary">+</span>What's this for?
									</summary>
									<p class="pt-1 text-xs text-muted-foreground">{steps[2].fields[0].why}</p>
								</details>
							</div>

							<Button
								type="button"
								class="w-full rounded-full"
								disabled={packages.length < 1 || sectionDone(2)}
								onclick={() => saveSection(2)}
							>
								{sectionDone(2) ? 'Done ✓' : 'Save & continue'}
							</Button>
						</Card.Content>
					</Card.Root>
				</section>

				<!-- 4. Optional extras -->
				<section id="section-3" class="scroll-mt-8 {sectionUnlocked(3) ? '' : 'pointer-events-none opacity-40'}">
					<Card.Root>
						<Card.Content class="space-y-5">
							<div class="space-y-1">
								<p class="text-[11px] font-semibold uppercase tracking-wider text-primary">
									Section 4 of 4 <span class="ml-1 rounded-full bg-muted px-2 py-0.5 normal-case tracking-normal text-muted-foreground">optional</span>
								</p>
								<h1 class="text-lg font-semibold tracking-tight">{steps[3].title}</h1>
								<p class="text-sm text-muted-foreground">{steps[3].subtitle}</p>
							</div>

							<Field class="gap-1.5">
								<FieldLabel>{steps[3].fields[0].label}</FieldLabel>
								<div class="flex gap-2">
									<input class="w-full rounded-full border border-border bg-muted/60 px-4 py-2 text-sm outline-none" bind:value={telegramChatId} placeholder="Enter your Chat ID" />
									<Button type="button" variant="outline" class="shrink-0 rounded-full" onclick={() => toast.success('Prototype: test message sent (not really).')}>Test</Button>
								</div>
								<details class="group">
									<summary class="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
										<span class="mr-1 text-primary">+</span>What's this for?
									</summary>
									<p class="pt-1 text-xs text-muted-foreground">{steps[3].fields[0].why}</p>
								</details>
							</Field>

							<Field class="gap-1.5">
								<FieldLabel>{steps[3].fields[1].label}</FieldLabel>
								<div class="grid gap-2 sm:grid-cols-2">
									<input class="rounded-full border border-border bg-muted/60 px-4 py-2 text-sm outline-none" bind:value={baseLocation} placeholder="e.g. Shah Alam" />
									<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
										<span class="shrink-0 text-sm text-muted-foreground">RM</span>
										<input class="w-full bg-transparent px-2 py-2 text-sm outline-none" type="number" min="0" step="0.01" bind:value={ratePerKm} placeholder="0.00 / km" />
									</div>
								</div>
								<details class="group">
									<summary class="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
										<span class="mr-1 text-primary">+</span>What's this for?
									</summary>
									<p class="pt-1 text-xs text-muted-foreground">{steps[3].fields[1].why}</p>
								</details>
							</Field>

							<Field class="gap-1.5">
								<FieldLabel>{steps[3].fields[2].label}</FieldLabel>
								<div class="flex items-center gap-2 text-sm">
									<span class="rounded-full bg-muted/60 px-4 py-2">08:00 AM</span>
									<span class="text-muted-foreground">–</span>
									<span class="rounded-full bg-muted/60 px-4 py-2">06:00 PM</span>
								</div>
								<details class="group">
									<summary class="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
										<span class="mr-1 text-primary">+</span>What's this for?
									</summary>
									<p class="pt-1 text-xs text-muted-foreground">{steps[3].fields[2].why}</p>
								</details>
							</Field>

							<Field class="gap-1.5">
								<FieldLabel>{steps[3].fields[3].label}</FieldLabel>
								<div class="flex flex-wrap gap-1.5">
									{#each ['No buffer', '15 min', '30 min', '45 min', '60 min'] as opt, i}
										<button
											type="button"
											onclick={() => (bufferMin = i)}
											class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors
												{bufferMin === i ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'}"
										>
											{opt}
										</button>
									{/each}
								</div>
								<details class="group">
									<summary class="cursor-pointer list-none text-xs font-medium text-muted-foreground hover:text-foreground">
										<span class="mr-1 text-primary">+</span>What's this for?
									</summary>
									<p class="pt-1 text-xs text-muted-foreground">{steps[3].fields[3].why}</p>
								</details>
							</Field>

							<div class="flex gap-2">
								<Button type="button" variant="outline" class="flex-1 rounded-full" onclick={() => saveSection(3)}>
									Skip for now
								</Button>
								<Button type="button" class="flex-1 rounded-full" onclick={() => saveSection(3)}>
									Save section
								</Button>
							</div>
						</Card.Content>
					</Card.Root>
				</section>

				<!-- 5. Reveal -->
				<section id="section-4" class="scroll-mt-8 {sectionUnlocked(4) ? '' : 'pointer-events-none opacity-40'}">
					<Card.Root>
						<Card.Content class="space-y-5 text-center">
							<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
								<svg class="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
							</div>
							<div class="space-y-1">
								<h1 class="text-lg font-semibold tracking-tight">{steps[4].title}</h1>
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
						</Card.Content>
					</Card.Root>
				</section>
			</div>
		</div>
	</div>
</div>
