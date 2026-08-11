// Read-only pre-flip audit for the email-bombing-protection effort:
// lists auth.users with their confirmation state and whether a matching muas row exists.
// Run: node .scratch/email-bombing-protection/audit-users.mjs
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
if (!token || !ref) {
	console.error('Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in .env');
	process.exit(1);
}

const query = `select u.id, u.email, u.email_confirmed_at, u.created_at,
  (m.id is not null) as has_mua_row
  from auth.users u
  left join public.muas m on m.id = u.id
  order by u.created_at`;

const res = await fetch(
	`https://api.supabase.com/v1/projects/${ref}/database/query/read-only`,
	{
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	}
);
if (!res.ok) {
	console.error(`${res.status} ${res.statusText}`);
	console.error(await res.text());
	process.exit(1);
}

const rows = await res.json();
for (const r of rows) {
	console.log(
		[
			r.email,
			r.email_confirmed_at ? 'confirmed' : 'UNCONFIRMED',
			r.has_mua_row ? 'has-mua-row' : 'no-mua-row',
			(r.created_at || '').slice(0, 10)
		].join(' | ')
	);
}

const n = rows.length;
const unconfirmedNoMua = rows.filter((r) => !r.email_confirmed_at && !r.has_mua_row).length;
const unconfirmedWithMua = rows.filter((r) => !r.email_confirmed_at && r.has_mua_row).length;
console.log(
	`\nsummary: total=${n} unconfirmed+no-mua-row=${unconfirmedNoMua} unconfirmed+with-mua-row=${unconfirmedWithMua}`
);
