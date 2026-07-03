import { db } from './index';
import { courses, sections, lessons, users, enrollments, pdfDocuments, pdfAnalytics } from './schema';
import { eq, and, or, inArray, desc, asc, SQL } from 'drizzle-orm';

export const courseQueries = {
  // Get all published courses with counts
  getAllPublished: async () => {
    const result = await db
      .select({
        ...courses,
        sectionCount: (subquery: any) => subquery,
      })
      .from(courses)
      .where(eq(courses.isPublished, true));
    return result;
  },

  // Get course by ID with related data
  getById: (courseId: string) => {
    return db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
  },

  // Get courses by instructor
  byInstructor: (instructorId: string) => {
    return db
      .select()
      .from(courses)
      .where(eq(courses.instructorId, instructorId));
  },

  // Search courses
  search: (query: string) => {
    return db
      .select()
      .from(courses)
      .where(
        or(
          ...query.split(' ').map((q) => eq(courses.title, `%${q}%`))
        )
      )
      .limit(20);
  },
};

export const lessonQueries = {
  // Get all lessons for a section
  bySection: (sectionId: string) => {
    return db
      .select()
      .from(lessons)
      .where(eq(lessons.sectionId, sectionId))
      .orderBy(asc(lessons.order));
  },

  // Get all lessons for a course
  byCourse: (courseId: string) => {
    return db
      .select({
        ...lessons,
        sectionTitle: sections.title,
      })
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .where(eq(sections.courseId, courseId))
      .orderBy(asc(sections.order), asc(lessons.order));
  },

  // Get published lessons only
  publishedByCourse: (courseId: string) => {
    return db
      .select()
      .from(lessons)
      .innerJoin(sections, eq(lessons.sectionId, sections.id))
      .where(
        and(
          eq(sections.courseId, courseId),
          eq(lessons.isPublished, true)
        )
      )
      .orderBy(asc(sections.order), asc(lessons.order));
  },
};

export const enrollmentQueries = {
  // Get user's enrollments
  userEnrollments: (userId: string) => {
    return db
      .select({
        ...enrollments,
        courseTitle: courses.title,
        coursePrice: courses.price,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.userId, userId));
  },

  // Check if user is enrolled
  isEnrolled: async (userId: string, courseId: string) => {
    const result = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, courseId)
        )
      )
      .limit(1);
    return result.length > 0;
  },

  // Get enrollment stats for a course
  courseStats: (courseId: string) => {
    return db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
  },
};

export const pdfQueries = {
  // Get PDFs with analytics
  withAnalytics: (courseId: string) => {
    return db
      .select({
        ...pdfDocuments,
        totalViews: pdfAnalytics.totalViews,
        engagementScore: pdfAnalytics.engagementScore,
      })
      .from(pdfDocuments)
      .leftJoin(pdfAnalytics, eq(pdfDocuments.id, pdfAnalytics.pdfId))
      .where(eq(pdfDocuments.courseId, courseId));
  },

  // Get top performing PDFs
  topPerforming: (limit = 10) => {
    return db
      .select({
        ...pdfDocuments,
        totalViews: pdfAnalytics.totalViews,
        engagementScore: pdfAnalytics.engagementScore,
      })
      .from(pdfDocuments)
      .innerJoin(pdfAnalytics, eq(pdfDocuments.id, pdfAnalytics.pdfId))
      .orderBy(desc(pdfAnalytics.totalViews))
      .limit(limit);
  },

  // Get PDFs by keyword tags
  byTags: (tags: string[]) => {
    return db
      .select()
      .from(pdfDocuments)
      .where(inArray(pdfDocuments.keywordTags, tags));
  },
};

export const userQueries = {
  // Get user with enrollment count
  withStats: (userId: string) => {
    return db
      .select({
        ...users,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
  },

  // Get top users by enrollment count
  topByEnrollments: (limit = 10) => {
    return db
      .select({
        ...users,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit);
  },

  // Search users
  search: (query: string) => {
    return db
      .select()
      .from(users)
      .where(
        or(
          eq(users.name, `%${query}%`),
          eq(users.email, `%${query}%`)
        )
      )
      .limit(20);
  },
};

export const analyticsQueries = {
  // Get course enrollment trend
  enrollmentTrend: (courseId: string) => {
    return db
      .select({
        date: enrollments.enrolledAt,
        count: enrollments.id,
      })
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
  },

  // Get total stats
  dashboard: async () => {
    const totalCourses = await db.select().from(courses);
    const totalUsers = await db.select().from(users);
    const totalEnrollments = await db.select().from(enrollments);
    const totalPDFs = await db.select().from(pdfDocuments);

    return {
      totalCourses: totalCourses.length,
      totalUsers: totalUsers.length,
      totalEnrollments: totalEnrollments.length,
      totalPDFs: totalPDFs.length,
    };
  },
};
