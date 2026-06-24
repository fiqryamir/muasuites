import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { secureSlotSchema } from '$lib/schemas';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { mua_slug, token } = params;
	const { supabase } = locals; // Grab our request-scoped client

	// 1. Fetch Invite Record
	const { data: invite, error: inviteError } = await supabase
		.from('invites')
		.select('*')
		.eq('token', token)
		.single();

	if (inviteError || !invite) {
		throw error(404, 'Invalid booking invitation link.');
	}

	const muaId = invite.mua_id;

	// 2. Fetch the MUA profile associated with the invite
	const { data: mua, error: muaError } = await supabase
		.from('muas')
		.select('id, slug, subscription_plan')
		.eq('id', muaId)
		.single();

	if (muaError || !mua || mua.slug !== mua_slug) {
		throw error(404, 'Invalid booking invitation link handle.');
	}

	// 3. Expiration and Usage checks
	if (invite.is_used) {
		return { gateState: 'USED' };
	}
	if (new Date() > new Date(invite.expires_at)) {
		return { gateState: 'EXPIRED' };
	}

	// 4. Fetch Explicit Blackout Dates set by MUA
	const { data: blackouts } = await supabase
		.from('blackout_dates')
		.select('blackout_date')
		.eq('mua_id', muaId);

	// 5. Fetch Studio config details (needed before daySlots for buffer)
	const { data: config } = await supabase
		.from('mua_configs')
		.select('studio_name, deposit_mode, duitnow_qr_url, whatsapp_number, deposit_value, working_hours_start, working_hours_end, default_buffer_minutes')
		.eq('mua_id', muaId)
		.single();

	// 6. Check if this invite has an active CHECKING_OUT booking (for timer resume)
	const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

	const { data: activeCheckout } = await supabase
		.from('bookings')
		.select('id, locked_at')
		.eq('invite_id', invite.id)
		.eq('status', 'CHECKING_OUT')
		.gt('locked_at', tenMinutesAgo)
		.single();

	let checkoutResume: {
		bookingId: string;
		secondsRemaining: number;
	} | null = null;

	if (activeCheckout) {
		const lockedAt = new Date(activeCheckout.locked_at).getTime();
		const elapsed = Math.floor((Date.now() - lockedAt) / 1000);
		const remaining = Math.max(600 - elapsed, 0);
		checkoutResume = {
			bookingId: activeCheckout.id,
			secondsRemaining: remaining
		};
	}

	// 7. Query active bookings grouped by date as daySlots (skip this invite's CHECKING_OUT)
	const { data: bookings } = await supabase
		.from('bookings')
		.select('event_date, event_time, status, locked_at, invite_id, client_name, packages!inner(name, emoji, duration_hours), invites!inner(buffer_minutes_override)')
		.eq('mua_id', muaId)
		.gte('event_date', new Date().toISOString().split('T')[0])
		.or(`status.in.("CONFIRMED","FULLY_PAID","PENDING_APPROVAL"),and(status.eq.CHECKING_OUT,locked_at.gt.${tenMinutesAgo})`);

	const defaultBuffer = config?.default_buffer_minutes ?? 0;

	// Group into daySlots, self-excluding this invite's own CHECKING_OUT
	const daySlots: Record<string, DaySlot[]> = {};
	for (const b of bookings || []) {
		// Self-exclusion: skip this invite's own CHECKING_OUT session
		if (b.status === 'CHECKING_OUT' && b.invite_id === invite.id) {
			continue;
		}
		const dateKey = b.event_date;
		if (!daySlots[dateKey]) daySlots[dateKey] = [];
		daySlots[dateKey].push({
			time: b.event_time?.slice(0, 5) || '00:00',
			clientName: '',
			packageName: b.packages?.name || '',
			packageEmoji: b.packages?.emoji || '💄',
			durationHours: b.packages?.duration_hours || 3.0,
			bufferMinutes: b.invites?.buffer_minutes_override ?? defaultBuffer
		});
	}

	// Capacity blockers count (for free-tier check) — same self-exclusion
	const capacityBlockers = bookings?.filter((b: any) => {
		if (b.status === 'CHECKING_OUT' && b.invite_id === invite.id) {
			return false;
		}
		return true;
	}) || [];

	const blackoutDateSet = new Set(blackouts?.map((b: any) => b.blackout_date) || []);

	// 7. Dynamic Free-Tier Capacity Check
	if (mua.subscription_plan === 'FREE' && capacityBlockers.length >= 2) {
		return { gateState: 'CAPACITY_PAUSED' };
	}

	// 8. Fetch ALL active packages for selection
	const { data: packages } = await supabase
		.from('packages')
		.select('*')
		.eq('mua_id', muaId)
		.eq('is_active', true)
		.order('price', { ascending: true });

	return {
		gateState: 'ACTIVE',
		muaSlug: mua_slug,
		token,
		invite,
		packages: packages || [],
		daySlots,
		blackoutDates: Array.from(blackoutDateSet),
		studioName: config?.studio_name || 'Makeup Studio',
		defaultConfig: config,
		workingHoursStart: config?.working_hours_start?.slice(0, 5) || '08:00',
		workingHoursEnd: config?.working_hours_end?.slice(0, 5) || '18:00',
		defaultBufferMinutes: config?.default_buffer_minutes ?? 0,
		checkoutResume
	};
};

export const actions: Actions = {
	secureSlot: async ({ request, locals, platform, params }) => {
		const { supabase } = locals;
		const formData = await request.formData();

		// Convert FormData entries directly into a structured object
		const payload = Object.fromEntries(formData.entries());

		// Parse payload against Zod Schema
		const validation = secureSlotSchema.safeParse(payload);

		if (!validation.success) {
			// Extract field errors and return them to the UI
			const fieldErrors = validation.error.flatten().fieldErrors;
			return fail(400, { validationErrors: fieldErrors });
		}

		const data = validation.data;

		// Run Database Transaction with safe, validated variables
		const { data: rpcResult, error: rpcError } = await supabase.rpc('secure_checkout_slot', {
			p_mua_id: data.mua_id,
			p_invite_id: data.invite_id || null,
			p_package_id: data.package_id,
			p_event_date: data.event_date,
			p_event_time: data.event_time,
			p_client_name: data.client_name,
			p_client_phone: data.client_phone,
			p_venue_address: data.venue_address,
			p_total_amount: data.total_amount,
			p_deposit_amount: data.deposit_amount,
			p_balance_amount: data.balance_amount
		});

		if (rpcError) {
			console.error('secure_checkout_slot Database Exception:', rpcError);
			return fail(500, { error: 'A system database exception occurred. Please try again.' });
		}

		if (!rpcResult?.success) {
			const errorMapping: Record<string, string> = {
				'INVITE_NOT_FOUND': 'Your invitation details could not be found.',
				'INVITE_ALREADY_USED': 'This invitation link has already been used.',
				'INVITE_EXPIRED': 'This invitation link has expired.',
				'MUA_CAPACITY_EXCEEDED': 'The MUA has temporarily reached their booking capacity limit.',
				'DATE_ALREADY_TAKEN': 'This date has just been locked by another client.',
				'TIME_SLOT_CONFLICT': 'This time slot overlaps with an existing booking. Please choose a different time.',
				'BEFORE_WORKING_HOURS': rpcResult.message || 'The selected time is before the MUA\'s working hours.',
				'AFTER_WORKING_HOURS': rpcResult.message || 'The booking would extend past the MUA\'s working hours.',
				'PACKAGE_NOT_FOUND': 'The selected package could not be found.'
			};
			return fail(400, { error: errorMapping[rpcResult?.error] || 'This slot is unavailable.' });
		}

		const { data: bankConfig } = await supabase
			.from('mua_configs')
			.select('studio_name, whatsapp_number, duitnow_qr_url')
			.eq('mua_id', data.mua_id)
			.single();

		// ---- Cache Invalidation ----
		// A CHECKING_OUT booking was created (slot locked for 10 minutes).
		// Invalidate the public profile cache so the slot shows as occupied immediately.
		if (params?.mua_slug) {
			const { publicProfileKey, kvInvalidate } = await import('$lib/cache.server');
			const kv = platform?.env?.MUA_CACHE;
			await kvInvalidate(kv, publicProfileKey(params.mua_slug));
		}

		return {
			success: true,
			bookingId: rpcResult.booking_id,
			bankConfig
		};
	},

	submitReceipt: async ({ request, locals, platform, params }) => {
		const { supabase } = locals;
		const formData = await request.formData();
		const bookingId = formData.get('booking_id')?.toString();
		const inviteId = formData.get('invite_id')?.toString();
		const receiptFile = formData.get('receipt') as File;

		// 1. Strict Validation
		if (!receiptFile || receiptFile.size === 0) {
			return fail(400, { error: 'Please attach a payment receipt/screenshot.' });
		}

		const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowedMimeTypes.includes(receiptFile.type)) {
			return fail(400, { error: 'Invalid file type. Only JPEG, PNG, or WebP screenshots are allowed.' });
		}

		// Extract safe file extension mapping
		const mimeToExt: Record<string, string> = {
			'image/jpeg': 'jpg',
			'image/png': 'png',
			'image/webp': 'webp'
		};
		const fileExt = mimeToExt[receiptFile.type] || 'jpg';
		const filePath = `receipts/${bookingId}_${Date.now()}.${fileExt}`;

		// 2. Upload screenshot to bucket
		const { error: uploadError } = await supabase.storage
			.from('receipt-uploads')
			.upload(filePath, receiptFile, {
				contentType: receiptFile.type,
				cacheControl: '3600'
			});

		if (uploadError) {
			return fail(500, { error: 'Failed to upload receipt screenshot.' });
		}

		// Retrieve URL
		const { data: { publicUrl } } = supabase.storage.from('receipt-uploads').getPublicUrl(filePath);

		// 3. Call secure transition RPC to commit status changes
		const { data: rpcResult, error: rpcError } = await supabase.rpc('finalize_receipt_submission', {
			p_booking_id: bookingId,
			p_invite_id: inviteId,
			p_receipt_url: publicUrl
		});

		if (rpcError || !rpcResult?.success) {
			console.error('Finalize receipt transaction failed:', rpcError, rpcResult?.error);
			return fail(500, { error: rpcResult?.error || 'Failed to finalize transaction.' });
		}

		// 4. Safe server-side processing of notifications
		const metadata = rpcResult;
		const booking = metadata.booking;
		const pkg = metadata.package;
		const config = metadata.config;

		if (config?.telegram_chat_id) {
			const telegramMessage = `
<b>New Booking Payment Pending Review!</b> 🎉

<b>Client Details:</b>
• Bride Name: <u>${booking.client_name || 'N/A'}</u>
• WhatsApp: <a href="https://wa.me/${booking.client_phone}">wa.me/${booking.client_phone}</a>

<b>Event Details:</b>
• Date: <b>${booking.event_date}</b>
• Target Ready Time: <b>${booking.event_time}</b>
• Venue: <i>${booking.venue_address || 'N/A'}</i>

<b>Financial Breakdown:</b>
• Service: ${pkg?.emoji || '💄'} ${pkg?.name || 'Package'}
• Total Cost: <b>RM ${booking.total_amount}</b>
• Paid Deposit: <b>RM ${booking.deposit_amount}</b>
• Balance Due: <b>RM ${booking.balance_amount}</b>

<a href="${publicUrl}">👉 Click here to inspect the transfer receipt screenshot</a>
			`;

			// We await the delivery to guarantee completion under serverless runtimes
			const { sendTelegramAlert } = await import('$lib/telegram.server');
			await sendTelegramAlert(config.telegram_chat_id, telegramMessage.trim());
		}

		// ---- Cache Invalidation ----
		// A new booking has been created (CHECKING_OUT → PENDING_APPROVAL).
		// Invalidate the public profile cache so the day slot shows as occupied.
		if (params?.mua_slug) {
			const { publicProfileKey, kvInvalidate } = await import('$lib/cache.server');
			const kv = platform?.env?.MUA_CACHE;
			await kvInvalidate(kv, publicProfileKey(params.mua_slug));
		}

		return { success: true };
	}
};