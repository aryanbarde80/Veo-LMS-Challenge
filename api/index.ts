import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

import authRoutes from './src/routes/auth';
import coursesRoutes from './src/routes/courses';
import sectionsRoutes from './src/routes/sections';
import paymentsRoutes from './src/routes/payments';
import enrollmentsRoutes from './src/routes/enrollments';
import adminRoutes from './src/routes/admin';

const app = express();

app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://veo-lms-challenge.vercel.app',
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health check — tells you exactly what env vars are missing ───────────────
app.get('/api/health', async (_req, res) => {
  const checks: Record<string, boolean | string> = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
  };

  // Quick DB ping
  let dbOk = false;
  try {
    const { db } = await import('./src/db/index');
    const { users } = await import('./src/db/schema');
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`SELECT 1`);
    dbOk = true;
  } catch (e: any) {
    checks.db_error = e.message?.slice(0, 120) || 'unknown';
  }

  checks.db_connected = dbOk;

  const allOk = dbOk && !!process.env.DATABASE_URL && !!process.env.JWT_SECRET;
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// ─── Seed endpoint — run once to populate the DB ─────────────────────────────
// Protected by SEED_SECRET env var. Call with:
//   POST /api/seed  body: { "secret": "<your SEED_SECRET>" }
app.post('/api/seed', async (req, res) => {
  try {
    const SEED_SECRET = process.env.SEED_SECRET;
    if (!SEED_SECRET) {
      return res.status(403).json({ error: 'SEED_SECRET env var not set on this deployment.' });
    }
    if (req.body?.secret !== SEED_SECRET) {
      return res.status(403).json({ error: 'Invalid seed secret.' });
    }

    const { db } = await import('./src/db/index');
    const { users, courses, sections, lessons } = await import('./src/db/schema');
    const bcrypt = (await import('bcryptjs')).default;

    // ── Users ─────────────────────────────────────────────────────────────────
    const adminHash = await bcrypt.hash('Admin@123456', 12);
    const [admin] = await db.insert(users).values({
      name: 'Anurag Singh',
      email: 'admin@veolms.com',
      passwordHash: adminHash,
      role: 'admin',
      bio: 'Full-stack developer and educator. Creator of VeoLMS.',
      avatar: 'https://avatars.githubusercontent.com/u/31401827',
    }).onConflictDoUpdate({ target: users.email, set: { name: 'Anurag Singh' } }).returning();

    const studentHash = await bcrypt.hash('Student@123456', 12);
    const [student] = await db.insert(users).values({
      name: 'Demo Student',
      email: 'student@veolms.com',
      passwordHash: studentHash,
      role: 'student',
    }).onConflictDoUpdate({ target: users.email, set: { name: 'Demo Student' } }).returning();

    // ── Free MP4 video URLs (Google public test bucket — HTTPS, range-request OK) ──
    const V = {
      intro:   'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      basics:  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      inter:   'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      adv:     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      proj:    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      deep:    'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      final:   'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
      bonus:   'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    };

    // ── Course 1: HTML & CSS ───────────────────────────────────────────────────
    const [htmlCourse] = await db.insert(courses).values({
      title: 'Complete HTML & CSS Mastery',
      slug: 'complete-html-css-mastery',
      description: `Master HTML and CSS from absolute beginner to advanced level.\n\nWhat you will learn:\n- HTML5 semantic elements and document structure\n- CSS selectors, specificity, and the box model\n- Flexbox and CSS Grid for modern layouts\n- Responsive design with media queries\n- CSS animations and transitions\n- Real-world projects from scratch`,
      shortDescription: 'Learn HTML & CSS from scratch and build beautiful, responsive websites.',
      thumbnail: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&q=80',
      trailerVideoId: V.intro,
      price: '999',
      instructorId: admin.id,
      difficulty: 'beginner',
      language: 'English',
      tags: ['HTML5 semantic structure', 'CSS Flexbox & Grid', 'Responsive design', 'CSS animations', 'Box model mastery', 'Real-world projects'],
      isPublished: true,
      isFeatured: true,
      totalDuration: 240,
    }).onConflictDoUpdate({ target: courses.slug, set: { title: 'Complete HTML & CSS Mastery' } }).returning();

    const [h1] = await db.insert(sections).values({ courseId: htmlCourse.id, title: 'Getting Started with HTML', order: 1 }).returning();
    const [h2] = await db.insert(sections).values({ courseId: htmlCourse.id, title: 'CSS Fundamentals', order: 2 }).returning();
    const [h3] = await db.insert(sections).values({ courseId: htmlCourse.id, title: 'Modern Layouts', order: 3 }).returning();
    await db.insert(lessons).values([
      { sectionId: h1.id, courseId: htmlCourse.id, title: 'Introduction to Web Development', videoId: V.intro, duration: 960, order: 1, isPreview: true, description: 'Overview of how the web works.' },
      { sectionId: h1.id, courseId: htmlCourse.id, title: 'HTML Document Structure', videoId: V.basics, duration: 1200, order: 2, isPreview: false, description: 'Anatomy of an HTML document.' },
      { sectionId: h1.id, courseId: htmlCourse.id, title: 'HTML Semantic Elements', videoId: V.inter, duration: 1500, order: 3, isPreview: false, description: 'Semantic HTML5 elements for better structure.' },
      { sectionId: h2.id, courseId: htmlCourse.id, title: 'CSS Selectors & Specificity', videoId: V.adv, duration: 1800, order: 4, isPreview: true, description: 'Master CSS selectors.' },
      { sectionId: h2.id, courseId: htmlCourse.id, title: 'Box Model & Spacing', videoId: V.proj, duration: 1440, order: 5, isPreview: false, description: 'Deep dive into the CSS box model.' },
      { sectionId: h3.id, courseId: htmlCourse.id, title: 'CSS Flexbox Complete Guide', videoId: V.deep, duration: 2400, order: 6, isPreview: false, description: 'Master CSS Flexbox.' },
      { sectionId: h3.id, courseId: htmlCourse.id, title: 'CSS Grid Layout', videoId: V.final, duration: 2880, order: 7, isPreview: false, description: 'CSS Grid for two-dimensional layouts.' },
    ]).onConflictDoNothing();

    // ── Course 2: JavaScript ───────────────────────────────────────────────────
    const [jsCourse] = await db.insert(courses).values({
      title: 'JavaScript: From Zero to Hero',
      slug: 'javascript-zero-to-hero',
      description: `The most comprehensive JavaScript course! Go from complete beginner to confident JS developer.\n\nWhat you will learn:\n- Variables, data types, operators\n- Functions, scope, closures, hoisting\n- DOM manipulation and events\n- Async JS: callbacks, promises, async/await\n- ES6+ modern features\n- Working with APIs and fetch`,
      shortDescription: 'The complete JavaScript course from beginner to advanced. Master modern JS with real projects.',
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
      trailerVideoId: V.intro,
      price: '1299',
      instructorId: admin.id,
      difficulty: 'beginner',
      language: 'English',
      tags: ['Variables & data types', 'Functions & closures', 'DOM manipulation', 'Async/Await & Promises', 'ES6+ features', 'Fetch API & REST'],
      isPublished: true,
      isFeatured: true,
      totalDuration: 360,
    }).onConflictDoUpdate({ target: courses.slug, set: { title: 'JavaScript: From Zero to Hero' } }).returning();

    const [j1] = await db.insert(sections).values({ courseId: jsCourse.id, title: 'JavaScript Basics', order: 1 }).returning();
    const [j2] = await db.insert(sections).values({ courseId: jsCourse.id, title: 'Functions & Scope', order: 2 }).returning();
    const [j3] = await db.insert(sections).values({ courseId: jsCourse.id, title: 'Async JavaScript', order: 3 }).returning();
    await db.insert(lessons).values([
      { sectionId: j1.id, courseId: jsCourse.id, title: 'What is JavaScript?', videoId: V.intro, duration: 600, order: 1, isPreview: true, description: 'Introduction to JS and how it runs in browsers.' },
      { sectionId: j1.id, courseId: jsCourse.id, title: 'Variables: let, const, var', videoId: V.basics, duration: 1020, order: 2, isPreview: false },
      { sectionId: j1.id, courseId: jsCourse.id, title: 'Data Types & Operators', videoId: V.inter, duration: 1560, order: 3, isPreview: false },
      { sectionId: j2.id, courseId: jsCourse.id, title: 'Functions Deep Dive', videoId: V.adv, duration: 1890, order: 4, isPreview: true },
      { sectionId: j2.id, courseId: jsCourse.id, title: 'Closures & Scope', videoId: V.proj, duration: 2340, order: 5, isPreview: false },
      { sectionId: j3.id, courseId: jsCourse.id, title: 'Promises & Async/Await', videoId: V.deep, duration: 2880, order: 6, isPreview: false },
      { sectionId: j3.id, courseId: jsCourse.id, title: 'Fetch API & REST APIs', videoId: V.final, duration: 2100, order: 7, isPreview: false },
    ]).onConflictDoNothing();

    // ── Course 3: React ────────────────────────────────────────────────────────
    const [reactCourse] = await db.insert(courses).values({
      title: 'React - The Complete Guide 2025',
      slug: 'react-complete-guide-2025',
      description: `Dive deep into React, the world's most popular UI library!\n\nWhat you will learn:\n- React fundamentals: JSX, components, props\n- State with useState and useReducer\n- Side effects with useEffect\n- React Router for navigation\n- Context API for global state\n- Custom hooks\n- Performance optimization\n- REST API integration`,
      shortDescription: 'Master React from fundamentals to advanced patterns. Build real apps with hooks, routing, and state management.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
      trailerVideoId: V.intro,
      price: '1499',
      instructorId: admin.id,
      difficulty: 'intermediate',
      language: 'English',
      tags: ['JSX & Components', 'useState & useReducer', 'useEffect & side effects', 'React Router', 'Context API', 'Custom Hooks'],
      isPublished: true,
      isFeatured: true,
      totalDuration: 480,
    }).onConflictDoUpdate({ target: courses.slug, set: { title: 'React - The Complete Guide 2025' } }).returning();

    const [r1] = await db.insert(sections).values({ courseId: reactCourse.id, title: 'React Fundamentals', order: 1 }).returning();
    const [r2] = await db.insert(sections).values({ courseId: reactCourse.id, title: 'Hooks in Depth', order: 2 }).returning();
    const [r3] = await db.insert(sections).values({ courseId: reactCourse.id, title: 'State Management', order: 3 }).returning();
    await db.insert(lessons).values([
      { sectionId: r1.id, courseId: reactCourse.id, title: 'What is React & Why Use It?', videoId: V.intro, duration: 560, order: 1, isPreview: true },
      { sectionId: r1.id, courseId: reactCourse.id, title: 'JSX & Components', videoId: V.basics, duration: 1230, order: 2, isPreview: false },
      { sectionId: r1.id, courseId: reactCourse.id, title: 'Props & Composition', videoId: V.inter, duration: 1560, order: 3, isPreview: false },
      { sectionId: r2.id, courseId: reactCourse.id, title: 'useState Hook', videoId: V.adv, duration: 1890, order: 4, isPreview: true },
      { sectionId: r2.id, courseId: reactCourse.id, title: 'useEffect Hook', videoId: V.proj, duration: 2340, order: 5, isPreview: false },
      { sectionId: r2.id, courseId: reactCourse.id, title: 'Custom Hooks', videoId: V.deep, duration: 2670, order: 6, isPreview: false },
      { sectionId: r3.id, courseId: reactCourse.id, title: 'Context API', videoId: V.final, duration: 2980, order: 7, isPreview: false },
    ]).onConflictDoNothing();

    // ── Course 4: Node.js ──────────────────────────────────────────────────────
    const [nodeCourse] = await db.insert(courses).values({
      title: 'Node.js Backend Development',
      slug: 'nodejs-backend-development',
      description: `Build powerful backend applications with Node.js and Express.\n\nWhat you will learn:\n- Node.js architecture and event loop\n- Express.js framework\n- RESTful API design\n- MongoDB with Mongoose\n- Authentication with JWT\n- File uploads and error handling\n- Testing with Jest\n- Deployment to production`,
      shortDescription: 'Build scalable REST APIs and backend services with Node.js, Express, and MongoDB.',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
      trailerVideoId: V.intro,
      price: '1299',
      instructorId: admin.id,
      difficulty: 'intermediate',
      language: 'English',
      tags: ['Node.js event loop', 'Express.js framework', 'RESTful API design', 'JWT Authentication', 'Error handling', 'API deployment'],
      isPublished: true,
      isFeatured: false,
      totalDuration: 400,
    }).onConflictDoUpdate({ target: courses.slug, set: { title: 'Node.js Backend Development' } }).returning();

    const [n1] = await db.insert(sections).values({ courseId: nodeCourse.id, title: 'Node.js Fundamentals', order: 1 }).returning();
    const [n2] = await db.insert(sections).values({ courseId: nodeCourse.id, title: 'Express.js', order: 2 }).returning();
    const [n3] = await db.insert(sections).values({ courseId: nodeCourse.id, title: 'Auth & Security', order: 3 }).returning();
    await db.insert(lessons).values([
      { sectionId: n1.id, courseId: nodeCourse.id, title: 'What is Node.js?', videoId: V.intro, duration: 800, order: 1, isPreview: true },
      { sectionId: n1.id, courseId: nodeCourse.id, title: 'Node.js Modules & npm', videoId: V.basics, duration: 1200, order: 2, isPreview: false },
      { sectionId: n2.id, courseId: nodeCourse.id, title: 'Building REST APIs with Express', videoId: V.inter, duration: 2340, order: 3, isPreview: true },
      { sectionId: n2.id, courseId: nodeCourse.id, title: 'Middleware & Error Handling', videoId: V.adv, duration: 1890, order: 4, isPreview: false },
      { sectionId: n3.id, courseId: nodeCourse.id, title: 'JWT Authentication', videoId: V.proj, duration: 2670, order: 5, isPreview: false },
      { sectionId: n3.id, courseId: nodeCourse.id, title: 'Password Hashing & Security', videoId: V.deep, duration: 1560, order: 6, isPreview: false },
    ]).onConflictDoNothing();

    return res.json({
      ok: true,
      message: 'Database seeded successfully.',
      credentials: {
        admin: { email: 'admin@veolms.com', password: 'Admin@123456' },
        student: { email: 'student@veolms.com', password: 'Student@123456' },
      },
      courses: [htmlCourse.title, jsCourse.title, reactCourse.title, nodeCourse.title],
    });
  } catch (err: any) {
    console.error('Seed error:', err);
    return res.status(500).json({ error: 'Seed failed', detail: err.message?.slice(0, 200) });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
