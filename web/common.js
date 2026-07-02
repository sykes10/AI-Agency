async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

const CONTENT_TYPE_LABELS = {
  pattern: "Pattern",
  blueprint: "Blueprint",
};
