import { Users, BookOpen, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    totalPDFs: number;
    revenueThisMonth?: number;
  };
}

export function AdminStats({ stats }: AdminStatsProps) {
  const enrollmentTrend = [
    { month: 'Jan', enrollments: 40 },
    { month: 'Feb', enrollments: 65 },
    { month: 'Mar', enrollments: 80 },
    { month: 'Apr', enrollments: 95 },
    { month: 'May', enrollments: 120 },
    { month: 'Jun', enrollments: 145 },
  ];

  const courseDistribution = [
    { name: 'Technology', value: 35 },
    { name: 'Business', value: 28 },
    { name: 'Design', value: 22 },
    { name: 'Other', value: 15 },
  ];

  const colors = ['#6C47FF', '#00D4FF', '#00FF88', '#FFB800'];

  const statCards = [
    {
      icon: Users,
      label: 'Total Users',
      value: stats.totalUsers,
      change: '+12%',
      color: 'text-[#00D4FF]',
      bg: 'bg-[#00D4FF]/10',
    },
    {
      icon: BookOpen,
      label: 'Total Courses',
      value: stats.totalCourses,
      change: '+8%',
      color: 'text-[#6C47FF]',
      bg: 'bg-[#6C47FF]/10',
    },
    {
      icon: FileText,
      label: 'Total PDFs',
      value: stats.totalPDFs,
      change: '+23%',
      color: 'text-[#00FF88]',
      bg: 'bg-[#00FF88]/10',
    },
    {
      icon: TrendingUp,
      label: 'Total Enrollments',
      value: stats.totalEnrollments,
      change: '+15%',
      color: 'text-[#FFB800]',
      bg: 'bg-[#FFB800]/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, change, color, bg }) => (
          <div
            key={label}
            className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6 hover:border-[#3E3E5A] transition-colors"
          >
            <div className={`w-12 h-12 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <p className="text-sm text-[#9B98B8] mb-1">{label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
              <p className="text-xs text-[#00FF88]">{change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#6C47FF]" />
            <h3 className="text-lg font-bold text-white">Enrollment Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enrollmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E2E4A" />
              <XAxis dataKey="month" stroke="#9B98B8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9B98B8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ background: '#0F3460', border: '1px solid #2E2E4A' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="enrollments"
                stroke="#6C47FF"
                strokeWidth={3}
                dot={{ fill: '#6C47FF', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Course Distribution */}
        <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#00D4FF]" />
            <h3 className="text-lg font-bold text-white">Course Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={courseDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {courseDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0F3460', border: '1px solid #2E2E4A' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
