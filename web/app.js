const state = {
  activeArticleId: null,
  activeStage: "research",
  eventSource: null,
};

const els = {
  form: document.getElementById("create-form"),
  topic: document.getElementById("topic"),
  audience: document.getElementById("audience"),
  depth: document.getElementById("depth"),
  recentList: document.getElementById("recent-list"),
  eventLog: document.getElementById("event-log"),
  currentStatus: document.getElementById("current-status"),
  stageTabs: document.getElementById("stage-tabs"),
  stageContent: document.getElementById("stage-content"),
};

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function refreshRecentList() {
  const articles = await fetchJson("/articles");
  els.recentList.innerHTML = "";
  for (const article of articles.slice().reverse()) {
    const li = document.createElement("li");
    li.textContent = `${article.title ?? article.topic} (${article.status})`;
    li.className = article.id === state.activeArticleId ? "active" : "";
    li.addEventListener("click", () => watchArticle(article.id));
    els.recentList.appendChild(li);
  }
}

function appendEventLine(event) {
  const line = document.createElement("div");
  line.className = "event-line";
  line.textContent = `[${event.ts ?? ""}] ${event.type}${event.agent ? ` (${event.agent})` : ""}`;
  els.eventLog.appendChild(line);
  els.eventLog.scrollTop = els.eventLog.scrollHeight;
}

async function loadStage(stage) {
  if (!state.activeArticleId) return;
  state.activeStage = stage;
  for (const btn of els.stageTabs.querySelectorAll("button")) {
    btn.classList.toggle("active", btn.dataset.stage === stage);
  }
  try {
    const { artifact } = await fetchJson(`/articles/${state.activeArticleId}/artifact/${stage}`);
    els.stageContent.textContent = artifact ? JSON.stringify(artifact, null, 2) : "(not produced yet)";
  } catch (err) {
    els.stageContent.textContent = `Error loading ${stage}: ${err.message}`;
  }
}

function watchArticle(articleId) {
  state.activeArticleId = articleId;
  els.eventLog.innerHTML = "";
  els.currentStatus.textContent = "";

  if (state.eventSource) {
    state.eventSource.close();
  }

  const es = new EventSource(`/articles/${articleId}/events`);
  state.eventSource = es;

  es.onmessage = (e) => {
    const event = JSON.parse(e.data);
    appendEventLine(event);

    if (event.type === "StatusChanged") {
      els.currentStatus.textContent = event.to;
    }
    if (event.type === "ArtifactCreated" && event.artifact) {
      const stageKey = event.artifact.replace(/^reviews_/, "");
      if (stageKey === state.activeStage) loadStage(stageKey);
    }
    if (event.type === "Completed" || event.type === "Failed") {
      es.close();
      refreshRecentList();
    }
  };

  es.onerror = () => {
    // EventSource retries automatically; nothing to do here for v1.
  };

  loadStage(state.activeStage);
  refreshRecentList();
}

for (const btn of els.stageTabs.querySelectorAll("button")) {
  btn.addEventListener("click", () => loadStage(btn.dataset.stage));
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    topic: els.topic.value,
    audience: els.audience.value,
    depth: els.depth.value,
  };
  const { id } = await fetchJson("/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  els.topic.value = "";
  els.audience.value = "";
  watchArticle(id);
});

refreshRecentList();
