/* =====================================================
   履歴ページ
   ===================================================== */
(function () {
  "use strict";

  var fStatus  = document.getElementById("hFilterStatus");
  var fCat     = document.getElementById("hFilterCategory");
  var fReq     = document.getElementById("hFilterRequester");
  var fKey     = document.getElementById("hFilterKeyword");
  var listEl   = document.getElementById("historyList");
  var statsRow = document.getElementById("statsRow");

  // フィルタ初期化
  for (var s = 0; s < STATUSES.length; s++) {
    var os = document.createElement("option");
    os.value = STATUSES[s].value;
    os.textContent = STATUSES[s].label;
    fStatus.appendChild(os);
  }
  for (var c = 0; c < CATEGORIES.length; c++) {
    var oc = document.createElement("option");
    oc.value = CATEGORIES[c].value;
    oc.textContent = CATEGORIES[c].label;
    fCat.appendChild(oc);
  }
  for (var u = 0; u < USERS.length; u++) {
    var ou = document.createElement("option");
    ou.value = USERS[u].id;
    ou.textContent = USERS[u].name + "（" + USERS[u].dept + "）";
    fReq.appendChild(ou);
  }

  function render() {
    var tickets = getTickets();

    // 統計
    var total = tickets.length;
    var open = 0, progress = 0, closed = 0, rejected = 0;
    for (var i = 0; i < tickets.length; i++) {
      if (tickets[i].status === "open") open++;
      else if (tickets[i].status === "progress") progress++;
      else if (tickets[i].status === "closed") closed++;
      else if (tickets[i].status === "rejected") rejected++;
    }

    statsRow.innerHTML =
      '<div class="stat-card"><div class="number">' + total + '</div><div class="label">全チケット</div></div>' +
      '<div class="stat-card"><div class="number">' + open + '</div><div class="label">未対応</div></div>' +
      '<div class="stat-card yellow"><div class="number">' + progress + '</div><div class="label">進行中</div></div>' +
      '<div class="stat-card green"><div class="number">' + closed + '</div><div class="label">解決</div></div>' +
      '<div class="stat-card red"><div class="number">' + rejected + '</div><div class="label">却下</div></div>';

    // フィルタ
    var sStatus = fStatus.value;
    var sCat    = fCat.value;
    var sReq    = fReq.value;
    var sKey    = fKey.value.trim().toLowerCase();

    var filtered = [];
    for (var j = 0; j < tickets.length; j++) {
      var t = tickets[j];
      if (sStatus && t.status !== sStatus) continue;
      if (sCat && t.category !== sCat) continue;
      if (sReq && t.requesterId !== sReq) continue;
      if (sKey) {
        var usr = findUser(t.requesterId);
        var haystack = (t.title + " " + t.description + " " + (usr ? usr.name : "")).toLowerCase();
        if (haystack.indexOf(sKey) === -1) continue;
      }
      filtered.push(t);
    }

    if (filtered.length === 0) {
      listEl.innerHTML =
        '<div class="empty-state">' +
        '<div class="icon">📭</div>' +
        '<p>チケットがありません</p>' +
        '</div>';
      return;
    }

    filtered.sort(function (a, b) { return b.id - a.id; });

    var html = "";
    for (var k = 0; k < filtered.length; k++) {
      var tk = filtered[k];
      var user = findUser(tk.requesterId);
      html +=
        '<div class="ticket-item status-' + tk.status + '" onclick="openHistoryDetail(' + tk.id + ')">' +
          '<div class="ticket-id">#' + String("0000" + tk.id).slice(-4) + '</div>' +
          '<div class="ticket-info">' +
            '<h4>' + escHtml(tk.title) + '</h4>' +
            '<div class="ticket-meta">' +
              '<span class="badge ' + categoryBadgeClass(tk.category) + '">' + categoryLabel(tk.category) + '</span>' +
              '<span class="badge ' + priorityBadgeClass(tk.priority) + '">' + priorityLabel(tk.priority) + '</span>' +
              '<span class="badge ' + statusBadgeClass(tk.status) + '">' + statusLabel(tk.status) + '</span>' +
              '<span>📅 ' + formatDate(tk.occurredDate) + '</span>' +
              '<span>👤 ' + (user ? escHtml(user.name) : "不明") + '</span>' +
              '<span>💬 ' + tk.comments.length + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    }
    listEl.innerHTML = html;
  }

  fStatus.addEventListener("change", render);
  fCat.addEventListener("change", render);
  fReq.addEventListener("change", render);
  fKey.addEventListener("input", render);
  render();

  // ---------- 読み取り専用モーダル ----------
  window.openHistoryDetail = function (ticketId) {
    var tickets = getTickets();
    var t = null;
    for (var i = 0; i < tickets.length; i++) {
      if (tickets[i].id === ticketId) { t = tickets[i]; break; }
    }
    if (!t) return;

    var user = findUser(t.requesterId);
    var body = document.getElementById("hModalBody");
    document.getElementById("hModalTitle").textContent = "#" + String("0000" + t.id).slice(-4) + " " + t.title;

    var commentsHtml = "";
    if (t.comments.length === 0) {
      commentsHtml = '<p style="color:var(--gray-400);font-size:.85rem;">コメントなし</p>';
    } else {
      for (var c = 0; c < t.comments.length; c++) {
        var cm = t.comments[c];
        var cu = findUser(cm.userId);
        var statusTag = "";
        if (cm.statusChange) {
          statusTag = ' <span class="badge ' + statusBadgeClass(cm.statusChange) + '">' + statusLabel(cm.statusChange) + 'に変更</span>';
        }
        commentsHtml +=
          '<div class="comment is-responder">' +
            '<img class="comment-avatar" src="' + (cu ? cu.avatar : '') + '" onerror="avatarFallback(this)" />' +
            '<div class="comment-content">' +
              '<div class="comment-header">' +
                '<span class="comment-author">' + (cu ? escHtml(cu.name) : "不明") + '</span>' +
                '<span class="comment-dept">' + (cu ? escHtml(cu.dept + " / " + cu.title) : "") + '</span>' +
                statusTag +
                '<span class="comment-date">' + formatDateTime(cm.createdAt) + '</span>' +
              '</div>' +
              '<div class="comment-body">' + escHtml(cm.text) + '</div>' +
            '</div>' +
          '</div>';
      }
    }

    body.innerHTML =
      '<div class="detail-requester">' +
        '<img src="' + (user ? user.avatar : '') + '" onerror="avatarFallback(this)" />' +
        '<div class="info">' +
          '<div class="name">' + (user ? escHtml(user.name) : "不明") + '</div>' +
          '<div class="dept">' + (user ? escHtml(user.dept + " / " + user.title) : "") + '</div>' +
        '</div>' +
        '<span style="margin-left:auto;font-size:.8rem;color:var(--gray-400)">作成: ' + formatDateTime(t.createdAt) + '</span>' +
      '</div>' +
      '<div class="detail-grid">' +
        '<div class="detail-item"><label>カテゴリ</label><div class="value"><span class="badge ' + categoryBadgeClass(t.category) + '">' + categoryLabel(t.category) + '</span></div></div>' +
        '<div class="detail-item"><label>優先度</label><div class="value"><span class="badge ' + priorityBadgeClass(t.priority) + '">' + priorityLabel(t.priority) + '</span></div></div>' +
        '<div class="detail-item"><label>発生日</label><div class="value">' + formatDate(t.occurredDate) + '</div></div>' +
        '<div class="detail-item"><label>ステータス</label><div class="value"><span class="badge ' + statusBadgeClass(t.status) + '">' + statusLabel(t.status) + '</span></div></div>' +
      '</div>' +
      '<div class="detail-description">' + escHtml(t.description) + '</div>' +
      '<h4 style="margin-bottom:.75rem;">💬 コメント履歴 (' + t.comments.length + ')</h4>' +
      '<div class="comment-thread">' + commentsHtml + '</div>';

    document.getElementById("historyModal").classList.add("show");
  };

  window.closeHistoryModal = function () {
    document.getElementById("historyModal").classList.remove("show");
  };
})();
