# Where To Deploy and Where To Test

This file is a tool/platform checklist for this repo:
- `apps/frontend` (React + Vite)
- `apps/api` (NestJS + Prisma)
- PostgreSQL database

Pricing/features change often. Re-check each link before final purchase.

## 1) Where To Deploy (Free Options)

### Frontend (Vite build output)
- [ ] Vercel Hobby (free for personal/non-commercial usage profile)
- [ ] Netlify Free
- [ ] Cloudflare Pages Free

### API (NestJS service)
- [ ] Render Free web service (good for preview/hobby; has free-tier limits)
- [ ] Railway Free tier/trial credits

### PostgreSQL
- [ ] Neon Free
- [ ] Supabase Free
- [ ] Render Postgres Free

## 2) Where To Deploy (Paid Options)

### Frontend (production traffic)
- [ ] Vercel Pro
- [ ] Netlify Pro/Business

### API (production workloads)
- [ ] Railway Hobby/Pro
- [ ] Render paid instance types
- [ ] Fly.io pay-as-you-go

### PostgreSQL (production)
- [ ] Neon Launch/Scale
- [ ] Supabase Pro/Team
- [ ] Managed cloud Postgres (AWS RDS / Cloud SQL / Azure Database)

## 3) Where To Test (Free Options)

### In repo / open-source tools
- [ ] Backend tests: Jest (already in `apps/api`)
- [ ] Frontend unit/component tests: Vitest + React Testing Library
- [ ] Frontend e2e: Playwright (open source)

### CI and cloud free tiers
- [ ] GitHub Actions included free minutes for private repos, free standard runners on public repos
- [ ] Cypress Cloud Free plan
- [ ] Checkly Hobby (free synthetic checks)

## 4) Where To Test (Paid Options)

### E2E and test analytics
- [ ] Cypress Cloud Team/Business
- [ ] Checkly Starter/Team for synthetic API/browser checks

### Cross-browser and real-device testing
- [ ] BrowserStack paid plans
- [ ] LambdaTest paid plans

### Enterprise observability-style testing
- [ ] Datadog Synthetic Monitoring
- [ ] New Relic (higher check quotas and paid expansions)

## 5) Suggested Stacks For This Project

### Full free stack
- [ ] Deploy FE on Vercel Hobby or Netlify Free
- [ ] Deploy API on Render Free (or Railway free trial)
- [ ] Use Neon Free or Supabase Free database
- [ ] Test with Jest + Vitest + Playwright + GitHub Actions

### Starter paid stack
- [ ] Deploy FE on Vercel Pro
- [ ] Deploy API on Railway Pro (or Render paid)
- [ ] Use Neon Launch or Supabase Pro
- [ ] Test with Cypress Cloud Team + BrowserStack

## 6) Official Pricing/Plan Links

- Vercel pricing: https://vercel.com/pricing
- Netlify pricing: https://www.netlify.com/pricing
- Cloudflare Pages pricing: https://developers.cloudflare.com/pages/functions/pricing/
- Render free deploy docs: https://render.com/docs/free
- Railway pricing: https://railway.com/pricing
- Fly.io pricing: https://fly.io/pricing/
- Neon pricing: https://neon.com/pricing
- Supabase billing/plans: https://supabase.com/docs/guides/platform/billing-on-supabase
- GitHub Actions billing: https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions
- Cypress Cloud pricing: https://www.cypress.io/pricing
- Checkly pricing: https://www.checklyhq.com/pricing/
- BrowserStack pricing: https://www.browserstack.com/pricing
- LambdaTest pricing: https://www.lambdatest.com/pricing
- Datadog pricing list: https://www.datadoghq.com/pricing/list/
- New Relic pricing: https://newrelic.com/pricing
