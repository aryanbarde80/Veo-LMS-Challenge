import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Navigate } from 'react-router-dom';
import { Plus, ArrowLeft, BarChart3 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { PDFUploadModal } from '../../components/pdfs/PDFUploadModal';
import { PDFList } from '../../components/pdfs/PDFList';
import { PDFAnalyticsDashboard } from '../../components/pdfs/PDFAnalyticsDashboard';

export default function AdminPDFManagement() {
  const { courseId } = useParams();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPDF, setSelectedPDF] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Fetch course info
  const { data: courseData } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.get(`/courses/${courseId}`).then((r) => r.data),
    enabled: !!courseId,
  });

  // Fetch PDFs for course
  const { data: pdfData, isLoading: pdfLoading } = useQuery({
    queryKey: ['pdfs', courseId],
    queryFn: () => api.get(`/pdfs/course/${courseId}`).then((r) => r.data),
    enabled: !!courseId,
  });

  // Fetch analytics for selected PDF
  const { data: analyticsData } = useQuery({
    queryKey: ['pdf', 'analytics', selectedPDF?.id],
    queryFn: () => api.get(`/pdfs/${selectedPDF.id}/analytics`).then((r) => r.data),
    enabled: !!selectedPDF?.id && showAnalytics,
  });

  const pdfs = pdfData?.pdfs || [];
  const course = courseData?.course;

  const handleAnalyticsClick = (pdf: any) => {
    setSelectedPDF(pdf);
    setShowAnalytics(true);
  };

  const handleRefreshPDFs = () => {
    qc.invalidateQueries({ queryKey: ['pdfs', courseId] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#1A1A2E] to-[#16213E] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-[#9B98B8] hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Course</span>
        </button>

        {showAnalytics && selectedPDF ? (
          // Analytics View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => { setShowAnalytics(false); setSelectedPDF(null); }}
                    className="p-2 hover:bg-[#2E2E4A] rounded-lg transition-colors text-[#9B98B8] hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-3xl font-bold text-white">{selectedPDF.title}</h1>
                </div>
                <p className="text-[#9B98B8]">Comprehensive analytics and insights</p>
              </div>
            </div>

            {analyticsData && (
              <PDFAnalyticsDashboard
                pdf={analyticsData.pdf}
                analytics={analyticsData.analytics}
              />
            )}
          </div>
        ) : (
          // PDF List View
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">PDF Management</h1>
                <p className="text-[#9B98B8]">
                  {course ? `Course: ${course.title}` : 'Manage course materials'}
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#6C47FF] to-[#00D4FF] hover:shadow-lg hover:shadow-[#6C47FF]/50 text-white rounded-xl font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                Upload PDF
              </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-5">
                <p className="text-xs text-[#9B98B8] mb-2">Total PDFs</p>
                <p className="text-3xl font-bold text-white">{pdfs.length}</p>
              </div>
              <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-5">
                <p className="text-xs text-[#9B98B8] mb-2">Total Pages</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-[#6C47FF] to-[#00D4FF] bg-clip-text text-transparent">
                  {pdfs.reduce((sum, p) => sum + (p.pageCount || 0), 0)}
                </p>
              </div>
              <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-5">
                <p className="text-xs text-[#9B98B8] mb-2">Total Words</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-[#00D4FF] to-[#00FF88] bg-clip-text text-transparent">
                  {Math.round(pdfs.reduce((sum, p) => sum + (p.wordCount || 0), 0) / 1000)}K
                </p>
              </div>
            </div>

            {/* PDF List */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#6C47FF]" />
                Your Documents
              </h2>
              {pdfLoading ? (
                <div className="text-center py-12">
                  <p className="text-[#9B98B8]">Loading PDFs...</p>
                </div>
              ) : (
                <PDFList
                  pdfs={pdfs}
                  courseId={courseId || ''}
                  onAnalyticsClick={handleAnalyticsClick}
                  onDeleteSuccess={handleRefreshPDFs}
                />
              )}
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <PDFUploadModal
            courseId={courseId || ''}
            onClose={() => setShowUploadModal(false)}
            onSuccess={handleRefreshPDFs}
          />
        )}
      </div>
    </div>
  );
}
