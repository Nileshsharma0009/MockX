# Quick backend setup

1. Copy `env.template` to `.env` inside the backend directory.
2. Set `MONGODB_URL` and a strong `JWT_SECRET`. For Razorpay checkout, also set the single-product payment variables documented in [ENV_SETUP.md](./ENV_SETUP.md); keep `PAYMENTS_ENABLED=false` until configured.
3. Keep `APP_ENV=development` and `NODE_ENV=development` locally. The backend defaults to port `10000`; the Vite frontend defaults to port `5173`.
4. Start the server with `npm run dev`.

For staging and production variables, deployment setup, CORS origins, and the optional `WEBSITE_URL` ping, follow [ENV_SETUP.md](./ENV_SETUP.md) and the root [deployment guide](../DEPLOYMENT_GUIDE.md). Do not commit local environment files or put private credentials in frontend `VITE_*` variables.
