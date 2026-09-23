# MockX deployment guide

## Deployment layout

- **Frontend:** React/Vite static site on Vercel. The checked-in `frontend/web/vercel.json` rewrites client routes to `index.html`.
- **Backend:** Persistent Node web service on Render, defined by the repository-root `render.yaml`. It runs `npm start` (`node src/index.js`), serves Express and Socket.IO from the same long-running process, and exposes `/api/health` for health checks.
- **Database:** MongoDB, configured through the backend's private `MONGODB_URL` environment variable.

The backend must run as a persistent service because it owns Socket.IO connections and recurring background checks. Do not deploy it as a Vercel Function.

## Frontend deployment (Vercel)

Set the Vercel root directory to `frontend/web`, build command to `npm run build`, and output directory to `dist`. The SPA rewrite is already in `vercel.json`.

Set these frontend build variables in Vercel for the current deployment:

- `VITE_API_BASE`: `https://mockx-iv3w.onrender.com` (backend base URL, no trailing slash or `/api` suffix).
- `VITE_SITE_URL`: `https://mock-x.vercel.app` (frontend origin used for canonical/social metadata, `robots.txt`, and `sitemap.xml`).

When the frontend domain changes, update `VITE_SITE_URL` in Vercel plus `FRONTEND_URL` and `ALLOWED_ORIGINS` in Render. When the backend domain changes, update `VITE_API_BASE` in Vercel. These environment values drive URLs; domain changes do not require frontend source edits.

Production frontend builds fail if `VITE_API_BASE` or `VITE_SITE_URL` is absent. Values prefixed with `VITE_` are embedded in public browser code; never put secrets there.

## Backend deployment (Render)

Create the service from the repository's `render.yaml` Blueprint. The service uses `npm ci`, then `npm start`; Render provides `PORT` at runtime. Set these backend environment variables in the Render dashboard:

- `MONGODB_URL`: the environment-specific MongoDB connection string.
- `JWT_SECRET`: a strong, unique secret for this environment.
- `FRONTEND_URL`: `https://mock-x.vercel.app`, used for email login links.
- `ALLOWED_ORIGINS`: `https://mock-x.vercel.app` for the current frontend, or exact frontend origin(s) comma-separated with no paths or trailing slash.
- `NODE_ENV=production` and `APP_ENV=production` for production.

For a separate staging service, use separate database/secrets, set `NODE_ENV=production`, `APP_ENV=staging`, and its own exact `FRONTEND_URL` and `ALLOWED_ORIGINS`. CORS configuration is shared by Express and Socket.IO. Staging/production startup fails if allowed origins are missing.

`WEBSITE_URL` is optional. The backend starts its periodic ping only when this variable is explicitly set; `RELOAD_INTERVAL` optionally sets the interval in milliseconds (default `30000`). Keep-alive pings are not required for a persistent Render service.

## Local development

Copy `backend/env.template` to `backend/.env`, fill in `MONGODB_URL` and `JWT_SECRET`, then start the backend with `npm run dev` from `backend`. It listens on port `10000` by default. Start the frontend with `npm run dev` from `frontend/web`; with no `VITE_API_BASE`, it connects to `http://localhost:10000` and uses `http://localhost:5173` for site metadata.

In development, HTTP localhost origins are allowed on any port. Staging and production allow only origins listed in `ALLOWED_ORIGINS`.