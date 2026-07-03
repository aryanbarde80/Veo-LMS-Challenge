import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

interface PDFUploadModalProps {
  courseId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PDFUploadModal({ courseId, onClose, onSuccess }: PDFUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, file });
    } else {
      toast.error('Please drop a PDF file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, file });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.title) {
      toast.error('Please select a file and enter a title');
      return;
    }

    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('courseId', courseId);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description || '');

      const response = await api.post('/pdfs/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('PDF uploaded successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to upload PDF');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border border-[#0F3460] rounded-2xl max-w-lg w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#6C47FF] to-[#00D4FF] bg-clip-text text-transparent">
              Upload PDF Document
            </h2>
            <p className="text-sm text-[#9B98B8] mt-1">Add a course material PDF with automatic analytics</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2E2E4A] rounded-lg transition-colors text-[#9B98B8] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-5">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Document Title
            </label>
            <input
              type="text"
              placeholder="e.g., Chapter 1 - Introduction"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0F3460] border border-[#2E2E4A] rounded-lg text-white placeholder-[#9B98B8] focus:border-[#6C47FF] focus:outline-none transition-colors"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description (Optional)
            </label>
            <textarea
              placeholder="Add a brief description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-[#0F3460] border border-[#2E2E4A] rounded-lg text-white placeholder-[#9B98B8] focus:border-[#6C47FF] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* File Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-[#6C47FF] bg-[#6C47FF]/10'
                : 'border-[#2E2E4A] hover:border-[#6C47FF]/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />

            <div className="flex flex-col items-center gap-3">
              {formData.file ? (
                <>
                  <FileText className="w-12 h-12 text-[#6C47FF]" />
                  <div>
                    <p className="font-medium text-white">{formData.file.name}</p>
                    <p className="text-xs text-[#9B98B8]">
                      {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-[#6C47FF]" />
                  <div>
                    <p className="font-medium text-white">Drag and drop your PDF here</p>
                    <p className="text-xs text-[#9B98B8]">or click to browse</p>
                  </div>
                  <p className="text-xs text-[#9B98B8]">Max file size: 100MB</p>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-[#6C47FF] hover:bg-[#5234DB] text-white rounded-lg text-sm font-medium transition-colors"
            >
              Choose File
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#0F3460] border border-[#2E2E4A] text-white rounded-lg font-medium hover:bg-[#1A1A2E] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !formData.file || !formData.title}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#6C47FF] to-[#00D4FF] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#6C47FF]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
