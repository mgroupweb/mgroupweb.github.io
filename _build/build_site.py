#!/usr/bin/env python3
"""Assemble mgroupweb.github.io pages on the canonical Mgroup site shell
(hero-nav / page-hero / cta-banner--partner / mg-footer from mgroup-prototype) + per-page tool bodies.
Run:  python3 _build/build_site.py   (from the repo root or anywhere)."""
import json, os, html
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://mgroupweb.github.io"
MG = "https://mgroupweb.com"
CONTACT = MG + "/grow-ecommerce-business/"
ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ARROW_BTN = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
MARK = ('<svg viewBox="0 0 68 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2.81379 19.4222C4.44167 15.5546 6.84496 12.0652 9.87395 9.17135C12.9882 6.2424 16.6393 3.94925 20.6242 2.4194C29.3958 -0.804248 39.0202 -0.804248 47.7918 2.4194C51.7901 3.94488 55.4544 6.23825 58.5797 9.17135C61.5854 12.077 63.9743 15.5641 65.6023 19.4222C67.2696 23.5452 68.0831 27.9662 67.9933 32.4155C68.0702 36.8612 67.2438 41.2759 65.5646 45.3898C63.9546 49.254 61.578 52.7483 58.5797 55.6596C55.4594 58.5993 51.7938 60.8936 47.7918 62.4116C46.132 63.0696 44.4186 63.5822 42.6708 63.9435V63.7922C40.1292 58.7424 37.2109 55.2813 38.5665 52.312C39.4137 50.4207 42.9156 46.9785 41.9742 47.092C25.5005 48.7942 21.415 36.7655 22.0928 36.1224C22.7705 35.4794 26.6866 42.099 34.7258 43.6877C41.4094 45.0683 52.0279 38.9405 52.0279 38.9405C51.4442 33.0585 45.2501 30.7133 42.0119 28.0655C34.8011 22.1457 37.8887 16.5664 49.5427 15.3748C50.3711 15.2803 47.66 10.325 43.085 10.0792C36.4014 9.682 18.8733 8.05548 14.3172 18.9872C12.4344 23.5074 14.8067 25.3798 12.6039 31.0727C10.8906 35.4794 8.3678 42.4205 3.64219 47.1298C3.34096 46.5624 3.05853 45.9761 2.79494 45.352C1.06866 41.2608 0.19101 36.859 0.215637 32.4155C0.191383 27.9518 1.07554 23.5302 2.81379 19.4222ZM46.1162 18.59C32.1841 21.8053 47.0575 27.4414 49.6368 30.4864C51.5504 32.4605 52.8969 34.9176 53.5341 37.5977C54.3351 37.0506 55.0067 36.3334 55.5013 35.4967C55.9958 34.66 56.3012 33.7243 56.3958 32.7559C56.6217 26.6092 51.689 25.0772 50.2205 23.829C48.545 22.3494 47.1539 20.5737 46.1162 18.59Z" fill="currentColor"/></svg>')

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
    r = p["rel"]
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(p["title"])}</title>
<meta name="description" content="{html.escape(p["desc"])}">
<link rel="canonical" href="{url}">
<meta name="robots" content="{p.get("robots", "index, follow, max-image-preview:large")}">
<meta name="theme-color" content="#1F2544">
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
<link rel="icon" href="{r}assets/img/mark.svg" type="image/svg+xml">
<link rel="preload" href="{r}assets/fonts/fivosans/fivosans-bold-webfont.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{r}assets/fonts/fivosans/fivosans-regular-webfont.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{r}assets/css/main-shared.css">
<link rel="stylesheet" href="{r}assets/css/main-service.css">
<link rel="stylesheet" href="{r}assets/css/tools.css">
<script type="application/ld+json">{ld}</script>
</head>
<body class="is-page-inner service-page tools-page">
"""

MEGA = [
  ("services/expert-shopify-theme-development/", "Shopify Theme Development", "Build and support", ""),
  ("services/build-shopify-store/", "Shopify Store Development", "Custom, scalable, optimized", ""),
  ("services/custom-shopify-sections/", "Custom Shopify Sections", "Design, speed, conversion", ""),
  ("services/shopify-hydrogen-development/", "Shopify Headless", "Custom headless development", ""),
  ("services/shopify-migration-experts/", "Shopify Migration", "Extensive experience in transferring", ""),
  ("services/create-shopify-application/", "Shopify App Development", "Create and publish on App Store", ""),
  ("services/ecommerce-shopify-tech-audit-consulting/", "Tech Audit and Consulting", "eCommerce audit service", ""),
  ("services/ui-branding-shopify-store/", "eCommerce Branding", "Better user experience", ""),
  ("services/shopify-store-support-service/", "On-Demand Shopify Support", "Resource service provider", ""),
  ("services/shopify-customer-retention-optimization/", "Shopify CRO Services", "More sales with Shopify CRO", ""),
  ("services/shopify-b2b-wholesale/", "Shopify B2B &amp; Wholesale", "B2B &amp; wholesale solutions", "PLUS"),
  ("services/shopify-seo-ecommerce-marketing/", "SEO Marketing", "Expert Shopify SEO", ""),
  ("services/ai-ecommerce-agency-development-services/", "Shopify AI Development", "AI integrations &amp; store optimization", "NEW"),
]

def nav(p):
    r = p["rel"] or "./"
    parts = []
    for u, t, s, b in MEGA:
        feat = " nav-mega__link--featured" if b == "PLUS" else ""
        badge = '<span class="nav-mega__badge">' + b + '</span>' if b else ""
        parts.append(f'<a class="nav-mega__link{feat}" href="{MG}/{u}" role="menuitem"><strong>{t}{badge}</strong><span>{s}</span></a>')
    mega = "".join(parts)
    return f"""<nav class="hero-nav" aria-label="Primary">
  <a class="hero-nav__logo" href="{r}" aria-label="Mgroup Shopify Developer Tools — home"><span class="hero-nav__logo-mark" aria-hidden="true">{MARK}</span></a>
  <div class="hero-nav__menu" id="nav-menu">
    <div class="hero-nav__menu-bar" aria-hidden="true"><a class="hero-nav__menu-logo" href="{r}" aria-label="Mgroup home">{MARK}</a></div>
    <ul class="hero-nav__links">
      <li><a href="{r}"{' aria-current="page"' if p["path"] == "/" else ""}>Tools</a></li>
      <li><a href="{MG}/shopify-plus-agency/">About us</a></li>
      <li class="nav-item nav-item--dropdown">
        <button class="nav-link-btn" aria-expanded="false" aria-controls="nav-services-menu" type="button">Services<svg class="nav-caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="nav-mega" id="nav-services-menu" role="menu">
          <a class="nav-mega__heading" href="{MG}/services/">Core Shopify Services</a>
          <div class="nav-mega__grid">{mega}</div>
          <div class="nav-mega__foot"><strong>Shopify Plus experts</strong><p>We are a Shopify Plus Agency specializing in custom development, B2B, checkout extensibility, ERP/CRM integrations, and retained support for scaling brands.</p><a class="nav-mega__cta" href="{CONTACT}">Book a Free Consultation →</a></div>
        </div>
      </li>
      <li><a href="{MG}/blogs/">Insights</a></li>
      <li><a href="{MG}/vacancies/">Careers</a></li>
      <li><a href="{CONTACT}">Contact</a></li>
    </ul>
    <a class="hero-nav__cta" href="{CONTACT}">Get in touch{ARROW}</a>
  </div>
  <button class="hero-nav__burger" id="nav-burger" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Open menu"><svg class="menuicon" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 50 50" aria-hidden="true"><title>Toggle Menu</title><g><line class="menuicon__bar" x1="13" y1="16.5" x2="37" y2="16.5"></line><line class="menuicon__bar" x1="13" y1="24.5" x2="37" y2="24.5"></line><line class="menuicon__bar" x1="13" y1="32.5" x2="37" y2="32.5"></line><circle class="menuicon__circle" r="23" cx="25" cy="25"></circle></g></svg></button>
</nav>
"""

def hero(p):
    h = p["hero"]
    actions = "".join(
        f'<a class="btn-pill {cls}" href="{href}">{label}{ARROW if i == 0 else ""}</a>'
        for i, (cls, href, label) in enumerate(h["actions"]))
    return f"""<section class="page-hero" aria-labelledby="page-title">
  <canvas class="hero-aura" aria-hidden="true"></canvas>
  <canvas class="hero-ribbons" aria-hidden="true"></canvas>
  <div class="hero-content">
    <div class="hero-content__text">
      <h1 class="hero-title" id="page-title">{h["title"]}</h1>
      <p class="hero-desc">{h["desc"]}</p>
      <div class="hero-actions">{actions}</div>
    </div>
  </div>
</section>

<main id="main">
"""

def cta(eyebrow, title, lead, label="Book a Free Consultation"):
    return f"""
  <section class="section" id="contact" aria-labelledby="contact-title">
    <div class="container">
      <div class="cta-banner cta-banner--partner">
        <div class="cta-banner__inner">
          <div class="cta-banner__copy"><span class="eyebrow cta-banner__eyebrow">{eyebrow}</span><h2 class="cta-banner__title" id="contact-title">{title}</h2><p class="cta-banner__lead">{lead}</p></div>
          <div class="cta-banner__actions"><a class="btn btn--paper btn--lg" href="{CONTACT}">{label}{ARROW_BTN}</a></div>
        </div>
      </div>
    </div>
  </section>
</main>
"""

FOOTER = f"""<footer class="mg-footer" role="contentinfo">
  <div class="mg-footer__inner">
    <div class="mg-footer__cols">
      <nav class="mg-footer__col" aria-label="Company"><h6>Company</h6><ul class="mg-footer__list"><li><a href="{MG}/">Home</a></li><li><a href="{MG}/shopify-plus-agency/">About Us</a></li><li><a href="{MG}/case-studies/">Case Studies</a></li><li><a href="{MG}/blogs/">Insights</a></li><li><a href="{MG}/vacancies/">Careers</a></li><li><a href="{CONTACT}">Contact</a></li></ul></nav>
      <nav class="mg-footer__col" aria-label="Services"><h6>Services</h6><ul class="mg-footer__list"><li><a href="{MG}/services/build-shopify-store/">Shopify Store Development</a></li><li><a href="{MG}/services/expert-shopify-theme-development/">Shopify Theme Development</a></li><li><a href="{MG}/shopify-plus-agency/">Shopify Plus Development</a></li><li><a href="{MG}/services/shopify-migration-experts/">Shopify Migration</a></li><li><a href="{MG}/services/create-shopify-application/">Shopify App Development</a></li><li><a href="{MG}/services/shopify-hydrogen-development/">Shopify Hydrogen Development</a></li><li><a href="{MG}/services/shopify-customer-retention-optimization/">Shopify CRO Services</a></li><li><a href="{MG}/services/shopify-b2b-wholesale/">Shopify B2B &amp; Wholesale</a></li><li><a href="{MG}/services/ai-ecommerce-agency-development-services/">Shopify AI Development</a></li><li><a href="{MG}/services/shopify-store-support-service/">On-Demand Shopify Support</a></li><li><a href="{MG}/services/ecommerce-shopify-tech-audit-consulting/">Tech Audit &amp; Consulting</a></li><li><a href="{MG}/services/shopify-seo-ecommerce-marketing/">Shopify SEO Services</a></li><li><a href="{MG}/services/klaviyo-email-marketing-agency/">Klaviyo Email Marketing</a></li><li><a href="{MG}/services/shopify-subscriptions-recharge/">Shopify Subscriptions</a></li><li><a href="{MG}/services/agentic-commerce-shopify/">Agentic Commerce</a></li></ul></nav>
      <nav class="mg-footer__col" aria-label="Expertise"><h6>Expertise</h6><ul class="mg-footer__list"><li><a href="{MG}/services/expert-shopify-theme-development/">Checkout Customization</a></li><li><a href="{MG}/shopify-plus-agency/">Shopify Functions</a></li><li><a href="{MG}/shopify-plus-agency/">Shopify Checkout Extensibility</a></li><li><a href="{MG}/shopify-plus-agency/">Shopify Markets Setup</a></li><li><a href="{MG}/services/create-shopify-application/">ERP / CRM Integrations</a></li><li><a href="{MG}/services/create-shopify-application/">Subscription Integrations</a></li><li><a href="{MG}/services/custom-shopify-sections/">Product Configurators</a></li><li><a href="{MG}/services/shopify-b2b-wholesale/">Custom Pricing Logic</a></li><li><a href="{MG}/services/custom-shopify-sections/">Custom Shopify Sections</a></li><li><a href="{MG}/services/expert-shopify-theme-development/">Theme Customization</a></li><li><a href="{MG}/services/create-shopify-application/">App Customization</a></li><li><a href="{MG}/services/ecommerce-shopify-tech-audit-consulting/">Performance Optimization</a></li><li><a href="{MG}/services/shopify-customer-retention-optimization/">PDP / PLP Optimization</a></li><li><a href="{MG}/services/shopify-seo-ecommerce-marketing/">Technical SEO for Shopify</a></li><li><a href="{MG}/services/ai-ecommerce-agency-development-services/">AI Product Recommendations</a></li></ul></nav>
      <nav class="mg-footer__col" aria-label="Engagement Models and Careers"><h6><a href="{MG}/shopify-engagement-models/">Engagement Models</a></h6><ul class="mg-footer__list"><li><a href="{MG}/on-demand-shopify-retainer/">On-Demand Service</a></li><li><a href="{MG}/time-and-material-shopify-development/">Time &amp; Material</a></li><li><a href="{MG}/fixed-price-shopify-development/">Fixed Price</a></li></ul><h6 class="mg-footer__heading--secondary"><a href="{MG}/vacancies/">Careers</a></h6><ul class="mg-footer__list"><li><a href="{MG}/vacancies/shopify-developer-vacancy/">Shopify Developer <span class="mg-footer__col-badge">HOT</span></a></li><li><a href="{MG}/vacancies/project-manager/">Project Manager</a></li><li><a href="{MG}/vacancies/full-stack-js-developer/">Full-Stack JS Developer</a></li><li><a href="{MG}/vacancies/front-end-developer/">Front-end Developer</a></li><li><a href="{MG}/vacancies/sales-manager-bdm/">Sales Manager, BDM</a></li><li><a href="{MG}/vacancies/lead-generation-specialist-shopify-ecommerce/">Lead Generation Specialist</a></li></ul></nav>
      <div class="mg-footer__col" aria-label="Contacts"><h6><a href="{CONTACT}">Contacts</a></h6><ul class="mg-footer__list"><li><a href="mailto:info@mgroupweb.com">info@mgroupweb.com</a></li><li><a class="mg-footer__phone" href="tel:+380973725255"><span class="mg-footer__phone-label">Ukraine</span><span class="mg-footer__phone-number">+380 97 372 5255</span></a></li><li><a class="mg-footer__phone" href="tel:+447520685750"><span class="mg-footer__phone-label">United Kingdom</span><span class="mg-footer__phone-number">+44 7520 685750</span></a></li><li><a href="{CONTACT}">Book a meeting</a></li><li><a href="https://github.com/mgroupweb">Mgroup on GitHub</a></li></ul><p class="mg-footer__serving">Serving brands in the US, UK, EU, Canada, and Australia</p></div>
    </div>
    <div class="mg-footer__bottom"><a class="mg-footer__brandmark" href="{MG}/" aria-label="Mgroup"><img src="__REL__assets/img/logo.svg" alt="Mgroup" width="188" height="45" loading="lazy"></a><ul class="mg-footer__legal"><li><a href="{MG}/sitemap-mgroup-shopify-web-design-development/">Sitemap</a></li><li><a href="{MG}/terms-and-conditions/">Terms and Conditions</a></li><li><a href="{MG}/privacy-policy/" rel="privacy-policy">Privacy policy</a></li><li><a href="https://github.com/mgroupweb/mgroupweb.github.io">Source on GitHub</a></li></ul></div>
    <div class="mg-footer__copyright">© 2015–2026 <a href="{MG}/">Mgroup</a>. All rights reserved. Free tools by <a href="{MG}/">Mgroup — Shopify Development Agency</a>; figures are reference points, confirm current terms with Shopify.</div>
  </div>
</footer>
"""

def footer(p):
    r = p["rel"]
    scripts = ["assets/js/main.js", "assets/js/hero-aura.js", "assets/js/hero-ribbons.js"] + p.get("scripts", [])
    return FOOTER.replace("__REL__", r) + "".join(f'<script src="{r}{s}" defer></script>\n' for s in scripts) + "</body>\n</html>\n"

def bc(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + u} for i, (n, u) in enumerate(items)]}

# ---------------------------------------------------------------- bento visuals (crisp dashed-line mockups, brand only)
def visual_calc():
    return """<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif">
      <defs><radialGradient id="bv-calc-halo" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#40D0FF" stop-opacity="0.28"/><stop offset="1" stop-color="#40D0FF" stop-opacity="0"/></radialGradient><filter id="bv-calc-sh"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#1F2544" flood-opacity="0.18"/></filter></defs>
      <ellipse cx="140" cy="90" rx="120" ry="80" fill="url(#bv-calc-halo)"/>
      <rect x="20" y="22" width="150" height="136" rx="8" fill="none" stroke="#40D0FF" stroke-opacity="0.8" stroke-dasharray="0.5 4" stroke-linecap="round"/>
      <rect x="34" y="36" width="90" height="6" rx="3" fill="#FFFFFF" fill-opacity="0.35"/>
      <rect x="34" y="52" width="122" height="14" rx="7" fill="none" stroke="#40D0FF" stroke-opacity="0.8" stroke-dasharray="0.5 4"/>
      <rect x="34" y="76" width="122" height="14" rx="7" fill="none" stroke="#40D0FF" stroke-opacity="0.8" stroke-dasharray="0.5 4"/>
      <rect x="34" y="100" width="58" height="14" rx="7" fill="#FFFFFF" fill-opacity="0.12"/><rect x="98" y="100" width="58" height="14" rx="7" fill="none" stroke="#40D0FF" stroke-opacity="0.6" stroke-dasharray="0.5 4"/>
      <line x1="170" y1="70" x2="190" y2="70" stroke="#40D0FF" stroke-opacity="0.7" stroke-dasharray="0.5 4"/>
      <g filter="url(#bv-calc-sh)"><rect x="190" y="44" width="72" height="52" rx="8" fill="#FFFFFF"/></g>
      <text x="200" y="62" font-size="7" font-weight="700" fill="#5A58E2">PLATFORM FEE</text>
      <text x="200" y="82" font-size="13" font-weight="700" fill="#1F2544">$5,000</text>
      <rect x="190" y="106" width="72" height="8" rx="4" fill="none" stroke="#40D0FF" stroke-opacity="0.7" stroke-dasharray="0.5 4"/>
      <rect x="190" y="106" width="44" height="8" rx="4" fill="#40D0FF" fill-opacity="0.55"/>
      <rect x="190" y="120" width="72" height="8" rx="4" fill="none" stroke="#40D0FF" stroke-opacity="0.7" stroke-dasharray="0.5 4"/>
      <rect x="190" y="120" width="26" height="8" rx="4" fill="#5A58E2" fill-opacity="0.7"/>
    </svg>"""

def visual_check():
    rows = "".join(f'<rect x="34" y="{y}" width="{w}" height="6" rx="3" fill="#FFFFFF" fill-opacity="0.3"/><rect x="20" y="{y-3}" width="10" height="10" rx="3" fill="none" stroke="#40D0FF" stroke-opacity="0.8" stroke-dasharray="0.5 4"/>' for y, w in [(72, 110), (92, 90), (112, 120), (132, 80)])
    return f"""<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif">
      <defs><radialGradient id="bv-chk-halo" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#40D0FF" stop-opacity="0.26"/><stop offset="1" stop-color="#40D0FF" stop-opacity="0"/></radialGradient><filter id="bv-chk-sh"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#1F2544" flood-opacity="0.18"/></filter></defs>
      <ellipse cx="120" cy="96" rx="110" ry="76" fill="url(#bv-chk-halo)"/>
      <rect x="10" y="22" width="160" height="136" rx="8" fill="none" stroke="#40D0FF" stroke-opacity="0.8" stroke-dasharray="0.5 4"/>
      <rect x="20" y="34" width="140" height="8" rx="4" fill="none" stroke="#40D0FF" stroke-opacity="0.7" stroke-dasharray="0.5 4"/><rect x="20" y="34" width="92" height="8" rx="4" fill="#40D0FF" fill-opacity="0.55"/>
      <g filter="url(#bv-chk-sh)"><rect x="20" y="48" width="140" height="14" rx="4" fill="#FFFFFF"/></g>
      <rect x="26" y="52" width="6" height="6" rx="2" fill="#5A58E2"/><text x="38" y="58" font-size="7" font-weight="700" fill="#1F2544">301 redirect map</text>
      {rows}
      <path d="M170 90 C 190 90, 190 60, 208 60" fill="none" stroke="#40D0FF" stroke-opacity="0.7" stroke-dasharray="0.5 4"/>
      <rect x="208" y="44" width="58" height="32" rx="8" fill="none" stroke="#40D0FF" stroke-opacity="0.8" stroke-dasharray="0.5 4"/>
      <text x="237" y="58" font-size="7" font-weight="700" fill="#40D0FF" text-anchor="middle">SEO</text><text x="237" y="69" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">100%</text>
      <path d="M170 110 C 190 110, 190 120, 208 120" fill="none" stroke="#40D0FF" stroke-opacity="0.7" stroke-dasharray="0.5 4"/>
      <rect x="208" y="104" width="58" height="32" rx="8" fill="none" stroke="#40D0FF" stroke-opacity="0.8" stroke-dasharray="0.5 4"/>
      <text x="237" y="118" font-size="7" font-weight="700" fill="#40D0FF" text-anchor="middle">DOWNTIME</text><text x="237" y="129" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">0 min</text>
    </svg>"""

def visual_liquid():
    lines = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="5" rx="2.5" fill="{c}" fill-opacity="{o}"/>' for x, y, w, c, o in [
        (34, 40, 70, "#40D0FF", .9), (46, 52, 110, "#FFFFFF", .35), (46, 64, 80, "#FFFFFF", .35), (58, 76, 96, "#B7B5FF", .8), (46, 88, 60, "#FFFFFF", .35), (34, 100, 50, "#40D0FF", .9)])
    return f"""<svg viewBox="0 0 280 180" xmlns="http://www.w3.org/2000/svg" font-family="Inter, system-ui, sans-serif">
      <defs><radialGradient id="bv-liq-halo" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#40D0FF" stop-opacity="0.26"/><stop offset="1" stop-color="#40D0FF" stop-opacity="0"/></radialGradient><filter id="bv-liq-sh"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#1F2544" flood-opacity="0.18"/></filter></defs>
      <ellipse cx="140" cy="90" rx="120" ry="80" fill="url(#bv-liq-halo)"/>
      <rect x="20" y="22" width="150" height="136" rx="8" fill="none" stroke="#40D0FF" stroke-opacity="0.8" stroke-dasharray="0.5 4"/>
      <circle cx="32" cy="32" r="2.5" fill="#40D0FF" fill-opacity="0.7"/><circle cx="40" cy="32" r="2.5" fill="#5A58E2" fill-opacity="0.7"/>
      {lines}
      <rect x="34" y="118" width="80" height="14" rx="7" fill="none" stroke="#40D0FF" stroke-opacity="0.7" stroke-dasharray="0.5 4"/><text x="74" y="128" font-size="7" font-weight="700" fill="#40D0FF" text-anchor="middle">{{% schema %}}</text>
      <line x1="170" y1="76" x2="190" y2="76" stroke="#40D0FF" stroke-opacity="0.7" stroke-dasharray="0.5 4"/>
      <g filter="url(#bv-liq-sh)"><rect x="190" y="52" width="72" height="48" rx="8" fill="#FFFFFF"/></g>
      <rect x="198" y="60" width="56" height="6" rx="3" fill="#1F2544" fill-opacity="0.85"/><rect x="198" y="70" width="40" height="4" rx="2" fill="#1F2544" fill-opacity="0.35"/>
      <rect x="198" y="80" width="30" height="12" rx="6" fill="#1F2544"/><text x="213" y="88.5" font-size="6.5" font-weight="700" fill="#FFFFFF" text-anchor="middle">Copy</text>
      <rect x="190" y="110" width="72" height="14" rx="7" fill="none" stroke="#40D0FF" stroke-opacity="0.7" stroke-dasharray="0.5 4"/><text x="226" y="120" font-size="7" font-weight="700" fill="#40D0FF" text-anchor="middle">OS 2.0 ready</text>
    </svg>"""

# ---------------------------------------------------------------- pages
PAGES = []

SERVICES6 = [
  ("services/expert-shopify-theme-development/", "Custom Shopify Theme Development", "We build Shopify themes from scratch using clean, modular Liquid code and modern Shopify web development practices. No pre-built templates. Every theme targets 90+ Lighthouse scores and follows Online Store 2.0 architecture."),
  ("services/shopify-migration-experts/", "Shopify Store Migration Services", "We migrate stores from WooCommerce, Magento, Salesforce Commerce Cloud, BigCommerce, and custom platforms. Our process preserves SEO equity — URLs, 301 redirects, metadata, canonical tags, and structured data are handled before launch."),
  ("services/create-shopify-application/", "Shopify App Development", "As a Shopify app development agency, we build custom solutions when existing apps don't fit — private apps for individual stores and public apps for the Shopify App Store. Our published apps include Mgroup Image Zoom, Checkout UI Editor, and Dynamic Price."),
  ("services/shopify-customer-retention-optimization/", "Conversion Rate Optimization (CRO)", "We analyze store data — heatmaps, session recordings, funnel analytics — and run structured tests to identify what increases revenue. Selected CRO and performance projects have delivered up to 40% uplift in key metrics."),
  ("services/shopify-b2b-wholesale/", "B2B &amp; Wholesale Shopify Solutions", "We build B2B sales channels using native Shopify features and custom development. This includes tiered pricing, wholesale account portals, bulk ordering, net payment terms, and ERP integrations."),
  ("services/shopify-store-support-service/", "Ongoing Shopify Support &amp; Maintenance", "After launch, we stay. Our retainer clients get access to senior Shopify developers, designers, and strategists — bug fixes, feature requests, performance monitoring, and strategic consulting."),
]
services_grid = "".join(f'<article class="mg-service col-span-4"><h3 class="mg-service__title"><a href="{MG}/{u}">{t}</a></h3><p class="mg-service__desc">{d}</p></article>' for u, t, d in SERVICES6)

# ---- HUB
PAGES.append({
  "path": "/", "rel": "",
  "title": "Free Shopify Developer Tools by Mgroup | Plus Pricing, Migration, Liquid",
  "desc": "Free Shopify developer tools from Mgroup, a Shopify Select Partner since 2016: Shopify Plus pricing calculator, migration checklist and copy-paste Liquid snippets.",
  "hero": {"title": '<span class="grad">Free Shopify</span><br>Developer Tools',
           "desc": "Practical, no-login tools we use in real Shopify projects — built and maintained by Mgroup, a Shopify development agency and certified Shopify Select Partner since 2016. Model your Shopify Plus bill, migrate without losing SEO, or drop production-ready Liquid into your theme.",
           "actions": [("btn-pill--white", "shopify-plus-pricing-calculator/", "Plus Pricing Calculator"), ("btn-pill--ghost-light", "#tools", "See all tools")]},
  "ld": [
    {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "Mgroup Shopify Developer Tools", "publisher": {"@id": MG + "/#organization"}, "inLanguage": "en"},
    ORG,
    {"@type": "CollectionPage", "url": SITE + "/", "name": "Free Shopify Developer Tools by Mgroup", "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": MG + "/#organization"},
     "hasPart": [
       {"@type": "WebApplication", "name": "Shopify Plus Pricing Calculator", "url": SITE + "/shopify-plus-pricing-calculator/"},
       {"@type": "HowTo", "name": "Shopify Migration Checklist", "url": SITE + "/shopify-migration-checklist/"},
       {"@type": "TechArticle", "name": "Shopify Liquid Snippets", "url": SITE + "/shopify-liquid-snippets/"}]}
  ],
  "body": f"""
  <section class="section" id="tools" aria-labelledby="tools-title">
    <div class="container">
      <header class="section__head section__head--center">
        <span class="eyebrow">Free tools</span>
        <h2 class="section__title" id="tools-title">Shopify tools that answer the questions merchants ask us most</h2>
        <p class="section__lead">Each tool is a working app, not a landing page. No sign-up, no tracking, open source on <a href="https://github.com/mgroupweb/mgroupweb.github.io">GitHub</a>.</p>
      </header>
      <div class="bento">
        <article class="bento__cell bento__cell--hero">
          <div class="bento__body">
            <h3 class="bento__title bento__title--lg"><a href="shopify-plus-pricing-calculator/">Shopify Plus Pricing Calculator</a></h3>
            <p class="bento__desc">Enter monthly revenue, contract term and your app/dev budget. See the platform fee — flat $2,300–$2,500 vs the 0.25% revenue model — third-party gateway fees and a first-year total cost of ownership. Figures mirror our Shopify Plus pricing guide.</p>
            <ul class="bento__chips">
              <li><a href="shopify-plus-pricing-calculator/">Model my Plus bill <span aria-hidden="true">→</span></a></li>
              <li><a href="shopify-plus-pricing-calculator/#how">How the model works <span aria-hidden="true">→</span></a></li>
              <li><a href="{MG}/blogs/shopify-plus-pricing-cost/">Pricing guide 2026 <span aria-hidden="true">→</span></a></li>
            </ul>
          </div>
          <div class="bento__visual" aria-hidden="true">{visual_calc()}</div>
        </article>
        <article class="bento__cell">
          <h3 class="bento__title"><a href="shopify-migration-checklist/">Shopify Migration Checklist</a></h3>
          <p class="bento__desc">9 phases, 74 tasks from pre-migration SEO audit to post-launch monitoring. Progress saves in your browser; export it as a plain-text plan for your team.</p>
          <div class="bento__visual" aria-hidden="true">{visual_check()}</div>
        </article>
        <article class="bento__cell">
          <h3 class="bento__title"><a href="shopify-liquid-snippets/">Shopify Liquid Snippets</a></h3>
          <p class="bento__desc">Copy-paste Liquid for Online Store 2.0 themes: section schema, free-shipping bar, metafields with fallbacks, responsive images, sale and low-stock badges, breadcrumbs.</p>
          <div class="bento__visual" aria-hidden="true">{visual_liquid()}</div>
        </article>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="partner-title">
    <div class="container">
      <header class="section__head section__head--center">
        <span class="eyebrow">Shopify Select Partner</span>
        <h2 class="section__title" id="partner-title">Shopify Select Partner agency with 500+ stores supported and $100M+ in client store GMV since 2016</h2>
        <p class="section__lead">Mgroup is a verified <a href="{MG}/">Shopify development partner</a> — a tier earned through proven revenue impact, certified team expertise, and quarterly evaluation by Shopify. Out of 700,000+ partners worldwide, approximately 500 hold Select status or higher. Our team of 20+ works exclusively on Shopify.</p>
      </header>
      <div class="stats">
        <div class="stat"><div class="stat__num">$100M+</div><div class="stat__label">Client store GMV supported</div></div>
        <div class="stat"><div class="stat__num">Up to 40%</div><div class="stat__label">Uplift in CRO &amp; performance</div></div>
        <div class="stat"><div class="stat__num">12+ months</div><div class="stat__label">Avg. client relationship</div></div>
        <div class="stat"><div class="stat__num">500+</div><div class="stat__label">Shopify stores supported</div></div>
      </div>
    </div>
  </section>

  <section class="section section--mg-dark" aria-labelledby="services-title">
    <div class="container">
      <header class="section__head"><span class="eyebrow">Our Expertise</span><h2 class="mg-services-title" id="services-title">Custom Shopify Development Services</h2><p class="section__lead">4 published apps on the <a href="https://apps.shopify.com/mgroup-dynamic-price">Shopify App Store</a>. 5.0 rating on the <a href="https://www.shopify.com/partners/directory/partner/mgroup">Shopify Partner Directory</a>. Explore our full range of <a href="{MG}/services/">Shopify services</a> and <a href="{MG}/case-studies/">Shopify case studies</a>.</p></header>
      <div class="grid">{services_grid}</div>
    </div>
  </section>
""" + cta("Shopify Select Partner", "Need this done on your <span class=\"grad\">Shopify store</span>?", "Custom themes, migrations, app development, CRO, and ongoing support for eCommerce brands. A senior Shopify developer replies within one business day.")
})

# ---- CALCULATOR
PAGES.append({
  "path": "/shopify-plus-pricing-calculator/", "rel": "../",
  "title": "Shopify Plus Pricing Calculator 2026 | Platform Fee & TCO | Mgroup",
  "desc": "Free Shopify Plus pricing calculator: model the $2,300–$2,500 platform fee vs the 0.25% revenue-based model, gateway fees, apps and development to get your real monthly and first-year cost.",
  "scripts": ["assets/js/calculator.js"],
  "hero": {"title": '<span class="grad">Shopify Plus</span><br>Pricing Calculator',
           "desc": "Model your real Shopify Plus bill: flat platform fee vs the revenue-based model, third-party gateway fees, apps and development. Numbers mirror our Shopify Plus pricing guide — confirm current terms with Shopify before you sign.",
           "actions": [("btn-pill--white", "#calc", "Start calculating"), ("btn-pill--ghost-light", "#how", "How the model works")]},
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
  <section class="section" aria-label="Calculator">
    <div class="container">
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
            <span class="field__label" id="termLabel">Contract term</span>
            <div class="seg" role="radiogroup" aria-labelledby="termLabel">
              <label><input type="radio" name="term" value="2300" checked>3-year · $2,300/mo</label>
              <label><input type="radio" name="term" value="2500">1-year · $2,500/mo</label>
            </div>
          </div>
          <div class="field">
            <span class="field__label" id="gwLabel">Payment gateway</span>
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
    </div>
  </section>

  <section class="section" id="how" aria-labelledby="how-title">
    <div class="container container-narrow prose">
      <header class="section__head"><span class="eyebrow">How the model works</span><h2 class="section__title" id="how-title">Shopify Plus pricing in 2026, explained</h2></header>
      <p><strong>Base fee.</strong> Shopify Plus has historically started at around $2,300 per month on a three-year term (billed annually), or roughly $2,500 per month on a standard one-year agreement. That is a big jump from the ~$399/month Advanced plan.</p>
      <p><strong>Revenue-based pricing.</strong> For larger merchants the fee moves to a variable model of around 0.25% of monthly sales, with the flat fee acting as a floor and the variable fee capped at a widely reported $40,000 per month. The crossover point sits at roughly $800,000 in monthly revenue.</p>
      <p><strong>Transaction fees.</strong> If you use Shopify Payments you avoid the extra per-order fee Shopify charges when payments run through a third-party gateway. On a store doing millions a year that fee alone can run into five or six figures.</p>
      <p><strong>Hidden costs.</strong> Apps, development, integrations, migration and payment processing routinely add up to more than the subscription itself. Full breakdown in our <a href="{MG}/blogs/shopify-plus-pricing-cost/">Shopify Plus pricing 2026 guide</a>.</p>
      <p class="note">Prices change. Treat these figures as well-established reference points and confirm the current numbers with Shopify before you sign — the structure of the cost is what you need to plan around.</p>
    </div>
  </section>
""" + cta("Shopify Plus Partner", "Planning a move to <span class=\"grad\">Shopify Plus</span>?", "Talk to Mgroup about custom development, B2B, checkout extensibility, ERP/CRM integrations, and retained support for scaling brands.")
})

# ---- CHECKLIST
PAGES.append({
  "path": "/shopify-migration-checklist/", "rel": "../",
  "title": "Shopify Migration Checklist 2026 | 74 Tasks, SEO-Safe | Mgroup",
  "desc": "Interactive Shopify migration checklist from Mgroup's migration experts: 9 phases and 74 tasks covering data, 301 redirects, SEO, theme, apps, payments, QA, launch and post-launch monitoring.",
  "scripts": ["assets/js/checklist.js"],
  "hero": {"title": '<span class="grad">Shopify Migration</span><br>Checklist',
           "desc": "The checklist our Shopify migration experts run on every WooCommerce, Magento, BigCommerce and Salesforce Commerce Cloud move — full SEO preservation, data transfer audit, 301 redirects and post-launch monitoring. Progress saves in your browser.",
           "actions": [("btn-pill--white", "#phases", "Open the checklist"), ("btn-pill--ghost-light", MG + "/services/shopify-migration-experts/", "Shopify migration services")]},
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
  <section class="section" aria-label="Checklist">
    <div class="container">
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
    </div>
  </section>

  <section class="section" aria-labelledby="guides-title">
    <div class="container container-narrow prose">
      <header class="section__head"><span class="eyebrow">Platform notes</span><h2 class="section__title" id="guides-title">Platform-specific migration guides</h2></header>
      <p>Each migration follows a platform-specific process because data structures, URL formats and extension ecosystems differ significantly.</p>
      <ul>
        <li><a href="{MG}/blogs/migrate-woocommerce-to-shopify/">WooCommerce to Shopify</a> — plugin conflicts and performance debt; move catalogs, customers, orders, blog content and SEO with full URL redirects.</li>
        <li><a href="{MG}/blogs/how-to-migrate-from-magento-to-shopify/">Magento (Adobe Commerce) to Shopify</a> — highest complexity: custom modules, multi-store setups, configurable products, ERP integrations.</li>
        <li><a href="{MG}/blogs/migrating-from-bigcommerce-to-shopify/">BigCommerce to Shopify</a> — typically faster thanks to cleaner exports.</li>
        <li><a href="{MG}/blogs/wix-to-shopify-migration/">Wix to Shopify</a> and <a href="{MG}/blogs/shopify-wholesale-channel-migration/">wholesale channel migration</a>.</li>
        <li><a href="{MG}/blogs/shopify-seo-migration/">Shopify SEO migration</a> and the <a href="{MG}/blogs/shopify-zero-downtime-guide-for-ecommerce-migration/">zero-downtime cutover guide</a>.</li>
      </ul>
    </div>
  </section>
""" + cta("Shopify Migration Partner", "Ready to migrate to Shopify <span class=\"grad\">without losing SEO</span>?", "Talk to Mgroup about replatforming from WooCommerce, Magento, BigCommerce, SFCC, or custom — with 301 redirect mapping, data integrity checks, and a process we've used since 2016.")
})

# ---- SNIPPETS
PAGES.append({
  "path": "/shopify-liquid-snippets/", "rel": "../",
  "title": "Shopify Liquid Snippets Library | Copy-Paste OS 2.0 Code | Mgroup",
  "desc": "Production-ready Shopify Liquid snippets for Online Store 2.0 themes: section schema, free-shipping progress bar, metafields with fallbacks, responsive images, sale and low-stock badges, breadcrumbs, product JSON.",
  "scripts": ["assets/js/snippets.js"],
  "hero": {"title": '<span class="grad">Shopify Liquid</span><br>Snippets',
           "desc": "Copy-paste Liquid we ship in real themes. Every snippet follows Online Store 2.0 architecture with flexible sections and blocks — the same approach behind our custom Shopify sections and theme development work. MIT licensed.",
           "actions": [("btn-pill--white", "#snippets", "Browse snippets"), ("btn-pill--ghost-light", MG + "/services/custom-shopify-sections/", "Custom Shopify sections")]},
  "ld": [
    {"@type": "TechArticle", "headline": "Shopify Liquid Snippets Library", "url": SITE + "/shopify-liquid-snippets/",
     "description": "Copy-paste Liquid snippets for Shopify Online Store 2.0 themes, maintained by Mgroup.",
     "proficiencyLevel": "Beginner", "author": {"@id": MG + "/#organization"}, "publisher": {"@id": MG + "/#organization"},
     "isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en"},
    ORG,
    bc([("Shopify Developer Tools", "/"), ("Shopify Liquid Snippets", "/shopify-liquid-snippets/")])
  ],
  "body": f"""
  <section class="section" aria-label="Snippets">
    <div class="container">
      <div class="filters" id="filters" role="group" aria-label="Filter snippets by topic"></div>
      <div id="snippets"></div>
    </div>
  </section>

  <section class="section" aria-labelledby="usage-title">
    <div class="container container-narrow prose">
      <header class="section__head"><span class="eyebrow">Using these snippets</span><h2 class="section__title" id="usage-title">How to add Liquid snippets to a Shopify theme</h2></header>
      <ul>
        <li><strong>Sections</strong> go in <code>sections/</code> and need a <code>{{% schema %}}</code> block to appear in the theme editor.</li>
        <li><strong>Snippets</strong> go in <code>snippets/</code> and are rendered with <code>{{% render 'file-name' %}}</code>. Pass variables explicitly — <code>render</code> does not inherit scope.</li>
        <li>Work in a duplicate theme or with <a href="https://shopify.dev/docs/themes/tools/cli">Shopify CLI</a> and Git; never edit the live theme directly.</li>
        <li>Metafield definitions must exist in Settings → Custom data before <code>product.metafields.namespace.key</code> returns a value.</li>
      </ul>
      <p>Need a section that doesn't exist yet? Read the <a href="{MG}/blogs/custom-shopify-sections-guide/">custom Shopify sections guide</a> or hire our <a href="{MG}/services/custom-shopify-sections/">Shopify section developers</a>.</p>
    </div>
  </section>
""" + cta("Shopify Section Partner", "Ready to give your editor <span class=\"grad\">real superpowers</span>?", "Talk to Mgroup about custom Shopify sections — designed for your brand, built on Online Store 2.0, easy to edit, and fast in production.")
})

# ---------------------------------------------------------------- write
for p in PAGES:
    d = os.path.join(OUT, p["path"].strip("/"))
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "index.html"), "w") as f:
        f.write(head(p) + nav(p) + hero(p) + p["body"] + footer(p))
    print("wrote", p["path"])

p404 = {"path": "/404.html", "rel": "/", "title": "Page not found | Mgroup Shopify Developer Tools",
        "desc": "The page you are looking for does not exist.", "robots": "noindex", "ld": [ORG],
        "hero": {"title": '<span class="grad">404</span><br>Page not found',
                 "desc": "That tool moved or never existed. Try the tools hub or head to mgroupweb.com.",
                 "actions": [("btn-pill--white", "/", "All tools"), ("btn-pill--ghost-light", MG + "/", "mgroupweb.com")]}}
with open(os.path.join(OUT, "404.html"), "w") as f:
    f.write(head(p404) + nav(p404) + hero(p404) + "</main>\n" + footer(p404))

with open(os.path.join(OUT, "sitemap.xml"), "w") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            "".join(f"  <url><loc>{SITE}{p['path']}</loc><lastmod>2026-09-11</lastmod><changefreq>monthly</changefreq><priority>{'1.0' if p['path']=='/' else '0.8'}</priority></url>\n" for p in PAGES) +
            "</urlset>\n")
with open(os.path.join(OUT, "robots.txt"), "w") as f:
    f.write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
print("done")
