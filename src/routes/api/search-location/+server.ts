import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAPBOX_ACCESS_TOKEN } from '$env/static/private';

const MY_PROXIMITY = '101.9758,4.2105';

export const GET: RequestHandler = async ({ url }) => {
	const query = (url.searchParams.get('q') ?? '').trim();
	const sessionToken =
		url.searchParams.get('session_token') ?? url.searchParams.get('sessionToken') ?? '';
	const typesParam = (url.searchParams.get('types') ?? 'venue').toLowerCase();
	// Short queries return empty without hitting Mapbox (3-char minimum preserved)
	if (!query || query.length < 3) {
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
		const tokenForMapbox = sessionToken;

		let mapboxUrl =
			`https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}` +
			`&access_token=${MAPBOX_ACCESS_TOKEN}` +
			`&session_token=${encodeURIComponent(tokenForMapbox)}` +
			`&proximity=${MY_PROXIMITY}` +
			`&country=my&language=en&limit=5`;

		// Base Location restricts to administrative types; Venue allows all (POI/address/place)
		if (typesParam === 'base') {
			mapboxUrl += `&types=place,locality,postcode,district`;
		}
		// venue => no types param (allow poi/address/street/place)

		const res = await fetch(mapboxUrl);
		if (!res.ok) {
			const text = await res.text().catch(() => '');
			console.error('Mapbox suggest failed', res.status, text);
			return json(
				{ success: false, suggestions: [], features: [], error: 'Mapbox suggest failed' },
				{ status: 502 }
			);
		}
		const data = await res.json();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const suggestions = (data.suggestions ?? []).map((s: any) => ({
			mapbox_id: s.mapbox_id,
			name: s.name,
			full_address: s.full_address ?? s.place_formatted ?? '',
			place_formatted: s.place_formatted ?? s.full_address ?? '',
			feature_type: s.feature_type ?? s.poi_category?.[0] ?? ''
		}));

		// Provide both `suggestions` (new shape) and `features` (legacy empty) for backward compat
		return json({
			success: true,
			suggestions,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			features: suggestions.map((s: any) => ({
				text: s.name,
				place_name: s.full_address || s.place_formatted,
				center: undefined
			}))
		});
	} catch (err) {
		console.error('Search API Error:', err);
		return json({ success: false, suggestions: [], features: [] }, { status: 500 });
	}
};
