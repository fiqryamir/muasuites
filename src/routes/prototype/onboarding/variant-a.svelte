<script lang="ts">
	// VARIANT A — Linear wizard: one card per step, numbered progress, why-copy inline.
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import { Separator } from '$lib/components/ui/separator';
	import { steps } from './steps';

	let step = $state(0);

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

	const canContinue = $derived.by(() => {
		if (step === 0) return studioName.trim().length >= 2 && slug.trim().length >= 3 && whatsappLocal.trim().length >= 8;
		if (step === 1) return depositValue > 0 && qrFile !== null;
		if (step === 2) return packages.length >= 1;
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

<div class="flex min-h-screen flex-col items-center bg-background px-4 py-10">
	<p class="text-sm font-semibold tracking-tight text-foreground">MUASuites</p>

	{#if step < steps.length - 1}
		<!-- Stepper -->
		<div class="mt-8 flex items-center gap-2">
			{#each steps.slice(0, 4) as s, i (s.id)}
				{#if i > 0}<div class="h-px w-6 bg-border sm:w-10"></div>{/if}
				<button
					type="button"
					onclick={() => step = i}
					class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors
						{i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}"
					aria-label="Go to step {s.number}"
				>
					{#if i < step}
						<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
					{:else}
						{s.number}
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	<Card.Root class="mt-6 w-full max-w-lg animate-in-up">
		<Card.Content class="space-y-6">
			{#if step === 0}
				<div class="space-y-1">
					<p class="text-[11px] font-semibold uppercase tracking-wider text-primary">Step 1 of 4</p>
					<h1 class="text-xl font-semibold tracking-tight">{steps[0].title}</h1>
					<p class="text-sm text-muted-foreground">{steps[0].subtitle}</p>
				</div>

				<Field class="gap-1.5">
					<FieldLabel>{steps[0].fields[0].label}</FieldLabel>
					<Input bind:value={studioName} placeholder={steps[0].fields[0].placeholder} />
					<p class="text-xs text-muted-foreground">{steps[0].fields[0].why}</p>
				</Field>

				<Field class="gap-1.5">
					<FieldLabel>{steps[0].fields[1].label}</FieldLabel>
					<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
						<span class="shrink-0 text-sm text-muted-foreground">muasuites.com/</span>
						<input
							class="w-full bg-transparent px-2 py-2 text-sm outline-none"
							bind:value={slug}
							placeholder="your-name"
						/>
					</div>
					<p class="text-xs text-muted-foreground">{steps[0].fields[1].why}</p>
				</Field>

				<Field class="gap-1.5">
					<FieldLabel>{steps[0].fields[2].label}</FieldLabel>
					<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
						<span class="shrink-0 text-sm text-muted-foreground">+60</span>
						<input
							class="w-full bg-transparent px-2 py-2 text-sm outline-none"
							bind:value={whatsappLocal}
							placeholder="123456789"
							inputmode="numeric"
						/>
					</div>
					<p class="text-xs text-muted-foreground">{steps[0].fields[2].why}</p>
				</Field>
			{/if}

			{#if step === 1}
				<div class="space-y-1">
					<p class="text-[11px] font-semibold uppercase tracking-wider text-primary">Step 2 of 4</p>
					<h1 class="text-xl font-semibold tracking-tight">{steps[1].title}</h1>
					<p class="text-sm text-muted-foreground">{steps[1].subtitle}</p>
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
					<p class="text-xs text-muted-foreground">{steps[1].fields[0].why}</p>
				</Field>

				<Field class="gap-1.5">
					<FieldLabel>{depositMode === 'FIXED' ? 'Deposit amount (RM)' : 'Deposit percentage (%)'}</FieldLabel>
					<div class="flex items-center rounded-full border border-border bg-muted/60 px-4">
						{#if depositMode === 'FIXED'}<span class="shrink-0 text-sm text-muted-foreground">RM</span>{/if}
						<input
							class="w-full bg-transparent px-2 py-2 text-sm outline-none"
							type="number"
							min="0"
							step="0.01"
							bind:value={depositValue}
						/>
						{#if depositMode === 'PERCENT'}<span class="shrink-0 text-sm text-muted-foreground">%</span>{/if}
					</div>
					<p class="text-xs text-muted-foreground">{steps[1].fields[1].why}</p>
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
						<div class="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
							<div class="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-white text-lg">
								<span class="grid grid-cols-3 gap-0.5 opacity-70">
									<span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span>
									<span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span>
									<span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span><span class="h-1.5 w-1.5 bg-foreground"></span>
								</span>
							</div>
							<p class="text-sm font-medium">{qrFile.name}</p>
						</div>
					{/if}
					<p class="text-xs text-muted-foreground">{steps[1].fields[2].why}</p>
				</Field>
			{/if}

			{#if step === 2}
				<div class="space-y-1">
					<p class="text-[11px] font-semibold uppercase tracking-wider text-primary">Step 3 of 4</p>
					<h1 class="text-xl font-semibold tracking-tight">{steps[2].title}</h1>
					<p class="text-sm text-muted-foreground">{steps[2].subtitle}</p>
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
									<button type="button" onclick={() => removePackage(i)} class="text-xs text-muted-foreground hover:text-destructive" aria-label="Remove {pkg.name}">Remove</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<div class="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
					<p class="mb-3 text-sm font-semibold">Add a package</p>
					<div class="grid grid-cols-[4rem_1fr] gap-2">
						<input class="rounded-full border border-border bg-card px-3 py-2 text-center text-sm outline-none" bind:value={pkgEmoji} aria-label="Icon" />
						<input class="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none" bind:value={pkgName} placeholder="e.g. Bridal Makeup" aria-label="Package name" />
						<input class="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none" type="number" min="0.5" max="12" step="0.5" bind:value={pkgDuration} aria-label="Duration hours" />
						<input class="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none" type="number" min="0" step="0.01" bind:value={pkgPrice} placeholder="Price RM" aria-label="Price" />
					</div>
					<Button
						type="button"
						variant="outline"
						class="mt-3 w-full rounded-full"
						disabled={!pkgName.trim() || pkgPrice <= 0}
						onclick={addPackage}
					>
						Add package
					</Button>
					<p class="mt-2 text-xs text-muted-foreground">{steps[2].fields[0].why}</p>
				</div>
			{/if}

			{#if step === 3}
				<div class="space-y-1">
					<p class="text-[11px] font-semibold uppercase tracking-wider text-primary">Step 4 of 4</p>
					<h1 class="text-xl font-semibold tracking-tight">{steps[3].title}</h1>
					<p class="text-sm text-muted-foreground">{steps[3].subtitle}</p>
				</div>

				<Field class="gap-1.5">
					<FieldLabel>{steps[3].fields[0].label}</FieldLabel>
					<div class="flex gap-2">
						<input class="w-full rounded-full border border-border bg-muted/60 px-4 py-2 text-sm outline-none" bind:value={telegramChatId} placeholder="Enter your Chat ID" />
						<Button type="button" variant="outline" class="shrink-0 rounded-full" onclick={() => toast.success('Prototype: test message sent (not really).')}>Test</Button>
					</div>
					<p class="text-xs text-muted-foreground">{steps[3].fields[0].why}</p>
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
					<p class="text-xs text-muted-foreground">{steps[3].fields[1].why}</p>
				</Field>

				<Field class="gap-1.5">
					<FieldLabel>{steps[3].fields[2].label}</FieldLabel>
					<div class="flex items-center gap-2 text-sm">
						<span class="rounded-full bg-muted/60 px-4 py-2">08:00 AM</span>
						<span class="text-muted-foreground">–</span>
						<span class="rounded-full bg-muted/60 px-4 py-2">06:00 PM</span>
					</div>
					<p class="text-xs text-muted-foreground">{steps[3].fields[2].why}</p>
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
					<p class="text-xs text-muted-foreground">{steps[3].fields[3].why}</p>
				</Field>
			{/if}

			{#if step === 4}
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
				</div>
			{/if}

			{#if step < 4}
				<Separator />
				<div class="flex items-center justify-between">
					<Button type="button" variant="ghost" class="rounded-full" disabled={step === 0} onclick={() => step -= 1}>Back</Button>
					<div class="flex gap-2">
						{#if step === 3}
							<Button type="button" variant="outline" class="rounded-full" onclick={() => step += 1}>Skip for now</Button>
						{/if}
						<Button type="button" class="rounded-full" disabled={!canContinue} onclick={() => step += 1}>
							{step === 3 ? 'Continue' : 'Continue'}
						</Button>
					</div>
				</div>
			{:else}
				<Button type="button" class="w-full rounded-full" onclick={finish}>Finish — go to dashboard</Button>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
