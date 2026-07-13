const els = {
  list: document.getElementById("article-list"),
  search: document.getElementById("article-search"),
  filters: document.getElementById("status-filters"),
  dialog: document.getElementById("create-dialog"),
  newButton: document.getElementById("new-article-btn"),
  closeDialog: document.getElementById("close-dialog"),
  cancelCreate: document.getElementById("cancel-create"),
  form: document.getElementById("create-form"),
  idea: document.getElementById("idea"),
  audience: document.getElementById("audience"),
  contentType: document.getElementById("content-type"),
  depth: document.getElementById("depth"),
  submit: document.getElementById("create-submit"),
  error: document.getElementById("create-error"),
};

const state = { articles: [], filter: "all", query: "" };

const STATUS_LABELS = {
  AwaitingDraftReview: "Needs review",
  TechnicalReview: "Technical review",
  EditorialReview: "Editorial review",
  SEOReview: "SEO review",
};

function statusGroup(status) {
  if (status === "AwaitingDraftReview" || status === "Rejected") return "review";
  if (status === "Published") return "published";
  return "active";
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(value));
}

function renderArticles() {
  const filtered = state.articles
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .filter((article) => state.filter === "all" || statusGroup(article.status) === state.filter)
    .filter((article) => `${article.title ?? ""} ${article.topic}`.toLowerCase().includes(state.query));

  els.list.innerHTML = "";
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<span class="empty-icon">✦</span><strong>No articles here</strong><p>${state.articles.length ? "Try another search or filter." : "Create your first assignment to begin."}</p>`;
    els.list.appendChild(empty);
    return;
  }

  for (const article of filtered) {
    const row = document.createElement("a");
    const group = statusGroup(article.status);
    row.className = "article-row";
    row.href = `/article.html?id=${encodeURIComponent(article.id)}`;
    row.innerHTML = `
      <span class="article-row-main">
        <strong></strong>
        <small></small>
      </span>
      <span class="article-row-type"></span>
      <span class="status-pill status-${group}"><i></i>${STATUS_LABELS[article.status] ?? article.status}</span>
      <time>${formatDate(article.updatedAt)}</time>
      <span class="row-arrow">›</span>`;
    row.querySelector("strong").textContent = article.title ?? article.topic;
    row.querySelector("small").textContent = article.title ? article.topic : "Title pending";
    row.querySelector(".article-row-type").textContent = CONTENT_TYPE_LABELS[article.contentType] ?? article.contentType;
    els.list.appendChild(row);
  }
}

async function refreshArticles() {
  try {
    state.articles = await fetchJson("/articles");
    renderArticles();
  } catch (error) {
    els.list.innerHTML = `<div class="empty-state"><strong>Could not load articles</strong><p>${error.message}</p></div>`;
  }
}

function closeCreateDialog() {
  els.dialog.close();
  els.error.classList.add("hidden");
}

els.newButton.addEventListener("click", () => els.dialog.showModal());
els.closeDialog.addEventListener("click", closeCreateDialog);
els.cancelCreate.addEventListener("click", closeCreateDialog);
els.dialog.addEventListener("click", (event) => {
  if (event.target === els.dialog) closeCreateDialog();
});

els.search.addEventListener("input", () => {
  state.query = els.search.value.trim().toLowerCase();
  renderArticles();
});

els.filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  for (const item of els.filters.querySelectorAll("button")) item.classList.toggle("active", item === button);
  renderArticles();
});

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.submit.disabled = true;
  els.submit.textContent = "Creating…";
  els.error.classList.add("hidden");
  try {
    const { id } = await fetchJson("/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: els.idea.value.trim(),
        audience: els.audience.value.trim(),
        contentType: els.contentType.value,
        depth: els.depth.value,
      }),
    });
    window.location.href = `/article.html?id=${encodeURIComponent(id)}`;
  } catch (error) {
    els.error.textContent = error.message;
    els.error.classList.remove("hidden");
  } finally {
    els.submit.disabled = false;
    els.submit.textContent = "Create article";
  }
});

refreshArticles();
