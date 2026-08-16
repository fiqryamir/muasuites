// pgTAP runner — runs the issue-01 suite against the LOCAL Supabase stack.
// Bootstrap: run `supabase start` from the repo root (the CLI resolves
// supabase/config.toml from the git root; the local db container is then
// named supabase_db_<project> — adapt CONTAINER below if yours differs).
// Assembles fixtures + the REAL production function definitions (single source
// of truth: migrations/functions/*.sql) + tests, pipes to psql in the db
// container, fails the process on any "not ok".
// Run: node run-tests.mjs   (from .scratch/plan-tiering/pgtap)

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = resolve(dirname(fileURLToPath(import.meta.url)));
const MIG = resolve(HERE, '../migrations');
const CONTAINER = 'supabase_db_muasuites';

const parts = [
	'CREATE EXTENSION IF NOT EXISTS pgtap;',
	'BEGIN;',
	'SELECT no_plan();',
	readFileSync(resolve(HERE, 'fixtures.sql'), 'utf8'),
	readFileSync(resolve(MIG, 'functions/get_effective_plan.sql'), 'utf8'),
	readFileSync(resolve(MIG, 'functions/secure_checkout_slot.sql'), 'utf8'),
	readFileSync(resolve(HERE, 'tests-get_effective_plan.sql'), 'utf8'),
	readFileSync(resolve(HERE, 'tests-secure_checkout_slot.sql'), 'utf8'),
	readFileSync(resolve(HERE, 'tests-plan_privacy.sql'), 'utf8'),
	'SELECT * FROM finish();',
	'ROLLBACK;'
];

const harness = parts.join('\n');

const psql = spawnSync(
	'docker',
	['exec', '-i', CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-X', '-q', '-v', 'ON_ERROR_STOP=0'],
	{ input: harness, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
);

process.stdout.write(psql.stdout ?? '');
process.stderr.write(psql.stderr ?? '');

const out = `${psql.stdout ?? ''}\n${psql.stderr ?? ''}`;
const fails = (out.match(/^not ok/gm) || []).length;
const errorLines = (out.match(/^(ERROR|psql:.*ERROR).*$/gm) || []).length;

console.log(`\n---\nfailed assertions: ${fails} | hard errors: ${errorLines} | psql exit: ${psql.status}`);

if (psql.status !== 0 || fails > 0 || errorLines > 0) {
	console.error('SUITE FAILED');
	process.exit(1);
}
console.log('SUITE GREEN');
