const params = new URLSearchParams(window.location.search);
const articleId = params.get("id");

const state = {
  activeStage: "research",
  activeArtifact: null,
  viewMode: "preview",
};

const els = {
  title: document.getElementById("article-title"),
  audience: document.getElementById("article-audience"),
  contentType: document.getElementById("article-content-type"),
  currentStatus: document.getElementById("current-status"),
  retryBtn: document.getElementById("retry-btn"),
  eventLog: document.getElementById("event-log"),
  stageTabs: document.getElementById("stage-tabs"),
  viewToggle: document.getElementById("view-toggle"),
  stageContent: document.getElementById("stage-content"),
};

let eventSource = null;

if (!articleId) {
  els.title.textContent = "No article selected";
} else {
  loadArticleHeader();
  watchArticle();
  loadStage(state.activeStage);
}

async function loadArticleHeader() {
  try {
    const article = await fetchJson(`/articles/${articleId}`);
    els.title.textContent = article.title ?? article.topic;
    els.audience.textContent = article.audience;
    els.contentType.textContent = CONTENT_TYPE_LABELS[article.contentType] ?? article.contentType;
    els.currentStatus.textContent = article.status;
    updateRetryVisibility(article.status);
  } catch (err) {
    els.title.textContent = `Error loading article: ${err.message}`;
  }
}

function updateRetryVisibility(status) {
  els.retryBtn.classList.toggle("hidden", status !== "Failed");
}

async function retryArticle() {
  els.retryBtn.disabled = true;
  els.retryBtn.textContent = "Retrying…";
  try {
    await fetchJson(`/articles/${articleId}/retry`, { method: "POST" });
    els.eventLog.innerHTML = "";
    watchArticle();
    await loadArticleHeader();
  } catch (err) {
    appendEventLine({ type: `Retry failed: ${err.message}` });
  } finally {
    els.retryBtn.disabled = false;
    els.retryBtn.textContent = "Retry";
  }
}

function appendEventLine(event) {
  const line = document.createElement("div");
  line.className = "event-line";
  line.textContent = `[${event.ts ?? ""}] ${event.type}${event.agent ? ` (${event.agent})` : ""}`;
  els.eventLog.appendChild(line);
  els.eventLog.scrollTop = els.eventLog.scrollHeight;
}

const MARKDOWN_STAGE = "metadata";

async function loadStage(stage) {
  if (!articleId) return;
  state.activeStage = stage;
  for (const btn of els.stageTabs.querySelectorAll("button")) {
    btn.classList.toggle("active", btn.dataset.stage === stage);
  }
  try {
    const { artifact } = await fetchJson(`/articles/${articleId}/artifact/${stage}`);
    state.activeArtifact = artifact;
    renderStageContent();
  } catch (err) {
    state.activeArtifact = null;
    els.stageContent.textContent = `Error loading ${stage}: ${err.message}`;
  }
}

function renderStageContent() {
  const artifact = state.activeArtifact;
  const isMarkdownStage = state.activeStage === MARKDOWN_STAGE && !!artifact?.markdown;
  els.viewToggle.classList.toggle("hidden", !isMarkdownStage);
  for (const btn of els.viewToggle.querySelectorAll("button")) {
    btn.classList.toggle("active", btn.dataset.view === state.viewMode);
  }

  if (!artifact) {
    els.stageContent.textContent = "(not produced yet)";
    return;
  }

  if (isMarkdownStage && state.viewMode === "preview") {
    const html = window.DOMPurify.sanitize(window.marked.parse(artifact.markdown));
    els.stageContent.innerHTML = `<div class="markdown-preview">${html}</div>`;
  } else {
    els.stageContent.textContent = JSON.stringify(artifact, null, 2);
  }
}

function watchArticle() {
  if (!articleId) return;
  if (eventSource) eventSource.close();
  eventSource = new EventSource(`/articles/${articleId}/events`);

  eventSource.onmessage = (e) => {
    const event = JSON.parse(e.data);
    appendEventLine(event);

    if (event.type === "StatusChanged") {
      els.currentStatus.textContent = event.to;
      updateRetryVisibility(event.to);
    }
    if (event.type === "ArtifactCreated" && event.artifact) {
      const stageKey = event.artifact.replace(/^reviews_/, "");
      if (stageKey === state.activeStage) loadStage(stageKey);
    }
    if (event.type === "Completed" || event.type === "Failed") {
      eventSource.close();
      loadArticleHeader();
    }
  };

  eventSource.onerror = () => {
    // EventSource retries automatically; nothing to do here for v1.
  };
}

for (const btn of els.stageTabs.querySelectorAll("button")) {
  btn.addEventListener("click", () => loadStage(btn.dataset.stage));
}

for (const btn of els.viewToggle.querySelectorAll("button")) {
  btn.addEventListener("click", () => {
    state.viewMode = btn.dataset.view;
    renderStageContent();
  });
}

els.retryBtn.addEventListener("click", retryArticle);
