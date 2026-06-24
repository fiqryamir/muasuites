// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
		}
		interface PageData {
			session: Session | null;
		}
		// interface PageState {}
		// interface Platform {}
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
