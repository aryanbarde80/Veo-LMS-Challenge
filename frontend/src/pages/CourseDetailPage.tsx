import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Users, BookOpen, Play, Lock, CheckCircle, ChevronDown, Star, Award } from 'lucide-react';
import { api } from '../lib/api';
import { Course, Section } from '../types';
import { formatPrice, formatMinutes, formatDuration, difficultyColor, cn, handleThumbnailError } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get(`/courses/${slug}`).then((r) => r.data),
    retry: false,
  });

  const course: Course & { isEnrolled?: boolean; enrollmentCount: number } = data?.course;
  const sections: Section[] = data?.sections || [];

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const previewLessons = sections.flatMap((s) => s.lessons.filter((l) => l.isPreview)).length;

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadRazorpay = () => {
    return new Promise<void>((resolve) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please login to enroll');
      navigate('/login', { state: { from: `/courses/${slug}` } });
      return;
    }
    setEnrolling(true);
    try {
      const { data: orderData } = await api.post('/payments/create-order', { courseId: course.id });

      if (orderData.enrolled) {
        toast.success('Enrolled successfully!');
        refetch();
        navigate(`/learn/${slug}`);
        return;
      }

      await loadRazorpay();

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'VeoLMS',
        description: orderData.courseName,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! You are enrolled!');
            refetch();
            navigate(`/learn/${slug}`);
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#6C47FF' },
        modal: { ondismiss: () => setEnrolling(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Enrollment failed');
      setEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6C47FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    const status = (error as any)?.response?.status;
    const serverMessage = (error as any)?.response?.data?.error;
    const isRealNotFound = !error || status === 404;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-[#F0EFF8] text-lg">
          {isRealNotFound ? 'Course not found' : "Couldn't load this course"}
        </p>
        <p className="text-[#9B98B8] text-sm max-w-md">
          {isRealNotFound
            ? "This course doesn't exist, or hasn't been published yet."
            : serverMessage || (error as any)?.message || 'The API request failed. Check that the API is reachable and DATABASE_URL is set correctly on the server.'}
        </p>
        {!isRealNotFound && (
          <button
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 rounded-lg bg-[#6C47FF] text-white text-sm hover:bg-[#5A38E0]"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-[#1A1A2E] border-b border-[#2E2E4A]">
        <div className="max-w-7xl mx-auto px-4 py-10 lg:py-16">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            {/* Left: Course Info */}
            <div className="lg:col-span-3">
              <div className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4', difficultyColor(course.difficulty))}>
                {course.difficulty}
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">{course.title}</h1>
              <p className="text-[#9B98B8] text-lg mb-6">{course.shortDescription}</p>

              <div className="flex flex-wrap gap-4 text-sm text-[#9B98B8] mb-6">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.enrollmentCount} students
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {totalLessons} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatMinutes(course.totalDuration)}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {course.language}
                </span>
                <span className="flex items-center gap-1 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400" />
                  ))}
                  <span className="text-[#9B98B8] ml-1">4.8 (120+ ratings)</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                {course.instructorAvatar ? (
                  <img src={course.instructorAvatar} alt={course.instructorName} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#6C47FF] flex items-center justify-center text-white font-bold">
                    {course.instructorName?.[0]}
                  </div>
                )}
                <div>
                  <div className="text-white text-sm font-medium">{course.instructorName}</div>
                  <div className="text-[#9B98B8] text-xs">{course.instructorBio?.substring(0, 60) || 'Instructor'}</div>
                </div>
              </div>
            </div>

            {/* Right: Enrollment Card */}
            <div className="lg:col-span-2">
              <div className="bg-[#242438] border border-[#2E2E4A] rounded-2xl overflow-hidden sticky top-20">
                {/* Thumbnail / Trailer */}
                <div className="relative aspect-video">
                  {trailerOpen && course.trailerVideoId ? (
                    <video
                      src={course.trailerVideoId}
                      className="w-full h-full"
                      controls
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <>
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" onError={handleThumbnailError} />
                      {course.trailerVideoId && (
                        <button
                          onClick={() => setTrailerOpen(true)}
                          className="absolute inset-0 flex items-center justify-center group"
                        >
                          <div className="w-16 h-16 bg-[#6C47FF] rounded-full flex items-center justify-center group-hover:bg-[#5234DB] transition-colors shadow-lg">
                            <Play className="w-6 h-6 text-white ml-1" />
                          </div>
                          <div className="absolute bottom-3 left-0 right-0 text-center text-white text-sm font-medium">
                            Watch Trailer
                          </div>
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="p-6">
                  <div className="text-3xl font-bold text-white mb-4">{formatPrice(course.price)}</div>

                  {course.isEnrolled ? (
                    <Link
                      to={`/learn/${slug}`}
                      className="w-full block text-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors mb-4"
                    >
                      Continue Learning →
                    </Link>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full px-6 py-3 bg-[#6C47FF] hover:bg-[#5234DB] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors mb-4 flex items-center justify-center gap-2"
                    >
                      {enrolling ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                      ) : (
                        parseFloat(course.price) === 0 ? 'Enroll for Free' : `Enroll Now - ${formatPrice(course.price)}`
                      )}
                    </button>
                  )}

                  <ul className="space-y-2 text-sm text-[#9B98B8]">
                    {[
                      `${totalLessons} lessons`,
                      `${formatMinutes(course.totalDuration)} of content`,
                      `${previewLessons} free preview lessons`,
                      'Lifetime access',
                      'Certificate of completion',
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-8">
            {/* What you'll learn */}
            {course.tags && course.tags.length > 0 && (
              <div className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">What you'll learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {course.tags.map((tag) => (
                    <div key={tag} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-[#C5C3D8]">{tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">About this course</h2>
              <div className="text-[#9B98B8] leading-relaxed whitespace-pre-line">{course.description}</div>
            </div>

            {/* Curriculum */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Course Curriculum</h2>
              <p className="text-sm text-[#9B98B8] mb-4">
                {sections.length} sections · {totalLessons} lessons
              </p>
              <div className="space-y-2">
                {sections.map((section) => (
                  <div key={section.id} className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 py-4 hover:bg-[#242438] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronDown className={cn('w-4 h-4 text-[#9B98B8] transition-transform', openSections.has(section.id) && 'rotate-180')} />
                        <span className="font-medium text-white">{section.title}</span>
                      </div>
                      <span className="text-xs text-[#9B98B8]">{section.lessons.length} lessons</span>
                    </button>

                    {openSections.has(section.id) && (
                      <div className="border-t border-[#2E2E4A]">
                        {section.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#2E2E4A] last:border-b-0">
                            <div className="shrink-0">
                              {lesson.isPreview || course.isEnrolled ? (
                                <Play className="w-4 h-4 text-[#6C47FF]" />
                              ) : (
                                <Lock className="w-4 h-4 text-[#9B98B8]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#F0EFF8] truncate">{lesson.title}</p>
                              {lesson.description && (
                                <p className="text-xs text-[#9B98B8] truncate">{lesson.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {lesson.isPreview && (
                                <span className="text-xs text-[#6C47FF] font-medium">Preview</span>
                              )}
                              <span className="text-xs text-[#9B98B8]">{formatDuration(lesson.duration)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
