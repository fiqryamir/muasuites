// Applies issue-01 part B (plan privacy: anon loses muas plan columns,
// authenticated UPDATE restricted to slug) to the live cloud DB.
// Run: node apply-plan-tiering-01b.mjs   (from .scratch/plan-tiering)
// MUST run after the app code (booking-link route) is deployed.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const env = Object.fromEntries(
	readFileSync(resolve(ROOT, '.env'), 'utf8')
		.split(/\r?\n/)
		.filter((l) => l.includes('=') && !l.trim().startsWith('#'))
		.map((l) => {
			const i = l.indexOf('=');
			return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
		})
);
const token = env.SUPABASE_ACCESS_TOKEN;
let ref = env.SUPABASE_PROJECT_REF || '';
ref = ref.replace(/^https?:\/\//, '').replace(/\.supabase\.co\/?$/, '');
if (!token || !ref) {
	console.error('Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in .env');
	process.exit(1);
}

const API = `https://api.supabase.com/v1/projects/${ref}/database/query`;

async function sql(query) {
	const res = await fetch(API, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	});
	const text = await res.text();
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 400)}`);
	if (!text.trim()) return null;
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

console.log('Project:', ref);

const tightening = readFileSync(resolve(import.meta.dirname, 'migrations/01b-rls-tightening.sql'), 'utf8');
await sql(tightening.replace(/^--.*$/gm, ''));
console.log('applied: 01b-rls-tightening.sql');

const anonGrants = await sql(
	`SELECT privilege_type FROM information_schema.role_table_grants
	 WHERE table_schema = 'public' AND table_name = 'muas' AND grantee = 'anon'
	 ORDER BY 1`
);
console.log('verify anon muas grants:', JSON.stringify(anonGrants));

const anonCols = await sql(
	`SELECT column_name FROM information_schema.column_privileges
	 WHERE table_schema = 'public' AND table_name = 'muas' AND grantee = 'anon'
	 ORDER BY 1`
);
console.log('verify anon muas column grants:', JSON.stringify(anonCols));

const authUpdate = await sql(
	`SELECT privilege_type FROM information_schema.role_table_grants
	 WHERE table_schema = 'public' AND table_name = 'muas' AND grantee = 'authenticated' AND privilege_type = 'UPDATE'`
);
console.log('verify authenticated muas UPDATE:', JSON.stringify(authUpdate));

const authUpdateCols = await sql(
	`SELECT column_name FROM information_schema.column_privileges
	 WHERE table_schema = 'public' AND table_name = 'muas' AND grantee = 'authenticated' AND privilege_type = 'UPDATE'
	 ORDER BY 1`
);
console.log('verify authenticated muas UPDATE columns:', JSON.stringify(authUpdateCols));

console.log('DONE — part B applied.');
