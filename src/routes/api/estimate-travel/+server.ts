import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAPBOX_ACCESS_TOKEN } from '$env/static/private'; // Secure private variable

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Support both camelCase and snake_case keys for backward compat
		const venue: string | undefined = body.venue ?? body.venue_address ?? body.venueAddress;
		const mapboxId: string | undefined = body.mapboxId ?? body.mapbox_id ?? body.mapboxID;
		const sessionToken: string | undefined =
			body.session_token ?? body.sessionToken ?? body.session_token_override;
		const baseLat = body.baseLat ?? body.base_lat;
		const baseLng = body.baseLng ?? body.base_lng;
		const ratePerKm = body.ratePerKm ?? body.rate_per_km ?? body.rate;

		if ((!venue && !mapboxId) || baseLat == null || baseLng == null) {
			throw error(400, 'Missing required parameters.');
		}

		let destLng: number | undefined;
		let destLat: number | undefined;
		let venueName: string | undefined;
		let venueLat: number | undefined;
		let venueLng: number | undefined;

		if (mapboxId) {
			if (!sessionToken) {
				return json(
					{ success: false, error: 'Missing session_token for mapboxId retrieve' },
					{ status: 400 }
				);
			}
			// Preferred path: retrieve via Search Box using forwarded session_token
			const params = new URLSearchParams({
				access_token: MAPBOX_ACCESS_TOKEN,
				session_token: sessionToken
			});

			const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?${params.toString()}`;
			const retrieveRes = await fetch(retrieveUrl);

			if (!retrieveRes.ok) {
				const text = await retrieveRes.text().catch(() => '');
				console.error('Retrieve for estimate failed', retrieveRes.status, text);
				return json(
					{ success: false, error: 'Could not retrieve selected place.' },
					{ status: retrieveRes.status === 404 ? 404 : 502 }
				);
			}

			const retrieveData = await retrieveRes.json();
			const feature = retrieveData.features?.[0];
			if (!feature?.geometry?.coordinates) {
				return json({ success: false, error: 'Selected place not found.' });
			}

			const [lng, lat] = feature.geometry.coordinates;
			destLng = lng;
			destLat = lat;
			venueLng = lng;
			venueLat = lat;

			const props = feature.properties ?? feature;
			const fullAddress: string =
				props.full_address ?? props.address ?? feature.place_name ?? props.name ?? '';
			const name: string = props.name ?? props.name_preferred ?? feature.name ?? fullAddress;
			// venueName prefers first segment of full_address for POIs
			if (fullAddress && fullAddress.includes(',')) {
				venueName = fullAddress.split(',')[0].trim();
			} else {
				venueName = name || fullAddress;
			}
		} else if (venue) {
			// Fallback path: geocode free-form string with country=my limit=1
			const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(venue)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&country=my`;
			const geoRes = await fetch(geocodeUrl);
			if (!geoRes.ok) {
				const text = await geoRes.text().catch(() => '');
				console.error('Geocode fallback failed', geoRes.status, text);
				return json({ success: false, error: 'Failed to geocode venue.' }, { status: 502 });
			}
			const geoData = await geoRes.json();

			if (!geoData.features || geoData.features.length === 0) {
				return json({ success: false, error: 'Destination address not found.' });
			}

			const destCoords = geoData.features[0].center; // [lng, lat]
			destLng = destCoords[0];
			destLat = destCoords[1];
			venueName =
				geoData.features[0].place_name?.split(',')[0]?.trim() || geoData.features[0].text || venue;
		}

		if (destLng == null || destLat == null) {
			return json({ success: false, error: 'Could not resolve venue coordinates.' });
		}

		// 2. Query Driving Directions securely
		const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${baseLng},${baseLat};${destLng},${destLat}?access_token=${MAPBOX_ACCESS_TOKEN}&overview=false`;
		const dirRes = await fetch(directionsUrl);
		if (!dirRes.ok) {
			const text = await dirRes.text().catch(() => '');
			console.error('Directions failed', dirRes.status, text);
			return json({ success: false, error: 'Could not compute a driving route to this venue.' });
		}
		const dirData = await dirRes.json();

		if (!dirData.routes || dirData.routes.length === 0) {
			return json({ success: false, error: 'Could not compute a driving route to this venue.' });
		}

		const distanceMeters = dirData.routes[0].distance;
		const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));
		const computedFee = parseFloat((distanceKm * Number(ratePerKm ?? 0)).toFixed(2));

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const response: Record<string, any> = {
			success: true,
			distanceKm,
			computedFee,
			venueName
		};
		if (venueLat != null && venueLng != null) {
			response.venueLat = venueLat;
			response.venueLng = venueLng;
		}

		return json(response);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (err: any) {
		console.error('Server Mapbox API error:', err);
		// If err is a SvelteKit HttpError, rethrow
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if ((err as any)?.status) throw err;
		return json({ success: false, error: 'Server estimation failure.' });
	}
};
