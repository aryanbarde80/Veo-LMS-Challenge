#!/usr/bin/env bash
# Runs automatically as part of the Vercel install step (see vercel.json).
# Pushes the current schema and seeds demo data on every deploy, so the app
# is fully populated the moment a deploy finishes -- no manual `db:push` /
# `db:seed` step required. Both are safe to re-run (courses/sections/lessons
# are upserted/replaced, not duplicated -- see db/seed.ts).
#
# Deliberately does NOT fail the build if this step errors: a DB hiccup
# shouldn't take the whole site down when the frontend + already-deployed
# data would otherwise be fine. Errors are printed clearly instead.
set -uo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "⚠️  DATABASE_URL is not set -- skipping automatic db:push/db:seed."
  echo "    Set it in Vercel Project Settings -> Environment Variables, then redeploy."
  exit 0
fi

echo "▶ Running db:push (sync schema to $DATABASE_URL host)..."
if npm run db:push; then
  echo "✅ db:push complete"
else
  echo "❌ db:push failed -- see errors above. Continuing build anyway (existing data, if any, is untouched)."
fi

echo "▶ Running db:seed (populate demo courses/videos/enrollments)..."
if npm run db:seed; then
  echo "✅ db:seed complete"
else
  echo "❌ db:seed failed -- see errors above. Continuing build anyway."
fi

exit 0
