/**
 * Invalidates the KV-cached public profile page for the given slug(s).
 * Fire-and-forget, mirroring the inline fetch the settings page used.
 */
export async function invalidateProfileCache(slug: string): Promise<void> {
	try {
		await fetch('/api/cache/invalidate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ slugs: [slug] })
		});
	} catch {
		// Cache invalidation is best-effort; the KV key expires on its own.
	}
}
