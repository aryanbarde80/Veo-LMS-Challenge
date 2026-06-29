import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Edit, Trash2, Video, Lock, Unlock, Loader2, X, Save } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Section, Lesson } from '../../types';
import { formatDuration, getErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminCourseContent() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  const qc = useQueryClient();
  const [addingSection, setAddingSection] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [addingLessonFor, setAddingLessonFor] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', videoId: '', duration: '0', isPreview: false, description: '' });

  const { data } = useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: () => {
      // We need to find the course slug from id - use the admin all endpoint
      return api.get('/courses/admin/all').then(async (r) => {
        const course = r.data.courses.find((c: any) => c.id === courseId);
        if (!course) throw new Error('Course not found');
        const detail = await api.get(`/courses/${course.slug}`);
        return detail.data;
      });
    },
  });

  const course = data?.course;
  const sections: Section[] = data?.sections || [];

  const addSection = useMutation({
    mutationFn: () => api.post('/sections', {
      courseId,
      title: sectionTitle,
      order: sections.length + 1
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', courseId] });
      setSectionTitle('');
      setAddingSection(false);
      toast.success('Section added!');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteSection = useMutation({
    mutationFn: (id: string) => api.delete(`/sections/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-course', courseId] }); toast.success('Section deleted'); },
  });

  const addLesson = useMutation({
    mutationFn: (sectionId: string) => api.post('/sections/lessons', {
      sectionId,
      courseId,
      title: lessonForm.title,
      videoId: lessonForm.videoId || undefined,
      duration: parseInt(lessonForm.duration) || 0,
      isPreview: lessonForm.isPreview,
      description: lessonForm.description || undefined,
      order: sections.find(s => s.id === sectionId)?.lessons.length + 1 || 1,
      type: 'video',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-course', courseId] });
      setAddingLessonFor(null);
      setLessonForm({ title: '', videoId: '', duration: '0', isPreview: false, description: '' });
      toast.success('Lesson added!');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteLesson = useMutation({
    mutationFn: (id: string) => api.delete(`/sections/lessons/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-course', courseId] }); toast.success('Lesson deleted'); },
  });

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin" className="flex items-center gap-1 text-[#9B98B8] hover:text-white text-sm">
            <ChevronLeft className="w-4 h-4" /> Admin
          </Link>
          <span className="text-[#2E2E4A]">/</span>
          <span className="text-white text-sm font-medium">{course?.title || 'Course Content'}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Manage Content</h1>
          <button
            onClick={() => setAddingSection(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#6C47FF] hover:bg-[#5234DB] text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Section
          </button>
        </div>

        {/* Add Section Form */}
        {addingSection && (
          <div className="bg-[#1A1A2E] border border-[#6C47FF]/40 rounded-xl p-4 mb-4">
            <div className="flex gap-3">
              <input
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="Section title..."
                onKeyDown={(e) => e.key === 'Enter' && sectionTitle && addSection.mutate()}
                className="flex-1 px-4 py-2 bg-[#0F0F1A] border border-[#2E2E4A] rounded-xl text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
                autoFocus
              />
              <button
                onClick={() => sectionTitle && addSection.mutate()}
                disabled={!sectionTitle || addSection.isPending}
                className="px-4 py-2 bg-[#6C47FF] text-white rounded-xl text-sm disabled:opacity-50"
              >
                {addSection.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>
              <button onClick={() => setAddingSection(false)} className="px-3 py-2 text-[#9B98B8] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, si) => (
            <div key={section.id} className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl overflow-hidden">
              {/* Section Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-[#242438]">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#9B98B8] font-mono">S{si + 1}</span>
                  <h3 className="font-semibold text-white">{section.title}</h3>
                  <span className="text-xs text-[#9B98B8]">{section.lessons.length} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAddingLessonFor(section.id);
                      setLessonForm({ title: '', videoId: '', duration: '0', isPreview: false, description: '' });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#6C47FF]/20 hover:bg-[#6C47FF]/30 text-[#6C47FF] rounded-lg text-xs transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Lesson
                  </button>
                  <button
                    onClick={() => confirm('Delete section and all its lessons?') && deleteSection.mutate(section.id)}
                    className="p-1.5 text-[#9B98B8] hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Lessons */}
              {section.lessons.map((lesson, li) => (
                <div key={lesson.id} className="flex items-center gap-4 px-5 py-3 border-t border-[#2E2E4A] hover:bg-[#242438]/50 transition-colors">
                  <span className="text-xs text-[#9B98B8] font-mono w-8 shrink-0">{si + 1}.{li + 1}</span>
                  <Video className="w-4 h-4 text-[#9B98B8] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{lesson.title}</p>
                    {lesson.videoId && <p className="text-xs text-[#9B98B8]">YT: {lesson.videoId}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-[#9B98B8]">{formatDuration(lesson.duration)}</span>
                    {lesson.isPreview ? (
                      <span className="flex items-center gap-1 text-xs text-[#6C47FF]">
                        <Unlock className="w-3 h-3" /> Free
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-[#9B98B8]">
                        <Lock className="w-3 h-3" /> Paid
                      </span>
                    )}
                    <button
                      onClick={() => confirm('Delete this lesson?') && deleteLesson.mutate(lesson.id)}
                      className="p-1 text-[#9B98B8] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Lesson Form */}
              {addingLessonFor === section.id && (
                <div className="border-t border-[#6C47FF]/30 bg-[#0F0F1A] p-4">
                  <p className="text-xs text-[#6C47FF] font-medium mb-3">Add Lesson to "{section.title}"</p>
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <input
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Lesson title *"
                      className="px-3 py-2 bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
                    />
                    <input
                      value={lessonForm.videoId}
                      onChange={(e) => setLessonForm((f) => ({ ...f, videoId: e.target.value }))}
                      placeholder="YouTube Video ID (e.g. dQw4w9WgXcQ)"
                      className="px-3 py-2 bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
                    />
                    <input
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Description (optional)"
                      className="px-3 py-2 bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
                    />
                    <input
                      value={lessonForm.duration}
                      onChange={(e) => setLessonForm((f) => ({ ...f, duration: e.target.value }))}
                      type="number"
                      placeholder="Duration (seconds)"
                      className="px-3 py-2 bg-[#1A1A2E] border border-[#2E2E4A] rounded-lg text-white placeholder-[#9B98B8] focus:outline-none focus:border-[#6C47FF] text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lessonForm.isPreview}
                        onChange={(e) => setLessonForm((f) => ({ ...f, isPreview: e.target.checked }))}
                        className="accent-[#6C47FF]"
                      />
                      <span className="text-sm text-[#F0EFF8]">Free Preview</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAddingLessonFor(null)}
                        className="px-3 py-1.5 text-[#9B98B8] hover:text-white text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => lessonForm.title && addLesson.mutate(section.id)}
                        disabled={!lessonForm.title || addLesson.isPending}
                        className="flex items-center gap-2 px-4 py-1.5 bg-[#6C47FF] text-white rounded-lg text-sm disabled:opacity-50"
                      >
                        {addLesson.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        Add Lesson
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {section.lessons.length === 0 && addingLessonFor !== section.id && (
                <div className="px-5 py-4 border-t border-[#2E2E4A] text-center text-sm text-[#9B98B8]">
                  No lessons yet. Click "+ Lesson" to add one.
                </div>
              )}
            </div>
          ))}

          {sections.length === 0 && (
            <div className="text-center py-16 bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl">
              <Video className="w-10 h-10 text-[#2E2E4A] mx-auto mb-3" />
              <p className="text-[#9B98B8] mb-4">No sections yet. Add your first section to get started.</p>
              <button
                onClick={() => setAddingSection(true)}
                className="px-5 py-2.5 bg-[#6C47FF] text-white rounded-xl text-sm font-medium"
              >
                Add First Section
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
