import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from './index';
import { users, courses, sections, lessons, enrollments, lessonProgress } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { ensureUploadDir, UPLOAD_DIR } from '../lib/videoStorage';

// ---------------------------------------------------------------------------
// Real, freely-licensed sample videos (see api/seed-assets/videos/ATTRIBUTION.md)
// copied onto the video storage disk so every seeded lesson has an actual
// playable file behind it — no YouTube, no placeholders, nothing embedded.
// Streamed through the app's own custom <video> player + signed-token
// streaming route, same as any real uploaded lesson video would be.
// ---------------------------------------------------------------------------
const SEED_ASSETS_DIR = path.join(process.cwd(), 'seed-assets', 'videos');
const SEED_VIDEOS = ['big-buck-bunny.mp4', 'echo-hereweare.mp4', 'tears-of-steel.mp4'] as const;
const TRAILERS = ['/videos/big-buck-bunny-trailer.mp4', '/videos/tears-of-steel-trailer.mp4'] as const;

type SeedVideo = { file: string; size: number; mime: string };

function seedVideoFiles(): SeedVideo[] {
  ensureUploadDir();
  return SEED_VIDEOS.map((name) => {
    const src = path.join(SEED_ASSETS_DIR, name);
    const dest = path.join(UPLOAD_DIR, name);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
    return { file: name, size: fs.statSync(dest).size, mime: 'video/mp4' };
  });
}

// ---------------------------------------------------------------------------
// Course catalog — data-driven so adding a course/section/lesson is just
// adding an entry below, instead of hand-writing repetitive insert calls.
// ---------------------------------------------------------------------------
type LessonSeed = { title: string; duration: number; isPreview?: boolean; description?: string };
type SectionSeed = { title: string; lessons: LessonSeed[] };
type CourseSeed = {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  price: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  isFeatured?: boolean;
  instructor: 'anurag' | 'priya';
  sections: SectionSeed[];
};

const CATALOG: CourseSeed[] = [
  {
    title: 'Complete HTML & CSS Mastery',
    slug: 'complete-html-css-mastery',
    instructor: 'anurag',
    difficulty: 'beginner',
    price: '999',
    isFeatured: true,
    tags: ['html', 'css', 'web development', 'frontend'],
    thumbnail: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&q=80',
    shortDescription: 'Learn HTML & CSS from scratch and build beautiful, responsive websites with modern techniques.',
    description: `Master HTML and CSS from absolute beginner to advanced level. This comprehensive course covers everything you need to build beautiful, responsive websites. You'll learn semantic HTML5, modern CSS3 features like Flexbox and Grid, animations, and real-world projects.

**What you'll learn:**
- HTML5 semantic elements and document structure
- CSS3 selectors, specificity, and the box model
- Flexbox and CSS Grid for modern layouts
- Responsive design with media queries
- CSS animations and transitions
- Building real-world projects from scratch

Perfect for beginners who want a solid foundation in web development.`,
    sections: [
      {
        title: 'Getting Started with HTML',
        lessons: [
          { title: 'Introduction to Web Development', duration: 682, isPreview: true, description: 'Overview of how the web works and what we will build.' },
          { title: 'HTML Document Structure', duration: 1423, description: 'Learn the anatomy of an HTML document.' },
          { title: 'HTML Semantic Elements', duration: 1654, description: 'Semantic HTML5 elements for better structure.' },
        ],
      },
      {
        title: 'CSS Fundamentals',
        lessons: [
          { title: 'CSS Selectors & Specificity', duration: 1823, isPreview: true, description: 'Master CSS selectors and understand specificity.' },
          { title: 'Box Model & Spacing', duration: 2145, description: 'Deep dive into the CSS box model.' },
        ],
      },
      {
        title: 'Modern Layouts',
        lessons: [
          { title: 'CSS Flexbox Complete Guide', duration: 2456, description: 'Master CSS Flexbox for powerful layouts.' },
          { title: 'CSS Grid Layout', duration: 2890, description: 'CSS Grid for two-dimensional layouts.' },
          { title: 'Responsive Design & Media Queries', duration: 1980, description: 'Make your layouts adapt to any screen size.' },
        ],
      },
    ],
  },
  {
    title: 'JavaScript: From Zero to Hero',
    slug: 'javascript-zero-to-hero',
    instructor: 'anurag',
    difficulty: 'beginner',
    price: '1199',
    isFeatured: true,
    tags: ['javascript', 'programming', 'web development', 'frontend'],
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
    shortDescription: 'Go from zero to confident JavaScript developer with hands-on projects and real-world patterns.',
    description: `Learn JavaScript the right way — from core language fundamentals through the async patterns and browser APIs you'll actually use on the job.

**What you'll learn:**
- Variables, data types, and operators
- Functions, closures, and scope
- The DOM and event handling
- Promises, async/await, and the Fetch API
- Modern ES6+ syntax and best practices

By the end, you'll be comfortable building real, interactive web applications.`,
    sections: [
      {
        title: 'JavaScript Basics',
        lessons: [
          { title: 'What is JavaScript?', duration: 600, isPreview: true, description: 'Introduction to JavaScript and how it works in browsers.' },
          { title: 'Variables: let, const, var', duration: 1023 },
          { title: 'Data Types & Operators', duration: 1567 },
        ],
      },
      {
        title: 'Functions & Scope',
        lessons: [
          { title: 'Functions Deep Dive', duration: 1890, isPreview: true },
          { title: 'Closures & Scope', duration: 2340 },
        ],
      },
      {
        title: 'Async JavaScript',
        lessons: [
          { title: 'Promises & Async/Await', duration: 2890 },
          { title: 'Fetch API & REST APIs', duration: 2100 },
        ],
      },
    ],
  },
  {
    title: 'React - The Complete Guide 2024',
    slug: 'react-complete-guide-2024',
    instructor: 'anurag',
    difficulty: 'intermediate',
    price: '1499',
    isFeatured: true,
    tags: ['react', 'javascript', 'frontend', 'hooks', 'jsx'],
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    shortDescription: 'Master React from fundamentals to advanced patterns. Build real apps with hooks, routing, and state management.',
    description: `Dive deep into React, the world's most popular JavaScript library! This course covers everything from basics to advanced patterns.

**What you'll learn:**
- React fundamentals: JSX, components, props
- State management with useState and useReducer
- Side effects with useEffect
- React Router for navigation
- Context API for global state
- Custom hooks
- Performance optimization
- Integration with REST APIs

Build production-ready applications using modern React patterns.`,
    sections: [
      {
        title: 'React Fundamentals',
        lessons: [
          { title: 'What is React & Why Use It?', duration: 560, isPreview: true },
          { title: 'JSX & Components', duration: 1234 },
          { title: 'Props & Component Composition', duration: 1567 },
        ],
      },
      {
        title: 'Hooks in Depth',
        lessons: [
          { title: 'useState Hook', duration: 1890, isPreview: true },
          { title: 'useEffect Hook', duration: 2345 },
          { title: 'Custom Hooks', duration: 2670 },
        ],
      },
      {
        title: 'State Management',
        lessons: [
          { title: 'Context API', duration: 2980 },
          { title: 'useReducer for Complex State', duration: 2210 },
        ],
      },
    ],
  },
  {
    title: 'Node.js Backend Development',
    slug: 'nodejs-backend-development',
    instructor: 'anurag',
    difficulty: 'intermediate',
    price: '1299',
    tags: ['nodejs', 'express', 'backend', 'api', 'javascript'],
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    shortDescription: 'Build scalable REST APIs and backend services with Node.js, Express, and modern tooling.',
    description: `Build powerful backend applications with Node.js and Express. Learn server-side JavaScript, REST APIs, databases, authentication, and deployment.

**What you'll learn:**
- Node.js architecture and event loop
- Express.js framework
- RESTful API design
- Authentication with JWT
- File uploads & streaming
- Error handling
- Deployment to production`,
    sections: [
      {
        title: 'Node.js Fundamentals',
        lessons: [
          { title: 'What is Node.js?', duration: 800, isPreview: true },
          { title: 'Node.js Modules & npm', duration: 1200 },
        ],
      },
      {
        title: 'Express.js',
        lessons: [
          { title: 'Building REST APIs with Express', duration: 2345, isPreview: true },
          { title: 'Middleware & Error Handling', duration: 1890 },
        ],
      },
      {
        title: 'Authentication & Security',
        lessons: [
          { title: 'JWT Authentication', duration: 2670 },
          { title: 'Password Hashing & Security', duration: 1560 },
        ],
      },
    ],
  },
  {
    title: 'TypeScript for Professional Developers',
    slug: 'typescript-for-professional-developers',
    instructor: 'anurag',
    difficulty: 'intermediate',
    price: '1399',
    tags: ['typescript', 'javascript', 'programming'],
    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80',
    shortDescription: 'Write safer, more maintainable JavaScript with TypeScript — types, generics, and real project patterns.',
    description: `Learn TypeScript the way it's actually used in production codebases — not just "JavaScript with types", but the patterns that make large codebases maintainable.

**What you'll learn:**
- The type system: interfaces, unions, generics
- Configuring tsconfig for real projects
- Typing React components and API responses
- Utility types and advanced patterns
- Migrating a JavaScript codebase to TypeScript`,
    sections: [
      {
        title: 'TypeScript Fundamentals',
        lessons: [
          { title: 'Why TypeScript?', duration: 540, isPreview: true },
          { title: 'Basic Types & Type Inference', duration: 1340 },
          { title: 'Interfaces & Type Aliases', duration: 1580 },
        ],
      },
      {
        title: 'Intermediate Types',
        lessons: [
          { title: 'Union & Intersection Types', duration: 1720, isPreview: true },
          { title: 'Generics', duration: 2100 },
        ],
      },
      {
        title: 'TypeScript in Real Projects',
        lessons: [
          { title: 'Typing React Props & State', duration: 2260 },
          { title: 'Utility Types (Partial, Pick, Omit)', duration: 1890 },
        ],
      },
    ],
  },
  {
    title: 'Python Programming for Beginners',
    slug: 'python-programming-for-beginners',
    instructor: 'priya',
    difficulty: 'beginner',
    price: '899',
    isFeatured: true,
    tags: ['python', 'programming', 'beginner'],
    thumbnail: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&q=80',
    shortDescription: 'Your first step into programming — learn Python from scratch with hands-on, practical examples.',
    description: `A gentle, thorough introduction to programming using Python — one of the most beginner-friendly and widely used languages in the world.

**What you'll learn:**
- Variables, data types, and control flow
- Functions and modules
- Working with lists, dictionaries, and files
- Object-oriented programming basics
- Building small real-world scripts`,
    sections: [
      {
        title: 'Python Basics',
        lessons: [
          { title: 'Installing Python & Your First Script', duration: 620, isPreview: true },
          { title: 'Variables & Data Types', duration: 1180 },
          { title: 'Control Flow: if/else & Loops', duration: 1540 },
        ],
      },
      {
        title: 'Functions & Data Structures',
        lessons: [
          { title: 'Writing Functions', duration: 1420, isPreview: true },
          { title: 'Lists, Tuples & Dictionaries', duration: 1980 },
          { title: 'Working with Files', duration: 1350 },
        ],
      },
      {
        title: 'Object-Oriented Python',
        lessons: [
          { title: 'Classes & Objects', duration: 2040 },
          { title: 'Building a Small Project', duration: 2510 },
        ],
      },
    ],
  },
  {
    title: 'MongoDB & Database Design Fundamentals',
    slug: 'mongodb-database-design-fundamentals',
    instructor: 'priya',
    difficulty: 'beginner',
    price: '1099',
    tags: ['mongodb', 'database', 'backend', 'nosql'],
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
    shortDescription: 'Design solid database schemas and work confidently with MongoDB in real applications.',
    description: `Learn how to actually design a database, not just write queries — schema design, indexing, and how to use MongoDB effectively in real applications.

**What you'll learn:**
- Document modeling vs. relational modeling
- CRUD operations & the aggregation pipeline
- Indexing for performance
- Schema design patterns and common pitfalls
- Connecting MongoDB to a Node.js app`,
    sections: [
      {
        title: 'Database Design Basics',
        lessons: [
          { title: 'SQL vs NoSQL: Choosing the Right Fit', duration: 780, isPreview: true },
          { title: 'Document Modeling Fundamentals', duration: 1450 },
        ],
      },
      {
        title: 'MongoDB Essentials',
        lessons: [
          { title: 'CRUD Operations', duration: 1690, isPreview: true },
          { title: 'The Aggregation Pipeline', duration: 2230 },
        ],
      },
      {
        title: 'Performance & Patterns',
        lessons: [
          { title: 'Indexing for Performance', duration: 1920 },
          { title: 'Common Schema Design Patterns', duration: 2080 },
        ],
      },
    ],
  },
  {
    title: 'Next.js & Full-Stack React Development',
    slug: 'nextjs-fullstack-react-development',
    instructor: 'priya',
    difficulty: 'advanced',
    price: '1799',
    isFeatured: true,
    tags: ['nextjs', 'react', 'fullstack', 'ssr'],
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80',
    shortDescription: 'Build production-grade full-stack applications with Next.js — routing, data fetching, and deployment.',
    description: `Take your React skills full-stack with Next.js. Learn server-side rendering, the App Router, data fetching patterns, and how to ship a real production app.

**What you'll learn:**
- The App Router: layouts, pages, and routing
- Server components vs client components
- Data fetching & caching strategies
- API routes and full-stack patterns
- Deploying a production Next.js app`,
    sections: [
      {
        title: 'Next.js Fundamentals',
        lessons: [
          { title: 'Why Next.js Over Plain React?', duration: 640, isPreview: true },
          { title: 'The App Router: Pages & Layouts', duration: 1780 },
          { title: 'Server vs Client Components', duration: 2020 },
        ],
      },
      {
        title: 'Data & APIs',
        lessons: [
          { title: 'Data Fetching & Caching', duration: 2160, isPreview: true },
          { title: 'Building API Routes', duration: 1940 },
        ],
      },
      {
        title: 'Shipping to Production',
        lessons: [
          { title: 'Environment Config & Secrets', duration: 1260 },
          { title: 'Deploying a Full-Stack Next.js App', duration: 1870 },
        ],
      },
    ],
  },
  {
    title: 'Docker & DevOps Essentials',
    slug: 'docker-devops-essentials',
    instructor: 'priya',
    difficulty: 'advanced',
    price: '1599',
    tags: ['docker', 'devops', 'containers', 'ci-cd'],
    thumbnail: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800&q=80',
    shortDescription: 'Containerize and ship applications confidently with Docker, plus the CI/CD basics every developer needs.',
    description: `Stop being afraid of "it works on my machine." Learn Docker fundamentals and the CI/CD basics that let you ship applications the same way every time.

**What you'll learn:**
- Docker images, containers, and volumes
- Writing a proper Dockerfile
- Docker Compose for multi-service apps
- Basics of CI/CD pipelines
- Deploying containerized apps`,
    sections: [
      {
        title: 'Docker Fundamentals',
        lessons: [
          { title: 'Why Containers?', duration: 590, isPreview: true },
          { title: 'Images, Containers & Volumes', duration: 1650 },
          { title: 'Writing Your First Dockerfile', duration: 2010 },
        ],
      },
      {
        title: 'Multi-Service Apps',
        lessons: [
          { title: 'Docker Compose Basics', duration: 1880, isPreview: true },
          { title: 'Networking Between Containers', duration: 1540 },
        ],
      },
      {
        title: 'CI/CD & Deployment',
        lessons: [
          { title: 'CI/CD Pipeline Basics', duration: 1990 },
          { title: 'Deploying Containers to Production', duration: 2150 },
        ],
      },
    ],
  },
];

async function seed() {
  console.log('🌱 Seeding database...');

  // Copy sample lesson videos onto the storage disk (or confirm the bundled
  // seed-assets fallback is in place) and grab their real size/mime so every
  // lesson below can reference something actually streamable.
  const seedVideos = seedVideoFiles();
  console.log(`✅ Seed videos ready: ${seedVideos.map((v) => v.file).join(', ')}`);

  // Create instructor/admin users
  const adminHash = await bcrypt.hash('Admin@123456', 12);
  const [anurag] = await db
    .insert(users)
    .values({
      name: 'Anurag Singh',
      email: 'admin@veolms.com',
      passwordHash: adminHash,
      role: 'admin',
      bio: 'Full-stack developer and educator. Creator of VeoLMS.',
      avatar: 'https://avatars.githubusercontent.com/u/31401827',
    })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Anurag Singh' } })
    .returning();
  console.log('✅ Admin created:', anurag.email);

  const priyaHash = await bcrypt.hash('Admin@123456', 12);
  const [priya] = await db
    .insert(users)
    .values({
      name: 'Priya Sharma',
      email: 'priya@veolms.com',
      passwordHash: priyaHash,
      role: 'admin',
      bio: 'Backend engineer and instructor, focused on Python, databases, and DevOps.',
      avatar: 'https://i.pravatar.cc/300?img=47',
    })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Priya Sharma' } })
    .returning();
  console.log('✅ Second instructor created:', priya.email);

  // Create demo student
  const studentHash = await bcrypt.hash('Student@123456', 12);
  const [student] = await db
    .insert(users)
    .values({
      name: 'Demo Student',
      email: 'student@veolms.com',
      passwordHash: studentHash,
      role: 'student',
    })
    .onConflictDoUpdate({ target: users.email, set: { name: 'Demo Student' } })
    .returning();
  console.log('✅ Student created:', student.email);

  const instructorFor = (who: 'anurag' | 'priya') => (who === 'anurag' ? anurag : priya);

  // A running counter drives which of the 3 real videos + 2 trailers each
  // course/lesson gets, so content is varied instead of every lesson reusing
  // the same single file.
  let videoCounter = 0;
  let trailerCounter = 0;
  const nextVideo = (): SeedVideo => seedVideos[videoCounter++ % seedVideos.length];
  const nextTrailer = (): string => TRAILERS[trailerCounter++ % TRAILERS.length];

  const createdCourses: { id: string; slug: string }[] = [];

  for (const courseSeed of CATALOG) {
    const totalSeconds = courseSeed.sections.reduce(
      (sum, sec) => sum + sec.lessons.reduce((s, l) => s + l.duration, 0),
      0
    );

    const [course] = await db
      .insert(courses)
      .values({
        title: courseSeed.title,
        slug: courseSeed.slug,
        description: courseSeed.description,
        shortDescription: courseSeed.shortDescription,
        thumbnail: courseSeed.thumbnail,
        trailerVideoId: nextTrailer(),
        price: courseSeed.price,
        instructorId: instructorFor(courseSeed.instructor).id,
        difficulty: courseSeed.difficulty,
        language: 'English',
        tags: courseSeed.tags,
        isPublished: true,
        isFeatured: !!courseSeed.isFeatured,
        totalDuration: Math.round(totalSeconds / 60),
      })
      .onConflictDoUpdate({ target: courses.slug, set: { title: courseSeed.title } })
      .returning();

    createdCourses.push({ id: course.id, slug: course.slug });

    // Re-running `db:seed` re-upserts the course row (by slug) but sections/
    // lessons have no natural unique key to upsert against -- delete this
    // course's existing sections first (cascades to lessons) so re-seeding
    // replaces content instead of duplicating it every time.
    await db.delete(sections).where(eq(sections.courseId, course.id));

    let order = 0;
    for (const [sIdx, sectionSeed] of courseSeed.sections.entries()) {
      const [section] = await db
        .insert(sections)
        .values({ courseId: course.id, title: sectionSeed.title, order: sIdx + 1 })
        .returning();

      for (const lessonSeed of sectionSeed.lessons) {
        order += 1;
        const video = nextVideo();
        await db.insert(lessons).values({
          sectionId: section.id,
          courseId: course.id,
          title: lessonSeed.title,
          description: lessonSeed.description,
          videoFile: video.file,
          videoSource: 'upload' as const,
          videoSize: video.size,
          videoMimeType: video.mime,
          duration: lessonSeed.duration,
          order,
          isPreview: !!lessonSeed.isPreview,
        });
      }
    }

    console.log(`✅ Course seeded: ${course.title} (${courseSeed.sections.reduce((s, sec) => s + sec.lessons.length, 0)} lessons)`);
  }

  // ---------------------------------------------------------------------
  // Enroll the demo student in a few courses with realistic, varied
  // progress, so the student dashboard / continue-watching UI has
  // something real to show instead of an empty state.
  // ---------------------------------------------------------------------
  const bySlug = (slug: string) => createdCourses.find((c) => c.slug === slug)!;

  const enrollmentPlan: { slug: string; amountPaid: string; completed: boolean }[] = [
    { slug: 'complete-html-css-mastery', amountPaid: '999', completed: true },
    { slug: 'react-complete-guide-2024', amountPaid: '1499', completed: false },
    { slug: 'python-programming-for-beginners', amountPaid: '899', completed: false },
    { slug: 'nextjs-fullstack-react-development', amountPaid: '1799', completed: false },
  ];

  for (const plan of enrollmentPlan) {
    const course = bySlug(plan.slug);
    const [insertedEnrollment] = await db
      .insert(enrollments)
      .values({
        userId: student.id,
        courseId: course.id,
        paymentId: `pay_seed_${course.id.slice(0, 8)}`,
        orderId: `order_seed_${course.id.slice(0, 8)}`,
        amountPaid: plan.amountPaid,
        completedAt: plan.completed ? new Date() : null,
      })
      .onConflictDoNothing({ target: [enrollments.userId, enrollments.courseId] })
      .returning();

    // Re-running `db:seed` always deletes+recreates this course's lessons
    // above (fresh UUIDs each time), which cascades away any lesson_progress
    // tied to the old lesson rows -- even when the enrollment itself already
    // existed and was skipped above. So progress always needs rebuilding
    // here, regardless of whether the enrollment insert was a no-op.
    if (!insertedEnrollment) {
      console.log(`↺ Enrollment already existed for "${course.slug}" -- rebuilding its lesson progress for the current lessons`);
    }

    const courseLessons = await db.select().from(lessons).where(eq(lessons.courseId, course.id));
    courseLessons.sort((a, b) => a.order - b.order);

    if (plan.completed) {
      // Fully watched every lesson.
      for (const lesson of courseLessons) {
        await db.insert(lessonProgress).values({
          userId: student.id,
          lessonId: lesson.id,
          courseId: course.id,
          watchedSeconds: lesson.duration,
          isCompleted: true,
        });
      }
    } else {
      // Partial, realistic progress: finish roughly the first third of the
      // course, then leave one lesson half-watched so "continue watching"
      // has something meaningful to resume.
      const finishThrough = Math.max(1, Math.floor(courseLessons.length / 3));
      for (let i = 0; i < courseLessons.length; i++) {
        const lesson = courseLessons[i];
        if (i < finishThrough) {
          await db.insert(lessonProgress).values({
            userId: student.id,
            lessonId: lesson.id,
            courseId: course.id,
            watchedSeconds: lesson.duration,
            isCompleted: true,
          });
        } else if (i === finishThrough) {
          await db.insert(lessonProgress).values({
            userId: student.id,
            lessonId: lesson.id,
            courseId: course.id,
            watchedSeconds: Math.round(lesson.duration * 0.4),
            isCompleted: false,
          });
        }
        // Lessons after that stay untouched — genuinely "not started yet".
      }
    }

    console.log(`✅ Enrolled student in "${course.slug}" (${plan.completed ? 'completed' : 'in progress'})`);
  }

  console.log('\n🎉 Seed complete!');
  console.log(`   ${createdCourses.length} courses, ${enrollmentPlan.length} student enrollments`);
  console.log('\n📝 Credentials:');
  console.log('Admin:              admin@veolms.com / Admin@123456');
  console.log('Second instructor:  priya@veolms.com / Admin@123456');
  console.log('Student:            student@veolms.com / Student@123456');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
