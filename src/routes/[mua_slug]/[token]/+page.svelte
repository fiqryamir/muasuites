<script lang="ts">
	import { onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from "$lib/components/ui/select";

	let { data, form } = $props();

	// Wizard State Machine
	let currentStep = $state(1);
	let checkoutState = $state<'A' | 'B' | 'C'>('A');

	// Input bindings
	let selectedDate = $state('');
	let selectedPackage = $state<any>(null);
	// let eventTime = $state('08:00');
	let venueAddress = $state('');
	let clientName = $state('');
	let clientPhone = $state('');

	let selectedHour = $state('08');
	let selectedMinute = $state('00');
	let selectedPeriod = $state('AM');

	const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
	
	// Map minutes to a standard 5-minute interval matrix for MUAs
	const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

	// Reactively derive 24-hour format string (e.g., "14:30") for SQL ingestion
	let eventTime = $derived.by(() => {
		let hh = parseInt(selectedHour, 10);
		if (selectedPeriod === 'PM' && hh !== 12) hh += 12;
		if (selectedPeriod === 'AM' && hh === 12) hh = 0;
		const hhStr = hh.toString().padStart(2, '0');
		return `${hhStr}:${selectedMinute}`;
	});

	// --- SHADCN-STYLE CALENDAR LOGIC (Svelte 5 Runes) ---
	const months = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

	// Parse MUA's invite date to focus the calendar month on load
	const inviteParts = data.invite?.event_date ? data.invite.event_date.split('-') : [];
	let currentYear = $state(inviteParts[0] ? parseInt(inviteParts[0], 10) : new Date().getFullYear());
	let currentMonth = $state(inviteParts[1] ? parseInt(inviteParts[1], 10) - 1 : new Date().getMonth());

	const todayStr = new Date().toISOString().split('T')[0];

	// Derive calendar date matrices reactively
	let daysInMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate());
	let firstDayIndex = $derived(new Date(currentYear, currentMonth, 1).getDay());
	
	let calendarDays = $derived.by(() => {
		const daysStaged = [];
		// Padding offset days for the first week of the month
		for (let i = 0; i < firstDayIndex; i++) {
			daysStaged.push(null);
		}
		// Populate actual calendar dates
		for (let day = 1; day <= daysInMonth; day++) {
			daysStaged.push(day);
		}
		return daysStaged;
	});

	function handleMonthChange(direction: 'PREV' | 'NEXT') {
		if (direction === 'PREV') {
			if (currentMonth === 0) {
				currentMonth = 11;
				currentYear -= 1;
			} else {
				currentMonth -= 1;
			}
		} else {
			if (currentMonth === 11) {
				currentMonth = 0;
				currentYear += 1;
			} else {
				currentMonth += 1;
			}
		}
	}

	function selectDay(day: number) {
		const monthPadded = (currentMonth + 1).toString().padStart(2, '0');
		const dayPadded = day.toString().padStart(2, '0');
		const dateStr = `${currentYear}-${monthPadded}-${dayPadded}`;

		// Verify disabled date blocks
		if (data.disabledDates?.includes(dateStr) || dateStr < todayStr) {
			toast.error('This date is fully booked or unavailable.');
			return;
		}

		selectedDate = dateStr;
		toast.success(`Date selected: ${selectedDate}`);
	}

	// Helper checking logic for calendar cells
	function isDateSelected(day: number): boolean {
		if (!selectedDate) return false;
		const monthPadded = (currentMonth + 1).toString().padStart(2, '0');
		const dayPadded = day.toString().padStart(2, '0');
		return selectedDate === `${currentYear}-${monthPadded}-${dayPadded}`;
	}

	function isDateDisabled(day: number): boolean {
		const monthPadded = (currentMonth + 1).toString().padStart(2, '0');
		const dayPadded = day.toString().padStart(2, '0');
		const dateStr = `${currentYear}-${monthPadded}-${dayPadded}`;
		return dateStr < todayStr;
	}

	function isDateOccupied(day: number): boolean {
		const monthPadded = (currentMonth + 1).toString().padStart(2, '0');
		const dayPadded = day.toString().padStart(2, '0');
		const dateStr = `${currentYear}-${monthPadded}-${dayPadded}`;
		return data.disabledDates?.includes(dateStr) || false;
	}
	// --- END CALENDAR LOGIC ---

	// Lock timer
	let secondsRemaining = $state(600);
	let timerIntervalId: any = null;

	let timerString = $derived(
		`${Math.floor(secondsRemaining / 60)}:${(secondsRemaining % 60).toString().padStart(2, '0')}`
	);

	let securing = $state(false);
	let submitting = $state(false);
	let bookingId = $state('');

	// Pricing derivations
	let basePrice = $derived(selectedPackage ? parseFloat(selectedPackage.price) : 0);
	let transportFee = $derived(parseFloat(data.invite?.transport_fee_override || '0'));
	let surchargeFee = $derived(parseFloat(data.invite?.custom_surcharge || '0'));
	let totalAmount = $derived(basePrice + transportFee + surchargeFee);

	let depositAmount = $derived.by(() => {
		const mode = data.invite?.deposit_mode_override || data.defaultConfig?.deposit_mode || 'FIXED';
		const val = parseFloat(
			data.invite?.deposit_value_override != null
				? data.invite?.deposit_value_override
				: data.defaultConfig?.deposit_value || '0'
		);
		return mode === 'FIXED' ? val : (val / 100) * totalAmount;
	});

	let balanceAmount = $derived(totalAmount - depositAmount);

	$effect(() => {
		if (form?.success && form?.bookingId) {
			bookingId = form.bookingId;
			checkoutState = 'B';
			toast.success('Your slot has been secured. Please complete the deposit transfer.');
			startTimer();
		}

		if (form?.error) {
			toast.error(form.error);
		}

		if (form?.validationErrors) {
			toast.warning('Please review and correct the marked form fields.');
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
					toast.error('Your reservation time lock has expired.');
					setTimeout(() => window.location.reload(), 1500);
				}
			}
		}, 1000);
	}

	onDestroy(() => {
		if (timerIntervalId) clearInterval(timerIntervalId);
	});
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8">
	<!-- Status Gates -->
	{#if data.gateState === 'USED' || data.gateState === 'EXPIRED'}
		<Card.Root class="w-full max-w-md text-center shadow">
			<Card.Content class="space-y-4 py-12">
				<span class="text-4xl">⏳</span>
				<Card.Title class="text-xl font-bold">Invitation Expired</Card.Title>
				<Card.Description>Please request a new booking link from the MUA.</Card.Description>
			</Card.Content>
		</Card.Root>
	{:else if data.gateState === 'CAPACITY_PAUSED'}
		<Card.Root class="w-full max-w-md border-amber-200 text-center shadow">
			<Card.Content class="space-y-4 py-12">
				<span class="text-4xl">🔒</span>
				<Card.Title class="text-xl font-bold text-amber-950">Bookings Paused</Card.Title>
				<Card.Description>Studio bookings are temporarily paused. Message us on WhatsApp.</Card.Description>
			</Card.Content>
		</Card.Root>
	{:else if data.gateState === 'ACTIVE'}
		<!-- STATE A: STEP-BY-STEP CHECKOUT WIZARD -->
		{#if checkoutState === 'A'}
			<Card.Root class="w-full max-w-md shadow-lg">
				<Card.Header class="border-b border-slate-100 pb-2 text-center">
					<Card.Description class="text-xs font-semibold text-slate-500 uppercase"
						>Invitation from {data.studioName}</Card.Description
					>
					<Card.Title class="text-lg font-bold text-slate-950"
						>Secure Slot — Step {currentStep} of 5</Card.Title
					>
				</Card.Header>

				<Card.Content class="space-y-5 pt-6">
					<!-- STEP 1: Select Event Date via custom shadcn-style calendar -->
					{#if currentStep === 1}
						<div class="space-y-3">
							<h3 class="text-sm font-bold text-slate-800 text-center">Select your event date:</h3>
							
							<!-- Calendar Container -->
							<div class="mx-auto max-w-[320px] rounded-md border border-slate-200 bg-white p-3 shadow-sm">
								<!-- Calendar Header -->
								<div class="flex items-center justify-between pb-3">
									<button
										type="button"
										onclick={() => handleMonthChange('PREV')}
										class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50 transition"
									>
										&larr;
									</button>
									<span class="text-sm font-semibold text-slate-900">
										{months[currentMonth]} {currentYear}
									</span>
									<button
										type="button"
										onclick={() => handleMonthChange('NEXT')}
										class="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50 transition"
									>
										&rarr;
									</button>
								</div>

								<!-- Days Grid Header -->
								<div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 pb-1">
									{#each daysOfWeek as day}
										<div class="h-8 w-8 flex items-center justify-center">{day}</div>
									{/each}
								</div>

								<!-- Calendar Days Grid -->
								<div class="grid grid-cols-7 gap-1">
									{#each calendarDays as day}
										{#if day === null}
											<div class="h-8 w-8"></div>
										{:else}
											<!-- Day Cell -->
											<button
												type="button"
												onclick={() => selectDay(day)}
												disabled={isDateDisabled(day)}
												class="relative flex h-8 w-8 flex-col items-center justify-center rounded-md text-xs font-semibold transition
												{isDateSelected(day) ? 'bg-slate-900 text-white hover:bg-slate-900' : ''}
												{isDateDisabled(day) ? 'text-slate-200 cursor-not-allowed opacity-40' : 'text-slate-700 hover:bg-slate-100'}
												{!isDateSelected(day) && isDateOccupied(day) ? 'text-slate-400 bg-slate-50 opacity-65 hover:bg-slate-50' : ''}"
											>
												<span>{day}</span>

												<!-- Active Booking Indicator Dot -->
												{#if isDateOccupied(day)}
													<span class="absolute bottom-1 h-1 w-1 rounded-full {isDateSelected(day) ? 'bg-white' : 'bg-amber-500'}"></span>
												{/if}
											</button>
										{/if}
									{/each}
								</div>
							</div>
							
							{#if selectedDate}
								<p class="text-center text-xs font-bold text-slate-900">
									Target Event Date: {selectedDate}
								</p>
							{/if}
						</div>

						<div class="flex justify-end pt-2">
							<Button disabled={!selectedDate} onclick={() => (currentStep = 2)}>
								Continue &rarr;
							</Button>
						</div>

					<!-- STEP 2: Select Package -->
					{:else if currentStep === 2}
						<div class="space-y-3">
							<h3 class="text-sm font-bold text-slate-800">Select Makeup Package:</h3>
							<div class="space-y-2">
								{#each data.packages as pkg}
									<button
										type="button"
										onclick={() => (selectedPackage = pkg)}
										class="flex w-full items-center justify-between rounded-md border p-4 text-left transition {selectedPackage?.id ===
										pkg.id
											? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
											: 'border-slate-200 bg-white hover:bg-slate-50'}"
									>
										<div class="flex items-center space-x-3">
											<span class="text-xl">{pkg.emoji}</span>
											<span class="text-sm font-semibold text-slate-900">{pkg.name}</span>
										</div>
										<span class="text-sm font-bold text-slate-950">RM {pkg.price}</span>
									</button>
								{/each}
							</div>
						</div>

						<div class="flex justify-between pt-2">
							<Button variant="outline" onclick={() => (currentStep = 1)}>&larr; Back</Button>
							<Button disabled={!selectedPackage} onclick={() => (currentStep = 3)}>
								Continue &rarr;
							</Button>
						</div>

					<!-- STEP 3: Event Details -->
					{:else if currentStep === 3}
						<div class="space-y-4">
							<h3 class="text-sm font-bold text-slate-800">Event Time & Venue Address:</h3>
							
							<!-- Custom Segmented Time Picker -->
							<div class="space-y-1.5">
								<span class="text-xs font-semibold text-slate-500 uppercase">Ready Time</span>
								<div class="flex items-center gap-2">
									
									<!-- Hour Select -->
									<div class="flex-grow">
										<Select.Root type="single" bind:value={selectedHour}>
											<Select.Trigger class="w-full bg-white border-slate-200 text-slate-700">
												{selectedHour}
											</Select.Trigger>
											<Select.Content class="max-h-[200px] bg-white overflow-y-auto">
												{#each hoursList as hour}
													<Select.Item value={hour} label={hour}>{hour}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>

									<span class="text-slate-400 font-bold">:</span>

									<!-- Minute Select -->
									<div class="flex-grow">
										<Select.Root type="single" bind:value={selectedMinute}>
											<Select.Trigger class="w-full bg-white border-slate-200 text-slate-700">
												{selectedMinute}
											</Select.Trigger>
											<Select.Content class="max-h-[200px] overflow-y-auto">
												{#each minutesList as min}
													<Select.Item value={min} label={min}>{min}</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>

									<!-- Period (AM/PM) Select -->
									<div class="flex-grow">
										<Select.Root type="single" bind:value={selectedPeriod}>
											<Select.Trigger class="w-full bg-white border-slate-200 text-slate-700">
												{selectedPeriod}
											</Select.Trigger>
											<Select.Content>
												<Select.Item value="AM" label="AM">AM</Select.Item>
												<Select.Item value="PM" label="PM">PM</Select.Item>
											</Select.Content>
										</Select.Root>
									</div>

								</div>
								<p class="text-[10px] text-slate-400">
									Selected ready time: <span class="font-bold text-slate-700">{selectedHour}:{selectedMinute} {selectedPeriod}</span>
								</p>
							</div>

							<div class="space-y-1.5">
								<label for="address" class="text-xs font-semibold text-slate-500 uppercase">Venue Address</label>
								<Input
									id="address"
									placeholder="E.g., Grand Ballroom / Home address"
									bind:value={venueAddress}
									required
								/>
							</div>
						</div>

						<div class="flex justify-between pt-2">
							<Button variant="outline" onclick={() => (currentStep = 2)}>&larr; Back</Button>
							<Button disabled={!venueAddress} onclick={() => (currentStep = 4)}>
								Continue Contact &rarr;
							</Button>
						</div>

					<!-- STEP 4: Contact Details -->
					{:else if currentStep === 4}
						<div class="space-y-4">
							<h3 class="text-sm font-bold text-slate-800">Your Contact Details:</h3>
							<div class="space-y-1.5">
								<label for="name" class="text-xs font-semibold text-slate-500 uppercase">Bride's Name</label>
								<Input id="name" placeholder="Bride's full name" bind:value={clientName} required />
							</div>
							<div class="space-y-1.5">
								<label for="phone" class="text-xs font-semibold text-slate-500 uppercase">WhatsApp Number</label>
								<div class="flex items-center">
									<!-- Visual dial prefix block -->
									<span class="inline-flex h-10 items-center rounded-l-md border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 font-bold select-none">
										+60
									</span>
									<Input 
										id="phone" 
										placeholder="123456789" 
										bind:value={clientPhone} 
										class="rounded-l-none" 
										required 
									/>
								</div>
								<p class="text-[9px] text-slate-400">Enter digits without leading "0" or spaces (e.g., 123456789).</p>
							</div>
						</div>

						<div class="flex justify-between pt-2">
							<Button variant="outline" onclick={() => (currentStep = 3)}>&larr; Back</Button>
							<Button disabled={!clientName || !clientPhone} onclick={() => (currentStep = 5)}>
								Review Summary &rarr;
							</Button>
						</div>

					<!-- STEP 5: Review Summary & Secure Lock -->
					{:else if currentStep === 5}
						<div class="space-y-4">
							<h3 class="text-center font-mono text-sm font-bold text-slate-800">
								Selected Date: {selectedDate}
							</h3>
							<div class="space-y-2 divide-y divide-slate-100 text-sm">
								<div class="flex justify-between pt-2 text-slate-600">
									<span>{selectedPackage?.emoji} {selectedPackage?.name}</span>
									<span class="font-medium">RM {basePrice}</span>
								</div>
								{#if transportFee > 0}
									<div class="flex justify-between pt-2 text-slate-600">
										<span>🚗 Transport Fee Surcharge</span>
										<span class="font-medium">RM {transportFee}</span>
									</div>
								{/if}
								{#if surchargeFee > 0}
									<div class="flex justify-between pt-2 text-slate-600">
										<span>✨ Extra Surcharge ({data.invite?.surcharge_remark || 'Fee'})</span>
										<span class="font-medium">RM {surchargeFee}</span>
									</div>
								{/if}
								<div class="flex justify-between pt-2 text-base font-bold text-slate-900">
									<span>Total Amount</span>
									<span>RM {totalAmount}</span>
								</div>
							</div>

							<div class="space-y-1 rounded-md border border-indigo-200 bg-indigo-50/50 p-4 text-xs text-indigo-950">
								<div class="flex justify-between text-sm font-bold text-indigo-900">
									<span>Required Deposit:</span>
									<span>RM {depositAmount}</span>
								</div>
								<p>
									The remaining balance of <strong>RM {balanceAmount}</strong> is payable after the event.
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
										>&larr; Back</Button
									>
									<Button
										type="submit"
										disabled={securing}
										class="flex-grow bg-slate-900 font-bold text-white hover:bg-slate-800"
									>
										{securing ? 'Locking Date Slot...' : 'Secure My Slot Now'}
									</Button>
								</div>
							</form>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

		<!-- STATE B: Payment Gate & Screenshot attachment -->
		{:else if checkoutState === 'B'}
			<Card.Root class="w-full max-w-md border-emerald-100 shadow-lg">
				<Card.Header class="pb-2 text-center">
					<div class="mx-auto w-fit animate-pulse rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
						Slot Locked for {timerString}
					</div>
					<Card.Title class="pt-2 text-xl font-bold text-slate-950">Transfer Deposit</Card.Title>
					<Card.Description>
						Please transfer a payment of <strong>RM {depositAmount}</strong> to confirm your booking.
					</Card.Description>
				</Card.Header>

				<Card.Content class="space-y-5">
					<div class="rounded border border-emerald-200 bg-emerald-50/10 p-4 text-sm text-slate-800">
						<h4 class="mb-2 text-xs font-bold text-emerald-800 uppercase">Studio Details</h4>
						<p>
							Name: <span class="font-bold text-slate-950">{form?.bankConfig?.studio_name}</span>
						</p>
						{#if form?.bankConfig?.duitnow_qr_url}
							<div class="mt-2 flex justify-center rounded border border-slate-100 bg-white py-4">
								<img
									src={form.bankConfig.duitnow_qr_url}
									alt="DuitNow QR"
									class="h-44 w-44 object-contain"
								/>
							</div>
						{:else}
							<p class="pt-2 text-xs text-slate-500">
								Message the MUA directly on WhatsApp for manual bank account details.
							</p>
						{/if}
					</div>

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
									toast.success('Receipt successfully uploaded!');
								} else {
									toast.error('Failed to submit receipt. Please try again.');
								}
							};
						}}
						class="space-y-4"
					>
						<input type="hidden" name="booking_id" value={bookingId} />
						<input type="hidden" name="invite_id" value={data.invite?.id} />

						<div class="space-y-1.5">
							<label for="receipt" class="text-xs font-semibold text-slate-500 uppercase">Attach Receipt Screenshot</label>
							<Input
								id="receipt"
								name="receipt"
								type="file"
								accept="image/png, image/jpeg, image/webp"
								required
							/>
						</div>

						<Button
							type="submit"
							disabled={submitting}
							class="w-full bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700"
						>
							{submitting ? 'Uploading Screenshot...' : 'Confirm Deposit Receipt'}
						</Button>
					</form>
				</Card.Content>
			</Card.Root>

		<!-- STATE C: Success Screen -->
		{:else if checkoutState === 'C'}
			<Card.Root class="w-full max-w-md border-emerald-200 bg-emerald-50/10 text-center shadow-lg">
				<Card.Content class="space-y-4 py-12">
					<span class="text-5xl">🎉</span>
					<Card.Title class="text-2xl font-bold text-emerald-950">Deposit Submitted!</Card.Title>
					<Card.Description>
						We have securely received your deposit receipt screenshot. The booking is now under
						verification review. You will receive a confirmation message from {data.studioName} shortly.
					</Card.Description>
					<a
						href={`https://wa.me/${form?.bankConfig?.whatsapp_number || ''}?text=Hi! I have submitted my custom booking deposit receipt of RM ${depositAmount} for my event on ${encodeURIComponent(selectedDate)}.`}
						target="_blank"
						class="inline-flex items-center justify-center rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700"
					>
						Notify MUA on WhatsApp
					</a>
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</div>