// /api/retrieve-location/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAPBOX_ACCESS_TOKEN } from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
	const mapboxId = url.searchParams.get('id') ?? url.searchParams.get('mapbox_id');
	if (!mapboxId) return json({ success: false, error: 'Missing id' }, { status: 400 });

	const sessionToken =
		url.searchParams.get('session_token') ?? url.searchParams.get('sessionToken') ?? '';

	try {
		const params = new URLSearchParams({
			access_token: MAPBOX_ACCESS_TOKEN
		});
		if (sessionToken) params.set('session_token', sessionToken);
		else params.set('session_token', crypto.randomUUID());

		const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?${params.toString()}`;

		const res = await fetch(retrieveUrl);
		if (!res.ok) {
			const text = await res.text().catch(() => '');
			console.error('Mapbox retrieve failed', res.status, text);
			return json(
				{ success: false, error: 'Retrieve failed' },
				{ status: res.status === 404 ? 404 : 502 }
			);
		}
		const data = await res.json();
		const feature = data.features?.[0];
		if (!feature) return json({ success: false, error: 'Not found' }, { status: 404 });

		const [lng, lat] = feature.geometry?.coordinates ?? [undefined, undefined];
		const props = feature.properties ?? feature;
		// Support both Search Box shape (properties) and legacy fallback
		const name: string = props.name ?? props.name_preferred ?? feature.name ?? '';
		const full_address: string = props.full_address ?? props.address ?? feature.place_name ?? '';
		const place_formatted: string = props.place_formatted ?? props.place ?? full_address;

		return json({
			success: true,
			lng,
			lat,
			name,
			full_address,
			place_formatted,
			feature_type: props.feature_type ?? props.feature ?? ''
		});
	} catch (err) {
		console.error('Retrieve error:', err);
		return json({ success: false }, { status: 500 });
	}
};
