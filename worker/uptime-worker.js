// Mgroup uptime monitor (Cloudflare Worker, cron every 5 minutes).
//
// Why: on 2026-09-30 nginx failed to start after an unattended upgrade and the site was down
// for ~52h. Cloudflare kept serving the cached homepage, so nobody noticed. These checks use a
// cache-busting query and dynamic endpoints, so a cached page can never look like a healthy origin.
//
// Alerts go to a Slack incoming webhook (secret SLACK_WEBHOOK) only on state changes:
// DOWN after 2 consecutive failed runs (~10 min), RECOVERED when it answers again.
// State lives in KV (binding STATE) under one key, written only on change or hourly (see KV budget).
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

// KV budget: the free tier allows 1,000 writes/day for the whole account (shared with mgroup-metrics).
// One key holds every target; it is written only when something changes (a failure, DOWN, RECOVERED)
// or once an hour as a heartbeat for /status. Healthy day = 24 writes, not 1,440 (2026-10-04 lesson).
const STATE_KEY = 'state:v2';
const HEARTBEAT_MS = 55 * 60000;

export function evaluate(prevState, results, now) {
  const targets = { ...((prevState && prevState.targets) || {}) };
  const alerts = [];
  let changed = !prevState;
  for (const { t, res } of results) {
    const prev = targets[t.id] || { down: false, fails: 0, since: now };
    const next = { down: prev.down, fails: prev.fails || 0, since: prev.since || now, last: res };
    if (res.ok) {
      if (prev.down) {
        alerts.push(`:white_check_mark: RECOVERED — ${t.name}\nHTTP ${res.status} in ${res.ms} ms. Was down for ${human(now - prev.since)}.`);
        next.since = now;
      }
      if (prev.down || next.fails) changed = true;
      next.down = false; next.fails = 0;
    } else {
      next.fails += 1;
      if (!prev.down) changed = true;           // count failures until DOWN; no writes while already DOWN
      if (!prev.down && next.fails >= FAIL_THRESHOLD) {
        next.down = true; next.since = now - (FAIL_THRESHOLD - 1) * 5 * 60000;
        alerts.push(`:rotating_light: DOWN — ${t.name}\n${res.error ? 'Error: ' + res.error : 'HTTP ' + res.status}${res.cache ? ' (cf-cache-status ' + res.cache + ')' : ''}, ${FAIL_THRESHOLD} checks in a row.\nFirst check on the server: systemctl status nginx php8.4-fpm mariadb --no-pager`);
      }
    }
    targets[t.id] = next;
  }
  const heartbeatDue = !prevState || !prevState.writtenAt || now - prevState.writtenAt >= HEARTBEAT_MS;
  const write = changed || heartbeatDue;
  return { next: { targets, checkedAt: now, writtenAt: write ? now : prevState.writtenAt }, alerts, write };
}

async function runChecks(env) {
  const now = Date.now();
  const results = await Promise.all(TARGETS.map(async (t) => ({ t, res: await probe(t) })));
  const prev = await env.STATE.get(STATE_KEY, 'json');
  const { next, alerts, write } = evaluate(prev, results, now);
  for (const a of alerts) await slack(env, a);
  if (write) await env.STATE.put(STATE_KEY, JSON.stringify(next));
  return { write, alerts: alerts.length };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runChecks(env));
  },
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/status') {
      const st = await env.STATE.get(STATE_KEY, 'json');
      return new Response(JSON.stringify(st, null, 2), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    return new Response('Mgroup uptime monitor. GET /status for the last results.\n', { headers: { 'Content-Type': 'text/plain' } });
  },
};
