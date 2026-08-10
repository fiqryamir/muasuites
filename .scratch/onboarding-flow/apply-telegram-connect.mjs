// Applies the Telegram-connect schema addition (columns + link RPC) to the
// live cloud DB via the Management API.
// Run: node .scratch/onboarding-flow/apply-telegram-connect.mjs
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
  ADD COLUMN IF NOT EXISTS telegram_connect_token text,
  ADD COLUMN IF NOT EXISTS telegram_connect_expires_at timestamptz;`;

await runSql(ALTER);
console.log('ALTER TABLE mua_configs: telegram_connect_token/expires_at — ok');

const RPC = `
CREATE OR REPLACE FUNCTION public.link_telegram_chat(p_token text, p_chat_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.mua_configs%ROWTYPE;
BEGIN
  -- Row-level lock on the config row owning this connect token
  SELECT * INTO v_row
  FROM public.mua_configs
  WHERE telegram_connect_token = p_token
    AND telegram_connect_expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'LINK_TOKEN_INVALID_OR_EXPIRED');
  END IF;

  UPDATE public.mua_configs
  SET telegram_chat_id = p_chat_id::text,
      telegram_connect_token = NULL,
      telegram_connect_expires_at = NULL
  WHERE mua_id = v_row.mua_id;

  RETURN jsonb_build_object('success', true, 'mua_id', v_row.mua_id);
END;
$function$;`;

await runSql(RPC);
console.log('CREATE FUNCTION link_telegram_chat — ok');

const verified = await runSql(
	`SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'mua_configs'
     AND column_name IN ('telegram_connect_token', 'telegram_connect_expires_at')
   ORDER BY column_name`
);
console.log('verified:', JSON.stringify(verified));

const rpcVerified = await runSql(
	`SELECT proname, prosecdef
   FROM pg_proc
   JOIN pg_namespace n ON n.oid = pronamespace
   WHERE n.nspname = 'public' AND proname = 'link_telegram_chat'`
);
console.log('rpc verified:', JSON.stringify(rpcVerified));
