/* Mgroup brand assets — pick a colour, preview and download the three logos as SVG or PNG.
   Sources are inline in the page (#brand-src-*); colour is applied at download time, nothing is fetched. */
(function () {
  'use strict';
  var root = document.getElementById('brand'); if (!root) return;
  var $ = function (s, el) { return (el || root).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); };

  var SRC = {
    wordmark: $('#brand-src-wordmark').textContent,
    round: $('#brand-src-round').textContent,
    square: $('#brand-src-square').textContent
  };
  var state = { color: '#5A58E2', style: 'fill' }; // style: fill (colour bg + white M) | mono (transparent, M in colour)

  function normHex(v) {
    v = String(v || '').trim(); if (v[0] !== '#') v = '#' + v;
    if (/^#[0-9a-f]{3}$/i.test(v)) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : null;
  }
  function isLight(hex) { var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return (0.299 * r + 0.587 * g + 0.114 * b) > 186; }

  function build(kind) {
    var c = state.color, s = SRC[kind];
    if (kind === 'wordmark') return s.replace(/fill="#5A58E2"/g, 'fill="' + c + '"');
    if (state.style === 'mono') {
      // drop the background shape, paint the M in the chosen colour
      s = s.replace(/<circle[^>]*\/>/, '').replace(/<rect width="500" height="500"[^>]*\/>/, '');
      return s.replace(/fill="white"/g, 'fill="' + c + '"');
    }
    var letter = isLight(c) ? '#1F2544' : '#FFFFFF';
    return s.replace(/fill="#5A58E2"/g, 'fill="' + c + '"').replace(/fill="white"/g, 'fill="' + letter + '"');
  }

  function render() {
    $$('.brand__tile').forEach(function (t) {
      var kind = t.dataset.kind, svg = build(kind);
      $('.brand__canvas', t).innerHTML = svg;
      var bg = $('.brand__canvas', t);
      // canvas background: show light for dark logos, dark for light logos so white/black variants stay visible
      var dark = isLight(state.color) || (state.style === 'mono' && isLight(state.color));
      bg.classList.toggle('brand__canvas--dark', dark);
    });
    $('#brand-hex').value = state.color;
    $$('.brand__swatch').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.color.toUpperCase() === state.color ? 'true' : 'false'); });
    $$('.brand__style').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.style === state.style ? 'true' : 'false'); });
    $('#brand-style-row').hidden = false;
  }

  function fileBase(kind) { return 'mgroup-' + kind + (kind !== 'wordmark' && state.style === 'mono' ? '-mono' : '') + '-' + state.color.slice(1).toLowerCase(); }

  function downloadSvg(kind) {
    var svg = build(kind);
    if (!/^<\?xml/.test(svg)) svg = '<?xml version="1.0" encoding="UTF-8"?>\n' + svg;
    var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    save(URL.createObjectURL(blob), fileBase(kind) + '.svg');
  }

  function downloadPng(kind, size) {
    var svg = build(kind);
    var vb = /viewBox="([\d.\s-]+)"/.exec(svg); var parts = vb ? vb[1].split(/\s+/).map(Number) : [0, 0, 100, 100];
    var w = parts[2], h = parts[3], scale = size / Math.max(w, h);
    var img = new Image();
    var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = function () {
      var cv = document.createElement('canvas'); cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
      var ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob(function (b) { save(URL.createObjectURL(b), fileBase(kind) + '-' + size + '.png'); }, 'image/png');
    };
    img.src = url;
  }

  function save(href, name) { var a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); if (href.indexOf('blob:') === 0) URL.revokeObjectURL(href); }, 1500); }

  function downloadAllSvg() {
    ['wordmark', 'round', 'square'].forEach(function (k, i) { setTimeout(function () { downloadSvg(k); }, i * 350); });
  }

  root.addEventListener('click', function (e) {
    var sw = e.target.closest('.brand__swatch'); if (sw) { state.color = sw.dataset.color.toUpperCase(); render(); return; }
    var st = e.target.closest('.brand__style'); if (st) { state.style = st.dataset.style; render(); return; }
    var dl = e.target.closest('[data-dl]'); if (!dl) return;
    var kind = dl.dataset.kind, what = dl.dataset.dl;
    if (what === 'svg') downloadSvg(kind);
    else if (what === 'png') downloadPng(kind, parseInt(dl.dataset.size, 10) || 1024);
    else if (what === 'all') downloadAllSvg();
  });
  $('#brand-hex').addEventListener('input', function (e) { var v = normHex(e.target.value); if (v) { state.color = v; render(); } });
  $('#brand-picker').addEventListener('input', function (e) { state.color = e.target.value.toUpperCase(); render(); });

  render();
})();
