<script lang="ts">
	import { onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText
	} from '$lib/components/ui/input-group';
	import { Field, FieldGroup, FieldLabel } from '$lib/components/ui/field';
	import { z } from 'zod';

	let { data, form } = $props();

	// State machine
	let currentStep = $state(1);
	let checkoutState = $state<'A' | 'B' | 'C'>('A');

	// Form bindings
	let selectedDate = $state('');
	let selectedPackage = $state<any>(null);
	let venueAddress = $state('');
	let clientName = $state('');
	let clientPhone = $state('');

	// Step errors
	let stepErrors = $state<Record<string, string>>({});

	// Time picker
	let selectedHour = $state('08');
	let selectedMinute = $state('00');
	let selectedPeriod = $state('AM');

	const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
	const minutesList = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

	let eventTime = $derived.by(() => {
		let hh = parseInt(selectedHour, 10);
		if (selectedPeriod === 'PM' && hh !== 12) hh += 12;
		if (selectedPeriod === 'AM' && hh === 12) hh = 0;
		return `${hh.toString().padStart(2, '0')}:${selectedMinute}`;
	});

	let eventTimeDisplay = $derived(`${selectedHour}:${selectedMinute} ${selectedPeriod}`);

	// Calendar
	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

	const inviteParts = data.invite?.event_date ? data.invite.event_date.split('-') : [];
	let currentYear = $state(
		inviteParts[0] ? parseInt(inviteParts[0], 10) : new Date().getFullYear()
	);
	let currentMonth = $state(
		inviteParts[1] ? parseInt(inviteParts[1], 10) - 1 : new Date().getMonth()
	);

	const todayStr = new Date().toISOString().split('T')[0];

	let daysInMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate());
	let firstDayIndex = $derived(new Date(currentYear, currentMonth, 1).getDay());

	let calendarDays = $derived.by(() => {
		const days: (number | null)[] = [];
		for (let i = 0; i < firstDayIndex; i++) days.push(null);
		for (let d = 1; d <= daysInMonth; d++) days.push(d);
		return days;
	});

	function navigateMonth(dir: -1 | 1) {
		const next = currentMonth + dir;
		if (next < 0) {
			currentMonth = 11;
			currentYear -= 1;
		} else if (next > 11) {
			currentMonth = 0;
			currentYear += 1;
		} else {
			currentMonth = next;
		}
	}

	function dateKey(day: number) {
		return `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
	}

	function selectDay(day: number) {
		const key = dateKey(day);
		if (data.disabledDates?.includes(key) || key < todayStr) {
			toast.error('This date is unavailable.');
			return;
		}
		selectedDate = key;
		stepErrors = {};
	}

	function isSelected(day: number) {
		return selectedDate === dateKey(day);
	}
	function isPast(day: number) {
		return dateKey(day) < todayStr;
	}
	function isOccupied(day: number) {
		return data.disabledDates?.includes(dateKey(day)) || false;
	}

	function fmtDate(d: string) {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function fmtCurrency(a: number) {
		return `RM ${a.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
	}

	// --- Per-step validation schemas ---
	const step1Schema = z.object({
		selectedDate: z.string().min(1, 'Please select an event date.')
	});

	const step2Schema = z.object({
		selectedPackage: z
			.object({ id: z.number() })
			.nullable()
			.refine((v) => v !== null, {
				message: 'Please select a package.'
			})
	});

	const step3Schema = z.object({
		venueAddress: z.string().min(5, 'Please provide a more complete venue address.')
	});

	const step4Schema = z.object({
		clientName: z.string().min(2, 'Please enter your full name.'),
		clientPhone: z
			.string()
			.regex(/^(601)[0-9]{8,10}$/, 'Please enter a valid Malaysian number (e.g. 123456789).')
	});

	function validateStep(step: number): boolean {
		stepErrors = {};
		let result;

		if (step === 1) {
			result = step1Schema.safeParse({ selectedDate });
		} else if (step === 2) {
			result = step2Schema.safeParse({ selectedPackage });
		} else if (step === 3) {
			result = step3Schema.safeParse({ venueAddress });
		} else if (step === 4) {
			result = step4Schema.safeParse({ clientName, clientPhone: `60${clientPhone}` });
		}

		if (result && !result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const key = issue.path[0]?.toString() || 'form';
				errors[key] = issue.message;
			}
			stepErrors = errors;
			toast.error(result.error.issues[0].message);
			return false;
		}

		return true;
	}

	function goNext(next: number) {
		if (validateStep(currentStep)) {
			currentStep = next;
			stepErrors = {};
		}
	}

	// Timer
	let secondsRemaining = $state(600);
	let timerIntervalId: any = null;

	let timerString = $derived(
		`${Math.floor(secondsRemaining / 60)}:${(secondsRemaining % 60).toString().padStart(2, '0')}`
	);
	let timerPercent = $derived((secondsRemaining / 600) * 100);

	let securing = $state(false);
	let submitting = $state(false);
	let bookingId = $state('');

	// Pricing
	let basePrice = $derived(selectedPackage ? parseFloat(selectedPackage.price) : 0);
	let transportFee = $derived(parseFloat(data.invite?.transport_fee_override || '0'));
	let surchargeFee = $derived(parseFloat(data.invite?.custom_surcharge || '0'));
	let totalAmount = $derived(basePrice + transportFee + surchargeFee);

	let depositAmount = $derived.by(() => {
		const mode = data.invite?.deposit_mode_override || data.defaultConfig?.deposit_mode || 'FIXED';
		const val = parseFloat(
			data.invite?.deposit_value_override != null
				? String(data.invite.deposit_value_override)
				: data.defaultConfig?.deposit_value || '0'
		);
		return mode === 'FIXED' ? val : (val / 100) * totalAmount;
	});

	let balanceAmount = $derived(totalAmount - depositAmount);

	$effect(() => {
		if (form?.success && form?.bookingId) {
			bookingId = form.bookingId;
			checkoutState = 'B';
			toast.success('Slot secured — please complete your deposit.');
			startTimer();
		}
		if (form?.error) toast.error(form.error);
		if (form?.validationErrors) {
			const messages = Object.values(form.validationErrors).flat() as string[];
			if (messages.length > 0) toast.error(messages[0]);
		}
	});

	function startTimer() {
		if (timerIntervalId) clearInterval(timerIntervalId);
		timerIntervalId = setInterval(() => {
			if (secondsRemaining > 0 && checkoutState === 'B') {
				secondsRemaining -= 1;
			} else {
				clearInterval(timerIntervalId);
				if (checkoutState === 'B') {
					toast.error('Your slot reservation has expired.');
					setTimeout(() => window.location.reload(), 1500);
				}
			}
		}, 1000);
	}

	onDestroy(() => {
		if (timerIntervalId) clearInterval(timerIntervalId);
	});
</script>

<div class="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-8">
	<!-- Gate: Expired / Used -->
	{#if data.gateState === 'USED' || data.gateState === 'EXPIRED'}
		<div class="animate-in-up w-full max-w-sm space-y-6 text-center">
			<div class="bg-muted mx-auto flex h-14 w-14 items-center justify-center rounded-full">
				<svg
					class="text-muted-foreground h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<div class="space-y-1.5">
				<h1 class="text-lg font-semibold tracking-tight">Link Expired</h1>
				<p class="text-muted-foreground mx-auto max-w-xs text-sm">
					This booking link is no longer active. Please request a fresh link from your makeup
					artist.
				</p>
			</div>
		</div>

		<!-- Gate: Capacity Paused -->
	{:else if data.gateState === 'CAPACITY_PAUSED'}
		<div class="animate-in-up w-full max-w-sm space-y-6 text-center">
			<div class="bg-muted mx-auto flex h-14 w-14 items-center justify-center rounded-full">
				<svg
					class="text-muted-foreground h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
					/>
				</svg>
			</div>
			<div class="space-y-1.5">
				<h1 class="text-lg font-semibold tracking-tight">Bookings Temporarily Paused</h1>
				<p class="text-muted-foreground mx-auto max-w-xs text-sm">
					{data.studioName} is currently at full capacity. Please message them directly.
				</p>
			</div>
		</div>

		<!-- Active Flow -->
	{:else if data.gateState === 'ACTIVE'}
		{#if checkoutState === 'A'}
			<div class="animate-in-up w-full max-w-md">
				<!-- Studio name header -->
				<div class="mb-6 space-y-1 text-center">
					<p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">
						Booking with
					</p>
					<p class="text-base font-semibold tracking-tight">{data.studioName}</p>
				</div>

				<Card.Root>
					<!-- Step indicator -->
					<Card.Header class="pb-4 text-center">
						<div class="mb-3 flex items-center justify-center gap-1.5">
							{#each [1, 2, 3, 4, 5] as step}
								<div
									class="h-1.5 rounded-full transition-all duration-300 {step < currentStep
										? 'bg-primary w-4'
										: step === currentStep
											? 'bg-primary w-6'
											: 'bg-muted w-4'}"
								></div>
							{/each}
						</div>
						<Card.Title class="text-lg">
							{#if currentStep === 1}Choose Your Date{:else if currentStep === 2}Select a Package{:else if currentStep === 3}Event
								Details{:else if currentStep === 4}Your Details{:else}Review & Confirm{/if}
						</Card.Title>
						<Card.Description class="text-xs">Step {currentStep} of 5</Card.Description>
					</Card.Header>

					<Separator />

					<Card.Content class="pt-6">
						<!-- STEP 1: Date -->
						{#if currentStep === 1}
							<div class="space-y-4">
								<div class="border-border bg-card rounded-lg border">
									<div class="flex items-center justify-between px-4 py-3">
										<button
											type="button"
											onclick={() => navigateMonth(-1)}
											class="hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md transition-colors"
										>
											<svg
												class="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M15.75 19.5L8.25 12l7.5-7.5"
												/>
											</svg>
										</button>
										<p class="text-sm font-semibold">{months[currentMonth]} {currentYear}</p>
										<button
											type="button"
											onclick={() => navigateMonth(1)}
											class="hover:bg-muted flex h-8 w-8 items-center justify-center rounded-md transition-colors"
										>
											<svg
												class="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M8.25 4.5l7.5 7.5-7.5 7.5"
												/>
											</svg>
										</button>
									</div>
									<div class="px-3 pb-3">
										<div class="mb-1 grid grid-cols-7">
											{#each daysOfWeek as day}
												<div
													class="text-muted-foreground flex h-8 items-center justify-center text-[11px] font-medium"
												>
													{day}
												</div>
											{/each}
										</div>
										<div class="grid grid-cols-7">
											{#each calendarDays as day}
												{#if day === null}
													<div class="h-9"></div>
												{:else}
													<div class="flex items-center justify-center">
														<button
															type="button"
															onclick={() => selectDay(day)}
															disabled={isPast(day)}
															class="relative flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors
																{isSelected(day)
																? 'bg-primary text-primary-foreground font-semibold'
																: isPast(day)
																	? 'text-muted-foreground/30 cursor-not-allowed'
																	: isOccupied(day)
																		? 'text-muted-foreground bg-muted/50'
																		: 'hover:bg-muted font-medium'}"
														>
															{day}
															{#if isOccupied(day) && !isSelected(day)}
																<span class="bg-primary/60 absolute bottom-0.5 h-1 w-1 rounded-full"
																></span>
															{/if}
														</button>
													</div>
												{/if}
											{/each}
										</div>
									</div>
								</div>

								{#if selectedDate}
									<div class="flex items-center justify-center gap-2 py-1">
										<svg
											class="text-primary h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M4.5 12.75l6 6 9-13.5"
											/>
										</svg>
										<p class="text-sm font-medium">{fmtDate(selectedDate)}</p>
									</div>
								{/if}

								{#if stepErrors.selectedDate}
									<p class="text-destructive text-center text-xs">{stepErrors.selectedDate}</p>
								{/if}

								<div class="flex justify-end pt-2">
									<Button disabled={!selectedDate} onclick={() => goNext(2)}>Continue</Button>
								</div>
							</div>

							<!-- STEP 2: Package -->
						{:else if currentStep === 2}
							<div class="space-y-3">
								<p class="text-muted-foreground text-center text-sm">
									Choose the service for your event.
								</p>
								<div class="space-y-2">
									{#each data.packages as pkg}
										{@const selected = selectedPackage?.id === pkg.id}
										<button
											type="button"
											onclick={() => {
												selectedPackage = pkg;
												stepErrors = {};
											}}
											class="flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all
												{selected
												? 'border-primary bg-primary/5 ring-primary ring-1'
												: 'border-border hover:border-muted-foreground/30'}"
										>
											<div class="flex items-center gap-3">
												<span
													class="flex h-9 w-9 items-center justify-center rounded-md text-base {selected
														? 'bg-primary/10'
														: 'bg-muted'}"
												>
													{pkg.emoji}
												</span>
												<span class="text-sm font-medium">{pkg.name}</span>
											</div>
											<span class="text-sm font-semibold tabular-nums"
												>{fmtCurrency(parseFloat(pkg.price))}</span
											>
										</button>
									{/each}
								</div>

								{#if stepErrors.selectedPackage}
									<p class="text-destructive text-center text-xs">{stepErrors.selectedPackage}</p>
								{/if}
							</div>

							<div class="flex justify-between pt-6">
								<Button variant="outline" onclick={() => (currentStep = 1)}>Back</Button>
								<Button disabled={!selectedPackage} onclick={() => goNext(3)}>Continue</Button>
							</div>

							<!-- STEP 3: Time & Venue -->
						{:else if currentStep === 3}
							<div class="space-y-4">
								<Field class="gap-2">
									<FieldLabel>Ready Time</FieldLabel>
									<div class="flex items-center gap-2">
										<div class="flex-1">
											<Select.Root type="single" bind:value={selectedHour}>
												<Select.Trigger
													class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2"
												>
													{selectedHour}
												</Select.Trigger>
												<Select.Content class="max-h-[200px] overflow-y-auto">
													{#each hoursList as hour}
														<Select.Item value={hour}>{hour}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										</div>
										<span class="text-muted-foreground text-sm font-medium">:</span>
										<div class="flex-1">
											<Select.Root type="single" bind:value={selectedMinute}>
												<Select.Trigger
													class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2"
												>
													{selectedMinute}
												</Select.Trigger>
												<Select.Content class="max-h-[200px] overflow-y-auto">
													{#each minutesList as min}
														<Select.Item value={min}>{min}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										</div>
										<div class="flex-1">
											<Select.Root type="single" bind:value={selectedPeriod}>
												<Select.Trigger
													class="bg-muted focus:ring-ring w-full rounded-full border-none px-4 py-2 text-sm focus:ring-2"
												>
													{selectedPeriod}
												</Select.Trigger>
												<Select.Content>
													<Select.Item value="AM">AM</Select.Item>
													<Select.Item value="PM">PM</Select.Item>
												</Select.Content>
											</Select.Root>
										</div>
									</div>
									<p class="text-muted-foreground px-2 text-[11px]">
										Selected: <span class="text-foreground font-medium">{eventTimeDisplay}</span>
									</p>
								</Field>

								<Separator />

								<Field class="gap-2">
									<FieldLabel htmlFor="address">Venue Address</FieldLabel>
									<Input
										id="address"
										placeholder="e.g., Grand Hyatt KL, Shah Alam residence"
										bind:value={venueAddress}
										required
										class="bg-muted rounded-full border-none px-4"
									/>
									{#if stepErrors.venueAddress}
										<p class="text-destructive px-2 text-xs">{stepErrors.venueAddress}</p>
									{/if}
								</Field>
							</div>

							<div class="flex justify-between pt-6">
								<Button
									variant="outline"
									class="rounded-full px-6"
									onclick={() => (currentStep = 2)}>Back</Button
								>
								<Button class="rounded-full px-6" onclick={() => goNext(4)}>Continue</Button>
							</div>

							<!-- STEP 4: Contact -->
						{:else if currentStep === 4}
							<div class="space-y-4">
								<p class="text-muted-foreground text-center text-sm">
									Your details for confirmation and contact.
								</p>

								<Field class="gap-2">
									<FieldLabel htmlFor="name">Full Name</FieldLabel>
									<Input
										id="name"
										placeholder="Your full name"
										bind:value={clientName}
										required
										class="bg-muted rounded-full border-none px-4"
									/>
									{#if stepErrors.clientName}
										<p class="text-destructive px-2 text-xs">{stepErrors.clientName}</p>
									{/if}
								</Field>

								<Field class="gap-2">
									<FieldLabel htmlFor="phone">WhatsApp Number</FieldLabel>
									<InputGroup class="bg-muted overflow-hidden rounded-full border-none">
										<InputGroupAddon class="pl-4">
											<InputGroupText class="text-muted-foreground text-sm">+60</InputGroupText>
										</InputGroupAddon>
										<InputGroupInput
											id="phone"
											placeholder="123456789"
											bind:value={clientPhone}
											required
											class="border-none bg-transparent focus-visible:ring-0"
										/>
									</InputGroup>
									{#if stepErrors.clientPhone}
										<p class="text-destructive px-2 text-xs">{stepErrors.clientPhone}</p>
									{:else}
										<p class="text-muted-foreground px-2 text-xs">Without leading 0 or spaces.</p>
									{/if}
								</Field>
							</div>

							<div class="flex justify-between pt-6">
								<Button
									variant="outline"
									class="rounded-full px-6"
									onclick={() => (currentStep = 3)}>Back</Button
								>
								<Button class="rounded-full px-6" onclick={() => goNext(5)}>Review Booking</Button>
							</div>

							<!-- STEP 5: Review & Confirm -->
						{:else if currentStep === 5}
							<div class="space-y-5">
								<div class="divide-border space-y-0 divide-y">
									<div class="flex items-center justify-between py-3">
										<div class="space-y-0.5">
											<p class="text-muted-foreground text-xs">Service</p>
											<p class="text-sm font-medium">
												{selectedPackage?.emoji}
												{selectedPackage?.name}
											</p>
										</div>
										<p class="text-sm font-semibold tabular-nums">{fmtCurrency(basePrice)}</p>
									</div>
									<div class="flex items-center justify-between py-3">
										<div class="space-y-0.5">
											<p class="text-muted-foreground text-xs">Event Date</p>
											<p class="text-sm font-medium">{fmtDate(selectedDate)}</p>
										</div>
									</div>
									<div class="flex items-center justify-between py-3">
										<div class="space-y-0.5">
											<p class="text-muted-foreground text-xs">Ready Time</p>
											<p class="text-sm font-medium">{eventTimeDisplay}</p>
										</div>
									</div>
									<div class="flex items-center justify-between py-3">
										<div class="space-y-0.5">
											<p class="text-muted-foreground text-xs">Venue</p>
											<p class="max-w-[200px] truncate text-sm font-medium">{venueAddress}</p>
										</div>
									</div>
									<div class="flex items-center justify-between py-3">
										<div class="space-y-0.5">
											<p class="text-muted-foreground text-xs">Contact</p>
											<p class="text-sm font-medium">{clientName} &middot; +60{clientPhone}</p>
										</div>
									</div>
								</div>

								<div class="border-border bg-muted/30 space-y-2 rounded-lg border p-4">
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">{selectedPackage?.name}</span>
										<span class="tabular-nums">{fmtCurrency(basePrice)}</span>
									</div>
									{#if transportFee > 0}
										<div class="flex justify-between text-sm">
											<span class="text-muted-foreground">Transport fee</span>
											<span class="tabular-nums">{fmtCurrency(transportFee)}</span>
										</div>
									{/if}
									{#if surchargeFee > 0}
										<div class="flex justify-between text-sm">
											<span class="text-muted-foreground"
												>{data.invite?.surcharge_remark || 'Additional fee'}</span
											>
											<span class="tabular-nums">{fmtCurrency(surchargeFee)}</span>
										</div>
									{/if}
									<Separator />
									<div class="flex justify-between pt-1 text-sm font-semibold">
										<span>Total</span>
										<span class="tabular-nums">{fmtCurrency(totalAmount)}</span>
									</div>
								</div>

								<div class="border-primary/20 bg-primary/5 space-y-1.5 rounded-lg border p-4">
									<div class="flex justify-between">
										<p class="text-primary text-sm font-semibold">Deposit Required</p>
										<p class="text-primary text-sm font-bold tabular-nums">
											{fmtCurrency(depositAmount)}
										</p>
									</div>
									<p class="text-muted-foreground text-xs">
										Balance of {fmtCurrency(balanceAmount)} payable on event day.
									</p>
								</div>

								<form
									method="POST"
									action="?/secureSlot"
									use:enhance={() => {
										securing = true;
										return async ({ update }) => {
											securing = false;
											await update();
										};
									}}
								>
									<input type="hidden" name="mua_id" value={data.invite?.mua_id} />
									<input type="hidden" name="invite_id" value={data.invite?.id} />
									<input type="hidden" name="package_id" value={selectedPackage?.id} />
									<input type="hidden" name="event_date" value={selectedDate} />
									<input type="hidden" name="event_time" value={eventTime} />
									<input type="hidden" name="client_name" value={clientName} />
									<input type="hidden" name="client_phone" value={`60${clientPhone}`} />
									<input type="hidden" name="venue_address" value={venueAddress} />
									<input type="hidden" name="total_amount" value={totalAmount} />
									<input type="hidden" name="deposit_amount" value={depositAmount} />
									<input type="hidden" name="balance_amount" value={balanceAmount} />

									<div class="flex gap-2 pt-2">
										<Button type="button" variant="outline" onclick={() => (currentStep = 4)}
											>Back</Button
										>
										<Button type="submit" disabled={securing} class="flex-1">
											{securing ? 'Securing your slot...' : 'Secure My Slot'}
										</Button>
									</div>
								</form>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>

			<!-- STATE B: Payment -->
		{:else if checkoutState === 'B'}
			<div class="animate-in-up w-full max-w-md space-y-6">
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<p class="text-muted-foreground text-xs font-medium tracking-wider uppercase">
							Reservation expires in
						</p>
						<p class="text-primary text-sm font-semibold tabular-nums">{timerString}</p>
					</div>
					<div class="bg-muted h-1 w-full overflow-hidden rounded-full">
						<div
							class="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
							style="width: {timerPercent}%"
						></div>
					</div>
				</div>

				<Card.Root>
					<Card.Header>
						<Card.Title>Transfer Deposit</Card.Title>
						<Card.Description>
							Please transfer <span class="text-foreground font-semibold"
								>{fmtCurrency(depositAmount)}</span
							> to confirm.
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<div class="border-border bg-muted/30 rounded-lg border p-4">
							<p class="text-muted-foreground mb-1 text-xs">Bank</p>
							<p class="text-sm font-medium">{form?.bankConfig?.studio_name}</p>
							{#if form?.bankConfig?.duitnow_qr_url}
								<div class="border-border bg-card mt-4 flex justify-center rounded-lg border p-6">
									<img
										src={form.bankConfig.duitnow_qr_url}
										alt="DuitNow QR"
										class="h-48 w-48 object-contain"
									/>
								</div>
								<p class="text-muted-foreground mt-3 text-center text-xs">
									Scan with your banking app to pay.
								</p>
							{:else}
								<p class="text-muted-foreground mt-2 text-xs">
									Message the artist on WhatsApp for bank details.
								</p>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Content class="space-y-4">
						<form
							method="POST"
							action="?/submitReceipt"
							enctype="multipart/form-data"
							use:enhance={() => {
								submitting = true;
								return async ({ result }) => {
									submitting = false;
									if (result.type === 'success') {
										checkoutState = 'C';
										toast.success('Receipt uploaded.');
									} else {
										toast.error('Upload failed. Please try again.');
									}
								};
							}}
							class="space-y-4"
						>
							<input type="hidden" name="booking_id" value={bookingId} />
							<input type="hidden" name="invite_id" value={data.invite?.id} />
							<Field class="gap-2">
								<FieldLabel htmlFor="receipt">Payment Receipt</FieldLabel>
								<Input 
									id="receipt" 
									name="receipt" 
									type="file" 
									accept="image/png,image/jpeg,image/webp" 
									required 
									class=""
								/>
								<p class="px-2 text-xs text-muted-foreground">Upload a screenshot of your transfer confirmation.</p>
							</Field>
							<Button type="submit" disabled={submitting} class="w-full">
								{submitting ? 'Uploading...' : 'Submit Receipt'}
							</Button>
						</form>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- STATE C: Success -->
		{:else if checkoutState === 'C'}
			<div class="animate-in-up w-full max-w-sm space-y-6 text-center">
				<div class="bg-primary/10 mx-auto flex h-14 w-14 items-center justify-center rounded-full">
					<svg
						class="text-primary h-7 w-7"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
				</div>
				<div class="space-y-2">
					<h1 class="text-lg font-semibold tracking-tight">Receipt Submitted</h1>
					<p class="text-muted-foreground text-sm leading-relaxed">
						{data.studioName} will verify and confirm your booking shortly.
					</p>
				</div>
				<div class="border-border bg-muted/30 space-y-1 rounded-lg border p-4 text-left">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Deposit</span>
						<span class="font-semibold tabular-nums">{fmtCurrency(depositAmount)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">Event date</span>
						<span class="font-medium">{fmtDate(selectedDate)}</span>
					</div>
				</div>
				<a
					href={`https://wa.me/${form?.bankConfig?.whatsapp_number || ''}?text=${encodeURIComponent(`Hi! I've submitted my deposit of RM ${depositAmount} for my event on ${selectedDate}.`)}`}
					target="_blank"
					class="bg-foreground text-background hover:bg-foreground/90 inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium transition-colors"
				>
					Notify on WhatsApp
				</a>
			</div>
		{/if}
	{/if}
</div>
