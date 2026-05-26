<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

	let { data } = $props();

	let targetDate = $state('');
	let availabilityStatus = $state<'FREE' | 'BOOKED' | ''>('');

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

	function selectDay(day: number) {
		const key = dateKey(day);
		if (key < todayStr) return;
		targetDate = key;
		availabilityStatus = data.disabledDates.includes(key) ? 'BOOKED' : 'FREE';
	}

	function isSelected(day: number) {
		return targetDate === dateKey(day);
	}
	function isPast(day: number) {
		return dateKey(day) < todayStr;
	}
	function isOccupied(day: number) {
		return data.disabledDates.includes(dateKey(day));
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

	let whatsappInquiryUrl = $derived.by(() => {
		const dateText = targetDate ? ` on ${fmtDate(targetDate)}` : '';
		const message = `Hi ${data.studioName}! I checked your availability${dateText}. Are you available to cover my bridal event?`;
		return `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(message)}`;
	});
</script>

<div class="bg-background flex min-h-screen flex-col items-center px-4 py-8 sm:py-12">
	<div class="animate-in-up w-full max-w-md space-y-6">
		<!-- Studio Branding -->
		<div class="space-y-4 text-center">
			<div
				class="bg-foreground text-background mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold"
			>
				{data.studioName.charAt(0)}
			</div>
			<div class="space-y-1">
				<h1 class="text-xl font-semibold tracking-tight">{data.studioName}</h1>
				<p class="text-muted-foreground text-sm">Makeup Artist Services</p>
			</div>
		</div>

		<!-- Availability Checker -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Check Date Availability</Card.Title>
				<Card.Description>See if your event date is open before reaching out.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Calendar -->
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
												<span class="bg-primary/60 absolute bottom-0.5 h-1 w-1 rounded-full"></span>
											{/if}
										</button>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				</div>

				<!-- Selected date display -->
				{#if targetDate}
					<div class="flex items-center justify-center gap-2 py-1">
						<svg
							class="text-primary h-3.5 w-3.5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
						<p class="text-sm font-medium">{fmtDate(targetDate)}</p>
					</div>
				{/if}

				<!-- Availability result -->
				{#if availabilityStatus === 'FREE'}
					<div class="border-primary/20 bg-primary/5 space-y-1 rounded-lg border p-4">
						<div class="flex items-center gap-2">
							<svg
								class="text-primary h-4 w-4 shrink-0"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
							</svg>
							<p class="text-primary text-sm font-medium">Available on this date</p>
						</div>
						<p class="text-muted-foreground pl-6 text-xs">
							Message us on WhatsApp to receive your custom booking link.
						</p>
					</div>
				{:else if availabilityStatus === 'BOOKED'}
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
							<p class="text-destructive text-sm font-medium">Date fully booked</p>
						</div>
						<p class="text-muted-foreground pl-6 text-xs">
							An active reservation holds this date. Try another date or reach out for waitlist
							options.
						</p>
					</div>
				{/if}

				<Separator />

				<Button class="w-full gap-2" onclick={() => window.open(whatsappInquiryUrl, '_blank')}>
					<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
						/>
					</svg>
					Inquire via WhatsApp
				</Button>
			</Card.Content>
		</Card.Root>

		<!-- Service Packages -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Service Packages</Card.Title>
				<Card.Description>Available services and pricing.</Card.Description>
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
									<span class="text-sm font-medium">{pkg.name}</span>
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
