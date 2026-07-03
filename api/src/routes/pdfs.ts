import { Router, Request, Response } from 'express';
import multer from 'multer';
import { db } from '../db';
import { pdfDocuments, pdfAnalytics, pdfViews } from '../db/schema';
import { eq, and, desc, lte } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError, asyncHandler, APIError, validateInput } from '../utils/errorHandler';
import { createPDFSchema, updatePDFSchema } from '../utils/validators';

const router = Router();

// Configure multer for PDF uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuid()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

// Extract text from PDF (basic implementation)
async function extractPdfMetadata(filePath: string) {
  try {
    const pdfParse = require('pdf-parse');
    const fs = require('fs');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    const text = data.text;
    const wordCount = text.trim().split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200); // Avg 200 words per minute
    
    return {
      pageCount: data.numpages,
      wordCount,
      readingTimeMinutes,
    };
  } catch (error) {
    console.error('Error extracting PDF metadata:', error);
    return { pageCount: 0, wordCount: 0, readingTimeMinutes: 0 };
  }
}

// Upload PDF
router.post('/upload', authenticate, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new APIError(400, 'No file uploaded');
  }

  const { courseId, sectionId, title, description } = req.body;
  const userId = (req as AuthRequest).userId;

  // Validate input
  const pdfData = validateInput(createPDFSchema, {
    courseId,
    sectionId,
    title,
    description,
    fileName: req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`,
    pageCount: 0,
    wordCount: 0,
    readingTimeMinutes: 0,
  });

  // Extract PDF metadata
  const metadata = await extractPdfMetadata(req.file.path);

  // Save PDF document to database
  const pdfId = uuid();
  const fileUrl = `/uploads/${req.file.filename}`;

  const [pdf] = await db.insert(pdfDocuments).values({
    id: pdfId,
    courseId: pdfData.courseId,
    sectionId: pdfData.sectionId || undefined,
    title: pdfData.title,
    description: pdfData.description || undefined,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileUrl,
    pageCount: metadata.pageCount,
    wordCount: metadata.wordCount,
    readingTimeMinutes: metadata.readingTimeMinutes,
    uploadedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  // Create analytics entry
  await db.insert(pdfAnalytics).values({
    id: uuid(),
    pdfId,
    totalViews: 0,
    totalDownloads: 0,
    averageReadingTime: 0,
    engagementScore: 0,
    lastAnalyzedAt: new Date(),
  });

  sendSuccess(res, {
    message: 'PDF uploaded successfully',
    pdfId,
    pdf,
    metadata,
  }, 201);
}));

// Get all PDFs for a course
router.get('/course/:courseId', asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const { page = '1', limit = '10', sort = '-createdAt' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const pageSize = Math.max(1, Math.min(100, parseInt(limit as string) || 10));
  const offset = (pageNum - 1) * pageSize;

  const pdfs = await db
    .select()
    .from(pdfDocuments)
    .where(eq(pdfDocuments.courseId, courseId))
    .orderBy(desc(pdfDocuments.createdAt))
    .limit(pageSize)
    .offset(offset);

  const total = pdfs.length;

  sendSuccess(res, {
    pdfs,
    pagination: { page: pageNum, limit: pageSize, total },
  });
}));

// Get PDF details with analytics
router.get('/:pdfId', asyncHandler(async (req: Request, res: Response) => {
  const { pdfId } = req.params;

  const pdf = await db
    .select()
    .from(pdfDocuments)
    .where(eq(pdfDocuments.id, pdfId))
    .limit(1);

  if (!pdf.length) {
    throw new APIError(404, 'PDF not found');
  }

  const analytics = await db
    .select()
    .from(pdfAnalytics)
    .where(eq(pdfAnalytics.pdfId, pdfId))
    .limit(1);

  sendSuccess(res, {
    pdf: pdf[0],
    analytics: analytics[0] || null,
  });
}));

// Get PDF analytics
router.get('/:pdfId/analytics', asyncHandler(async (req: Request, res: Response) => {
  const { pdfId } = req.params;

  const analytics = await db
    .select()
    .from(pdfAnalytics)
    .where(eq(pdfAnalytics.pdfId, pdfId))
    .limit(1);

  if (!analytics.length) {
    throw new APIError(404, 'Analytics not found');
  }

  sendSuccess(res, analytics[0]);
}));

// Track PDF view
router.post('/:pdfId/view', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { pdfId } = req.params;
  const userId = (req as AuthRequest).userId;
  const { completionPercentage = 0 } = req.body;

  // Check if PDF exists
  const pdf = await db
    .select()
    .from(pdfDocuments)
    .where(eq(pdfDocuments.id, pdfId))
    .limit(1);

  if (!pdf.length) {
    throw new APIError(404, 'PDF not found');
  }

  // Record or update view
  const existingView = await db
    .select()
    .from(pdfViews)
    .where(and(eq(pdfViews.pdfId, pdfId), eq(pdfViews.userId, userId)))
    .limit(1);

  if (existingView.length) {
    // Update existing view
    await db
      .update(pdfViews)
      .set({
        completionPercentage,
        lastViewedAt: new Date(),
      })
      .where(and(eq(pdfViews.pdfId, pdfId), eq(pdfViews.userId, userId)));
  } else {
    // Create new view
    await db.insert(pdfViews).values({
      id: uuid(),
      pdfId,
      userId,
      completionPercentage,
      totalTimeSpent: 0,
      viewedPages: [],
      lastViewedAt: new Date(),
      createdAt: new Date(),
    });
  }

  // Update analytics
  const analytics = await db
    .select()
    .from(pdfAnalytics)
    .where(eq(pdfAnalytics.pdfId, pdfId))
    .limit(1);

  if (analytics.length) {
    const currentViews = analytics[0].totalViews || 0;
    await db
      .update(pdfAnalytics)
      .set({
        totalViews: currentViews + 1,
        lastAnalyzedAt: new Date(),
      })
      .where(eq(pdfAnalytics.pdfId, pdfId));
  }

  sendSuccess(res, { message: 'View recorded successfully' });
}));

// Delete PDF
router.delete('/:pdfId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { pdfId } = req.params;
  const userId = (req as AuthRequest).userId;

  const pdf = await db
    .select()
    .from(pdfDocuments)
    .where(eq(pdfDocuments.id, pdfId))
    .limit(1);

  if (!pdf.length) {
    throw new APIError(404, 'PDF not found');
  }

  if (pdf[0].uploadedBy !== userId) {
    throw new APIError(403, 'Unauthorized to delete this PDF');
  }

  // Delete file from storage
  const filePath = path.join(uploadDir, path.basename(pdf[0].fileUrl));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete from database (cascades to analytics and views)
  await db.delete(pdfDocuments).where(eq(pdfDocuments.id, pdfId));

  sendSuccess(res, { message: 'PDF deleted successfully' });
}));

export default router;
