import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Video storage abstraction.
 *
 * IMPORTANT — read this before deploying:
 * This implementation writes files to local disk (`UPLOAD_DIR`). That works
 * for local development and for a traditional always-on host (a VPS, Railway,
 * Render with a persistent disk, etc).
 *
 * It will NOT work on Vercel. Vercel serverless functions run on ephemeral,
 * read-only-except-/tmp filesystems — anything written to disk disappears
 * after the request finishes and is never shared across function instances.
 * Uploaded videos would vanish (or 404 on a different invocation) almost
 * immediately.
 *
 * To go live on Vercel, swap this file's implementation to write to
 * Cloudflare R2 or S3 instead (both speak the S3 API, so the change is
 * small) and swap `streamVideo` to redirect to a signed bucket URL / proxy
 * the range request through to the bucket. Every route file in this project
 * only calls the functions exported here, so that's the only file that needs
 * to change.
 */

export const UPLOAD_DIR = process.env.VIDEO_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'videos');

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function generateVideoFilename(originalName: string) {
  const ext = path.extname(originalName) || '.mp4';
  return `${crypto.randomUUID()}${ext}`;
}

export function videoFilePath(filename: string) {
  // Guard against path traversal — filename must never escape UPLOAD_DIR.
  const safe = path.basename(filename);
  return path.join(UPLOAD_DIR, safe);
}

export function videoExists(filename: string) {
  return fs.existsSync(videoFilePath(filename));
}

export function deleteVideoFile(filename: string) {
  const p = videoFilePath(filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function getVideoSize(filename: string) {
  return fs.statSync(videoFilePath(filename)).size;
}
