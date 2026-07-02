const els = {
  form: document.getElementById("create-form"),
  idea: document.getElementById("idea"),
  audience: document.getElementById("audience"),
  contentType: document.getElementById("content-type"),
  depth: document.getElementById("depth"),
  recentList: document.getElementById("recent-list"),
};

async function refreshRecentList() {
  const articles = await fetchJson("/articles");
  els.recentList.innerHTML = "";
  for (const article of articles.slice().reverse()) {
    const li = document.createElement("li");
    const typeLabel = CONTENT_TYPE_LABELS[article.contentType] ?? article.contentType;
    li.textContent = `${article.title ?? article.topic} (${typeLabel}, ${article.status})`;
    li.addEventListener("click", () => {
      window.location.href = `/article.html?id=${encodeURIComponent(article.id)}`;
    });
    els.recentList.appendChild(li);
  }
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    topic: els.idea.value,
    audience: els.audience.value,
    contentType: els.contentType.value,
    depth: els.depth.value,
  };
  const { id } = await fetchJson("/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  window.location.href = `/article.html?id=${encodeURIComponent(id)}`;
});

refreshRecentList();
