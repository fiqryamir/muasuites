import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { isRudeScraper, isScannerPath } from '$lib/bot-triage.server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// ---- Bot / scanner triage ----
	// Short-circuit BEFORE Supabase init and page rendering: rude scrapers get a
	// minimal response, scanner junk paths get an instant 404, with no app work.
	const userAgent = event.request.headers.get('user-agent') ?? '';
	if (isRudeScraper(userAgent)) {
		return new Response('Forbidden', { status: 403 });
	}

	const pathname = new URL(event.request.url).pathname;
	if (isScannerPath(pathname)) {
		return new Response(null, { status: 404 });
	}

	// Initialize a request-scoped Supabase client
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					// Path constraint keeps cookies isolated securely
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	// Helper to extract session data securely
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}
		return { session, user: session.user };
	};

	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			// Required to let SvelteKit serialize Supabase-specific headers safely
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	// ---- Edge Cache-Control Headers ----
	// Apply route-based caching strategy to reduce Supabase & Worker load.
	// IMPORTANT: Public routes with KV caching should NOT use s-maxage at the CDN edge
	// because Cloudflare free tier cannot purge CDN cache programmatically.
	// Without s-maxage, every request hits the Worker which reads from KV (fast, ~14ms).
	// KV-based invalidation (via DELETE) works instantly this way.

	// Static assets (fingerprinted by Vite — safe to cache forever)
	if (pathname.startsWith('/_app/')) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
		return response;
	}

	// Dashboard routes (authenticated — never cache)
	if (pathname.startsWith('/bookings') || pathname.startsWith('/settings') || pathname === '/login') {
		response.headers.set('Cache-Control', 'private, no-cache');
		return response;
	}

	// API routes (dynamic — avoid CDN caching)
	if (pathname.startsWith('/api/')) {
		response.headers.set('Cache-Control', 'no-cache');
		return response;
	}

	// Balance payment pages (public, largely static QR+amount — short CDN cache ok)
	if (pathname.startsWith('/pay/balance/')) {
		response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
		return response;
	}

	// Invite/booking pages (public token — short CDN cache, invalidation not critical here)
	if (pathname.match(/^\/[a-z0-9_]+\/[a-f0-9-]{36}$/)) {
		response.headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
		return response;
	}

	// Public MUA profile pages (the Instagram bio link — biggest traffic driver).
	// NOTE: No s-maxage here! We rely on KV cache (which we CAN invalidate) instead of CDN edge cache.
	// Every request hits the Worker, reads from KV (~14ms CPU), and renders fresh HTML.
	// Cache invalidation (via /api/cache/invalidate) deletes the KV key instantly.
	if (pathname.match(/^\/[a-z0-9_]+$/)) {
		response.headers.set('Cache-Control', 'public, no-cache');
		return response;
	}

	return response;
};