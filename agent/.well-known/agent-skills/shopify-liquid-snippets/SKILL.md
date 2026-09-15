---
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

- `section-schema`: Online Store 2.0 section skeleton with blocks (sections/mg-feature-grid.liquid; sections, theme)
- `free-shipping-bar`: Free shipping progress bar for the cart (snippets/mg-shipping-bar.liquid; cart, cro)
- `metafield-fallback`: Product metafield with safe fallback (snippets/mg-metafield.liquid; product, metafields)
- `responsive-image`: Responsive image with srcset and lazy loading (snippets/mg-image.liquid; performance, theme)
- `sale-badge`: Sale badge with discount percentage (snippets/mg-sale-badge.liquid; product, cro)
- `low-stock`: Low-stock and sold-out badges (snippets/mg-stock-badge.liquid; product, cro)
- `breadcrumbs`: SEO breadcrumbs with BreadcrumbList JSON-LD (snippets/mg-breadcrumbs.liquid; seo, theme)
- `product-json`: Hand product data to JavaScript safely (sections/main-product.liquid; product, javascript)

## Online Store 2.0 section skeleton with blocks

File: `sections/mg-feature-grid.liquid`. Tags: sections, theme.

Minimal section with settings, repeatable blocks and presets so it appears in the theme editor. Start every custom Shopify section from here.

```liquid
{%- comment -%} sections/mg-feature-grid.liquid {%- endcomment -%}
<section class="mg-feature-grid" id="shopify-section-{{ section.id }}">
  {%- if section.settings.heading != blank -%}
    <h2 class="mg-feature-grid__title">{{ section.settings.heading | escape }}</h2>
  {%- endif -%}
  <div class="mg-feature-grid__items">
    {%- for block in section.blocks -%}
      <div class="mg-feature-grid__item" {{ block.shopify_attributes }}>
        {%- if block.settings.icon != blank -%}
          {{ block.settings.icon | image_url: width: 96 | image_tag: loading: 'lazy', widths: '48, 96', alt: block.settings.title }}
        {%- endif -%}
        <h3>{{ block.settings.title | escape }}</h3>
        <div class="rte">{{ block.settings.text }}</div>
      </div>
    {%- endfor -%}
  </div>
</section>

{% schema %}
{
  "name": "Feature grid",
  "tag": "section",
  "class": "section",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Why shop with us" }
  ],
  "blocks": [
    {
      "type": "feature",
      "name": "Feature",
      "limit": 6,
      "settings": [
        { "type": "image_picker", "id": "icon", "label": "Icon" },
        { "type": "text", "id": "title", "label": "Title", "default": "Free shipping" },
        { "type": "richtext", "id": "text", "label": "Text", "default": "<p>On all orders over $50.</p>" }
      ]
    }
  ],
  "presets": [{ "name": "Feature grid", "blocks": [{ "type": "feature" }, { "type": "feature" }, { "type": "feature" }] }]
}
{% endschema %}
```

## Free shipping progress bar for the cart

File: `snippets/mg-shipping-bar.liquid`. Tags: cart, cro.

Shows how much is left to unlock free shipping. Threshold is a theme setting in cents-aware currency; call it with {% render 'mg-shipping-bar', threshold: settings.free_shipping_threshold %}. A classic CRO win for AOV.

```liquid
{%- comment -%} snippets/mg-shipping-bar.liquid — threshold in store currency units {%- endcomment -%}
{%- assign threshold_cents = threshold | times: 100 -%}
{%- assign remaining = threshold_cents | minus: cart.total_price -%}
{%- assign percent = cart.total_price | times: 100 | divided_by: threshold_cents | at_most: 100 -%}
<div class="mg-shipping-bar" role="status" aria-live="polite">
  {%- if remaining > 0 -%}
    <p class="mg-shipping-bar__text">Add {{ remaining | money }} more for <strong>free shipping</strong></p>
  {%- else -%}
    <p class="mg-shipping-bar__text">🎉 You've unlocked <strong>free shipping</strong></p>
  {%- endif -%}
  <div class="mg-shipping-bar__track"><div class="mg-shipping-bar__fill" style="width: {{ percent }}%"></div></div>
</div>
```

## Product metafield with safe fallback

File: `snippets/mg-metafield.liquid`. Tags: product, metafields.

Renders a metafield only when the definition exists and has a value; falls back to a default. Works for single-line text, rich text and lists.

```liquid
{%- comment -%} Single-line text or number {%- endcomment -%}
{%- assign material = product.metafields.specs.material -%}
{%- if material != blank -%}
  <dt>Material</dt><dd>{{ material.value | escape }}</dd>
{%- else -%}
  <dt>Material</dt><dd>See product description</dd>
{%- endif -%}

{%- comment -%} Rich text (metafield_tag renders proper HTML) {%- endcomment -%}
{%- if product.metafields.specs.care_guide != blank -%}
  <div class="rte">{{ product.metafields.specs.care_guide | metafield_tag }}</div>
{%- endif -%}

{%- comment -%} List of single-line text {%- endcomment -%}
{%- if product.metafields.specs.features.value.size > 0 -%}
  <ul>
    {%- for feature in product.metafields.specs.features.value -%}
      <li>{{ feature | escape }}</li>
    {%- endfor -%}
  </ul>
{%- endif -%}
```

## Responsive image with srcset and lazy loading

File: `snippets/mg-image.liquid`. Tags: performance, theme.

Uses image_url + image_tag so Shopify serves the right size per viewport; first-fold images get loading: eager and fetchpriority for better LCP. Part of every performance audit we run.

```liquid
{%- comment -%} {% render 'mg-image', image: product.featured_image, sizes: '(min-width: 990px) 50vw, 100vw', eager: true %} {%- endcomment -%}
{%- if image != blank -%}
  {%- assign loading = 'lazy' -%}
  {%- assign priority = 'auto' -%}
  {%- if eager -%}{%- assign loading = 'eager' -%}{%- assign priority = 'high' -%}{%- endif -%}
  {{ image
    | image_url: width: 1800
    | image_tag:
        widths: '360, 540, 720, 900, 1080, 1296, 1512, 1800',
        sizes: sizes | default: '100vw',
        loading: loading,
        fetchpriority: priority,
        alt: image.alt | default: product.title | escape
  }}
{%- endif -%}
```

## Sale badge with discount percentage

File: `snippets/mg-sale-badge.liquid`. Tags: product, cro.

Computes the discount from compare_at_price for the selected variant and only renders when there is a real saving. Use money_without_trailing_zeros for cleaner prices.

```liquid
{%- assign v = product.selected_or_first_available_variant -%}
{%- if v.compare_at_price > v.price -%}
  {%- assign saving = v.compare_at_price | minus: v.price -%}
  {%- assign percent = saving | times: 100 | divided_by: v.compare_at_price -%}
  <span class="mg-badge mg-badge--sale">Save {{ percent }}%</span>
  <s class="mg-price__compare">{{ v.compare_at_price | money_without_trailing_zeros }}</s>
{%- endif -%}
<span class="mg-price">{{ v.price | money_without_trailing_zeros }}</span>
```

## Low-stock and sold-out badges

File: `snippets/mg-stock-badge.liquid`. Tags: product, cro.

Urgency badge that respects inventory policy: sold out when unavailable, "only N left" under a threshold, silent otherwise. Threshold defaults to 5.

```liquid
{%- assign v = product.selected_or_first_available_variant -%}
{%- assign low = low_threshold | default: 5 -%}
{%- if v.available == false -%}
  <span class="mg-badge mg-badge--soldout">Sold out</span>
{%- elsif v.inventory_management == 'shopify' and v.inventory_policy == 'deny' and v.inventory_quantity <= low -%}
  <span class="mg-badge mg-badge--low">Only {{ v.inventory_quantity }} left</span>
{%- endif -%}
```

## SEO breadcrumbs with BreadcrumbList JSON-LD

File: `snippets/mg-breadcrumbs.liquid`. Tags: seo, theme.

Visible breadcrumbs plus matching structured data for product, collection, page and article templates. Uses the collection the customer came from when available. See our Shopify SEO services.

```liquid
{%- unless template == 'index' -%}
{%- assign crumbs = '' -%}
<nav class="mg-crumbs" aria-label="Breadcrumb"><ol>
  <li><a href="{{ routes.root_url }}">Home</a></li>
  {%- case template.name -%}
    {%- when 'product' -%}
      {%- if collection -%}<li><a href="{{ collection.url }}">{{ collection.title | escape }}</a></li>{%- endif -%}
      <li aria-current="page">{{ product.title | escape }}</li>
    {%- when 'collection' -%}
      <li aria-current="page">{{ collection.title | escape }}</li>
    {%- when 'article' -%}
      <li><a href="{{ blog.url }}">{{ blog.title | escape }}</a></li>
      <li aria-current="page">{{ article.title | escape }}</li>
    {%- when 'page' -%}
      <li aria-current="page">{{ page.title | escape }}</li>
  {%- endcase -%}
</ol></nav>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "{{ shop.url }}{{ routes.root_url }}" }
    {%- if template.name == 'product' and collection -%},
    { "@type": "ListItem", "position": 2, "name": {{ collection.title | json }}, "item": "{{ shop.url }}{{ collection.url }}" },
    { "@type": "ListItem", "position": 3, "name": {{ product.title | json }}, "item": "{{ shop.url }}{{ product.url }}" }
    {%- elsif template.name == 'product' -%},
    { "@type": "ListItem", "position": 2, "name": {{ product.title | json }}, "item": "{{ shop.url }}{{ product.url }}" }
    {%- elsif template.name == 'collection' -%},
    { "@type": "ListItem", "position": 2, "name": {{ collection.title | json }}, "item": "{{ shop.url }}{{ collection.url }}" }
    {%- endif -%}
  ]
}
</script>
{%- endunless -%}
```

## Hand product data to JavaScript safely

File: `sections/main-product.liquid`. Tags: product, javascript.

Emit variant data as JSON in a <script type="application/json"> tag instead of inline JS — safe against quotes, cacheable, and easy to read in your variant picker.

```liquid
<script type="application/json" id="mg-product-{{ section.id }}">
  {{ product | json }}
</script>
<script type="application/json" id="mg-variants-{{ section.id }}">
  {{ product.variants | json }}
</script>

<script>
  (function () {
    var product = JSON.parse(document.getElementById('mg-product-{{ section.id }}').textContent);
    var variants = JSON.parse(document.getElementById('mg-variants-{{ section.id }}').textContent);
    // Example: find the variant matching selected options
    function findVariant(options) {
      return variants.find(function (v) {
        return v.options.every(function (o, i) { return o === options[i]; });
      });
    }
    window.mgProduct = { product: product, variants: variants, findVariant: findVariant };
  })();
</script>
```
