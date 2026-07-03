// Colors
export const COLORS = {
  primary: '#6C47FF',
  secondary: '#00D4FF',
  success: '#00FF88',
  warning: '#FFB800',
  danger: '#FF6B35',
  darkBg: '#0A0E27',
  darkerBg: '#1A1A2E',
  darkestBg: '#16213E',
  borderColor: '#2E2E4A',
  textPrimary: '#F0EFF8',
  textSecondary: '#9B98B8',
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  COURSES: {
    GET_ALL: '/courses',
    GET_ONE: (id: string) => `/courses/${id}`,
    CREATE: '/courses',
    UPDATE: (id: string) => `/courses/${id}`,
    DELETE: (id: string) => `/courses/${id}`,
  },
  PDFS: {
    UPLOAD: '/pdfs/upload',
    GET_COURSE: (courseId: string) => `/pdfs/course/${courseId}`,
    GET_ONE: (pdfId: string) => `/pdfs/${pdfId}`,
    GET_ANALYTICS: (pdfId: string) => `/pdfs/${pdfId}/analytics`,
    TRACK_VIEW: (pdfId: string) => `/pdfs/${pdfId}/view`,
    DELETE: (pdfId: string) => `/pdfs/${pdfId}`,
  },
  ENROLLMENTS: {
    GET_MY: '/enrollments/my',
    ENROLL: '/enrollments',
    GET_PROGRESS: (courseId: string) => `/enrollments/${courseId}/progress`,
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    STATS: '/admin/stats',
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
  THEME: 'theme',
  PREFERENCES: 'user_preferences',
};

// User Roles
export enum UserRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

// Course Status
export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// Enrollment Status
export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// File Upload
export const FILE_UPLOAD = {
  MAX_PDF_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_PDF_TYPES: ['application/pdf'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

// Toast Messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login successful!',
    SIGNUP: 'Account created successfully!',
    UPLOAD: 'File uploaded successfully!',
    DELETE: 'Item deleted successfully!',
    UPDATE: 'Changes saved successfully!',
  },
  ERROR: {
    NETWORK: 'Network error. Please try again.',
    VALIDATION: 'Please check your input.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'Resource not found.',
    SERVER: 'Server error. Please try again later.',
  },
  INFO: {
    LOADING: 'Loading...',
    PROCESSING: 'Processing your request...',
  },
};

// Animation Durations (ms)
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  COURSES: '/courses',
  COURSE_DETAIL: (id: string) => `/courses/${id}`,
  LEARN: '/learn',
  STUDENT_DASHBOARD: '/student',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_COURSES: (courseId: string) => `/admin/courses/${courseId}`,
  ADMIN_PDFS: (courseId: string) => `/admin/pdfs/${courseId}`,
  PROFILE: '/profile',
};

// Feature Flags
export const FEATURES = {
  ENABLE_PDF_UPLOAD: true,
  ENABLE_ANALYTICS: true,
  ENABLE_PAYMENTS: true,
  ENABLE_SOCIAL: false,
  ENABLE_AI_RECOMMENDATIONS: false,
};

// Cache Duration (ms)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 60 * 60 * 1000, // 1 hour
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[A-Z])(?=.*[0-9])/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 5000,
};
