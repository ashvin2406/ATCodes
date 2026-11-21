# ATCodes — Production Deployment, Security & Maintenance Guide

This document provides complete instructions for deploying, securing, maintaining, and recovering the ATCodes platform in production.

---

## 1. Hosting Architecture Overview

```
                      [ User Browser / Device ]
                                 │
                 ┌───────────────┴───────────────┐
                 │ HTTPS (TLS 1.3 / Cloudflare)  │
                 ▼                               ▼
       https://atcodes.in              https://api.atcodes.in
   ┌────────────────────────┐      ┌─────────────────────────────┐
   │    Static Frontend     │      │     Backend Node.js API     │
   │ (Vercel/Netlify/Pages) │      │  (Render / Railway / AWS)   │
   │                        │      │                             │
   │  - HTML5, CSS3, ES6 JS │      │  - Express.js, Helmet       │
   │  - Responsive UI       │─────▶│  - Rate Limiter, CORS       │
   │  - Theme Switcher      │ AJAX │  - HTTP-only Cookies        │
   │  - robots.txt / 404    │      │  - Trust Proxy Enabled      │
   └────────────────────────┘      └──────────────┬──────────────┘
                                                  │
                                                  │ TLS Mongoose Pool (min: 5, max: 50)
                                                  ▼
                                   ┌─────────────────────────────┐
                                   │     MongoDB Atlas (Cloud)   │
                                   │  - Replica Set (M0 / M10)   │
                                   │  - Automated Snapshots      │
                                   │  - Compound Indexes         │
                                   └─────────────────────────────┘
```

---

## 2. Step-by-Step Deployment Instructions

### Option A: Frontend on Vercel & Backend on Render (Recommended)

#### Backend Deployment (Render):
1. Create a free account on [Render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your Git repository (`ATCodes`).
4. Set the service settings:
   - **Name:** `atcodes-backend`
   - **Root Directory:** (leave blank or set to repository root)
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install --production`
   - **Start Command:** `node backend/server.js`
   - **Health Check Path:** `/api/health`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster0.ydzffho.mongodb.net/atcodes?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<generated-secure-random-64-char-string>`
   - `FRONTEND_URL`: `https://atcodes.in`
   - `COOKIE_DOMAIN`: `.atcodes.in` (or leave blank if testing on default onrender.com subdomains)
   - `COOKIE_SAME_SITE`: `none` (if frontend & backend have completely different domains) or `lax` (if on same root domain e.g. `atcodes.in` and `api.atcodes.in`)
   - `CORS_ORIGINS`: `https://atcodes.in,https://www.atcodes.in`
6. Click **Create Web Service**. Wait for the build and deployment to succeed. Test `https://<your-service>.onrender.com/api/health` returning `{"status":"ok"}`.

#### Frontend Deployment (Vercel):
1. Create an account on [Vercel.com](https://vercel.com).
2. Import the Git repository (`ATCodes`).
3. Set **Root Directory** to `frontend` (or keep root with included `vercel.json`).
4. Framework Preset: **Other**.
5. Build Command: (leave empty, it is static files).
6. Output Directory: (leave empty or set to `.`).
7. Deploy!
8. Configure API Base URL:
   - If hosting backend at a custom domain, set `window.__ATCODES_API_BASE__ = 'https://api.atcodes.in'` in `frontend/js/api.js` or via script injection.

---

## 3. Custom Domain Setup (`atcodes.in`)

To connect a custom domain (e.g., `atcodes.in` purchased from GoDaddy, Namecheap, Hostinger, or Cloudflare):

### DNS Configuration Table:
| Type | Name / Host | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **A** | `@` | Vercel / Netlify IP (e.g., `76.76.21.21`) | Apex Frontend |
| **CNAME** | `www` | `cname.vercel-dns.com` | WWW Frontend redirect |
| **CNAME** | `api` | `atcodes-backend.onrender.com` | Backend REST API |

### SSL / TLS Certificates:
- Both Vercel and Render automatically provision free, auto-renewing Let's Encrypt SSL/TLS certificates once DNS propagates (usually 5–30 minutes).

---

## 4. MongoDB Atlas Production Security & Maintenance

### 1. Network Access (Firewall):
- For dynamic serverless / PaaS providers (Render, Railway, Vercel), add `0.0.0.0/0` (Allow Access from Anywhere) under **Network Access** in MongoDB Atlas.
- Ensure the database user has a strong 32+ character alphanumeric password.
- Assign the `readWrite` role only to the `atcodes` database.

### 2. Automated Daily Snapshots:
- Atlas enables Continuous Cloud Backups. Verify under **Cluster > Backup**.
- Retention: Minimum 7 days of daily snapshots.

### 3. Manual Backup with `mongodump`:
```bash
# Export full database dump
mongodump --uri="mongodb+srv://<username>:<password>@cluster0.ydzffho.mongodb.net/atcodes" --out="./backups/$(date +%Y-%m-%d)"
```

### 4. Database Restoration with `mongorestore`:
```bash
# Restore from a backup directory
mongorestore --uri="mongodb+srv://<username>:<password>@cluster0.ydzffho.mongodb.net/atcodes" --drop "./backups/2026-11-21/atcodes"
```

---

## 5. Security Audit Checklist

- [x] **Password Hashing:** Implemented with `bcryptjs` (salt rounds: 10). Plaintext passwords are never saved.
- [x] **Cookie Security:** `httpOnly: true`, `secure: isProduction`, customizable `sameSite` and `domain`.
- [x] **Rate Limiting:** Global API limiter (1000 requests per 15 min), strict Auth limiter (15 login/register attempts per 15 min).
- [x] **HTTP Headers:** `helmet` configured with Content Security Policy, Frameguard, and XSS protection.
- [x] **CORS:** Controlled whitelist matching `CORS_ORIGINS` and `FRONTEND_URL`.
- [x] **Error Shielding:** `errorHandler.js` intercepts all 500 exceptions, logs details on server, and returns generic messages without stack traces in production.
- [x] **SEO Privacy:** `<meta name="robots" content="noindex, nofollow">` present on all 15 teacher and student private portal pages. `frontend/robots.txt` disallows `/teacher/`, `/student/`, and `/api/`.

---

## 6. File & Image Storage: Roadmap & Extension Guide

Currently, ATCodes stores code snippets, text instructions, submission answers, and ChatGPT lesson content directly in MongoDB documents using efficient schema design and compound indexes.

**Future Extension for Binary / Media Uploads:**
- Large files (PDF assignments, user avatars, screen recordings) should **not** be stored directly inside MongoDB documents (to avoid the 16MB BSON document limit).
- **Recommended Solution:** Cloud Object Storage (AWS S3, Cloudflare R2, or Cloudinary).
- **Architecture:**
  1. Frontend requests pre-signed upload URL from `POST /api/uploads/presign`.
  2. Frontend uploads directly to AWS S3 bucket.
  3. Frontend sends metadata (S3 URL, key, fileSize, mimeType) to `POST /api/student/assignments/:id/submit`.
  4. Teacher views/downloads files directly from secure S3 pre-signed CDN links.

---

## 7. Disaster Recovery & Rollback Checklist

1. **Service Outage / Crash:**
   - Check Render / Railway live logs for uncaught exceptions.
   - Verify MongoDB Atlas cluster metrics (connection count, CPU, RAM).
   - Test `/api/health` endpoint.
2. **Bad Release Rollback:**
   - In Render: Go to **Deploys** tab > Select previous successful build > Click **Rollback**.
   - In Vercel: Go to **Deployments** > Select previous working deployment > Click **Instant Rollback**.
3. **Database Corruption / Accidental Deletion:**
   - Open Atlas Console > **Backup** > **Restore**.
   - Select point-in-time snapshot prior to incident.
   - Restore to a new cluster or overwrite target collection.
