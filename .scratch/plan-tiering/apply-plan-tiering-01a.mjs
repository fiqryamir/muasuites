// Applies issue-01 part A (plan state + enforcement schema and RPCs) to the
// live cloud DB via the Management API.
// Run: node apply-plan-tiering-01a.mjs   (from .scratch/plan-tiering)
// Backward-compatible with the pre-issue app code — anon keeps full muas SELECT.
// Part B (RLS tightening) must wait until the app code is deployed.

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

// ---- Pre-checks ----
const elite = await sql(
	`SELECT count(*) AS n FROM public.muas WHERE subscription_plan = 'ELITE'`
);
if (Array.isArray(elite) && elite[0]?.n > 0) {
	console.error('ABORT: ELITE rows exist — enum rebuild would corrupt data.');
	process.exit(1);
}
console.log('pre-check: ELITE rows =', Array.isArray(elite) ? elite[0].n : elite);

// ---- Apply schema (sent as one query — multi-statement, atomic) ----
const schema = readFileSync(resolve(import.meta.dirname, 'migrations/01a-schema.sql'), 'utf8');
const body = schema.replace(/^--.*$/gm, '');
await sql(body);
console.log('applied: 01a-schema.sql (enum rebuild, plan_expires_at, plan_renewals, drop max_active_bookings)');

// ---- Apply RPCs ----
for (const f of ['get_effective_plan.sql', 'secure_checkout_slot.sql']) {
	const fn = readFileSync(resolve(import.meta.dirname, 'migrations/functions', f), 'utf8');
	await sql(fn);
	console.log(`applied: functions/${f}`);
}

// ---- Verify ----
const enumRows = await sql(
	`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
	 WHERE t.typname = 'plan_type' ORDER BY e.enumsortorder`
);
console.log('verify enum plan_type:', JSON.stringify(enumRows));

const cols = await sql(
	`SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull
	 FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
	 JOIN pg_namespace n ON n.oid = c.relnamespace
	 WHERE n.nspname = 'public' AND c.relname = 'muas' AND a.attnum > 0 AND NOT a.attisdropped
	 ORDER BY a.attnum`
);
console.log('verify muas columns:', JSON.stringify(cols.map((c) => `${c.attname} ${c.type}`)));

const ledger = await sql(
	`SELECT table_name FROM information_schema.tables
	 WHERE table_schema = 'public' AND table_name = 'plan_renewals'`
);
console.log('verify plan_renewals:', JSON.stringify(ledger));

const dead = await sql(
	`SELECT count(*) AS n FROM information_schema.columns
	 WHERE table_schema = 'public' AND table_name = 'mua_configs' AND column_name = 'max_active_bookings'`
);
console.log('verify max_active_bookings gone:', Array.isArray(dead) ? dead[0].n : dead);

const rpcs = await sql(
	`SELECT p.proname, p.prosecdef AS security_definer
	 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
	 WHERE n.nspname = 'public' AND p.proname IN ('get_effective_plan', 'secure_checkout_slot')
	 ORDER BY p.proname`
);
console.log('verify RPCs:', JSON.stringify(rpcs));

console.log('DONE — part A applied. Deploy the app code, then run apply-plan-tiering-01b.mjs');
