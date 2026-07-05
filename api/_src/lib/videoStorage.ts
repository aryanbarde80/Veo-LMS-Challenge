import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Video storage abstraction.
 *
 * Primary storage is local disk (`UPLOAD_DIR`):
 * - Render / a VPS / Railway with a persistent disk: set VIDEO_UPLOAD_DIR to
 *   that disk's mount path (see render.yaml) and uploads survive restarts.
 * - Vercel: functions run on an ephemeral, read-only-except-/tmp filesystem.
 *   New admin uploads only last for the lifetime of that single invocation
 *   and are NOT guaranteed to be visible to the next request — there is no
 *   way around that without external object storage (R2/S3). We default to
 *   /tmp here on Vercel so at least the app doesn't crash trying to write to
 *   a read-only path; treat "upload a new lesson video" as unsupported in a
 *   pure-Vercel deployment until this is swapped for R2/S3.
 * - The two seeded demo videos (api/seed-assets/videos, see ATTRIBUTION.md)
 *   are bundled with the deployment itself (vercel.json -> functions ->
 *   includeFiles) and are always readable as a fallback below, regardless of
 *   platform, so the seeded demo lessons play even where "new uploads" can't
 *   persist.
 *
 * To go all-in on Vercel for real (persistent uploads, not just the demo
 * seed), swap this file's implementation to write to Cloudflare R2 or S3
 * instead (both speak the S3 API) and swap `streamVideo` to redirect to a
 * signed bucket URL / proxy the range request through. Every route file in
 * this project only calls the functions exported here, so this is the only
 * file that needs to change.
 */

function defaultUploadDir(): string {
  if (process.env.VIDEO_UPLOAD_DIR) return process.env.VIDEO_UPLOAD_DIR;
  // Vercel sets this env var automatically on every deployment/invocation.
  if (process.env.VERCEL) return '/tmp/uploads/videos';
  return path.join(process.cwd(), 'uploads', 'videos');
}

export const UPLOAD_DIR = defaultUploadDir();

// Bundled, read-only fallback locations for the seeded demo videos. Listed in
// order of likelihood across the platforms this project actually targets;
// resolution just tries each until one exists, so it's fine if most misses.
const SEED_FALLBACK_DIRS = [
  path.join(__dirname, '..', '..', 'seed-assets', 'videos'), // compiled dist/lib -> api/seed-assets/videos (Render/local)
  path.join(process.cwd(), 'seed-assets', 'videos'),         // cwd = api/ (local dev, Render)
  path.join(process.cwd(), 'api', 'seed-assets', 'videos'),  // cwd = project root (Vercel function bundle)
];

function findSeedFallback(filename: string): string | null {
  for (const dir of SEED_FALLBACK_DIRS) {
    const p = path.join(dir, filename);
    try {
      if (fs.existsSync(p)) return p;
    } catch {
      // Ignore and try the next candidate.
    }
  }
  return null;
}

export function ensureUploadDir() {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  } catch (err) {
    // Don't let a read-only filesystem (e.g. a misconfigured host) crash
    // startup — video upload/streaming will just fail per-request instead,
    // with a clear error, instead of taking down the whole API.
    console.error('[videoStorage] Could not create upload dir:', UPLOAD_DIR, err);
  }
}

export function generateVideoFilename(originalName: string) {
  const ext = path.extname(originalName) || '.mp4';
  return `${crypto.randomUUID()}${ext}`;
}

export function videoFilePath(filename: string) {
  // Guard against path traversal — filename must never escape UPLOAD_DIR.
  const safe = path.basename(filename);
  const primary = path.join(UPLOAD_DIR, safe);
  if (fs.existsSync(primary)) return primary;
  return findSeedFallback(safe) || primary;
}

export function videoExists(filename: string) {
  return fs.existsSync(videoFilePath(filename));
}

export function deleteVideoFile(filename: string) {
  // Only ever delete from the writable upload dir -- never touch the
  // bundled, read-only seed-assets fallback.
  const safe = path.basename(filename);
  const p = path.join(UPLOAD_DIR, safe);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

export function getVideoSize(filename: string) {
  return fs.statSync(videoFilePath(filename)).size;
}
