// Captures live Supabase state via the Management API into docs/agents/supabase-state.md.
// Run: npm run sync:supabase

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'docs/agents/supabase-state.md');

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

const API = `https://api.supabase.com/v1/projects/${ref}`;
const headers = { Authorization: `Bearer ${token}` };

async function api(path, init = {}) {
	const res = await fetch(`${API}${path}`, {
		...init,
		headers: { ...headers, ...(init.body ? { 'Content-Type': 'application/json' } : {}) }
	});
	if (!res.ok) throw new Error(`${path} -> ${res.status} ${res.statusText}`);
	return res.json();
}

async function sql(query) {
	return api('/database/query', {
		method: 'POST',
		body: JSON.stringify({ query })
	});
}

const QUERIES = {
	columns: `SELECT c.relname AS table_name, a.attname AS column_name,
    format_type(a.atttypid, a.atttypmod) AS data_type, a.attnotnull AS not_null,
    pg_get_expr(d.adbin, d.adrelid) AS column_default
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
    ORDER BY c.relname, a.attnum`,
	pk: `SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position`,
	fk: `SELECT tc.table_name, kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position`,
	enums: `SELECT t.typname AS enum_name, e.enumlabel AS value FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typtype = 'e' AND n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder`,
	views: `SELECT viewname, definition FROM pg_views WHERE schemaname = 'public' ORDER BY viewname`,
	triggers: `SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation, action_statement
    FROM information_schema.triggers WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name`,
	indexes: `SELECT tablename, indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public' ORDER BY tablename, indexname`,
	policies: `SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies
    WHERE schemaname = 'public' ORDER BY tablename, policyname`,
	rpc: `SELECT p.proname, pg_get_functiondef(p.oid) AS definition FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' ORDER BY p.proname`
};

const SECRET_KEY =
	/(^|_)(secret|pass|token|key|sid)(_|$)|smtp_pass|auth_token|access_key|api_key|captcha_secret|oauth_client_secret/i;

function redactAuthConfig(obj) {
	const out = {};
	for (const [k, v] of Object.entries(obj)) {
		if (v === null || v === undefined || v === '') continue;
		if (typeof v === 'object' && !Array.isArray(v)) {
			out[k] = redactAuthConfig(v);
		} else if (typeof v === 'string' && SECRET_KEY.test(k)) {
			out[k] = '[REDACTED]';
		} else {
			out[k] = v;
		}
	}
	return out;
}

function curateAuth(raw) {
	const out = {};
	for (const [k, v] of Object.entries(raw)) {
		if (/^mailer_templates_.*_content$/.test(k)) {
			out[k] = typeof v === 'string' && v ? v.slice(0, 200) + '…' : v;
		} else if (/^mailer_(subjects|templates)_custom_contents$/.test(k)) {
			continue;
		} else {
			out[k] = v;
		}
	}
	return out;
}

const results = {};
const failures = [];
for (const [name, query] of Object.entries(QUERIES)) {
	try {
		results[name] = await sql(query);
		console.log(`ok  ${name}: ${results[name].length} rows`);
	} catch (e) {
		failures.push(`${name}: ${e.message}`);
		results[name] = [];
		console.error(`ERR ${name}: ${e.message}`);
	}
}

let buckets = [];
try {
	buckets = await api('/storage/buckets');
	console.log(`ok  buckets: ${buckets.length}`);
} catch (e) {
	failures.push(`buckets: ${e.message}`);
}

let authConfig = null;
try {
	const raw = await api('/config/auth');
	authConfig = redactAuthConfig(curateAuth(raw));
	console.log('ok  config/auth (redacted + curated)');
} catch (e) {
	failures.push(`config/auth: ${e.message}`);
}

let restPaths = [];
try {
	const openapi = await api('/database/openapi');
	restPaths = Object.keys(openapi?.paths ?? {});
	console.log(`ok  database/openapi: ${restPaths.length} paths`);
} catch (e) {
	failures.push(`database/openapi: ${e.message}`);
}

const pkMap = {};
for (const r of results.pk) (pkMap[r.table_name] ??= []).push(r.column_name);
const fkMap = {};
for (const r of results.fk)
	(fkMap[r.table_name] ??= []).push(`${r.column_name} -> ${r.ref_table}.${r.ref_column}`);

const md = [];
const now = new Date().toISOString();
md.push(`# Supabase state — ${ref}`, '');
md.push(
	`> Generated by \`npm run sync:supabase\` — do not edit by hand; regenerate after schema changes.`
);
md.push(
	`> Captured: \`${now}\` · via Supabase Management API (PAT) · source of truth: **live cloud, not local migrations**`,
	''
);
md.push(
	`> **Freshness contract:** if this capture is older than 7 days, run \`npm run sync:supabase\` before trusting it.`,
	''
);

const tableNames = [...new Set(results.columns.map((c) => c.table_name))].sort();
md.push(`## Tables (${tableNames.length})`, '');
for (const t of tableNames) {
	md.push(`### ${t}`, '');
	md.push('| column | type | nullable | default |', '|---|---|---|---|');
	for (const c of results.columns.filter((c) => c.table_name === t)) {
		const pk = (pkMap[t] ?? []).includes(c.column_name) ? '**PK** ' : '';
		md.push(
			`| ${pk}${c.column_name} | \`${c.data_type}\` | ${c.not_null ? 'no' : 'yes'} | ${c.column_default ? '`' + c.column_default + '`' : ''} |`
		);
	}
	if (fkMap[t]) md.push('', `FK: ${fkMap[t].join(' · ')}`);
	md.push('');
}

const enumNames = [...new Set(results.enums.map((e) => e.enum_name))];
if (enumNames.length) {
	md.push(`## Enums (${enumNames.length})`, '');
	for (const e of enumNames) {
		md.push(
			`- \`${e}\`: ${results.enums
				.filter((x) => x.enum_name === e)
				.map((x) => `\`${x.value}\``)
				.join(', ')}`,
			''
		);
	}
}

if (results.views.length) {
	md.push(`## Views (${results.views.length})`, '');
	for (const v of results.views) {
		md.push(`### ${v.viewname}`, '', '```sql', v.definition, '```', '');
	}
}

if (results.rpc.length) {
	md.push(`## RPC functions (${results.rpc.length}) — full definitions`, '');
	for (const f of results.rpc) {
		md.push(`### ${f.proname}`, '', '```sql', f.definition, '```', '');
	}
}

if (results.policies.length) {
	md.push(`## RLS policies (${results.policies.length})`, '');
	md.push('| table | policy | roles | cmd | using | with check |', '|---|---|---|---|---|---|');
	for (const p of results.policies) {
		md.push(
			`| ${p.tablename} | ${p.policyname} | ${String(p.roles ?? '').replace(/[{}]/g, '')} | ${p.cmd} | ${p.qual ?? ''} | ${p.with_check ?? ''} |`
		);
	}
	md.push('');
}

if (results.indexes.length) {
	md.push(`## Indexes (${results.indexes.length})`, '');
	for (const i of results.indexes) md.push('- ' + i.indexdef.replace(/^CREATE /, 'CREATE '));
	md.push('');
}

if (results.triggers.length) {
	md.push(`## Triggers (${results.triggers.length})`, '');
	for (const t of results.triggers)
		md.push(
			`- ${t.table_name}: \`${t.trigger_name}\` (${t.action_timing} ${t.event_manipulation}) — ${t.action_statement}`
		);
	md.push('');
}

md.push(`## Storage buckets (${buckets.length})`, '');
if (buckets.length) {
	md.push('| id | public | type | file_size_limit | allowed_mime_types |', '|---|---|---|---|---|');
	for (const b of buckets)
		md.push(
			`| ${b.id} | ${b.public} | ${b.type} | ${b.file_size_limit ?? ''} | ${b.allowed_mime_types ? b.allowed_mime_types.join(', ') : ''} |`
		);
	md.push('');
}

if (authConfig) {
	md.push(
		'## Auth config (secrets redacted)',
		'',
		'```json',
		JSON.stringify(authConfig, null, 2),
		'```',
		''
	);
}

md.push(`## REST surface (${restPaths.length} PostgREST paths from openapi)`, '');
if (restPaths.length) {
	md.push('```', restPaths.join('\n'), '```', '');
}

const body = md.join('\n');
const words = body.split(/\s+/).length;
const tokens = Math.round(words * 1.3);
md.push(
	`## Size`,
	'',
	`- ~${words.toLocaleString()} words / ~${tokens.toLocaleString()} tokens (rough)`,
	''
);
if (tokens > 15_000)
	md.push('- **WARNING: over the 15k-token budget** — consider trimming (see ticket 03).');
md.push('');

if (failures.length) {
	md.push(`## Capture failures`, '');
	for (const f of failures) md.push(`- ${f}`);
	md.push('');
}

const secretValues = [
	env.SUPABASE_ACCESS_TOKEN,
	env.SUPABASE_ANON_KEY,
	env.TELEGRAM_BOT_TOKEN,
	env.MAPBOX_ACCESS_TOKEN
].filter(Boolean);
for (const s of secretValues) {
	if (s.length > 8 && body.includes(s)) {
		console.error('LEAK: a .env secret value found its way into the doc — aborting write.');
		process.exit(2);
	}
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, md.join('\n'), 'utf8');
console.log(`\nwrote ${OUT} (~${tokens.toLocaleString()} tokens)`);
if (failures.length) {
	console.error(`partial capture — ${failures.length} leg(s) failed:`);
	failures.forEach((f) => console.error('  - ' + f));
}
