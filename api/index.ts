// Vercel serverless entrypoint. The real Express app lives in _src/app.ts —
// the underscore prefix keeps Vercel's zero-config function detection from
// treating every file under _src/ as its own separate serverless function
// (Vercel skips files/dirs starting with "_"), so this stays a single
// function regardless of how many route/db/lib files _src/ contains.
// _src is also reachable by tsc's build (rootDir: ./_src) for standalone
// hosts like Render/Railway/a VPS — see _src/index.ts for that entrypoint.
import app from './_src/app';

export default app;
