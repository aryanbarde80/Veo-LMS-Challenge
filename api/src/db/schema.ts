import { pgTable, text, integer, boolean, timestamp, decimal, pgEnum, serial, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['student', 'admin']);
export const lessonTypeEnum = pgEnum('lesson_type', ['video', 'text']);
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
  videoId: text('video_id'), // YouTube video ID
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
});

// Lesson Progress
export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  watchedSeconds: integer('watched_seconds').notNull().default(0),
  isCompleted: boolean('is_completed').notNull().default(false),
  lastWatchedAt: timestamp('last_watched_at').defaultNow().notNull(),
});

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

// PDF Documents
export const pdfDocuments = pgTable('pdf_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  sectionId: uuid('section_id').references(() => sections.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileUrl: text('file_url').notNull(),
  pageCount: integer('page_count').notNull().default(0),
  wordCount: integer('word_count').notNull().default(0),
  readingTimeMinutes: integer('reading_time_minutes').notNull().default(0),
  keywordTags: text('keyword_tags').array(),
  language: text('language').notNull().default('English'),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// PDF Analytics/Metrics
export const pdfAnalytics = pgTable('pdf_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  pdfId: uuid('pdf_id').references(() => pdfDocuments.id, { onDelete: 'cascade' }).notNull(),
  totalViews: integer('total_views').notNull().default(0),
  totalDownloads: integer('total_downloads').notNull().default(0),
  averageReadingTime: integer('average_reading_time').notNull().default(0),
  engagementScore: decimal('engagement_score', { precision: 5, scale: 2 }).notNull().default('0'),
  sentimentScore: decimal('sentiment_score', { precision: 5, scale: 2 }),
  readabilityIndex: decimal('readability_index', { precision: 5, scale: 2 }),
  lastAnalyzedAt: timestamp('last_analyzed_at').defaultNow().notNull(),
});

// PDF User Interactions
export const pdfViews = pgTable('pdf_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  pdfId: uuid('pdf_id').references(() => pdfDocuments.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  viewedPages: integer('viewed_pages').array().notNull().default([]),
  totalTimeSpent: integer('total_time_spent').notNull().default(0),
  completionPercentage: integer('completion_percentage').notNull().default(0),
  lastViewedAt: timestamp('last_viewed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const pdfDocumentsRelations = relations(pdfDocuments, ({ one, many }) => ({
  course: one(courses, { fields: [pdfDocuments.courseId], references: [courses.id] }),
  section: one(sections, { fields: [pdfDocuments.sectionId], references: [sections.id] }),
  uploadedByUser: one(users, { fields: [pdfDocuments.uploadedBy], references: [users.id] }),
  analytics: one(pdfAnalytics),
  views: many(pdfViews),
}));

export const pdfAnalyticsRelations = relations(pdfAnalytics, ({ one }) => ({
  pdf: one(pdfDocuments, { fields: [pdfAnalytics.pdfId], references: [pdfDocuments.id] }),
}));

export const pdfViewsRelations = relations(pdfViews, ({ one }) => ({
  pdf: one(pdfDocuments, { fields: [pdfViews.pdfId], references: [pdfDocuments.id] }),
  user: one(users, { fields: [pdfViews.userId], references: [users.id] }),
}));
