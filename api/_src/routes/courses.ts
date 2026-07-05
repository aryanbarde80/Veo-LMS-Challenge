import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { courses, sections, lessons, enrollments, users } from '../db/schema';
import { eq, desc, ilike, or, and, sql, inArray } from 'drizzle-orm';
import { authenticate, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/courses - public list
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { search, featured, limit = '12', offset = '0' } = req.query;

    let query = db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        shortDescription: courses.shortDescription,
        thumbnail: courses.thumbnail,
        price: courses.price,
        difficulty: courses.difficulty,
        totalDuration: courses.totalDuration,
        isFeatured: courses.isFeatured,
        instructorName: users.name,
        instructorId: courses.instructorId,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(courses.isPublished, true));

    const allCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        shortDescription: courses.shortDescription,
        thumbnail: courses.thumbnail,
        price: courses.price,
        difficulty: courses.difficulty,
        totalDuration: courses.totalDuration,
        isFeatured: courses.isFeatured,
        instructorName: users.name,
        instructorId: courses.instructorId,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(
        search
          ? and(
              eq(courses.isPublished, true),
              or(
                ilike(courses.title, `%${search}%`),
                ilike(courses.shortDescription, `%${search}%`)
              )
            )
          : featured === 'true'
          ? and(eq(courses.isPublished, true), eq(courses.isFeatured, true))
          : eq(courses.isPublished, true)
      )
      .orderBy(desc(courses.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    // Get enrollment counts
    const courseIds = allCourses.map((c) => c.id);
    const enrollmentCounts =
      courseIds.length > 0
        ? await db
            .select({
              courseId: enrollments.courseId,
              count: sql<number>`count(*)::int`,
            })
            .from(enrollments)
            .where(inArray(enrollments.courseId, courseIds))
            .groupBy(enrollments.courseId)
        : [];

    const countMap = new Map(enrollmentCounts.map((e) => [e.courseId, e.count]));

    const result = allCourses.map((c) => ({
      ...c,
      enrollmentCount: countMap.get(c.id) || 0,
    }));

    return res.json({ courses: result });
  } catch (err) {
    console.error('Get courses error:', err);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/courses/:slug - public course detail
router.get('/:slug', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;

    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        shortDescription: courses.shortDescription,
        thumbnail: courses.thumbnail,
        trailerVideoId: courses.trailerVideoId,
        price: courses.price,
        difficulty: courses.difficulty,
        language: courses.language,
        tags: courses.tags,
        totalDuration: courses.totalDuration,
        isFeatured: courses.isFeatured,
        isPublished: courses.isPublished,
        instructorId: courses.instructorId,
        instructorName: users.name,
        instructorBio: users.bio,
        instructorAvatar: users.avatar,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(courses.slug, slug))
      .limit(1);

    if (!course || (!course.isPublished && req.user?.role !== 'admin')) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get sections with lessons
    const courseSections = await db
      .select()
      .from(sections)
      .where(eq(sections.courseId, course.id))
      .orderBy(sections.order);

    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, course.id))
      .orderBy(lessons.order);

    const isEnrolled = req.user
      ? !!(await db
          .select({ id: enrollments.id })
          .from(enrollments)
          .where(and(eq(enrollments.userId, req.user.id), eq(enrollments.courseId, course.id)))
          .limit(1)
          .then((r) => r[0]))
      : false;

    const sectionsWithLessons = courseSections.map((s) => ({
      ...s,
      lessons: courseLessons
        .filter((l) => l.sectionId === s.id)
        .map((l) => ({
          ...l,
          // Hide video source for non-preview lessons if not enrolled/admin.
          // (The streaming endpoint itself is separately protected by a signed,
          // per-user token — this is defense in depth so the filename/ID isn't
          // even visible in the API response.)
          videoId: l.isPreview || isEnrolled || req.user?.role === 'admin' ? l.videoId : null,
          videoFile: l.isPreview || isEnrolled || req.user?.role === 'admin' ? l.videoFile : null,
        })),
    }));

    const [{ count: enrollmentCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enrollments)
      .where(eq(enrollments.courseId, course.id));

    return res.json({
      course: { ...course, enrollmentCount, isEnrolled },
      sections: sectionsWithLessons,
    });
  } catch (err) {
    console.error('Get course error:', err);
    return res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Admin: GET /api/courses/admin/all
router.get('/admin/all', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const allCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        price: courses.price,
        isPublished: courses.isPublished,
        isFeatured: courses.isFeatured,
        difficulty: courses.difficulty,
        totalDuration: courses.totalDuration,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .orderBy(desc(courses.createdAt));
    return res.json({ courses: allCourses });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

const courseSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  shortDescription: z.string().min(10).max(300),
  thumbnail: z.string().url(),
  trailerVideoId: z.string().optional(),
  price: z.number().min(0),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  language: z.string().default('English'),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) + '-' + Date.now().toString(36);
}

// Admin: POST /api/courses
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = courseSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    const data = result.data;
    const slug = slugify(data.title);

    const [course] = await db
      .insert(courses)
      .values({
        ...data,
        slug,
        instructorId: req.user!.id,
        price: data.price.toString(),
      })
      .returning();

    return res.status(201).json({ course });
  } catch (err) {
    console.error('Create course error:', err);
    return res.status(500).json({ error: 'Failed to create course' });
  }
});

// Admin: PUT /api/courses/:id
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = courseSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    }
    const data = result.data;
    const priceStr = data.price !== undefined ? data.price.toString() : undefined;

    const updateData: any = { ...data, updatedAt: new Date() };
    if (priceStr !== undefined) updateData.price = priceStr;

    const [updated] = await db
      .update(courses)
      .set(updateData)
      .where(eq(courses.id, req.params.id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Course not found' });
    return res.json({ course: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update course' });
  }
});

// Admin: DELETE /api/courses/:id
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await db.delete(courses).where(eq(courses.id, req.params.id));
    return res.json({ message: 'Course deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;
