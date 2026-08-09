// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
		}
		// interface PageState {}
		interface Platform {
			/** Cloudflare KV namespace for cached public profile data.
			 *  Bound via wrangler.jsonc `kv_namespaces[0].binding = "MUA_CACHE"`. */
			env: {
				MUA_CACHE: KVNamespace;
			};
		}
	}

	/** Cloudflare KV namespace interface (type-only, resolved at runtime). */
	interface KVNamespace {
		get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<string | null>;
		put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
		delete(key: string): Promise<void>;
	}

	/** A single booked time slot on a given date */
	interface DaySlot {
		time: string;
		clientName: string;
		packageName: string;
		packageEmoji: string;
		durationHours: number;
		bufferMinutes: number;
	}
}

export {};
