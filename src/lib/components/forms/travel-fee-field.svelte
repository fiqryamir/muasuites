<script lang="ts">
	/* eslint-disable no-useless-assignment */
	import { Input } from '$lib/components/ui/input';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText
	} from '$lib/components/ui/input-group';
	import { Field, FieldLabel } from '$lib/components/ui/field';

	interface Suggestion {
		text: string;
		place_name: string;
		center: [number, number];
	}

	let {
		placeName = $bindable(''),
		lat = $bindable(null),
		lng = $bindable(null),
		ratePerKm = $bindable(0)
	}: { placeName?: string; lat?: number | null; lng?: number | null; ratePerKm?: number } =
		$props();

	let query = $state(placeName);
	let suggestions = $state<Suggestion[]>([]);
	let showSuggestions = $state(false);
	let searching = $state(false);
	let focused = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;

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
		if (value.length < 3) {
			suggestions = [];
			showSuggestions = false;
			return;
		}

		searchTimeout = setTimeout(async () => {
			searching = true;
			try {
				const res = await fetch(`/api/search-location?q=${encodeURIComponent(value)}`);
				const data = await res.json();
				if (data.success) {
					suggestions = data.features;
					showSuggestions = suggestions.length > 0;
				}
			} catch {
				suggestions = [];
				showSuggestions = false;
			} finally {
				searching = false;
			}
		}, 400);
	}

	function selectSuggestion(sugg: Suggestion) {
		placeName = sugg.place_name;
		lat = sugg.center[1];
		lng = sugg.center[0];
		query = sugg.place_name;
		showSuggestions = false;
		suggestions = [];
	}

	function clearLocation() {
		placeName = '';
		lat = null;
		lng = null;
		query = '';
		suggestions = [];
		showSuggestions = false;
	}

	function closeSuggestions() {
		setTimeout(() => {
			showSuggestions = false;
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
					closeSuggestions();
				}}
				autocomplete="off"
				class="rounded-full bg-muted border-none px-4"
			/>
			{#if searching}
				<span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
					Searching…
				</span>
			{/if}
			{#if showSuggestions && suggestions.length > 0}
				<div
					class="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95"
				>
					<ul class="p-1">
						{#each suggestions as sugg (sugg.place_name)}
							<li>
								<button
									type="button"
									class="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1"
									onclick={() => selectSuggestion(sugg)}
								>
									<p class="font-medium">{sugg.text}</p>
									<p class="text-muted-foreground line-clamp-1 text-[11px]">{sugg.place_name}</p>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
		{#if placeName}
			<div class="border-primary/20 bg-primary/5 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
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
		<p class="px-2 text-xs text-muted-foreground">
			Where you travel from. Clients estimate their own travel cost from here.
		</p>
	</Field>

	<Field class="gap-2">
		<FieldLabel>Travel rate</FieldLabel>
		<InputGroup class="rounded-full bg-muted border-none overflow-hidden">
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
		<p class="px-2 text-xs text-muted-foreground">
			How much you charge per kilometre of road travel to the client's venue.
		</p>
	</Field>
</div>
