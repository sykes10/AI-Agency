const articleId = new URLSearchParams(window.location.search).get("id");

const STAGES = [
  ["research", "Research", "Sources and grounding"],
  ["outline", "Outline", "Structure and angle"],
  ["draft", "Draft", "Your review"],
  ["technical", "Technical review", "Accuracy findings"],
  ["editorial", "Editorial review", "Writing feedback"],
  ["revised-draft", "Revised Draft", "Applied resolutions"],
  ["seo", "SEO", "Discovery metadata"],
  ["metadata", "Published", "Final article"],
];

const STATUS_STAGE = {
  Queued: "research", Researching: "research", Planning: "outline", Writing: "draft",
  AwaitingDraftReview: "draft", Rejected: "draft", TechnicalReview: "technical",
  EditorialReview: "editorial", Revising: "revised-draft", SEOReview: "seo",
  Ready: "metadata", Published: "metadata",
};

const STATUS_LABELS = {
  AwaitingDraftReview: "Needs your review", TechnicalReview: "Technical review",
  EditorialReview: "Editorial review", SEOReview: "SEO review", Rejected: "Rejected",
};

const state = { article: null, activeStage: "research", activeArtifact: null, viewMode: "preview" };
let eventSource = null;
const els = {
  title: document.getElementById("article-title"), topic: document.getElementById("article-topic"),
  audience: document.getElementById("article-audience"), contentType: document.getElementById("article-content-type"),
  status: document.getElementById("current-status"), nav: document.getElementById("stage-nav"),
  stageContent: document.getElementById("stage-content"), artifactTitle: document.getElementById("artifact-title"),
  artifactKicker: document.getElementById("artifact-kicker"), iterationBadge: document.getElementById("iteration-badge"),
  viewToggle: document.getElementById("view-toggle"), retry: document.getElementById("retry-btn"),
  reviewBanner: document.getElementById("review-banner"), reviewHeading: document.getElementById("review-heading"),
  reviewCopy: document.getElementById("review-copy"), feedback: document.getElementById("review-feedback"),
  reviewError: document.getElementById("review-error"), approve: document.getElementById("approve-btn"),
  reject: document.getElementById("reject-btn"), iterate: document.getElementById("iterate-btn"),
  activityToggle: document.getElementById("activity-toggle"), activityClose: document.getElementById("activity-close"),
  activityDrawer: document.getElementById("activity-drawer"), eventLog: document.getElementById("event-log"),
};

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value ?? "";
  return element.innerHTML;
}

function markdown(value) {
  return window.DOMPurify.sanitize(window.marked.parse(value ?? ""));
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function statusGroup(status) {
  if (status === "AwaitingDraftReview" || status === "Rejected") return "review";
  if (status === "Published") return "published";
  if (status === "Failed") return "failed";
  return "active";
}

function artifactExists(stage) {
  const article = state.article;
  return Boolean({
    research: article.research, outline: article.outline, draft: article.draft,
    technical: article.reviews?.technical, editorial: article.reviews?.editorial,
    "revised-draft": article.revisedDraft, seo: article.seo, metadata: article.metadata,
  }[stage]);
}

function renderNavigation() {
  const currentIndex = STAGES.findIndex(([key]) => key === STATUS_STAGE[state.article.status]);
  els.nav.innerHTML = "";
  STAGES.forEach(([key, label, description], index) => {
    const button = document.createElement("button");
    const exists = artifactExists(key);
    button.className = `stage-item ${key === state.activeStage ? "active" : ""} ${exists ? "complete" : ""}`;
    button.disabled = !exists && key !== STATUS_STAGE[state.article.status];
    button.innerHTML = `<span class="stage-marker">${exists ? "✓" : index === currentIndex ? "•" : index + 1}</span><span><strong>${label}</strong><small>${description}</small></span>`;
    button.addEventListener("click", () => loadStage(key));
    els.nav.appendChild(button);
  });
}

function renderHeader() {
  const article = state.article;
  els.title.textContent = article.title ?? "Untitled article";
  els.topic.textContent = article.title ? article.topic : "The title will appear after planning.";
  els.audience.textContent = article.audience;
  els.contentType.textContent = CONTENT_TYPE_LABELS[article.contentType] ?? article.contentType;
  const group = statusGroup(article.status);
  els.status.className = `status-pill status-${group}`;
  els.status.innerHTML = `<i></i>${STATUS_LABELS[article.status] ?? article.status}`;
  els.retry.classList.toggle("hidden", article.status !== "Failed");

  const reviewable = article.status === "AwaitingDraftReview" || article.status === "Rejected";
  els.reviewBanner.classList.toggle("hidden", !reviewable || state.activeStage !== "draft");
  els.approve.classList.toggle("hidden", article.status === "Rejected");
  els.reject.classList.toggle("hidden", article.status === "Rejected");
  if (article.status === "Rejected") {
    els.reviewHeading.textContent = "This Draft was rejected";
    els.reviewCopy.textContent = "Leave clear direction and request another iteration when you are ready.";
    els.feedback.value = article.draftReview?.feedback ?? "";
  } else {
    els.reviewHeading.textContent = "Is this Draft ready to continue?";
    els.reviewCopy.textContent = "Approve it to begin technical and editorial review, or leave direction for another iteration.";
  }
  renderNavigation();
}

function definitionList(items) {
  return `<div class="definition-grid">${items.map((item) => `<article><h3>${escapeHtml(item.term)}</h3><p>${escapeHtml(item.definition)}</p></article>`).join("")}</div>`;
}

function simpleList(items, empty = "None recorded") {
  if (!items?.length) return `<p class="empty-copy">${empty}</p>`;
  return `<ul class="content-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderResearch(data) {
  return `<div class="artifact-sections">
    <section><h3>Definitions</h3>${definitionList(data.definitions)}</section>
    <section><h3>References</h3><div class="reference-list">${data.references.map((ref) => `<a href="${escapeHtml(safeUrl(ref.url))}" target="_blank" rel="noreferrer"><strong>${escapeHtml(ref.title)}</strong><span>${escapeHtml(ref.note ?? ref.url)}</span></a>`).join("") || '<p class="empty-copy">No references recorded</p>'}</div></section>
    <section><h3>Open questions</h3>${simpleList(data.openQuestions)}</section>
    <section><h3>Common mistakes</h3>${simpleList(data.commonMistakes)}</section>
  </div>`;
}

function renderOutline(data) {
  return `<div class="outline-view"><div class="outline-intro"><p>${escapeHtml(data.subtitle)}</p><span>${data.estimatedReadingTimeMinutes} min read</span></div>${data.sections.map((section, index) => `<article class="outline-section"><span>${String(index + 1).padStart(2, "0")}</span><div><h3>${escapeHtml(section.heading)}</h3><p>${escapeHtml(section.summary)}</p></div></article>`).join("")}</div>`;
}

function renderReview(data, technical) {
  const items = technical ? data.issues : data.suggestions;
  if (!items.length) return `<div class="review-clear"><span>✓</span><h3>No findings</h3><p>The reviewer found no changes to request.</p></div>`;
  return `<div class="finding-list">${items.map((item, index) => `<article class="finding-card"><div class="finding-heading"><span>Finding ${index + 1}</span>${technical ? `<b class="severity severity-${item.severity}">${item.severity}</b>` : ""}</div><h3>${escapeHtml(item.issue)}</h3><p>${escapeHtml(technical ? item.reason : item.location)}</p><div class="suggestion"><strong>Suggested change</strong><p>${escapeHtml(technical ? item.suggestedFix : item.suggestion)}</p></div></article>`).join("")}</div>`;
}

function renderSeo(data) {
  return `<div class="artifact-sections"><section><h3>Search preview</h3><div class="search-preview"><span>${escapeHtml(data.slug)}</span><strong>${escapeHtml(data.metaTitle)}</strong><p>${escapeHtml(data.metaDescription)}</p></div></section><section><h3>Keywords</h3><div class="tag-list">${data.keywords.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></section><section><h3>FAQ</h3>${data.faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("") || '<p class="empty-copy">No FAQ entries</p>'}</section></div>`;
}

function renderArtifact() {
  const data = state.activeArtifact;
  const [, label] = STAGES.find(([key]) => key === state.activeStage) ?? [];
  els.artifactTitle.textContent = label ?? "Artifact";
  els.artifactKicker.textContent = state.activeStage === "draft" ? "Editorial checkpoint" : "Immutable artifact";
  const canPreview = Boolean(data);
  els.viewToggle.classList.toggle("hidden", !canPreview);
  for (const button of els.viewToggle.querySelectorAll("button")) button.classList.toggle("active", button.dataset.view === state.viewMode);
  els.iterationBadge.classList.toggle("hidden", state.activeStage !== "draft" || !state.article?.draftReview);
  if (state.activeStage === "draft" && state.article?.draftReview) els.iterationBadge.textContent = `Draft ${state.article.draftReview.iteration + 1}`;

  if (!data) {
    els.stageContent.innerHTML = `<div class="artifact-pending"><span>○</span><h3>Waiting for this stage</h3><p>It will appear here as the pipeline progresses.</p></div>`;
    return;
  }
  if (state.viewMode === "raw") {
    els.stageContent.innerHTML = `<pre class="raw-data">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    return;
  }

  let html;
  switch (state.activeStage) {
    case "research": html = renderResearch(data); break;
    case "outline": html = renderOutline(data); break;
    case "draft": html = `<article class="markdown-preview"><h1>${escapeHtml(data.title)}</h1><p class="article-subtitle">${escapeHtml(data.subtitle)}</p>${markdown(data.body)}</article>`; break;
    case "technical": html = renderReview(data, true); break;
    case "editorial": html = renderReview(data, false); break;
    case "revised-draft": html = `<article class="markdown-preview"><h1>${escapeHtml(data.title)}</h1><p class="article-subtitle">${escapeHtml(data.subtitle)}</p>${markdown(data.body)}</article><div class="resolution-summary"><strong>${data.resolutions.filter((item) => item.decision === "applied").length} applied</strong><span>${data.resolutions.filter((item) => item.decision === "rejected").length} rejected</span></div>`; break;
    case "seo": html = renderSeo(data); break;
    case "metadata": html = `<article class="markdown-preview">${markdown(data.markdown)}</article>`; break;
    default: html = `<pre class="raw-data">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
  }
  els.stageContent.innerHTML = html;
}

async function loadStage(stage) {
  if (!articleId) return;
  state.activeStage = stage;
  state.viewMode = "preview";
  renderHeader();
  try {
    const { artifact } = await fetchJson(`/articles/${articleId}/artifact/${stage}`);
    state.activeArtifact = artifact;
  } catch (error) {
    state.activeArtifact = null;
  }
  renderArtifact();
}

async function loadArticle({ followStatus = false } = {}) {
  state.article = await fetchJson(`/articles/${articleId}`);
  const suggestedStage = STATUS_STAGE[state.article.status] ?? "research";
  if (followStatus || !artifactExists(state.activeStage)) state.activeStage = suggestedStage;
  renderHeader();
  await loadStage(state.activeStage);
}

function appendEvent(event) {
  const row = document.createElement("div");
  row.className = "event-row";
  const time = event.ts ? new Date(event.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  row.innerHTML = `<span class="event-dot"></span><div><strong>${escapeHtml(event.type.replace(/([a-z])([A-Z])/g, "$1 $2"))}</strong><small>${escapeHtml(event.agent ?? event.action ?? "Pipeline")}</small></div><time>${time}</time>`;
  els.eventLog.appendChild(row);
  els.eventLog.scrollTop = els.eventLog.scrollHeight;
}

function watchArticle(since = Date.now()) {
  if (eventSource) eventSource.close();
  els.eventLog.innerHTML = "";
  const watchingSince = since;
  eventSource = new EventSource(`/articles/${articleId}/events`);
  eventSource.onmessage = async (message) => {
    const event = JSON.parse(message.data);
    appendEvent(event);
    const isLiveEvent = !event.ts || new Date(event.ts).getTime() >= watchingSince;
    if (isLiveEvent && ["StatusChanged", "ArtifactCreated", "DraftReviewRequested", "Completed", "Failed"].includes(event.type)) {
      await loadArticle({ followStatus: state.article?.status !== "AwaitingDraftReview" });
    }
    if (isLiveEvent && ["Completed", "Failed"].includes(event.type)) eventSource.close();
  };
}

async function submitReview(action) {
  const submittedAt = Date.now();
  const feedback = els.feedback.value.trim();
  els.reviewError.classList.add("hidden");
  for (const button of [els.approve, els.reject, els.iterate]) button.disabled = true;
  try {
    await fetchJson(`/articles/${articleId}/draft-review`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, feedback: feedback || undefined }),
    });
    els.feedback.value = "";
    watchArticle(submittedAt);
    await loadArticle({ followStatus: true });
  } catch (error) {
    els.reviewError.textContent = error.message;
    els.reviewError.classList.remove("hidden");
  } finally {
    for (const button of [els.approve, els.reject, els.iterate]) button.disabled = false;
  }
}

els.approve.addEventListener("click", () => submitReview("approve"));
els.reject.addEventListener("click", () => submitReview("reject"));
els.iterate.addEventListener("click", () => submitReview("iterate"));
els.retry.addEventListener("click", async () => { const submittedAt = Date.now(); await fetchJson(`/articles/${articleId}/retry`, { method: "POST" }); watchArticle(submittedAt); });
els.viewToggle.addEventListener("click", (event) => { const button = event.target.closest("button[data-view]"); if (button) { state.viewMode = button.dataset.view; renderArtifact(); } });
els.activityToggle.addEventListener("click", () => { els.activityDrawer.classList.add("open"); els.activityDrawer.setAttribute("aria-hidden", "false"); });
els.activityClose.addEventListener("click", () => { els.activityDrawer.classList.remove("open"); els.activityDrawer.setAttribute("aria-hidden", "true"); });

if (!articleId) els.title.textContent = "No Article selected";
else loadArticle({ followStatus: true }).then(watchArticle).catch((error) => { els.title.textContent = error.message; });
