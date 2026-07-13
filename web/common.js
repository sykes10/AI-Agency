async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = `${url} → ${res.status}`;
    try {
      const body = await res.json();
      message = typeof body.error === "string" ? body.error : message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

const CONTENT_TYPE_LABELS = {
  pattern: "Pattern",
  blueprint: "Blueprint",
};
