// Mock data generators
export const generateMockUser = (overrides?: any) => ({
  id: 'user-' + Math.random().toString(36),
  name: 'Test User',
  email: 'test@example.com',
  role: 'student',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const generateMockCourse = (overrides?: any) => ({
  id: 'course-' + Math.random().toString(36),
  title: 'Test Course',
  description: 'This is a test course',
  price: 99.99,
  instructor: 'Test Instructor',
  isPublished: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const generateMockPDF = (overrides?: any) => ({
  id: 'pdf-' + Math.random().toString(36),
  title: 'Test PDF',
  courseId: 'course-123',
  pageCount: 50,
  wordCount: 5000,
  readingTimeMinutes: 25,
  fileName: 'test.pdf',
  fileUrl: '/uploads/test.pdf',
  uploadedBy: 'user-123',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const generateMockAnalytics = (overrides?: any) => ({
  id: 'analytics-' + Math.random().toString(36),
  pdfId: 'pdf-123',
  totalViews: 150,
  totalDownloads: 45,
  averageReadingTime: 22,
  engagementScore: 78,
  lastAnalyzedAt: new Date().toISOString(),
  ...overrides,
});

// Test data constants
export const TEST_USER = generateMockUser({
  id: 'test-user-1',
  email: 'test@test.com',
});

export const TEST_ADMIN = generateMockUser({
  id: 'test-admin-1',
  role: 'admin',
  email: 'admin@test.com',
});

export const TEST_COURSE = generateMockCourse({
  id: 'test-course-1',
});

export const TEST_PDF = generateMockPDF({
  id: 'test-pdf-1',
  courseId: 'test-course-1',
});

// Validation helpers
export const isValidTestEmail = (email: string): boolean => {
  return email.includes('@test.com') || email.includes('@example.com');
};

export const isValidTestId = (id: string): boolean => {
  return id.includes('-') && id.length > 5;
};

// API response mocks
export const mockApiResponse = <T,>(data: T, success = true) => ({
  success,
  data,
  timestamp: new Date().toISOString(),
});

export const mockApiError = (error: string, statusCode = 400) => ({
  success: false,
  error,
  statusCode,
  timestamp: new Date().toISOString(),
});

// Wait helpers
export const waitFor = (condition: () => boolean, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve();
      }
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Timeout waiting for condition'));
      }
    }, 100);
  });
};

export const waitMs = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Array helpers for testing
export const createArray = <T,>(length: number, generator: (index: number) => T): T[] => {
  return Array.from({ length }, (_, i) => generator(i));
};

export const createMockArray = (length: number, generator = generateMockCourse) => {
  return createArray(length, (i) => generator({ id: `item-${i}` }));
};

// Storage helpers
export const setMockStorage = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getMockStorage = (key: string) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const clearMockStorage = () => {
  localStorage.clear();
};

// Test assertion helpers
export const expectToBeArray = (value: any): asserts value is any[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Expected array, got ${typeof value}`);
  }
};

export const expectToBeString = (value: any): asserts value is string => {
  if (typeof value !== 'string') {
    throw new Error(`Expected string, got ${typeof value}`);
  }
};

export const expectToBeNumber = (value: any): asserts value is number => {
  if (typeof value !== 'number') {
    throw new Error(`Expected number, got ${typeof value}`);
  }
};

export const expectToBeObject = (value: any): asserts value is object => {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Expected object, got ${typeof value}`);
  }
};

// Performance testing
export const measurePerformance = async (
  fn: () => Promise<void>,
  label = 'Operation'
): Promise<number> => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  const duration = end - start;
  console.log(`${label} took ${duration.toFixed(2)}ms`);
  return duration;
};

// Random data helpers
export const randomEmail = (): string =>
  `test-${Math.random().toString(36).substring(7)}@test.com`;

export const randomString = (length = 10): string => {
  return Math.random().toString(36).substring(2, length + 2);
};

export const randomNumber = (min = 0, max = 100): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomBoolean = (): boolean => Math.random() < 0.5;
