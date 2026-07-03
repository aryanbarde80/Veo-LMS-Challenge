import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { FileText, Eye, Download, Clock, TrendingUp, Zap, BookOpen, AlertCircle } from 'lucide-react';

interface PDFAnalyticsDashboardProps {
  pdf: any;
  analytics: any;
}

export function PDFAnalyticsDashboard({ pdf, analytics }: PDFAnalyticsDashboardProps) {
  if (!pdf) return null;

  // Sample data for visualization
  const engagementData = [
    { time: '0-5m', views: 45 },
    { time: '5-10m', views: 38 },
    { time: '10-15m', views: 32 },
    { time: '15-20m', views: 28 },
    { time: '20+m', views: 20 },
  ];

  const pageEngagementData = [
    { page: 'P1', engagement: 85, timeSpent: 145 },
    { page: 'P2', engagement: 72, timeSpent: 128 },
    { page: 'P3', engagement: 65, timeSpent: 110 },
    { page: 'P4', engagement: 78, timeSpent: 135 },
    { page: 'P5', engagement: 55, timeSpent: 92 },
  ];

  const completionData = [
    { range: '0-25%', users: 15 },
    { range: '25-50%', users: 28 },
    { range: '50-75%', users: 42 },
    { range: '75-100%', users: 35 },
  ];

  const performanceMetrics = [
    { metric: 'Engagement', value: 78, color: '#6C47FF' },
    { metric: 'Readability', value: 82, color: '#00D4FF' },
    { metric: 'Relevance', value: 75, color: '#00FF88' },
    { metric: 'Clarity', value: 88, color: '#FFB800' },
    { metric: 'Retention', value: 72, color: '#FF6B35' },
  ];

  const radarData = [
    { metric: 'Engagement', value: 78 },
    { metric: 'Readability', value: 82 },
    { metric: 'Relevance', value: 75 },
    { metric: 'Clarity', value: 88 },
    { metric: 'Retention', value: 72 },
  ];

  // Calculate estimated hours spent
  const totalMinutesSpent = engagementData.reduce((sum, d) => sum + d.views * 5, 0);
  const totalHoursSpent = (totalMinutesSpent / 60).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: FileText, label: 'Pages', value: pdf.pageCount || 0, color: 'text-[#6C47FF]', bg: 'bg-[#6C47FF]/10' },
          { icon: Eye, label: 'Total Views', value: analytics?.totalViews || 0, color: 'text-[#00D4FF]', bg: 'bg-[#00D4FF]/10' },
          { icon: Download, label: 'Downloads', value: analytics?.totalDownloads || 0, color: 'text-[#00FF88]', bg: 'bg-[#00FF88]/10' },
          { icon: Clock, label: 'Avg. Read Time', value: `${Math.round(analytics?.averageReadingTime || 0)}m`, color: 'text-[#FFB800]', bg: 'bg-[#FFB800]/10' },
          { icon: TrendingUp, label: 'Engagement', value: `${Math.round(analytics?.engagementScore || 0)}%`, color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-4">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xs text-[#9B98B8] mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Over Time */}
        <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#6C47FF]" />
            <h3 className="text-lg font-bold text-white">Engagement Over Time</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E2E4A" />
              <XAxis dataKey="time" stroke="#9B98B8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9B98B8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ background: '#0F3460', border: '1px solid #2E2E4A', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#6C47FF"
                strokeWidth={3}
                dot={{ fill: '#6C47FF', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Page Engagement */}
        <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#00D4FF]" />
            <h3 className="text-lg font-bold text-white">Page-wise Engagement</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pageEngagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2E2E4A" />
              <XAxis dataKey="page" stroke="#9B98B8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9B98B8" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ background: '#0F3460', border: '1px solid #2E2E4A', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="engagement" fill="#00D4FF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Distribution */}
        <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#00FF88]" />
            <h3 className="text-lg font-bold text-white">Completion Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.range}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="users"
              >
                {completionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#6C47FF', '#00D4FF', '#00FF88', '#FFB800'][index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#0F3460', border: '1px solid #2E2E4A', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Radar */}
        <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-[#FF6B35]" />
            <h3 className="text-lg font-bold text-white">Quality Metrics</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#2E2E4A" />
              <PolarAngleAxis dataKey="metric" stroke="#9B98B8" style={{ fontSize: '11px' }} />
              <PolarRadiusAxis stroke="#9B98B8" angle={90} domain={[0, 100]} />
              <Radar name="Score" dataKey="value" stroke="#6C47FF" fill="#6C47FF" fillOpacity={0.6} />
              <Tooltip
                contentStyle={{ background: '#0F3460', border: '1px solid #2E2E4A', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-[#1A1A2E] to-[#0F3460] border border-[#2E2E4A] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-[#FFB800]" />
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 p-3 bg-[#6C47FF]/10 rounded-lg border border-[#6C47FF]/30">
            <div className="w-1 bg-[#6C47FF] rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-white">Peak Engagement</p>
              <p className="text-xs text-[#9B98B8]">Most views happen in the first 5 minutes of reading</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-[#00D4FF]/10 rounded-lg border border-[#00D4FF]/30">
            <div className="w-1 bg-[#00D4FF] rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-white">Average Read Time</p>
              <p className="text-xs text-[#9B98B8]">{pdf.readingTimeMinutes} minutes for {pdf.wordCount} words</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-[#00FF88]/10 rounded-lg border border-[#00FF88]/30">
            <div className="w-1 bg-[#00FF88] rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-white">Readability Score</p>
              <p className="text-xs text-[#9B98B8]">{analytics?.readabilityIndex ? Math.round(parseFloat(analytics.readabilityIndex)) : 0} - Excellent for all levels</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-[#FFB800]/10 rounded-lg border border-[#FFB800]/30">
            <div className="w-1 bg-[#FFB800] rounded-full"></div>
            <div>
              <p className="text-sm font-medium text-white">Total Hours Spent</p>
              <p className="text-xs text-[#9B98B8]">{totalHoursSpent} estimated hours of cumulative reading time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Document Info */}
      <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Document Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[#9B98B8] mb-1">Word Count</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#6C47FF] to-[#00D4FF] bg-clip-text text-transparent">
              {pdf.wordCount?.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9B98B8] mb-1">Est. Read Time</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#00FF88] bg-clip-text text-transparent">
              {pdf.readingTimeMinutes}m
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9B98B8] mb-1">File Size</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#00FF88] to-[#FFB800] bg-clip-text text-transparent">
              {(pdf.fileSize / 1024 / 1024).toFixed(2)}MB
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9B98B8] mb-1">Upload Date</p>
            <p className="text-sm font-medium text-white">
              {new Date(pdf.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
