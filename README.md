## Online Art Portfolio API

This repository implements a Bun + Hono backend API for an online art portfolio platform. It includes an asynchronous job-queue built with BullMQ + Redis to manage commission lifecycle events (notifications, reminders, payment processing, etc.).

This README covers: setup, API endpoints, the job queue architecture, and CI instructions.

Contents
- Features
- Local setup (Dev)
- Running tests
- API overview (key endpoints)
- Job queue 
- CI/CD (GitLab)


## Features
- Bun + Hono backend
- MongoDB (Mongoose) persistence
- Redis + BullMQ job queue
- Commission lifecycle: submit, accept, complete, cancel, renegotiate
- Notification persistence in MongoDB (jobs create Notification documents)


## Local Setup (Development)
Prerequisites:
- Docker & Docker Compose (recommended for local services)
- Bun (optional if you use Docker)

Start services with Docker Compose (from project root):

```powershell
docker-compose up --build -d
```

This will start backend, Redis, MongoDB, and Caddy (if configured).

Environment variables are read from `.env` if present. Important vars:
- `REDIS_HOST` (default: `redis` when running in docker-compose)
- `REDIS_PORT` (default: `6379`)
- `MONGODB_URI` (default when running locally: `mongodb://localhost:27017/online_art_portfolio`)

To run tests locally (requires Redis + MongoDB running):

```powershell
# from project root
bun install
bun test
```

Note: Tests assume MongoDB and Redis are available at `127.0.0.1:27017` and `127.0.0.1:6379` by default. Set `MONGODB_URI` / `REDIS_HOST` env vars to point to Docker service hostnames when running inside containers.


## API Overview (selected endpoints)
- `POST /api/commissions/submit` - Submit a commission request (client only)
- `PUT /api/commissions/:commissionId/accept` - Artist accepts commission
- `PUT /api/commissions/:commissionId/complete` - Artist completes commission
- `PUT /api/commissions/:commissionId/cancel` - Client or artist cancels commission
- `PUT /api/commissions/:commissionId/renegotiate` - Start renegotiation
- `PUT /api/commissions/:commissionId/renegotiate/respond` - Respond to renegotiation
- `GET /api/jobs` - Admin: list queue jobs (supports `state`, `page`, `limit` query params)

Authentication: the API uses JWT; middleware looks for bearer token in request header.


## Job Queue Architecture
- Queue: `commission` is created with BullMQ and connected to Redis.
- Worker: `src/jobs/workers/commissionWorker.ts` subscribes to the `commission` queue and handles job processing.
- Enqueue points: `src/services/commissionService.ts` creates jobs for events such as `commission_request`, `commission_accept`, `commission_complete`, `renegotiation_*`, and delayed reminders.
- Notifications: `src/services/notifications.ts` persists `Notification` documents to MongoDB when worker handles notification jobs.

Job lifecycle and visibility:
- Immediate jobs are enqueued and processed by the worker. By default the worker may remove completed/failed jobs immediately — in debugging we keep completed jobs for 1 hour.
- Delayed jobs remain in Redis until their scheduled time (they appear in the `delayed` state).

Observability tips
- Use `GET /api/jobs` to see counts and paged jobs; the response includes `counts` (delayed/active/waiting/failed/completed) and a `jobs` array for the requested page.
- Tail backend logs to see `Enqueued job` messages and worker `completed/failed` events.


## Tests
- Tests are located under `tests/`. They use `bun:test`.
- Integration tests require MongoDB and Redis.
- To run locally:
	- Ensure MongoDB and Redis are running (docker-compose recommended)
	- `bun install`
	- `bun test`


## CI/CD (GitLab)
The repository includes a `.gitlab-ci.yml` that:
- Uses the `oven/bun` Docker image
- Starts `mongo` and `redis` service containers
- Runs `bun install` and `bun test` in the `test` stage
- Builds the project in the `build` stage with `bun build`

See `.gitlab-ci.yml` for details and adapt runner resource requests/timeouts as needed.


## Troubleshooting
- If jobs do not appear in `jobs` endpoint:
	- Check `counts` in `/api/jobs` — may show delayed jobs only.
	- Ensure worker is running and connected to the same Redis instance (check `REDIS_HOST`).
	- Add logging near `queue.add(...)` to validate enqueues.


To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.1. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
