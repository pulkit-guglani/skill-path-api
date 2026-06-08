# Backend Requirements Tracker

This document tracks API and persistence work for **skill-path-backend**.  
Frontend domain types live in the mobile repo under `domain/`. Shapes are duplicated here as Prisma models + DTOs until a shared contract package is needed.

## Implemented

### M0

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Liveness check |

### M1 — Goals CRUD

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| `POST` | `/api/v1/goals` | `CreateGoalDto` — client `id`, `hobby`, `goal`, `skills[]` | `ApiEnvelope<GoalDto>` | Creates `draft` goal; completion forced to `false` |
| `GET` | `/api/v1/goals/active` | — | `ApiEnvelope<GoalDto \| null>` | Confirmed goal, or `null` |
| `GET` | `/api/v1/goals/:id` | — | `ApiEnvelope<GoalDto>` | Fetch by id |
| `PATCH` | `/api/v1/goals/:id/confirm` | — | `ApiEnvelope<GoalDto>` | `draft` → `confirmed`; freezes skill list |
| `PATCH` | `/api/v1/goals/:id/skills` | `{ skills[] }` | `ApiEnvelope<GoalDto>` | Full replace; draft only |
| `PATCH` | `/api/v1/goals/:goalId/skills/:skillId/completion` | Partial `{ videoCompleted?, readingCompleted?, practiceCompleted? }` | `ApiEnvelope<SkillDto>` | Confirmed only; auto-completes goal when all resources done |

### M2 — Roadmap generation

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| `POST` | `/api/v1/goals/generate-roadmap` | `{ hobby, goal }` | `ApiEnvelope<GeneratedRoadmapDto>` | Gemini JSON (strict model chain, not env-configurable): `gemini-3-flash-preview` → `gemini-2.5-flash` → `gemini-3.5-flash` → `gemini-3.1-flash-lite` → `gemma-4-31b-it`. `GEMINI_MOCK=true` returns static fixture |

## Proposed — M3+

### Response envelope (matches frontend)

```json
{
  "success": true,
  "data": {}
}
```

### Domain rules (aligned with frontend)

- One active confirmed goal at a time (enforce in service layer when auth arrives).
- Roadmap skill list is editable only in `draft`.
- Skill completion is per-resource (`video`, `reading`, `practice`).
- Goal `completed` when all skills have all resources completed (derived or set by service).
- Max 12 AI-generated skills.
- Hobby: 2–50 chars; goal text: 5–200 chars.

## Deferred

- User authentication / `userId` on entities
- Offline sync conflict resolution
- Roadmap regeneration after confirm
- Analytics / soft-deleted skills

## Local development

Repos live side-by-side under `skill-path-workspace/`:

```
skill-path-workspace/
  skill-path/          # Expo mobile app (separate git repo)
  skill-path-api/      # NestJS backend (separate git repo)
  skill-path.code-workspace
```

Open `skill-path.code-workspace` in Cursor/VS Code to see both repos and their git changes together.

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

If `prisma generate` fails with `EACCES` on `~/.cache/prisma`, use a project-local cache:

```bash
XDG_CACHE_HOME="$(pwd)/.cache" npm run prisma:generate
```

Base URL: `http://localhost:8000/api`

### M1 smoke test (after migrate)

```bash
# Create draft goal (use ids from domain/fixtures or generate UUIDs)
curl -s -X POST http://localhost:8000/api/v1/goals \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "hobby": "Chess",
  "goal": "Beat my friends at chess",
  "skills": [{
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "title": "Learn basic piece movement",
    "order": 0,
    "source": "ai",
    "whyItMatters": "You cannot play until piece movement is automatic.",
    "videoResource": { "title": "Chess basics", "url": "https://www.youtube.com/watch?v=example1" },
    "readingResource": { "title": "Piece movement", "url": "https://example.com/chess/pieces" },
    "practiceTask": { "title": "Movement drills", "description": "Move each piece type for 10 minutes." },
    "completion": { "videoCompleted": false, "readingCompleted": false, "practiceCompleted": false }
  }]
}
EOF

curl -s -X PATCH http://localhost:8000/api/v1/goals/a1b2c3d4-e5f6-7890-abcd-ef1234567890/confirm
curl -s http://localhost:8000/api/v1/goals/active
curl -s -X PATCH http://localhost:8000/api/v1/goals/a1b2c3d4-e5f6-7890-abcd-ef1234567890/skills/b2c3d4e5-f6a7-8901-bcde-f12345678901/completion \
  -H "Content-Type: application/json" \
  -d '{"videoCompleted": true}'
```

### M2 smoke test (mock mode)

```bash
# In .env: GEMINI_MOCK=true
curl -s -X POST http://localhost:8000/api/v1/goals/generate-roadmap \
  -H "Content-Type: application/json" \
  -d '{"hobby": "Chess", "goal": "Beat my friends at chess"}'
```
