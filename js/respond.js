/* =====================================================
   対応・回答ページ
   ===================================================== */
(function () {
  // フィルタ初期化
  const fCat = document.getElementById("filterCategory");
  CATEGORIES.forEach(c => {
    const o = document.createElement("option");
    o.value = c.value;
    o.textContent = c.label;
    fCat.appendChild(o);
  });

  const fPri = document.getElementById("filterPriority");
  PRIORITIES.forEach(p => {
    const o = document.createElement("option");
    o.value = p.value;
    o.textContent = p.label;
    fPri.appendChild(o);
  });

  const fStatus   = document.getElementById("filterStatus");
  const fKeyword  = document.getElementById("filterKeyword");
  const listEl    = document.getElementById("ticketList");

  function render() {
    const tickets  = getTickets();
    const sStatus  = fStatus.value;
    const sCat     = fCat.value;
    const sPri     = fPri.value;
    const sKey     = fKeyword.value.trim().toLowerCase();

    const filtered = tickets.filter(t => {
      if (sStatus && t.status !== sStatus) return false;
      if (sCat && t.category !== sCat) return false;
      if (sPri && t.priority !== sPri) return false;
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
          <p>該当するチケットがありません</p>
        </div>`;
      return;
    }

    listEl.innerHTML = filtered
      .sort((a, b) => b.id - a.id)
      .map(t => {
        const user = findUser(t.requesterId);
        return `
        <div class="ticket-item status-${t.status}" onclick="openDetail(${t.id})">
          <div class="ticket-id">#${String(t.id).padStart(4,"0")}</div>
          <div class="ticket-info">
            <h4>${escHtml(t.title)}</h4>
            <div class="ticket-meta">
              <span class="badge ${categoryBadgeClass(t.category)}">${categoryLabel(t.category)}</span>
              <span class="badge ${priorityBadgeClass(t.priority)}">${priorityLabel(t.priority)}</span>
              <span class="badge ${statusBadgeClass(t.status)}">${statusLabel(t.status)}</span>
              <span>📅 ${formatDate(t.occurredDate)}</span>
              <span>👤 ${user ? escHtml(user.name) : "不明"}</span>
              <span>💬 ${t.comments.length}</span>
            </div>
          </div>
          <div class="ticket-actions">
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openDetail(${t.id})">詳細</button>
          </div>
        </div>`;
      }).join("");
  }

  // フィルタイベント
  [fStatus, fCat, fPri].forEach(el => el.addEventListener("change", render));
  fKeyword.addEventListener("input", render);

  // 初回描画
  render();

  // ========== モーダル ==========
  window.openDetail = function (ticketId) {
    const tickets = getTickets();
    const t = tickets.find(x => x.id === ticketId);
    if (!t) return;

    const user = findUser(t.requesterId);
    const body = document.getElementById("modalBody");
    document.getElementById("modalTitle").textContent = `#${String(t.id).padStart(4,"0")} ${t.title}`;

    body.innerHTML = `
      <!-- 投稿者 -->
      <div class="detail-requester">
        <img src="${user?.avatar || ''}" onerror="avatarFallback(this)" />
        <div class="info">
          <div class="name">${user ? escHtml(user.name) : "不明"}</div>
          <div class="dept">${user ? escHtml(user.dept + " / " + user.title) : ""}</div>
        </div>
        <span style="margin-left:auto;font-size:.8rem;color:var(--gray-400)">作成: ${formatDateTime(t.createdAt)}</span>
      </div>

      <!-- 詳細グリッド -->
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

      <!-- 説明 -->
      <div class="detail-description">${escHtml(t.description)}</div>

      <!-- コメントスレッド -->
      <h4 style="margin-bottom:.75rem;">💬 コメント (${t.comments.length})</h4>
      <div class="comment-thread" id="commentThread">
        ${t.comments.map(c => renderComment(c)).join("")}
      </div>
      ${t.comments.length === 0 ? '<p style="color:var(--gray-400);font-size:.85rem;margin-top:.5rem;">まだコメントはありません</p>' : ''}

      <!-- 回答フォーム -->
      <div style="margin-top:1.5rem; border-top:1px solid var(--gray-200); padding-top:1.25rem;">
        <h4 style="margin-bottom:.75rem;">✏️ コメント / ステータス変更</h4>
        <div class="form-group">
          <label>回答者 <span class="req">*</span></label>
          <div class="user-selector">
            <img class="selected-avatar" id="responderAvatar" src="" onerror="avatarFallback(this)" />
            <select class="form-control" id="responderId"></select>
          </div>
        </div>
        <div class="form-group">
          <label>コメント <span class="req">*</span></label>
          <textarea class="form-control" id="commentText" rows="3" placeholder="回答やコメントを入力"></textarea>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;">
          <button class="btn btn-primary btn-sm" onclick="addComment(${t.id}, null)">💬 コメント送信</button>
          <button class="btn btn-warning btn-sm" onclick="addComment(${t.id}, 'progress')">🔄 進行中にする</button>
          <button class="btn btn-success btn-sm" onclick="addComment(${t.id}, 'closed')">✅ 解決（クローズ）</button>
          <button class="btn btn-danger btn-sm"  onclick="addComment(${t.id}, 'rejected')">🚫 却下</button>
        </div>
      </div>
    `;

    // 回答者セレクト初期化
    populateUserSelect(document.getElementById("responderId"), "回答者を選択");
    const respSelect = document.getElementById("responderId");
    const respAvatar = document.getElementById("responderAvatar");
    respSelect.addEventListener("change", () => {
      const u = findUser(respSelect.value);
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
    const respId = document.getElementById("responderId").value;
    const text   = document.getElementById("commentText").value.trim();
    if (!respId) { alert("回答者を選択してください"); return; }
    if (!text)   { alert("コメントを入力してください"); return; }

    const tickets = getTickets();
    const t = tickets.find(x => x.id === ticketId);
    if (!t) return;

    const comment = {
      id: Date.now(),
      userId: respId,
      text: text,
      createdAt: new Date().toISOString(),
      statusChange: newStatus || null,
    };

    t.comments.push(comment);
    if (newStatus) t.status = newStatus;
    saveTickets(tickets);

    showToast(newStatus
      ? `ステータスを「${statusLabel(newStatus)}」に変更しました`
      : "コメントを送信しました");

    // モーダル再描画
    openDetail(ticketId);
  };

  function renderComment(c) {
    const u = findUser(c.userId);
    const isResp = true; // コメントは全て回答エリアに表示
    let statusTag = "";
    if (c.statusChange) {
      statusTag = ` <span class="badge ${statusBadgeClass(c.statusChange)}">${statusLabel(c.statusChange)}に変更</span>`;
    }
    return `
      <div class="comment ${isResp ? 'is-responder' : ''}">
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
  }

  // HTML エスケープ
  window.escHtml = function (str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  };
})();
