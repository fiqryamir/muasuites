// Applies the travel-fee schema addition to the live cloud DB via the Management API.
// Run: node .scratch/onboarding-flow/apply-travel-fields.mjs
// Idempotent — safe to re-run.
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
let ref = (env.SUPABASE_PROJECT_REF || '').replace(/^https?:\/\//, '').replace(/\.supabase\.co\/?$/, '');
if (!token || !ref) {
	console.error('Need SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF in .env');
	process.exit(1);
}

const API = `https://api.supabase.com/v1/projects/${ref}/database/query`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function runSql(query) {
	const res = await fetch(API, { method: 'POST', headers, body: JSON.stringify({ query }) });
	if (!res.ok) throw new Error(`query failed -> ${res.status} ${res.statusText}`);
	return res.json();
}

const ALTER = `
ALTER TABLE public.mua_configs
  ADD COLUMN IF NOT EXISTS base_place_name text;`;

await runSql(ALTER);
console.log('ALTER TABLE mua_configs: base_place_name — ok');

const verified = await runSql(
	`SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'mua_configs' AND column_name = 'base_place_name'`
);
console.log('verified:', JSON.stringify(verified));
