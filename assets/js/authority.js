/* Domain Authority Checker — runs entirely in the browser.
   Data: Tranco daily ranking (tranco-list.eu, CORS-enabled public API) + registry RDAP via rdap.org.
   Nothing is stored or sent to Mgroup. MIT. */
(function () {
  var form = document.getElementById('auth-form'); if (!form) return;
  var ta = document.getElementById('auth-input'), runBtn = document.getElementById('auth-run'),
      sampleBtn = document.getElementById('auth-sample'), status = document.getElementById('auth-status'),
      results = document.getElementById('auth-results'), tbody = document.getElementById('auth-tbody'),
      summary = document.getElementById('auth-summary'), copyBtn = document.getElementById('auth-copy'),
      dlBtn = document.getElementById('auth-download'), alertBox = document.getElementById('auth-alert');
  var MAX = 25, rows = [], metrics = {}, providers = null;
  /* Optional metrics proxy (worker/metrics-worker.js) — supplies Moz DA/PA/Spam Score, Ahrefs DR/UR, Open PageRank.
     Leave empty until the Worker is deployed; the table then shows "—" for those columns. */
  var METRICS_ENDPOINT = 'https://mgroup-metrics.stupak-ol.workers.dev';
  var RISKY_TLD = ['xyz','top','icu','buzz','click','cyou','monster','rest','fun','sbs','cfd','bond','lol','quest','uno','gq','tk','ml','cf','ga'];

  function normalize(line) {
    var s = line.trim().toLowerCase(); if (!s) return null;
    s = s.replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split(/[\/?#]/)[0].replace(/:\d+$/, '');
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(s)) return null;
    return s;
  }
  function registrable(d) { // best-effort: keep last 2 labels, or 3 for common 2-level ccTLDs
    var p = d.split('.'); if (p.length <= 2) return d;
    var two = p.slice(-2).join('.');
    if (/^(co|com|org|net|gov|ac|edu)\.[a-z]{2}$/.test(two)) return p.slice(-3).join('.');
    return two;
  }
  function score(rank) { if (!rank) return null; return Math.max(0, Math.min(100, Math.round(100 - 10 * Math.log10(rank)))); }
  function fmt(n) { return n == null ? '—' : n.toLocaleString('en-US'); }
  function ageText(date) {
    if (!date) return '—';
    var y = (Date.now() - date.getTime()) / 31557600000;
    return y < 1 ? Math.max(1, Math.round(y * 12)) + ' mo' : y.toFixed(1) + ' y';
  }
  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); })]); }

  function tranco(d, attempt) {
    attempt = attempt || 1;
    return withTimeout(fetch('https://tranco-list.eu/api/ranks/domain/' + encodeURIComponent(d)), 12000)
      .then(function (r) {
        if (r.status === 429 || r.status === 503) { throw new Error('rate'); }
        if (!r.ok) throw new Error('tranco');
        return r.json();
      })
      .then(function (j) {
        var ranks = (j.ranks || []).filter(function (x) { return x.rank > 0; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
        return { latest: ranks[0] || null, month: ranks[Math.min(ranks.length - 1, 29)] || null, ok: true };
      })
      .catch(function (e) {
        if (attempt < 4) { // 429 or a CORS-less error page: back off and retry
          return new Promise(function (res) { setTimeout(res, 1800 * attempt); }).then(function () { return tranco(d, attempt + 1); });
        }
        return { latest: null, month: null, ok: false };
      });
  }
  function rdap(d) {
    return withTimeout(fetch('https://rdap.org/domain/' + encodeURIComponent(d), { headers: { Accept: 'application/rdap+json' } }), 12000)
      .then(function (r) { if (!r.ok) throw new Error('rdap'); return r.json(); })
      .then(function (j) {
        var ev = (j.events || []).filter(function (e) { return e.eventAction === 'registration'; })[0];
        return ev && ev.eventDate ? new Date(ev.eventDate) : null;
      }).catch(function () { return null; });
  }
  function reachable(d) {
    var c = new AbortController(); var t = setTimeout(function () { c.abort(); }, 7000);
    return fetch('https://' + d + '/', { mode: 'no-cors', cache: 'no-store', signal: c.signal })
      .then(function () { return true; }).catch(function () { return false; })
      .then(function (v) { clearTimeout(t); return v; });
  }

  function showAlert(msg) { if (!alertBox) return; if (!msg) { alertBox.hidden = true; alertBox.textContent = ''; return; } alertBox.textContent = msg; alertBox.hidden = false; }
  function fetchMetrics(list) {
    providers = null; metrics = {}; showAlert(null);
    if (!METRICS_ENDPOINT) return Promise.resolve();
    return withTimeout(fetch(METRICS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domains: list }) }), 25000)
      .then(function (r) {
        if (r.status === 429) { showAlert('Limit reached: 10 checks per 10 minutes from one network. Authority, rank and age still work; DA, PA and Spam Score return after the pause.'); return null; }
        return r.ok ? r.json() : null;
      })
      .then(function (j) { if (j) { metrics = j.metrics || {}; providers = j.providers || null; if (j.notice) showAlert(j.notice); } })
      .catch(function () {});
  }
  function m(d, k) { var x = metrics[d]; return x && x[k] != null ? x[k] : null; }
  function mcell(d, k, cls) { var v = m(d, k); return '<td>' + (v == null ? '<span class="muted">—</span>' : '<span class="score-pill ' + (cls || '') + '">' + v + '</span>') + '</td>'; }
  function verdict(r) {
    var flags = [];
    var tld = r.domain.split('.').pop();
    if (RISKY_TLD.indexOf(tld) > -1) flags.push('risky TLD');
    if (r.age != null && r.age < 1) flags.push('under 1 year old');
    if (!r.trancoOk) flags.push('ranking service busy, retry later');
    else if (!r.rank) flags.push('not in Tranco top ranking');
    else if (r.rank > 2000000) flags.push('very low traffic');
    if (r.live === false) flags.push('not reachable over HTTPS');
    var sp = m(r.domain, 'spam'); if (sp != null && sp >= 30) flags.push('Moz spam score ' + sp + '%');
    var label;
    if (!r.trancoOk) label = 'Unknown';
    else if (r.score == null) label = flags.length > 1 ? 'Avoid' : 'Unranked';
    else if (r.score >= 55 && !flags.length) label = 'Strong';
    else if (r.score >= 45 && flags.length <= 1) label = 'Moderate';
    else if (r.score >= 35) label = 'Low';
    else label = 'Weak';
    return { label: label, flags: flags };
  }

  function render() {
    tbody.innerHTML = '';
    var strong = 0, risky = 0;
    rows.forEach(function (r) {
      var v = verdict(r); if (v.label === 'Strong') strong++; if (v.flags.length) risky++;
      var delta = (r.rank && r.rankMonth) ? r.rankMonth - r.rank : null; // positive = improved (rank number went down)
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<th scope="row">' + esc(r.domain) + '</th>' +
        mcell(r.domain, 'da') + mcell(r.domain, 'pa') + mcell(r.domain, 'spam', 'score-pill--spam') + mcell(r.domain, 'dr') + mcell(r.domain, 'ur') +
        '<td><span class="score-pill score-pill--' + band(r.score) + '">' + (r.score == null ? '—' : r.score) + '</span></td>' +
        '<td>' + (r.rank ? '#' + fmt(r.rank) : r.trancoOk ? 'not ranked' : 'n/a') + '</td>' +
        '<td class="' + (delta == null ? '' : delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : '') + '">' + (delta == null ? '—' : (delta > 0 ? '▲ ' : delta < 0 ? '▼ ' : '') + fmt(Math.abs(delta))) + '</td>' +
        '<td>' + ageText(r.created) + '</td>' +
        '<td>' + (r.live === true ? 'Yes' : r.live === false ? 'No' : '—') + '</td>' +
        '<td><strong>' + v.label + '</strong>' + (v.flags.length ? '<br><small>' + esc(v.flags.join(', ')) + '</small>' : '') + '</td>';
      tbody.appendChild(tr);
    });
    summary.innerHTML = '<span class="eyebrow">Result</span><div class="result-hero__num">' + rows.length + ' domain' + (rows.length === 1 ? '' : 's') + ' checked</div>' +
      '<div class="result-hero__sub">' + strong + ' strong · ' + risky + ' with warnings · ' +
      (providers ? ('Moz ' + (providers.moz ? 'on' : 'off') + ' · Ahrefs ' + (providers.ahrefs ? 'on' : 'off')) : 'DA/PA/Spam (Moz) and DR/UR (Ahrefs) columns need the metrics proxy — see the note below') + '</div>';
    results.hidden = false;
  }
  function band(s) { return s == null ? 'none' : s >= 55 ? 'high' : s >= 45 ? 'mid' : 'low'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function csv() {
    var head = ['domain', 'moz_da', 'moz_pa', 'moz_spam_score', 'ahrefs_dr', 'ahrefs_ur', 'authority_score', 'tranco_rank', 'rank_30d_ago', 'registered', 'age_years', 'https_reachable', 'verdict', 'flags'];
    var lines = [head.join(',')].concat(rows.map(function (r) {
      var v = verdict(r);
      return [r.domain, m(r.domain,'da') ?? '', m(r.domain,'pa') ?? '', m(r.domain,'spam') ?? '', m(r.domain,'dr') ?? '', m(r.domain,'ur') ?? '', r.score == null ? '' : r.score, r.rank || '', r.rankMonth || '', r.created ? r.created.toISOString().slice(0, 10) : '',
        r.age == null ? '' : r.age.toFixed(2), r.live === true ? 'yes' : r.live === false ? 'no' : '', v.label, '"' + v.flags.join('; ') + '"'].join(',');
    }));
    return lines.join('\n');
  }

  function run(list) {
    rows = []; results.hidden = true; runBtn.disabled = true;
    var mp = fetchMetrics(list);
    var i = 0;
    function next() {
      if (i >= list.length) { mp.then(function () { render(); var unk = rows.filter(function (r) { return !r.trancoOk; }).length; if (unk) showAlert((alertBox && !alertBox.hidden ? alertBox.textContent + ' ' : '') + 'Tranco ranking service rate-limited ' + unk + ' domain' + (unk === 1 ? '' : 's') + ' (shown as Unknown). Wait a minute and check them again.'); }); status.textContent = 'Done. ' + list.length + ' domain' + (list.length === 1 ? '' : 's') + ' checked in your browser; nothing was stored.'; runBtn.disabled = false; render(); return; }
      var d = list[i++]; status.textContent = 'Checking ' + d + ' (' + i + '/' + list.length + ')…';
      Promise.all([tranco(d), rdap(d), reachable(d)]).then(function (res) {
        var t = res[0], created = res[1];
        var age = created ? (Date.now() - created.getTime()) / 31557600000 : null;
        rows.push({ domain: d, rank: t.latest ? t.latest.rank : null, rankMonth: t.month ? t.month.rank : null,
          score: score(t.latest ? t.latest.rank : null), created: created, age: age, live: res[2], trancoOk: t.ok });
        render(); setTimeout(next, 1200);
      });
    }
    next();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var seen = {}, list = [];
    ta.value.split(/\r?\n|,|\s+/).forEach(function (l) { var d = normalize(l); if (d) { d = registrable(d); if (!seen[d]) { seen[d] = 1; list.push(d); } } });
    if (!list.length) { status.textContent = 'Paste at least one valid domain, one per line.'; return; }
    if (list.length > MAX) { status.textContent = 'Only the first ' + MAX + ' domains are checked per run.'; list = list.slice(0, MAX); }
    run(list);
  });
  sampleBtn.addEventListener('click', function () {
    ta.value = ['shopify.com', 'mgroupweb.com', 'practicalecommerce.com', 'ecommercefastlane.com', 'example.xyz'].join('\n');
    form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true }));
  });
  copyBtn.addEventListener('click', function () {
    var text = csv();
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
      copyBtn.textContent = 'Copied'; setTimeout(function () { copyBtn.textContent = 'Copy CSV'; }, 1500);
    }, function () { window.prompt('Copy the CSV below', text); });
  });
  dlBtn.addEventListener('click', function () {
    var blob = new Blob([csv()], { type: 'text/csv' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'domain-authority-check.csv'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
})();
