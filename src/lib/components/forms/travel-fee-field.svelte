<script lang="ts">
	/* eslint-disable no-useless-assignment */
	import { onMount, onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText
	} from '$lib/components/ui/input-group';
	import { Field, FieldLabel } from '$lib/components/ui/field';
	import type { VenueSuggestion } from '$lib/searchbox';
	import { MIN_QUERY_LENGTH } from '$lib/searchbox';
	import { createSearchBoxSession } from '$lib/searchbox-session.svelte';

	let {
		placeName = $bindable(''),
		lat = $bindable(null),
		lng = $bindable(null),
		ratePerKm = $bindable(0)
	}: {
		placeName?: string;
		lat?: number | null;
		lng?: number | null;
		ratePerKm?: number;
	} = $props();

	let query = $state(placeName);
	let venueSuggestions = $state<VenueSuggestion[]>([]);
	let showVenueSuggestions = $state(false);
	let searching = $state(false);
	let focused = $state(false);
	let noResultsHint = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;
	const searchSession = createSearchBoxSession();

	onMount(() => {
		// session token already generated; touch to reset idle window
		searchSession.touch();
	});
	onDestroy(() => {
		searchSession.destroy();
	});

	let rateStr = $state(String(ratePerKm));

	// Re-parse the bound rate when the parent changes it externally (prefill / reload)
	let prevRate = $state(ratePerKm);
	$effect(() => {
		if (ratePerKm !== prevRate) {
			prevRate = ratePerKm;
			rateStr = String(ratePerKm);
		}
	});

	// Emit the parsed rate back to the parent (never NaN)
	$effect(() => {
		ratePerKm = parseFloat(rateStr) || 0;
	});

	// Sync the search box with an externally-changed base location, but never
	// while the MUA is typing in it.
	$effect(() => {
		if (!focused && placeName !== query) {
			query = placeName;
		}
	});

	async function handleInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		query = value;
		clearTimeout(searchTimeout);
		searchSession.touch();
		if (value.length < MIN_QUERY_LENGTH) {
			venueSuggestions = [];
			showVenueSuggestions = false;
			noResultsHint = false;
			return;
		}

		const cacheKey = `${value.toLowerCase()}|base|${searchSession.token}`;
		if (searchSession.cache.has(cacheKey)) {
			venueSuggestions = searchSession.cache.get(cacheKey)!;
			showVenueSuggestions = venueSuggestions.length > 0;
			noResultsHint = venueSuggestions.length === 0;
			return;
		}

		searchTimeout = setTimeout(async () => {
			searching = true;
			try {
				const res = await fetch(
					`/api/search-location?q=${encodeURIComponent(value)}&session_token=${encodeURIComponent(searchSession.token)}&types=base`
				);
				const data = await res.json();
				if (data.success) {
					venueSuggestions = (data.suggestions ?? []) as VenueSuggestion[];
					searchSession.cache.set(cacheKey, venueSuggestions);
					showVenueSuggestions = venueSuggestions.length > 0;
					noResultsHint = venueSuggestions.length === 0;
				} else {
					toast.error('Could not load Venue Suggestions.');
					venueSuggestions = [];
					showVenueSuggestions = false;
					noResultsHint = false;
				}
			} catch {
				toast.error('Could not load Venue Suggestions.');
				venueSuggestions = [];
				showVenueSuggestions = false;
				noResultsHint = false;
			} finally {
				searching = false;
			}
		}, 400);
	}

	async function selectVenueSuggestion(sugg: VenueSuggestion) {
		// Retrieve precise coordinates via Search Box retrieve using shared session_token
		try {
			const res = await fetch(
				`/api/retrieve-location?id=${encodeURIComponent(sugg.mapbox_id)}&session_token=${encodeURIComponent(searchSession.token)}`
			);
			const data = await res.json();
			if (data.success && data.lng != null && data.lat != null) {
				placeName = data.full_address || sugg.full_address || sugg.place_formatted || sugg.name;
				lng = data.lng;
				lat = data.lat;
			} else {
				// Fallback to suggestion metadata if retrieve fails
				placeName = sugg.full_address || sugg.place_formatted || sugg.name;
				// No coordinates available without retrieve; keep previous or null
			}
		} catch {
			placeName = sugg.full_address || sugg.place_formatted || sugg.name;
		}
		query = placeName;
		showVenueSuggestions = false;
		noResultsHint = false;
		venueSuggestions = [];
		searchSession.rotate();
	}

	function clearLocation() {
		placeName = '';
		lat = null;
		lng = null;
		query = '';
		venueSuggestions = [];
		showVenueSuggestions = false;
		noResultsHint = false;
	}

	function closeVenueSuggestions() {
		setTimeout(() => {
			showVenueSuggestions = false;
		}, 150);
	}
</script>

<div class="space-y-4">
	<Field class="gap-2">
		<FieldLabel>Base location</FieldLabel>
		<div class="relative">
			<Input
				id="base-location"
				placeholder="Search your area or town..."
				value={query}
				oninput={handleInput}
				onfocus={() => (focused = true)}
				onblur={() => {
					focused = false;
					closeVenueSuggestions();
				}}
				autocomplete="off"
				class="bg-muted rounded-full border-none px-4"
			/>
			{#if searching}
				<span class="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-xs">
					Searching…
				</span>
			{/if}
			{#if showVenueSuggestions && venueSuggestions.length > 0}
				<div
					class="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 absolute z-50 mt-1 w-full rounded-md border shadow-md outline-none"
				>
					<ul class="p-1">
						{#each venueSuggestions as sugg (sugg.mapbox_id)}
							<li>
								<button
									type="button"
									class="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring w-full rounded-sm px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-offset-1"
									onclick={() => selectVenueSuggestion(sugg)}
								>
									<p class="font-medium">{sugg.name}</p>
									<p class="text-muted-foreground line-clamp-1 text-[11px]">
										{sugg.place_formatted || sugg.full_address}
									</p>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{:else if noResultsHint}
				<p class="text-muted-foreground mt-2 px-2 text-xs">
					No places found — try broader area like 'Damansara, Petaling Jaya'
				</p>
			{/if}
		</div>
		{#if placeName}
			<div
				class="border-primary/20 bg-primary/5 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
			>
				<span class="truncate font-medium">📍 {placeName}</span>
				<button
					type="button"
					onclick={clearLocation}
					class="text-muted-foreground hover:text-foreground shrink-0"
					aria-label="Remove base location"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M18 6 6 18" />
						<path d="m6 6 12 12" />
					</svg>
				</button>
			</div>
		{/if}
		<p class="text-muted-foreground px-2 text-xs">
			Where you travel from. Clients estimate their own travel cost from here.
		</p>
	</Field>

	<Field class="gap-2">
		<FieldLabel>Travel rate</FieldLabel>
		<InputGroup class="bg-muted overflow-hidden rounded-full border-none">
			<InputGroupAddon class="pl-4">
				<InputGroupText class="text-muted-foreground text-sm">RM</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput
				id="rate_per_km"
				type="number"
				min="0"
				step="0.5"
				bind:value={rateStr}
				placeholder="2.00"
				class="border-none bg-transparent focus-visible:ring-0"
			/>
			<InputGroupAddon class="pr-4">
				<InputGroupText class="text-muted-foreground text-sm">/ km</InputGroupText>
			</InputGroupAddon>
		</InputGroup>
		<p class="text-muted-foreground px-2 text-xs">
			How much you charge per kilometre of road travel to the client's venue.
		</p>
	</Field>
</div>
