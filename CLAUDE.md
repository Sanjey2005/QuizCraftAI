# QuizCraft AI — Project Context

## Project
AI-powered quiz generation and assessment platform.
Event: TeachEdison Hackathon 2026

## Stack
- Frontend: Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui
- State: Zustand (quiz attempt UI state) + TanStack React Query (server state + polling)
- Backend: Django 5.x + Django REST Framework 3.x
- Auth: djangorestframework-simplejwt — httpOnly cookies, 30-min access / 1-day refresh with rotation
- Task Queue: Celery 5 + Redis 7 (AI generation tasks)
- AI: NVIDIA NIM (meta/llama-3.1-70b-instruct) — OpenAI-compatible, Pydantic JSON schema enforcement
- Database: PostgreSQL 16 — JSONB for topic_breakdown and question_order
- Cache: Redis — 5-min quiz detail, 5-sec generation status, 60-sec leaderboard
- Deployment: Vercel (frontend) + Railway (Django + Celery + Postgres + Redis)

## Repo Structure
```
quizcraftai/
├── frontend/         # Next.js 14
├── backend/          # Django (config/) with apps: users, quizzes, attempts, analytics, ai
├── docker-compose.yml
└── CLAUDE.md
```

## Absolute Rules — Never Break These
1. Correct answers are NEVER sent to client during an active quiz attempt
2. All scoring is server-side only — POST /api/attempts/{id}/complete/
3. UUID primary keys on ALL models
4. JWT tokens in httpOnly cookies only — never localStorage
5. AI generation uses Pydantic structured output: exactly 4 choices, exactly 1 correct
6. Celery tasks retry max 5 times — exponential backoff 1s → 2s → 4s → 8s → 16s + jitter
7. question_order stored server-side in QuizAttempt — client cannot manipulate shuffle
8. React Query for all server state; Zustand for quiz attempt UI state only
9. All Django apps live under backend/apps/

## Django Apps
- users — User model, JWT auth views
- quizzes — Quiz, Question, Choice models + CRUD views
- attempts — QuizAttempt, AttemptAnswer models + views
- analytics — services.py + serializers.py + views.py + urls.py (P4 complete)
- ai — tasks.py (Celery), providers.py (NIM), schemas.py (Pydantic)

## Key API Endpoints
### Auth
- POST /api/auth/register/ — public
- POST /api/auth/token/ — login, sets httpOnly cookies
- POST /api/auth/token/refresh/ — silent refresh on 401

### Quizzes
- GET  /api/quizzes/ — list published quizzes (filter: topic, difficulty)
- POST /api/quizzes/generate/ — async AI generation, returns 202 + quiz_id
- GET  /api/quizzes/{id}/status/ — poll generation (pending/generating/completed/failed)
- GET  /api/quizzes/{id}/ — quiz detail (includes question_count)
- PATCH /api/quizzes/{id}/ — update quiz settings + publish toggle (instructor owner only)

### Attempts
- POST /api/attempts/ — start attempt, server creates shuffled question_order
- GET  /api/attempts/{id}/questions/ — questions with NO is_correct field
- POST /api/attempts/{id}/answers/ — submit answer, server validates timer
- PATCH /api/attempts/{id}/tab-switch/ — increment tab_switch_count
- POST /api/attempts/{id}/complete/ — server grades, computes topic_breakdown
- GET  /api/attempts/{id}/results/ — full results after scoring

### Analytics
- GET /api/analytics/me — student personal stats (attempts, avg/best score, topic breakdown, score trend)
- GET /api/analytics/quiz/{id} — instructor aggregate stats for one quiz (owner only)
- GET /api/analytics/quiz/{id}/leaderboard — top-10 ranked scorers (all authenticated users)

## Database Design Decisions
- topic_breakdown (JSONB on QuizAttempt): {"algebra": {"correct": 3, "total": 4}}
- question_order (JSONB on QuizAttempt): [uuid, uuid, ...] — set at attempt start, never changed
- is_correct on AttemptAnswer: denormalised from Choice at write time for fast analytics
- difficulty_score (float 0.0-1.0 on Question): AI-assigned, enables future adaptive testing
- generation_status on Quiz: drives frontend polling without WebSockets

## Auth Settings (settings.py)
```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
```

## Celery Task Config
```python
@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    retry_kwargs={"max_retries": 5},
    time_limit=120,
    soft_time_limit=90,
)
def generate_quiz_task(self, quiz_id, topic, num_questions, difficulty):
    ...
```

## Pydantic AI Output Schema
```python
class QuizChoice(BaseModel):
    text: str
    is_correct: bool  # exactly 1 True per question

class QuizQuestion(BaseModel):
    question_text: str
    choices: List[QuizChoice]  # min=4, max=4
    explanation: str
    topic_tag: str
    difficulty_score: float  # 0.0–1.0

class QuizGenerationResponse(BaseModel):
    questions: List[QuizQuestion]
```

## Design Tokens
- --color-brand: #1E3A5F
- --color-accent: #2563EB
- --color-success: #16A34A
- --color-warning: #D97706
- --color-danger: #DC2626
- --font-sans: Inter, system-ui
- --font-mono: JetBrains Mono

## AI Provider
- Using NVIDIA NIM free endpoint (not Gemini)
- base_url: https://integrate.api.nvidia.com/v1
- model: meta/llama-3.1-70b-instruct (deepseek-v3-0324 returned 404 — switched)
- env var: NVIDIA_API_KEY
- SDK: openai (pip install openai) — NIM is OpenAI-compatible

## Infrastructure Notes
- docker-compose.yml: volume mounts ./backend:/app on both backend and celery services for hot-reload
- APPEND_SLASH = False in Django settings — all URL patterns and frontend calls must omit trailing slash
- analytics app is in INSTALLED_APPS — no migrations needed (no new models, pure ORM aggregation)

## Build Order (completed phases)
- P1 ✅ Django models + JWT auth + Next.js scaffold
- P2 ✅ AI generation pipeline + Quiz CRUD endpoints + Discover/Generate UI
- P3 ✅ Attempt endpoints + scoring + Take Quiz UI
- P4 ✅ Analytics backend + Leaderboard + Student Dashboard + Landing Page + Quiz Editor
- P5 🔲 Vercel + Railway deployment

## Current Status
All core features complete:
- Full backend API working
- Consistent UI across all pages
- Timer fixed, leaderboard fixed, analytics fixed
- Publish/unpublish working
- Question preview + per-question regenerate working
- Quiz availability window (available_from, available_until) working

Remaining for next session:
- PDF/DOCX upload as AI source
- UX polish (toasts, empty states, loading states)
- Final end-to-end test
- Deploy to Vercel + Railway

## Verified Built

### Backend
| File | Contents |
|------|----------|
| backend/apps/users/views.py | JWT register, login, token refresh |
| backend/apps/quizzes/views.py | Quiz CRUD + generate + status poll + questions-edit + regenerate-question |
| backend/apps/quizzes/serializers.py | QuizSerializer, QuestionEditSerializer, ChoiceEditSerializer |
| backend/apps/quizzes/models.py | Quiz with available_from, available_until fields |
| backend/apps/attempts/services.py | start_attempt, submit_answer, complete_attempt |
| backend/apps/attempts/views.py | All 6 attempt views |
| backend/apps/analytics/services.py | get_student_analytics, get_quiz_analytics, get_leaderboard |
| backend/apps/analytics/serializers.py | StudentAnalytics, QuizAnalytics, Leaderboard |
| backend/apps/analytics/views.py | 3 APIViews with correct permission guards |
| backend/apps/analytics/urls.py | 3 routes under api/analytics/ |
| backend/config/urls.py | All 4 app URL includes wired |
| backend/apps/ai/providers.py | call_nim() using Llama 3.1 + json_object format |
| backend/apps/ai/tasks.py | Celery generate_quiz_task with retry/backoff + default time_limit |

### Quiz API Additions
- GET  /api/quizzes/{id}/questions — instructor-only, returns questions + choices with is_correct
- POST /api/quizzes/{id}/regenerate-question/{question_id} — replaces single question via AI

### Frontend Pages
| Route | File | Status |
|-------|------|--------|
| / | app/page.tsx | ✅ Premium landing page |
| /login | app/(auth)/login/page.tsx | ✅ JWT login form |
| /register | app/(auth)/register/page.tsx | ✅ Role-select registration |
| /quizzes | app/quizzes/page.tsx | ✅ Browse + filter published quizzes |
| /quizzes/generate | app/quizzes/generate/page.tsx | ✅ AI form + polling → redirects to edit on complete |
| /quizzes/[id] | app/quizzes/[id]/page.tsx | ✅ Quiz detail + Start CTA |
| /quizzes/[id]/attempt | app/quizzes/[id]/attempt/page.tsx | ✅ Full take-quiz UI with timers + auto-submit |
| /quizzes/[id]/edit | app/quizzes/[id]/edit/page.tsx | ✅ Settings + question preview + per-question regenerate + availability window |
| /attempts/[id]/results | app/attempts/[id]/results/page.tsx | ✅ Score + topic chart + review |
| /dashboard/student | app/dashboard/student/page.tsx | ✅ Stats cards + topic bars + recent attempts |
| /dashboard/instructor | app/dashboard/instructor/page.tsx | ✅ Quiz list + availability badges + Generate CTA |
| /analytics/quiz/[id] | app/analytics/quiz/[id]/page.tsx | ✅ Instructor stats + topic chart |
| /analytics/quiz/[id]/leaderboard | app/analytics/quiz/[id]/leaderboard/page.tsx | ✅ Gold/silver/bronze podium |
| /analytics/me | app/analytics/me/page.tsx | ✅ Student analytics with error handling |
| /admin/overview | app/admin/overview/page.tsx | 🔲 Stub |

### Frontend Components
- frontend/components/quiz/TimerBar.tsx
- frontend/components/quiz/AnswerChoice.tsx
- frontend/components/quiz/GenerationStatus.tsx
- frontend/components/analytics/ScoreHero.tsx
- frontend/components/analytics/TopicBreakdownChart.tsx
- frontend/components/layout/Navbar.tsx
- frontend/components/layout/PageWrapper.tsx
- frontend/components/layout/AppShell.tsx (custom cursor + conditional navbar)

## Hackathon Demo Checklist
- ✅ Generate a 10-question quiz in < 30 seconds live
- ✅ Complete a full student quiz attempt with timer, auto-save, score reveal
- ✅ Display topic-wise analytics breakdown post-attempt
- ✅ Demonstrate tab-switch count recorded in attempt record
- ✅ Render instructor leaderboard correctly
- ✅ Preview questions + regenerate individual questions before publishing
- ✅ Set quiz availability window (scheduled / expired / always on)
