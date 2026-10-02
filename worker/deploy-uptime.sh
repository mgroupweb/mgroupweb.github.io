#!/bin/bash
# Deploy the Mgroup uptime monitor (uptime-worker.js) via the Cloudflare REST API.
# Needs: worker/.cf-token (Workers Scripts + KV + schedules). Optional: worker/.slack-webhook
# (Slack incoming webhook URL, gitignored). Without it the worker runs and logs, but does not alert.
set -euo pipefail
cd "$(dirname "$0")"
ACC="${CF_ACCOUNT_ID:-ae7370730d28dc22d29a6b0c956be2e8}"
NAME="mgroup-uptime"
TOKEN="$(tr -d '[:space:]' < .cf-token)"
API="https://api.cloudflare.com/client/v4/accounts/$ACC"
H=(-H "Authorization: Bearer $TOKEN")
ok() { python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'], d.get('errors'); print('  ok')"; }

echo "→ KV namespace mgroup-uptime-state"
KV_ID="$(curl -s "${H[@]}" "$API/storage/kv/namespaces?per_page=100" | python3 -c "import sys,json; print(next((n['id'] for n in json.load(sys.stdin)['result'] if n['title']=='mgroup-uptime-state'),''))")"
if [ -z "$KV_ID" ]; then
  KV_ID="$(curl -s -X POST "${H[@]}" -H 'Content-Type: application/json' "$API/storage/kv/namespaces" -d '{"title":"mgroup-uptime-state"}' | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'], d.get('errors'); print(d['result']['id'])")"
  echo "  created $KV_ID"
else
  echo "  exists $KV_ID"
fi

echo "→ upload script"
cat > /tmp/uptime-metadata.json <<JSON
{"main_module":"uptime-worker.js","compatibility_date":"2026-09-01",
 "bindings":[{"type":"kv_namespace","name":"STATE","namespace_id":"$KV_ID"}],
 "keep_bindings":["secret_text"]}
JSON
curl -s -X PUT "${H[@]}" "$API/workers/scripts/$NAME" \
  -F "metadata=@/tmp/uptime-metadata.json;type=application/json" \
  -F "uptime-worker.js=@uptime-worker.js;type=application/javascript+module" | ok

echo "→ cron */5 * * * *"
curl -s -X PUT "${H[@]}" -H 'Content-Type: application/json' "$API/workers/scripts/$NAME/schedules" -d '[{"cron":"*/5 * * * *"}]' | ok

echo "→ workers.dev route"
curl -s -X POST "${H[@]}" -H 'Content-Type: application/json' "$API/workers/scripts/$NAME/subdomain" -d '{"enabled":true}' | ok

if [ -s .slack-webhook ]; then
  echo "→ secret SLACK_WEBHOOK"
  python3 - "$(tr -d '[:space:]' < .slack-webhook)" > /tmp/uptime-secret.json <<'PY'
import sys, json; print(json.dumps({"name": "SLACK_WEBHOOK", "text": sys.argv[1], "type": "secret_text"}))
PY
  curl -s -X PUT "${H[@]}" -H 'Content-Type: application/json' "$API/workers/scripts/$NAME/secrets" --data @/tmp/uptime-secret.json | ok
  rm -f /tmp/uptime-secret.json
else
  echo "→ no .slack-webhook yet: monitor runs, alerts only go to worker logs"
fi
echo "done: https://$NAME.stupak-ol.workers.dev/status"
