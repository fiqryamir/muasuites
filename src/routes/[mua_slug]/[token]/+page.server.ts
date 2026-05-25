import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabase } from '$lib/supabaseClient';
import { sendTelegramAlert } from '$lib/telegram.server';

export const load: PageServerLoad = async ({ params }) => {
	const { mua_slug, token } = params;

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

	// 5. Fetch Occupied Dates (Confirmed, Pending, or unexpired Checking out locks)
	const { data: bookings } = await supabase
		.from('bookings')
		.select('event_date, status, locked_at')
		.eq('mua_id', muaId)
		.gte('event_date', new Date().toISOString().split('T')[0]);

	const occupiedDates =
		bookings
			?.filter(
				(b) =>
					['CONFIRMED', 'PENDING_APPROVAL'].includes(b.status) ||
					(b.status === 'CHECKING_OUT' &&
						new Date(b.locked_at).getTime() > Date.now() - 10 * 60 * 1000)
			)
			.map((b) => b.event_date) || [];

	const disabledDates = new Set([
		...(blackouts?.map((b) => b.blackout_date) || []),
		...occupiedDates
	]);

	// 6. Dynamic Free-Tier Capacity Check
	if (mua.subscription_plan === 'FREE' && occupiedDates.length >= 2) {
		return { gateState: 'CAPACITY_PAUSED' };
	}

	// 7. Fetch Studio config details & ALL active packages for selection
	const { data: config } = await supabase
		.from('mua_configs')
		.select('studio_name, deposit_mode, deposit_value')
		.eq('mua_id', muaId)
		.single();

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
		disabledDates: Array.from(disabledDates),
		studioName: config?.studio_name || 'Makeup Studio',
		defaultConfig: config
	};
};

export const actions: Actions = {
	// Action A: Secures the lock with the bride's selected package & date
	secureSlot: async ({ request }) => {
		const formData = await request.formData();
		const muaId = formData.get('mua_id')?.toString();
		const inviteId = formData.get('invite_id')?.toString();
		const packageId = parseInt(formData.get('package_id')?.toString() || '');
		const eventDate = formData.get('event_date')?.toString() || '';
		const eventTime = formData.get('event_time')?.toString() || '08:00';
		const clientName = formData.get('client_name')?.toString().trim() || '';
		const clientPhone = formData.get('client_phone')?.toString().trim() || '';
		const venueAddress = formData.get('venue_address')?.toString().trim() || '';
		const totalAmount = parseFloat(formData.get('total_amount')?.toString() || '0');
		const depositAmount = parseFloat(formData.get('deposit_amount')?.toString() || '0');
		const balanceAmount = parseFloat(formData.get('balance_amount')?.toString() || '0');

		// Run the concurrency safety check and lock database slot
		const { data: rpcResult, error: rpcError } = await supabase.rpc('secure_checkout_slot', {
			p_mua_id: muaId,
			p_invite_id: inviteId,
			p_package_id: packageId,
			p_event_date: eventDate,
			p_event_time: eventTime + ':00',
			p_client_name: clientName,
			p_client_phone: clientPhone,
			p_venue_address: venueAddress,
			p_total_amount: totalAmount,
			p_deposit_amount: depositAmount,
			p_balance_amount: balanceAmount
		});

		if (rpcError || !rpcResult.success) {
			console.error(rpcError);
			return fail(400, {
				error:
					rpcResult?.error ||
					'This date has just been locked by another client. Please select another date.'
			});
		}

		// Fetch payment transfer details once lock is securely held
		const { data: bankConfig } = await supabase
			.from('mua_configs')
			.select('studio_name, whatsapp_number, telegram_chat_id, duitnow_qr_url')
			.eq('mua_id', muaId)
			.single();

		return {
			success: true,
			bookingId: rpcResult.booking_id,
			bankConfig
		};
	},

	// Action B: Finalizes receipt submission
	submitReceipt: async ({ request }) => {
		const formData = await request.formData();
		const bookingId = formData.get('booking_id')?.toString();
		const inviteId = formData.get('invite_id')?.toString();
		const receiptFile = formData.get('receipt') as File;

		if (!receiptFile || receiptFile.size === 0) {
			return fail(400, { error: 'Please attach a payment receipt/screenshot.' });
		}

		// 1. Upload screenshot to bucket
		const fileExt = receiptFile.name.split('.').pop();
		const filePath = `receipts/${bookingId}_${Date.now()}.${fileExt}`;

		const { error: uploadError } = await supabase.storage
			.from('receipt-uploads')
			.upload(filePath, receiptFile);

		if (uploadError) {
			return fail(500, { error: 'Failed to upload receipt screenshot.' });
		}

		// Retrieve Public URL
		const {
			data: { publicUrl }
		} = supabase.storage.from('receipt-uploads').getPublicUrl(filePath);

		// 2. Call our secure transition RPC to commit status changes
		const { data: rpcResult, error: rpcError } = await supabase.rpc('finalize_receipt_submission', {
			p_booking_id: bookingId,
			p_invite_id: inviteId,
			p_receipt_url: publicUrl
		});

		if (rpcError || !rpcResult?.success) {
			console.error('Finalize receipt transaction failed:', rpcError, rpcResult?.error);
			return fail(500, { error: rpcResult?.error || 'Failed to finalize transaction.' });
		}

		console.log(rpcResult);

		// 3. Extract the metadata returned by our RPC to dispatch the Telegram Alert
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
• Service: ${pkg?.emoji} ${pkg?.name}
• Total Cost: <b>RM ${booking.total_amount}</b>
• Paid Deposit: <b>RM ${booking.deposit_amount}</b>
• Balance Due: <b>RM ${booking.balance_amount}</b>

<a href="${publicUrl}">👉 Click here to inspect the transfer receipt screenshot</a>
			`;

			// Send notification asynchronously
			sendTelegramAlert(config.telegram_chat_id, telegramMessage.trim());
		}

		return { success: true };
	}
};
