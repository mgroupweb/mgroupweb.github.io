---
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


## Phase 1: Pre-migration audit

Every Shopify migration project starts with a full data transfer audit. Baseline everything you will compare against after launch. Read: Shopify SEO migration.

- [ ] Crawl the current site (Screaming Frog or similar) and export every indexable URL
- [ ] Export Google Search Console performance: top pages, queries, clicks and impressions for the last 12 months
- [ ] Record Analytics baselines: revenue, conversion rate, AOV, traffic by channel
- [ ] Document current theme features, custom code and third-party scripts
- [ ] List all apps, plugins and integrations with their owners and costs
- [ ] Inventory payment gateways, shipping rules, tax settings and currencies
- [ ] Take a full backup of the legacy database and media library
- [ ] Define the migration scope, timeline, freeze window and stakeholders


## Phase 2: Data inventory & export

A standard migration includes products, customers, orders, SEO metadata, content pages, blog posts, reviews and discount codes. Customer passwords cannot be migrated.

- [ ] Export products with variants, options, SKUs, barcodes, weights and inventory
- [ ] Export product images with alt text; map file names to handles
- [ ] Export categories/collections and product-to-collection assignments
- [ ] Export customers with addresses, tags, marketing consent and company data (B2B)
- [ ] Export order history with line items, fulfilment and payment status
- [ ] Export reviews (with product mapping) and discount codes
- [ ] Export blog posts, CMS pages and legal pages with publish dates
- [ ] Map legacy attributes to Shopify metafields and define them in Custom data
- [ ] Plan the customer password-reset email for first login after launch


## Phase 3: SEO preservation plan

We implement 301 redirects, map legacy URLs and carry over vital data so you do not lose rankings. URL formats differ per platform, so mapping is never one-to-one.

- [ ] Build the URL map: legacy URL → new Shopify URL for products, collections, pages, blog posts
- [ ] Prepare 301 redirects (bulk import in Shopify Navigation → URL redirects)
- [ ] Carry over meta titles, descriptions and image alt text
- [ ] Recreate canonical logic for filtered/paginated collection pages
- [ ] Port structured data (Product, Organization, Breadcrumb, FAQ) into the theme
- [ ] Plan hreflang and Shopify Markets setup for multi-region stores
- [ ] Preserve internal linking in migrated content (rewrite absolute legacy links)
- [ ] Keep robots.txt and sitemap behaviour aligned with the legacy site


## Phase 4: Theme & storefront rebuild

We rebuild your store on Shopify with better architecture and faster performance — Online Store 2.0 sections and blocks, targeting 90+ Lighthouse scores. See Shopify theme development.

- [ ] Choose the approach: custom theme, customised base theme, or Hydrogen/headless
- [ ] Rebuild templates: home, collection, product, cart, search, blog, pages, 404
- [ ] Recreate navigation, mega menu and footer structure
- [ ] Implement filters and sorting (Search & Discovery app or custom)
- [ ] Recreate custom features as sections/blocks — no hard-coded content
- [ ] Set up product templates and metafield-driven content blocks
- [ ] Optimise images, fonts and scripts for Core Web Vitals
- [ ] Configure translations and localisation (Translate & Adapt or app)


## Phase 5: Apps & integrations

App data moves too: a Klaviyo migration keeps flows, segments and profiles intact, and Recharge subscription contracts transfer without re-billing customers. Enterprise builds need ERP, PIM, CRM and 3PL connections.

- [ ] Replace each legacy plugin with a Shopify-native feature, app or custom code
- [ ] Migrate email marketing (Klaviyo): profiles, segments, flows and templates
- [ ] Migrate subscriptions (Recharge or Shopify Subscriptions) without re-billing
- [ ] Connect ERP / PIM / CRM / 3PL via Admin API, Flow or middleware
- [ ] Set up reviews, loyalty, search, analytics and support apps
- [ ] Install GA4, GTM, Meta Pixel and server-side tracking via Customer Events
- [ ] Rebuild B2B: company accounts, catalogs, price lists and net terms (Plus)
- [ ] Document every webhook and API integration with an owner


## Phase 6: Payments, taxes & shipping

Default to Shopify Payments unless you have a compelling reason not to — it avoids the extra third-party gateway fee. Model this in the Shopify Plus pricing calculator.

- [ ] Activate Shopify Payments (or configure the third-party gateway) and test payouts
- [ ] Enable wallets: Shop Pay, Apple Pay, Google Pay, PayPal
- [ ] Configure taxes, VAT/GST registrations and tax-inclusive pricing per market
- [ ] Recreate shipping zones, rates, carrier accounts and local delivery/pickup
- [ ] Set up currencies and Shopify Markets pricing rules
- [ ] Configure checkout: branding, extensions, upsells, order notes
- [ ] Recreate discount rules and automatic discounts; import codes
- [ ] Set up gift cards and store credit if used


## Phase 7: Testing & QA

Test with real data before launch. We perform SEO audits before and after launch so rankings hold.

- [ ] Run a full import on a test store and validate counts (products, variants, customers, orders)
- [ ] Spot-check 50 random products: price, images, variants, inventory, metafields
- [ ] Test every 301 redirect from the URL map (automated crawl)
- [ ] Place test orders on every payment method and shipping scenario
- [ ] Test customer accounts, password reset and order history visibility
- [ ] Cross-browser and mobile QA on templates and checkout
- [ ] Run Lighthouse / Core Web Vitals on key templates
- [ ] Validate structured data and meta tags with Rich Results Test
- [ ] Review accessibility basics: contrast, focus states, alt text, keyboard navigation


## Phase 8: Launch & cutover

Zero-downtime cutover: lower DNS TTL in advance, freeze content on the legacy platform, run a final delta sync, then switch. Guide: zero-downtime migration.

- [ ] Lower DNS TTL 24–48 hours before launch
- [ ] Announce the content and order freeze window to all teams
- [ ] Run the final delta migration: new orders, customers and inventory changes
- [ ] Connect the domain in Shopify and verify SSL
- [ ] Point DNS to Shopify; keep the legacy site reachable on a temporary host
- [ ] Remove the password page and check robots/indexing settings
- [ ] Submit the new sitemap in Google Search Console and Bing Webmaster Tools
- [ ] Send the customer password-reset / welcome email campaign


## Phase 9: Post-launch monitoring

After launch, we stay. Monitor 404s, rankings, speed and conversion for at least 30 days and fix redirect gaps quickly. Ongoing help: on-demand Shopify support.

- [ ] Monitor Search Console for 404s, crawl errors and coverage drops daily for two weeks
- [ ] Compare rankings and organic traffic against the pre-migration baseline
- [ ] Watch conversion rate, AOV and checkout abandonment vs baseline
- [ ] Fix missing redirects and broken internal links as they surface
- [ ] Confirm integrations (ERP, 3PL, email, subscriptions) are syncing correctly
- [ ] Re-run Lighthouse and fix any performance regressions
- [ ] Decommission the legacy platform after 30–60 days of clean data
- [ ] Schedule a post-launch CRO review


## Common pitfalls

- Missing 301 redirects for filtered or paginated legacy URLs is the most common source of post-launch traffic loss.
- Customer passwords cannot be migrated; plan the reset email before launch.
- Subscriptions and gift cards need a dedicated migration path so customers are not re-billed or lose balances.
- Run the full import on a test store first and compare record counts before touching production.
