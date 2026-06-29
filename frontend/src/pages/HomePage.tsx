import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Zap, Play, Star, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import { Course } from '../types';
import CourseCard from '../components/course/CourseCard';

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
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6C47FF]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C47FF]/10 border border-[#6C47FF]/30 rounded-full text-sm text-[#6C47FF] font-medium mb-8">
            <Zap className="w-4 h-4" />
            Learn from industry experts
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Unlock Your
            <br />
            <span className="gradient-text">Full Potential</span>
          </h1>

          <p className="text-xl text-[#9B98B8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Master web development with project-based courses taught by real engineers. 
            Learn at your own pace, get certified, land your dream job.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#6C47FF] hover:bg-[#5234DB] text-white font-semibold rounded-xl transition-colors text-lg"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: '4+', label: 'Courses', icon: BookOpen },
              { value: '100+', label: 'Lessons', icon: Play },
              { value: '1000+', label: 'Students', icon: Users },
              { value: '4.9', label: 'Avg Rating', icon: Star },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-4">
                <Icon className="w-5 h-5 text-[#6C47FF] mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-[#9B98B8]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featured.length > 0 && (
        <section className="py-16 px-4 bg-[#1A1A2E]/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">Featured Courses</h2>
                <p className="text-[#9B98B8]">Hand-picked by our team for maximum impact</p>
              </div>
              <Link to="/courses?featured=true" className="hidden md:flex items-center gap-1 text-[#6C47FF] hover:text-[#8B6FFF] text-sm font-medium">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Courses */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">All Courses</h2>
              <p className="text-[#9B98B8]">Expand your skills with our complete library</p>
            </div>
            <Link to="/courses" className="hidden md:flex items-center gap-1 text-[#6C47FF] hover:text-[#8B6FFF] text-sm font-medium">
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

      {/* Why VeoLMS */}
      <section className="py-16 px-4 bg-[#1A1A2E]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Why Choose VeoLMS?</h2>
            <p className="text-[#9B98B8] max-w-2xl mx-auto">Built by developers, for developers. We focus on what actually matters.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6 text-[#6C47FF]" />,
                title: 'Learn by Building',
                description: 'Every course is project-based. You write code from day one, not just watch videos.',
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-[#FF6B35]" />,
                title: 'Track Your Progress',
                description: 'See exactly how much you have learned and resume right where you left off.',
              },
              {
                icon: <Award className="w-6 h-6 text-[#22C55E]" />,
                title: 'Industry Relevant',
                description: 'Curriculum designed with real company requirements and modern best practices.',
              },
            ].map(({ icon, title, description }) => (
              <div key={title} className="bg-[#1A1A2E] border border-[#2E2E4A] rounded-xl p-6">
                <div className="w-12 h-12 bg-[#242438] rounded-xl flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-[#9B98B8]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-[#6C47FF]/20 to-[#FF6B35]/10 border border-[#6C47FF]/30 rounded-2xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2QzQ3RkYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnpNMzAgMjh2NmgxOHYtNkgzMHpNMjQgMjJ2NmgzMHYtNkgyNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
            <h2 className="relative text-4xl font-bold text-white mb-4">
              Ready to start your journey?
            </h2>
            <p className="relative text-[#9B98B8] text-lg mb-8">
              Join thousands of students already learning on VeoLMS
            </p>
            <Link
              to="/signup"
              className="relative inline-flex items-center gap-2 px-8 py-4 bg-[#6C47FF] hover:bg-[#5234DB] text-white font-semibold rounded-xl transition-colors text-lg"
            >
              Start Learning Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2E2E4A] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#6C47FF] flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">VeoLMS</span>
          </div>
          <p className="text-sm text-[#9B98B8]">© 2024 VeoLMS. Built with passion for learning.</p>
          <div className="flex gap-4 text-sm text-[#9B98B8]">
            <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
