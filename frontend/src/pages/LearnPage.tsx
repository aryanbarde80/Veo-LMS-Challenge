import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, CheckCircle, Play, Lock, ChevronDown, Menu, X, BookOpen } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Section, Lesson, LessonProgress } from '../types';
import VideoPlayer from '../components/player/VideoPlayer';
import { cn, formatDuration } from '../lib/utils';

export default function LearnPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  if (!user) return <Navigate to="/login" />;

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

  // Set initial lesson
  useEffect(() => {
    if (sections.length > 0 && !activeLessonId) {
      // Open all sections
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

  if (!course?.isEnrolled) {
    return <Navigate to={`/courses/${slug}`} />;
  }

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isCompleted = (lessonId: string) => progress.find((p) => p.lessonId === lessonId)?.isCompleted || false;

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
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-[#9B98B8] hover:text-white"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div className={cn('flex-1 overflow-y-auto', sidebarOpen ? 'hidden lg:block' : 'block')}>
          <div className="max-w-4xl mx-auto px-4 py-6">
            {activeLesson ? (
              <>
                {activeLesson.type === 'video' && activeLesson.videoId ? (
                  <VideoPlayer
                    key={activeLesson.id}
                    videoId={activeLesson.videoId}
                    lessonId={activeLesson.id}
                    courseId={course.id}
                    initialSeconds={activeProgress?.watchedSeconds || 0}
                    onProgress={() => refetchProgress()}
                  />
                ) : (
                  <div className="aspect-video bg-[#1A1A2E] rounded-xl flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-[#2E2E4A]" />
                  </div>
                )}

                <div className="mt-6">
                  <h1 className="text-2xl font-bold text-white mb-2">{activeLesson.title}</h1>
                  {activeLesson.description && (
                    <p className="text-[#9B98B8]">{activeLesson.description}</p>
                  )}
                  {activeLesson.content && (
                    <div className="mt-4 prose prose-invert max-w-none text-[#9B98B8] whitespace-pre-line">
                      {activeLesson.content}
                    </div>
                  )}
                </div>

                {/* Next/Prev navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2E2E4A]">
                  {(() => {
                    const idx = allLessons.findIndex((l) => l.id === activeLessonId);
                    const prev = allLessons[idx - 1];
                    const next = allLessons[idx + 1];
                    return (
                      <>
                        <button
                          onClick={() => prev && setActiveLessonId(prev.id)}
                          disabled={!prev}
                          className="px-4 py-2 bg-[#1A1A2E] border border-[#2E2E4A] text-white rounded-lg text-sm disabled:opacity-40 hover:bg-[#242438] transition-colors"
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={() => next && setActiveLessonId(next.id)}
                          disabled={!next}
                          className="px-4 py-2 bg-[#6C47FF] hover:bg-[#5234DB] text-white rounded-lg text-sm disabled:opacity-40 transition-colors"
                        >
                          Next →
                        </button>
                      </>
                    );
                  })()}
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
              <h2 className="font-semibold text-white text-sm">Course Curriculum</h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#2E2E4A] rounded-full overflow-hidden">
                  <div className="h-full bg-[#6C47FF] rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-xs text-[#9B98B8]">{progressPercent}%</span>
              </div>
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
                    <span className="text-xs text-[#9B98B8] shrink-0 ml-2">{section.lessons.length}</span>
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
                            <p className={cn('text-xs leading-snug truncate', activeLessonId === lesson.id ? 'text-[#6C47FF] font-medium' : 'text-[#F0EFF8]')}>
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
