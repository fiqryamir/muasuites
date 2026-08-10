<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field';
	import { configSchema, type PackageRow } from '$lib/schemas';
	import { uploadDuitNowQr } from '$lib/duitnow';
	import { invalidateProfileCache } from '$lib/cache';
	import SlugField from '$lib/components/forms/slug-field.svelte';
	import WhatsappField from '$lib/components/forms/whatsapp-field.svelte';
	import DepositFields from '$lib/components/forms/deposit-fields.svelte';
	import DuitnowQrField from '$lib/components/forms/duitnow-qr-field.svelte';
	import TelegramField from '$lib/components/forms/telegram-field.svelte';
	import WorkingHoursField from '$lib/components/forms/working-hours-field.svelte';
	import BufferField from '$lib/components/forms/buffer-field.svelte';
	import PackageForm from '$lib/components/forms/package-form.svelte';
	import TravelFeeField from '$lib/components/forms/travel-fee-field.svelte';

	let supabase = $derived(page.data.supabase);
	let session = $derived(page.data.session);

	let loading = $state(true);
	let saving = $state(false);

	let userId = $state('');
	let profile = $state<{ slug?: string; subscription_plan?: string } | null>(null);
	let packages = $state<PackageRow[]>([]);

	// Form state
	let slug = $state('');
	let studioName = $state('');
	let whatsappLocal = $state('');
	let telegramChatId = $state('');
	let depositMode = $state<'FIXED' | 'PERCENT'>('FIXED');
	let depositValue = $state(0);
	let duitnowQrUrl = $state('');
	let qrFile = $state<File | null>(null);

	// Working hours (HH:MM strings, decomposed into selects inside the shared field)
	let workingHoursStart = $state('08:00');
	let workingHoursEnd = $state('18:00');

	let defaultBufferMinutesStr = $state('0');
	let defaultBufferMinutes = $derived(parseInt(defaultBufferMinutesStr, 10));

	// Balance payment cutoff
	let balanceDueDays = $state(3);

	// Travel fee
	let basePlaceName = $state('');
	let baseLat = $state<number | null>(null);
	let baseLng = $state<number | null>(null);
	let ratePerKm = $state(0);

	onMount(async () => {
		if (!session) return;
		userId = session.user.id;
		await loadSettings();
	});

	async function loadSettings() {
		loading = true;

		const { data: prof } = await supabase
			.from('muas')
			.select('slug, subscription_plan')
			.eq('id', userId)
			.single();

		if (prof) {
			profile = prof;
			slug = prof.slug;
		}

		const { data: conf } = await supabase
			.from('mua_configs')
			.select('*')
			.eq('mua_id', userId)
			.single();

		if (conf) {
			studioName = conf.studio_name || '';
			telegramChatId = conf.telegram_chat_id || '';
			depositMode = conf.deposit_mode || 'FIXED';
			depositValue = parseFloat(conf.deposit_value || '0');
			duitnowQrUrl = conf.duitnow_qr_url || '';

			const raw = conf.whatsapp_number || '';
			whatsappLocal = raw.startsWith('60') ? raw.substring(2) : raw;

			workingHoursStart = conf.working_hours_start?.slice(0, 5) || '08:00';
			workingHoursEnd = conf.working_hours_end?.slice(0, 5) || '18:00';

			defaultBufferMinutesStr = String(conf.default_buffer_minutes ?? 0);
			balanceDueDays = conf.balance_due_days_before ?? 3;

			basePlaceName = conf.base_place_name || '';
			baseLat = conf.base_lat ?? null;
			baseLng = conf.base_lng ?? null;
			ratePerKm = parseFloat(conf.rate_per_km || '0') || 0;
		}

		const { data: pkgs } = await supabase
			.from('packages')
			.select('*')
			.eq('mua_id', userId)
			.eq('is_active', true)
			.order('price', { ascending: true });

		packages = pkgs || [];
		loading = false;
	}

	async function handleSaveConfig(e: Event) {
		e.preventDefault();
		saving = true;

		const fullWa = `60${whatsappLocal}`;

		const result = configSchema.safeParse({
			slug,
			studioName,
			whatsappNumber: fullWa,
			depositValue,
			telegramChatId
		});

		if (!result.success) {
			saving = false;
			toast.warning(result.error.issues[0].message);
			return;
		}

		let finalQrUrl = duitnowQrUrl;

		if (qrFile) {
			try {
				finalQrUrl = await uploadDuitNowQr(supabase, userId, qrFile);
			} catch (err) {
				saving = false;
				toast.error(err instanceof Error ? err.message : 'Upload failed.');
				return;
			}
		}

		const { error: slugErr } = await supabase
			.from('muas')
			.update({ slug })
			.eq('id', userId);

		if (slugErr) {
			saving = false;
			toast.error(
				slugErr.code === '23505'
					? 'This booking link is already taken.'
					: slugErr.message
			);
			return;
		}

		const { error: confErr } = await supabase
			.from('mua_configs')
			.update({
				studio_name: studioName,
				whatsapp_number: fullWa,
				telegram_chat_id: telegramChatId,
				deposit_mode: depositMode,
				deposit_value: depositValue,
				duitnow_qr_url: finalQrUrl,
				working_hours_start: workingHoursStart,
				working_hours_end: workingHoursEnd,
				default_buffer_minutes: defaultBufferMinutes,
				balance_due_days_before: balanceDueDays,
				base_lat: baseLat,
				base_lng: baseLng,
				base_place_name: basePlaceName || null,
				transport_formula: 'PER_KM',
				rate_per_km: ratePerKm
			})
			.eq('mua_id', userId);

		saving = false;

		if (confErr) {
			toast.error(confErr.message);
		} else {
			toast.success('Settings saved.');
			// Invalidate public profile cache so updated config/packages/blackouts propagate immediately
			if (slug) {
				invalidateProfileCache(slug);
			}
			qrFile = null;
			await loadSettings();
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
</script>

{#if loading}
	<div class="flex items-center justify-center py-24">
		<div class="flex items-center gap-3 text-muted-foreground">
			<svg
				class="h-4 w-4 animate-spin"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			<span class="text-sm">Loading settings...</span>
		</div>
	</div>
{:else}
	<div class="space-y-8 animate-in-up">
		<!-- Page Header -->
		<div class="flex items-start justify-between gap-4">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Manage your studio profile, payment details, and service packages.
				</p>
			</div>
			{#if profile}
				<span
					class="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium
						{profile.subscription_plan === 'FREE'
						? 'bg-muted text-muted-foreground'
						: 'bg-primary/10 text-primary'}"
				>
					{profile.subscription_plan}
				</span>
			{/if}
		</div>

		<!-- Profile & Booking Card (includes scheduling section inside the form) -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Profile & booking</Card.Title>
				<Card.Description>Your studio identity, availability, and how clients find and pay you.</Card.Description>
			</Card.Header>
			<Card.Content>
				<form onsubmit={handleSaveConfig} class="space-y-6">
					<!-- Booking Link -->
					<SlugField bind:value={slug} />
		
					<Separator />
		
					<!-- Contact Details -->
					<FieldGroup class="grid gap-4 sm:grid-cols-2">
						<Field class="gap-2">
							<FieldLabel>Studio name</FieldLabel>
							<Input
								id="studio_name"
								bind:value={studioName}
								required
								placeholder="Glam by Sarah"
								class="rounded-full bg-muted border-none px-4"
							/>
						</Field>
						<WhatsappField bind:value={whatsappLocal} />
					</FieldGroup>
		
					<Separator />
		
					<!-- Telegram Notifications -->
					<TelegramField bind:chatId={telegramChatId} testTelegram={testTelegram} />
		
					<Separator />
		
					<!-- Payment Setup -->
					<div class="space-y-4">
						<DepositFields bind:mode={depositMode} bind:value={depositValue} />
		
						<DuitnowQrField bind:file={qrFile} existingUrl={duitnowQrUrl} />
					</div>

					<Separator />

					<!-- Travel Fee -->
					<div class="space-y-4">
						<h3 class="text-sm font-semibold tracking-tight">Travel</h3>
						<p class="text-xs text-muted-foreground">Where you travel from and what you charge per km.</p>

						<TravelFeeField
							bind:placeName={basePlaceName}
							bind:lat={baseLat}
							bind:lng={baseLng}
							bind:ratePerKm={ratePerKm}
						/>
					</div>

					<Separator />

					<!-- Scheduling Section (inside the same form — saves together) -->
					<div class="space-y-4">
						<h3 class="text-sm font-semibold tracking-tight">Scheduling</h3>
						<p class="text-xs text-muted-foreground">Your daily availability and time-slot settings.</p>
						
						<WorkingHoursField bind:start={workingHoursStart} bind:end={workingHoursEnd} />

						<Field class="gap-2">
							<FieldLabel>Balance payment cutoff</FieldLabel>
							<div class="flex items-center gap-2">
								<Input
									id="balance_due_days"
									type="number"
									min="0"
									max="30"
									bind:value={balanceDueDays}
									class="w-24 rounded-full bg-muted border-none px-4"
								/>
								<span class="text-sm text-muted-foreground">days before event</span>
							</div>
							<p class="px-2 text-xs text-muted-foreground">Client must pay the remaining balance by this cutoff. Overdue notices are sent via Telegram.</p>
						</Field>

						<BufferField bind:value={defaultBufferMinutesStr} />

						<!-- Plan-based capacity (read-only) -->
						<Field class="gap-2">
							<FieldLabel>Active booking capacity</FieldLabel>
							<div class="border-border bg-muted/30 rounded-lg border p-3">
								{#if profile?.subscription_plan === 'FREE'}
									<p class="text-sm font-medium">2 active bookings</p>
									<p class="text-xs text-muted-foreground mt-0.5">
										FREE plan limit. <span class="text-primary underline underline-offset-2">Upgrade</span> for unlimited bookings.
									</p>
								{:else}
									<p class="text-sm font-medium">Unlimited</p>
									<p class="text-xs text-muted-foreground mt-0.5">
										Paid plan — no capacity restrictions.
									</p>
								{/if}
							</div>
						</Field>
					</div>
		
					<div class="flex justify-end pt-2">
						<Button type="submit" disabled={saving} class="rounded-full px-8">
							{saving ? 'Saving...' : 'Save changes'}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Service Packages Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Service packages</Card.Title>
				<Card.Description>Packages available for client bookings.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<PackageForm {supabase} {userId} bind:packages />
			</Card.Content>
		</Card.Root>
	</div>
{/if}