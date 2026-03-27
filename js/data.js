/* =====================================================
   共有データ・ユーティリティ
   ===================================================== */

// ---------- ユーザーマスタ ----------
const USERS = [
  { id: "u1",  name: "佐藤 蓮",     dept: "営業部",     title: "主任",     avatar: "images/user1.png"  },
  { id: "u2",  name: "鈴木 陽菜",   dept: "企画部",     title: "リーダー", avatar: "images/user2.png"  },
  { id: "u3",  name: "高橋 翔太",   dept: "開発部",     title: "エンジニア", avatar: "images/user3.png" },
  { id: "u4",  name: "田中 美咲",   dept: "人事部",     title: "担当",     avatar: "images/user4.png"  },
  { id: "u5",  name: "伊藤 大翔",   dept: "経理部",     title: "係長",     avatar: "images/user5.png"  },
  { id: "u6",  name: "渡辺 凛",     dept: "総務部",     title: "主任",     avatar: "images/user6.png"  },
  { id: "u7",  name: "山本 悠人",   dept: "開発部",     title: "マネージャー", avatar: "images/user7.png" },
  { id: "u8",  name: "中村 さくら", dept: "広報部",     title: "担当",     avatar: "images/user8.png"  },
  { id: "u9",  name: "小林 湊",     dept: "情報システム部", title: "リーダー", avatar: "images/user9.png" },
  { id: "u10", name: "加藤 結衣",   dept: "経営企画部", title: "課長",     avatar: "images/user10.png" },
];

// ---------- 定数 ----------
const CATEGORIES = [
  { value: "tech",       label: "技術" },
  { value: "accounting", label: "経理" },
  { value: "general",    label: "総務" },
  { value: "other",      label: "その他" },
];

const PRIORITIES = [
  { value: "high",   label: "高" },
  { value: "medium", label: "中" },
  { value: "low",    label: "低" },
];

const STATUSES = [
  { value: "open",     label: "未対応" },
  { value: "progress", label: "進行中" },
  { value: "closed",   label: "解決" },
  { value: "rejected", label: "却下" },
];

// ---------- LocalStorage ヘルパー ----------
function getTickets() {
  return JSON.parse(localStorage.getItem("tickets") || "[]");
}

function saveTickets(tickets) {
  localStorage.setItem("tickets", JSON.stringify(tickets));
}

function getNextId() {
  const tickets = getTickets();
  if (tickets.length === 0) return 1;
  return Math.max(...tickets.map(t => t.id)) + 1;
}

function findUser(userId) {
  return USERS.find(u => u.id === userId) || null;
}

function categoryLabel(val) {
  return (CATEGORIES.find(c => c.value === val) || {}).label || val;
}

function priorityLabel(val) {
  return (PRIORITIES.find(p => p.value === val) || {}).label || val;
}

function statusLabel(val) {
  return (STATUSES.find(s => s.value === val) || {}).label || val;
}

function categoryBadgeClass(val) {
  const map = { tech: "badge-tech", accounting: "badge-accounting", general: "badge-general", other: "badge-other" };
  return map[val] || "badge-other";
}

function priorityBadgeClass(val) {
  const map = { high: "badge-high", medium: "badge-medium", low: "badge-low" };
  return map[val] || "";
}

function statusBadgeClass(val) {
  const map = { open: "badge-open", progress: "badge-progress", closed: "badge-closed", rejected: "badge-rejected" };
  return map[val] || "";
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("ja-JP", { year:"numeric", month:"2-digit", day:"2-digit" })
    + " " + d.toLocaleTimeString("ja-JP", { hour:"2-digit", minute:"2-digit" });
}

function showToast(msg) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ユーザー選択用 <option> 生成
function populateUserSelect(selectEl, placeholder) {
  selectEl.innerHTML = `<option value="">${placeholder || "選択してください"}</option>`;
  USERS.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = `${u.name}（${u.dept} / ${u.title}）`;
    selectEl.appendChild(opt);
  });
}

// アバター画像のフォールバック
function avatarFallback(img) {
  img.onerror = null;
  img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23d1d5db'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='%236b7280'%3E👤%3C/text%3E%3C/svg%3E";
}
