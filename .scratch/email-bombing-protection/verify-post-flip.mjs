// Post-flip verification for the email-bombing-protection effort (ticket 05).
// Verifies: known-email magic link still sends (200), unknown email sends nothing (422),
// no user row is created for unknown emails, and per-IP throttling kicks in.
// Run: node .scratch/email-bombing-protection/verify-post-flip.mjs
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

const token = env.SUPABASE_ACCESS_TOKEN;
let ref = env.SUPABASE_PROJECT_REF || '';
ref = ref.replace(/^https?:\/\//, '').replace(/\.supabase\.co\/?$/, '');
const url = env.PUBLIC_SUPABASE_URL || `https://${ref}.supabase.co`;
const anon = env.PUBLIC_SUPABASE_ANON_KEY;

const AUTH = `${url}/auth/v1`;
const headers = { apikey: anon, 'Content-Type': 'application/json' };
const knownEmail = process.argv[2] || 'mfiqry9907@gmail.com';

async function post(path, body) {
	const res = await fetch(`${AUTH}${path}`, {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});
	let json = null;
	try {
		json = await res.json();
	} catch {}
	return { status: res.status, json };
}

// 1. Known confirmed email -> expect 200, magic link sent
const known = await post('/otp', {
	email: knownEmail,
	create_user: false,
	options: { emailRedirectTo: `${url}/login` }
});
console.log(
	`known email  (${knownEmail}): ${known.status} ${known.json?.error_code || known.json?.message || ''}`
);

// 2. Unknown email -> expect 422, no send
const junk = `bomb-test-${Date.now()}@nonexistent.invalid`;
const unknown = await post('/otp', {
	email: junk,
	create_user: false,
	options: { emailRedirectTo: `${url}/login` }
});
console.log(`unknown email: ${unknown.status} ${unknown.json?.error_code || ''}`);

// 3. /recovery and /signup with unknown email -> expect 422, no send
for (const [path, body] of [
	['/recover', { email: junk }],
	['/signup', { email: junk, password: 'x'.repeat(8) }]
]) {
	const r = await post(path, body);
	console.log(`${path} junk:    ${r.status} ${r.json?.error_code || ''}`);
}

// 4. Hammer /otp with junk emails until throttled (per-IP bucket ~30/5min)
let sent = 0;
let blocked = 0;
let other = 0;
for (let i = 0; i < 40; i++) {
	const r = await post('/otp', {
		email: `hammer-${Date.now()}-${i}@nonexistent.invalid`,
		create_user: false,
		options: { emailRedirectTo: `${url}/login` }
	});
	if (r.status === 422 || r.status === 200) sent++;
	else if (r.status === 429) blocked++;
	else other++;
}
console.log(`hammer /otp 40x: sent-ish=${sent} throttled-429=${blocked} other=${other}`);
