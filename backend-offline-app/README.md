# Mock Backend: Offline Learning Progress Tracker

A minimal Express server to receive synced progress from the mobile app.

## Endpoints

- GET `/health` — health check
- GET `/progress` — view stored users and progress
- POST `/sync` — upsert users and append new progress entries

Data is persisted to `db.json` in this folder.

## Quick start

```bash
npm install
npm run start
# Server runs on http://localhost:4000
```

For development with live-reload:

```bash
npm run dev
```

## Request format

POST `/sync` expects:

```json
{
  "users": ["Alice", "Bob"],
  "progress": [
    {
      "user": "Alice",
      "activityId": "q1",
      "answer": "5",
      "correct": true,
      "timestamp": "2025-01-01T12:00:00.000Z"
    }
  ]
}
```

Uniqueness is enforced by `user + activityId + timestamp` to avoid duplicates.
