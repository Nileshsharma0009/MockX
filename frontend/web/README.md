# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deployment & Production Notes

The frontend is a Vite static site. For Vercel, set the root directory to this folder, build command to `npm run build`, and output directory to `dist`; `vercel.json` contains the SPA route rewrite.

Set `VITE_API_BASE` to the backend's public base URL and `VITE_SITE_URL` to the frontend's public origin for every production build. Neither value should include a trailing slash. The frontend adds `/api` for HTTP requests and uses the API base for Socket.IO; the site URL drives canonical/social metadata, `robots.txt`, and `sitemap.xml`. Production builds fail if either variable is missing. For local development, the shared API configuration defaults to `http://localhost:10000` and site metadata uses `http://localhost:5173`.

Only public URLs/configuration belong in `VITE_*` variables because Vite embeds those values in client-side code. Never put credentials or private API keys in frontend environment variables. See the repository [deployment guide](../../DEPLOYMENT_GUIDE.md) for backend setup.