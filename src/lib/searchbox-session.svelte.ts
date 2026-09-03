import {
	generateSessionToken,
	SESSION_IDLE_MS,
	type SearchBoxTypes,
	type VenueSuggestion
} from '$lib/searchbox';

/**
 * Reusable Search Box session lifecycle — replaces duplicated rotate + idle +
 * Venue Suggestion cache logic that lived in 3 components (public estimator, base
 * location picker, booking venue picker). Each caller gets its own token,
 * idle timer, and in-memory Venue Suggestion cache so sessions stay isolated.
 */
export function createSearchBoxSession() {
	let sessionToken = $state(generateSessionToken());
	let idleTimer: ReturnType<typeof setTimeout> | undefined = $state(undefined);
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- cache is internal, not template-reactive
	const venueSuggestionCache = new Map<string, VenueSuggestion[]>();

	function buildCacheKey(query: string, types: SearchBoxTypes): string {
		return `${query.trim().toLowerCase()}|${types}`;
	}

	function rotate(): void {
		sessionToken = generateSessionToken();
		venueSuggestionCache.clear();
		scheduleIdle();
	}

	function scheduleIdle(): void {
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(rotate, SESSION_IDLE_MS);
	}

	function touch(): void {
		scheduleIdle();
	}

	function lookupVenueSuggestions(query: string, types: SearchBoxTypes): VenueSuggestion[] | undefined {
		return venueSuggestionCache.get(buildCacheKey(query, types));
	}

	function storeVenueSuggestions(
		query: string,
		types: SearchBoxTypes,
		suggestions: VenueSuggestion[]
	): void {
		venueSuggestionCache.set(buildCacheKey(query, types), suggestions);
	}

	function destroy(): void {
		if (idleTimer) clearTimeout(idleTimer);
	}

	// Initialize idle countdown on creation
	scheduleIdle();

	return {
		get token(): string {
			return sessionToken;
		},
		set token(v: string) {
			sessionToken = v;
		},
		lookupVenueSuggestions,
		storeVenueSuggestions,
		rotate,
		touch,
		destroy
	};
}
