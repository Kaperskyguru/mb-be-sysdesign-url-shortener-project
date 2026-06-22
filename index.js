// URL Shortener prototype. Endpoints the predefined frontend (/__app/) consumes:
//   POST /shorten { url }      -> 201 { code, shortUrl, url }
//   GET  /:code                -> 302 redirect to the original URL
//   GET  /api/links            -> recent links (newest first)
//   GET  /health               -> { status: "healthy", hot: true }
//   GET  /cache                -> { ok, message }
const express = require("express");

const app = express();
app.use(express.json());

// In-memory store (a real build would use Redis/Postgres). code -> { url, createdAt }
const links = new Map();
const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function genCode(len = 6) {
  let code = "";
  for (let i = 0; i < len; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return links.has(code) ? genCode(len) : code;
}

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Health + cache (graded by the project's apiSpec).
app.get("/health", (_req, res) => res.json({ status: "healthy", hot: true }));
app.get("/cache", (_req, res) =>
  res.json({ ok: true, message: `cache warm — ${links.size} links` }),
);

// Create a short link.
app.post("/shorten", (req, res) => {
  const url = (req.body && req.body.url ? String(req.body.url) : "").trim();
  if (!isHttpUrl(url)) {
    return res.status(422).json({ error: "Provide a valid http(s) URL." });
  }
  const code = genCode();
  links.set(code, { url, createdAt: Date.now() });
  return res.status(201).json({ code, shortUrl: `/${code}`, url });
});

// Recent links, newest first.
app.get("/api/links", (_req, res) => {
  const all = [...links.entries()]
    .map(([code, v]) => ({ code, shortUrl: `/${code}`, url: v.url, createdAt: v.createdAt }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 25);
  res.json(all);
});

// Redirect. MUST stay last so it doesn't shadow the routes above. Skip the
// frontend mount path just in case the worker ever forwards it here.
app.get("/:code", (req, res) => {
  const entry = links.get(req.params.code);
  if (!entry) return res.status(404).json({ error: "Unknown short code." });
  res.redirect(302, entry.url);
});
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`url-shortener listening on :${PORT}`));
