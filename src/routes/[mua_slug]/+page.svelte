<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { toast } from 'svelte-sonner'; // Sonner notifications
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import { Label } from '$lib/components/ui/label';
	import type { VenueSuggestion } from '$lib/searchbox';
	import { MIN_QUERY_LENGTH, suggestVenues } from '$lib/searchbox';
	import { createSearchBoxSession } from '$lib/searchbox-session.svelte';

	let { data } = $props();

	let targetDate = $state('');
	let availabilityStatus = $state<'FREE' | 'BOOKED' | 'PARTIAL' | ''>('');

	// --- Named constants ---
	const COOLDOWN_MS = 3000;
	const DEBOUNCE_MS = 300;
	const BLUR_TIMEOUT_MS = 200;

	// --- 1. Client-Side Travel Estimator State ---
	let clientVenueQuery = $state('');
	let calculatingTravel = $state(false);
	let cooldownActive = $state(false);

	let estimatedDistance = $state<number | null>(null);
	let estimatedTravelFee = $state<number | null>(null);
	let resolvedVenueName = $state('');
	let selectedMapboxId = $state<string | null>(null);
	let selectedVenueCoords = $state<{ lat: number; lng: number } | null>(null);

	let venueSuggestions = $state<VenueSuggestion[]>([]);
	let showVenueSuggestions = $state(false);
	let noResultsHint = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;
	const venueSearchSession = createSearchBoxSession();

	// Local cache for estimates (keyed by mapbox_id for picked places; fallback key for free-form)
	const estimateCache = new Map<
		string,
		{
			distanceKm: number | null;
			computedFee: number | null;
			venueName: string;
			venueLat?: number;
			venueLng?: number;
		}
	>();

	onDestroy(() => {
		venueSearchSession.destroy();
	});

	// --- 2. Leaflet Map Initialization + session token ---
	onMount(async () => {
		// Session token already generated via createSearchBoxSession; touch to reset idle window
		if (browser) {
			venueSearchSession.touch();
		}
		if (browser && data.baseLat && data.baseLng) {
			const L = await import('leaflet');

			const map = L.map('map-container', {
				center: [data.baseLat, data.baseLng],
				zoom: 12,
				zoomControl: false,
				dragging: true,
				scrollWheelZoom: false,
				attributionControl: false
			});

			L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
				attribution: ''
			}).addTo(map);

			// Minimal zoom control in bottom-right
			L.control.zoom({ position: 'bottomright' }).addTo(map);

			// Custom marker — rose dot with subtle pulse
			const markerIcon = L.divIcon({
				className: 'custom-marker',
				html: `<div class="marker-dot">
						<div class="marker-ping"></div>
						<div class="marker-core"></div>
					</div>`,
				iconSize: [24, 24],
				iconAnchor: [12, 12]
			});

			L.marker([data.baseLat, data.baseLng], { icon: markerIcon })
				.addTo(map)
				.bindPopup(
					`<div class="marker-popup"><p class="marker-popup-title">${data.studioName}</p><p class="marker-popup-sub">Base studio area</p></div>`
				)
				.openPopup();

			// Force resize after mount to handle any layout shifts
			setTimeout(() => map.invalidateSize(), 100);
		}
	});

	// Travel estimator: uses mapboxId path when a suggestion was picked, otherwise geocode fallback
	async function handleEstimateTravel() {
		if (!data.baseLat || !data.baseLng) return;

		const queryTrimmed = clientVenueQuery.trim();
		if (!queryTrimmed) {
			toast.warning('Please enter your event address or hotel name.');
			return;
		}

		if (cooldownActive) return;

		// Cache key: mapbox_id when picked, otherwise normalized query lower-case
		const cacheKey = selectedMapboxId ? selectedMapboxId : queryTrimmed.toLowerCase();
		if (estimateCache.has(cacheKey)) {
			const cached = estimateCache.get(cacheKey)!;
			estimatedDistance = cached.distanceKm;
			estimatedTravelFee = cached.computedFee;
			resolvedVenueName = cached.venueName;
			selectedVenueCoords =
				cached.venueLat != null && cached.venueLng != null
					? { lat: cached.venueLat, lng: cached.venueLng }
					: selectedVenueCoords;
			toast.success('Travel estimate loaded.');
			return;
		}

		calculatingTravel = true;
		cooldownActive = true;
		const loadingToastId = toast.loading('Checking the route to your venue…');

		setTimeout(() => {
			cooldownActive = false;
		}, COOLDOWN_MS);

		try {
			const payload: Record<string, any> = {
				baseLat: data.baseLat,
				baseLng: data.baseLng,
				ratePerKm: data.ratePerKm
			};
			if (selectedMapboxId) {
				payload.mapboxId = selectedMapboxId;
				payload.session_token = venueSearchSession.token;
			} else {
				payload.venue = queryTrimmed;
			}

			const response = await fetch('/api/estimate-travel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			const result = await response.json();
			toast.dismiss(loadingToastId);

			if (!result.success) {
				toast.error(result.error || 'Failed to analyze location.');
				calculatingTravel = false;
				return;
			}

			estimatedDistance = result.distanceKm;
			estimatedTravelFee = result.computedFee;
			resolvedVenueName = result.venueName;
			if (result.venueLat != null && result.venueLng != null) {
				selectedVenueCoords = { lat: result.venueLat, lng: result.venueLng };
			}

			// Save to cache keyed by mapbox_id when available
			estimateCache.set(cacheKey, {
				distanceKm: estimatedDistance,
				computedFee: estimatedTravelFee,
				venueName: resolvedVenueName,
				venueLat: result.venueLat,
				venueLng: result.venueLng
			});

			// Rotate session after successful retrieve billing window
			if (selectedMapboxId) venueSearchSession.rotate();

			toast.success('Travel estimate ready');
		} catch (err: any) {
			toast.dismiss(loadingToastId);
			console.error(err);
			toast.error('Failed to calculate travel fee.');
		} finally {
			calculatingTravel = false;
		}
	}

	async function handleVenueInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		clientVenueQuery = value;
		// Typing free-form without pick should clear selected mapbox_id so fallback path is used
		if (selectedMapboxId) {
			selectedMapboxId = null;
			selectedVenueCoords = null;
		}
		clearTimeout(searchTimeout);
		venueSearchSession.touch();
		if (value.length < MIN_QUERY_LENGTH) {
			venueSuggestions = [];
			showVenueSuggestions = false;
			noResultsHint = false;
			return;
		}

		const cached = venueSearchSession.lookupVenueSuggestions(value, 'venue');
		if (cached) {
			venueSuggestions = cached;
			showVenueSuggestions = venueSuggestions.length > 0;
			noResultsHint = venueSuggestions.length === 0;
			return;
		}

		searchTimeout = setTimeout(async () => {
			try {
				const suggestions = await suggestVenues(value, venueSearchSession.token, 'venue');
				venueSuggestions = suggestions;
				venueSearchSession.storeVenueSuggestions(value, 'venue', venueSuggestions);
				showVenueSuggestions = venueSuggestions.length > 0;
				noResultsHint = venueSuggestions.length === 0;
			} catch (err) {
				console.error('Autocomplete error:', err);
				toast.error('Could not load Venue Suggestions.');
				venueSuggestions = [];
				showVenueSuggestions = false;
				noResultsHint = false;
			}
		}, DEBOUNCE_MS);
	}

	function selectVenueSuggestion(sugg: VenueSuggestion) {
		clientVenueQuery = sugg.full_address || sugg.place_formatted || sugg.name;
		selectedMapboxId = sugg.mapbox_id;
		// show selected immediately, then estimate will rotate token
		resolvedVenueName = sugg.name;
		showVenueSuggestions = false;
		noResultsHint = false;
		venueSuggestions = [];
		venueSearchSession.touch();
		// Optionally trigger the estimate immediately upon selection
		handleEstimateTravel();
	}

	// Close Venue Suggestions when clicking outside
	function closeVenueSuggestions() {
		setTimeout(() => {
			showVenueSuggestions = false;
		}, BLUR_TIMEOUT_MS);
	}

	// Calendar logic
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

	let currentYear = $state(new Date().getFullYear());
	let currentMonth = $state(new Date().getMonth());

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

	function getSlotsForDate(dateStr: string) {
		return data.daySlots[dateStr] || [];
	}

	function getSlotCount(dateStr: string) {
		return getSlotsForDate(dateStr).length;
	}

	function selectDay(day: number) {
		const key = dateKey(day);
		if (key < todayStr) return;
		targetDate = key;
		const slotCount = getSlotCount(key);
		const isBlackout = data.blackoutDates.includes(key);
		if (isBlackout) {
			availabilityStatus = 'BOOKED';
		} else if (slotCount > 0) {
			availabilityStatus = 'PARTIAL';
		} else {
			availabilityStatus = 'FREE';
		}
	}

	function isSelected(day: number) {
		return targetDate === dateKey(day);
	}
	function isPast(day: number) {
		return dateKey(day) < todayStr;
	}
	function isBlackout(day: number) {
		return data.blackoutDates.includes(dateKey(day));
	}

	function fmtTime(t: string) {
		if (!t) return '';
		const [h, m] = t.split(':');
		const hr = parseInt(h);
		const sfx = hr >= 12 ? 'PM' : 'AM';
		const dh = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
		return `${dh}:${m} ${sfx}`;
	}

	function fmtDate(d: string) {
		return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function fmtCurrency(price: number | string) {
		return `RM ${Number(price).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
	}

	// Compute end time from start + duration
	function slotEnd(start: string, hours: number) {
		const [h, m] = start.split(':').map(Number);
		const totalMinutes = h * 60 + m + hours * 60;
		const endH = Math.floor(totalMinutes / 60) % 24;
		const endM = totalMinutes % 60;
		return fmtTime(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`);
	}

	// Selected date slots for display
	let selectedSlots = $derived(targetDate ? getSlotsForDate(targetDate) : []);
	let selectedIsBlackout = $derived(targetDate ? data.blackoutDates.includes(targetDate) : false);

	// Dynamically appends dates, venue destination, and calculated travel fees to the WhatsApp lead link!
	let whatsappInquiryUrl = $derived.by(() => {
		const dateText = targetDate ? ` on ${fmtDate(targetDate)}` : '';
		let message = `Hi ${data.studioName}! I checked your availability${dateText}. Are you available to cover my bridal event?`;

		if (estimatedTravelFee !== null && estimatedTravelFee > 0) {
			message += ` My venue is at ${resolvedVenueName} (estimated travel fee: ${fmtCurrency(estimatedTravelFee)} for ${estimatedDistance} km).`;
		}

		return `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(message)}`;
	});
</script>

{#snippet whatsappIcon()}
	<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
		<path
			d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
		/>
	</svg>
{/snippet}

<div class="bg-background flex min-h-screen flex-col items-center px-4 py-8 sm:py-12">
	<div class="w-full max-w-md space-y-6">
		<!-- Studio Branding -->
		<div class="animate-in-up space-y-4 text-center" style="--i: 0">
			<div
				class="bg-foreground text-background mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold"
				aria-label={`${data.studioName} studio initial`}
			>
				{data.studioName.charAt(0)}
			</div>
			<div class="space-y-1">
				<h1 class="text-xl font-semibold tracking-tight">{data.studioName}</h1>
				<p class="text-muted-foreground text-sm">Makeup artist services</p>
			</div>
		</div>

		<!-- Availability Checker -->
		<Card.Root class="animate-in-up" style="--i: 1">
			<Card.Header>
				<Card.Title>Check date availability</Card.Title>
				<Card.Description>
					{data.workingHoursStart} – {data.workingHoursEnd} daily · See booked time slots before reaching
					out.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Calendar -->
				<div class="border-border bg-card rounded-lg border">
					<div class="flex items-center justify-between px-4 py-3">
						<button
							type="button"
							onclick={() => navigateMonth(-1)}
							class="hover:bg-muted focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-1"
							aria-label="Previous month"
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
							class="hover:bg-muted focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-1"
							aria-label="Next month"
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
									{@const dateStr = dateKey(day)}
									{@const slotCount = getSlotCount(dateStr)}
									{@const blackedOut = isBlackout(day)}
									<div class="flex items-center justify-center">
										<button
											type="button"
											onclick={() => selectDay(day)}
											disabled={isPast(day)}
											class="focus-visible:ring-ring relative flex min-h-11 min-w-11 items-center justify-center rounded-md text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-1
												{isSelected(day)
												? 'bg-primary text-primary-foreground font-semibold'
												: isPast(day)
													? 'text-muted-foreground/30 cursor-not-allowed'
													: blackedOut
														? 'text-muted-foreground bg-muted/50'
														: slotCount > 0
															? 'hover:bg-muted'
															: 'hover:bg-muted font-medium'}"
										>
											{day}
											<!-- Slot count badge -->
											{#if slotCount > 0 && !isSelected(day) && !blackedOut}
												<span
													class="bg-primary/80 absolute -top-0.5 -right-0.5 flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full px-1 text-[9px] leading-none font-medium text-white"
												>
													{slotCount}
												</span>
											{/if}
											<!-- Blackout dot -->
											{#if blackedOut && !isSelected(day)}
												<span class="bg-destructive/60 absolute bottom-0.5 h-1 w-1 rounded-full"
												></span>
											{/if}
										</button>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>

				<!-- Selected date display + timeline -->
				{#if targetDate}
					<div class="space-y-3">
						<div class="flex items-center justify-center gap-2">
							<p class="text-sm font-medium">{fmtDate(targetDate)}</p>
						</div>

						<!-- Timeline of booked slots -->
						{#if selectedIsBlackout}
							<div class="border-destructive/20 bg-destructive/5 space-y-1 rounded-lg border p-4">
								<div class="flex items-center gap-2">
									<svg
										class="text-destructive h-4 w-4 shrink-0"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
										/>
									</svg>
									<p class="text-destructive text-sm font-medium">Date unavailable (blocked)</p>
								</div>
								<p class="text-muted-foreground pl-6 text-xs">
									This date has been blocked by the MUA. Try a different date.
								</p>
							</div>
						{:else}
							<!-- Working hours bar -->
							<div class="flex items-center gap-2 px-1">
								<span class="text-muted-foreground text-[11px] font-medium"
									>{data.workingHoursStart}</span
								>
								<div class="bg-muted/50 relative h-1.5 flex-1 overflow-hidden rounded-full">
									<div class="absolute inset-0 grid grid-cols-12 gap-0.5 px-0.5">
										{#each Array(12) as _, i}
											<div class="bg-muted-foreground/10 h-full w-full rounded-full"></div>
										{/each}
									</div>
								</div>
								<span class="text-muted-foreground text-[11px] font-medium"
									>{data.workingHoursEnd}</span
								>
							</div>

							<!-- Booked sessions list -->
							{#if selectedSlots.length > 0}
								<div class="space-y-2">
									<p class="text-muted-foreground text-xs font-medium">
										{selectedSlots.length} session{selectedSlots.length !== 1 ? 's' : ''} booked
									</p>
									{#each selectedSlots as slot}
										<div
											class="border-border bg-muted/30 flex items-center gap-3 rounded-lg border p-3"
										>
											<div class="shrink-0 text-center">
												<p class="text-xs font-semibold tabular-nums">
													{fmtTime(slot.time)}
												</p>
												<p class="text-muted-foreground text-[10px]">
													→ {slotEnd(slot.time, slot.durationHours)}
												</p>
											</div>
											<div class="bg-muted-foreground/20 h-8 w-px"></div>
											<div class="min-w-0 flex-1">
												<p class="truncate text-sm font-medium">
													{slot.packageEmoji}
													{slot.packageName}
												</p>
												<p class="text-muted-foreground truncate text-xs">
													{slot.clientName}
												</p>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="border-primary/20 bg-primary/5 space-y-1 rounded-lg border p-4">
									<div class="flex items-center gap-2">
										<svg
											class="text-primary h-4 w-4 shrink-0"
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
										<p class="text-primary text-sm font-medium">Available all day</p>
									</div>
									<p class="text-muted-foreground pl-6 text-xs">
										No sessions booked yet. Reach out to discuss your event.
									</p>
								</div>
							{/if}
						{/if}
					</div>
				{/if}

				<Separator />

				{#if data.whatsappNumber}
					<Button class="w-full gap-2" onclick={() => window.open(whatsappInquiryUrl, '_blank')}>
						{@render whatsappIcon()}
						Inquire via WhatsApp
					</Button>
				{:else}
					<Button class="w-full gap-2" disabled>
						{@render whatsappIcon()}
						Contact not configured
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Interactive Travel Surcharge Calculator (only if coordinates & rate are set) -->
		{#if data.baseLat && data.baseLng && data.ratePerKm > 0}
			<Card.Root
				class="animate-in-up relative {showVenueSuggestions ? 'z-50' : 'z-20'} overflow-visible"
				style="--i: 2"
			>
				<Card.Header>
					<Card.Title>Estimate travel surcharge</Card.Title>
					<Card.Description
						>Calculate road travel cost from our studio to your area.</Card.Description
					>
				</Card.Header>
				<Card.Content class="space-y-4 overflow-visible">
					<div class="flex gap-2">
						<div class="relative w-full">
							<Label for="venue-search" class="sr-only">Event venue or area</Label>
							<Input
								id="venue-search"
								placeholder="Type area name..."
								value={clientVenueQuery}
								oninput={handleVenueInput}
								onblur={closeVenueSuggestions}
								autocomplete="off"
							/>

							{#if showVenueSuggestions}
								<div
									class="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute z-50 mt-1 w-full rounded-md border shadow-md outline-none"
								>
									<ul class="p-1">
										{#each venueSuggestions as venueSuggestion (venueSuggestion.mapbox_id)}
											<li>
												<button
													type="button"
													class="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring w-full rounded-sm px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-offset-1"
													onclick={() => selectVenueSuggestion(venueSuggestion)}
												>
													<p class="font-medium">{venueSuggestion.name}</p>
													<p class="text-muted-foreground line-clamp-1 text-[11px]">
														{venueSuggestion.place_formatted || venueSuggestion.full_address}
													</p>
												</button>
											</li>
										{/each}
									</ul>
								</div>
							{:else if noResultsHint}
								<p class="text-muted-foreground mt-2 px-1 text-xs">
									No places found — try broader area like 'Damansara, Petaling Jaya'
								</p>
							{/if}
						</div>

						<Button
							variant="outline"
							onclick={handleEstimateTravel}
							disabled={calculatingTravel || !clientVenueQuery}
							class="shrink-0"
						>
							{#if calculatingTravel}
								<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
									/>
								</svg>
							{:else}
								Estimate
							{/if}
						</Button>
					</div>

					{#if estimatedTravelFee !== null && estimatedDistance !== null}
						<div
							class="animate-reveal border-primary/20 bg-primary/5 space-y-1 rounded-lg border p-4 text-center"
						>
							<p class="text-primary text-sm font-semibold">
								Estimated travel surcharge: {fmtCurrency(estimatedTravelFee)}
							</p>
							<p class="text-muted-foreground text-xs">
								One way distance is approximately <span class="font-semibold"
									>{estimatedDistance} km</span
								>
								to <span class="font-semibold">{resolvedVenueName}</span>.
							</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Interactive Leaflet Map (100% Free & Zero Key cost) -->
		{#if data.baseLat && data.baseLng}
			<Card.Root class="animate-in-up overflow-hidden" style="--i: 3">
				<Card.Header class="pb-3">
					<Card.Title>Our studio base area</Card.Title>
					<Card.Description
						>We operate and travel outwards from this base location.</Card.Description
					>
				</Card.Header>
				<div
					id="map-container"
					class="border-border h-72 w-full border-t opacity-0 transition-opacity duration-300"
					style:--map-loaded="0"
				></div>
			</Card.Root>
		{/if}

		<!-- Service Packages -->
		<Card.Root class="animate-in-up" style="--i: 4">
			<Card.Header>
				<Card.Title>Service packages</Card.Title>
				<Card.Description
					>Available services and pricing. Each includes the session duration.</Card.Description
				>
			</Card.Header>
			<Card.Content>
				{#if data.packages.length > 0}
					<div class="divide-border divide-y">
						{#each data.packages as pkg}
							<div class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
								<div class="flex items-center gap-3">
									<span
										class="bg-muted flex h-8 w-8 items-center justify-center rounded-md text-base"
									>
										{pkg.emoji}
									</span>
									<div>
										<span class="text-sm font-medium">{pkg.name}</span>
										<p class="text-muted-foreground text-[11px]">{pkg.duration_hours} hrs</p>
									</div>
								</div>
								<span class="text-sm font-semibold tabular-nums">
									{fmtCurrency(pkg.price)}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="border-border rounded-lg border border-dashed py-8 text-center">
						<p class="text-muted-foreground text-xs">No packages listed yet.</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<p class="text-muted-foreground/60 pt-2 text-center text-[11px]">Powered by MUASuites</p>
	</div>
</div>

<style>
	/* Staggered card entrance — delay increases per card index */
	.animate-in-up {
		animation: in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: calc(var(--i, 0) * 75ms);
	}

	@keyframes in-up {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Travel result reveal — fade + slight slide */
	.animate-reveal {
		animation: reveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes reveal {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Respect reduced motion — disable entrance/reveal animations */
	@media (prefers-reduced-motion: reduce) {
		.animate-in-up,
		.animate-reveal {
			animation: none;
			opacity: 1;
		}
	}

	/* Map container fades in after Leaflet initialises */
	#map-container:global(.leaflet-container) {
		opacity: 1 !important;
	}

	:global(.leaflet-control-zoom) {
		border: none !important;
		border-radius: 8px !important;
		overflow: hidden;
		box-shadow:
			0 1px 3px rgb(0 0 0 / 0.08),
			0 1px 2px rgb(0 0 0 / 0.04) !important;
	}

	:global(.leaflet-control-zoom a) {
		width: 32px !important;
		height: 32px !important;
		line-height: 32px !important;
		font-size: 14px !important;
		color: var(--foreground) !important;
		background: var(--card) !important;
		border: none !important;
		border-bottom: 1px solid var(--border) !important;
		opacity: 1 !important;
		transition: background-color 0.15s ease;
	}

	:global(.leaflet-control-zoom a:last-child) {
		border-bottom: none !important;
	}

	:global(.leaflet-control-zoom a:hover) {
		background: var(--muted) !important;
	}

	/* Popup bubble */
	:global(.leaflet-popup-content-wrapper) {
		border-radius: 8px !important;
		border: 1px solid var(--border) !important;
		background: var(--card) !important;
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.08) !important;
		padding: 0 !important;
	}

	:global(.leaflet-popup-content) {
		margin: 10px 12px !important;
		font-family: 'Inter Variable', sans-serif !important;
		font-size: 13px !important;
		line-height: 1.4 !important;
		color: var(--foreground) !important;
	}

	:global(.leaflet-popup-tip) {
		background: var(--card) !important;
		border: 1px solid var(--border) !important;
		border-top: none !important;
		border-left: none !important;
		box-shadow: none !important;
	}

	:global(.leaflet-popup-close-button) {
		color: var(--muted-foreground) !important;
		font-size: 18px !important;
		top: 4px !important;
		right: 6px !important;
	}

	:global(.leaflet-popup-close-button:hover) {
		color: var(--foreground) !important;
	}

	:global(.leaflet-popup-tip-container) {
		display: none !important;
	}

	/* Attribution */
	:global(.leaflet-control-attribution) {
		font-size: 9px !important;
		color: var(--muted-foreground) !important;
		background: var(--card) !important;
		border-top-left-radius: 4px !important;
		padding: 2px 6px !important;
		opacity: 0.6;
	}

	:global(.leaflet-control-attribution a) {
		color: var(--muted-foreground) !important;
	}

	/* Custom marker */
	:global(.custom-marker) {
		background: none !important;
		border: none !important;
	}

	:global(.marker-dot) {
		position: relative;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.marker-core) {
		width: 12px;
		height: 12px;
		background: var(--primary);
		border-radius: 50%;
		border: 2.5px solid var(--card);
		box-shadow: 0 1px 4px rgb(0 0 0 / 0.2);
		position: relative;
		z-index: 2;
	}

	:global(.marker-ping) {
		position: absolute;
		width: 24px;
		height: 24px;
		background: var(--primary);
		border-radius: 50%;
		opacity: 0.25;
		animation: marker-pulse 2s ease-out infinite;
	}

	@keyframes marker-pulse {
		0% {
			transform: scale(0.5);
			opacity: 0.35;
		}
		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}

	/* Popup inner text classes (injected via HTML string) */
	:global(.marker-popup-title) {
		font-weight: 600;
		font-size: 13px;
		color: var(--foreground);
		margin: 0;
	}

	:global(.marker-popup-sub) {
		font-size: 11px;
		color: var(--muted-foreground);
		margin: 2px 0 0;
	}
</style>
