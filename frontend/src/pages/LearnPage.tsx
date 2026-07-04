import { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, CheckCircle, Play, ChevronDown, Menu, X, BookOpen, CheckCheck, Keyboard, Award } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Section, LessonProgress } from '../types';
import VideoPlayer from '../components/player/VideoPlayer';
import { cn, formatDuration } from '../lib/utils';
import toast from 'react-hot-toast';

export default function LearnPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [showShortcuts, setShowShortcuts] = useState(false);

  const { data: courseData } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get(`/courses/${slug}`).then((r) => r.data),
  });

  const course = courseData?.course;
  const sections: Section[] = courseData?.sections || [];

  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['progress', course?.id],
    queryFn: () => api.get(`/enrollments/progress/${course.id}`).then((r) => r.data),
    enabled: !!course?.id && !!course?.isEnrolled,
  });

  const progress: LessonProgress[] = progressData?.progress || [];
  const lastWatched = progressData?.lastWatched;

  // Manual mark-complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: () =>
      api.post('/enrollments/progress', {
        lessonId: activeLessonId,
        courseId: course?.id,
        watchedSeconds: 9999,
        isCompleted: true,
      }),
    onSuccess: () => {
      refetchProgress();
      toast.success('Lesson marked as complete');
    },
  });

  useEffect(() => {
    if (sections.length > 0 && !activeLessonId) {
      setOpenSections(new Set(sections.map((s) => s.id)));
      if (lastWatched) {
        setActiveLessonId(lastWatched.lessonId);
      } else {
        const first = sections[0]?.lessons[0];
        if (first) setActiveLessonId(first.id);
      }
    }
  }, [sections, lastWatched]);

  const allLessons = sections.flatMap((s) => s.lessons);
  const activeLesson = allLessons.find((l) => l.id === activeLessonId);
  const activeProgress = progress.find((p) => p.lessonId === activeLessonId);
  const completedCount = progress.filter((p) => p.isCompleted).length;
  const totalLessons = allLessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isCurrentCompleted = activeProgress?.isCompleted || false;

  const goToLesson = useCallback((id: string | undefined) => {
    if (id) setActiveLessonId(id);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const idx = allLessons.findIndex((l) => l.id === activeLessonId);
      if (e.key === 'ArrowRight' || e.key === 'n') goToLesson(allLessons[idx + 1]?.id);
      if (e.key === 'ArrowLeft' || e.key === 'p') goToLesson(allLessons[idx - 1]?.id);
      if (e.key === 'm') markCompleteMutation.mutate();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeLessonId, allLessons]);

  if (!user) return <Navigate to="/login" />;
  if (!course?.isEnrolled) return <Navigate to={`/courses/${slug}`} />;

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isCompleted = (lessonId: string) =>
    progress.find((p) => p.lessonId === lessonId)?.isCompleted || false;

  const idx = allLessons.findIndex((l) => l.id === activeLessonId);
  const prevLesson = allLessons[idx - 1];
  const nextLesson = allLessons[idx + 1];

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F1A]">
      {/* Top bar */}
      <div className="h-14 border-b border-[#2E2E4A] bg-[#1A1A2E] flex items-center px-4 gap-4 shrink-0">
        <Link to={`/courses/${slug}`} className="flex items-center gap-1 text-[#9B98B8] hover:text-white text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex-1 min-w-0">
          <span className="text-white font-medium text-sm truncate block">{course.title}</span>
        </div>
        {/* Progress */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-32 h-2 bg-[#2E2E4A] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6C47FF] rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-[#9B98B8] whitespace-nowrap">{completedCount}/{totalLessons}</span>
        </div>
        {/* Keyboard shortcuts hint */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="hidden sm:flex p-1.5 text-[#9B98B8] hover:text-white rounded-lg hover:bg-[#242438] transition-colors"
          title="Keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-[#9B98B8] hover:text-white"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Keyboard shortcuts panel */}
      {showShortcuts && (
        <div className="border-b border-[#2E2E4A] bg-[#1A1A2E] px-4 py-3 flex flex-wrap gap-4 text-xs text-[#9B98B8]">
          {[
            { keys: '← / P', label: 'Previous lesson' },
            { keys: '→ / N', label: 'Next lesson' },
            { keys: 'M', label: 'Mark complete' },
          ].map(({ keys, label }) => (
            <span key={keys} className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 bg-[#242438] border border-[#2E2E4A] rounded text-white font-mono">{keys}</kbd>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className={cn('flex-1 overflow-y-auto', sidebarOpen ? 'hidden lg:block' : 'block')}>
          <div className="max-w-4xl mx-auto px-4 py-6">
            {activeLesson ? (
              <>
                {activeLesson.type === 'video' && activeLesson.videoFile ? (
                  <VideoPlayer
                    key={activeLesson.id}
                    lessonId={activeLesson.id}
                    courseId={course.id}
                    title={activeLesson.title}
                    initialSeconds={activeProgress?.watchedSeconds || 0}
                    onProgress={() => refetchProgress()}
                  />
                ) : (
                  <div className="aspect-video bg-[#1A1A2E] rounded-xl flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-[#2E2E4A]" />
                  </div>
                )}

                {/* Lesson info + complete button */}
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold text-white mb-2">{activeLesson.title}</h1>
                    {activeLesson.description && (
                      <p className="text-[#9B98B8]">{activeLesson.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => markCompleteMutation.mutate()}
                    disabled={isCurrentCompleted || markCompleteMutation.isPending}
                    className={cn(
                      'shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                      isCurrentCompleted
                        ? 'bg-green-500/10 text-green-400 border-green-500/30 cursor-default'
                        : 'bg-[#1A1A2E] text-[#9B98B8] border-[#2E2E4A] hover:border-green-500/40 hover:text-green-400 active:scale-95'
                    )}
                  >
                    <CheckCheck className="w-4 h-4" />
                    {isCurrentCompleted ? 'Completed' : 'Mark Complete'}
                  </button>
                </div>

                {activeLesson.content && (
                  <div className="mt-4 text-[#9B98B8] whitespace-pre-line leading-relaxed">
                    {activeLesson.content}
                  </div>
                )}

                {/* Prev / Next */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2E2E4A]">
                  <button
                    onClick={() => prevLesson && goToLesson(prevLesson.id)}
                    disabled={!prevLesson}
                    className="px-4 py-2 bg-[#1A1A2E] border border-[#2E2E4A] text-white rounded-xl text-sm disabled:opacity-40 hover:bg-[#242438] hover:border-[#6C47FF]/40 transition-all"
                  >
                    ← Previous
                  </button>
                  {nextLesson ? (
                    <button
                      onClick={() => goToLesson(nextLesson.id)}
                      className="px-4 py-2 bg-[#6C47FF] hover:bg-[#5234DB] text-white rounded-xl text-sm transition-colors"
                    >
                      Next →
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm">
                      <Award className="w-4 h-4" />
                      Course Complete!
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="aspect-video bg-[#1A1A2E] rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-12 h-12 text-[#2E2E4A] mx-auto mb-3" />
                  <p className="text-[#9B98B8]">Select a lesson to start</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Curriculum Sidebar */}
        {sidebarOpen && (
          <div className="w-full lg:w-80 xl:w-96 border-l border-[#2E2E4A] bg-[#1A1A2E] overflow-y-auto shrink-0">
            <div className="p-4 border-b border-[#2E2E4A]">
              <h2 className="font-semibold text-white text-sm">Course Content</h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#2E2E4A] rounded-full overflow-hidden">
                  <div className="h-full bg-[#6C47FF] rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-xs text-[#9B98B8]">{progressPercent}%</span>
              </div>
              <p className="text-xs text-[#9B98B8] mt-1">{completedCount} of {totalLessons} lessons completed</p>
            </div>

            <div className="divide-y divide-[#2E2E4A]">
              {sections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#242438] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ChevronDown className={cn('w-3 h-3 text-[#9B98B8] shrink-0 transition-transform', openSections.has(section.id) && 'rotate-180')} />
                      <span className="text-sm font-medium text-white truncate">{section.title}</span>
                    </div>
                    <span className="text-xs text-[#9B98B8] shrink-0 ml-2">
                      {section.lessons.filter((l) => isCompleted(l.id)).length}/{section.lessons.length}
                    </span>
                  </button>

                  {openSections.has(section.id) && (
                    <div className="bg-[#0F0F1A]">
                      {section.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setActiveLessonId(lesson.id);
                            if (window.innerWidth < 1024) setSidebarOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#1A1A2E] transition-colors border-b border-[#2E2E4A] last:border-0',
                            activeLessonId === lesson.id && 'bg-[#6C47FF]/10 border-l-2 border-l-[#6C47FF]'
                          )}
                        >
                          <div className="shrink-0 mt-0.5">
                            {isCompleted(lesson.id) ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Play className={cn('w-4 h-4', activeLessonId === lesson.id ? 'text-[#6C47FF]' : 'text-[#9B98B8]')} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-xs leading-snug', activeLessonId === lesson.id ? 'text-[#6C47FF] font-medium' : 'text-[#F0EFF8]')}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-[#9B98B8] mt-0.5">{formatDuration(lesson.duration)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
