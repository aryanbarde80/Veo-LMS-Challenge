import { useState } from 'react';
import { FileText, Eye, Download, Trash2, MoreVertical, BarChart3, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

interface PDF {
  id: string;
  title: string;
  description?: string;
  pageCount: number;
  wordCount: number;
  readingTimeMinutes: number;
  fileSize: number;
  createdAt: string;
}

interface PDFListProps {
  pdfs: PDF[];
  courseId: string;
  onAnalyticsClick: (pdf: PDF) => void;
  onDeleteSuccess: () => void;
}

export function PDFList({ pdfs, courseId, onAnalyticsClick, onDeleteSuccess }: PDFListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleDelete = async (pdfId: string) => {
    if (!confirm('Delete this PDF? This action cannot be undone.')) return;

    setDeletingId(pdfId);
    try {
      await api.delete(`/pdfs/${pdfId}`);
      toast.success('PDF deleted successfully');
      onDeleteSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete PDF');
    } finally {
      setDeletingId(null);
      setOpenMenuId(null);
    }
  };

  const handleDownload = (pdf: PDF) => {
    const link = document.createElement('a');
    link.href = pdf.fileSize.toString(); // This would be the actual file URL
    link.download = pdf.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  if (pdfs.length === 0) {
    return (
      <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-12 text-center">
        <FileText className="w-16 h-16 text-[#2E2E4A] mx-auto mb-4" />
        <p className="text-[#9B98B8] mb-1">No PDFs uploaded yet</p>
        <p className="text-xs text-[#9B98B8]">Upload your first course material to get started with analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pdfs.map((pdf) => (
        <div
          key={pdf.id}
          className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-4 hover:border-[#6C47FF]/50 transition-all hover:shadow-lg hover:shadow-[#6C47FF]/10"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {/* File Icon */}
              <div className="w-12 h-12 bg-[#6C47FF]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <FileText className="w-6 h-6 text-[#6C47FF]" />
              </div>

              {/* PDF Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate mb-1">{pdf.title}</h4>
                {pdf.description && (
                  <p className="text-xs text-[#9B98B8] mb-2 line-clamp-1">{pdf.description}</p>
                )}

                {/* Stats Grid */}
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#0F3460] rounded">
                    <FileText className="w-3 h-3 text-[#00D4FF]" />
                    <span className="text-[#9B98B8]">{pdf.pageCount} pages</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#0F3460] rounded">
                    <BarChart3 className="w-3 h-3 text-[#6C47FF]" />
                    <span className="text-[#9B98B8]">{pdf.wordCount?.toLocaleString()} words</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#0F3460] rounded">
                    <Eye className="w-3 h-3 text-[#00FF88]" />
                    <span className="text-[#9B98B8]">{pdf.readingTimeMinutes}m read</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-[#0F3460] rounded">
                    <Calendar className="w-3 h-3 text-[#FFB800]" />
                    <span className="text-[#9B98B8]">{new Date(pdf.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Menu */}
            <div className="relative ml-4">
              <button
                onClick={() => setOpenMenuId(openMenuId === pdf.id ? null : pdf.id)}
                className="p-2 hover:bg-[#2E2E4A] rounded-lg transition-colors text-[#9B98B8] hover:text-white"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {openMenuId === pdf.id && (
                <div className="absolute top-full right-0 mt-1 bg-[#0F3460] border border-[#2E2E4A] rounded-lg shadow-xl z-20 w-48">
                  <button
                    onClick={() => {
                      onAnalyticsClick(pdf);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#1A1A2E] flex items-center gap-2 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-[#6C47FF]" />
                    View Analytics
                  </button>
                  <button
                    onClick={() => {
                      handleDownload(pdf);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#1A1A2E] flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#00D4FF]" />
                    Download
                  </button>
                  <hr className="border-[#2E2E4A]" />
                  <button
                    onClick={() => handleDelete(pdf.id)}
                    disabled={deletingId === pdf.id}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingId === pdf.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
