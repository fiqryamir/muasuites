<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { z } from 'zod';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText
	} from '$lib/components/ui/input-group';
	import { Separator } from '$lib/components/ui/separator';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field';
	import * as Select from '$lib/components/ui/select';

	let supabase = $derived(page.data.supabase);
	let session = $derived(page.data.session);

	let loading = $state(true);
	let saving = $state(false);
	let addingPackage = $state(false);
	let testingTelegram = $state(false);

	let userId = $state('');
	let profile = $state<any>(null);
	let packages = $state<any[]>([]);

	// Form state
	let slug = $state('');
	let studioName = $state('');
	let whatsappLocal = $state('');
	let telegramChatId = $state('');
	let depositMode = $state<'FIXED' | 'PERCENT'>('FIXED');
	let depositValue = $state(0);
	let duitnowQrUrl = $state('');
	let qrFile = $state<File | null>(null);

	// Working hours (Select-based shadcn time picker)
	const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
	const minutesList = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

	let whStartHour = $state('08');
	let whStartMin = $state('00');
	let whStartPeriod = $state('AM');
	let whEndHour = $state('06');
	let whEndMin = $state('00');
	let whEndPeriod = $state('PM');

	let workingHoursStart = $derived.by(() => {
		let hh = parseInt(whStartHour, 10);
		if (whStartPeriod === 'PM' && hh !== 12) hh += 12;
		if (whStartPeriod === 'AM' && hh === 12) hh = 0;
		return `${hh.toString().padStart(2, '0')}:${whStartMin}`;
	});

	let workingHoursEnd = $derived.by(() => {
		let hh = parseInt(whEndHour, 10);
		if (whEndPeriod === 'PM' && hh !== 12) hh += 12;
		if (whEndPeriod === 'AM' && hh === 12) hh = 0;
		return `${hh.toString().padStart(2, '0')}:${whEndMin}`;
	});

	let defaultBufferMinutesStr = $state('0');
	let defaultBufferMinutes = $derived(parseInt(defaultBufferMinutesStr, 10));

	// Package form state
	let pkgEmoji = $state('💄');
	let pkgName = $state('');
	let pkgPrice = $state(0);
	let pkgDuration = $state(3.0);

	const configSchema = z.object({
		slug: z
			.string()
			.min(3, 'Handle must be at least 3 characters.')
			.max(20, 'Handle must be 20 characters or less.')
			.regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores.'),
		studioName: z.string().min(2, 'Studio name must be at least 2 characters.'),
		whatsappNumber: z
			.string()
			.regex(/^(601)[0-9]{8,10}$/, 'Valid Malaysian format required (e.g. 60123456789).'),
		depositValue: z.number().nonnegative('Deposit cannot be negative.'),
		telegramChatId: z.string().optional()
	});

	const packageSchema = z.object({
		pkgEmoji: z.string().emoji('Enter a single emoji.'),
		pkgName: z.string().min(3, 'Name must be at least 3 characters.'),
		pkgPrice: z.number().positive('Price must be greater than RM 0.')
	});

	function parseTimeToComponents(timeStr: string) {
		const [h, m] = timeStr.split(':').map(Number);
		const period = h >= 12 ? 'PM' : 'AM';
		const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
		return {
			hour: h12.toString().padStart(2, '0'),
			min: m.toString().padStart(2, '0'),
			period
		};
	}

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

			// Parse working hours into Select components
			const start = parseTimeToComponents(conf.working_hours_start?.slice(0, 5) || '08:00');
			whStartHour = start.hour;
			whStartMin = start.min;
			whStartPeriod = start.period;

			const end = parseTimeToComponents(conf.working_hours_end?.slice(0, 5) || '18:00');
			whEndHour = end.hour;
			whEndMin = end.min;
			whEndPeriod = end.period;

			defaultBufferMinutesStr = String(conf.default_buffer_minutes ?? 0);
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

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files?.length) qrFile = target.files[0];
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
			const allowed = ['image/jpeg', 'image/png', 'image/webp'];
			if (!allowed.includes(qrFile.type)) {
				saving = false;
				toast.error('Please upload a PNG, JPG, or WebP file.');
				return;
			}

			const ext = qrFile.type === 'image/jpeg' ? 'jpg' : qrFile.type.split('/')[1];
			const path = `${userId}/duitnow_qr.${ext}`;

			const { error: uploadErr } = await supabase.storage
				.from('qr-codes')
				.upload(path, qrFile, { upsert: true, contentType: qrFile.type });

			if (uploadErr) {
				saving = false;
				toast.error('Upload failed: ' + uploadErr.message);
				return;
			}

			const { data } = supabase.storage.from('qr-codes').getPublicUrl(path);
			finalQrUrl = data.publicUrl;
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
				default_buffer_minutes: defaultBufferMinutes
			})
			.eq('mua_id', userId);

		saving = false;

		if (confErr) {
			toast.error(confErr.message);
		} else {
			toast.success('Settings saved.');
			qrFile = null;
			await loadSettings();
		}
	}

	async function handleAddPackage(e: Event) {
		e.preventDefault();
		addingPackage = true;

		const result = packageSchema.safeParse({ pkgEmoji, pkgName, pkgPrice });

		if (!result.success) {
			addingPackage = false;
			toast.warning(result.error.issues[0].message);
			return;
		}

		const { error } = await supabase.from('packages').insert({
			mua_id: userId,
			name: pkgName,
			price: pkgPrice,
			emoji: pkgEmoji,
			duration_hours: pkgDuration
		});

		addingPackage = false;

		if (error) {
			toast.error(error.message);
		} else {
			pkgName = '';
			pkgPrice = 0;
			pkgEmoji = '💄';
			pkgDuration = 3.0;
			toast.success('Package added.');
			await loadSettings();
		}
	}

	async function testTelegram() {
		if (!telegramChatId) {
			toast.warning('Enter your Telegram Chat ID first.');
			return;
		}

		testingTelegram = true;

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
		} catch (err: any) {
			toast.error(err.message);
		} finally {
			testingTelegram = false;
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
					<Field class="gap-2">
						<FieldLabel>Custom booking link</FieldLabel>
						<InputGroup class="rounded-full bg-muted border-none overflow-hidden">
							<InputGroupAddon class="pl-4">
								<InputGroupText class="text-muted-foreground text-sm">muasuites.com/</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput 
								id="slug" 
								bind:value={slug} 
								required 
								placeholder="your-handle"
								class="border-none bg-transparent focus-visible:ring-0" 
							/>
						</InputGroup>
					</Field>
		
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
						<Field class="gap-2">
							<FieldLabel>WhatsApp number</FieldLabel>
							<InputGroup class="rounded-full bg-muted border-none overflow-hidden">
								<InputGroupAddon class="pl-4">
									<InputGroupText class="text-muted-foreground text-sm">+60</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput
									id="whatsapp"
									placeholder="123456789"
									bind:value={whatsappLocal}
									required
									class="border-none bg-transparent focus-visible:ring-0"
								/>
							</InputGroup>
						</Field>
					</FieldGroup>
		
					<Separator />
		
					<!-- Telegram Notifications -->
					<Field class="gap-2">
							<FieldLabel>Telegram notifications</FieldLabel>
						<div class="flex gap-2">
							<Input
								id="telegram"
								bind:value={telegramChatId}
								placeholder="Enter your Chat ID"
								class="flex-1 rounded-full bg-muted border-none px-4"
							/>
							<Button
								type="button"
								variant="outline"
								disabled={testingTelegram || !telegramChatId}
								onclick={testTelegram}
								class="rounded-full shrink-0"
							>
								{testingTelegram ? 'Sending...' : 'Test'}
							</Button>
						</div>
						<p class="px-2 text-xs text-muted-foreground">
							Send a message to <span class="font-medium text-foreground">@userinfobot</span> to get your ID.
						</p>
					</Field>
		
					<Separator />
		
					<!-- Payment Setup -->
					<div class="space-y-4">
						<FieldGroup class="grid gap-4 sm:grid-cols-2">
							<Field class="gap-2">
								<FieldLabel>Deposit type</FieldLabel>
								<Select.Root type="single" bind:value={depositMode}>
									<Select.Trigger 
										id="deposit_mode" 
										class="flex h-10 w-full items-center justify-between rounded-full border-none bg-muted px-4 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring"
									>
										{depositMode === 'FIXED' ? 'Fixed Amount (RM)' : 'Percentage (%)'}
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-50"><path d="m6 9 6 6 6-6"/></svg>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="FIXED">Fixed Amount (RM)</Select.Item>
										<Select.Item value="PERCENT">Percentage (%)</Select.Item>
									</Select.Content>
								</Select.Root>
							</Field>
		
							<Field class="gap-2">
								<FieldLabel>
									{depositMode === 'FIXED' ? 'Deposit amount' : 'Deposit percentage'}
								</FieldLabel>
								<InputGroup class="rounded-full bg-muted border-none overflow-hidden">
									{#if depositMode === 'FIXED'}
										<InputGroupAddon class="pl-4">
											<InputGroupText class="text-muted-foreground text-sm">RM</InputGroupText>
										</InputGroupAddon>
									{/if}
									<InputGroupInput
										id="deposit_value"
										type="number"
										step="0.01"
										bind:value={depositValue}
										required
										class="border-none bg-transparent focus-visible:ring-0"
									/>
									{#if depositMode === 'PERCENT'}
										<InputGroupAddon class="pr-4">
											<InputGroupText class="text-muted-foreground text-sm">%</InputGroupText>
										</InputGroupAddon>
									{/if}
								</InputGroup>
							</Field>
						</FieldGroup>
		
						<Field class="gap-2">
							<FieldLabel>DuitNow QR code</FieldLabel>
							<Input
								id="qr_code"
								type="file"
								accept="image/png,image/jpeg,image/webp"
								onchange={handleFileChange}
								class=""
							/>
						</Field>
		
						{#if duitnowQrUrl}
							<div class="flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4">
								<img
									src={duitnowQrUrl}
									alt="DuitNow QR Code"
									class="h-20 w-20 rounded-lg border border-border bg-white object-contain p-1"
								/>
								<div class="space-y-0.5">
									<p class="text-sm font-medium">Current QR code</p>
									<p class="text-xs text-muted-foreground">Visible to clients during checkout.</p>
								</div>
							</div>
						{/if}
					</div>

					<Separator />

					<!-- Scheduling Section (inside the same form — saves together) -->
					<div class="space-y-4">
						<h3 class="text-sm font-semibold tracking-tight">Scheduling</h3>
						<p class="text-xs text-muted-foreground">Your daily availability and time-slot settings.</p>
						
						<FieldGroup class="grid gap-6 sm:grid-cols-2">
							<!-- Working Hours Start -->
							<Field class="gap-2">
								<FieldLabel>Working hours start</FieldLabel>
								<div class="flex items-center gap-2">
									<div class="flex-1">
										<Select.Root type="single" bind:value={whStartHour}>
											<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{whStartHour}</Select.Trigger>
											<Select.Content class="max-h-[200px] overflow-y-auto">
												{#each hoursList as hour}
													<Select.Item value={hour}>{hour}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>
									<span class="text-muted-foreground text-sm font-medium">:</span>
									<div class="flex-1">
										<Select.Root type="single" bind:value={whStartMin}>
											<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{whStartMin}</Select.Trigger>
											<Select.Content class="max-h-[200px] overflow-y-auto">
												{#each minutesList as min}
													<Select.Item value={min}>{min}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>
									<div class="flex-1">
										<Select.Root type="single" bind:value={whStartPeriod}>
											<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{whStartPeriod}</Select.Trigger>
											<Select.Content>
												<Select.Item value="AM">AM</Select.Item>
												<Select.Item value="PM">PM</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
								</div>
							</Field>

							<!-- Working Hours End -->
							<Field class="gap-2">
								<FieldLabel>Working hours end</FieldLabel>
								<div class="flex items-center gap-2">
									<div class="flex-1">
										<Select.Root type="single" bind:value={whEndHour}>
											<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{whEndHour}</Select.Trigger>
											<Select.Content class="max-h-[200px] overflow-y-auto">
												{#each hoursList as hour}
													<Select.Item value={hour}>{hour}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>
									<span class="text-muted-foreground text-sm font-medium">:</span>
									<div class="flex-1">
										<Select.Root type="single" bind:value={whEndMin}>
											<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{whEndMin}</Select.Trigger>
											<Select.Content class="max-h-[200px] overflow-y-auto">
												{#each minutesList as min}
													<Select.Item value={min}>{min}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>
									<div class="flex-1">
										<Select.Root type="single" bind:value={whEndPeriod}>
											<Select.Trigger class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2">{whEndPeriod}</Select.Trigger>
											<Select.Content>
												<Select.Item value="AM">AM</Select.Item>
												<Select.Item value="PM">PM</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>
								</div>
							</Field>
						</FieldGroup>

						<Field class="gap-2">
							<FieldLabel>Travel buffer between sessions</FieldLabel>
							<Select.Root type="single" bind:value={defaultBufferMinutesStr}>
								<Select.Trigger
									id="buffer"
									class="flex h-10 w-full items-center justify-between rounded-full border-none bg-muted px-4 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring"
								>
									{defaultBufferMinutes === 0 ? 'No buffer' : `${defaultBufferMinutes} min`}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="0">No buffer</Select.Item>
									<Select.Item value="15">15 min</Select.Item>
									<Select.Item value="30">30 min</Select.Item>
									<Select.Item value="45">45 min</Select.Item>
									<Select.Item value="60">60 min</Select.Item>
								</Select.Content>
							</Select.Root>
							<p class="px-2 text-xs text-muted-foreground">Extra time reserved after each booking for travel. This blocks the slot so no other client can book too close.</p>
						</Field>

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
				{#if packages.length > 0}
					<div class="divide-y divide-border">
						{#each packages as pkg}
							<div class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
								<div class="flex items-center gap-3">
									<span
										class="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-base"
									>
										{pkg.emoji}
									</span>
									<div>
										<span class="text-sm font-medium">{pkg.name}</span>
										<p class="text-[11px] text-muted-foreground">{pkg.duration_hours} hrs</p>
									</div>
								</div>
								<span class="text-sm font-semibold tabular-nums">
									RM {Number(pkg.price).toLocaleString('en-MY', {
										minimumFractionDigits: 2
									})}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="rounded-lg border border-dashed border-border py-10 text-center">
						<p class="text-sm text-muted-foreground">
							No packages yet. Add your first one below.
						</p>
					</div>
				{/if}

				<Separator />

				<div class="space-y-4">
					<h4 class="text-sm font-semibold">Add new package</h4>
					<form onsubmit={handleAddPackage} class="grid gap-4 sm:grid-cols-[5rem_1fr_7rem_7rem]">
						<Field class="gap-2">
							<FieldLabel>Icon</FieldLabel>
							<Input id="pkg-emoji" bind:value={pkgEmoji} required class="text-center rounded-full bg-muted border-none" />
						</Field>
						<Field class="gap-2">
							<FieldLabel>Package name</FieldLabel>
							<Input id="pkg-name" bind:value={pkgName} required placeholder="e.g., Nikah Full Glam" class="rounded-full bg-muted border-none px-4" />
						</Field>
						<Field class="gap-2">
							<FieldLabel>Duration (hrs)</FieldLabel>
							<Input id="pkg-duration" type="number" step="0.5" min="0.5" max="12" bind:value={pkgDuration} required class="rounded-full bg-muted border-none px-4" />
						</Field>
						<Field class="gap-2">
							<FieldLabel>Price (RM)</FieldLabel>
							<Input id="pkg-price" type="number" step="0.01" bind:value={pkgPrice} required placeholder="800.00" class="rounded-full bg-muted border-none px-4" />
						</Field>
						<div class="flex justify-end sm:col-span-4">
							<Button type="submit" variant="outline" disabled={addingPackage} class="rounded-full">
								{addingPackage ? 'Adding...' : 'Add package'}
							</Button>
						</div>
					</form>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
{/if}