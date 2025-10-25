const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const init = { users: [], progress: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2));
    return init;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw || '{}') || { users: [], progress: [] };
  } catch (e) {
    console.error('Failed to read DB:', e);
    return { users: [], progress: [] };
  }
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Backend is healthy', time: new Date().toISOString() });
});

// Returns all progress and users (mock admin view)
app.get('/progress', (_req, res) => {
  const db = readDB();
  res.json({ users: db.users, progress: db.progress });
});

// Accepts payload of { users?: string[], progress?: ProgressEntry[] }
// ProgressEntry = { id?: string, user: string, activityId: string, answer?: string, correct?: boolean, timestamp: string }
app.post('/sync', (req, res) => {
  const incoming = req.body || {};
  const db = readDB();

  const users = Array.isArray(incoming.users) ? incoming.users : [];
  const progress = Array.isArray(incoming.progress) ? incoming.progress : [];

  // Merge users (unique by name)
  for (const u of users) {
    if (typeof u === 'string' && u.trim().length > 0 && !db.users.includes(u)) {
      db.users.push(u);
    }
  }

  // Merge progress (unique by composite key user+activityId+timestamp)
  const key = (p) => `${p.user}::${p.activityId}::${p.timestamp}`;
  const existingKeys = new Set(db.progress.map(key));
  for (const p of progress) {
    if (!p || !p.user || !p.activityId || !p.timestamp) continue;
    const k = key(p);
    if (!existingKeys.has(k)) {
      db.progress.push({
        id: p.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        user: p.user,
        activityId: p.activityId,
        answer: p.answer ?? null,
        correct: typeof p.correct === 'boolean' ? p.correct : null,
        timestamp: p.timestamp,
      });
      existingKeys.add(k);
    }
  }

  writeDB(db);
  res.json({ ok: true, savedUsers: users.length, savedProgress: progress.length });
});

app.listen(PORT, () => {
  console.log(`Mock backend listening on http://localhost:${PORT}`);
});
