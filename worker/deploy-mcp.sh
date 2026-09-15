#!/bin/bash
# Deploy the Mgroup MCP server (mcp-worker.js + generated mcp-tools.js/mcp-data.js) via the Cloudflare REST API.
# Needs: worker/.cf-token (Workers Scripts: Edit). Regenerate modules first: python3 _build/build_agent_files.py
set -euo pipefail
cd "$(dirname "$0")"
ACC="${CF_ACCOUNT_ID:-ae7370730d28dc22d29a6b0c956be2e8}"
NAME="mgroup-mcp"
TOKEN="$(tr -d '[:space:]' < .cf-token)"
API="https://api.cloudflare.com/client/v4/accounts/$ACC"
H=(-H "Authorization: Bearer $TOKEN")
[ -s mcp-tools.js ] && [ -s mcp-data.js ] || { echo "run: python3 ../_build/build_agent_files.py"; exit 1; }

echo "→ verify token"
curl -s "${H[@]}" https://api.cloudflare.com/client/v4/user/tokens/verify | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'], d; print('  ok', d['result']['status'])"

echo "→ upload script (bindings: RL 30/60s, METRICS → mgroup-metrics)"
cat > /tmp/mcp-metadata.json <<'JSON'
{"main_module":"mcp-worker.js","compatibility_date":"2026-09-01",
 "bindings":[
  {"type":"ratelimit","name":"RL","namespace_id":"1002","simple":{"limit":30,"period":60}},
  {"type":"service","name":"METRICS","service":"mgroup-metrics"}
 ]}
JSON
curl -s -X PUT "${H[@]}" "$API/workers/scripts/$NAME" \
  -F "metadata=@/tmp/mcp-metadata.json;type=application/json" \
  -F "mcp-worker.js=@mcp-worker.js;type=application/javascript+module" \
  -F "mcp-tools.js=@mcp-tools.js;type=application/javascript+module" \
  -F "mcp-data.js=@mcp-data.js;type=application/javascript+module" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'], d.get('errors'); print('  ok', d['result'].get('id'))"

echo "→ enable workers.dev subdomain"
curl -s -X POST "${H[@]}" -H "Content-Type: application/json" "$API/workers/scripts/$NAME/subdomain" --data '{"enabled":true,"previews_enabled":false}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ', 'ok' if d['success'] else d.get('errors'))"
SUB="$(curl -s "${H[@]}" "$API/workers/subdomain" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['subdomain'])")"
echo "URL: https://$NAME.$SUB.workers.dev/mcp"
