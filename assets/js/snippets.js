/* Shopify Liquid Snippets — enhances pre-rendered HTML (code is in the markup for SEO):
   tag filters + copy buttons. */
(function () {
  'use strict';
  var filters = document.getElementById('filters');
  var list = document.getElementById('snippets');
  if (!list) return;

  if (filters) filters.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    filters.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
    var tag = b.dataset.tag;
    list.querySelectorAll('.snippet').forEach(function (a) {
      a.hidden = tag !== 'all' && (a.dataset.tags || '').split(' ').indexOf(tag) < 0;
    });
  });

  list.addEventListener('click', function (e) {
    var b = e.target.closest('.copy-btn'); if (!b) return;
    var art = b.closest('.snippet'), pre = art && art.querySelector('pre code');
    if (!pre) return;
    var text = pre.textContent;
    var done = function () { b.classList.add('is-copied'); b.textContent = 'Copied'; setTimeout(function () { b.classList.remove('is-copied'); b.textContent = 'Copy'; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, done); }
    else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (err) {} ta.remove(); done(); }
  });

  if (location.hash) { var t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
})();
