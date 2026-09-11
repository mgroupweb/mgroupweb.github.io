/* Shopify Migration Checklist — progress persisted in localStorage */
(function () {
  'use strict';
  var MG = 'https://mgroupweb.com';
  var KEY = 'mg-shopify-migration-checklist-v1';
  var PHASES = [
    { title: 'Pre-migration audit', desc: 'Every Shopify migration project starts with a full data transfer audit. Baseline everything you will compare against after launch. Read: <a href="' + MG + '/blogs/shopify-seo-migration/">Shopify SEO migration</a>.', tasks: [
      'Crawl the current site (Screaming Frog or similar) and export every indexable URL',
      'Export Google Search Console performance: top pages, queries, clicks and impressions for the last 12 months',
      'Record Analytics baselines: revenue, conversion rate, AOV, traffic by channel',
      'Document current theme features, custom code and third-party scripts',
      'List all apps, plugins and integrations with their owners and costs',
      'Inventory payment gateways, shipping rules, tax settings and currencies',
      'Take a full backup of the legacy database and media library',
      'Define the migration scope, timeline, freeze window and stakeholders'
    ]},
    { title: 'Data inventory & export', desc: 'A standard migration includes products, customers, orders, SEO metadata, content pages, blog posts, reviews and discount codes. Customer passwords cannot be migrated.', tasks: [
      'Export products with variants, options, SKUs, barcodes, weights and inventory',
      'Export product images with alt text; map file names to handles',
      'Export categories/collections and product-to-collection assignments',
      'Export customers with addresses, tags, marketing consent and company data (B2B)',
      'Export order history with line items, fulfilment and payment status',
      'Export reviews (with product mapping) and discount codes',
      'Export blog posts, CMS pages and legal pages with publish dates',
      'Map legacy attributes to Shopify metafields and define them in Custom data',
      'Plan the customer password-reset email for first login after launch'
    ]},
    { title: 'SEO preservation plan', desc: 'We implement 301 redirects, map legacy URLs and carry over vital data so you do not lose rankings. URL formats differ per platform, so mapping is never one-to-one.', tasks: [
      'Build the URL map: legacy URL → new Shopify URL for products, collections, pages, blog posts',
      'Prepare 301 redirects (bulk import in Shopify Navigation → URL redirects)',
      'Carry over meta titles, descriptions and image alt text',
      'Recreate canonical logic for filtered/paginated collection pages',
      'Port structured data (Product, Organization, Breadcrumb, FAQ) into the theme',
      'Plan hreflang and Shopify Markets setup for multi-region stores',
      'Preserve internal linking in migrated content (rewrite absolute legacy links)',
      'Keep robots.txt and sitemap behaviour aligned with the legacy site'
    ]},
    { title: 'Theme & storefront rebuild', desc: 'We rebuild your store on Shopify with better architecture and faster performance — Online Store 2.0 sections and blocks, targeting 90+ Lighthouse scores. See <a href="' + MG + '/services/expert-shopify-theme-development/">Shopify theme development</a>.', tasks: [
      'Choose the approach: custom theme, customised base theme, or Hydrogen/headless',
      'Rebuild templates: home, collection, product, cart, search, blog, pages, 404',
      'Recreate navigation, mega menu and footer structure',
      'Implement filters and sorting (Search & Discovery app or custom)',
      'Recreate custom features as sections/blocks — no hard-coded content',
      'Set up product templates and metafield-driven content blocks',
      'Optimise images, fonts and scripts for Core Web Vitals',
      'Configure translations and localisation (Translate & Adapt or app)'
    ]},
    { title: 'Apps & integrations', desc: 'App data moves too: a Klaviyo migration keeps flows, segments and profiles intact, and Recharge subscription contracts transfer without re-billing customers. Enterprise builds need ERP, PIM, CRM and 3PL connections.', tasks: [
      'Replace each legacy plugin with a Shopify-native feature, app or custom code',
      'Migrate email marketing (Klaviyo): profiles, segments, flows and templates',
      'Migrate subscriptions (Recharge or Shopify Subscriptions) without re-billing',
      'Connect ERP / PIM / CRM / 3PL via Admin API, Flow or middleware',
      'Set up reviews, loyalty, search, analytics and support apps',
      'Install GA4, GTM, Meta Pixel and server-side tracking via Customer Events',
      'Rebuild B2B: company accounts, catalogs, price lists and net terms (Plus)',
      'Document every webhook and API integration with an owner'
    ]},
    { title: 'Payments, taxes & shipping', desc: 'Default to Shopify Payments unless you have a compelling reason not to — it avoids the extra third-party gateway fee. Model this in the <a href="../shopify-plus-pricing-calculator/">Shopify Plus pricing calculator</a>.', tasks: [
      'Activate Shopify Payments (or configure the third-party gateway) and test payouts',
      'Enable wallets: Shop Pay, Apple Pay, Google Pay, PayPal',
      'Configure taxes, VAT/GST registrations and tax-inclusive pricing per market',
      'Recreate shipping zones, rates, carrier accounts and local delivery/pickup',
      'Set up currencies and Shopify Markets pricing rules',
      'Configure checkout: branding, extensions, upsells, order notes',
      'Recreate discount rules and automatic discounts; import codes',
      'Set up gift cards and store credit if used'
    ]},
    { title: 'Testing & QA', desc: 'Test with real data before launch. We perform SEO audits before and after launch so rankings hold.', tasks: [
      'Run a full import on a test store and validate counts (products, variants, customers, orders)',
      'Spot-check 50 random products: price, images, variants, inventory, metafields',
      'Test every 301 redirect from the URL map (automated crawl)',
      'Place test orders on every payment method and shipping scenario',
      'Test customer accounts, password reset and order history visibility',
      'Cross-browser and mobile QA on templates and checkout',
      'Run Lighthouse / Core Web Vitals on key templates',
      'Validate structured data and meta tags with Rich Results Test',
      'Review accessibility basics: contrast, focus states, alt text, keyboard navigation'
    ]},
    { title: 'Launch & cutover', desc: 'Zero-downtime cutover: lower DNS TTL in advance, freeze content on the legacy platform, run a final delta sync, then switch. Guide: <a href="' + MG + '/blogs/shopify-zero-downtime-guide-for-ecommerce-migration/">zero-downtime migration</a>.', tasks: [
      'Lower DNS TTL 24–48 hours before launch',
      'Announce the content and order freeze window to all teams',
      'Run the final delta migration: new orders, customers and inventory changes',
      'Connect the domain in Shopify and verify SSL',
      'Point DNS to Shopify; keep the legacy site reachable on a temporary host',
      'Remove the password page and check robots/indexing settings',
      'Submit the new sitemap in Google Search Console and Bing Webmaster Tools',
      'Send the customer password-reset / welcome email campaign'
    ]},
    { title: 'Post-launch monitoring', desc: 'After launch, we stay. Monitor 404s, rankings, speed and conversion for at least 30 days and fix redirect gaps quickly. Ongoing help: <a href="' + MG + '/services/shopify-store-support-service/">on-demand Shopify support</a>.', tasks: [
      'Monitor Search Console for 404s, crawl errors and coverage drops daily for two weeks',
      'Compare rankings and organic traffic against the pre-migration baseline',
      'Watch conversion rate, AOV and checkout abandonment vs baseline',
      'Fix missing redirects and broken internal links as they surface',
      'Confirm integrations (ERP, 3PL, email, subscriptions) are syncing correctly',
      'Re-run Lighthouse and fix any performance regressions',
      'Decommission the legacy platform after 30–60 days of clean data',
      'Schedule a post-launch CRO review'
    ]}
  ];

  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }

  var root = document.getElementById('phases');
  var total = 0;
  root.innerHTML = PHASES.map(function (p, pi) {
    total += p.tasks.length;
    return '<details class="phase" id="phase-' + (pi + 1) + '"' + (pi === 0 ? ' open' : '') + '>' +
      '<summary><span class="phase__num">0' + (pi + 1) + '</span><h2 class="phase__title">' + p.title + '</h2><span class="phase__count" data-count="' + pi + '">0 / ' + p.tasks.length + '</span></summary>' +
      '<div class="phase__body"><p class="phase__desc">' + p.desc + '</p>' +
      p.tasks.map(function (t, ti) {
        var id = 'p' + pi + 't' + ti;
        return '<div class="task"><input type="checkbox" id="' + id + '" data-id="' + id + '"' + (saved[id] ? ' checked' : '') + '><label for="' + id + '">' + t + '</label></div>';
      }).join('') + '</div></details>';
  }).join('');

  function update() {
    var done = 0;
    PHASES.forEach(function (p, pi) {
      var d = 0;
      p.tasks.forEach(function (_, ti) { if (saved['p' + pi + 't' + ti]) d++; });
      var c = root.querySelector('[data-count="' + pi + '"]');
      c.textContent = d + ' / ' + p.tasks.length;
      c.classList.toggle('is-done', d === p.tasks.length);
      done += d;
    });
    var pct = Math.round(done / total * 100);
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressNum').textContent = pct + '%';
  }

  root.addEventListener('change', function (e) {
    var cb = e.target;
    if (cb.type !== 'checkbox') return;
    if (cb.checked) saved[cb.dataset.id] = 1; else delete saved[cb.dataset.id];
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (err) {}
    update();
  });

  document.getElementById('resetBtn').addEventListener('click', function () {
    if (!confirm('Clear all progress?')) return;
    saved = {};
    try { localStorage.removeItem(KEY); } catch (err) {}
    root.querySelectorAll('input[type=checkbox]').forEach(function (c) { c.checked = false; });
    update();
  });

  var expanded = false;
  document.getElementById('expandBtn').addEventListener('click', function () {
    expanded = !expanded;
    root.querySelectorAll('details').forEach(function (d) { d.open = expanded; });
    this.textContent = expanded ? 'Collapse all' : 'Expand all';
  });

  document.getElementById('exportBtn').addEventListener('click', function () {
    var btn = this;
    var lines = ['Shopify Migration Checklist — mgroupweb.github.io/shopify-migration-checklist/', ''];
    PHASES.forEach(function (p, pi) {
      lines.push((pi + 1) + '. ' + p.title);
      p.tasks.forEach(function (t, ti) { lines.push('  [' + (saved['p' + pi + 't' + ti] ? 'x' : ' ') + '] ' + t); });
      lines.push('');
    });
    lines.push('Shopify migration services by Mgroup: ' + MG + '/services/shopify-migration-experts/');
    var text = lines.join('\n');
    var done = function () { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, done); }
    else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }
  });

  update();
})();
