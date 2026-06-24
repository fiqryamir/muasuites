import type { PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';

export const load: PageServerLoad = async ({ params, locals }) => {
	const supabase = locals.supabase;
	const token = params.token;

	// Fetch booking by balance_token (public — no auth needed)
	const { data: booking, error: err } = await supabase
		.from('bookings')
		.select('*, packages(*)')
		.eq('balance_token', token)
		.single();

	if (err || !booking) {
		error(404, 'Balance payment link not found or expired');
	}

	// Only CONFIRMED bookings can pay balance
	if (booking.status !== 'CONFIRMED') {
		if (booking.status === 'FULLY_PAID') {
			return { status: 'already_paid' as const, clientName: booking.client_name };
		}
		error(410, 'This booking cannot accept balance payment');
	}

	// Fetch MUA config separately (public page — need RLS to allow it)
	const { data: muaConfig } = await supabase
		.from('mua_configs')
		.select('duitnow_qr_url, studio_name')
		.eq('mua_id', booking.mua_id)
		.single();

	return {
		status: 'pending' as const,
		booking: {
			id: booking.id,
			clientName: booking.client_name,
			eventDate: booking.event_date,
			eventTime: booking.event_time,
			packageName: booking.packages?.name,
			packageEmoji: booking.packages?.emoji,
			totalAmount: booking.total_amount,
			depositAmount: booking.deposit_amount,
			balanceAmount: booking.balance_amount,
			duitnowQrUrl: muaConfig?.duitnow_qr_url || null,
			studioName: muaConfig?.studio_name || null,
			balanceDueDate: booking.balance_due_date || null
		}
	};
};

export const actions = {
	default: async ({ request, params, locals }) => {
		const supabase = locals.supabase;
		const token = params.token;

		const formData = await request.formData();
		const file = formData.get('receipt') as File | null;

		if (!file || file.size === 0) {
			return fail(400, { error: 'Please upload a receipt screenshot' });
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return fail(400, { error: 'Receipt must be a JPEG, PNG, or WebP image' });
		}

		// Get booking first
		const { data: booking, error: fetchErr } = await supabase
			.from('bookings')
			.select('id, status')
			.eq('balance_token', token)
			.single();

		if (fetchErr || !booking || booking.status !== 'CONFIRMED') {
			return fail(400, { error: 'Booking not found or not eligible for balance payment' });
		}

		// Upload receipt
		const ext = file.name.split('.').pop() || 'jpg';
		const fileName = `balance_${booking.id}_${Date.now()}.${ext}`;
		const { data: uploadData, error: uploadErr } = await supabase
			.storage
			.from('receipt-uploads')
			.upload(`receipts/${fileName}`, file, {
				contentType: file.type,
				cacheControl: '3600'
			});

		if (uploadErr) {
			return fail(500, { error: 'Failed to upload receipt. Please try again.' });
		}

		const { data: { publicUrl } } = supabase
			.storage
			.from('receipt-uploads')
			.getPublicUrl(`receipts/${fileName}`);

		// Call the RPC
		const { data: rpcResult, error: rpcErr } = await supabase
			.rpc('finalize_balance_payment', {
				p_booking_id: booking.id,
				p_receipt_url: publicUrl
			});

		if (rpcErr || !rpcResult?.success) {
			return fail(500, { error: 'Failed to process payment. Please contact the MUA.' });
		}

		return { success: true };
	}
};