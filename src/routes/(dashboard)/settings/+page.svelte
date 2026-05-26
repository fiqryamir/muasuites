<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { z } from 'zod';
	import { toast } from 'svelte-sonner'; // Import Sonner
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText,
		} from "$lib/components/ui/input-group"

	// SvelteKit request-scoped reactive references
	let supabase = $derived(page.data.supabase);
	let session = $derived(page.data.session);

	// UI State Variables
	let loading = $state(true);
	let updating = $state(false);
	let addingPkg = $state(false);

	let userId = $state('');
	let profile = $state<any>(null);
	let config = $state<any>(null);
	let packages = $state<any[]>([]);

	// Config Input bindings
	let slug = $state('');
	let studioName = $state('');
	let whatsappNumber = $state('');
	let telegramChatId = $state('');
	let depositMode = $state<'FIXED' | 'PERCENT'>('FIXED');
	let depositValue = $state(0);
	let duitnowQrUrl = $state('');

	// Zod Verification schemas
	const configSchema = z.object({
		slug: z.string()
			.min(3, 'Slug handle must be at least 3 characters.')
			.max(20, 'Slug handle must be 20 characters or less.')
			.regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, or underscores.'),
		studioName: z.string().min(2, 'Studio name must be at least 2 characters.'),
		whatsappNumber: z.string().regex(/^(601)[0-9]{8,10}$/, 'WhatsApp must be a valid Malaysian format (e.g., 60123456789).'),
		depositValue: z.number().nonnegative('Default deposit value cannot be negative.'),
		telegramChatId: z.string().optional()
	});

	const packageSchema = z.object({
		pkgEmoji: z.string().emoji('Please enter a single valid emoji icon.'),
		pkgName: z.string().min(3, 'Package title must be at least 3 characters.'),
		pkgPrice: z.number().positive('Package price must be greater than RM 0.')
	});

	// File Upload State
	let qrFile = $state<File | null>(null);

	// Package form bindings
	let pkgEmoji = $state('💄');
	let pkgName = $state('');
	let pkgPrice = $state(0);

	let testingTelegram = $state(false);

	onMount(async () => {
		if (!session) return;
		userId = session.user.id;
		await loadSettings();
	});

	async function loadSettings() {
		loading = true;

		// 1. Fetch profile slug and details
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

			const rawPhone = conf.whatsapp_number || '';
			if (rawPhone.startsWith('60')) {
				whatsappNumber = rawPhone.substring(2);
			} else {
				whatsappNumber = rawPhone;
			}
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

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			qrFile = target.files[0];
		}
	}

	async function handleUpdateConfig(e: Event) {
		e.preventDefault();
		updating = true;

		const fullWhatsappNumber = `60${whatsappNumber}`;

		// Client-side Zod validation
		const validation = configSchema.safeParse({
			slug,
			studioName,
			whatsappNumber: fullWhatsappNumber,
			depositValue,
			telegramChatId
		});

		if (!validation.success) {
			updating = false;
			toast.warning(validation.error.issues[0].message);
			return;
		}

		let finalQrUrl = duitnowQrUrl;

		// Upload QR image if a file has been selected
		if (qrFile) {
			const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
			if (!allowedMimeTypes.includes(qrFile.type)) {
				updating = false;
				toast.error('Invalid image type. Please select a PNG, JPG, or WebP file.');
				return;
			}

			const mimeToExt: Record<string, string> = {
				'image/jpeg': 'jpg',
				'image/png': 'png',
				'image/webp': 'webp'
			};
			const fileExt = mimeToExt[qrFile.type] || 'jpg';
			const filePath = `${userId}/duitnow_qr.${fileExt}`;

			const { error: uploadError } = await supabase.storage
				.from('qr-codes')
				.upload(filePath, qrFile, { 
					upsert: true,
					contentType: qrFile.type 
				});

			if (uploadError) {
				updating = false;
				toast.error('Error uploading QR code file: ' + uploadError.message);
				return;
			}

			const { data: { publicUrl } } = supabase.storage.from('qr-codes').getPublicUrl(filePath);
			finalQrUrl = publicUrl;
		}

		// Update public.muas (slug custom booking handle)
		const { error: profileError } = await supabase
			.from('muas')
			.update({ slug })
			.eq('id', userId);

		if (profileError) {
			updating = false;
			if (profileError.code === '23505') {
				toast.error('This custom link handle is already taken by another MUA.');
			} else {
				toast.error(profileError.message);
			}
			return;
		}

		// Update public.mua_configs variables
		const { error: configError } = await supabase
			.from('mua_configs')
			.update({
				studio_name: studioName,
				whatsapp_number: fullWhatsappNumber,
				telegram_chat_id: telegramChatId,
				deposit_mode: depositMode,
				deposit_value: depositValue,
				duitnow_qr_url: finalQrUrl
			})
			.eq('mua_id', userId);

		updating = false;

		if (configError) {
			toast.error(configError.message);
		} else {
			toast.success('System settings successfully updated!');
			qrFile = null; 
			await loadSettings();
		}
	}

	async function handleAddPackage(e: Event) {
		e.preventDefault();
		addingPkg = true;

		// Client-side Zod validation
		const validation = packageSchema.safeParse({
			pkgEmoji,
			pkgName,
			pkgPrice
		});

		if (!validation.success) {
			addingPkg = false;
			toast.warning(validation.error.issues[0].message);
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
			toast.error(error.message);
		} else {
			pkgName = '';
			pkgPrice = 0;
			pkgEmoji = '💄';
			toast.success('Service package added successfully!');
			await loadSettings();
		}
	}

	async function testTelegramConnection() {
		if (!telegramChatId) {
			toast.warning('Please enter a Telegram Chat ID first.');
			return;
		}

		testingTelegram = true;

		try {
			const response = await fetch('/api/test-telegram', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ chatId: telegramChatId })
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Test notification sent! Check your Telegram app.');
			} else {
				toast.error(result.error || 'Failed to send Telegram connection test.');
			}
		} catch (err: any) {
			toast.error(err.message);
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
		<!-- Section 1: Business Identity & Profile Config -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Studio Identity & Configurations</Card.Title>
				<Card.Description>Configure your personal booking handle and contact info.</Card.Description>
			</Card.Header>
			<Card.Content>
				<form onsubmit={handleUpdateConfig} class="space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-1.5">
							<label for="slug" class="text-xs font-semibold text-slate-500 uppercase"
								>Custom Booking Handle</label
							>
							<InputGroup>
								<InputGroupAddon>
								  <InputGroupText>/</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput id="slug" name="slug" bind:value={slug} required class="rounded-l-none" />
							  </InputGroup>
							<p class="text-[10px] text-slate-400">muasuite.com/{slug}</p>
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
							<InputGroup>
								<InputGroupAddon>
								  <InputGroupText>+60</InputGroupText>
								</InputGroupAddon>
								<InputGroupInput id="whatsapp_number"
								name="whatsapp_number"
								placeholder="123456789"
								bind:value={whatsappNumber}
								class="rounded-l-none"
								required />
							  </InputGroup>
							<p class="text-[9px] text-slate-400 mt-1">Enter digits without leading "0" or spaces (e.g., 123456789).</p>
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

							<p class="text-[9px] text-slate-400 mt-1">
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

						<!-- QR Upload Area -->
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
							<label for="price" class="text-xs font-semibold text-slate-500">Base Price (RM)</label>
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