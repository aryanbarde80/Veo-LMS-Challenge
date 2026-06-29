# VeoLMS — Production-Grade Learning Management System

A full-stack, production-ready LMS inspired by Udemy/Coursera — built with TypeScript, Node.js, React, PostgreSQL, and deployed on Vercel.

## 🚀 Live Demo
**URL:** [https://veo-lms-challenge.vercel.app](https://veo-lms-challenge.vercel.app)

**Assignment:** [assignment](https://blossom-flyingfish-887.notion.site/VeoLMS-Core-Team-Selection-Challenge-3861c302735180fe9e81f53bdb218f0c)

### Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@veolms.com | Admin@123456 |
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
| Video | YouTube Embed API | Zero storage cost, global CDN, reliable |

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

### Estimated Monthly Cost: ~₹0–₹500

| Service | Cost | Why |
|---------|------|-----|
| Vercel (Hobby) | Free | Serverless, no always-on servers |
| Neon PostgreSQL | Free tier | 0.5GB storage, serverless Postgres |
| YouTube Embed | Free | Zero storage, zero bandwidth cost |
| Total | **~₹0/month** | |

### Key Cost Decisions
- **YouTube for videos** — eliminates S3/R2 storage costs ($0 vs ~$23/GB/month on S3)
- **Vercel serverless** — pay per invocation, not per hour. No EC2/ECS overhead
- **Neon serverless Postgres** — auto-suspends when idle, free tier covers early-stage
- **No video processing pipeline** — no FFmpeg workers, no Lambda, no transcoding cost
- **No CDN needed** — YouTube already delivers video via Google's global CDN

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
- [x] Manage sections and lessons (add YouTube video IDs)
- [x] View all students
- [x] View all enrollments with revenue
- [x] Stats dashboard (students, courses, revenue)

### Video Player
- [x] YouTube IFrame API integration
- [x] Progress saving (10s intervals + on unmount)
- [x] Resume from exact position
- [x] Playback speed control (0.5x – 2x)
- [x] Completion detection (>90% watched = complete)
- [x] Responsive 16:9 aspect ratio

---

## 🗄️ Database Design

```sql
users           -- id, name, email, passwordHash, role (student|admin)
refresh_tokens  -- userId, token, expiresAt (for secure auth)
courses         -- title, slug, description, price, difficulty, ...
sections        -- courseId, title, order
lessons         -- sectionId, courseId, videoId (YouTube), isPreview, ...
enrollments     -- userId, courseId, paymentId, amountPaid
payment_orders  -- tracks Razorpay orders (pending → paid)
lesson_progress -- userId, lessonId, watchedSeconds, isCompleted
```

---

## 🚢 Deployment

### Vercel Setup
1. Connect GitHub repo to Vercel
2. Set environment variables:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=<min 32 chars>
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Deploy — Vercel auto-routes `/api/*` to serverless functions

### Database Setup (Neon)
1. Create a free Neon project
2. Copy connection string to `DATABASE_URL`
3. Run `cd api && npm run db:push` to create tables
4. Run `cd api && npm run db:seed` to populate demo data

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

## 🔮 Bonus / Future: HLS Streaming
If video hosting is needed (private content), the upgrade path would be:
- Upload MP4 to **Cloudflare R2** (free egress)
- Process with **FFmpeg on a temporary worker** (shut down after processing)
- Generate HLS playlists and deliver via **Cloudflare CDN**
- Use **signed URLs** (time-limited) to prevent hotlinking
- Cost: ~₹200-500/month depending on storage

This was intentionally deferred — YouTube delivers the same quality at zero cost for public educational content.

---

Built with ❤️ for VeoLMS Core Team Challenge
