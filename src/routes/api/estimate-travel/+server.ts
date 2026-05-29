import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAPBOX_ACCESS_TOKEN } from '$env/dynamic/private'; // Secure private variable

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { venue, baseLat, baseLng, ratePerKm } = await request.json();

        if (!venue || !baseLat || !baseLng) {
            throw error(400, 'Missing required parameters.');
        }

        // 1. Geocode Destination Address securely
        const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(venue)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&country=my`;
        const geoRes = await fetch(geocodeUrl);
        const geoData = await geoRes.json();

        if (!geoData.features || geoData.features.length === 0) {
            return json({ success: false, error: 'Destination address not found.' });
        }

        const destCoords = geoData.features[0].center; // [lng, lat]
        const destLng = destCoords[0];
        const destLat = destCoords[1];
        const venueName = geoData.features[0].place_name.split(',')[0];

        // 2. Query Driving Directions securely
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${baseLng},${baseLat};${destLng},${destLat}?access_token=${MAPBOX_ACCESS_TOKEN}&overview=false`;
        const dirRes = await fetch(directionsUrl);
        const dirData = await dirRes.json();

        if (!dirData.routes || dirData.routes.length === 0) {
            return json({ success: false, error: 'Could not compute a driving route to this venue.' });
        }

        const distanceMeters = dirData.routes[0].distance;
        const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));
        const computedFee = parseFloat((distanceKm * ratePerKm).toFixed(2));

        return json({
            success: true,
            distanceKm,
            computedFee,
            venueName
        });
    } catch (err: any) {
        console.error('Server Mapbox API error:', err);
        return json({ success: false, error: 'Server estimation failure.' });
    }
};