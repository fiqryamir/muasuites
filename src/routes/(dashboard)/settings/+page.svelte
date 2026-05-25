<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	// Svelte 5 State Variables
	let loading = $state(true);
	let updating = $state(false);
	let addingPkg = $state(false);

	let userId = $state('');
	let profile = $state<any>(null);
	let config = $state<any>(null);
	let packages = $state<any[]>([]);

	// Input bindings
	let slug = $state('');
	let studioName = $state('');
	let whatsappNumber = $state('');
	let telegramChatId = $state('');
	let depositMode = $state<'FIXED' | 'PERCENT'>('FIXED');
	let depositValue = $state(0);
	let duitnowQrUrl = $state('');

	// File Upload State
	let qrFile = $state<File | null>(null);

	// Package form bindings
	let pkgEmoji = $state('💄');
	let pkgName = $state('');
	let pkgPrice = $state(0);

	// UI feedback states
	let feedbackMessage = $state('');
	let feedbackError = $state('');

	let testingTelegram = $state(false);
	let telegramTestMessage = $state('');
	let telegramTestError = $state('');

	onMount(async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (!session) return;

		userId = session.user.id;
		await loadSettings();
	});

	async function loadSettings() {
		loading = true;

		// 1. Fetch profile slug
		const { data: prof } = await supabase
			.from('muas')
			.select('slug, subscription_plan')
			.eq('id', userId)
			.single();

		if (prof) {
			profile = prof;
			slug = prof.slug;
		}

		// 2. Fetch config settings
		const { data: conf } = await supabase
			.from('mua_configs')
			.select('*')
			.eq('mua_id', userId)
			.single();

		if (conf) {
			config = conf;
			studioName = conf.studio_name || '';
			whatsappNumber = conf.whatsapp_number || '';
			telegramChatId = conf.telegram_chat_id || '';
			depositMode = conf.deposit_mode || 'FIXED';
			depositValue = parseFloat(conf.deposit_value || '0');
			duitnowQrUrl = conf.duitnow_qr_url || '';
		}

		// 3. Fetch Packages
		const { data: pkgs } = await supabase
			.from('packages')
			.select('*')
			.eq('mua_id', userId)
			.eq('is_active', true)
			.order('price', { ascending: true });

		packages = pkgs || [];
		loading = false;
	}

	// Handle local file selection
	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			qrFile = target.files[0];
		}
	}

	async function handleUpdateConfig(e: Event) {
		e.preventDefault();
		updating = true;
		feedbackError = '';
		feedbackMessage = '';

		// Slug validation
		if (!/^[a-z0-9_]{3,20}$/.test(slug)) {
			feedbackError =
				'Slug must be 3-20 characters long and contain only lowercase letters, numbers, or underscores.';
			updating = false;
			return;
		}

		let finalQrUrl = duitnowQrUrl;

		// 1. Upload QR image if a new file is chosen
		if (qrFile) {
			const fileExt = qrFile.name.split('.').pop();
			const filePath = `${userId}/duitnow_qr.${fileExt}`;

			// Upload/Overwrite existing QR file in public bucket
			const { error: uploadError } = await supabase.storage
				.from('qr-codes')
				.upload(filePath, qrFile, { upsert: true });

			if (uploadError) {
				feedbackError = 'Error uploading QR code file: ' + uploadError.message;
				updating = false;
				return;
			}

			// Retrieve the public URL
			const {
				data: { publicUrl }
			} = supabase.storage.from('qr-codes').getPublicUrl(filePath);

			finalQrUrl = publicUrl;
		}

		// 2. Update public.muas (slug)
		const { error: profileError } = await supabase.from('muas').update({ slug }).eq('id', userId);

		if (profileError) {
			if (profileError.code === '23505') {
				feedbackError = 'This custom link handle is already taken by another MUA.';
			} else {
				feedbackError = profileError.message;
			}
			updating = false;
			return;
		}

		// 3. Update public.mua_configs
		const { error: configError } = await supabase
			.from('mua_configs')
			.update({
				studio_name: studioName,
				whatsapp_number: whatsappNumber,
				telegram_chat_id: telegramChatId,
				deposit_mode: depositMode,
				deposit_value: depositValue,
				duitnow_qr_url: finalQrUrl
			})
			.eq('mua_id', userId);

		updating = false;

		if (configError) {
			feedbackError = configError.message;
		} else {
			feedbackMessage = 'Settings successfully updated!';
			qrFile = null; // reset file input state
			await loadSettings();
		}
	}

	async function handleAddPackage(e: Event) {
		e.preventDefault();
		addingPkg = true;
		feedbackError = '';

		if (!pkgName || pkgPrice <= 0) {
			feedbackError = 'Please enter a valid package title and price.';
			addingPkg = false;
			return;
		}

		const { error } = await supabase.from('packages').insert({
			mua_id: userId,
			name: pkgName,
			price: pkgPrice,
			emoji: pkgEmoji
		});

		addingPkg = false;

		if (error) {
			feedbackError = error.message;
		} else {
			pkgName = '';
			pkgPrice = 0;
			pkgEmoji = '💄';
			await loadSettings();
		}
	}

	async function testTelegramConnection() {
		if (!telegramChatId) {
			telegramTestError = 'Please enter a Telegram Chat ID first.';
			return;
		}

		testingTelegram = true;
		telegramTestError = '';
		telegramTestMessage = '';

		try {
			const response = await fetch('/api/test-telegram', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ chatId: telegramChatId })
			});

			const result = await response.json();

			if (result.success) {
				telegramTestMessage = 'Test notification sent! Check your Telegram app.';
			} else {
				telegramTestError = result.error;
			}
		} catch (err: any) {
			telegramTestError = err.message;
		} finally {
			testingTelegram = false;
		}
	}
</script>

{#if loading}
	<div class="flex items-center justify-center py-12">
		<p class="animate-pulse text-sm font-semibold text-slate-500">Loading settings...</p>
	</div>
{:else}
	<div class="mx-auto max-w-3xl space-y-6">
		<!-- Feedback alerts -->
		{#if feedbackError}
			<div class="rounded-md border border-red-200 bg-red-50 p-4">
				<p class="text-sm font-medium text-red-800">{feedbackError}</p>
			</div>
		{/if}

		{#if feedbackMessage}
			<div class="rounded-md border border-emerald-200 bg-emerald-50 p-4">
				<p class="text-sm font-medium text-emerald-800">{feedbackMessage}</p>
			</div>
		{/if}

		<!-- Section 1: Business Identity & Profile Config -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Studio Identity & Configurations</Card.Title>
				<Card.Description>Configure your personal booking handle and contact info.</Card.Description
				>
			</Card.Header>
			<Card.Content>
				<form onsubmit={handleUpdateConfig} class="space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-1.5">
							<label for="slug" class="text-xs font-semibold text-slate-500 uppercase"
								>Custom Booking Handle</label
							>
							<div class="flex items-center">
								<span
									class="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500"
									>/</span
								>
								<Input id="slug" name="slug" bind:value={slug} required class="rounded-l-none" />
							</div>
							<p class="text-[10px] text-slate-400">Url path: muasuite.com/slug/invite_token</p>
						</div>

						<div class="space-y-1.5">
							<label for="studio_name" class="text-xs font-semibold text-slate-500 uppercase"
								>Studio Name</label
							>
							<Input id="studio_name" name="studio_name" bind:value={studioName} required />
						</div>

						<div class="space-y-1.5">
							<label for="whatsapp_number" class="text-xs font-semibold text-slate-500 uppercase"
								>WhatsApp Contact Number</label
							>
							<Input
								id="whatsapp_number"
								name="whatsapp_number"
								placeholder="60123456789"
								bind:value={whatsappNumber}
								required
							/>
						</div>

						<div class="space-y-1.5 md:col-span-1">
							<label for="telegram_chat_id" class="text-xs font-semibold text-slate-500 uppercase"
								>Telegram Chat ID</label
							>
							<div class="flex gap-2">
								<Input
									id="telegram_chat_id"
									name="telegram_chat_id"
									bind:value={telegramChatId}
									placeholder="E.g., 12345678"
								/>
								<Button
									type="button"
									variant="outline"
									disabled={testingTelegram || !telegramChatId}
									onclick={testTelegramConnection}
									class="shrink-0"
								>
									{testingTelegram ? 'Testing...' : 'Send Test'}
								</Button>
							</div>

							<!-- Live verification alerts -->
							{#if telegramTestError}
								<p class="mt-1 text-[10px] font-semibold text-red-600">{telegramTestError}</p>
							{/if}
							{#if telegramTestMessage}
								<p class="mt-1 text-[10px] font-semibold text-emerald-600">{telegramTestMessage}</p>
							{/if}

							<p class="text-[9px] text-slate-400">
								Get your ID by sending a message to <strong>@userinfobot</strong> on Telegram. Make sure
								you click "Start" on your custom bot first!
							</p>
						</div>

						<div class="space-y-1.5">
							<label for="deposit_mode" class="text-xs font-semibold text-slate-500 uppercase"
								>Default Deposit Fee Mode</label
							>
							<select
								id="deposit_mode"
								name="deposit_mode"
								class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none"
								bind:value={depositMode}
							>
								<option value="FIXED">Fixed Price (RM)</option>
								<option value="PERCENT">Percentage (%)</option>
							</select>
						</div>

						<div class="space-y-1.5">
							<label for="deposit_value" class="text-xs font-semibold text-slate-500 uppercase"
								>Deposit Value</label
							>
							<Input
								id="deposit_value"
								name="deposit_value"
								type="number"
								step="0.01"
								bind:value={depositValue}
								required
							/>
						</div>

						<!-- NEW: DuitNow QR Upload Input & Live Preview -->
						<div class="space-y-1.5 border-t border-slate-100 pt-4 md:col-span-2">
							<label for="qr_code" class="text-xs font-bold text-slate-700 uppercase"
								>Setup DuitNow QR Code Screenshot</label
							>
							<div class="grid grid-cols-1 items-center gap-4 md:grid-cols-2">
								<div class="space-y-1.5">
									<Input id="qr_code" type="file" accept="image/*" onchange={handleFileChange} />
									<p class="text-[10px] text-slate-400">
										Attach your bank's DuitNow QR code image so clients can transfer easily.
									</p>
								</div>
								{#if duitnowQrUrl}
									<div
										class="flex flex-col items-center rounded border border-slate-100 bg-slate-50 p-2"
									>
										<span class="pb-1 text-[10px] font-semibold text-slate-400 uppercase"
											>Current Active QR</span
										>
										<img
											src={duitnowQrUrl}
											alt="DuitNow QR Code"
											class="h-28 w-28 rounded border border-slate-200 bg-white object-contain p-1"
										/>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<div class="flex justify-end pt-2">
						<Button type="submit" disabled={updating}>
							{updating ? 'Saving Settings...' : 'Save System Settings'}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- Section 2: Service Packages Manager -->
		<Card.Root>
			<Card.Header>
				<Card.Title>My Packages</Card.Title>
				<Card.Description>Manage the active packages available for bookings.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="divide-y divide-slate-100">
					{#each packages as pkg}
						<div class="flex items-center justify-between py-3">
							<div class="flex items-center space-x-2">
								<span class="text-lg">{pkg.emoji}</span>
								<span class="font-medium text-slate-700">{pkg.name}</span>
							</div>
							<span class="font-semibold text-slate-950">RM {pkg.price}</span>
						</div>
					{:else}
						<p class="text-sm text-slate-400 py-4 text-center">
							No service packages registered yet.
						</p>
					{/each}
				</div>

				<div class="border-t border-slate-100 pt-4">
					<h4 class="mb-3 text-sm font-bold text-slate-800">Add Custom Service Package</h4>
					<form onsubmit={handleAddPackage} class="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
						<div class="space-y-1.5">
							<label for="emoji" class="text-xs font-semibold text-slate-500">Icon Emoji</label>
							<Input id="emoji" name="emoji" bind:value={pkgEmoji} required />
						</div>
						<div class="space-y-1.5 md:col-span-2">
							<label for="name" class="text-xs font-semibold text-slate-500">Package Title</label>
							<Input
								id="name"
								name="name"
								placeholder="E.g., Nikah Glam"
								bind:value={pkgName}
								required
							/>
						</div>
						<div class="space-y-1.5">
							<label for="price" class="text-xs font-semibold text-slate-500">Base Price (RM)</label
							>
							<Input
								id="price"
								name="price"
								type="number"
								step="0.01"
								placeholder="800.00"
								bind:value={pkgPrice}
								required
							/>
						</div>
						<div class="flex justify-end md:col-span-4">
							<Button type="submit" variant="outline" disabled={addingPkg}>
								{addingPkg ? 'Adding...' : 'Save New Package'}
							</Button>
						</div>
					</form>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
