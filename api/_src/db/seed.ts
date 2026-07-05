import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from './index';
import { users, courses, sections, lessons } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { ensureUploadDir, UPLOAD_DIR } from '../lib/videoStorage';

// Real, freely-licensed sample videos (see api/seed-assets/videos/ATTRIBUTION.md)
// copied onto the video storage disk so every seeded lesson has an actual
// playable file behind it — no YouTube, no placeholders.
const SEED_ASSETS_DIR = path.join(process.cwd(), 'seed-assets', 'videos');
const SEED_VIDEOS = ['big-buck-bunny.mp4', 'echo-hereweare.mp4'] as const;

function seedVideoFiles(): { file: string; size: number; mime: string }[] {
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

async function seed() {
  console.log('🌱 Seeding database...');

  // Copy sample lesson videos onto the storage disk and grab their real
  // file size/mime so every lesson below can reference a working video.
  const [videoA, videoB] = seedVideoFiles();
  console.log(`✅ Seed videos ready: ${videoA.file}, ${videoB.file}`);
  const TRAILER_URL = '/videos/big-buck-bunny-trailer.mp4';

  // Create admin user
  const adminHash = await bcrypt.hash('Admin@123456', 12);
  const [admin] = await db
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

  console.log('✅ Admin created:', admin.email);

  // Create student user
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

  // =====================
  // COURSE 1: Complete HTML & CSS Mastery
  // =====================
  const [htmlCourse] = await db
    .insert(courses)
    .values({
      title: 'Complete HTML & CSS Mastery',
      slug: 'complete-html-css-mastery',
      description: `Master HTML and CSS from absolute beginner to advanced level. This comprehensive course covers everything you need to build beautiful, responsive websites. You'll learn semantic HTML5, modern CSS3 features like Flexbox and Grid, animations, and real-world projects.

**What you'll learn:**
- HTML5 semantic elements and document structure
- CSS3 selectors, specificity, and the box model
- Flexbox and CSS Grid for modern layouts
- Responsive design with media queries
- CSS animations and transitions
- Building real-world projects from scratch

Perfect for beginners who want a solid foundation in web development.`,
      shortDescription: 'Learn HTML & CSS from scratch and build beautiful, responsive websites with modern techniques.',
      thumbnail: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&q=80',
      trailerVideoId: TRAILER_URL,
      price: '999',
      instructorId: admin.id,
      difficulty: 'beginner',
      language: 'English',
      tags: ['html', 'css', 'web development', 'frontend'],
      isPublished: true,
      isFeatured: true,
      totalDuration: 240,
    })
    .onConflictDoUpdate({ target: courses.slug, set: { title: 'Complete HTML & CSS Mastery' } })
    .returning();

  // HTML Course Sections
  const [sec1] = await db.insert(sections).values({ courseId: htmlCourse.id, title: 'Getting Started with HTML', order: 1 }).returning();
  const [sec2] = await db.insert(sections).values({ courseId: htmlCourse.id, title: 'CSS Fundamentals', order: 2 }).returning();
  const [sec3] = await db.insert(sections).values({ courseId: htmlCourse.id, title: 'Modern Layouts', order: 3 }).returning();

  await db.insert(lessons).values([
    { sectionId: sec1.id, courseId: htmlCourse.id, title: 'Introduction to Web Development', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 682, order: 1, isPreview: true, description: 'Overview of how the web works and what we will build.' },
    { sectionId: sec1.id, courseId: htmlCourse.id, title: 'HTML Document Structure', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 1423, order: 2, isPreview: false, description: 'Learn the anatomy of an HTML document.' },
    { sectionId: sec1.id, courseId: htmlCourse.id, title: 'HTML Semantic Elements', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 1654, order: 3, isPreview: false, description: 'Semantic HTML5 elements for better structure.' },
    { sectionId: sec2.id, courseId: htmlCourse.id, title: 'CSS Selectors & Specificity', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 1823, order: 4, isPreview: true, description: 'Master CSS selectors and understand specificity.' },
    { sectionId: sec2.id, courseId: htmlCourse.id, title: 'Box Model & Spacing', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 2145, order: 5, isPreview: false, description: 'Deep dive into the CSS box model.' },
    { sectionId: sec3.id, courseId: htmlCourse.id, title: 'CSS Flexbox Complete Guide', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 2456, order: 6, isPreview: false, description: 'Master CSS Flexbox for powerful layouts.' },
    { sectionId: sec3.id, courseId: htmlCourse.id, title: 'CSS Grid Layout', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 2890, order: 7, isPreview: false, description: 'CSS Grid for two-dimensional layouts.' },
  ]);

  // =====================
  // COURSE 2: JavaScript From Zero to Hero
  // =====================
  const [jsCourse] = await db
    .insert(courses)
    .values({
      title: 'JavaScript: From Zero to Hero',
      slug: 'javascript-zero-to-hero',
      description: `The most comprehensive JavaScript course on the internet! Go from a complete beginner to a confident JavaScript developer.

**What you'll learn:**
- JavaScript fundamentals: variables, data types, operators
- Functions, scope, closures, and hoisting
- DOM manipulation and events
- Asynchronous JavaScript: callbacks, promises, async/await
- ES6+ modern features
- Object-Oriented Programming in JavaScript
- Working with APIs and fetch

Build real projects including a weather app, todo list, and more.`,
      shortDescription: 'The complete JavaScript course from beginner to advanced. Master modern JS with 10+ real projects.',
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
      trailerVideoId: TRAILER_URL,
      price: '1299',
      instructorId: admin.id,
      difficulty: 'beginner',
      language: 'English',
      tags: ['javascript', 'js', 'web development', 'frontend', 'es6'],
      isPublished: true,
      isFeatured: true,
      totalDuration: 360,
    })
    .onConflictDoUpdate({ target: courses.slug, set: { title: 'JavaScript: From Zero to Hero' } })
    .returning();

  const [jsSec1] = await db.insert(sections).values({ courseId: jsCourse.id, title: 'JavaScript Basics', order: 1 }).returning();
  const [jsSec2] = await db.insert(sections).values({ courseId: jsCourse.id, title: 'Functions & Scope', order: 2 }).returning();
  const [jsSec3] = await db.insert(sections).values({ courseId: jsCourse.id, title: 'Async JavaScript', order: 3 }).returning();

  await db.insert(lessons).values([
    { sectionId: jsSec1.id, courseId: jsCourse.id, title: 'What is JavaScript?', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 600, order: 1, isPreview: true, description: 'Introduction to JavaScript and how it works in browsers.' },
    { sectionId: jsSec1.id, courseId: jsCourse.id, title: 'Variables: let, const, var', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 1023, order: 2, isPreview: false },
    { sectionId: jsSec1.id, courseId: jsCourse.id, title: 'Data Types & Operators', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 1567, order: 3, isPreview: false },
    { sectionId: jsSec2.id, courseId: jsCourse.id, title: 'Functions Deep Dive', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 1890, order: 4, isPreview: true },
    { sectionId: jsSec2.id, courseId: jsCourse.id, title: 'Closures & Scope', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 2340, order: 5, isPreview: false },
    { sectionId: jsSec3.id, courseId: jsCourse.id, title: 'Promises & Async/Await', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 2890, order: 6, isPreview: false },
    { sectionId: jsSec3.id, courseId: jsCourse.id, title: 'Fetch API & REST APIs', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 2100, order: 7, isPreview: false },
  ]);

  // =====================
  // COURSE 3: React - The Complete Guide
  // =====================
  const [reactCourse] = await db
    .insert(courses)
    .values({
      title: 'React - The Complete Guide 2024',
      slug: 'react-complete-guide-2024',
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
      shortDescription: 'Master React from fundamentals to advanced patterns. Build real apps with hooks, routing, and state management.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
      trailerVideoId: TRAILER_URL,
      price: '1499',
      instructorId: admin.id,
      difficulty: 'intermediate',
      language: 'English',
      tags: ['react', 'javascript', 'frontend', 'hooks', 'jsx'],
      isPublished: true,
      isFeatured: true,
      totalDuration: 480,
    })
    .onConflictDoUpdate({ target: courses.slug, set: { title: 'React - The Complete Guide 2024' } })
    .returning();

  const [reactSec1] = await db.insert(sections).values({ courseId: reactCourse.id, title: 'React Fundamentals', order: 1 }).returning();
  const [reactSec2] = await db.insert(sections).values({ courseId: reactCourse.id, title: 'Hooks in Depth', order: 2 }).returning();
  const [reactSec3] = await db.insert(sections).values({ courseId: reactCourse.id, title: 'State Management', order: 3 }).returning();

  await db.insert(lessons).values([
    { sectionId: reactSec1.id, courseId: reactCourse.id, title: 'What is React & Why Use It?', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 560, order: 1, isPreview: true },
    { sectionId: reactSec1.id, courseId: reactCourse.id, title: 'JSX & Components', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 1234, order: 2, isPreview: false },
    { sectionId: reactSec1.id, courseId: reactCourse.id, title: 'Props & Component Composition', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 1567, order: 3, isPreview: false },
    { sectionId: reactSec2.id, courseId: reactCourse.id, title: 'useState Hook', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 1890, order: 4, isPreview: true },
    { sectionId: reactSec2.id, courseId: reactCourse.id, title: 'useEffect Hook', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 2345, order: 5, isPreview: false },
    { sectionId: reactSec2.id, courseId: reactCourse.id, title: 'Custom Hooks', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 2670, order: 6, isPreview: false },
    { sectionId: reactSec3.id, courseId: reactCourse.id, title: 'Context API', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 2980, order: 7, isPreview: false },
  ]);

  // =====================
  // COURSE 4: Node.js Backend Development
  // =====================
  const [nodeCourse] = await db
    .insert(courses)
    .values({
      title: 'Node.js Backend Development',
      slug: 'nodejs-backend-development',
      description: `Build powerful backend applications with Node.js and Express. Learn server-side JavaScript, REST APIs, databases, authentication, and deployment.

**What you'll learn:**
- Node.js architecture and event loop
- Express.js framework
- RESTful API design
- MongoDB with Mongoose
- Authentication with JWT
- File uploads
- Error handling
- Testing with Jest
- Deployment to production`,
      shortDescription: 'Build scalable REST APIs and backend services with Node.js, Express, and MongoDB.',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
      trailerVideoId: TRAILER_URL,
      price: '1299',
      instructorId: admin.id,
      difficulty: 'intermediate',
      language: 'English',
      tags: ['nodejs', 'express', 'backend', 'api', 'javascript'],
      isPublished: true,
      isFeatured: false,
      totalDuration: 400,
    })
    .onConflictDoUpdate({ target: courses.slug, set: { title: 'Node.js Backend Development' } })
    .returning();

  const [nodeSec1] = await db.insert(sections).values({ courseId: nodeCourse.id, title: 'Node.js Fundamentals', order: 1 }).returning();
  const [nodeSec2] = await db.insert(sections).values({ courseId: nodeCourse.id, title: 'Express.js', order: 2 }).returning();
  const [nodeSec3] = await db.insert(sections).values({ courseId: nodeCourse.id, title: 'Authentication & Security', order: 3 }).returning();

  await db.insert(lessons).values([
    { sectionId: nodeSec1.id, courseId: nodeCourse.id, title: 'What is Node.js?', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 800, order: 1, isPreview: true },
    { sectionId: nodeSec1.id, courseId: nodeCourse.id, title: 'Node.js Modules & npm', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 1200, order: 2, isPreview: false },
    { sectionId: nodeSec2.id, courseId: nodeCourse.id, title: 'Building REST APIs with Express', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 2345, order: 3, isPreview: true },
    { sectionId: nodeSec2.id, courseId: nodeCourse.id, title: 'Middleware & Error Handling', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 1890, order: 4, isPreview: false },
    { sectionId: nodeSec3.id, courseId: nodeCourse.id, title: 'JWT Authentication', videoFile: videoB.file, videoSource: 'upload' as const, videoSize: videoB.size, videoMimeType: videoB.mime, duration: 2670, order: 5, isPreview: false },
    { sectionId: nodeSec3.id, courseId: nodeCourse.id, title: 'Password Hashing & Security', videoFile: videoA.file, videoSource: 'upload' as const, videoSize: videoA.size, videoMimeType: videoA.mime, duration: 1560, order: 6, isPreview: false },
  ]);

  console.log('✅ All courses seeded!');
  console.log('\n📝 Credentials:');
  console.log('Admin: admin@veolms.com / Admin@123456');
  console.log('Student: student@veolms.com / Student@123456');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
