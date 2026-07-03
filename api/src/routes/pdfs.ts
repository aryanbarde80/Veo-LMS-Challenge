import { Router, Request, Response } from 'express';
import multer from 'multer';
import { db } from '../db';
import { pdfDocuments, pdfAnalytics } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';

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
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { courseId, sectionId, title, description } = req.body;
    const userId = (req as any).userId;

    if (!courseId || !title || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Extract PDF metadata
    const metadata = await extractPdfMetadata(req.file.path);

    // Save PDF document to database
    const pdfId = uuid();
    const fileUrl = `/uploads/${req.file.filename}`;

    await db.insert(pdfDocuments).values({
      id: pdfId,
      courseId,
      sectionId: sectionId || null,
      title,
      description: description || null,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileUrl,
      pageCount: metadata.pageCount,
      wordCount: metadata.wordCount,
      readingTimeMinutes: metadata.readingTimeMinutes,
      uploadedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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

    res.json({ 
      message: 'PDF uploaded successfully',
      pdfId,
      metadata 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

// Get all PDFs for a course
router.get('/course/:courseId', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;

    const pdfs = await db
      .select()
      .from(pdfDocuments)
      .where(eq(pdfDocuments.courseId, courseId));

    res.json({ pdfs });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs' });
  }
});

// Get PDF with analytics
router.get('/:pdfId/analytics', async (req: Request, res: Response) => {
  try {
    const { pdfId } = req.params;

    const pdf = await db
      .select()
      .from(pdfDocuments)
      .where(eq(pdfDocuments.id, pdfId));

    if (!pdf.length) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const analytics = await db
      .select()
      .from(pdfAnalytics)
      .where(eq(pdfAnalytics.pdfId, pdfId));

    res.json({ 
      pdf: pdf[0],
      analytics: analytics[0] || null
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Delete PDF
router.delete('/:pdfId', async (req: Request, res: Response) => {
  try {
    const { pdfId } = req.params;
    const userId = (req as any).userId;

    const pdf = await db
      .select()
      .from(pdfDocuments)
      .where(eq(pdfDocuments.id, pdfId));

    if (!pdf.length) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    if (pdf[0].uploadedBy !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete file from storage
    const filePath = path.join(uploadDir, path.basename(pdf[0].fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database (cascades to analytics and views)
    await db.delete(pdfDocuments).where(eq(pdfDocuments.id, pdfId));

    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

export default router;
