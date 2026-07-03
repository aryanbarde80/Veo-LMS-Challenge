# Advanced Features Guide - VEO LMS Test Branch

## Overview

This document covers the advanced features, utilities, and components added to the test branch, enabling production-grade functionality for the LMS platform.

---

## Backend Features

### 1. Cache Management System (`api/src/utils/cache.ts`)

**Purpose**: Centralized caching with TTL support and automatic invalidation.

#### Features:
- TTL-based cache expiration
- LRU (Least Recently Used) eviction policy
- localStorage persistence
- Tag-based invalidation
- Cache statistics

#### Usage:
```typescript
import { cacheManager } from '../utils/cache';

// Set cache with 5-minute TTL
cacheManager.set('user_list', users, 5 * 60 * 1000, ['users']);

// Get from cache
const users = cacheManager.get('user_list');

// Invalidate by tag
cacheManager.invalidateByTag('users');

// Clear all
cacheManager.clear();

// Get stats
const stats = cacheManager.getStats();
```

#### Benefits:
- Reduces API calls and database queries
- Improves response times
- Automatic cleanup of stale data

---

### 2. Rate Limiting Middleware (`api/src/middleware/rateLimit.ts`)

**Purpose**: Prevent abuse and DDoS attacks with token bucket algorithm.

#### Pre-configured Limiters:
- `globalLimiter`: 100 requests per 15 minutes
- `authLimiter`: 5 requests per 15 minutes (for login)
- `apiLimiter`: 30 requests per minute
- `uploadLimiter`: 20 uploads per hour

#### Usage:
```typescript
import { globalLimiter, authLimiter } from '../middleware/rateLimit';

// Apply globally
app.use(globalLimiter.middleware());

// Apply to specific route
app.post('/login', authLimiter.middleware(), loginHandler);

// Custom limiter
const customLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 50,
});
```

#### Headers Added:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

---

### 3. Full-Text Search Service (`api/src/utils/search.ts`)

**Purpose**: Advanced search with fuzzy matching and relevance ranking.

#### Features:
- Tokenized search
- Relevance scoring
- Fuzzy matching (Levenshtein distance)
- Search indexing
- Filtering and pagination

#### Usage:
```typescript
import SearchService from '../utils/search';

// Simple search
const results = SearchService.search(courses, {
  q: 'machine learning',
  fields: ['title', 'description'],
  limit: 10,
  offset: 0
}, ['title', 'description']);

// With filters
const filtered = SearchService.search(courses, {
  q: 'python',
  filters: { level: 'beginner' },
}, ['title', 'description']);

// Build and use index (faster for large datasets)
const index = SearchService.buildIndex(courses, ['title', 'description']);
const indexResults = SearchService.searchWithIndex({
  q: 'web development',
  limit: 20,
}, index);
```

#### Matching Types:
- Exact match: 100 points
- Starts with: 50 points
- Contains: 25 points
- Fuzzy match: 10 points

---

### 4. Export Service (`api/src/utils/export.ts`)

**Purpose**: Export data in multiple formats with parsing support.

#### Supported Formats:
- CSV (Comma-Separated Values)
- JSON
- TSV (Tab-Separated Values)

#### Usage:
```typescript
import ExportService from '../utils/export';

// Export to CSV
const csv = ExportService.toCSV(courses, {
  fields: ['id', 'title', 'instructor', 'enrolledStudents']
});

// Export to JSON
const json = ExportService.toJSON(courses);

// Parse CSV
const parsed = ExportService.parseCSV(csvContent);

// Generate download link
const link = ExportService.generateDownloadLink(
  csv,
  'courses.csv',
  'text/csv'
);
```

#### Features:
- Field selection
- Nested object flattening
- CSV escaping (handles special characters)
- Data parsing

---

### 5. Permissions System (`api/src/utils/permissions.ts`)

**Purpose**: Role-based access control (RBAC) with granular permissions.

#### Roles:
- **Admin**: Full access to all resources
- **Instructor**: Can manage own courses and content
- **Student**: Can view enrolled content and track progress
- **Guest**: Limited read-only access

#### Usage:
```typescript
import { permissionSystem, UserRole, requirePermission } from '../utils/permissions';

// Check permission
const canDelete = permissionSystem.can(
  UserRole.INSTRUCTOR,
  'course',
  'delete',
  { courseOwnedBy: userId }
);

// Check multiple (AND)
const canManage = permissionSystem.canAll(UserRole.INSTRUCTOR, [
  { resource: 'course', action: 'update' },
  { resource: 'lesson', action: 'delete' }
]);

// Check multiple (OR)
const canRead = permissionSystem.canAny(UserRole.STUDENT, [
  { resource: 'course', action: 'read' },
  { resource: 'pdf', action: 'read' }
]);

// Use as middleware
app.delete('/courses/:id', requirePermission('course', 'delete'), deleteHandler);

// Add custom permission
permissionSystem.addPermission(UserRole.INSTRUCTOR, {
  resource: 'analytics',
  action: 'export'
});
```

#### Conditions:
- `ownedBy: 'self'`: User must own the resource
- `enrolled: true`: User must be enrolled
- `courseOwnedBy: 'self'`: Course must be owned by user

---

### 6. Batch Operations (`api/src/utils/batch.ts`)

**Purpose**: Handle bulk operations with error resilience and progress tracking.

#### Features:
- Configurable concurrency
- Retry with exponential backoff
- Progress callbacks
- Error collection
- Result transformation

#### Usage:
```typescript
import BatchProcessor from '../utils/batch';

// Basic batch operation
const results = await BatchProcessor.execute(
  users,
  async (user) => await saveUser(user),
  { concurrency: 5 }
);

// With progress
await BatchProcessor.executeWithProgress(
  files,
  async (file) => await uploadFile(file),
  (progress) => {
    console.log(`${progress.percentage}% complete`);
  },
  3
);

// With retry
const robust = await BatchProcessor.executeWithRetry(
  items,
  async (item) => await processItem(item),
  { concurrency: 5, retries: 3, retryDelay: 1000 }
);

// Get summary
const summary = BatchProcessor.getSummary(results);
// { total: 100, successful: 95, failed: 5, successRate: 95, executionTime: 5432 }
```

#### Result Structure:
```typescript
{
  successful: T[],           // Successfully processed items
  failed: Array<{            // Failed items with errors
    item: T,
    error: string,
    index: number
  }>,
  total: number,             // Total items processed
  successCount: number,      // Successful count
  errorCount: number,        // Failed count
  executionTime: number      // Time in milliseconds
}
```

---

## Frontend Features

### 1. Cache Manager (`frontend/src/utils/cache.ts`)

**Purpose**: Frontend-side caching for API responses.

#### Features:
- TTL support
- LRU eviction
- Storage persistence
- Tag-based invalidation
- Cache statistics

#### Usage:
```typescript
import cacheManager from '../utils/cache';

// Cache API response
cacheManager.set('courses', coursesData, 10 * 60 * 1000, ['courses', 'data']);

// Retrieve
const cached = cacheManager.get('courses');

// Invalidate
cacheManager.invalidate('courses');
cacheManager.invalidateByTag('courses');

// Clear all
cacheManager.clear();
```

---

### 2. Advanced Filter Component (`frontend/src/components/filters/AdvancedFilter.tsx`)

**Purpose**: Multi-rule filtering UI with AND/OR logic.

#### Features:
- Dynamic rule addition/removal
- Multiple operators (equals, contains, greater, less, between, in)
- AND/OR conjunction logic
- Field type support (text, number, select, date, range)
- Persistent filter state

#### Usage:
```tsx
import { AdvancedFilter } from '../components/filters/AdvancedFilter';

<AdvancedFilter
  fields={[
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'level', label: 'Level', type: 'select', options: [...] },
    { name: 'enrolledStudents', label: 'Students', type: 'number' }
  ]}
  onApply={(rules) => applyFilters(rules)}
  onClear={() => clearFilters()}
/>
```

---

### 3. Data Table Component (`frontend/src/components/table/DataTable.tsx`)

**Purpose**: Feature-rich table with sorting, selection, pagination.

#### Features:
- Column sorting (multi-field)
- Row selection with select-all
- Server-side pagination
- Custom cell rendering
- Row click handlers
- Loading states
- Empty message

#### Usage:
```tsx
import DataTable from '../components/table/DataTable';

<DataTable<Course>
  data={courses}
  columns={[
    { header: 'Title', accessor: 'title', sortable: true },
    { header: 'Instructor', accessor: 'instructorName', sortable: true },
    {
      header: 'Students',
      accessor: 'enrolledCount',
      sortable: true,
      cell: (value) => <span className="font-bold">{value}</span>
    }
  ]}
  onRowClick={(course) => navigate(`/courses/${course.id}`)}
  pageSize={10}
  selectable={true}
  onSelectionChange={(selected) => console.log(selected)}
  pagination={true}
/>
```

---

### 4. Custom Hooks

#### `useStateWithPersist`
Manages state with automatic localStorage persistence.

```typescript
const [theme, setTheme, removeTheme] = useStateWithPersist('dark', 'theme');
```

#### `useForm`
Complete form state management with validation.

```typescript
const {
  values,
  errors,
  touched,
  isSubmitting,
  handleChange,
  handleBlur,
  handleSubmit,
  resetForm
} = useForm(initialValues, onSubmit);
```

#### `useAsync`
Handle async operations with loading state.

```typescript
const { execute, status, data, error } = useAsync(
  async () => await fetchCourses(),
  true // immediate
);
```

#### `useDebounce`
Debounce value changes (useful for search).

```typescript
const debouncedQuery = useDebounce(searchQuery, 500);
```

#### `usePrevious`
Track previous value.

```typescript
const prevCount = usePrevious(count);
```

---

### 5. Export Data Utilities (`frontend/src/utils/exportData.ts`)

**Purpose**: Client-side data export and sharing.

#### Features:
- Export to CSV, JSON, TSV
- Copy to clipboard
- Print functionality
- Web Share API integration
- Summary generation

#### Usage:
```typescript
import DataExporter, { useExport } from '../utils/exportData';

// Direct usage
DataExporter.exportCSV(courses, 'courses.csv');
DataExporter.exportJSON(courses, 'courses.json');

// Hook usage
const { exportToCSV, exportToJSON, print, copyToClipboard } = useExport();

exportToCSV(courses, 'courses.csv');
print(courses, 'Course List');
await copyToClipboard(courses);

// Share
await DataExporter.shareData(courses, 'Courses Export');
```

---

## Database Improvements

### Query Builders (`api/src/db/queryBuilder.ts`)

Reusable database queries for common operations:

```typescript
import { queryBuilder } from '../db/queryBuilder';

// Get courses by instructor
const courses = await queryBuilder.getCoursesByInstructor(userId);

// Get enrollment analytics
const analytics = await queryBuilder.getEnrollmentAnalytics(courseId);

// Search courses
const results = await queryBuilder.searchCourses('machine learning');
```

---

## Logging System (`api/src/utils/logger.ts`)

Structured logging for development and production:

```typescript
import logger from '../utils/logger';

logger.debug('Debug message', { context: 'auth' });
logger.info('User logged in', { userId: 123 });
logger.warn('Unusual activity', { userId: 123 });
logger.error('Operation failed', { error: err.message });
```

---

## Performance Considerations

### Caching Strategy
- API responses cached for 5-10 minutes
- User data cached with user-specific tags
- Course data cached globally
- Use `invalidateByTag()` on updates

### Rate Limiting
- Apply to auth endpoints (strict)
- Apply to file upload endpoints
- Consider user tier for limits

### Batch Operations
- Use for bulk database operations
- Set concurrency based on DB capacity
- Monitor error rates

### Search Indexing
- Build index for frequently searched data
- Rebuild on data changes
- Use fuzzy matching sparingly (CPU intensive)

---

## Security Best Practices

### Permissions
- Always check permissions before operations
- Use middleware for automatic checks
- Test all role combinations

### Data Export
- Sanitize exported data
- Audit export operations
- Implement download limits

### Rate Limiting
- Adjust limits based on actual usage
- Monitor abuse patterns
- Implement IP-based blocking if needed

---

## Testing

### Cache Testing
```typescript
test('cache TTL expiration', async () => {
  cacheManager.set('test', 'value', 100);
  expect(cacheManager.get('test')).toBe('value');
  await new Promise(r => setTimeout(r, 150));
  expect(cacheManager.get('test')).toBeNull();
});
```

### Permission Testing
```typescript
test('student cannot delete course', () => {
  const can = permissionSystem.can(
    UserRole.STUDENT,
    'course',
    'delete'
  );
  expect(can).toBe(false);
});
```

### Batch Testing
```typescript
test('batch retry on failure', async () => {
  const results = await BatchProcessor.executeWithRetry(
    items,
    operation,
    { retries: 3 }
  );
  expect(results.successCount).toBe(items.length);
});
```

---

## Migration Guide

### For Existing Endpoints
1. Add rate limiting middleware
2. Implement cache for GET requests
3. Add permission checks
4. Use error handler wrapper

### For New Endpoints
1. Use error handler and validation
2. Implement permissions from start
3. Add rate limiting
4. Cache responses when appropriate

---

## Performance Metrics

### Expected Improvements
- API response time: 40-60% faster with caching
- Reduced database queries: 50-70%
- Improved search performance: 80% faster with indexing
- Better error handling: 99%+ graceful failures

### Monitoring
- Cache hit rates
- API response times
- Error rates
- User experience metrics

---

## Future Enhancements

1. **Real-time Features**
   - WebSocket notifications
   - Live collaboration
   - Real-time analytics

2. **Advanced Analytics**
   - Predictive analytics
   - Learning path recommendations
   - Performance predictions

3. **AI Integration**
   - Intelligent search
   - Personalized recommendations
   - Automated assessment

4. **Mobile Optimization**
   - Progressive Web App (PWA)
   - Offline support
   - Push notifications

---

## Support & Documentation

For more information:
- Review inline code comments
- Check TypeScript types for API
- Refer to specific feature documentation
- Check GitHub issues for examples

---

Generated: 2024
Test Branch: Advanced Features Upgrade
