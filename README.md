# QuizCraft AI

AI-powered quiz generation and assessment platform built for TeachEdison Hackathon 2026.

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Django 5, Django REST Framework
- Auth: JWT with SimpleJWT
- Async jobs: Celery + Redis
- Database: PostgreSQL 16
- AI provider: NVIDIA NIM using `meta/llama-3.1-70b-instruct`
- Deployment target: Vercel for frontend, Railway for backend/services

## Features Implemented

- AI quiz generation with async status polling
- Quiz discovery, detail view, publishing, editing, and per-question regeneration
- PDF and DOCX upload as quiz generation source material
- Timed quiz attempts with server-side scoring
- Topic-wise analytics and quiz leaderboards
- Instructor and student dashboards
- Classroom creation, join by code, membership management, and quiz assignment
- Quiz availability windows with scheduled and expired states

## Features Skipped or Deferred

- Final deployment polish and full production hardening
  - Deferred because the hackathon priority was completing the end-to-end core flow first
- End-to-end automated test coverage
  - Deferred due to time; core flows were validated manually during development
- Admin overview page
  - Still a stub because it was lower priority than student and instructor workflows
- UX polish such as more toasts, loading states, and empty states
  - Deferred until after the main demo-ready functionality was complete

## Repository Structure

```text
quizcraftai/
├── frontend/         # Next.js app
├── backend/          # Django project and apps
├── docker-compose.yml
└── README.md
```

## How to Run Locally

### Option 1: Docker Compose

This is the easiest way to run the full stack locally.

1. Clone the repository.
2. Create a `.env` file in the repo root.
3. Copy the values from `.env.example` and fill in `NVIDIA_API_KEY` and `SECRET_KEY`.
4. Run:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

The backend container runs migrations automatically on startup.

### Option 2: Run Services Manually

#### Backend

1. Create and activate a Python virtual environment inside `backend/`.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set environment variables:

```env
SECRET_KEY=your_secret_key
DEBUG=True
DATABASE_URL=postgresql://quizuser:quizpass@localhost:5432/quizcraftdb
REDIS_URL=redis://localhost:6379/0
NVIDIA_API_KEY=your_nvidia_key
```

4. Run migrations:

```bash
python manage.py migrate
```

5. Start Django:

```bash
python manage.py runserver
```

#### Celery Worker

From `backend/`:

```bash
celery -A config worker -l info --pool=solo
```

#### Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Set:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Environment Variables

Root `.env.example` currently includes:

```env
DATABASE_URL=postgresql://quizuser:quizpass@db:5432/quizcraftdb
REDIS_URL=redis://redis:6379/0
NVIDIA_API_KEY=your_nvidia_nim_key_here
SECRET_KEY=your_50_char_secret_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Database Design Decisions

### Why UUIDs everywhere

All core models use UUID primary keys. This avoids predictable IDs, works well across distributed services, and is safer for public-facing APIs.

### Quiz data model

- `Quiz` stores authoring settings such as difficulty, timers, shuffle flags, availability windows, publish state, and generation status.
- `Question` belongs to a quiz and stores explanation, topic tag, order, and AI-generated difficulty score.
- `Choice` belongs to a question and stores answer text, display order, and the correctness flag.

This separation keeps authoring flexible and makes per-question regeneration straightforward.

### Attempt data model

- `QuizAttempt` stores progress and scoring metadata for one user taking one quiz session.
- `question_order` is stored as JSON so the server controls shuffle order, not the client.
- `topic_breakdown` is stored as JSON for efficient analytics and result rendering.
- `AttemptAnswer` denormalizes `is_correct` at write time for faster analytics queries later.

This design supports secure grading, post-attempt review, leaderboard aggregation, and topic analytics without recalculating everything on every request.

### Classroom data model

- `Classroom` stores a teacher-owned learning space with a generated 6-character join code.
- `ClassroomMembership` enforces one unique membership per student per classroom.
- `Quiz.classrooms` is a many-to-many relationship so one quiz can be assigned to multiple classrooms and one classroom can hold multiple quizzes.

### Performance-oriented choices

- Indexed topic and difficulty fields for quiz discovery
- Indexed creator and started-at combinations for dashboard queries
- Redis-backed caching and Celery-backed async generation
- PostgreSQL JSON fields for `question_order` and `topic_breakdown`

## API Structure

The API is organized by Django app and grouped under `/api`.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/token`
- `POST /api/auth/token/refresh`

### Quizzes

- `GET /api/quizzes/`
- `POST /api/quizzes/generate/`
- `GET /api/quizzes/{id}/status/`
- `GET /api/quizzes/{id}/`
- `PATCH /api/quizzes/{id}/`
- `GET /api/quizzes/{id}/questions`
- `POST /api/quizzes/{id}/regenerate-question/{question_id}`

### Attempts

- `POST /api/attempts/`
- `GET /api/attempts/{id}/questions/`
- `POST /api/attempts/{id}/answers/`
- `PATCH /api/attempts/{id}/tab-switch/`
- `POST /api/attempts/{id}/complete/`
- `GET /api/attempts/{id}/results/`

### Analytics

- `GET /api/analytics/me`
- `GET /api/analytics/quiz/{id}`
- `GET /api/analytics/quiz/{id}/leaderboard`

### Classrooms

- `GET /api/classrooms`
- `POST /api/classrooms`
- `GET /api/classrooms/{id}`
- `PATCH /api/classrooms/{id}`
- `DELETE /api/classrooms/{id}`
- `POST /api/classrooms/join`
- `POST /api/classrooms/{id}/leave`
- `GET /api/classrooms/my`
- `DELETE /api/classrooms/{id}/members/{membership_id}`
- `GET /api/classrooms/{id}/quizzes`
- `POST /api/classrooms/{id}/assign-quiz`
- `DELETE /api/classrooms/{id}/remove-quiz`

### API design choices

- App-based separation kept the codebase easier to reason about during fast iteration
- Async AI generation returns early and uses polling instead of blocking the request
- Scoring is handled server-side to protect answer integrity
- Classroom and analytics endpoints are kept separate from quiz CRUD to avoid overloading a single resource surface

## Challenges Faced and How They Were Solved

### 1. AI responses needed to be structured and reliable

Challenge:
Large language model output can drift or break expected quiz shape.

Solution:
Pydantic schema enforcement was used so generation always targets exactly 4 choices and exactly 1 correct answer per question.

### 2. Quiz generation could not block the UI

Challenge:
Generating 10-question quizzes from AI can take noticeable time.

Solution:
Celery + Redis were used to move generation into a background worker, while the frontend polls quiz status until completion.

### 3. Quiz integrity had to be protected

Challenge:
Correct answers and scoring logic should never be trusted to the client.

Solution:
Question order is stored server-side on `QuizAttempt`, correct answers are hidden during active attempts, and scoring is completed only on the backend.

### 4. Classroom visibility rules were easy to get wrong

Challenge:
Students should only see quizzes available to classrooms they actually joined.

Solution:
Quiz-to-classroom assignment was modeled explicitly and student dashboard queries were scoped to classroom membership plus publish and availability rules.

### 5. Analytics needed to feel rich without expensive recomputation

Challenge:
Per-topic performance and leaderboard features can become query-heavy.

Solution:
Useful values such as `is_correct` and `topic_breakdown` were stored in attempt records so analytics endpoints can aggregate faster.

## Deployment Summary

- Frontend is intended for Vercel
- Backend, Celery, PostgreSQL, and Redis are intended for Railway
- `docker-compose.yml` mirrors the same service split locally

## Notes

- `APPEND_SLASH` is disabled, so frontend calls and backend routes intentionally omit trailing slashes in several places
- The backend falls back to SQLite if `DATABASE_URL` is not set, which helps local migrations and lightweight setup
- The current repository contains an active working tree beyond this README; be careful not to overwrite unrelated changes when committing future work
