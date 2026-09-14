# Metrics proxy (Cloudflare Worker) for the Domain Authority Checker

GitHub Pages is static, so third-party API keys cannot live in the page. This Worker keeps them
server-side, allows requests only from https://mgroupweb.github.io, caches every domain for 24h
and throttles to 10 checks per IP per 10 minutes.

## Deploy (5 minutes)
1. `npm i -g wrangler && wrangler login` (Cloudflare account that owns mgroupweb.com)
2. `cd worker && wrangler deploy` → note the URL, e.g. `https://mgroup-metrics.<account>.workers.dev`
3. Secrets (each is optional; the checker shows "—" for providers that are not configured):
   - `wrangler secret put MOZ_TOKEN`    — Moz Links API v2 token. Free tier: 2,500 rows/month (moz.com/api). Gives DA, PA, Spam Score.
   - `wrangler secret put AHREFS_TOKEN` — Ahrefs API v3 token. Paid plan only. Gives DR, UR.
   - `wrangler secret put OPR_KEY`      — Open PageRank key (free, openpagerank.com). Gives OPR 0–10.
4. Put the Worker URL into `assets/js/authority.js` → `METRICS_ENDPOINT`, rebuild (`python3 _build/build_site.py`), push.

Rows: one domain = one Moz row. 2,500 free rows ≈ 100 checks of 25 domains per month; the 24h cache stretches this.

## Limits and alerts
- Moz free tier: 2,500 rows/month, 1 domain = 1 row; the Worker caches each domain 24h. When Moz answers with a quota error the page shows a banner.
- Worker throttle: Rate Limiting binding, 10 checks per IP per minute (KV fallback 10 per 10 min) → the page shows a banner with the wait time.
- Tranco: public API rate-limits bursts (429); the page retries 3× with backoff and marks unresolved domains as Unknown.
- With `./deploy-api.sh` secrets are read from `worker/.moz-token`, `.ahrefs-token`, `.opr-key` (all gitignored).
