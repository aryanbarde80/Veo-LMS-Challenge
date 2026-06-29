import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LearnPage from './pages/LearnPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourseContent from './pages/admin/AdminCourseContent';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<><Navbar /><HomePage /></>} />
          <Route path="/courses" element={<><Navbar /><CoursesPage /></>} />
          <Route path="/courses/:slug" element={<><Navbar /><CourseDetailPage /></>} />
          <Route path="/login" element={<><Navbar /><LoginPage /></>} />
          <Route path="/signup" element={<><Navbar /><SignupPage /></>} />
          <Route path="/dashboard" element={<><Navbar /><ProtectedRoute><StudentDashboard /></ProtectedRoute></>} />
          <Route path="/learn/:slug" element={<ProtectedRoute><LearnPage /></ProtectedRoute>} />
          <Route path="/admin" element={<><Navbar /><ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute></>} />
          <Route path="/admin/courses/:courseId" element={<><Navbar /><ProtectedRoute adminOnly><AdminCourseContent /></ProtectedRoute></>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1A1A2E', color: '#F0EFF8', border: '1px solid #2E2E4A', borderRadius: '12px' },
            success: { iconTheme: { primary: '#6C47FF', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
