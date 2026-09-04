import { z } from 'zod';

export const secureSlotSchema = z.object({
	mua_id: z.string().uuid({ message: 'Invalid identity identifier.' }),
	invite_id: z.string().uuid({ message: 'Invalid invitation identifier.' }).nullable().optional(),
	package_id: z.coerce
		.number()
		.int()
		.positive({ message: 'Please select an active makeup package.' }),
	event_date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please select a valid event date.' }),
	event_time: z
		.string()
		.regex(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'Please enter a valid target ready time.' }),
	client_name: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
	client_phone: z.string().regex(/^(601)[0-9]{8,10}$/, {
		message: 'Please enter a valid Malaysian mobile number.'
	}),
	venue_address: z
		.string()
		.min(5, { message: 'Please provide a more complete venue location address.' }),
	total_amount: z.coerce.number().nonnegative(),
	deposit_amount: z.coerce.number().nonnegative(),
	balance_amount: z.coerce.number().nonnegative(),
	// Canonical venue fields from Search Box retrieve (optional, persisted post-RPC)
	// Empty string from hidden input should be treated as null, not 0
	venue_lat: z.preprocess(
		(v) => (v === '' || v == null ? null : v),
		z.coerce.number().min(-90).max(90).optional().nullable()
	),
	venue_lng: z.preprocess(
		(v) => (v === '' || v == null ? null : v),
		z.coerce.number().min(-180).max(180).optional().nullable()
	),
	venue_full_address: z.string().optional().nullable(),
	mapbox_id: z.string().optional().nullable(),
	// Mapbox Search Box billing token pairing this checkout's suggest→retrieve
	// (Mapbox API `session_token`). Distinct from the Booking Link Token
	// (CONTEXT.md) — never used for auth, only so the pair is billed as one.
	session_token: z.string().optional().nullable()
});

/** Schema for validating invite generator form fields */
export const inviteGeneratorSchema = z.object({
	transportOverride: z.coerce.number().nonnegative('Transport fee must be 0 or more.'),
	customSurcharge: z.coerce.number().nonnegative('Surcharge must be 0 or more.'),
	surchargeRemark: z.string().optional(),
	depositValueOverride: z.coerce.number().positive('Must be greater than 0.').nullable().optional(),
	bufferMinutesOverride: z.coerce
		.number()
		.int()
		.min(0, 'Buffer must be 0 or more.')
		.max(120, 'Buffer cannot exceed 120 minutes.')
		.nullable()
		.optional()
});

/** Schema for validating the settings / onboarding profile form fields */
export const configSchema = z.object({
	slug: z
		.string()
		.min(3, 'Handle must be at least 3 characters.')
		.max(20, 'Handle must be 20 characters or less.')
		.regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores.'),
	studioName: z.string().min(2, 'Studio name must be at least 2 characters.'),
	whatsappNumber: z
		.string()
		.regex(/^(601)[0-9]{8,10}$/, 'Valid Malaysian format required (e.g. 60123456789).'),
	depositValue: z.number().nonnegative('Deposit cannot be negative.'),
	telegramChatId: z.string().optional()
});

/** Schema for validating the package add form fields */
export const packageSchema = z.object({
	pkgEmoji: z.string().emoji('Enter a single emoji.'),
	pkgName: z.string().min(3, 'Name must be at least 3 characters.'),
	pkgPrice: z.number().positive('Price must be greater than RM 0.')
});

/** Shape of a package row as rendered by the shared package form */
export interface PackageRow {
	id: number;
	name: string;
	price: number | string;
	emoji: string;
	duration_hours?: number | string;
}
