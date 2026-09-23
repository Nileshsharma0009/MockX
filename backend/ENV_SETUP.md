# Backend environment setup

## Local development

From the repository root, copy `backend/env.template` to `backend/.env` and fill in the required database and JWT values. Do not commit `.env` files.

The backend entry point is `backend/src/index.js`. Run it from the backend directory:

```bash
npm install
npm run dev
```

The server listens on `PORT`, defaulting to `10000`. The frontend Vite server defaults to `http://localhost:5173`; its API client uses `http://localhost:10000` when `VITE_API_BASE` is omitted in development.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URL` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | JWT signing secret. Use a different strong value in each environment. |
| `PORT` | No | HTTP port supplied by the host; local default is `10000`. |
| `NODE_ENV` | No | Node runtime mode. Use `development` locally and `production` on staging/production hosts. |
| `APP_ENV` | No | CORS environment: `development`, `staging`, or `production`. If omitted, it follows production status from `NODE_ENV`. |
| `FRONTEND_URL` | Hosted | Frontend origin used to construct email login links. |
| `ALLOWED_ORIGINS` | Staging/production | Exact comma-separated frontend origins, without paths or trailing slashes. Required outside development. |
| `WEBSITE_URL` | No | Enables periodic HTTP keep-alive pings only when set. |
| `RELOAD_INTERVAL` | No | Ping interval in milliseconds; defaults to `30000` when pinging is enabled. |
| `EMAIL_USER`, `EMAIL_PSAS` | No | Existing email settings, if used by the configured integration. |

For local development, `APP_ENV=development` permits HTTP localhost origins on any port, plus origins listed in `ALLOWED_ORIGINS`. Staging and production permit only exact origins in `ALLOWED_ORIGINS`; both Express HTTP and Socket.IO use the same policy.

## Staging and production

Keep staging and production data and secrets separate. Set `NODE_ENV=production` in both hosted environments so Node and authentication cookie behavior remain in production mode. Set `APP_ENV=staging` for staging and `APP_ENV=production` for production. Configure `FRONTEND_URL` and `ALLOWED_ORIGINS` to the exact frontend domain(s) for each environment.

The backend is a persistent Express/Socket.IO service. See the root [deployment guide](../DEPLOYMENT_GUIDE.md) for the Render backend and Vercel frontend setup. The backend deployment does not use Vercel Functions.