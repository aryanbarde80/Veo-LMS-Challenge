// Standalone server entrypoint for non-serverless hosts (Render, Railway,
// a plain VPS, or local dev via `npm run dev`). Vercel uses ../index.ts
// instead, which imports the same app but doesn't call .listen().
import app from './app';
import { startKeepAlivePing } from './keepAlive';

const PORT = parseInt(process.env.PORT || '4000', 10);

app.listen(PORT, () => {
  console.log(`VeoLMS API listening on port ${PORT}`);
  startKeepAlivePing();
});
