/* =====================================================
   チケット作成ページ
   ===================================================== */
(function () {
  "use strict";

  // セレクト初期化
  populateUserSelect(document.getElementById("requesterId"), "投稿者を選択");

  var catSelect = document.getElementById("category");
  for (var i = 0; i < CATEGORIES.length; i++) {
    var o = document.createElement("option");
    o.value = CATEGORIES[i].value;
    o.textContent = CATEGORIES[i].label;
    catSelect.appendChild(o);
  }

  var priSelect = document.getElementById("priority");
  for (var j = 0; j < PRIORITIES.length; j++) {
    var p = document.createElement("option");
    p.value = PRIORITIES[j].value;
    p.textContent = PRIORITIES[j].label;
    priSelect.appendChild(p);
  }

  // 投稿者アバタープレビュー
  var requesterSelect = document.getElementById("requesterId");
  var requesterAvatar = document.getElementById("requesterAvatar");
  requesterSelect.addEventListener("change", function () {
    var user = findUser(requesterSelect.value);
    if (user) {
      requesterAvatar.src = user.avatar;
      requesterAvatar.classList.add("show");
    } else {
      requesterAvatar.classList.remove("show");
    }
  });

  // 発生日デフォルト（今日）
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = ("0" + (today.getMonth() + 1)).slice(-2);
  var dd = ("0" + today.getDate()).slice(-2);
  document.getElementById("occurredDate").value = yyyy + "-" + mm + "-" + dd;

  // フォーム送信
  document.getElementById("ticketForm").addEventListener("submit", function (e) {
    e.preventDefault();

    var ticket = {
      id: getNextId(),
      requesterId: requesterSelect.value,
      category: catSelect.value,
      priority: priSelect.value,
      occurredDate: document.getElementById("occurredDate").value,
      title: document.getElementById("title").value.trim(),
      description: document.getElementById("description").value.trim(),
      status: "open",
      createdAt: new Date().toISOString(),
      comments: []
    };

    var tickets = getTickets();
    tickets.push(ticket);
    saveTickets(tickets);

    showToast("✅ チケット #" + ticket.id + " を作成しました");

    // デバッグ: 保存確認
    console.log("Saved tickets:", getTickets());

    e.target.reset();
    requesterAvatar.classList.remove("show");
    document.getElementById("occurredDate").value = yyyy + "-" + mm + "-" + dd;
  });
})();
