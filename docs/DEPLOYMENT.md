# Deployment Guide

NoTrace uses a split deployment model for production: the frontend is deployed to edge networks (like Vercel), and the backend (API, Database, Redis) is deployed to containerized platforms (like Railway).

## 1. Backend Deployment (Railway)

We recommend [Railway.app](https://railway.app) for the backend because it natively supports PostgreSQL, Redis, and Node.js in a single project network.

### Steps
1. Create a new Railway Project.
2. Add a **PostgreSQL** database.
3. Add a **Redis** instance.
4. Link your GitHub repository. Railway will detect the monorepo.
5. In the Railway settings for the API service:
   - **Root Directory:** `/`
   - **Build Command:** `pnpm run db:generate && pnpm --filter @anonymous-chat/api build`
   - **Start Command:** `pnpm --filter @anonymous-chat/api start`

### Environment Variables (Backend)
Set these in your Railway API service variables:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://... # Copy from Railway Postgres
REDIS_URL=redis://...          # Copy from Railway Redis
JWT_ACCESS_SECRET=generate_a_long_random_string
JWT_REFRESH_SECRET=generate_another_random_string
COOKIE_SECRET=generate_a_third_random_string
FRONTEND_URL=https://notrace.vercel.app # Your frontend URL
```

## 2. Frontend Deployment (Vercel)

The Next.js frontend is best deployed on [Vercel](https://vercel.com).

### Steps
1. Go to Vercel and import your GitHub repository.
2. In the project settings, set:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
3. Add Environment Variables:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.up.railway.app
```
4. Click Deploy.

## 3. PWA (Google Play Store via TWA)

NoTrace is fully configured as a Progressive Web App (PWA). To deploy it to the Google Play Store:

1. Ensure the Vercel web app is live.
2. Go to [PWABuilder.com](https://pwabuilder.com).
3. Enter your Vercel URL.
4. Generate the Android App Bundle (AAB).
5. Extract the SHA256 fingerprint from the generated package.
6. Update `apps/web/public/.well-known/assetlinks.json` in your codebase with the fingerprint.
7. Commit, push, and wait for Vercel to redeploy.
8. Upload the AAB to the Google Play Console.
