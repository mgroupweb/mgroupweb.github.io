#!/bin/bash
# Deploy metrics-worker.js to Cloudflare via REST API (no wrangler login needed).
# Needs: worker/.cf-token  — API token with "Workers Scripts: Edit" on the account (never commit it).
# Optional: worker/.moz-token, worker/.ahrefs-token, worker/.opr-key — uploaded as Worker secrets.
set -euo pipefail
cd "$(dirname "$0")"
ACC="${CF_ACCOUNT_ID:-ae7370730d28dc22d29a6b0c956be2e8}"
NAME="mgroup-metrics"
TOKEN="$(tr -d '[:space:]' < .cf-token)"
API="https://api.cloudflare.com/client/v4/accounts/$ACC"
H=(-H "Authorization: Bearer $TOKEN")

echo "→ verify token"
curl -s "${H[@]}" https://api.cloudflare.com/client/v4/user/tokens/verify | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'], d; print('  ok', d['result']['status'])"

echo "→ upload script"
KVID="$(curl -s "${H[@]}" "$API/storage/kv/namespaces?per_page=100" | python3 -c "import sys,json; d=json.load(sys.stdin); m=[n['id'] for n in d.get('result',[]) if n['title']=='mgroup-metrics-kv']; print(m[0] if m else '')")"
if [ -z "$KVID" ]; then KVID="$(curl -s -X POST "${H[@]}" -H 'Content-Type: application/json' "$API/storage/kv/namespaces" --data '{"title":"mgroup-metrics-kv"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['id'])")"; fi
echo "  KV namespace ${KVID:0:8}…"
printf '{"main_module":"metrics-worker.js","compatibility_date":"2026-09-01","bindings":[{"type":"kv_namespace","name":"KV","namespace_id":"%s"},{"type":"ratelimit","name":"RL","namespace_id":"1001","simple":{"limit":10,"period":60}}]}' "$KVID" > /tmp/metadata.json
curl -s -X PUT "${H[@]}" "$API/workers/scripts/$NAME" \
  -F "metadata=@/tmp/metadata.json;type=application/json" \
  -F "metrics-worker.js=@metrics-worker.js;type=application/javascript+module" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'], d.get('errors'); print('  ok', d['result'].get('id'))"

echo "→ secrets"
for pair in "MOZ_TOKEN:.moz-token" "AHREFS_TOKEN:.ahrefs-token" "OPR_KEY:.opr-key"; do
  key="${pair%%:*}"; file="${pair##*:}"
  if [ -s "$file" ]; then
    val="$(tr -d '[:space:]' < "$file")"
    python3 - "$key" "$val" > /tmp/secret.json <<'PY'
import sys,json; print(json.dumps({"name":sys.argv[1],"text":sys.argv[2],"type":"secret_text"}))
PY
    curl -s -X PUT "${H[@]}" -H "Content-Type: application/json" "$API/workers/scripts/$NAME/secrets" --data @/tmp/secret.json \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ', '$key', 'ok' if d['success'] else d.get('errors'))"
    rm -f /tmp/secret.json
  else
    echo "   $key: no $file, skipped"
  fi
done

echo "→ enable workers.dev subdomain"
curl -s -X POST "${H[@]}" -H "Content-Type: application/json" "$API/workers/scripts/$NAME/subdomain" --data '{"enabled":true,"previews_enabled":false}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ', 'ok' if d['success'] else d.get('errors'))"
SUB="$(curl -s "${H[@]}" "$API/workers/subdomain" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['subdomain'])")"
echo "URL: https://$NAME.$SUB.workers.dev"
