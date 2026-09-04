import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAPBOX_ACCESS_TOKEN } from '$env/static/private';
import {
	MIN_QUERY_LENGTH,
	buildSuggestUrl,
	parseSuggestItem,
	type VenueSuggestion
} from '$lib/searchbox';

export const GET: RequestHandler = async ({ url }) => {
	const query = (url.searchParams.get('q') ?? '').trim();
	const sessionToken =
		url.searchParams.get('session_token') ?? url.searchParams.get('sessionToken') ?? '';
	const typesParam = (url.searchParams.get('types') ?? 'venue').toLowerCase();
	// Short queries return empty without hitting Mapbox (3-char minimum preserved)
	if (!query || query.length < MIN_QUERY_LENGTH) {
		return json({ success: true, suggestions: [], features: [] });
	}

	if (!MAPBOX_ACCESS_TOKEN) {
		console.error('MAPBOX_ACCESS_TOKEN missing');
		return json(
			{ success: false, suggestions: [], features: [], error: 'Server misconfigured' },
			{ status: 500 }
		);
	}

	if (!sessionToken) {
		return json(
			{ success: false, suggestions: [], features: [], error: 'Missing session_token' },
			{ status: 400 }
		);
	}

	try {
		const types = typesParam === 'base' ? 'base' : 'venue';
		const mapboxUrl = buildSuggestUrl({
			baseUrl: 'https://api.mapbox.com',
			query,
			sessionToken,
			types,
			accessToken: MAPBOX_ACCESS_TOKEN
		});

		const res = await fetch(mapboxUrl);
		if (!res.ok) {
			const text = await res.text().catch(() => '');
			console.error('Mapbox suggest failed', res.status, text);
			return json(
				{ success: false, suggestions: [], features: [], error: 'Mapbox suggest failed' },
				{ status: 502 }
			);
		}
		const data = (await res.json()) as { suggestions?: Record<string, unknown>[] };
		const suggestions: VenueSuggestion[] = (data.suggestions ?? []).map(parseSuggestItem);

		// Provide both `suggestions` (canonical shape) and `features` (legacy
		// readers). ADR-0004 retires {text, place_name, center}: coordinates now
		// come via retrieve, so no `center` is sent — only the display fields
		// old callers need to keep rendering while they migrate.
		return json({
			success: true,
			suggestions,
			features: suggestions.map((s) => ({
				text: s.name,
				place_name: s.full_address || s.place_formatted
			}))
		});
	} catch (err) {
		console.error('Search API Error:', err);
		return json({ success: false, suggestions: [], features: [] }, { status: 500 });
	}
};
