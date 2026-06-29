import { Router, Response } from 'express';
import { db } from '../db';
import { users, courses, enrollments, lessonProgress } from '../db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [{ totalStudents }] = await db
      .select({ totalStudents: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, 'student'));

    const [{ totalCourses }] = await db
      .select({ totalCourses: sql<number>`count(*)::int` })
      .from(courses);

    const [{ totalEnrollments }] = await db
      .select({ totalEnrollments: sql<number>`count(*)::int` })
      .from(enrollments);

    const [{ totalRevenue }] = await db
      .select({ totalRevenue: sql<string>`COALESCE(SUM(amount_paid), 0)::text` })
      .from(enrollments);

    return res.json({
      totalStudents,
      totalCourses,
      totalEnrollments,
      totalRevenue: parseFloat(totalRevenue || '0'),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/students
router.get('/students', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, 'student'))
      .orderBy(desc(users.createdAt));

    return res.json({ students });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

export default router;
