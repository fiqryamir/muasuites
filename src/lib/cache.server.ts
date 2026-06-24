/**
 * Cloudflare KV cache server utility.
 *
 * Provides get-or-fetch semantics + manual invalidation for the MUA public profile cache.
 * Can only be used in server load functions and API routes (not client-side).
 *
 * The KV namespace binding name must match `wrangler.jsonc` →
 * `kv_namespaces[0].binding` (currently "MUA_CACHE").
 */

/** Derive the public profile cache key for a given MUA slug. */
export function publicProfileKey(slug: string): string {
	return `mua:public:${slug}`;
}

/**
 * Attempts to read a value from KV. If not found (or on error), calls
 * `fetcher()` and stores the result in KV with the given TTL.
 *
 * @returns The cached or freshly-fetched value.
 */
export async function kvGetOrFetch<T>(
	kv: KVNamespace | undefined,
	key: string,
	ttlSeconds: number,
	fetcher: () => Promise<T>
): Promise<T> {
	// If KV binding is unavailable (e.g., dev environment without --remote),
	// skip cache and fall through to the fetcher
	if (kv) {
		try {
			const cached = await kv.get(key);
			if (cached !== null) {
				return JSON.parse(cached) as T;
			}
		} catch (err) {
			// Log but continue — cache miss is safe; we fall through to fresh data
			console.warn(`[cache] KV get error for key "${key}":`, err);
		}
	}

	// Fetch fresh data
	const data = await fetcher();

	// Store in KV (fire-and-forget — don't block on cache write)
	if (kv) {
		kv.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds }).catch((err) => {
			console.warn(`[cache] KV put error for key "${key}":`, err);
		});
	}

	return data;
}

/**
 * Invalidates (deletes) a key from KV.
 * Safe to call even if the key doesn't exist.
 */
export async function kvInvalidate(kv: KVNamespace | undefined, key: string): Promise<void> {
	if (!kv) return;
	try {
		await kv.delete(key);
	} catch (err) {
		console.warn(`[cache] KV delete error for key "${key}":`, err);
	}
}