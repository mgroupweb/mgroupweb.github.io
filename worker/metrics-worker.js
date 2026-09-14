/* Cloudflare Worker: metrics proxy for the Domain Authority Checker on mgroupweb.github.io.
   Keeps API keys server-side, adds CORS for the tools site only, caches results 24h, rate-limits by IP.
   Deploy: wrangler deploy (see worker/README.md). Secrets:
     MOZ_TOKEN      — Moz Links API v2 token (free tier: 2,500 rows/month)   -> DA, PA, Spam Score
     AHREFS_TOKEN   — Ahrefs API v3 token (paid plan)                         -> DR, UR   (optional)
     OPR_KEY        — Open PageRank API key (free)                            -> OPR 0–10 (optional)
*/
const ALLOWED_ORIGINS = ['https://mgroupweb.github.io', 'http://localhost:8765'];
const MAX_DOMAINS = 25;

export default {
  async fetch(req, env, ctx) {
    const origin = req.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405, cors);
    if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'origin not allowed' }, 403, cors);

    // simple per-IP throttle: 10 requests / 10 minutes via Cache API
    const ip = req.headers.get('CF-Connecting-IP') || 'x';
    const throttleKey = new Request('https://throttle.local/' + ip);
    const cache = caches.default;
    const hit = await cache.match(throttleKey);
    const count = hit ? parseInt(await hit.text(), 10) : 0;
    if (count >= 10) return json({ error: 'rate limit: 10 checks per 10 minutes' }, 429, cors);
    ctx.waitUntil(cache.put(throttleKey, new Response(String(count + 1), { headers: { 'Cache-Control': 'max-age=600' } })));

    let body; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400, cors); }
    const domains = [...new Set((body.domains || []).map(normalize).filter(Boolean))].slice(0, MAX_DOMAINS);
    if (!domains.length) return json({ error: 'no domains' }, 400, cors);

    const out = {};
    const todo = [];
    for (const d of domains) {
      const c = await cache.match(new Request('https://metrics.local/' + d));
      if (c) out[d] = await c.json(); else todo.push(d);
    }
    if (todo.length) {
      const [moz, ahrefs, opr] = await Promise.all([mozMetrics(todo, env), ahrefsMetrics(todo, env), oprMetrics(todo, env)]);
      for (const d of todo) {
        out[d] = { ...(moz[d] || {}), ...(ahrefs[d] || {}), ...(opr[d] || {}) };
        ctx.waitUntil(cache.put(new Request('https://metrics.local/' + d),
          new Response(JSON.stringify(out[d]), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=86400' } })));
      }
    }
    return json({ providers: { moz: !!env.MOZ_TOKEN, ahrefs: !!env.AHREFS_TOKEN, opr: !!env.OPR_KEY }, metrics: out }, 200, cors);
  },
};

function normalize(s) {
  s = String(s || '').trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split(/[\/?#]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(s) ? s : null;
}
function json(o, status, headers) {
  return new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

/* Moz Links API v2 — POST /v2/url_metrics, Basic auth with the API token. Free tier: 2,500 rows/month. */
async function mozMetrics(domains, env) {
  if (!env.MOZ_TOKEN) return {};
  try {
    const r = await fetch('https://lsapi.seomoz.com/v2/url_metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + btoa(env.MOZ_TOKEN) },
      body: JSON.stringify({ targets: domains.map(d => d + '/') }),
    });
    if (!r.ok) return {};
    const j = await r.json(); const out = {};
    (j.results || []).forEach((m, i) => {
      out[domains[i]] = { da: m.domain_authority ?? null, pa: m.page_authority ?? null, spam: m.spam_score ?? null,
        rootDomainsLinking: m.root_domains_to_root_domain ?? null };
    });
    return out;
  } catch { return {}; }
}

/* Ahrefs API v3 — domain-rating + url-rating per target (paid plan). */
async function ahrefsMetrics(domains, env) {
  if (!env.AHREFS_TOKEN) return {};
  const out = {}; const date = new Date().toISOString().slice(0, 10);
  await Promise.all(domains.map(async d => {
    try {
      const h = { 'Authorization': 'Bearer ' + env.AHREFS_TOKEN, 'Accept': 'application/json' };
      const [dr, ur] = await Promise.all([
        fetch(`https://api.ahrefs.com/v3/site-explorer/domain-rating?target=${encodeURIComponent(d)}&date=${date}`, { headers: h }).then(r => r.ok ? r.json() : null),
        fetch(`https://api.ahrefs.com/v3/site-explorer/url-rating?target=${encodeURIComponent('https://' + d + '/')}&date=${date}`, { headers: h }).then(r => r.ok ? r.json() : null),
      ]);
      out[d] = { dr: dr?.domain_rating?.domain_rating ?? null, ur: ur?.url_rating?.url_rating ?? null };
    } catch { out[d] = {}; }
  }));
  return out;
}

/* Open PageRank — free key, up to 100 domains per call. */
async function oprMetrics(domains, env) {
  if (!env.OPR_KEY) return {};
  try {
    const q = domains.map(d => 'domains[]=' + encodeURIComponent(d)).join('&');
    const r = await fetch('https://openpagerank.com/api/v1.0/getPageRank?' + q, { headers: { 'API-OPR': env.OPR_KEY } });
    if (!r.ok) return {};
    const j = await r.json(); const out = {};
    (j.response || []).forEach(x => { if (x.status_code === 200) out[x.domain] = { opr: x.page_rank_decimal ?? null }; });
    return out;
  } catch { return {}; }
}
