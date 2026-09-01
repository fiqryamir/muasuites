import { MAPBOX_ACCESS_TOKEN } from '$env/static/private';
import {
	buildRetrieveUrl,
	parseRetrieveFeature,
	type RetrieveResult
} from '$lib/searchbox';

const MAPBOX_BASE = 'https://api.mapbox.com';

export type RetrieveSuccess = { ok: true; result: RetrieveResult };
export type RetrieveFailure = { ok: false; status: number; error: string };
export type RetrieveOutcome = RetrieveSuccess | RetrieveFailure;

/**
 * Single place that knows how to call Search Box retrieve and parse the
 * feature — replaces duplicated fetch + geometry/props branching in
 * estimate-travel, retrieve-location, and booking checkout.
 */
export async function retrieveVenueByMapboxId(
	mapboxId: string,
	sessionToken: string
): Promise<RetrieveOutcome> {
	if (!mapboxId) return { ok: false, status: 400, error: 'Missing mapboxId' };
	if (!sessionToken) return { ok: false, status: 400, error: 'Missing session_token' };

	const url = buildRetrieveUrl({
		baseUrl: MAPBOX_BASE,
		mapboxId,
		sessionToken,
		accessToken: MAPBOX_ACCESS_TOKEN
	});

	const res = await fetch(url);
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		console.error('Mapbox retrieve failed', res.status, text);
		return {
			ok: false,
			status: res.status === 404 ? 404 : 502,
			error: res.status === 404 ? 'Not found' : 'Retrieve failed'
		};
	}
	const data = (await res.json()) as { features?: unknown[] };
	const feature = (data.features?.[0] ?? null) as Record<string, unknown> | null;
	if (!feature) return { ok: false, status: 404, error: 'Not found' };

	const parsed = parseRetrieveFeature(feature);
	if (!parsed) return { ok: false, status: 404, error: 'Missing coordinates' };

	return { ok: true, result: parsed };
}
