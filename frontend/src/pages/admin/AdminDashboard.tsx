import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import {
  BookOpen, Users, TrendingUp, DollarSign, Plus, Edit, Trash2,
  Eye, EyeOff, ChevronRight, LayoutDashboard,
  FileText, Settings
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { AdminStats } from '../../types';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import AdminCourseModal from './AdminCourseModal';

type Tab = 'overview' | 'courses' | 'students' | 'enrollments';

export default function AdminDashboard() {
  const { user } = useAuthStore();

  const [tab, setTab] = useState<Tab>('overview');
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const qc = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  const { data: coursesData } = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: () => api.get('/courses/admin/all').then((r) => r.data),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['admin', 'students'],
    queryFn: () => api.get('/admin/students').then((r) => r.data),
    enabled: tab === 'students',
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ['admin', 'enrollments'],
    queryFn: () => api.get('/enrollments/all').then((r) => r.data),
    enabled: tab === 'enrollments',
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
      toast.success('Course deleted');
    },
    onError: () => toast.error('Failed to delete course'),
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api.put(`/courses/${id}`, { isPublished }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated');
    },
  });

  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;

  const stats: AdminStats = statsData || { totalStudents: 0, totalCourses: 0, totalEnrollments: 0, totalRevenue: 0 };
  const courses = coursesData?.courses || [];
  const students = studentsData?.students || [];
  const enrollments = enrollmentsData?.enrollments || [];

  const TABS = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'courses', label: 'Courses', icon: BookOpen },
    { key: 'students', label: 'Students', icon: Users },
    { key: 'enrollments', label: 'Enrollments', icon: FileText },
  ] as const;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
            <p className="text-[#9B98B8]">Manage your LMS platform</p>
          </div>
          <button
            onClick={() => { setEditingCourse(null); setCourseModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] hover:bg-[#5234DB] text-white rounded-xl font-medium transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New Course
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-1 mb-6 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-[#6C47FF] text-white'
                  : 'text-[#9B98B8] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-[#6C47FF]', bg: 'bg-[#6C47FF]/10' },
                { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/10' },
                { label: 'Enrollments', value: stats.totalEnrollments, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
                { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-5">
                  <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-sm text-[#9B98B8]">{label}</div>
                </div>
              ))}
            </div>

            {/* Recent courses preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Recent Courses</h2>
                <button onClick={() => setTab('courses')} className="text-sm text-[#6C47FF] hover:text-[#8B6FFF] flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl overflow-hidden">
                {courses.slice(0, 5).map((course: any, i: number) => (
                  <div key={course.id} className={`flex items-center justify-between px-5 py-4 ${i < 4 ? 'border-b border-[#2E2E4A]' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-white">{course.title}</p>
                      <p className="text-xs text-[#9B98B8]">{formatDate(course.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${course.isPublished ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {tab === 'courses' && (
          <div>
            <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2E2E4A]">
                    <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase">Course</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase hidden md:table-cell">Difficulty</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase hidden md:table-cell">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase hidden lg:table-cell">Created</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2E2E4A]">
                  {courses.map((course: any) => (
                    <tr key={course.id} className="hover:bg-[#242438] transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-white">{course.title}</p>
                        <p className="text-xs text-[#9B98B8]">₹{parseFloat(course.price).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-xs text-[#9B98B8] capitalize">{course.difficulty}</span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className={`text-xs px-2 py-1 rounded-full ${course.isPublished ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="text-xs text-[#9B98B8]">{formatDate(course.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => togglePublish.mutate({ id: course.id, isPublished: !course.isPublished })}
                            className="p-1.5 text-[#9B98B8] hover:text-white rounded-lg hover:bg-[#2E2E4A] transition-colors"
                            title={course.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => { setEditingCourse(course); setCourseModalOpen(true); }}
                            className="p-1.5 text-[#9B98B8] hover:text-[#6C47FF] rounded-lg hover:bg-[#2E2E4A] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/admin/courses/${course.id}`}
                            className="p-1.5 text-[#9B98B8] hover:text-green-400 rounded-lg hover:bg-[#2E2E4A] transition-colors"
                            title="Manage content"
                          >
                            <Settings className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm('Delete this course? This cannot be undone.')) {
                                deleteCourse.mutate(course.id);
                              }
                            }}
                            className="p-1.5 text-[#9B98B8] hover:text-red-400 rounded-lg hover:bg-[#2E2E4A] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {courses.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-10 h-10 text-[#2E2E4A] mx-auto mb-3" />
                  <p className="text-[#9B98B8]">No courses yet. Create your first course!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {tab === 'students' && (
          <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2E2E4A]">
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E4A]">
                {students.map((s: any) => (
                  <tr key={s.id} className="hover:bg-[#242438] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#6C47FF]/20 flex items-center justify-center text-[#6C47FF] text-sm font-semibold">
                          {s.name[0]}
                        </div>
                        <span className="text-sm font-medium text-white">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-[#9B98B8]">{s.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-[#9B98B8]">{formatDate(s.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-[#2E2E4A] mx-auto mb-3" />
                <p className="text-[#9B98B8]">No students yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Enrollments Tab */}
        {tab === 'enrollments' && (
          <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2E2E4A]">
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase hidden md:table-cell">Course</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-[#9B98B8] uppercase hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E2E4A]">
                {enrollments.map((e: any) => (
                  <tr key={e.id} className="hover:bg-[#242438] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{e.userName}</p>
                      <p className="text-xs text-[#9B98B8] md:hidden">{e.courseTitle}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-[#9B98B8]">{e.courseTitle}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-green-400">
                        {parseFloat(e.amountPaid) === 0 ? 'Free' : `₹${parseFloat(e.amountPaid).toLocaleString('en-IN')}`}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-sm text-[#9B98B8]">{formatDate(e.enrolledAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {enrollments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-[#2E2E4A] mx-auto mb-3" />
                <p className="text-[#9B98B8]">No enrollments yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course Modal */}
      {courseModalOpen && (
        <AdminCourseModal
          course={editingCourse}
          onClose={() => { setCourseModalOpen(false); setEditingCourse(null); }}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
            qc.invalidateQueries({ queryKey: ['courses'] });
            setCourseModalOpen(false);
            setEditingCourse(null);
          }}
        />
      )}
    </div>
  );
}
