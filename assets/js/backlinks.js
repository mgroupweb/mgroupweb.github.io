/* Backlink Checker — link profile (Open PageRank / Moz via Mgroup proxy, Tranco) + backlink verification (fetches source pages via the proxy). */
(function () {
  var EP = 'https://mgroup-metrics.stupak-ol.workers.dev';
  var pf = document.getElementById('bl-profile-form'); if (!pf) return;
  var pIn = document.getElementById('bl-domain'), pStatus = document.getElementById('bl-profile-status'), pOut = document.getElementById('bl-profile-out'),
      vf = document.getElementById('bl-verify-form'), vIn = document.getElementById('bl-sources'), vTarget = document.getElementById('bl-target'),
      vStatus = document.getElementById('bl-verify-status'), vOut = document.getElementById('bl-verify-out'), vBody = document.getElementById('bl-tbody'),
      vSum = document.getElementById('bl-verify-summary'), vAlert = document.getElementById('bl-alert'), copyBtn = document.getElementById('bl-copy'), dlBtn = document.getElementById('bl-download');
  var rows = [];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return n == null ? '—' : Number(n).toLocaleString('en-US'); }
  function norm(s) { s = String(s || '').trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split(/[\/?#]/)[0]; return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(s) ? s : null; }
  function post(path, body) { return fetch(EP + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
  function score(rank) { return rank ? Math.max(0, Math.min(100, Math.round(100 - 10 * Math.log10(rank)))) : null; }
  function showAlert(msg) { if (!msg) { vAlert.hidden = true; return; } vAlert.textContent = msg; vAlert.hidden = false; }

  /* ---------- profile ---------- */
  pf.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = norm(pIn.value); if (!d) { pStatus.textContent = 'Enter a domain like example.com'; return; }
    pStatus.textContent = 'Checking ' + d + '…'; pOut.hidden = true;
    Promise.all([
      post('/profile', { domain: d }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      post('/', { domains: [d] }).then(function (r) { return r.status === 429 ? { rate: true } : r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch('https://tranco-list.eu/api/ranks/domain/' + encodeURIComponent(d)).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (res) {
      var p = res[0] || {}, m = (res[1] && res[1].metrics && res[1].metrics[d]) || {}, tr = res[2] && res[2].ranks ? res[2].ranks.filter(function (x) { return x.rank > 0; }).sort(function (a, b) { return b.date.localeCompare(a.date); }) : [];
      var rank = tr[0] ? tr[0].rank : null;
      var hist = (p.history || []).filter(function (h) { return h.opr != null; });
      var maxO = Math.max.apply(null, hist.map(function (h) { return h.opr; }).concat([1]));
      var bars = hist.map(function (h) { return '<div class="bar"><span class="bar__label">' + esc((h.date || '').slice(0, 7)) + '</span><span class="bar__track"><span class="bar__fill" style="width:' + Math.round(h.opr / maxO * 100) + '%"></span></span><span class="bar__val">' + h.opr + '</span></div>'; }).join('');
      var first = hist[0], last = hist[hist.length - 1];
      var trend = first && last ? (last.opr - first.opr) : null;
      pOut.innerHTML =
        '<div class="result-hero"><span class="eyebrow">' + esc(d) + '</span><div class="result-hero__num">OPR ' + (p.opr != null ? p.opr : '—') + ' <span class="result-hero__sub" style="display:inline">/ 10</span></div>' +
        '<div class="result-hero__sub">Open PageRank on the Common Crawl link graph' + (p.rank ? ' · global rank #' + fmt(p.rank) : '') + (p.asOf ? ' · data as of ' + esc(p.asOf) : '') + (res[1] && res[1].rate ? ' · Moz metrics paused: rate limit' : '') + '</div></div>' +
        '<div class="result-grid">' +
        '<div class="result-mini"><div class="result-mini__label">Referring domains</div><div class="result-mini__num">' + fmt(p.referringDomains) + '</div></div>' +
        '<div class="result-mini"><div class="result-mini__label">Moz DA / PA</div><div class="result-mini__num">' + (m.da != null ? m.da + ' / ' + (m.pa != null ? m.pa : '—') : '—') + '</div></div>' +
        '<div class="result-mini"><div class="result-mini__label">Moz linking root domains</div><div class="result-mini__num">' + fmt(m.rootDomainsLinking) + '</div></div>' +
        '<div class="result-mini"><div class="result-mini__label">Spam score</div><div class="result-mini__num">' + (m.spam != null ? m.spam + '%' : '—') + '</div></div>' +
        '<div class="result-mini"><div class="result-mini__label">Tranco rank / authority</div><div class="result-mini__num">' + (rank ? '#' + fmt(rank) + ' · ' + score(rank) : '—') + '</div></div>' +
        '<div class="result-mini"><div class="result-mini__label">12-month OPR trend</div><div class="result-mini__num">' + (trend == null ? '—' : (trend > 0 ? '▲ +' : trend < 0 ? '▼ ' : '') + trend.toFixed(2)) + '</div></div>' +
        '</div>' + (bars ? '<h3 class="bento__title">OPR by month</h3><div class="bars">' + bars + '</div>' : '') +
        '<p class="note">A full list of backlinks with anchors needs a paid link index (Ahrefs, Moz Links or Semrush). This profile uses free sources: Open PageRank (Common Crawl), Moz metrics via our proxy and the Tranco ranking. To audit specific placements, use the verifier below.</p>';
      pOut.hidden = false; pStatus.textContent = 'Done.';
    });
  });

  /* ---------- backlinks list (Moz) ---------- */
  var lf = document.getElementById('bl-list-form'), lIn = document.getElementById('bl-list-domain'), lLimit = document.getElementById('bl-list-limit'),
      lStatus = document.getElementById('bl-list-status'), lOut = document.getElementById('bl-list-out'), lBody = document.getElementById('bl-list-tbody'),
      lSum = document.getElementById('bl-list-summary'), lMore = document.getElementById('bl-list-more'), lAlert = document.getElementById('bl-list-alert'), lCopy = document.getElementById('bl-list-copy');
  var lRows = [], lNext = null, lDomain = null;
  function lAlertShow(m) { if (!m) { lAlert.hidden = true; return; } lAlert.textContent = m; lAlert.hidden = false; }
  function loadLinks(fresh) {
    var d = norm(lIn.value); if (!d) { lStatus.textContent = 'Enter a domain like example.com'; return; }
    var limit = parseInt(lLimit.value, 10) || 10;
    if (fresh) { lRows = []; lNext = null; lDomain = d; lOut.hidden = true; lAlertShow(null); }
    lStatus.textContent = 'Loading backlinks for ' + d + '…'; lMore.disabled = true;
    post('/backlinks', { domain: d, limit: limit, token: lNext }).then(function (r) { return r.status === 429 ? { status: 'rate' } : r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (j) {
      lMore.disabled = false;
      if (!j) { lStatus.textContent = 'The proxy did not respond. Try again in a moment.'; return; }
      if (j.status === 'rate') { lAlertShow('Limit reached: 10 checks per minute from one network.'); lStatus.textContent = ''; lOut.hidden = false; return; }
      if (j.notice) lAlertShow(j.notice);
      lRows = lRows.concat(j.links || []); lNext = j.nextToken || null;
      var q = j.mozQuota;
      lBody.innerHTML = lRows.map(function (l) {
        return '<tr><th scope="row"><a href="https://' + esc(l.sourcePage) + '" rel="nofollow noopener" target="_blank">' + esc((l.sourcePage || '').slice(0, 70)) + '</a>' + (l.sourceTitle ? '<br><small>' + esc(l.sourceTitle.slice(0, 80)) + '</small>' : '') + '</th>' +
          '<td><span class="score-pill ' + (l.sourceDA >= 40 ? 'score-pill--high' : l.sourceDA >= 20 ? 'score-pill--mid' : 'score-pill--low') + '">' + (l.sourceDA == null ? '—' : l.sourceDA) + '</span></td>' +
          '<td>' + (l.sourceSpam == null ? '—' : l.sourceSpam + '%') + '</td>' +
          '<td>' + esc(l.anchor || '—') + '</td>' +
          '<td><span class="score-pill ' + (l.nofollow ? 'score-pill--low' : 'score-pill--high') + '">' + (l.nofollow ? 'nofollow' : 'follow') + '</span>' + (l.redirect ? ' <small>redirect</small>' : '') + '</td>' +
          '<td>' + esc((l.targetPage || '').replace(/^[^\/]+/, '') || '/') + '</td>' +
          '<td>' + esc(l.firstSeen || '—') + (l.disappeared ? '<br><small>gone ' + esc(l.disappeared) + '</small>' : '') + '</td></tr>';
      }).join('');
      var follow = lRows.filter(function (l) { return !l.nofollow; }).length, doms = {}; lRows.forEach(function (l) { doms[l.sourceDomain] = 1; });
      lSum.innerHTML = '<span class="eyebrow">' + esc(lDomain) + '</span><div class="result-hero__num">' + lRows.length + ' backlink' + (lRows.length === 1 ? '' : 's') + ' shown</div><div class="result-hero__sub">' + follow + ' follow · ' + (lRows.length - follow) + ' nofollow · ' + Object.keys(doms).length + ' linking domain' + (Object.keys(doms).length === 1 ? '' : 's') + ' in this sample · sorted by source DA · Moz Link Index' + (q && q.allotted ? ' · ' + Math.max(0, q.allotted - q.used) + ' of ' + q.allotted + ' Moz rows left this month' : '') + (j.cached ? ' · from cache' : '') + '</div>';
      lMore.hidden = !lNext; lOut.hidden = false;
      lStatus.textContent = lRows.length ? 'Done.' : (j.status === 'ok' ? 'No links found in the Moz index for this domain.' : '');
    });
  }
  lf.addEventListener('submit', function (e) { e.preventDefault(); loadLinks(true); });
  lMore.addEventListener('click', function () { loadLinks(false); });
  lCopy.addEventListener('click', function () {
    var text = ['source_page,source_da,source_spam,anchor,rel,target_page,first_seen,last_seen'].concat(lRows.map(function (l) { return [l.sourcePage, l.sourceDA == null ? '' : l.sourceDA, l.sourceSpam == null ? '' : l.sourceSpam, '"' + String(l.anchor || '').replace(/"/g, '""') + '"', l.nofollow ? 'nofollow' : 'follow', l.targetPage || '', l.firstSeen || '', l.lastSeen || ''].join(','); })).join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { lCopy.textContent = 'Copied'; setTimeout(function () { lCopy.textContent = 'Copy CSV'; }, 1500); }, function () { window.prompt('Copy the CSV below', text); });
  });

  /* ---------- verify ---------- */
  vf.addEventListener('submit', function (e) {
    e.preventDefault(); showAlert(null);
    var t = norm(vTarget.value); if (!t) { vStatus.textContent = 'Enter the target domain the links should point to.'; return; }
    var srcs = []; var seen = {};
    vIn.value.split(/\r?\n/).forEach(function (l) { l = l.trim(); if (!l) return; if (!/^https?:\/\//i.test(l)) l = 'https://' + l; if (!seen[l]) { seen[l] = 1; srcs.push(l); } });
    if (!srcs.length) { vStatus.textContent = 'Paste at least one source URL.'; return; }
    if (srcs.length > 25) { srcs = srcs.slice(0, 25); vStatus.textContent = 'Only the first 25 URLs are checked per run.'; }
    vStatus.textContent = 'Fetching ' + srcs.length + ' page' + (srcs.length === 1 ? '' : 's') + '…'; vOut.hidden = true; rows = [];
    post('/verify', { pairs: srcs.map(function (s) { return { source: s, target: t }; }) }).then(function (r) {
      if (r.status === 429) { showAlert('Limit reached: 10 checks per minute from one network. Wait a minute and try again.'); vStatus.textContent = ''; return null; }
      return r.ok ? r.json() : null;
    }).then(function (j) {
      if (!j) { if (!vAlert.hidden) return; vStatus.textContent = 'The checker could not reach the proxy. Try again in a moment.'; return; }
      rows = j.results || []; render(t); vStatus.textContent = 'Done. Pages are fetched by our proxy the way a crawler would; nothing is stored.';
    });
  });
  function best(r) { var L = r.links || []; return L.filter(function (l) { return l.follow && l.area === 'content'; })[0] || L.filter(function (l) { return l.follow; })[0] || L.filter(function (l) { return l.area === 'content'; })[0] || L[0] || {}; }
  function verdict(r) {
    if (r.error) return ['Unreachable', r.error];
    if (r.status === 403 || r.status === 503) return ['HTTP ' + r.status, 'the site blocks bots — open the page and view source manually'];
    if (r.status !== 200) return ['HTTP ' + r.status, 'page does not return 200'];
    if (!r.found) return ['No link', 'no <a href> to the target in the HTML — a JS-injected or text mention passes nothing'];
    var l = best(r); var flags = [];
    if (!r.indexable) flags.push('page is noindex');
    if (r.canonical && r.finalUrl && r.canonical.replace(/\/$/, '') !== r.finalUrl.replace(/\/$/, '')) flags.push('canonical points elsewhere');
    if (!l.follow) return ['Nofollow', 'rel=' + l.rel + (flags.length ? '; ' + flags.join('; ') : '')];
    if (l.area === 'footer' || l.area === 'nav') flags.push('sitewide ' + l.area + ' link, discounted');
    return [flags.length ? 'Dofollow, flags' : 'Dofollow', flags.join('; ')];
  }
  function render(t) {
    var good = 0;
    vBody.innerHTML = rows.map(function (r) {
      var v = verdict(r); if (v[0] === 'Dofollow') good++;
      var l = best(r);
      return '<tr><th scope="row"><a href="' + esc(r.source) + '" rel="nofollow noopener" target="_blank">' + esc(r.source.replace(/^https?:\/\//, '').slice(0, 60)) + '</a></th>' +
        '<td>' + (r.status == null ? '—' : r.status) + '</td>' +
        '<td>' + (r.found ? 'Yes' + (r.links.length > 1 ? ' ×' + r.links.length : '') : 'No') + '</td>' +
        '<td>' + (r.found ? '<span class="score-pill ' + (l.follow ? 'score-pill--high' : 'score-pill--low') + '">' + esc(l.rel) + '</span>' : '—') + '</td>' +
        '<td>' + (r.found ? esc(l.anchor || '—') : '—') + '</td>' +
        '<td>' + (r.found ? esc(l.area) : '—') + '</td>' +
        '<td>' + (r.indexable == null ? '—' : r.indexable ? 'Yes' : 'No') + '</td>' +
        '<td><strong>' + esc(v[0]) + '</strong>' + (v[1] ? '<br><small>' + esc(v[1]) + '</small>' : '') + '</td></tr>';
    }).join('');
    vSum.innerHTML = '<span class="eyebrow">Result</span><div class="result-hero__num">' + rows.length + ' page' + (rows.length === 1 ? '' : 's') + ' checked</div><div class="result-hero__sub">' + good + ' clean dofollow link' + (good === 1 ? '' : 's') + ' to ' + esc(t) + ' · ' + rows.filter(function (r) { return r.found && !best(r).follow; }).length + ' nofollow · ' + rows.filter(function (r) { return !r.found; }).length + ' without a link</div>';
    vOut.hidden = false;
  }
  function csv() {
    var head = ['source', 'http_status', 'link_found', 'rel', 'anchor', 'area', 'indexable', 'canonical', 'verdict'];
    return [head.join(',')].concat(rows.map(function (r) { var l = best(r); var v = verdict(r); return [r.source, r.status || '', r.found ? 'yes' : 'no', l.rel || '', '"' + String(l.anchor || '').replace(/"/g, '""') + '"', l.area || '', r.indexable == null ? '' : r.indexable ? 'yes' : 'no', r.canonical || '', '"' + v[0] + (v[1] ? ': ' + v[1] : '') + '"'].join(','); })).join('\n');
  }
  copyBtn.addEventListener('click', function () { var text = csv(); (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { copyBtn.textContent = 'Copied'; setTimeout(function () { copyBtn.textContent = 'Copy CSV'; }, 1500); }, function () { window.prompt('Copy the CSV below', text); }); });
  dlBtn.addEventListener('click', function () { var blob = new Blob([csv()], { type: 'text/csv' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'backlink-check.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); });
  document.getElementById('bl-sample').addEventListener('click', function () {
    vTarget.value = 'mgroupweb.com';
    vIn.value = ['https://techreviewer.co/companies/mgroup', 'https://www.shopify.com/partners/directory/partner/mgroup', 'https://clutch.co/profile/mgroup'].join('\n');
    vf.requestSubmit ? vf.requestSubmit() : vf.dispatchEvent(new Event('submit', { cancelable: true }));
  });
})();
