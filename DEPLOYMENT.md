# VEO LMS - Deployment & Setup Guide

## Project Overview

**Veo LMS Challenge** is a full-stack Learning Management System with a modern tech stack:

### Frontend
- React 19 with TypeScript
- Tailwind CSS v4
- Recharts for data visualization
- React Router for navigation
- Zustand for state management
- React Query for data fetching
- Lucide React for icons

### Backend
- Express.js REST API
- Drizzle ORM with PostgreSQL
- JWT authentication
- Multer for file uploads
- PDF processing with pdf-parse

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or pnpm

### Environment Variables

Create `.env` file in the root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/veolms

# Backend
PORT=3000
JWT_SECRET=your-secret-key-min-32-chars
SEED_SECRET=seed-secret-key

# Frontend
VITE_API_URL=http://localhost:3000/api

# Razorpay (optional for payments)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret

# Upload configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
```

### Installation Steps

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies  
cd api && npm install && cd ..

# Setup database
cd api
npm run db:push
npm run db:seed
cd ..
```

### Running Development

```bash
# From root directory
npm run dev

# This runs both API (port 3000) and Frontend (port 5173) concurrently
```

## PDF Management Setup

The PDF management system requires:

1. **Database tables** - Already included in schema.ts
2. **Upload directory** - Created automatically at `api/uploads/`
3. **Environment variables** - See above

### Upload Directory Structure
```
api/uploads/
├── [pdf-uuid-timestamp].pdf
├── [pdf-uuid-timestamp].pdf
└── ...
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token

### Courses
- `GET /api/courses` - List all courses
- `GET /api/courses/:slug` - Get course details
- `POST /api/courses` (admin) - Create course
- `PUT /api/courses/:id` (admin) - Update course
- `DELETE /api/courses/:id` (admin) - Delete course

### PDFs (NEW)
- `POST /api/pdfs/upload` - Upload PDF with analysis
- `GET /api/pdfs/course/:courseId` - Get course PDFs
- `GET /api/pdfs/:pdfId/analytics` - Get PDF analytics
- `DELETE /api/pdfs/:pdfId` - Delete PDF

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/students` - All students
- `GET /api/admin/enrollments` - All enrollments

## Frontend Routes

### Public
- `/` - Home page
- `/courses` - Course catalog
- `/courses/:slug` - Course details
- `/login` - Login page
- `/signup` - Signup page

### Protected (Student)
- `/dashboard` - Student dashboard
- `/learn/:slug` - Video player

### Protected (Admin)
- `/admin` - Admin dashboard
- `/admin/courses/:courseId` - Manage course content
- `/admin/pdfs/:courseId` - Manage course PDFs (NEW)

## Database Schema

### Core Tables
- `users` - User accounts
- `courses` - Course listings
- `sections` - Course sections
- `lessons` - Individual lessons/videos
- `enrollments` - Student enrollments
- `lesson_progress` - Learning progress tracking

### PDF Tables (NEW)
- `pdf_documents` - PDF documents with metadata
- `pdf_analytics` - Analytics and metrics
- `pdf_views` - User interaction tracking

## Testing

### Test Credentials (after seeding)

**Admin:**
- Email: `admin@veolms.com`
- Password: `Admin@123456`

**Student:**
- Email: `student@veolms.com`
- Password: `Student@123456`

### Test PDF Upload

1. Login as admin
2. Navigate to any course
3. Click "Manage PDFs"
4. Upload a sample PDF
5. View analytics dashboard

## Production Deployment

### Build

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Build API
cd api && npm run build && cd ..
```

### Environment for Production

```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/veolms
JWT_SECRET=super-secret-key-min-32-chars
```

### Vercel Deployment

For Vercel (the project includes vercel.json):

1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `frontend/dist`
4. Deploy

### Database Migration for Production

```bash
# Safely migrate with backups first!
DATABASE_URL=<production-url> npm run db:push
```

## Performance Optimization

1. **Frontend:**
   - Lazy load analytics charts
   - Optimize images with next-gen formats
   - Use code splitting for routes
   - Enable gzip compression

2. **Backend:**
   - Add database indexes on frequently queried columns
   - Implement caching for static content
   - Use connection pooling for database
   - Enable API response compression

3. **PDFs:**
   - Compress PDFs before storage
   - Store in CDN/S3 for production
   - Implement resumable uploads
   - Add cleanup for old files

## Monitoring & Logging

### Recommended Services
- Sentry for error tracking
- LogRocket for session replay
- New Relic for performance monitoring
- Datadog for infrastructure monitoring

### Log Files Location
- Frontend: Browser console (DevTools)
- Backend: `api/logs/` (if configured)
- Database: PostgreSQL logs

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
npm run db:studio  # Opens Drizzle Studio

# Reset database (development only)
npm run db:push --force
npm run db:seed
```

### PDF Upload Issues
- Check file permissions on `api/uploads/`
- Verify MAX_FILE_SIZE environment variable
- Check available disk space
- Review server logs for errors

### Performance Issues
- Clear React Query cache: DevTools → Query Client → Clear
- Check network tab for slow API calls
- Profile with Chrome DevTools
- Review database query performance

## Security Checklist

- [x] JWT authentication enabled
- [x] CORS configured
- [x] Helmet.js security headers
- [x] Rate limiting enabled
- [x] Input validation with Zod
- [x] File upload validation
- [x] SQL injection prevention
- [ ] HTTPS enforced (production)
- [ ] API key rotation (if using)
- [ ] Regular security audits

## Support & Contributing

For issues or feature requests:
1. Check IMPROVEMENTS.md for new features
2. Review existing GitHub issues
3. Create detailed bug reports
4. Submit pull requests with tests

## License

MIT License - See LICENSE file for details

## Changelog

### v2.0.0 (Current)
- ✨ PDF management system
- ✨ Analytics dashboard with charts
- 🎨 Professional UI redesign
- 📊 Advanced data visualization
- 🔒 Enhanced security
- 📱 Improved responsive design

### v1.0.0
- Initial LMS release
- Video course management
- Student enrollment
- Payment integration

---

**Last Updated:** July 2026
**Maintained by:** V0 Development Team
