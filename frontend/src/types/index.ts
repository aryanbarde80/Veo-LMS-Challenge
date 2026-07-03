export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
  bio?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  trailerVideoId?: string;
  price: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  tags?: string[];
  isPublished: boolean;
  isFeatured: boolean;
  totalDuration: number;
  instructorId: string;
  instructorName: string;
  instructorBio?: string;
  instructorAvatar?: string;
  enrollmentCount?: number;
  isEnrolled?: boolean;
  createdAt: string;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  sectionId: string;
  courseId: string;
  title: string;
  description?: string;
  videoId?: string | null;
  videoFile?: string | null;
  videoSource?: 'upload' | 'youtube';
  duration: number;
  order: number;
  type: 'video' | 'text';
  isPreview: boolean;
  content?: string;
}

export interface Enrollment {
  id: string;
  enrolledAt: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string;
  coursePrice: string;
  totalDuration: number;
  instructorName: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
}

export interface LessonProgress {
  lessonId: string;
  courseId: string;
  watchedSeconds: number;
  isCompleted: boolean;
  lastWatchedAt: string;
}

export interface RecentActivity {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string;
  lastWatchedAt: string;
  watchedSeconds: number;
  isCompleted: boolean;
}

export interface AdminStats {
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
}
