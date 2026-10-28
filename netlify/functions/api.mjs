// Class scoreboard API for "The Adventure of The Goose"
// Routes: GET /api/state · POST /api/score · POST /api/teacher
import { getStore } from "@netlify/blobs";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const int = (v, d = 0) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default async (req) => {
  const route = new URL(req.url).pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
  const store = getStore({ name: "goose-game", consistency: "strong" });
  const state = (await store.get("state", { type: "json" })) || { round: "r1", status: "open" };

  // Live board: current round + all its players
  if (req.method === "GET" && route === "state") {
    const { blobs } = await store.list({ prefix: `players/${state.round}/` });
    const players = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
    return json({ ...state, players });
  }

  if (req.method !== "POST") return json({ error: "Not found" }, 404);
  let body;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  // A student saves their progress
  if (route === "score") {
    const id = String(body.id || "");
    if (!/^[a-z0-9]{6,40}$/i.test(id)) return json({ error: "Bad player id" }, 400);
    const name = String(body.name || "").replace(/\s+/g, " ").trim().slice(0, 20);
    if (name.length < 2) return json({ error: "Name too short" }, 400);
    const round = String(body.round || state.round);
    if (round !== state.round) return json({ ignored: true, reason: "old round" });
    const finished = body.status === "finished";
    const rec = {
      id, name, round,
      score: clamp(int(body.score), 0, 100000),
      level: clamp(int(body.level, 1), 1, 3),
      stars: (Array.isArray(body.stars) ? body.stars : [0, 0, 0]).slice(0, 3).map((n) => clamp(int(n), 0, 3)),
      mistakes: clamp(int(body.mistakes), 0, 9999),
      status: finished ? "finished" : "playing",
      finishedAt: finished ? int(body.finishedAt, Date.now()) || Date.now() : null,
      updatedAt: Date.now(),
    };
    await store.setJSON(`players/${round}/${id}`, rec);
    return json({ ok: true });
  }

  // Teacher controls, protected by the TEACHER_PIN environment variable
  if (route === "teacher") {
    const pin = (globalThis.Netlify?.env?.get("TEACHER_PIN") ?? process.env.TEACHER_PIN ?? "").trim();
    if (!pin) return json({ error: "Set TEACHER_PIN in Netlify (Site configuration → Environment variables) first." }, 403);
    if (String(body.pin || "").trim() !== pin) return json({ error: "Wrong PIN." }, 403);
    let next = state;
    if (body.action === "end") next = { ...state, status: "finished", changedAt: Date.now() };
    if (body.action === "new") next = { round: "r" + Date.now().toString(36), status: "open", changedAt: Date.now() };
    if (next !== state) await store.setJSON("state", next);
    return json({ ok: true, state: next });
  }

  return json({ error: "Not found" }, 404);
};

export const config = { path: "/api/*" };
