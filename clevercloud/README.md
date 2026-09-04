# Clever Cloud Deployment Guide (Alternative)

This guide covers deploying the **backend API** on Clever Cloud with a Clever Cloud
MySQL add-on. The current production deployment uses **Render** for the API
(`https://saith-babeth-tss.onrender.com`) and **Clever Cloud MySQL** as the
shared database — this guide is for an alternative all-in-one Clever Cloud setup.

## 1. Deploy the `server/` folder

In the Clever Cloud dashboard:
- **Repository**: https://github.com/niyonsabaemery3-coder/CPEC_Saint_Babeth_Secondary_School
- **Run directory**: `server` (or leave as root if you prefer)
- **Start command**: `npm start` (default)
- **Environment**: Node.js v20 (set via `runtime.txt` → `nodejs-20.x`)

## 2. Environment Variables

Set these in **Environment > Environment variables**:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | `9f2c4a7e1b08d6f3a5e2c9b4d7a1f8e6c3b0a9d2e5f8c1a4b7d0e3f6a9c2b5e8` |
| `CORS_ORIGIN` | Your frontend's origin (e.g. GitHub Pages URL or Render URL) |
| `PUBLIC_API_URL` | The public URL of this API |

**Important**: Do NOT set `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, or `DB_NAME` manually.
Clever Cloud injects `MYSQL_ADDON_*` variables automatically when you attach a MySQL add-on.
The server auto-detects these and configures the connection pool with `connectionLimit: 4`
to stay within Clever Cloud's shared MySQL limits.

## 3. Initialize the Database

The `post-deploy.sh` script runs automatically after deployment. It will:

```bash
npm run db:init                   # creates tables (CREATE TABLE IF NOT EXISTS)
npm run db:migrate-registration   # adds registration columns to existing databases
npm run db:seed                   # inserts demo admin + demo teacher/student accounts
```

The server also runs a lightweight startup migration on every boot, so existing
databases created before the self-registration feature will auto-migrate even
without `post-deploy.sh`.

## 4. Verify

- Health check: `https://<your-app>.clevercloud.app/api/health`
- Admin login: `admin` / `admin123`

## 5. Frontend (GitHub Pages or Render)

Deploy the frontend from the repository root via the GitHub Actions workflow
(`.github/workflows/deploy.yml`). Set the repository variable `VITE_API_URL`
to your API's public URL:
- Render: `https://saith-babeth-tss.onrender.com`
- Clever Cloud: `https://<your-app>.clevercloud.app`
