// progress.js — CCNA student progress tracking (browser localStorage).
// Loaded by every chapter and lab; exposes window.Progress.
(function () {
  'use strict';
  var KEY = 'ccna-progress-v1';
  var PASS = 0.8;

  function load() {
    try {
      var s = localStorage.getItem(KEY);
      if (!s) return { quizzes: {}, labs: {} };
      var o = JSON.parse(s);
      if (!o.quizzes) o.quizzes = {};
      if (!o.labs) o.labs = {};
      return o;
    } catch (e) { return { quizzes: {}, labs: {} }; }
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function qk(courseId, chN) { return courseId + '-ch' + chN; }

  var Progress = {
    PASS_THRESHOLD: PASS,

    recordQuiz: function (courseId, chN, score, total) {
      var d = load();
      var k = qk(courseId, chN);
      var prev = d.quizzes[k];
      var best = prev && prev.best > score ? prev.best : score;
      d.quizzes[k] = {
        best: best,
        last: score,
        total: total,
        attempts: ((prev && prev.attempts) || 0) + 1,
        lastAt: new Date().toISOString(),
      };
      save(d);
    },
    getQuiz: function (courseId, chN) { return load().quizzes[qk(courseId, chN)] || null; },
    resetQuiz: function (courseId, chN) {
      var d = load();
      delete d.quizzes[qk(courseId, chN)];
      save(d);
    },

    recordLabComplete: function (labId) {
      var d = load();
      var prev = d.labs[labId];
      d.labs[labId] = {
        completed: true,
        completedAt: (prev && prev.completedAt) || new Date().toISOString(),
        completions: ((prev && prev.completions) || 0) + 1,
      };
      save(d);
    },
    getLab: function (labId) { return load().labs[labId] || null; },
    resetLab: function (labId) {
      var d = load();
      delete d.labs[labId];
      save(d);
    },

    summary: function () {
      var d = load();
      var qs = Object.keys(d.quizzes).map(function (k) { return d.quizzes[k]; });
      var passed = qs.filter(function (q) { return q.total && (q.best / q.total) >= PASS; }).length;
      var labsDone = Object.keys(d.labs).filter(function (k) { return d.labs[k].completed; }).length;
      return {
        quizzesPassed: passed,
        quizzesAttempted: qs.length,
        labsCompleted: labsDone,
        raw: d,
      };
    },
    resetAll: function () { try { localStorage.removeItem(KEY); } catch (e) {} },

    // Render helpers for portals.
    quizBadge: function (courseId, chN) {
      var q = this.getQuiz(courseId, chN);
      if (!q) return '<span class="prog-badge prog-none">— not taken</span>';
      var pct = q.best / q.total;
      var cls = pct >= PASS ? 'prog-pass' : pct >= 0.6 ? 'prog-mid' : 'prog-fail';
      var icon = pct >= PASS ? '✓' : '';
      return '<span class="prog-badge ' + cls + '">' + icon + ' ' + q.best + '/' + q.total + '</span>';
    },
    labBadge: function (labId) {
      var l = this.getLab(labId);
      if (!l || !l.completed) return '';
      return '<span class="prog-badge prog-pass">✓ done</span>';
    },

    // Walk every <a class="card"> on a portal page; decorate with a progress
    // badge based on its href, and insert a summary bar after <header>.
    decoratePortal: function () {
      if (typeof document === 'undefined') return;
      var run = function () {
        var cards = document.querySelectorAll('a.card');
        var totals = { chapters: 0, chaptersPassed: 0, labs: 0, labsDone: 0 };
        cards.forEach(function (card) {
          var href = card.getAttribute('href') || '';
          var chM = href.match(/^ch(\d+)-/);
          if (chM) {
            totals.chapters++;
            var chN = parseInt(chM[1], 10);
            var courseId = chN <= 11 ? 'essentials' : 'fundamentals';
            var q = Progress.getQuiz(courseId, chN);
            var top = card.querySelector('.card-top');
            if (top && !top.querySelector('.prog-badge')) {
              top.insertAdjacentHTML('beforeend', Progress.quizBadge(courseId, chN));
            }
            if (q && q.total && (q.best / q.total) >= PASS) totals.chaptersPassed++;
            return;
          }
          var labM = href.match(/^((?:lab|stp)[\w\-]+)\.html$/);
          if (labM) {
            totals.labs++;
            var labId = labM[1];
            var l = Progress.getLab(labId);
            var top2 = card.querySelector('.card-top');
            if (top2 && !top2.querySelector('.prog-badge') && l && l.completed) {
              top2.insertAdjacentHTML('beforeend', Progress.labBadge(labId));
            }
            if (l && l.completed) totals.labsDone++;
          }
        });

        if (document.getElementById('prog-summary-bar')) return;
        var hdr = document.querySelector('header');
        if (!hdr) return;
        var bar = document.createElement('div');
        bar.id = 'prog-summary-bar';
        bar.className = 'prog-summary-bar';
        bar.innerHTML =
          '<span class="prog-sum-label">Your progress:</span>' +
          '<span class="prog-sum-stat"><b>' + totals.chaptersPassed + '</b> / ' + totals.chapters + ' quizzes passed</span>' +
          '<span class="prog-sum-stat"><b>' + totals.labsDone + '</b> / ' + totals.labs + ' labs complete</span>' +
          '<a href="#" class="prog-sum-reset" id="prog-reset-all">Reset all my progress</a>';
        hdr.parentNode.insertBefore(bar, hdr.nextSibling);
        var resetLink = document.getElementById('prog-reset-all');
        if (resetLink) {
          resetLink.onclick = function (e) {
            e.preventDefault();
            if (confirm('Erase ALL saved quiz scores and lab completions across both courses? This cannot be undone.')) {
              Progress.resetAll();
              location.reload();
            }
          };
        }
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
      else run();
    },

    // Floating "reset this chapter" button anchored to the bottom-right of the page.
    mountChapterReset: function (courseId, chN) {
      if (typeof document === 'undefined') return;
      var attach = function () {
        if (document.getElementById('prog-reset-fab')) return;
        if (!document.body) return;
        var btn = document.createElement('button');
        btn.id = 'prog-reset-fab';
        btn.type = 'button';
        btn.className = 'prog-fab-btn';
        btn.textContent = 'Reset my progress for this chapter';
        btn.onclick = function () {
          if (!confirm('Clear your saved quiz score for this chapter?')) return;
          Progress.resetQuiz(courseId, chN);
          location.reload();
        };
        document.body.appendChild(btn);
      };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
      else attach();
    },
  };

  // Default styles for badges and reset button (idempotent — only injected once).
  function injectStyles() {
    if (document.getElementById('progress-js-styles')) return;
    var s = document.createElement('style');
    s.id = 'progress-js-styles';
    s.textContent =
      '.prog-badge{display:inline-block;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:10px;margin-left:6px;letter-spacing:0.5px;}' +
      '.prog-pass{background:#0a3a1a;color:#00ff66;border:1px solid #00ff66;}' +
      '.prog-mid{background:#3a2e0a;color:#ffd166;border:1px solid #ffd166;}' +
      '.prog-fail{background:#3a0a0a;color:#ff6b6b;border:1px solid #ff6b6b;}' +
      '.prog-none{background:#1a1a1a;color:#666;border:1px solid #2a2a2a;}' +
      '.prog-reset-btn{margin-top:14px;padding:8px 16px;font-size:12px;background:transparent;color:#888;border:1px solid #444;border-radius:5px;cursor:pointer;font-family:inherit;}' +
      '.prog-reset-btn:hover{background:#1a1a1a;color:#ff6b6b;border-color:#ff6b6b;}' +
      '.prog-fab-btn{position:fixed;bottom:16px;right:16px;padding:8px 14px;font-size:11px;background:#1a1a1a;color:#888;border:1px solid #333;border-radius:5px;cursor:pointer;font-family:"Segoe UI",sans-serif;opacity:0.55;z-index:99;}' +
      '.prog-fab-btn:hover{opacity:1;color:#ff6b6b;border-color:#ff6b6b;}' +
      '.prog-summary-bar{background:#0d0d0d;border-bottom:1px solid #1a1a1a;padding:14px 44px;display:flex;align-items:center;gap:24px;flex-wrap:wrap;font-size:13px;color:#aaa;}' +
      '.prog-sum-label{color:#00d4ff;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;font-size:11px;}' +
      '.prog-sum-stat{color:#aaa;}' +
      '.prog-sum-stat b{color:#00ff66;font-size:16px;}' +
      '.prog-sum-reset{margin-left:auto;color:#666;font-size:11px;text-decoration:none;border:1px solid #333;padding:5px 12px;border-radius:4px;}' +
      '.prog-sum-reset:hover{color:#ff6b6b;border-color:#ff6b6b;}';
    (document.head || document.documentElement).appendChild(s);
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectStyles);
    else injectStyles();
  }

  if (typeof window !== 'undefined') window.Progress = Progress;
})();
