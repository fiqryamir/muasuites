// Re-sends a magic link for the post-flip end-to-end click test, redirected to production.
// Retries on 429 (per-IP bucket refills ~1 token/10s). No user creation (create_user: false).
// Run: node .scratch/email-bombing-protection/resend-magic-link.mjs <email> <redirectUrl>
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const env = Object.fromEntries(
	readFileSync(resolve(ROOT, '.env'), 'utf8')
		.split(/\r?\n/)
		.filter((l) => l.includes('=') && !l.trim().startsWith('#'))
		.map((l) => {
			const i = l.indexOf('=');
			return [
				l.slice(0, i).trim(),
				l
					.slice(i + 1)
					.trim()
					.replace(/^"|"$/g, '')
			];
		})
);

const url = env.PUBLIC_SUPABASE_URL;
const anon = env.PUBLIC_SUPABASE_ANON_KEY;
const email = process.argv[2] || 'mfiqry9907@gmail.com';
const redirect = process.argv[3] || 'https://muasuite.com/login';

const headers = { apikey: anon, 'Content-Type': 'application/json' };

for (let attempt = 1; attempt <= 12; attempt++) {
	const res = await fetch(`${url}/auth/v1/otp`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ email, create_user: false, options: { emailRedirectTo: redirect } })
	});
	const json = await res.json().catch(() => null);
	console.log(`attempt ${attempt}: ${res.status} ${json?.error_code || json?.message || 'ok'}`);
	if (res.status === 200 || res.status === 422) process.exit(0);
	if (res.status === 429) await new Promise((r) => setTimeout(r, 15000));
}
console.error('still throttled after 12 attempts');
process.exit(1);
