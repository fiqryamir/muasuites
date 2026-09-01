import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAPBOX_ACCESS_TOKEN } from '$env/static/private'; // Secure private variable
import { retrieveVenueByMapboxId } from '$lib/server/mapbox';
import {
	deriveGeocodeVenueName,
	deriveVenueName,
	type VenueSource
} from '$lib/searchbox';

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

		// Normalize into VenueSource union — replaces Repeated Switches on raw strings
		const venueSource: VenueSource = mapboxId
			? { kind: 'mapbox', mapboxId, sessionToken: sessionToken ?? '' }
			: venue
				? { kind: 'geocode', query: venue }
				: { kind: 'none' };

		let destLng: number | undefined;
		let destLat: number | undefined;
		let venueName: string | undefined;
		let venueLat: number | undefined;
		let venueLng: number | undefined;

		if (venueSource.kind === 'mapbox') {
			if (!venueSource.sessionToken) {
				return json(
					{ success: false, error: 'Missing session_token for mapboxId retrieve' },
					{ status: 400 }
				);
			}
			const outcome = await retrieveVenueByMapboxId(
				venueSource.mapboxId,
				venueSource.sessionToken
			);
			if (!outcome.ok) {
				const message =
					outcome.status === 404 ? 'Selected place not found.' : 'Could not retrieve selected place.';
				return json({ success: false, error: message }, { status: outcome.status });
			}
			const r = outcome.result;
			destLng = r.lng;
			destLat = r.lat;
			venueLng = r.lng;
			venueLat = r.lat;
			venueName = deriveVenueName(r);
		} else if (venueSource.kind === 'geocode') {
			// Fallback path: geocode free-form string with country=my limit=1
			const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(venueSource.query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&country=my`;
			const geoRes = await fetch(geocodeUrl);
			if (!geoRes.ok) {
				const text = await geoRes.text().catch(() => '');
				console.error('Geocode fallback failed', geoRes.status, text);
				return json({ success: false, error: 'Failed to geocode venue.' }, { status: 502 });
			}
			const geoData = (await geoRes.json()) as {
				features?: { center: number[]; place_name?: string; text?: string }[];
			};

			if (!geoData.features || geoData.features.length === 0) {
				return json({ success: false, error: 'Destination address not found.' });
			}

			const destCoords = geoData.features[0].center; // [lng, lat]
			destLng = destCoords[0];
			destLat = destCoords[1];
			venueName = deriveGeocodeVenueName(geoData.features[0], venueSource.query);
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
