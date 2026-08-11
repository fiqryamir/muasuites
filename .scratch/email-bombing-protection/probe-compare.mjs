// Compares OTP probe behavior between accounts + shows auth.users audience.
// Run: node .scratch/email-bombing-protection/probe-compare.mjs
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

let ref = env.SUPABASE_PROJECT_REF || '';
ref = ref.replace(/^https?:\/\//, '').replace(/\.supabase\.co\/?$/, '');
const token = env.SUPABASE_ACCESS_TOKEN;
const url = env.PUBLIC_SUPABASE_URL;
const anon = env.PUBLIC_SUPABASE_ANON_KEY;

const sqlRes = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query/read-only`, {
	method: 'POST',
	headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
	body: JSON.stringify({
		query:
			'select u.email, u.aud, u.email_confirmed_at, u.is_sso_user, u.deleted_at from auth.users u order by u.created_at'
	})
});
console.log('auth.users rows:');
for (const r of await sqlRes.json()) console.log(' ', JSON.stringify(r));

for (const email of ['mfiqry9907@gmail.com', 'demo@muasuites.com', 'victrixgaia@gmail.com']) {
	const res = await fetch(`${url}/auth/v1/otp`, {
		method: 'POST',
		headers: { apikey: anon, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email,
			create_user: false,
			options: { emailRedirectTo: `${url}/login` }
		})
	});
	const j = await res.json().catch(() => ({}));
	console.log(`probe ${email}: ${res.status} ${j.error_code || j.message || 'ok'}`);
}
