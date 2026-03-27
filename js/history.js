/* =====================================================
   履歴ページ
   ===================================================== */
(function () {
  // フィルタ初期化
  const fStatus  = document.getElementById("hFilterStatus");
  const fCat     = document.getElementById("hFilterCategory");
  const fReq     = document.getElementById("hFilterRequester");
  const fKey     = document.getElementById("hFilterKeyword");
  const listEl   = document.getElementById("historyList");
  const statsRow = document.getElementById("statsRow");

  STATUSES.forEach(s => {
    const o = document.createElement("option");
    o.value = s.value; o.textContent = s.label;
    fStatus.appendChild(o);
  });
  CATEGORIES.forEach(c => {
    const o = document.createElement("option");
    o.value = c.value; o.textContent = c.label;
    fCat.appendChild(o);
  });
  USERS.forEach(u => {
    const o = document.createElement("option");
    o.value = u.id;
    o.textContent = `${u.name}（${u.dept}）`;
    fReq.appendChild(o);
  });

  function render() {
    const tickets = getTickets();

    // 統計
    const total    = tickets.length;
    const open     = tickets.filter(t => t.status === "open").length;
    const progress = tickets.filter(t => t.status === "progress").length;
    const closed   = tickets.filter(t => t.status === "closed").length;
    const rejected = tickets.filter(t => t.status === "rejected").length;

    statsRow.innerHTML = `
      <div class="stat-card"><div class="number">${total}</div><div class="label">全チケット</div></div>
      <div class="stat-card"><div class="number">${open}</div><div class="label">未対応</div></div>
      <div class="stat-card yellow"><div class="number">${progress}</div><div class="label">進行中</div></div>
      <div class="stat-card green"><div class="number">${closed}</div><div class="label">解決</div></div>
      <div class="stat-card red"><div class="number">${rejected}</div><div class="label">却下</div></div>
    `;

    // フィルタ
    const sStatus = fStatus.value;
    const sCat    = fCat.value;
    const sReq    = fReq.value;
    const sKey    = fKey.value.trim().toLowerCase();

    const filtered = tickets.filter(t => {
      if (sStatus && t.status !== sStatus) return false;
      if (sCat && t.category !== sCat) return false;
      if (sReq && t.requesterId !== sReq) return false;
      if (sKey) {
        const haystack = (t.title + t.description + (findUser(t.requesterId)?.name || "")).toLowerCase();
        if (!haystack.includes(sKey)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="icon">📭</div>
          <p>チケットがありません</p>
        </div>`;
      return;
    }

    listEl.innerHTML = filtered
      .sort((a, b) => b.id - a.id)
      .map(t => {
        const user = findUser(t.requesterId);
        return `
        <div class="ticket-item status-${t.status}" onclick="openHistoryDetail(${t.id})">
          <div class="ticket-id">#${String(t.id).padStart(4,"0")}</div>
          <div class="ticket-info">
            <h4>${escHtml(t.title)}</h4>
            <div class="ticket-meta">
              <span class="badge ${categoryBadgeClass(t.category)}">${categoryLabel(t.category)}</span>
              <span class="badge ${priorityBadgeClass(t.priority)}">${priorityLabel(t.priority)}</span>
              <span class="badge ${statusBadgeClass(t.status)}">${statusLabel(t.status)}</span>
              <span>📅 ${formatDate(t.occurredDate)}</span>
              <span>👤 ${user ? escHtml(user.name) : '不明'}</span>
              <span>💬 ${t.comments.length}</span>
            </div>
          </div>
        </div>`;
      }).join("");
  }

  [fStatus, fCat, fReq].forEach(el => el.addEventListener("change", render));
  fKey.addEventListener("input", render);
  render();

  // ========== 読み取り専用モーダル ==========
  window.openHistoryDetail = function (ticketId) {
    const tickets = getTickets();
    const t = tickets.find(x => x.id === ticketId);
    if (!t) return;

    const user = findUser(t.requesterId);
    const body = document.getElementById("hModalBody");
    document.getElementById("hModalTitle").textContent = `#${String(t.id).padStart(4,"0")} ${t.title}`;

    body.innerHTML = `
      <div class="detail-requester">
        <img src="${user?.avatar || ''}" onerror="avatarFallback(this)" />
        <div class="info">
          <div class="name">${user ? escHtml(user.name) : '不明'}</div>
          <div class="dept">${user ? escHtml(user.dept + ' / ' + user.title) : ''}</div>
        </div>
        <span style="margin-left:auto;font-size:.8rem;color:var(--gray-400)">作成: ${formatDateTime(t.createdAt)}</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <label>カテゴリ</label>
          <div class="value"><span class="badge ${categoryBadgeClass(t.category)}">${categoryLabel(t.category)}</span></div>
        </div>
        <div class="detail-item">
          <label>優先度</label>
          <div class="value"><span class="badge ${priorityBadgeClass(t.priority)}">${priorityLabel(t.priority)}</span></div>
        </div>
        <div class="detail-item">
          <label>発生日</label>
          <div class="value">${formatDate(t.occurredDate)}</div>
        </div>
        <div class="detail-item">
          <label>ステータス</label>
          <div class="value"><span class="badge ${statusBadgeClass(t.status)}">${statusLabel(t.status)}</span></div>
        </div>
      </div>
      <div class="detail-description">${escHtml(t.description)}</div>
      <h4 style="margin-bottom:.75rem;">💬 コメント履歴 (${t.comments.length})</h4>
      <div class="comment-thread">
        ${t.comments.length === 0
          ? '<p style="color:var(--gray-400);font-size:.85rem;">コメントなし</p>'
          : t.comments.map(c => {
              const u = findUser(c.userId);
              let statusTag = "";
              if (c.statusChange) {
                statusTag = ` <span class="badge ${statusBadgeClass(c.statusChange)}">${statusLabel(c.statusChange)}に変更</span>`;
              }
              return `
              <div class="comment is-responder">
                <img class="comment-avatar" src="${u?.avatar || ''}" onerror="avatarFallback(this)" />
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">${u ? escHtml(u.name) : '不明'}</span>
                    <span class="comment-dept">${u ? escHtml(u.dept + ' / ' + u.title) : ''}</span>
                    ${statusTag}
                    <span class="comment-date">${formatDateTime(c.createdAt)}</span>
                  </div>
                  <div class="comment-body">${escHtml(c.text)}</div>
                </div>
              </div>`;
            }).join("")}
      </div>
    `;

    document.getElementById("historyModal").classList.add("show");
  };

  window.closeHistoryModal = function () {
    document.getElementById("historyModal").classList.remove("show");
  };

  // escHtml が未定義の場合のフォールバック
  if (typeof window.escHtml === "undefined") {
    window.escHtml = function (str) {
      const d = document.createElement("div");
      d.textContent = str || "";
      return d.innerHTML;
    };
  }
})();
