"""/footer-credit/ — Mgroup footer credit: live preview + every install variant (Liquid, HTML, img, React, WordPress) + dev instructions.
Imported by build_site.py. Code blocks are pre-rendered in the HTML (SEO + copy buttons via snippets.js)."""
import html as _html
import re
import brand_story

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


def _raw_svg(root, name):
    s = open(f"{root}/assets/img/{name}").read()
    s = re.sub(r'<g clip-path="[^"]*">', '', s).replace('</g>', '')
    s = re.sub(r'<defs>.*?</defs>', '', s, flags=re.S)
    return re.sub(r'>\s+<', '><', s).strip()


BRAND_CSS = """.brand__controls{display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.25rem;margin-bottom:var(--grid-gap)}
.brand__swatches{display:flex;flex-wrap:wrap;gap:.5rem}
.brand__swatch{width:34px;height:34px;border-radius:50%;border:2px solid var(--c-line);cursor:pointer;padding:0;position:relative;box-shadow:var(--shadow-sm)}
.brand__swatch[aria-pressed=true]{outline:3px solid var(--c-indigo);outline-offset:2px}
.brand__hex{display:flex;align-items:center;gap:.5rem}
.brand__hex .input{width:9.5rem;font-family:var(--font-mono);text-transform:uppercase}
.brand__picker{width:34px;height:34px;border:0;padding:0;background:none;cursor:pointer;border-radius:50%;overflow:hidden}
.brand__styles{display:flex;gap:.5rem}
.brand__grid{display:grid;gap:var(--grid-gap);grid-template-columns:1fr}
@media (min-width:768px){.brand__grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.brand__tile{background:var(--c-white);border:1px solid var(--c-line);border-radius:var(--r-lg);box-shadow:var(--shadow-sm);overflow:hidden;display:flex;flex-direction:column}
.brand__canvas{display:flex;align-items:center;justify-content:center;min-height:190px;padding:2rem;background:linear-gradient(135deg,#f6f7fb,#eef0f8);transition:background .2s}
.brand__canvas--dark{background:linear-gradient(135deg,#1F2544,#14182e)}
.brand__canvas svg{max-width:100%;height:auto;max-height:120px;display:block}
.brand__tile--wordmark .brand__canvas svg{width:min(100%,260px)}
.brand__meta{padding:1rem 1.25rem 1.25rem;display:flex;flex-direction:column;gap:.6rem}
.brand__meta h3{margin:0;font-size:1.05rem}
.brand__meta p{margin:0;font-size:var(--fs-small);color:var(--c-slate)}
.brand__dl{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.25rem}"""


def brand_section(root):
    swatches = [("#5A58E2", "Indigo (brand)"), ("#40D0FF", "Cyan (brand)"), ("#1F2544", "Navy (brand)"), ("#000000", "Black"), ("#FFFFFF", "White"), ("#6B7280", "Grey")]
    sw = "".join(f'<button class="brand__swatch" type="button" data-color="{c}" style="background:{c}" aria-label="{n}" title="{n}" aria-pressed="{"true" if c=="#5A58E2" else "false"}"></button>' for c, n in swatches)
    tiles = ""
    for kind, title, desc, vb in [
        ("wordmark", "Wordmark", "Full “mgroup” logotype, 232×56. Use on light or dark surfaces in a colour with enough contrast.", "232×56"),
        ("round", "Round mark", "Circle badge with the M, 540×540. Favicon, social avatar, footer credit.", "540×540"),
        ("square", "Square mark", "Square badge with the M, 500×500. App icons, tiles, sharp-corner layouts.", "500×500"),
    ]:
        tiles += f"""
        <article class="brand__tile brand__tile--{kind}" data-kind="{kind}">
          <div class="brand__canvas" aria-hidden="true"></div>
          <div class="brand__meta">
            <h3>{title}</h3><p>{desc}</p>
            <div class="brand__dl">
              <button class="btn btn--dark btn--sm" type="button" data-dl="svg" data-kind="{kind}">SVG</button>
              <button class="btn btn--dark btn--sm" type="button" data-dl="png" data-kind="{kind}" data-size="512">PNG 512</button>
              <button class="btn btn--dark btn--sm" type="button" data-dl="png" data-kind="{kind}" data-size="2048">PNG 2048</button>
            </div>
          </div>
        </article>"""
    return f"""
  <section class="section" id="brand" aria-labelledby="brand-title">
    <div class="container">
      <header class="section__head section__head--center"><span class="eyebrow">Brand assets</span><h2 class="section__title" id="brand-title">Download the Mgroup logo in any colour</h2><p class="section__lead">Pick a brand colour or type your own HEX, check the preview, download SVG or PNG. Marks come as a filled badge (colour background, contrasting M) or as a mono glyph (transparent, M in the chosen colour).</p></header>
      <style>{BRAND_CSS}</style>
      <div class="brand__controls" role="group" aria-label="Logo colour">
        <div class="brand__swatches">{sw}</div>
        <label class="brand__hex"><span class="field__label">HEX</span><input class="input" id="brand-hex" type="text" value="#5A58E2" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Custom HEX colour"><input class="brand__picker" id="brand-picker" type="color" value="#5A58E2" aria-label="Colour picker"></label>
        <div class="brand__styles" id="brand-style-row" role="group" aria-label="Mark style">
          <button class="chip brand__style" type="button" data-style="fill" aria-pressed="true">Filled badge</button>
          <button class="chip brand__style" type="button" data-style="mono" aria-pressed="false">Mono glyph</button>
        </div>
        <button class="btn btn--dark btn--sm" type="button" data-dl="all" data-kind="all">Download all 3 as SVG</button>
      </div>
      <div class="brand__grid">{tiles}
      </div>
      <p class="note">Brand colours: Indigo <code>#5A58E2</code>, Cyan <code>#40D0FF</code>, Navy <code>#1F2544</code>. Keep clear space around the mark of at least the M’s stroke width; do not stretch, rotate or add effects. Wordmark and marks are also available as originals: <a href="../assets/img/logo.svg" download="mgroup-wordmark.svg">wordmark</a>, <a href="../assets/img/mark.svg" download="mgroup-mark-round.svg">round</a>, <a href="../assets/img/mark-square.svg" download="mgroup-mark-square.svg">square</a>.</p>
      <script type="text/plain" id="brand-src-wordmark">{_raw_svg(root, "logo.svg")}</script>
      <script type="text/plain" id="brand-src-round">{_raw_svg(root, "mark.svg")}</script>
      <script type="text/plain" id="brand-src-square">{_raw_svg(root, "mark-square.svg")}</script>
    </div>
  </section>
"""


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
     "In the footer section next to the copyright line, so it renders on every page. In Dawn and its children that is sections/footer.liquid, the footer__content-bottom block. Add {% render 'mgroup-credit' %} right after the copyright &lt;small&gt; element."),
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
        "title": "Mgroup Brand Kit: Logo, Footer Credit & Brand Story | Mgroup",
        "desc": "Copy-paste footer credit for sites built by Mgroup (Liquid, HTML, React, WordPress) with install steps, plus the Mgroup logo — wordmark, round and square mark — downloadable as SVG or PNG in any colour.",
        "scripts": ["assets/js/snippets.js", "assets/js/brand.js", "assets/js/credit.js"],
        "hero": {"title": 'Mgroup <span class="grad">Brand Kit</span>',
                 "desc": "Everything you need to show the Mgroup mark correctly: the logo in any colour as SVG or PNG, the “Design and development by Mgroup Shopify Agency” footer credit for Liquid, HTML, React and WordPress, and the story of why a monkey became the letter M.",
                 "actions": [("btn-pill--white", "#variants", "Get the code"), ("btn-pill--ghost-light", "#story", "Why the monkey?")]},
        "ld": [
            {"@type": "TechArticle", "headline": "Mgroup Brand Kit: logo, footer credit and brand story", "url": SITE + "/footer-credit/",
             "description": "Footer credit snippet for sites built by Mgroup in Liquid, HTML, React and PHP, the Mgroup logo in any colour, and the brand story behind the monkey mark in nine languages.",
             "about": [{"@id": MG + "/#brand"}, {"@id": SITE + "/footer-credit/#snippet"}],
             "proficiencyLevel": "Beginner", "datePublished": "2026-09-16", "dateModified": "2026-09-16",
             "author": {"@id": MG + "/#organization"}, "publisher": {"@id": MG + "/#organization"},
             "isPartOf": {"@id": SITE + "/#website"}, "inLanguage": "en"},
            ORG,
            bc([("Shopify Developer Tools", "/"), ("Brand Kit", "/footer-credit/")]),
            faq_ld(CREDIT_FAQ),
        ] + brand_story.ld(SITE, MG),
        "body": f"""
  <section class="section" id="preview" aria-labelledby="preview-title">
    <div class="container">
      <header class="section__head section__head--center"><span class="eyebrow">Live preview</span><h2 class="section__title" id="preview-title">How the credit renders on a dark and a light footer</h2><p class="section__lead">Colours of the text are inherited from the site footer; the mark keeps its brand indigo. The mark scales with the footer font size.</p></header>
      <style>{CSS}
.credit-demo{{display:grid;gap:12px;max-width:820px;margin:0 auto}}
.credit-demo__toggle{{display:flex;align-items:center;justify-content:center;gap:.6rem;max-width:820px;margin:0 auto 1rem;font-family:var(--font-display);font-weight:700;font-size:var(--fs-small);color:var(--c-navy);cursor:pointer}}
.credit-demo__toggle input{{width:18px;height:18px;accent-color:var(--c-indigo);cursor:pointer}}
.credit-demo .mg-credit--nomark .mg-credit__mark{{display:none}}
.credit-demo__footer{{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:22px 28px;border-radius:var(--r-lg);font-size:.875rem}}
.credit-demo__footer--dark{{background:#111318;color:#b8bcc8}}
.credit-demo__footer--light{{background:#f5f6f9;color:#333a4d;border:1px solid var(--c-line)}}</style>
      <label class="credit-demo__toggle" for="credit-nomark"><input type="checkbox" id="credit-nomark"> Text only — no mark (removes the logo from the preview and from every code block below)</label>
      <div class="credit-demo">
        <div class="credit-demo__footer credit-demo__footer--dark"><span>© 2026 Client Store. All rights reserved.</span>{preview}</div>
        <div class="credit-demo__footer credit-demo__footer--light"><span>© 2026 Client Store. All rights reserved.</span>{preview}</div>
      </div>
    </div>
  </section>

  <section class="section" id="variants" aria-labelledby="variants-title">
    <div class="container">
      <header class="section__head"><span class="eyebrow">Pick your stack</span><h2 class="section__title" id="variants-title">Every install variant, self-contained, one click to copy</h2><p class="section__lead">Each block includes the mark and the styles it needs. The link is the same in all of them: <code>https://mgroupweb.com/</code>, followed, no UTM. Change the wording or language once — the preview above and every block below update.</p></header>
      <style>.credit-text{{margin-bottom:var(--grid-gap)}}
.credit-text__label{{display:block;margin:0 0 .75rem}}
.credit-text__langs{{display:flex;flex-wrap:wrap;gap:.6rem .5rem;padding-bottom:1.5rem;margin-bottom:1.5rem;border-bottom:1px solid var(--c-line)}}
.credit-text__fields{{display:grid;gap:1rem;grid-template-columns:1fr}}
@media (min-width:768px){{.credit-text__fields{{grid-template-columns:minmax(0,3fr) minmax(0,2fr) auto;gap:1.25rem;align-items:end}}}}
.credit-text__fields .field{{margin-bottom:0;gap:.5rem}}
.credit-text__fields .btn{{height:50px;align-self:end}}
.credit-text .note{{margin:1.25rem 0 0}}</style>
      <div class="panel credit-text" id="credit-text">
        <span class="field__label credit-text__label" id="credit-langs-label">Language of “Design and development by”</span>
        <div class="credit-text__langs" id="credit-langs" role="group" aria-labelledby="credit-langs-label"></div>
        <div class="credit-text__fields">
          <div class="field"><label for="credit-text-input">Credit text (outside the link)</label><input class="input" id="credit-text-input" type="text" value="Design and development by" maxlength="80" autocomplete="off"></div>
          <div class="field"><label for="credit-anchor-input">Link text (keep the brand in it)</label><input class="input" id="credit-anchor-input" type="text" value="Mgroup Shopify Agency" maxlength="60" autocomplete="off"></div>
          <button class="btn btn--dark btn--sm" type="button" id="credit-reset">Reset to default</button>
        </div>
        <p class="note" id="credit-status" aria-live="polite">Default wording. All code blocks below use it.</p>
      </div>
      <div id="snippets">{blocks}</div>
      <p class="note">Need the mark as a file? <a href="../assets/img/mark.svg" download="mgroup-mark.svg">Download mgroup-mark.svg</a> (540×540, indigo #5A58E2).</p>
    </div>
  </section>

""" + brand_section(root) + brand_story.section() + f"""
""" + faq_html("Footer credit FAQ", CREDIT_FAQ) + cta("Built by Mgroup", "Need a store that <span class=\"grad\">deserves the credit</span>?", "Mgroup designs, builds and migrates Shopify and Shopify Plus stores — theme development, apps, integrations and SEO — and stays on after launch.", "Talk to Mgroup"),
    }
