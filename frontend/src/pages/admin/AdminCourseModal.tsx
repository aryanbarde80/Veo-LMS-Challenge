import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { getErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Props {
  course?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminCourseModal({ course, onClose, onSuccess }: Props) {
  const isEdit = !!course;
  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    description: '',
    thumbnail: '',
    trailerVideoId: '',
    price: '0',
    difficulty: 'beginner',
    language: 'English',
    tags: '',
    isPublished: false,
    isFeatured: false,
    totalDuration: '0',
  });

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || '',
        shortDescription: course.shortDescription || '',
        description: course.description || '',
        thumbnail: course.thumbnail || '',
        trailerVideoId: course.trailerVideoId || '',
        price: course.price || '0',
        difficulty: course.difficulty || 'beginner',
        language: course.language || 'English',
        tags: (course.tags || []).join(', '),
        isPublished: course.isPublished || false,
        isFeatured: course.isFeatured || false,
        totalDuration: course.totalDuration?.toString() || '0',
      });
    }
  }, [course]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? api.put(`/courses/${course.id}`, data) : api.post('/courses', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Course updated!' : 'Course created!');
      onSuccess();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      price: parseFloat(form.price),
      totalDuration: parseInt(form.totalDuration),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1A1A2E] border border-[#2E2E4A] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1A1A2E] border-b border-[#2E2E4A] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Course' : 'Create New Course'}</h2>
          <button onClick={onClose} className="p-1.5 text-[#9B98B8] hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Course Title *</label>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                required
                minLength={5}
                placeholder="Complete React Course 2024"
                className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Short Description *</label>
              <input
                value={form.shortDescription}
                onChange={(e) => set('shortDescription', e.target.value)}
                required
                maxLength={300}
                placeholder="One-line description shown in course cards"
                className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Full Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                required
                rows={5}
                placeholder="Detailed description of what students will learn..."
                className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Thumbnail URL *</label>
              <input
                value={form.thumbnail}
                onChange={(e) => set('thumbnail', e.target.value)}
                required
                type="url"
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Trailer YouTube ID</label>
              <input
                value={form.trailerVideoId}
                onChange={(e) => set('trailerVideoId', e.target.value)}
                placeholder="dQw4w9WgXcQ"
                className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Price (₹)</label>
              <input
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                type="number"
                min="0"
                step="1"
                className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white focus:outline-none focus:border-[#6C47FF] text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Total Duration (minutes)</label>
              <input
                value={form.totalDuration}
                onChange={(e) => set('totalDuration', e.target.value)}
                type="number"
                min="0"
                className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#F0EFF8] mb-1.5">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="react, javascript, frontend"
                className="w-full px-4 py-2.5 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
              />
            </div>

            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => set('isPublished', e.target.checked)}
                  className="w-4 h-4 accent-[#6C47FF]"
                />
                <span className="text-sm text-[#F0EFF8]">Published</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => set('isFeatured', e.target.checked)}
                  className="w-4 h-4 accent-[#6C47FF]"
                />
                <span className="text-sm text-[#F0EFF8]">Featured</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#242438] hover:bg-[#2E2E4A] text-white rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-[#6C47FF] hover:bg-[#5234DB] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : (isEdit ? 'Update Course' : 'Create Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
