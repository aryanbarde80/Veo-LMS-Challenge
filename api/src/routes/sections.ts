import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { sections, lessons, courses } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/sections
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      courseId: z.string().uuid(),
      title: z.string().min(2).max(200),
      order: z.number().int().min(0).optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Invalid input' });

    const [section] = await db.insert(sections).values(result.data).returning();
    return res.status(201).json({ section });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create section' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, order } = req.body;
    const [updated] = await db
      .update(sections)
      .set({ title, order })
      .where(eq(sections.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Section not found' });
    return res.json({ section: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update section' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await db.delete(sections).where(eq(sections.id, req.params.id));
    return res.json({ message: 'Section deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete section' });
  }
});

// Lessons
const lessonSchema = z.object({
  sectionId: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  videoId: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  order: z.number().int().min(0).optional(),
  type: z.enum(['video', 'text']).optional(),
  isPreview: z.boolean().optional(),
  content: z.string().optional(),
});

router.post('/lessons', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = lessonSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Invalid input', details: result.error.flatten() });
    const [lesson] = await db.insert(lessons).values(result.data).returning();
    return res.status(201).json({ lesson });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create lesson' });
  }
});

router.put('/lessons/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = lessonSchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'Invalid input' });
    const [updated] = await db
      .update(lessons)
      .set(result.data)
      .where(eq(lessons.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Lesson not found' });
    return res.json({ lesson: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update lesson' });
  }
});

router.delete('/lessons/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await db.delete(lessons).where(eq(lessons.id, req.params.id));
    return res.json({ message: 'Lesson deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

export default router;
