/* =====================================================
   チケット作成ページ
   ===================================================== */
(function () {
  // セレクト初期化
  populateUserSelect(document.getElementById("requesterId"), "投稿者を選択");

  const catSelect = document.getElementById("category");
  CATEGORIES.forEach(c => {
    const o = document.createElement("option");
    o.value = c.value;
    o.textContent = c.label;
    catSelect.appendChild(o);
  });

  const priSelect = document.getElementById("priority");
  PRIORITIES.forEach(p => {
    const o = document.createElement("option");
    o.value = p.value;
    o.textContent = p.label;
    priSelect.appendChild(o);
  });

  // 投稿者アバタープレビュー
  const requesterSelect = document.getElementById("requesterId");
  const requesterAvatar = document.getElementById("requesterAvatar");
  requesterSelect.addEventListener("change", () => {
    const user = findUser(requesterSelect.value);
    if (user) {
      requesterAvatar.src = user.avatar;
      requesterAvatar.classList.add("show");
    } else {
      requesterAvatar.classList.remove("show");
    }
  });

  // 発生日デフォルト（今日）
  document.getElementById("occurredDate").valueAsDate = new Date();

  // フォーム送信
  document.getElementById("ticketForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const ticket = {
      id: getNextId(),
      requesterId: requesterSelect.value,
      category: catSelect.value,
      priority: priSelect.value,
      occurredDate: document.getElementById("occurredDate").value,
      title: document.getElementById("title").value.trim(),
      description: document.getElementById("description").value.trim(),
      status: "open",
      createdAt: new Date().toISOString(),
      comments: [],
    };

    const tickets = getTickets();
    tickets.push(ticket);
    saveTickets(tickets);

    showToast("✅ チケット #" + ticket.id + " を作成しました");
    e.target.reset();
    requesterAvatar.classList.remove("show");
    document.getElementById("occurredDate").valueAsDate = new Date();
  });
})();
