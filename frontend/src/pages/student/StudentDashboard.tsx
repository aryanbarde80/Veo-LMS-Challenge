import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { BookOpen, Clock, TrendingUp, Play, ChevronRight, Award } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Enrollment, RecentActivity } from '../../types';
import { formatDate, formatMinutes } from '../../lib/utils';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;

  const { data: enrollData } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => api.get('/enrollments/my').then((r) => r.data),
  });

  const { data: recentData } = useQuery({
    queryKey: ['recent'],
    queryFn: () => api.get('/enrollments/recent').then((r) => r.data),
  });

  const enrollments: Enrollment[] = enrollData?.enrollments || [];
  const recentActivity: RecentActivity[] = recentData?.recent || [];

  const completedCourses = enrollments.filter((e) => e.progress === 100).length;
  const inProgressCourses = enrollments.filter((e) => e.progress > 0 && e.progress < 100).length;
  const totalMinutes = enrollments.reduce((acc, e) => acc + e.totalDuration, 0);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-[#9B98B8]">Keep up the great work on your learning journey.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Enrolled', value: enrollments.length, icon: BookOpen, color: 'text-[#6C47FF]', bg: 'bg-[#6C47FF]/10' },
            { label: 'In Progress', value: inProgressCourses, icon: TrendingUp, color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/10' },
            { label: 'Completed', value: completedCourses, icon: Award, color: 'text-green-400', bg: 'bg-green-400/10' },
            { label: 'Total Hours', value: `${Math.round(totalMinutes / 60)}h`, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">My Courses</h2>
              <Link to="/courses" className="text-sm text-[#6C47FF] hover:text-[#8B6FFF] flex items-center gap-1">
                Browse more <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-10 text-center">
                <BookOpen className="w-10 h-10 text-[#2E2E4A] mx-auto mb-3" />
                <p className="text-[#9B98B8] mb-4">You haven't enrolled in any courses yet.</p>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6C47FF] hover:bg-[#5234DB] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    to={`/learn/${enrollment.courseSlug}`}
                    className="block bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-4 hover:border-[#6C47FF]/40 transition-all group"
                  >
                    <div className="flex gap-4">
                      <img
                        src={enrollment.courseThumbnail}
                        alt={enrollment.courseTitle}
                        className="w-20 h-14 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm truncate group-hover:text-[#6C47FF] transition-colors">
                          {enrollment.courseTitle}
                        </h3>
                        <p className="text-xs text-[#9B98B8] mb-2">by {enrollment.instructorName}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-[#2E2E4A] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#6C47FF] rounded-full transition-all"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#9B98B8] shrink-0">
                            {enrollment.completedLessons}/{enrollment.totalLessons}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 self-center">
                        <div className="w-8 h-8 rounded-full bg-[#6C47FF]/10 flex items-center justify-center group-hover:bg-[#6C47FF] transition-colors">
                          <Play className="w-3.5 h-3.5 text-[#6C47FF] group-hover:text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6 text-center">
                <Clock className="w-8 h-8 text-[#2E2E4A] mx-auto mb-2" />
                <p className="text-sm text-[#9B98B8]">No activity yet. Start a course!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 6).map((item) => (
                  <Link
                    key={`${item.lessonId}-${item.lastWatchedAt}`}
                    to={`/learn/${item.courseSlug}`}
                    className="block bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-3 hover:border-[#6C47FF]/40 transition-all"
                  >
                    <div className="flex gap-3 items-start">
                      <img
                        src={item.courseThumbnail}
                        alt={item.courseTitle}
                        className="w-12 h-9 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{item.lessonTitle}</p>
                        <p className="text-xs text-[#9B98B8] truncate">{item.courseTitle}</p>
                        <p className="text-xs text-[#9B98B8] mt-1">{formatDate(item.lastWatchedAt)}</p>
                      </div>
                      {item.isCompleted && (
                        <Award className="w-4 h-4 text-green-400 shrink-0" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
