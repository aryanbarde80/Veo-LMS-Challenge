import cron from 'node-cron';

/**
 * Render's free web-service tier spins the instance down after ~15 minutes
 * of no inbound traffic, and the next request pays a 30-60s cold-start cost.
 * This pings our own health endpoint every 14 minutes to stay just inside
 * that window and keep the instance warm.
 *
 * Deliberately does NOT run on Vercel: Vercel functions are serverless and
 * don't have a long-lived process for a cron schedule to live in (the
 * function instance can be frozen/recycled between requests), so this is
 * gated on Render's own `RENDER` env var, which Render sets automatically
 * and Vercel never sets.
 */
export function startKeepAlivePing() {
  if (process.env.RENDER !== 'true') return;

  const url = process.env.RENDER_EXTERNAL_URL; // e.g. https://veolms-api.onrender.com
  if (!url) {
    console.warn('[keep-alive] RENDER_EXTERNAL_URL not set — skipping self-ping.');
    return;
  }

  const healthUrl = `${url.replace(/\/$/, '')}/api/health`;

  // Every 14 minutes.
  cron.schedule('*/14 * * * *', async () => {
    try {
      const res = await fetch(healthUrl);
      console.log(`[keep-alive] pinged ${healthUrl} -> ${res.status}`);
    } catch (err) {
      console.warn('[keep-alive] ping failed:', err instanceof Error ? err.message : err);
    }
  });

  console.log(`[keep-alive] scheduled self-ping every 14 minutes -> ${healthUrl}`);
}
