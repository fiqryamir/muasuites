// /api/retrieve-location/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MAPBOX_ACCESS_TOKEN } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
    const mapboxId = url.searchParams.get('id');
    if (!mapboxId) return json({ success: false }, { status: 400 });

    try {
        const res = await fetch(
            `https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?access_token=${MAPBOX_ACCESS_TOKEN}&session_token=mua-suites`,
        );
        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) return json({ success: false, error: 'Not found' }, { status: 404 });

        const [lng, lat] = feature.geometry.coordinates;
        return json({ success: true, lng, lat });
    } catch (err) {
        console.error('Retrieve error:', err);
        return json({ success: false }, { status: 500 });
    }
};