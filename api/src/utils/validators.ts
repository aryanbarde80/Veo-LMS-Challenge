import { z } from 'zod';

// Auth Schemas
export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Course Schemas
export const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  price: z.number().min(0, 'Price cannot be negative'),
  instructor: z.string().min(2, 'Instructor name is required'),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
  isPublished: z.boolean().default(false),
});

export const updateCourseSchema = createCourseSchema.partial();

// Section Schemas
export const createSectionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  courseId: z.string().uuid('Invalid course ID'),
  order: z.number().int().min(0).optional(),
});

export const updateSectionSchema = createSectionSchema.partial();

// Lesson Schemas
export const createLessonSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  sectionId: z.string().uuid('Invalid section ID'),
  videoUrl: z.string().url('Invalid video URL'),
  duration: z.number().int().min(0).optional(),
  isPublished: z.boolean().default(false),
  order: z.number().int().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

// PDF Schemas
export const createPDFSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  sectionId: z.string().uuid('Invalid section ID').optional(),
  title: z.string().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().url('Invalid file URL'),
  pageCount: z.number().int().min(1).default(0),
  wordCount: z.number().int().min(0).default(0),
  readingTimeMinutes: z.number().int().min(0).default(0),
  language: z.string().default('English'),
});

export const updatePDFSchema = createPDFSchema.partial();

// Enrollment Schemas
export const createEnrollmentSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

// Payment Schemas
export const createPaymentSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  amount: z.number().min(0, 'Amount must be positive'),
  method: z.enum(['razorpay', 'card', 'upi']).default('razorpay'),
});

// Query Validation
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').transform(Number).default('10'),
  sort: z.string().optional(),
  filter: z.record(z.any()).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type CreatePDFInput = z.infer<typeof createPDFSchema>;
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
