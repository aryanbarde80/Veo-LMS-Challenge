# VeoLMS — Production-Grade Learning Management System

A full-stack, production-ready LMS inspired by Udemy/Coursera — built with TypeScript, Node.js, React, PostgreSQL, and deployed on Render.

## 🚀 Live Demo
**URL:** update this once your Render services are live (see `render.yaml` — Render gives the API a persistent disk, which self-hosted video storage needs; Vercel's serverless filesystem is ephemeral and will not keep uploaded videos).

**Assignment:** [assignment](https://blossom-flyingfish-887.notion.site/VeoLMS-Core-Team-Selection-Challenge-3861c302735180fe9e81f53bdb218f0c)

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin / Instructor | admin@veolms.com | Admin@123456 |
| Admin / Instructor | priya@veolms.com | Admin@123456 |
| Student | student@veolms.com | Student@123456 |

---

## 🏗️ Architecture

### Tech Stack
| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Vite + React 18 + TypeScript | Fast builds, great DX, type safety |
| Styling | Tailwind CSS v4 | Utility-first, zero runtime CSS |
| State | Zustand + TanStack Query | Lightweight global state + server caching |
| Backend | Express.js + TypeScript | Familiar, flexible, great ecosystem |
| ORM | Drizzle ORM | Lightweight, type-safe, edge-compatible |
| Database | PostgreSQL on Neon | Serverless Postgres, generous free tier |
| Payments | Razorpay | Indian market standard, test mode available |
| Deployment | Vercel (single repo) | Serverless, zero ops, global CDN |
| Video | Custom HTML5 player + self-hosted storage | Full control, no third-party embeds, gated by signed tokens |

### Monorepo Structure
```
Veo-LMS-Challenge/
├── frontend/          # Vite React TypeScript app
│   └── src/
│       ├── pages/     # Route-level components
│       ├── components/ # Reusable UI
│       ├── store/     # Zustand auth store
│       ├── lib/       # API client, utils
│       └── types/     # TypeScript interfaces
├── api/               # Express.js serverless API
│   └── src/
│       ├── routes/    # auth, courses, payments, enrollments
│       ├── middleware/ # JWT auth, role-based access
│       └── db/        # Drizzle schema + seed
├── vercel.json        # Unified deployment config
└── README.md
```

---

## 🔐 Security Implementation

### Authentication
- **JWT Access Tokens** (15min expiry) + **Refresh Tokens** (30 days, stored in DB)
- **Token Rotation** — each refresh issues a new refresh token and invalidates the old one
- **bcrypt** with cost factor 12 for password hashing
- **Rate limiting** on auth endpoints (10 req/15min)

### Authorization
- Role-based access control (Student | Admin)
- `authenticate` middleware validates JWT on every protected route
- `requireAdmin` guards all admin routes
- Course content (videoIds) hidden for non-enrolled users in API responses — not just UI

### Payment Security
- **HMAC-SHA256 signature verification** for every Razorpay callback (critical — prevents fake payments)
- Enrollment only created AFTER server-side signature verification
- Idempotency check prevents double enrollment
- Payment orders tracked in DB to detect replay attacks

### Input Validation
- **Zod schemas** on all API inputs — never trusts client data
- Helmet.js for security headers (XSS, content sniffing, etc.)
- Global rate limiting (200 req/15min per IP)

---

## 💰 Cost Optimization

### Estimated Monthly Cost: ~₹0–₹2,500 (depends on video storage/bandwidth usage)

| Service | Cost | Why |
|---------|------|-----|
| Render (API, web service) | Free tier / $25 Pro | Persistent disk keeps uploaded videos across restarts (Vercel can't do this) |
| Render (frontend, static) | Free | Static Vite build, global CDN |
| Neon PostgreSQL | Free tier, then usage-based | Serverless Postgres, scales to zero when idle |
| Video storage (Render disk) | Included up to 1GB, then ~₹/GB | Self-hosted MP4s streamed via Range requests, gated by signed tokens |
| Total | **~₹0–₹500/month at small scale** | Grows with number/size of uploaded lesson videos |

### Key Cost Decisions
- **Self-hosted video, not YouTube** — full control over access (enrollment-gated streaming), no ads, no third-party branding, no dependency on an external platform's embed policies
- **Render persistent disk** — unlike Vercel's ephemeral filesystem, uploaded videos actually survive restarts and redeploys here
- **Neon serverless Postgres** — auto-suspends when idle, free tier covers early-stage
- **Signed, short-lived streaming tokens** — video files are never served or linked to the public directly; every stream request is authorized per-user, per-lesson
- **Trade-off, on purpose**: self-hosting costs a little more than "free" YouTube embeds, but this is a real LMS feature (private paid content, resume-from-position, no ads/recommendations pulling students away) — see the `videoStorage.ts` module for the documented upgrade path to S3/R2 if video volume grows significantly

---

## ✨ Features

### Public (No Auth)
- [x] Browse all courses with search + difficulty filter
- [x] Course detail pages with curriculum, instructor info, trailer
- [x] Preview lessons (marked free)
- [x] Responsive design — mobile, tablet, desktop

### Student
- [x] Signup / Login / Logout
- [x] Secure JWT auth with refresh token rotation
- [x] Course enrollment (Razorpay test payments + free courses)
- [x] Dashboard: enrolled courses, progress, recent activity
- [x] Video player with progress saving (auto-saves every 10s)
- [x] Resume playback from last watched position
- [x] Lesson completion tracking
- [x] Navigate between lessons with keyboard-friendly controls

### Admin
- [x] Create / Edit / Delete courses
- [x] Publish/Unpublish courses
- [x] Manage sections and lessons (upload video files directly, no third-party IDs)
- [x] View all students
- [x] View all enrollments with revenue
- [x] Stats dashboard (students, courses, revenue)

### Video Player
- [x] Custom-built HTML5 `<video>` player — no YouTube/Vimeo embed, no third-party branding or recommendations
- [x] Signed, short-lived per-lesson streaming tokens + Range-request streaming (seek works properly on large files)
- [x] Progress saving (10s intervals + on unmount)
- [x] Resume from exact position
- [x] Playback speed control (0.5x – 2x)
- [x] Completion detection (>90% watched = complete)
- [x] Picture-in-picture, fullscreen, keyboard shortcuts (space/K play, ←/→ seek, F fullscreen, M mute)
- [x] Responsive 16:9 aspect ratio

---

## 🗄️ Database Design

```sql
users           -- id, name, email, passwordHash, role (student|admin)
refresh_tokens  -- userId, token, expiresAt (for secure auth)
courses         -- title, slug, description, price, difficulty, ...
sections        -- courseId, title, order
lessons         -- sectionId, courseId, videoFile (self-hosted, streamed), isPreview, ...
enrollments     -- userId, courseId, paymentId, amountPaid
payment_orders  -- tracks Razorpay orders (pending → paid)
lesson_progress -- userId, lessonId, watchedSeconds, isCompleted
```

---

## 🚢 Deployment

### Vercel — everything in one deploy (recommended for a quick, single-platform setup)
The whole app (frontend + API) deploys as a single Vercel project — see
`vercel.json`. The API is exactly **one** Serverless Function
(`api/index.ts`), so this fits comfortably on the free Hobby plan's 12-function
limit; all the Express route/db/lib code lives under `api/_src/`, and the
underscore prefix tells Vercel not to treat those files as separate functions.

1. Import the repo into Vercel — it auto-detects `vercel.json` and builds the
   frontend (`frontend/dist`) plus the one API function
2. Set these env vars on the project (Project Settings → Environment Variables):
   ```
   DATABASE_URL=postgresql://...        # from Neon
   JWT_SECRET=<min 32 chars>
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   FRONTEND_URL=https://your-project.vercel.app
   ```
3. Deploy. That's it — **no manual `db:push` / `db:seed` step needed.**
   `vercel.json`'s install command runs `api/scripts/vercel-db-setup.sh`,
   which pushes the schema and seeds the full demo catalog (9 courses, 3
   real streamed videos, enrollments) automatically on every deploy, as
   long as `DATABASE_URL` is set. It's safe to run on every deploy — the
   seed script upserts/replaces instead of duplicating (see `db/seed.ts`).
   If `DATABASE_URL` isn't set yet, this step just logs a warning and skips
   itself instead of failing the whole build; add the env var and redeploy.
4. The two seeded demo videos (`api/seed-assets/videos`) are bundled
   directly into the function via `includeFiles` in `vercel.json`, so the
   demo lessons stream and play with zero extra setup.

**One real limitation, worth knowing:** Vercel Functions have a read-only
filesystem outside `/tmp`. The seeded demo videos always work (they ship with
the deployment), but a *new* video uploaded through the admin panel after
that won't reliably survive past the current invocation — there's no
persistent disk to save it to. Everything else (auth, courses, enrollments,
payments, progress tracking, the admin dashboard) works exactly the same as
any other host. If you outgrow this, `api/_src/lib/videoStorage.ts` documents
the swap to Cloudflare R2/S3 for uploads that actually persist.

### Render — if you need real, persistent video uploads
Render gives the API service an actual persistent disk, so admin-uploaded
videos survive restarts and redeploys (not just the seeded demo ones). See
`render.yaml` at the repo root.

1. Push this repo to GitHub, then in Render: **New → Blueprint**, point it at
   the repo — `render.yaml` defines both services automatically
2. Set the same secret env vars as above, when Render prompts for them
3. Deploy both services. The API gets a 1GB persistent disk mounted at
   `uploads/videos` — bump the size in `render.yaml` as your library grows
4. Update `FRONTEND_URL` (API service) and `VITE_API_URL` (frontend service)
   once you know each service's real `.onrender.com` URL, then redeploy

### Database Setup (Neon)
> On Vercel this happens automatically on every deploy (see step 3 above) --
> this section is for Render, or running these commands manually/locally.
1. Create a free Neon project
2. Copy connection string to `DATABASE_URL`
3. Run `cd api && npm run db:push` to create tables
4. Run `cd api && npm run db:seed` to populate demo data. This creates:
   - **9 published courses** across HTML/CSS, JavaScript, React, Node.js,
     TypeScript, Python, MongoDB, Next.js, and Docker — each with 3 sections
     and 6-8 real lessons (64 lessons total), taught by two instructor
     accounts (`admin@veolms.com`, `priya@veolms.com`, both `Admin@123456`)
   - **3 real, freely-licensed sample videos** (see
     `api/seed-assets/videos/ATTRIBUTION.md`) copied onto the video storage
     disk and cycled across every lesson, so each one actually streams
     through the app's own custom player — nothing is embedded, nothing is
     a placeholder. Replace them with real recordings any time via the
     admin "Upload video" flow.
   - **A demo student** (`student@veolms.com` / `Student@123456`) enrolled
     in 4 of the 9 courses with realistic, varied progress — one fully
     completed, others partway through — so the dashboard and
     "continue watching" UI have real data to show immediately.
   - Safe to run more than once: it upserts by slug/email and cleanly
     replaces each course's sections/lessons instead of duplicating them.

---

## 🧪 API Reference

```
POST /api/auth/signup      — Register new user
POST /api/auth/login       — Login, get tokens
POST /api/auth/refresh     — Rotate refresh token
POST /api/auth/logout      — Invalidate refresh token
GET  /api/auth/me          — Get current user

GET  /api/courses          — List courses (public, ?search=&featured=)
GET  /api/courses/:slug    — Course detail + curriculum (public)
POST /api/courses          — Create course (admin)
PUT  /api/courses/:id      — Update course (admin)
DELETE /api/courses/:id    — Delete course (admin)

POST /api/sections         — Add section (admin)
POST /api/sections/lessons — Add lesson (admin)

POST /api/payments/create-order  — Initiate Razorpay payment
POST /api/payments/verify        — Verify + create enrollment

GET  /api/enrollments/my         — My enrolled courses + progress
POST /api/enrollments/progress   — Update lesson progress
GET  /api/enrollments/progress/:courseId — Get course progress
GET  /api/enrollments/recent     — Recently watched lessons
GET  /api/enrollments/all        — All enrollments (admin)

GET  /api/admin/stats      — Dashboard stats (admin)
GET  /api/admin/students   — All students (admin)
```

---

## 🔮 Bonus / Future: HLS Streaming & Object Storage
Today, video is self-hosted MP4 on a persistent disk (Render), streamed via HTTP
Range requests behind a signed, short-lived per-lesson token — see
`api/_src/lib/videoStorage.ts`. That's a deliberately simple, working baseline.
If video volume grows enough that a single disk becomes limiting, the upgrade
path is:
- Move storage from the Render disk to **Cloudflare R2** or **S3** (both speak
  the S3 API — `videoStorage.ts` is the only file that needs to change)
- Process with **FFmpeg on a temporary worker** (shut down after processing) to
  generate adaptive-bitrate **HLS** playlists instead of single-file MP4
- Deliver via a CDN in front of the bucket, still behind signed URLs
- Estimated cost at that point: ~₹200–500/month depending on storage/bandwidth

This was intentionally deferred — a single self-hosted MP4 per lesson is enough
for this stage, and avoids the complexity (and third-party dependency) of a full
video pipeline before it's actually needed.

---

Built with ❤️ for VeoLMS Core Team Challenge
