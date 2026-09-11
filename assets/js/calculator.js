/* Shopify Plus Pricing Calculator — reference figures from mgroupweb.com/blogs/shopify-plus-pricing-cost/ */
(function () {
  'use strict';
  var RATE = 0.0025;      // ~0.25% of monthly sales above the crossover
  var CAP = 40000;        // widely reported monthly cap
  var ADVANCED = 399;     // Advanced plan reference

  var $ = function (id) { return document.getElementById(id); };
  var gmv = $('gmv'), gmvRange = $('gmvRange'), apps = $('apps'), dev = $('dev'), migration = $('migration');
  var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var num = function (el) { var v = parseFloat(String(el.value).replace(/[^0-9.]/g, '')); return isFinite(v) && v >= 0 ? v : 0; };
  var pretty = function (el) { var v = num(el); el.value = v ? v.toLocaleString('en-US') : '0'; };
  var radio = function (name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? parseFloat(r.value) : 0; };

  var state = {};

  function calc() {
    var g = num(gmv), base = radio('term'), gw = radio('gateway');
    var variable = Math.min(g * RATE, CAP);
    var platform = Math.max(base, variable);
    var mode = variable > base ? (variable >= CAP ? 'cap' : 'revenue') : 'flat';
    var gateway = g * gw;
    var a = num(apps), d = num(dev), m = num(migration);
    var monthly = platform + gateway + a + d;
    var yearly = monthly * 12;
    state = { g: g, base: base, platform: platform, mode: mode, gateway: gateway, apps: a, dev: d, migration: m, monthly: monthly, yearly: yearly, year1: yearly + m };

    $('platformMonthly').textContent = fmt(platform) + '/mo';
    $('platformNote').textContent = mode === 'flat'
      ? 'Flat fee applies — 0.25% of your revenue (' + fmt(variable) + ') is below the ' + fmt(base) + ' base fee.'
      : mode === 'revenue'
        ? 'Revenue-based model applies — 0.25% of ' + fmt(g) + ' exceeds the ' + fmt(base) + ' base fee.'
        : 'Revenue-based fee reached the reported ' + fmt(CAP) + '/month cap.';
    $('totalMonthly').textContent = fmt(monthly);
    $('totalYear1').textContent = fmt(state.year1);
    $('totalYear').textContent = fmt(yearly);
    $('feePct').textContent = g ? (platform / g * 100).toFixed(2) + '%' : '—';

    var rows = [['Platform fee', platform], ['Third-party gateway fee', gateway], ['Apps', a], ['Development & maintenance', d]];
    var max = Math.max.apply(null, rows.map(function (r) { return r[1]; })) || 1;
    $('bars').innerHTML = rows.map(function (r) {
      return '<div class="bar"><span class="bar__label">' + r[0] + '</span><div class="bar__track"><div class="bar__fill" style="width:' + (r[1] / max * 100).toFixed(1) + '%"></div></div><span class="bar__val">' + fmt(r[1]) + '</span></div>';
    }).join('');

    var delta = platform - ADVANCED;
    $('advNote').textContent = 'Versus the ~$399/month Advanced plan the platform fee is ' + fmt(delta) + '/month higher (' + fmt(delta * 12) + '/year) — before counting checkout extensibility, native B2B, Shopify Functions, Flow, Launchpad and expansion stores that Plus includes.';
  }

  function sync(fromRange) {
    if (fromRange) { gmv.value = parseInt(gmvRange.value, 10).toLocaleString('en-US'); }
    else { var v = num(gmv); gmvRange.value = Math.min(Math.max(v, gmvRange.min), gmvRange.max); }
    calc();
  }

  gmvRange.addEventListener('input', function () { sync(true); });
  gmv.addEventListener('input', function () { sync(false); });
  gmv.addEventListener('blur', function () { pretty(gmv); });
  [apps, dev, migration].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('blur', function () { pretty(el); });
  });
  document.querySelectorAll('input[name="term"], input[name="gateway"]').forEach(function (r) { r.addEventListener('change', calc); });

  $('copyResult').addEventListener('click', function () {
    var s = state, btn = this;
    var text = [
      'Shopify Plus cost estimate (mgroupweb.github.io/shopify-plus-pricing-calculator/)',
      'Monthly revenue: ' + fmt(s.g),
      'Platform fee: ' + fmt(s.platform) + '/mo (' + (s.mode === 'flat' ? 'flat ' + fmt(s.base) + ' base' : s.mode === 'revenue' ? '0.25% revenue model' : '$40,000 cap') + ')',
      'Third-party gateway fee: ' + fmt(s.gateway) + '/mo',
      'Apps: ' + fmt(s.apps) + '/mo',
      'Development & maintenance: ' + fmt(s.dev) + '/mo',
      'Monthly all-in: ' + fmt(s.monthly),
      'Ongoing per year: ' + fmt(s.yearly),
      'One-off migration & integrations: ' + fmt(s.migration),
      'Year one TCO: ' + fmt(s.year1),
      'Reference figures — confirm current terms with Shopify. Source: https://mgroupweb.com/blogs/shopify-plus-pricing-cost/'
    ].join('\n');
    var done = function () { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, done); }
    else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }
  });

  calc();
})();
