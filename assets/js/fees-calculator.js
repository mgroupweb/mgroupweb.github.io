/* Shopify Fees Calculator — US list prices and Shopify Payments rates, October 2026.
   Sources: shopify.com/pricing, help.shopify.com (Pricing plans and billing overview, Shopify Payments fees),
   shopify.com/blog/credit-card-processing-fees. Reference: mgroupweb.com/blogs/best-shopify-plan-pricing/ */
(function () {
  'use strict';
  var PLANS = [
    { name: 'Basic',    monthly: 39,  yearly: 29,  rate: 0.029, fixed: 0.30, thirdParty: 0.02 },
    { name: 'Grow',     monthly: 105, yearly: 79,  rate: 0.027, fixed: 0.30, thirdParty: 0.01 },
    { name: 'Advanced', monthly: 399, yearly: 299, rate: 0.025, fixed: 0.30, thirdParty: 0.006 }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var sales = $('sales'), salesRange = $('salesRange'), aov = $('aov'), gwRate = $('gwRate'), gwFixed = $('gwFixed'), intl = $('intl');
  var money = function (n, d) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var num = function (el) { var v = parseFloat(String(el.value).replace(/[^0-9.]/g, '')); return isFinite(v) && v >= 0 ? v : 0; };
  var pretty = function (el) { var v = num(el); el.value = v ? v.toLocaleString('en-US') : '0'; };
  var radio = function (name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; };

  var state = {};

  function planCost(p, s) {
    var orders = s.aov > 0 ? s.sales / s.aov : 0;
    var sub = s.billing === 'yearly' ? p.yearly : p.monthly;
    var card, shopifyFee = 0, fx = 0;
    if (s.provider === 'sp') {
      card = s.sales * p.rate + orders * p.fixed;
      fx = s.sales * (s.intl / 100) * s.fxRate;
    } else {
      card = s.sales * (s.gwRate / 100) + orders * (s.gwFixed / 100);
      shopifyFee = s.sales * p.thirdParty;
    }
    var fees = card + shopifyFee + fx;
    var total = sub + fees;
    var perOrder = s.aov > 0 ? (s.provider === 'sp'
      ? s.aov * p.rate + p.fixed
      : s.aov * (s.gwRate / 100) + s.gwFixed / 100 + s.aov * p.thirdParty) : 0;
    return { name: p.name, sub: sub, card: card, shopifyFee: shopifyFee, fx: fx, fees: fees, total: total, pct: s.sales ? total / s.sales * 100 : 0, perOrder: perOrder, orders: orders };
  }

  function calc() {
    var s = {
      sales: num(sales), aov: num(aov), provider: radio('provider') || 'sp', billing: radio('billing') || 'monthly',
      gwRate: num(gwRate), gwFixed: num(gwFixed), intl: Math.min(num(intl), 100), fxRate: parseFloat(radio('fx') || '0.015')
    };
    document.querySelectorAll('.js-gw').forEach(function (el) { el.hidden = s.provider !== 'tp'; });
    document.querySelectorAll('.js-sp').forEach(function (el) { el.hidden = s.provider !== 'sp'; });

    var rows = PLANS.map(function (p) { return planCost(p, s); });
    var best = rows.reduce(function (a, b) { return b.total < a.total ? b : a; });
    state = { s: s, rows: rows, best: best };

    $('bestPlan').textContent = best.name;
    $('bestNote').textContent = 'Lowest total at ' + money(s.sales) + '/month in online sales: ' + money(best.total) + '/month all-in, ' + best.pct.toFixed(2) + '% of sales.';
    $('feesOnly').textContent = money(best.fees);
    $('subOnly').textContent = money(best.sub);
    $('perOrder').textContent = money(best.perOrder, 2);
    $('ordersMo').textContent = Math.round(best.orders).toLocaleString('en-US');

    $('planTable').innerHTML = rows.map(function (r) {
      var cls = r === best ? ' class="is-best"' : '';
      return '<tr' + cls + '><th scope="row">' + r.name + (r === best ? ' <span class="badge">cheapest</span>' : '') + '</th>' +
        '<td>' + money(r.sub) + '</td>' +
        '<td>' + money(r.card) + '</td>' +
        '<td>' + (s.provider === 'tp' ? money(r.shopifyFee) : '$0') + '</td>' +
        '<td>' + (s.provider === 'sp' ? money(r.fx) : '—') + '</td>' +
        '<td><strong>' + money(r.total) + '</strong></td>' +
        '<td>' + r.pct.toFixed(2) + '%</td>' +
        '<td>' + money(r.perOrder, 2) + '</td></tr>';
    }).join('');

    var b = rows[0], g = rows[1], a = rows[2];
    $('upgradeNote').textContent = s.provider === 'sp'
      ? 'With Shopify Payments, Grow pays for itself at about ' + money((g.sub - b.sub) / 0.002) + ' and Advanced at about ' + money((a.sub - g.sub) / 0.002) + ' in monthly online sales (' + s.billing + ' billing, card fees only).'
      : 'With a third-party gateway, Shopify adds 2% on Basic, 1% on Grow and 0.6% on Advanced on top of your gateway’s rate. Switching to Shopify Payments, where available, removes that fee.';
  }

  function sync(fromRange) {
    if (fromRange) { sales.value = parseInt(salesRange.value, 10).toLocaleString('en-US'); }
    else { var v = num(sales); salesRange.value = Math.min(Math.max(v, salesRange.min), salesRange.max); }
    calc();
  }

  salesRange.addEventListener('input', function () { sync(true); });
  sales.addEventListener('input', function () { sync(false); });
  sales.addEventListener('blur', function () { pretty(sales); });
  [aov, gwRate, gwFixed, intl].forEach(function (el) { el.addEventListener('input', calc); });
  document.querySelectorAll('input[name="provider"], input[name="billing"], input[name="fx"]').forEach(function (r) { r.addEventListener('change', calc); });

  $('copyResult').addEventListener('click', function () {
    var st = state, s = st.s, btn = this;
    var lines = ['Shopify fees estimate (mgroupweb.github.io/shopify-fees-calculator/)',
      'Monthly online sales: ' + money(s.sales) + ' · average order: ' + money(s.aov, 2) + ' · ' + (s.provider === 'sp' ? 'Shopify Payments' : 'third-party gateway ' + s.gwRate + '% + ' + s.gwFixed + '¢') + ' · ' + s.billing + ' billing'];
    st.rows.forEach(function (r) { lines.push(r.name + ': ' + money(r.total) + '/mo all-in (' + r.pct.toFixed(2) + '% of sales), ' + money(r.perOrder, 2) + ' per order'); });
    lines.push('Cheapest: ' + st.best.name);
    lines.push('US list prices and rates, October 2026 — confirm current pricing at shopify.com/pricing. Guide: https://mgroupweb.com/blogs/best-shopify-plan-pricing/');
    var text = lines.join('\n');
    var done = function () { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, done); }
    else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }
  });

  calc();
})();
