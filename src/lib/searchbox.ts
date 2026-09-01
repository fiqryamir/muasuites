/**
 * Shared Search Box domain — single source for Venue Suggestion contracts,
 * Mapbox bias constants, and session helpers. Used by both client (+page.svelte,
 * TravelFeeField) and server (search-location, retrieve-location, estimate-travel,
 * booking checkout).
 *
 * This module gathers what was previously duplicated across 3 client components
 * and 4 server routes (Duplicated Code / Data Clumps / Primitive Obsession).
 */

export const MAPBOX_MY_PROXIMITY = '101.9758,4.2105';
export const MAPBOX_MY_COUNTRY = 'my';
export const MAPBOX_LANGUAGE = 'en';
export const MAPBOX_SUGGEST_LIMIT = 5;
export const SESSION_IDLE_MS = 10 * 60 * 1000;
export const MIN_QUERY_LENGTH = 3 as const;
export const BASE_LOCATION_TYPES = 'place,locality,postcode,district' as const;

export type SearchBoxTypes = 'venue' | 'base';

/** Venue Suggestion — canonical autocomplete result (replaces legacy {text,place_name,center}) */
export type VenueSuggestion = {
	mapbox_id: string;
	name: string;
	full_address: string;
	place_formatted: string;
	feature_type: string;
};

export type Coordinates = {
	lat: number;
	lng: number;
};

/**
 * VenueSelection — the Data Clump that previously travelled as 4 separate
 * fields (mapbox_id + venue_lat/lng + venue_full_address + session_token).
 * Hidden inputs still serialize separately for FormData, but server & client
 * now pass this bundled type where possible.
 */
export type VenueSelection = {
	mapboxId: string | null;
	fullAddress: string;
	coordinates: Coordinates | null;
	sessionToken: string;
};

/** Branded primitives to avoid Primitive Obsession on raw strings */
export type MapboxId = string & { readonly __brand: 'MapboxId' };
export type SessionToken = string & { readonly __brand: 'SessionToken' };

export type VenueSource =
	| { kind: 'mapbox'; mapboxId: string; sessionToken: string }
	| { kind: 'geocode'; query: string }
	| { kind: 'none' };

export type RetrieveResult = {
	lng: number;
	lat: number;
	name: string;
	full_address: string;
	place_formatted: string;
	feature_type: string;
};

export function generateSessionToken(): string {
	try {
		return crypto.randomUUID();
	} catch {
		return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	}
}

export function buildSuggestUrl(opts: {
	baseUrl: string;
	query: string;
	sessionToken: string;
	types: SearchBoxTypes;
	accessToken: string;
}): string {
	const proximity = MAPBOX_MY_PROXIMITY;
	const url =
		`${opts.baseUrl}/search/searchbox/v1/suggest?q=${encodeURIComponent(opts.query)}` +
		`&access_token=${opts.accessToken}` +
		`&session_token=${encodeURIComponent(opts.sessionToken)}` +
		`&proximity=${proximity}` +
		`&country=${MAPBOX_MY_COUNTRY}&language=${MAPBOX_LANGUAGE}&limit=${MAPBOX_SUGGEST_LIMIT}`;
	if (opts.types === 'base') return `${url}&types=${BASE_LOCATION_TYPES}`;
	return url;
}

export function buildRetrieveUrl(opts: {
	baseUrl: string;
	mapboxId: string;
	sessionToken: string;
	accessToken: string;
}): string {
	return `${opts.baseUrl}/search/searchbox/v1/retrieve/${encodeURIComponent(opts.mapboxId)}?access_token=${opts.accessToken}&session_token=${encodeURIComponent(opts.sessionToken)}`;
}

export function parseSuggestItem(s: Record<string, unknown>): VenueSuggestion {
	const rec = s as {
		mapbox_id: string;
		name: string;
		full_address?: string;
		place_formatted?: string;
		feature_type?: string;
		poi_category?: string[];
	};
	return {
		mapbox_id: rec.mapbox_id,
		name: rec.name,
		full_address: (rec.full_address ?? rec.place_formatted ?? '') as string,
		place_formatted: (rec.place_formatted ?? rec.full_address ?? '') as string,
		feature_type: (rec.feature_type ?? rec.poi_category?.[0] ?? '') as string
	};
}

export function parseRetrieveFeature(feature: Record<string, unknown>): RetrieveResult | null {
	if (!feature) return null;
	const f = feature as {
		geometry?: { coordinates?: number[] };
		properties?: Record<string, unknown>;
		name?: string;
		place_name?: string;
	};
	const coords = f.geometry?.coordinates;
	if (!coords || coords.length < 2) return null;
	const [lng, lat] = coords as [number, number];
	const props = (f.properties ?? f) as Record<string, unknown>;
	const name = (props.name as string) ?? (props.name_preferred as string) ?? (f.name as string) ?? '';
	const full_address =
		(props.full_address as string) ?? (props.address as string) ?? (f.place_name as string) ?? '';
	const place_formatted =
		(props.place_formatted as string) ?? (props.place as string) ?? full_address;
	const feature_type = (props.feature_type as string) ?? (props.feature as string) ?? '';
	return { lng, lat, name, full_address, place_formatted, feature_type };
}

export function deriveVenueName(retrieve: RetrieveResult): string {
	if (retrieve.full_address && retrieve.full_address.includes(',')) {
		return retrieve.full_address.split(',')[0].trim();
	}
	return retrieve.name || retrieve.full_address;
}

export function deriveGeocodeVenueName(feature: { place_name?: string; text?: string }, fallback: string): string {
	return feature.place_name?.split(',')[0]?.trim() || feature.text || fallback;
}
