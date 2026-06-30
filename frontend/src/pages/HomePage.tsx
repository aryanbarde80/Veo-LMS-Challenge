import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Zap, Play, Star, TrendingUp, Code, Layout, Server, GitBranch, Layers, Terminal } from 'lucide-react';
import { api } from '../lib/api';
import { Course } from '../types';
import CourseCard from '../components/course/CourseCard';

const CATEGORIES = [
  { label: 'HTML & CSS', icon: Layout, color: 'text-orange-400 bg-orange-400/10' },
  { label: 'JavaScript', icon: Code, color: 'text-yellow-400 bg-yellow-400/10' },
  { label: 'React', icon: Layers, color: 'text-blue-400 bg-blue-400/10' },
  { label: 'Node.js', icon: Server, color: 'text-green-400 bg-green-400/10' },
  { label: 'Git & GitHub', icon: GitBranch, color: 'text-purple-400 bg-purple-400/10' },
  { label: 'Terminal', icon: Terminal, color: 'text-[#9B98B8] bg-[#9B98B8]/10' },
];

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Frontend Developer at Razorpay', text: 'The project-based approach is unmatched. I built real apps from day one and landed my first dev job within 3 months.', rating: 5 },
  { name: 'Rohan M.', role: 'Full Stack Engineer', text: 'Best investment I ever made. The curriculum is modern, relevant, and the video quality is top notch.', rating: 5 },
  { name: 'Ananya K.', role: 'React Developer at Startup', text: 'Progress tracking kept me motivated. I could see exactly how far I had come and what was left.', rating: 5 },
];

export default function HomePage() {
  const { data: featuredData } = useQuery({
    queryKey: ['courses', 'featured'],
    queryFn: () => api.get('/courses?featured=true&limit=6').then((r) => r.data),
  });

  const { data: allData } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: () => api.get('/courses?limit=8').then((r) => r.data),
  });

  const featured: Course[] = featuredData?.courses || [];
  const allCourses: Course[] = allData?.courses || [];

  return (
    <div className="min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#6C47FF]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-gradient-to-b from-transparent via-[#6C47FF]/5 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C47FF]/10 border border-[#6C47FF]/30 rounded-full text-sm text-[#6C47FF] font-medium mb-8">
            <Zap className="w-4 h-4" />
            Learn from industry engineers
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
            Unlock Your
            <br />
            <span className="gradient-text">Full Potential</span>
          </h1>

          <p className="text-xl text-[#9B98B8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Master web development with project-based courses taught by real engineers.
            Learn at your own pace, track progress, and land your dream job.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#6C47FF] hover:bg-[#5234DB] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#6C47FF]/25 text-lg"
            >
              Explore Courses
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A2E] hover:bg-[#242438] text-white font-semibold rounded-xl border border-[#2E2E4A] transition-colors text-lg"
            >
              <Play className="w-5 h-5" />
              Start Free Today
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-14">
            {[
              { value: '4+', label: 'Courses', icon: BookOpen },
              { value: '100+', label: 'Lessons', icon: Play },
              { value: '1,000+', label: 'Students', icon: Users },
              { value: '4.9 ★', label: 'Avg Rating', icon: Star },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-4">
                <Icon className="w-5 h-5 text-[#6C47FF] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-[#9B98B8]">{label}</div>
              </div>
            ))}
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-[#9B98B8] mr-2">Browse by topic:</span>
            {CATEGORIES.map(({ label, icon: Icon, color }) => (
              <Link
                key={label}
                to={`/courses?search=${encodeURIComponent(label)}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/5 hover:border-[#6C47FF]/40 transition-colors ${color}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Courses ─── */}
      {featured.length > 0 && (
        <section className="py-16 px-4 bg-[#1A1A2E]/40">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-[#6C47FF] uppercase tracking-widest mb-1">Hand-picked</p>
                <h2 className="text-3xl font-bold text-white">Featured Courses</h2>
              </div>
              <Link to="/courses?featured=true" className="hidden md:flex items-center gap-1 text-[#6C47FF] hover:text-[#8B6FFF] text-sm font-medium transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((course) => (
                <CourseCard key={course.id} course={course} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── All Courses ─── */}
      {allCourses.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-1">Full Library</p>
                <h2 className="text-3xl font-bold text-white">All Courses</h2>
              </div>
              <Link to="/courses" className="hidden md:flex items-center gap-1 text-[#6C47FF] hover:text-[#8B6FFF] text-sm font-medium transition-colors">
                Browse all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Why VeoLMS ─── */}
      <section className="py-16 px-4 bg-[#1A1A2E]/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-[#22C55E] uppercase tracking-widest mb-2">Why students choose us</p>
            <h2 className="text-3xl font-bold text-white mb-3">Built Different</h2>
            <p className="text-[#9B98B8] max-w-xl mx-auto">Built by developers, for developers. We focus on what actually matters.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6 text-[#6C47FF]" />,
                bg: 'bg-[#6C47FF]/10',
                title: 'Learn by Building',
                description: 'Every course is project-based. You write code from day one, not just watch videos.',
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-[#FF6B35]" />,
                bg: 'bg-[#FF6B35]/10',
                title: 'Track Your Progress',
                description: 'See exactly how much you have learned and resume right where you left off.',
              },
              {
                icon: <Award className="w-6 h-6 text-[#22C55E]" />,
                bg: 'bg-[#22C55E]/10',
                title: 'Industry Relevant',
                description: 'Curriculum designed with real company requirements and modern best practices.',
              },
            ].map(({ icon, bg, title, description }) => (
              <div key={title} className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6 hover:border-[#6C47FF]/30 transition-colors">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  {icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-[#9B98B8] leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">Social Proof</p>
            <h2 className="text-3xl font-bold text-white mb-3">What Students Say</h2>
            <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400" />
              ))}
              <span className="text-[#9B98B8] ml-2">4.9 / 5 across 1,000+ students</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-[#C5C3D8] leading-relaxed flex-1">"{t.text}"</p>
                <div className="pt-3 border-t border-[#2E2E4A]">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-[#9B98B8]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#6C47FF]/20 via-[#1A1A2E] to-[#FF6B35]/10 border border-[#6C47FF]/30 rounded-2xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #6C47FF20 0%, transparent 50%), radial-gradient(circle at 80% 20%, #FF6B3510 0%, transparent 50%)" }} />
            <div className="relative">
              <p className="text-xs font-semibold text-[#6C47FF] uppercase tracking-widest mb-3">Get started today</p>
              <h2 className="text-4xl font-bold text-white mb-4">Ready to start your journey?</h2>
              <p className="text-[#9B98B8] text-lg mb-8 max-w-xl mx-auto">
                Join thousands of students already building real projects and landing developer jobs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[#6C47FF] hover:bg-[#5234DB] text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-[#6C47FF]/30 text-lg"
                >
                  Start Learning Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-[#2E2E4A] hover:border-[#6C47FF]/40 text-white font-semibold rounded-xl transition-colors text-lg"
                >
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#2E2E4A] py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#6C47FF] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Veo<span className="text-[#6C47FF]">LMS</span></span>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-[#9B98B8]">
              <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
              <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
          </div>
          <div className="border-t border-[#2E2E4A] pt-6 text-center">
            <p className="text-xs text-[#9B98B8]">© 2025 VeoLMS. Built with passion for learning.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
