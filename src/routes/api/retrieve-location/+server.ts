// /api/retrieve-location/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { retrieveVenueByMapboxId } from '$lib/server/mapbox';

export const GET: RequestHandler = async ({ url }) => {
	const mapboxId = url.searchParams.get('id') ?? url.searchParams.get('mapbox_id');
	if (!mapboxId) return json({ success: false, error: 'Missing id' }, { status: 400 });

	const sessionToken =
		url.searchParams.get('session_token') ?? url.searchParams.get('sessionToken') ?? '';

	if (!sessionToken) {
		return json({ success: false, error: 'Missing session_token' }, { status: 400 });
	}

	try {
		const outcome = await retrieveVenueByMapboxId(mapboxId, sessionToken);
		if (!outcome.ok) {
			return json(
				{ success: false, error: outcome.error },
				{ status: outcome.status }
			);
		}
		const { lng, lat, name, full_address, place_formatted, feature_type } = outcome.result;
		return json({
			success: true,
			lng,
			lat,
			name,
			full_address,
			place_formatted,
			feature_type
		});
	} catch (err) {
		console.error('Retrieve error:', err);
		return json({ success: false }, { status: 500 });
	}
};
