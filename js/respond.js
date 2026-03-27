/* =====================================================
   対応・回答ページ
   ===================================================== */
(function () {
  "use strict";

  // ---------- フィルタ初期化 ----------
  var fCat = document.getElementById("filterCategory");
  for (var i = 0; i < CATEGORIES.length; i++) {
    var o1 = document.createElement("option");
    o1.value = CATEGORIES[i].value;
    o1.textContent = CATEGORIES[i].label;
    fCat.appendChild(o1);
  }

  var fPri = document.getElementById("filterPriority");
  for (var j = 0; j < PRIORITIES.length; j++) {
    var o2 = document.createElement("option");
    o2.value = PRIORITIES[j].value;
    o2.textContent = PRIORITIES[j].label;
    fPri.appendChild(o2);
  }

  var fStatus  = document.getElementById("filterStatus");
  var fKeyword = document.getElementById("filterKeyword");
  var listEl   = document.getElementById("ticketList");

  // ---------- 描画関数 ----------
  function render() {
    var tickets  = getTickets();
    var sStatus  = fStatus.value;
    var sCat     = fCat.value;
    var sPri     = fPri.value;
    var sKey     = fKeyword.value.trim().toLowerCase();

    // デバッグカウント更新
    var countEl = document.getElementById("debugCount");
    if (countEl) countEl.textContent = tickets.length;

    var filtered = [];
    for (var i = 0; i < tickets.length; i++) {
      var t = tickets[i];
      if (sStatus && t.status !== sStatus) continue;
      if (sCat && t.category !== sCat) continue;
      if (sPri && t.priority !== sPri) continue;
      if (sKey) {
        var user = findUser(t.requesterId);
        var haystack = (t.title + " " + t.description + " " + (user ? user.name : "")).toLowerCase();
        if (haystack.indexOf(sKey) === -1) continue;
      }
      filtered.push(t);
    }

    if (filtered.length === 0) {
      listEl.innerHTML =
        '<div class="empty-state">' +
        '<div class="icon">📭</div>' +
        '<p>該当するチケットがありません</p>' +
        '<p style="font-size:.8rem;margin-top:.5rem;color:var(--gray-400)">チケット作成ページから投稿してください</p>' +
        '</div>';
      return;
    }

    // id降順ソート
    filtered.sort(function (a, b) { return b.id - a.id; });

    var html = "";
    for (var k = 0; k < filtered.length; k++) {
      var tk = filtered[k];
      var usr = findUser(tk.requesterId);
      html +=
        '<div class="ticket-item status-' + tk.status + '" onclick="openDetail(' + tk.id + ')">' +
          '<div class="ticket-id">#' + String("0000" + tk.id).slice(-4) + '</div>' +
          '<div class="ticket-info">' +
            '<h4>' + escHtml(tk.title) + '</h4>' +
            '<div class="ticket-meta">' +
              '<span class="badge ' + categoryBadgeClass(tk.category) + '">' + categoryLabel(tk.category) + '</span>' +
              '<span class="badge ' + priorityBadgeClass(tk.priority) + '">' + priorityLabel(tk.priority) + '</span>' +
              '<span class="badge ' + statusBadgeClass(tk.status) + '">' + statusLabel(tk.status) + '</span>' +
              '<span>📅 ' + formatDate(tk.occurredDate) + '</span>' +
              '<span>👤 ' + (usr ? escHtml(usr.name) : "不明") + '</span>' +
              '<span>💬 ' + tk.comments.length + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="ticket-actions">' +
            '<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openDetail(' + tk.id + ')">詳細</button>' +
          '</div>' +
        '</div>';
    }
    listEl.innerHTML = html;
  }

  // フィルタイベント
  fStatus.addEventListener("change", render);
  fCat.addEventListener("change", render);
  fPri.addEventListener("change", render);
  fKeyword.addEventListener("input", render);

  // 初回描画
  render();

  // ---------- デバッグ用 ----------
  window.refreshDebug = function () {
    render();
    showToast("一覧を再読み込みしました（チケット数: " + getTickets().length + "）");
  };

  window.insertSample = function () {
    var tickets = getTickets();
    var sample = {
      id: getNextId(),
      requesterId: "u3",
      category: "tech",
      priority: "high",
      occurredDate: new Date().toISOString().slice(0, 10),
      title: "【サンプル】VPN接続ができない",
      description: "社外からVPN接続を試みましたが、認証エラーが表示されて接続できません。\nエラーコード: ERR_AUTH_FAILED",
      status: "open",
      createdAt: new Date().toISOString(),
      comments: []
    };
    tickets.push(sample);
    saveTickets(tickets);
    showToast("サンプルチケット #" + sample.id + " を挿入しました");
    render();
  };

  // ---------- コメント描画ヘルパー ----------
  function renderComment(c) {
    var u = findUser(c.userId);
    var statusTag = "";
    if (c.statusChange) {
      statusTag = ' <span class="badge ' + statusBadgeClass(c.statusChange) + '">' + statusLabel(c.statusChange) + 'に変更</span>';
    }
    return (
      '<div class="comment is-responder">' +
        '<img class="comment-avatar" src="' + (u ? u.avatar : '') + '" onerror="avatarFallback(this)" />' +
        '<div class="comment-content">' +
          '<div class="comment-header">' +
            '<span class="comment-author">' + (u ? escHtml(u.name) : "不明") + '</span>' +
            '<span class="comment-dept">' + (u ? escHtml(u.dept + " / " + u.title) : "") + '</span>' +
            statusTag +
            '<span class="comment-date">' + formatDateTime(c.createdAt) + '</span>' +
          '</div>' +
          '<div class="comment-body">' + escHtml(c.text) + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------- モーダル ----------
  window.openDetail = function (ticketId) {
    var tickets = getTickets();
    var t = null;
    for (var i = 0; i < tickets.length; i++) {
      if (tickets[i].id === ticketId) { t = tickets[i]; break; }
    }
    if (!t) return;

    var user = findUser(t.requesterId);
    var body = document.getElementById("modalBody");
    document.getElementById("modalTitle").textContent = "#" + String("0000" + t.id).slice(-4) + " " + t.title;

    var commentsHtml = "";
    for (var c = 0; c < t.comments.length; c++) {
      commentsHtml += renderComment(t.comments[c]);
    }
    var noComments = t.comments.length === 0
      ? '<p style="color:var(--gray-400);font-size:.85rem;margin-top:.5rem;">まだコメントはありません</p>'
      : '';

    body.innerHTML =
      '<!-- 投稿者 -->' +
      '<div class="detail-requester">' +
        '<img src="' + (user ? user.avatar : '') + '" onerror="avatarFallback(this)" />' +
        '<div class="info">' +
          '<div class="name">' + (user ? escHtml(user.name) : "不明") + '</div>' +
          '<div class="dept">' + (user ? escHtml(user.dept + " / " + user.title) : "") + '</div>' +
        '</div>' +
        '<span style="margin-left:auto;font-size:.8rem;color:var(--gray-400)">作成: ' + formatDateTime(t.createdAt) + '</span>' +
      '</div>' +

      '<!-- 詳細グリッド -->' +
      '<div class="detail-grid">' +
        '<div class="detail-item"><label>カテゴリ</label><div class="value"><span class="badge ' + categoryBadgeClass(t.category) + '">' + categoryLabel(t.category) + '</span></div></div>' +
        '<div class="detail-item"><label>優先度</label><div class="value"><span class="badge ' + priorityBadgeClass(t.priority) + '">' + priorityLabel(t.priority) + '</span></div></div>' +
        '<div class="detail-item"><label>発生日</label><div class="value">' + formatDate(t.occurredDate) + '</div></div>' +
        '<div class="detail-item"><label>ステータス</label><div class="value"><span class="badge ' + statusBadgeClass(t.status) + '">' + statusLabel(t.status) + '</span></div></div>' +
      '</div>' +

      '<!-- 説明 -->' +
      '<div class="detail-description">' + escHtml(t.description) + '</div>' +

      '<!-- コメントスレッド -->' +
      '<h4 style="margin-bottom:.75rem;">💬 コメント (' + t.comments.length + ')</h4>' +
      '<div class="comment-thread" id="commentThread">' + commentsHtml + '</div>' +
      noComments +

      '<!-- 回答フォーム -->' +
      '<div style="margin-top:1.5rem; border-top:1px solid var(--gray-200); padding-top:1.25rem;">' +
        '<h4 style="margin-bottom:.75rem;">✏️ コメント / ステータス変更</h4>' +
        '<div class="form-group">' +
          '<label>回答者 <span class="req">*</span></label>' +
          '<div class="user-selector">' +
            '<img class="selected-avatar" id="responderAvatar" src="" onerror="avatarFallback(this)" />' +
            '<select class="form-control" id="responderId"></select>' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label>コメント <span class="req">*</span></label>' +
          '<textarea class="form-control" id="commentText" rows="3" placeholder="回答やコメントを入力"></textarea>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:.5rem;">' +
          '<button class="btn btn-primary btn-sm" onclick="addComment(' + t.id + ', null)">💬 コメント送信</button>' +
          '<button class="btn btn-warning btn-sm" onclick="addComment(' + t.id + ', \'progress\')">🔄 進行中にする</button>' +
          '<button class="btn btn-success btn-sm" onclick="addComment(' + t.id + ', \'closed\')">✅ 解決（クローズ）</button>' +
          '<button class="btn btn-danger btn-sm"  onclick="addComment(' + t.id + ', \'rejected\')">🚫 却下</button>' +
        '</div>' +
      '</div>';

    // 回答者セレクト初期化
    populateUserSelect(document.getElementById("responderId"), "回答者を選択");
    var respSelect = document.getElementById("responderId");
    var respAvatar = document.getElementById("responderAvatar");
    respSelect.addEventListener("change", function () {
      var u = findUser(respSelect.value);
      if (u) { respAvatar.src = u.avatar; respAvatar.classList.add("show"); }
      else { respAvatar.classList.remove("show"); }
    });

    document.getElementById("detailModal").classList.add("show");
  };

  window.closeModal = function () {
    document.getElementById("detailModal").classList.remove("show");
    render();
  };

  window.addComment = function (ticketId, newStatus) {
    var respId = document.getElementById("responderId").value;
    var text   = document.getElementById("commentText").value.trim();
    if (!respId) { alert("回答者を選択してください"); return; }
    if (!text)   { alert("コメントを入力してください"); return; }

    var tickets = getTickets();
    var t = null;
    for (var i = 0; i < tickets.length; i++) {
      if (tickets[i].id === ticketId) { t = tickets[i]; break; }
    }
    if (!t) return;

    var comment = {
      id: Date.now(),
      userId: respId,
      text: text,
      createdAt: new Date().toISOString(),
      statusChange: newStatus || null
    };

    t.comments.push(comment);
    if (newStatus) t.status = newStatus;
    saveTickets(tickets);

    showToast(newStatus
      ? "ステータスを「" + statusLabel(newStatus) + "」に変更しました"
      : "コメントを送信しました");

    // モーダル再描画
    window.openDetail(ticketId);
  };
})();
