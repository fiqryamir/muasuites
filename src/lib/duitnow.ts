import type { SupabaseClient } from '@supabase/supabase-js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Uploads the MUA's DuitNow QR code to the `qr-codes` bucket at
 * `${userId}/duitnow_qr.<ext>` (upsert) and returns the public URL.
 * Throws an Error with a user-facing message on invalid type or upload failure.
 */
export async function uploadDuitNowQr(
	supabase: SupabaseClient,
	userId: string,
	file: File
): Promise<string> {
	if (!ALLOWED_MIME_TYPES.includes(file.type)) {
		throw new Error('Please upload a PNG, JPG, or WebP file.');
	}

	const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
	const path = `${userId}/duitnow_qr.${ext}`;

	const { error: uploadErr } = await supabase.storage
		.from('qr-codes')
		.upload(path, file, { upsert: true, contentType: file.type });

	if (uploadErr) {
		throw new Error('Upload failed: ' + uploadErr.message);
	}

	const { data } = supabase.storage.from('qr-codes').getPublicUrl(path);
	return data.publicUrl;
}
