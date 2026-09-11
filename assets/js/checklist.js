/* Shopify Migration Checklist — enhances the pre-rendered HTML (tasks are in the markup for SEO);
   persists progress in localStorage, exports a plain-text plan. */
(function () {
  'use strict';
  var KEY = 'mg-shopify-migration-checklist-v1';
  var root = document.getElementById('phases');
  if (!root) return;
  var phases = Array.prototype.slice.call(root.querySelectorAll('.phase'));
  var boxes = Array.prototype.slice.call(root.querySelectorAll('input[type=checkbox][data-id]'));
  var total = boxes.length;

  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
  boxes.forEach(function (b) { b.checked = !!saved[b.dataset.id]; });

  function update() {
    var done = 0;
    phases.forEach(function (p) {
      var list = p.querySelectorAll('input[type=checkbox][data-id]');
      var d = 0;
      list.forEach(function (b) { if (b.checked) d++; });
      var c = p.querySelector('.phase__count');
      if (c) { c.textContent = d + ' / ' + list.length; c.classList.toggle('is-done', d === list.length && list.length > 0); }
      done += d;
    });
    var pct = total ? Math.round(done / total * 100) : 0;
    var fill = document.getElementById('progressFill'), num = document.getElementById('progressNum');
    if (fill) fill.style.width = pct + '%';
    if (num) num.textContent = pct + '%';
  }

  root.addEventListener('change', function (e) {
    var cb = e.target;
    if (cb.type !== 'checkbox' || !cb.dataset.id) return;
    if (cb.checked) saved[cb.dataset.id] = 1; else delete saved[cb.dataset.id];
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (err) {}
    update();
  });

  var resetBtn = document.getElementById('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (!confirm('Clear all progress?')) return;
    saved = {};
    try { localStorage.removeItem(KEY); } catch (err) {}
    boxes.forEach(function (c) { c.checked = false; });
    update();
  });

  var expanded = false, expandBtn = document.getElementById('expandBtn');
  if (expandBtn) expandBtn.addEventListener('click', function () {
    expanded = !expanded;
    phases.forEach(function (d) { d.open = expanded; });
    this.textContent = expanded ? 'Collapse all' : 'Expand all';
  });

  var exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', function () {
    var btn = this;
    var lines = ['Shopify Migration Checklist — https://mgroupweb.github.io/shopify-migration-checklist/', ''];
    phases.forEach(function (p, pi) {
      var title = p.querySelector('.phase__title');
      lines.push((pi + 1) + '. ' + (title ? title.textContent.trim() : ''));
      p.querySelectorAll('.task').forEach(function (t) {
        var cb = t.querySelector('input'), lb = t.querySelector('label');
        lines.push('  [' + (cb && cb.checked ? 'x' : ' ') + '] ' + (lb ? lb.textContent.trim() : ''));
      });
      lines.push('');
    });
    lines.push('Shopify migration services by Mgroup: https://mgroupweb.com/services/shopify-migration-experts/');
    var text = lines.join('\n');
    var done = function () { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, done); }
    else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done(); }
  });

  update();
})();
