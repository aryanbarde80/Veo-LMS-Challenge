import { Router, Response } from 'express';
import { db } from '../db';
import { lessonProgress, enrollments, lessons, courses, sections, users } from '../db/schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// GET /api/enrollments/my - student's enrolled courses
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const myEnrollments = await db
      .select({
        id: enrollments.id,
        enrolledAt: enrollments.enrolledAt,
        courseId: courses.id,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        courseThumbnail: courses.thumbnail,
        coursePrice: courses.price,
        totalDuration: courses.totalDuration,
        instructorName: users.name,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(eq(enrollments.userId, req.user!.id))
      .orderBy(desc(enrollments.enrolledAt));

    // Get progress for each course
    const courseIds = myEnrollments.map((e) => e.courseId);
    if (courseIds.length === 0) return res.json({ enrollments: [] });

    const lessonCounts = await db
      .select({ courseId: lessons.courseId, count: sql<number>`count(*)::int` })
      .from(lessons)
      .where(inArray(lessons.courseId, courseIds))
      .groupBy(lessons.courseId);

    const completedCounts = await db
      .select({ courseId: lessonProgress.courseId, count: sql<number>`count(*)::int` })
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, req.user!.id),
          eq(lessonProgress.isCompleted, true),
          inArray(lessonProgress.courseId, courseIds)
        )
      )
      .groupBy(lessonProgress.courseId);

    const lessonMap = new Map(lessonCounts.map((l) => [l.courseId, l.count]));
    const completedMap = new Map(completedCounts.map((c) => [c.courseId, c.count]));

    const result = myEnrollments.map((e) => ({
      ...e,
      totalLessons: lessonMap.get(e.courseId) || 0,
      completedLessons: completedMap.get(e.courseId) || 0,
      progress:
        lessonMap.get(e.courseId)
          ? Math.round(((completedMap.get(e.courseId) || 0) / lessonMap.get(e.courseId)!) * 100)
          : 0,
    }));

    return res.json({ enrollments: result });
  } catch (err) {
    console.error('Get enrollments error:', err);
    return res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// POST /api/enrollments/progress
router.post('/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      lessonId: z.string().uuid(),
      courseId: z.string().uuid(),
      watchedSeconds: z.number().int().min(0),
      isCompleted: z.boolean().optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Invalid input' });

    const { lessonId, courseId, watchedSeconds, isCompleted } = result.data;

    // Verify enrollment
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, req.user!.id), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this course' });

    // Upsert progress
    const [progress] = await db
      .insert(lessonProgress)
      .values({
        userId: req.user!.id,
        lessonId,
        courseId,
        watchedSeconds,
        isCompleted: isCompleted || false,
        lastWatchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: {
          watchedSeconds,
          isCompleted: isCompleted || false,
          lastWatchedAt: new Date(),
        },
      })
      .returning();

    return res.json({ progress });
  } catch (err) {
    console.error('Update progress error:', err);
    return res.status(500).json({ error: 'Failed to update progress' });
  }
});

// GET /api/enrollments/progress/:courseId
router.get('/progress/:courseId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;

    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, req.user!.id), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (!enrollment) return res.status(403).json({ error: 'Not enrolled' });

    const progressData = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, req.user!.id), eq(lessonProgress.courseId, courseId)));

    // Get last watched
    const [lastWatched] = await db
      .select({
        lessonId: lessonProgress.lessonId,
        lessonTitle: lessons.title,
        lastWatchedAt: lessonProgress.lastWatchedAt,
        watchedSeconds: lessonProgress.watchedSeconds,
      })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .where(and(eq(lessonProgress.userId, req.user!.id), eq(lessonProgress.courseId, courseId)))
      .orderBy(desc(lessonProgress.lastWatchedAt))
      .limit(1);

    return res.json({ progress: progressData, lastWatched });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// GET /api/enrollments/recent - recently watched lessons
router.get('/recent', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const recent = await db
      .select({
        lessonId: lessonProgress.lessonId,
        lessonTitle: lessons.title,
        courseId: lessonProgress.courseId,
        courseTitle: courses.title,
        courseSlug: courses.slug,
        courseThumbnail: courses.thumbnail,
        lastWatchedAt: lessonProgress.lastWatchedAt,
        watchedSeconds: lessonProgress.watchedSeconds,
        isCompleted: lessonProgress.isCompleted,
      })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .innerJoin(courses, eq(lessonProgress.courseId, courses.id))
      .where(eq(lessonProgress.userId, req.user!.id))
      .orderBy(desc(lessonProgress.lastWatchedAt))
      .limit(10);

    return res.json({ recent });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Admin: GET /api/enrollments/all
router.get('/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const allEnrollments = await db
      .select({
        id: enrollments.id,
        enrolledAt: enrollments.enrolledAt,
        amountPaid: enrollments.amountPaid,
        paymentId: enrollments.paymentId,
        userName: users.name,
        userEmail: users.email,
        courseTitle: courses.title,
        courseId: courses.id,
      })
      .from(enrollments)
      .innerJoin(users, eq(enrollments.userId, users.id))
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(desc(enrollments.enrolledAt))
      .limit(100);

    return res.json({ enrollments: allEnrollments });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

export default router;
