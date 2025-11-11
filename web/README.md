# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deployment & Production Notes

Follow these steps to prepare and deploy the app to production.

1. Install dependencies and build

```powershell
cd web
npm install
npm run build
```

2. Environment variables

Create a local file named `.env.local` (do NOT commit this file) with any secrets or production URLs. Example:

```
VITE_SHEET_URL=https://your-google-sheet-url-here
```

Add `VITE_SHEET_URL` (and any other secrets) to your hosting platform's environment variables for production.

3. Preview production build

```powershell
npm run preview
```

4. Deploying

- Vercel: set Build Command = `npm run build`, Output Directory = `dist`. Add environment variables in project settings.
- Netlify: set Build Command = `npm run build`, Publish directory = `dist`. Add environment variables in Site settings.

5. Optional CI/CD

If you want automated deploys, add a GitHub Actions workflow or use your hosting provider's integration. Make sure secrets are stored in the provider's secret manager (Vercel, Netlify, GitHub Secrets, etc.).

If you'd like I can add an example GitHub Actions workflow for building and deploying to Netlify or a Vercel configuration.
