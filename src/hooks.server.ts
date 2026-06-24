import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
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
	// Public routes get stale-while-revalidate; dashboard/API routes are private/no-cache.
	const url = new URL(event.request.url);
	const pathname = url.pathname;

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

	// API routes (dynamic — avoid CDN caching but allow browser cache for repeat visits)
	if (pathname.startsWith('/api/')) {
		response.headers.set('Cache-Control', 'no-cache');
		return response;
	}

	// Balance payment pages (public, largely static QR+amount — safe to cache 60s)
	if (pathname.startsWith('/pay/balance/')) {
		response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
		return response;
	}

	// Invite/booking pages (public token — short cache for day-slot freshness)
	if (pathname.match(/^\/[a-z0-9_]+\/[a-f0-9-]{36}$/)) {
		response.headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
		return response;
	}

	// Public MUA profile pages (the Instagram bio link — biggest traffic driver)
	if (pathname.match(/^\/[a-z0-9_]+$/)) {
		response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
		return response;
	}

	return response;
};
