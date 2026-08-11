// Validates the auth-logs analytics query shape for the auth-bomb detector.
// Run: node .scratch/email-bombing-protection/check-logs-query.mjs
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
const tok = env.SUPABASE_MGMT_ANALYTICS_TOKEN;
const base = `https://api.supabase.com/v1/projects/${ref}/analytics/endpoints/logs`;
const end = new Date().toISOString();
const start = new Date(Date.now() - 60000).toISOString();
const cases = [
	['no-sql (default)', `${base}?iso_timestamp_start=${encodeURIComponent(start)}&iso_timestamp_end=${encodeURIComponent(end)}`],
	['select * limit 5', `${base}?iso_timestamp_start=${encodeURIComponent(start)}&iso_timestamp_end=${encodeURIComponent(end)}&sql=${encodeURIComponent('select * from edge_logs limit 5')}`],
	['count(*) edge', `${base}?iso_timestamp_start=${encodeURIComponent(start)}&iso_timestamp_end=${encodeURIComponent(end)}&sql=${encodeURIComponent('select count(*) from edge_logs')}`],
	['count(*) auth', `${base}?iso_timestamp_start=${encodeURIComponent(start)}&iso_timestamp_end=${encodeURIComponent(end)}&sql=${encodeURIComponent('select count(*) from auth_logs')}`]
];
for (const [name, url] of cases) {
	try {
		const res = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
		console.log(name, '->', res.status, JSON.stringify(await res.json()).slice(0, 220));
	} catch (err) {
		console.log(name, '-> FETCH FAILED', err.message);
	}
}
