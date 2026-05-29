import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAPBOX_ACCESS_TOKEN } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');

	if (!query || query.length < 3) {
		return json({ features: [] });
	}

	try {
		// We use the private token here
		const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&country=my&limit=5`;
		
		const res = await fetch(mapboxUrl);
		const data = await res.json();

		// We only send back the essential data to the frontend
		const features = data.features.map((f: any) => ({
			text: f.text,
			place_name: f.place_name,
			center: f.center // [lng, lat]
		}));

		return json({ success: true, features });
	} catch (err) {
		console.error('Search API Error:', err);
		return json({ success: false, features: [] }, { status: 500 });
	}
};