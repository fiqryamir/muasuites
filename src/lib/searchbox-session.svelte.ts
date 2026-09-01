import { generateSessionToken, SESSION_IDLE_MS, type VenueSuggestion } from '$lib/searchbox';

/**
 * Reusable Search Box session lifecycle — replaces duplicated rotate + idle +
 * suggest-cache logic that lived in 3 components (public estimator, base
 * location picker, booking venue picker). Each caller gets its own token,
 * idle timer, and in-memory suggest cache so sessions stay isolated.
 */
export function createSearchBoxSession() {
	let sessionToken = $state(generateSessionToken());
	let idleTimer: ReturnType<typeof setTimeout> | undefined = $state(undefined);
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- cache is internal, not template-reactive
	const suggestCache = new Map<string, VenueSuggestion[]>();

	function rotate(): void {
		sessionToken = generateSessionToken();
		suggestCache.clear();
		scheduleIdle();
	}

	function scheduleIdle(): void {
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(rotate, SESSION_IDLE_MS);
	}

	function touch(): void {
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = setTimeout(rotate, SESSION_IDLE_MS);
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
		cache: suggestCache,
		rotate,
		touch,
		destroy
	};
}
