"""/footer-credit/ — Mgroup footer credit: live preview + every install variant (Liquid, HTML, img, React, WordPress) + dev instructions.
Imported by build_site.py. Code blocks are pre-rendered in the HTML (SEO + copy buttons via snippets.js)."""
import html as _html
import re

MG = "https://mgroupweb.com"
MARK_SRC = "assets/img/mark.svg"


def _mark_svg(root):
    s = open(f"{root}/{MARK_SRC}").read()
    s = re.sub(r'<g clip-path="[^"]*">', '', s).replace('</g>', '')
    s = re.sub(r'<defs>.*?</defs>', '', s, flags=re.S)
    s = re.sub(r'\s(width|height)="\d+"', '', s, count=2)
    s = s.replace('<svg ', '<svg class="mg-credit__mark" aria-hidden="true" focusable="false" ', 1)
    return re.sub(r'>\s+<', '><', s).strip()


CSS = """.mg-credit{display:inline-flex;align-items:center;gap:.45em;font:inherit;font-size:.875rem;line-height:1;color:inherit;opacity:.85;margin:0}
.mg-credit__link{display:inline-flex;align-items:center;gap:.35em;color:inherit;text-decoration:none;font-weight:600;transition:opacity .2s}
.mg-credit__link:hover,.mg-credit__link:focus-visible{opacity:.75;text-decoration:underline}
.mg-credit__mark{width:1.25em;height:1.25em;flex:0 0 auto;display:block;border-radius:50%}"""


def markup(svg, text="Design and development by", anchor="Mgroup Shopify Agency", url=MG + "/"):
    return f'''<p class="mg-credit">
  <span>{text}</span>
  <a class="mg-credit__link" href="{url}" title="Mgroup — Shopify development agency">
    {svg}
    <span>{anchor}</span>
  </a>
</p>'''


def variants(svg):
    svg_short = svg  # full inline mark in every variant so each block is self-contained
    liquid = f"""{{%- comment -%}}
  snippets/mgroup-credit.liquid — footer credit for sites built by Mgroup.
  Install: Edit code → Snippets → Add a new snippet → "mgroup-credit" → paste this file.
  Then in sections/footer.liquid, right after the copyright line:  {{% render 'mgroup-credit' %}}
  Options: {{% render 'mgroup-credit', text: 'Designed and built by', anchor: 'Mgroup Shopify Agency', size: '0.8rem' %}}
  SEO: <a> wraps only the anchor phrase · dofollow (no rel=nofollow/sponsored) · no UTM · one per page · never hidden.
{{%- endcomment -%}}
{{%- liquid
  assign credit_text = text | default: 'Design and development by'
  assign credit_anchor = anchor | default: 'Mgroup Shopify Agency'
  assign credit_size = size | default: '0.875rem'
  assign credit_url = 'https://mgroupweb.com/'
-%}}
<style>
{CSS.replace('.875rem', '{{ credit_size }}', 1)}
</style>
<p class="mg-credit">
  <span>{{{{ credit_text }}}}</span>
  <a class="mg-credit__link" href="{{{{ credit_url }}}}" title="Mgroup — Shopify development agency">
    {svg_short}
    <span>{{{{ credit_anchor }}}}</span>
  </a>
</p>"""

    render_line = "{% render 'mgroup-credit' %}"
    render_opts = "{% render 'mgroup-credit', text: 'Designed and built by', anchor: 'Mgroup Shopify Agency', size: '0.8rem' %}"

    html_inline = f"""<!-- Mgroup footer credit: paste once into the footer, next to the copyright. -->
<style>
{CSS}
</style>
{markup(svg_short)}"""

    html_img = f"""<!-- Upload mgroup-mark.svg to your assets, then: -->
<p class="mg-credit" style="display:inline-flex;align-items:center;gap:.45em;font-size:.875rem;line-height:1;opacity:.85;margin:0">
  <span>Design and development by</span>
  <a href="https://mgroupweb.com/" title="Mgroup — Shopify development agency" style="display:inline-flex;align-items:center;gap:.35em;color:inherit;text-decoration:none;font-weight:600">
    <img src="/assets/mgroup-mark.svg" alt="" width="18" height="18" loading="lazy" style="width:1.25em;height:1.25em;border-radius:50%">
    <span>Mgroup Shopify Agency</span>
  </a>
</p>"""

    react = f"""// components/MgroupCredit.jsx — Next.js / React / Remix (Hydrogen too)
export default function MgroupCredit({{ text = "Design and development by", anchor = "Mgroup Shopify Agency" }}) {{
  return (
    <p className="mg-credit">
      <span>{{text}}</span>
      <a className="mg-credit__link" href="https://mgroupweb.com/" title="Mgroup — Shopify development agency">
        <svg className="mg-credit__mark" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 540" fill="none">
          {_react_paths(svg_short)}
        </svg>
        <span>{{anchor}}</span>
      </a>
    </p>
  );
}}
// CSS (global or module): see the "CSS only" block below."""

    wordpress = f"""<?php
// functions.php of the child theme — prints the credit after the theme's footer copyright.
// If the theme has a "footer credits" hook use it; otherwise wp_footer is a safe fallback (renders at the end of <body>).
add_action( 'wp_footer', function () {{
    echo <<<HTML
<style>
{CSS}
</style>
{markup(svg_short)}
HTML;
}}, 5 );"""

    css_only = CSS
    return [
        ("liquid", "Shopify Liquid snippet", "snippets/mgroup-credit.liquid", "Full snippet with parameters. Paste as a new snippet, then render it from the footer section.", liquid),
        ("render", "Shopify: render call", "sections/footer.liquid", "Add right after the copyright line. Second line shows the optional parameters.", render_line + "\n\n" + render_opts),
        ("html", "Plain HTML (inline SVG)", "footer template", "Any platform: Webflow embed, static site, Squarespace code block, Shopify without a snippet. Styles included.", html_inline),
        ("img", "HTML with <img>", "footer template + assets", "If inline SVG is not allowed. Download the mark below and adjust the src path.", html_img),
        ("react", "React / Next.js / Hydrogen", "components/MgroupCredit.jsx", "Component with props; styles from the CSS block.", react),
        ("wordpress", "WordPress (functions.php)", "child theme functions.php", "Prints the credit via wp_footer. In block themes you can instead paste the HTML variant into a Custom HTML block in the Footer template part.", wordpress),
        ("css", "CSS only", "your stylesheet", "The four rules used by every variant, if you prefer to keep styles out of the markup.", css_only),
    ]


def _react_paths(svg):
    inner = re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1)
    return inner.replace('fill="', 'fill="').replace('<circle', '\n          <circle').replace('<path', '\n          <path')


def code_block(vid, title, file, desc, code, lang):
    esc = _html.escape(code, quote=False)
    return f'''<article class="snippet" id="{vid}" data-tags="all">
  <div class="snippet__head"><div><h3>{title}</h3><div class="snippet__meta"><span class="tag">{file}</span><span class="tag">{lang}</span></div></div>
  <button class="btn btn--dark btn--sm copy-btn" type="button" aria-label="Copy {_html.escape(title)}">Copy</button></div>
  <p class="snippet__desc">{desc}</p><pre tabindex="0"><code class="language-{lang}">{esc}</code></pre></article>'''


CREDIT_FAQ = [
    ("Is the Mgroup footer credit dofollow?",
     "Yes, and it must stay that way: no rel=\"nofollow\", \"sponsored\" or \"ugc\" on the link. It is a standard designer credit, the same kind every agency and theme vendor places, and it passes authority to mgroupweb.com only when it is a plain followed link."),
    ("Where exactly should the credit go in a Shopify theme?",
     "In the footer section next to the copyright line, so it renders on every page. In Dawn and its children that is sections/footer.liquid, the footer__content-bottom block. Add {% render 'mgroup-credit' %} right after the copyright <small> element."),
    ("Can I change the wording?",
     "Yes. The Liquid snippet takes text, anchor and size parameters. Keep the brand in the anchor (\"Mgroup Shopify Agency\") and keep \"Design and development by\" outside the link; the link should wrap only the anchor phrase."),
    ("Does the credit slow the page down?",
     "No. The round mark is a 2.3 KB inline SVG, there are four CSS rules and no JavaScript. Nothing is fetched from another domain."),
    ("Why is the SVG marked aria-hidden?",
     "So screen readers and search engines read the link text once, as \"Mgroup Shopify Agency\". Without aria-hidden an accessible name on the SVG would duplicate the brand inside the anchor."),
]


def page(root, ORG, bc, faq_html, faq_ld, cta, SITE, ARROW):
    svg = _mark_svg(root)
    V = variants(svg)
    langs = {"liquid": "liquid", "render": "liquid", "html": "html", "img": "html", "react": "jsx", "wordpress": "php", "css": "css"}
    blocks = "\n".join(code_block(vid, t, f, d, c, langs[vid]) for vid, t, f, d, c in V)
    preview = markup(svg)
    return {
        "path": "/footer-credit/", "rel": "../",
        "title": "Mgroup Footer Credit: Liquid Snippet, HTML and React Embed for Client Sites | Mgroup",
        "desc": "Copy-paste footer credit for sites built by Mgroup: Shopify Liquid snippet, plain HTML with inline SVG, img variant, React component and WordPress hook, with the install steps and SEO rules for developers.",
        "scripts": ["assets/js/snippets.js"],
        "hero": {"title": 'Mgroup <span class="grad">Footer Credit</span>',
                 "desc": "One dofollow line for the footer of every site we build: “Design and development by Mgroup Shopify Agency” with the round Mgroup mark. Pick the variant for your stack, copy, paste next to the copyright, done in two minutes.",
                 "actions": [("btn-pill--white", "#variants", "Get the code"), ("btn-pill--ghost-light", "#install", "Install steps")]},
        "ld": [
            {"@type": "TechArticle", "headline": "Mgroup Footer Credit — install guide", "url": SITE + "/footer-credit/",
             "description": "Footer credit snippet for sites built by Mgroup in Liquid, HTML, React and PHP, with installation steps.",
             "proficiencyLevel": "Beginner", "datePublished": "2026-09-16", "dateModified": "2026-09-16",
             "author": {"@id": MG + "/#organization"}, "publisher": {"@id": MG + "/#organization"},
             "isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en"},
            ORG,
            bc([("Shopify Developer Tools", "/"), ("Footer Credit", "/footer-credit/")]),
            faq_ld(CREDIT_FAQ),
        ],
        "body": f"""
  <section class="section" id="preview" aria-labelledby="preview-title">
    <div class="container">
      <header class="section__head section__head--center"><span class="eyebrow">Live preview</span><h2 class="section__title" id="preview-title">How the credit renders on a dark and a light footer</h2><p class="section__lead">Colours of the text are inherited from the site footer; the mark keeps its brand indigo. The mark scales with the footer font size.</p></header>
      <style>{CSS}
.credit-demo{{display:grid;gap:12px;max-width:820px;margin:0 auto}}
.credit-demo__footer{{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:22px 28px;border-radius:var(--r-lg);font-size:.875rem}}
.credit-demo__footer--dark{{background:#111318;color:#b8bcc8}}
.credit-demo__footer--light{{background:#f5f6f9;color:#333a4d;border:1px solid var(--c-line)}}</style>
      <div class="credit-demo">
        <div class="credit-demo__footer credit-demo__footer--dark"><span>© 2026 Client Store. All rights reserved.</span>{preview}</div>
        <div class="credit-demo__footer credit-demo__footer--light"><span>© 2026 Client Store. All rights reserved.</span>{preview}</div>
      </div>
    </div>
  </section>

  <section class="section" id="variants" aria-labelledby="variants-title">
    <div class="container">
      <header class="section__head"><span class="eyebrow">Pick your stack</span><h2 class="section__title" id="variants-title">Every install variant, self-contained, one click to copy</h2><p class="section__lead">Each block includes the mark and the styles it needs. The link is the same in all of them: <code>https://mgroupweb.com/</code>, followed, no UTM.</p></header>
      <div id="snippets">{blocks}</div>
      <p class="note">Need the mark as a file? <a href="../assets/img/mark.svg" download="mgroup-mark.svg">Download mgroup-mark.svg</a> (540×540, indigo #5A58E2).</p>
    </div>
  </section>

  <section class="section" id="install" aria-labelledby="install-title">
    <div class="container container-narrow prose">
      <header class="section__head"><span class="eyebrow">For developers</span><h2 class="section__title" id="install-title">Install steps by platform</h2></header>
      <h3>Shopify (Dawn and any Online Store 2.0 theme)</h3>
      <ol>
        <li>Shopify admin → <strong>Online Store → Themes</strong> → current theme → <strong>⋯ → Edit code</strong>.</li>
        <li><strong>Snippets → Add a new snippet</strong> → name <code>mgroup-credit</code> → paste the <a href="#liquid">Liquid snippet</a> → Save.</li>
        <li>Open <code>sections/footer.liquid</code>. Find the copyright line (in Dawn: <code>&lt;small class="copyright__content"&gt;…&lt;/small&gt;</code> inside <code>footer__content-bottom</code>). Right after it add <code>{{% render 'mgroup-credit' %}}</code> → Save.</li>
        <li>Open any storefront page and check the footer. Themes that build the footer from <code>footer-group.json</code>: open the section that JSON references and add the render call there.</li>
      </ol>
      <h3>Shopify Hydrogen / Headless</h3>
      <p>Use the <a href="#react">React component</a> in your footer layout and add the <a href="#css">CSS</a> to the global stylesheet. Server-rendered by default in Hydrogen and Next.js, which is what the link needs.</p>
      <h3>WordPress</h3>
      <p>Classic themes: paste the <a href="#wordpress">functions.php hook</a> into the child theme, or drop the <a href="#html">HTML variant</a> into <code>footer.php</code> next to the copyright. Block themes: Appearance → Editor → Footer template part → add a <strong>Custom HTML</strong> block with the HTML variant.</p>
      <h3>Webflow, Squarespace, Framer, static sites</h3>
      <p>Paste the <a href="#html">HTML variant</a> into the footer component (Webflow: Embed element in the footer symbol; Squarespace: Code block in the footer; Framer: Code component or the site footer HTML). If the builder strips <code>&lt;svg&gt;</code>, use the <a href="#img">img variant</a> with the downloaded mark.</p>

      <h3>Two-minute check after installing</h3>
      <ol>
        <li>Footer shows the credit on every page; the mark is round; the link opens <code>https://mgroupweb.com/</code>.</li>
        <li>View page source → search <code>mgroupweb.com</code>. The anchor must have <strong>no</strong> <code>rel="nofollow"</code>, <code>rel="sponsored"</code> or <code>rel="ugc"</code>, and must be present in the HTML itself, not injected by JavaScript.</li>
        <li>The text inside <code>&lt;a&gt;</code> is exactly <em>Mgroup Shopify Agency</em>; “Design and development by” sits outside the link.</li>
        <li>Nothing hides it: no <code>display:none</code>, <code>visibility:hidden</code>, <code>font-size:0</code> or <code>opacity:0</code>. The 0.85 opacity in the styles is fine.</li>
        <li>One instance per page. Purge the site cache and CDN after the change.</li>
      </ol>

      <h3>Rules that keep the link valuable</h3>
      <ul>
        <li>Link target is the homepage without UTM parameters. UTM variants create duplicate URLs in Search Console.</li>
        <li>Keep the brand in the anchor. A bare “shopify agency” anchor repeated across many client sites looks like a link scheme; “Mgroup Shopify Agency” is a normal designer credit.</li>
        <li>One link per credit. Do not add a second link to a service page or a case study inside the same line.</li>
        <li>Leave <code>aria-hidden="true"</code> on the mark so the accessible and indexed anchor text stays a single phrase.</li>
        <li>UK clients: pass <code>anchor: 'Mgroup Shopify Agency UK'</code> and point <code>credit_url</code> at <code>{MG}/shopify-agency-uk-ecommerce-development/</code>. Everyone else: the homepage.</li>
      </ul>
      <p>Questions or a platform not covered here? <a href="{MG}/grow-ecommerce-business/">Write to us</a> and we will add the variant. This credit is part of every project delivered by <a href="{MG}/">Mgroup, a Shopify development agency</a>.</p>
    </div>
  </section>
""" + faq_html("Footer credit FAQ", CREDIT_FAQ) + cta("Built by Mgroup", "Need a store that <span class=\"grad\">deserves the credit</span>?", "Mgroup designs, builds and migrates Shopify and Shopify Plus stores — theme development, apps, integrations and SEO — and stays on after launch.", "Talk to Mgroup"),
    }
