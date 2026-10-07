# Inserted into build_site.py PAGES (Shopify fees calculator, 2026-10-07). Kept as a separate
# module so the page is easy to review; build_site.py calls page(...) like footer_credit_page.

FEES_FAQ_RAW = [
  ("How much does Shopify take per sale?", "With Shopify Payments, an online sale costs 2.9% + 30¢ on Basic, 2.7% + 30¢ on Grow and 2.5% + 30¢ on Advanced (US rates). Shopify adds no transaction fee on top. On a $100 order that is $3.20, $3.00 or $2.80."),
  ("What is the Shopify transaction fee with a third-party payment provider?", "Shopify charges 2% on Basic, 1% on Grow, 0.6% on Advanced and 0.2% on Plus for orders paid through a third-party provider, in addition to that provider's own card rate. If Shopify Payments is your primary provider, PayPal orders are exempt."),
  ("Does Shopify charge a currency conversion fee?", "Yes, when a customer pays in a currency different from your payout currency with Shopify Payments: 1.5% for US-based stores and 2% for stores in other regions."),
  ("Which Shopify plan is cheapest for my store?", "It depends on your monthly online sales. With Shopify Payments and monthly billing, Grow becomes cheaper than Basic at about $33,000 in monthly online sales and Advanced becomes cheaper than Grow at about $147,000, on card fees alone. Enter your numbers in the calculator to see your break-even."),
  ("Are these Shopify fees accurate for my country?", "The calculator uses US list prices and US Shopify Payments rates as of October 2026. Shopify uses local pricing and different card rates in many countries, so confirm the numbers on shopify.com/pricing for your store's region."),
]

def page(SITE, MG, CONTACT, PUBLISHED, MODIFIED, AUTHOR, ORG, PERSON, bc, faq_html, faq_ld, cta):
    FEES_FAQ = FEES_FAQ_RAW
    return {
  "path": "/shopify-fees-calculator/", "rel": "../", "updated": MODIFIED,
  "title": "Shopify Fees Calculator 2026 | Fees per Sale by Plan | Mgroup",
  "desc": "Free Shopify fees calculator: enter your monthly sales and average order to see card fees, third-party transaction fees, currency conversion and the cheapest plan, Basic vs Grow vs Advanced.",
  "scripts": ["assets/js/fees-calculator.js"],
  "hero": {"title": '<span class="grad">Shopify Fees</span><br>Calculator',
           "desc": "See what Shopify actually takes from your sales on Basic, Grow and Advanced: card rates with Shopify Payments, the extra fee on third-party gateways, currency conversion and the subscription, plus which plan is cheapest for your volume. US prices and rates, October 2026.",
           "actions": [("btn-pill--white", "#calc", "Calculate my fees"), ("btn-pill--ghost-light", "#how", "How Shopify fees work")]},
  "ld": [
    {"@type": "WebApplication", "name": "Shopify Fees Calculator", "url": SITE + "/shopify-fees-calculator/",
     "applicationCategory": "BusinessApplication", "operatingSystem": "Any", "browserRequirements": "Requires JavaScript",
     "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
     "description": "Estimate Shopify card fees, third-party transaction fees, currency conversion and subscription cost per plan, and find the cheapest Shopify plan for your sales.",
     "datePublished": "2026-10-07", "dateModified": "2026-10-07",
     "author": AUTHOR, "publisher": {"@id": MG + "/#organization"}, "isPartOf": {"@id": SITE + "/#website"}},
    ORG, PERSON,
    bc([("Shopify Developer Tools", "/"), ("Shopify Fees Calculator", "/shopify-fees-calculator/")]),
    faq_ld(FEES_FAQ)
  ],
  "body": f"""
  <section class="section" aria-label="Calculator">
    <div class="container">
      <div class="tool">
        <form class="panel panel--sticky" id="calc" aria-label="Shopify fees inputs">
          <h2>Your numbers</h2>
          <div class="field">
            <label for="sales">Monthly online sales</label>
            <div class="input-money"><input class="input" id="sales" type="text" inputmode="numeric" value="30,000" autocomplete="off"></div>
            <input class="range" id="salesRange" type="range" min="1000" max="500000" step="1000" value="30000" aria-label="Monthly online sales slider">
          </div>
          <div class="field">
            <label for="aov">Average order value</label>
            <div class="input-money"><input class="input" id="aov" type="text" inputmode="decimal" value="80" autocomplete="off"></div>
            <span class="hint">Used for the fixed 30¢ per order.</span>
          </div>
          <div class="field">
            <span class="field__label" id="provLabel">Payment provider</span>
            <div class="seg" role="radiogroup" aria-labelledby="provLabel">
              <label><input type="radio" name="provider" value="sp" checked>Shopify Payments</label>
              <label><input type="radio" name="provider" value="tp">Third-party gateway</label>
            </div>
          </div>
          <div class="field js-gw" hidden>
            <label for="gwRate">Your gateway rate, %</label>
            <input class="input" id="gwRate" type="text" inputmode="decimal" value="2.9" autocomplete="off">
            <label for="gwFixed" style="margin-top:.6rem">Fixed fee per order, ¢</label>
            <input class="input" id="gwFixed" type="text" inputmode="decimal" value="30" autocomplete="off">
            <span class="hint">Shopify adds 2% / 1% / 0.6% on top of this, depending on the plan.</span>
          </div>
          <div class="field">
            <span class="field__label" id="billLabel">Billing</span>
            <div class="seg" role="radiogroup" aria-labelledby="billLabel">
              <label><input type="radio" name="billing" value="monthly" checked>Monthly</label>
              <label><input type="radio" name="billing" value="yearly">Yearly</label>
            </div>
          </div>
          <div class="field js-sp">
            <label for="intl">Sales paid in another currency, %</label>
            <input class="input" id="intl" type="text" inputmode="decimal" value="0" autocomplete="off">
            <div class="seg" role="radiogroup" aria-label="Store location" style="margin-top:.6rem">
              <label><input type="radio" name="fx" value="0.015" checked>US store · 1.5%</label>
              <label><input type="radio" name="fx" value="0.02">Other region · 2%</label>
            </div>
            <span class="hint">Currency conversion fee on Shopify Payments.</span>
          </div>
          <button class="btn btn--dark" type="button" id="copyResult">Copy summary</button>
        </form>
        <div>
          <div class="result-hero" aria-live="polite">
            <span class="eyebrow">Cheapest Shopify plan for you</span>
            <div class="result-hero__num" id="bestPlan">Basic</div>
            <div class="result-hero__sub" id="bestNote"></div>
          </div>
          <div class="result-grid">
            <div class="result-mini"><div class="result-mini__label">Fees per month</div><div class="result-mini__num" id="feesOnly">—</div></div>
            <div class="result-mini"><div class="result-mini__label">Subscription</div><div class="result-mini__num" id="subOnly">—</div></div>
            <div class="result-mini"><div class="result-mini__label">Fee on one order</div><div class="result-mini__num" id="perOrder">—</div></div>
            <div class="result-mini"><div class="result-mini__label">Orders per month</div><div class="result-mini__num" id="ordersMo">—</div></div>
          </div>
          <div class="panel">
            <h2>Every plan, side by side</h2>
            <div class="tools-table-wrap">
            <table class="tools-table">
              <thead><tr><th scope="col">Plan</th><th scope="col">Subscription</th><th scope="col">Card fees</th><th scope="col">Shopify 3rd-party fee</th><th scope="col">Currency conversion</th><th scope="col">Total / month</th><th scope="col">% of sales</th><th scope="col">Per order</th></tr></thead>
              <tbody id="planTable"></tbody>
            </table>
            </div>
            <p class="note" id="upgradeNote"></p>
          </div>
          <div class="callout"><p><strong>Selling more than a few hundred thousand a month?</strong> Shopify Plus uses negotiated card rates and a different fee model. Use the <a href="../shopify-plus-pricing-calculator/">Shopify Plus pricing calculator</a> or read the full <a href="{MG}/blogs/best-shopify-plan-pricing/">Shopify pricing 2026 guide</a>.</p></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="how" aria-labelledby="how-title">
    <div class="container container-narrow prose">
      <header class="section__head"><span class="eyebrow">How the model works</span><h2 class="section__title" id="how-title">How Shopify fees work in 2026</h2></header>
      <p><strong>Subscription.</strong> Basic costs $39 per month ($29 billed yearly), Grow $105 ($79 yearly) and Advanced $399 ($299 yearly) in the US. Shopify uses local pricing in some countries.</p>
      <p><strong>Card rates with Shopify Payments.</strong> Every online order costs a percentage plus 30¢: 2.9% on Basic, 2.7% on Grow, 2.5% on Advanced. There is no separate Shopify transaction fee. In-person payments cost 2.6%, 2.5% or 2.4% plus 10¢.</p>
      <p><strong>Third-party transaction fees.</strong> If you take payments through another provider, Shopify charges 2%, 1% or 0.6% on each order depending on the plan, on top of what your provider charges. For stores created on or after May 12, 2025, the fee also applies to the part of an order paid with store credit or gift cards. If you run Shopify Payments next to another provider, payments that still go through Shopify Payments carry a 1.25% premium.</p>
      <p><strong>Currency conversion.</strong> When a customer pays in a currency other than your payout currency, Shopify Payments adds 1.5% for US-based stores and 2% for stores elsewhere.</p>
      <div class="tools-table-wrap">
      <table class="tools-table">
        <thead><tr><th scope="col">Plan (US)</th><th scope="col">Monthly / yearly</th><th scope="col">Online card rate</th><th scope="col">In-person rate</th><th scope="col">Third-party fee</th></tr></thead>
        <tbody>
          <tr><th scope="row">Basic</th><td>$39 / $29</td><td>2.9% + 30¢</td><td>2.6% + 10¢</td><td>2%</td></tr>
          <tr><th scope="row">Grow</th><td>$105 / $79</td><td>2.7% + 30¢</td><td>2.5% + 10¢</td><td>1%</td></tr>
          <tr><th scope="row">Advanced</th><td>$399 / $299</td><td>2.5% + 30¢</td><td>2.4% + 10¢</td><td>0.6%</td></tr>
          <tr><th scope="row">Plus</th><td>from $2,300 (3-year term)</td><td colspan="2">negotiated</td><td>0.2%</td></tr>
        </tbody>
      </table>
      </div>
      <p class="note">Sources: shopify.com/pricing, Shopify Help Center (Pricing plans and billing overview; Shopify Payments fees) and Shopify's guide to credit card processing fees, checked October 2026. Rates change and differ by country, so confirm them for your store before you budget.</p>

      <h2 class="section__title" id="use-title" style="margin-top:2.5rem">How to use the Shopify fees calculator</h2>
      <ul>
        <li><strong>Monthly online sales.</strong> Use a normal month, not a peak. The calculator applies online card rates only; in-person sales use lower rates.</li>
        <li><strong>Average order value.</strong> The fixed 30¢ is charged per order, so stores with small orders pay a higher share of each sale in fees.</li>
        <li><strong>Payment provider.</strong> Keep Shopify Payments unless you must use another provider. For a third-party gateway, enter its rate; the calculator adds Shopify's 2% / 1% / 0.6%.</li>
        <li><strong>Billing.</strong> Yearly billing lowers the subscription by about 25% on Basic and Grow, which also lowers the sales level at which an upgrade pays off.</li>
      </ul>
      <p>Fees are only part of what a store costs. For apps, design and development, see <a href="{MG}/blogs/the-true-cost-for-shopify-store/">the true cost of a Shopify store</a>; for how Shopify Payments works, see <a href="{MG}/blogs/what-is-shopify-payments/">What is Shopify Payments</a>. If you are moving from another platform and want the numbers modelled on your real orders, talk to our <a href="{MG}/services/shopify-migration-experts/">Shopify migration team</a>.</p>
    </div>
  </section>
""" + faq_html("Shopify fees FAQ", FEES_FAQ) + cta("Shopify Select Partner", "Want a clear cost plan for your <span class=\"grad\">Shopify store</span>?", "Mgroup builds, migrates and optimizes Shopify stores. Share your numbers and a senior Shopify developer will show you where the money goes.")
    }
