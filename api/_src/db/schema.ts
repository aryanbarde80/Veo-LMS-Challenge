import { pgTable, text, integer, boolean, timestamp, decimal, pgEnum, serial, uuid, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['student', 'admin']);
export const lessonTypeEnum = pgEnum('lesson_type', ['video', 'text']);
export const videoSourceEnum = pgEnum('video_source', ['upload', 'youtube']);
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced']);

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  avatar: text('avatar'),
  bio: text('bio'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Refresh tokens for secure auth
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Courses
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  shortDescription: text('short_description').notNull(),
  thumbnail: text('thumbnail').notNull(),
  trailerVideoId: text('trailer_video_id'), // YouTube video ID
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
  instructorId: uuid('instructor_id').references(() => users.id).notNull(),
  difficulty: difficultyEnum('difficulty').notNull().default('beginner'),
  language: text('language').notNull().default('English'),
  tags: text('tags').array(),
  isPublished: boolean('is_published').notNull().default(false),
  isFeatured: boolean('is_featured').notNull().default(false),
  totalDuration: integer('total_duration').notNull().default(0), // in minutes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Course Sections
export const sections = pgTable('sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Lessons
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  videoId: text('video_id'), // YouTube video ID (legacy/optional fallback)
  videoFile: text('video_file'), // filename on self-hosted storage (uploads dir or bucket key)
  videoSource: videoSourceEnum('video_source').notNull().default('upload'),
  videoSize: integer('video_size'), // bytes, used for Range streaming
  videoMimeType: text('video_mime_type'),
  duration: integer('duration').notNull().default(0), // in seconds
  order: integer('order').notNull().default(0),
  type: lessonTypeEnum('type').notNull().default('video'),
  isPreview: boolean('is_preview').notNull().default(false),
  content: text('content'), // for text lessons
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Enrollments
export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  paymentId: text('payment_id'), // Razorpay payment ID
  orderId: text('order_id'), // Razorpay order ID
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull().default('0'),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  // One enrollment per student per course -- also what makes
  // `.onConflictDoNothing()` in the seed script actually do something.
  userCourseUnique: unique().on(table.userId, table.courseId),
}));

// Lesson Progress
export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  watchedSeconds: integer('watched_seconds').notNull().default(0),
  isCompleted: boolean('is_completed').notNull().default(false),
  lastWatchedAt: timestamp('last_watched_at').defaultNow().notNull(),
}, (table) => ({
  // Required for routes/enrollments.ts's `.onConflictDoUpdate({ target:
  // [lessonProgress.userId, lessonProgress.lessonId] })` to work at all --
  // Postgres rejects an ON CONFLICT target that has no matching unique/
  // exclusion constraint. Without this, every single progress-save request
  // (the app's core "resume where you left off" feature) throws.
  userLessonUnique: unique().on(table.userId, table.lessonId),
}));

// Razorpay Orders (pending payments)
export const paymentOrders = pgTable('payment_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  razorpayOrderId: text('razorpay_order_id').notNull().unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),
  status: text('status').notNull().default('pending'), // pending | paid | failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  courses: many(courses),
  refreshTokens: many(refreshTokens),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, { fields: [courses.instructorId], references: [users.id] }),
  sections: many(sections),
  enrollments: many(enrollments),
  lessons: many(lessons),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  course: one(courses, { fields: [sections.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  section: one(sections, { fields: [lessons.sectionId], references: [sections.id] }),
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  progress: many(lessonProgress),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, { fields: [lessonProgress.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
  course: one(courses, { fields: [lessonProgress.courseId], references: [courses.id] }),
}));
