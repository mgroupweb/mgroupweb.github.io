# Access and authentication for automated agents — mgroupweb.com

Last updated: 2026-09-15. Contact: hello@mgroupweb.com

## What needs no authentication

- Every public page. Send `Accept: text/markdown` to receive the page as Markdown, or read `/llms.txt` for a curated map.
- The WordPress REST API at `/wp-json/` for reading published content: `/wp-json/wp/v2/search`, `/wp-json/wp/v2/cpt_services`, `/wp-json/wp/v2/cpt_blogs`, `/wp-json/wp/v2/cpt_casestudies`, `/wp-json/wp/v2/pages`. User listing is disabled.
- The Mgroup MCP server at `https://mgroupweb.com/mcp` (streamable HTTP, JSON-RPC 2.0). No token, no session. Card: `https://mgroupweb.com/mcp/server-card`.
- Agent skills at `/.well-known/agent-skills/index.json`, the API catalog at `/.well-known/api-catalog`.

Public endpoints are rate-limited per IP. Identify your bot with a descriptive `User-Agent` and respect `/robots.txt` (Content-Signal: search=yes, ai-input=yes, ai-train=yes).

## What is protected

- Writing content, the WordPress admin, and the WordPress core MCP server at `/wp-json/mcp/mcp-adapter-default-server` require an Mgroup staff account. Authorization uses OAuth 2.1 with PKCE; discovery metadata is at `/.well-known/oauth-authorization-server` and resource metadata at `/.well-known/oauth-protected-resource`. Scope: `mcp`.
- There is no self-service registration and no API key programme. Agents cannot create accounts on this site.

## Registering or signing in on behalf of a user

Not applicable. mgroupweb.com has no customer accounts, carts or paywalls. To act for a user who wants to hire Mgroup, open the contact form at `https://mgroupweb.com/grow-ecommerce-business/` and let the user submit it, or email hello@mgroupweb.com. Do not submit the form automatically.

## Commerce

Mgroup is a Shopify agency, not a store: no product catalog, checkout or machine payments are exposed on this domain.
