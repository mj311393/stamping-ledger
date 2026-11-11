/* 客服问答 —— 前端（只用 textContent 渲染） */
(function () {
  'use strict';

  var API = (location.hostname.indexOf('github.io') >= 0)
    ? 'https://stamping.yilufa.site/bbs/api/'
    : '../bbs/api/';

  var $view = document.getElementById('view');
  var $cmsg = document.getElementById('cmsg');
  var $count = document.getElementById('count');
  var $pendtip = document.getElementById('pendtip');
  var busy = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function api(path, opt) {
    var o = opt || {};
    return fetch(API + path, {
      method: o.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: o.body ? JSON.stringify(o.body) : undefined,
      cache: 'no-store'
    }).then(function (r) { return r.json().catch(function () { return { ok: false, error: '服务器没回话' }; }); });
  }
  function say(node, text, ok) {
    node.textContent = text || '';
    node.className = 'msg' + (ok ? ' ok' : '');
  }

  function loadList() {
    api('ask?limit=40').then(function (d) {
      if (!d.ok) { $view.innerHTML = '<div class="empty">读取失败，稍后再试</div>'; return; }
      $count.textContent = d.total ? ('共 ' + d.total + ' 个问题') : '';
      $pendtip.textContent = d.pending ? ('待回复 ' + d.pending + ' 个') : '全部已回复';
      render(d.items || []);
    }).catch(function () {
      $view.innerHTML = '<div class="empty">网络不通，稍后再试</div>';
    });
  }

  function render(items) {
    $view.innerHTML = '';
    if (!items.length) {
      var e = el('div', 'empty');
      e.appendChild(el('div', null, '还没有人提问'));
      e.appendChild(el('div', null, '第一个问题就由你来问吧'));
      $view.appendChild(e);
      return;
    }
    items.forEach(function (q) {
      var card = el('article', 'qa ' + (q.answered ? 'done' : 'wait'));
      var meta = el('div', 'qmeta');
      meta.appendChild(el('span', 'tag ' + (q.answered ? 'done' : 'wait'), q.answered ? '已回复' : '待回复'));
      meta.appendChild(el('span', 'nick', q.nick));
      meta.appendChild(el('span', null, q.time));
      card.appendChild(meta);
      card.appendChild(el('div', 'qbody', q.body));
      if (q.answered) {
        var ans = el('div', 'answer');
        var ah = el('div', 'ahead');
        ah.appendChild(el('b', null, q.answered_by || '客服桃子'));
        ah.appendChild(el('span', null, ' 回复 · ' + q.answered_time));
        ans.appendChild(ah);
        ans.appendChild(el('div', 'abody', q.answer));
        if (q.preview) {
          var snap = el('div', 'snap');
          var head = el('div', 'snaphead', '附件快照 · ' + (q.preview_title || '文件预览'));
          snap.appendChild(head);
          var img = el('img');
          img.src = API + q.preview;
          img.alt = '附件快照';
          img.loading = 'lazy';
          snap.appendChild(img);
          snap.appendChild(el('div', 'snapfoot', '快照看不清细节。想要原文原件，在下面留言并留邮箱，客服桃子发给你。'));
          ans.appendChild(snap);
        }
        card.appendChild(ans);
      } else {
        card.appendChild(el('div', 'waiting', '已收到，等下一次集中回复（每 2 小时一次）'));
      }
      $view.appendChild(card);
    });
  }

  document.getElementById('send').addEventListener('click', function () {
    var btn = this;
    if (busy) return;
    var body = document.getElementById('body').value.trim();
    var nick = document.getElementById('nick').value.trim();
    var contact = document.getElementById('contact').value.trim();
    var hp = document.getElementById('hp').value;
    if (body.length < 4) { say($cmsg, '问题至少写四个字，说清楚想问什么'); return; }
    busy = true; btn.disabled = true;
    say($cmsg, '提交中…', true);
    api('ask', { method: 'POST', body: { nick: nick, body: body, contact: contact, hp: hp } })
      .then(function (r) {
        busy = false; btn.disabled = false;
        if (r.ok) {
          if (nick) localStorage.setItem('ask_nick', nick);
          document.getElementById('body').value = '';
          say($cmsg, '提交成功，2 小时内回复', true);
          loadList();
        } else {
          say($cmsg, r.error || '没提交上去');
        }
      }).catch(function () {
        busy = false; btn.disabled = false;
        say($cmsg, '网络不通，稍后再试');
      });
  });

  var nickInput = document.getElementById('nick');
  nickInput.value = localStorage.getItem('ask_nick') || '';
  loadList();
  setInterval(function () {
    if (document.hidden || busy) return;
    if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    loadList();
  }, 60000);
})();
