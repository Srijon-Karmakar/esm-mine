# Testing and Deployment Checklists

This project has two apps:
- `apps/frontend` (React + Vite)
- `apps/api` (NestJS + Prisma + PostgreSQL)

Use the checklists below in two modes:
- `Free`: no paid tooling required
- `Paid`: production-grade tooling and services

## 1) Testing Checklist (Free)

- [ ] Install dependencies at repo root: `pnpm install`
- [ ] Run monorepo lint: `pnpm lint`
- [ ] Run monorepo type checks: `pnpm check-types`
- [ ] Run monorepo build: `pnpm build`
- [ ] Run API unit tests: `pnpm --filter api test`
- [ ] Run API e2e tests: `pnpm --filter api test:e2e`
- [ ] Run API coverage: `pnpm --filter api test:cov`
- [ ] Validate Prisma schema and migrations:
  - [ ] `pnpm --filter api exec prisma validate`
  - [ ] `pnpm --filter api exec prisma migrate status`
- [ ] Verify frontend production build: `pnpm --filter frontend build`
- [ ] Smoke-test key flows manually in local/staging:
  - [ ] Login/register/auth token refresh
  - [ ] Club/member management
  - [ ] Match/season CRUD
  - [ ] Social upload flow (if enabled)
  - [ ] AI endpoints (if enabled)
- [ ] Add missing frontend automated tests (recommended baseline):
  - [ ] Unit/component tests with Vitest + React Testing Library
  - [ ] E2E tests with Playwright (critical journeys only)
- [ ] Gate PRs with a free CI pipeline (for example GitHub Actions) running:
  - [ ] `pnpm lint`
  - [ ] `pnpm check-types`
  - [ ] `pnpm --filter api test`
  - [ ] `pnpm --filter frontend build`

## 2) Testing Checklist (Paid)

- [ ] Everything in the free checklist
- [ ] Add cross-browser/device E2E in a paid grid/cloud
- [ ] Add visual regression testing for frontend UI
- [ ] Add contract testing between frontend and API
- [ ] Add load/performance test suite (API p95 latency, error rate, throughput)
- [ ] Add security scanning in CI:
  - [ ] SCA/dependency scanning
  - [ ] SAST
  - [ ] DAST for public endpoints
- [ ] Add flaky test tracking and retry analytics
- [ ] Add release-quality gates:
  - [ ] Minimum API coverage threshold
  - [ ] Max bundle-size budget for frontend
  - [ ] Required passing staging smoke suite before production

## 3) Deployment Checklist (Free)

- [ ] Choose low-cost/free-tier hosting:
  - [ ] Frontend static host
  - [ ] API Node host
  - [ ] Managed PostgreSQL (or self-hosted Postgres)
- [ ] Confirm runtime versions:
  - [ ] Node `>=18`
  - [ ] pnpm `9.x`
- [ ] Set required environment variables
  - [ ] API required: `DATABASE_URL`, `JWT_ACCESS_SECRET`
  - [ ] API recommended: `JWT_ACCESS_EXPIRES_IN`, `PLATFORM_ADMIN_EMAILS`
  - [ ] API optional integrations:
    - [ ] `OPENAI_API_KEY` (or `AI_OPENAI_API_KEY`)
    - [ ] `OPENAI_MODEL` (or `AI_OPENAI_MODEL`)
    - [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER`
  - [ ] Frontend required: `VITE_API_URL`
- [ ] Run pre-deploy checks in CI:
  - [ ] `pnpm lint`
  - [ ] `pnpm check-types`
  - [ ] `pnpm --filter api test`
  - [ ] `pnpm --filter frontend build`
- [ ] Build and deploy API
  - [ ] Build command: `pnpm --filter api build`
  - [ ] Start command (with migrations): `pnpm --filter api start:render`
- [ ] Build and deploy frontend
  - [ ] Build command: `pnpm --filter frontend build`
  - [ ] Publish `apps/frontend/dist`
- [ ] Verify database migrations are applied in production:
  - [ ] `pnpm --filter api exec prisma migrate deploy`
- [ ] Post-deploy smoke tests:
  - [ ] API health and Swagger at `/docs`
  - [ ] Auth/login
  - [ ] One create/update/delete flow per critical module
  - [ ] Frontend calls API correctly via `VITE_API_URL`
- [ ] Keep a rollback plan:
  - [ ] Previous frontend build artifact
  - [ ] Previous API image/release
  - [ ] Database restore point/backup snapshot

## 4) Deployment Checklist (Paid)

- [ ] Everything in the free checklist
- [ ] Use separate environments: `dev`, `staging`, `production`
- [ ] Use managed production infrastructure:
  - [ ] Containerized API (e.g., ECS/Cloud Run/Kubernetes)
  - [ ] Managed PostgreSQL with automated backups and PITR
  - [ ] CDN + WAF in front of frontend/API
- [ ] Use a secret manager (not plaintext env files in CI)
- [ ] Use zero-downtime strategy:
  - [ ] Blue/green or canary deploys
  - [ ] Automated health checks and rollback
- [ ] Add full observability:
  - [ ] Centralized logs
  - [ ] Metrics dashboards
  - [ ] Error tracking and alerting
  - [ ] Uptime checks and on-call routing
- [ ] Add release governance:
  - [ ] Change approval for production deploys
  - [ ] Tagged releases + changelog
  - [ ] Post-deploy verification checklist signoff
- [ ] Add compliance and security controls:
  - [ ] Periodic dependency patch windows
  - [ ] Vulnerability SLA
  - [ ] Audit log retention policy
