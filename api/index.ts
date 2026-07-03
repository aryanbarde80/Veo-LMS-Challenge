// Vercel serverless entrypoint. The real Express app lives in src/app.ts so
// it's also reachable by tsc's build (rootDir: ./src) for standalone hosts
// like Render/Railway/a VPS — see src/index.ts for that entrypoint.
import app from './src/app';

export default app;
