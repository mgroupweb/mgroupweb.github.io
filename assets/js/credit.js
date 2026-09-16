/* Footer credit — language presets + custom text/anchor. Rewrites the live preview and every code block in place,
   so the Copy buttons (snippets.js) always copy the current wording. Defaults: "Design and development by" / "Mgroup Shopify Agency". */
(function () {
  'use strict';
  var panel = document.getElementById('credit-text'); if (!panel) return;
  var DEF_TEXT = 'Design and development by', DEF_ANCHOR = 'Mgroup Shopify Agency';
  var LANGS = [
    ['en', 'English', 'Design and development by'],
    ['uk', 'Українська', 'Дизайн і розробка —'],
    ['de', 'Deutsch', 'Design und Entwicklung von'],
    ['fr', 'Français', 'Conception et développement par'],
    ['es', 'Español', 'Diseño y desarrollo por'],
    ['it', 'Italiano', 'Design e sviluppo di'],
    ['pt', 'Português', 'Design e desenvolvimento por'],
    ['nl', 'Nederlands', 'Ontwerp en ontwikkeling door'],
    ['pl', 'Polski', 'Projekt i realizacja:'],
    ['cs', 'Čeština', 'Design a vývoj:'],
    ['sv', 'Svenska', 'Design och utveckling av'],
    ['da', 'Dansk', 'Design og udvikling af'],
    ['nb', 'Norsk', 'Design og utvikling av'],
    ['fi', 'Suomi', 'Suunnittelu ja toteutus:'],
    ['ja', '日本語', 'デザイン・開発：']
  ];
  var textInput = document.getElementById('credit-text-input');
  var anchorInput = document.getElementById('credit-anchor-input');
  var langRow = document.getElementById('credit-langs');
  var resetBtn = document.getElementById('credit-reset');

  langRow.innerHTML = LANGS.map(function (l) {
    return '<button class="chip credit-lang" type="button" data-lang="' + l[0] + '" data-text="' + l[2].replace(/"/g, '&quot;') + '" aria-pressed="' + (l[0] === 'en' ? 'true' : 'false') + '" title="' + l[2].replace(/"/g, '&quot;') + '">' + l[1] + '</button>';
  }).join('');

  // remember originals
  var codes = Array.prototype.slice.call(document.querySelectorAll('#snippets pre code'));
  codes.forEach(function (c) { c.dataset.orig = c.textContent; });
  var previews = Array.prototype.slice.call(document.querySelectorAll('.credit-demo .mg-credit'));

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function clean(v, def) { v = String(v || '').replace(/\s+/g, ' ').trim(); return v || def; }

  function apply() {
    var text = clean(textInput.value, DEF_TEXT), anchor = clean(anchorInput.value, DEF_ANCHOR);
    var liqText = text.replace(/'/g, '’'), liqAnchor = anchor.replace(/'/g, '’');
    codes.forEach(function (c) {
      var s = c.dataset.orig;
      // Liquid defaults and JSX defaults keep quotes; plain markup is bare text — all three are covered by literal replacement
      s = s.replace(new RegExp(esc(DEF_TEXT), 'g'), liqText).replace(new RegExp(esc(DEF_ANCHOR), 'g'), liqAnchor);
      c.textContent = s;
    });
    previews.forEach(function (p) {
      var lead = p.querySelector(':scope > span'); if (lead) lead.textContent = text;
      var a = p.querySelector('.mg-credit__link > span'); if (a) a.textContent = anchor;
    });
    // mark the matching language chip
    var chips = Array.prototype.slice.call(langRow.querySelectorAll('.credit-lang'));
    chips.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.text === text ? 'true' : 'false'); });
    document.getElementById('credit-status').textContent = (text === DEF_TEXT && anchor === DEF_ANCHOR) ? 'Default wording. All code blocks below use it.' : 'Custom wording applied to the preview and all code blocks below — copy any of them.';
  }

  langRow.addEventListener('click', function (e) {
    var b = e.target.closest('.credit-lang'); if (!b) return;
    textInput.value = b.dataset.text; apply();
  });
  textInput.addEventListener('input', apply);
  anchorInput.addEventListener('input', apply);
  resetBtn.addEventListener('click', function () { textInput.value = DEF_TEXT; anchorInput.value = DEF_ANCHOR; apply(); });

  apply();
})();
