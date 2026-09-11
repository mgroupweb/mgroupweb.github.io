#!/usr/bin/env python3
"""Assemble mgroupweb.github.io pages from shared chrome + per-page bodies (kept in the same script)."""
import json, os, html
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://mgroupweb.github.io"
MG = "https://mgroupweb.com"
ORG = {
  "@type": "Organization", "@id": MG + "/#organization", "name": "Mgroup", "url": MG + "/",
  "logo": SITE + "/assets/img/mark.svg",
  "sameAs": ["https://www.linkedin.com/company/monkeygroup-llc/", "https://twitter.com/MgroupWeb",
             "https://www.facebook.com/mgroup.dp", "https://www.instagram.com/mgroupweb/",
             "https://www.shopify.com/partners/directory/partner/mgroup", "https://github.com/mgroupweb"]
}

def head(p):
    url = SITE + p["path"]
    ld = json.dumps({"@context": "https://schema.org", "@graph": p["ld"]}, ensure_ascii=False)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(p["title"])}</title>
<meta name="description" content="{html.escape(p["desc"])}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Mgroup Shopify Developer Tools">
<meta property="og:title" content="{html.escape(p["title"])}">
<meta property="og:description" content="{html.escape(p["desc"])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="400">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@MgroupWeb">
<meta name="twitter:title" content="{html.escape(p["title"])}">
<meta name="twitter:description" content="{html.escape(p["desc"])}">
<meta name="twitter:image" content="{SITE}/assets/img/og.png">
<link rel="icon" href="{p["rel"]}assets/img/mark.svg" type="image/svg+xml">
<link rel="preload" href="{p["rel"]}assets/fonts/fivosans-bold-webfont.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{p["rel"]}assets/fonts/fivosans-regular-webfont.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{p["rel"]}assets/css/site.css">
<script type="application/ld+json">{ld}</script>
</head>
<body>
"""

NAV = [("/", "Tools"), ("/shopify-plus-pricing-calculator/", "Plus Pricing"),
       ("/shopify-migration-checklist/", "Migration Checklist"), ("/shopify-liquid-snippets/", "Liquid Snippets")]

def header(p):
    parts = []
    for href, label in NAV:
        target = (p["rel"] + href.lstrip("/")) if href != "/" else (p["rel"] or "./")
        cur = ' aria-current="page"' if href == p["path"] else ""
        parts.append(f'<a href="{target}"{cur}>{label}</a>')
    links = "".join(parts)
    return f"""<a class="sr-only" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container">
    <a class="brand" href="{p["rel"] or "./"}" aria-label="Mgroup Shopify Developer Tools — home">
      <img src="{p["rel"]}assets/img/logo.svg" alt="Mgroup" width="232" height="56">
      <span class="brand__tag">Dev Tools</span>
    </a>
    <nav class="site-nav" aria-label="Tools">{links}</nav>
    <a class="btn btn--dark btn--sm" href="{MG}/">mgroupweb.com</a>
  </div>
</header>
<main id="main">
"""

def crumbs(p):
    if p["path"] == "/": return ""
    return f"""<nav class="crumbs container" aria-label="Breadcrumb"><ol>
<li><a href="{p["rel"]}">Shopify Developer Tools</a></li><li aria-current="page">{html.escape(p["crumb"])}</li></ol></nav>
"""

def cta():
    return f"""<section class="section section--tight"><div class="container">
  <div class="cta-banner">
    <span class="eyebrow eyebrow--on-dark">Built by Mgroup · Shopify Select Partner since 2016</span>
    <h2 class="cta-banner__title">Need this done on your <span class="cta-banner__title-grad">Shopify store</span>?</h2>
    <p class="cta-banner__copy">Custom themes, migrations, app development, CRO, and ongoing support for eCommerce brands. A senior Shopify developer replies within one business day.</p>
    <div class="cta-banner__actions">
      <a class="btn btn--paper btn--lg" href="{MG}/grow-ecommerce-business/">Book a free store audit</a>
      <a class="btn btn--ghost-light btn--lg" href="{MG}/services/">Explore Shopify services</a>
    </div>
  </div>
</div></section>
"""

def footer(p):
    return f"""</main>
<footer class="site-footer">
  <div class="container">
    <div>
      <a class="brand" href="{MG}/"><img src="{p["rel"]}assets/img/logo.svg" alt="Mgroup" width="232" height="56"></a>
      <p style="margin-top:1rem">Shopify development agency that delivers measurable growth. Certified Shopify Select Partner since 2016, 500+ Shopify stores supported, $100M+ client store GMV.</p>
      <a class="btn btn--dark btn--sm" href="{MG}/">Visit mgroupweb.com</a>
    </div>
    <div>
      <h4>Tools</h4>
      <ul>
        <li><a href="{p["rel"]}shopify-plus-pricing-calculator/">Shopify Plus Pricing Calculator</a></li>
        <li><a href="{p["rel"]}shopify-migration-checklist/">Shopify Migration Checklist</a></li>
        <li><a href="{p["rel"]}shopify-liquid-snippets/">Shopify Liquid Snippets</a></li>
        <li><a href="https://github.com/mgroupweb">Mgroup on GitHub</a></li>
      </ul>
    </div>
    <div>
      <h4>Shopify Services</h4>
      <ul>
        <li><a href="{MG}/services/build-shopify-store/">Shopify Store Development</a></li>
        <li><a href="{MG}/services/expert-shopify-theme-development/">Shopify Theme Development</a></li>
        <li><a href="{MG}/services/shopify-migration-experts/">Shopify Migration</a></li>
        <li><a href="{MG}/services/create-shopify-application/">Shopify App Development</a></li>
        <li><a href="{MG}/shopify-plus-agency/">Shopify Plus Agency</a></li>
        <li><a href="{MG}/services/custom-shopify-sections/">Custom Shopify Sections</a></li>
      </ul>
    </div>
    <div>
      <h4>Company</h4>
      <ul>
        <li><a href="{MG}/case-studies/">Shopify Case Studies</a></li>
        <li><a href="{MG}/blogs/">Insights</a></li>
        <li><a href="{MG}/vacancies/">Careers</a></li>
        <li><a href="{MG}/grow-ecommerce-business/">Contact</a></li>
        <li><a href="https://www.shopify.com/partners/directory/partner/mgroup">Shopify Partner Directory</a></li>
      </ul>
    </div>
    <div class="site-footer__bottom">
      <span>© 2015–2026 Mgroup. All rights reserved.</span>
      <span>Free tools by <a href="{MG}/">Mgroup — Shopify Development Agency</a>. Figures are reference points — confirm current terms with Shopify.</span>
    </div>
  </div>
</footer>
{"".join(f'<script src="{s}" defer></script>' for s in p.get("scripts", []))}
</body>
</html>
"""

def bc(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(items)]}

# ---------------------------------------------------------------- pages
PAGES = []

# ---- HUB
PAGES.append({
  "path": "/", "rel": "", "crumb": "",
  "title": "Free Shopify Developer Tools by Mgroup | Plus Pricing, Migration, Liquid",
  "desc": "Free Shopify developer tools from Mgroup, a Shopify Select Partner since 2016: Shopify Plus pricing calculator, migration checklist and copy-paste Liquid snippets.",
  "ld": [
    {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "Mgroup Shopify Developer Tools",
     "publisher": {"@id": MG + "/#organization"}, "inLanguage": "en"},
    ORG,
    {"@type": "CollectionPage", "url": SITE + "/", "name": "Free Shopify Developer Tools by Mgroup",
     "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": MG + "/#organization"},
     "hasPart": [
       {"@type": "WebApplication", "name": "Shopify Plus Pricing Calculator", "url": SITE + "/shopify-plus-pricing-calculator/"},
       {"@type": "HowTo", "name": "Shopify Migration Checklist", "url": SITE + "/shopify-migration-checklist/"},
       {"@type": "TechArticle", "name": "Shopify Liquid Snippets", "url": SITE + "/shopify-liquid-snippets/"}]}
  ],
  "body": f"""
<section class="page-hero container">
  <div class="page-hero__card"><div class="page-hero__inner">
    <span class="hero-pill">Free · No sign-up · Open source</span>
    <h1>Free Shopify Developer Tools</h1>
    <p class="lead">Practical, no-login tools we use in real Shopify projects — built and maintained by <a href="{MG}/" style="color:#fff">Mgroup</a>, a Shopify development agency and certified Shopify Select Partner since 2016.</p>
    <div class="page-hero__actions">
      <a class="btn btn-pill--white" href="shopify-plus-pricing-calculator/">Plus Pricing Calculator</a>
      <a class="btn btn--ghost-light" href="shopify-migration-checklist/">Migration Checklist</a>
      <a class="btn btn--ghost-light" href="shopify-liquid-snippets/">Liquid Snippets</a>
    </div>
  </div></div>
</section>

<section class="section section--hairline"><div class="container">
  <div class="section__head">
    <span class="eyebrow">Tools</span>
    <h2 class="section__title">Shopify tools that answer the questions merchants ask us most</h2>
    <p class="section__lead">Each tool is a working app, not a landing page: model your Shopify Plus bill, run a migration without losing SEO, or drop production-ready Liquid into your theme.</p>
  </div>
  <div class="card-grid card-grid--3">
    <a class="tool-card" href="shopify-plus-pricing-calculator/">
      <span class="tool-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 12h3M13 12h3M8 16h3M13 16h3"/></svg></span>
      <h3>Shopify Plus Pricing Calculator</h3>
      <p>Enter monthly revenue, contract term and your app/dev budget. See the platform fee (flat vs 0.25% revenue model), gateway fees and a first-year total cost of ownership.</p>
      <span class="tool-card__link">Model your Plus bill</span>
    </a>
    <a class="tool-card" href="shopify-migration-checklist/">
      <span class="tool-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg></span>
      <h3>Shopify Migration Checklist</h3>
      <p>9 phases, 60+ tasks from pre-migration SEO audit to post-launch monitoring. Progress saves in your browser; export it as a plain-text plan for your team.</p>
      <span class="tool-card__link">Open the checklist</span>
    </a>
    <a class="tool-card" href="shopify-liquid-snippets/">
      <span class="tool-card__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7l-4 5 4 5M16 7l4 5-4 5M14 4l-4 16"/></svg></span>
      <h3>Shopify Liquid Snippets</h3>
      <p>Copy-paste Liquid for Online Store 2.0 themes: section schema, free-shipping bar, metafields with fallbacks, responsive images, sale and low-stock badges, breadcrumbs.</p>
      <span class="tool-card__link">Browse snippets</span>
    </a>
  </div>
</div></section>

<section class="section section--hairline"><div class="container">
  <div class="section__head">
    <span class="eyebrow">Built by Mgroup</span>
    <h2 class="section__title">Shopify Select Partner agency with 500+ stores supported</h2>
    <p class="section__lead">Mgroup is a verified <a href="{MG}/">Shopify development partner</a> — a tier earned through proven revenue impact, certified team expertise, and quarterly evaluation by Shopify. Our team of 20+ works exclusively on Shopify.</p>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat__num">$100M+</div><div class="stat__label">Client store GMV supported</div></div>
    <div class="stat"><div class="stat__num">Up to 40%</div><div class="stat__label">Uplift in CRO &amp; performance</div></div>
    <div class="stat"><div class="stat__num">12+ months</div><div class="stat__label">Avg. client relationship</div></div>
    <div class="stat"><div class="stat__num">500+</div><div class="stat__label">Shopify stores supported</div></div>
  </div>
  <div class="callout"><p><strong>What we do:</strong> <a href="{MG}/services/build-shopify-store/">Shopify store development</a>, <a href="{MG}/services/expert-shopify-theme-development/">custom theme development</a>, <a href="{MG}/services/shopify-migration-experts/">Shopify migration</a>, <a href="{MG}/services/create-shopify-application/">Shopify app development</a>, <a href="{MG}/services/shopify-b2b-wholesale/">B2B &amp; wholesale</a>, <a href="{MG}/services/shopify-customer-retention-optimization/">CRO</a> and <a href="{MG}/services/shopify-store-support-service/">on-demand support</a>. See <a href="{MG}/case-studies/">real Shopify case studies</a> or our apps on the <a href="https://apps.shopify.com/mgroup-dynamic-price">Shopify App Store</a>.</p></div>
</div></section>
""" + cta()
})

# ---- CALCULATOR
PAGES.append({
  "path": "/shopify-plus-pricing-calculator/", "rel": "../", "crumb": "Shopify Plus Pricing Calculator",
  "title": "Shopify Plus Pricing Calculator 2026 | Platform Fee & TCO | Mgroup",
  "desc": "Free Shopify Plus pricing calculator: model the $2,300–$2,500 platform fee vs the 0.25% revenue-based model, gateway fees, apps and development to get your real monthly and first-year cost.",
  "scripts": ["../assets/js/calculator.js"],
  "ld": [
    {"@type": "WebApplication", "name": "Shopify Plus Pricing Calculator", "url": SITE + "/shopify-plus-pricing-calculator/",
     "applicationCategory": "BusinessApplication", "operatingSystem": "Any", "browserRequirements": "Requires JavaScript",
     "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
     "description": "Estimate Shopify Plus platform fees, revenue-based pricing, gateway fees and total cost of ownership.",
     "author": {"@id": MG + "/#organization"}, "isPartOf": {"@id": SITE + "/#website"}},
    ORG,
    bc([("Shopify Developer Tools", "/"), ("Shopify Plus Pricing Calculator", "/shopify-plus-pricing-calculator/")]),
    {"@type": "FAQPage", "mainEntity": [
      {"@type": "Question", "name": "How much does Shopify Plus cost per month?",
       "acceptedAnswer": {"@type": "Answer", "text": "Shopify Plus has historically started at around $2,300 per month on a three-year term (billed annually), or roughly $2,500 per month on a standard one-year agreement. Above roughly $800,000 in monthly revenue the fee switches to about 0.25% of monthly sales, capped at a reported $40,000 per month."}},
      {"@type": "Question", "name": "Does Shopify Plus charge transaction fees?",
       "acceptedAnswer": {"@type": "Answer", "text": "You always pay card-processing rates. If you use a third-party payment gateway instead of Shopify Payments, Shopify adds an extra per-order transaction fee (around 0.2% on Plus). Using Shopify Payments avoids that fee."}},
      {"@type": "Question", "name": "What is the total cost of ownership of Shopify Plus?",
       "acceptedAnswer": {"@type": "Answer", "text": "Beyond the platform fee, budget for apps (commonly a few hundred to a few thousand dollars a month), development and maintenance, integrations (ERP, PIM, CRM, 3PL), a one-off migration in year one, and payment processing."}}]}
  ],
  "body": f"""
<section class="page-hero container">
  <div class="page-hero__card"><div class="page-hero__inner">
    <span class="hero-pill">Free tool · Updated for 2026</span>
    <h1>Shopify Plus Pricing Calculator</h1>
    <p class="lead">Model your real Shopify Plus bill: flat platform fee vs the revenue-based model, third-party gateway fees, apps and development. Numbers mirror our <a href="{MG}/blogs/shopify-plus-pricing-cost/" style="color:#fff">Shopify Plus pricing guide</a> — confirm current terms with Shopify before you sign.</p>
  </div></div>
</section>

<section class="section"><div class="container">
  <div class="tool">
    <form class="panel panel--sticky" id="calc" aria-label="Shopify Plus cost inputs">
      <h2>Your numbers</h2>
      <div class="field">
        <label for="gmv">Monthly online revenue (GMV)</label>
        <div class="input-money"><input class="input" id="gmv" type="text" inputmode="numeric" value="500,000" autocomplete="off"></div>
        <input class="range" id="gmvRange" type="range" min="50000" max="5000000" step="10000" value="500000" aria-label="Monthly revenue slider">
        <span class="hint">Crossover to revenue-based pricing sits at roughly $800k/month.</span>
      </div>
      <div class="field">
        <span id="termLabel" style="font-family:var(--font-display);font-weight:700;font-size:var(--fs-small);color:var(--c-navy)">Contract term</span>
        <div class="seg" role="radiogroup" aria-labelledby="termLabel">
          <label><input type="radio" name="term" value="2300" checked>3-year · $2,300/mo</label>
          <label><input type="radio" name="term" value="2500">1-year · $2,500/mo</label>
        </div>
      </div>
      <div class="field">
        <span id="gwLabel" style="font-family:var(--font-display);font-weight:700;font-size:var(--fs-small);color:var(--c-navy)">Payment gateway</span>
        <div class="seg" role="radiogroup" aria-labelledby="gwLabel">
          <label><input type="radio" name="gateway" value="0" checked>Shopify Payments</label>
          <label><input type="radio" name="gateway" value="0.002">Third-party · +0.2%</label>
        </div>
        <span class="hint">Card-processing rates apply on every plan and are negotiable on Plus; only the extra third-party fee is modelled here.</span>
      </div>
      <div class="field">
        <label for="apps">Apps per month</label>
        <div class="input-money"><input class="input" id="apps" type="text" inputmode="numeric" value="1,500" autocomplete="off"></div>
        <span class="hint">Reviews, search, loyalty, subscriptions, analytics — typically a few hundred to a few thousand dollars.</span>
      </div>
      <div class="field">
        <label for="dev">Development &amp; maintenance per month</label>
        <div class="input-money"><input class="input" id="dev" type="text" inputmode="numeric" value="4,000" autocomplete="off"></div>
        <span class="hint">Retainer or project work; commonly $30k–$100k+ per year.</span>
      </div>
      <div class="field">
        <label for="migration">One-off migration &amp; integrations (year one)</label>
        <div class="input-money"><input class="input" id="migration" type="text" inputmode="numeric" value="25,000" autocomplete="off"></div>
        <span class="hint">Connecting an ERP, PIM, CRM or 3PL is often the largest one-off cost. <a href="{MG}/services/shopify-migration-experts/">Get a migration plan</a>.</span>
      </div>
      <button class="btn btn--dark" type="button" id="copyResult">Copy summary</button>
    </form>

    <div>
      <div class="result-hero" aria-live="polite">
        <span class="eyebrow">Estimated Shopify Plus platform fee</span>
        <div class="result-hero__num" id="platformMonthly">$2,300</div>
        <div class="result-hero__sub" id="platformNote">Flat fee applies — 0.25% of your revenue is below the base fee.</div>
      </div>
      <div class="result-grid">
        <div class="result-mini"><div class="result-mini__label">Monthly, all-in</div><div class="result-mini__num" id="totalMonthly">—</div></div>
        <div class="result-mini"><div class="result-mini__label">Year one TCO</div><div class="result-mini__num" id="totalYear1">—</div></div>
        <div class="result-mini"><div class="result-mini__label">Ongoing per year</div><div class="result-mini__num" id="totalYear">—</div></div>
        <div class="result-mini"><div class="result-mini__label">Platform fee as % of GMV</div><div class="result-mini__num" id="feePct">—</div></div>
      </div>
      <div class="panel">
        <h2>Monthly cost breakdown</h2>
        <div class="bars" id="bars"></div>
        <p class="note" id="advNote"></p>
      </div>
      <div class="callout"><p><strong>Reading the result.</strong> A store doing $300k/month and a store doing $3m/month are on the same platform but can have very different Plus bills. If B2B, checkout extensibility and international expansion are on your roadmap, Plus is often cheaper than building the same capability with apps and workarounds — see <a href="{MG}/blogs/benefits-shopify-plus-when-should-you-migrate/">when it makes sense to upgrade to Shopify Plus</a> or talk to our <a href="{MG}/shopify-plus-agency/">Shopify Plus agency</a> team.</p></div>
    </div>
  </div>
</div></section>

<section class="section section--tight section--hairline"><div class="container prose">
  <span class="eyebrow">How the model works</span>
  <h2 class="section__title">Shopify Plus pricing in 2026, explained</h2>
  <p><strong>Base fee.</strong> Shopify Plus has historically started at around $2,300 per month on a three-year term (billed annually), or roughly $2,500 per month on a standard one-year agreement. That is a big jump from the ~$399/month Advanced plan.</p>
  <p><strong>Revenue-based pricing.</strong> For larger merchants the fee moves to a variable model of around 0.25% of monthly sales, with the flat fee acting as a floor and the variable fee capped at a widely reported $40,000 per month. The crossover point sits at roughly $800,000 in monthly revenue.</p>
  <p><strong>Transaction fees.</strong> If you use Shopify Payments you avoid the extra per-order fee Shopify charges when payments run through a third-party gateway. On a store doing millions a year that fee alone can run into five or six figures.</p>
  <p><strong>Hidden costs.</strong> Apps, development, integrations, migration and payment processing routinely add up to more than the subscription itself. Full breakdown in our <a href="{MG}/blogs/shopify-plus-pricing-cost/">Shopify Plus pricing 2026 guide</a>.</p>
  <p class="note">Prices change. Treat these figures as well-established reference points and confirm the current numbers with Shopify before you sign — the structure of the cost is what you need to plan around.</p>
</div></section>
""" + cta()
})

# ---- CHECKLIST
PAGES.append({
  "path": "/shopify-migration-checklist/", "rel": "../", "crumb": "Shopify Migration Checklist",
  "title": "Shopify Migration Checklist 2026 | 60+ Tasks, SEO-Safe | Mgroup",
  "desc": "Interactive Shopify migration checklist from Mgroup's migration experts: 9 phases and 60+ tasks covering data, 301 redirects, SEO, theme, apps, payments, QA, launch and post-launch monitoring.",
  "scripts": ["../assets/js/checklist.js"],
  "ld": [
    {"@type": "HowTo", "name": "Shopify Migration Checklist", "url": SITE + "/shopify-migration-checklist/",
     "description": "Step-by-step checklist for migrating an eCommerce store to Shopify without losing data or SEO.",
     "author": {"@id": MG + "/#organization"}, "isPartOf": {"@id": SITE + "/#website"},
     "step": [{"@type": "HowToStep", "position": i + 1, "name": n, "url": SITE + "/shopify-migration-checklist/#phase-" + str(i + 1)} for i, n in enumerate([
        "Pre-migration audit", "Data inventory & export", "SEO preservation plan", "Theme & storefront rebuild", "Apps & integrations",
        "Payments, taxes & shipping", "Testing & QA", "Launch & cutover", "Post-launch monitoring"])]},
    ORG,
    bc([("Shopify Developer Tools", "/"), ("Shopify Migration Checklist", "/shopify-migration-checklist/")])
  ],
  "body": f"""
<section class="page-hero container">
  <div class="page-hero__card"><div class="page-hero__inner">
    <span class="hero-pill">Free tool · Saves in your browser</span>
    <h1>Shopify Migration Checklist</h1>
    <p class="lead">The checklist our <a href="{MG}/services/shopify-migration-experts/" style="color:#fff">Shopify migration experts</a> run on every WooCommerce, Magento, BigCommerce and Salesforce Commerce Cloud move — full SEO preservation, data transfer audit, 301 redirects and post-launch monitoring.</p>
  </div></div>
</section>

<section class="section"><div class="container">
  <div class="tool tool--wide">
    <div>
      <div class="panel" style="margin-bottom:var(--grid-gap)">
        <div class="progress"><div class="progress__track"><div class="progress__fill" id="progressFill" style="width:0%"></div></div><div class="progress__num" id="progressNum">0%</div></div>
        <div class="toolbar">
          <button class="btn btn--dark btn--sm" type="button" id="exportBtn">Copy as plan</button>
          <button class="btn btn--ghost btn--sm" type="button" id="expandBtn">Expand all</button>
          <button class="btn btn--ghost btn--sm" type="button" id="resetBtn">Reset</button>
        </div>
        <p class="note" style="margin-top:0">Progress is stored locally in this browser only. A standard migration includes products, customers, orders, SEO metadata, content pages, blog posts, reviews and discount codes. Customer passwords cannot be migrated — customers receive a password reset email on first login.</p>
      </div>
      <div id="phases"></div>
    </div>
  </div>
</div></section>

<section class="section section--tight section--hairline"><div class="container prose">
  <span class="eyebrow">Platform notes</span>
  <h2 class="section__title">Platform-specific migration guides</h2>
  <p>Each migration follows a platform-specific process because data structures, URL formats and extension ecosystems differ significantly.</p>
  <ul>
    <li><a href="{MG}/blogs/migrate-woocommerce-to-shopify/">WooCommerce to Shopify</a> — plugin conflicts and performance debt; move catalogs, customers, orders, blog content and SEO with full URL redirects.</li>
    <li><a href="{MG}/blogs/how-to-migrate-from-magento-to-shopify/">Magento (Adobe Commerce) to Shopify</a> — highest complexity: custom modules, multi-store setups, configurable products, ERP integrations.</li>
    <li><a href="{MG}/blogs/migrating-from-bigcommerce-to-shopify/">BigCommerce to Shopify</a> — typically faster thanks to cleaner exports.</li>
    <li><a href="{MG}/blogs/wix-to-shopify-migration/">Wix to Shopify</a> and <a href="{MG}/blogs/shopify-wholesale-channel-migration/">wholesale channel migration</a>.</li>
    <li><a href="{MG}/blogs/shopify-seo-migration/">Shopify SEO migration</a> and the <a href="{MG}/blogs/shopify-zero-downtime-guide-for-ecommerce-migration/">zero-downtime cutover guide</a>.</li>
  </ul>
</div></section>
""" + cta()
})

# ---- SNIPPETS
PAGES.append({
  "path": "/shopify-liquid-snippets/", "rel": "../", "crumb": "Shopify Liquid Snippets",
  "title": "Shopify Liquid Snippets Library | Copy-Paste OS 2.0 Code | Mgroup",
  "desc": "Production-ready Shopify Liquid snippets for Online Store 2.0 themes: section schema, free-shipping progress bar, metafields with fallbacks, responsive images, sale and low-stock badges, breadcrumbs, product JSON.",
  "scripts": ["../assets/js/snippets.js"],
  "ld": [
    {"@type": "TechArticle", "headline": "Shopify Liquid Snippets Library", "url": SITE + "/shopify-liquid-snippets/",
     "description": "Copy-paste Liquid snippets for Shopify Online Store 2.0 themes, maintained by Mgroup.",
     "proficiencyLevel": "Beginner", "author": {"@id": MG + "/#organization"}, "publisher": {"@id": MG + "/#organization"},
     "isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en"},
    ORG,
    bc([("Shopify Developer Tools", "/"), ("Shopify Liquid Snippets", "/shopify-liquid-snippets/")])
  ],
  "body": f"""
<section class="page-hero container">
  <div class="page-hero__card"><div class="page-hero__inner">
    <span class="hero-pill">Free · MIT licensed · Online Store 2.0</span>
    <h1>Shopify Liquid Snippets</h1>
    <p class="lead">Copy-paste Liquid we ship in real themes. Every snippet follows Online Store 2.0 architecture with flexible sections and blocks — the same approach behind our <a href="{MG}/services/custom-shopify-sections/" style="color:#fff">custom Shopify sections</a> and <a href="{MG}/services/expert-shopify-theme-development/" style="color:#fff">theme development</a> work.</p>
  </div></div>
</section>

<section class="section"><div class="container">
  <div class="filters" id="filters" role="group" aria-label="Filter snippets by topic"></div>
  <div id="snippets"></div>
</div></section>

<section class="section section--tight section--hairline"><div class="container prose">
  <span class="eyebrow">Using these snippets</span>
  <h2 class="section__title">How to add Liquid snippets to a Shopify theme</h2>
  <ul>
    <li><strong>Sections</strong> go in <code>sections/</code> and need a <code>{{% schema %}}</code> block to appear in the theme editor.</li>
    <li><strong>Snippets</strong> go in <code>snippets/</code> and are rendered with <code>{{% render 'file-name' %}}</code>. Pass variables explicitly — <code>render</code> does not inherit scope.</li>
    <li>Work in a duplicate theme or with <a href="https://shopify.dev/docs/themes/tools/cli">Shopify CLI</a> and Git; never edit the live theme directly.</li>
    <li>Metafield definitions must exist in Settings → Custom data before <code>product.metafields.namespace.key</code> returns a value.</li>
  </ul>
  <p>Need a section that doesn't exist yet? Read the <a href="{MG}/blogs/custom-shopify-sections-guide/">custom Shopify sections guide</a> or hire our <a href="{MG}/services/custom-shopify-sections/">Shopify section developers</a>.</p>
</div></section>
""" + cta()
})

# ---------------------------------------------------------------- write
for p in PAGES:
    d = os.path.join(OUT, p["path"].strip("/"))
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "index.html"), "w") as f:
        f.write(head(p) + header(p) + crumbs(p) + p["body"] + footer(p))
    print("wrote", p["path"])

# 404
p404 = {"path": "/404.html", "rel": "/", "crumb": "", "title": "Page not found | Mgroup Shopify Developer Tools",
        "desc": "The page you are looking for does not exist.", "ld": [ORG]}
h = head(p404).replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex">')
body = f"""<section class="page-hero container"><div class="page-hero__card"><div class="page-hero__inner">
<span class="hero-pill">404</span><h1>Page not found</h1><p class="lead">That tool moved or never existed. Try one of these:</p>
<div class="page-hero__actions"><a class="btn btn-pill--white" href="/">All tools</a><a class="btn btn--ghost-light" href="{MG}/">mgroupweb.com</a></div>
</div></div></section>"""
with open(os.path.join(OUT, "404.html"), "w") as f:
    f.write(h + header(p404) + body + footer(p404))

# sitemap + robots
with open(os.path.join(OUT, "sitemap.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            "".join(f"  <url><loc>{SITE}{p['path']}</loc><lastmod>2026-09-11</lastmod><changefreq>monthly</changefreq><priority>{'1.0' if p['path']=='/' else '0.8'}</priority></url>\n" for p in PAGES) +
            "</urlset>\n")
with open(os.path.join(OUT, "robots.txt"), "w") as f:
    f.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
print("done")
