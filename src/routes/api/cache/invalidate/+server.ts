import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { publicProfileKey, kvInvalidate } from '$lib/cache.server';

/**
 * POST /api/cache/invalidate
 *
 * Invalidates a specific cached key (or keys) in the Cloudflare KV cache.
 * Called after any mutation that affects the public MUA profile page:
 *   - Client completes checkout (slot occupied)
 *   - MUA approves/rejects a booking (slot confirmed/freed)
 *   - MUA saves Settings (config/blackouts/packages changed)
 *
 * Request body:
 *   { slugs: string[] }
 *
 * The endpoint is intentionally NOT authenticated (it only deletes KV keys, not DB data).
 * The risk of a malicious invalidation is low — worst case: a few extra DB queries on next load.
 * If you later need protection, add a shared secret header.
 */
export const POST: RequestHandler = async ({ request, platform }) => {
	const body = await request.json();
	const { slugs } = body as { slugs?: string[] };

	if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
		return json({ success: false, error: 'Missing slugs array' }, { status: 400 });
	}

	const kv = platform?.env?.MUA_CACHE;

	let invalidated = 0;
	const errors: string[] = [];

	for (const slug of slugs) {
		try {
			await kvInvalidate(kv, publicProfileKey(slug));
			invalidated++;
		} catch (err) {
			errors.push(`Failed to invalidate "${slug}": ${err}`);
		}
	}

	return json({
		success: true,
		invalidated,
		errors: errors.length > 0 ? errors : undefined
	});
};