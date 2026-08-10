// Apply the onboarding-state migration + backfill to the live cloud project.
// Read-only PAT? Uses the same /database/query endpoint as scripts/sync-supabase.mjs.
// Run: node apply-backfill.mjs   (from .scratch/onboarding-flow)

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

const API = `https://api.supabase.com/v1/projects/${ref}`;

async function sql(query) {
	const res = await fetch(`${API}/database/query`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	});
	if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
	const ct = res.headers.get('content-type') || '';
	return ct.includes('json') ? res.json() : res.text();
}

const COMPLETE_FILTER = `studio_name IS NOT NULL AND length(trim(studio_name)) > 0
	AND whatsapp_number IS NOT NULL AND length(trim(whatsapp_number)) > 0
	AND duitnow_qr_url IS NOT NULL AND length(trim(duitnow_qr_url)) > 0
	AND deposit_value > 0
	AND EXISTS (SELECT 1 FROM public.packages p WHERE p.mua_id = public.mua_configs.mua_id AND p.is_active = true)`;

async function counts(label, withOnboarded) {
	const rows = await sql(
		`SELECT count(*) AS total,
			count(*) FILTER (WHERE ${COMPLETE_FILTER}) AS complete
			${withOnboarded ? `, count(*) FILTER (WHERE onboarded_at IS NOT NULL) AS onboarded` : ''}
		FROM public.mua_configs`
	);
	const r = Array.isArray(rows) ? rows[0] : rows;
	console.log(label, JSON.stringify(r));
}

const migration = readFileSync(resolve(import.meta.dirname, 'migrations/2026-08-10-add-onboarding-state.sql'), 'utf8');
const statements = migration
	.split(/\r?\n/)
	.filter((l) => !l.trim().startsWith('--'))
	.join('\n')
	.split(';')
	.map((s) => s.trim())
	.filter(Boolean);

console.log('Project:', ref);
await counts('BEFORE   ', false);
for (const stmt of statements) {
	const rows = await sql(stmt);
	if (Array.isArray(rows)) console.log('applied  ', stmt.slice(0, 60).replace(/\s+/g, ' '), '->', JSON.stringify(rows).slice(0, 200));
	else console.log('applied  ', stmt.slice(0, 60).replace(/\s+/g, ' '));
}
await counts('AFTER    ', true);
console.log('DONE');
