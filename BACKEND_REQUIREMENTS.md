# Backend Requirements Tracker

This document tracks API and persistence work for **skill-path-backend**.  
Frontend domain types live in the mobile repo under `domain/`. Shapes are duplicated here as Prisma models + DTOs until a shared contract package is needed.

## Implemented (M0)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Liveness check |

## Proposed — needs approval before implementation

### Goals

| Method | Path | Request | Response | Notes |
|--------|------|---------|----------|-------|
| `POST` | `/api/v1/goals/generate-roadmap` | `{ hobby, goal }` | `ApiEnvelope<GeneratedRoadmapDto>` | Calls Gemini; returns draft skills only |
| `POST` | `/api/v1/goals` | `{ hobby, goal, skills[] }` | `ApiEnvelope<GoalDto>` | Create goal with edited roadmap |
| `GET` | `/api/v1/goals/active` | — | `ApiEnvelope<GoalDto \| null>` | Single active goal (confirmed, incomplete) |
| `GET` | `/api/v1/goals/:id` | — | `ApiEnvelope<GoalDto>` | Fetch by id |
| `PATCH` | `/api/v1/goals/:id/confirm` | — | `ApiEnvelope<GoalDto>` | `draft` → `confirmed`; freezes skill list |
| `PATCH` | `/api/v1/goals/:id/skills` | `{ skills[] }` | `ApiEnvelope<GoalDto>` | Only while `status = draft` |
| `PATCH` | `/api/v1/goals/:goalId/skills/:skillId/completion` | `{ videoCompleted?, readingCompleted?, practiceCompleted? }` | `ApiEnvelope<SkillDto>` | Only while `status = confirmed` |

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

Base URL: `http://localhost:8000/api`
