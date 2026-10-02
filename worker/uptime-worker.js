// Mgroup uptime monitor (Cloudflare Worker, cron every 5 minutes).
//
// Why: on 2026-09-30 nginx failed to start after an unattended upgrade and the site was down
// for ~52h. Cloudflare kept serving the cached homepage, so nobody noticed. These checks use a
// cache-busting query and dynamic endpoints, so a cached page can never look like a healthy origin.
//
// Alerts go to a Slack incoming webhook (secret SLACK_WEBHOOK) only on state changes:
// DOWN after 2 consecutive failed runs (~10 min), RECOVERED when it answers again.
// State lives in KV (binding STATE) under "state:<target>".
//
// Manual endpoints on workers.dev:  GET /status  → last stored state of every target (no secrets).

const UA = 'MgroupUptime/1.0 (+https://mgroupweb.com/auth.md)';
const FAIL_THRESHOLD = 2;
const TIMEOUT_MS = 15000;

const TARGETS = [
  {
    id: 'prod-home',
    name: 'mgroupweb.com — homepage (origin, cache-busted)',
    url: () => `https://mgroupweb.com/?uptime=${Date.now()}`,
    ok: async (r) => r.status === 200 && (r.headers.get('cf-cache-status') || '') !== 'HIT' && (await r.text()).includes('</html>'),
  },
  {
    id: 'prod-api',
    name: 'mgroupweb.com — WordPress REST API',
    url: () => `https://mgroupweb.com/wp-json/?uptime=${Date.now()}`,
    ok: async (r) => r.status === 200 && (r.headers.get('content-type') || '').includes('json'),
  },
  {
    id: 'prod-contact',
    name: 'mgroupweb.com — contact page (leads)',
    url: () => `https://mgroupweb.com/grow-ecommerce-business/?uptime=${Date.now()}`,
    ok: async (r) => r.status === 200,
  },
  {
    id: 'prod-mcp',
    name: 'mgroupweb.com — MCP server',
    url: () => 'https://mgroupweb.com/mcp',
    init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' },
    ok: async (r) => r.status === 200 && (await r.text()).includes('"tools"'),
  },
  {
    id: 'dev',
    name: 'mgroup.digital — DEV (BasicAuth: 401 = nginx alive)',
    url: () => `https://mgroup.digital/?uptime=${Date.now()}`,
    ok: async (r) => r.status === 401 || r.status === 200,
  },
];

async function probe(t) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const init = t.init || {};
    const r = await fetch(t.url(), {
      ...init,
      headers: { 'User-Agent': UA, 'Cache-Control': 'no-cache', ...(init.headers || {}) },
      redirect: 'manual',
      signal: ctrl.signal,
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    const good = await t.ok(r);
    return { ok: !!good, status: r.status, ms: Date.now() - started, cache: r.headers.get('cf-cache-status') || '' };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - started, error: String(e && e.name === 'AbortError' ? 'timeout' : e) };
  } finally {
    clearTimeout(timer);
  }
}

async function slack(env, text) {
  if (!env.SLACK_WEBHOOK) { console.log('[no SLACK_WEBHOOK] ' + text); return; }
  const r = await fetch(env.SLACK_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
  if (!r.ok) console.log('slack webhook failed', r.status);
}

function human(ms) {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

async function runChecks(env) {
  const now = Date.now();
  const results = await Promise.all(TARGETS.map(async (t) => [t, await probe(t)]));
  for (const [t, res] of results) {
    const key = 'state:' + t.id;
    const prev = (await env.STATE.get(key, 'json')) || { down: false, fails: 0, since: now };
    const next = { ...prev, last: res, checkedAt: now };
    if (res.ok) {
      if (prev.down) {
        await slack(env, `:white_check_mark: RECOVERED — ${t.name}\nHTTP ${res.status} in ${res.ms} ms. Was down for ${human(now - prev.since)}.`);
      }
      next.down = false; next.fails = 0; next.since = prev.down ? now : (prev.since || now);
    } else {
      next.fails = (prev.fails || 0) + 1;
      if (!prev.down && next.fails >= FAIL_THRESHOLD) {
        next.down = true; next.since = now - (FAIL_THRESHOLD - 1) * 5 * 60000;
        await slack(env, `:rotating_light: DOWN — ${t.name}\n${res.error ? 'Error: ' + res.error : 'HTTP ' + res.status}${res.cache ? ' (cf-cache-status ' + res.cache + ')' : ''}, ${FAIL_THRESHOLD} checks in a row.\nFirst check on the server: systemctl status nginx php8.4-fpm mariadb --no-pager`);
      }
    }
    await env.STATE.put(key, JSON.stringify(next));
  }
  return results.map(([t, r]) => ({ id: t.id, ...r }));
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runChecks(env));
  },
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/status') {
      const out = {};
      for (const t of TARGETS) out[t.id] = await env.STATE.get('state:' + t.id, 'json');
      return new Response(JSON.stringify(out, null, 2), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    return new Response('Mgroup uptime monitor. GET /status for the last results.\n', { headers: { 'Content-Type': 'text/plain' } });
  },
};
