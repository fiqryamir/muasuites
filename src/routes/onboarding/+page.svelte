<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import { configSchema, type PackageRow } from '$lib/schemas';
	import { uploadDuitNowQr } from '$lib/duitnow';
	import { invalidateProfileCache } from '$lib/cache';
	import SlugField from '$lib/components/forms/slug-field.svelte';
	import WhatsappField from '$lib/components/forms/whatsapp-field.svelte';
	import DepositFields from '$lib/components/forms/deposit-fields.svelte';
	import DuitnowQrField from '$lib/components/forms/duitnow-qr-field.svelte';
	import PackageForm from '$lib/components/forms/package-form.svelte';
	import TelegramField from '$lib/components/forms/telegram-field.svelte';
	import TravelFeeField from '$lib/components/forms/travel-fee-field.svelte';
	import WorkingHoursField from '$lib/components/forms/working-hours-field.svelte';
	import BufferField from '$lib/components/forms/buffer-field.svelte';
	import { steps } from './steps';

	let supabase = $derived(page.data.supabase);
	let userId = $derived(page.data.session?.user.id ?? '');

	// Resume — start at the last finished step (onboarding_step 0–4 = step index).
	let current = $state(page.data.prefill.config?.onboarding_step ?? 0);

	// Step 1 — identity (prefilled from the server load)
	let slug = $state(page.data.prefill.slug ?? '');
	let studioName = $state(page.data.prefill.config?.studio_name ?? '');
	let whatsappLocal = $state((page.data.prefill.config?.whatsapp_number ?? '').replace(/^60/, ''));

	// Step 2 — payment
	let depositMode = $state<'FIXED' | 'PERCENT'>(page.data.prefill.config?.deposit_mode ?? 'FIXED');
	let depositValue = $state(parseFloat(page.data.prefill.config?.deposit_value ?? '0') || 0);
	let duitnowQrUrl = $state(page.data.prefill.config?.duitnow_qr_url ?? '');
	let qrFile = $state<File | null>(null);

	// Step 3 — packages (PackageForm writes rows immediately; this is the bound list)
	let packages = $state<PackageRow[]>(page.data.prefill.packages);

	// Step 4 — optional extras
	let telegramChatId = $state(page.data.prefill.config?.telegram_chat_id ?? '');
	let basePlaceName = $state(page.data.prefill.config?.base_place_name ?? '');
	let baseLat = $state<number | null>(page.data.prefill.config?.base_lat ?? null);
	let baseLng = $state<number | null>(page.data.prefill.config?.base_lng ?? null);
	let ratePerKm = $state(parseFloat(page.data.prefill.config?.rate_per_km ?? '0') || 0);
	let workingHoursStart = $state(
		page.data.prefill.config?.working_hours_start?.slice(0, 5) || '08:00'
	);
	let workingHoursEnd = $state(page.data.prefill.config?.working_hours_end?.slice(0, 5) || '18:00');
	let defaultBufferMinutesStr = $state(
		String(page.data.prefill.config?.default_buffer_minutes ?? 0)
	);

	let saving = $state(false);

	// Real-time validation — Continue stays disabled until the step is valid (decision 02).
	const identityValid = $derived(
		configSchema.pick({ slug: true, studioName: true, whatsappNumber: true }).safeParse({
			slug: slug.trim(),
			studioName: studioName.trim(),
			whatsappNumber: '60' + whatsappLocal.trim()
		}).success
	);

	// An already-saved QR (resume) counts as present — no forced re-upload.
	const paymentValid = $derived(depositValue > 0 && (qrFile !== null || duitnowQrUrl !== ''));

	// Step 4 is optional — always completable (Save or Skip for now).
	const canContinue = $derived(
		current === 0
			? identityValid
			: current === 1
				? paymentValid
				: current === 2
					? packages.length >= 1
					: true
	);

	async function saveStep() {
		if (saving) return;
		saving = true;

		try {
			if (current === 0) {
				const fullWa = '60' + whatsappLocal.trim();

				const parsed = configSchema
					.pick({ slug: true, studioName: true, whatsappNumber: true })
					.safeParse({ slug: slug.trim(), studioName: studioName.trim(), whatsappNumber: fullWa });

				if (!parsed.success) {
					toast.warning(parsed.error.issues[0].message);
					return;
				}

				// Slug lives on `muas` — update it first so a duplicate handle
				// aborts before any step-advancing write (same order as settings).
				const { error: slugErr } = await supabase
					.from('muas')
					.update({ slug: slug.trim() })
					.eq('id', userId);

				if (slugErr) {
					toast.error(
						slugErr.code === '23505' ? 'This booking link is already taken.' : slugErr.message
					);
					return;
				}

				// Partial update — identity fields + step advance in one write.
				// Never touches other columns (the MUA's pre-existing extras survive).
				const { error: confErr } = await supabase
					.from('mua_configs')
					.update({
						studio_name: studioName.trim(),
						whatsapp_number: fullWa,
						onboarding_step: 1
					})
					.eq('mua_id', userId);

				if (confErr) {
					toast.error(confErr.message);
					return;
				}

				// The slug change affects the public page — bust its cache.
				invalidateProfileCache(slug.trim());
				toast.success('Step 1 saved — identity done.');
				current = 1;
			} else if (current === 1) {
				let finalQrUrl = duitnowQrUrl;

				if (qrFile) {
					finalQrUrl = await uploadDuitNowQr(supabase, userId, qrFile);
				}

				const { error: confErr } = await supabase
					.from('mua_configs')
					.update({
						deposit_mode: depositMode,
						deposit_value: depositValue,
						duitnow_qr_url: finalQrUrl,
						onboarding_step: 2
					})
					.eq('mua_id', userId);

				if (confErr) {
					toast.error(confErr.message);
					return;
				}

				toast.success('Step 2 saved — payment setup done.');
				current = 2;
			} else if (current === 2) {
				// Packages were written by PackageForm on add/remove — this save
				// just records the finished step.
				const { error: confErr } = await supabase
					.from('mua_configs')
					.update({ onboarding_step: 3 })
					.eq('mua_id', userId);

				if (confErr) {
					toast.error(confErr.message);
					return;
				}

				invalidateProfileCache(slug.trim());
				toast.success('Step 3 saved — services done.');
				current = 3;
			} else if (current === 3) {
				// Optional step saved — fields + completion in a single update.
				const { error: confErr } = await supabase
					.from('mua_configs')
					.update({
						telegram_chat_id: telegramChatId,
						base_lat: baseLat,
						base_lng: baseLng,
						base_place_name: basePlaceName || null,
						transport_formula: 'PER_KM',
						rate_per_km: ratePerKm,
						working_hours_start: workingHoursStart,
						working_hours_end: workingHoursEnd,
						default_buffer_minutes: parseInt(defaultBufferMinutesStr, 10),
						onboarding_step: 4,
						onboarded_at: new Date().toISOString()
					})
					.eq('mua_id', userId);

				if (confErr) {
					toast.error(confErr.message);
					return;
				}

				invalidateProfileCache(slug.trim());
				toast.success('All set — your booking page is live!');
				current = 4;
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Something went wrong — try again.');
		} finally {
			saving = false;
		}
	}

	// Skipping the optional step still completes onboarding (decision 01) —
	// writes nothing but the completion columns, never the extras.
	async function skipExtras() {
		if (saving) return;
		saving = true;

		try {
			const { error: confErr } = await supabase
				.from('mua_configs')
				.update({ onboarding_step: 4, onboarded_at: new Date().toISOString() })
				.eq('mua_id', userId);

			if (confErr) {
				toast.error(confErr.message);
				return;
			}

			toast.success('Skipped — you can add these anytime from Settings.');
			current = 4;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Something went wrong — try again.');
		} finally {
			saving = false;
		}
	}

	async function testTelegram() {
		if (!telegramChatId) {
			toast.warning('Enter your Telegram Chat ID first.');
			return;
		}

		try {
			const res = await fetch('/api/test-telegram', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ chatId: telegramChatId })
			});
			const data = await res.json();

			if (data.success) {
				toast.success('Test sent — check your Telegram.');
			} else {
				toast.error(data.error || 'Failed to send test.');
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to send test.');
		}
	}

	function copyLink() {
		navigator.clipboard?.writeText(`https://muasuites.com/${slug.trim()}`);
		toast.success('Booking page link copied!');
	}

	async function finishOnboarding() {
		await goto(resolve('/bookings'));
	}
</script>

<svelte:head><title>Set up your studio — MUASUITES</title></svelte:head>

<div class="bg-background flex min-h-screen flex-col items-center px-4 py-10">
	<p class="text-foreground text-sm font-semibold tracking-tight">MUASuites</p>

	{#if current < steps.length - 1}
		<!-- Stepper — steps 1–4; dots navigate back only (forward goes through Continue, where saves happen) -->
		<div class="mt-8 flex items-center gap-2">
			{#each steps.slice(0, 4) as s, i (s.id)}
				{#if i > 0}<div class="bg-border h-px w-6 sm:w-10"></div>{/if}
				<button
					type="button"
					onclick={() => (current = i)}
					disabled={i > current}
					class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors
						{i < current
						? 'bg-primary text-primary-foreground'
						: i === current
							? 'bg-foreground text-background'
							: 'bg-muted text-muted-foreground disabled:opacity-40'}"
					aria-label="Go to step {s.number}"
				>
					{#if i < current}
						<svg
							class="h-3.5 w-3.5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M4.5 12.75l6 6 9-13.5"
							/></svg
						>
					{:else}
						{s.number}
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	<Card.Root class="animate-in-up mt-6 w-full max-w-lg">
		<Card.Content class="space-y-6">
			{#if current === 0}
				<div class="space-y-1">
					<p class="text-primary text-[11px] font-semibold tracking-wider uppercase">Step 1 of 4</p>
					<h1 class="text-xl font-semibold tracking-tight">{steps[0].title}</h1>
					<p class="text-muted-foreground text-sm">{steps[0].subtitle}</p>
				</div>

				<Field class="gap-2">
					<FieldLabel>{steps[0].fields[0].label}</FieldLabel>
					<Input
						id="studio_name"
						bind:value={studioName}
						placeholder={steps[0].fields[0].placeholder}
						required
						class="bg-muted rounded-full border-none px-4"
					/>
					<p class="text-muted-foreground px-2 text-xs">{steps[0].fields[0].why}</p>
				</Field>

				<div class="space-y-2">
					<SlugField bind:value={slug} />
					<p class="text-muted-foreground px-2 text-xs">{steps[0].fields[1].why}</p>
				</div>

				<div class="space-y-2">
					<WhatsappField bind:value={whatsappLocal} />
					<p class="text-muted-foreground px-2 text-xs">{steps[0].fields[2].why}</p>
				</div>
			{:else if current === 1}
				<div class="space-y-1">
					<p class="text-primary text-[11px] font-semibold tracking-wider uppercase">Step 2 of 4</p>
					<h1 class="text-xl font-semibold tracking-tight">{steps[1].title}</h1>
					<p class="text-muted-foreground text-sm">{steps[1].subtitle}</p>
				</div>

				<DepositFields bind:mode={depositMode} bind:value={depositValue} />
				<p class="text-muted-foreground px-2 text-xs">{steps[1].fields[0].why}</p>
				<p class="text-muted-foreground px-2 text-xs">{steps[1].fields[1].why}</p>

				<div class="space-y-2">
					<DuitnowQrField bind:file={qrFile} existingUrl={duitnowQrUrl} />
					<p class="text-muted-foreground px-2 text-xs">{steps[1].fields[2].why}</p>
				</div>
			{:else if current === 2}
				<div class="space-y-1">
					<p class="text-primary text-[11px] font-semibold tracking-wider uppercase">Step 3 of 4</p>
					<h1 class="text-xl font-semibold tracking-tight">{steps[2].title}</h1>
					<p class="text-muted-foreground text-sm">{steps[2].subtitle}</p>
				</div>

				<PackageForm {supabase} {userId} bind:packages removable />
				<p class="text-muted-foreground px-2 text-xs">{steps[2].fields[0].why}</p>
			{:else if current === 3}
				<div class="space-y-1">
					<p class="text-primary text-[11px] font-semibold tracking-wider uppercase">Step 4 of 4</p>
					<h1 class="text-xl font-semibold tracking-tight">{steps[3].title}</h1>
					<p class="text-muted-foreground text-sm">{steps[3].subtitle}</p>
				</div>

				<div class="space-y-2">
					<TelegramField bind:chatId={telegramChatId} {testTelegram} />
					<p class="text-muted-foreground px-2 text-xs">{steps[3].fields[0].why}</p>
				</div>

				<div class="space-y-2">
					<TravelFeeField
						bind:placeName={basePlaceName}
						bind:lat={baseLat}
						bind:lng={baseLng}
						bind:ratePerKm
					/>
					<p class="text-muted-foreground px-2 text-xs">{steps[3].fields[1].why}</p>
				</div>

				<div class="space-y-2">
					<WorkingHoursField bind:start={workingHoursStart} bind:end={workingHoursEnd} />
					<p class="text-muted-foreground px-2 text-xs">{steps[3].fields[2].why}</p>
				</div>

				<div class="space-y-2">
					<BufferField bind:value={defaultBufferMinutesStr} />
					<p class="text-muted-foreground px-2 text-xs">{steps[3].fields[3].why}</p>
				</div>
			{:else}
				<!-- Reveal (step 5) — informational only, gate is already off -->
				<div class="space-y-5 text-center">
					<div
						class="bg-primary/10 mx-auto flex h-14 w-14 items-center justify-center rounded-full"
					>
						<svg
							class="text-primary h-6 w-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M4.5 12.75l6 6 9-13.5"
							/></svg
						>
					</div>
					<div class="space-y-1">
						<h1 class="text-xl font-semibold tracking-tight">{steps[4].title}</h1>
						<p class="text-muted-foreground text-sm">{steps[4].subtitle}</p>
					</div>

					<div class="border-border bg-muted/40 rounded-2xl border p-4">
						<p class="text-muted-foreground text-[11px] font-medium tracking-wider uppercase">
							Your booking page
						</p>
						<p class="mt-1 text-lg font-semibold tracking-tight break-all">
							muasuites.com/{slug.trim()}
						</p>
						<Button type="button" class="mt-3 w-full rounded-full" onclick={copyLink}>
							Copy link
						</Button>
					</div>

					<div class="bg-primary/5 rounded-2xl p-4 text-left">
						<p class="text-primary text-sm font-medium">What happens next</p>
						<ul class="text-muted-foreground mt-2 space-y-1.5 text-xs">
							<li>
								• Put this link in your Instagram bio — clients check your availability, then
								message you on WhatsApp.
							</li>
							<li>
								• When you agree on a date, create a booking link from your dashboard and send it —
								that's where they pay the deposit.
							</li>
							<li>• You approve each booking from your dashboard once the receipt arrives.</li>
						</ul>
					</div>

					<Button type="button" class="w-full rounded-full" onclick={finishOnboarding}>
						Finish — go to dashboard
					</Button>
				</div>
			{/if}

			{#if current < steps.length - 1}
				<Separator />
				<div class="flex items-center justify-between">
					<Button
						type="button"
						variant="ghost"
						class="rounded-full"
						disabled={current === 0 || saving}
						onclick={() => (current -= 1)}
					>
						Back
					</Button>
					<div class="flex gap-2">
						{#if current === 3}
							<Button
								type="button"
								variant="outline"
								class="rounded-full"
								disabled={saving}
								onclick={skipExtras}
							>
								Skip for now
							</Button>
						{/if}
						<Button
							type="button"
							class="rounded-full px-8"
							disabled={!canContinue || saving}
							onclick={saveStep}
						>
							{saving ? 'Saving...' : current === 3 ? 'Save' : 'Continue'}
						</Button>
					</div>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
