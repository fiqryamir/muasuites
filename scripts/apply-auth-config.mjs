// Applies the locked GoTrue auth config (see .scratch/email-bombing-protection)
// to the live project via the Management API.
// Run: node scripts/apply-auth-config.mjs [--dry-run]
// Idempotent - re-running with matching values is a no-op.

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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

const dryRun = process.argv.includes('--dry-run');
const API = `https://api.supabase.com/v1/projects/${ref}`;
const headers = { Authorization: `Bearer ${token}` };

const MANIFEST = JSON.parse(readFileSync(resolve(ROOT, 'scripts/auth-config.json'), 'utf8'));

async function api(path, init = {}) {
	const res = await fetch(`${API}${path}`, {
		...init,
		headers: { ...headers, ...(init.body ? { 'Content-Type': 'application/json' } : {}) }
	});
	if (!res.ok) throw new Error(`${path} -> ${res.status} ${res.statusText}`);
	return res.json();
}

const current = await api('/config/auth');
const diffs = Object.entries(MANIFEST).filter(([k, v]) => current[k] !== v);

console.log('Target (scripts/auth-config.json):');
for (const [k, v] of Object.entries(MANIFEST)) {
	const cur = current[k];
	console.log(
		`  ${k}: ${JSON.stringify(cur)} -> ${JSON.stringify(v)}${cur !== v ? '  <-- CHANGES' : ''}`
	);
}

if (diffs.length === 0) {
	console.log('Already in sync - no changes needed.');
	process.exit(0);
}

if (dryRun) {
	console.log(
		`Dry run - would PATCH /config/auth with: ${diffs.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}`
	);
	process.exit(0);
}

const body = Object.fromEntries(diffs);
const updated = await api('/config/auth', { method: 'PATCH', body: JSON.stringify(body) });

console.log('Applied. Result:');
for (const [k] of diffs) {
	console.log(`  ${k}: ${JSON.stringify(updated[k])}`);
}
