import { Router, Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { lessons, enrollments } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import {
  ensureUploadDir,
  generateVideoFilename,
  videoFilePath,
  videoExists,
  deleteVideoFile,
  UPLOAD_DIR,
} from '../lib/videoStorage';

const router = Router();
ensureUploadDir();

const ALLOWED_MIME = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);
const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => cb(null, generateVideoFilename(file.originalname)),
  }),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Unsupported video format. Use MP4, WebM, Ogg, or MOV.'));
    }
    cb(null, true);
  },
});

// POST /api/videos/upload  (admin only) - multipart/form-data, field name "video"
router.post('/upload', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  upload.single('video')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });

    return res.status(201).json({
      videoFile: req.file.filename,
      videoSize: req.file.size,
      videoMimeType: req.file.mimetype,
    });
  });
});

// GET /api/videos/lesson/:lessonId/token  (authenticated) - issues a short-lived signed
// token scoped to exactly this lesson + user, so the streaming endpoint below can be
// hit from a plain <video> tag (which can't send Authorization headers) without opening
// video access to the public.
router.get('/lesson/:lessonId/token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.params;

    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
    if (!lesson || !lesson.videoFile) return res.status(404).json({ error: 'Video not found' });

    if (!lesson.isPreview) {
      if (req.user!.role !== 'admin') {
        const [enrollment] = await db
          .select({ id: enrollments.id })
          .from(enrollments)
          .where(and(eq(enrollments.userId, req.user!.id), eq(enrollments.courseId, lesson.courseId)))
          .limit(1);
        if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this course' });
      }
    }

    const token = jwt.sign(
      { sub: req.user!.id, lessonId, purpose: 'video-access' },
      process.env.JWT_SECRET!,
      { expiresIn: '10m' }
    );

    return res.json({ token, expiresIn: 600 });
  } catch (err) {
    console.error('Video token error:', err);
    return res.status(500).json({ error: 'Failed to issue video access token' });
  }
});

// GET /api/videos/stream/:lessonId?token=...  - Range-request video streaming.
// Not behind the `authenticate` middleware because a native <video> tag can't set
// headers; instead it's protected by the short-lived signed token above.
router.get('/stream/:lessonId', async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const token = req.query.token as string;
    if (!token) return res.status(401).json({ error: 'Missing access token' });

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired video access token' });
    }

    if (payload.purpose !== 'video-access' || payload.lessonId !== lessonId) {
      return res.status(403).json({ error: 'Token not valid for this video' });
    }

    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
    if (!lesson || !lesson.videoFile || !videoExists(lesson.videoFile)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const filePath = videoFilePath(lesson.videoFile);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const mime = lesson.videoMimeType || 'video/mp4';

    res.setHeader('Content-Type', mime);
    res.setHeader('Accept-Ranges', 'bytes');
    // Never cache someone else's private video content.
    res.setHeader('Cache-Control', 'private, no-store');

    if (!range) {
      res.setHeader('Content-Length', fileSize);
      return fs.createReadStream(filePath).pipe(res);
    }

    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (!match) return res.status(416).json({ error: 'Invalid range' });

    let start = match[1] ? parseInt(match[1], 10) : 0;
    let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
    if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).end();
    }

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', end - start + 1);
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } catch (err) {
    console.error('Video stream error:', err);
    return res.status(500).json({ error: 'Failed to stream video' });
  }
});

// DELETE /api/videos/:filename (admin only) - cleanup when a lesson's video is replaced
router.delete('/:filename', authenticate, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    deleteVideoFile(req.params.filename);
    return res.json({ message: 'Video deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete video file' });
  }
});

export default router;
