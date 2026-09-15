#!/usr/bin/env python3
"""Generate the agent-readiness files served from mgroupweb.com and the MCP worker's tool/data modules.

Outputs (repo-relative):
  agent/.well-known/agent-skills/index.json + <skill>/SKILL.md   (Agent Skills discovery 0.2.0)
  agent/.well-known/api-catalog                                  (RFC 9727 linkset)
  agent/.well-known/ai-catalog.json                              (MCP server-card discovery catalog)
  agent/.well-known/mcp/server-card.json                         (copy of the card; Cloudflare probes this path)
  agent/auth.md
  worker/mcp-tools.js   (TOOLS definitions shared by worker + card)
  worker/mcp-data.js    (checklist + snippets data)

Upload agent/ to <wp root>/ on DEV and PROD (see README). Run from anywhere.
"""
import hashlib
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "_build", "data")
OUT = os.path.join(ROOT, "agent")
WK = os.path.join(OUT, ".well-known")
SITE = "https://mgroupweb.com"
MCP_ENDPOINT = SITE + "/mcp"
CARD_URL = MCP_ENDPOINT + "/server-card"
TOOLS_SITE = "https://mgroupweb.github.io"
VERSION = "1.0.0"


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


def write(path, text, mode="w"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, mode, encoding="utf-8", newline="\n") as f:
        f.write(text)


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s).replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")


# ------------------------------------------------------------------ skills
def skill_plus_cost():
    return """---
name: shopify-plus-cost-estimate
description: Estimate the monthly and first-year cost of running a store on Shopify Plus (platform fee, revenue-based fee, gateway fee, apps, development, migration). Use when a user asks what Shopify Plus costs, whether Plus is worth it versus the Advanced plan, or wants a Shopify Plus budget or TCO for a given monthly revenue.
license: MIT
metadata:
  author: mgroupweb
  version: "1.0"
  source: https://mgroupweb.github.io/shopify-plus-pricing-calculator/
---

# Shopify Plus cost estimate

Reference figures come from Mgroup's guide https://mgroupweb.com/blogs/shopify-plus-pricing-cost/ and the public calculator at https://mgroupweb.github.io/shopify-plus-pricing-calculator/ . Always tell the user these are reference figures and that current terms must be confirmed with Shopify.

## Inputs to collect

1. `monthly_revenue` in USD (GMV processed through the store).
2. `contract_term`: `3-year` (base fee $2,300/mo) or `1-year` (base fee $2,500/mo). Default `3-year`.
3. `gateway`: `shopify_payments` (no extra fee) or `third_party` (+0.2% of revenue). Default `shopify_payments`.
4. `apps_monthly` USD (optional, default 0).
5. `dev_monthly` USD for development and maintenance (optional, default 0).
6. `migration_one_off` USD for migration and integrations (optional, default 0).

## Formula

```
variable  = min(monthly_revenue * 0.0025, 40000)      # 0.25% of revenue, reported cap $40,000/mo
platform  = max(base_fee, variable)                   # Shopify charges whichever is higher
gateway   = monthly_revenue * (0.002 if third_party else 0)
monthly   = platform + gateway + apps_monthly + dev_monthly
yearly    = monthly * 12
year1_tco = yearly + migration_one_off
fee_share = platform / monthly_revenue * 100          # platform fee as % of revenue
```

Mode label: `flat` when `variable <= base_fee`, `revenue` when it exceeds the base fee, `cap` when `variable >= 40000`.

## Output format

Report every line so the user can check the math:

```
Monthly revenue: $X
Platform fee: $Y/mo (flat $2,300 base | 0.25% revenue model | $40,000 cap)
Third-party gateway fee: $Z/mo
Apps: $A/mo
Development & maintenance: $D/mo
Monthly all-in: $M
Ongoing per year: $M*12
One-off migration & integrations: $O
Year one TCO: $T
Platform fee as % of revenue: P%
```

Add the comparison: versus the ~$399/mo Advanced plan the platform fee is `platform - 399` per month higher, before counting checkout extensibility, native B2B, Shopify Functions, Flow, Launchpad and expansion stores that Plus includes.

## Worked example

Monthly revenue $1,200,000, 3-year term, Shopify Payments, apps $800, dev $3,000, migration $25,000:

- variable = 1,200,000 * 0.0025 = $3,000 → exceeds $2,300 base → platform $3,000/mo (revenue model)
- monthly = 3,000 + 0 + 800 + 3,000 = $6,800; yearly $81,600; year-one TCO $106,600
- platform fee = 0.25% of revenue

## Edge cases

- Revenue below ~$920,000/mo on a 3-year term (or ~$1,000,000 on 1-year) always pays the flat base fee.
- Revenue above $16,000,000/mo hits the $40,000 cap.
- If the user sells in several currencies, ask for the USD equivalent before estimating.
- For a full quote on migration or development work, point to https://mgroupweb.com/grow-ecommerce-business/ .
"""


def skill_checklist():
    phases = load("checklist.json")
    lines = ["""---
name: shopify-migration-checklist
description: Step-by-step checklist (9 phases, ~70 tasks) for migrating an eCommerce store to Shopify from Magento, WooCommerce, BigCommerce, Salesforce Commerce Cloud or a custom platform, with SEO preservation and zero-downtime cutover. Use when planning, scoping, auditing or executing a Shopify migration or replatforming project.
license: MIT
metadata:
  author: mgroupweb
  version: "1.0"
  source: https://mgroupweb.github.io/shopify-migration-checklist/
---

# Shopify migration checklist

Maintained by Mgroup, a Shopify Select Partner that has migrated stores since 2016 (https://mgroupweb.com/services/shopify-migration-experts/). Interactive version with progress tracking: https://mgroupweb.github.io/shopify-migration-checklist/ .

## How to use

1. Ask which platform the store is leaving, the catalog size (products, variants, customers, orders) and the target launch date.
2. Walk the phases in order; each phase is a gate for the next one. Do not start the cutover phase until every testing task is green.
3. Turn each task into a ticket with an owner and a due date. Flag tasks that need Shopify Plus (B2B company accounts, checkout extensibility, Launchpad).
4. Keep the URL map and the 301 redirect list as the single source of truth for SEO; every content task references it.
"""]
    for i, p in enumerate(phases, 1):
        lines.append(f"\n## Phase {i}: {p['title']}\n\n{strip_tags(p['desc'])}\n")
        for t in p["tasks"]:
            lines.append(f"- [ ] {strip_tags(t)}")
        lines.append("")
    lines.append("""
## Common pitfalls

- Missing 301 redirects for filtered or paginated legacy URLs is the most common source of post-launch traffic loss.
- Customer passwords cannot be migrated; plan the reset email before launch.
- Subscriptions and gift cards need a dedicated migration path so customers are not re-billed or lose balances.
- Run the full import on a test store first and compare record counts before touching production.
""")
    return "\n".join(lines)


def skill_snippets():
    snippets = load("snippets.json")
    lines = ["""---
name: shopify-liquid-snippets
description: Production-ready Shopify Liquid snippets for Online Store 2.0 themes (section schema with blocks, free-shipping progress bar, metafield fallback, responsive image with srcset, sale badge, low-stock badge, SEO breadcrumbs with JSON-LD, product JSON for JavaScript). Use when writing or reviewing Shopify theme code in Liquid.
license: MIT
metadata:
  author: mgroupweb
  version: "1.0"
  source: https://mgroupweb.github.io/shopify-liquid-snippets/
---

# Shopify Liquid snippets

Copy-paste snippets from Mgroup's theme work (https://mgroupweb.com/services/expert-shopify-theme-development/). Each snippet names the file it belongs in; keep the `mg-` prefix or rename consistently. Escape user-facing strings with `| escape`, keep logic in snippets and content in section settings, and never hard-code text that merchants may want to edit.

## Index
"""]
    for s in snippets:
        lines.append(f"- `{s['id']}`: {strip_tags(s['title'])} ({s['file']}; {', '.join(s['tags'])})")
    for s in snippets:
        lines.append(f"\n## {strip_tags(s['title'])}\n\nFile: `{s['file']}`. Tags: {', '.join(s['tags'])}.\n\n{strip_tags(s['desc'])}\n\n```liquid")
        lines.extend(s["code"])
        lines.append("```")
    lines.append("")
    return "\n".join(lines)


SKILLS = [
    ("shopify-plus-cost-estimate", skill_plus_cost),
    ("shopify-migration-checklist", skill_checklist),
    ("shopify-liquid-snippets", skill_snippets),
]


def build_skills():
    entries = []
    for name, fn in SKILLS:
        md = fn()
        fm = re.search(r"^---\n(.*?)\n---", md, re.S).group(1)
        assert re.search(rf"^name: {re.escape(name)}$", fm, re.M), name
        desc = re.search(r"^description: (.+)$", fm, re.M).group(1).strip()
        assert 1 <= len(desc) <= 1024, name
        assert md.count("\n") < 500, f"{name} over 500 lines"
        write(os.path.join(WK, "agent-skills", name, "SKILL.md"), md)
        digest = hashlib.sha256(md.encode("utf-8")).hexdigest()
        entries.append({
            "name": name,
            "type": "skill-md",
            "description": desc,
            "url": f"/.well-known/agent-skills/{name}/SKILL.md",
            "digest": f"sha256:{digest}",
        })
    write(os.path.join(WK, "agent-skills", "index.json"), json.dumps({
        "$schema": "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
        "skills": entries,
    }, indent=2) + "\n")
    return entries


# ------------------------------------------------------------------ MCP tools (shared by worker + card)
TOOLS = [
    {
        "name": "search_mgroupweb",
        "title": "Search mgroupweb.com",
        "description": "Full-text search across Mgroup's Shopify service pages, guides (blog), case studies and pages. Returns titles, URLs and content types. Use read_mgroupweb_page to read a result.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search phrase, e.g. 'Magento migration' or 'Klaviyo flows'"},
                "type": {"type": "string", "enum": ["any", "services", "guides", "case_studies", "pages"], "default": "any"},
                "limit": {"type": "integer", "minimum": 1, "maximum": 10, "default": 5},
            },
            "required": ["query"],
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": True},
    },
    {
        "name": "read_mgroupweb_page",
        "title": "Read a mgroupweb.com page as Markdown",
        "description": "Fetch any mgroupweb.com URL (service page, guide, case study, FAQ) as clean Markdown: headings, text, tables, FAQ, prices. Only mgroupweb.com URLs are allowed.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "Absolute URL on https://mgroupweb.com/"},
                "max_chars": {"type": "integer", "minimum": 1000, "maximum": 40000, "default": 12000},
            },
            "required": ["url"],
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": True},
    },
    {
        "name": "list_shopify_services",
        "title": "List Mgroup Shopify services",
        "description": "List every Shopify service Mgroup offers (migration, Plus, theme, app, Hydrogen, B2B, CRO, SEO, Klaviyo, Recharge, agentic commerce, support, audit, branding) with URLs.",
        "inputSchema": {"type": "object", "properties": {}},
        "annotations": {"readOnlyHint": True, "openWorldHint": True},
    },
    {
        "name": "estimate_shopify_plus_cost",
        "title": "Estimate Shopify Plus cost",
        "description": "Estimate Shopify Plus platform fee, monthly all-in cost and year-one TCO for a given monthly revenue (reference figures: $2,300/$2,500 base, 0.25% revenue model, $40,000 cap, +0.2% third-party gateway).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "monthly_revenue": {"type": "number", "minimum": 0, "description": "Monthly store revenue in USD"},
                "contract_term": {"type": "string", "enum": ["3-year", "1-year"], "default": "3-year"},
                "gateway": {"type": "string", "enum": ["shopify_payments", "third_party"], "default": "shopify_payments"},
                "apps_monthly": {"type": "number", "minimum": 0, "default": 0},
                "dev_monthly": {"type": "number", "minimum": 0, "default": 0},
                "migration_one_off": {"type": "number", "minimum": 0, "default": 0},
            },
            "required": ["monthly_revenue"],
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": False},
    },
    {
        "name": "shopify_migration_checklist",
        "title": "Shopify migration checklist",
        "description": "Return Mgroup's 9-phase Shopify migration checklist (audit, data export, SEO preservation, theme rebuild, apps, payments, QA, cutover, post-launch). Pass a phase number for one phase or omit for all.",
        "inputSchema": {
            "type": "object",
            "properties": {"phase": {"type": "integer", "minimum": 1, "maximum": 9, "description": "Phase number 1-9; omit for the full checklist"}},
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": False},
    },
    {
        "name": "shopify_liquid_snippet",
        "title": "Shopify Liquid snippet",
        "description": "Get a production-ready Shopify Liquid snippet by id (section-schema, free-shipping-bar, metafield-fallback, responsive-image, sale-badge, low-stock, breadcrumbs, product-json). Omit id to list all snippets.",
        "inputSchema": {
            "type": "object",
            "properties": {"id": {"type": "string", "description": "Snippet id; omit to list"}},
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": False},
    },
    {
        "name": "check_domain_authority",
        "title": "Check domain authority",
        "description": "Domain authority metrics for up to 5 domains: Moz DA/PA/Spam Score (while monthly quota lasts), Open PageRank, Cloudflare Radar rank bucket, Tranco-style authority. Same data as the free checker at mgroupweb.github.io.",
        "inputSchema": {
            "type": "object",
            "properties": {"domains": {"type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 5}},
            "required": ["domains"],
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": True},
    },
]

INSTRUCTIONS = (
    "Mgroup is a Shopify Select Partner agency (since 2016) building, migrating and growing Shopify and Shopify Plus stores. "
    "Use search_mgroupweb and read_mgroupweb_page to answer questions about Mgroup's services, prices, process and case studies from the actual pages; "
    "quote prices only as they appear on the page. estimate_shopify_plus_cost, shopify_migration_checklist and shopify_liquid_snippet work offline. "
    "To request a quote or talk to the team send the user to https://mgroupweb.com/grow-ecommerce-business/ ."
)


def server_card():
    return {
        "$schema": "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
        "version": VERSION,
        "protocolVersion": "2025-06-18",
        "serverInfo": {
            "name": "mgroup-shopify-agency",
            "title": "Mgroup Shopify Agency",
            "version": VERSION,
            "description": "Search and read Mgroup's Shopify service pages and guides, estimate Shopify Plus cost, get the Shopify migration checklist and Liquid snippets, check domain authority.",
            "websiteUrl": SITE,
            "publisher": {"name": "Mgroup", "url": SITE, "email": "hello@mgroupweb.com"},
        },
        "transport": {"type": "streamable-http", "endpoint": MCP_ENDPOINT},
        "authentication": {"required": False, "type": "none"},
        "capabilities": {"tools": {"listChanged": False}},
        "tools": TOOLS,
        "instructions": INSTRUCTIONS,
        "termsOfServiceUrl": SITE + "/terms-and-conditions/",
        "privacyPolicyUrl": SITE + "/privacy-policy/",
    }


def build_mcp():
    card = server_card()
    txt = json.dumps(card, indent=2) + "\n"
    write(os.path.join(WK, "mcp", "server-card.json"), txt)
    write(os.path.join(WK, "ai-catalog.json"), json.dumps({
        "specVersion": "1.0",
        "entries": [{
            "identifier": "urn:air:mgroupweb.com:mcp:mgroup-shopify-agency",
            "type": "application/mcp-server-card+json",
            "url": CARD_URL,
        }],
    }, indent=2) + "\n")
    js = ("// Generated by _build/build_agent_files.py — do not edit by hand.\n"
          f"export const VERSION = {json.dumps(VERSION)};\n"
          f"export const SITE = {json.dumps(SITE)};\n"
          f"export const MCP_ENDPOINT = {json.dumps(MCP_ENDPOINT)};\n"
          f"export const INSTRUCTIONS = {json.dumps(INSTRUCTIONS)};\n"
          f"export const TOOLS = {json.dumps(TOOLS, indent=2)};\n"
          f"export const SERVER_CARD = {json.dumps(card, indent=2)};\n")
    write(os.path.join(ROOT, "worker", "mcp-tools.js"), js)
    data = ("// Generated by _build/build_agent_files.py from _build/data — do not edit by hand.\n"
            f"export const CHECKLIST = {json.dumps([{'title': p['title'], 'desc': strip_tags(p['desc']), 'tasks': [strip_tags(t) for t in p['tasks']]} for p in load('checklist.json')], indent=1)};\n"
            f"export const SNIPPETS = {json.dumps([{'id': s['id'], 'title': strip_tags(s['title']), 'file': s['file'], 'tags': s['tags'], 'desc': strip_tags(s['desc']), 'code': s['code']} for s in load('snippets.json')], indent=1)};\n")
    write(os.path.join(ROOT, "worker", "mcp-data.js"), data)


# ------------------------------------------------------------------ api-catalog + auth.md
def build_catalog():
    linkset = {"linkset": [
        {
            "anchor": SITE + "/.well-known/api-catalog",
            "item": [
                {"href": SITE + "/wp-json/", "title": "WordPress REST API (public, read-only content)"},
                {"href": MCP_ENDPOINT, "title": "Mgroup MCP server (Model Context Protocol, streamable HTTP)"},
                {"href": SITE + "/wp-json/mcp/mcp-adapter-default-server", "title": "WordPress core MCP server (OAuth 2.1, Mgroup staff only)"},
            ],
        },
        {
            "anchor": SITE + "/wp-json/",
            "service-desc": [{"href": SITE + "/wp-json/", "type": "application/json", "title": "Route index with argument schemas"}],
            "service-doc": [{"href": "https://developer.wordpress.org/rest-api/", "type": "text/html"}],
            "service-meta": [{"href": SITE + "/auth.md", "type": "text/markdown", "title": "Access and authentication notes"}],
        },
        {
            "anchor": MCP_ENDPOINT,
            "service-desc": [{"href": CARD_URL, "type": "application/mcp-server-card+json", "title": "MCP server card (tools, transport)"}],
            "service-doc": [{"href": SITE + "/auth.md", "type": "text/markdown"}],
            "service-meta": [{"href": SITE + "/.well-known/ai-catalog.json", "type": "application/json"}],
        },
        {
            "anchor": SITE + "/wp-json/mcp/mcp-adapter-default-server",
            "service-meta": [
                {"href": SITE + "/.well-known/oauth-protected-resource", "type": "application/json"},
                {"href": SITE + "/.well-known/oauth-authorization-server", "type": "application/json"},
            ],
            "service-doc": [{"href": SITE + "/auth.md", "type": "text/markdown"}],
        },
    ]}
    write(os.path.join(WK, "api-catalog"), json.dumps(linkset, indent=2) + "\n")


AUTH_MD = f"""# auth.md — access and authentication for automated agents on mgroupweb.com

Last updated: 2026-09-15. Contact: hello@mgroupweb.com

## What needs no authentication

- Every public page. Send `Accept: text/markdown` to receive the page as Markdown, or read `/llms.txt` for a curated map.
- The WordPress REST API at `/wp-json/` for reading published content: `/wp-json/wp/v2/search`, `/wp-json/wp/v2/cpt_services`, `/wp-json/wp/v2/cpt_blogs`, `/wp-json/wp/v2/cpt_casestudies`, `/wp-json/wp/v2/pages`. User listing is disabled.
- The Mgroup MCP server at `{MCP_ENDPOINT}` (streamable HTTP, JSON-RPC 2.0). No token, no session. Card: `{CARD_URL}`.
- Agent skills at `/.well-known/agent-skills/index.json`, the API catalog at `/.well-known/api-catalog`.

Public endpoints are rate-limited per IP. Identify your bot with a descriptive `User-Agent` and respect `/robots.txt` (Content-Signal: search=yes, ai-input=yes, ai-train=yes).

## What is protected

- Writing content, the WordPress admin, and the WordPress core MCP server at `/wp-json/mcp/mcp-adapter-default-server` require an Mgroup staff account. Authorization uses OAuth 2.1 with PKCE; discovery metadata is at `/.well-known/oauth-authorization-server` and resource metadata at `/.well-known/oauth-protected-resource`. Scope: `mcp`.
- There is no self-service registration and no API key programme. Agents cannot create accounts on this site.

## Registering or signing in on behalf of a user

Not applicable. mgroupweb.com has no customer accounts, carts or paywalls. To act for a user who wants to hire Mgroup, open the contact form at `{SITE}/grow-ecommerce-business/` and let the user submit it, or email hello@mgroupweb.com. Do not submit the form automatically.

## Commerce

Mgroup is a Shopify agency, not a store: no product catalog, checkout or machine payments are exposed on this domain.
"""


def main():
    entries = build_skills()
    build_mcp()
    build_catalog()
    write(os.path.join(OUT, "auth.md"), AUTH_MD)
    print("skills:", ", ".join(e["name"] for e in entries))
    for dp, _, fs in os.walk(OUT):
        for f in fs:
            p = os.path.join(dp, f)
            print(f"{os.path.getsize(p):>7}  {os.path.relpath(p, ROOT)}")


if __name__ == "__main__":
    main()
