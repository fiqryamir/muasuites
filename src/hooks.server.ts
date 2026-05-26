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

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			// Required to let SvelteKit serialize Supabase-specific headers safely
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};