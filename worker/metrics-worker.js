/* Cloudflare Worker: metrics proxy for the Domain Authority Checker on mgroupweb.github.io.
   Keeps API keys server-side, adds CORS for the tools site only, caches results 24h, rate-limits by IP.
   Deploy: wrangler deploy (see worker/README.md). Secrets:
     MOZ_TOKEN      — Moz Links API v2 token (free tier: 2,500 rows/month)   -> DA, PA, Spam Score
     AHREFS_TOKEN   — Ahrefs API v3 token (paid plan)                         -> DR, UR   (optional)
     OPR_KEY        — Open PageRank API key (free)                            -> OPR 0–10 (optional)
*/
const ALLOWED_ORIGINS = ['https://mgroupweb.github.io', 'http://localhost:8765'];
const MAX_DOMAINS = 25;
const THROTTLE = new Map();
const MEMO = new Map();

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

    // per-IP throttle: 10 requests / 10 minutes (in-memory per isolate; Cache API is not available on workers.dev)
    const ip = req.headers.get('CF-Connecting-IP') || 'x';
    const now = Date.now();
    const hits = (THROTTLE.get(ip) || []).filter(t => now - t < 600000);
    if (hits.length >= 10) return json({ error: 'rate limit: 10 checks per 10 minutes' }, 429, cors);
    hits.push(now); THROTTLE.set(ip, hits);

    let body; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400, cors); }
    const domains = [...new Set((body.domains || []).map(normalize).filter(Boolean))].slice(0, MAX_DOMAINS);
    if (!domains.length) return json({ error: 'no domains' }, 400, cors);

    const out = {};
    const todo = [];
    for (const d of domains) {
      const c = MEMO.get(d);
      if (c && now - c.t < 86400000) out[d] = c.v; else todo.push(d);
    }
    if (todo.length) {
      const [moz, ahrefs, opr] = await Promise.all([mozMetrics(todo, env), ahrefsMetrics(todo, env), oprMetrics(todo, env)]);
      for (const d of todo) {
        out[d] = { ...(moz[d] || {}), ...(ahrefs[d] || {}), ...(opr[d] || {}) };
        if (Object.keys(out[d]).length) MEMO.set(d, { t: now, v: out[d] });
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

/* Moz API (JSON-RPC, x-moz-token) — data.site.metrics.fetch.multiple. Free tier available at moz.com/api. */
async function mozMetrics(domains, env) {
  if (!env.MOZ_TOKEN) return {};
  try {
    const r = await fetch('https://api.moz.com/jsonrpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-moz-token': env.MOZ_TOKEN },
      body: JSON.stringify({ jsonrpc: '2.0', id: 'mgroup-metrics-' + Date.now().toString().padStart(24, '0'),
        method: 'data.site.metrics.fetch.multiple',
        params: { data: { site_queries: domains.map(d => ({ query: d, scope: 'domain' })) } } }),
    });
    const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch { j = {}; }
    const out = {}; if (!r.ok || j.error) { out.__moz_debug = { status: r.status, body: txt.slice(0, 300) }; return out; }
    ((j.result || {}).results_by_site || []).forEach((row, i) => {
      const m = row.site_metrics || {}; const key = (row.site_query && row.site_query.original_site_query && row.site_query.original_site_query.query) || domains[i];
      out[key] = { da: m.domain_authority ?? null, pa: m.page_authority ?? null, spam: (m.spam_score == null || m.spam_score < 0) ? null : m.spam_score,
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
